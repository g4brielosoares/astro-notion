import type { APIRoute } from "astro";
import crypto from "node:crypto";

export const prerender = false;

const NOTION_WEBHOOK_VERIFICATION_TOKEN =
  import.meta.env.NOTION_WEBHOOK_VERIFICATION_TOKEN || "";
const VERCEL_DEPLOY_HOOK_URL =
  import.meta.env.VERCEL_DEPLOY_HOOK_URL || "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function verifyNotionSignature(rawBody: string, incomingSignature: string | null) {
  if (!incomingSignature || !NOTION_WEBHOOK_VERIFICATION_TOKEN) return false;

  const expected = `sha256=${crypto
    .createHmac("sha256", NOTION_WEBHOOK_VERIFICATION_TOKEN)
    .update(rawBody)
    .digest("hex")}`;

  const a = Buffer.from(expected);
  const b = Buffer.from(incomingSignature);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function shouldTrigger(eventType: string) {
  return [
    "page.created",
    "page.content_updated",
    "page.properties_updated",
    "page.undeleted",
    "page.moved"
  ].includes(eventType);
}

export const GET: APIRoute = async () => {
  return json({ ok: true, route: "notion-webhook" });
};

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();

  let body: any;
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return json({ ok: false, error: "JSON inválido" }, 400);
  }

  if (body?.verification_token) {
    console.log("verification_token:", body.verification_token);

    return json({
      ok: true,
      message: "verification_token recebido. Salve em NOTION_WEBHOOK_VERIFICATION_TOKEN."
    });
  }

  const signature = request.headers.get("x-notion-signature");

  if (
    NOTION_WEBHOOK_VERIFICATION_TOKEN &&
    !verifyNotionSignature(rawBody, signature)
  ) {
    return json({ ok: false, error: "Assinatura inválida" }, 401);
  }

  const eventType = body?.type || "";

  if (!shouldTrigger(eventType)) {
    return json({ ok: true, ignored: true, type: eventType });
  }

  if (!VERCEL_DEPLOY_HOOK_URL) {
    return json(
      { ok: false, error: "VERCEL_DEPLOY_HOOK_URL não definido" },
      500
    );
  }

  const deployResponse = await fetch(VERCEL_DEPLOY_HOOK_URL, {
    method: "POST"
  });

  const deployText = await deployResponse.text();

  return json({
    ok: true,
    type: eventType,
    deploy: {
      ok: deployResponse.ok,
      status: deployResponse.status,
      body: deployText
    }
  });
};