import { getConfigSet, getTimeInfo, genClashYamlProxy } from './utils';

export async function onRequest(context) {
  try { // <--- 把所有逻辑包裹在 try 块中
    const { request, env } = context;
    
    // 修正：这里之前有一个多余的 "new"，已更正
    const url = new URL(request.url); 
    const providedAccessKey = url.searchParams.get("accesskey");

    const configSet = getConfigSet(env, providedAccessKey);

    // 【重要】增加对 configSet 的检查
    if (!configSet) {
      // 如果 configSet 为 null 或 undefined，说明密钥错误或环境变量没配好
      return new Response("Unauthorized or Server Misconfiguration: Could not retrieve config set.", {
        status: 401,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const { hoursOfYear } = getTimeInfo();

    const fullYamlConfig = "proxies:\n" + 
      genClashYamlProxy(configSet, hoursOfYear, 50000) +
      "\nproxy-groups:\n" +
      "  - name: \"PROXY\"\n" +
      "    type: select\n" +
      "    proxies:\n" +
      "      - \"wg-dynamic-0\"\n" +
      "      - DIRECT\n";

    // 【核心修改】创建一个新的 Headers 对象，并添加禁止缓存的指令
    const headers = new Headers({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });

    // 在 Response 中使用这个新的 headers 对象
    return new Response(fullYamlConfig, {
      headers: headers,
    });

  } catch (error) {
    return new Response(`Error: ${error.message}\nStack: ${error.stack}`, { status: 500 });
  }
}