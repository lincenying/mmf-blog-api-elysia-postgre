import { jwt } from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'

import { config, secretClient } from '~/config'
import { createCookieSessionApiLayer } from '~/plugins'
import { ApiError } from '~/plugins/response-wrapper'

/** JWT 演示路由插件（Cookie 存放 token）。 */
export const jwtRouter = new Elysia({ prefix: '/api/jwt' })
    .use(createCookieSessionApiLayer())
    .use(jwt({
        name: 'jwt',
        secret: secretClient,
    }))
    .get('/sign/:name', async ({ jwt, cookie: { auth }, params }) => {
        auth.set({
            value: await jwt.sign(params),
            maxAge: config.jwt.expiresInSeconds,
            httpOnly: true,
        })

        return `Sign in as ${params.name}`
    })
    .get('/profile', async ({ jwt, cookie: { auth } }) => {
        const profile = await jwt.verify(auth.value)

        if (!profile) {
            throw new ApiError(401, 'Unauthorized')
        }

        return `Hello ${profile.name}`
    }, {
        cookie: t.Object({
            auth: t.Optional(t.String()),
        }),
    })
    .all('/*', async () => {
        throw new ApiError(404, '接口不存在')
    })
