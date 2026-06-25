import type { User } from './user'

/**
 * 评论详情
 */
export interface Comment {
    _id?: string
    id?: string
    /** * 评论所属文章ID */
    article_id: string
    /** * 发布评论的用户 */
    userid: string | User
    /** * 评论内容 */
    content: string
    /** * 创建时间 */
    creat_date: string
    /** * 是否删除: 0: 正常 | 1: 已删除 */
    is_delete: number
    /** * 发布时间戳 */
    timestamp: number | string
    /** * 用户邮箱 */
    email?: string
    /** * 用户名 */
    username?: string
}
