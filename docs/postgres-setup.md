# PostgreSQL setup (local, Windows)

Use this after a fresh PostgreSQL install or when the old database was wiped.

## 1. Confirm PostgreSQL is running

Open **Services** (`Win + R` → `services.msc`) and check **postgresql-x64-18** is **Running**.

Or in PowerShell:

```powershell
Get-Service postgresql-x64-18
```

## 2. Create the app database

Open **SQL Shell (psql)** from the Start menu, or run:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

Enter the password you chose when you installed PostgreSQL.

At the `postgres=#` prompt:

```sql
CREATE DATABASE tcg_storefront;
\q
```

If the database already exists, you can skip `CREATE DATABASE` or drop and recreate:

```sql
DROP DATABASE IF EXISTS tcg_storefront;
CREATE DATABASE tcg_storefront;
```

## 3. Set `DATABASE_URL` in `.env`

In the project root, create or edit `.env` (copy from `.env.example` if needed).

Replace `YOUR_PASSWORD` with your real postgres password. If your Windows user is not `postgres`, change the username too:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tcg_storefront?schema=public"
```

**Special characters in the password** (`@`, `#`, `%`, etc.) must be [URL-encoded](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) in the connection string (e.g. `@` → `%40`).

## 4. Install deps and generate Prisma client

From the project folder:

```powershell
cd "C:\Users\daria\OneDrive\Desktop\Projects\TCG-Dynamic-Storefront"
npm install
npm run db:generate
```

## 5. Apply migrations and seed the storefront

```powershell
npm run db:setup
```

You should see migrations applied, then the seed script inserting the mock catalog cards (Pikachu, Charizard, etc.).

To verify in psql:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d tcg_storefront -c "SELECT COUNT(*) FROM \"Card\";"
```

Expect **6** rows after seeding.

## 6. Restart the dev server

Stop the running `npm run dev` (Ctrl+C), then:

```powershell
npm run dev
```

Open [http://localhost:3000/cards](http://localhost:3000/cards) — it should load without a 500 error.

---

## Optional: Docker Postgres instead

If you prefer the `tcg` / `tcg` user from `docker-compose.yml`:

1. Start **Docker Desktop**.
2. `docker compose up -d`
3. Use this `DATABASE_URL` in `.env`:

   ```env
   DATABASE_URL="postgresql://tcg:tcg@localhost:5432/tcg_storefront?schema=public"
   ```

4. Run `npm run db:setup` as above.

Do not run Docker Postgres and native Postgres on port **5432** at the same time.

---

## Troubleshooting

| Error | What to do |
|-------|------------|
| `P1000: Authentication failed` | Wrong user/password in `.env`, or typo in URL-encoding. |
| `database "tcg_storefront" does not exist` | Run step 2 (`CREATE DATABASE`). |
| `Cannot find module '.prisma/client/default'` | Run `npm run db:generate`. |
| `DATABASE_URL is not set` | Add `.env` in the project root and restart `npm run dev`. |
| Port 5432 in use | Stop the other Postgres instance (Docker vs native). |
