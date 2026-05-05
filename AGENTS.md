# AGENTS.md

## Project Context

This is a fullstack take-home challenge for Pitang.

The app is a reimbursement request system where:

- collaborators create reimbursement requests;
- managers approve or reject submitted requests;
- finance users mark approved requests as paid;
- admins manage users and categories.

Do not implement the whole project unless explicitly requested. Implement only the task described in the current prompt.

## Package Manager

This project uses **Bun**.

Use Bun commands, not npm:

```bash
bun install
bun add <package>
bun add -d <package>
bun run dev
bun run test
bunx prisma migrate dev
bunx prisma generate
bunx prisma studio
```

Avoid npm/npx commands unless explicitly requested.

## Stack

Backend:

- Node.js
- Express
- TypeScript
- JWT
- Zod
- Prisma
- PostgreSQL
- Jest + Supertest

Frontend:

- React
- TypeScript
- React Router
- Context API
- ShadcnUI
- Tailwind CSS
- Axios or Fetch API

## Main Domain Rules

User roles:

- COLABORADOR
- GESTOR
- FINANCEIRO
- ADMIN

Default public registration should create a `COLABORADOR`.

`ADMIN`, `GESTOR`, and `FINANCEIRO` users should preferably be created by seed or by an admin flow, not by allowing anyone to choose a role during public registration.

Reimbursement statuses:

- RASCUNHO
- ENVIADO
- APROVADO
- REJEITADO
- PAGO
- CANCELADO

Allowed status transitions:

```txt
RASCUNHO -> ENVIADO
ENVIADO -> APROVADO
ENVIADO -> REJEITADO
APROVADO -> PAGO
RASCUNHO -> CANCELADO
```

Every important action on a reimbursement request should create a history record.

History actions:

- CREATED
- UPDATED
- SUBMITTED
- APPROVED
- REJECTED
- PAID
- CANCELED

## Permissions

Collaborator:

- creates reimbursement requests;
- sees only their own requests;
- edits only their own requests in `RASCUNHO`;
- submits only their own `RASCUNHO` requests;
- cancels only their own `RASCUNHO` requests.

Manager:

- sees submitted requests;
- approves `ENVIADO` requests;
- rejects `ENVIADO` requests with required justification.

Finance:

- sees approved requests;
- marks `APROVADO` requests as `PAGO`.

Admin:

- manages users;
- manages categories.

Use middleware-based authentication and role authorization.

## Validation and Errors

Use Zod to validate body, params and query before business logic.

Use proper HTTP status codes:

- 400 for invalid input or invalid status transition;
- 401 for missing/invalid token;
- 403 for forbidden actions;
- 404 for missing resources;
- 500 for unexpected errors.

Do not return success for invalid actions.
Beside this, the error field in the response body should be in portuguese language

## Attachments

Real external storage is not required.

It is acceptable to store simulated attachment metadata:

- file name;
- file type;
- file URL.

Allowed file types can be simple, such as PDF, JPG and PNG.

## Frontend Notes

Use Context API for auth state, token and user role.

Use protected routes.

Render buttons/actions according to the logged user role and reimbursement status.

Show loading, empty, success and error states clearly.

Use ShadcnUI + Tailwind for UI.

## Backend Notes

When creating new controllers, follow the existing project structure and patterns.

Organize test files by feature/resource. Inside each test file, use one main `describe` for the resource and nested `describe` blocks for each endpoint/action. Keep related scenarios as `it` cases inside the corresponding endpoint block.

When creating new endpoints and schemas, tests must be added in the same implementation cycle. Do not implement an endpoint, schema, middleware, or business rule without also adding the corresponding tests.

Backend tests must be placed under the `tests/` directory at the root of the backend project.

Tests should focus on integration coverage using Jest and Supertest, validating the real API behavior instead of only testing isolated functions.

Whenever a new endpoint is implemented, add tests covering:
successful request flow;
request body, params, and query validation;
authentication requirements;
authorization/profile restrictions;
expected HTTP status codes;
relevant business rules;
error responses for invalid operations.

Whenever a new Zod schema is implemented or changed, add endpoint-level tests proving that invalid payloads, invalid params, and invalid query params are rejected with the expected HTTP status.

Whenever authentication or authorization is involved, add tests for:
request without token returning `401`;
request with invalid token returning `401`;
authenticated user without permission returning `403`;
authenticated user with permission succeeding.

Whenever a middleware is implemented or changed, prefer testing it through the routes that use it. Avoid testing middleware only in isolation unless there is a strong reason.

Whenever a reimbursement status transition is implemented, add tests for both valid and invalid transitions.

Examples:
If an endpoint to create a reimbursement is implemented, tests must cover valid creation, invalid amount, missing expense date, invalid category, inactive category, unauthenticated access, and unauthorized profile access.
If an endpoint to approve a reimbursement is implemented, tests must cover manager approval, non-manager forbidden access, reimbursement not found, invalid current status, and history creation.
If an endpoint to pay a reimbursement is implemented, tests must cover finance user payment, non-finance forbidden access, reimbursement not found, payment only when status is `APROVADO`, and history creation.
If an endpoint to create a user is implemented, tests must cover admin success, unauthenticated access returning `401`, and non-admin access returning `403`.

Whenever an action must generate reimbursement history, tests must assert that the expected history record was created with the correct action.

Required history actions to test when implemented:
`CREATED`
`UPDATED`
`SUBMITTED`
`APPROVED`
`REJECTED`
`PAID`
`CANCELED`

The goal is not to create tests only for schemas or endpoints mechanically. The goal is to test the behavior expected by the business rule, including validation, permissions, status transitions, and side effects.

## Style

Keep the implementation simple and readable.

Avoid unnecessary architecture such as Clean Architecture, DDD or microservices.

Follow the existing project structure when present.

When explaining changes, be concise and mention:

- files changed;
- commands to run using Bun;
- assumptions made;
- tests added or affected.
