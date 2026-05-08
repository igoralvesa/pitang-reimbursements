import { screen } from '@testing-library/react';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('finance reimbursement visibility', () => {
  it('exibe para financeiro solicitações aprovadas e pagas retornadas pela API', async () => {
    authenticateAs('FINANCE');
    renderAt('/dashboard');

    expect(await screen.findByText('REQ-1003')).toBeInTheDocument();
    expect(screen.getByText('REQ-1005')).toBeInTheDocument();
    expect(screen.queryByText('REQ-1001')).not.toBeInTheDocument();
    expect(screen.queryByText('REQ-1002')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Nova solicitação/i }),
    ).not.toBeInTheDocument();
  });
});
