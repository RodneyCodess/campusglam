# Contributing to Campus Glam

This guide explains how we work together on this repo. If you're new, start with the [README](README.md) to get the project running locally, then read this.

---

## Branches

We use three kinds of branches:

| Branch | What it's for | Who pushes to it |
|---|---|---|
| `main-production` | Stable, demo-ready code. This is what gets deployed. | Nobody directly. Only merged from `dev`. |
| `dev` | Finished, reviewed features. Our shared working version. | Nobody directly. Only merged from feature branches through pull requests. |
| `feature/...`, `fix/...`, `docs/...` | One task each. Short-lived and deleted after merging. | You, for your own task. |

Code always flows **upward**:

```
your branch  →  dev  →  main-production
```

**Never push directly to `dev` or `main-production`.** Never create branches off `main-production`. Always branch off `dev`.

### Branch naming

Start with the type of change, then a short description using dashes:

- `feature/create-services-table`: new functionality
- `fix/login-redirect-bug`: fixing something broken
- `docs/update-readme`: documentation only

If the task has a Linear issue, include its ID, e.g. `feature/CAM-12-create-services-table`. This links the branch to the issue automatically.

---

## Working on a task, step by step

### 1. Start from the latest `dev`

```bash
git checkout dev
git pull
```

Always pull first so you're building on your teammates' latest work.

### 2. Create your branch

```bash
git checkout -b feature/your-task-name
```

### 3. Do the work and commit as you go

```bash
git add .
git commit -m "Add POST /services endpoint"
```

Commit messages should be short and describe what the commit does, starting with a verb: "Add", "Fix", "Update", "Remove". Small, frequent commits are better than one giant commit at the end.

Before every commit, run `git status` and make sure no `.env` files or `node_modules/` are included.

### 4. Push your branch

The first time you push a new branch:

```bash
git push -u origin feature/your-task-name
```

After that, just:

```bash
git push
```

### 5. Open a pull request

On GitHub, open a pull request with:

- **base:** `dev`
- **compare:** your branch

Fill in the description using the template below and request a review from a teammate. Move the Linear issue to **In Review**.

### 6. Address review feedback (if needed)

Make any requested changes on the same branch, commit, and `git push`. The pull request updates automatically.

### 7. Merge and clean up

Once approved, merge the pull request on GitHub and delete the branch (GitHub shows a button for this). Move the Linear issue to **Done**. Then locally:

```bash
git checkout dev
git pull
git branch -d feature/your-task-name
```

---

## Keeping your branch up to date

If `dev` has changed while you've been working, pull those changes into your branch:

```bash
git checkout dev
git pull
git checkout feature/your-task-name
git merge dev
```

If Git reports a **merge conflict**, it means you and a teammate changed the same lines. Don't panic and don't just delete their code. Open the conflicting files, decide which version to keep (or combine them), and ask the person whose code it is if you're not sure.

---

## Building a feature

Build each feature from the bottom up, and test each layer before moving to the next:

1. **Database:** create or change tables with a migration (see below).
2. **Backend:** add the route, controller, and database query in `server/src/`. Name files after the feature, e.g. `routes/services.ts`, `controllers/services.ts`, `db/services.ts`.
3. **Test the endpoint on its own** with Postman or Thunder Client before touching the frontend. If it works here, any later bug is in the frontend.
4. **Frontend:** build the page or component in `client/src/`, with API calls in `client/src/api/`.

If the endpoint isn't ready yet, frontend work can start with hardcoded fake data that matches the agreed API format, then swap in the real call later.

Before building a new endpoint, add it to the shared API doc so everyone knows what it takes in and returns.

---

## Database changes and migrations

All changes to the database's structure (creating tables, adding or removing columns) go through **migrations**. Never change tables by hand in your local database.

Run these from the `server/` folder:

```bash
npx knex migrate:make create_services_table -x ts   # create a new migration file
npx knex migrate:latest                             # run any migrations you haven't run yet
npx knex migrate:rollback                           # undo the most recent batch
```

Rules:

- **Never edit a migration after it's been merged.** Teammates have already run it, so your edit won't reach their databases. Write a new migration instead.
- **Every migration needs both `up` and `down`.** `up` makes the change; `down` undoes it.
- **After pulling `dev`, run `npx knex migrate:latest`** in case someone added a migration.

---

## Pull requests

### Description template (if you want)

```
## What this does
Short summary of the change.

## How to test
1. Steps a reviewer can follow to check it works.
2. Include any endpoints to call or pages to visit.

## Linear issue
CAM-XX
```

---

## Environment variables

- Each folder (`client/` and `server/`) has a `.env.example` file. Copy it to `.env` and fill in your own values.
- **Never commit `.env` files.** They're in `.gitignore` for a reason.
- If you add a new environment variable, add it (without a real value) to the matching `.env.example` so teammates know about it.
- Never put secrets in `client/.env`. Anything there is visible to anyone using the site.

---

## Using Linear

- Every task should have a Linear issue, assigned to one person.
- Move issues through the statuses as you work: **Todo → In Progress → In Review → Done**.
- Only the current week's work goes in the current cycle. Everything else stays in the Backlog.
- If a task turns out to be bigger than a day or two, split it into smaller issues.

---
