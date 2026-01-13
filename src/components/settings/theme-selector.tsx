'use client';

import { useTheme } from '@/lib/theme/theme-provider';
import { cn } from '@/lib/utils/cn';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Açık', icon: Sun },
  { value: 'dark', label: 'Koyu', icon: Moon },
  { value: 'system', label: 'Sistem', icon: Monitor },
];

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Tema</h3>
        <p className="text-sm text-muted-foreground">
          Uygulama görünümünü özelleştirin
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-accent',
              theme === value
                ? 'border-primary bg-primary/5'
                : 'border-transparent bg-muted/50'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                theme === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                theme === value ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Şu anda {resolvedTheme === 'dark' ? 'koyu' : 'açık'} tema kullanılıyor
        {theme === 'system' && ' (sistem tercihine göre)'}
      </p>
    </div>
  );
}
