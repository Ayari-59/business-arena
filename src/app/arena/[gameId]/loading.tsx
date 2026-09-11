export default function ArenaLoading() {
  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6 animate-pulse">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="h-3 w-32 rounded bg-slate-800" />
          <div className="mt-2 h-7 w-48 rounded bg-slate-800" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-24 rounded-full bg-slate-800" />
          <div className="h-7 w-28 rounded-full bg-slate-800" />
        </div>
      </header>

      <div className="h-20 rounded-xl bg-slate-800/50" />

      <div className="h-48 rounded-xl bg-slate-800/50" />

      <div className="h-64 rounded-xl bg-slate-800/50" />
    </main>
  );
}
