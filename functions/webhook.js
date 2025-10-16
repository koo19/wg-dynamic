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
  const authHeader = request.headers.get("Authorization");
  let authorized = false;
  let serial = -1;

  // 检查旧版单密钥
  if (env.WEBHOOK_SECRET) {
    if (authHeader === `Bearer ${env.WEBHOOK_SECRET}`) {
      authorized = true;
    }
  }

  // 如果旧版密钥未验证通过，则检查新版多密钥
  if (!authorized) {
    let keyIndex = 0;
    while (env[`WEBHOOK_SECRET_${keyIndex}`] !== undefined) {
      const secret = env[`WEBHOOK_SECRET_${keyIndex}`];
      if (authHeader === `Bearer ${secret}`) {
        authorized = true;
        serial = keyIndex;
        break; // 找到匹配项后立即退出循环
      }
      keyIndex++;
    }
  }

  // 如果定义了任何密钥但验证失败，则拒绝访问
  const hasAnySecret = env.WEBHOOK_SECRET !== undefined || env.WEBHOOK_SECRET_0 !== undefined;
  if (hasAnySecret && !authorized) {
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
    await env.WG_KV.put(`hook-port${serial === -1 ? "" : "_" + serial}`, port);
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
