import test from "node:test";
import assert from "node:assert/strict";

import {
  createOrderLineItemUpdatedTrigger,
  createTagRemovedTriggers,
  createInventoryAlertPayload,
  sendInventoryAlert,
  mapFlowInventoryActionPayload,
  sendFlowTriggerReceive,
} from "./flow-automation.server.js";

test("创建订单行项目更新触发器", () => {
  const trigger = createOrderLineItemUpdatedTrigger({
    orderId: "gid://shopify/Order/1001",
    lineItemId: "gid://shopify/LineItem/2001",
    changedFields: ["quantity"],
    updatedAt: "2026-02-09T00:00:00Z",
  });

  assert.equal(trigger.triggerType, "order_line_item_updated");
  assert.equal(trigger.data.orderId, "gid://shopify/Order/1001");
  assert.deepEqual(trigger.data.changedFields, ["quantity"]);
});

test("从标签差异中生成移除触发器", () => {
  const triggers = createTagRemovedTriggers({
    resourceType: "product",
    resourceId: "gid://shopify/Product/3001",
    beforeTags: ["vip", "inventory-risk", "wholesale"],
    afterTags: ["vip", "wholesale"],
    occurredAt: "2026-02-09T00:00:00Z",
  });

  assert.equal(triggers.length, 1);
  assert.equal(triggers[0].triggerType, "resource_tag_removed");
  assert.equal(triggers[0].data.removedTag, "inventory-risk");
});

test("生成飞书库存预警消息体", () => {
  const payload = createInventoryAlertPayload({
    channel: "feishu",
    sku: "SKU-001",
    available: 2,
    threshold: 5,
    locationName: "Main Warehouse",
  });

  assert.equal(payload.msg_type, "text");
  assert.match(payload.content.text, /SKU-001/);
});

test("发送钉钉库存预警", async () => {
  let capturedRequest;

  const fakeFetch = async (url, init) => {
    capturedRequest = { url, init };
    return {
      ok: true,
      status: 200,
      async json() {
        return { errcode: 0, errmsg: "ok" };
      },
    };
  };

  const result = await sendInventoryAlert({
    channel: "dingtalk",
    webhookUrl: "https://example.com/ding",
    sku: "SKU-002",
    available: 1,
    threshold: 10,
    fetchImpl: fakeFetch,
  });

  assert.equal(result.status, 200);
  assert.equal(capturedRequest.url, "https://example.com/ding");
  assert.equal(capturedRequest.init.method, "POST");
  assert.match(capturedRequest.init.body, /SKU-002/);
});

test("映射 Flow action payload 为库存预警参数", () => {
  const mapped = mapFlowInventoryActionPayload({
    properties: {
      channel: "feishu",
      webhook_url: "https://open.feishu.cn/open-apis/bot/v2/hook/abc",
      sku: "SKU-009",
      available: "3",
      threshold: "8",
      location_name: "CN-WH-1",
    },
  });

  assert.equal(mapped.channel, "feishu");
  assert.equal(mapped.webhookUrl, "https://open.feishu.cn/open-apis/bot/v2/hook/abc");
  assert.equal(mapped.sku, "SKU-009");
  assert.equal(mapped.available, 3);
  assert.equal(mapped.threshold, 8);
  assert.equal(mapped.locationName, "CN-WH-1");
});

test("调用 flowTriggerReceive 上报触发器事件", async () => {
  let capturedQuery;
  let capturedVariables;

  const fakeAdmin = {
    async graphql(query, options) {
      capturedQuery = query;
      capturedVariables = options.variables;
      return {
        async json() {
          return {
            data: {
              flowTriggerReceive: {
                userErrors: [],
              },
            },
          };
        },
      };
    },
  };

  await sendFlowTriggerReceive({
    admin: fakeAdmin,
    handle: "order-line-item-updated",
    payload: {
      order_id: "12345",
      "Changed fields": "quantity,price",
    },
  });

  assert.match(capturedQuery, /flowTriggerReceive/);
  assert.equal(capturedVariables.handle, "order-line-item-updated");
  assert.equal(capturedVariables.payload.order_id, "12345");
});
