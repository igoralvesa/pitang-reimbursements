import type { LucideIcon } from 'lucide-react';

export function TableState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-14 text-center">
      <div className="rounded-full bg-orange-50 p-3 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
        <Icon className="size-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}
