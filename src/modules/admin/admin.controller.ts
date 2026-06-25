import { html } from '@elysiajs/html'
import { Elysia } from 'elysia'

import { validationSchema } from '~/schema/elysia-schema'

import { AdminTemplateService } from './admin.service'

/** 后台 Twig 模板页插件。 */
export const adminRouter = new Elysia({ prefix: '/backend' })
    .use(validationSchema)
    .use(html())
    .get('/', async () => {
        return await AdminTemplateService.getAdminTemplate()
    })
    .post('/', async ({ body }) => {
        return await AdminTemplateService.postAdminTemplate(body)
    }, {
        body: 'user.insert',
    })
    .get('/chat', async () => {
        return await AdminTemplateService.chatTemplate()
    })
