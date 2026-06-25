const { createApp, ref, onMounted, onUnmounted, nextTick, computed } = Vue

// 转义 HTML
function escapeHtml(str) {
    if (!str)
        return ''
    return str.replace(/[&<>]/g, (m) => {
        if (m === '&')
            return '&amp;'
        if (m === '<')
            return '&lt;'
        if (m === '>')
            return '&gt;'
        return m
    })
}

const httpRe = /^https?:\/\//i
const wsRe = /^ws:\/\//i

createApp({
    setup() {
        // 响应式数据
        const serverInput = ref('localhost:4000')
        const roomInput = ref('general')
        const nameInput = ref('旅行者')
        const isConnected = ref(false)
        const isConnecting = ref(false)
        const messages = ref([])
        const messageContent = ref('')
        const messagesContainer = ref(null)

        // WebSocket 实例
        let ws = null
        let currentRoom = ''
        let currentName = ''

        // 辅助函数: 格式化时间
        const formatTime = (timestamp) => {
            if (!timestamp)
                return ''
            const date = new Date(timestamp)
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
        }

        // 添加消息 (数据驱动)
        const addMessage = (msgData) => {
            // msgData: { message, name, time }
            const { message, name, time } = msgData
            const isSystem = (name === 'notice')
            let type = 'other'
            if (isSystem)
                type = 'system'
            else if (isConnected.value && currentName === name)
                type = 'own'

            const timeStr = formatTime(time) || formatTime(Date.now())

            messages.value.push({
                message: escapeHtml(String(message)),
                name: escapeHtml(String(name)),
                timeStr,
                type,
            })

            // 自动滚动到底部
            nextTick(() => {
                if (messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
                }
            })
        }

        // 本地系统消息
        const addLocalSystem = (text) => {
            addMessage({
                message: text,
                name: 'notice',
                time: Date.now(),
            })
        }

        // 断开连接
        const disconnect = () => {
            if (ws) {
                ws.onopen = null
                ws.onmessage = null
                ws.onclose = null
                ws.onerror = null
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close(1000, '用户主动断开')
                }
                ws = null
            }
            if (isConnected.value) {
                addLocalSystem(`已断开连接，不再接收消息。`)
            }
            isConnected.value = false
            isConnecting.value = false
            currentRoom = ''
            currentName = ''
        }

        // 清空聊天记录（保留一条提示）
        const clearChatHistory = () => {
            messages.value = []
            addLocalSystem('💬 聊天记录已清空 · 连接后消息将自动显示')
        }

        // 连接 WebSocket
        const connect = () => {
            const server = serverInput.value.trim()
            const room = roomInput.value.trim()
            const name = nameInput.value.trim()

            if (!server) {
                addLocalSystem('❌ 请填写服务器地址 (例如 localhost:4000)')
                return
            }
            if (!room) {
                addLocalSystem('❌ 房间号不能为空')
                return
            }
            if (!name) {
                addLocalSystem('❌ 昵称不能为空')
                return
            }

            // 标准化地址
            let cleanServer = server.replace(httpRe, '').replace(wsRe, '')
            if (cleanServer.includes('/chat')) {
                addLocalSystem('⚠️ 服务器地址不需要包含 /chat 路径，系统会自动拼接')
                cleanServer = cleanServer.split('/')[0]
            }
            const wsUrl = `ws://${cleanServer}/chat?room=${encodeURIComponent(room)}&name=${encodeURIComponent(name)}`

            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                disconnect()
            }

            isConnecting.value = true
            addLocalSystem(`🔄 正在连接房间「${room}」, 昵称: ${name} ...`)

            ws = new WebSocket(wsUrl)
            const connectionTimeout = setTimeout(() => {
                if (ws && ws.readyState !== WebSocket.OPEN) {
                    addLocalSystem('⏰ 连接超时，请检查服务器地址是否正确，或后端服务是否运行')
                    if (ws)
                        ws.close()
                    isConnecting.value = false
                    isConnected.value = false
                    clearTimeout(connectionTimeout)
                }
            }, 10000)

            ws.onopen = () => {
                clearTimeout(connectionTimeout)
                currentRoom = room
                currentName = name
                isConnected.value = true
                isConnecting.value = false
                addLocalSystem(`✅ 成功进入房间「${currentRoom}」，开始聊天吧~`)
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (typeof data.message === 'string' && typeof data.name === 'string') {
                        addMessage(data)
                    }
                    else {
                        console.warn('收到格式异常的消息', data)
                    }
                }
                catch (e) {
                    console.error('解析消息失败', e)
                    addLocalSystem(`⚠️ 收到非标准消息: ${escapeHtml(String(event.data))}`)
                }
            }

            ws.onclose = (event) => {
                clearTimeout(connectionTimeout)
                if (ws === null)
                    return // 主动断开已清理
                const wasConnected = isConnected.value
                ws = null
                isConnected.value = false
                isConnecting.value = false
                if (wasConnected) {
                    addLocalSystem(`🔌 与聊天室断开连接 (code: ${event.code})，如需继续请重新连接。`)
                }
                else {
                    if (event.code !== 1000) {
                        addLocalSystem(`⚠️ 连接关闭 (code: ${event.code})，请检查服务器或网络。`)
                    }
                }
                currentRoom = ''
                currentName = ''
            }

            ws.onerror = (error) => {
                console.error('WebSocket错误:', error)
                addLocalSystem(`❌ 连接发生错误，请确认后端Elysia服务正常运行在 ${cleanServer} 并支持 /chat`)
                isConnecting.value = false
            }
        }

        // 发送消息
        const sendMessage = () => {
            if (!isConnected.value || !ws || ws.readyState !== WebSocket.OPEN) {
                addLocalSystem('⚠️ 未连接到聊天室，请先点击「连接」')
                return
            }
            const content = messageContent.value.trim()
            if (content === '')
                return
            ws.send(content)
            addMessage({
                message: content,
                name: currentName,
                time: Date.now(),
            })
            messageContent.value = ''
        }

        // 计算状态文本
        const statusText = computed(() => {
            if (isConnected.value)
                return `已连接 (${currentRoom} / ${currentName})`
            if (isConnecting.value)
                return '连接中...'
            return '未连接'
        })

        // 组件挂载时，添加初始提示
        onMounted(() => {
            addLocalSystem('✨ 提示: 确保Elysia后端已启动，填写服务器地址(如 localhost:4000)，房间和昵称后点击连接')
        })

        // 组件卸载时断开连接
        onUnmounted(() => {
            if (ws) {
                ws.close(1000, '组件卸载')
                ws = null
            }
        })

        return {
            serverInput,
            roomInput,
            nameInput,
            isConnected,
            isConnecting,
            messages,
            messageContent,
            messagesContainer,
            connect,
            disconnect,
            sendMessage,
            statusText,
            clearChatHistory,
        }
    },
}).mount('#app')
