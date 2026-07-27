import { Elysia } from 'elysia'

import { responseWrapperMiddleware } from '~/plugins/response-wrapper'
import { validationSchema } from '~/schema/elysia-schema'

import { createCorsConfig } from './cors'

/**
 * 构建「CORS + 全局校验 Schema + 统一响应包装」的 Elysia 子应用，供 REST 模块复用。
 *
 * 各层需 `.as('scoped')` 逐级上浮生命周期：responseWrapper 仅 scoped 一层，
 * 否则嵌套后 onAfterHandle 无法作用到业务路由，响应不会被包成 code/message/data。
 */
export function createPublicApiLayer() {
    return new Elysia({ name: 'public-api-layer' })
        .use(createCorsConfig())
        .use(validationSchema)
        .use(responseWrapperMiddleware)
        .as('scoped')
}

/**
 * 在公开 API 层之上附加 `cookies` 解析守卫。
 */
export function createCookieSessionApiLayer() {
    return new Elysia({ name: 'cookie-session-api-layer' })
        .use(createPublicApiLayer())
        .guard({ cookie: 'cookies' })
        .as('scoped')
}
