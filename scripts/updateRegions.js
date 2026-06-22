import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regionDefs = {
  'R04': { name: '北陸・甲信越地方', prefs: ['15', '16', '17', '18', '19', '20'] },
  'R09': { name: '東海地方', prefs: ['21', '22', '23', '24'] },
  'R05': { name: '近畿地方', prefs: ['25', '26', '27', '28', '29', '30'] }
};

function generateAdjacency(geoJson) {
  const adjacency = {};
  const features = geoJson.features;
  
  features.forEach(f => {
    adjacency[f.properties.code] = [];
  });

  for (let i = 0; i < features.length; i++) {
    for (let j = i + 1; j < features.length; j++) {
      const f1 = features[i];
      const f2 = features[j];
      try {
        if (turf.booleanIntersects(f1, f2)) {
          adjacency[f1.properties.code].push(f2.properties.code);
          adjacency[f2.properties.code].push(f1.properties.code);
        }
      } catch(e) {
        console.log(`Error checking intersection between ${f1.properties.code} and ${f2.properties.code}`);
      }
    }
  }
  return adjacency;
}

for (const [rCode, def] of Object.entries(regionDefs)) {
  console.log(`Generating ${rCode}...`);
  const features = [];
  for (const pCode of def.prefs) {
    const raw = fs.readFileSync(path.join(__dirname, `../src/data/prefectures/${pCode}.json`), 'utf-8');
    const pGeoJson = JSON.parse(raw);
    features.push(...pGeoJson.features);
  }
  
  const geoJson = {
    type: 'FeatureCollection',
    pref_name: def.name,
    features
  };
  
  fs.writeFileSync(path.join(__dirname, `../src/data/prefectures/${rCode}.json`), JSON.stringify(geoJson));
  const adj = generateAdjacency(geoJson);
  fs.writeFileSync(path.join(__dirname, `../src/data/adjacency/${rCode}.json`), JSON.stringify(adj));
}

console.log('Done!');
