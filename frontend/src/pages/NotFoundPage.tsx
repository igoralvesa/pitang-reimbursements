import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function NotFoundPage() {
  return (
    <main className='min-h-screen bg-zinc-100 px-4 py-12 dark:bg-zinc-950'>
      <Card className='mx-auto max-w-lg bg-white dark:bg-zinc-900'>
        <CardContent className='py-12 text-center'>
          <h1 className='text-3xl font-semibold text-zinc-950 dark:text-zinc-50'>
            Página não encontrada
          </h1>
          <p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400'>
            A rota informada não existe.
          </p>
          <Button asChild className='mt-6 bg-orange-600 hover:bg-orange-700'>
            <Link to='/dashboard'>Voltar</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
