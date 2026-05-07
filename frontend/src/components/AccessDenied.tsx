import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function AccessDenied() {
  return (
    <Card className="mx-auto max-w-xl border-red-100 bg-white dark:border-red-950 dark:bg-zinc-900">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="rounded-full bg-red-50 p-3 text-red-700">
          <ShieldAlert className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Acesso negado</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Seu perfil atual não tem permissão para acessar esta página.
          </p>
        </div>
        <Button asChild className="bg-zinc-950 hover:bg-zinc-800">
          <Link to="/dashboard">Voltar ao dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
