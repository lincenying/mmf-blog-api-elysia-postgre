/**
 * 项目规范（global-01-elysia）约定的统一响应形状；新业务可优先采用。
 * 与下方基于 success 判别联合的 ApiResponse 并存，便于渐进迁移。
 */
export interface IApiResponse<T = unknown> {
    code: number
    message: string
    data: T
}

/** @deprecated 请使用 IApiResponse，与 response-wrapper 输出一致 */
export type ApiResponse<T = unknown> = IApiResponse<T>

export interface ReqListQuery {
    all?: number
    by?: string
    from?: string
    id?: string
    limit?: number
    page?: number
    path?: string
    key?: string
    /* 列表中不显示的字段 */
    filter?: string
}

/**
 * 返回列表结构
 */
export interface ResData<T> {
    code: number
    data: T
    ok?: string | number
    from?: string
    message?: string
    msg?: string
    url?: string
}

export interface Lists<T> {
    hasNext?: number | boolean
    hasPrev?: number | boolean
    total: number
    list: T
}

/**
 * 返回列表结构
 */
export interface ResList<T> {
    code: number
    data: {
        list: T
    }
    message?: string
}

/**
 * 返回分页列表结构
 */
export interface ResLists<T> {
    code: number
    data: Lists<T>
    message?: string
}
