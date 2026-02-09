import type { ActionFunctionArgs } from "react-router";
import { createTagRemovedTriggers } from "../services/flow-automation.server.js";

function resolveSharedSecret(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-flow-shared-secret")?.trim();
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const expectedSecret = process.env.FLOW_SHARED_SECRET;
    const incomingSecret = resolveSharedSecret(request);

    if (expectedSecret && incomingSecret !== expectedSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const triggers = createTagRemovedTriggers({
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      beforeTags: body.beforeTags,
      afterTags: body.afterTags,
      occurredAt: body.occurredAt,
    });

    return Response.json({ ok: true, count: triggers.length, triggers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
};
