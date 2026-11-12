import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

loadEnvConfig(process.cwd());

const SOURCE_BUCKET = "applicant-photos";
const COLLECTIONS = [
  "applicants",
  "scholars",
  "past_beneficiaries",
  "form_templates",
  "settings",
] as const;

type SourceFile = {
  path: string;
  contentType: string;
};

function getTargetProjectId() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("Set FIREBASE_SERVICE_ACCOUNT_JSON before running migration.");
  const serviceAccount = JSON.parse(serviceAccountJson) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Firebase service account JSON is missing required fields.");
  }

  const app = getApps().find((item) => item.name === "supabase-migration") ?? initializeApp(
    {
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
      }),
      projectId: serviceAccount.project_id,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    "supabase-migration"
  );

  const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (configuredProjectId && configuredProjectId !== serviceAccount.project_id) {
    throw new Error("Firebase web config project ID does not match the service account project ID.");
  }

  return { app, projectId: serviceAccount.project_id };
}

async function listSourceFiles(
  storage: SupabaseClient<any, any, any, any, any>["storage"],
  folder = ""
): Promise<SourceFile[]> {
  const output: SourceFile[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await storage.from(SOURCE_BUCKET).list(folder, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Could not list source storage folder "${folder}": ${error.message}`);
    if (!data.length) break;

    for (const entry of data) {
      const path = folder ? `${folder}/${entry.name}` : entry.name;
      if (entry.id == null) {
        output.push(...await listSourceFiles(storage, path));
      } else {
        const metadata = entry.metadata as Record<string, unknown> | null;
        output.push({
          path,
          contentType: String(metadata?.mimetype ?? metadata?.contentType ?? "application/octet-stream"),
        });
      }
    }

    offset += data.length;
    if (data.length < 100) break;
  }

  return output;
}

function isMissingSourceTable(error: { code?: string; message: string }) {
  return error.code === "PGRST205" || /could not find the table .* in the schema cache/i.test(error.message);
}

async function readAllRows(
  source: SupabaseClient<any, any, any, any, any>,
  table: string
): Promise<Array<Record<string, unknown>> | null> {
  const rows: Array<Record<string, unknown>> = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await source.from(table).select("*").range(offset, offset + pageSize - 1);
    if (error) {
      if (isMissingSourceTable(error)) {
        console.warn(`Warning: Supabase table "${table}" does not exist in the schema cache; skipping it.`);
        return null;
      }
      throw new Error(`Could not read Supabase table "${table}": ${error.message}`);
    }
    rows.push(...(data as Array<Record<string, unknown>>));
    if (data.length < pageSize) break;
  }
  return rows;
}

function extractSourceStoragePath(value: string) {
  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    const afterMarker = url.pathname.slice(markerIndex + marker.length);
    const bucketStart = afterMarker.indexOf(`${SOURCE_BUCKET}/`);
    if (bucketStart < 0) return null;
    return decodeURIComponent(afterMarker.slice(bucketStart + SOURCE_BUCKET.length + 1));
  } catch {
    return null;
  }
}

function rewriteFileReferences(value: unknown, copiedPaths: Set<string>): unknown {
  if (typeof value === "string") {
    const path = extractSourceStoragePath(value);
    return path && copiedPaths.has(path)
      ? `/api/files?path=${encodeURIComponent(`${SOURCE_BUCKET}/${path}`)}`
      : value;
  }
  if (Array.isArray(value)) return value.map((item) => rewriteFileReferences(item, copiedPaths));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, rewriteFileReferences(item, copiedPaths)])
    );
  }
  return value;
}

async function main() {
  const applying = process.argv.includes("--apply");
  const sourceUrl = process.env.MIGRATION_SUPABASE_URL;
  const sourceKey = process.env.MIGRATION_SUPABASE_SERVICE_ROLE_KEY;
  if (!sourceUrl || !sourceKey) {
    throw new Error("Set MIGRATION_SUPABASE_URL and MIGRATION_SUPABASE_SERVICE_ROLE_KEY for the read-only Supabase source.");
  }

  const source = createClient(sourceUrl, sourceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { app, projectId } = getTargetProjectId();
  const database = getFirestore(app);
  const sourceFiles = await listSourceFiles(source.storage);
  const rowsByCollection = new Map<string, Array<Record<string, unknown>>>();

  for (const collection of COLLECTIONS) {
    const rows = await readAllRows(source, collection);
    if (rows !== null) rowsByCollection.set(collection, rows);
  }

  console.log(`Target Firebase project: ${projectId}`);
  console.log("Supabase source will only be read; it will not be changed or deleted.");
  for (const [collection, rows] of rowsByCollection) console.log(`${collection}: ${rows.length} records`);
  console.log(`${SOURCE_BUCKET}: ${sourceFiles.length} files`);

  if (!applying) {
    console.log("Dry run only. Review counts, then rerun with --apply to copy data and files.");
    return;
  }

  const copiedPaths = new Set<string>();
  const targetBucket = getStorage(app).bucket();
  for (const sourceFile of sourceFiles) {
    const { data, error } = await source.storage.from(SOURCE_BUCKET).download(sourceFile.path);
    if (error || !data) throw new Error(`Could not download source file "${sourceFile.path}": ${error?.message ?? "empty file"}`);
    await targetBucket.file(`${SOURCE_BUCKET}/${sourceFile.path}`).save(
      Buffer.from(await data.arrayBuffer()),
      {
        resumable: false,
        metadata: {
          contentType: sourceFile.contentType || data.type || "application/octet-stream",
          cacheControl: "private, no-store",
        },
      }
    );
    copiedPaths.add(sourceFile.path);
  }

  let totalWritten = 0;
  for (const [collection, rows] of rowsByCollection) {
    for (let index = 0; index < rows.length; index += 450) {
      const batch = database.batch();
      for (const row of rows.slice(index, index + 450)) {
        const rowId = collection === "settings" ? "1" : String(row.id ?? "");
        if (!rowId || rowId.includes("/")) throw new Error(`A ${collection} row has no valid document ID.`);
        const record = rewriteFileReferences(row, copiedPaths) as Record<string, unknown>;
        batch.set(database.collection(collection).doc(rowId), record, { merge: true });
      }
      await batch.commit();
      totalWritten += rows.slice(index, index + 450).length;
    }
  }

  console.log(`Migration finished: copied ${copiedPaths.size} files and ${totalWritten} records.`);
  console.log("Review the Firebase counts and sample records before changing the website deployment configuration.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown migration error.";
  console.error(`Migration stopped: ${message}`);
  process.exitCode = 1;
});
