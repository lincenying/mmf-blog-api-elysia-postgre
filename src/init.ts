import { mkdirSync, writeFileSync } from 'node:fs'

import { fsExistsSync, getNowTime } from './utils'

/**
 * 生成 32 字节随机密钥，供 JWT 签名使用。
 */
function createRandomSecret(): string {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 缺少 JWT 密钥文件时生成一份。已存在的文件不会覆盖。
 */
function createSecret() {
    const filePath = './src/config/_secret.js'
    if (fsExistsSync(filePath)) {
        console.log(`${filePath}: 已存在, 自动跳过`)
        return
    }

    const secret = `export const secretServer = '${createRandomSecret()}'\nexport const secretClient = '${createRandomSecret()}'\n`
    writeFileSync(filePath, secret)
    console.log(`${filePath}: 生成成功`)
}

/**
 * 缺少七牛配置模板时生成空模板。
 */
function createQiNiu() {
    const filePath = './src/config/_qiniu.js'
    if (fsExistsSync(filePath)) {
        console.log(`${filePath}: 已存在, 自动跳过`)
        return
    }

    const secret = `export const accessKey = ''\nexport const secretKey = ''\nexport const bucket = ''\n`
    writeFileSync(filePath, secret)
    console.log(`${filePath}: 生成成功`)
}

/**
 * 补齐上传目录、本地环境文件和前端占位页。
 */
function createProjectFiles() {
    if (!fsExistsSync('./uploads')) {
        mkdirSync('./uploads', { recursive: true })
        console.log('./uploads: 生成成功')
    }
    else {
        console.log('./uploads: 已存在, 自动跳过')
    }

    if (!fsExistsSync('./.env')) {
        const date = getNowTime('YY.MMDD')
        const env = `TAG=1.${date}
POSTGRES_DIR=/var/lib/postgresql`
        writeFileSync('./.env', env)
        console.log('./.env: 生成成功')
    }
    else {
        console.log('./.env: 已存在, 自动跳过')
    }

    if (!fsExistsSync('./dist/index.html')) {
        mkdirSync('./dist', { recursive: true })
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MMF Blog API</title>
</head>
<body>
    <h1>MMF Blog API</h1>
</body>
</html>
`
        writeFileSync('./dist/index.html', indexHtml)
        console.log('./dist/index.html: 生成成功')
    }
    else {
        console.log('./dist/index.html: 已存在, 自动跳过')
    }
}

createSecret()
createQiNiu()
createProjectFiles()
