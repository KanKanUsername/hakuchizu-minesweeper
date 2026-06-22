import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';

const prefDir = './src/data/prefectures';
const outDirAdjacency = './src/data/adjacency';

const REGIONS = [
  { code: 'R01', name: '北海道地方', prefs: ['01'] },
  { code: 'R02', name: '東北地方', prefs: ['02', '03', '04', '05', '06', '07'] },
  { code: 'R03', name: '関東地方', prefs: ['08', '09', '10', '11', '12', '13', '14'] },
  { code: 'R04', name: '中部地方', prefs: ['15', '16', '17', '18', '19', '20', '21', '22', '23'] },
  { code: 'R05', name: '近畿地方', prefs: ['24', '25', '26', '27', '28', '29', '30'] },
  { code: 'R06', name: '中国地方', prefs: ['31', '32', '33', '34', '35'] },
  { code: 'R07', name: '四国地方', prefs: ['36', '37', '38', '39'] },
  { code: 'R08', name: '九州・沖縄地方', prefs: ['40', '41', '42', '43', '44', '45', '46', '47'] }
];

for (const region of REGIONS) {
  // Combine GeoJSON features
  const combinedFeatures = [];
  for (const prefCode of region.prefs) {
    const data = JSON.parse(fs.readFileSync(path.join(prefDir, `${prefCode}.json`), 'utf-8'));
    combinedFeatures.push(...data.features);
  }

  const combinedGeoJson = {
    type: 'FeatureCollection',
    features: combinedFeatures,
    pref_name: region.name
  };

  // Save the combined GeoJSON as a pseudo-prefecture
  fs.writeFileSync(path.join(prefDir, `${region.code}.json`), JSON.stringify(combinedGeoJson, null, 2));

  // Calculate adjacency for the region
  const adjacency = {};
  const features = combinedGeoJson.features;

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
        // Ignore turf errors on malformed specific polygons
      }
    }
  }

  fs.writeFileSync(path.join(outDirAdjacency, `${region.code}.json`), JSON.stringify(adjacency, null, 2));
  console.log(`Generated region ${region.code} (${region.name}) - ${features.length} areas`);
}
