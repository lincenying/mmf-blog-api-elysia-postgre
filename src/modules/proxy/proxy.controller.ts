import { Elysia, t } from 'elysia'

import { createCorsConfig } from '~/plugins/cors'

/** 简单 HTTP 转发代理插件。 */
export const proxyRouter = new Elysia({ prefix: '/api/proxy' })
    .use(createCorsConfig())
    .all('/*', ({ request, params, body, query }) => {
        const input = {
            ...request,
            url: `https://php.mmxiaowu.com/api/${params['*']}?${new URLSearchParams(query)}`,
        }
        if (input.method === 'POST') {
            input.body = body
        }
        return fetch(input)
    }, {
        body: t.Any(),
    })
