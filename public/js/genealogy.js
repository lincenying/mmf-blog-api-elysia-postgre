/* eslint-disable unicorn/prefer-dom-node-text-content */
/* eslint-disable ts/no-unused-vars */
/* eslint-disable no-alert */
// ===================== 核心配置 =====================
const API_BASE = '/api/genealogy'
const API_URL = `${API_BASE}/lists/`

// ===================== 全局变量 =====================
let treeData = null
const nodeMap = new Map()
let svg, g, zoom
let descTooltip
let rootData
const NODE_WIDTH = 110
const NODE_HEIGHT = 45
const H_SPACE = 400
const V_SPACE = 70

// 提示框配置：最多保留3条
const MAX_TOOLTIPS = 3
let tooltipList = [] // 存储提示框列表

// 管理面板
let manageListData = []
let manageFormMode = 'create'
let pendingOpenManage = false
let isAdminLoggedIn = false

function isApiOk(res) {
    return res && Number(res.code) === 200
}

function syncLogoutBtn() {
    const btn = document.getElementById('logoutBtn')
    if (btn)
        btn.style.display = isAdminLoggedIn ? 'inline-block' : 'none'
}

// ===================== 初始化 =====================
window.onload = async () => {
    descTooltip = document.getElementById('descTooltip')
    svg = d3.select('#family-tree')

    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter')
            searchNode()
    })

    document.getElementById('loginPassword').addEventListener('keyup', (e) => {
        if (e.key === 'Enter')
            submitLogin()
    })

    await checkAdminAuth()
    await loadData()
    if (!treeData)
        return
    initZoom()
    renderTree()
    document.getElementById('loading').style.display = 'none'
}

// ===================== 数据加载 =====================
async function fetchGenealogyList() {
    const res = await (await fetch(API_URL, { credentials: 'include' })).json()
    if (!isApiOk(res))
        throw new Error(res.message || '加载失败')
    return res.data
}

async function loadData() {
    try {
        const rawData = await fetchGenealogyList()
        buildNodeMap(rawData)
        treeData = buildTreeData()
        return rawData
    }
    catch (err) {
        console.error('数据加载失败：', err)
        alert('数据加载失败！')
        document.getElementById('loading').textContent = '加载失败'
        return null
    }
}

async function checkAdminAuth() {
    try {
        const res = await (await fetch(`${API_BASE}/auth`, { credentials: 'include' })).json()
        isAdminLoggedIn = isApiOk(res)
    }
    catch {
        isAdminLoggedIn = false
    }
    syncLogoutBtn()
    return isAdminLoggedIn
}

function openLoginPanel() {
    document.getElementById('loginOverlay').classList.add('open')
    document.getElementById('loginUsername').focus()
}

function closeLoginPanel() {
    document.getElementById('loginOverlay').classList.remove('open')
    pendingOpenManage = false
}

async function submitLogin() {
    const username = document.getElementById('loginUsername').value.trim()
    const password = document.getElementById('loginPassword').value
    if (!username || !password) {
        alert('请输入账号和密码')
        return
    }
    try {
        await apiRequest(`${API_BASE}/login`, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        })
        isAdminLoggedIn = true
        syncLogoutBtn()
        document.getElementById('loginOverlay').classList.remove('open')
        document.getElementById('loginPassword').value = ''
        if (pendingOpenManage) {
            pendingOpenManage = false
            await doOpenManagePanel()
        }
    }
    catch (err) {
        alert(err.message || '登录失败')
    }
}

async function logoutAdmin() {
    try {
        await apiRequest(`${API_BASE}/logout`, { method: 'GET' })
    }
    catch (err) {
        // ignore
    }
    isAdminLoggedIn = false
    syncLogoutBtn()
    closeManagePanel()
}

/**
 * 刷新族谱树（管理面板保存/删除后调用）
 */
async function refreshTree() {
    tooltipList = []
    renderAllTooltips()
    if (g)
        g.selectAll('*').remove()
    nodeMap.clear()
    treeData = null
    rootData = null
    const rawData = await loadData()
    if (!treeData)
        return rawData
    renderTree()
    return rawData
}

function buildNodeMap(data) {
    nodeMap.clear()
    data.forEach(item => nodeMap.set(item.id, { ...item, children: [] }))
    nodeMap.forEach((node) => {
        if (node.parent !== 0 && nodeMap.has(node.parent)) {
            nodeMap.get(node.parent).children.push(node)
        }
    })
}

function buildTreeData() {
    for (const node of nodeMap.values()) {
        if (node.parent === 0 || !nodeMap.has(node.parent))
            return node
    }
    return null
}

// ===================== 缩放拖拽 =====================
function initZoom() {
    zoom = d3
        .zoom()
        .scaleExtent([0.2, 3])
        .on('zoom', e => g.attr('transform', e.transform))
    svg.call(zoom)
    g = svg.append('g').attr('transform', `translate(100, ${window.innerHeight / 2})`)
}

// ===================== 渲染族谱 =====================
function renderTree() {
    const treeLayout = d3
        .tree()
        .nodeSize([V_SPACE, H_SPACE])
        .separation(() => 1)

    rootData = d3.hierarchy(treeData)
    treeLayout(rootData)

    g.selectAll('.link')
        .data(rootData.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr(
            'd',
            d3
                .linkHorizontal()
                .x(d => d.y)
                .y(d => d.x),
        )

    const nodes = g
        .selectAll('.node')
        .data(rootData.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y}, ${d.x})`)
        .on('click', (e, d) => handleClick(d.data))
        .on('mousemove', (e, d) => showDescTooltip(e, d.data))
        .on('mouseout', hideDescTooltip)

    nodes
        .append('rect')
        .attr('class', 'node-rect')
        .attr('x', -NODE_WIDTH / 2)
        .attr('y', -NODE_HEIGHT / 2)
        .attr('width', NODE_WIDTH)
        .attr('height', NODE_HEIGHT)

    nodes
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 5)
        .text(d => d.data.name)
}

// ===================== 悬浮desc =====================
function showDescTooltip(e, data) {
    if (!data.desc)
        return
    descTooltip.innerText = data.desc
    descTooltip.style.display = 'block'
    descTooltip.style.left = `${e.pageX + 15}px`
    descTooltip.style.top = `${e.pageY - 20}px`
}
function hideDescTooltip() {
    descTooltip.style.display = 'none'
}

// ===================== 点击节点（新增多条提示） =====================
function handleClick(clickNode) {
    d3.selectAll('.node').classed('active ancestor search-result', false)
    d3.selectAll('.node')
        .filter(d => d.data.id === clickNode.id)
        .classed('active', true)

    const ancestors = getAncestors(clickNode)
    ancestors.forEach((node) => {
        d3.selectAll('.node')
            .filter(d => d.data.id === node.id)
            .classed('ancestor', true)
    })

    addRelationTooltip(clickNode, ancestors)
}

function getAncestors(node) {
    const list = []
    let curr = node
    while (curr.parent !== 0 && nodeMap.has(curr.parent)) {
        curr = nodeMap.get(curr.parent)
        list.push(curr)
    }
    return list
}

// ===================== 核心：添加多条提示框（最多3条，带关闭按钮） =====================
function addRelationTooltip(clickNode, ancestors) {
    if (!ancestors.length)
        return

    const levels = ['父亲', '祖父', '曾祖', '高祖', '天祖', '烈祖', '太祖', '远祖', '鼻祖']
    let html = `${clickNode.name} 的先辈：`

    ancestors.forEach((item, i) => {
        const rel = levels[i] || `${i + 1}世祖`
        html += ` <span class="name-link" onclick="jumpToNode(${item.id})">${item.name}</span>（${rel}）`
        if (i < ancestors.length - 1)
            html += ' →'
    })

    // 加入队列，超过3条删除第一条
    tooltipList.push(html)
    if (tooltipList.length > MAX_TOOLTIPS) {
        tooltipList.shift()
    }

    renderAllTooltips()
}

// 重新渲染所有提示框（带关闭按钮）
function renderAllTooltips() {
    const container = document.getElementById('tooltipContainer')
    container.innerHTML = ''

    tooltipList.forEach((content, index) => {
        const div = document.createElement('div')
        div.className = 'relation-tooltip'
        div.innerHTML = `
            ${content}
            <span class="tooltip-close" onclick="closeTooltip(${index})">×</span>
        `
        container.appendChild(div)
    })
}

// ===================== 关闭单条提示框 =====================
function closeTooltip(index) {
    tooltipList.splice(index, 1) // 删除对应索引的提示
    renderAllTooltips() // 重新渲染
}

// ===================== 点击名字跳转 =====================
function jumpToNode(nodeId) {
    const targetNode = rootData.descendants().find(d => d.data.id === nodeId)
    if (!targetNode)
        return

    d3.selectAll('.node').classed('active ancestor search-result', false)
    d3.selectAll('.node')
        .filter(d => d.data.id === nodeId)
        .classed('active', true)
        .classed('search-result', true)

    svg.transition()
        .duration(700)
        .call(
            zoom.transform,
            d3.zoomIdentity.translate(window.innerWidth / 2 - targetNode.y, window.innerHeight / 2 - targetNode.x).scale(1),
        )

    handleClick(targetNode.data)
}

// ===================== 搜索 =====================
function searchNode() {
    const keyword = document.getElementById('searchInput').value.trim()
    if (!keyword) {
        alert('请输入搜索内容')
        return
    }
    d3.selectAll('.node').classed('search-result', false)
    const targetNode = rootData.descendants().find(d => d.data.name.includes(keyword) || d.data.id.toString() === keyword)
    if (!targetNode) {
        alert('未找到匹配的成员')
        return
    }
    d3.selectAll('.node')
        .filter(d => d.data.id === targetNode.data.id)
        .classed('search-result', true)
    svg.transition()
        .duration(800)
        .call(
            zoom.transform,
            d3.zoomIdentity.translate(window.innerWidth / 2 - targetNode.y, window.innerHeight / 2 - targetNode.x).scale(1),
        )
    handleClick(targetNode.data)
}

// ===================== 清空 =====================
function clearSearch() {
    document.getElementById('searchInput').value = ''
    d3.selectAll('.node').classed('active ancestor search-result', false)
    tooltipList = []
    renderAllTooltips()
    svg.transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity.translate(100, window.innerHeight / 2).scale(1))
}

// ===================== 管理面板 =====================
async function apiRequest(url, options = {}) {
    const res = await (
        await fetch(url, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        })
    ).json()
    if (!isApiOk(res)) {
        if (Number(res.code) === 403 || Number(res.code) === 401) {
            isAdminLoggedIn = false
            syncLogoutBtn()
        }
        throw new Error(res.message || '请求失败')
    }
    return res.data
}

async function openManagePanel() {
    const ok = await checkAdminAuth()
    if (!ok) {
        pendingOpenManage = true
        openLoginPanel()
        return
    }
    await doOpenManagePanel()
}

async function doOpenManagePanel() {
    document.getElementById('manageOverlay').classList.add('open')
    document.getElementById('managePanel').classList.add('open')
    closeManageForm()
    await loadManageList()
}

function closeManagePanel() {
    document.getElementById('manageOverlay').classList.remove('open')
    document.getElementById('managePanel').classList.remove('open')
    closeManageForm()
}

async function loadManageList() {
    try {
        manageListData = await fetchGenealogyList()
        renderManageTable()
        fillParentSelect()
    }
    catch (err) {
        alert(err.message || '加载列表失败')
    }
}

function renderManageTable() {
    const keyword = (document.getElementById('manageFilter').value || '').trim().toLowerCase()
    const tbody = document.getElementById('manageTableBody')
    const rows = manageListData.filter((item) => {
        if (!keyword)
            return true
        return item.name.toLowerCase().includes(keyword) || String(item.id).includes(keyword)
    })
    tbody.innerHTML = rows
        .map(
            item => `
            <tr>
                <td>${item.id}</td>
                <td>${escapeHtml(item.name)}</td>
                <td>${item.parent}</td>
                <td>${item.sex ?? '-'}</td>
                <td class="desc-cell" title="${escapeHtml(item.desc || '')}">${escapeHtml(item.desc || '-')}</td>
                <td class="manage-actions">
                    <button type="button" onclick="openManageForm('edit', ${item.id})">编辑</button>
                    <button type="button" class="btn-del" onclick="deleteManageRecord(${item.id})">删除</button>
                </td>
            </tr>
        `,
        )
        .join('')
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function fillParentSelect(excludeId) {
    const select = document.getElementById('formParent')
    const current = select.value
    let html = '<option value="0">0 - 始祖（无父辈）</option>'
    manageListData.forEach((item) => {
        if (excludeId !== undefined && item.id === excludeId)
            return
        html += `<option value="${item.id}">${item.id} - ${escapeHtml(item.name)}</option>`
    })
    select.innerHTML = html
    if (current)
        select.value = current
}

function openManageForm(mode, id) {
    manageFormMode = mode
    const form = document.getElementById('manageForm')
    form.style.display = 'block'
    document.getElementById('manageFormTitle').innerText = mode === 'create' ? '新增成员' : '编辑成员'

    if (mode === 'create') {
        document.getElementById('formId').value = ''
        document.getElementById('formName').value = ''
        document.getElementById('formSex').value = ''
        document.getElementById('formDesc').value = ''
        fillParentSelect()
        document.getElementById('formParent').value = '0'
    }
    else {
        const item = manageListData.find(r => r.id === id)
        if (!item)
            return
        document.getElementById('formId').value = item.id
        document.getElementById('formName').value = item.name
        document.getElementById('formSex').value = item.sex || ''
        document.getElementById('formDesc').value = item.desc || ''
        fillParentSelect(item.id)
        document.getElementById('formParent').value = String(item.parent)
    }
}

function closeManageForm() {
    document.getElementById('manageForm').style.display = 'none'
}

async function saveManageForm() {
    const name = document.getElementById('formName').value.trim()
    if (!name) {
        alert('请输入姓名')
        return
    }

    const parent = Number.parseInt(document.getElementById('formParent').value, 10)
    const sexVal = document.getElementById('formSex').value.trim()
    const descVal = document.getElementById('formDesc').value.trim()
    const payload = {
        name,
        parent,
        sex: sexVal || null,
        desc: descVal || null,
    }

    try {
        if (manageFormMode === 'create') {
            await apiRequest(`${API_BASE}/`, {
                method: 'POST',
                body: JSON.stringify(payload),
            })
        }
        else {
            const id = document.getElementById('formId').value
            await apiRequest(`${API_BASE}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            })
        }
        closeManageForm()
        await loadManageList()
        await refreshTree()
    }
    catch (err) {
        alert(err.message || '保存失败')
    }
}

async function deleteManageRecord(id) {
    const item = manageListData.find(r => r.id === id)
    const name = item ? item.name : String(id)
    if (!confirm(`确定删除「${name}」（ID: ${id}）？\n若存在子辈将无法删除。`))
        return
    try {
        await apiRequest(`${API_BASE}/${id}`, { method: 'DELETE' })
        await loadManageList()
        await refreshTree()
    }
    catch (err) {
        alert(err.message || '删除失败')
    }
}
