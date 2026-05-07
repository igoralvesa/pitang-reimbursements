import { screen } from '@testing-library/react';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('dashboard list', () => {
  it('exibe para colaborador apenas suas solicitações e ações de rascunho', () => {
    authenticateAs('COLLABORATOR');
    renderAt('/dashboard');

    expect(
      screen.getByRole('link', { name: /Nova solicitação/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('REQ-1001')).toBeInTheDocument();
    expect(screen.getByText('REQ-1002')).toBeInTheDocument();
    expect(screen.getByText('REQ-1004')).toBeInTheDocument();
    expect(screen.getByText('REQ-1006')).toBeInTheDocument();
    expect(screen.queryByText('REQ-1003')).not.toBeInTheDocument();
    expect(screen.queryByText('REQ-1005')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Cancelar/i }),
    ).toBeInTheDocument();
  });

  it('exibe dashboard administrativo sem ações de solicitação e com navegação de gestão', () => {
    authenticateAs('ADMIN');
    renderAt('/dashboard');

    expect(
      screen.queryByRole('link', { name: /Nova solicitação/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Gestão de categorias/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Gestão de usuários/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('REQ-1001')).toBeInTheDocument();
    expect(screen.getByText('REQ-1003')).toBeInTheDocument();
    expect(screen.getByText('REQ-1005')).toBeInTheDocument();
  });
});
