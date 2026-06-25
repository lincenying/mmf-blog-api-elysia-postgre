import type { UserInsert } from '~/schema/elysia-schema'

import Twig from 'twig'

import { getTemplateDir } from '~/utils'

import { BackendUserService } from '../backend/backend-user.service'

/**
 * 后台 Twig 模板渲染与初始化管理员流程。
 */
export class AdminTemplateService {
    public static async getAdminTemplate() {
        const templateDir = getTemplateDir('./views/index.twig')
        const html = await new Promise<string>((resove) => {
            Twig.renderFile(templateDir, { title: '添加管理员', message: '' }, (err, html) => {
                resove(err ? err.toString() : html)
            })
        })
        return html
    }

    public static async postAdminTemplate(body: UserInsert) {
        const message = await BackendUserService.insert(body)
        const templateDir = getTemplateDir('./views/index.twig')
        const html = await new Promise<string>((resove) => {
            Twig.renderFile(templateDir, { title: '添加管理员', message }, (err, html) => {
                resove(err ? err.toString() : html)
            })
        })
        return html
    }

    public static async chatTemplate() {
        const templateDir = getTemplateDir('./views/chat.twig')
        const html = await new Promise<string>((resove) => {
            Twig.renderFile(templateDir, { title: '聊天室', message: '' }, (err, html) => {
                resove(err ? err.toString() : html)
            })
        })
        return html
    }
}
