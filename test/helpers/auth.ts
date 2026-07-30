import { signSessionToken } from '~/utils/jwt-token'

import { FIXTURES } from './fixtures'

/**
 * 将 Cookie 键值拼成 Header 字符串。
 */
function buildCookieHeader(parts: Record<string, string>): string {
    return Object.entries(parts)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('; ')
}

/**
 * 签发后台管理员会话 Cookie。
 */
export function adminCookie(
    overrides: Partial<{ id: string, username: string }> = {},
): string {
    const id = overrides.id ?? FIXTURES.admin.id
    const username = encodeURI(overrides.username ?? FIXTURES.admin.username)
    const token = signSessionToken({ id, username }, 'admin')
    return buildCookieHeader({
        b_user: token,
        b_userid: id,
        b_username: username,
    })
}

/**
 * 签发前台用户会话 Cookie。
 */
export function userCookie(
    overrides: Partial<{ id: string, username: string }> = {},
): string {
    const id = overrides.id ?? FIXTURES.user.id
    const username = encodeURI(overrides.username ?? FIXTURES.user.username)
    const token = signSessionToken({ id, username }, 'user')
    return buildCookieHeader({
        user: token,
        userid: id,
        username,
    })
}

/**
 * 同时携带管理员与前台用户 Cookie（部分前台路由叠了两层 guard）。
 */
export function adminAndUserCookie(
    adminOverrides?: Partial<{ id: string, username: string }>,
    userOverrides?: Partial<{ id: string, username: string }>,
): string {
    return `${adminCookie(adminOverrides)}; ${userCookie(userOverrides)}`
}
