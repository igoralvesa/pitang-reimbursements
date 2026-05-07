/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { mockCategories, mockRequests, mockUsers } from '@/mocks/mockData';
import type {
  Category,
  HistoryAction,
  ReimbursementRequest,
  RequestFormValues,
  User,
  UserRole,
} from '@/types/domain';

type CategoryInput = {
  name: string;
  active: boolean;
};

type UserInput = {
  name: string;
  email: string;
  role: UserRole;
};

type MockDataContextValue = {
  categories: Category[];
  requests: ReimbursementRequest[];
  users: User[];
  createRequest: (values: RequestFormValues, owner: User) => ReimbursementRequest;
  updateRequest: (id: string, values: RequestFormValues, actor: User) => void;
  submitRequest: (id: string, actor: User) => void;
  cancelRequest: (id: string, actor: User) => void;
  approveRequest: (id: string, actor: User) => void;
  rejectRequest: (id: string, actor: User, reason: string) => void;
  payRequest: (id: string, actor: User) => void;
  createCategory: (values: CategoryInput) => void;
  updateCategory: (id: string, values: CategoryInput) => void;
  inactivateCategory: (id: string) => void;
  reactivateCategory: (id: string) => void;
  createUser: (values: UserInput) => void;
  updateUser: (id: string, values: Omit<UserInput, 'role'>) => void;
  deleteUser: (id: string) => void;
  changeUserRole: (id: string, role: UserRole) => void;
};

const MockDataContext = createContext<MockDataContextValue | undefined>(undefined);

function now() {
  return new Date().toISOString();
}

function appendHistory(
  request: ReimbursementRequest,
  actor: User,
  action: HistoryAction,
  observation: string,
) {
  const timestamp = now();

  return {
    ...request,
    updatedAt: timestamp,
    history: [
      ...request.history,
      {
        id: `hist-${request.id}-${request.history.length + 1}-${Date.now()}`,
        reimbursementId: request.id,
        userId: actor.id,
        action,
        observation,
        createdAt: timestamp,
      },
    ],
  };
}

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ReimbursementRequest[]>(mockRequests);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [users, setUsers] = useState<User[]>(mockUsers);

  const createRequest = useCallback((values: RequestFormValues, owner: User) => {
    const timestamp = now();
    const newRequest: ReimbursementRequest = {
      id: `REQ-${Math.floor(2000 + Math.random() * 7000)}`,
      ownerId: owner.id,
      categoryId: values.categoryId,
      description: values.description,
      amount: values.amount,
      expenseDate: values.expenseDate,
      status: 'DRAFT',
      attachments: [],
      history: [
        {
          id: `hist-created-${Date.now()}`,
          reimbursementId: 'new',
          userId: owner.id,
          action: 'CREATED',
          observation: 'Solicitacao criada como rascunho.',
          createdAt: timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    newRequest.history[0] = { ...newRequest.history[0], reimbursementId: newRequest.id };
    setRequests((current) => [newRequest, ...current]);
    return newRequest;
  }, []);

  const updateRequest = useCallback((id: string, values: RequestFormValues, actor: User) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? appendHistory(
              {
                ...request,
                categoryId: values.categoryId,
                description: values.description,
                amount: values.amount,
                expenseDate: values.expenseDate,
              },
              actor,
              'UPDATED',
              'Rascunho atualizado pelo colaborador.',
            )
          : request,
      ),
    );
  }, []);

  const transitionRequest = useCallback(
    (id: string, actor: User, action: HistoryAction, status: ReimbursementRequest['status'], observation: string) => {
      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? appendHistory({ ...request, status }, actor, action, observation)
            : request,
        ),
      );
    },
    [],
  );

  const submitRequest = useCallback(
    (id: string, actor: User) => {
      transitionRequest(id, actor, 'SUBMITTED', 'SUBMITTED', 'Enviada para analise do gestor.');
    },
    [transitionRequest],
  );

  const cancelRequest = useCallback(
    (id: string, actor: User) => {
      transitionRequest(id, actor, 'CANCELED', 'CANCELED', 'Solicitacao cancelada pelo colaborador.');
    },
    [transitionRequest],
  );

  const approveRequest = useCallback(
    (id: string, actor: User) => {
      transitionRequest(id, actor, 'APPROVED', 'APPROVED', 'Solicitacao aprovada pelo gestor.');
    },
    [transitionRequest],
  );

  const rejectRequest = useCallback(
    (id: string, actor: User, reason: string) => {
      transitionRequest(id, actor, 'REJECTED', 'REJECTED', reason);
    },
    [transitionRequest],
  );

  const payRequest = useCallback(
    (id: string, actor: User) => {
      transitionRequest(id, actor, 'PAID', 'PAID', 'Pagamento marcado pela area financeira.');
    },
    [transitionRequest],
  );

  const createCategory = useCallback((values: CategoryInput) => {
    const timestamp = now();
    setCategories((current) => [
      {
        id: `cat-${Date.now()}`,
        name: values.name,
        active: values.active,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      ...current,
    ]);
  }, []);

  const updateCategory = useCallback((id: string, values: CategoryInput) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, ...values, updatedAt: now() } : category,
      ),
    );
  }, []);

  const inactivateCategory = useCallback((id: string) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, active: false, updatedAt: now() } : category,
      ),
    );
  }, []);

  const reactivateCategory = useCallback((id: string) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, active: true, updatedAt: now() } : category,
      ),
    );
  }, []);

  const createUser = useCallback((values: UserInput) => {
    const timestamp = now();
    setUsers((current) => [
      {
        id: `user-${Date.now()}`,
        name: values.name,
        email: values.email,
        role: values.role,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      ...current,
    ]);
  }, []);

  const updateUser = useCallback((id: string, values: Omit<UserInput, 'role'>) => {
    setUsers((current) =>
      current.map((user) => (user.id === id ? { ...user, ...values, updatedAt: now() } : user)),
    );
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((current) => current.filter((user) => user.id !== id));
  }, []);

  const changeUserRole = useCallback((id: string, role: UserRole) => {
    setUsers((current) =>
      current.map((user) => (user.id === id ? { ...user, role, updatedAt: now() } : user)),
    );
  }, []);

  const value = useMemo(
    () => ({
      categories,
      requests,
      users,
      createRequest,
      updateRequest,
      submitRequest,
      cancelRequest,
      approveRequest,
      rejectRequest,
      payRequest,
      createCategory,
      updateCategory,
      inactivateCategory,
      reactivateCategory,
      createUser,
      updateUser,
      deleteUser,
      changeUserRole,
    }),
    [
      approveRequest,
      cancelRequest,
      categories,
      changeUserRole,
      createCategory,
      createRequest,
      createUser,
      deleteUser,
      inactivateCategory,
      payRequest,
      reactivateCategory,
      rejectRequest,
      requests,
      submitRequest,
      updateCategory,
      updateRequest,
      updateUser,
      users,
    ],
  );

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockData() {
  const context = useContext(MockDataContext);

  if (!context) {
    throw new Error('useMockData must be used inside MockDataProvider');
  }

  return context;
}
