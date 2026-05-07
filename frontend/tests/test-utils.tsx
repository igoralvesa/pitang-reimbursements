import { cleanup, render, screen } from '@testing-library/react';
import type {} from '@testing-library/jest-dom/jest-globals';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  jest,
} from '@jest/globals';
import { App } from '../src/App';
import type { User, UserRole } from '../src/types/domain';

type LoginSession = {
  token: string;
  user: User;
};

type MockLoginState = {
  isError: boolean;
  isPending: boolean;
};

export const mockLoginMutation = jest.fn() as jest.MockedFunction<
  (payload: { email: string; password: string }) => Promise<LoginSession>
>;

export const mockLoginState: MockLoginState = {
  isError: false,
  isPending: false,
};

jest.mock('@/hooks/useLogin', () => ({
  useLogin: () => ({
    isError: mockLoginState.isError,
    isPending: mockLoginState.isPending,
    mutateAsync: mockLoginMutation,
  }),
}));

export const usersByRole: Record<UserRole, User> = {
  ADMIN: {
    createdAt: '2026-01-02T09:00:00.000Z',
    email: 'clara.andrade@pitang.dev',
    id: 'user-admin',
    name: 'Clara Andrade',
    role: 'ADMIN',
    updatedAt: '2026-04-29T12:00:00.000Z',
  },
  COLLABORATOR: {
    createdAt: '2026-01-10T09:00:00.000Z',
    email: 'ana.carvalho@pitang.dev',
    id: 'user-ana',
    name: 'Ana Carvalho',
    role: 'COLLABORATOR',
    updatedAt: '2026-04-20T12:00:00.000Z',
  },
  FINANCE: {
    createdAt: '2026-01-08T09:00:00.000Z',
    email: 'rafael.costa@pitang.dev',
    id: 'user-rafael',
    name: 'Rafael Costa',
    role: 'FINANCE',
    updatedAt: '2026-04-28T12:00:00.000Z',
  },
  MANAGER: {
    createdAt: '2026-01-05T09:00:00.000Z',
    email: 'marina.lima@pitang.dev',
    id: 'user-marina',
    name: 'Marina Lima',
    role: 'MANAGER',
    updatedAt: '2026-04-30T12:00:00.000Z',
  },
};

export function renderAt(path = '/login') {
  window.history.pushState({}, 'Test page', path);
  return render(<App />);
}

export function authenticateAs(role: UserRole) {
  window.localStorage.setItem('access_token', `token-${role.toLowerCase()}`);
  window.localStorage.setItem('auth_user', JSON.stringify(usersByRole[role]));
}

export async function login() {
  const user = userEvent.setup();
  renderAt('/login');
  await user.type(
    screen.getByLabelText(/E-mail/i),
    usersByRole.COLLABORATOR.email,
  );
  await user.type(screen.getByLabelText(/Senha/i), 'senha-interna');
  await user.click(screen.getByRole('button', { name: /Entrar/i }));
  return user;
}

export function setupAppTest() {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockLoginState.isError = false;
    mockLoginState.isPending = false;
    mockLoginMutation.mockClear();
    mockLoginMutation.mockResolvedValue({
      token: 'token-de-teste',
      user: usersByRole.COLLABORATOR,
    });
  });

  afterEach(() => {
    cleanup();
  });
}
