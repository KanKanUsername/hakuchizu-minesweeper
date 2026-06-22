import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';

const prefDir = './src/data/prefectures';
const outDir = './src/data/adjacency';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = fs.readdirSync(prefDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const prefCode = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(path.join(prefDir, file), 'utf-8'));
  const features = data.features;
  const adjacency = {};
  
  for (let i = 0; i < features.length; i++) {
    const codeA = features[i].properties.code;
    adjacency[codeA] = [];
    for (let j = 0; j < features.length; j++) {
      if (i === j) continue;
      const codeB = features[j].properties.code;
      
      try {
        if (turf.booleanIntersects(features[i], features[j])) {
          adjacency[codeA].push(codeB);
        }
      } catch(e) {
        console.error(`Error intersecting ${codeA} and ${codeB} in ${prefCode}:`, e.message);
      }
    }
  }
  
  fs.writeFileSync(path.join(outDir, file), JSON.stringify(adjacency, null, 2));
  console.log(`Generated adjacency for ${prefCode} (${features.length} areas)`);
}
