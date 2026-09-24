# Veloura — Supabase Project Hub Rules

Veloura is designed to coexist safely inside the shared Project Hub Supabase project.

## Intended identity
- slug: `veloura`
- schema: `veloura`
- repository: `https://github.com/Rishikeshsanin/Veloura`
- backend role: `veloura_backend`

## Isolation
- All Veloura tables/functions must be fully qualified under `veloura`.
- No Veloura application table may be created in `public`.
- No object may reference another app schema.
- Storage/function/RPC names must be Veloura-prefixed.
- No blanket grants across schemas.
- Never alter or delete another app's object.

## Security
- RLS is mandatory on all user-facing tables.
- The shared Project Hub service-role key is never an application credential.
- A future server runtime must use only a dedicated, scoped backend role.
- Secrets belong in server-side environment variables only.
- Browser code may only receive publishable/non-secret credentials.

## Change process
- Verify the Project Hub registry before database writes.
- Apply only scoped, reversible migrations.
- Register Veloura-owned resources in the Hub registry when database provisioning is activated.
- Run post-change security checks.
- Stop if a change requires project-wide Auth/OAuth/API configuration or could affect another application.

## V10 status
Provisioned and verified:
- Project Hub App 14 registration for `veloura`
- dedicated `veloura` schema
- seven commerce tables
- RLS enabled on every table
- schema/table resources registered in Hub metadata

Not activated yet:
- no dedicated backend login role/credential
- no public/anon table policies
- no Project Hub service-role usage
- no cross-app dependency
- no project-wide Auth/OAuth changes

The storefront therefore remains local-first until a scoped server credential can be stored safely in Vercel.
