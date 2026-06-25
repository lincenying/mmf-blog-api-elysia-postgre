import { config } from '~/config'

/** Elysia Cookie 字段最小操作面（用于登录后写入 HttpOnly Cookie）。 */
export interface ICookieField {
    value?: unknown
    maxAge?: number
    remove?: () => void
}

export interface IAdminSession {
    user: string
    userid: string
    username: string
}

export interface IUserSession {
    user: string
    userid: string
    username: string
    useremail?: string
}

/**
 * 写入后台管理员会话 Cookie（HttpOnly，有效期取自 config.jwt）。
 */
export function applyAdminSessionCookies(
    cookie: Record<string, ICookieField>,
    session: IAdminSession,
): void {
    const maxAge = config.jwt.expiresInSeconds
    cookie.b_user!.value = session.user
    cookie.b_userid!.value = session.userid
    cookie.b_username!.value = session.username
    cookie.b_user!.maxAge = maxAge
    cookie.b_userid!.maxAge = maxAge
    cookie.b_username!.maxAge = maxAge
}

/**
 * 清除后台管理员会话 Cookie。
 */
export function clearAdminSessionCookies(cookie: Record<string, ICookieField>): void {
    cookie.b_user?.remove?.()
    cookie.b_userid?.remove?.()
    cookie.b_username?.remove?.()
}

/**
 * 写入前台用户会话 Cookie。
 */
export function applyUserSessionCookies(
    cookie: Record<string, ICookieField>,
    session: IUserSession,
): void {
    const maxAge = config.jwt.expiresInSeconds
    cookie.user!.value = session.user
    cookie.userid!.value = session.userid
    cookie.username!.value = session.username
    if (session.useremail !== undefined) {
        cookie.useremail!.value = session.useremail
    }
    cookie.user!.maxAge = maxAge
    cookie.userid!.maxAge = maxAge
    cookie.username!.maxAge = maxAge
    cookie.useremail!.maxAge = maxAge
}

/**
 * 清除前台用户会话 Cookie。
 */
export function clearUserSessionCookies(cookie: Record<string, ICookieField>): void {
    cookie.user?.remove?.()
    cookie.userid?.remove?.()
    cookie.username?.remove?.()
    cookie.useremail?.remove?.()
}
