import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  roles,
  type UserFormValues,
} from '@/components/user/userManagementTypes';
import { roleLabels } from '@/lib/formatters';
import { createUserSchema } from '@/schemas/userSchema';

export function CreateUserDialog({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting?: boolean;
  onSubmit: (
    values: UserFormValues,
    setFieldError: (name: keyof UserFormValues, message: string) => void,
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<UserFormValues, unknown, UserFormValues>({
    resolver: zodResolver(createUserSchema),
    values: {
      name: '',
      email: '',
      password: '',
      role: 'COLLABORATOR',
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values, (name, message) => {
      setError(name, { message, type: 'server' });
    });

    reset({ name: '', email: '', password: '', role: 'COLLABORATOR' });
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type='button' className='bg-orange-600 hover:bg-orange-700'>
          <Plus className='size-4' />
          Novo usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            Informe os dados básicos do usuário para acesso ao sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='user-name-new'>Nome</Label>
            <Input id='user-name-new' {...register('name')} />
            {errors.name ? (
              <p className='text-xs text-red-600'>{errors.name.message}</p>
            ) : null}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='user-email-new'>Email</Label>
            <Input id='user-email-new' type='email' {...register('email')} />
            {errors.email ? (
              <p className='text-xs text-red-600'>{errors.email.message}</p>
            ) : null}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-user-password'>Senha</Label>
            <Input
              id='new-user-password'
              type='password'
              {...register('password')}
            />
            {errors.password ? (
              <p className='text-xs text-red-600'>{errors.password.message}</p>
            ) : null}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-user-role'>Perfil</Label>
            <select
              id='new-user-role'
              className='h-9 w-full rounded-lg border border-input bg-white px-3 text-sm dark:bg-zinc-900'
              {...register('role')}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
            {errors.role ? (
              <p className='text-xs text-red-600'>{errors.role.message}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type='submit'
              className='bg-orange-600 hover:bg-orange-700'
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
