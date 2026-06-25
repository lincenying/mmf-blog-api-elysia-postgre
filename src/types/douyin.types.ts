import type { User } from './user'

/**
 * 抖音用户详情
 */
export interface DouYinUser {
    _id?: string
    id?: string
    user_id: string
    user_name: string
    user_avatar: string
    sec_uid: string
    share_url: string
    creat_date: string
    is_delete: number
    timestamp: number | string
}

/**
 * 抖音视频详情
 */
export interface DouYin {
    id?: string
    user_id: string
    user: User
    aweme_id: string
    desc: string
    vid: string
    image: string
    video: string
    creat_date: string
    is_delete: number
    timestamp: number | string
}

/**
 * 添加抖音账号
 */
export interface DouYinUserInsert {
    user_id: string
    user_name: string
    user_avatar: string
    sec_uid: string
    share_url: string
}

/**
 * 添加抖音视频
 */
export interface DouYinInsert {
    user_id: string
    aweme_id: string
    desc: string
    vid: string
    image: string
    video: string
}
