import type { APIRoute } from "astro";
import crypto from "node:crypto";

export const prerender = false;

const NOTION_WEBHOOK_VERIFICATION_TOKEN =
  import.meta.env.NOTION_WEBHOOK_VERIFICATION_TOKEN || "";

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN || "";
const GITHUB_OWNER = import.meta.env.GITHUB_OWNER || "";
const GITHUB_REPO = import.meta.env.GITHUB_REPO || "";
const GITHUB_WORKFLOW_FILE =
  import.meta.env.GITHUB_WORKFLOW_FILE || "deploy-cloudez.yml";
const GITHUB_REF = import.meta.env.GITHUB_REF || "main";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function verifyNotionSignature(
  rawBody: string,
  incomingSignature: string | null
) {
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
    "page.moved",
    "database.content_updated",
  ].includes(eventType);
}

async function triggerGithubDeploy(eventType: string) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_FILE}/dispatches`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "astro-notion-webhook",
    },
    body: JSON.stringify({
      ref: GITHUB_REF,
      inputs: {
        source: "notion",
        event_type: eventType,
      },
    }),
  });

  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    body: text,
  };
}

export const GET: APIRoute = async () => {
  return json({
    ok: true,
    route: "notion-webhook",
    mode: "github-actions",
  });
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
      message:
        "verification_token recebido. Salve em NOTION_WEBHOOK_VERIFICATION_TOKEN.",
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
    return json({
      ok: true,
      ignored: true,
      type: eventType,
    });
  }

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return json(
      {
        ok: false,
        error:
          "Variáveis GITHUB_TOKEN, GITHUB_OWNER ou GITHUB_REPO não definidas.",
      },
      500
    );
  }

  const deploy = await triggerGithubDeploy(eventType);

  return json({
    ok: true,
    type: eventType,
    deploy,
  });
};