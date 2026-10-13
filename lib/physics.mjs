export function timing({ period = 2, clockToQMax = 0.15, logicMax = 0.85, wireMax = 0.25, setup = 0.15, uncertainty = 0.3, skew = 0, clockToQMin = 0.06, logicMin = 0.04, wireMin = 0.02, hold = 0.1, holdUncertainty = 0.02, holdBuffer = 0 }) {
  const arrival = clockToQMax + logicMax + wireMax + holdBuffer;
  const required = period + skew - setup - uncertainty;
  const earliest = clockToQMin + logicMin + wireMin + holdBuffer;
  const holdRequired = skew + hold + holdUncertainty;
  return { arrival, required, setupSlack: required - arrival, earliest, holdRequired, holdSlack: earliest - holdRequired };
}

export const START_CELLS = [
  { id: 'ff0', label: 'DFF 0', x: 90, y: 95, kind: 'ff' },
  { id: 'ff1', label: 'DFF 1', x: 245, y: 185, kind: 'ff' },
  { id: 'ff2', label: 'DFF 2', x: 405, y: 100, kind: 'ff' },
  { id: 'ff3', label: 'DFF 3', x: 475, y: 270, kind: 'ff' },
  { id: 'xor0', label: 'XOR', x: 260, y: 315, kind: 'logic' },
  { id: 'and0', label: 'AND', x: 100, y: 240, kind: 'logic' },
];
export const CONNECTIONS = [['ff0', 'and0'], ['and0', 'xor0'], ['xor0', 'ff1'], ['ff1', 'ff2'], ['ff2', 'ff3']];
export function wireLength(cells) {
  return CONNECTIONS.reduce((length, [a, b]) => {
    const first = cells.find((c) => c.id === a), second = cells.find((c) => c.id === b);
    return length + Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
  }, 0);
}
const COMPACT_POSITIONS = [[100, 120], [370, 120], [370, 215], [280, 215], [280, 120], [190, 120]];
export const COMPACT_CELLS = START_CELLS.map((c, i) => ({ ...c, x: COMPACT_POSITIONS[i][0], y: COMPACT_POSITIONS[i][1] }));
