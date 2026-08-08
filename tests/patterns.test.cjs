const assert = require('node:assert/strict');
const patterns = require('../src/engine/patterns.js');

function star(id, name, group = 'major') {
  return { id, name, group, palace: 0 };
}

function palacesWith(assignments = {}) {
  const names = ['Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ'];
  const branches = ['', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  return Array.from({ length: 12 }, (_, index) => {
    const id = index + 1;
    return { id, name: names[index], branch: branches[id], stars: assignments[id] || [] };
  });
}

const configurationCases = [
  ['tu-phu-vu-tuong', [star('tu-vi', 'Tử Vi'), star('thien-phu', 'Thiên Phủ'), star('vu-khuc', 'Vũ Khúc'), star('thien-tuong', 'Thiên Tướng')]],
  ['sat-pha-tham', [star('that-sat', 'Thất Sát'), star('pha-quan', 'Phá Quân'), star('tham-lang', 'Tham Lang')]],
  ['co-nguyet-dong-luong', [star('thien-co', 'Thiên Cơ'), star('thai-am', 'Thái Âm'), star('thien-dong', 'Thiên Đồng'), star('thien-luong', 'Thiên Lương')]],
  ['cu-nhat', [star('cu-mon', 'Cự Môn'), star('thai-duong', 'Thái Dương')]],
  ['nhat-nguyet', [star('thai-duong', 'Thái Dương'), star('thai-am', 'Thái Âm')]]
];

for (const [expectedId, stars] of configurationCases) {
  const relationBranches = [1, 5, 9, 7];
  const assignments = {};
  stars.forEach((item, index) => {
    const palaceId = relationBranches[index % relationBranches.length];
    assignments[palaceId] = [...(assignments[palaceId] || []), item];
  });
  const detected = patterns.detectCoreConfigurations(palacesWith(assignments), 1);
  assert.ok(detected.some((item) => item.id === expectedId), `Missing ${expectedId}`);
}

const incomplete = palacesWith({ 1: [star('tu-vi', 'Tử Vi')], 5: [star('thien-phu', 'Thiên Phủ')], 9: [star('vu-khuc', 'Vũ Khúc')] });
assert.ok(!patterns.detectCoreConfigurations(incomplete, 1).some((item) => item.id === 'tu-phu-vu-tuong'));

const taHuuA = palacesWith({
  12: [star('ta-phu', 'Tả Phù', 'support')],
  2: [star('huu-bat', 'Hữu Bật', 'support')]
});
assert.ok(patterns.detectAdjacentFormations(taHuuA, 1).some((item) => item.id === 'ta-huu'));

const taHuuB = palacesWith({
  12: [star('huu-bat', 'Hữu Bật', 'support')],
  2: [star('ta-phu', 'Tả Phù', 'support')]
});
assert.ok(patterns.detectAdjacentFormations(taHuuB, 1).some((item) => item.id === 'ta-huu'));

const noAdjacent = palacesWith({ 12: [star('ta-phu', 'Tả Phù', 'support')] });
assert.equal(patterns.detectAdjacentFormations(noAdjacent, 1).length, 0);

const activationPalaces = palacesWith();
const concentrated = patterns.analyzeActivationNetwork(activationPalaces, [1, 1, 5, 7, 9]);
assert.equal(concentrated.structure, 'concentrated');
assert.equal(concentrated.exact[0].palace.id, 1);
assert.ok(concentrated.relations.triad.length >= 1);
assert.ok(concentrated.relations.opposite.length >= 1);

const distributed = patterns.analyzeActivationNetwork(activationPalaces, [1, 3, 6]);
assert.equal(distributed.structure, 'distributed');

const paragraphs = [
  ...patterns.buildConfigurationParagraphs(palacesWith({
    1: [star('tu-vi', 'Tử Vi')],
    5: [star('thien-phu', 'Thiên Phủ')],
    9: [star('vu-khuc', 'Vũ Khúc')],
    7: [star('thien-tuong', 'Thiên Tướng')]
  }), 1),
  ...patterns.buildAdjacentParagraphs(taHuuA, 1),
  patterns.buildActivationParagraph(activationPalaces, [1, 1, 5, 7, 9], 'Chuỗi vận hạn')
];
assert.ok(paragraphs.every((paragraph) => paragraph.length >= 120));
assert.ok(paragraphs.every((paragraph) => !/^\s*(?:[-*•]|\d+[.)])\s+/u.test(paragraph)));

console.log('Pattern tests passed: 5 configurations, adjacent formations and activation networks');
