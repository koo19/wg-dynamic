export default {
  async fetch(request, env, context) {
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
    
    const currentDate = new Date(); // 获取当前 UTC 时间
    const utc8Offset = 8 * 60 * 60 * 1000; // UTC+8 的偏移量（毫秒）
    const currentDateUtc8 = new Date(currentDate.getTime() + utc8Offset); // 转换为 UTC+8 时间
    const startOfYear = new Date(currentDateUtc8.getFullYear(), 0, 1); // 当年的第一天（UTC+8）
    const hoursOfYear = Math.floor((currentDateUtc8.getTime() - startOfYear.getTime()) / (1000 * 60 * 60)); // 计算本年第几个小时（UTC+8）

    function genWgurl(baseHour) {
      const port = baseHour + 60000;
      const wgurl = "wg://raw.hk.xuedong.xyz:" + port + "?publicKey=${publicKey}&privateKey=${privateKey}&presharedKey=${presharedKey}&ip=10.2.1.3/32&mtu=1420&dns=9.9.9.11&keepalive=1&udp=1&obfs=amneziawg&obfsParam=336,36,636,0,0,0,0,0,0&flag=HK#hk-w-52E4ZTXE";
      return wgurl;
    }

    // 构造从当前小时起的连续12小时序列
    let hoursSequence = [];
    for (let i = 0; i < 12; i++) {
      hoursSequence.push(genWgurl(hoursOfYear + i));
    }

    return new Response(hoursSequence.join("\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
