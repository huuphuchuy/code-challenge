import { useState } from 'react';

type SwapPayload = {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
};

type State = 'idle' | 'submitting' | 'success' | 'error';

export function useSwap() {
  const [state, setState] = useState<State>('idle');
  const [lastSwap, setLastSwap] = useState<SwapPayload | null>(null);

  async function submit(payload: SwapPayload): Promise<void> {
    setState('submitting');
    try {
      await new Promise((res) => setTimeout(res, 1500));
      setLastSwap(payload);
      setState('success');
      setTimeout(() => setState('idle'), 3000);
    } catch {
      setState('error');
    }
  }

  return { state, submit, lastSwap };
}
