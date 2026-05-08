# Pitang Reimbursements

Sistema fullstack para gerenciamento de solicitações de reembolso. Colaboradores criam e acompanham solicitações, gestores aprovam ou rejeitam, financeiro marca reembolsos aprovados como pagos e administradores gerenciam usuários e categorias.

## Tecnologias

- **Backend:** Node.js, Express, TypeScript, Prisma
- **Frontend:** React, Vite, TypeScript, React Router, Context API, TanStack Query, Axios, React Hook Form
- **Banco de dados:** PostgreSQL
- **Validação:** Zod
- **Autenticação:** JWT com `Bearer token`
- **Autorização:** baseada em perfis/roles
- **Testes:** Jest, Supertest, Testing Library
- **UI:** Tailwind CSS, Shadcn UI, Lucide React
- **Data:** DayJS

## Pré-requisitos

- Bun
- Docker e Docker Compose, para subir PostgreSQL localmente ou todo o projeto
- Conta/credenciais Cloudinary para upload de anexos em ambiente local

## Variáveis de ambiente

Crie os arquivos a partir dos exemplos disponíveis:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend (`backend/.env`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reimbursements_db
JWT_SECRET=dev-secret-change-me
HTTP_PORT=3333
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
```

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3333
```

Para testes do backend, o projeto usa `backend/.env.test`, apontando para `reimbursements_test_db`.

## Como rodar o backend

1. Suba o PostgreSQL:

```bash
docker compose up -d postgres
```

2. Instale dependências e prepare o banco:

```bash
cd backend
bun install
bunx prisma migrate dev
bunx prisma generate
bun run seed
```

3. Inicie a API:

```bash
bun run dev
```

A API roda por padrão em `http://localhost:3333`.

## Como rodar o frontend

1. Com o backend rodando, instale dependências:

```bash
cd frontend
bun install
```

2. Inicie o Vite:

```bash
bun run dev
```

O frontend roda por padrão em `http://localhost:5173`.

## Docker Compose

Também é possível subir PostgreSQL, backend, frontend e Prisma Studio com:

```bash
docker compose up --build
```

Para testar upload real de anexos no Docker, defina `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` e `CLOUDINARY_CLOUD_NAME` no ambiente antes de subir os serviços.

Serviços expostos:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3333`
- Prisma Studio: `http://localhost:5555`
- PostgreSQL: `localhost:5432`

## Usuários de teste

O seed cria os usuários abaixo, todos com senha `Senha@123`:

| Email                   | Senha       | Role           |
| ----------------------- | ----------- | -------------- |
| `admin@email.com`       | `Senha@123` | `ADMIN`        |
| `colaborador@email.com` | `Senha@123` | `COLLABORATOR` |
| `gestor@email.com`      | `Senha@123` | `MANAGER`      |
| `financeiro@email.com`  | `Senha@123` | `FINANCE`      |

## Testes

Os testes ficam em `tests/` dentro de cada projeto.

Backend:

```bash
docker compose up -d postgres
cd backend
bun install
bun run test
```

O comando aplica as migrations em `reimbursements_test_db` antes de executar Jest/Supertest. Se o volume do PostgreSQL já existia antes da criação do banco de teste, crie-o uma vez:

```bash
docker compose exec postgres createdb -U postgres reimbursements_test_db
```

Frontend:

```bash
cd frontend
bun install
bun run test
```

## Postman

Existe uma coleção Postman atualizada em `postman/reimbursement-api.postman_collection.json` e um ambiente em `postman/reimbursement-api.postman_environment.json`.

Para usar:

1. Importe os dois arquivos no Postman.
2. Selecione o ambiente `Reimbursement API`.
3. Execute um login na pasta `Auth`; o script salva o JWT em `{{token}}`.
4. Use as rotas protegidas normalmente com o bearer token salvo.

## Rotas principais da API

A única rota pública de negócio é `POST /auth/login`. As demais rotas exigem JWT, incluindo `GET /auth/me`. Existe também `GET /` como health check simples.

- `POST /auth/login`: autentica usuário e retorna JWT
- `GET /auth/me`: retorna usuário autenticado
- `GET /users`: lista usuários, somente `ADMIN`
- `POST /users`: cria usuário, somente `ADMIN`
- `GET /users/:id`: busca usuário, somente `ADMIN`
- `PATCH /users/:id`: atualiza usuário, somente `ADMIN`
- `POST /users/:id/promote`: altera role, somente `ADMIN`
- `DELETE /users/:id`: remove usuário, somente `ADMIN`
- `GET /categories`: lista categorias autenticado
- `POST /categories`: cria categoria, somente `ADMIN`
- `PUT /categories/:id`: atualiza categoria, somente `ADMIN`
- `DELETE /categories/:id`: remove categoria, somente `ADMIN`
- `GET /reimbursements`: lista solicitações conforme role do usuário
- `POST /reimbursements`: cria solicitação, somente `COLLABORATOR`
- `GET /reimbursements/:id`: detalha solicitação com controle de acesso
- `PUT /reimbursements/:id`: edita solicitação em rascunho, somente dono colaborador
- `POST /reimbursements/:id/submit`: envia solicitação para análise
- `POST /reimbursements/:id/cancel`: cancela solicitação em rascunho
- `POST /reimbursements/:id/approve`: aprova solicitação, somente `MANAGER`
- `POST /reimbursements/:id/reject`: rejeita solicitação com justificativa, somente `MANAGER`
- `POST /reimbursements/:id/pay`: marca como paga, somente `FINANCE`
- `GET /reimbursements/:id/history`: consulta histórico
- `POST /reimbursements/:id/attachments`: envia anexo, somente dono colaborador em rascunho
- `GET /reimbursements/:id/attachments`: lista anexos

## Pendente ou opcional

- Refresh token
- Recuperação de senha
