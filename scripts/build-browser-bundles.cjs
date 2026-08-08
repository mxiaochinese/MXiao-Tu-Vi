const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const moduleNames = ['constants', 'profiles', 'time-correction', 'core', 'nayin', 'brightness', 'stars', 'fortune', 'patterns', 'content-pipeline', 'interpreter', 'engine'];

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

const astrologyModules = ['synthesis', 'engine'];
const astrologyCorpus = JSON.parse(fs.readFileSync(path.join(root, 'src/astrology/interpretation-corpus-v1.6.json'), 'utf8'));
const astrologyRules = JSON.parse(fs.readFileSync(path.join(root, 'src/astrology/synthesis-rules-v1.6.json'), 'utf8'));
const astrologyWriterStyle = JSON.parse(fs.readFileSync(path.join(root, 'src/astrology/writer-style-v1.6.json'), 'utf8'));
let astrologyOutput = `(function(global){\n"use strict";\nconst factories=Object.create(null); const cache=Object.create(null);\nfunction define(id,factory){factories[id]=factory;}\nfunction load(id){if(cache[id]) return cache[id].exports; const factory=factories[id]; if(!factory) throw new Error('Không tìm thấy module '+id); const module={exports:{}}; cache[id]=module; factory((request)=>load(request.replace(/^\\.\\//,'astrology/').replace(/\\.js$/,'')),module,module.exports); return module.exports;}\n`;
for (const name of astrologyModules) {
  const source = clean(fs.readFileSync(path.join(root, 'src/astrology', `${name}.js`), 'utf8'));
  astrologyOutput += `define(${JSON.stringify(`astrology/${name}`)},function(require,module,exports){\n${source}\n});\n`;
}
astrologyOutput += `const corpus=${JSON.stringify(astrologyCorpus)}; const rules=${JSON.stringify(astrologyRules)}; const writerStyle=${JSON.stringify(astrologyWriterStyle)}; const engine=load('astrology/engine'); global.MXiaoAstrologyEngine=engine.createAstrologyEngine(global.Astronomy,corpus,rules,writerStyle);\n})(typeof globalThis!=='undefined'?globalThis:window);\n`;
fs.writeFileSync(path.join(root, 'assets/astrology-engine.bundle.js'), astrologyOutput);
fs.copyFileSync(path.join(root, 'node_modules/astronomy-engine/astronomy.browser.min.js'), path.join(root, 'assets/astronomy.browser.min.js'));
console.log('Browser bundles built.');

const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
const publicFiles = ['index.html', 'manifest.webmanifest', '.nojekyll', 'LICENSE.md', 'NOTICE.md'];
for (const file of publicFiles) fs.copyFileSync(path.join(root, file), path.join(dist, file));
fs.mkdirSync(path.join(dist, 'third_party'), { recursive: true });
for (const file of ['astronomy-engine-LICENSE.txt', 'iztro-LICENSE.txt', 'life-chart-engine-LICENSE.txt']) {
  fs.copyFileSync(path.join(root, 'third_party', file), path.join(dist, 'third_party', file));
}
const publicAssets = ['app.js', 'astrology-app.js', 'astrology-locations.js', 'astronomy.browser.min.js', 'astrology-engine.bundle.js', 'calendar.js', 'engine.bundle.js', 'pdf.bundle.js', 'styles.css', 'timezones.js', 'mxiao-mark.svg', 'mxiao-logo-white.png', 'fonts/svn-gilroy-regular.otf', 'fonts/svn-gilroy-semibold.otf'];
for (const file of publicAssets) {
  const target = path.join(dist, 'assets', file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, 'assets', file), target);
}
console.log('Public dist built.');
