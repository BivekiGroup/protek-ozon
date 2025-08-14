import Link from "next/link";
import { cn } from "@/lib/utils";

type Item = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Item[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-slate-500", className)}>
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {it.href ? (
              <Link href={it.href} className="hover:underline text-slate-600">
                {it.label}
              </Link>
            ) : (
              <span className="text-slate-400">{it.label}</span>
            )}
            {idx < items.length - 1 ? <span className="text-slate-300">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

