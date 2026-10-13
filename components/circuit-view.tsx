'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, Minus, Plus, Scan } from 'lucide-react';
import type { Netlist, Device } from '@/lib/types';
import { GateSymbol } from './gate-symbol';

type Node = { id: string; x: number; y: number; width: number; height: number; ports?: { id: string; x: number; y: number }[] };
type Edge = { id: string; sections?: { startPoint: { x: number; y: number }; bendPoints?: { x: number; y: number }[]; endPoint: { x: number; y: number } }[] };
type Layout = { width: number; height: number; children: Node[]; edges: Edge[] };
const NAMES: Record<string, string> = { in: 'D', out: 'Q', srst: 'RST', arst: 'ARST', clk: 'CLK', en: 'EN', in1: 'A', in2: 'B', sel: 'S', in0: '0' };
function portLabel(device: Device, port: string) {
  if (device.type === 'Mux' && /^in\d+$/.test(port)) return port.slice(2);
  if (device.type !== 'Dff') return port === 'out' ? '' : port === 'in' ? 'A' : NAMES[port] ?? port;
  const control = ({ srst: 'srst', arst: 'arst', en: 'enable', set: 'set', clr: 'clr' } as Record<string, string>)[port];
  const prefix = control && device.polarity?.[control] === false ? '/' : '';
  return prefix + (NAMES[port] ?? port);
}

// Use a compact, stable arrangement for the running counter example. Connections
// and source associations still come from the synthesized netlist, not a drawing.
function counterLayout(netlist: Netlist): Layout | null {
  const entries = Object.entries(netlist.devices);
  if (entries.length !== 7 || entries.filter(([, d]) => d.type === 'Addition').length !== 1 || entries.filter(([, d]) => d.type === 'Dff').length !== 1 || !['clk', 'rst', 'en', 'count'].every((name) => entries.some(([, d]) => d.net === name))) return null;
  const nodes = entries.map(([id, d]): Node => {
    const positions: Record<string, [number, number]> = { clk: [310, 207], rst: [195, 207], en: [80, 207], count: [670, 103] };
    const [x, y] = d.net ? positions[d.net] : d.type === 'Addition' ? [235, 70] : d.type === 'Dff' ? [470, 65] : [80, 112];
    const width = ['Addition', 'Dff'].includes(d.type) ? 118 : 85;
    const height = d.type === 'Dff' ? 116 : d.type === 'Addition' ? 90 : 42;
    const inputs = [...new Set(netlist.connectors.filter((c) => c.to.id === id).map((c) => c.to.port))];
    const outputs = [...new Set(netlist.connectors.filter((c) => c.from.id === id).map((c) => c.from.port))];
    const offsets: Record<string, number> = { in: 27, clk: 96, en: 56, srst: 77, arst: 77, in1: 26, in2: 62 };
    return { id, x, y, width, height, ports: [...inputs.map((p) => ({ id: `${id}:${p}`, x: 0, y: d.type === 'Output' ? 21 : offsets[p] ?? 30 })), ...outputs.map((p) => ({ id: `${id}:${p}`, x: width, y: d.type === 'Dff' ? 59 : d.type === 'Addition' ? 45 : 21 }))] };
  });
  const edges = netlist.connectors.map((conn, i): Edge => {
    const a = nodes.find((n) => n.id === conn.from.id)!, b = nodes.find((n) => n.id === conn.to.id)!;
    const ap = a.ports!.find((p) => p.id === `${a.id}:${conn.from.port}`)!, bp = b.ports!.find((p) => p.id === `${b.id}:${conn.to.port}`)!;
    const startPoint = { x: a.x + ap.x, y: a.y + ap.y }, endPoint = { x: b.x + bp.x, y: b.y + bp.y };
    const dev = netlist.devices[a.id];
    const bendPoints = dev.net === 'clk' || dev.net === 'rst' || dev.net === 'en' ? [{ x: dev.net === 'clk' ? 442 : dev.net === 'rst' ? 423 : 404, y: startPoint.y }, { x: dev.net === 'clk' ? 442 : dev.net === 'rst' ? 423 : 404, y: endPoint.y }] : dev.type === 'Dff' && netlist.devices[b.id].type === 'Addition' ? [{ x: 625, y: startPoint.y }, { x: 625, y: 28 }, { x: 198, y: 28 }, { x: 198, y: endPoint.y }] : [{ x: (startPoint.x + endPoint.x) / 2, y: startPoint.y }, { x: (startPoint.x + endPoint.x) / 2, y: endPoint.y }];
    return { id: `wire${i}`, sections: [{ startPoint, endPoint, bendPoints }] };
  });
  return { width: 795, height: 270, children: nodes, edges };
}

export function CircuitView({ netlist, signals, selected, onSelect, gateMode }: { netlist: Netlist; signals: Record<string, string>; selected: string; onSelect: (id: string, device: Device) => void; gateMode: boolean }) {
  const [layoutResult, setLayoutResult] = useState<{ netlist: Netlist; data: Layout } | null>(null);
  // React renders new props before effects run. Never draw an old layout against
  // the connectors of a newly selected example or abstraction.
  const layout = layoutResult?.netlist === netlist ? layoutResult.data : null;
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLayoutResult(null); setZoom(1); setError('');
    const ids = Object.keys(netlist.devices);
    if (ids.length > 160) { setError('This design has more than 160 display nodes. Use a smaller teaching example or inspect the exported netlist.'); return; }
    const stable = counterLayout(netlist);
    if (stable) { setLayoutResult({ netlist, data: stable }); return; }
    import('elkjs/lib/elk.bundled.js').then(async ({ default: ELK }) => {
      const children = Object.entries(netlist.devices).map(([id, device]) => {
        const inputPorts = [...new Set(netlist.connectors.filter((c) => c.to.id === id).map((c) => c.to.port))];
        const outputPorts = [...new Set(netlist.connectors.filter((c) => c.from.id === id).map((c) => c.from.port))];
        const compact = ['Input', 'Output', 'Constant'].includes(device.type);
        const simpleGate = ['And', 'Nand', 'Or', 'Nor', 'Xor', 'Xnor', 'Not', 'Repeater'].includes(device.type);
        return { id, width: compact ? 85 : simpleGate ? 85 : 118, height: compact ? 42 : Math.max(90, inputPorts.length * 25 + 16),
          layoutOptions: { 'elk.portConstraints': 'FIXED_ORDER' },
          ports: [...inputPorts.map((p) => ({ id: `${id}:${p}`, width: 0, height: 0, layoutOptions: { 'elk.port.side': 'WEST' } })), ...outputPorts.map((p) => ({ id: `${id}:${p}`, width: 0, height: 0, layoutOptions: { 'elk.port.side': 'EAST' } }))],
        };
      });
      const graph = { id: 'root', layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.edgeRouting': 'ORTHOGONAL', 'elk.spacing.nodeNode': '35', 'elk.layered.spacing.nodeNodeBetweenLayers': '80', 'elk.padding': '[top=45,left=40,bottom=45,right=55]' }, children, edges: netlist.connectors.map((c, i) => ({ id: `wire${i}`, sources: [`${c.from.id}:${c.from.port}`], targets: [`${c.to.id}:${c.to.port}`] })) };
      const result = await new ELK().layout(graph);
      if (!cancelled) setLayoutResult({ netlist, data: result as unknown as Layout });
    }).catch((e) => { if (!cancelled) setError(`The diagram could not be laid out: ${e.message}`); });
    return () => { cancelled = true; };
  }, [netlist]);
  function download() {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.removeAttribute('style');
    clone.setAttribute('width', String(layout?.width)); clone.setAttribute('height', String(layout?.height));
    clone.querySelectorAll('[tabindex]').forEach((el) => el.removeAttribute('tabindex'));
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `asic-${gateMode ? 'gates' : 'behavior'}-circuit.svg`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="circuit-container">
    <div className="diagram-tools"><span className="diagram-legend"><i className="legend-dot" />1 <i className="legend-dot low" />0 <i className="legend-dot unknown" />X <span>· functional signals</span></span><div className="tool-group"><button aria-label="Zoom out circuit" title="Zoom out" onClick={() => setZoom((z) => Math.max(.6, z - .2))}><Minus size={15} /></button><button aria-label="Zoom in circuit" title="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + .2))}><Plus size={15} /></button><button aria-label="Fit circuit" title="Fit circuit" onClick={() => { setZoom(1); frame.current?.scrollTo(0, 0); }}><Scan size={15} /></button><button aria-label="Download circuit SVG" title="Download SVG for slides" onClick={download}><Download size={15} /></button></div></div>
    <div className="circuit-scroll" ref={frame} onPointerDown={(e) => { if ((e.target as Element).closest('[role=button]')) return; const div = frame.current!; drag.current = { x: e.clientX, y: e.clientY, left: div.scrollLeft, top: div.scrollTop }; div.setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (drag.current && frame.current) { frame.current.scrollLeft = drag.current.left + drag.current.x - e.clientX; frame.current.scrollTop = drag.current.top + drag.current.y - e.clientY; } }} onPointerUp={() => { drag.current = null; }}>
      {error ? <div className="empty-state">{error}</div> : !layout ? <div className="empty-state">Arranging your circuit…</div> : <svg ref={svgRef} className="circuit-svg" role="group" aria-label={`${gateMode ? 'Gate-level' : 'Word-level'} synthesized circuit. Select a component to inspect its RTL.`} viewBox={`0 0 ${layout.width} ${layout.height}`} style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%`, minWidth: zoom > 1 ? `${zoom * 580}px` : undefined }}>
        <rect width={layout.width} height={layout.height} fill="#fbfcfe" />
        {layout.edges.map((edge, index) => {
          const conn = netlist.connectors[index];
          const val = signals[`${conn.from.id}:${conn.from.port}`] ?? 'x';
          const color = /x/i.test(val) ? '#b7791f' : /1/.test(val) ? '#0b8d78' : '#94a3b8';
          const section = edge.sections?.[0]; if (!section) return null;
          const points = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint];
          const d = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
          return <g key={edge.id}><path d={d} stroke={color} strokeWidth={val.length > 1 ? 2.8 : 1.8} fill="none" strokeLinejoin="round" />{index < 22 && <text x={section.endPoint.x - 13} y={section.endPoint.y - 7} textAnchor="end" fill={color} fontSize="11" fontFamily="monospace">{val.length > 8 ? `${val.slice(0, 8)}…` : val.toUpperCase()}</text>}</g>;
        })}
        {layout.children.map((node) => {
          const dev = netlist.devices[node.id];
          return <g key={node.id} transform={`translate(${node.x},${node.y})`} role="button" tabIndex={0} aria-label={`${dev.net ?? dev.type}, inspect component`} onClick={() => onSelect(node.id, dev)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(node.id, dev); } }} style={{ cursor: 'pointer' }}>
            <title>{dev.net ?? dev.type}{dev.source_positions?.length ? ` · RTL lines ${dev.source_positions[0].from.line}–${dev.source_positions[0].to.line}` : ''}</title>
            <rect width={node.width} height={node.height} fill="transparent" />
            {node.ports?.map((p) => { const gate = ['And', 'Nand', 'Or', 'Nor', 'Xor', 'Xnor', 'Not', 'Repeater'].includes(dev.type); const input = p.x < node.width / 2; return <line key={`stub-${p.id}`} x1={p.x} y1={p.y} x2={input ? (dev.type === 'Mux' ? 14 : 8) : gate ? 68 : node.width - 8} y2={p.y} stroke="#94a3b8" strokeWidth="1.5" />; })}
            <GateSymbol device={dev} width={node.width} height={node.height} selected={selected === node.id} clockY={node.ports?.find((p) => p.id === `${node.id}:clk`)?.y} />
            {node.ports?.map((p) => { const port = p.id.slice(node.id.length + 1); return <g key={p.id}><circle cx={p.x} cy={p.y} r="2.5" fill="#64748b" />{!['Input', 'Output', 'Constant'].includes(dev.type) && <text x={p.x < node.width / 2 ? p.x + 10 : p.x - 10} y={p.y - 5} textAnchor={p.x < node.width / 2 ? 'start' : 'end'} fontSize="9" fill="#64748b">{portLabel(dev, port)}</text>}</g>; })}
          </g>;
        })}
      </svg>}
    </div>
    <div className="diagram-caption">{gateMode ? 'Generic logic mapping · no foundry cell library applied' : 'Synthesized word-level circuit · click a component to inspect its source'}</div>
  </div>;
}
