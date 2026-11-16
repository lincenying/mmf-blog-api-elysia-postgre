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
 * 只把 Drizzle 列交给 orderBy。表对象上的 constructor 等方法不能当排序字段。
 */
function isSqlColumn(value: unknown): value is AnyColumn {
    return typeof value === 'object'
        && value !== null
        && 'name' in value
        && 'table' in value
}

/**
 * 根据字段名与排序方向构建 orderBy 子句。未知字段回退到默认列。
 */
export function buildOrderBy<T extends object>(
    table: T,
    sort: string,
    defaultField: keyof T & string = 'update_date' as keyof T & string,
): SQL {
    const { field, desc: isDesc } = parseSortField(sort || `-${defaultField}`)
    const column = table[field as keyof T]
    const fallback = table[defaultField]
    const target = isSqlColumn(column) ? column : fallback
    const descending = isSqlColumn(column) ? isDesc : true
    return descending ? desc(target as AnyColumn) : asc(target as AnyColumn)
}

/**
 * 不区分大小写的模糊匹配模式。`%`、`_` 和反斜杠按字面量转义。
 */
export function ilikePattern(key: string): string {
    const escaped = key.replace(/[\\%_]/g, match => `\\${match}`)
    return `%${escaped}%`
}

/**
 * 不区分大小写的列模糊匹配（SQLite / PostgreSQL 通用）。
 */
export function ilikeColumn(column: AnyColumn, key: string): SQL {
    return sql`lower(${column}) like lower(${ilikePattern(key)}) escape '\\'`
}

/**
 * 列自增 1 的 SQL 表达式。
 */
export function increment(column: AnyColumn): SQL {
    return sql`${column} + 1`
}

/**
 * 列自减 1 的 SQL 表达式。计数已经是 0 时保持为 0。
 */
export function decrement(column: AnyColumn): SQL {
    return sql`case when ${column} > 0 then ${column} - 1 else 0 end`
}
