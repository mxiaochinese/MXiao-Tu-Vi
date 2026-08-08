const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const required = ['index.html', 'manifest.webmanifest', '.nojekyll', 'LICENSE.md', 'NOTICE.md', 'assets/app.js', 'assets/calendar.js', 'assets/engine.bundle.js', 'assets/pdf.bundle.js', 'assets/styles.css', 'assets/timezones.js', 'assets/mxiao-mark.svg', 'assets/fonts/svn-gilroy-regular.otf', 'assets/fonts/svn-gilroy-semibold.otf'];
for (const file of required) assert.ok(fs.existsSync(path.join(dist, file)), `Missing dist/${file}`);
const allFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else allFiles.push(absolute);
  }
}
walk(dist);
const relative = allFiles.map((file) => path.relative(dist, file));
for (const forbidden of ['src', 'tests', 'scripts', 'docs', 'knowledge', 'sample', 'screenshots', 'PROMPT_FOR_CODEX.md']) assert.ok(!relative.some((file) => file === forbidden || file.startsWith(`${forbidden}/`)), `Public package contains ${forbidden}`);
const visible = ['index.html', 'assets/app.js', 'assets/styles.css', 'assets/pdf.bundle.js'].map((file) => fs.readFileSync(path.join(dist, file), 'utf8')).join('\n');
for (const phrase of ['sourceRuleId', 'profileVersion', 'RULE TRACE', 'Codex', 'Gợi ý thực hành', 'engine xác định', 'phạm vi 1.0', 'địa điểm sinh', 'tọa độ', 'giờ mặt trời', 'json-button', 'copy-button']) assert.ok(!visible.includes(phrase), `Public package contains ${phrase}`);
for (const marker of ['/*', '*/', String.fromCodePoint(0x2013), String.fromCodePoint(0x2014)]) assert.ok(!visible.includes(marker), `Public package contains forbidden marker ${marker}`);
assert.match(visible, /MAX_PDF_PAGES = 48/);
assert.match(visible, /PDF_BODY_FONT_SIZE = 11/);
assert.match(visible, /CANVAS_BODY_FONT_SIZE = 23/);
assert.match(visible, /MAX_TEXT_PDF_PAGES = 48/);
assert.match(visible, /Lưu đại hạn/);
assert.match(visible, /Tiểu hạn/);
assert.match(visible, /Vận hạn/);
assert.match(visible, /Phạm vi luận giải/);
assert.match(visible, /natal_overview/);
assert.doesNotMatch(visible, /Lưu nhật/);
assert.doesNotMatch(visible, /Lưu thời/);
assert.match(visible, /So sánh hai khung giờ sinh/);
assert.match(visible, /Phương pháp lập lá số/);
assert.match(visible, /Tân Biên/);
assert.match(visible, /Áo Bí/);
assert.match(visible, /pdfuaid:part/);
assert.match(visible, /downloadSelectablePdf/);
const engineBundle = fs.readFileSync(path.join(dist, 'assets/engine.bundle.js'), 'utf8');
assert.match(engineBundle, /Tử Phủ Vũ Tướng/);
assert.match(engineBundle, /Sát Phá Tham/);
assert.match(engineBundle, /giáp cung/);
assert.match(engineBundle, /Mạng vận hạn/);
console.log(`Final public package validation passed: ${relative.length} files`);
