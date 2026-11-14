import { del, get, list, put } from '@vercel/blob'
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const dataDirectory = join(process.cwd(), '.data')

export interface StoredObject {
  pathname: string
  size: number
  uploadedAt: Date
}

export function usesVercelBlob(): boolean {
  const isVercel = process.env.VERCEL === '1'
  const hasBlobCredentials = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
  if (isVercel && !hasBlobCredentials) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Connect a private Vercel Blob store to persist uploaded blogs and error logs.',
    })
  }
  return isVercel || hasBlobCredentials
}

export async function readStoredText(pathname: string): Promise<string | null> {
  if (usesVercelBlob()) {
    const blob = await get(pathname, { access: 'private', useCache: false })
    return blob?.statusCode === 200 ? new Response(blob.stream).text() : null
  }

  try {
    return await readFile(join(dataDirectory, pathname), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function writeStoredText(pathname: string, content: string): Promise<void> {
  if (usesVercelBlob()) {
    await put(pathname, content, {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json; charset=utf-8',
    })
    return
  }

  const filePath = join(dataDirectory, pathname)
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content, { flag: 'wx' })
}

export async function listStoredObjects(prefix: string): Promise<StoredObject[]> {
  if (usesVercelBlob()) {
    const objects: StoredObject[] = []
    let cursor: string | undefined
    do {
      const page = await list({ prefix, cursor, access: 'private' })
      objects.push(...page.blobs.map(blob => ({
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })))
      cursor = page.hasMore ? page.cursor : undefined
    } while (cursor)
    return objects
  }

  let names: string[]
  try {
    names = await readdir(join(dataDirectory, prefix))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const files = await Promise.all(names.map(async (name) => {
    const pathname = `${prefix}${name}`
    const metadata = await stat(join(dataDirectory, pathname))
    return { pathname, size: metadata.size, uploadedAt: metadata.mtime }
  }))
  return files
}

export async function deleteStoredObject(pathname: string): Promise<boolean> {
  if (usesVercelBlob()) {
    const existing = await get(pathname, { access: 'private' })
    if (!existing) return false
    await del(pathname, { access: 'private' })
    return true
  }

  try {
    await unlink(join(dataDirectory, pathname))
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}
