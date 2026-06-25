import { Elysia } from 'elysia'

import { createAdminAuthGuard, createCookieSessionApiLayer } from '~/plugins'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { cookieValue, queryString } from '~/utils/elysia-request'
import { applyAdminSessionCookies, clearAdminSessionCookies } from '~/utils/session-cookie'

import { FrontendUserService } from '../frontend/frontend-user.service'

import { BackendArticleService } from './backend-article.service'
import { BackendCategoryService } from './backend-category.service'
import { BackendUserService } from './backend-user.service'

/** 后台管理 REST 插件：路由仅转发至 Service。 */
export const backendRouter = new Elysia({ prefix: '/api/backend' })
    .use(createCookieSessionApiLayer())
    .get('/category/list', async () => {
        return await BackendCategoryService.getList()
    })
    .get('/category/item', async ({ query }) => {
        return await BackendCategoryService.getItem(query)
    }, {
        query: 'id',
    })
    .post('/admin/login', async ({ body, cookie }) => {
        const json = await BackendUserService.login(body)
        applyAdminSessionCookies(cookie, json)
        return json
    }, {
        body: 'user.login',
    })
    .get('/admin/logout', async ({ cookie }) => {
        clearAdminSessionCookies(cookie)
        return BackendUserService.logout()
    })
    .use(createAdminAuthGuard())
    .get('/article/list', async ({ query }) => {
        return await BackendArticleService.getList(query)
    }, {
        query: 'article.page',
    })
    .get('/article/item', async ({ query }) => {
        return await BackendArticleService.getItem(query)
    }, {
        query: 'id',
    })
    .post('/article/insert', async ({ body }) => {
        return await BackendArticleService.insert(body)
    }, {
        body: 'article.insert',
    })
    .post('/article/modify', async ({ body }) => {
        return await BackendArticleService.modify(body)
    }, {
        body: 'article.modify',
    })
    .get('/article/delete', async ({ query }) => {
        return await BackendArticleService.deletes(query)
    }, {
        query: 'id',
    })
    .get('/article/recover', async ({ query }) => {
        return await BackendArticleService.recover(query)
    }, {
        query: 'id',
    })
    .post('/category/insert', async ({ body }) => {
        return await BackendCategoryService.insert(body)
    }, {
        body: 'category.insert',
    })
    .post('/category/modify', async ({ body }) => {
        return await BackendCategoryService.modify(body)
    }, {
        body: 'category.modify',
    })
    .get('/category/delete', async ({ query }) => {
        return await BackendCategoryService.deletes(query)
    }, {
        query: 'id',
    })
    .get('/category/recover', async ({ query }) => {
        return await BackendCategoryService.recover(query)
    }, {
        query: 'id',
    })
    .get('/admin/list', async ({ query }) => {
        return await BackendUserService.getList(query)
    }, {
        query: 'other.page',
    })
    .get('/admin/item', async ({ query }) => {
        return await BackendUserService.getItem(query)
    }, {
        query: 'id',
    })
    .post('/admin/modify', async ({ body }) => {
        return await BackendUserService.modify(body)
    }, {
        body: 'user.modify',
    })
    .get('/admin/delete', async ({ query }) => {
        return await BackendUserService.deletes(query)
    }, {
        query: 'id',
    })
    .get('/admin/recover', async ({ query }) => {
        return await BackendUserService.recover(query)
    }, {
        query: 'id',
    })
    .get('/user/list', async ({ query }) => {
        return await FrontendUserService.getList(query)
    }, {
        query: 'other.page',
    })
    .get('/user/item', async ({ query, cookie }) => {
        const userid = queryString(query.id) ?? cookieValue(cookie.userid.value)
        return await FrontendUserService.getItem(userid)
    }, {
        query: 'id',
    })
    .post('/user/modify', async ({ body }) => {
        return await FrontendUserService.modify(body)
    }, {
        body: 'user.modify',
    })
    .get('/user/delete', async ({ query }) => {
        return await FrontendUserService.deletes(query)
    }, {
        query: 'id',
    })
    .get('/user/recover', async ({ query }) => {
        return await FrontendUserService.recover(query)
    }, {
        query: 'id',
    })
    .all('/*', async () => {
        throw new ApiError(API_CODE.NOT_FOUND, '接口不存在')
    })
