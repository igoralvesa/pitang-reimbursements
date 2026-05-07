import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function AdminPageHeader({
  action,
  description,
  icon: Icon,
  title,
}: {
  action: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Administração</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          <Icon className="size-7 text-orange-700" />
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      {action}
    </div>
  );
}
