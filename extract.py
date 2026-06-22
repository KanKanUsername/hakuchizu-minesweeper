import sys

html_path = r"C:\Users\ito kanshin\Downloads\shiroshita-minesweeper-phase1-tottori.html"
ts_path = r"C:\Users\ito kanshin\hakuchizu-minesweeper\src\data\tottori.ts"

with open(html_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in lines:
    if "const GEOJSON =" in line:
        json_data = line.split("const GEOJSON =")[1].strip()
        if json_data.endswith(';'):
            json_data = json_data[:-1]
        
        with open(ts_path, 'w', encoding='utf-8') as out:
            out.write(f"export const tottoriGeoJson = {json_data};\n")
        print("Successfully extracted and wrote JSON data.")
        sys.exit(0)

print("Failed to find GEOJSON in HTML.")
sys.exit(1)
