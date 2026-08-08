const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Astronomy = require('astronomy-engine');
const { createAstrologyEngine } = require('../src/astrology/engine');

const engine = createAstrologyEngine(Astronomy);
const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'astrology', 'interpretation-corpus-v1.4.json'), 'utf8'));
const synthesisRules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'astrology', 'synthesis-rules-v1.4.json'), 'utf8'));
const narrativeEngine = createAstrologyEngine(Astronomy, corpus, synthesisRules);
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'astrology-reference.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'astrology', 'engine-config.json'), 'utf8'));
const angularDelta = (a, b) => Math.abs(engine.signedDelta(a, b));

assert.equal(config.engine.name, engine.EPHEMERIS_NAME);
assert.equal(config.engine.version, engine.EPHEMERIS_VERSION);
assert.equal(config.engine.license, 'MIT');
assert.equal(config.engine.networkAccess, false);
assert.equal(config.uncertainTimeSampleStepMinutes, 5);
assert.deepEqual(config.aspects, engine.ASPECTS.map(({ id, angle, baseOrb, luminaryOrb }) => ({ id, angle, baseOrb, luminaryOrb })));
assert.equal(corpus.planet_in_sign.length, 120);
assert.equal(corpus.planet_in_house.length, 120);
assert.equal(corpus.planet_pair_dynamics.length, 45);
assert.equal(corpus.aspect_operators.length, 5);
assert.ok([...corpus.planet_in_sign, ...corpus.planet_in_house, ...corpus.planet_pair_dynamics, ...corpus.aspect_operators].every((item) => item.user_copy_direct_use === false));

for (const fixture of fixtures.cases) {
  const input = fixture.input;
  const chart = engine.buildNatalChart({
    fullName: fixture.id,
    birthDate: input.date,
    birthTime: input.time,
    timeAccuracy: 'exact',
    location: { label: fixture.id, latitude: input.latitude, longitude: input.longitude, timezone: input.timezone },
    houseSystem: 'placidus'
  });
  assert.equal(chart.metadata.calculationEngine, 'Astronomy Engine');
  assert.equal(chart.metadata.calculationEngineVersion, '2.1.19');
  assert.equal(chart.metadata.networkAccess, false);
  assert.ok(angularDelta(chart.angles.asc, fixture.expected.asc) <= 0.2, `${fixture.id} ASC`);
  assert.ok(angularDelta(chart.angles.mc, fixture.expected.mc) <= 0.2, `${fixture.id} MC`);
  chart.houseCusps.forEach((cusp, index) => assert.ok(angularDelta(cusp, fixture.expected.cusps[index]) <= 0.2, `${fixture.id} cusp ${index + 1}`));
  for (const [id, expected] of Object.entries(fixture.expected.longitudes)) {
    const actual = chart.planets.find((planet) => planet.id === id)?.longitude;
    const tolerance = id === 'moon' || id === 'north_node' ? 0.05 : 0.017;
    assert.ok(Number.isFinite(actual) && angularDelta(actual, expected) <= tolerance, `${fixture.id} ${id}: ${actual} vs ${expected}`);
  }
}

assert.throws(() => engine.buildNatalChart({
  fullName: 'Polar', birthDate: '2004-02-29', birthTime: '23:45', timeAccuracy: 'exact',
  location: { label: 'Polar', latitude: 70, longitude: -18, timezone: 'Atlantic/Reykjavik' }, houseSystem: 'placidus'
}), /Placidus không khả dụng/);

const polarWhole = engine.buildNatalChart({
  fullName: 'Polar Whole Sign', birthDate: '2004-02-29', birthTime: '23:45', timeAccuracy: 'exact',
  location: { label: 'Polar', latitude: 70, longitude: -18, timezone: 'Atlantic/Reykjavik' }, houseSystem: 'whole_sign'
});
assert.equal(polarWhole.houses.length, 12);

assert.throws(() => engine.buildNatalChart({
  fullName: 'DST gap', birthDate: '2026-03-08', birthTime: '02:30', timeAccuracy: 'exact',
  location: { label: 'New York', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' }, houseSystem: 'equal'
}), /không tồn tại/);
assert.throws(() => engine.buildNatalChart({
  fullName: 'DST fold', birthDate: '2026-11-01', birthTime: '01:30', timeAccuracy: 'exact',
  location: { label: 'New York', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' }, houseSystem: 'equal'
}), /xuất hiện hai lần/);

const unknown = engine.buildNatalChart({
  fullName: 'Unknown time', birthDate: '2001-03-20', timeAccuracy: 'unknown',
  location: { label: 'London', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' }, houseSystem: 'placidus'
});
assert.equal(unknown.angles, null);
assert.equal(unknown.houses.length, 0);
assert.equal(unknown.uncertainty.sampleStepMinutes, 5);
assert.ok(unknown.uncertainty.sampleCount >= 288);
assert.ok(unknown.planets.every((planet) => planet.house === null));

const synthetic = [
  { id: 'sun', longitude: 0, signIndex: 0, sign: engine.SIGNS[0], tier: 'luminary' },
  { id: 'moon', longitude: 120, signIndex: 4, sign: engine.SIGNS[4], tier: 'luminary' },
  { id: 'mars', longitude: 240, signIndex: 8, sign: engine.SIGNS[8], tier: 'personal' }
];
const edges = [
  { id: 'trine', a: 'sun', b: 'moon', orb: 0 },
  { id: 'trine', a: 'sun', b: 'mars', orb: 0 },
  { id: 'trine', a: 'moon', b: 'mars', orb: 0 }
];
assert.ok(engine.detectPatterns(synthetic, edges).some((pattern) => pattern.type === 'grand_trine'));

const grandCrossPlanets = [
  { id: 'sun', longitude: 0, signIndex: 0, sign: engine.SIGNS[0], tier: 'luminary', house: 1 },
  { id: 'moon', longitude: 90, signIndex: 3, sign: engine.SIGNS[3], tier: 'luminary', house: 4 },
  { id: 'mars', longitude: 180, signIndex: 6, sign: engine.SIGNS[6], tier: 'personal', house: 7 },
  { id: 'saturn', longitude: 270, signIndex: 9, sign: engine.SIGNS[9], tier: 'social', house: 10 }
];
const grandCrossEdges = [
  { id: 'opposition', a: 'sun', b: 'mars', orb: 0 }, { id: 'opposition', a: 'moon', b: 'saturn', orb: 0 },
  { id: 'square', a: 'sun', b: 'moon', orb: 0 }, { id: 'square', a: 'sun', b: 'saturn', orb: 0 },
  { id: 'square', a: 'mars', b: 'moon', orb: 0 }, { id: 'square', a: 'mars', b: 'saturn', orb: 0 }
];
const grandCrossPatterns = engine.detectPatterns(grandCrossPlanets, grandCrossEdges);
assert.ok(grandCrossPatterns.some((pattern) => pattern.type === 'grand_cross'));
engine.annotatePatternDependencies(grandCrossEdges, grandCrossPatterns);
const grandCrossGroup = grandCrossPatterns.find((pattern) => pattern.type === 'grand_cross').dependencyGroup;
assert.ok(grandCrossEdges.every((edge) => edge.patternDependencyGroup === grandCrossGroup));

const outOfSign = engine.calculateAspects([
  { id: 'sun', name: 'Mặt Trời', tier: 'luminary', longitude: 359 },
  { id: 'moon', name: 'Mặt Trăng', tier: 'luminary', longitude: 1 }
], new Astronomy.AstroTime(new Date('2000-01-01T12:00:00Z'))).find((aspect) => aspect.id === 'conjunction');
assert.ok(outOfSign && outOfSign.outOfSign && Math.abs(outOfSign.separation - 2) < 1e-9);

const narrativeChart = narrativeEngine.buildNatalChart({
  fullName: 'Narrative QA', birthDate: '1998-05-14', birthTime: '09:30', timeAccuracy: 'exact',
  location: { label: 'TP. Hồ Chí Minh', latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' }, houseSystem: 'whole_sign'
});
assert.equal(narrativeChart.houseSystemSemantics.mcEqualsHouse10Cusp, false);
assert.ok(narrativeChart.narrative.sections.some((section) => section.id === 'domain_love'));
assert.ok(narrativeChart.narrative.sections.some((section) => section.id === 'development'));
const userProse = narrativeChart.narrative.sections.flatMap((section) => section.paragraphs.map((item) => item.text)).join('\n');
assert.doesNotMatch(userProse, /[–—]/);
assert.doesNotMatch(userProse, /\b(?:placement|evidence|operator|weighting|confidence|rule id|dataset|json|debug)\b/i);
assert.doesNotMatch(userProse, /nghịch hành/i);
assert.doesNotMatch(userProse, /chắc chắn (?:kết hôn|ly hôn|giàu|nghèo)|định mệnh|kiếp trước/i);
assert.ok(narrativeChart.narrative.sections.every((section) => section.paragraphs.every((item) => item.evidence_ids.length && ['strong', 'moderate', 'limited'].includes(item.confidence_tag))));
const nodeEvidence = narrativeChart.narrative.evidence.filter((item) => item.bodies.includes('north_node') || item.bodies.includes('south_node')).filter((item) => item.evidence_class === 'secondary_axis');
assert.equal(new Set(nodeEvidence.map((item) => item.evidence_root_id)).size, 1);

const unknownNarrative = narrativeEngine.buildNatalChart({
  fullName: 'Unknown narrative', birthDate: '2001-03-20', timeAccuracy: 'unknown',
  location: { label: 'London', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' }, houseSystem: 'placidus'
});
assert.equal(unknownNarrative.narrative.sections.find((section) => section.id === 'big_three').title, 'Mặt Trời và Mặt Trăng');
assert.ok(!unknownNarrative.narrative.sections.flatMap((section) => section.paragraphs).some((item) => /Nhà \d+/.test(item.text) && !/không suy ra Nhà 10/.test(item.text)));

console.log(`Astrology tests passed: ${fixtures.cases.length} independent references, V1.4 corpus/synthesis, evidence independence, out-of-sign geometry, ruler semantics, unknown-time policy and pattern topology`);
