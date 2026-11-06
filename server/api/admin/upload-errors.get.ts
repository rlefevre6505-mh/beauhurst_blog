import { getQuery } from 'h3'
import { listUploadErrors } from '../../utils/upload-error-logs'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const rawPage = Number(getQuery(event).page ?? 1)
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1
  return listUploadErrors(page)
})
