import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('reimbursement form', () => {
  it('valida campos obrigatórios da nova solicitação', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/new');

    await user.click(screen.getByRole('button', { name: /Criar rascunho/i }));

    expect(await screen.findByText(/Informe a categoria/i)).toBeInTheDocument();
    expect(screen.getByText(/Informe a descrição/i)).toBeInTheDocument();
    expect(
      screen.getByText(/O valor deve ser maior que zero/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Informe a data da despesa/i)).toBeInTheDocument();
  });
});
