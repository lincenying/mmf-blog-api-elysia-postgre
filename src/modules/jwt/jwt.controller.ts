import { jwt } from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'

import { config } from '~/config'
import { createCookieSessionApiLayer } from '~/plugins'
import { ApiError } from '~/plugins/response-wrapper'
import { API_CODE } from '~/types/api-code'

/** 仅用于本演示路由，不参与前台或后台会话校验。 */
const JWT_DEMO_SECRET = 'jwt-demo-only'

/** JWT 演示路由插件（Cookie 存放 token）。 */
export const jwtRouter = new Elysia({ prefix: '/api/jwt' })
    .use(createCookieSessionApiLayer())
    .use(jwt({
        name: 'jwt',
        secret: JWT_DEMO_SECRET,
    }))
    .get('/sign/:name', async ({ jwt, cookie: { auth }, params }) => {
        auth.set({
            value: await jwt.sign({ name: params.name }),
            maxAge: config.jwt.expiresInSeconds,
            httpOnly: true,
            path: '/api/jwt',
            sameSite: 'strict',
        })

        return `Sign in as ${params.name}`
    }, {
        params: t.Object({
            name: t.String({ minLength: 1, maxLength: 32 }),
        }),
    })
    .get('/profile', async ({ jwt, cookie: { auth } }) => {
        const profile = await jwt.verify(auth.value)
        const name = profile && typeof profile === 'object' && 'name' in profile ? profile.name : undefined

        if (typeof name !== 'string' || !name) {
            throw new ApiError(API_CODE.UNAUTHORIZED, 'Unauthorized')
        }

        return `Hello ${name}`
    }, {
        cookie: t.Object({
            auth: t.Optional(t.String()),
        }),
    })
    .all('/*', async () => {
        throw new ApiError(API_CODE.NOT_FOUND, '接口不存在')
    })
