import { Box } from "lucide-react";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
          <Box className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">AiBle BOX</h1>
          <p className="text-sm text-slate-500">디지털대성 유틸리티 플랫폼</p>
        </div>
      </div>
    </header>
  );
}
