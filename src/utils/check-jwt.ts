import { type JwtSessionRole, verifySessionToken } from '~/utils/jwt-token'

/**
 * 检查 JWT 是否与 Cookie 中的 userid、username 一致。
 */
export function checkJWT(
    token: string = '',
    userid: string = '',
    username: string = '',
    type: JwtSessionRole = 'admin',
): boolean {
    const decoded = verifySessionToken(token, type)
    if (!decoded) {
        return false
    }
    return decoded.id === userid
        && (decoded.username === username || decoded.username === encodeURI(username))
}
