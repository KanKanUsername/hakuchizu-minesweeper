import fs from 'fs';
import * as d3 from 'd3';
import * as turf from '@turf/turf';

const geojson = JSON.parse(fs.readFileSync('./src/data/prefectures/31.json', 'utf-8'));
const rewoundRev = turf.rewind(geojson, { mutate: false, reverse: true });

const proj = d3.geoMercator().fitSize([800, 600], rewoundRev);
const pathGen = d3.geoPath().projection(proj);

let svg = '<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">\n';
rewoundRev.features.forEach(f => {
    svg += `  <path d="${pathGen(f)}" fill="red" stroke="black"/>\n`;
});
svg += '</svg>';

fs.writeFileSync('test.svg', svg);
console.log('SVG generated.');
