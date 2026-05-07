import { screen } from '@testing-library/react';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('private routes', () => {
  it('redireciona rota privada para o login quando não há autenticação', () => {
    renderAt('/dashboard');

    expect(
      screen.getByRole('heading', { name: /Acesse sua conta/i }),
    ).toBeInTheDocument();
  });

  it('bloqueia páginas administrativas para colaborador', () => {
    authenticateAs('COLLABORATOR');
    renderAt('/users');

    expect(
      screen.getByRole('heading', { name: /Acesso negado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não tem permissão para acessar esta página/i),
    ).toBeInTheDocument();
  });
});
