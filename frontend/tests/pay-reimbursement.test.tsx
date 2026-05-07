import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('pay reimbursement', () => {
  it('exibe para financeiro somente solicitações aprovadas com ação de pagamento', () => {
    authenticateAs('FINANCE');
    renderAt('/dashboard');

    expect(screen.getByText('REQ-1003')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Marcar como paga/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('REQ-1001')).not.toBeInTheDocument();
    expect(screen.queryByText('REQ-1002')).not.toBeInTheDocument();
    expect(screen.queryByText('REQ-1005')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Aprovar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Rejeitar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Nova solicitação/i }),
    ).not.toBeInTheDocument();
  });

  it('marca solicitação aprovada como paga', async () => {
    authenticateAs('FINANCE');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1003');

    await user.click(
      screen.getByRole('button', { name: /Marcar como paga/i }),
    );

    expect(
      screen.getByText(/REQ-1003 marcada como paga/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Pago/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Pagamento marcado pela area financeira/i),
    ).toBeInTheDocument();
  });
});
