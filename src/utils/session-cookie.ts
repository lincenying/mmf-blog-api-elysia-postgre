import { config } from '~/config'

/** Elysia Cookie 字段最小操作面（用于登录后写入、退出时清除）。 */
export interface ICookieField {
    value?: unknown
    maxAge?: number
    path?: string
    expires?: Date
    httpOnly?: boolean
    secure?: boolean
    sameSite?: boolean | 'strict' | 'lax' | 'none'
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
 * 写入一枚会话 Cookie。不设置 Secure，HTTP 测试环境也能写入。
 */
function writeSessionCookie(field: ICookieField | undefined, value: string, maxAge: number): void {
    if (!field)
        return

    field.value = value
    field.maxAge = maxAge
    field.path = '/'
    field.httpOnly = true
    field.sameSite = 'strict'
    field.secure = false
}

/**
 * 写入后台管理员会话 Cookie（HttpOnly，有效期取自 config.jwt）。
 */
export function applyAdminSessionCookies(
    cookie: Record<string, ICookieField>,
    session: IAdminSession,
): void {
    const maxAge = config.jwt.expiresInSeconds
    writeSessionCookie(cookie.b_user, session.user, maxAge)
    writeSessionCookie(cookie.b_userid, session.userid, maxAge)
    writeSessionCookie(cookie.b_username, session.username, maxAge)
}

/**
 * 通知浏览器删除指定 Cookie。
 * Elysia 的 remove() 仅在请求已带回该 Cookie 时才写 Set-Cookie，未带回时退出不会生效。
 */
function expireCookie(field: ICookieField | undefined): void {
    if (!field) {
        return
    }
    field.path = '/'
    field.value = ''
    field.maxAge = 0
    field.expires = new Date(0)
    field.httpOnly = true
    field.sameSite = 'strict'
    field.secure = false
}

/**
 * 清除后台管理员会话 Cookie。
 */
export function clearAdminSessionCookies(cookie: Record<string, ICookieField>): void {
    expireCookie(cookie.b_user)
    expireCookie(cookie.b_userid)
    expireCookie(cookie.b_username)
}

/**
 * 写入前台用户会话 Cookie。
 */
export function applyUserSessionCookies(
    cookie: Record<string, ICookieField>,
    session: IUserSession,
): void {
    const maxAge = config.jwt.expiresInSeconds
    writeSessionCookie(cookie.user, session.user, maxAge)
    writeSessionCookie(cookie.userid, session.userid, maxAge)
    writeSessionCookie(cookie.username, session.username, maxAge)
    if (session.useremail !== undefined)
        writeSessionCookie(cookie.useremail, session.useremail, maxAge)
}

/**
 * 清除前台用户会话 Cookie。
 */
export function clearUserSessionCookies(cookie: Record<string, ICookieField>): void {
    expireCookie(cookie.user)
    expireCookie(cookie.userid)
    expireCookie(cookie.username)
    expireCookie(cookie.useremail)
}
