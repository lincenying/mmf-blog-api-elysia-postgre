/**
 * 嵌套 guard 或宽泛上下文里 Cookie value 常为 unknown，统一转成 string 便于传入业务层。
 */
export function cookieValue(value: unknown): string {
    return typeof value === 'string' ? value : ''
}

/**
 * query 字段在部分路由上下文推断偏宽时，收敛为可选 string。
 */
export function queryString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined
}
