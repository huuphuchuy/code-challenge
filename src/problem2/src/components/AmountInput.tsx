import clsx from 'clsx';
import type { Token } from '@/types';
import { TokenSelect } from './TokenSelect';

type Props = {
  label: string;
  amount: string;
  onAmountChange?: (v: string) => void;
  readOnly?: boolean;
  tokens: Token[];
  token?: string;
  onTokenChange: (symbol: string) => void;
  disabledToken?: string;
  usdValue?: number;
};

export function AmountInput({
  label,
  amount,
  onAmountChange,
  readOnly,
  tokens,
  token,
  onTokenChange,
  disabledToken,
  usdValue,
}: Props) {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-bg-card border border-border p-4 transition',
        !readOnly && 'focus-within:border-accent/60',
      )}
    >
      <div className="flex justify-between text-xs text-muted mb-2">
        <span>{label}</span>
        {usdValue !== undefined && usdValue > 0 && (
          <span>≈ ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || /^\d*\.?\d*$/.test(v)) onAmountChange?.(v);
          }}
          readOnly={readOnly}
          className="flex-1 min-w-0 bg-transparent text-2xl text-white font-semibold outline-none placeholder:text-muted/40"
        />
        <TokenSelect
          tokens={tokens}
          value={token}
          onChange={onTokenChange}
          disabledToken={disabledToken}
        />
      </div>
    </div>
  );
}
