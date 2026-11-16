const MAX_PAGE_SIZE = 100
const MAX_PAGE = 10_000

/**
 * 把页码和每页条数收成安全范围，避免过大的 limit。
 */
export function normalizePage(pageValue: unknown, limitValue: unknown, defaultLimit: number) {
    const pageNumber = Math.trunc(Number(pageValue))
    const limitNumber = Math.trunc(Number(limitValue))
    const fallbackLimit = Math.min(Math.max(defaultLimit, 1), MAX_PAGE_SIZE)
    const page = Number.isFinite(pageNumber) && pageNumber > 0 ? Math.min(pageNumber, MAX_PAGE) : 1
    const limit = Number.isFinite(limitNumber) && limitNumber > 0
        ? Math.min(limitNumber, MAX_PAGE_SIZE)
        : fallbackLimit

    return {
        page,
        limit,
        offset: (page - 1) * limit,
    }
}
