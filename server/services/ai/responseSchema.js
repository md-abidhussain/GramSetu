// Small, explicit checks for AI replies. A model can return a score of 140, a
// risk level of "moderate-ish" or a field as the wrong type; each of those is
// rejected rather than stored, because a stored value reads as a finding.

export const DEFECT_TYPES = Object.freeze([
  'pothole',
  'crack',
  'road_damage',
  'open_manhole',
  'leakage',
  'broken_infrastructure',
  'garbage'
]);

const DEFECT_SYNONYMS = {
  potholes: 'pothole',
  cracks: 'crack',
  cracking: 'crack',
  openmanhole: 'open_manhole',
  open_manholes: 'open_manhole',
  manhole: 'open_manhole',
  water_leakage: 'leakage',
  leak: 'leakage',
  damaged_road: 'road_damage'
};

/** Lowercases, maps known synonyms, drops "none" and anything unknown. */
export const normalizeDefectTypes = (value) => {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().toLowerCase().replace(/[\s-]+/g, '_'))
    .map((item) => DEFECT_SYNONYMS[item] ?? item)
    .filter((item) => DEFECT_TYPES.includes(item));
  return [...new Set(normalized)];
};

export const checker = (raw) => {
  const problems = [];
  const object = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
  if (!object) problems.push('reply is not a JSON object');

  const read = (key) => (object ? object[key] : undefined);

  return {
    problems,
    number(key, min, max) {
      const value = read(key);
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
        problems.push(`${key} must be a number from ${min} to ${max}`);
        return undefined;
      }
      return value;
    },
    oneOf(key, allowed) {
      const value = read(key);
      const match = typeof value === 'string' ? allowed.find((option) => option.toLowerCase() === value.trim().toLowerCase()) : undefined;
      if (!match) {
        problems.push(`${key} must be one of ${allowed.join(', ')}`);
        return undefined;
      }
      return match;
    },
    text(key, maxLength, { required = true } = {}) {
      const value = read(key);
      if (typeof value !== 'string' || (required && value.trim() === '')) {
        if (required) problems.push(`${key} must be text`);
        return required ? undefined : '';
      }
      return value.trim().slice(0, maxLength);
    },
    bool(key) {
      const value = read(key);
      if (typeof value !== 'boolean') {
        problems.push(`${key} must be true or false`);
        return undefined;
      }
      return value;
    },
    raw: read,
    result(value) {
      return problems.length ? { ok: false, problems } : { ok: true, value };
    }
  };
};
