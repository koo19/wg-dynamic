import { getConfigSet, getTimeInfo, genClashYamlProxy } from './utils'; 

export async function onRequest(context) {
  const { request, env } = context;
  const url = new new URL(request.url);
  const providedAccessKey = url.searchParams.get("accesskey");

  const configSet = getConfigSet(env, providedAccessKey);

  if (!configSet) {
    return new Response("Unauthorized: Invalid access key.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { hoursOfYear } = getTimeInfo();

  // 生成单个节点的 YAML 配置
  let fullYamlConfig = "proxies:\n"; 
  fullYamlConfig += genClashYamlProxy(configSet, hoursOfYear, 50000);
  
  // 将完整的 YAML 字符串进行 Base64 编码
  const base64EncodedConfig = btoa(fullYamlConfig);

  // 返回 Base64 编码后的字符串
  return new Response(base64EncodedConfig, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}