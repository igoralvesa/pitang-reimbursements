import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('reimbursement detail actions', () => {
  it('exibe detalhes e ações permitidas para rascunho do colaborador', () => {
    authenticateAs('COLLABORATOR');
    renderAt('/requests/REQ-1001');

    expect(screen.getByText(/Detalhes da solicitação REQ-1001/i)).toBeInTheDocument();
    expect(screen.getByText(/Corrida por aplicativo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Cancelar/i }),
    ).toBeInTheDocument();
  });

  it('envia rascunho para análise e registra feedback visual', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1001');

    await user.click(screen.getByRole('button', { name: /Enviar/i }));

    expect(
      screen.getByText(/REQ-1001 enviada para análise do gestor/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Enviado/i).length).toBeGreaterThan(0);
  });
});
