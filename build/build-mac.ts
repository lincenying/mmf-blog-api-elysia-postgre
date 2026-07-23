(async () => {
    const result = await Bun.build({
        entrypoints: ['./src/index.ts'],
        compile: {
            // tsconfig.json 和 package.json 默认禁用
            autoloadTsconfig: true, // 启用 tsconfig.json 加载
            autoloadPackageJson: true, // 启用 package.json 加载

            // .env 和 bunfig.toml 默认启用
            autoloadDotenv: false, // 禁用 .env 加载
            autoloadBunfig: false, // 禁用 bunfig.toml 加载
            outfile: './server-mac',
            target: 'bun-darwin-x64',
        },
        minify: {
            whitespace: true,
            syntax: true,
            // Elysia 通过 constructor.name 识别 ElysiaFile 等响应类型，混淆标识符会导致静态文件变成 [object Object]
            identifiers: false,
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        },
    })

    if (result.success) {
        console.log('构建成功:', result.outputs[0].path)
    }
})()
