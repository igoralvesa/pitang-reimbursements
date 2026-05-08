import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';
import {
  authenticateAs,
  mockHttpClient,
  renderAt,
  setupAppTest,
} from './test-utils';

setupAppTest();

describe('reimbursement detail', () => {
  it('carrega detalhes pelo endpoint de busca por id', async () => {
    authenticateAs('COLLABORATOR');
    renderAt('/requests/REQ-1001');

    expect(await screen.findByText(/Detalhes da solicitação REQ-1001/i)).toBeInTheDocument();
    expect(screen.getByText(/Corrida por aplicativo/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(jest.mocked(mockHttpClient.get)).toHaveBeenCalledWith(
        '/reimbursements/REQ-1001',
      );
    });
  });

  it('renderiza histórico vindo do endpoint de histórico', async () => {
    authenticateAs('MANAGER');
    renderAt('/requests/REQ-1002');

    expect(await screen.findByText(/Detalhes da solicitação REQ-1002/i)).toBeInTheDocument();
    expect(await screen.findByText(/Enviada para analise do gestor/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(jest.mocked(mockHttpClient.get)).toHaveBeenCalledWith(
        '/reimbursements/REQ-1002/history',
      );
    });
  });
});
