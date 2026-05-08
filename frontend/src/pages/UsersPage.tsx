import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableCard } from '@/components/admin/AdminTableCard';
import { ErrorFeedback } from '@/components/ErrorFeedback';
import { Feedback } from '@/components/Feedback';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CreateUserDialog } from '@/components/User/CreateUserDialog';
import { UsersTable } from '@/components/User/UsersTable';
import type {
  RoleFormValues,
  UserEditFormValues,
  UserFormValues,
} from '@/components/User/userManagementTypes';
import {
  useCreateUser,
  useDeleteUser,
  usePromoteUser,
  useUpdateUser,
  useUsers,
} from '@/hooks/useUsers';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/apiError';
import type { PromoteUserPayload, Role, User } from '@/types/api';

type RoleFilter = 'ALL' | Role;

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
  const { data: users = [], isError, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const promoteUser = usePromoteUser();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
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

  const createUserSubmit = async (
    values: UserFormValues,
    setFieldError: (name: keyof UserFormValues, message: string) => void,
  ) => {
    try {
      await createUser.mutateAsync(values);
      setSuccessFeedback('Usuário criado com sucesso.');
    } catch (submissionError) {
      applyUserFieldErrors(submissionError, setFieldError);
      setFailureFeedback(submissionError);
      throw submissionError;
    }
  };

  const updateUserSubmit = async (
    user: User,
    values: UserEditFormValues,
    setFieldError: (name: keyof UserEditFormValues, message: string) => void,
  ) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        payload: values,
      });
      setSuccessFeedback('Usuário atualizado com sucesso.');
    } catch (submissionError) {
      applyEditableUserFieldErrors(submissionError, setFieldError);
      setFailureFeedback(submissionError);
      throw submissionError;
    }
  };

  const changeRoleSubmit = async (
    user: User,
    values: RoleFormValues,
    setFieldError: (name: keyof PromoteUserPayload, message: string) => void,
  ) => {
    try {
      await promoteUser.mutateAsync({
        id: user.id,
        payload: values,
      });
      setSuccessFeedback('Perfil alterado com sucesso.');
    } catch (submissionError) {
      applyRoleFieldErrors(submissionError, setFieldError);
      setFailureFeedback(submissionError);
      throw submissionError;
    }
  };

  const deleteUserSubmit = async (user: User) => {
    try {
      await deleteUser.mutateAsync(user.id);
      setSuccessFeedback('Usuário excluído com sucesso.');
    } catch (deleteError) {
      setFailureFeedback(deleteError);
    }
  };

  const setSuccessFeedback = (message: string) => {
    setErrorFeedback(null);
    setFeedback(message);
  };

  const setFailureFeedback = (error: unknown) => {
    setFeedback(null);
    setErrorFeedback(getApiErrorMessage(error));
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminPageHeader
          icon={Users}
          title="Gestão de usuários"
          description="Cadastre usuários e altere perfis de acesso."
          action={
            <CreateUserDialog
              isSubmitting={createUser.isPending}
              onSubmit={createUserSubmit}
            />
          }
        />

        <Feedback message={feedback} />
        <ErrorFeedback message={errorFeedback} />
        {isError ? <ErrorFeedback message="Não foi possível carregar os usuários." /> : null}

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
          <UsersTable
            isChangingRole={promoteUser.isPending}
            isDeleting={deleteUser.isPending}
            isLoading={isLoading}
            isUpdating={updateUser.isPending}
            onChangeRole={changeRoleSubmit}
            onDelete={deleteUserSubmit}
            onResetFilters={resetFilters}
            onUpdate={updateUserSubmit}
            users={filteredUsers}
          />
        </AdminTableCard>
      </div>
    </TooltipProvider>
  );
}

function applyUserFieldErrors(
  error: unknown,
  setFieldError: (name: keyof UserFormValues, message: string) => void,
) {
  const fieldErrors = getApiFieldErrors(error);

  if (fieldErrors.name?.[0]) {
    setFieldError('name', fieldErrors.name[0]);
  }

  if (fieldErrors.email?.[0]) {
    setFieldError('email', fieldErrors.email[0]);
  }

  if (fieldErrors.password?.[0]) {
    setFieldError('password', fieldErrors.password[0]);
  }

  if (fieldErrors.role?.[0]) {
    setFieldError('role', fieldErrors.role[0]);
  }
}

function applyEditableUserFieldErrors(
  error: unknown,
  setFieldError: (name: keyof UserEditFormValues, message: string) => void,
) {
  const fieldErrors = getApiFieldErrors(error);

  if (fieldErrors.name?.[0]) {
    setFieldError('name', fieldErrors.name[0]);
  }

  if (fieldErrors.email?.[0]) {
    setFieldError('email', fieldErrors.email[0]);
  }

  if (fieldErrors.password?.[0]) {
    setFieldError('password', fieldErrors.password[0]);
  }
}

function applyRoleFieldErrors(
  error: unknown,
  setFieldError: (name: keyof PromoteUserPayload, message: string) => void,
) {
  const fieldErrors = getApiFieldErrors(error);

  if (fieldErrors.role?.[0]) {
    setFieldError('role', fieldErrors.role[0]);
  }
}
