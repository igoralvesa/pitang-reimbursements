import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ErrorFeedback({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Não foi possível concluir a ação</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
