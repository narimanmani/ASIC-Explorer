'use client';
import { useEffect, useRef } from 'react';
const lessons = ['intent', 'rtl', 'synthesis', 'timing', 'floorplan', 'clock', 'routing', 'signoff'];
export function VisitorTracker({ lesson }: { lesson: string }) {
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const preferences = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (preferences.globalPrivacyControl || navigator.doNotTrack === '1') return;
    if (!lessons.includes(lesson)) return;
    const pending = setTimeout(() => {
        const key = `${lesson}:${Math.floor(Date.now() / 900000)}`;
        if (seen.current.has(key)) return;
        seen.current.add(key);
        void fetch('/api/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson }), credentials: 'same-origin', keepalive: true }).catch(() => {});
      }, 700);
    return () => clearTimeout(pending);
  }, [lesson]);
  return <p className="privacy-notice">This demo records sampled lesson visits and approximate network locations for 30 days. No raw IP or HDL is saved. <a href="/privacy">Visitor privacy</a></p>;
}
