import { mkdir } from 'fs/promises'
import { join } from 'path'

import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'

/**
 * 图片上传落盘业务。
 */
export class UploadImageService {
    public static async uploadImage(file: File) {
        const UPLOAD_DIR = './uploads'
        await mkdir(UPLOAD_DIR, { recursive: true })

        try {
            if (!file || !(file instanceof File)) {
                throw new ApiError(API_CODE.VALIDATION, '未上传文件或字段名称无效')
            }

            const ext = file.name.split('.').pop()
            const safeName = `${crypto.randomUUID()}${ext ? `.${ext}` : ''}`
            const filePath = join(UPLOAD_DIR, safeName)

            await Bun.write(filePath, file)

            return {
                filename: safeName,
                originalName: file.name,
                size: file.size,
                type: file.type,
            }
        }
        catch (error) {
            console.error('上传错误:', error)
            throw new ApiError(API_CODE.SERVER_ERROR, '服务器内部错误')
        }
    }
}
