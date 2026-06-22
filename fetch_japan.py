import urllib.request
import json
import sys

url = "https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson"
out_path = r"C:\Users\ito kanshin\hakuchizu-minesweeper\src\data\japan.ts"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
    
    # Extract only neighbor prefectures to Tottori to save space
    neighbors = ["兵庫県", "岡山県", "島根県", "広島県", "山口県", "京都府"]
    features = []
    for f in data.get('features', []):
        name = f.get('properties', {}).get('nam_ja', '')
        if not name:
            name = f.get('properties', {}).get('name', '')
        if not name:
            name = f.get('properties', {}).get('nam', '')
            
        if any(n in name for n in neighbors):
            features.append(f)
            
    if not features:
        features = data.get('features', [])
        
    filtered_geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write("export const japanGeoJson = " + json.dumps(filtered_geojson) + ";\n")
    print(f"Success. Kept {len(features)} features.")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
