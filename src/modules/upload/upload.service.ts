import { mkdir, stat } from 'fs/promises'
import { join, resolve, sep } from 'path'

import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'

const UPLOAD_DIR = './uploads'

/**
 * 把 URL 相对路径限制在 uploads 目录内，拒绝目录穿越。
 */
function resolveInsideUpload(relativePath: string) {
    if (!relativePath || relativePath.includes('\0'))
        return null

    const root = resolve(UPLOAD_DIR)
    const target = resolve(root, relativePath)
    if (!target.startsWith(`${root}${sep}`))
        return null

    return target
}

/**
 * 图片上传落盘业务。
 */
export class UploadImageService {
    /**
     * 读取 uploads 目录中的已上传文件。路径越界或不是普通文件时返回 null。
     */
    public static async openUploadFile(relativePath: string) {
        const target = resolveInsideUpload(relativePath)
        if (!target)
            return null

        try {
            const info = await stat(target)
            if (!info.isFile())
                return null
        }
        catch {
            return null
        }

        return Bun.file(target)
    }

    /**
     * 保存上传图片到 uploads 目录，文件名使用随机 UUID。
     */
    public static async uploadImage(file: File) {
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
