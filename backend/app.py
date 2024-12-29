from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
from bs4 import BeautifulSoup
from geopy.geocoders import Nominatim
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


# Function to scrape data for a single resort
def scrape_resort_data(resort_name):
    url = f"https://www.bergfex.com{resort_name}"
    geolocator = Nominatim(user_agent="my_geocoder")
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "Failed to fetch data"}

    soup = BeautifulSoup(response.content, 'html.parser')
    display_name = resort_name.strip("/").replace("-"," ").capitalize()
    data = {"resort_name": resort_name, "status": "success", "display_name": display_name}

    # Parse open lifts
    target_header = soup.find('h3', class_='tw-text-s', string='Open lifts')

    if target_header:
        next_element = target_header.find_next_sibling()
        lifts = [int(x) for x in next_element.get_text(strip=True).split('/')]
        data["open_lifts"], data["total_lifts"] = lifts
    else:
        data["open_lifts"], data["total_lifts"] = None, None

    # Parse snow report
    snow_header = soup.find('h3', class_='tw-text-s tw-mb-2', string='Snow depth')
    if snow_header:
        next_element = snow_header.find_next_sibling()
        children = next_element.findChildren()
        data["snow_mountain"] = children[0].get_text(strip=True)
        data["snow_valley"] = children[3].get_text(strip=True)
    else:
        data["snow_mountain"], data["snow_valley"] = None, None

    # Parse location
    contact_header = soup.find('h2', class_='tw-text-4xl tw-mb-4', string='Contact us ')
    if contact_header:
        address = contact_header.find_next_sibling().findChildren()[2].get_text(strip=True)
        location = geolocator.geocode(address)

        if location:
            data["latitude"], data["longitude"] = location.latitude, location.longitude
        else:
            data["latitude"], data["longitude"] = None, None
    else:
        data["latitude"], data["longitude"] = None, None

    return data

# Function to scrape all resorts
def scrape_all_resorts():
    pagenr = 1
    base_url = "https://www.bergfex.com/oesterreich/?page="

    # Open the JSON file in append mode
    with open('resorts_data.json', 'w+', encoding='utf-8') as f:
        f.write("[")  # Begin JSON array

        first_resort = True  # Track whether it's the first resort to handle commas

        while True:
            url = base_url + str(pagenr)
            response = requests.get(url)

            if response.status_code != 200:
                print(f"Failed to fetch page {pagenr}, stopping scrape.")
                break

            soup = BeautifulSoup(response.text, 'html.parser')
            resorts_html = soup.find_all('a', attrs={"data-tracking-event": "skiresorts-listing"})

            if not resorts_html:
                print(f"No more resorts found on page {pagenr}, stopping scrape.")
                break

            for a in resorts_html:
                href = a.get('href', '').strip()
                resort_name = a.get_text(strip=True)  # Extract resort name for status printout
                print(f"Checking resort: {resort_name}")  # Status printout for each resort

                resort_data = scrape_resort_data(href)
                
                if "error" not in resort_data:
                    # Write the resort data to the file
                    if not first_resort:
                        f.write(",\n")  # Add a comma between JSON objects

                    f.write(json.dumps(resort_data, ensure_ascii=False, indent=4))
                    f.flush()  # Ensure data is written to disk

                    # Print the current content of the file
 #                   f.seek(0)  # Move the cursor to the beginning of the file
 #                   print(f.read())  # Read and print the content of the file

                    first_resort = False

            pagenr += 1
            print(f"Finished page {pagenr}.\n")  # Status printout for page completion

        f.write("]")  # Close JSON array

    print(f"Scraping complete. Data saved to 'resorts_data.json'.")

# Function to scrape a specified number of resorts
def scrape_n_resorts(n):
    pagenr = 1
    base_url = "https://www.bergfex.com/oesterreich/?page="
    resorts_data = []
    count = 0

    while count < n:
        url = base_url + str(pagenr)
        response = requests.get(url)

        if response.status_code != 200:
            print(f"Failed to fetch page {pagenr}, stopping scrape.")
            break

        soup = BeautifulSoup(response.text, 'html.parser')
        resorts_html = soup.find_all('a', attrs={"data-tracking-event": "skiresorts-listing"})

        if not resorts_html:
            print(f"No more resorts found on page {pagenr}, stopping scrape.")
            break

        for a in resorts_html:
            if count >= n:
                break

            href = a.get('href', '').strip()
            resort_name = a.get_text(strip=True)
            print(f"Scraping resort {count + 1}: {resort_name}")

            resort_data = scrape_resort_data(href)

            if "error" not in resort_data:
                resorts_data.append(resort_data)
                count += 1

        pagenr += 1
        print(f"Finished page {pagenr}.\n")  # Status printout for page completion

    print(f"Scraping complete. {len(resorts_data)} resorts scraped.")
    return resorts_data




# Endpoint to scrape all resorts
@app.route('/api/scrape_all', methods=['GET'])
def scrape_all():
    resorts_data = scrape_all_resorts()
    return jsonify({
        "status": "success",
        "total_resorts": len(resorts_data),
        "data": resorts_data
    })

# Endpoint to scrape a specified number of resorts
@app.route('/api/scrape_n', methods=['GET'])
def scrape_n():
    n = request.args.get('n', default=10, type=int)
    resorts_data = scrape_n_resorts(n)
    return jsonify({
        "status": "success",
        "requested_resorts": n,
        "scraped_resorts": len(resorts_data),
        "data": resorts_data
    })

@app.route('/api/resorts', methods=['GET'])
def get_all_resorts():
    """
    Endpoint to retrieve all saved resorts from the JSON file.
    """
    file_path = 'resorts_data.json'
    if not os.path.exists(file_path):
        return jsonify({"error": "No resorts data found. Scrape resorts first."}), 404

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            resorts = json.load(f)
        return jsonify({"status": "success", "data": resorts})
    except Exception as e:
        return jsonify({"error": f"Failed to load resorts data: {str(e)}"}), 500

@app.route('/api/resort/<resort_name>', methods=['GET'])
def get_resort_details(resort_name):
    file_path = 'resorts_data.json'
    if not os.path.exists(file_path):
        return jsonify({"error": "No resorts data found."}), 404

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            resorts = json.load(f)
            for resort in resorts:
                if resort['display_name'].lower() == resort_name.lower():
                    return jsonify({"status": "success", "data": resort})
            return jsonify({"error": "Resort not found."}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to load resorts data: {str(e)}"}), 500




if __name__ == '__main__':
    app.run(debug=True)
