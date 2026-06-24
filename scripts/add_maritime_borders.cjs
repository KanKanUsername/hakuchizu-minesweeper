const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

const mapsToProcess = ['WORLD', 'EUROPE'];

function processMap(mapName) {
  const geoJsonPath = path.join(__dirname, `../src/data/prefectures/${mapName}.json`);
  const adjPath = path.join(__dirname, `../src/data/adjacency/${mapName}.json`);
  
  if (!fs.existsSync(geoJsonPath) || !fs.existsSync(adjPath)) {
    console.log(`Skipping ${mapName}, files not found.`);
    return;
  }

  const geoJson = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));
  const adjacency = JSON.parse(fs.readFileSync(adjPath, 'utf8'));

  const features = geoJson.features;
  const codes = features.map(f => f.properties.code);
  
  codes.forEach(c => {
    if (!adjacency[c]) adjacency[c] = [];
  });

  function getComponents() {
    const visited = new Set();
    const components = [];

    for (const code of codes) {
      if (!visited.has(code)) {
        const component = [];
        const queue = [code];
        visited.add(code);

        while (queue.length > 0) {
          const curr = queue.shift();
          component.push(curr);
          for (const neighbor of adjacency[curr]) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
        components.push(component);
      }
    }
    return components;
  }

  let components = getComponents();
  console.log(`[${mapName}] Initial components count: ${components.length}`);

  const countryPointsCache = {};
  function getCountryPoints(code) {
    if (countryPointsCache[code]) return countryPointsCache[code];
    const feature = features.find(f => f.properties.code === code);
    const points = [];
    turf.coordEach(feature, function(currentCoord) {
      points.push(turf.point(currentCoord));
    });
    // Sample max ~100 points per country for performance
    const step = Math.max(1, Math.ceil(points.length / 100));
    const sampled = points.filter((_, i) => i % step === 0);
    countryPointsCache[code] = sampled;
    return sampled;
  }

  let iteration = 0;
  while (components.length > 1) {
    console.log(`Iteration ${++iteration}: ${components.length} components remaining`);
    
    let bestDist = Infinity;
    let bestPair = null;

    const compA = components[0];
    const restOfWorld = components.slice(1).flat();

    for (const codeA of compA) {
      const ptsA = getCountryPoints(codeA);
      const bboxA = turf.bbox(features.find(f => f.properties.code === codeA));
      const centerA = [(bboxA[0]+bboxA[2])/2, (bboxA[1]+bboxA[3])/2];

      for (const codeB of restOfWorld) {
        const ptsB = getCountryPoints(codeB);
        const bboxB = turf.bbox(features.find(f => f.properties.code === codeB));
        const centerB = [(bboxB[0]+bboxB[2])/2, (bboxB[1]+bboxB[3])/2];
        
        // Skip if bounding boxes are obviously way too far compared to best known distance
        // Distances here are unprojected degrees mostly, but let's use turf.distance
        const roughDist = turf.distance(turf.point(centerA), turf.point(centerB));
        if (roughDist > bestDist + 5000) continue; 

        for (const ptA of ptsA) {
          for (const ptB of ptsB) {
            // Distance in kilometers
            const d = turf.distance(ptA, ptB);
            if (d < bestDist) {
              bestDist = d;
              bestPair = [codeA, codeB];
            }
          }
        }
      }
    }

    if (bestPair) {
      const nameA = features.find(f => f.properties.code === bestPair[0]).properties.name;
      const nameB = features.find(f => f.properties.code === bestPair[1]).properties.name;
      console.log(`Connecting ${nameA} (${bestPair[0]}) and ${nameB} (${bestPair[1]}) (distance: ${bestDist.toFixed(2)} km)`);
      
      adjacency[bestPair[0]].push(bestPair[1]);
      adjacency[bestPair[1]].push(bestPair[0]);
      adjacency[bestPair[0]] = [...new Set(adjacency[bestPair[0]])];
      adjacency[bestPair[1]] = [...new Set(adjacency[bestPair[1]])];
    } else {
      console.log("Could not find any pair to connect! Breaking.");
      break;
    }

    components = getComponents();
  }

  // Generate a clean JSON without stringified single line arrays to keep it readable if needed, or just standard JSON
  fs.writeFileSync(adjPath, JSON.stringify(adjacency, null, 2));
  console.log(`[${mapName}] Finished. Adjacency file updated.`);
}

for (const mapName of mapsToProcess) {
  processMap(mapName);
}
