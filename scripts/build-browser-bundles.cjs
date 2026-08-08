const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const moduleNames = ['constants', 'profiles', 'time-correction', 'core', 'nayin', 'brightness', 'stars', 'fortune', 'patterns', 'interpreter', 'engine'];

function clean(source) {
  return source.replace(/^"use strict";\s*/, '').replace(/\/\/# sourceMappingURL=.*$/gm, '');
}

let output = `(function(global){\n"use strict";\nconst factories=Object.create(null);\nconst cache=Object.create(null);\nfunction define(id,factory){factories[id]=factory;}\nfunction resolve(from,request){if(!request.startsWith('.')) return request; const parts=(from.split('/').slice(0,-1).concat(request.split('/'))); const out=[]; for(const p of parts){if(!p||p==='.') continue; if(p==='..') out.pop(); else out.push(p);} return out.join('/').replace(/\\.js$/,'');}\nfunction load(id){if(cache[id]) return cache[id].exports; const factory=factories[id]; if(!factory) throw new Error('Không tìm thấy module '+id); const module={exports:{}}; cache[id]=module; factory((request)=>load(resolve(id,request)),module,module.exports); return module.exports;}\n`;
for (const name of moduleNames) {
  const id = `tuvi/${name}`;
  const source = clean(fs.readFileSync(path.join(root, 'src/engine', `${name}.js`), 'utf8'));
  output += `define(${JSON.stringify(id)},function(require,module,exports){\n${source}\n});\n`;
}
output += `const core=load('tuvi/core'); const engine=load('tuvi/engine'); const profiles=load('tuvi/profiles'); const time=load('tuvi/time-correction'); const brightness=load('tuvi/brightness'); const stars=load('tuvi/stars'); const fortune=load('tuvi/fortune'); global.MXiaoTuviEngine=Object.freeze({...core,...engine,...profiles,...time,...brightness,...stars,...fortune});\n})(typeof globalThis!=='undefined'?globalThis:window);\n`;
fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
fs.copyFileSync(path.join(root, 'src/calendar.js'), path.join(root, 'assets/calendar.js'));
fs.writeFileSync(path.join(root, 'assets/engine.bundle.js'), output);

const pdfSource = clean(fs.readFileSync(path.join(root, 'src/pdf/client-pdf.cjs'), 'utf8'));
const pdfOutput = `(function(global){\n"use strict";\nconst module={exports:{}}; const exports=module.exports;\n${pdfSource}\nglobal.MXiaoPdf=Object.freeze(module.exports);\n})(typeof globalThis!=='undefined'?globalThis:window);\n`;
fs.writeFileSync(path.join(root, 'assets/pdf.bundle.js'), pdfOutput);
console.log('Browser bundles built.');

const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
const publicFiles = ['index.html', 'manifest.webmanifest', '.nojekyll', 'LICENSE.md', 'NOTICE.md'];
for (const file of publicFiles) fs.copyFileSync(path.join(root, file), path.join(dist, file));
const publicAssets = ['app.js', 'calendar.js', 'engine.bundle.js', 'pdf.bundle.js', 'styles.css', 'timezones.js', 'mxiao-mark.svg'];
for (const file of publicAssets) fs.copyFileSync(path.join(root, 'assets', file), path.join(dist, 'assets', file));
console.log('Public dist built.');
