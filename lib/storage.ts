/**
 * Creates a signed URL for a file for a fixed amount of time.
 *
 * @param {string} bucketId - The bucket where the file is stored.
 * @param {string} path - The file path (e.g., folder/image.png).
 * @param {number} expiresIn - Number of seconds until the signed URL expires.
 * @param {object} [options] - Optional options object.
 */
export async function createSignedUrl(
  bucketId: string,
  path: string,
  expiresIn: number,
  options?: object
) {
  const { data, error } = await supabase.storage.from(bucketId).createSignedUrl(path, expiresIn, options)
  if (error) throw error
  return data
}

/**
 * Creates signed URLs for multiple files for a fixed amount of time.
 *
 * @param {string} bucketId - The bucket where the files are stored.
 * @param {string[]} paths - Array of file paths.
 * @param {number} expiresIn - Number of seconds until the signed URLs expire.
 * @param {object} [options] - Optional options object.
 */
/**
 * Creates signed URLs for multiple files for a fixed amount of time.
 *
 * @param {string} bucketId - The bucket where the files are stored.
 * @param {string[]} paths - Array of file paths.
 * @param {number} expiresIn - Number of seconds until the signed URLs expire.
 * @param {{ download?: string | boolean }} [options] - Optional options object.
 */
/**
 * Creates signed URLs for multiple files for a fixed amount of time.
 *
 * @param {string} bucketId - The bucket where the files are stored.
 * @param {string[]} paths - Array of file paths.
 * @param {number} expiresIn - Number of seconds until the signed URLs expire.
 * @param {{ download: string | boolean }} options - Options object (download required).
 */
export async function createSignedUrls(
  bucketId: string,
  paths: string[],
  expiresIn: number,
  options: { download: string | boolean }
) {
  const { data, error } = await supabase.storage.from(bucketId).createSignedUrls(paths, expiresIn, options)
  if (error) throw error
  return data
}

/**
 * Creates a signed upload URL for a file.
 *
 * @param {string} bucketId - The bucket where the file will be stored.
 * @param {string} path - The file path (e.g., folder/image.png).
 * @param {object} [options] - Optional options object.
 */
/**
 * Creates a signed upload URL for a file.
 *
 * @param {string} bucketId - The bucket where the file will be stored.
 * @param {string} path - The file path (e.g., folder/image.png).
 * @param {{ upsert: boolean }} [options] - Optional options object (upsert required).
 */
export async function createSignedUploadUrl(
  bucketId: string,
  path: string,
  options?: { upsert: boolean }
) {
  const { data, error } = await supabase.storage.from(bucketId).createSignedUploadUrl(path, options)
  if (error) throw error
  return data
}

/**
 * Uploads a file to a signed upload URL.
 *
 * @param {string} bucketId - The bucket where the file will be stored.
 * @param {string} path - The file path (e.g., folder/image.png).
 * @param {string} token - The token generated from createSignedUploadUrl.
 * @param {any} fileBody - The file body to upload.
 * @param {FileOptions} [fileOptions] - Optional file options.
 */
export async function uploadToSignedUrl(
  bucketId: string,
  path: string,
  token: string,
  fileBody: any,
  fileOptions?: FileOptions
) {
  const { data, error } = await supabase.storage.from(bucketId).uploadToSignedUrl(path, token, fileBody, fileOptions)
  if (error) throw error
  return data
}
/**
 * Replaces an existing file at the specified path with a new one.
 *
 * @param {string} bucketId - The bucket to update in.
 * @param {string} path - The file path (e.g., folder/file.png).
 * @param {any} fileBody - The new file body (string, ArrayBuffer, Blob, etc.).
 * @param {FileOptions} [options] - File options.
 */
export async function replaceFile(
  bucketId: string,
  path: string,
  fileBody: any,
  options?: FileOptions
) {
  const { data, error } = await supabase.storage.from(bucketId).update(path, fileBody, options)
  if (error) throw error
  return data
}

/**
 * Moves an existing file to a new path in the same bucket.
 *
 * @param {string} bucketId - The bucket to move in.
 * @param {string} fromPath - The original file path.
 * @param {string} toPath - The new file path.
 * @param {object} [options] - Destination options.
 */
export async function moveFile(
  bucketId: string,
  fromPath: string,
  toPath: string,
  options?: object
) {
  const { data, error } = await supabase.storage.from(bucketId).move(fromPath, toPath, options)
  if (error) throw error
  return data
}

/**
 * Copies an existing file to a new path in the same bucket.
 *
 * @param {string} bucketId - The bucket to copy in.
 * @param {string} fromPath - The original file path.
 * @param {string} toPath - The new file path.
 * @param {object} [options] - Destination options.
 */
export async function copyFile(
  bucketId: string,
  fromPath: string,
  toPath: string,
  options?: object
) {
  const { data, error } = await supabase.storage.from(bucketId).copy(fromPath, toPath, options)
  if (error) throw error
  return data
}
import { supabase } from '@/lib/supabase'
import { FileOptions } from '@supabase/storage-js'


// -----------------------------
// Bucket Operations
// -----------------------------
/**
 * Updates a Storage bucket.
 *
 * @param {string} id - The unique identifier of the bucket.
 * @param {object} options - Bucket options to update.
 * @param {boolean} [options.public] - The visibility of the bucket.
 * @param {string[] | null} [options.allowedMimeTypes] - Allowed mime types.
 * @param {string | number | null} [options.fileSizeLimit] - Max file size.
 */
/**
 * Updates a Storage bucket.
 *
 * @param {string} id - The unique identifier of the bucket.
 * @param {object} options - Bucket options to update. 'public' is required.
 * @param {boolean} options.public - The visibility of the bucket.
 * @param {string[] | null} [options.allowedMimeTypes] - Allowed mime types.
 * @param {string | number | null} [options.fileSizeLimit] - Max file size.
 */
export async function updateBucket(
  id: string,
  options: {
    public: boolean
    allowedMimeTypes?: string[] | null
    fileSizeLimit?: string | number | null
  }
) {
  const { data, error } = await supabase.storage.updateBucket(id, options)
  if (error) throw error
  return data
}

/**
 * Creates a new Storage bucket.
 *
 * @param {string} id - A unique identifier for the bucket.
 * @param {object} options - Bucket options.
 * @param {boolean} [options.public=false] - The visibility of the bucket.
 * @param {string[] | null} [options.allowedMimeTypes=null] - Allowed mime types.
 * @param {string | number | null} [options.fileSizeLimit=null] - Max file size.
 */
export async function createBucket(
  id: string,
  options: {
    public: boolean
    allowedMimeTypes?: string[] | null
    fileSizeLimit?: string | number | null
  }
) {
  const { data, error } = await supabase.storage.createBucket(id, options)
  if (error) throw error
  return data
}

/**
 * Retrieves the details of an existing storage bucket.
 *
 * @param {string} id - The unique identifier of the bucket.
 */
export async function getBucket(id: string) {
  const { data, error } = await supabase.storage.getBucket(id)
  if (error) throw error
  return data
}

/**
 * Retrieves the list of all storage buckets.
 */
export async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) throw error
  return data
}

/**
 * Empties a storage bucket.
 *
 * @param {string} id - The unique identifier of the bucket.
 */
export async function emptyBucket(id: string) {
  const { data, error } = await supabase.storage.emptyBucket(id)
  if (error) throw error
  return data
}

/**
 * Deletes a storage bucket.
 *
 * @param {string} id - The unique identifier of the bucket.
 */
export async function deleteBucket(id: string) {
  const { data, error } = await supabase.storage.deleteBucket(id)
  if (error) throw error
  return data
}

// -----------------------------
// File Operations
// -----------------------------

/**
 * Uploads a file to a bucket.
 *
 * @param {string} bucketId - The bucket to upload to.
 * @param {string} path - The path and name of the file.
 * @param {File | string} file - The file to upload.
 * @param {FileOptions} [options] - File options.
 */
export async function uploadFile(
  bucketId: string,
  path: string,
  file: File | string,
  options?: FileOptions
) {
  const { data, error } = await supabase.storage
    .from(bucketId)
    .upload(path, file, options)
  if (error) throw error
  return data
}

/**
 * Downloads a file from a bucket.
 *
 * @param {string} bucketId - The bucket to download from.
 * @param {string} path - The path and name of the file.
 */
export async function downloadFile(bucketId: string, path: string) {
  const { data, error } = await supabase.storage.from(bucketId).download(path)
  if (error) throw error
  return data
}

/**
 * Deletes files from a bucket.
 *
 * @param {string} bucketId - The bucket to delete from.
 * @param {string[]} paths - An array of file paths to delete.
 */
export async function deleteFiles(bucketId: string, paths: string[]) {
  const { data, error } = await supabase.storage.from(bucketId).remove(paths)
  if (error) throw error
  return data
}

/**
 * Lists all the files within a bucket.
 *
 * @param {string} bucketId - The bucket to list files from.
 * @param {string} [path] - The folder path to list files from.
 */
export async function listFiles(bucketId: string, path?: string) {
  const { data, error } = await supabase.storage.from(bucketId).list(path)
  if (error) throw error
  return data
}

/**
 * Creates a public URL for a file.
 *
 * @param {string} bucketId - The bucket where the file is stored.
 * @param {string} path - The path and name of the file.
 */
export function getPublicUrl(bucketId: string, path: string) {
  const { data } = supabase.storage.from(bucketId).getPublicUrl(path)
  return data.publicUrl
}