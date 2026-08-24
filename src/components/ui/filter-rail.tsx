"use client";

import { cn } from "@/lib/utils";

interface FilterRailOption<T extends string> {
  key: T;
  label: string;
}

interface FilterRailProps<T extends string> {
  label: string;
  options: FilterRailOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterRail<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: FilterRailProps<T>) {
  return (
    <div className={cn("w-full sm:w-56 sm:shrink-0", className)}>
      <p className="px-1 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-col gap-1">
        {options.map((opt) => {
          const active = opt.key === value;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/5 text-foreground hover:bg-primary/10"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
