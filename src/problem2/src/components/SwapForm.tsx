import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { swapSchema, type SwapFormValues } from '@/lib/validation';
import { AmountInput } from './AmountInput';
import { Spinner } from './ui/Spinner';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { useSwap } from '@/hooks/useSwap';
import { calcExchange, formatAmount } from '@/lib/tokens';

export function SwapForm() {
  const { data: tokens = [], isLoading, error, refetch } = useTokenPrices();
  const { state, submit, lastSwap } = useSwap();

  const { control, handleSubmit, watch, setValue, formState, reset } =
    useForm<SwapFormValues>({
      resolver: zodResolver(swapSchema),
      defaultValues: { fromToken: '', toToken: '', fromAmount: '' },
      mode: 'onChange',
    });

  const fromToken = watch('fromToken');
  const toToken = watch('toToken');
  const fromAmount = watch('fromAmount');

  const fromTokenData = tokens.find((t) => t.symbol === fromToken);
  const toTokenData = tokens.find((t) => t.symbol === toToken);

  const toAmount = useMemo(() => {
    const n = parseFloat(fromAmount);
    if (!isFinite(n) || !fromTokenData || !toTokenData) return 0;
    return calcExchange(n, fromTokenData.price, toTokenData.price);
  }, [fromAmount, fromTokenData, toTokenData]);

  const rate =
    fromTokenData && toTokenData ? fromTokenData.price / toTokenData.price : 0;

  const usdFrom =
    fromTokenData && fromAmount ? parseFloat(fromAmount) * fromTokenData.price : 0;
  const usdTo = toTokenData ? toAmount * toTokenData.price : 0;

  function handleFlip() {
    if (!fromToken || !toToken) return;
    setValue('fromToken', toToken, { shouldValidate: true });
    setValue('toToken', fromToken, { shouldValidate: true });
  }

  const onSubmit = handleSubmit(async (values) => {
    await submit({
      fromToken: values.fromToken,
      toToken: values.toToken,
      fromAmount: parseFloat(values.fromAmount),
      toAmount,
    });
    reset({ fromToken: values.fromToken, toToken: values.toToken, fromAmount: '' });
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-14 text-muted">
        <Spinner className="w-8 h-8 text-accent" />
        <div className="text-sm mt-3">Loading tokens…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-14 gap-3">
        <div className="text-red-400 text-sm">Failed to load tokens.</div>
        <button
          onClick={() => refetch()}
          className="text-accent underline text-sm hover:text-accent-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  const errorMessages = Object.values(formState.errors)
    .map((e) => e?.message as string | undefined)
    .filter(Boolean);

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <Controller
        name="fromAmount"
        control={control}
        render={({ field: amountField }) => (
          <Controller
            name="fromToken"
            control={control}
            render={({ field: tokenField }) => (
              <AmountInput
                label="Amount to send"
                amount={amountField.value}
                onAmountChange={amountField.onChange}
                tokens={tokens}
                token={tokenField.value}
                onTokenChange={tokenField.onChange}
                disabledToken={toToken}
                usdValue={usdFrom}
              />
            )}
          />
        )}
      />

      <div className="flex justify-center -my-1 relative z-10">
        <button
          type="button"
          onClick={handleFlip}
          disabled={!fromToken || !toToken}
          aria-label="Swap tokens direction"
          className="w-10 h-10 rounded-xl bg-bg-input border border-border hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center text-muted"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 2v10.586L3.707 10.293 2.293 11.707 7 16.414l4.707-4.707-1.414-1.414L8 12.586V2H6zm8 16V7.414l2.293 2.293 1.414-1.414L13 3.586 8.293 8.293l1.414 1.414L12 7.414V18h2z" />
          </svg>
        </button>
      </div>

      <Controller
        name="toToken"
        control={control}
        render={({ field }) => (
          <AmountInput
            label="Amount to receive"
            amount={fromAmount && toTokenData ? formatAmount(toAmount) : ''}
            readOnly
            tokens={tokens}
            token={field.value}
            onTokenChange={field.onChange}
            disabledToken={fromToken}
            usdValue={usdTo}
          />
        )}
      />

      {rate > 0 && (
        <div className="text-xs text-muted flex justify-between px-1 pt-2">
          <span>Exchange rate</span>
          <span className="text-white/90">
            1 {fromToken} ≈ {formatAmount(rate)} {toToken}
          </span>
        </div>
      )}

      {errorMessages.length > 0 && (
        <div className="text-xs text-red-400 px-1 pt-1 animate-fade-in">
          {errorMessages[0]}
        </div>
      )}

      {state === 'success' && lastSwap && (
        <div
          role="status"
          className="text-xs text-green-400 text-center bg-green-400/10 border border-green-400/30 rounded-lg py-2.5 px-3 animate-fade-in"
        >
          Swapped {formatAmount(lastSwap.fromAmount)} {lastSwap.fromToken} → {formatAmount(lastSwap.toAmount)} {lastSwap.toToken}
        </div>
      )}

      <button
        type="submit"
        disabled={!formState.isValid || state === 'submitting'}
        className="w-full mt-3 h-14 rounded-2xl bg-accent hover:bg-accent-hover text-white font-semibold transition disabled:bg-bg-input disabled:text-muted disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
      >
        {state === 'submitting' ? (
          <>
            <Spinner className="w-5 h-5" /> <span>Confirming swap…</span>
          </>
        ) : (
          'Confirm Swap'
        )}
      </button>
    </form>
  );
}
