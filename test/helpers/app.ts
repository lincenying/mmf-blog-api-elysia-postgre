import type { IApiResponse } from '~/types/global.types'

import { Elysia } from 'elysia'

import { backendRouter, frontendRouter, genealogyRouter } from '~/modules'

/**
 * 组装仅含业务 REST 的测试应用（不含 static / ws / proxy / HTML catch-all）。
 */
export function createTestApp() {
    return new Elysia()
        .use(frontendRouter)
        .use(backendRouter)
        .use(genealogyRouter)
}

export type TestApp = ReturnType<typeof createTestApp>

/**
 * 向测试应用发起请求并解析统一响应体。
 */
export async function apiRequest<T = unknown>(
    app: TestApp,
    method: string,
    path: string,
    options: {
        query?: Record<string, string | number | undefined>
        body?: unknown
        cookie?: string
        headers?: Record<string, string>
    } = {},
): Promise<IApiResponse<T>> {
    const url = new URL(path, 'http://localhost')
    if (options.query) {
        for (const [key, value] of Object.entries(options.query)) {
            if (value !== undefined && value !== '') {
                url.searchParams.set(key, String(value))
            }
        }
    }

    const headers: Record<string, string> = { ...options.headers }
    if (options.cookie) {
        headers.cookie = options.cookie
    }

    let body: BodyInit | undefined
    if (options.body !== undefined) {
        headers['content-type'] = 'application/json'
        body = JSON.stringify(options.body)
    }

    const response = await app.handle(new Request(url, {
        method,
        headers,
        body,
    }))

    return await response.json() as IApiResponse<T>
}

/** GET 快捷方法。 */
export function apiGet<T = unknown>(
    app: TestApp,
    path: string,
    options?: Parameters<typeof apiRequest>[3],
) {
    return apiRequest<T>(app, 'GET', path, options)
}

/** POST 快捷方法。 */
export function apiPost<T = unknown>(
    app: TestApp,
    path: string,
    body?: unknown,
    options?: Omit<Parameters<typeof apiRequest>[3], 'body'>,
) {
    return apiRequest<T>(app, 'POST', path, { ...options, body })
}

/** PUT 快捷方法。 */
export function apiPut<T = unknown>(
    app: TestApp,
    path: string,
    body?: unknown,
    options?: Omit<Parameters<typeof apiRequest>[3], 'body'>,
) {
    return apiRequest<T>(app, 'PUT', path, { ...options, body })
}

/** DELETE 快捷方法。 */
export function apiDelete<T = unknown>(
    app: TestApp,
    path: string,
    options?: Parameters<typeof apiRequest>[3],
) {
    return apiRequest<T>(app, 'DELETE', path, options)
}
