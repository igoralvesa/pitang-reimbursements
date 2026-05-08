import { screen } from '@testing-library/react';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('manager reimbursement visibility', () => {
  it('exibe para gestor solicitações enviadas, aprovadas e rejeitadas retornadas pela API', async () => {
    authenticateAs('MANAGER');
    renderAt('/dashboard');

    expect(await screen.findByText('REQ-1002')).toBeInTheDocument();
    expect(screen.getByText('REQ-1003')).toBeInTheDocument();
    expect(screen.getByText('REQ-1004')).toBeInTheDocument();
    expect(screen.queryByText('REQ-1001')).not.toBeInTheDocument();
    expect(screen.queryByText('REQ-1005')).not.toBeInTheDocument();
  });
});
