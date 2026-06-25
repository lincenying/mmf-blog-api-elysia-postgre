/**
 * 分类详情
 */
export interface Category {
    _id?: string
    id?: string
    /** * 分类名称 */
    cate_name: string
    /** * 分类排序 */
    cate_order: string
    /** * 分类中文章数量 */
    cate_num?: number
    /** * 创建时间 */
    creat_date?: string
    /** * 编辑时间 */
    update_date?: string
    /** * 是否删除: 0: 正常 | 1: 已删除 */
    is_delete?: number
    /** * 发布时间戳 */
    timestamp?: number | string
}
