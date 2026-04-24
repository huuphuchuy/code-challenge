import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { Token } from '@/types';
import { TokenIcon } from './TokenIcon';
import { formatPrice } from '@/lib/tokens';

type Props = {
  tokens: Token[];
  value?: string;
  onChange: (symbol: string) => void;
  disabledToken?: string;
};

export function TokenSelect({ tokens, value, onChange, disabledToken }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = tokens.find((t) => t.symbol === value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const filtered = tokens.filter((t) =>
    t.symbol.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-bg-input hover:bg-border border border-border hover:border-accent/50 px-3 py-1.5 transition"
      >
        {selected ? (
          <>
            <TokenIcon symbol={selected.symbol} url={selected.iconUrl} size={20} />
            <span className="font-medium text-white">{selected.symbol}</span>
          </>
        ) : (
          <span className="text-muted px-1">Select token</span>
        )}
        <svg
          className={clsx('w-4 h-4 text-muted transition', open && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 right-0 w-72 bg-bg-card border border-border rounded-xl shadow-2xl shadow-black/50 animate-fade-in overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search token..."
              className="w-full bg-bg-input text-white px-3 py-2 rounded-md outline-none placeholder:text-muted text-sm"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {filtered.map((t) => {
              const disabled = t.symbol === disabledToken;
              const isSelected = t.symbol === value;
              return (
                <li key={t.symbol}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(t.symbol);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={clsx(
                      'flex items-center justify-between w-full px-3 py-2.5 text-left transition',
                      disabled && 'opacity-40 cursor-not-allowed',
                      !disabled && 'hover:bg-bg-input',
                      isSelected && 'bg-bg-input',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <TokenIcon symbol={t.symbol} url={t.iconUrl} size={24} />
                      <span className="text-white font-medium">{t.symbol}</span>
                    </div>
                    <span className="text-xs text-muted">{formatPrice(t.price)}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-8 text-center text-muted text-sm">
                No tokens found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
