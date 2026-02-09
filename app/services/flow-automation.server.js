/**
 * @typedef {Object} OrderLineItemUpdatedInput
 * @property {string} orderId
 * @property {string} lineItemId
 * @property {string[]} [changedFields]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} TagRemovedInput
 * @property {string} resourceType
 * @property {string} resourceId
 * @property {string[]|string} [beforeTags]
 * @property {string[]|string} [afterTags]
 * @property {string} [occurredAt]
 */

/**
 * @typedef {Object} InventoryAlertInput
 * @property {"feishu"|"dingtalk"} channel
 * @property {string} sku
 * @property {number} available
 * @property {number} threshold
 * @property {string} [locationName]
 */

function assertRequired(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`缺少必填字段: ${fieldName}`);
  }
}

/**
 * @param {string[]|string|undefined} tags
 * @returns {string[]}
 */
function normalizeTags(tags) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * @param {OrderLineItemUpdatedInput} input
 */
export function createOrderLineItemUpdatedTrigger({
  orderId,
  lineItemId,
  changedFields = [],
  updatedAt = new Date().toISOString(),
}) {
  assertRequired(orderId, "orderId");
  assertRequired(lineItemId, "lineItemId");

  return {
    triggerType: "order_line_item_updated",
    occurredAt: updatedAt,
    data: {
      orderId,
      lineItemId,
      changedFields,
    },
  };
}

/**
 * @param {TagRemovedInput} input
 */
export function createTagRemovedTriggers({
  resourceType,
  resourceId,
  beforeTags,
  afterTags,
  occurredAt = new Date().toISOString(),
}) {
  assertRequired(resourceType, "resourceType");
  assertRequired(resourceId, "resourceId");

  const previousTagSet = new Set(normalizeTags(beforeTags));
  const currentTagSet = new Set(normalizeTags(afterTags));

  const removedTags = Array.from(previousTagSet).filter(
    (tag) => !currentTagSet.has(tag),
  );

  return removedTags.map((removedTag) => ({
    triggerType: "resource_tag_removed",
    occurredAt,
    data: {
      resourceType,
      resourceId,
      removedTag,
    },
  }));
}

/**
 * @param {InventoryAlertInput} input
 */
function formatInventoryAlertMessage({
  sku,
  available,
  threshold,
  locationName = "Default Location",
}) {
  return [
    "【库存预警】",
    `SKU: ${sku}`,
    `可用库存: ${available}`,
    `预警阈值: ${threshold}`,
    `仓库: ${locationName}`,
  ].join("\n");
}

/**
 * @param {InventoryAlertInput} input
 */
export function createInventoryAlertPayload({
  channel,
  sku,
  available,
  threshold,
  locationName,
}) {
  assertRequired(channel, "channel");
  assertRequired(sku, "sku");
  assertRequired(available, "available");
  assertRequired(threshold, "threshold");

  const message = formatInventoryAlertMessage({
    channel,
    sku,
    available,
    threshold,
    locationName,
  });

  if (channel === "feishu") {
    return {
      msg_type: "text",
      content: {
        text: message,
      },
    };
  }

  if (channel === "dingtalk") {
    return {
      msgtype: "text",
      text: {
        content: message,
      },
    };
  }

  throw new Error(`不支持的渠道: ${channel}`);
}

/**
 * @param {InventoryAlertInput & { webhookUrl: string, fetchImpl?: typeof fetch }} input
 */
export async function sendInventoryAlert({
  channel,
  webhookUrl,
  sku,
  available,
  threshold,
  locationName,
  fetchImpl = fetch,
}) {
  assertRequired(webhookUrl, "webhookUrl");

  const payload = createInventoryAlertPayload({
    channel,
    sku,
    available,
    threshold,
    locationName,
  });

  const response = await fetchImpl(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`库存预警发送失败: HTTP ${response.status}`);
  }

  return {
    status: response.status,
    data: await response.json(),
  };
}

/**
 * @param {{ properties?: Record<string, unknown> }} flowPayload
 * @returns {{
 *   channel: "feishu" | "dingtalk";
 *   webhookUrl: string;
 *   sku: string;
 *   available: number;
 *   threshold: number;
 *   locationName: string | undefined;
 * }}
 */
export function mapFlowInventoryActionPayload(flowPayload) {
  const properties = flowPayload?.properties || {};

  const channel = String(properties.channel || "").trim();
  const webhookUrl = String(properties["webhook url"] ?? properties.webhook_url ?? "").trim();
  const sku = String(properties.sku || "").trim();
  const available = Number(properties.available);
  const threshold = Number(properties.threshold);
  const locationRaw = properties["location name"] ?? properties.location_name;
  const locationName = locationRaw === undefined ? undefined : String(locationRaw);

  if (!Number.isFinite(available)) {
    throw new Error("Flow payload 字段 available 非法");
  }

  if (!Number.isFinite(threshold)) {
    throw new Error("Flow payload 字段 threshold 非法");
  }

  if (channel !== "feishu" && channel !== "dingtalk") {
    throw new Error("Flow payload 字段 channel 非法");
  }

  return {
    channel,
    webhookUrl,
    sku,
    available,
    threshold,
    locationName,
  };
}

/**
 * @param {{ admin: { graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<{ json: () => Promise<any> }> }, handle: string, payload: Record<string, string> }} input
 */
export async function sendFlowTriggerReceive({ admin, handle, payload }) {
  assertRequired(admin, "admin");
  assertRequired(handle, "handle");
  assertRequired(payload, "payload");

  const response = await admin.graphql(
    `#graphql
      mutation FlowTriggerReceive($handle: String!, $payload: JSON!) {
        flowTriggerReceive(handle: $handle, payload: $payload) {
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        handle,
        payload,
      },
    },
  );

  const result = await response.json();
  const userErrors = result?.data?.flowTriggerReceive?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(`flowTriggerReceive 失败: ${userErrors[0].message}`);
  }

  return result;
}
