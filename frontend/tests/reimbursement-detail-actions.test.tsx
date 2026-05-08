import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('R$ 48,90')).toBeInTheDocument();

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

  it('renderiza anexos vindos do endpoint de anexos', async () => {
    authenticateAs('COLLABORATOR');
    renderAt('/requests/REQ-1001');

    expect(await screen.findByText(/Detalhes da solicitação REQ-1001/i)).toBeInTheDocument();
    expect(await screen.findByText('recibo-uber.pdf')).toBeInTheDocument();

    await waitFor(() => {
      expect(jest.mocked(mockHttpClient.get)).toHaveBeenCalledWith(
        '/reimbursements/REQ-1001/attachments',
      );
    });
  });

  it('envia anexo pelo card de anexos para solicitação existente em rascunho', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1001');

    expect(await screen.findByRole('button', { name: /Enviar anexo/i })).toBeInTheDocument();

    const file = new File(['conteudo'], 'comprovante.pdf', {
      type: 'application/pdf',
    });

    await user.upload(screen.getByLabelText(/Arquivo do anexo/i), file);

    expect(await screen.findByText(/Anexo enviado com sucesso/i)).toBeInTheDocument();
    expect(jest.mocked(mockHttpClient.post)).toHaveBeenCalledWith(
      '/reimbursements/REQ-1001/attachments',
      expect.any(FormData),
    );
  });

  it('não exibe upload de anexo para solicitação enviada', async () => {
    authenticateAs('COLLABORATOR');
    renderAt('/requests/REQ-1002');

    expect(await screen.findByText(/Detalhes da solicitação REQ-1002/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enviar anexo/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Arquivo do anexo/i)).not.toBeInTheDocument();
  });

  it('exibe ações de rascunho para colaborador dono e envia a solicitação', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1001');

    expect(await screen.findByRole('link', { name: /Editar/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Enviar$/i }));

    expect(await screen.findByText(/REQ-1001 enviada para análise do gestor/i)).toBeInTheDocument();
    expect(jest.mocked(mockHttpClient.post)).toHaveBeenCalledWith(
      '/reimbursements/REQ-1001/submit',
    );
    expect(await screen.findByText('Enviado')).toBeInTheDocument();
  });

  it('exibe cancelar apenas para colaborador dono em rascunho', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1001');

    expect(await screen.findByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(await screen.findByText(/REQ-1001 cancelada/i)).toBeInTheDocument();
    expect(jest.mocked(mockHttpClient.post)).toHaveBeenCalledWith(
      '/reimbursements/REQ-1001/cancel',
    );
  });

  it('exibe aprovar e rejeitar apenas para gestor em solicitação enviada', async () => {
    authenticateAs('MANAGER');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1002');

    expect(await screen.findByRole('button', { name: /Aprovar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rejeitar/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Aprovar/i }));

    expect(await screen.findByText(/REQ-1002 aprovada/i)).toBeInTheDocument();
    expect(jest.mocked(mockHttpClient.post)).toHaveBeenCalledWith(
      '/reimbursements/REQ-1002/approve',
    );
  });

  it('não exibe ações de gestor ou financeiro quando perfil e status não permitem', async () => {
    authenticateAs('MANAGER');
    renderAt('/requests/REQ-1001');

    expect(await screen.findByText(/Detalhes da solicitação REQ-1001/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aprovar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rejeitar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marcar como paga/i })).not.toBeInTheDocument();
  });

  it('exige justificativa antes de rejeitar', async () => {
    authenticateAs('MANAGER');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1002');

    await user.click(await screen.findByRole('button', { name: /Rejeitar/i }));
    await user.click(screen.getByRole('button', { name: /Rejeitar solicitação/i }));

    expect(await screen.findByText(/Informe a justificativa da rejeição/i)).toBeInTheDocument();
    expect(jest.mocked(mockHttpClient.post)).not.toHaveBeenCalledWith(
      '/reimbursements/REQ-1002/reject',
      expect.anything(),
    );
  });

  it('rejeita solicitação enviada com justificativa', async () => {
    authenticateAs('MANAGER');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1002');

    await user.click(await screen.findByRole('button', { name: /Rejeitar/i }));
    await user.type(screen.getByLabelText(/Justificativa/i), 'Comprovante ilegível');
    await user.click(screen.getByRole('button', { name: /Rejeitar solicitação/i }));

    expect(await screen.findByText(/REQ-1002 rejeitada com justificativa/i)).toBeInTheDocument();
    expect(jest.mocked(mockHttpClient.post)).toHaveBeenCalledWith(
      '/reimbursements/REQ-1002/reject',
      { rejectionReason: 'Comprovante ilegível' },
    );
  });

  it('exibe pagamento apenas para financeiro em solicitação aprovada', async () => {
    authenticateAs('FINANCE');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1003');

    expect(await screen.findByRole('button', { name: /Marcar como paga/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Marcar como paga/i }));

    expect(await screen.findByText(/REQ-1003 marcada como paga/i)).toBeInTheDocument();
    expect(jest.mocked(mockHttpClient.post)).toHaveBeenCalledWith(
      '/reimbursements/REQ-1003/pay',
    );
  });

  it('não exibe ações operacionais para admin', async () => {
    authenticateAs('ADMIN');
    renderAt('/requests/REQ-1002');

    expect(await screen.findByText(/Detalhes da solicitação REQ-1002/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aprovar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rejeitar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marcar como paga/i })).not.toBeInTheDocument();
  });
});
