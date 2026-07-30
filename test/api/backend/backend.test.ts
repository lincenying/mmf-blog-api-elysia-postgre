import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'

import {
    adminCookie,
    apiGet,
    apiPost,
    createTestApp,
    ensureTestDbMigrated,
    findAdmin,
    findArticle,
    findCategory,
    findUser,
    FIXTURES,
    hashPassword,
    resetAndSeed,
    type TestApp,
} from '../../helpers'

describe('API /api/backend', () => {
    let app: TestApp

    beforeAll(async () => {
        await ensureTestDbMigrated()
        app = createTestApp()
    })

    beforeEach(async () => {
        await resetAndSeed()
    })

    describe('公开接口', () => {
        it('GET /category/list', async () => {
            const json = await apiGet<{ list: Array<{ id: string }> }>(app, '/api/backend/category/list')
            expect(json.code).toBe(200)
            expect(json.data!.list.some(item => item.id === FIXTURES.category.id)).toBe(true)
        })

        it('GET /category/item', async () => {
            const json = await apiGet<{ id: string }>(app, '/api/backend/category/item', {
                query: { id: FIXTURES.category.id },
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBe(FIXTURES.category.id)
        })

        it('POST /admin/login 成功', async () => {
            const json = await apiPost<{ user: string, userid: string }>(app, '/api/backend/admin/login', {
                username: FIXTURES.admin.username,
                password: FIXTURES.admin.password,
            })
            expect(json.code).toBe(200)
            expect(json.data!.userid).toBe(FIXTURES.admin.id)
            expect(json.data!.user).toBeTruthy()
        })

        it('POST /admin/login 错误密码', async () => {
            const json = await apiPost(app, '/api/backend/admin/login', {
                username: FIXTURES.admin.username,
                password: 'wrong-password',
            })
            expect(json.code).toBe(201)
        })

        it('GET /admin/logout', async () => {
            const json = await apiGet(app, '/api/backend/admin/logout')
            expect(json.code).toBe(200)
            expect(json.data).toBe('退出成功')
        })
    })

    describe('文章管理', () => {
        it('GET /article/list 无 Cookie → 403', async () => {
            const json = await apiGet(app, '/api/backend/article/list')
            expect(json.code).toBe(403)
        })

        it('GET /article/list 成功', async () => {
            const json = await apiGet<{ list: unknown[] }>(app, '/api/backend/article/list', {
                cookie: adminCookie(),
                query: { page: '1', limit: '10' },
            })
            expect(json.code).toBe(200)
            expect(Array.isArray(json.data!.list)).toBe(true)
        })

        it('GET /article/item 成功', async () => {
            const json = await apiGet<{ id: string }>(app, '/api/backend/article/item', {
                cookie: adminCookie(),
                query: { id: FIXTURES.article.id },
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBe(FIXTURES.article.id)
        })

        it('POST /article/insert 无 Cookie → 403', async () => {
            const json = await apiPost(app, '/api/backend/article/insert', {
                category: `${FIXTURES.category.id}|${FIXTURES.category.name}`,
                content: '# New',
                title: '新文章',
                html: '<h1>New</h1>',
            })
            expect(json.code).toBe(403)
        })

        it('POST /article/insert 成功', async () => {
            const cateBefore = await findCategory(FIXTURES.category.id)
            expect(cateBefore!.cate_num).toBe(2)

            const json = await apiPost<{ id: string, title: string }>(app, '/api/backend/article/insert', {
                category: `${FIXTURES.category.id}|${FIXTURES.category.name}`,
                content: '# New',
                title: '新文章',
                html: '<h1>New</h1>',
            }, {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBeTruthy()

            const row = await findArticle(json.data!.id)
            expect(row).not.toBeNull()
            expect(row!.title).toBe('新文章')
            expect(row!.content).toBe('# New')
            expect(row!.html).toBe('<h1>New</h1>')
            expect(row!.category).toBe(FIXTURES.category.id)
            expect(row!.category_name).toBe(FIXTURES.category.name)
            expect(row!.is_delete).toBe(0)
            expect(row!.like).toBe(0)
            expect(row!.comment_count).toBe(0)

            const cateAfter = await findCategory(FIXTURES.category.id)
            expect(cateAfter!.cate_num).toBe(3)
        })

        it('POST /article/modify 成功', async () => {
            const json = await apiPost<{ id: string }>(app, '/api/backend/article/modify', {
                id: FIXTURES.article.id,
                category_old: FIXTURES.category.id,
                category_name: FIXTURES.category.name,
                category: FIXTURES.category.id,
                content: '# Updated',
                title: '更新标题',
                html: '<h1>Updated</h1>',
            }, {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBe(FIXTURES.article.id)

            const row = await findArticle(FIXTURES.article.id)
            expect(row!.title).toBe('更新标题')
            expect(row!.content).toBe('# Updated')
            expect(row!.html).toBe('<h1>Updated</h1>')
        })

        it('GET /article/delete 成功', async () => {
            const cateBefore = await findCategory(FIXTURES.category.id)
            expect(cateBefore!.cate_num).toBe(2)

            const json = await apiGet(app, '/api/backend/article/delete', {
                cookie: adminCookie(),
                query: { id: FIXTURES.articleOther.id },
            })
            expect(json.code).toBe(200)

            const row = await findArticle(FIXTURES.articleOther.id)
            expect(row!.is_delete).toBe(1)

            const cateAfter = await findCategory(FIXTURES.category.id)
            expect(cateAfter!.cate_num).toBe(1)
        })

        it('GET /article/recover 成功', async () => {
            await apiGet(app, '/api/backend/article/delete', {
                cookie: adminCookie(),
                query: { id: FIXTURES.articleOther.id },
            })
            expect((await findArticle(FIXTURES.articleOther.id))!.is_delete).toBe(1)

            const json = await apiGet(app, '/api/backend/article/recover', {
                cookie: adminCookie(),
                query: { id: FIXTURES.articleOther.id },
            })
            expect(json.code).toBe(200)

            expect((await findArticle(FIXTURES.articleOther.id))!.is_delete).toBe(0)
            expect((await findCategory(FIXTURES.category.id))!.cate_num).toBe(2)
        })
    })

    describe('分类管理', () => {
        it('POST /category/insert 无 Cookie → 403', async () => {
            const json = await apiPost(app, '/api/backend/category/insert', {
                cate_name: '新分类',
                cate_order: '9',
            })
            expect(json.code).toBe(403)
        })

        it('POST /category/insert 成功', async () => {
            const json = await apiPost<{ id: string }>(app, '/api/backend/category/insert', {
                cate_name: '新分类',
                cate_order: '9',
            }, {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBeTruthy()

            const row = await findCategory(json.data!.id)
            expect(row).not.toBeNull()
            expect(row!.cate_name).toBe('新分类')
            expect(row!.cate_order).toBe('9')
            expect(row!.cate_num).toBe(0)
            expect(row!.is_delete).toBe(0)
        })

        it('POST /category/modify 成功', async () => {
            const json = await apiPost<{ id: string }>(app, '/api/backend/category/modify', {
                id: FIXTURES.categoryOther.id,
                cate_name: '改名分类',
                cate_order: '8',
            }, {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBe(FIXTURES.categoryOther.id)

            const row = await findCategory(FIXTURES.categoryOther.id)
            expect(row!.cate_name).toBe('改名分类')
            expect(row!.cate_order).toBe('8')
        })

        it('GET /category/delete 成功', async () => {
            const json = await apiGet(app, '/api/backend/category/delete', {
                cookie: adminCookie(),
                query: { id: FIXTURES.categoryOther.id },
            })
            expect(json.code).toBe(200)

            expect((await findCategory(FIXTURES.categoryOther.id))!.is_delete).toBe(1)
        })

        it('GET /category/recover 成功', async () => {
            await apiGet(app, '/api/backend/category/delete', {
                cookie: adminCookie(),
                query: { id: FIXTURES.categoryOther.id },
            })
            expect((await findCategory(FIXTURES.categoryOther.id))!.is_delete).toBe(1)

            const json = await apiGet(app, '/api/backend/category/recover', {
                cookie: adminCookie(),
                query: { id: FIXTURES.categoryOther.id },
            })
            expect(json.code).toBe(200)

            expect((await findCategory(FIXTURES.categoryOther.id))!.is_delete).toBe(0)
        })
    })

    describe('管理员管理', () => {
        it('GET /admin/list 无 Cookie → 403', async () => {
            const json = await apiGet(app, '/api/backend/admin/list')
            expect(json.code).toBe(403)
        })

        it('GET /admin/list 成功', async () => {
            const json = await apiGet<{ list: unknown[] }>(app, '/api/backend/admin/list', {
                cookie: adminCookie(),
                query: { page: 1, limit: 10 },
            })
            expect(json.code).toBe(200)
            expect(Array.isArray(json.data!.list)).toBe(true)
        })

        it('GET /admin/item 成功', async () => {
            const json = await apiGet<{ id: string }>(app, '/api/backend/admin/item', {
                cookie: adminCookie(),
                query: { id: FIXTURES.admin.id },
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBe(FIXTURES.admin.id)
        })

        it('POST /admin/modify 成功', async () => {
            const json = await apiPost<{ id: string }>(app, '/api/backend/admin/modify', {
                id: FIXTURES.adminOther.id,
                username: FIXTURES.adminOther.username,
                email: 'admin2-updated@test.com',
                password: 'admin789',
            }, {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBe(FIXTURES.adminOther.id)

            const row = await findAdmin(FIXTURES.adminOther.id)
            expect(row!.email).toBe('admin2-updated@test.com')
            expect(row!.password).toBe(hashPassword('admin789'))
        })

        it('GET /admin/delete 成功', async () => {
            const json = await apiGet(app, '/api/backend/admin/delete', {
                cookie: adminCookie(),
                query: { id: FIXTURES.adminOther.id },
            })
            expect(json.code).toBe(200)

            expect((await findAdmin(FIXTURES.adminOther.id))!.is_delete).toBe(1)
        })

        it('GET /admin/recover 成功', async () => {
            await apiGet(app, '/api/backend/admin/delete', {
                cookie: adminCookie(),
                query: { id: FIXTURES.adminOther.id },
            })
            expect((await findAdmin(FIXTURES.adminOther.id))!.is_delete).toBe(1)

            const json = await apiGet(app, '/api/backend/admin/recover', {
                cookie: adminCookie(),
                query: { id: FIXTURES.adminOther.id },
            })
            expect(json.code).toBe(200)

            expect((await findAdmin(FIXTURES.adminOther.id))!.is_delete).toBe(0)
        })
    })

    describe('前台用户管理', () => {
        it('GET /user/list 无 Cookie → 403', async () => {
            const json = await apiGet(app, '/api/backend/user/list')
            expect(json.code).toBe(403)
        })

        it('GET /user/list 成功', async () => {
            const json = await apiGet<{ list: unknown[] }>(app, '/api/backend/user/list', {
                cookie: adminCookie(),
                query: { page: 1, limit: 10 },
            })
            expect(json.code).toBe(200)
            expect(Array.isArray(json.data!.list)).toBe(true)
        })

        it('GET /user/item 成功', async () => {
            const json = await apiGet<{ id: string }>(app, '/api/backend/user/item', {
                cookie: adminCookie(),
                query: { id: FIXTURES.user.id },
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBe(FIXTURES.user.id)
        })

        it('POST /user/modify 成功', async () => {
            const json = await apiPost<{ id: string }>(app, '/api/backend/user/modify', {
                id: FIXTURES.userOther.id,
                username: FIXTURES.userOther.username,
                email: 'user2-updated@test.com',
                password: 'user9999',
            }, {
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBe(FIXTURES.userOther.id)

            const row = await findUser(FIXTURES.userOther.id)
            expect(row!.email).toBe('user2-updated@test.com')
            expect(row!.password).toBe(hashPassword('user9999'))
        })

        it('GET /user/delete 成功', async () => {
            const json = await apiGet(app, '/api/backend/user/delete', {
                cookie: adminCookie(),
                query: { id: FIXTURES.userOther.id },
            })
            expect(json.code).toBe(200)

            expect((await findUser(FIXTURES.userOther.id))!.is_delete).toBe(1)
        })

        it('GET /user/recover 成功', async () => {
            await apiGet(app, '/api/backend/user/delete', {
                cookie: adminCookie(),
                query: { id: FIXTURES.userOther.id },
            })
            expect((await findUser(FIXTURES.userOther.id))!.is_delete).toBe(1)

            const json = await apiGet(app, '/api/backend/user/recover', {
                cookie: adminCookie(),
                query: { id: FIXTURES.userOther.id },
            })
            expect(json.code).toBe(200)

            expect((await findUser(FIXTURES.userOther.id))!.is_delete).toBe(0)
        })
    })
})
