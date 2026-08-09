"use strict";

const { createNarrative, NARRATIVE_VERSION } = require("./synthesis");

const ENGINE_VERSION = "mxiao-astronomy-engine-1.7.0";
const EPHEMERIS_NAME = "Astronomy Engine";
const EPHEMERIS_VERSION = "2.1.19";
const ORB_PROFILE = "mxiao_natal_v1";
const RULERSHIP_PROFILE = "traditional_domicile_v1";

const SIGNS = [
  ["Bạch Dương", "Aries", "Lửa", "Thống lĩnh", "mars"],
  ["Kim Ngưu", "Taurus", "Đất", "Kiên định", "venus"],
  ["Song Tử", "Gemini", "Khí", "Linh hoạt", "mercury"],
  ["Cự Giải", "Cancer", "Nước", "Thống lĩnh", "moon"],
  ["Sư Tử", "Leo", "Lửa", "Kiên định", "sun"],
  ["Xử Nữ", "Virgo", "Đất", "Linh hoạt", "mercury"],
  ["Thiên Bình", "Libra", "Khí", "Thống lĩnh", "venus"],
  ["Bọ Cạp", "Scorpio", "Nước", "Kiên định", "mars"],
  ["Nhân Mã", "Sagittarius", "Lửa", "Linh hoạt", "jupiter"],
  ["Ma Kết", "Capricorn", "Đất", "Thống lĩnh", "saturn"],
  ["Bảo Bình", "Aquarius", "Khí", "Kiên định", "saturn"],
  ["Song Ngư", "Pisces", "Nước", "Linh hoạt", "jupiter"]
].map(([name, english, element, modality, ruler], index) => ({ index, name, english, element, modality, ruler }));

const BODIES = [
  ["sun", "Mặt Trời", "Sun", "Sun", "☉", "luminary"],
  ["moon", "Mặt Trăng", "Moon", "Moon", "☾", "luminary"],
  ["mercury", "Sao Thủy", "Mercury", "Mercury", "☿", "personal"],
  ["venus", "Sao Kim", "Venus", "Venus", "♀", "personal"],
  ["mars", "Sao Hỏa", "Mars", "Mars", "♂", "personal"],
  ["jupiter", "Sao Mộc", "Jupiter", "Jupiter", "♃", "social"],
  ["saturn", "Sao Thổ", "Saturn", "Saturn", "♄", "social"],
  ["uranus", "Sao Thiên Vương", "Uranus", "Uranus", "♅", "outer"],
  ["neptune", "Sao Hải Vương", "Neptune", "Neptune", "♆", "outer"],
  ["pluto", "Sao Diêm Vương", "Pluto", "Pluto", "♇", "outer"]
].map(([id, name, english, astronomyBody, symbol, tier]) => ({ id, name, english, astronomyBody, symbol, tier }));

const ASPECTS = [
  { id: "conjunction", name: "Trùng tụ", angle: 0, baseOrb: 6, luminaryOrb: 8, symbol: "☌" },
  { id: "sextile", name: "Lục hợp", angle: 60, baseOrb: 4, luminaryOrb: 5, symbol: "⚹" },
  { id: "square", name: "Góc vuông", angle: 90, baseOrb: 5, luminaryOrb: 7, symbol: "□" },
  { id: "trine", name: "Tam hợp", angle: 120, baseOrb: 5, luminaryOrb: 7, symbol: "△" },
  { id: "opposition", name: "Đối đỉnh", angle: 180, baseOrb: 6, luminaryOrb: 8, symbol: "☍" }
];

function mod(value, divisor = 360) {
  return ((value % divisor) + divisor) % divisor;
}

function signedDelta(a, b) {
  return mod(a - b + 180) - 180;
}

function angularDistance(a, b) {
  return Math.abs(signedDelta(a, b));
}

function validGregorianDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day };
}

function parseClock(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

function formatterFor(timezone) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      calendar: "gregory",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
  } catch {
    throw new Error("Múi giờ IANA không hợp lệ.");
  }
}

function localParts(formatter, timestamp) {
  const values = {};
  for (const part of formatter.formatToParts(new Date(timestamp))) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return { year: values.year, month: values.month, day: values.day, hour: values.hour, minute: values.minute };
}

function sameLocal(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day && a.hour === b.hour && a.minute === b.minute;
}

function zonedLocalCandidates(local, timezone) {
  const formatter = formatterFor(timezone);
  const localStamp = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const offsets = new Set();
  for (let hours = -36; hours <= 36; hours += 3) {
    const probe = localStamp + hours * 3600000;
    const seen = localParts(formatter, probe);
    const seenStamp = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute);
    offsets.add(Math.round((seenStamp - probe) / 60000));
  }
  const candidates = [];
  for (const offsetMinutes of offsets) {
    const timestamp = localStamp - offsetMinutes * 60000;
    if (sameLocal(localParts(formatter, timestamp), local)) candidates.push({ timestamp, offsetMinutes });
  }
  return candidates.sort((a, b) => a.timestamp - b.timestamp);
}

function resolveLocalDateTime(date, time, timezone) {
  const local = { ...date, ...time };
  const candidates = zonedLocalCandidates(local, timezone);
  if (!candidates.length) throw new Error("Giờ sinh này không tồn tại tại nơi đã chọn do chuyển đổi giờ mùa hè. Hãy kiểm tra lại giấy tờ hoặc giờ ghi nhận.");
  if (candidates.length > 1) throw new Error("Giờ sinh này xuất hiện hai lần do kết thúc giờ mùa hè. Cần thêm thông tin để xác định đúng thời điểm UTC.");
  return { ...candidates[0], utc: new Date(candidates[0].timestamp), local };
}

function signPosition(longitude) {
  const normalized = mod(longitude);
  const sign = SIGNS[Math.floor(normalized / 30)];
  return { sign, signIndex: sign.index, degree: normalized - sign.index * 30, longitude: normalized };
}

function formatDegree(value) {
  let degrees = Math.floor(mod(value, 30));
  let minutes = Math.round((mod(value, 30) - degrees) * 60);
  if (minutes === 60) {
    degrees += 1;
    minutes = 0;
  }
  return `${degrees}°${String(minutes).padStart(2, "0")}′`;
}

function createAstrologyEngine(Astronomy, interpretationCorpus = null, synthesisRules = null, writerStyle = null) {
  if (!Astronomy || !Astronomy.Body || !Astronomy.AstroTime) throw new Error("Không thể khởi tạo Astronomy Engine.");

  function astroTime(value) {
    return value instanceof Astronomy.AstroTime ? value : new Astronomy.AstroTime(value);
  }

  function trueObliquity(time) {
    const matrix = Astronomy.Rotation_EQD_ECT(time).rot;
    return Math.atan2(matrix[2][1], matrix[1][1]);
  }

  function longitudeFromRa(ra, obliquity) {
    return mod(Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(obliquity)) * 180 / Math.PI);
  }

  function trueNodeLongitude(time) {
    const state = Astronomy.GeoMoonState(time);
    const rotation = Astronomy.Rotation_EQJ_ECT(time);
    const r = Astronomy.RotateVector(rotation, new Astronomy.Vector(state.x, state.y, state.z, time));
    const v = Astronomy.RotateVector(rotation, new Astronomy.Vector(state.vx, state.vy, state.vz, time));
    const hx = r.y * v.z - r.z * v.y;
    const hy = r.z * v.x - r.x * v.z;
    return mod(Math.atan2(hx, -hy) * 180 / Math.PI);
  }

  function bodyLongitude(time, body) {
    if (body.id === "moon") return mod(Astronomy.EclipticGeoMoon(time).lon);
    const vector = Astronomy.GeoVector(Astronomy.Body[body.astronomyBody], time, true);
    return mod(Astronomy.Ecliptic(vector).elon);
  }

  function bodyLongitudeAndSpeed(time, body) {
    const halfDay = 12 * 3600000;
    const longitude = bodyLongitude(time, body);
    const before = bodyLongitude(astroTime(new Date(time.date.getTime() - halfDay)), body);
    const after = bodyLongitude(astroTime(new Date(time.date.getTime() + halfDay)), body);
    return { longitude, speed: signedDelta(after, before) };
  }

  function nodeLongitudeAndSpeed(time) {
    const halfDay = 12 * 3600000;
    const longitude = trueNodeLongitude(time);
    const before = trueNodeLongitude(astroTime(new Date(time.date.getTime() - halfDay)));
    const after = trueNodeLongitude(astroTime(new Date(time.date.getTime() + halfDay)));
    return { longitude, speed: signedDelta(after, before) };
  }

  function placidusCusp(ramc, latitude, obliquity, fraction) {
    let ra = mod(ramc + fraction * Math.PI / 2, 2 * Math.PI);
    const tanPhi = Math.tan(latitude);
    const tanEps = Math.tan(obliquity);
    for (let index = 0; index < 100; index += 1) {
      const argument = -Math.sin(ra) * tanPhi * tanEps;
      if (Math.abs(argument) > 1) throw new Error("Placidus không khả dụng tại vĩ độ này. Hãy chọn Whole Sign hoặc Equal House.");
      const next = mod(ramc + fraction * Math.acos(argument), 2 * Math.PI);
      if (Math.abs(mod(next - ra + Math.PI, 2 * Math.PI) - Math.PI) < 1e-8) return longitudeFromRa(next, obliquity);
      ra = next;
    }
    throw new Error("Không thể hội tụ phép tính Placidus cho dữ liệu này.");
  }

  function anglesFor(time, latitude, longitude) {
    const obliquity = trueObliquity(time);
    const ramc = mod((Astronomy.SiderealTime(time) * 15 + longitude) * Math.PI / 180, 2 * Math.PI);
    const phi = latitude * Math.PI / 180;
    const mc = longitudeFromRa(ramc, obliquity);
    const asc = mod(Math.atan2(-Math.cos(ramc), Math.sin(obliquity) * Math.tan(phi) + Math.cos(obliquity) * Math.sin(ramc)) * 180 / Math.PI + 180);
    return { asc, mc, dsc: mod(asc + 180), ic: mod(mc + 180), ramc, phi, obliquity };
  }

  function calculateHouses(time, latitude, longitude, system) {
    const angles = anglesFor(time, latitude, longitude);
    let cusps;
    if (system === "equal") {
      cusps = Array.from({ length: 12 }, (_, index) => mod(angles.asc + index * 30));
    } else if (system === "whole_sign") {
      const start = Math.floor(angles.asc / 30) * 30;
      cusps = Array.from({ length: 12 }, (_, index) => mod(start + index * 30));
    } else if (system === "placidus") {
      const cusp11 = placidusCusp(angles.ramc, angles.phi, angles.obliquity, 1 / 3);
      const cusp12 = placidusCusp(angles.ramc, angles.phi, angles.obliquity, 2 / 3);
      const cusp9 = placidusCusp(angles.ramc, angles.phi, angles.obliquity, -1 / 3);
      const cusp8 = placidusCusp(angles.ramc, angles.phi, angles.obliquity, -2 / 3);
      cusps = [angles.asc, mod(cusp8 + 180), mod(cusp9 + 180), angles.ic, mod(cusp11 + 180), mod(cusp12 + 180), angles.dsc, cusp8, cusp9, angles.mc, cusp11, cusp12];
    } else {
      throw new Error("Hệ thống Nhà chưa được hỗ trợ.");
    }
    return { ...angles, system, cusps };
  }

  function houseOf(longitude, cusps) {
    for (let index = 0; index < 12; index += 1) {
      const span = mod(cusps[(index + 1) % 12] - cusps[index]);
      const offset = mod(longitude - cusps[index]);
      if (offset < span || (index === 11 && offset === span)) return index + 1;
    }
    return 12;
  }

  function calculatePlanets(time, houses = null) {
    const planets = BODIES.map((body) => {
      const values = bodyLongitudeAndSpeed(time, body);
      const position = signPosition(values.longitude);
      return { ...body, ...values, ...position, retrograde: values.speed < 0, house: houses ? houseOf(values.longitude, houses.cusps) : null };
    });
    const nodeValues = nodeLongitudeAndSpeed(time);
    const northPosition = signPosition(nodeValues.longitude);
    const north = { id: "north_node", name: "Nút Bắc", english: "North Node", symbol: "☊", tier: "secondary", ...nodeValues, ...northPosition, retrograde: nodeValues.speed < 0, house: houses ? houseOf(nodeValues.longitude, houses.cusps) : null };
    const southPosition = signPosition(nodeValues.longitude + 180);
    const south = { id: "south_node", name: "Nút Nam", english: "South Node", symbol: "☋", tier: "secondary", longitude: southPosition.longitude, speed: nodeValues.speed, ...southPosition, retrograde: nodeValues.speed < 0, house: houses ? houseOf(southPosition.longitude, houses.cusps) : null };
    return [...planets, north, south];
  }

  function aspectAt(a, b) {
    const separation = angularDistance(a.longitude, b.longitude);
    let best = null;
    for (const definition of ASPECTS) {
      let maximum = a.tier === "luminary" || b.tier === "luminary" ? definition.luminaryOrb : definition.baseOrb;
      if (a.tier === "secondary" || b.tier === "secondary") maximum = Math.min(maximum, 3);
      if (a.tier === "angle" || b.tier === "angle") maximum = Math.min(maximum, 4);
      const orb = Math.abs(separation - definition.angle);
      if (orb <= maximum && (!best || orb < best.orb)) {
        const expectedSignDistance = { conjunction: 0, sextile: 2, square: 3, trine: 4, opposition: 6 }[definition.id];
        const signA = Math.floor(mod(a.longitude) / 30);
        const signB = Math.floor(mod(b.longitude) / 30);
        const signDistance = Math.min(Math.abs(signA - signB), 12 - Math.abs(signA - signB));
        best = { ...definition, orb, maximum, separation, outOfSign: signDistance !== expectedSignDistance };
      }
    }
    return best;
  }

  function calculateAspects(planets, time, includeAngles = null) {
    const participants = planets.filter((item) => item.id !== "south_node");
    if (includeAngles) {
      participants.push(
        { id: "asc", name: "Cung Mọc", symbol: "ASC", tier: "angle", longitude: includeAngles.asc },
        { id: "mc", name: "Thiên Đỉnh", symbol: "MC", tier: "angle", longitude: includeAngles.mc }
      );
    }
    const result = [];
    for (let i = 0; i < participants.length; i += 1) {
      for (let j = i + 1; j < participants.length; j += 1) {
        const a = participants[i];
        const b = participants[j];
        const match = aspectAt(a, b);
        if (!match) continue;
        if (a.tier === "angle" || b.tier === "angle") {
          if (match.orb > 4) continue;
          result.push({ ...match, a: a.id, b: b.id, aName: a.name, bName: b.name, state: "not_applicable" });
          continue;
        }
        const epsilon = new Astronomy.AstroTime(new Date(time.date.getTime() + 60000));
        const aBody = BODIES.find((item) => item.id === a.id);
        const bBody = BODIES.find((item) => item.id === b.id);
        let state = "indeterminate";
        if (aBody && bBody) {
          const futureA = bodyLongitude(epsilon, aBody);
          const futureB = bodyLongitude(epsilon, bBody);
          const futureOrb = Math.abs(angularDistance(futureA, futureB) - match.angle);
          if (Math.abs(futureOrb - match.orb) > 1e-7) state = futureOrb < match.orb ? "applying" : "separating";
        }
        result.push({ ...match, a: a.id, b: b.id, aName: a.name, bName: b.name, state });
      }
    }
    return result.sort((a, b) => a.orb - b.orb || a.angle - b.angle);
  }

  function detectPatterns(planets, aspects) {
    const core = planets.filter((item) => BODIES.some((body) => body.id === item.id));
    const patterns = [];
    for (const sign of SIGNS) {
      const members = core.filter((item) => item.signIndex === sign.index);
      if (members.length >= 3) {
        const generational = members.every((item) => item.tier === "outer");
        patterns.push({ id: `stellium_${sign.index}`, type: "stellium", name: generational ? `Cụm thế hệ tại ${sign.name}` : `Stellium tại ${sign.name}`, members: members.map((item) => item.id), priority: generational ? "low" : "high" });
      }
    }
    const occupiedHouses = uniqueNumbers(core.map((item) => item.house));
    for (const house of occupiedHouses) {
      const members = core.filter((item) => item.house === house);
      if (members.length >= 3) {
        const generational = members.every((item) => item.tier === "outer");
        patterns.push({ id: `house_cluster_${house}`, type: "house_cluster", name: `Cụm hành tinh tại Nhà ${house}`, members: members.map((item) => item.id), house, priority: generational ? "low" : "high" });
      }
    }
    const tight = aspects.filter((item) => item.orb <= 3 && !["north_node", "asc", "mc"].includes(item.a) && !["north_node", "asc", "mc"].includes(item.b));
    const edge = (a, b, id) => tight.find((item) => ((item.a === a && item.b === b) || (item.a === b && item.b === a)) && item.id === id);
    for (let i = 0; i < core.length; i += 1) {
      for (let j = i + 1; j < core.length; j += 1) {
        for (let k = j + 1; k < core.length; k += 1) {
          const ids = [core[i].id, core[j].id, core[k].id];
          const pairs = [[ids[0], ids[1]], [ids[0], ids[2]], [ids[1], ids[2]]];
          const trines = pairs.map(([a, b]) => edge(a, b, "trine"));
          if (trines.every(Boolean)) patterns.push({ id: `grand_trine_${ids.join("_")}`, type: "grand_trine", name: "Tam hợp lớn", members: ids, priority: "high" });
          for (let apexIndex = 0; apexIndex < 3; apexIndex += 1) {
            const apex = ids[apexIndex];
            const ends = ids.filter((id) => id !== apex);
            if (edge(ends[0], ends[1], "opposition") && edge(apex, ends[0], "square") && edge(apex, ends[1], "square")) {
              patterns.push({ id: `t_square_${ids.join("_")}`, type: "t_square", name: "T-square", members: ids, apex, priority: "high" });
              break;
            }
          }
        }
      }
    }
    for (let i = 0; i < core.length; i += 1) {
      for (let j = i + 1; j < core.length; j += 1) {
        for (let k = j + 1; k < core.length; k += 1) {
          for (let l = k + 1; l < core.length; l += 1) {
            const ids = [core[i].id, core[j].id, core[k].id, core[l].id];
            const oppositions = [];
            const squares = [];
            for (let a = 0; a < ids.length; a += 1) {
              for (let b = a + 1; b < ids.length; b += 1) {
                if (edge(ids[a], ids[b], "opposition")) oppositions.push([ids[a], ids[b]]);
                if (edge(ids[a], ids[b], "square")) squares.push([ids[a], ids[b]]);
              }
            }
            const opposedNodes = new Set(oppositions.flat());
            if (oppositions.length === 2 && opposedNodes.size === 4 && squares.length === 4) {
              patterns.push({ id: `grand_cross_${ids.join("_")}`, type: "grand_cross", name: "Đại thập tự", members: ids, priority: "high" });
            }
          }
        }
      }
    }
    return patterns;
  }

  function annotatePatternDependencies(aspects, patterns) {
    const aspectPatterns = patterns
      .filter((pattern) => ["grand_cross", "t_square", "grand_trine"].includes(pattern.type))
      .sort((a, b) => ({ grand_cross: 3, t_square: 2, grand_trine: 1 }[b.type] - { grand_cross: 3, t_square: 2, grand_trine: 1 }[a.type]));
    for (const pattern of aspectPatterns) {
      const group = `pattern:${pattern.id}`;
      pattern.dependencyGroup = group;
      aspects
        .filter((aspect) => aspect.orb <= 3 && pattern.members.includes(aspect.a) && pattern.members.includes(aspect.b))
        .forEach((aspect) => { if (!aspect.patternDependencyGroup) aspect.patternDependencyGroup = group; });
    }
    return patterns;
  }

  function uniqueNumbers(values) {
    return [...new Set(values.filter((value) => Number.isInteger(value)))];
  }

  function balances(planets, asc = null) {
    const eligible = planets.filter((item) => BODIES.some((body) => body.id === item.id));
    const element = Object.fromEntries(["Lửa", "Đất", "Khí", "Nước"].map((key) => [key, 0]));
    const modality = Object.fromEntries(["Thống lĩnh", "Kiên định", "Linh hoạt"].map((key) => [key, 0]));
    for (const item of eligible) {
      element[item.sign.element] += 1;
      modality[item.sign.modality] += 1;
    }
    return { element, modality, highlights: { sun: eligible.find((item) => item.id === "sun")?.sign.name, moon: eligible.find((item) => item.id === "moon")?.sign.name, asc: asc == null ? null : signPosition(asc).sign.name } };
  }

  function houseRecords(houses, planets) {
    if (!houses) return [];
    return houses.cusps.map((cusp, index) => {
      const sign = signPosition(cusp).sign;
      const ruler = planets.find((item) => item.id === sign.ruler);
      return { number: index + 1, cusp, sign, rulerId: sign.ruler, rulerName: ruler?.name || sign.ruler, rulerHouse: ruler?.house || null, planets: planets.filter((item) => item.house === index + 1).map((item) => item.id) };
    });
  }

  function houseRulerGraph(houses) {
    const edges = houses.map((house) => ({ from: house.number, to: house.rulerHouse, rulerId: house.rulerId, rulerName: house.rulerName, cycleId: null }));
    const cycles = [];
    const selfLoops = [];
    const assigned = new Set();
    for (const start of edges.map((edge) => edge.from)) {
      if (assigned.has(start)) continue;
      const order = [];
      const seenAt = new Map();
      let current = start;
      while (Number.isInteger(current) && !seenAt.has(current) && !assigned.has(current)) {
        seenAt.set(current, order.length);
        order.push(current);
        current = edges.find((edge) => edge.from === current)?.to;
      }
      if (seenAt.has(current)) {
        const members = order.slice(seenAt.get(current));
        const id = `ruler_cycle_${members.slice().sort((a, b) => a - b).join("_")}`;
        cycles.push({ id, houses: members, reciprocal: members.length > 1 });
        members.forEach((house) => {
          const edge = edges.find((item) => item.from === house);
          if (edge) edge.cycleId = id;
          if (edge?.from === edge?.to) selfLoops.push(house);
        });
      }
      order.forEach((house) => assigned.add(house));
    }
    return { edges, cycles, selfLoops, maxNarrativeHops: 2 };
  }

  function exactChart(input, date, time, resolved) {
    const astro = astroTime(resolved.utc);
    const houses = input.includeHouses === false ? null : calculateHouses(astro, input.location.latitude, input.location.longitude, input.houseSystem);
    const planets = calculatePlanets(astro, houses);
    const aspects = calculateAspects(planets, astro, houses);
    const patterns = annotatePatternDependencies(aspects, detectPatterns(planets, aspects));
    const houseData = houseRecords(houses, planets);
    const chart = {
      status: "exact",
      profile: { name: input.fullName, birthDate: input.birthDate, birthTimeLocal: input.birthTime, birthTimeAccuracy: "exact", birthPlaceLabel: input.location.label, latitude: input.location.latitude, longitude: input.location.longitude, timezoneId: input.location.timezone, utcDatetime: resolved.utc.toISOString(), utcOffsetMinutes: resolved.offsetMinutes },
      settings: { zodiac: "tropical", houseSystem: input.houseSystem, nodeType: "true" },
      angles: houses ? { asc: houses.asc, mc: houses.mc, dsc: houses.dsc, ic: houses.ic } : null,
      planets,
      houses: houseData,
      houseCusps: houses?.cusps || [],
      houseRulerGraph: houseRulerGraph(houseData),
      houseSystemSemantics: { mcEqualsHouse10Cusp: input.houseSystem === "placidus", ascEqualsHouse1Cusp: input.houseSystem !== "whole_sign" },
      aspects,
      patterns,
      balances: balances(planets, houses?.asc),
      uncertainty: null,
      metadata: { calculationEngine: EPHEMERIS_NAME, calculationEngineVersion: EPHEMERIS_VERSION, mxiaoEngineVersion: ENGINE_VERSION, narrativeVersion: NARRATIVE_VERSION, ephemerisModel: "VSOP87/NOVAS-derived", zodiac: "tropical", houseSystem: input.houseSystem, nodeType: "true_node", orbProfile: ORB_PROFILE, rulershipProfile: RULERSHIP_PROFILE, networkAccess: false }
    };
    chart.narrative = createNarrative(chart, interpretationCorpus, synthesisRules, signPosition, writerStyle);
    return chart;
  }

  function sampleTimes(date, startMinute, endMinute, stepMinutes, timezone) {
    const values = [];
    for (let minuteOfDay = startMinute; minuteOfDay <= endMinute; minuteOfDay += stepMinutes) {
      const dayOffset = Math.floor(minuteOfDay / 1440);
      const minute = mod(minuteOfDay, 1440);
      const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + dayOffset));
      const local = { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate(), hour: Math.floor(minute / 60), minute: minute % 60 };
      const candidates = zonedLocalCandidates(local, timezone);
      candidates.forEach((candidate) => values.push({ ...candidate, utc: new Date(candidate.timestamp), local }));
    }
    return values.sort((a, b) => a.timestamp - b.timestamp);
  }

  function uncertainChart(input, date) {
    let start = 0;
    let end = 1439;
    if (input.timeAccuracy === "range") {
      const from = parseClock(input.timeFrom);
      const to = parseClock(input.timeTo);
      if (!from || !to) throw new Error("Khoảng giờ sinh không hợp lệ.");
      start = from.hour * 60 + from.minute;
      end = to.hour * 60 + to.minute;
      if (end < start) end += 1440;
      if (end - start > 1440) throw new Error("Khoảng giờ sinh không được dài quá 24 giờ.");
    }
    const samples = sampleTimes(date, start, end, 5, input.location.timezone);
    if (!samples.length) throw new Error("Không có thời điểm dân sự hợp lệ trong khoảng giờ đã nhập.");
    const samplePositions = samples.map((sample) => {
      const time = astroTime(sample.utc);
      return calculatePlanets(time, null);
    });
    const planets = BODIES.map((body) => {
      const values = samplePositions.map((items) => items.find((item) => item.id === body.id));
      const signs = [...new Set(values.map((item) => item.signIndex))];
      const retro = [...new Set(values.map((item) => item.retrograde))];
      const longitudes = values.map((item) => item.longitude);
      const stable = signs.length === 1 && retro.length === 1;
      return { ...values[Math.floor(values.length / 2)], stability: stable ? "stable" : signs.length <= 2 ? "conditional" : "unstable", possibleSigns: signs.map((index) => SIGNS[index].name), longitudeRange: { start: longitudes[0], end: longitudes[longitudes.length - 1] }, house: null };
    });
    const midpoint = samples[Math.floor(samples.length / 2)];
    const midpointAstro = astroTime(midpoint.utc);
    const nodeSamples = samplePositions.map((items) => items.find((item) => item.id === "north_node"));
    const nodeSigns = [...new Set(nodeSamples.map((item) => item.signIndex))];
    const nodeRetro = [...new Set(nodeSamples.map((item) => item.retrograde))];
    const nodeStable = nodeSigns.length === 1 && nodeRetro.length === 1;
    const north = { ...nodeSamples[Math.floor(nodeSamples.length / 2)], stability: nodeStable ? "stable" : nodeSigns.length <= 2 ? "conditional" : "unstable", possibleSigns: nodeSigns.map((index) => SIGNS[index].name), longitudeRange: { start: nodeSamples[0].longitude, end: nodeSamples[nodeSamples.length - 1].longitude } };
    planets.push(north);
    const southPosition = signPosition(north.longitude + 180);
    planets.push({ id: "south_node", name: "Nút Nam", english: "South Node", symbol: "☋", tier: "secondary", longitude: southPosition.longitude, speed: north.speed, ...southPosition, retrograde: north.retrograde, house: null, stability: north.stability, possibleSigns: north.possibleSigns.map((name) => SIGNS[(SIGNS.find((sign) => sign.name === name)?.index + 6) % 12].name), longitudeRange: { start: mod(north.longitudeRange.start + 180), end: mod(north.longitudeRange.end + 180) } });
    const aspects = calculateAspects(planets, midpointAstro, null).filter((aspect) => {
      const a = planets.find((item) => item.id === aspect.a);
      const b = planets.find((item) => item.id === aspect.b);
      return a?.stability === "stable" && b?.stability === "stable" && samples.every((sample, index) => {
        const pa = samplePositions[index].find((item) => item.id === aspect.a);
        const pb = samplePositions[index].find((item) => item.id === aspect.b);
        return pa && pb && aspectAt(pa, pb)?.id === aspect.id;
      });
    });
    const patterns = annotatePatternDependencies(aspects, detectPatterns(planets.filter((item) => item.stability === "stable"), aspects));
    const chart = {
      status: input.timeAccuracy,
      profile: { name: input.fullName, birthDate: input.birthDate, birthTimeLocal: input.timeAccuracy === "unknown" ? null : `${input.timeFrom}-${input.timeTo}`, birthTimeAccuracy: input.timeAccuracy, birthPlaceLabel: input.location.label, latitude: input.location.latitude, longitude: input.location.longitude, timezoneId: input.location.timezone, utcDatetime: null, utcOffsetMinutes: null },
      settings: { zodiac: "tropical", houseSystem: null, nodeType: "true" },
      angles: null,
      planets,
      houses: [],
      houseCusps: [],
      houseRulerGraph: { edges: [], cycles: [], selfLoops: [], maxNarrativeHops: 2 },
      houseSystemSemantics: { mcEqualsHouse10Cusp: false, ascEqualsHouse1Cusp: false },
      aspects,
      patterns,
      balances: balances(planets.filter((item) => item.stability === "stable"), null),
      uncertainty: { sampleStepMinutes: 5, sampleCount: samples.length, startLocal: samples[0].local, endLocal: samples[samples.length - 1].local, stablePlanetIds: planets.filter((item) => item.stability === "stable").map((item) => item.id), conditionalPlanetIds: planets.filter((item) => item.stability !== "stable").map((item) => item.id), housesAvailable: false },
      metadata: { calculationEngine: EPHEMERIS_NAME, calculationEngineVersion: EPHEMERIS_VERSION, mxiaoEngineVersion: ENGINE_VERSION, narrativeVersion: NARRATIVE_VERSION, ephemerisModel: "VSOP87/NOVAS-derived", zodiac: "tropical", houseSystem: null, nodeType: "true_node", orbProfile: ORB_PROFILE, rulershipProfile: RULERSHIP_PROFILE, networkAccess: false }
    };
    chart.narrative = createNarrative(chart, interpretationCorpus, synthesisRules, signPosition, writerStyle);
    return chart;
  }

  function buildNatalChart(rawInput) {
    const input = { ...rawInput };
    const date = validGregorianDate(input.birthDate);
    if (!date || date.year < 1800 || date.year > 2199) throw new Error("Ngày sinh phải là ngày Dương lịch hợp lệ từ năm 1800 đến 2199.");
    if (!input.location || !Number.isFinite(input.location.latitude) || !Number.isFinite(input.location.longitude) || !input.location.timezone) throw new Error("Hãy chọn một nơi sinh hợp lệ.");
    if (Math.abs(input.location.latitude) > 90 || Math.abs(input.location.longitude) > 180) throw new Error("Tọa độ nơi sinh không hợp lệ.");
    if (!['exact', 'range', 'unknown'].includes(input.timeAccuracy)) throw new Error("Độ chính xác giờ sinh không hợp lệ.");
    if (!['placidus', 'whole_sign', 'equal'].includes(input.houseSystem)) throw new Error("Hệ thống Nhà không hợp lệ.");
    input.fullName = String(input.fullName || "Người xem").trim().slice(0, 80) || "Người xem";
    if (input.timeAccuracy !== "exact") return uncertainChart(input, date);
    const time = parseClock(input.birthTime);
    if (!time) throw new Error("Giờ sinh không hợp lệ.");
    const resolved = resolveLocalDateTime(date, time, input.location.timezone);
    return exactChart(input, date, time, resolved);
  }

  return Object.freeze({ ENGINE_VERSION, EPHEMERIS_NAME, EPHEMERIS_VERSION, NARRATIVE_VERSION, ORB_PROFILE, RULERSHIP_PROFILE, SIGNS, BODIES, ASPECTS, mod, signedDelta, angularDistance, validGregorianDate, parseClock, zonedLocalCandidates, resolveLocalDateTime, signPosition, formatDegree, buildNatalChart, calculateHouses, calculatePlanets, calculateAspects, detectPatterns, annotatePatternDependencies, houseRulerGraph });
}

module.exports = { createAstrologyEngine, ENGINE_VERSION, EPHEMERIS_NAME, EPHEMERIS_VERSION, NARRATIVE_VERSION, ORB_PROFILE, RULERSHIP_PROFILE, SIGNS, BODIES, ASPECTS };
