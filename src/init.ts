import { accessSync, constants, mkdirSync, writeFileSync } from 'fs'

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

function creatProjectFiles() {
    if (!fsExistsSync('./uploads')) {
        mkdirSync('./uploads', { recursive: true })
        console.log('./uploads: 生成成功')
    }
    else {
        console.log('./uploads: 已存在, 自动跳过')
    }

    if (!fsExistsSync('./.env')) {
        const env = `TAG=1.26.0625`
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

creatSecret()
creatQiNiu()
creatProjectFiles()
