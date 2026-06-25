import lincy from '@lincy/eslint-config'

const config = lincy({
    vue: false,
    pnpm: false,
    overrides: {
        ignores: ['**/assets', '**/static', '**/public/global'],
        unicorn: {
            'unicorn/prefer-node-protocol': 'off',
        },
    },
})

module.exports = config
