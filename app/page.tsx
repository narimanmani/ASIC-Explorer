import { Explorer } from '@/components/explorer';
import { historyEnabled } from '@/lib/history-store.mjs';
export const dynamic = 'force-dynamic';
export default function Home() { return <Explorer recordVisits={historyEnabled()} />; }
