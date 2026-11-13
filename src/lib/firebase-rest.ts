import "server-only";

import { importPKCS8, SignJWT } from "jose";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

type FirestoreValue = Record<string, unknown>;
type FirestoreFields = Record<string, FirestoreValue>;
type FirestoreDocumentData = Record<string, any>;
type FirestoreDocument = { name: string; fields?: FirestoreFields };

let parsedServiceAccount: ServiceAccount | undefined;
let cachedAccessToken: { value: string; expiresAt: number } | undefined;
let accessTokenRequest: Promise<string> | undefined;

function getServiceAccount(): ServiceAccount {
  if (parsedServiceAccount) return parsedServiceAccount;

  const rawValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawValue) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");

  let value = rawValue.trim();
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    if (first === '"') {
      try {
        const decoded = JSON.parse(value) as unknown;
        value = typeof decoded === "string" ? decoded : value.slice(1, -1);
      } catch {
        value = value.slice(1, -1);
      }
    } else {
      value = value.slice(1, -1);
    }
  }

  let account: Partial<ServiceAccount>;
  try {
    account = JSON.parse(value) as Partial<ServiceAccount>;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid service account JSON.");
  }

  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error("Firebase service account JSON is missing required fields.");
  }

  parsedServiceAccount = {
    project_id: account.project_id,
    client_email: account.client_email,
    private_key: account.private_key.replace(/\\n/g, "\n"),
  };
  return parsedServiceAccount;
}

async function getGoogleAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }
  if (accessTokenRequest) return accessTokenRequest;

  accessTokenRequest = (async () => {
    const account = getServiceAccount();
    const signingKey = await importPKCS8(account.private_key, "RS256");
    const assertion = await new SignJWT({
      scope: [
        "https://www.googleapis.com/auth/datastore",
        "https://www.googleapis.com/auth/devstorage.read_write",
      ].join(" "),
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(account.client_email)
      .setSubject(account.client_email)
      .setAudience("https://oauth2.googleapis.com/token")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(signingKey);

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      cache: "no-store",
    });
    const result = await response.json() as { access_token?: unknown; expires_in?: unknown; error_description?: unknown };
    if (!response.ok || typeof result.access_token !== "string") {
      throw new Error(typeof result.error_description === "string"
        ? result.error_description
        : `Google token exchange failed with HTTP ${response.status}.`);
    }

    const lifetimeSeconds = typeof result.expires_in === "number" ? result.expires_in : 3600;
    cachedAccessToken = { value: result.access_token, expiresAt: Date.now() + lifetimeSeconds * 1000 };
    return result.access_token;
  })();

  try {
    return await accessTokenRequest;
  } finally {
    accessTokenRequest = undefined;
  }
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: "NULL_VALUE" };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === "object") return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } };
  throw new Error(`Unsupported Firestore value: ${typeof value}`);
}

function encodeFields(data: Record<string, unknown>): FirestoreFields {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));
}

function decodeValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("bytesValue" in value) return value.bytesValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("geoPointValue" in value) return value.geoPointValue;
  if ("arrayValue" in value) {
    const arrayValue = value.arrayValue as { values?: FirestoreValue[] };
    return (arrayValue.values ?? []).map(decodeValue);
  }
  if ("mapValue" in value) {
    const mapValue = value.mapValue as { fields?: FirestoreFields };
    return decodeFields(mapValue.fields ?? {});
  }
  return undefined;
}

function decodeFields(fields: FirestoreFields = {}): FirestoreDocumentData {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)])) as FirestoreDocumentData;
}

async function googleRequest(url: string, init: RequestInit = {}) {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
    const message = typeof body?.error?.message === "string" ? body.error.message : response.statusText;
    throw new Error(`Google API request failed (${response.status}): ${message}`);
  }

  return response;
}

function firestoreRoot() {
  const { project_id: projectId } = getServiceAccount();
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
}

function documentName(path: string) {
  return `${firestoreRoot()}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function encodeDocumentPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function fieldMaskQuery(fieldPaths: string[]) {
  const query = new URLSearchParams();
  for (const fieldPath of fieldPaths) query.append("updateMask.fieldPaths", fieldPath);
  return query.toString();
}

async function readDocument(path: string) {
  const response = await googleRequest(documentName(path), { method: "GET" }).catch((error: unknown) => {
    if (error instanceof Error && error.message.startsWith("Google API request failed (404):")) return null;
    throw error;
  });
  return response ? await response.json() as FirestoreDocument : null;
}

function makeDocumentSnapshot(document: FirestoreDocument | null, id: string) {
  const data = document ? decodeFields(document.fields) : {};
  return {
    id,
    exists: Boolean(document),
    data: () => data,
    get: (field: string) => data?.[field],
  };
}

function makeDocumentReference(collection: string, id: string) {
  const path = `${collection}/${id}`;
  const name = documentName(path);
  return {
    id,
    path,
    get: async () => makeDocumentSnapshot(await readDocument(path), id),
    set: async (data: Record<string, unknown>, options?: { merge?: boolean }) => {
      const encoded = { fields: encodeFields(data) };
      const mask = options?.merge ? fieldMaskQuery(Object.keys(data)) : "";
      const suffix = mask ? `?${mask}` : "";
      await googleRequest(`${name}${suffix}`, { method: "PATCH", body: JSON.stringify(encoded) });
    },
    update: async (data: Record<string, unknown>) => {
      const mask = fieldMaskQuery(Object.keys(data));
      await googleRequest(`${name}?${mask}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: encodeFields(data) }),
      });
    },
    delete: async () => {
      await googleRequest(name, { method: "DELETE" });
    },
  };
}

export async function getStaffFirestore() {
  return {
    collection(collectionName: string) {
      const collectionPath = encodeDocumentPath(collectionName);
      return {
        doc(id?: string) {
          return makeDocumentReference(collectionPath, id ?? crypto.randomUUID());
        },
        get: async () => {
          const docs: Array<ReturnType<typeof makeDocumentSnapshot>> = [];
          let pageToken: string | undefined;
          do {
            const query = new URLSearchParams({ pageSize: "1000" });
            if (pageToken) query.set("pageToken", pageToken);
            const response = await googleRequest(`${firestoreRoot()}/${collectionPath}?${query}`, { method: "GET" });
            const result = await response.json() as {
              documents?: FirestoreDocument[];
              nextPageToken?: string;
            };
            for (const document of result.documents ?? []) {
              const id = document.name.split("/").at(-1) ?? "";
              docs.push(makeDocumentSnapshot(document, decodeURIComponent(id)));
            }
            pageToken = result.nextPageToken;
          } while (pageToken);
          return { docs };
        },
      };
    },
    batch() {
      const writes: Array<Record<string, unknown>> = [];
      return {
        update(reference: { path: string }, data: Record<string, unknown>) {
          writes.push({
            update: { name: documentName(reference.path), fields: encodeFields(data) },
            updateMask: { fieldPaths: Object.keys(data) },
          });
        },
        commit: async () => {
          if (!writes.length) return;
          await googleRequest(`${firestoreRoot()}:commit`, {
            method: "POST",
            body: JSON.stringify({ writes }),
          });
        },
      };
    },
  };
}

export async function uploadStaffObject(path: string, data: Uint8Array, contentType: string) {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) throw new Error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not configured.");
  const accessToken = await getGoogleAccessToken();
  const query = new URLSearchParams({ uploadType: "media", name: path });
  const response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?${query}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
    body: new Uint8Array(data),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
    const message = typeof body?.error?.message === "string" ? body.error.message : response.statusText;
    throw new Error(`Cloud Storage upload failed (${response.status}): ${message}`);
  }
}

export async function deleteStaffObject(path: string) {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) throw new Error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not configured.");
  const accessToken = await getGoogleAccessToken();
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok && response.status !== 404) {
    const body = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
    const message = typeof body?.error?.message === "string" ? body.error.message : response.statusText;
    throw new Error(`Cloud Storage delete failed (${response.status}): ${message}`);
  }
}

export async function downloadStaffObject(path: string) {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) throw new Error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not configured.");
  const accessToken = await getGoogleAccessToken();
  const query = new URLSearchParams({ alt: "media" });
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}?${query}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
    const message = typeof body?.error?.message === "string" ? body.error.message : response.statusText;
    throw new Error(`Cloud Storage download failed (${response.status}): ${message}`);
  }
  return {
    data: new Uint8Array(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}
