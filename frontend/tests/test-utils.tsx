import { cleanup, render, screen } from '@testing-library/react';
import type {} from '@testing-library/jest-dom/jest-globals';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  jest,
} from '@jest/globals';
import { httpClient } from '@/services/httpClient';
import { App } from '../src/App';
import { queryClient } from '../src/lib/queryClient';
import { mockCategories, mockRequests, mockUsers } from '../src/mocks/mockData';
import type { User, UserRole } from '../src/types/domain';

jest.mock('@/services/httpClient', () => ({
  httpClient: {
    delete: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    patch: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

export const mockHttpClient = httpClient;

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
    queryClient.clear();
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockLoginState.isError = false;
    mockLoginState.isPending = false;
    mockLoginMutation.mockClear();
    jest.mocked(httpClient.delete).mockReset();
    jest.mocked(httpClient.get).mockReset();
    jest.mocked(httpClient.patch).mockReset();
    jest.mocked(httpClient.post).mockReset();
    jest.mocked(httpClient.put).mockReset();
    jest
      .mocked(httpClient.get)
      .mockImplementation(mockGetRequest as unknown as typeof httpClient.get);
    mockLoginMutation.mockResolvedValue({
      token: 'token-de-teste',
      user: usersByRole.COLLABORATOR,
    });
  });

  afterEach(() => {
    cleanup();
  });
}

function mockGetRequest(url: string, config?: { params?: Record<string, unknown> }) {
  const params = config?.params ?? {};

  if (url === '/categories') {
    const name = typeof params.name === 'string' ? params.name.toLowerCase() : '';
    const categories = mockCategories
      .filter((category) => category.active)
      .filter((category) => category.name.toLowerCase().includes(name));

    return Promise.resolve({ data: paginate(categories, params) });
  }

  if (url === '/users') {
    const role = typeof params.role === 'string' ? params.role : '';
    const users = mockUsers.filter((user) => !role || user.role === role);

    return Promise.resolve({ data: paginate(users, params) });
  }

  if (url === '/reimbursements') {
    return Promise.resolve({ data: paginate(filterRequests(params), params) });
  }

  const detailMatch = url.match(/^\/reimbursements\/([^/]+)$/);

  if (detailMatch) {
    const reimbursement = toApiRequest(
      mockRequests.find((request) => request.id === detailMatch[1]) ?? mockRequests[0],
    );

    return Promise.resolve({ data: reimbursement });
  }

  const historyMatch = url.match(/^\/reimbursements\/([^/]+)\/history$/);

  if (historyMatch) {
    const request = mockRequests.find((item) => item.id === historyMatch[1]) ?? mockRequests[0];

    return Promise.resolve({
      data: request.history.map((entry) => ({
        action: entry.action,
        createdAt: entry.createdAt,
        observation: entry.observation,
        reimbursementRequestId: entry.reimbursementId,
        userId: entry.userId,
      })),
    });
  }

  const attachmentsMatch = url.match(/^\/reimbursements\/([^/]+)\/attachments$/);

  if (attachmentsMatch) {
    const request = mockRequests.find((item) => item.id === attachmentsMatch[1]) ?? mockRequests[0];

    return Promise.resolve({
      data: request.attachments.map((attachment) => ({
        ...attachment,
        cloudinaryPublicId: null,
        createdAt: request.createdAt,
        reimbursementId: request.id,
      })),
    });
  }

  return Promise.resolve({ data: undefined });
}

function getCurrentUser() {
  const storedUser = window.localStorage.getItem('auth_user');

  return storedUser ? (JSON.parse(storedUser) as User) : null;
}

function filterRequests(params: Record<string, unknown>) {
  const currentUser = getCurrentUser();
  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : '';
  const collaboratorId =
    typeof params.collaboratorId === 'string' ? params.collaboratorId : '';
  const status = typeof params.status === 'string' ? params.status : '';

  return mockRequests
    .filter((request) => {
      if (currentUser?.role === 'COLLABORATOR') {
        return request.ownerId === currentUser.id;
      }

      if (currentUser?.role === 'MANAGER') {
        return ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(request.status);
      }

      if (currentUser?.role === 'FINANCE') {
        return ['APPROVED', 'PAID'].includes(request.status);
      }

      return true;
    })
    .filter((request) => !categoryId || request.categoryId === categoryId)
    .filter((request) => !collaboratorId || request.ownerId === collaboratorId)
    .filter((request) => !status || request.status === status)
    .map(toApiRequest);
}

function toApiRequest(request: (typeof mockRequests)[number]) {
  const requester = mockUsers.find((user) => user.id === request.ownerId);
  const category = mockCategories.find((item) => item.id === request.categoryId);

  return {
    ...request,
    requesterId: request.ownerId,
    requester,
    category,
    attachments: request.attachments.map((attachment) => ({
      ...attachment,
      cloudinaryPublicId: null,
      createdAt: request.createdAt,
      reimbursementId: request.id,
    })),
    histories: request.history.map((entry) => ({
      action: entry.action,
      createdAt: entry.createdAt,
      observation: entry.observation,
      reimbursementRequestId: entry.reimbursementId,
      userId: entry.userId,
      user: mockUsers.find((user) => user.id === entry.userId),
    })),
  };
}

function paginate<T>(items: T[], params: Record<string, unknown>) {
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 10);
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
    },
  };
}
