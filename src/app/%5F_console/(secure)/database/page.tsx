import Link from 'next/link';
import { BROWSABLE_TABLES, isBrowsableTable, readTable } from '@/server/console/db-explorer';
import { cn } from '@/lib/format';

export const dynamic = 'force-dynamic';

const TABLES = Object.entries(BROWSABLE_TABLES) as [keyof typeof BROWSABLE_TABLES, { label: string }][];

function cell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default async function ConsoleDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; q?: string; page?: string }>;
}) {
  const { table = 'orders', q = '', page } = await searchParams;
  const selected = isBrowsableTable(table) ? table : 'orders';
  const current = Number(page ?? '1') || 1;
  const data = await readTable(selected, current, q);
  const meta = BROWSABLE_TABLES[selected];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Ma&apos;lumotlar bazasi</h1>
        <p className="text-sm text-ink-500">
          Faqat o&apos;qish uchun brauzer. Maxfiy ustunlar (parol/token/kalit hash&apos;lari) yashirilgan va xom SQL
          qabul qilinmaydi.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {TABLES.map(([key, info]) => (
          <Link
            key={key}
            href={`/__console/database?table=${key}`}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              selected === key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white',
            )}
          >
            {info.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {meta.label} · {data.total} qator
        </p>
        {meta.search && (
          <form action="/__console/database" className="flex gap-2">
            <input type="hidden" name="table" value={selected} />
            <input name="q" defaultValue={q} placeholder={`${meta.search} bo'yicha`} className="input w-48" />
            <button type="submit" className="btn-secondary">
              Qidirish
            </button>
          </form>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base text-xs">
          <thead>
            <tr>
              {data.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr key={index}>
                {data.columns.map((column) => (
                  <td key={column} className="max-w-[240px] truncate align-top" title={cell(row[column])}>
                    {cell(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.rows.length === 0 && <p className="p-6 text-center text-sm text-ink-500">Qator yo&apos;q.</p>}
      </div>

      <div className="flex justify-between">
        {current > 1 ? (
          <Link href={`/__console/database?table=${selected}&q=${q}&page=${current - 1}`} className="btn-secondary">
            Oldingi
          </Link>
        ) : (
          <span />
        )}
        {current * data.pageSize < data.total && (
          <Link href={`/__console/database?table=${selected}&q=${q}&page=${current + 1}`} className="btn-secondary">
            Keyingi
          </Link>
        )}
      </div>
    </div>
  );
}
