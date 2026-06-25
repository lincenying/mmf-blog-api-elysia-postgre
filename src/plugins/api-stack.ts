import { Elysia } from 'elysia'

import { responseWrapperMiddleware } from '~/plugins/response-wrapper'
import { validationSchema } from '~/schema/elysia-schema'

import { createCorsConfig } from './cors'

/**
 * 构建「CORS + 全局校验 Schema + 统一响应包装」的 Elysia 子应用，供 REST 模块复用。
 */
export function createPublicApiLayer() {
    return new Elysia({ name: 'public-api-layer' })
        .use(createCorsConfig())
        .use(validationSchema)
        .use(responseWrapperMiddleware)
}

/**
 * 在公开 API 层之上附加 `cookies` 解析守卫。
 */
export function createCookieSessionApiLayer() {
    return new Elysia({ name: 'cookie-session-api-layer' })
        .use(createPublicApiLayer())
        .guard({ cookie: 'cookies' })
}
