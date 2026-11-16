import { cors } from '@elysiajs/cors'

import { config } from '~/config'

/**
 * 创建 CORS 配置
 */
export function createCorsConfig() {
    return cors({
        origin: config.cors.origin,
        credentials: config.cors.credentials,
        methods: config.cors.methods,
        allowedHeaders: [
            'Content-Type',
            'Accept',
            'Authorization',
            'user',
            'userid',
            'username',
            'b_user',
            'b_userid',
            'b_username',
        ],
    })
}
