import { randomUUID } from 'node:crypto'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { deleteStoredObject, listStoredObjects, readStoredText, usesVercelBlob, writeStoredText } from './persistent-storage'

const logPath = join(process.cwd(), '.data', 'upload-errors.jsonl')
const blobLogPrefix = 'upload-errors/'
const maxLogBytes = 50_000_000
const pageSize = 20
let writeQueue = Promise.resolve()

export interface UploadErrorLog {
  id: string
  occurredAt: string
  csvContent: string | null
  csvBytes: number | null
  csvTruncated: boolean
  errorMessages: string[]
}

async function appendWithRotation(record: UploadErrorLog): Promise<void> {
  const line = `${JSON.stringify(record)}\n`
  const lineBytes = Buffer.byteLength(line)
  if (lineBytes > maxLogBytes) {
    throw new Error('The upload error record exceeds the configured log capacity.')
  }

  if (usesVercelBlob()) {
    const pathname = `${blobLogPrefix}${record.occurredAt}-${record.id}.json`
    await writeStoredText(pathname, JSON.stringify(record))
    const objects = (await listStoredObjects(blobLogPrefix)).sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
    let totalBytes = objects.reduce((total, object) => total + object.size, 0)
    for (const object of objects) {
      if (totalBytes <= maxLogBytes) break
      await deleteStoredObject(object.pathname)
      totalBytes -= object.size
    }
    return
  }

  await mkdir(join(process.cwd(), '.data'), { recursive: true })
  let existing = ''
  try {
    existing = await readFile(logPath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  if (Buffer.byteLength(existing) + lineBytes <= maxLogBytes) {
    await appendFile(logPath, line, 'utf8')
    return
  }

  const lines = existing.split('\n').filter(Boolean)
  const retained: string[] = []
  let retainedBytes = 0
  const availableBytes = maxLogBytes - lineBytes
  for (let index = lines.length - 1; index >= 0; index--) {
    const previousLine = lines[index]
    if (previousLine === undefined) continue
    const previousLineBytes = Buffer.byteLength(previousLine) + 1
    if (retainedBytes + previousLineBytes > availableBytes) break
    retained.unshift(previousLine)
    retainedBytes += previousLineBytes
  }
  await writeFile(logPath, `${retained.length ? `${retained.join('\n')}\n` : ''}${line}`, 'utf8')
}

export async function recordUploadError(
  csvBuffer: Buffer | null,
  errorMessages: string[],
  maxCsvBytes: number,
): Promise<void> {
  const operation = writeQueue.then(async () => {
    const csvBytes = csvBuffer?.length ?? null
    await appendWithRotation({
      id: randomUUID(),
      occurredAt: new Date().toISOString(),
      csvContent: csvBuffer
        ? csvBuffer.subarray(0, maxCsvBytes).toString('utf8')
        : null,
      csvBytes,
      csvTruncated: csvBytes !== null && csvBytes > maxCsvBytes,
      errorMessages,
    })
  })
  writeQueue = operation.catch(() => {})
  await operation
}

export async function listUploadErrors(page: number): Promise<{
  records: UploadErrorLog[]
  page: number
  pageSize: number
  total: number
}> {
  if (usesVercelBlob()) {
    const objects = (await listStoredObjects(blobLogPrefix)).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    const currentPage = Math.min(page, Math.max(1, Math.ceil(objects.length / pageSize)))
    const selected = objects.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    const records = (await Promise.all(selected.map(async (object) => {
      const content = await readStoredText(object.pathname)
      return content === null ? null : JSON.parse(content) as UploadErrorLog
    }))).filter((record): record is UploadErrorLog => record !== null)
    return { records, page: currentPage, pageSize, total: objects.length }
  }

  let content: string
  try {
    content = await readFile(logPath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { records: [], page, pageSize, total: 0 }
    }
    throw error
  }

  const lines = content.split('\n').filter(Boolean)
  const currentPage = Math.min(page, Math.max(1, Math.ceil(lines.length / pageSize)))
  const offset = (currentPage - 1) * pageSize
  const selected = lines.slice(Math.max(0, lines.length - offset - pageSize), lines.length - offset)
  const records = selected.map(line => JSON.parse(line) as UploadErrorLog).reverse()
  return { records, page: currentPage, pageSize, total: lines.length }
}
