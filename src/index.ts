import { mkdir } from 'node:fs/promises'

import { createApp } from '~/app'
import { config } from '~/config'
import { UPLOAD_DIR } from '~/modules/upload/upload.service'
import { getServiceUrl } from '~/plugins/swagger'
import { logger } from '~/utils/logger'

/**
 * 开发环境下导入 Twig，让 bun --watch 在模板变更时重启。
 */
async function watchTwigTemplates(): Promise<void> {
    const glob = new Bun.Glob('**/*.twig')
    const files = Array.from(glob.scanSync({ cwd: './views' }))
    await Promise.all(files.map(file => import(`../views/${file}`)))
}

/**
 * 准备上传目录并启动 HTTP 服务。目录创建完成后再监听，避免启动瞬间写入失败。
 */
async function main(): Promise<void> {
    await mkdir(UPLOAD_DIR, { recursive: true })

    if (config.server.nodeEnv === 'development')
        await watchTwigTemplates()

    const app = createApp()
    app.listen({
        hostname: config.server.host,
        port: config.server.port,
    })

    const { internal } = getServiceUrl()
    logger.info(`服务器运行在 ${internal}`)

    if (config.server.nodeEnv === 'development')
        logger.info(`API 文档地址: ${internal}${config.swagger.path}`)
}

void main().catch((error: unknown) => {
    logger.error({ err: error }, '服务启动失败')
    throw error
})
