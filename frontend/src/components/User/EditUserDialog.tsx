import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TooltipIconButton } from '@/components/admin/AdminActions';
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
import { type UserEditFormValues } from '@/components/User/userManagementTypes';
import { updateUserSchema } from '@/schemas/userSchema';
import type { User } from '@/types/api';

export function EditUserDialog({
  isSubmitting,
  onSubmit,
  user,
}: {
  isSubmitting?: boolean;
  onSubmit: (
    values: UserEditFormValues,
    setFieldError: (name: keyof UserEditFormValues, message: string) => void,
  ) => Promise<void>;
  user: User;
}) {
  const [open, setOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<UserEditFormValues>({
    resolver: zodResolver(updateUserSchema),
    values: {
      name: user.name,
      email: user.email,
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values, (name, message) => {
      setError(name, { message, type: 'server' });
    });
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span>
          <TooltipIconButton
            icon={Pencil}
            label={`Editar usuário ${user.name}`}
          />
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Informe os dados básicos do usuário para acesso ao sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor={`user-name-${user.id}`}>Nome</Label>
            <Input id={`user-name-${user.id}`} {...register('name')} />
            {errors.name ? (
              <p className='text-xs text-red-600'>{errors.name.message}</p>
            ) : null}
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`user-email-${user.id}`}>Email</Label>
            <Input
              id={`user-email-${user.id}`}
              type='email'
              {...register('email')}
            />
            {errors.email ? (
              <p className='text-xs text-red-600'>{errors.email.message}</p>
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
