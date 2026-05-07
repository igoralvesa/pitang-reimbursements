import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('auth context', () => {
  it('carrega sessão persistida e permite sair', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/dashboard');

    expect(
      screen.getByRole('heading', { name: /Solicitações de reembolso/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Sair/i }));

    expect(window.localStorage.getItem('access_token')).toBeNull();
    expect(window.localStorage.getItem('auth_user')).toBeNull();
    expect(
      screen.getByRole('heading', { name: /Acesse sua conta/i }),
    ).toBeInTheDocument();
  });

  it('alterna e persiste o tema escuro no cabeçalho autenticado', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/dashboard');

    await user.click(
      screen.getByRole('button', { name: /Ativar tema escuro/i }),
    );

    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('pitang-reimbursements-theme')).toBe(
      'dark',
    );
    expect(
      screen.getByRole('button', { name: /Ativar tema claro/i }),
    ).toBeInTheDocument();
  });
});
