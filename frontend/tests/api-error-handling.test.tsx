import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from '@jest/globals';
import {
  mockLoginMutation,
  mockLoginState,
  renderAt,
  setupAppTest,
} from './test-utils';

setupAppTest();

describe('api error handling', () => {
  it('exibe mensagem de erro quando login falha', async () => {
    mockLoginState.isError = true;
    mockLoginMutation.mockRejectedValue(new Error('Credenciais inválidas'));
    const user = userEvent.setup();
    renderAt('/login');

    await user.type(screen.getByLabelText(/E-mail/i), 'ana.carvalho@pitang.dev');
    await user.type(screen.getByLabelText(/Senha/i), 'senha-incorreta');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(
      screen.getByText(/Não foi possível entrar/i),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('access_token')).toBeNull();
    expect(window.localStorage.getItem('auth_user')).toBeNull();
  });
});
