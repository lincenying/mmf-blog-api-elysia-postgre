import { Elysia, t } from 'elysia'

import { createPublicApiLayer } from '~/plugins'
import { tt } from '~/schema/elysia-schema-error'

import { UploadImageService } from './upload.service'

/** 直接返回 uploads 目录中的文件，不走 API 响应包装。 */
export const uploadFileRouter = new Elysia({ name: 'upload-file' })
    .get('/uploads/*', async ({ params, set }) => {
        const uploaded = await UploadImageService.openUploadFile(params['*'])
        if (!uploaded) {
            set.status = 404
            return 'Not Found'
        }

        set.headers['cache-control'] = 'public, max-age=2592000'
        return uploaded
    })

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
