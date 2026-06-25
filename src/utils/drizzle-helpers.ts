import type { SQL } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm/column'
import { asc, desc, sql } from 'drizzle-orm'

/**
 * 解析 Mongoose 风格排序字符串（如 `-update_date`）。
 */
export function parseSortField(sort: string): { field: string, desc: boolean } {
    const descOrder = sort.startsWith('-')
    return {
        field: descOrder ? sort.slice(1) : sort,
        desc: descOrder,
    }
}

/**
 * 根据字段名与排序方向构建 orderBy 子句。
 */
export function buildOrderBy<T extends object>(
    table: T,
    sort: string,
    defaultField: keyof T & string = 'update_date' as keyof T & string,
): SQL {
    const { field, desc: isDesc } = parseSortField(sort || `-${defaultField}`)
    const column = table[field as keyof T]
    if (!column) {
        const fallback = table[defaultField]
        return isDesc ? desc(fallback as never) : asc(fallback as never)
    }
    return isDesc ? desc(column as never) : asc(column as never)
}

/**
 * 不区分大小写的模糊匹配模式。
 */
export function ilikePattern(key: string): string {
    return `%${key}%`
}

/**
 * 不区分大小写的列模糊匹配（SQLite / PostgreSQL 通用）。
 */
export function ilikeColumn(column: AnyColumn, key: string): SQL {
    return sql`lower(${column}) like lower(${ilikePattern(key)})`
}

/**
 * 列自增 1 的 SQL 表达式。
 */
export function increment(column: AnyColumn): SQL {
    return sql`${column} + 1`
}

/**
 * 列自减 1 的 SQL 表达式。
 */
export function decrement(column: AnyColumn): SQL {
    return sql`${column} - 1`
}
