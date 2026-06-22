import fs from 'fs';
import * as turf from '@turf/turf';

const kagoshima = JSON.parse(fs.readFileSync('./src/data/prefectures/46.json', 'utf-8'));

for (const feature of kagoshima.features) {
    const name = feature.properties.name || feature.properties.name_ja;
    const center = turf.center(feature).geometry.coordinates;
    const code = feature.properties.code;
    if (center[1] < 31.0) {
        console.log(`46: ${code} ${name}: [${center[0].toFixed(2)}, ${center[1].toFixed(2)}]`);
    }
}
