'use client';

import { useState } from 'react';
import { Bot, RefreshCw } from 'lucide-react';

export function AIOperationsAudit() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ text: string; actions?: Array<{ priority: string; signal: string; action: string; risk: string }> } | null>(null);

  async function run() {
    setBusy(true);
    try {
      const response = await fetch('/api/console/ai-audit', { method: 'POST' });
      const data = await response.json();
      setResult(data.ok ? data : { text: data.error ?? 'AI audit ishlamadi.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-bold">AI Operations Audit</h2><p className="text-xs text-ink-500">Hozirgi KPI va risklarni AI yordamida tahlil qiling.</p></div>
        <button type="button" onClick={run} disabled={busy} className="btn-secondary">
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          {busy ? 'Tahlil…' : 'AI audit'}
        </button>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-slate-950 p-4 text-sm text-slate-200 whitespace-pre-wrap">{result.text}</div>
          {result.actions && result.actions.length > 0 && (
            <div className="space-y-2">
              {result.actions.map((action) => (
                <div key={action.signal} className="rounded-2xl border border-slate-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{action.signal}</strong><span className="text-[11px] font-bold">{action.priority} · risk {action.risk}</span></div>
                  <p className="mt-1 text-xs text-ink-500">{action.action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
