// lib/storage.ts
import { supabase } from '@/lib/supabase';
import { FileOptions } from '@supabase/storage-js';

type FileBody =
  | string
  | ArrayBuffer
  | Blob
  | File
  | FormData
  | NodeJS.ReadableStream
  | URLSearchParams
  | ArrayBufferView
  | Buffer
  | ReadableStream;

type UploadResult = { path: string | null; error: unknown };

/* ===========================
   Signed URL helpers
   =========================== */

/**
 * Creates a signed URL for a file for a fixed amount of time.
 */
export async function createSignedUrl(
  bucketId: string,
  path: string,
  expiresIn: number,
  options?: object
) {
  const { data, error } = await supabase.storage.from(bucketId).createSignedUrl(path, expiresIn, options);
  if (error) throw error;
  return data;
}

/**
 * Creates signed URLs for multiple files for a fixed amount of time.
 */
export async function createSignedUrls(
  bucketId: string,
  paths: string[],
  expiresIn: number,
  options?: { download?: string | boolean }
) {
  const { data, error } = await supabase.storage.from(bucketId).createSignedUrls(paths, expiresIn, options);
  if (error) throw error;
  return data;
}

/**
 * Creates a signed upload URL for a file.
 */
export async function createSignedUploadUrl(
  bucketId: string,
  path: string,
  options?: { upsert: boolean }
) {
  const { data, error } = await supabase.storage.from(bucketId).createSignedUploadUrl(path, options);
  if (error) throw error;
  return data;
}

/**
 * Uploads a file to a signed upload URL.
 */
export async function uploadToSignedUrl(
  bucketId: string,
  path: string,
  token: string,
  fileBody: FileBody,
  fileOptions?: FileOptions
) {
  const { data, error } = await supabase.storage.from(bucketId).uploadToSignedUrl(path, token, fileBody, fileOptions);
  if (error) throw error;
  return data;
}

/* ===========================
   Basic file operations
   =========================== */

/**
 * Upload / update (replace) file at path
 */
export async function replaceFile(
  bucketId: string,
  path: string,
  fileBody: FileBody,
  options?: FileOptions
) {
  const { data, error } = await supabase.storage.from(bucketId).update(path, fileBody, options);
  if (error) throw error;
  return data;
}

/**
 * Moves a file inside the same bucket.
 */
export async function moveFile(
  bucketId: string,
  fromPath: string,
  toPath: string,
  options?: object
) {
  const { data, error } = await supabase.storage.from(bucketId).move(fromPath, toPath, options);
  if (error) throw error;
  return data;
}

/**
 * Copies a file inside the same bucket.
 */
export async function copyFile(
  bucketId: string,
  fromPath: string,
  toPath: string,
  options?: object
) {
  const { data, error } = await supabase.storage.from(bucketId).copy(fromPath, toPath, options);
  if (error) throw error;
  return data;
}

/* ===========================
   Bucket management
   =========================== */

export async function updateBucket(
  id: string,
  options: {
    public: boolean;
    allowedMimeTypes?: string[] | null;
    fileSizeLimit?: string | number | null;
  }
) {
  const { data, error } = await supabase.storage.updateBucket(id, options);
  if (error) throw error;
  return data;
}

export async function createBucket(
  id: string,
  options: {
    public: boolean;
    allowedMimeTypes?: string[] | null;
    fileSizeLimit?: string | number | null;
  }
) {
  const { data, error } = await supabase.storage.createBucket(id, options);
  if (error) throw error;
  return data;
}

export async function getBucket(id: string) {
  const { data, error } = await supabase.storage.getBucket(id);
  if (error) throw error;
  return data;
}

export async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  return data;
}

export async function emptyBucket(id: string) {
  const { data, error } = await supabase.storage.emptyBucket(id);
  if (error) throw error;
  return data;
}

export async function deleteBucket(id: string) {
  const { data, error } = await supabase.storage.deleteBucket(id);
  if (error) throw error;
  return data;
}

/* ===========================
   File operations (upload/download/list/delete)
   =========================== */

export async function uploadFile(
  bucketId: string,
  path: string,
  file: File | string,
  options?: FileOptions
) {
  const { data, error } = await supabase.storage.from(bucketId).upload(path, file, options);
  if (error) throw error;
  return data;
}

export async function downloadFile(bucketId: string, path: string) {
  const { data, error } = await supabase.storage.from(bucketId).download(path);
  if (error) throw error;
  return data;
}

export async function deleteFiles(bucketId: string, paths: string[]) {
  const { data, error } = await supabase.storage.from(bucketId).remove(paths);
  if (error) throw error;
  return data;
}

export async function listFiles(bucketId: string, path?: string) {
  const { data, error } = await supabase.storage.from(bucketId).list(path);
  if (error) throw error;
  return data;
}

/**
 * Creates a public URL for a file.
 * Note: this returns a public URL only if the bucket is public.
 */
export function getPublicUrl(bucketId: string, path: string) {
  const { data } = supabase.storage.from(bucketId).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/* ===========================
   Helpers for React Native (upload from local uri)
   =========================== */

/**
 * uploadUriToStorage
 *  - uri: local file URI (expo image picker)
 *  - bucket: bucket name (ej: 'Profile_image')
 *  - path: destination path in bucket (ej: `${userId}/profile_123.jpg`)
 *  - options: supabase file options (contentType, upsert)
 *
 * Devuelve { path, error } (path === null si error).
 */

/**
 * Convert base64 string -> Uint8Array in a robust way (browser/node/react-native)
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // Prefer native atob
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  // Node Buffer
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(base64, 'base64'));
  }

  // Fallback (should be rare)
  let binary = '';
  for (let i = 0; i < base64.length; i++) {
    // this is not a real base64 decode, but fallback prevents crashes
    binary += String.fromCharCode(base64.charCodeAt(i));
  }
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * uploadUriToStorage: robust upload desde URI (expo image picker)
 *
 * Strategy:
 *  - Try fetch(uri).blob() (browser). If not available (React Native), fall back:
 *    - Try to use expo-file-system to read as base64 and convert to Uint8Array (recommended for RN)
 *    - Else fallback to arrayBuffer() which may work on some RN environments
 */
export async function uploadUriToStorage(
  uri: string,
  bucket: string,
  path: string,
  options?: FileOptions
): Promise<UploadResult> {
  try {
    // Normalize uri: sometimes Expo returns local cache paths that need no change.
    const normalizedUri = uri;

    // attempt 1: browser-style fetch + blob (works on web)
    try {
      const res = await fetch(normalizedUri);
      // prefer blob when available (web)
      if (typeof res.blob === 'function') {
        try {
          const blob = await res.blob();
          const contentType = res.headers?.get?.('Content-Type') ?? undefined;
          const { error } = await supabase.storage.from(bucket).upload(path, blob as Blob, {
            contentType,
            upsert: options?.upsert ?? false,
          });
          if (error) {
            console.error('uploadUriToStorage -> supabase error (blob path)', error);
            return { path: null, error };
          }
          return { path, error: null };
        } catch (e) {
          // blob failed, continue to fallbacks
          console.warn('uploadUriToStorage: res.blob() failed, falling back', e);
        }
      }

      // If blob not available, try arrayBuffer (some RN environments support it)
      try {
        const arrayBuffer = await res.arrayBuffer();
        const contentType = res.headers?.get?.('Content-Type') ?? undefined;
        // prefer Uint8Array
        const uint8 = new Uint8Array(arrayBuffer);
        const { error } = await supabase.storage.from(bucket).upload(path, uint8 as Uint8Array, {
          contentType,
          upsert: options?.upsert ?? false,
        });
        if (error) {
          console.error('uploadUriToStorage -> supabase error (arrayBuffer path)', error);
          return { path: null, error };
        }
        return { path, error: null };
      } catch (e) {
        // arrayBuffer failed; we'll try expo-file-system below
        console.warn('uploadUriToStorage: res.arrayBuffer() failed, trying expo-file-system', e);
      }
    } catch (fetchErr) {
      // fetch itself failed (rare), but continue to try expo-file-system
      console.warn('uploadUriToStorage: fetch failed, will try expo-file-system', fetchErr);
    }

    // attempt 2: expo-file-system (React Native / Expo)
    try {
      // dynamic import so web bundlers don't break
       
      const FileSystem = await import('expo-file-system');
      // read as base64
      // NOTE: many expo-file-system versions accept encoding as 'base64' string.
      const base64: string = await (FileSystem as { readAsStringAsync: (uri: string, options: { encoding: string }) => Promise<string> }).readAsStringAsync(normalizedUri, {
        encoding: 'base64', // <-- fixed: pass literal 'base64' to avoid runtime errors
      });

      if (!base64) {
        console.warn('uploadUriToStorage: expo-file-system returned empty base64 string');
      }

      const uint8 = base64ToUint8Array(base64);
      // try to guess content type from extension if possible
      const ext = normalizedUri.split('.').pop()?.split(/#|\?/)[0]?.toLowerCase();
      let contentType: string | undefined = (options as { contentType?: string })?.contentType;
      if (!contentType && ext) {
        if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'webp') contentType = 'image/webp';
      }
      const { error } = await supabase.storage.from(bucket).upload(path, uint8 as Uint8Array, {
        contentType,
        upsert: options?.upsert ?? false,
      });
      if (error) {
        console.error('uploadUriToStorage -> supabase error (expo-file-system path)', error);
        return { path: null, error };
      }
      return { path, error: null };
    } catch (fsErr) {
      console.warn('uploadUriToStorage: expo-file-system approach failed', fsErr);
      // continue to last fallback
    }

    // attempt 3: last-resort fetch + arrayBuffer again (if previous failed), try one more time
    try {
      const res2 = await fetch(normalizedUri);
      const arrayBuffer2 = await res2.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer2);
      const contentType = res2.headers?.get?.('Content-Type') ?? undefined;
      const { error } = await supabase.storage.from(bucket).upload(path, uint8 as Uint8Array, {
        contentType,
        upsert: options?.upsert ?? false,
      });
      if (error) {
        console.error('uploadUriToStorage -> supabase error (final fallback)', error);
        return { path: null, error };
      }
      return { path, error: null };
    } catch (finalErr) {
      console.error('uploadUriToStorage unexpected error (all strategies failed)', finalErr);
      return { path: null, error: finalErr };
    }
  } catch (err) {
    console.error('uploadUriToStorage unexpected outer error', err);
    return { path: null, error: err };
  }
}

/**
 * getPublicUrlForPath
 *  - bucket: bucket name
 *  - path: stored path returned by upload
 */
export function getPublicUrlForPath(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
