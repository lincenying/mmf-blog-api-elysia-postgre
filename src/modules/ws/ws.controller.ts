import { Elysia, t } from 'elysia'

import { createCookieSessionApiLayer } from '~/plugins'
import { tt } from '~/schema/elysia-schema-error'

/** WebSocket 聊天与广播相关插件。 */
export const wsRouter = new Elysia()
    .use(createCookieSessionApiLayer())
    .ws('/chat', {
        open(ws) {
            const { room, name } = ws.data.query

            ws.subscribe(room)
            ws.publish(room, {
                message: `${name} 进入了聊天室!`,
                name: 'notice',
                time: Date.now(),
            })
        },
        message(ws, message) {
            const { room, name } = ws.data.query

            ws.publish(room, {
                message,
                name,
                time: Date.now(),
            })
        },
        close(ws) {
            const { room, name } = ws.data.query

            ws.publish(room, {
                message: `${name} 离开了聊天室`,
                name: 'notice',
                time: Date.now(),
            })
        },
        body: t.String(),
        query: t.Object({
            room: tt.String('频道'),
            name: tt.String('昵称'),
        }),
        response: t.Object({
            message: tt.String('消息内容'),
            name: tt.String('发送者昵称'),
            time: tt.Number('发送时间'),
        }),
    })
    .get('/send', ({ server }) => {
        server?.publish('general', JSON.stringify({ message: 'hello', name: 'lincenying', time: new Date() }))
        return '发送成功'
    })
