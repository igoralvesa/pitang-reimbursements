# Frontend API Contract

Source of truth audited from the current backend code. Main references:
`backend/src/app.ts`, `backend/src/http/routes/*.router.ts`, `backend/src/http/controllers/**`,
`backend/src/http/middlewares/**`, `backend/src/schemas/*.schema.ts`, and
`backend/prisma/schema.prisma`.

Base paths are mounted directly on the Express app. `GET /` is a public health
check returning `{ "message": "Hello world" }`.

Important naming note: backend enum values are English (`COLLABORATOR`,
`MANAGER`, `FINANCE`, `ADMIN`, `DRAFT`, `SUBMITTED`, etc.), even when UI/domain
copy may use Portuguese labels.

## Shared types

```ts
type Role = 'COLLABORATOR' | 'MANAGER' | 'FINANCE' | 'ADMIN';

type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELED';

type HistoryAction =
  | 'CREATED'
  | 'UPDATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELED';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ReimbursementRequest = {
  id: string;
  requesterId: string;
  categoryId: string;
  description: string;
  amount: string | number;
  expenseDate: string;
  status: RequestStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  requester?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  attachments?: Attachment[];
  histories?: Array<HistoryEntry & { user?: Pick<User, 'id' | 'name' | 'email' | 'role'> }>;
};

type Attachment = {
  id: string;
  reimbursementId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  cloudinaryPublicId: string | null;
  createdAt: string;
};

type HistoryEntry = {
  reimbursementRequestId: string;
  userId: string;
  action: HistoryAction;
  observation: string;
  createdAt: string;
};

type ApiError =
  | { message: string }
  | Record<string, { errors: string[] }>;

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};
```

Validation errors usually return `z.treeifyError(error).properties`, for
example `{ "email": { "errors": ["Endereço de e-mail inválido"] } }`. Some
controllers return `{ message: string }` for business errors.

## Response error categories

The frontend should treat backend errors in two main shapes:

### Validation error response

Used when Zod validation fails. Returned by controllers as
`z.treeifyError(error).properties`.

```json
{
  "email": {
    "errors": ["Endereço de e-mail inválido"]
  },
  "password": {
    "errors": ["A senha deve ter pelo menos 8 caracteres"]
  }
}
```

Frontend handling: map field keys to form errors when the key matches a form
field; fall back to a generic toast if no field can be mapped.

### Business rule error response

Used for auth, authorization, missing resources, duplicate records, invalid
status transitions, inactive categories, upload failures, and similar business
or operational errors.

```json
{
  "message": "Transição de status inválida"
}
```

Frontend handling: show `message` in toast/alert. For `401`, also clear auth
state and redirect to login.

### Common business error messages

- `Não autorizado`
- `Usuário sem permissão para acessar este recurso`
- `Usuário não encontrado`
- `Usuário já cadastrado`
- `Categoria não encontrada`
- `Categoria inválida ou inativa`
- `Solicitação de reembolso não encontrada`
- `Transição de status inválida`
- `Status da solicitação não permite edição`
- `Status da solicitação não permite anexar arquivos`
- `Arquivo é obrigatório`
- `Arquivo inválido`

## Auth model

- Token source: `POST /auth/login` returns `{ token }`; frontend should store it
  client-side and send it on protected requests.
- Header format: `Authorization: Bearer <token>`.
- Token payload: `{ id, email, role }`; generated in
  `backend/src/http/controllers/auth/login.controller.ts`.
- Expiration: JWT is signed with `expiresIn: '30minutes'`.
- `/auth/me`: validates the Bearer token, then loads the current user by token
  `id` and returns the user without `passwordHash`.
- On `401`: clear local auth state/token and redirect to login or show an
  unauthenticated state. Missing, malformed, expired, and invalid tokens all
  return `401`.

## Critical response examples

Examples below reflect the current controllers. Fields such as UUIDs and dates
are illustrative; shape and enum values are the important part.

### POST /auth/login success

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login business error

```json
{
  "message": "Credenciais inválidas"
}
```

### GET /auth/me success

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "name": "Admin",
  "email": "admin@email.com",
  "role": "ADMIN",
  "createdAt": "2026-05-01T00:00:00.000Z",
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

### POST /users validation error

```json
{
  "email": {
    "errors": ["Endereço de e-mail inválido"]
  },
  "password": {
    "errors": ["A senha deve ter pelo menos 8 caracteres"]
  }
}
```

### GET /categories success

```json
{
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000010",
      "name": "Transporte",
      "active": true,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /reimbursements success

```json
{
  "id": "00000000-0000-0000-0000-000000000100",
  "requesterId": "00000000-0000-0000-0000-000000000001",
  "categoryId": "00000000-0000-0000-0000-000000000010",
  "description": "Táxi para reunião",
  "amount": "120.75",
  "expenseDate": "2026-05-01T00:00:00.000Z",
  "status": "DRAFT",
  "rejectionReason": null,
  "createdAt": "2026-05-01T00:00:00.000Z",
  "updatedAt": "2026-05-01T00:00:00.000Z",
  "category": {
    "id": "00000000-0000-0000-0000-000000000010",
    "name": "Transporte",
    "active": true,
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  },
  "requester": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Colaborador",
    "email": "colaborador@email.com",
    "role": "COLLABORATOR"
  }
}
```

### POST /reimbursements validation error

```json
{
  "amount": {
    "errors": ["Valor deve ser maior que zero"]
  },
  "categoryId": {
    "errors": ["Categoria inválida"]
  }
}
```

### POST /reimbursements business error

```json
{
  "message": "Categoria inválida ou inativa"
}
```

### POST /reimbursements/:id/reject success

Current backend returns the updated reimbursement, not a `{ "message": "..." }`
success envelope.

```json
{
  "id": "00000000-0000-0000-0000-000000000100",
  "requesterId": "00000000-0000-0000-0000-000000000001",
  "categoryId": "00000000-0000-0000-0000-000000000010",
  "description": "Táxi para reunião",
  "amount": "120.75",
  "expenseDate": "2026-05-01T00:00:00.000Z",
  "status": "REJECTED",
  "rejectionReason": "Comprovante ilegível",
  "createdAt": "2026-05-01T00:00:00.000Z",
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

### POST /reimbursements/:id/reject validation error

```json
{
  "rejectionReason": {
    "errors": ["Justificativa é obrigatória"]
  }
}
```

### POST /reimbursements/:id/reject business error

```json
{
  "message": "Transição de status inválida"
}
```

### GET /reimbursements/:id/history success

```json
[
  {
    "reimbursementRequestId": "00000000-0000-0000-0000-000000000100",
    "userId": "00000000-0000-0000-0000-000000000001",
    "action": "CREATED",
    "observation": "Solicitação criada pelo colaborador",
    "createdAt": "2026-05-01T00:00:00.000Z"
  }
]
```

### POST /reimbursements/:id/attachments success

```json
{
  "id": "00000000-0000-0000-0000-000000000200",
  "reimbursementId": "00000000-0000-0000-0000-000000000100",
  "fileName": "receipt.pdf",
  "fileType": "application/pdf",
  "fileUrl": "https://res.cloudinary.com/mock-cloud/raw/upload/reimbursements/00000000-0000-0000-0000-000000000100/receipt.pdf",
  "cloudinaryPublicId": "reimbursements/00000000-0000-0000-0000-000000000100/receipt.pdf",
  "createdAt": "2026-05-01T00:00:00.000Z"
}
```

## Endpoints

### POST /auth/login

- Purpose: authenticate a user and issue a JWT.
- Authentication required: no.
- Allowed roles: public.
- Request params: none.
- Query params: none.
- Request body: `{ email: string, password: string }`.
- Validation rules: controller only checks both fields are present; no Zod schema.
- Success response: `200 { token: string }`.
- Possible error responses: `400 { message: 'Credenciais inválidas' }` for
  missing credentials, unknown email, or invalid password.
- Important business rules: token payload includes `id`, `email`, and `role`.
- Frontend notes: login errors are intentionally generic.
- Source: `backend/src/http/controllers/auth/login.controller.ts`.

### GET /auth/me

- Purpose: return the authenticated user's profile.
- Authentication required: yes.
- Allowed roles: any valid authenticated role.
- Request params: none.
- Query params: none.
- Request body: none.
- Validation rules: Bearer auth only.
- Success response: `200 User` without `passwordHash`.
- Possible error responses: `401 { message: 'Não autorizado' }`,
  `404 { message: 'Usuário não encontrado' }`.
- Important business rules: uses token `id` to load the user from the database.
- Frontend notes: use this endpoint to hydrate auth context after loading a
  stored token.
- Source: `backend/src/http/controllers/auth/auth-me.controller.ts`.

### GET /users

- Purpose: list users.
- Authentication required: yes.
- Allowed roles: `ADMIN`.
- Request params: none.
- Query params:
  - `page?: number`, default `1`, positive integer.
  - `limit?: number`, default `10`, positive integer, max `100`.
  - `name?: string`, case-insensitive partial match on user name.
  - `role?: Role`, exact backend enum match.
- Request body: none.
- Validation rules: query params are validated with Zod; numeric params are
  coerced because query params arrive as strings.
- Success response: `200 PaginatedResponse<User>`, no `passwordHash`.
- Possible error responses: `400` Zod field errors, `401`, `403`.
- Important business rules: filtering happens before pagination; results are
  ordered by `name` ascending.
- Frontend notes: send user management search, role, page, and limit as query
  params.
- Source: `backend/src/http/routes/user.router.ts`,
  `backend/src/http/controllers/users/get-users.controller.ts`.

Example:

```http
GET /users?page=1&limit=10&name=ana&role=COLLABORATOR
```

```json
{
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Ana Carvalho",
      "email": "ana@email.com",
      "role": "COLLABORATOR",
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /users

- Purpose: create a user.
- Authentication required: yes.
- Allowed roles: `ADMIN`.
- Request params: none.
- Query params: none.
- Request body:
  `{ name: string, email: string, password: string, role?: Role }`.
- Validation rules: `name` trimmed min 1; `email` valid and lowercased;
  `password` min 8, at least one lowercase, one uppercase, and one special
  character; `role` optional enum.
- Success response: `201 User`, no password fields.
- Possible error responses: `400` Zod field errors, `401`, `403`,
  `409 { message: 'Usuário já cadastrado' }`.
- Important business rules: omitted `role` defaults to `COLLABORATOR`; password
  is stored hashed.
- Frontend notes: role selector is available only in admin user creation.
- Source: `backend/src/http/controllers/users/create-user.controller.ts`,
  `backend/src/schemas/user.schema.ts`.

### GET /users/:id

- Purpose: get a user by id.
- Authentication required: yes.
- Allowed roles: `ADMIN`.
- Request params: `id` string.
- Query params: none.
- Request body: none.
- Validation rules: TODO: verify whether UUID validation should be added; current
  controller reads `request.params.id` directly in
  `backend/src/http/controllers/users/get-user-by-id.controller.ts`.
- Success response: `200 User`, no `passwordHash`.
- Possible error responses: `401`, `403`,
  `404 { message: 'Usuário não encontrado' }`.
- Important business rules: admin-only.
- Frontend notes: pass database UUID.

### PATCH /users/:id

- Purpose: update user profile fields.
- Authentication required: yes.
- Allowed roles: `ADMIN`.
- Request params: `id` string.
- Query params: none.
- Request body: partial `{ name?: string, email?: string, password?: string }`.
- Validation rules: at least one field; same rules as creation for supplied
  fields. `role` is not accepted here.
- Success response: `200 User`, no password fields.
- Possible error responses: `400` Zod field errors or missing id, `401`, `403`.
- Important business rules: password is re-hashed if supplied.
- Frontend notes: use `POST /users/:id/promote` for role changes.
- TODO: verify missing-user behavior. The controller calls `prisma.user.update`
  without a prior existence check in
  `backend/src/http/controllers/users/update-user.controller.ts`.

### DELETE /users/:id

- Purpose: delete a user.
- Authentication required: yes.
- Allowed roles: `ADMIN`.
- Request params: `id` string.
- Query params: none.
- Request body: none.
- Validation rules: TODO: verify whether UUID validation should be added; current
  controller reads `request.params.id` directly.
- Success response: `204 No Content`.
- Possible error responses: `401`, `403`,
  `404 { message: 'Usuário não encontrado' }`.
- Important business rules: hard delete.
- Frontend notes: no response body on success.
- Source: `backend/src/http/controllers/users/delete-user.controller.ts`.

### POST /users/:id/promote

- Purpose: change a user's role.
- Authentication required: yes.
- Allowed roles: `ADMIN`.
- Request params: `id` string.
- Query params: none.
- Request body: `{ role: Role }`.
- Validation rules: `role` must be one of backend `Role` enum values.
- Success response: `200 User`, no password fields.
- Possible error responses: `400` Zod field errors, `401`, `403`,
  `404 { message: 'Usuário não encontrado' }`.
- Important business rules: despite the route name, it can set any valid role.
- Frontend notes: use backend enum values, not Portuguese labels.
- Source: `backend/src/http/controllers/users/promote-user.controller.ts`.

### GET /categories

- Purpose: list active categories.
- Authentication required: yes, because global auth middleware is mounted before
  category routes.
- Allowed roles: any authenticated role; no role middleware on this route.
- Request params: none.
- Query params:
  - `page?: number`, default `1`, positive integer.
  - `limit?: number`, default `10`, positive integer, max `100`.
  - `name?: string`, case-insensitive partial match on category name.
- Request body: none.
- Validation rules: query params are validated with Zod; numeric params are
  coerced because query params arrive as strings.
- Success response: `200 PaginatedResponse<Category>`, ordered by `name`
  ascending, only `active: true`.
- Possible error responses: `400` Zod field errors, `401`.
- Important business rules: inactive categories are hidden; filtering happens
  before pagination.
- Frontend notes: send category search, page, and limit as query params.
- Source: `backend/src/http/controllers/categories/get-categories.controller.ts`.

Example:

```http
GET /categories?page=1&limit=10&name=trans
```

```json
{
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000010",
      "name": "Transporte",
      "active": true,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /categories

- Purpose: create a category.
- Authentication required: yes.
- Allowed roles: `ADMIN`.
- Request params: none.
- Query params: none.
- Request body: `{ name: string }`.
- Validation rules: `name` trimmed min 1.
- Success response: `201 Category` with `active: true`.
- Possible error responses: `400` Zod field errors, `401`, `403`.
- Important business rules: no duplicate-name check.
- Frontend notes: refresh category lists after create.
- Source: `backend/src/http/controllers/categories/create-category.controller.ts`.

### PUT /categories/:id

- Purpose: update category fields.
- Authentication required: yes.
- Allowed roles: `ADMIN`.
- Request params: `id` string.
- Query params: none.
- Request body: partial `{ name?: string }`.
- Validation rules: at least one field; supplied `name` trimmed min 1.
- Success response: `200 Category`.
- Possible error responses: `400` Zod field errors, `401`, `403`,
  `404 { message: 'Categoria não encontrada' }`.
- Important business rules: only `name` is updatable through schema.
- Frontend notes: no active toggle through this endpoint.
- TODO: verify whether UUID validation should be added; current controller reads
  `request.params.id` directly in
  `backend/src/http/controllers/categories/update-category.controller.ts`.

### DELETE /categories/:id

- Purpose: inactivate a category.
- Authentication required: yes.
- Allowed roles: `ADMIN`.
- Request params: `id` string.
- Query params: none.
- Request body: none.
- Validation rules: none.
- Success response: `204 No Content`.
- Possible error responses: `401`, `403`,
  `404 { message: 'Categoria não encontrada' }`.
- Important business rules: soft delete via `active: false`, not physical delete.
- Frontend notes: remove category from active lists after success.
- Source: `backend/src/http/controllers/categories/delete-category.controller.ts`.

### GET /reimbursements

- Purpose: list visible reimbursement requests.
- Authentication required: yes.
- Allowed roles: `ADMIN`, `COLLABORATOR`, `MANAGER`, `FINANCE`.
- Request params: none.
- Query params:
  - `page?: number`, default `1`, positive integer.
  - `limit?: number`, default `10`, positive integer, max `100`.
  - `collaboratorId?: string`, UUID. Not allowed for `COLLABORATOR`.
  - `categoryId?: string`, UUID.
  - `status?: RequestStatus`.
  - `sortBy?: 'createdAt' | 'expenseDate' | 'amount'`, default `createdAt`.
  - `sortOrder?: 'asc' | 'desc'`, default `desc`.
- Request body: none.
- Validation rules: query params are validated with Zod; numeric params are
  coerced because query params arrive as strings.
- Success response: `200 PaginatedResponse<ReimbursementRequest>` including
  `category` and `requester`.
- Possible error responses: `400` Zod field errors or invalid collaborator
  filter for collaborator users; `401`; `403` for role-forbidden status filters.
- Important business rules: collaborator sees own requests; manager sees
  `SUBMITTED`, `APPROVED`, and `REJECTED`; finance sees `APPROVED` and `PAID`;
  admin sees all. Filtering and RBAC restrictions happen before sorting and
  pagination. If manager or finance sends a `status` outside their visible
  statuses, the backend returns `403`. Results default to `createdAt desc`.
- Frontend notes: frontend integration has not been updated yet in this change.
- Source: `backend/src/http/controllers/reimbursements/get-reimbursements.controller.ts`.

Example:

```http
GET /reimbursements?page=1&limit=10&status=APPROVED&sortBy=expenseDate&sortOrder=asc
```

```json
{
  "data": [
    {
      "id": "00000000-0000-0000-0000-000000000100",
      "requesterId": "00000000-0000-0000-0000-000000000001",
      "categoryId": "00000000-0000-0000-0000-000000000010",
      "description": "Táxi para reunião",
      "amount": "120.75",
      "expenseDate": "2026-05-01T00:00:00.000Z",
      "status": "APPROVED",
      "rejectionReason": null,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z",
      "category": {
        "id": "00000000-0000-0000-0000-000000000010",
        "name": "Transporte",
        "active": true,
        "createdAt": "2026-05-01T00:00:00.000Z",
        "updatedAt": "2026-05-01T00:00:00.000Z"
      },
      "requester": {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "Colaborador",
        "email": "colaborador@email.com",
        "role": "COLLABORATOR"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /reimbursements

- Purpose: create a draft reimbursement request.
- Authentication required: yes.
- Allowed roles: `COLLABORATOR`.
- Request params: none.
- Query params: none.
- Request body:
  `{ amount: number | string, categoryId: string, description: string, expenseDate: string }`.
- Validation rules: `amount` coerced to positive number; `categoryId` UUID;
  `description` trimmed min 1; `expenseDate` non-empty and coercible to `Date`.
- Success response: `201 ReimbursementRequest` including `category` and
  `requester`.
- Possible error responses: `400` Zod field errors,
  `400 { message: 'Categoria inválida ou inativa' }`, `401`, `403`.
- Important business rules: requester is always logged user; status is always
  `DRAFT`; body `requesterId` and `status` are ignored; creates history
  `CREATED` with observation `Solicitação criada pelo colaborador`.
- Frontend notes: use active category IDs from `GET /categories`.
- Source: `backend/src/http/controllers/reimbursements/create-reimbursement.controller.ts`.

### GET /reimbursements/:id

- Purpose: get reimbursement detail.
- Authentication required: yes.
- Allowed roles: route allows all roles, then controller applies visibility.
- Request params: `id` UUID.
- Query params: none.
- Request body: none.
- Validation rules: `id` must be UUID.
- Success response: `200 ReimbursementRequest` including `category`,
  `requester`, `attachments`, and `histories` with each history `user`.
- Possible error responses: `400` Zod field errors, `401`, `403`,
  `404 { message: 'Solicitação de reembolso não encontrada' }`.
- Important business rules: admin sees any; collaborator only own; manager only
  `SUBMITTED`; finance only `APPROVED`.
- Frontend notes: detail access is stricter than list access for manager/finance.
  TODO: verify intended mismatch because list includes manager `APPROVED` and
  `REJECTED`, finance `PAID`, but detail/history/attachments do not.
- Source: `backend/src/http/controllers/reimbursements/get-reimbursement.controller.ts`.

### PUT /reimbursements/:id

- Purpose: update a draft reimbursement.
- Authentication required: yes.
- Allowed roles: `COLLABORATOR`.
- Request params: `id` UUID.
- Query params: none.
- Request body: partial create body with at least one of `amount`, `categoryId`,
  `description`, `expenseDate`.
- Validation rules: same as create for supplied fields; `id` must be UUID.
- Success response: `200 ReimbursementRequest` including `category` and
  `requester`.
- Possible error responses: `400` Zod field errors,
  `400 { message: 'Status da solicitação não permite edição' }`,
  `400 { message: 'Categoria inválida ou inativa' }`, `401`, `403`,
  `404 { message: 'Solicitação de reembolso não encontrada' }`.
- Important business rules: only owner can update; only `DRAFT` can be edited;
  body `requesterId` and `status` are ignored; creates history `UPDATED`.
- Frontend notes: show edit only for owner + `DRAFT`.
- Source: `backend/src/http/controllers/reimbursements/update-reimbursement.controller.ts`.

### POST /reimbursements/:id/submit

- Purpose: submit a draft request for review.
- Authentication required: yes.
- Allowed roles: `COLLABORATOR`.
- Request params: `id` UUID.
- Query params: none.
- Request body: none.
- Validation rules: `id` must be UUID.
- Success response: `200 ReimbursementRequest` with `status: 'SUBMITTED'`.
- Possible error responses: `400` Zod field errors,
  `400 { message: 'Transição de status inválida' }`, `401`, `403`,
  `404 { message: 'Solicitação de reembolso não encontrada' }`.
- Important business rules: only owner; only `DRAFT -> SUBMITTED`; creates
  history `SUBMITTED`.
- Frontend notes: no body is required.
- Source: `backend/src/http/controllers/reimbursements/submit-reimbursement.controller.ts`.

### POST /reimbursements/:id/cancel

- Purpose: cancel a draft request.
- Authentication required: yes.
- Allowed roles: `COLLABORATOR`.
- Request params: `id` UUID.
- Query params: none.
- Request body: none.
- Validation rules: `id` must be UUID.
- Success response: `200 ReimbursementRequest` with `status: 'CANCELED'`.
- Possible error responses: `400` Zod field errors,
  `400 { message: 'Transição de status inválida' }`, `401`, `403`,
  `404 { message: 'Solicitação de reembolso não encontrada' }`.
- Important business rules: only owner; only `DRAFT -> CANCELED`; creates
  history `CANCELED`.
- Frontend notes: show cancel only for owner + `DRAFT`.
- Source: `backend/src/http/controllers/reimbursements/cancel-reimbursement.controller.ts`.

### POST /reimbursements/:id/approve

- Purpose: approve a submitted reimbursement.
- Authentication required: yes.
- Allowed roles: `MANAGER`.
- Request params: `id` UUID.
- Query params: none.
- Request body: none.
- Validation rules: `id` must be UUID.
- Success response: `200 ReimbursementRequest` with `status: 'APPROVED'`.
- Possible error responses: `400` Zod field errors,
  `400 { message: 'Transição de status inválida' }`, `401`, `403`,
  `404 { message: 'Solicitação de reembolso não encontrada' }`.
- Important business rules: only `SUBMITTED -> APPROVED`; creates history
  `APPROVED`.
- Frontend notes: no approval comment field exists.
- Source: `backend/src/http/controllers/reimbursements/approve-reimbursement.controller.ts`.

### POST /reimbursements/:id/reject

- Purpose: reject a submitted reimbursement.
- Authentication required: yes.
- Allowed roles: `MANAGER`.
- Request params: `id` UUID.
- Query params: none.
- Request body: `{ rejectionReason: string }`.
- Validation rules: `id` must be UUID; `rejectionReason` trimmed min 1.
- Success response: `200 ReimbursementRequest` with `status: 'REJECTED'` and
  `rejectionReason`.
- Possible error responses: `400` Zod field errors,
  `400 { message: 'Transição de status inválida' }`, `401`, `403`,
  `404 { message: 'Solicitação de reembolso não encontrada' }`.
- Important business rules: only `SUBMITTED -> REJECTED`; creates history
  `REJECTED` using the rejection reason as observation.
- Frontend notes: rejection reason is required.
- Source: `backend/src/http/controllers/reimbursements/reject-reimbursement.controller.ts`.

### POST /reimbursements/:id/pay

- Purpose: mark an approved reimbursement as paid.
- Authentication required: yes.
- Allowed roles: `FINANCE`.
- Request params: `id` UUID.
- Query params: none.
- Request body: none.
- Validation rules: `id` must be UUID.
- Success response: `200 ReimbursementRequest` with `status: 'PAID'`.
- Possible error responses: `400` Zod field errors,
  `400 { message: 'Transição de status inválida' }`, `401`, `403`,
  `404 { message: 'Solicitação de reembolso não encontrada' }`.
- Important business rules: only `APPROVED -> PAID`; creates history `PAID`.
- Frontend notes: no payment metadata is collected.
- Source: `backend/src/http/controllers/reimbursements/pay-reimbursement.controller.ts`.

### GET /reimbursements/:id/history

- Purpose: list reimbursement history entries.
- Authentication required: yes.
- Allowed roles: route allows all roles, then controller applies visibility.
- Request params: `id` UUID.
- Query params: none.
- Request body: none.
- Validation rules: `id` must be UUID.
- Success response: `200 HistoryEntry[]` with keys exactly `action`,
  `createdAt`, `observation`, `reimbursementRequestId`, `userId`.
- Possible error responses: `400` Zod field errors, `401`, `403`,
  `404 { message: 'Solicitação de reembolso não encontrada' }`.
- Important business rules: admin sees any; collaborator only own; manager only
  `SUBMITTED`; finance only `APPROVED`; ordered by `createdAt asc`.
- Frontend notes: this endpoint returns no nested user object; detail endpoint
  returns histories with users.
- Source: `backend/src/http/controllers/reimbursements/get-reimbursement-history.controller.ts`.

### GET /reimbursements/:id/attachments

- Purpose: list reimbursement attachments.
- Authentication required: yes.
- Allowed roles: route allows all roles, then controller applies visibility.
- Request params: `id` UUID.
- Query params: none.
- Request body: none.
- Validation rules: `id` must be UUID.
- Success response: `200 Attachment[]`.
- Possible error responses: `400` Zod field errors, `401`, `403`,
  `404 { message: 'Solicitação de reembolso não encontrada' }`.
- Important business rules: admin sees any; collaborator only own; manager only
  `SUBMITTED`; finance only `APPROVED`; ordered by `createdAt asc`.
- Frontend notes: each item maps Prisma `publicId` to `cloudinaryPublicId` and
  `reimbursementRequestId` to `reimbursementId`.
- Source: `backend/src/http/controllers/reimbursements/get-reimbursement-attachments.controller.ts`.

### POST /reimbursements/:id/attachments

- Purpose: upload one attachment for a draft reimbursement.
- Authentication required: yes.
- Allowed roles: `COLLABORATOR`.
- Request params: `id` UUID.
- Query params: none.
- Request body: `multipart/form-data` with single field `file`.
- Validation rules: `id` must be UUID; file is required; exactly one file; only
  `application/pdf`; max size 5MB.
- Success response: `201 Attachment`.
- Possible error responses:
  - `400 { message: 'Identificador da solicitação inválido' }`
  - `400 { message: 'Arquivo é obrigatório' }`
  - `400 { message: 'Arquivo inválido' }`
  - `400 { message: 'Apenas um arquivo pode ser enviado por vez' }`
  - `400 { message: 'Arquivo deve ter no máximo 5MB' }`
  - `400 { message: 'Status da solicitação não permite anexar arquivos' }`
  - `401`
  - `403 { message: 'Usuário sem permissão para acessar este recurso' }`
  - `404 { message: 'Solicitação de reembolso não encontrada' }`
  - `500 { message: 'Erro no upload para Cloudinary' }`
  - `500 { message: 'Erro inesperado ao enviar anexo' }`
- Important business rules: only owner can upload; only `DRAFT` requests accept
  attachments; upload is sent to Cloudinary and metadata is saved only after
  upload succeeds.
- Frontend notes: current backend allows PDFs only, despite broader challenge
  notes mentioning JPG/PNG.
- Source: `backend/src/http/middlewares/reimbursement-attachment-upload.middleware.ts`,
  `backend/src/http/controllers/reimbursements/upload-reimbursement-attachments.controller.ts`.

## Permissions summary

| Role | Can access | Cannot access |
| --- | --- | --- |
| `COLLABORATOR` | `GET /categories`; own reimbursement list/detail/history/attachments; create, edit, submit, cancel own `DRAFT` requests; upload PDF attachments to own `DRAFT` requests | Admin user/category writes; approve/reject/pay; other users' requests |
| `MANAGER` | `GET /categories`; list submitted/approved/rejected requests; detail/history/attachments for `SUBMITTED`; approve/reject `SUBMITTED` | Create/edit/submit/cancel requests; upload attachments; pay; admin user/category writes |
| `FINANCE` | `GET /categories`; list approved/paid requests; detail/history/attachments for `APPROVED`; pay `APPROVED` | Create/edit/submit/cancel requests; upload attachments; approve/reject; admin user/category writes |
| `ADMIN` | User CRUD and role change; category create/update/inactivate; list all reimbursements; detail/history/attachments for any reimbursement | Create/update/submit/cancel/approve/reject/pay reimbursements through role-protected action routes |

All `/users`, `/categories`, and `/reimbursements` routes are behind the global
auth middleware in `backend/src/app.ts`. `/auth/login` is public; `/auth/me` has
its own auth middleware.

## Status transition summary

| Origin status | Destination status | Endpoint/action | Allowed role |
| --- | --- | --- | --- |
| none | `DRAFT` | `POST /reimbursements` create | `COLLABORATOR` |
| `DRAFT` | `DRAFT` | `PUT /reimbursements/:id` edit | owner `COLLABORATOR` |
| `DRAFT` | `SUBMITTED` | `POST /reimbursements/:id/submit` | owner `COLLABORATOR` |
| `DRAFT` | `CANCELED` | `POST /reimbursements/:id/cancel` | owner `COLLABORATOR` |
| `SUBMITTED` | `APPROVED` | `POST /reimbursements/:id/approve` | `MANAGER` |
| `SUBMITTED` | `REJECTED` | `POST /reimbursements/:id/reject` | `MANAGER` |
| `APPROVED` | `PAID` | `POST /reimbursements/:id/pay` | `FINANCE` |

Each transition creates a `ReimbursementHistory` record. Attachments are allowed
only while the request remains `DRAFT`.

## Frontend implementation plan

Recommended future frontend files:

- Services: `frontend/src/services/authService.ts`,
  `frontend/src/services/userService.ts`,
  `frontend/src/services/categoryService.ts`,
  `frontend/src/services/reimbursementService.ts`,
  `frontend/src/services/attachmentService.ts`.
- Hooks: `frontend/src/hooks/useAuth.ts`, `frontend/src/hooks/useUsers.ts`,
  `frontend/src/hooks/useCategories.ts`,
  `frontend/src/hooks/useReimbursements.ts`,
  `frontend/src/hooks/useReimbursementActions.ts`,
  `frontend/src/hooks/useAttachments.ts`.
- Schemas: `frontend/src/schemas/loginSchema.ts`,
  `frontend/src/schemas/userSchema.ts`,
  `frontend/src/schemas/categorySchema.ts`,
  `frontend/src/schemas/reimbursementSchema.ts`,
  `frontend/src/schemas/rejectionSchema.ts`.
- Types: `frontend/src/types/domain.ts` or a dedicated
  `frontend/src/types/api.ts` mirroring the shared types above.
