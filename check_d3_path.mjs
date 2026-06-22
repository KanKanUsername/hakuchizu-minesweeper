import fs from 'fs';
import * as d3 from 'd3';
import * as turf from '@turf/turf';

const geojson = JSON.parse(fs.readFileSync('./src/data/prefectures/31.json', 'utf-8'));

function getPathLen(gj) {
    const proj = d3.geoMercator().fitSize([800, 600], gj);
    const pathGen = d3.geoPath().projection(proj);
    let totalLen = 0;
    gj.features.forEach(f => {
        const d = pathGen(f);
        if(d) totalLen += d.length;
    });
    return totalLen;
}

console.log('Original path total len:', getPathLen(geojson));

const rewound = turf.rewind(geojson, { mutate: false, reverse: false });
console.log('Rewound (reverse: false) path len:', getPathLen(rewound));

const rewoundRev = turf.rewind(geojson, { mutate: false, reverse: true });
console.log('Rewound (reverse: true) path len:', getPathLen(rewoundRev));
