import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = handleSubmit((values) => {
    login(values.email, values.password);
    navigate('/dashboard');
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffedd5,transparent_28%),linear-gradient(135deg,#18181b_0%,#27272a_44%,#f97316_100%)] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6 text-left">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">Pitang</div>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Gestão de reembolsos com fluxos internos por perfil.
            </h1>
            <p className="mt-4 max-w-lg text-base text-zinc-200">
              Acompanhe solicitações, aprovações e pagamentos em um ambiente operacional seguro.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Rascunhos', 'Aprovações', 'Pagamentos'].map((label) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-3 backdrop-blur">
                <div className="text-sm font-semibold">{label}</div>
                <div className="mt-1 text-xs text-zinc-300">Sistema interno</div>
              </div>
            ))}
          </div>
        </section>

        <Card className="border-white/15 bg-white text-zinc-950 shadow-2xl dark:bg-zinc-900 dark:text-zinc-50">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-6 text-left">
              <div className="mb-4 inline-flex rounded-lg bg-orange-50 p-3 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                <LockKeyhole className="size-5" />
              </div>
              <h2 className="text-2xl font-semibold">Acesse sua conta</h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Use suas credenciais corporativas para acessar o sistema interno de reembolsos.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@pitang.dev"
                  {...register('email')}
                />
                {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  {...register('password')}
                />
                {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
              </div>

              <Button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 dark:bg-orange-600 dark:hover:bg-orange-700">
                Entrar
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Sistema interno de uso exclusivo da equipe autorizada.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
