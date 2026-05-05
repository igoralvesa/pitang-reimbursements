# Pitang Reimbursements

## Tests

Start the local Postgres container:

```bash
docker compose up -d postgres
```

The Postgres container creates two databases on first initialization:

- `reimbursements_db` for local development
- `reimbursements_test_db` for backend tests

The backend test runner uses `backend/.env.test`, which points to `reimbursements_test_db`:

```txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reimbursements_test_db
```

Run the backend tests from the backend folder:

```bash
cd backend
bun install
bun run test
```

`bun run test` loads `.env.test`, runs Prisma migrations against `reimbursements_test_db`, and then runs Jest. Tests should not use the development database `reimbursements_db`.

If you already had the Postgres volume before this setup existed, the init SQL will not run again automatically. Create the test database once:

```bash
docker compose exec postgres createdb -U postgres reimbursements_test_db
```

## Postman

To test the API in Postman:

1. Import `postman/reimbursement-api.postman_collection.json`.
2. Import `postman/reimbursement-api.postman_environment.json`.
3. Select the `Reimbursement API` environment in Postman.
4. Run `Auth > Login` first. The test script stores the returned JWT in `{{token}}`.
5. Test the protected routes normally.

Seeded users are created when the backend starts:

- `admin@email.com` / `Senha@123` / `ADMIN`
- `colaborador@email.com` / `Senha@123` / `COLLABORATOR`
- `gestor@email.com` / `Senha@123` / `MANAGER`
- `financeiro@email.com` / `Senha@123` / `FINANCE`

The current collection includes the routes that exist in the legacy Postman files and mounted backend routes: health, auth and users. Categories, reimbursements, attachments and history should be added to the collection when those API routes are implemented.

The legacy individual request files were moved to `postman/legacy/`.
