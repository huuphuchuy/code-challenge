import { SwapForm } from '@/components/SwapForm';

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            Fancy Swap
          </h1>
          <p className="text-muted text-sm mt-1">
            99Tech Code Challenge · Problem 2
          </p>
        </header>

        <main className="bg-gradient-to-b from-bg-card to-bg-card/60 border border-border rounded-3xl p-4 shadow-2xl shadow-black/40">
          <SwapForm />
        </main>

        <footer className="mt-6 text-center text-xs text-muted">
          Prices via{' '}
          <a
            href="https://interview.switcheo.com/prices.json"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-white"
          >
            interview.switcheo.com
          </a>{' '}
          · Icons via{' '}
          <a
            href="https://github.com/Switcheo/token-icons"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-white"
          >
            Switcheo/token-icons
          </a>
        </footer>
      </div>
    </div>
  );
}
