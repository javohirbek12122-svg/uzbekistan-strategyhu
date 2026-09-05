'use client';

import { Printer, Truck, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getBatchProgress } from '@/lib/logisticsEngine';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  weightKg: number;
  destination: string;
  status: 'pending' | 'damas' | 'labo' | 'vip';
}

interface ParentDashboardProps {
  orders: OrderItem[];
}

export function ParentDashboard({ orders }: ParentDashboardProps) {
  const totalWeight = orders.reduce((sum, order) => sum + order.weightKg, 0);
  const batchProgress = getBatchProgress(totalWeight);
  const laboOrders = orders.filter((o) => o.status === 'labo' || o.weightKg >= 70);
  const damasOrders = orders.filter((o) => o.status === 'damas' || o.weightKg < 70);

  const handlePrint = (order: OrderItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Yetkazib Berish - ${order.destination}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .order-info { margin: 20px 0; }
            .label { font-weight: bold; font-size: 18px; }
            .footer { margin-top: 30px; border-top: 1px solid #000; padding-top: 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PARKENT E-MART</h1>
            <p>Yetkazib Berish Cheki</p>
          </div>
          <div class="order-info">
            <p><strong>Buyurtma:</strong> #${order.id.slice(0, 8)}</p>
            <p><strong>Mahsulot:</strong> ${order.name}</p>
            <p><strong>Miqdor:</strong> ${order.quantity} kg</p>
            <p><strong>Og&apos;irlik:</strong> ${order.weightKg.toFixed(2)} kg</p>
            <p><strong>Manzil:</strong> ${order.destination}</p>
            <p><strong>Status:</strong> ${order.status === 'damas' ? 'Damas Micro-Transit' : order.status === 'labo' ? 'Labo Batch' : 'VIP Express'}</p>
          </div>
          <div class="footer">
            <p>Sana: ${new Date().toLocaleDateString('uz-UZ')}</p>
            <p>Vaqt: ${new Date().toLocaleTimeString('uz-UZ')}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">👨‍👩‍👧 Ota-Ona Dashboard</h1>
            <p className="text-sm text-slate-300">Bugungi buyurtmalar va yetkazish rejasi</p>
        </div>

        {/* Batch Progress */}
        <motion.div
          className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="mb-4 text-2xl font-bold text-white">📊 Labo Batch Holati</h2>
          <div className="mb-2 h-6 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-brand-500"
              initial={{ width: 0 }}
              animate={{ width: `${batchProgress.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="text-lg font-semibold text-white">
            Jami: {totalWeight.toFixed(1)} kg / 70 kg
          </p>
          <p className="text-sm text-emerald-300">{batchProgress.message}</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            onClick={() => {}}
            className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/10 p-6 text-left transition hover:bg-blue-500/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Truck className="mb-2 h-8 w-8 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Damas Dispatch</h3>
            <p className="text-sm text-slate-300">{damasOrders.length} ta buyurtma</p>
          </motion.button>

          <motion.button
            onClick={() => {}}
            className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 p-6 text-left transition hover:bg-emerald-500/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Users className="mb-2 h-8 w-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Labo Batch Ready</h3>
            <p className="text-sm text-slate-300">{laboOrders.length} ta buyurtma</p>
          </motion.button>
        </div>

        {/* Orders List */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
           <h2 className="mb-4 text-2xl font-bold text-white">📋 Buyurtmalar ro&apos;yxati</h2>
          <div className="space-y-3">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{order.name}</h3>
                      {order.status === 'damas' && <AlertCircle className="h-5 w-5 text-blue-400" />}
                      {order.status === 'labo' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                    </div>
                    <p className="text-sm text-slate-300">
                      {order.quantity} kg • {order.destination}
                    </p>
                    <p className="text-xs text-slate-400">
                      Og&apos;irlik: {order.weightKg.toFixed(2)} kg
                    </p>
                  </div>
                  <motion.button
                    onClick={() => handlePrint(order)}
                    className="rounded-lg bg-white/10 p-3 transition hover:bg-white/20"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Printer className="h-6 w-6 text-white" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
