import { z } from 'zod';

export const swapSchema = z
  .object({
    fromToken: z.string().min(1, 'Select a token to send'),
    toToken: z.string().min(1, 'Select a token to receive'),
    fromAmount: z
      .string()
      .min(1, 'Enter an amount')
      .refine((v) => /^\d*\.?\d+$/.test(v), 'Invalid number')
      .refine((v) => parseFloat(v) > 0, 'Amount must be greater than 0'),
  })
  .refine((data) => data.fromToken !== data.toToken, {
    message: 'From and To tokens must be different',
    path: ['toToken'],
  });

export type SwapFormValues = z.infer<typeof swapSchema>;
