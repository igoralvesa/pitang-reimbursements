import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, ShieldPlus, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ConfirmIconButton, TooltipIconButton } from '@/components/admin/AdminActions';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableCard } from '@/components/admin/AdminTableCard';
import { Feedback } from '@/components/Feedback';
import { RoleBadge } from '@/components/RoleBadge';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
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

const roleFilterOptions = (Object.keys(roleFilterLabels) as RoleFilter[]).map((role) => ({
  label: roleFilterLabels[role],
  value: role,
}));

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
        <AdminPageHeader
          icon={Users}
          title="Gestão de usuários"
          description="Cadastre usuários e altere perfis de acesso."
          action={<UserDialog
            mode="create"
            onSubmit={(values) => {
              createUser(values as UserFormValues);
              setFeedback('Usuário criado.');
            }}
          />}
        />

        <Feedback message={feedback} />

        <AdminFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nome ou e-mail"
          searchLabel="Buscar usuários"
          filterValue={roleFilter}
          onFilterChange={setRoleFilter}
          filterLabel="Filtrar por perfil"
          filterOptions={roleFilterOptions}
        />

        <AdminTableCard>
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
            <AdminEmptyState
              icon={Users}
              title="Nenhum usuário encontrado"
              description="Ajuste a busca ou o filtro de perfil para localizar um usuário existente."
              onReset={resetFilters}
            />
          )}
        </AdminTableCard>
      </div>
    </TooltipProvider>
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
            <TooltipIconButton icon={Pencil} label={`Editar usuário ${user?.name ?? ''}`} />
          </span>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Novo usuário' : 'Editar usuário'}</DialogTitle>
          <DialogDescription>
            Informe os dados básicos do usuário para acesso ao sistema.
          </DialogDescription>
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
          <TooltipIconButton
            icon={ShieldPlus}
            label={`Alterar perfil de ${user.name}`}
            className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-300 dark:hover:bg-orange-950/30"
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
    <ConfirmIconButton
      icon={Trash2}
      label={`Excluir usuário ${user.name}`}
      title="Excluir usuário?"
      description={`O usuário ${user.name} será removido apenas do estado local desta interface.`}
      confirmLabel="Excluir"
      onConfirm={onConfirm}
    />
  );
}
