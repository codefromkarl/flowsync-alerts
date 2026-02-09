# FlowSync Alerts — App Store Listing Materials

## App Name
FlowSync Alerts

## Tagline (one-liner)
Sync Shopify Flow alerts to Lark & DingTalk instantly.

## App Icon
- Size: 1200 x 1200 px, PNG or JPG
- Style: Deep blue background (#1A56DB), white "notification bell + connection" icon, no text
- Tool: Canva (search template "app icon notification")

---

## Short Description (80 chars max)
Real-time order & inventory alerts for Lark (Feishu) and DingTalk via Shopify Flow.

## Detailed Description

### English

FlowSync Alerts bridges Shopify Flow with your team's daily communication tools — Lark (Feishu) and DingTalk.

**Why FlowSync Alerts?**

Most Shopify notification apps only support email or Slack. If your operations team lives in Lark or DingTalk, you're stuck with manual monitoring or building custom integrations. FlowSync Alerts solves this in minutes, not weeks.

**Key Features:**

🔔 **Order Line Item Tracking**
Get notified when order items change — quantity adjustments, price modifications, or fulfillment updates. Perfect for fraud prevention and operations auditing.

🏷️ **Smart Tag Monitoring**
Trigger automations when product or order tags are removed. Use tags as workflow switches — when QC completes (tag removed), automatically notify your warehouse team.

📦 **Inventory Alerts**
Set custom thresholds per SKU. When stock drops below your limit, FlowSync sends a formatted alert to your Lark or DingTalk group with SKU, current stock, threshold, and warehouse location.

⚡ **Native Shopify Flow Integration**
Works directly inside Shopify Flow — no external services, no API keys to manage. Set up triggers and actions using Flow's visual builder.

**How It Works:**
1. Install the app
2. Open Shopify Flow
3. Create a workflow using FlowSync triggers and actions
4. Configure your Lark/DingTalk webhook URL
5. Done — alerts flow automatically

**Perfect For:**
- Cross-border e-commerce teams using Lark/DingTalk
- Operations managers who need real-time order audit trails
- Warehouse teams requiring instant low-stock notifications
- Any Shopify merchant with a Chinese operations team

**Pricing:** Free

---

### Chinese (中文)

FlowSync Alerts 将 Shopify Flow 与飞书和钉钉无缝连接。

**核心功能：**
- 📦 订单行项目变更实时通知
- 🏷️ 标签移除自动触发工作流
- 📊 库存预警推送到飞书/钉钉群
- ⚡ 原生 Shopify Flow 集成，无需额外配置

---

## OAuth Scope Justification (for reviewer questions)

| Scope | Justification |
|-------|---------------|
| `read_orders` | Required to receive `orders/updated` webhooks and extract line item data for Flow triggers. |
| `write_orders` | Required by Shopify's webhook authentication for order-related topics. The app does not modify orders. |
| `read_products` | Required to read product tags for the tag-removal trigger and inventory data for alerts. |
| `write_products` | Required to update product tags programmatically when Flow actions modify tag-based workflow states. |

---

## Support Information

- **Support Email:** support@codefromkarl.xyz
- **Privacy Policy URL:** https://{{PRODUCTION_DOMAIN}}/privacy
- **App Website:** https://{{PRODUCTION_DOMAIN}}

---

## Screenshots Needed (Partner Dashboard)

1. **Flow Builder** — Show a workflow using the "Order Line Item Updated" trigger
2. **DingTalk Alert** — Screenshot of an inventory alert message in DingTalk
3. **Feishu Alert** — Screenshot of an inventory alert message in Feishu/Lark
4. **App Dashboard** — The embedded app page inside Shopify Admin

Recommended size: 1600 x 900 px or 1280 x 720 px
