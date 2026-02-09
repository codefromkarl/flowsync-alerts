# FlowSync Alerts — 开发测试指南

## 前置条件

### 1. 创建开发商店 (Development Store)

开发商店完全免费，包含大部分 Shopify Plus 高级功能。

1. 登录 [Partner Dashboard](https://partners.shopify.com)
2. Stores → Add store → **Create development store**
3. 勾选 **"Build a store to test and build apps"**
4. Shopify 会自动填充假产品和假订单

> 当前配置的开发商店：`karl-ai-store.myshopify.com`（见 `shopify.app.toml`）

### 2. 配置模拟支付 (Bogus Gateway)

不需要绑定银行卡，Shopify 提供官方模拟支付网关。

1. 开发商店后台 → Settings → Payments
2. 选择 **"Bogus Gateway"** 并激活
3. 测试时使用：
   - 卡号输入 `1` → 模拟支付**成功**
   - 卡号输入 `2` → 模拟支付**失败**
   - 卡号输入 `3` → 模拟网关**异常**

---

## 本地开发测试

### Step 1: 启动本地开发服务器

```bash
cd flowsync-alerts
npm run dev
```

Shopify CLI 会：
- 启动本地服务器（端口 3000）
- 创建 Cloudflare 隧道暴露到公网
- 输出安装链接

### Step 2: 安装 App 到开发商店

点击终端输出的安装链接，选择开发商店进行安装。

### Step 3: 配置 Shopify Flow 工作流

1. 开发商店后台 → 搜索 **"Shopify Flow"** → 打开
2. Create workflow

#### 测试场景 A：订单行项目更新触发器

```
Trigger: "Order Line Item Updated" (你的扩展)
  ↓
Action: 发送邮件 / 记录日志（先用内置 Action 验证触发器工作）
```

#### 测试场景 B：库存预警 Action

```
Trigger: "Order created" (Shopify 内置)
  ↓
Action: "Inventory Alert Action" (你的扩展)
  - channel: feishu
  - webhook_url: <你的飞书测试群 Webhook>
  - sku: TEST-SKU-001
  - available: 3
  - threshold: 5
  - location_name: 测试仓库
```

### Step 4: 触发测试

1. 去开发商店前台，用 Bogus Gateway 下一单
2. 在后台修改订单（改数量/价格）→ 触发 Order Line Item Updated
3. 观察：
   - 终端日志是否有 webhook 接收记录
   - 飞书/钉钉群是否收到预警消息
   - Shopify Flow 运行历史是否显示成功

---

## 单元测试

```bash
# 服务层测试（6 个用例）
node --test app/services/flow-automation.server.test.js

# 类型检查
npm run typecheck

# 代码规范
npm run lint

# 构建验证
npm run build
```

---

## 端到端测试 Checklist

### App 安装与卸载
- [ ] 安装到开发商店，OAuth 流程正常
- [ ] App 在 Shopify Admin 中正常加载（嵌入式）
- [ ] 卸载 App，session 数据被清理
- [ ] 重新安装，状态干净

### Flow Trigger 测试
- [ ] "Order Line Item Updated" 出现在 Flow 触发器列表
- [ ] 修改订单后触发器正常触发
- [ ] Flow 运行历史显示成功

### Flow Action 测试
- [ ] "Inventory Alert Action" 出现在 Flow 动作列表
- [ ] 配置飞书 Webhook → 收到格式正确的预警消息
- [ ] 配置钉钉 Webhook → 收到格式正确的预警消息
- [ ] 错误的 Webhook URL → 返回错误而不是崩溃

### GDPR Webhook 测试
- [ ] `POST /webhooks/customers/data_request` → 200
- [ ] `POST /webhooks/customers/redact` → 200
- [ ] `POST /webhooks/shop/redact` → 200

---

## 审核员会做什么？

Shopify 审核员在审核时会：

1. **安装你的 App** 到他们的测试商店
2. **模拟下单** 并触发 Flow
3. **检查 App 是否报错**
4. **验证 GDPR webhook** 是否正常响应
5. **检查隐私政策** 页面是否可访问

如果安装报错或 Flow 不触发，会直接拒绝并附上报错截图。

**自测是上架的前提 — 只有在开发商店跑通全流程，提审才不是碰运气。**

---

## 常见问题

### Q: `shopify app dev` 报错 "No store found"
A: 确认 `shopify.app.toml` 中 `dev_store_url` 指向你的开发商店。

### Q: Flow 中看不到我的触发器/动作
A: 运行 `shopify app deploy` 将扩展定义推送到 Shopify，然后在 Flow 中刷新。

### Q: Webhook 没有触发
A: 检查 `shopify app dev` 终端输出，确认隧道 URL 正常。Shopify 需要能访问到你的本地服务器。

### Q: 飞书/钉钉没收到消息
A: 先用 curl 直接测试 Webhook URL 是否可用：
```bash
curl -X POST <your-webhook-url> \
  -H "Content-Type: application/json" \
  -d '{"msg_type":"text","content":{"text":"test"}}'
```
