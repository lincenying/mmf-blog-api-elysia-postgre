/* eslint-disable node/prefer-global/process */
/**
 * 配置管理
 *
 * 使用 convict 进行配置管理，支持环境变量、配置文件和默认值
 * 支持 JSON、YAML、TOML 格式的配置文件
 */

import { existsSync } from 'node:fs'
import convict from 'convict'
import * as yaml from 'js-yaml'
import * as toml from 'toml'

import * as _qiniu from './_qiniu.js'
import { configSchema } from './schema'

export { secretClient, secretServer } from './_secret.js'

export const qiniu = _qiniu

// 添加自定义文件解析器
convict.addParser({ extension: 'toml', parse: toml.parse })
convict.addParser({ extension: ['yml', 'yaml'], parse: yaml.load })

// 创建配置实例
const configInstance = convict(configSchema, {
    env: process.env,
})

// 获取当前环境
const nodeEnv = configInstance.get('server.nodeEnv')

// 按优先级加载配置文件
const configFiles = [
    `./config/${nodeEnv}.json`,
    `./config/${nodeEnv}.yaml`,
    `./config/${nodeEnv}.yml`,
    `./config/${nodeEnv}.toml`,
    './config/default.json',
    './config/default.yaml',
    './config/default.yml',
    './config/default.toml',
]

const SENSITIVE_CONFIG_KEYS = new Set(['postgre_password', 'md5_salt'])

/**
 * 打印配置前去掉密码和盐值。
 */
function redactConfig(value: unknown): unknown {
    if (Array.isArray(value))
        return value.map(item => redactConfig(item))

    if (!value || typeof value !== 'object')
        return value

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
            key,
            SENSITIVE_CONFIG_KEYS.has(key) ? '***' : redactConfig(item),
        ]),
    )
}

// 尝试加载配置文件。不存在则跳过；存在但解析失败则停止，避免静默用错配置。
let configLoaded = false
for (const configFile of configFiles) {
    if (!existsSync(configFile))
        continue

    try {
        configInstance.loadFile(configFile)
        console.log(`✅ 成功加载配置文件: ${configFile}`)
        configLoaded = true
        break
    }
    catch (error) {
        console.error(`❌ 配置文件解析失败: ${configFile}`, error)
        process.exit(1)
    }
}

if (!configLoaded) {
    console.log('📋 未找到配置文件，使用环境变量和默认值')
}

// 验证配置
try {
    configInstance.validate({ allowed: 'strict' })
}
catch (error) {
    console.error('❌ 配置验证失败:', error)
    process.exit(1)
}

console.log('✅ 配置验证成功')

/** 导出类型化的配置对象 */
export const config = configInstance.getProperties()

// 打印配置加载结果
console.log('📦 配置加载完成：\n', redactConfig(JSON.parse(configInstance.toString())))
