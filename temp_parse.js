const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const matches = [...html.matchAll(/<script type=\"module\">([\s\S]*?)<\/script>/g)];
if (!matches.length) { throw new Error('no match'); }
fs.writeFileSync('temp_module.js', matches[matches.length-1][1], 'utf8');
