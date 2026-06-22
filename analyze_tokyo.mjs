import fs from 'fs';
import * as turf from '@turf/turf';

const tokyo = JSON.parse(fs.readFileSync('./src/data/prefectures/13.json', 'utf-8'));

for (const feature of tokyo.features) {
    const name = feature.properties.name || feature.properties.name_ja;
    const center = turf.center(feature).geometry.coordinates;
    const code = feature.properties.code;
    if (center[1] < 35.2) {
        console.log(`${code} ${name}: [${center[0].toFixed(2)}, ${center[1].toFixed(2)}]`);
    }
}
