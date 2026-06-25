/**
 * 业务/API 错误码常量（与 response-wrapper 的 code 字段一致）。
 */
export const API_CODE = {
    OK: 200,
    /** 业务校验失败（历史约定，非 HTTP 201） */
    VALIDATION: 201,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
} as const
