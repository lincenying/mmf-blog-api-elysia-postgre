import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'
import { logger } from '~/utils/logger'

/**
 * 业务错误原样抛出。其余错误写入日志，并返回统一的服务器错误。
 */
export function throwAsApiError(err: unknown, logMessage: string): never {
    if (err instanceof ApiError)
        throw err

    logger.error({ err }, logMessage)
    throw new ApiError(API_CODE.SERVER_ERROR, '服务器内部错误')
}
