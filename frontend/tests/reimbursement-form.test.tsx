import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, jest } from '@jest/globals';
import { authenticateAs, mockHttpClient, renderAt, setupAppTest } from './test-utils';

setupAppTest();

describe('reimbursement form', () => {
  it('valida campos obrigatórios da nova solicitação', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/new');

    await user.click(await screen.findByRole('button', { name: /Criar rascunho/i }));

    expect(screen.queryByLabelText(/Arquivo do anexo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Anexo opcional/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/Informe a categoria/i)).toBeInTheDocument();
    expect(screen.getByText(/Informe a descrição/i)).toBeInTheDocument();
    expect(
      screen.getByText(/O valor deve ser maior que zero/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Informe a data da despesa/i)).toBeInTheDocument();
  });

  it('valida que o valor deve ser maior que zero', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/new');

    await screen.findByRole('button', { name: /Criar rascunho/i });
    await user.selectOptions(screen.getByLabelText(/Categoria/i), 'cat-transport');
    await user.clear(screen.getByLabelText(/Valor/i));
    await user.type(screen.getByLabelText(/Data da despesa/i), '2026-05-08');
    await user.type(screen.getByLabelText(/Descrição/i), 'Despesa inválida');
    await user.click(screen.getByRole('button', { name: /Criar rascunho/i }));

    expect(
      await screen.findByText(/O valor deve ser maior que zero/i),
    ).toBeInTheDocument();
  });

  it('cria solicitação usando a API com o payload correto', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/new');

    await screen.findByRole('button', { name: /Criar rascunho/i });
    await user.selectOptions(screen.getByLabelText(/Categoria/i), 'cat-transport');
    await user.clear(screen.getByLabelText(/Valor/i));
    await user.type(screen.getByLabelText(/Valor/i), '123.45');
    await user.type(screen.getByLabelText(/Data da despesa/i), '2026-05-08');
    await user.type(screen.getByLabelText(/Descrição/i), 'Táxi para reunião externa');
    await user.click(screen.getByRole('button', { name: /Criar rascunho/i }));

    expect(await screen.findByText(/REQ-CREATED criada como rascunho/i)).toBeInTheDocument();
    expect(jest.mocked(mockHttpClient.post)).toHaveBeenCalledWith('/reimbursements', {
      amount: 123.45,
      categoryId: 'cat-transport',
      description: 'Táxi para reunião externa',
      expenseDate: '2026-05-08',
    });
  });

  it('exibe erro da API ao criar solicitação', async () => {
    jest
      .mocked(mockHttpClient.post)
      .mockRejectedValueOnce({ message: 'Categoria inválida ou inativa' });
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/new');

    await screen.findByRole('button', { name: /Criar rascunho/i });
    await user.selectOptions(screen.getByLabelText(/Categoria/i), 'cat-transport');
    await user.clear(screen.getByLabelText(/Valor/i));
    await user.type(screen.getByLabelText(/Valor/i), '123.45');
    await user.type(screen.getByLabelText(/Data da despesa/i), '2026-05-08');
    await user.type(screen.getByLabelText(/Descrição/i), 'Táxi para reunião externa');
    await user.click(screen.getByRole('button', { name: /Criar rascunho/i }));

    expect(await screen.findByText(/Categoria inválida ou inativa/i)).toBeInTheDocument();
  });

  it('preenche edição e atualiza rascunho pela API', async () => {
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1001/edit');

    expect(await screen.findByDisplayValue(/Corrida por aplicativo/i)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Descrição/i));
    await user.type(screen.getByLabelText(/Descrição/i), 'Descrição atualizada');
    await user.click(screen.getByRole('button', { name: /Salvar rascunho/i }));

    expect(await screen.findByText(/REQ-1001 atualizada/i)).toBeInTheDocument();
    expect(jest.mocked(mockHttpClient.put)).toHaveBeenCalledWith('/reimbursements/REQ-1001', {
      amount: 48.9,
      categoryId: 'cat-transport',
      description: 'Descrição atualizada',
      expenseDate: '2026-04-28',
    });
  });

  it('exibe erro da API ao atualizar solicitação', async () => {
    jest
      .mocked(mockHttpClient.put)
      .mockRejectedValueOnce({ message: 'Status da solicitação não permite edição' });
    authenticateAs('COLLABORATOR');
    const user = userEvent.setup();
    renderAt('/requests/REQ-1001/edit');

    expect(await screen.findByDisplayValue(/Corrida por aplicativo/i)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Descrição/i));
    await user.type(screen.getByLabelText(/Descrição/i), 'Descrição atualizada');
    await user.click(screen.getByRole('button', { name: /Salvar rascunho/i }));

    expect(
      await screen.findByText(/Status da solicitação não permite edição/i),
    ).toBeInTheDocument();
  });

  it('bloqueia edição quando a solicitação não está em rascunho', async () => {
    authenticateAs('COLLABORATOR');
    renderAt('/requests/REQ-1002/edit');

    expect(await screen.findByText(/Esta solicitação está bloqueada/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Salvar rascunho/i })).not.toBeInTheDocument();
  });
});
