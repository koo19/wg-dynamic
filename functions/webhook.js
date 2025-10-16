/**
 * Cloudflare Pages Function to handle incoming webhooks.
 * This endpoint listens for POST requests and saves a 'port' from the payload to KV.
 *
 * To secure this endpoint, set a `WEBHOOK_SECRET` environment variable.
 * The sender must include an 'Authorization' header with the value `Bearer ${WEBHOOK_SECRET}`.
 *
 * The KV namespace must be bound to this function, e.g., as `WG_KV`.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. 安全验证 (推荐)
  // 从环境变量中获取预设的密钥
  const authHeader = request.headers.get("Authorization");
  let secret = env.WEBHOOK_SECRET;
  let keyIndex = 0;
  let serial = 0;
  while (env[`WEBHOOK_SECRET_${keyIndex}`] !== undefined) {
    secret = env[`WEBHOOK_SECRET_${keyIndex}`];
    if (authHeader && authHeader === `Bearer ${secret}`) {
      serial = keyIndex;
    }
    keyIndex++;
  }
  if (keyIndex > 0 && serial === 0) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. 解析请求体
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  // 3. 验证并提取端口号
  const port = payload.port;
  if (!port || typeof port !== "number" || port < 1 || port > 65535) {
    return new Response('Invalid or missing "port" in payload', {
      status: 400,
    });
  }

  // 4. 将端口号存入 KV
  // 请确保您已将 KV Namespace 绑定到名为 `WG_KV` 的变量
  if (!env.WG_KV) {
    console.error("KV namespace 'WG_KV' is not bound.");
    return new Response("KV namespace not configured", { status: 500 });
  }

  try {
    await env.WG_KV.put(`hook-port_${serial}`, port);
    console.log(`Successfully saved port ${port} to KV.`);
    return new Response(JSON.stringify({ success: true, port: port }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to write to KV:", error);
    return new Response("Failed to save port to KV", { status: 500 });
  }
}

/**
 * Handle other HTTP methods.
 */
export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  // 如果是 POST 请求，则转交给 onRequestPost 处理
  return await onRequestPost(context);
}
