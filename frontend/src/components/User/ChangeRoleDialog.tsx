import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldPlus } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  roles,
  type RoleFormValues,
} from '@/components/User/userManagementTypes';
import { roleLabels } from '@/lib/formatters';
import { promoteUserSchema } from '@/schemas/userSchema';
import type { PromoteUserPayload, User } from '@/types/api';

export function ChangeRoleDialog({
  isSubmitting,
  onSubmit,
  user,
}: {
  isSubmitting?: boolean;
  onSubmit: (
    values: RoleFormValues,
    setFieldError: (name: keyof PromoteUserPayload, message: string) => void,
  ) => Promise<void>;
  user: User;
}) {
  const [open, setOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<RoleFormValues>({
    resolver: zodResolver(promoteUserSchema),
    values: { role: user.role },
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
            icon={ShieldPlus}
            label={`Alterar perfil de ${user.name}`}
            className='border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-300 dark:hover:bg-orange-950/30'
          />
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar perfil de {user.name}</DialogTitle>
          <DialogDescription>
            Esta ação representa o fluxo separado de alteração de perfil.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor={`role-${user.id}`}>Perfil</Label>
            <select
              id={`role-${user.id}`}
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
              {isSubmitting ? 'Salvando...' : 'Salvar perfil'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
