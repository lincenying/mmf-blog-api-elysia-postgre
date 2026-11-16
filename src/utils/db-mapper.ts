/**
 * 为 Drizzle 行补充 Mongoose 兼容的 id 虚拟字段。
 */
export function withVirtualId<T extends { _id: string }>(row: T): T & { id: string } {
    return { ...row, id: row._id }
}

/**
 * 批量补充 id 虚拟字段。
 */
export function withVirtualIds<T extends { _id: string }>(rows: T[]): Array<T & { id: string }> {
    return rows.map(withVirtualId)
}

/**
 * 去掉密码字段后再返回给调用方。
 */
export function withoutPassword<T extends { password: string }>(row: T): Omit<T, 'password'> {
    const { password: _password, ...safe } = row
    return safe
}
