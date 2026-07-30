(async () => {
    const result = await Bun.build({
        entrypoints: ['./src/index.ts'],
        minify: {
            // 移除输出中的所有多余空白字符、换行和格式
            whitespace: true,
            // 将 JavaScript 语法重写为更短的等效形式，并执行常量折叠、死代码消除及其他优化
            syntax: true,
            // 根据使用频率重命名局部变量和函数名为更短的标识符
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
