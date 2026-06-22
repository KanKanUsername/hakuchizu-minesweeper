import fs from 'fs';
import * as turf from '@turf/turf';
import topojsonServer from 'topojson-server';
import topojsonClient from 'topojson-client';

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

const allFeatures = [];
for (let i = 1; i <= 47; i++) {
    const code = String(i).padStart(2, '0');
    console.log(`Processing ${code}...`);
    const geojson = JSON.parse(fs.readFileSync(`./src/data/prefectures/${code}.json`, 'utf-8'));
    
    // Deform Okinawa (47) globally
    if (code === '47') {
        for (const f of geojson.features) {
            shiftCoordinates(f.geometry, 6.0, 15.0); // Shift to top-left (Sea of Japan)
        }
    }
    
    // Deform Kagoshima (46) remote islands globally
    if (code === '46') {
        for (const f of geojson.features) {
            const bbox = turf.bbox(f);
            if (bbox[3] < 30.5) { // Amami and south
                shiftCoordinates(f.geometry, 6.0, 15.0); // Shift to top-left alongside Okinawa
            }
        }
    }
    
    // Deform Tokyo (13) is already done in 13.json, but just in case, let's make sure it's good.
    // Izu and Ogasawara are already shifted.

    // Merge features using topojson
    const topology = topojsonServer.topology({ pref: geojson });
    const merged = topojsonClient.merge(topology, topology.objects.pref.geometries);
    
    // Create a new feature
    const feature = {
        type: "Feature",
        properties: {
            id: parseInt(code, 10),
            code: code,
            name: geojson.pref_name || ''
        },
        geometry: merged
    };
    
    allFeatures.push(feature);
}

const japanFc = { type: "FeatureCollection", features: allFeatures };
fs.writeFileSync('./src/data/japan.ts', `export const japanGeoJson = ${JSON.stringify(japanFc)};\n`);
console.log('Successfully generated unified japan.ts using topojson!');
