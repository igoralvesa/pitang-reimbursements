import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('reject reimbursement', () => {
  it('exige justificativa quando gestor rejeita uma solicitação enviada', async () => {
    authenticateAs('MANAGER');
    const user = userEvent.setup();
    renderAt('/dashboard');

    expect(screen.getByText('REQ-1002')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Aprovar/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Rejeitar/i }));
    const dialog = await screen.findByRole('dialog', {
      name: /Rejeitar solicitação/i,
    });
    await user.click(
      within(dialog).getByRole('button', { name: /Rejeitar solicitação/i }),
    );

    expect(
      await within(dialog).findByText(/Informe a justificativa da rejeição/i),
    ).toBeInTheDocument();
  });

  it('rejeita solicitação enviada com justificativa', async () => {
    authenticateAs('MANAGER');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1002');

    await user.click(screen.getByRole('button', { name: /Rejeitar/i }));
    const dialog = await screen.findByRole('dialog', {
      name: /Rejeitar solicitação/i,
    });
    await user.type(
      within(dialog).getByLabelText(/Justificativa/i),
      'Despesa fora da política.',
    );
    await user.click(
      within(dialog).getByRole('button', { name: /Rejeitar solicitação/i }),
    );

    expect(
      screen.getByText(/REQ-1002 rejeitada com justificativa/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Rejeitado/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Despesa fora da política/i)).toBeInTheDocument();
  });
});
