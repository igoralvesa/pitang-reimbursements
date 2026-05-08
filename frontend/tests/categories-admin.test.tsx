import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, jest } from '@jest/globals';
import { authenticateAs, mockHttpClient, renderAt, setupAppTest } from './test-utils';
import type { Category, PaginatedResponse } from '../src/types/api';

setupAppTest();

type HttpClientMock = {
  get: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  post: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
};

const categoriesPageOne: PaginatedResponse<Category> = {
  data: [
    {
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'cat-transporte',
      name: 'Transporte',
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

const categoriesPageTwo: PaginatedResponse<Category> = {
  data: [
    {
      active: true,
      createdAt: '2026-01-02T00:00:00.000Z',
      id: 'cat-alimentacao',
      name: 'Alimentação',
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

describe('categories admin', () => {
  it('permite ao admin listar e criar categorias', async () => {
    const httpClient = mockHttpClient as unknown as HttpClientMock;
    httpClient.get
      .mockResolvedValueOnce({ data: categoriesPageOne })
      .mockResolvedValueOnce({
        data: {
          data: [
            ...categoriesPageOne.data,
            {
              active: true,
              createdAt: '2026-01-03T00:00:00.000Z',
              id: 'cat-pedagio',
              name: 'Pedagio',
              updatedAt: '2026-01-03T00:00:00.000Z',
            },
          ],
          meta: { limit: 10, page: 1, total: 3, totalPages: 1 },
        },
      });
    httpClient.post.mockResolvedValueOnce({
      data: {
        active: true,
        createdAt: '2026-01-03T00:00:00.000Z',
        id: 'cat-pedagio',
        name: 'Pedagio',
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
    });
    authenticateAs('ADMIN');
    const user = userEvent.setup();
    renderAt('/categories');

    expect(
      screen.getByRole('heading', { name: /Gestão de categorias/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Transporte')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Nova categoria/i }));
    const dialog = await screen.findByRole('dialog', {
      name: /Nova categoria/i,
    });
    await user.type(within(dialog).getByLabelText(/Nome/i), 'Pedagio');
    await user.click(within(dialog).getByRole('button', { name: /Salvar/i }));

    expect(await screen.findByText(/Categoria criada/i)).toBeInTheDocument();
    expect(await screen.findByText('Pedagio')).toBeInTheDocument();
    expect(httpClient.post).toHaveBeenCalledWith('/categories', { name: 'Pedagio' });
  });

  it('envia nome, página e limite para a API e pagina resultados', async () => {
    const httpClient = mockHttpClient as unknown as HttpClientMock;
    httpClient.get.mockResolvedValue({ data: categoriesPageOne });

    authenticateAs('ADMIN');
    const user = userEvent.setup();
    renderAt('/categories');

    await screen.findByText('Transporte');
    expect(httpClient.get).toHaveBeenCalledWith('/categories', {
      params: { limit: 10, name: undefined, page: 1 },
    });

    await user.type(screen.getByLabelText(/Buscar categorias/i), 'Trans');

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenLastCalledWith('/categories', {
        params: { limit: 10, name: 'Trans', page: 1 },
      });
    });

    httpClient.get.mockResolvedValueOnce({ data: categoriesPageTwo });
    await user.click(screen.getByRole('button', { name: /Próxima/i }));

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenLastCalledWith('/categories', {
        params: { limit: 10, name: 'Trans', page: 2 },
      });
    });
  });

  it('nega gestão de categorias para colaborador', () => {
    authenticateAs('COLLABORATOR');
    renderAt('/categories');

    expect(
      screen.getByRole('heading', { name: /Acesso negado/i }),
    ).toBeInTheDocument();
  });
});
