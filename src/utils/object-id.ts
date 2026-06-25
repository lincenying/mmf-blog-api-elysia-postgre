/**
 * 生成 24 位十六进制 ID（兼容历史 ObjectId 格式）。
 */
export function generateObjectId(): string {
    const bytes = new Uint8Array(12)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 校验是否为合法的 24 位十六进制 ObjectId。
 */
export function isValidObjectId(id: string): boolean {
    return /^[a-f\d]{24}$/i.test(id)
}
