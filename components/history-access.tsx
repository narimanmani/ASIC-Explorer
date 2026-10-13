'use client';
import { useState, type FormEvent } from 'react';

export function HistoryAccess({ logout = false, initialError = false }: { logout?: boolean; initialError?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError ? 'The password was not accepted.' : '');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(logout ? '/history/logout' : '/history/login', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ password: String(data.get('password') || '') }) });
      if (!response.ok) { const retry = Number(response.headers.get('retry-after')); setError(response.status === 429 ? `Sign-in is limited. Try again in ${retry > 60 ? Math.ceil(retry / 60) + ' minutes' : (retry || 5) + ' seconds'}.` : response.status === 401 ? 'The password was not accepted.' : 'Could not complete the request. Please try again.'); setBusy(false); return; }
      window.location.assign('/history');
    } catch { setError('Could not connect. Please try again.'); setBusy(false); }
  }
  return <form method="post" action={logout ? '/history/logout' : '/history/login'} onSubmit={submit}>{!logout && <><label htmlFor="password">History password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} /></>}{error && <p role="alert" className="history-error">{error}</p>}<button className={logout ? '' : 'primary'} type="submit" disabled={busy}>{busy ? 'Please wait…' : logout ? 'Sign out' : 'Sign in'}</button></form>;
}
