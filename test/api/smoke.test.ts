import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'

import {
    adminCookie,
    apiGet,
    createTestApp,
    ensureTestDbMigrated,
    FIXTURES,
    resetAndSeed,
    type TestApp,
} from '../helpers'

describe('test infra smoke', () => {
    let app: TestApp

    beforeAll(async () => {
        await ensureTestDbMigrated()
        app = createTestApp()
    })

    beforeEach(async () => {
        await resetAndSeed()
    })

    it('公开接口返回统一响应', async () => {
        const json = await apiGet<{ list: unknown[] }>(app, '/api/backend/category/list')
        expect(json.code).toBe(200)
        expect(Array.isArray(json.data?.list)).toBe(true)
        expect(json.data!.list.length).toBeGreaterThan(0)
    })

    it('无 Cookie 访问鉴权接口返回 403', async () => {
        const json = await apiGet(app, '/api/backend/article/list')
        expect(json.code).toBe(403)
    })

    it('带管理员 Cookie 可访问鉴权接口', async () => {
        const json = await apiGet(app, '/api/backend/article/list', {
            cookie: adminCookie(),
            query: { page: '1', limit: '10' },
        })
        expect(json.code).toBe(200)
        expect(FIXTURES.article.id).toBeTruthy()
    })
})
