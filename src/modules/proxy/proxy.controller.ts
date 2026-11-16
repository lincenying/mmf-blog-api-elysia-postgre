import { Elysia } from 'elysia'

import { createCorsConfig } from '~/plugins/cors'
import { logger } from '~/utils/logger'

const UPSTREAM_ORIGIN = 'https://php.mmxiaowu.com'
const MAX_PROXY_BODY_BYTES = 1024 * 1024
const PROXY_TIMEOUT_MS = 10_000
const FORWARDED_RESPONSE_HEADERS = ['content-type', 'cache-control', 'content-disposition']

/**
 * 把通配路径限制在上游 /api/ 目录内。
 */
function buildProxyUrl(relativePath: string) {
    if (relativePath.includes('\0') || relativePath.includes('\\') || relativePath.includes('://'))
        return null

    const segments = relativePath.split('/').filter(segment => segment.length > 0)
    if (segments.some(segment => segment === '.' || segment === '..' || !/^[\p{L}\p{N}._~-]+$/u.test(segment)))
        return null

    const url = new URL(`/api/${segments.join('/')}`, UPSTREAM_ORIGIN)
    if (url.origin !== UPSTREAM_ORIGIN || !url.pathname.startsWith('/api/'))
        return null

    return url
}

/**
 * 只保留可供浏览器读取的响应头。
 */
function copyResponseHeaders(source: Headers) {
    const headers = new Headers()
    for (const name of FORWARDED_RESPONSE_HEADERS) {
        const value = source.get(name)
        if (value)
            headers.set(name, value)
    }
    return headers
}

/** 简单 HTTP 转发代理插件。只转发到固定上游，不携带访问者的 Cookie。 */
export const proxyRouter = new Elysia({ prefix: '/api/proxy' })
    .use(createCorsConfig())
    .all('/*', async ({ request, params, set }) => {
        const target = buildProxyUrl(params['*'] ?? '')
        if (!target) {
            set.status = 400
            return '请求地址无效'
        }

        const incoming = new URL(request.url)
        target.search = incoming.search

        const headers = new Headers()
        const contentType = request.headers.get('content-type')
        if (contentType)
            headers.set('content-type', contentType)
        const accept = request.headers.get('accept')
        if (accept)
            headers.set('accept', accept)

        const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
        let body: ArrayBuffer | undefined
        if (hasBody) {
            const bytes = await request.arrayBuffer()
            if (bytes.byteLength > MAX_PROXY_BODY_BYTES) {
                set.status = 413
                return '请求体过大'
            }
            if (bytes.byteLength > 0)
                body = bytes
        }

        try {
            const upstream = await fetch(target, {
                method: request.method,
                headers,
                body,
                redirect: 'manual',
                signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
            })
            return new Response(upstream.body, {
                status: upstream.status,
                headers: copyResponseHeaders(upstream.headers),
            })
        }
        catch (error) {
            logger.error({ err: error, path: target.pathname }, '代理转发失败')
            set.status = 502
            return '上游服务不可用'
        }
    })
