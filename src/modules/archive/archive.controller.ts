import { Elysia } from 'elysia'

import { createAdminAuthGuard, createCookieSessionApiLayer } from '~/plugins'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'

import { ArchiveService } from './archive.service'

/** 归档 REST 插件：列表/详情公开，增删改需管理员。 */
export const archiveRouter = new Elysia({ prefix: '/api/archive' })
    .use(createCookieSessionApiLayer())
    .get('/lists', async ({ query }) => {
        return await ArchiveService.getList(query)
    }, {
        query: 'archive.page',
    })
    .get('/lists/', async ({ query }) => {
        return await ArchiveService.getList(query)
    }, {
        query: 'archive.page',
    })
    .get('/:id', async ({ params }) => {
        return await ArchiveService.getItem(Number(params.id))
    }, {
        params: 'archive.id',
    })
    .use(createAdminAuthGuard())
    .post('/', async ({ body }) => {
        return await ArchiveService.insert(body)
    }, {
        body: 'archive.insert',
    })
    .put('/:id', async ({ params, body }) => {
        return await ArchiveService.modify(Number(params.id), body)
    }, {
        params: 'archive.id',
        body: 'archive.modify',
    })
    .delete('/:id', async ({ params }) => {
        return await ArchiveService.deletes(Number(params.id))
    }, {
        params: 'archive.id',
    })
    .all('/*', async () => {
        throw new ApiError(API_CODE.NOT_FOUND, '接口不存在')
    })
