# FlowSync Alerts — Deployment & Submission Checklist

## Phase 1: Railway Deployment

### 1.1 Create Railway Project

1. 登录 https://railway.com （支持 GitHub 登录，无需信用卡即可使用 Trial/Hobby 计划）
2. New Project → Deploy from GitHub repo（或 Deploy from local via Railway CLI）
3. Railway 会自动检测 `Dockerfile` 并构建

### 1.2 Railway CLI 方式（可选）

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project (in project root)
cd flowsync-alerts
railway init

# Link to project
railway link

# Deploy
railway up
```

### 1.3 配置环境变量

在 Railway Dashboard → Variables 中设置：

```
NODE_ENV=production
PORT=3000
DATABASE_URL=file:./prisma/database.sqlite
SHOPIFY_API_KEY=<your-api-key>
SHOPIFY_API_SECRET=<your-api-secret>
FLOW_SHARED_SECRET=<generate-a-strong-secret>
```

### 1.4 获取生产域名

Railway 自动分配域名：`flowsync-alerts-production.up.railway.app`

也可以在 Settings → Networking → Custom Domain 绑定自有域名。

### 1.5 验证部署

```bash
curl -I https://<your-railway-domain>
```

---

## Phase 2: Replace Domain Placeholders

拿到 Railway 域名后，替换所有 `{{PRODUCTION_DOMAIN}}` 占位符：

```bash
# Quick replace (run from project root)
DOMAIN="your-app.up.railway.app"

sed -i "s/{{PRODUCTION_DOMAIN}}/$DOMAIN/g" shopify.app.toml
sed -i "s/{{PRODUCTION_DOMAIN}}/$DOMAIN/g" extensions/flow-action-inventory-alert/shopify.extension.toml
sed -i "s/{{PRODUCTION_DOMAIN}}/$DOMAIN/g" APP_STORE_LISTING.md
```

Verify:
- [ ] `shopify.app.toml` → `application_url` and `redirect_urls`
- [ ] `extensions/flow-action-inventory-alert/shopify.extension.toml` → `runtime_url`
- [ ] `APP_STORE_LISTING.md` → Privacy Policy URL

---

## Phase 3: Shopify App Deploy

```bash
shopify app deploy
```

This syncs:
- App configuration (scopes, webhooks, URLs)
- Flow Trigger extension definition
- Flow Action extension definition

---

## Phase 4: Partner Dashboard Configuration

Go to https://partners.shopify.com → Apps → flowsync-alerts → App listing

### Required Fields

- [ ] **App name**: FlowSync Alerts
- [ ] **App icon**: 1200x1200px (see APP_STORE_LISTING.md for design spec)
- [ ] **Short description**: Real-time order & inventory alerts for Lark (Feishu) and DingTalk via Shopify Flow.
- [ ] **Detailed description**: Copy from APP_STORE_LISTING.md
- [ ] **App URL**: `https://<your-railway-domain>`
- [ ] **Privacy policy URL**: `https://<your-railway-domain>/privacy`
- [ ] **Support email**: support@codefromkarl.xyz
- [ ] **Pricing**: Free
- [ ] **App category**: Workflow automation / Notifications
- [ ] **Screenshots**: At least 3 (see APP_STORE_LISTING.md for specs)

### Scope Justification (reviewer will ask)

- `read_orders` → "Receive orders/updated webhooks to detect line item changes for Flow triggers"
- `write_orders` → "Required by Shopify webhook authentication for order topics"
- `read_products` → "Read product tags for tag-removal trigger and inventory data for alerts"
- `write_products` → "Update product tags when Flow actions modify tag-based workflow states"

---

## Phase 5: End-to-End Testing

### Test 1: App Installation
- [ ] Install app on `karl-ai-store.myshopify.com`
- [ ] OAuth flow completes successfully
- [ ] App loads in Shopify Admin (embedded)

### Test 2: Flow Trigger — Order Line Item Updated
- [ ] Create a Flow using "Order Line Item Updated" trigger
- [ ] Modify an order in the store
- [ ] Verify Flow triggers correctly

### Test 3: Flow Action — Inventory Alert
- [ ] Create a Flow using "Inventory Alert Action"
- [ ] Configure with a test Feishu/DingTalk webhook URL
- [ ] Trigger the flow and verify message arrives

### Test 4: GDPR Webhooks
- [ ] Verify `/webhooks/customers/data_request` responds 200
- [ ] Verify `/webhooks/customers/redact` responds 200
- [ ] Verify `/webhooks/shop/redact` responds 200

### Test 5: App Uninstall
- [ ] Uninstall app from dev store
- [ ] Verify session data is cleaned up
- [ ] Reinstall and verify clean state

---

## Phase 6: Submit for Review

```bash
# Final deploy to ensure everything is synced
shopify app deploy
```

Then in Partner Dashboard:
1. Go to "Distribution" → Select "Public"
2. Fill all listing fields
3. Click "Submit for review"

**Expected review timeline**: 3-7 business days for free apps.

---

## Post-Submission Monitoring

- [ ] Monitor Railway logs (Dashboard → Deployments → Logs)
- [ ] Monitor Partner Dashboard for reviewer feedback
- [ ] Respond to reviewer questions within 48 hours

---

## Railway vs Fly.io Notes

| Feature | Railway | Fly.io |
|---------|---------|--------|
| Payment | Supports Alipay/WeChat (via credit) | Requires foreign credit card |
| SQLite | Ephemeral disk (OK for session-only data) | Persistent volumes |
| Auto-deploy | GitHub integration | CLI-based |
| Free tier | $5 trial credit, Hobby $5/mo | $0 free allowance |
| Custom domain | Included | Included |

> **Note on SQLite**: Railway's disk is ephemeral — data may be lost on redeploy. Since this app only stores Shopify session tokens (which are re-created on OAuth), this is acceptable. If you need persistent data later, upgrade to Railway's PostgreSQL add-on.
