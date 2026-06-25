import { Elysia } from 'elysia'

import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { checkJWT } from '~/utils/check-jwt'
import { cookieValue } from '~/utils/elysia-request'

/**
 * 后台管理员 Cookie JWT 鉴权守卫（全局复用，避免各路由重复校验）。
 */
export function createAdminAuthGuard() {
    return new Elysia({ name: 'admin-auth-guard' }).guard({
        beforeHandle: async ({ cookie: { b_user, b_userid, b_username } }) => {
            const check = await checkJWT(
                cookieValue(b_user.value),
                cookieValue(b_userid.value),
                cookieValue(b_username.value),
                'admin',
            )
            if (!check) {
                throw new ApiError(API_CODE.FORBIDDEN, '登录验证失败')
            }
        },
    })
}

/**
 * 前台用户 Cookie JWT 鉴权守卫。
 */
export function createUserAuthGuard() {
    return new Elysia({ name: 'user-auth-guard' }).guard({
        beforeHandle: async ({ cookie: { user, userid, username } }) => {
            const check = await checkJWT(
                cookieValue(user.value),
                cookieValue(userid.value),
                cookieValue(username.value),
                'user',
            )
            if (!check) {
                throw new ApiError(API_CODE.FORBIDDEN, '登录验证失败')
            }
        },
    })
}
