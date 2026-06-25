/* eslint-disable node/prefer-global/process */
import { mkdir } from 'fs/promises'

import { createApp } from '~/app'
import { config } from '~/config'
import { logger } from '~/utils/logger'

void (async () => {
    const UPLOAD_DIR = './uploads'
    await mkdir(UPLOAD_DIR, { recursive: true })

    // 这个没什么用, 只是让开发环境时, 修改twig模板会重启进程
    if (process.env.NODE_ENV === 'development') {
        const glob = new Bun.Glob('**/*.twig') // 匹配所有 .twig 文件（包含子目录）
        const files = Array.from(glob.scanSync({ cwd: './views' }))
        console.log(`模板文件监听: `, files)
        await Promise.all(files.map(file => import(`../views/${file}`)))
    }
})()

const app = createApp()

app.listen(config.server.port)

// 获取正确的访问信息
logger.info(`🚀 服务器运行在 http://${app.server?.hostname}:${app.server?.port}`)

if (process.env.NODE_ENV === 'development') {
    logger.info(`📋 API文档地址: http://${app.server?.hostname}:${app.server?.port}${config.swagger.path}`)
}
