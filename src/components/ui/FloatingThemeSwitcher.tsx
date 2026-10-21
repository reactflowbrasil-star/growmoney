import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/** Persistent, accessible light/dark selector available on every route. */
export function FloatingThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  const selectTheme = (nextTheme: 'light' | 'dark') => {
    if (theme !== nextTheme) toggleTheme();
  };

  return (
    <div
      role="group"
      aria-label="Selecionar tema de cores"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-[100] inline-flex items-center gap-1 rounded-full border border-border-color bg-bg-primary/95 p-1.5 shadow-xl backdrop-blur-md"
    >
      <button
        type="button"
        aria-label="Ativar tema claro"
        aria-pressed={theme === 'light'}
        onClick={() => selectTheme('light')}
        className={`flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary ${theme === 'light' ? 'bg-brand text-[#172400]' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
      >
        <Sun aria-hidden="true" className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Ativar tema escuro"
        aria-pressed={theme === 'dark'}
        onClick={() => selectTheme('dark')}
        className={`flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary ${theme === 'dark' ? 'bg-brand text-[#172400]' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
      >
        <Moon aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
