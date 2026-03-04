import * as XLSX from 'xlsx'
import TrackedKeyword from '../../models/TrackedKeyword.js'
import KeywordRanking from '../../models/KeywordRanking.js'
import Property from '../../models/Property.js'

function parsePosition(val: unknown): number | null {
  if (val == null) return null
  if (typeof val === 'number') return isFinite(val) && val > 0 ? val : null
  if (typeof val === 'string') {
    const s = val.trim()
    if (!s || s === '-' || s.toUpperCase() === 'ND') return null
    const n = parseFloat(s)
    return !isNaN(n) && n > 0 ? n : null
  }
  return null
}

function parseHeaderDate(val: unknown): Date | null {
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  if (typeof val === 'string') {
    const d = new Date(val.trim())
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof val === 'number') {
    // Excel date serial number — xlsx may return these when cellDates is not set
    try {
      const parsed = XLSX.SSF.parse_date_code(val)
      if (parsed) {
        const d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
        return isNaN(d.getTime()) ? null : d
      }
    } catch {}
  }
  return null
}

interface ColPair {
  dateIndex: number
  urlIndex: number
  date: Date
  dateStr: string // YYYY-MM-DD, used as dedup key
}

export default defineEventHandler(async (event) => {
  const user = event.context.user

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'No form data received.' })
  }

  const filePart = formData.find((p) => p.name === 'file')
  const propPart = formData.find((p) => p.name === 'propertyId')

  if (!filePart?.data?.length) {
    throw createError({ statusCode: 400, message: 'No file uploaded.' })
  }
  if (!propPart?.data) {
    throw createError({ statusCode: 400, message: 'propertyId is required.' })
  }

  const propertyId = propPart.data.toString()

  const property = await (Property as any).findOne({ _id: propertyId, userId: user.id })
  if (!property) {
    throw createError({ statusCode: 403, message: 'Property not found or does not belong to you.' })
  }

  // --- Parse Excel ---
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(filePart.data, { type: 'buffer', cellDates: true })
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Could not parse the uploaded file. Please ensure it is a valid .xlsx or .xls file.',
    })
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw createError({ statusCode: 400, message: 'The Excel file contains no sheets.' })
  }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true })

  if (rows.length < 2) {
    throw createError({ statusCode: 400, message: 'File must have a header row and at least one data row.' })
  }

  // --- Validate header structure ---
  const header = rows[0] as unknown[]
  const firstCell = header[0] != null ? String(header[0]).trim().toLowerCase() : ''
  if (firstCell !== 'keyword') {
    throw createError({
      statusCode: 400,
      message: `First column header must be "Keyword" — found "${header[0]}".`,
    })
  }

  const remainingCols = header.length - 1
  if (remainingCols === 0) {
    throw createError({ statusCode: 400, message: 'No date columns found after the "Keyword" column.' })
  }
  if (remainingCols % 2 !== 0) {
    throw createError({
      statusCode: 400,
      message: `Expected an even number of columns after "Keyword" (date + URL pairs), got ${remainingCols}. Check that every date column has a matching URL column.`,
    })
  }

  // Parse each date/URL column pair from the header
  const colPairs: ColPair[] = []
  const headerErrors: string[] = []

  for (let i = 1; i < header.length; i += 2) {
    const rawDate = header[i]
    const date = parseHeaderDate(rawDate)
    if (!date) {
      headerErrors.push(`Column ${i + 1}: "${rawDate}" is not a recognizable date.`)
      continue
    }
    const dateStr = date.toISOString().split('T')[0]
    colPairs.push({ dateIndex: i, urlIndex: i + 1, date, dateStr })
  }

  if (headerErrors.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Header validation failed — invalid date columns:\n' + headerErrors.join('\n'),
    })
  }

  if (colPairs.length === 0) {
    throw createError({ statusCode: 400, message: 'No valid date columns found in the header.' })
  }

  const latestPair = colPairs[colPairs.length - 1]
  const previousPair = colPairs.length >= 2 ? colPairs[colPairs.length - 2] : null

  const dataRows = rows.slice(1) as unknown[][]
  const rowWarnings: string[] = []

  // --- TrackedKeyword processing ---
  const existingKws = await (TrackedKeyword as any)
    .find({ userId: user.id, propertyId })
    .select('keyword _id')
    .lean()

  const kwIdMap = new Map<string, string>()
  for (const kw of existingKws) {
    kwIdMap.set(kw.keyword, String(kw._id))
  }

  const docsToCreate: any[] = []
  let trackedSkipped = 0
  let trackedInvalidRows = 0

  for (let ri = 0; ri < dataRows.length; ri++) {
    const row = dataRows[ri]
    const keyword = row[0] != null ? String(row[0]).trim() : ''

    if (!keyword) {
      rowWarnings.push(`Row ${ri + 2}: empty keyword cell, row skipped.`)
      trackedInvalidRows++
      continue
    }

    if (kwIdMap.has(keyword)) {
      trackedSkipped++
      continue
    }

    const latestPos = parsePosition(row[latestPair.dateIndex])
    const latestUrlRaw = row[latestPair.urlIndex]
    const latestPage =
      latestUrlRaw != null && String(latestUrlRaw).trim() ? String(latestUrlRaw).trim() : null

    let previousPos: number | null = null
    let previousDate: Date | null = null
    if (previousPair) {
      previousPos = parsePosition(row[previousPair.dateIndex])
      previousDate = previousPair.date
    }

    const positionChange =
      latestPos != null && previousPos != null ? previousPos - latestPos : null

    docsToCreate.push({
      userId: user.id,
      propertyId,
      keyword,
      isActive: true,
      latestPosition: latestPos,
      latestDate: latestPair.date,
      latestPage,
      previousPosition: previousPos,
      previousDate,
      positionChange,
    })
  }

  let trackedCreated = 0
  if (docsToCreate.length > 0) {
    let inserted: any[]
    try {
      inserted = await (TrackedKeyword as any).insertMany(docsToCreate, { ordered: false })
    } catch (e: any) {
      // ordered:false — partial success possible on duplicate key collisions
      inserted = e.insertedDocs ?? []
    }
    trackedCreated = inserted.length
    for (const doc of inserted) {
      kwIdMap.set(doc.keyword, String(doc._id))
    }
  }

  // --- KeywordRanking processing ---
  interface Candidate {
    keyword: string
    position: number
    page: string | null
    date: Date
    dateStr: string
  }

  const candidates: Candidate[] = []
  for (const row of dataRows) {
    const keyword = row[0] != null ? String(row[0]).trim() : ''
    if (!keyword) continue
    for (const pair of colPairs) {
      const pos = parsePosition(row[pair.dateIndex])
      if (pos == null) continue
      const urlRaw = row[pair.urlIndex]
      const page = urlRaw != null && String(urlRaw).trim() ? String(urlRaw).trim() : null
      candidates.push({ keyword, position: pos, page, date: pair.date, dateStr: pair.dateStr })
    }
  }

  let rankingCreated = 0
  let rankingSkipped = 0

  if (candidates.length > 0) {
    // Fetch existing rankings to deduplicate before inserting
    const allKeywords = [...new Set(candidates.map((c) => c.keyword))]
    const allDates = [...new Set(candidates.map((c) => c.date))]

    const existingRankings = await (KeywordRanking as any)
      .find({
        userId: user.id,
        propertyId,
        keyword: { $in: allKeywords },
        date: { $in: allDates },
        source: 'specific_query',
      })
      .select('keyword date')
      .lean()

    const existingSet = new Set<string>()
    for (const r of existingRankings) {
      const ds = new Date(r.date).toISOString().split('T')[0]
      existingSet.add(`${r.keyword}|${ds}`)
    }

    const toInsert = candidates.filter((c) => !existingSet.has(`${c.keyword}|${c.dateStr}`))
    rankingSkipped = candidates.length - toInsert.length

    if (toInsert.length > 0) {
      const docs = toInsert.map((c) => ({
        userId: user.id,
        propertyId,
        keyword: c.keyword,
        trackedKeywordId: kwIdMap.get(c.keyword) ?? null,
        page: c.page,
        position: c.position,
        date: c.date,
        source: 'specific_query',
      }))

      try {
        const inserted = await (KeywordRanking as any).insertMany(docs, { ordered: false })
        rankingCreated = inserted.length
      } catch (e: any) {
        const inserted = e.insertedDocs ?? []
        rankingCreated = inserted.length
        rankingSkipped += toInsert.length - rankingCreated
      }
    }
  }

  return {
    success: true,
    results: {
      trackedKeywords: {
        created: trackedCreated,
        skipped: trackedSkipped,
        invalidRows: trackedInvalidRows,
      },
      rankings: {
        created: rankingCreated,
        skipped: rankingSkipped,
      },
      dateColumnsFound: colPairs.length,
      warnings: rowWarnings,
    },
  }
})
