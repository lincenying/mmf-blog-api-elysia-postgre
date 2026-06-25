import jwt from 'jsonwebtoken'

import { config, secretClient, secretServer } from '~/config'

/** JWT 载荷（登录写入 Cookie 的 token 内嵌字段）。 */
export interface IJwtSessionPayload {
    id: string
    username: string
}

export type JwtSessionRole = 'user' | 'admin'

/**
 * 按角色签发会话 JWT（与 checkJWT 校验逻辑配对）。
 */
export function signSessionToken(payload: IJwtSessionPayload, role: JwtSessionRole): string {
    const secret = role === 'user' ? secretClient : secretServer
    return jwt.sign(payload, secret, { expiresIn: config.jwt.expiresInSeconds })
}

/**
 * 校验 JWT 并返回解码载荷；失败返回 null。
 */
export function verifySessionToken(
    token: string,
    role: JwtSessionRole,
): IJwtSessionPayload | null {
    const secret = role === 'user' ? secretClient : secretServer
    try {
        const decoded = jwt.verify(token, secret)
        if (!decoded || typeof decoded === 'string') {
            return null
        }
        const { id, username } = decoded as IJwtSessionPayload
        if (typeof id !== 'string' || typeof username !== 'string') {
            return null
        }
        return { id, username }
    }
    catch {
        return null
    }
}
