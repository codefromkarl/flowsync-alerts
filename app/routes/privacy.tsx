import type { LoaderFunctionArgs } from "react-router";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const loader = async (_args: LoaderFunctionArgs) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy - FlowSync Alerts</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 720px; margin: 0 auto; padding: 2rem 1rem; color: #333; line-height: 1.6; }
    h1 { font-size: 1.5rem; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.5rem; }
    h2 { font-size: 1.15rem; margin-top: 1.5rem; }
    p, li { font-size: 0.95rem; }
    .updated { color: #666; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: February 9, 2026</p>

  <h2>1. Introduction</h2>
  <p>FlowSync Alerts ("we", "our", "the App") is a Shopify application that provides automated order notifications and inventory alerts via Feishu (Lark) and DingTalk. This Privacy Policy explains how we collect, use, and protect your information.</p>

  <h2>2. Information We Collect</h2>
  <p>When you install and use the App, we access the following Shopify data through authorized API scopes:</p>
  <ul>
    <li><strong>Order data</strong> (read_orders, write_orders): To detect order line item changes and trigger Flow automations.</li>
    <li><strong>Product data</strong> (read_products, write_products): To monitor product tags and inventory levels for alert triggers.</li>
    <li><strong>Shop information</strong>: Your store name and domain for authentication and session management.</li>
  </ul>
  <p>We do <strong>not</strong> collect personal customer data (names, emails, addresses) beyond what Shopify provides in webhook payloads for order processing.</p>

  <h2>3. How We Use Your Information</h2>
  <ul>
    <li>Process order update webhooks to trigger Shopify Flow automations.</li>
    <li>Send inventory alert messages to your configured Feishu or DingTalk webhook endpoints.</li>
    <li>Maintain your app session for authentication purposes.</li>
  </ul>

  <h2>4. Data Storage</h2>
  <p>We store only your Shopify session tokens required for API authentication. Session data is stored in an encrypted database. We do <strong>not</strong> store order details, customer information, or product data beyond the duration of a single webhook request.</p>

  <h2>5. Third-Party Services</h2>
  <p>Alert messages are sent to webhook URLs that <strong>you</strong> configure. We send data to:</p>
  <ul>
    <li><strong>Feishu (Lark)</strong> — only if you configure a Feishu webhook URL.</li>
    <li><strong>DingTalk</strong> — only if you configure a DingTalk webhook URL.</li>
  </ul>
  <p>We do not share your data with any other third parties.</p>

  <h2>6. Data Retention and Deletion</h2>
  <p>When you uninstall the App, all session data is automatically deleted. No residual data is retained on our servers.</p>

  <h2>7. GDPR Compliance</h2>
  <p>We comply with GDPR requirements. We support:</p>
  <ul>
    <li>Customer data access requests</li>
    <li>Customer data erasure requests</li>
    <li>Shop data erasure requests</li>
  </ul>

  <h2>8. Contact</h2>
  <p>For privacy-related inquiries, contact us at: <a href="mailto:support@codefromkarl.xyz">support@codefromkarl.xyz</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
