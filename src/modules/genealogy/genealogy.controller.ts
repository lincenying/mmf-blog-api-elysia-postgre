import { html } from '@elysiajs/html'
import { Elysia } from 'elysia'

import { createAdminAuthGuard, createCookieSessionApiLayer } from '~/plugins'
import { ApiError } from '~/plugins/response-wrapper'
import { validationSchema } from '~/schema/elysia-schema'
import { API_CODE } from '~/types/api-code'
import { applyAdminSessionCookies, clearAdminSessionCookies } from '~/utils/session-cookie'

import { BackendUserService } from '../backend/backend-user.service'

import { GenealogyPageService } from './genealogy-page.service'
import { GenealogyService } from './genealogy.service'

/** 族谱页面插件（公开）。 */
export const genealogyPageRouter = new Elysia()
    .use(validationSchema)
    .use(html())
    .get('/genealogy', async () => {
        return await GenealogyPageService.genealogyTemplate()
    })

/** 族谱 REST 插件：列表/登录公开，增删改需管理员。 */
export const genealogyRouter = new Elysia({ prefix: '/api/genealogy' })
    .use(createCookieSessionApiLayer())
    .get('/lists', async () => {
        return await GenealogyService.getList()
    })
    .get('/lists/', async () => {
        return await GenealogyService.getList()
    })
    .post('/login', async ({ body, cookie }) => {
        const json = await BackendUserService.login(body)
        applyAdminSessionCookies(cookie, json)
        return json
    }, {
        body: 'user.login',
    })
    .get('/logout', async ({ cookie }) => {
        clearAdminSessionCookies(cookie)
        return BackendUserService.logout()
    })
    .use(createAdminAuthGuard())
    .get('/auth', async () => {
        return GenealogyService.authOk()
    })
    .post('/', async ({ body }) => {
        return await GenealogyService.insert(body)
    }, {
        body: 'genealogy.insert',
    })
    .put('/:id', async ({ params, body }) => {
        return await GenealogyService.modify(Number(params.id), body)
    }, {
        params: 'genealogy.id',
        body: 'genealogy.modify',
    })
    .delete('/:id', async ({ params }) => {
        return await GenealogyService.deletes(Number(params.id))
    }, {
        params: 'genealogy.id',
    })
    .all('/*', async () => {
        throw new ApiError(API_CODE.NOT_FOUND, '接口不存在')
    })
