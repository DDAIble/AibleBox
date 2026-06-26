export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
        <img
          src="/aible_logo.svg"
          alt="AiBle BOX"
          className="h-10 w-10 shrink-0 object-contain"
        />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">AiBle BOX</h1>
          <p className="text-sm text-slate-500">디지털대성 유틸리티 플랫폼</p>
        </div>
      </div>
    </header>
  );
}
