import { LRUCache } from 'lru-cache'

/** 代理缓存条目（美姿图等第三方响应体）。 */
export type ProxyCacheValue = string | ArrayBuffer | Record<string, unknown>

export const meizituCache = new LRUCache<string, ProxyCacheValue>({
    max: 1000,
    ttl: 1000 * 60 * 60 * 24 * 7,
})

export const douyinCache = new LRUCache<string, ProxyCacheValue>({
    max: 1000,
    ttl: 1000 * 60 * 60 * 1,
})
