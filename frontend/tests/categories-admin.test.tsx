import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from '@jest/globals';
import { authenticateAs, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('categories admin', () => {
  it('permite ao admin listar e criar categorias', async () => {
    authenticateAs('ADMIN');
    const user = userEvent.setup();
    renderAt('/categories');

    expect(
      screen.getByRole('heading', { name: /Gestão de categorias/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Nova categoria/i }));
    const dialog = await screen.findByRole('dialog', {
      name: /Nova categoria/i,
    });
    await user.type(within(dialog).getByLabelText(/Nome/i), 'Pedagio');
    await user.click(within(dialog).getByRole('button', { name: /Salvar/i }));

    expect(screen.getByText(/Categoria criada/i)).toBeInTheDocument();
    expect(screen.getByText('Pedagio')).toBeInTheDocument();
  });

  it('nega gestão de categorias para colaborador', () => {
    authenticateAs('COLLABORATOR');
    renderAt('/categories');

    expect(
      screen.getByRole('heading', { name: /Acesso negado/i }),
    ).toBeInTheDocument();
  });
});
