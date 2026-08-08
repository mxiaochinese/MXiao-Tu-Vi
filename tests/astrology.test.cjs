const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Astronomy = require('astronomy-engine');
const { createAstrologyEngine } = require('../src/astrology/engine');

const engine = createAstrologyEngine(Astronomy);
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'astrology-reference.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'astrology', 'engine-config.json'), 'utf8'));
const angularDelta = (a, b) => Math.abs(engine.signedDelta(a, b));

assert.equal(config.engine.name, engine.EPHEMERIS_NAME);
assert.equal(config.engine.version, engine.EPHEMERIS_VERSION);
assert.equal(config.engine.license, 'MIT');
assert.equal(config.engine.networkAccess, false);
assert.equal(config.uncertainTimeSampleStepMinutes, 5);
assert.deepEqual(config.aspects, engine.ASPECTS.map(({ id, angle, baseOrb, luminaryOrb }) => ({ id, angle, baseOrb, luminaryOrb })));

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

console.log(`Astrology tests passed: ${fixtures.cases.length} independent ephemeris/house references, DST gap/fold, polar fallback policy, unknown-time stability and pattern topology`);
