'use client';

import { useTheme } from '@/components/theme-provider';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="btn-ghost px-2"
      aria-label="Mavzu"
      title={theme === 'light' ? 'Qorong‘i rejim' : 'Yorug‘ rejim'}
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
