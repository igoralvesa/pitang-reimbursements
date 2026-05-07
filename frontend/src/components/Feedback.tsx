import { CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function Feedback({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
      <CheckCircle2 />
      <AlertTitle>Ação concluída</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
