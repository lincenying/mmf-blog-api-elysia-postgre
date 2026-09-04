import lincy from '@lincy/eslint-config'

const config = lincy({
    antislop: {
        overrides: {
            'slop/prefer-jsdoc': 'off',
        },
    },
    vue: false,
    pnpm: false,
    formatters: {
        css: true,
    },
    overrides: {
        ignores: ['**/assets', '**/static', '**/public/global'],
        unicorn: {
            'unicorn/prefer-node-protocol': 'off',
        },
    },
})

module.exports = config
