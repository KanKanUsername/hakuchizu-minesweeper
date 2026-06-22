import fs from 'fs';
import * as turf from '@turf/turf';

const geojsonStr = fs.readFileSync('./src/data/tottori.ts', 'utf-8');
const jsonStr = geojsonStr.replace('export const tottoriGeoJson = ', '').replace(/;\s*$/, '');
const geojson = JSON.parse(jsonStr);

const features = geojson.features;
const adjacency = {};

for (let i = 0; i < features.length; i++) {
  const codeA = features[i].properties.code;
  adjacency[codeA] = [];
  for (let j = 0; j < features.length; j++) {
    if (i === j) continue;
    const codeB = features[j].properties.code;
    
    try {
      if (turf.booleanIntersects(features[i], features[j])) {
        // Turf's booleanIntersects considers boundaries touching as true.
        // It's exactly what we need for adjacency.
        adjacency[codeA].push(codeB);
      }
    } catch(e) {
      console.error("Error intersecting", codeA, codeB, e.message);
    }
  }
}

fs.writeFileSync('./src/data/adjacency.json', JSON.stringify(adjacency, null, 2));
console.log('Adjacency list generated:', Object.keys(adjacency).length, 'areas.');
