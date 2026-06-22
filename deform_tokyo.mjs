import fs from 'fs';

function shiftCoordinates(feature, dLon, dLat) {
    const coords = feature.geometry.coordinates;
    const shiftArr = (arr) => {
        if (typeof arr[0] === 'number') {
            arr[0] += dLon;
            arr[1] += dLat;
        } else {
            for (let i = 0; i < arr.length; i++) shiftArr(arr[i]);
        }
    };
    shiftArr(coords);
}

const tokyo = JSON.parse(fs.readFileSync('./src/data/prefectures/13.json', 'utf-8'));

for (const feature of tokyo.features) {
    const code = feature.properties.code;
    
    // Izu islands (Oshima to Aogashima)
    if (['13361', '13362', '13363', '13364', '13381', '13382', '13401', '13402'].includes(code)) {
        // Shift North and slightly East
        shiftCoordinates(feature, 0.3, 0.8);
    }
    // Ogasawara
    if (code === '13421') {
        // Shift heavily North-West to place it below Izu islands
        shiftCoordinates(feature, 139.9 - 147.4, 34.0 - 25.9);
    }
}

fs.writeFileSync('./src/data/prefectures/13.json', JSON.stringify(tokyo, null, 2));
console.log('Deformed Tokyo islands successfully.');
