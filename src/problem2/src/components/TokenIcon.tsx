import { useState } from 'react';

type Props = {
  symbol: string;
  url: string;
  size?: number;
};

export function TokenIcon({ symbol, url, size = 24 }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        className="rounded-full bg-bg-input border border-border flex items-center justify-center text-muted font-semibold"
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${symbol} icon`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-full"
    />
  );
}
