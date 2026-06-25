import type { Utility } from "@/data/utilities";
import UtilityCard from "@/components/UtilityCard";

interface UtilityGridProps {
  items: Utility[];
}

export default function UtilityGrid({ items }: UtilityGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((utility) => (
        <UtilityCard key={utility.id} utility={utility} />
      ))}
    </div>
  );
}
