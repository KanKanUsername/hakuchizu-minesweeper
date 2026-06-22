import json

file_path = r'C:\Users\ito kanshin\hakuchizu-minesweeper\src\data\prefectures\31.json'
with open(file_path, encoding='utf-8') as f:
    data = json.load(f)

print(f"Total features in 31.json: {len(data['features'])}")
for feature in data['features']:
    name = feature['properties']['name']
    coords = feature['geometry']['coordinates']
    # Just print the first coordinate of the first ring of the first polygon
    first_pt = coords[0][0][0]
    print(f"{name} first point: {first_pt}")
    break
