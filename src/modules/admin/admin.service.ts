import type { UserInsert } from '~/schema/elysia-schema'

import Twig from 'twig'

import { getTemplateDir } from '~/utils'

import { BackendUserService } from '../backend/backend-user.service'

/**
 * 转义写入 HTML 模板的文本。
 */
function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll('\'', '&#39;')
}

/**
 * 渲染 Twig 模板。渲染失败时返回已转义的错误文本。
 */
function renderTemplate(file: string, data: Record<string, string>) {
    const templateDir = getTemplateDir(file)
    return new Promise<string>((resolve) => {
        Twig.renderFile(templateDir, data, (err, html) => {
            resolve(err ? escapeHtml(err.toString()) : html)
        })
    })
}

/**
 * 后台 Twig 模板渲染与初始化管理员流程。
 */
export class AdminTemplateService {
    /**
     * 渲染添加管理员页面。
     */
    public static async getAdminTemplate() {
        return await renderTemplate('./views/index.twig', { title: '添加管理员', message: '' })
    }

    /**
     * 提交初始化管理员表单并重新渲染页面。
     */
    public static async postAdminTemplate(body: UserInsert) {
        const message = await BackendUserService.insert(body)
        return await renderTemplate('./views/index.twig', {
            title: '添加管理员',
            message: escapeHtml(message),
        })
    }

    /**
     * 渲染聊天室页面。
     */
    public static async chatTemplate() {
        return await renderTemplate('./views/chat.twig', { title: '聊天室', message: '' })
    }
}
