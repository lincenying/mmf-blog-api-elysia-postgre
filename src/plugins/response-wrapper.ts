import type { IApiResponse } from '~/types/global.types'

import { Elysia } from 'elysia'

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
        let statusCode = 500

        if (error instanceof ApiError) {
            errorMessage = error.message
            statusCode = error.code
        }
        else if (code === 'VALIDATION') {
            console.log(error)
            errorMessage = formatValidationError(error)
        }
        else if (error instanceof Error) {
            errorMessage = error.message
        }
        else {
            errorMessage = String(error)
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
