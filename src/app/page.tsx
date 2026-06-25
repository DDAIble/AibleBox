import SiteHeader from "@/components/SiteHeader";
import UtilityBrowser from "@/components/UtilityBrowser";
import { utilities } from "@/data/utilities";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <UtilityBrowser items={utilities} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <p className="text-center text-xs text-slate-400">
          AiBle BOX — 유틸리티 링크 허브
        </p>
      </footer>
    </div>
  );
}
