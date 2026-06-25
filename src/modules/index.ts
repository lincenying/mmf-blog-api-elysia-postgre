/**
 * 业务以 Elysia 插件形式导出，供 `app.ts` 统一 `.use()` 挂载。
 */
export { adminRouter } from './admin/admin.controller'
export { backendRouter } from './backend/backend.controller'
export { frontendRouter } from './frontend/frontend.controller'
export { jwtRouter } from './jwt/jwt.controller'
export { proxyRouter } from './proxy/proxy.controller'
export { uploadRouter } from './upload/upload.controller'
export { wsRouter } from './ws/ws.controller'
