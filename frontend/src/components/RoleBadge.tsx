import { Badge } from '@/components/ui/badge';
import { roleLabels } from '@/lib/formatters';
import type { UserRole } from '@/types/domain';

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300">
      {roleLabels[role]}
    </Badge>
  );
}
