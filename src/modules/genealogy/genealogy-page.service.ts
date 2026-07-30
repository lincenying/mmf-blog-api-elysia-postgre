import Twig from 'twig'

import { getTemplateDir } from '~/utils'

/**
 * 族谱 Twig 页面渲染。
 */
export class GenealogyPageService {
    /**
     * 渲染族谱关系图页面。
     */
    public static async genealogyTemplate() {
        const templateDir = getTemplateDir('./views/genealogy.twig')
        const html = await new Promise<string>((resolve) => {
            Twig.renderFile(templateDir, { title: '族谱' }, (err, html) => {
                resolve(err ? err.toString() : html)
            })
        })
        return html
    }
}
