import { lstat, mkdir } from 'fs/promises'
import { basename, resolve, sep } from 'path'

import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { logger } from '~/utils/logger'

/** 上传文件落盘目录（相对进程工作目录）。 */
export const UPLOAD_DIR = './uploads'

const IMAGE_KIND = {
    jpeg: { ext: 'jpg', mime: 'image/jpeg' },
    png: { ext: 'png', mime: 'image/png' },
    gif: { ext: 'gif', mime: 'image/gif' },
    webp: { ext: 'webp', mime: 'image/webp' },
} as const

type ImageKind = keyof typeof IMAGE_KIND

/** 允许读取的图片扩展名。新上传的 JPEG 记为 jpg，同时兼容已有的 jpeg 文件。 */
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

/**
 * 上传成功后返回给调用方的文件信息。
 */
export interface IUploadImageResult {
    filename: string
    originalName: string
    size: number
    type: string
    url: string
}

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
 * 判断路径对应的文件名是否为允许访问的图片扩展名。
 */
function hasAllowedImageExtension(filePath: string) {
    const ext = basename(filePath).split('.').pop()?.toLowerCase() ?? ''
    return ALLOWED_IMAGE_EXTENSIONS.has(ext)
}

/**
 * 根据文件头识别图片类型。无法识别时返回 null。
 */
async function detectImageKind(file: File): Promise<ImageKind | null> {
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())

    if (header.length >= 3 && header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF)
        return 'jpeg'

    if (
        header.length >= 8
        && header[0] === 0x89
        && header[1] === 0x50
        && header[2] === 0x4E
        && header[3] === 0x47
        && header[4] === 0x0D
        && header[5] === 0x0A
        && header[6] === 0x1A
        && header[7] === 0x0A
    ) {
        return 'png'
    }

    if (
        header.length >= 6
        && header[0] === 0x47
        && header[1] === 0x49
        && header[2] === 0x46
        && header[3] === 0x38
        && (header[4] === 0x37 || header[4] === 0x39)
        && header[5] === 0x61
    ) {
        return 'gif'
    }

    if (
        header.length >= 12
        && header[0] === 0x52
        && header[1] === 0x49
        && header[2] === 0x46
        && header[3] === 0x46
        && header[8] === 0x57
        && header[9] === 0x45
        && header[10] === 0x42
        && header[11] === 0x50
    ) {
        return 'webp'
    }

    return null
}

/**
 * 图片上传落盘业务。
 */
export class UploadImageService {
    /**
     * 读取 uploads 目录中的已上传图片。路径越界、扩展名不在白名单或不是普通文件时返回 null。
     */
    public static async openUploadFile(relativePath: string) {
        const target = resolveInsideUpload(relativePath)
        if (!target || !hasAllowedImageExtension(target))
            return null

        try {
            const info = await lstat(target)
            if (!info.isFile())
                return null
        }
        catch {
            return null
        }

        return Bun.file(target)
    }

    /**
     * 保存上传图片到 uploads 目录。类型以文件头为准，文件名使用随机 UUID。
     */
    public static async uploadImage(file: File): Promise<IUploadImageResult> {
        try {
            await mkdir(UPLOAD_DIR, { recursive: true })

            const kind = await detectImageKind(file)
            if (!kind)
                throw new ApiError(API_CODE.VALIDATION, '仅支持 jpg、png、gif、webp 图片')

            const safeName = `${crypto.randomUUID()}.${IMAGE_KIND[kind].ext}`
            const filePath = resolveInsideUpload(safeName)
            if (!filePath)
                throw new ApiError(API_CODE.VALIDATION, '文件名无效')

            await Bun.write(filePath, file)

            return {
                filename: safeName,
                originalName: file.name,
                size: file.size,
                type: IMAGE_KIND[kind].mime,
                url: `/uploads/${safeName}`,
            }
        }
        catch (error) {
            if (error instanceof ApiError)
                throw error

            logger.error({ err: error }, '上传错误')
            throw new ApiError(API_CODE.SERVER_ERROR, '服务器内部错误')
        }
    }
}
