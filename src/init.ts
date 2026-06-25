import { accessSync, constants, writeFileSync } from 'fs'

function fsExistsSync(path: string) {
    try {
        accessSync(path, constants.F_OK)
    }
    catch (_e) {
        return false
    }
    return true
}
function creatSecret() {
    if (!fsExistsSync('./src/config/_secret.js')) {
        const secretServer1 = Math.random() * 1000000
        const secretClient1 = Math.random() * 1000000
        const secret1 = `
            export const secretServer = '${secretServer1}'
            export const secretClient = '${secretClient1}'
        `
        writeFileSync('./src/config/_secret.js', secret1)
        console.log('./src/config/_secret.js: 生成成功')
    }
    else {
        console.log('./src/config/_secret.js: 已存在, 自动跳过')
    }
}

function creatQiNiu() {
    if (!fsExistsSync('./src/config/_qiniu.js')) {
        const secret = `
            export const accessKey = ''
            export const secretKey = ''
            export const bucket = ''
        `
        writeFileSync('./src/config/_qiniu.js', secret)
        console.log('./src/config/_qiniu.js: 生成成功')
    }
    else {
        console.log('./src/config/_qiniu.js: 已存在, 自动跳过')
    }
}

creatSecret()
creatQiNiu()
