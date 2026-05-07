import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

export function AdminTableCard({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden bg-white dark:bg-zinc-900">
      {children}
    </Card>
  );
}
