# Firebase migration setup

The website uses Firebase Admin from Next.js server code. Firestore and Storage are
not accessed directly from the browser; `firestore.rules` and `storage.rules`
deny direct client access. Server reads, writes, and file downloads require a
valid Firebase session cookie and an email in `FIREBASE_STAFF_EMAILS`.

## Firebase Console settings

In the Firebase project you selected:

1. Create the Cloud Firestore database and the default Cloud Storage bucket.
2. Enable Email/Password under Authentication sign-in providers.
3. Add staff accounts in Authentication. The email addresses must also be listed
   in `FIREBASE_STAFF_EMAILS` in the server environment.
4. Apply the deny-by-default rules in `firestore.rules` and `storage.rules`.
5. Create a server service account credential for the deployed Next.js app. Keep
   its JSON private and store it only as `FIREBASE_SERVICE_ACCOUNT_JSON` in the
   server environment. Never put it in a `NEXT_PUBLIC_` variable or a desktop build.
6. Copy the Firebase Web App configuration into the `NEXT_PUBLIC_FIREBASE_*`
   variables in `.env.local` and the website's deployment environment.

The existing Electron package opens the hosted website, so it uses the same
website backend and staff login. It does not need a second Firebase database
configuration.

## Supabase data copy

The import script copies the app's five data collections and files from the
Supabase `applicant-photos` bucket. It does not delete or update the Supabase
source. File references are rewritten to the authenticated `/api/files` route.

Put the source project URL and service-role key in local environment variables
named `MIGRATION_SUPABASE_URL` and `MIGRATION_SUPABASE_SERVICE_ROLE_KEY`. These
are needed only to run the import and should not be deployed with the website.

Run the dry run first:

```powershell
pnpm run migrate:supabase
```

Review the target project ID and record/file counts. To copy records and files
after confirming the target project and backup, run:

```powershell
pnpm run migrate:supabase -- --apply
```

The operation is repeatable: it upserts source documents using their existing
IDs and overwrites matching storage paths. It leaves Supabase intact for rollback.

## Authentication note

The previous app did not enforce Firebase or Supabase sign-in in its routes.
The Firebase version adds staff email/password sign-in and server-verified
sessions. Existing Supabase passwords are not copied by the data migration; add
staff accounts in Firebase Authentication and include their emails in the
allowlist.
