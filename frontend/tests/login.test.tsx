import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from '@jest/globals';
import {
  login,
  mockLoginMutation,
  renderAt,
  setupAppTest,
  usersByRole,
} from './test-utils';

setupAppTest();

describe('login', () => {
  it('renderiza o formulário sem seletor de perfil', () => {
    renderAt('/login');

    expect(
      screen.getByRole('heading', { name: /Acesse sua conta/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
    expect(screen.queryByText(/Choose a persona/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Login as/i }),
    ).not.toBeInTheDocument();
  });

  it('mostra validações em português', async () => {
    const user = userEvent.setup();
    renderAt('/login');

    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(
      await screen.findByText(/E-mail é obrigatório/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Senha é obrigatória/i)).toBeInTheDocument();
  });

  it('autentica pela mutation, persiste sessão e navega para o dashboard', async () => {
    await login();

    expect(
      await screen.findByRole('heading', {
        name: /Solicitações de reembolso/i,
      }),
    ).toBeInTheDocument();
    expect(mockLoginMutation).toHaveBeenCalledWith({
      email: usersByRole.COLLABORATOR.email,
      password: 'senha-interna',
    });
    expect(window.localStorage.getItem('access_token')).toBe('token-de-teste');
    expect(
      JSON.parse(window.localStorage.getItem('auth_user') ?? '{}'),
    ).toMatchObject({
      id: 'user-ana',
      role: 'COLLABORATOR',
    });
  });
});
