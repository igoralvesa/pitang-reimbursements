import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, jest } from '@jest/globals';
import {
  authenticateAs,
  mockHttpClient,
  renderAt,
  setupAppTest,
} from './test-utils';

setupAppTest();

describe('dashboard list', () => {
  it('envia paginação e filtros de status para a API', async () => {
    authenticateAs('ADMIN');
    const user = userEvent.setup();
    renderAt('/dashboard');

    expect(await screen.findByText('REQ-1001')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Aprovado' }));

    await waitFor(() => {
      expect(jest.mocked(mockHttpClient.get)).toHaveBeenCalledWith(
        '/reimbursements',
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 10,
            page: 1,
            status: 'APPROVED',
          }),
        }),
      );
    });
  });

  it('não envia filtro de colaborador para usuário colaborador', async () => {
    authenticateAs('COLLABORATOR');
    renderAt('/dashboard');

    expect(await screen.findByText('REQ-1001')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Colaborador' })).not.toBeInTheDocument();

    await waitFor(() => {
      const reimbursementsCall = jest
        .mocked(mockHttpClient.get)
        .mock.calls.find(([url]) => url === '/reimbursements');

      expect(reimbursementsCall?.[1]).toEqual(
        expect.objectContaining({
          params: expect.not.objectContaining({
            collaboratorId: expect.anything(),
          }),
        }),
      );
    });
  });

  it('limita opções de status para gestor', async () => {
    authenticateAs('MANAGER');
    const user = userEvent.setup();
    renderAt('/dashboard');

    expect(await screen.findByText('REQ-1002')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    const listbox = await screen.findByRole('listbox');

    expect(within(listbox).getByRole('option', { name: 'Enviado' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Aprovado' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Rejeitado' })).toBeInTheDocument();
    expect(within(listbox).queryByRole('option', { name: 'Rascunho' })).not.toBeInTheDocument();
    expect(within(listbox).queryByRole('option', { name: 'Pago' })).not.toBeInTheDocument();
  });

  it('limita opções de status para financeiro', async () => {
    authenticateAs('FINANCE');
    const user = userEvent.setup();
    renderAt('/dashboard');

    expect(await screen.findByText('REQ-1003')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    const listbox = await screen.findByRole('listbox');

    expect(within(listbox).getByRole('option', { name: 'Aprovado' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Pago' })).toBeInTheDocument();
    expect(within(listbox).queryByRole('option', { name: 'Enviado' })).not.toBeInTheDocument();
    expect(within(listbox).queryByRole('option', { name: 'Rejeitado' })).not.toBeInTheDocument();
  });

  it('carrega mais solicitações usando os metadados de paginação da API', async () => {
    authenticateAs('ADMIN');
    const paginatedGetMock = ((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === '/categories' || url === '/users') {
        return Promise.resolve({
          data: { data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } },
        });
      }

      const params = config?.params as { page?: number; limit?: number } | undefined;
      const page = params?.page ?? 1;

      return Promise.resolve({
        data: {
          data: [
            {
              amount: '10',
              attachments: [],
              categoryId: 'cat-transport',
              createdAt: '2026-05-01T10:00:00.000Z',
              description: `Solicitação da página ${page}`,
              expenseDate: '2026-05-01T00:00:00.000Z',
              histories: [],
              id: `REQ-PAGE-${page}`,
              rejectionReason: null,
              requesterId: 'user-ana',
              status: 'SUBMITTED',
              updatedAt: '2026-05-01T10:00:00.000Z',
            },
          ],
          meta: { page, limit: params?.limit ?? 10, total: 20, totalPages: 2 },
        },
      });
    }) as unknown as typeof mockHttpClient.get;

    jest.mocked(mockHttpClient.get).mockImplementation(paginatedGetMock);
    const user = userEvent.setup();
    renderAt('/dashboard');

    expect(await screen.findByText('REQ-PAGE-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Carregar mais' }));

    await waitFor(() => {
      expect(jest.mocked(mockHttpClient.get)).toHaveBeenCalledWith(
        '/reimbursements',
        expect.objectContaining({
          params: expect.objectContaining({ page: 2 }),
        }),
      );
    });
    expect(screen.getByText('REQ-PAGE-1')).toBeInTheDocument();
    expect(await screen.findByText('REQ-PAGE-2')).toBeInTheDocument();
  });
});
