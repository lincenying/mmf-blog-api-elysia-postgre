/**
 * 用户详情
 */
export interface User {
    _id?: string
    id?: string
    /** * 用户名 */
    username: string
    /** * 邮箱 */
    email: string
    /** * 密码 */
    password: string
    /** * 创建时间 */
    creat_date: string
    /** * 编辑时间 */
    update_date: string
    /** * 是否删除: 0: 正常 | 1: 已删除 */
    is_delete: number
    /** * 发布时间戳 */
    timestamp: number | string
    wx_avatar?: string
    wx_signature?: string
    userid?: Objable
}

/**
 * 用户 cookies
 */
export interface UserCookies {
    user?: string
    userid?: string
    username?: string
    useremail?: string
    [propName: string]: string | undefined
}
