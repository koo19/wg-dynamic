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

    const fullYamlConfig = "proxies:\n" + genClashYamlProxy(configSet, hoursOfYear, 50000);    
    const base64EncodedConfig = btoa(fullYamlConfig);

    return new Response(base64EncodedConfig, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (error) { // <--- 如果 try 块中发生任何错误，代码会跳到这里
    // 返回一个包含详细错误信息的响应，而不是 1101
    return new Response(
      `An error occurred:\n\n` +
      `Error Name: ${error.name}\n` +
      `Error Message: ${error.message}\n` +
      `Error Stack:\n${error.stack}`,
      {
        status: 500, // Internal Server Error
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }
}