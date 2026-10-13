'use client';
import { Activity, Download } from 'lucide-react';
import type { Port, Sample } from '@/lib/types';
export function Waveforms({ ports, samples, values, cycles }: { ports: Port[]; samples: Sample[]; values: Record<string, string>; cycles: number }) {
  const signals = ports.slice(0, 8);
  const visible = samples.slice(-20);
  const width = 900, left = 110, span = (width - left - 28) / Math.max(visible.length, 10);
  const rowHeight = 35, top = 23;
  function exportCsv() {
    const csv = ['event,rising_edge,' + ports.map((p) => p.name).join(','), ...samples.map((s) => [s.index, s.edge ? 1 : 0, ...ports.map((p) => s.values[p.name] ?? 'X')].join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const link = document.createElement('a'); link.href = url; link.download = 'asic-waveform-trace.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="panel wave-panel" aria-label="Functional waveforms"><div className="panel-heading"><div className="panel-title"><Activity size={16} /><h2>Waveforms</h2><span className="muted">{cycles} rising edge{cycles !== 1 ? 's' : ''}</span></div><div className="panel-actions"><span className="badge subtle">Event steps · no silicon delays</span><button className="icon-button" title="Export trace CSV" aria-label="Export waveform CSV" onClick={exportCsv}><Download size={16} /></button></div></div>
    <div className="wave-scroll"><svg viewBox={`0 0 ${width} ${top + signals.length * rowHeight + 22}`} className="wave-svg" role="img" aria-label="Signal history after settled input changes and clock edges">
      {visible.map((sample, i) => <g key={sample.index}>{sample.edge && <line x1={left + i * span} y1="12" x2={left + i * span} y2={top + signals.length * rowHeight} stroke="#cce5df" strokeDasharray="3 4" />}<text x={left + i * span + 5} y={top + signals.length * rowHeight + 16} fontSize="10" fill="#94a3b8">{sample.edge ? '↑' : ''}{sample.index}</text></g>)}
      {signals.map((port, row) => {
        const y = top + row * rowHeight;
        return <g key={port.name}><text x="17" y={y + 16} fontSize="13" fill="#334155" fontFamily="monospace">{port.name}</text><text x="100" y={y + 16} textAnchor="end" fontSize="12" fontFamily="monospace" fill="#0b7a69">{port.width > 1 && /^[01]+$/.test(values[port.name] ?? '') ? String(parseInt(values[port.name], 2)) : (values[port.name] ?? 'X').toUpperCase()}</text><line x1={left} x2={width - 20} y1={y + 29} y2={y + 29} stroke="#f1f5f9" />
          {port.width > 1 ? visible.map((s, i) => { const value = s.values[port.name] ?? 'x'; const unknown = /x/i.test(value); return <g key={s.index}><path d={`M ${left + i * span} ${y + 12} l 5 -9 h ${span - 10} l 5 9 l -5 9 h ${10 - span} Z`} fill={unknown ? '#fff6e8' : '#edf8f4'} stroke={unknown ? '#b7791f' : '#0b8d78'} strokeWidth="1.3" /><text x={left + (i + .5) * span} y={y + 16} textAnchor="middle" fontSize="11" fill={unknown ? '#b7791f' : '#076c5d'} fontFamily="monospace">{unknown ? 'X' : parseInt(value, 2)}</text></g>; }) : <><path d={visible.map((s, i) => { const position = (v?: string) => v === '1' ? 3 : v === '0' ? 23 : 13; const y1 = y + position(s.values[port.name]); const prev = i > 0 ? y + position(visible[i - 1].values[port.name]) : y1; return `${i === 0 ? 'M' : 'L'} ${left + i * span} ${prev} L ${left + i * span} ${y1} H ${left + (i + 1) * span}`; }).join(' ')} fill="none" stroke={port.name === 'clk' ? '#577bc1' : '#0b8d78'} strokeWidth="1.8" />{visible.map((s, i) => !/^[01]$/.test(s.values[port.name] ?? '') ? <g key={s.index}><rect x={left + i * span} y={y} width={span} height="26" fill="#fff6e8" /><text x={left + (i + .5) * span} y={y + 17} textAnchor="middle" fontSize="11" fill="#b7791f">X</text></g> : null)}</>}
        </g>;
      })}
    </svg></div>
  </section>;
}
