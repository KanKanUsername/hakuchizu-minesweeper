import os
import urllib.request
import json
import time

out_dir = r"C:\Users\ito kanshin\hakuchizu-minesweeper\src\data\prefectures"
os.makedirs(out_dir, exist_ok=True)

pref_names = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
]

for i in range(1, 48):
    code = f"{i:02d}"
    url = f"https://raw.githubusercontent.com/smartnews-smri/japan-topography/main/data/municipality/geojson/s0010/N03-21_{code}_210101.json"
    out_file = os.path.join(out_dir, f"{code}.json")
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
        
        merged = {}
        for f in data.get('features', []):
            props = f.get('properties', {})
            city_code = props.get('N03_007')
            if not city_code:
                continue
            
            # Combine N03_003 (County/Gun) and N03_004 (City/Ward/Town/Village) for a better name
            name = props.get('N03_004', '')
            if not name:
                name = props.get('N03_003', '')
                
            geom = f.get('geometry')
            if not geom:
                continue
                
            if city_code not in merged:
                merged[city_code] = {
                    "type": "Feature",
                    "properties": {"code": city_code, "name": name},
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": []
                    }
                }
                
            if geom['type'] == 'Polygon':
                merged[city_code]["geometry"]["coordinates"].append(geom['coordinates'])
            elif geom['type'] == 'MultiPolygon':
                merged[city_code]["geometry"]["coordinates"].extend(geom['coordinates'])
                
        filtered_data = {
            "type": "FeatureCollection",
            "features": list(merged.values()),
            "pref_name": pref_names[i-1]
        }
        
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(filtered_data, f, ensure_ascii=False)
            
        print(f"Downloaded {code} ({pref_names[i-1]}) - {len(merged)} cities")
    except Exception as e:
        print(f"Failed {code}: {e}")
