import { Elysia, t } from 'elysia'

import { createPublicApiLayer } from '~/plugins'
import { tt } from '~/schema/elysia-schema-error'

import { UploadImageService } from './upload.service'

/** 上传接口插件（复用公开 API 中间件栈）。 */
export const uploadRouter = new Elysia({ prefix: '/api/upload' })
    .use(createPublicApiLayer())
    .post('/image', async ({ body }) => {
        return UploadImageService.uploadImage(body.file)
    }, {
        body: t.Object({
            file: tt.File('文件', {
                type: 'image',
            }),
        }),
    })
