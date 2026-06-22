import json

with open(r'C:\Users\ito kanshin\hakuchizu-minesweeper\src\data\prefectures\21.json', encoding='utf-8') as f:
    data = json.load(f)

for feature in data['features']:
    name = feature['properties']['name']
    coords = feature['geometry']['coordinates']
    for poly in coords:
        for ring in poly:
            for pt in ring:
                if not (130 < pt[0] < 145 and 30 < pt[1] < 40):
                    print(f"Weird coordinate in {name}: {pt}")
