import type { Device } from '@/lib/types';

export function GateSymbol({ device, width, height, selected, clockY }: { device: Device; width: number; height: number; selected: boolean; clockY?: number }) {
  const stroke = selected ? '#0b7a69' : '#334155';
  const fill = selected ? '#e8f7f1' : '#fff';
  const common = { fill, stroke, strokeWidth: 2 };
  const { type } = device;
  const label = device.net ?? (type === 'Addition' ? '+' : type === 'Dff' ? 'DFF' : type === 'Constant' ? device.constant : type === 'Mux' ? 'MUX' : type);
  const gate = ['And', 'Nand', 'Or', 'Nor', 'Xor', 'Xnor', 'Not', 'Repeater'].includes(type);
  if (gate) return <g transform={`translate(8,${height / 2 - 25})`}>
    {(type === 'And' || type === 'Nand') && <path d="M 0 0 H 26 A 25 25 0 0 1 26 50 H 0 Z" {...common} />}
    {['Or', 'Nor', 'Xor', 'Xnor'].includes(type) && <path d="M 0 0 Q 25 0 50 25 Q 25 50 0 50 Q 16 25 0 0 Z" {...common} />}
    {['Xor', 'Xnor'].includes(type) && <path d="M -6 0 Q 10 25 -6 50" fill="none" stroke={stroke} strokeWidth="2" />}
    {['Not', 'Repeater'].includes(type) && <path d="M 0 0 L 45 25 L 0 50 Z" {...common} />}
    {['Not', 'Nand', 'Nor', 'Xnor'].includes(type) && <circle cx={type === 'Not' ? 50 : 55} cy="25" r="5" {...common} />}
    <text x="23" y="70" textAnchor="middle" fill="#64748b" fontSize="11">{type.toUpperCase()}</text>
  </g>;
  if (type === 'Mux') return <g><path d={`M 14 8 L ${width - 14} 24 L ${width - 14} ${height - 24} L 14 ${height - 8} Z`} {...common} /><text x={width / 2} y={height / 2 + 5} textAnchor="middle" fill={stroke} fontSize="16">MUX</text></g>;
  if (type === 'Input' || type === 'Output' || type === 'Constant') return <g>
    <rect x="2" y="2" width={width - 4} height={height - 4} rx="9" fill={type === 'Output' ? '#eef5ff' : type === 'Constant' ? '#f8fafc' : '#ffffff'} stroke={selected ? '#0b7a69' : '#cbd5e1'} strokeWidth="1.5" />
    <text x={width / 2} y={height / 2 + 5} textAnchor="middle" fontFamily="monospace" fontSize="14" fill="#1e293b">{label}</text>
  </g>;
  return <g>
    <rect x="8" y="4" width={width - 16} height={height - 8} rx="5" {...common} />
    <text x={width / 2} y={type === 'Dff' ? 25 : height / 2 + 7} textAnchor="middle" fill={stroke} fontSize={type === 'Addition' ? 30 : 13} fontWeight="600">{label}</text>
    {type === 'Dff' && <>{clockY !== undefined && <><path d={`M 8 ${clockY - 6} l 10 6 l -10 6`} fill="none" stroke={stroke} strokeWidth="1.5" />{device.polarity?.clock === false && <circle cx="4" cy={clockY} r="4" {...common} />}</>}<text x={width / 2} y={height - 20} textAnchor="middle" fill="#64748b" fontSize="10">{typeof device.bits === 'number' ? device.bits : 1} bit{device.bits !== 1 ? 's' : ''}</text></>}
  </g>;
}
