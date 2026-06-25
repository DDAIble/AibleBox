"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownAZ, FolderOpen, Loader2, Search, User } from "lucide-react";
import type { Utility } from "@/data/utilities";
import UtilityGrid from "@/components/UtilityGrid";
import {
  buildUtilityIndex,
  filterUtilities,
  getFilterOptions,
  sortUtilities,
  type UtilitySortOption,
} from "@/lib/utilitySearch";

interface UtilityBrowserProps {
  items: Utility[];
}

const SORT_OPTIONS: { value: UtilitySortOption; label: string }[] = [
  { value: "default", label: "기본 순서" },
  { value: "name-asc", label: "이름 가나다순" },
  { value: "name-desc", label: "이름 역순" },
];

const SEARCH_DELAY_MS = 450;

const selectClassName =
  "w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-70";

type SelectFieldId = "sort" | "category" | "developer";

function SelectChevron({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"
      aria-hidden
    >
      {isOpen ? "▲" : "▼"}
    </span>
  );
}

export default function UtilityBrowser({ items }: UtilityBrowserProps) {
  const [inputValue, setInputValue] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [developer, setDeveloper] = useState("");
  const [sort, setSort] = useState<UtilitySortOption>("default");
  const [isSearching, setIsSearching] = useState(false);
  const [openSelect, setOpenSelect] = useState<SelectFieldId | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { categories, developers } = useMemo(() => getFilterOptions(items), [items]);
  const indexed = useMemo(() => buildUtilityIndex(items), [items]);

  const displayed = useMemo(() => {
    const filtered = filterUtilities(indexed, appliedQuery, { category, developer });
    return sortUtilities(filtered, sort);
  }, [indexed, appliedQuery, category, developer, sort]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching) return;

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    setIsSearching(true);
    searchTimerRef.current = setTimeout(() => {
      setAppliedQuery(inputValue);
      setIsSearching(false);
      searchTimerRef.current = null;
    }, SEARCH_DELAY_MS);
  };

  const bindSelectOpen = (id: SelectFieldId) => ({
    onMouseDown: () => setOpenSelect(id),
    onFocus: () => setOpenSelect(id),
    onBlur: () => setOpenSelect((current) => (current === id ? null : current)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <label className="sr-only" htmlFor="utility-search">
            유틸리티 검색
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="utility-search"
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSearching}
            placeholder="이름, 설명, 태그, 기능으로 검색 후 Enter"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:cursor-wait disabled:opacity-70"
          />
          {isSearching && (
            <Loader2
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-600"
              aria-hidden
            />
          )}
        </form>

        <label className="relative shrink-0 sm:w-44">
          <span className="sr-only">정렬</span>
          <ArrowDownAZ className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as UtilitySortOption);
              setOpenSelect(null);
            }}
            {...bindSelectOpen("sort")}
            className={selectClassName}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SelectChevron isOpen={openSelect === "sort"} />
        </label>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="relative flex-0.5">
          <span className="sr-only">카테고리</span>
          <FolderOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setOpenSelect(null);
            }}
            disabled={isSearching}
            {...bindSelectOpen("category")}
            className={selectClassName}
          >
            <option value="">전체 카테고리</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <SelectChevron isOpen={openSelect === "category"} />
        </label>

        <label className="relative flex-0.5">
          <span className="sr-only">개발자</span>
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={developer}
            onChange={(e) => {
              setDeveloper(e.target.value);
              setOpenSelect(null);
            }}
            disabled={isSearching}
            {...bindSelectOpen("developer")}
            className={selectClassName}
          >
            <option value="">전체 개발자</option>
            {developers.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <SelectChevron isOpen={openSelect === "developer"} />
        </label>
      </div>

      <p className="text-sm text-slate-500" aria-live="polite">
        {isSearching
          ? "검색 중..."
          : `${displayed.length}개 표시 · 전체 ${items.length}개`}
      </p>

      {isSearching ? (
        <div
          className="rounded-2xl border border-slate-200 bg-white px-6 py-20"
          role="status"
          aria-label="검색 중"
        >
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            <p className="mt-4 text-sm font-medium text-slate-700">검색 중입니다</p>
            <p className="mt-1 text-sm text-slate-500">잠시만 기다려 주세요</p>
          </div>
        </div>
      ) : displayed.length > 0 ? (
        <UtilityGrid items={displayed} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">검색 결과가 없습니다</p>
          <p className="mt-1 text-sm text-slate-500">
            다른 키워드로 검색하거나 카테고리·개발자 필터를 변경해 보세요.
          </p>
        </div>
      )}
    </div>
  );
}
