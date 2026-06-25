/* eslint-disable node/prefer-global/process */
import { serverTiming } from '@elysiajs/server-timing'
import { Elysia, file } from 'elysia'

import {
    adminRouter,
    backendRouter,
    frontendRouter,
    jwtRouter,
    proxyRouter,
    uploadRouter,
    wsRouter,
} from '~/modules'
import { createStaticConfig } from '~/plugins'
import { accessLoggerMiddleware } from '~/plugins/access-logger'
import { createSwaggerConfig } from '~/plugins/swagger'

/**
 * 组装 Elysia 应用：挂载插件与各路由前缀，不包含 listen。
 * 业务路由仍以插件形式挂载，入口文件仅负责调用本函数并启动监听。
 */
export function createApp() {
    const app = new Elysia({
        serve: {
            maxRequestBodySize: 1024 * 1024 * 256, // 256MB
        },
    })
        .use(serverTiming())
        .use(createStaticConfig())
        .use(accessLoggerMiddleware)
        .use(wsRouter)
        .use(frontendRouter)
        .use(backendRouter)
        .use(uploadRouter)
        .use(adminRouter)
        .use(jwtRouter)
        .use(proxyRouter)
        .get('/favicon.ico', file('./public/favicon.ico'))
        .get('/robots.txt', file('./public/robots.txt'))
        .all('/sm/*', () => '')
        .all('/*', file('./dist/index.html'))

    if (process.env.NODE_ENV === 'development') {
        app.use(createSwaggerConfig())
    }

    return app
}
