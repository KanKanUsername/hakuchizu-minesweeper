import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const europeCodes = [
  "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CYP", "CZE", 
  "DNK", "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ITA", 
  "LVA", "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "MKD", 
  "NOR", "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", 
  "SWE", "CHE", "UKR", "GBR", "VAT", "XKX"
];

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
        // booleanIntersects handles overlapping or touching polygons
        if (turf.booleanIntersects(f1, f2)) {
          // If they intersect, they might just be sharing a boundary (which we want)
          // To ensure they aren't just bounding-box intersecting without touching,
          // turf.booleanIntersects does actual geometry intersection.
          adjacency[f1.properties.code].push(f2.properties.code);
          adjacency[f2.properties.code].push(f1.properties.code);
        }
      } catch(e) {
        // In case of invalid geometries, try a rough bounding box intersection first
        console.log(`Error checking intersection between ${f1.properties.code} and ${f2.properties.code}`);
      }
    }
  }
  return adjacency;
}

function processWorld() {
  const raw = fs.readFileSync(path.join(__dirname, '../src/data/world.json'), 'utf-8');
  const geoJson = JSON.parse(raw);
  
  geoJson.pref_name = "World";
  geoJson.features = geoJson.features.filter(f => f.id !== "ATA"); // remove Antarctica
  geoJson.features.forEach(f => {
    f.properties.code = f.id;
    // ensure name exists
  });

  fs.writeFileSync(path.join(__dirname, '../src/data/WORLD.json'), JSON.stringify(geoJson));
  
  console.log('Generating WORLD adjacency...');
  const adj = generateAdjacency(geoJson);
  fs.writeFileSync(path.join(__dirname, '../src/data/adjacency/WORLD.json'), JSON.stringify(adj));

  // Extract Europe
  const europeGeoJson = {
    type: "FeatureCollection",
    pref_name: "Europe",
    features: geoJson.features.filter(f => europeCodes.includes(f.properties.code))
  };
  fs.writeFileSync(path.join(__dirname, '../src/data/EUROPE.json'), JSON.stringify(europeGeoJson));
  
  console.log('Generating EUROPE adjacency...');
  const eurAdj = generateAdjacency(europeGeoJson);
  fs.writeFileSync(path.join(__dirname, '../src/data/adjacency/EUROPE.json'), JSON.stringify(eurAdj));
}

function processUsa() {
  const raw = fs.readFileSync(path.join(__dirname, '../src/data/usa.json'), 'utf-8');
  const geoJson = JSON.parse(raw);
  
  geoJson.pref_name = "USA";
  geoJson.features.forEach(f => {
    f.properties.code = f.properties.STATE;
    f.properties.name = f.properties.NAME;
  });

  fs.writeFileSync(path.join(__dirname, '../src/data/USA.json'), JSON.stringify(geoJson));
  
  console.log('Generating USA adjacency...');
  const adj = generateAdjacency(geoJson);
  fs.writeFileSync(path.join(__dirname, '../src/data/adjacency/USA.json'), JSON.stringify(adj));
}

if (!fs.existsSync(path.join(__dirname, '../src/data/adjacency'))) {
  fs.mkdirSync(path.join(__dirname, '../src/data/adjacency'), { recursive: true });
}

processWorld();
processUsa();
console.log('Done processing maps!');
