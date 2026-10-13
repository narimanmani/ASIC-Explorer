export type Device = {
  type: string; net?: string; label?: string; bits?: number | Record<string, number>;
  constant?: string; polarity?: Record<string, boolean>; celltype?: string;
  source_positions?: { name: string; from: { line: number; column: number }; to: { line: number; column: number } }[];
};
export type Connector = { from: { id: string; port: string }; to: { id: string; port: string }; name?: string };
export type Netlist = { devices: Record<string, Device>; connectors: Connector[]; subcircuits: Record<string, Netlist> };
export type Port = { name: string; direction: 'input' | 'output'; width: number };
export type Compilation = {
  source: string; top: string; version: string; ports: Port[]; behavior: Netlist; gates: Netlist;
  stats: { behavior: { cells: number; types: Record<string, number> }; gates: { cells: number; types: Record<string, number> } }; log: string;
};
export type Sample = { index: number; edge: boolean; values: Record<string, string> };
export type SimSnapshot = { values: Record<string, string>; signals: Record<string, string>; samples: Sample[]; cycles: number };
