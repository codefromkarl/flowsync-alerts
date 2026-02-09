import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  mapFlowInventoryActionPayload,
  sendInventoryAlert,
} from "../services/flow-automation.server.js";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { payload } = await authenticate.flow(request);
    const body = mapFlowInventoryActionPayload(payload);

    const result = await sendInventoryAlert({
      channel: body.channel,
      webhookUrl: body.webhookUrl,
      sku: body.sku,
      available: body.available,
      threshold: body.threshold,
      locationName: body.locationName,
    });

    return Response.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
};
