import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ASIC Explorer · RTL to Physical Design', description: 'A lecture companion linking SystemVerilog, circuits, waveforms, timing, and physical chip design.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
