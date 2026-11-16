import { Elysia, t } from 'elysia'

import { createAdminAuthGuard, createCookieSessionApiLayer } from '~/plugins'
import { tt } from '~/schema/elysia-schema-error'

const MESSAGE_MAX_LENGTH = 500

/**
 * 去掉控制字符并限制长度，避免把超长或不可见内容广播到房间。
 */
function visibleText(value: string, maxLength: number) {
    return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength)
}

/** WebSocket 聊天与广播相关插件。 */
export const wsRouter = new Elysia()
    .use(createCookieSessionApiLayer())
    .ws('/chat', {
        open(ws) {
            const room = visibleText(ws.data.query.room, 32)
            const name = visibleText(ws.data.query.name, 32)
            if (!room || !name) {
                ws.close()
                return
            }

            ws.subscribe(room)
            ws.publish(room, {
                message: `${name} 进入了聊天室!`,
                name: 'notice',
                time: Date.now(),
            })
        },
        message(ws, message) {
            const room = visibleText(ws.data.query.room, 32)
            const name = visibleText(ws.data.query.name, 32)
            const text = visibleText(message, MESSAGE_MAX_LENGTH)
            if (!room || !name || !text)
                return

            ws.publish(room, {
                message: text,
                name,
                time: Date.now(),
            })
        },
        close(ws) {
            const room = visibleText(ws.data.query.room, 32)
            const name = visibleText(ws.data.query.name, 32)
            if (!room || !name)
                return

            ws.publish(room, {
                message: `${name} 离开了聊天室`,
                name: 'notice',
                time: Date.now(),
            })
        },
        body: t.String({ maxLength: MESSAGE_MAX_LENGTH }),
        query: t.Object({
            room: tt.String('频道', { minLength: 1, maxLength: 32 }),
            name: tt.String('昵称', { minLength: 1, maxLength: 32 }),
        }),
        response: t.Object({
            message: tt.String('消息内容'),
            name: tt.String('发送者昵称'),
            time: tt.Number('发送时间'),
        }),
    })
    .use(createAdminAuthGuard())
    .get('/send', ({ server }) => {
        server?.publish('general', JSON.stringify({
            message: 'hello',
            name: 'notice',
            time: Date.now(),
        }))
        return '发送成功'
    })
