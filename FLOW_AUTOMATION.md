# Shopify Flow 自动化接入说明

已接入能力：

- Trigger：订单行项目更新（来自 `orders/updated` webhook）
- Trigger：标签被移除（通过内部 API 计算前后标签差异）
- Action：库存预警推送到飞书 / 钉钉

## Route A（商家试用）当前状态

已完成：

- Flow Action 扩展清单骨架：`extensions/flow-action-inventory-alert/shopify.extension.toml`
- Flow Trigger 扩展清单骨架：`extensions/flow-trigger-order-line-item-updated/shopify.extension.toml`
- Flow Action 运行路由已切换到 `authenticate.flow(request)` 验签
- `orders/updated` webhook 已接 `flowTriggerReceive`
- GDPR 合规 webhook 路由与配置已补齐（`customers/data_request`、`customers/redact`、`shop/redact`）

仍需你在部署前确认：

1. 将 `shopify.app.toml` 中域名占位符替换为真实线上域名。
2. 将 Action 扩展中的 `runtime_url` 改为真实线上地址。
3. `shopify app deploy` 后在 Partner Dashboard 配置 limited visibility 并提审。

## 新增文件

- `app/services/flow-automation.server.js`
- `app/services/flow-automation.server.test.js`
- `app/routes/webhooks.orders.updated.tsx`
- `app/routes/api.flow.tag-removed.tsx`
- `app/routes/api.flow.inventory-alert.tsx`
- `shopify.app.toml`（新增 `orders/updated` 订阅）

## 环境变量

在你的本地 `.env` 或部署平台中新增：

```bash
# 仅用于内部 API /api/flow/tag-removed 的共享密钥（可选但建议）
FLOW_SHARED_SECRET=replace-with-strong-secret
```

## 路由能力

### 1) Shopify webhook: 订单更新

- 路径：`POST /webhooks/orders/updated`
- 行为：
  - 验签并解析 webhook
  - 为每个 line item 生成 `order_line_item_updated` 触发器载荷
  - 调用 Admin GraphQL `flowTriggerReceive` 上报到 Flow Trigger 扩展

### 2) 内部 API: 标签移除触发器

- 路径：`POST /api/flow/tag-removed`
- 鉴权：
  - `Authorization: Bearer <FLOW_SHARED_SECRET>`
  - 或 `x-flow-shared-secret: <FLOW_SHARED_SECRET>`
- 入参示例：

```json
{
  "resourceType": "product",
  "resourceId": "gid://shopify/Product/123",
  "beforeTags": ["vip", "inventory-risk"],
  "afterTags": ["vip"],
  "occurredAt": "2026-02-09T00:00:00Z"
}
```

### 3) 内部 API: 发送库存预警动作

- 路径：`POST /api/flow/inventory-alert`
- 鉴权：由 Shopify Flow 使用请求签名，服务端通过 `authenticate.flow(request)` 验签
- 入参示例（飞书）：

```json
{
  "channel": "feishu",
  "webhookUrl": "https://open.feishu.cn/open-apis/bot/v2/hook/xxxx",
  "sku": "SKU-001",
  "available": 2,
  "threshold": 5,
  "locationName": "Main Warehouse"
}
```

- 入参示例（钉钉）：

```json
{
  "channel": "dingtalk",
  "webhookUrl": "https://oapi.dingtalk.com/robot/send?access_token=xxxx",
  "sku": "SKU-002",
  "available": 1,
  "threshold": 10
}
```

## 快速验证

```bash
# 1) 服务层测试
node --test app/services/flow-automation.server.test.js

# 2) 类型检查
npm run typecheck
```

## 下一步（建议）

1. 把占位 URL 替换成真实域名。
2. 执行 `shopify app deploy` 同步 app + extensions + webhook。
3. 在测试店安装后，创建 Flow 模板验证 Trigger/Action 的端到端链路。
4. 准备 listing、隐私政策、支持邮箱并发起 limited visibility 审核。
