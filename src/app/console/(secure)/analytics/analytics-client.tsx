'use client';

import { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

type Overview = {
  today: { orders: number; revenue: number };
  week: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  users: { total: number; activeToday: number; onlineNow: number };
  pageViews: { today: number };
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  countries: { name: string; count: number }[];
};

type AnalyticsClientProps = {
  overview: Overview;
  revenue: { date: string; total: number }[];
  statuses: { status: string; count: number }[];
};

export default function AnalyticsClient({ overview, revenue, statuses }: AnalyticsClientProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(value);

  const kpis = [
    { label: 'Bugungi buyurtmalar', value: overview.today.orders },
    { label: 'Bugungi tushum', value: formatCurrency(overview.today.revenue) },
    { label: 'Haftalik buyurtmalar', value: overview.week.orders },
    { label: 'Oylik tushum', value: formatCurrency(overview.month.revenue) },
    { label: 'Foydalanuvchilar', value: overview.users.total },
    { label: 'Bugun faol', value: overview.users.activeToday },
    { label: 'Hozir onlayn', value: overview.users.onlineNow },
    { label: 'Bugungi ko‘rishlar', value: overview.pageViews.today },
  ];

  const revenueData = {
    labels: revenue.map((item) => item.date.slice(5)),
    datasets: [
      {
        label: 'Tushum (so‘m)',
        data: revenue.map((item) => item.total),
        borderColor: '#00FF87',
        backgroundColor: 'rgba(0,255,135,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const statusData = {
    labels: statuses.map((s) => s.status),
    datasets: [
      {
        label: 'Buyurtmalar',
        data: statuses.map((s) => s.count),
        backgroundColor: ['#00FF87', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'],
        borderWidth: 0,
      },
    ],
  };

  const deviceChartData = {
    labels: overview.devices.map((d) => d.name),
    datasets: [
      {
        label: 'Tashrif',
        data: overview.devices.map((d) => d.count),
        backgroundColor: '#00FF87',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="card p-4">
            <p className="text-xs text-ink-500">{item.label}</p>
            <p className="text-xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Tushum grafigi (14 kun)</h2>
          {mounted && (
            <div className="h-64">
              <Line
                data={revenueData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false } },
                    y: {
                      ticks: {
                        callback: (value: number | string) =>
                          new Intl.NumberFormat('uz-UZ', { notation: 'compact', compactDisplay: 'short' }).format(Number(value)),
                      },
                    },
                  },
                }}
              />
            </div>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Buyurtmalar holati</h2>
          {mounted && (
            <div className="h-64">
              <Doughnut
                data={statusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Qurilmalar</h2>
          {mounted && (
            <div className="h-64">
              <Bar
                data={deviceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                }}
              />
            </div>
          )}
        </section>

        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Davlatlar bo‘yicha tashriflar</h2>
          <div className="space-y-2">
            {overview.countries.slice(0, 10).map((country) => (
              <div key={country.name} className="flex items-center justify-between text-sm">
                <span>{country.name}</span>
                <span className="font-semibold">{country.count}</span>
              </div>
            ))}
            {overview.countries.length === 0 && <p className="text-sm text-ink-500">Ma’lumot yo‘q</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
