import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'

import { articles, sqliteDb } from '~/db'

import {
    adminAndUserCookie,
    adminCookie,
    apiGet,
    apiPost,
    countArticleLikes,
    createTestApp,
    ensureTestDbMigrated,
    findArticle,
    findArticleLike,
    findComment,
    findUser,
    findUserByUsername,
    FIXTURES,
    hashPassword,
    resetAndSeed,
    type TestApp,
    userCookie,
} from '../../helpers'

describe('API /api/frontend', () => {
    let app: TestApp

    beforeAll(async () => {
        await ensureTestDbMigrated()
        app = createTestApp()
    })

    beforeEach(async () => {
        await resetAndSeed()
    })

    describe('公开接口', () => {
        it('GET /article/list', async () => {
            const json = await apiGet<{ list: Array<{ id: string }> }>(app, '/api/frontend/article/list')
            expect(json.code).toBe(200)
            expect(json.data!.list.some(item => item.id === FIXTURES.article.id)).toBe(true)
        })

        it('GET /article/item', async () => {
            const json = await apiGet<{ id: string }>(app, '/api/frontend/article/item', {
                query: { id: FIXTURES.article.id },
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBe(FIXTURES.article.id)
        })

        it('GET /trending', async () => {
            const json = await apiGet(app, '/api/frontend/trending')
            expect(json.code).toBe(200)
            expect(json.data).toBeDefined()
        })

        it('GET /comment/list', async () => {
            const json = await apiGet<{ list: unknown[] }>(app, '/api/frontend/comment/list', {
                query: { id: FIXTURES.article.id },
            })
            expect(json.code).toBe(200)
            expect(Array.isArray(json.data!.list)).toBe(true)
        })

        it('POST /user/insert', async () => {
            const json = await apiPost(app, '/api/frontend/user/insert', {
                username: 'newuser01',
                password: 'pass1234',
                email: 'newuser01@test.com',
            })
            expect(json.code).toBe(200)
            expect(json.data).toBe('注册成功!')

            const row = await findUserByUsername('newuser01')
            expect(row).not.toBeNull()
            expect(row!.email).toBe('newuser01@test.com')
            expect(row!.password).toBe(hashPassword('pass1234'))
            expect(row!.is_delete).toBe(0)
        })

        it('POST /user/login 成功', async () => {
            const json = await apiPost<{ user: string, userid: string }>(app, '/api/frontend/user/login', {
                username: FIXTURES.user.username,
                password: FIXTURES.user.password,
            })
            expect(json.code).toBe(200)
            expect(json.data!.userid).toBe(FIXTURES.user.id)
            expect(json.data!.user).toBeTruthy()
        })

        it('POST /user/login 错误密码', async () => {
            const json = await apiPost(app, '/api/frontend/user/login', {
                username: FIXTURES.user.username,
                password: 'wrong-password',
            })
            expect(json.code).toBe(201)
        })

        it('GET /user/logout', async () => {
            const json = await apiGet(app, '/api/frontend/user/logout')
            expect(json.code).toBe(200)
            expect(json.data).toBe('退出成功')
        })
    })

    describe('需管理员鉴权', () => {
        it('GET /comment/delete 无 Cookie → 403', async () => {
            const json = await apiGet(app, '/api/frontend/comment/delete', {
                query: { id: FIXTURES.comment.id },
            })
            expect(json.code).toBe(403)
        })

        it('GET /comment/delete 成功', async () => {
            const before = await findArticle(FIXTURES.article.id)
            expect(before!.comment_count).toBe(1)

            const json = await apiGet(app, '/api/frontend/comment/delete', {
                query: { id: FIXTURES.comment.id },
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data).toBe('删除成功')

            const after = await findArticle(FIXTURES.article.id)
            expect(after!.comment_count).toBe(0)
            expect(await findComment(FIXTURES.comment.id)).not.toBeNull()
        })

        it('GET /comment/recover 无 Cookie → 403', async () => {
            const json = await apiGet(app, '/api/frontend/comment/recover', {
                query: { id: FIXTURES.comment.id },
            })
            expect(json.code).toBe(403)
        })

        it('GET /comment/recover 成功', async () => {
            await apiGet(app, '/api/frontend/comment/delete', {
                query: { id: FIXTURES.comment.id },
                cookie: adminCookie(),
            })
            const mid = await findArticle(FIXTURES.article.id)
            expect(mid!.comment_count).toBe(0)

            const json = await apiGet(app, '/api/frontend/comment/recover', {
                query: { id: FIXTURES.comment.id },
                cookie: adminCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data).toBe('恢复成功')

            const after = await findArticle(FIXTURES.article.id)
            expect(after!.comment_count).toBe(1)
        })
    })

    describe('需用户鉴权', () => {
        it('POST /comment/insert 无 Cookie → 403', async () => {
            const json = await apiPost(app, '/api/frontend/comment/insert', {
                id: FIXTURES.article.id,
                content: '新评论',
            })
            expect(json.code).toBe(403)
        })

        it('POST /comment/insert 成功', async () => {
            const before = await findArticle(FIXTURES.article.id)
            expect(before!.comment_count).toBe(1)

            const json = await apiPost<{ id: string }>(app, '/api/frontend/comment/insert', {
                id: FIXTURES.article.id,
                content: '新评论内容',
            }, {
                cookie: adminAndUserCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.id).toBeTruthy()

            const comment = await findComment(json.data!.id)
            expect(comment).not.toBeNull()
            expect(comment!.content).toBe('新评论内容')
            expect(comment!.article_id).toBe(FIXTURES.article.id)
            expect(comment!.userid).toBe(FIXTURES.user.id)
            expect(comment!.is_delete).toBe(0)

            const after = await findArticle(FIXTURES.article.id)
            expect(after!.comment_count).toBe(2)
        })

        it('POST /user/account 无 Cookie → 403', async () => {
            const json = await apiPost(app, '/api/frontend/user/account', {
                email: 'changed@test.com',
            })
            expect(json.code).toBe(403)
        })

        it('POST /user/account 成功', async () => {
            const json = await apiPost<{ email: string }>(app, '/api/frontend/user/account', {
                email: 'changed@test.com',
            }, {
                cookie: adminAndUserCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data!.email).toBe('changed@test.com')

            const row = await findUser(FIXTURES.user.id)
            expect(row!.email).toBe('changed@test.com')
        })

        it('POST /user/password 无 Cookie → 403', async () => {
            const json = await apiPost(app, '/api/frontend/user/password', {
                old_password: FIXTURES.user.password,
                password: 'newpass99',
            })
            expect(json.code).toBe(403)
        })

        it('POST /user/password 成功', async () => {
            const json = await apiPost(app, '/api/frontend/user/password', {
                old_password: FIXTURES.user.password,
                password: 'newpass99',
            }, {
                cookie: adminAndUserCookie(),
            })
            expect(json.code).toBe(200)

            const row = await findUser(FIXTURES.user.id)
            expect(row!.password).toBe(hashPassword('newpass99'))
        })

        it('GET /like 无 Cookie → 403', async () => {
            const json = await apiGet(app, '/api/frontend/like', {
                query: { id: FIXTURES.article.id },
            })
            expect(json.code).toBe(403)
        })

        it('GET /like 成功', async () => {
            const before = await findArticle(FIXTURES.article.id)
            expect(before!.like).toBe(0)
            expect(await countArticleLikes(FIXTURES.article.id)).toBe(0)

            const json = await apiGet(app, '/api/frontend/like', {
                query: { id: FIXTURES.article.id },
                cookie: adminAndUserCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data).toBe('操作成功')

            const after = await findArticle(FIXTURES.article.id)
            expect(after!.like).toBe(1)
            expect(await countArticleLikes(FIXTURES.article.id)).toBe(1)
            expect(await findArticleLike(FIXTURES.article.id, FIXTURES.user.id)).not.toBeNull()
        })

        it('GET /unlike 无 Cookie → 403', async () => {
            const json = await apiGet(app, '/api/frontend/unlike', {
                query: { id: FIXTURES.article.id },
            })
            expect(json.code).toBe(403)
        })

        it('GET /unlike 成功', async () => {
            await apiGet(app, '/api/frontend/like', {
                query: { id: FIXTURES.article.id },
                cookie: adminAndUserCookie(),
            })
            expect((await findArticle(FIXTURES.article.id))!.like).toBe(1)

            const json = await apiGet(app, '/api/frontend/unlike', {
                query: { id: FIXTURES.article.id },
                cookie: adminAndUserCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data).toBe('操作成功')

            expect((await findArticle(FIXTURES.article.id))!.like).toBe(0)
            expect(await countArticleLikes(FIXTURES.article.id)).toBe(0)
            expect(await findArticleLike(FIXTURES.article.id, FIXTURES.user.id)).toBeNull()
        })

        it('GET /reset/like 无 Cookie → 403', async () => {
            const json = await apiGet(app, '/api/frontend/reset/like', {
                query: { id: FIXTURES.article.id },
            })
            expect(json.code).toBe(403)
        })

        it('GET /reset/like 成功', async () => {
            await apiGet(app, '/api/frontend/like', {
                query: { id: FIXTURES.article.id },
                cookie: adminAndUserCookie(),
            })
            await sqliteDb.update(articles)
                .set({ like: 99 })
                .where(eq(articles._id, FIXTURES.article.id))
            expect((await findArticle(FIXTURES.article.id))!.like).toBe(99)

            const json = await apiGet(app, '/api/frontend/reset/like', {
                query: { id: FIXTURES.article.id },
                cookie: adminAndUserCookie(),
            })
            expect(json.code).toBe(200)
            expect(json.data).toBe('操作成功')

            expect((await findArticle(FIXTURES.article.id))!.like).toBe(1)
            expect(await countArticleLikes(FIXTURES.article.id)).toBe(1)
        })

        it('仅 user Cookie 不足以通过叠层 guard', async () => {
            const json = await apiGet(app, '/api/frontend/like', {
                query: { id: FIXTURES.article.id },
                cookie: userCookie(),
            })
            expect(json.code).toBe(403)
        })
    })
})
