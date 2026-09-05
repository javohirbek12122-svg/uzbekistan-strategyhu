'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Send, Image as ImageIcon } from 'lucide-react';

type Message = {
  id: string;
  message: string;
  image_url: string | null;
  created_at: string;
  anonymous_name: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    const res = await fetch('/api/chat');
    if (!res.ok) return;
    const data = await res.json();
    if (data.messages) setMessages(data.messages);
    setLoading(false);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setImageUrl(data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if ((!text.trim() && !imageUrl) || sending) return;

    setSending(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text.trim(), image_url: imageUrl || null }),
    });

    if (res.ok) {
      setText('');
      setImageUrl('');
      await fetchMessages();
    }
    setSending(false);
  }

  return (
    <div className="mx-auto max-w-2xl flex h-dvh flex-col">
      <h1 className="mb-3 text-xl font-bold">Ommaviy suhbat</h1>
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <p className="text-sm text-ink-500">Yuklanmoqda...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-500">Xabarlar yo&apos;q. Birinchi bo&apos;lib yozing!</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((msg) => (
              <li key={msg.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-600">{msg.anonymous_name}</span>
                  <span className="text-xs text-ink-500">{new Date(msg.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {msg.image_url && (
                  <Image src={msg.image_url} alt="Chat image" width={192} height={192} className="mt-1 h-48 w-48 rounded-lg object-cover" unoptimized />
                )}
                <p className="text-sm text-ink-800">{msg.message}</p>
              </li>
            ))}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>
      <form onSubmit={send} className="mt-3 flex flex-col gap-2">
        {imageUrl && (
          <div className="flex items-center gap-2">
            <Image src={imageUrl} alt="Preview" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" unoptimized />
            <button type="button" onClick={() => setImageUrl('')} className="text-xs text-red-600">O&apos;chirish</button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary" disabled={uploading}>
            <Image className="h-4 w-4" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Xabar yozing..."
            className="input flex-1"
            maxLength={500}
          />
          <button type="submit" disabled={sending || (!text.trim() && !imageUrl)} className="btn-primary">
            <Send className="h-4 w-4" />
            Yuborish
          </button>
        </div>
      </form>
    </div>
  );
}
