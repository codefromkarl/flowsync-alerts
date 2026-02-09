import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  createOrderLineItemUpdatedTrigger,
  sendFlowTriggerReceive,
} from "../services/flow-automation.server.js";

type OrderLineItemTrigger = {
  triggerType: "order_line_item_updated";
  occurredAt: string;
  data: {
    orderId: string;
    lineItemId: string;
    changedFields: string[];
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, shop, admin, session } = await authenticate.webhook(request);

  if (!session || !admin) {
    return new Response();
  }

  const orderPayload = payload as {
    id?: number;
    admin_graphql_api_id?: string;
    updated_at?: string;
    line_items?: Array<{
      id?: number;
      admin_graphql_api_id?: string;
      quantity?: number;
      price?: string;
    }>;
  };

  const orderId = orderPayload.admin_graphql_api_id || (orderPayload.id ? `gid://shopify/Order/${orderPayload.id}` : undefined);

  const triggers = (orderPayload.line_items || [])
    .map((lineItem) => {
      const lineItemId =
        lineItem.admin_graphql_api_id ||
        (lineItem.id ? `gid://shopify/LineItem/${lineItem.id}` : undefined);

      if (!orderId || !lineItemId) {
        return undefined;
      }

      return createOrderLineItemUpdatedTrigger({
        orderId,
        lineItemId,
        changedFields: ["quantity", "price"],
        updatedAt: orderPayload.updated_at,
      });
    })
    .filter((trigger): trigger is OrderLineItemTrigger => Boolean(trigger));

  for (const trigger of triggers) {
    await sendFlowTriggerReceive({
      admin,
      handle: "order-line-item-updated",
      payload: {
        order_id: trigger.data.orderId,
        line_item_id: trigger.data.lineItemId,
        changed_fields: trigger.data.changedFields.join(","),
        occurred_at: trigger.occurredAt,
        shop,
      },
    });
  }

  return new Response();
};
