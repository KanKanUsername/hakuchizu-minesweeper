import fs from 'fs';
import * as d3 from 'd3';
import * as turf from '@turf/turf';

const geojson = JSON.parse(fs.readFileSync('./src/data/prefectures/31.json', 'utf-8'));

const bounds1 = d3.geoBounds(geojson);
console.log('Original bounds:', bounds1);

const rewound = turf.rewind(geojson, { reverse: false });
const bounds2 = d3.geoBounds(rewound);
console.log('Rewound bounds:', bounds2);

const rewoundRev = turf.rewind(geojson, { reverse: true });
const bounds3 = d3.geoBounds(rewoundRev);
console.log('Rewound (reverse) bounds:', bounds3);
