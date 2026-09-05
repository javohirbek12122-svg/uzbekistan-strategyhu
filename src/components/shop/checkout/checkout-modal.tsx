'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Copy, Check, Upload, Clock, CheckCircle, XCircle, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

type Step = 'card' | 'form' | 'waiting' | 'result';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  orderNumber: string;
  totalAmount: number;
  cardNumber: string;
  provider: 'cash' | 'p2p_telegram';
}

export function CheckoutModal({ open, onClose, orderNumber, totalAmount, cardNumber, provider }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('card');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(15 * 60);
  const [customerPhone, setCustomerPhone] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep('card');
    setCountdown(15 * 60);
    setCustomerPhone('');
    setCardLastFour('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setSubmitting(false);
    setVerificationStatus('pending');
    setRejectionReason(null);
  }, [open]);

  useEffect(() => {
    if (step !== 'waiting') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (provider === 'cash') return;
    if (step !== 'waiting' || verificationStatus !== 'pending') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.payment_status === 'paid') {
            setVerificationStatus('approved');
            setStep('result');
            confetti({ particleCount: 120, spread: 80, startVelocity: 50, colors: ['#10b981', '#f7b500', '#ffffff'] });
            clearInterval(interval);
          } else if (data.payment_status === 'rejected') {
            setVerificationStatus('rejected');
            setRejectionReason(data.rejected_reason || 'Admin tomonidan rad etildi');
            setStep('result');
            clearInterval(interval);
          }
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, verificationStatus, orderNumber, provider]);

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleP2PSubmit = async () => {
    if (!receiptFile) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderNumber', orderNumber);
      formData.append('customerPhone', customerPhone);
      formData.append('cardLastFour', cardLastFour);
      formData.append('receipt', receiptFile);

      const res = await fetch('/api/checkout/submit', { method: 'POST', body: formData });
      if (res.ok) {
        setStep('waiting');
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isP2P = provider === 'p2p_telegram';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-card w-full max-w-lg rounded-3xl p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {isP2P ? '💳 P2P To‘lov' : '💵 Naqd To‘lov'}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isP2P && step === 'card' && (
                <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="text-sm text-slate-200">
                        Quyidagi karta raqamiga <span className="font-bold text-emerald-300">{totalAmount.toLocaleString('uz-UZ')} so‘m</span> o‘tkazing:
                      </p>
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                        <div>
                          <p className="text-xs text-slate-300">Karta raqami</p>
                          <p className="font-mono font-bold text-emerald-300">{cardNumber}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(cardNumber)}
                          className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? 'Nusxalandi' : 'Nusxa olish'}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
                      <p className="font-semibold text-white">Qadamlari:</p>
                      <ol className="mt-2 list-inside list-decimal space-y-1">
                        <li>Yuqoridagi karta raqamiga to‘lov summasi o‘tkazing.</li>
                        <li>O‘tkazma chekini saqlang.</li>
                        <li>Quyidagi formani to‘ldirib, chekni yuklang.</li>
                        <li>Operator 5-15 daqiqa ichida tasdiqlaydi.</li>
                      </ol>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span>Qolgan vaqt: {formatTime(countdown)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('form')}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-bold text-white shadow-lg hover:from-brand-600 hover:to-brand-700"
                  >
                    To‘lovni tasdiqladim, chekni yuklash
                  </button>
                  <p className="mt-2 text-center text-xs text-slate-400">
                    To‘lovni hali amalga oshirmadingizmi? Kartaga o‘tkazing va keyin davom eting.
                  </p>
                </motion.div>
              )}

              {isP2P && step === 'form' && (
                <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Telefon raqamingiz (+998)</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Karta oxirgi 4 ta raqami</label>
                      <input
                        type="text"
                        value={cardLastFour}
                        onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="4589"
                        maxLength={4}
                        className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Chek rasmini yuklang</label>
                      <div className="relative rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center transition hover:border-emerald-500/40">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        {receiptPreview ? (
                          <Image src={receiptPreview} alt="Chek" width={160} height={160} className="mx-auto max-h-40 rounded-lg" unoptimized />
                        ) : (
                          <>
                            <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                            <p className="text-xs text-slate-400">Rasm yoki PDF yuklash (maks 10MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleP2PSubmit}
                      disabled={!customerPhone || cardLastFour.length !== 4 || !receiptFile || submitting}
                      className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-bold text-white shadow-lg hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
                    >
                      {submitting ? 'Yuborilmoqda...' : 'Chekni yuborish'}
                    </button>
                  </div>
                </motion.div>
              )}

              {isP2P && step === 'waiting' && (
                <motion.div key="waiting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-8 text-center">
                  <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-emerald-500" />
                  <p className="text-sm text-slate-300">Telegram operatori tekshirmoqda...</p>
                  <p className="mt-2 text-xs text-slate-400">Qolgan vaqt: {formatTime(countdown)}</p>
                </motion.div>
              )}

              {isP2P && step === 'result' && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-6 text-center">
                  {verificationStatus === 'approved' ? (
                    <>
                      <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-400" />
                      <h3 className="mb-2 text-xl font-bold text-white">To‘lov tasdiqlandi!</h3>
                      <p className="text-sm text-slate-300">Buyurtmangiz qabul qilindi. Tez orada operator siz bilan bog‘lanadi.</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
                      <h3 className="mb-2 text-xl font-bold text-white">To‘lov rad etildi</h3>
                      <p className="text-sm text-slate-300">{rejectionReason || 'Iltimos, qayta urinib ko‘ring.'}</p>
                      <button
                        onClick={() => setStep('form')}
                        className="mt-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-brand-600 hover:to-brand-700"
                      >
                        Qayta urinish
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {!isP2P && step === 'card' && (
                <motion.div key="cash" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-6 text-center">
                  <Banknote className="mx-auto mb-4 h-16 w-16 text-emerald-400" />
                  <h3 className="mb-2 text-xl font-bold text-white">Naqd to‘lov</h3>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>Buyurtmangiz qabul qilindi.</p>
                    <p>Kuryer yetkazganda naqd pul bilan to‘lang.</p>
                    <p className="text-xs text-slate-400">Buyurtma raqami: {orderNumber}</p>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs text-slate-300">
                    <p className="font-semibold text-white">Eslatma:</p>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-slate-300">
                      <li>Kuryer kelganda mahsulotni tekshiring.</li>
                      <li>To‘lovni naqd pulga amalga oshiring.</li>
                      <li>Chekni saqlang.</li>
                    </ul>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-bold text-white shadow-lg hover:from-brand-600 hover:to-brand-700"
                  >
                    Tushunarli
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
