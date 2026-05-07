import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';

function renderAt(path = '/login') {
  window.history.pushState({}, 'Test page', path);
  return render(<App />);
}

async function login() {
  const user = userEvent.setup();
  renderAt('/login');
  await user.type(screen.getByLabelText(/E-mail/i), 'ana.carvalho@pitang.dev');
  await user.type(screen.getByLabelText(/Senha/i), 'senha-interna');
  await user.click(screen.getByRole('button', { name: /Entrar/i }));
  return user;
}

describe('frontend UX interna', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza formulário de login sem seletor de perfil', () => {
    renderAt('/login');

    expect(screen.getByRole('heading', { name: /Acesse sua conta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
    expect(screen.queryByText(/Choose a persona/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Login as/i })).not.toBeInTheDocument();
  });

  it('mostra validações em português no login', async () => {
    const user = userEvent.setup();
    renderAt('/login');

    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    expect(await screen.findByText(/Informe seu e-mail/i)).toBeInTheDocument();
    expect(await screen.findByText(/Informe sua senha/i)).toBeInTheDocument();
  });

  it('autentica com credenciais mockadas e navega para o dashboard', async () => {
    await login();

    expect(await screen.findByRole('heading', { name: /Solicitações de reembolso/i })).toBeInTheDocument();
  });

  it('alterna e persiste o tema escuro no cabeçalho autenticado', async () => {
    const user = await login();

    expect(await screen.findByRole('heading', { name: /Solicitações de reembolso/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Ativar tema escuro/i }));

    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('pitang-reimbursements-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /Ativar tema claro/i })).toBeInTheDocument();
  });
});
