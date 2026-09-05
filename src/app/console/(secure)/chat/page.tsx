'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

type ChatMessage = {
  id: string;
  message: string;
  image_url: string | null;
  created_at: string;
  anonymous_name: string;
};

export default function AdminChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMessages() {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch (error) {
      console.error('Chat fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteMessage(id: string) {
    await fetch(`/api/chat?id=${id}`, { method: 'DELETE' });
    fetchMessages();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Ommaviy suhbat</h1>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      ) : messages.length === 0 ? (
        <p className="text-sm text-ink-500">Xabarlar yo‘q</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="card flex items-start justify-between gap-4 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-600">{msg.anonymous_name}</span>
                  <span className="text-xs text-ink-500">{new Date(msg.created_at).toLocaleString('uz-UZ')}</span>
                </div>
                {msg.image_url && (
                  <Image src={msg.image_url} alt="Chat image" width={128} height={128} className="mt-2 h-32 w-32 rounded-lg object-cover" unoptimized />
                )}
                <p className="mt-1 text-sm text-ink-800">{msg.message}</p>
              </div>
              <button onClick={() => deleteMessage(msg.id)} className="btn-ghost px-2" title="O‘chirish">
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
