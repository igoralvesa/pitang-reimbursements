import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Search, ShieldPlus, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Feedback } from '@/components/Feedback';
import { RoleBadge } from '@/components/RoleBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMockData } from '@/contexts/MockDataContext';
import { formatDateTime, roleLabels } from '@/lib/formatters';
import type { User, UserRole } from '@/types/domain';

const roles = ['COLLABORATOR', 'MANAGER', 'FINANCE', 'ADMIN'] as const satisfies readonly UserRole[];

const userSchema = z.object({
  name: z.string().min(1, 'Informe o nome.'),
  email: z.string().email('Informe um e-mail válido.'),
  role: z.enum(roles),
});

const roleSchema = z.object({
  role: z.enum(roles),
});

type UserFormValues = z.infer<typeof userSchema>;
type UserEditFormValues = Pick<UserFormValues, 'name' | 'email'>;
type RoleFormValues = z.infer<typeof roleSchema>;
type RoleFilter = 'ALL' | UserRole;

const roleFilterLabels: Record<RoleFilter, string> = {
  ALL: 'Todos',
  COLLABORATOR: 'Colaboradores',
  MANAGER: 'Gestores',
  FINANCE: 'Financeiro',
  ADMIN: 'Administradores',
};

export function UsersPage() {
  const { changeUserRole, createUser, deleteUser, updateUser, users } = useMockData();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, search, users]);

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Administração</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
              <Users className="size-7 text-orange-700" />
              Gestão de usuários
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Cadastre usuários e altere perfis de acesso.
            </p>
          </div>
          <UserDialog
            mode="create"
            onSubmit={(values) => {
              createUser(values as UserFormValues);
              setFeedback('Usuário criado.');
            }}
          />
        </div>

        <Feedback message={feedback} />

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="pl-9"
                aria-label="Buscar usuários"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
              <SelectTrigger className="w-full bg-white lg:w-56 dark:bg-zinc-900" aria-label="Filtrar por perfil">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(roleFilterLabels) as RoleFilter[]).map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleFilterLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Atualizado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(user.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <UserDialog
                            mode="edit"
                            user={user}
                            onSubmit={(values) => {
                              updateUser(user.id, values as UserEditFormValues);
                              setFeedback(`${user.name} atualizado.`);
                            }}
                          />
                          <ChangeRoleDialog
                            user={user}
                            onSubmit={(values) => {
                              changeUserRole(user.id, values.role);
                              setFeedback(`Perfil de ${user.name} alterado.`);
                            }}
                          />
                          <ConfirmUserDeletion
                            user={user}
                            onConfirm={() => {
                              deleteUser(user.id);
                              setFeedback(`${user.name} excluído.`);
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <UsersEmptyState onReset={resetFilters} />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function UsersEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-14 text-center">
      <div className="rounded-full bg-orange-50 p-3 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
        <Users className="size-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Nenhum usuário encontrado</h2>
        <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Ajuste a busca ou o filtro de perfil para localizar um usuário existente.
        </p>
      </div>
      <Button type="button" variant="outline" onClick={onReset}>
        Limpar filtros
      </Button>
    </div>
  );
}

function UserDialog({
  mode,
  onSubmit,
  user,
}: {
  mode: 'create' | 'edit';
  onSubmit: (values: UserFormValues | UserEditFormValues) => void;
  user?: User;
}) {
  const [open, setOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    values: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'COLLABORATOR',
    },
  });

  const submit = handleSubmit((values) => {
    if (mode === 'create') {
      onSubmit(values);
    } else {
      onSubmit({ name: values.name, email: values.email });
    }
    reset({ name: '', email: '', role: 'COLLABORATOR' });
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button type="button" className="bg-orange-600 hover:bg-orange-700">
            <Plus className="size-4" />
            Novo usuário
          </Button>
        ) : (
          <span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon-sm" variant="outline" aria-label={`Editar usuário ${user?.name ?? ''}`}>
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar usuário</TooltipContent>
            </Tooltip>
          </span>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Novo usuário' : 'Editar usuário'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`user-name-${user?.id ?? 'new'}`}>Nome</Label>
            <Input id={`user-name-${user?.id ?? 'new'}`} {...register('name')} />
            {errors.name ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`user-email-${user?.id ?? 'new'}`}>Email</Label>
            <Input id={`user-email-${user?.id ?? 'new'}`} type="email" {...register('email')} />
            {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
          </div>
          {mode === 'create' ? (
            <div className="space-y-2">
              <Label htmlFor="new-user-role">Perfil</Label>
              <select
                id="new-user-role"
                className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm dark:bg-zinc-900"
                {...register('role')}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleDialog({
  onSubmit,
  user,
}: {
  onSubmit: (values: RoleFormValues) => void;
  user: User;
}) {
  const [open, setOpen] = useState(false);
  const { handleSubmit, register } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    values: { role: user.role },
  });

  const submit = handleSubmit((values) => {
    onSubmit(values);
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Alterar perfil de ${user.name}`}
                className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-300 dark:hover:bg-orange-950/30"
              >
                <ShieldPlus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Alterar perfil</TooltipContent>
          </Tooltip>
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar perfil de {user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`role-${user.id}`}>Perfil</Label>
            <select
              id={`role-${user.id}`}
              className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm dark:bg-zinc-900"
              {...register('role')}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              Salvar perfil
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmUserDeletion({ user, onConfirm }: { user: User; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="icon-sm" aria-label={`Excluir usuário ${user.name}`}>
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Excluir usuário</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
          <AlertDialogDescription>
            O usuário {user.name} será removido apenas do estado local desta interface.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
