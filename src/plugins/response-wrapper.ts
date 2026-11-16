import type { IApiResponse } from '~/types/global.types'

import { Elysia } from 'elysia'

import { API_CODE } from '~/types/api-code'
import { logger } from '~/utils/logger'

/**
 * API 错误类
 *
 * 继承自 Error，包含错误码信息
 * 中间件会自动检测此类型的错误并根据错误码设置相应的 HTTP 状态码
 */
export class ApiError extends Error {
    public readonly code: number

    constructor(code: number, message: string) {
        super(message)
        this.code = code
        this.name = 'ApiError'
    }
}

/**
 * 将 Elysia 校验错误格式化为可读字符串。
 */
function formatValidationError(error: {
    customError?: unknown
    messageValue?: { path?: string, message?: string }
    message?: string
}): string {
    if (typeof error.customError === 'string') {
        return error.customError
    }
    const path = error.messageValue?.path?.replace('/', '') ?? ''
    const msg = error.messageValue?.message ?? error.message ?? '参数校验失败'
    return path ? `${path}: ${msg}` : msg
}

/**
 * 响应包装中间件
 *
 * 自动将 Service 层返回值包装为规范约定的 IApiResponse（code / message / data）
 */
export const responseWrapperMiddleware = new Elysia({
    name: 'response-wrapper',
})
    .onAfterHandle(({ responseValue }) => {
        let message = ''
        if (typeof responseValue === 'string') {
            message = responseValue
        }

        const successResponse: IApiResponse<typeof responseValue> = {
            code: 200,
            message,
            data: responseValue,
        }

        return successResponse
    })
    .onError(({ error, set, code }) => {
        let errorMessage = '服务器内部错误'
        let statusCode: number = API_CODE.SERVER_ERROR

        if (error instanceof ApiError) {
            errorMessage = error.message
            statusCode = error.code
        }
        else if (code === 'VALIDATION') {
            errorMessage = formatValidationError(error)
            statusCode = API_CODE.VALIDATION
            logger.warn({ message: errorMessage }, '参数校验失败')
        }
        else if (code === 'NOT_FOUND') {
            errorMessage = '接口不存在'
            statusCode = API_CODE.NOT_FOUND
        }
        else if (code === 'PARSE') {
            errorMessage = '请求格式错误'
            statusCode = API_CODE.VALIDATION
        }
        else {
            logger.error({ err: error }, '未处理的请求错误')
            errorMessage = '服务器内部错误'
            statusCode = API_CODE.SERVER_ERROR
        }

        set.status = 200

        const errorResponse: IApiResponse<null> = {
            code: statusCode,
            message: errorMessage,
            data: null,
        }

        return errorResponse
    })
    .as('scoped')
