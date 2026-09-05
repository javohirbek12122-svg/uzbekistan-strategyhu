'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Mic, MicOff, Sparkles, MapPin } from 'lucide-react';

const OSH_RATIO = {
  rice: 0.5,
  meat: 0.25,
  carrot: 0.15,
  onion: 0.07,
  oil: 0.03,
};

type RecognitionResult = { transcript: string; confidence: number };
type RecognitionEventLike = { results: Array<Array<RecognitionResult>> };
type RecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

export default function SommelierPage() {
  const [mounted, setMounted] = useState(false);
  const [guests, setGuests] = useState(50);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const eta = 'Bugun 15:00 gacha: So&apos;qoq va Kumushkonga soat 18:30 da yetkaziladi';
  const recognitionRef = useRef<RecognitionInstance | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SR = (window as unknown as { SpeechRecognition?: new () => RecognitionInstance; webkitSpeechRecognition?: new () => RecognitionInstance }).SpeechRecognition
        || (window as unknown as { webkitSpeechRecognition?: new () => RecognitionInstance }).webkitSpeechRecognition;
      if (SR) {
        recognitionRef.current = new SR();
        recognitionRef.current.lang = 'uz-UZ';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.onresult = (e: RecognitionEventLike) => {
          const text = e.results[0]?.[0]?.transcript ?? '';
          setTranscript(text);
          setListening(false);
        };
        recognitionRef.current.onerror = () => setListening(false);
        recognitionRef.current.onend = () => setListening(false);
      }
    }
  }, []);

  if (!mounted) return null;

  const totalKg = guests * 0.3;
  const ingredients = {
    rice: totalKg * OSH_RATIO.rice,
    meat: totalKg * OSH_RATIO.meat,
    carrot: totalKg * OSH_RATIO.carrot,
    onion: totalKg * OSH_RATIO.onion,
    oil: totalKg * OSH_RATIO.oil * 1000,
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setTranscript('Brauzeringiz ovozli qidiruvni qo&apos;llab-quvvatlamaydi. Iltimos, matn bilan yozing.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setTranscript('');
      setListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        setListening(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">AI Sommelier &amp; Osh Kalkulyatori</h1>
        <p className="text-sm text-ink-500">Mehmonlar sonini kiriting — kerakli masalliqlar avtomatik hisoblanadi</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-semibold text-ink-700">Mehmonlar soni</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="flex-1 accent-brand-500"
            />
            <input
              type="number"
              min={10}
              max={500}
              value={guests}
              onChange={(e) => setGuests(Math.max(10, Math.min(500, Number(e.target.value) || 10)))}
              className="input w-24 text-center"
            />
          </div>
          <p className="mt-2 text-xs text-ink-500">10–500 kishi uchun mo&apos;ljallangan</p>
        </div>

        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Uzum ETA Badge</p>
              <p className="mt-1 text-sm font-medium text-brand-900">{eta}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-brand-500" />
          Osh uchun masalliqlar
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Guruch', value: ingredients.rice.toFixed(1), unit: 'kg' },
            { label: "Go'sht", value: ingredients.meat.toFixed(1), unit: 'kg' },
            { label: 'Sabzi', value: ingredients.carrot.toFixed(1), unit: 'kg' },
            { label: 'Piyoz', value: ingredients.onion.toFixed(1), unit: 'kg' },
            { label: "Yog'", value: ingredients.oil.toFixed(0), unit: 'ml' },
          ].map((ing) => (
            <li key={ing.label} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-ink-500">{ing.label}</p>
              <p className="text-xl font-extrabold text-ink-900">
                {ing.value} <span className="text-sm font-medium text-ink-500">{ing.unit}</span>
              </p>
            </li>
          ))}
        </ul>
        <Link href="/catalog?q=guruch" className="btn-primary mt-4 inline-flex">
          Masalliqlarni savatga qo&apos;shish
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">Ovozli buyurtma</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`btn-secondary ${listening ? 'animate-pulse bg-red-100 text-red-700' : ''}`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {listening ? 'Tinglash…' : 'Ovozli qidiruv'}
          </button>
          {transcript && (
            <p className="flex-1 text-sm text-ink-700">&ldquo;{transcript}&rdquo;</p>
          )}
        </div>
      </section>
    </div>
  );
}
