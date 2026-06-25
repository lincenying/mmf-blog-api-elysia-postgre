import { Elysia } from 'elysia'

import { createAdminAuthGuard, createCookieSessionApiLayer, createUserAuthGuard } from '~/plugins'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { cookieValue } from '~/utils/elysia-request'
import { applyUserSessionCookies, clearUserSessionCookies } from '~/utils/session-cookie'

import { FrontendArticleService } from './frontend-article.service'
import { FrontendCommentService } from './frontend-comment.service'
import { FrontendLikeService } from './frontend-like.service'
import { FrontendUserService } from './frontend-user.service'

/** 前台 REST 插件：路由仅转发至 Service。 */
export const frontendRouter = new Elysia({ prefix: '/api/frontend' })
    .use(createCookieSessionApiLayer())
    .get('/article/list', async ({ query, cookie }) => {
        return await FrontendArticleService.getList(query, cookieValue(cookie.userid.value))
    }, {
        query: 'article.search',
    })
    .get('/article/item', async ({ query, cookie }) => {
        return await FrontendArticleService.getItem(query, cookieValue(cookie.userid.value))
    }, {
        query: 'id',
    })
    .get('/trending', async ({ query }) => {
        return await FrontendArticleService.getTrending(query)
    }, {
        query: 'partial-id',
    })
    .get('/comment/list', async ({ query }) => {
        return await FrontendCommentService.getList(query)
    }, {
        query: 'id',
    })
    .post('/user/insert', async ({ body }) => {
        return await FrontendUserService.insert(body)
    }, {
        body: 'user.insert',
    })
    .post('/user/login', async ({ body, cookie }) => {
        const json = await FrontendUserService.login(body)
        applyUserSessionCookies(cookie, json)
        return json
    }, {
        body: 'user.login',
    })
    .get('/user/logout', async ({ cookie }) => {
        clearUserSessionCookies(cookie)
        return FrontendUserService.logout()
    })
    .use(createAdminAuthGuard())
    .get('/comment/delete', async ({ query }) => {
        return await FrontendCommentService.deletes(query)
    }, {
        query: 'id',
    })
    .get('/comment/recover', async ({ query }) => {
        return await FrontendCommentService.recover(query)
    }, {
        query: 'id',
    })
    .use(createUserAuthGuard())
    .post('/comment/insert', async ({ body, cookie }) => {
        return await FrontendCommentService.insert(body, cookieValue(cookie.userid.value))
    }, {
        body: 'comment.insert',
    })
    .post('/user/account', async ({ body, cookie }) => {
        return await FrontendUserService.account(body, cookieValue(cookie.userid.value))
    }, {
        body: 'user.account',
    })
    .post('/user/password', async ({ body, cookie }) => {
        return await FrontendUserService.password(body, cookieValue(cookie.userid.value))
    }, {
        body: 'user.password',
    })
    .get('/like', async ({ query, cookie }) => {
        return await FrontendLikeService.like(query, cookieValue(cookie.userid.value))
    }, {
        query: 'id',
    })
    .get('/unlike', async ({ query, cookie }) => {
        return await FrontendLikeService.unlike(query, cookieValue(cookie.userid.value))
    }, {
        query: 'id',
    })
    .get('/reset/like', async () => {
        return await FrontendLikeService.resetLike()
    }, {
        query: 'id',
    })
    .all('/*', async () => {
        throw new ApiError(API_CODE.NOT_FOUND, '接口不存在')
    })
