# SoftwareProjectRisk — CSMJU2030 Conformance Report

## Standards

- Standards version: **1.7.0**
- Standards source: `CSMJU2030/csmju2030-standards`
- Local standards: `standards/` Git submodule pinned to `v1.7.0`
- Conformance level: **L3**

## Architecture

```text
Browser
  ↓
Next.js frontend :3201
  ↓ same-origin /api/* and /auth/* rewrites
NestJS backend :4201
  ↓
Subsystem-owned PostgreSQL database
```

The subsystem does not own Core Hub credentials or the Core Hub database.
Authentication is delegated to CSMJU2030 Core Hub SSO and access tokens are
verified locally with RS256/JWKS.

## Implemented compliance work

- Updated `.standards-version` to `1.7.0`.
- Added `standards/` Git submodule pinned to `v1.7.0`.
- Added root workspace `package.json` with pnpm `12.3.4`.
- Kept `pnpm-workspace.yaml` for `frontend` and `backend`.
- Added Dockerfile and Docker Compose infrastructure.
- Standardized frontend/backend development ports to `3201` / `4201`.
- Added Core Hub configuration and environment examples.
- Added the reference authentication layer based on the CSMJU2030 demo subsystem.
- Added RS256/JWKS verification, role mapping, permissions and protected `/api/v1/me`.
- Added SSO login, callback and logout endpoints outside the `/api` prefix.
- Added HttpOnly SSO/state cookies and state validation.
- Added access-token lifetime and optional `azp` validation.
- Added API response/error infrastructure.
- Added OpenAPI generation script.

## Validation note

Local static compliance checks can run without Core Hub, but full conformance
requires the Core Hub and seeded test accounts to be running. Local dependency
installation on the development machine may also be blocked by another process
holding files inside `node_modules`; this is an environment issue rather than a
CSMJU2030 configuration rule.

## Security

Real environment values belong in ignored `.env.local` files. `.env.example`
contains configuration names and safe local defaults only. No JWT private key,
password or access token belongs in Git.
