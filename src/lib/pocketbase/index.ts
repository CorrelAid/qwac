import PocketBase, { type AuthProviderInfo, RecordService } from "pocketbase";
import type {
  AuthModel,
  ListResult,
  RecordListOptions,
  RecordModel,
  UnsubscribeFunc,
} from "pocketbase";
import { readable, type Readable, type Subscriber } from "svelte/store";
import { browser } from "$app/environment";
import { invalidateAll } from "$app/navigation";
import { PUBLIC_POCKETBASE_URL } from "$env/static/public";

// For Jamstack development, we often need to point to the specific backend URL.
// In production, if served by PocketBase, it can be empty string or origin.
const POCKETBASE_URL = PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";

export const client = new PocketBase(POCKETBASE_URL);

/** If the error is a 401, clear stale auth so the login screen appears. */
export function clearOnAuthError(err: unknown): void {
  if (
    client.authStore.isValid &&
    err &&
    typeof err === "object" &&
    "status" in err &&
    (err as any).status === 401
  ) {
    client.authStore.clear();
  }
}

export const authModel = readable<AuthModel | null>(
  null,
  function (set, update) {
    if (!browser) return;
    
    // Set initial value
    set(client.authStore.model);

    const unsub = client.authStore.onChange((token, model) => {
      update((oldval) => {
        if (
          (oldval?.isValid && !model?.isValid) ||
          (!oldval?.isValid && model?.isValid)
        ) {
          // if the auth changed, invalidate all page load data
          invalidateAll();
        }
        return model;
      });
    }, true);

    return unsub;
  }
);

// On startup, verify that a persisted token is still valid against the backend.
// If the backend was recreated, the user record no longer exists and we should log out.
if (browser && client.authStore.isValid) {
  client.collection("users").authRefresh().catch(() => {
    client.authStore.clear();
  });
}

export async function login(
  email: string,
  password: string
) {
  try {
    const authData = await client.collection("users").authWithPassword(email, password);
    return authData;
  } catch (e: any) {
    throw e;
  }
}

export function logout() {
  client.authStore.clear();
}

/** Reject API paths that don't start with /api/ or contain traversal sequences. */
function assertSafePath(path: string): void {
  if (!path.startsWith("/api/")) {
    throw new Error("API path must start with /api/");
  }
  if (path.includes("..") || path.includes("//")) {
    throw new Error("API path contains invalid sequences");
  }
}

/** Fetch text from a custom PocketBase API endpoint (authenticated). */
export async function fetchApiText(path: string): Promise<string> {
  assertSafePath(path);
  const res = await fetch(`${POCKETBASE_URL}${path}`, {
    headers: { 'Authorization': client.authStore.token },
  });
  if (!res.ok) {
    const err = { status: res.status, message: res.statusText };
    clearOnAuthError(err);
    throw err;
  }
  return res.text();
}

/** Fetch JSON from a custom PocketBase API endpoint (authenticated). Supports custom request options (method, body, etc). */
export async function fetchApiJson(path: string, options?: RequestInit): Promise<any> {
  assertSafePath(path);
  const res = await fetch(`${POCKETBASE_URL}${path}`, {
    ...options,
    headers: { 'Authorization': client.authStore.token, ...options?.headers },
  });
  const json = await res.json();
  if (!res.ok) {
    clearOnAuthError({ status: res.status });
    throw json;
  }
  return json;
}

/** Fetch a blob from a custom PocketBase API endpoint (authenticated). */
export async function fetchApiBlob(path: string): Promise<Blob> {
  assertSafePath(path);
  const res = await fetch(`${POCKETBASE_URL}${path}`, {
    headers: { 'Authorization': client.authStore.token },
  });
  if (!res.ok) {
    const err = { status: res.status, message: res.statusText };
    clearOnAuthError(err);
    throw err;
  }
  return res.blob();
}

/**
 * Save (create/update) a record.
 */
export async function save<T>(collection: string, record: any, create = false) {
  const data = object2formdata(record);
  if (record.id && !create) {
    return await client.collection(collection).update<T>(record.id, data).catch((e) => { clearOnAuthError(e); throw e; });
  } else {
    return await client.collection(collection).create<T>(data).catch((e) => { clearOnAuthError(e); throw e; });
  }
}

function object2formdata(obj: any) {
  if (
    !Object.values(obj).some(
      (val) => val instanceof FileList || val instanceof File
    )
  ) {
    return obj;
  }
  const fd = new FormData();
  for (const [key, val] of Object.entries(obj)) {
    if (val instanceof FileList) {
      for (const file of val) {
        fd.append(key, file);
      }
    } else if (val instanceof File) {
      fd.append(key, val);
    } else if (Array.isArray(val)) {
      fd.append(key, val.join(","));
    } else if (typeof val === "object" && val !== null) {
      fd.append(key, JSON.stringify(val));
    } else {
      fd.append(key, val as any);
    }
  }
  return fd;
}

export interface PageStore<T = any> extends Readable<ListResult<T>> {
  setPage(newpage: number): Promise<void>;
  next(): Promise<void>;
  prev(): Promise<void>;
}

export async function watch<T extends RecordModel>(
  idOrName: string,
  queryParams = {} as RecordListOptions,
  page = 1,
  perPage = 20,
  realtime = browser
): Promise<PageStore<T>> {
  const collection = client.collection(idOrName);
  let result = await collection.getList<T>(page, perPage, { ...queryParams, requestKey: null }).catch((e) => { clearOnAuthError(e); throw e; });
  let set: Subscriber<ListResult<T>>;
  let unsubRealtime: UnsubscribeFunc | undefined;

  const store = readable<ListResult<T>>(result, (_set) => {
    set = _set;
    if (realtime)
      collection
        .subscribe<T>(
          "*",
          (e) => {
             // Refresh list on any change for simplicity in this basic version
             collection.getList<T>(result.page, result.perPage, queryParams)
               .then(res => {
                 result = res;
                 set(result);
               });
          },
          queryParams
        )
        .then((unsub) => (unsubRealtime = unsub));
    
    return () => {
      if (unsubRealtime) unsubRealtime();
    };
  });

  async function setPage(newpage: number) {
    if (newpage > 0 && newpage <= result.totalPages) {
      result = await collection.getList(newpage, result.perPage, queryParams);
      set(result);
    }
  }

  return {
    ...store,
    subscribe: store.subscribe,
    setPage,
    async next() {
      await setPage(result.page + 1);
    },
    async prev() {
      await setPage(result.page - 1);
    },
  };
}
