export async function onRequest(context) {
  const { request, env } = context;

  // 从 URL 中获取查询参数
  const url = new URL(request.url);
  const providedAccessKey = url.searchParams.get("accesskey");

  // 读取绑定在环境变量中的预期 accesskey
  const expectedAccessKey = env.ACCESS_KEY;

  // 如果 accesskey 不匹配，返回 401 未授权响应
  if (providedAccessKey !== expectedAccessKey) {
    return new Response("Unauthorized: Invalid access key.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 获取当前 UTC 时间，并转换为 UTC+8 时间
  const currentDate = new Date();
  const utc8Offset = 8 * 60 * 60 * 1000; // UTC+8 的毫秒偏移量
  const currentDateUtc8 = new Date(currentDate.getTime() + utc8Offset);

  // 获取当年第一天的时间（基于 UTC+8）
  const startOfYear = new Date(currentDateUtc8.getFullYear(), 0, 1);

  // 计算当前是当年中的第几个小时（UTC+8）
  const hoursOfYear = Math.floor(
    (currentDateUtc8.getTime() - startOfYear.getTime()) / (1000 * 60 * 60)
  );

  // 根据 baseHour 生成 wg 链接
  function genWgurl(baseHour) {
    const port = baseHour + 50000;
    const wgurl = `wg://${env.WG_HOST}:${port}` +
      `?publicKey=${env.PUBLIC_KEY}&privateKey=${env.PRIVATE_KEY}&presharedKey=${env.PRESHARED_KEY}` +
      "&ip=10.2.1.3/32&mtu=1420&dns=9.9.9.11&persistentkeepalive=1&keepalive=1" +
      "&obfs=amneziawg&obfsParam=336,36,636,0,0,0,0,0,0&flag=HK#hk-w"
      + "-" + port;
    return wgurl;
  }

  // 构造从当前小时起的连续12小时序列
  let hoursSequence = [];
  for (let i = 0; i < 1; i++) {
    hoursSequence.push(genWgurl(hoursOfYear + i));
  }

  return new Response(hoursSequence.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
