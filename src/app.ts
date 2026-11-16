import { serverTiming } from '@elysiajs/server-timing'
import { Elysia, file } from 'elysia'

import { config } from '~/config'
import { pingDatabase } from '~/db/utils/ping'
import {
    adminRouter,
    archiveRouter,
    backendRouter,
    frontendRouter,
    genealogyPageRouter,
    genealogyRouter,
    jwtRouter,
    proxyRouter,
    uploadFileRouter,
    uploadRouter,
    wsRouter,
} from '~/modules'
import { createStaticConfig } from '~/plugins'
import { accessLoggerMiddleware } from '~/plugins/access-logger'
import { createSwaggerConfig } from '~/plugins/swagger'
import { logger } from '~/utils/logger'

/** 请求体上限。图片上传和文章正文都远小于该值，避免超大请求占满内存。 */
const MAX_REQUEST_BODY_BYTES = 20 * 1024 * 1024

/**
 * 组装 Elysia 应用：挂载插件与各路由前缀，不包含 listen。
 * 业务路由仍以插件形式挂载，入口文件仅负责调用本函数并启动监听。
 */
export function createApp() {
    const app = new Elysia({
        serve: {
            maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
        },
    })
        .use(serverTiming())
        .use(createStaticConfig())
        .use(accessLoggerMiddleware)
        .use(wsRouter)
        .use(frontendRouter)
        .use(backendRouter)
        .use(archiveRouter)
        .use(genealogyRouter)
        .use(genealogyPageRouter)
        .use(uploadRouter)
        .use(uploadFileRouter)
        .use(adminRouter)
        .use(jwtRouter)
        .use(proxyRouter)
        .get('/favicon.ico', file('./public/favicon.ico'))
        .get('/robots.txt', file('./public/robots.txt'))
        .get('/health', async ({ set }) => {
            try {
                await pingDatabase()
                return 'OK'
            }
            catch (error) {
                logger.error({ err: error }, '健康检查失败')
                set.status = 503
                return 'UNAVAILABLE'
            }
        })

    if (config.server.nodeEnv === 'development')
        app.use(createSwaggerConfig())

    return app
        .all('/sm/*', () => '')
        .all('/*', ({ request, set }) => {
            const pathname = new URL(request.url).pathname
            if (pathname.startsWith('/api/')) {
                set.status = 404
                return '接口不存在'
            }
            return file('./dist/index.html')
        })
}
