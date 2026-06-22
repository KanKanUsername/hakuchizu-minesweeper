import fs from 'fs';
import * as turf from '@turf/turf';

function shiftCoordinates(geometry, dLon, dLat) {
    const coords = geometry.coordinates;
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

function unionPrefecture(prefCode) {
    console.log(`Processing ${prefCode}...`);
    const geojson = JSON.parse(fs.readFileSync(`./src/data/prefectures/${prefCode}.json`, 'utf-8'));
    
    // Deform Okinawa (47) globally
    if (prefCode === '47') {
        for (const f of geojson.features) {
            shiftCoordinates(f.geometry, 2.5, 4.0); // Shift NE towards Kyushu
        }
    }
    
    // Deform Kagoshima (46) remote islands globally
    if (prefCode === '46') {
        for (const f of geojson.features) {
            // Check if it's Amami or other remote islands (south of Lat 30)
            const bbox = turf.bbox(f);
            if (bbox[3] < 30.0) {
                shiftCoordinates(f.geometry, 0.5, 1.5);
            }
        }
    }

    let unioned = null;
    for (const feature of geojson.features) {
        if (!unioned) {
            unioned = feature;
        } else {
            try {
                unioned = turf.union(turf.featureCollection([unioned, feature]));
            } catch (e) {
                console.error(`Error unioning feature in ${prefCode}`, e.message);
            }
        }
    }
    
    if (unioned) {
        // Set prefecture properties
        unioned.properties = {
            id: parseInt(prefCode, 10),
            name: geojson.pref_name || ''
        };
        return unioned;
    }
    return null;
}

const allFeatures = [];
for (let i = 1; i <= 47; i++) {
    const code = String(i).padStart(2, '0');
    const unifiedFeature = unionPrefecture(code);
    if (unifiedFeature) {
        allFeatures.push(unifiedFeature);
    }
}

const japanFc = turf.featureCollection(allFeatures);
fs.writeFileSync('./src/data/japan.ts', `export const japanGeoJson = ${JSON.stringify(japanFc)};\n`);
console.log('Successfully generated unified japan.ts');
