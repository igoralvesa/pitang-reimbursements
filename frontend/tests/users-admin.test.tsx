import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, jest } from '@jest/globals';
import { authenticateAs, mockHttpClient, renderAt, setupAppTest } from './test-utils';
import type { PaginatedResponse, User } from '../src/types/api';

setupAppTest();

type HttpClientMock = {
  get: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
};

const usersPageOne: PaginatedResponse<User> = {
  data: [
    {
      createdAt: '2026-01-01T00:00:00.000Z',
      email: 'ana@email.com',
      id: 'user-ana',
      name: 'Ana Carvalho',
      role: 'COLLABORATOR',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  meta: {
    limit: 10,
    page: 1,
    total: 2,
    totalPages: 2,
  },
};

const usersPageTwo: PaginatedResponse<User> = {
  data: [
    {
      createdAt: '2026-01-02T00:00:00.000Z',
      email: 'marina@email.com',
      id: 'user-marina',
      name: 'Marina Lima',
      role: 'MANAGER',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
  ],
  meta: {
    limit: 10,
    page: 2,
    total: 2,
    totalPages: 2,
  },
};

describe('users admin', () => {
  it('envia nome, perfil, página e limite para a API e pagina resultados', async () => {
    const httpClient = mockHttpClient as unknown as HttpClientMock;
    httpClient.get.mockResolvedValue({ data: usersPageOne });

    authenticateAs('ADMIN');
    const user = userEvent.setup();
    renderAt('/users');

    await screen.findByText('Ana Carvalho');
    expect(httpClient.get).toHaveBeenCalledWith('/users', {
      params: { limit: 10, name: undefined, page: 1, role: undefined },
    });

    await user.type(screen.getByLabelText(/Buscar usuários/i), 'Ana');

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenLastCalledWith('/users', {
        params: { limit: 10, name: 'Ana', page: 1, role: undefined },
      });
    });

    await user.click(screen.getByRole('combobox', { name: /Filtrar por perfil/i }));
    await user.click(await screen.findByRole('option', { name: /Gestores/i }));

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenLastCalledWith('/users', {
        params: { limit: 10, name: 'Ana', page: 1, role: 'MANAGER' },
      });
    });

    httpClient.get.mockResolvedValueOnce({ data: usersPageTwo });
    await user.click(screen.getByRole('button', { name: /Próxima/i }));

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenLastCalledWith('/users', {
        params: { limit: 10, name: 'Ana', page: 2, role: 'MANAGER' },
      });
    });
  });
});
