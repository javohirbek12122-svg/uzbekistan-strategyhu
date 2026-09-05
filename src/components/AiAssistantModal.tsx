'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ShoppingCart, Loader2, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_PROMPTS = [
  'Osh uchom guruch tanlash',
  'Kumushkonga yetkazib berish narxi',
  'Damas va Labo farqi',
  'Devzira va Lazer qaysi yaxshi?',
];

interface Message {
  role: 'user' | 'service';
  text: string;
  actions?: { name: string; response: Record<string, unknown> }[];
}

export function AiAssistantModal() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
      history.push({ role: 'user', parts: [{ text }] });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: 'service',
        text: data.text || 'Kechirasiz, xatolik yuz berdi.',
        actions: data.functionCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [...prev, { role: 'service', text: 'Kechirasiz, xatolik yuz berdi.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCart = () => {
    setCartOpen(true);
    setOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed right-4 bottom-20 z-[9998] flex h-[500px] w-80 flex-col overflow-hidden rounded-3xl border border-white/20 bg-slate-900/95 shadow-2xl backdrop-blur-md sm:w-96"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                  className="text-xl"
                >
                  🎧
                </motion.div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hizmatkor</h3>
                  <p className="text-xs text-slate-400">Guruch va logistika yordamchisi</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">Assalomu alaykum! Qanday yordam beray?</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => send(prompt)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:border-emerald-500/40 hover:bg-white/10"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                      message.role === 'user' ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-200'
                    }`}
                  >
                    <p>{message.text}</p>
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.actions.map((action, i) => {
                          if (action.name === 'addToCart' && action.response?.ok) {
                            return (
                              <button
                                key={i}
                                onClick={handleOpenCart}
                                className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-300 transition hover:bg-emerald-500/30"
                              >
                                <ShoppingCart className="h-3 w-3" />
                                Savatni ochish
                              </button>
                            );
                          }
                          if (action.name === 'openCart') {
                            return (
                              <button
                                key={i}
                                onClick={handleOpenCart}
                                className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-300 transition hover:bg-emerald-500/30"
                              >
                                <ShoppingCart className="h-3 w-3" />
                                Savatni ochish
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/10 px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Savol yozing..."
                  className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-2xl bg-brand-500 p-2 text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-4 z-[9997] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 text-white shadow-lg transition hover:shadow-xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
          >
            <Headphones className="h-6 w-6" />
          </motion.div>
        </motion.button>
      )}

      <AnimatePresence>
        {cartOpen && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-3xl bg-slate-900 p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">🛒 Savat</h3>
                <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-slate-300">Savatga mahsulot qo&apos;shildi!</p>
              <p className="mt-2 text-xs text-slate-400">Rasmiylashtirish sahifasiga o&apos;tish uchun quyidagi tugmani bosing.</p>
              <a
                href="/checkout"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-500 py-3 text-sm font-bold text-white"
                onClick={() => setCartOpen(false)}
              >
                <ShoppingCart className="h-4 w-4" />
                Rasmiylashtirish
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
