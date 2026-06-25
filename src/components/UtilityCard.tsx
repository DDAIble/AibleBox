import { ArrowUpRight } from "lucide-react";
import type { Utility } from "@/data/utilities";

interface UtilityCardProps {
  utility: Utility;
}

export default function UtilityCard({ utility }: UtilityCardProps) {
  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{utility.name}</h2>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-violet-600" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-600">{utility.description}</p>

      <ul className="mt-4 space-y-1.5">
        {utility.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm text-slate-600">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2">
        {utility.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <span className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-violet-700">
          {utility.name} 사용하기
        </span>
      </div>
    </>
  );

  return (
    <a
      href={utility.href}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
    >
      {cardContent}
    </a>
  );
}
