import { Trash2, Users } from 'lucide-react';
import { ConfirmIconButton } from '@/components/admin/AdminActions';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { PaginationControls } from '@/components/PaginationControls';
import { RoleBadge } from '@/components/RoleBadge';
import { TableState } from '@/components/TableState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChangeRoleDialog } from '@/components/user/ChangeRoleDialog';
import { EditUserDialog } from '@/components/user/EditUserDialog';
import type {
  RoleFormValues,
  UserEditFormValues,
} from '@/components/user/userManagementTypes';
import { formatDateTime } from '@/lib/date';
import type { PaginationMeta, PromoteUserPayload, User } from '@/types/api';

export function UsersTable({
  isChangingRole,
  isDeleting,
  isLoading,
  isUpdating,
  meta,
  onChangeRole,
  onDelete,
  onPageChange,
  onResetFilters,
  onUpdate,
  users,
}: {
  isChangingRole: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  meta: PaginationMeta;
  onChangeRole: (
    user: User,
    values: RoleFormValues,
    setFieldError: (name: keyof PromoteUserPayload, message: string) => void,
  ) => Promise<void>;
  onDelete: (user: User) => Promise<void>;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onUpdate: (
    user: User,
    values: UserEditFormValues,
    setFieldError: (name: keyof UserEditFormValues, message: string) => void,
  ) => Promise<void>;
  users: User[];
}) {
  if (isLoading) {
    return (
      <TableState
        icon={Users}
        title='Carregando usuários'
        description='Aguarde enquanto buscamos os usuários cadastrados.'
      />
    );
  }

  if (users.length === 0) {
    return (
      <AdminEmptyState
        icon={Users}
        title='Nenhum usuário encontrado'
        description='Ajuste a busca ou o filtro de perfil para localizar um usuário existente.'
        onReset={onResetFilters}
      />
    );
  }

  return (
    <>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Atualizado em</TableHead>
              <TableHead className='text-right'>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className='transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              >
                <TableCell className='font-medium'>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                <TableCell>{formatDateTime(user.updatedAt)}</TableCell>
                <TableCell>
                  <div className='flex justify-end gap-1.5'>
                    <EditUserDialog
                      user={user}
                      isSubmitting={isUpdating}
                      onSubmit={(values, setFieldError) =>
                        onUpdate(user, values, setFieldError)
                      }
                    />
                    <ChangeRoleDialog
                      user={user}
                      isSubmitting={isChangingRole}
                      onSubmit={(values, setFieldError) =>
                        onChangeRole(user, values, setFieldError)
                      }
                    />
                    <ConfirmUserDeletion
                      user={user}
                      disabled={isDeleting}
                      onConfirm={() => void onDelete(user)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls meta={meta} onPageChange={onPageChange} />
    </>
  );
}

function ConfirmUserDeletion({
  disabled,
  onConfirm,
  user,
}: {
  disabled: boolean;
  onConfirm: () => void;
  user: User;
}) {
  return (
    <ConfirmIconButton
      icon={Trash2}
      label={`Excluir usuário ${user.name}`}
      title='Excluir usuário?'
      description={`O usuário ${user.name} será removido permanentemente.`}
      confirmLabel={disabled ? 'Excluindo...' : 'Excluir'}
      onConfirm={onConfirm}
    />
  );
}
