(async () => {
    const result = await Bun.build({
        entrypoints: ['./src/index.ts'],
        minify: {
            whitespace: true,
            syntax: true,
            // Elysia 通过 constructor.name 识别 ElysiaFile 等响应类型，混淆标识符会导致静态文件变成 [object Object]
            identifiers: false,
        },
        outdir: './dist',
        target: 'bun',
        define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        },
    })

    if (result.success) {
        console.log('构建成功:', result.outputs[0].path)
    }
})()
