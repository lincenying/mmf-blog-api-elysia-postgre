import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'

import {
    adminCookie,
    apiDelete,
    apiGet,
    apiPost,
    apiPut,
    createTestApp,
    ensureTestDbMigrated,
    findGenealogy,
    FIXTURES,
    resetAndSeed,
    type TestApp,
} from '../../helpers'

describe('API /api/genealogy', () => {
    let app: TestApp

    beforeAll(async () => {
        await ensureTestDbMigrated()
        app = createTestApp()
    })

    beforeEach(async () => {
        await resetAndSeed()
    })

    describe('公开接口', () => {
        it('GET /lists', async () => {
            const json = await apiGet<Array<{ id: number, name: string }>>(app, '/api/genealogy/lists')
            expect(json.code).toBe(200)
            expect(Array.isArray(json.data)).toBe(true)
            expect(json.data!.some(item => item.name === FIXTURES.genealogy.rootName)).toBe(true)
        })

        it('GET /lists/', async () => {
            const json = await apiGet<Array<{ id: number }>>(app, '/api/genealogy/lists/')
            expect(json.code).toBe(200)
            expect(Array.isArray(json.data)).toBe(true)
        })

        it('POST /login 成功', async () => {
            const json = await apiPost<{ user: string, userid: string }>(app, '/api/genealogy/login', {
                username: FIXTURES.admin.username,
                password: FIXTURES.admin.password,
            })
            expect(json.code).toBe(200)
            expect(json.data!.userid).toBe(FIXTURES.admin.id)
        })

        it('POST /login 错误密码', async () => {
            const json = await apiPost(app, '/api/genealogy/login', {
                username: FIXTURES.admin.username,
                password: 'wrong-password',
            })
            expect(json.code).toBe(201)
        })

        it('GET /logout', async () => {
            const json = await apiGet(app, '/api/genealogy/logout')
            expect(json.code).toBe(200)
            expect(json.data).toBe('退出成功')
        })
    })

    describe('需管理员鉴权', () => {
        it('GET /auth 无 Cookie → 403', async () => {
            const json = await apiGet(app, '/api/genealogy/auth')
            expect(json.code).toBe(403)
        })

        it('GET /auth 成功', async () => {
            const json = await apiGet<{ ok: boolean }>(app, '/api/genealogy/auth', {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.ok).toBe(true)
        })

        it('POST / 无 Cookie → 403', async () => {
            const json = await apiPost(app, '/api/genealogy/', {
                name: '新人',
                parent: 1,
                sex: '男',
            })
            expect(json.code).toBe(403)
        })

        it('POST / 成功', async () => {
            const json = await apiPost<{ id: number, name: string }>(app, '/api/genealogy/', {
                name: '新人',
                parent: 1,
                sex: '男',
                desc: '新增',
            }, {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.name).toBe('新人')
            expect(json.data!.id).toBeTruthy()

            const row = await findGenealogy(json.data!.id)
            expect(row).not.toBeNull()
            expect(row!.name).toBe('新人')
            expect(row!.parent).toBe(1)
            expect(row!.sex).toBe('男')
            expect(row!.desc).toBe('新增')
            expect(row!.parent_name).toBe(FIXTURES.genealogy.rootName)
        })

        it('PUT /:id 无 Cookie → 403', async () => {
            const json = await apiPut(app, '/api/genealogy/2', {
                name: '改名',
                parent: 1,
                sex: '女',
            })
            expect(json.code).toBe(403)
        })

        it('PUT /:id 成功', async () => {
            const json = await apiPut<{ id: number, name: string }>(app, '/api/genealogy/2', {
                name: '子辈改名',
                parent: 1,
                sex: '女',
                desc: '已更新',
            }, {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.name).toBe('子辈改名')

            const row = await findGenealogy(2)
            expect(row!.name).toBe('子辈改名')
            expect(row!.desc).toBe('已更新')
            expect(row!.parent).toBe(1)
            expect(row!.parent_name).toBe(FIXTURES.genealogy.rootName)
        })

        it('DELETE /:id 无 Cookie → 403', async () => {
            const json = await apiDelete(app, '/api/genealogy/3')
            expect(json.code).toBe(403)
        })

        it('DELETE /:id 成功（叶子节点）', async () => {
            expect(await findGenealogy(3)).not.toBeNull()

            const json = await apiDelete(app, '/api/genealogy/3', {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data).toBe('删除成功')

            expect(await findGenealogy(3)).toBeNull()
            expect(await findGenealogy(1)).not.toBeNull()
            expect(await findGenealogy(2)).not.toBeNull()
        })

        it('DELETE /:id 存在子辈时失败', async () => {
            const json = await apiDelete(app, '/api/genealogy/1', {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(201)

            expect(await findGenealogy(1)).not.toBeNull()
        })
    })
})
