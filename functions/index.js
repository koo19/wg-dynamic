import { getConfigSet, getTimeInfo, genWgurl } from './utils';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const providedAccessKey = url.searchParams.get("accesskey");
  const basePort = Number(url.searchParams.get("baseport")) || 50000;

  const configSet = getConfigSet(env, providedAccessKey);

  if (!configSet) {
    return new Response("Unauthorized: Invalid access key.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { hoursOfYear } = getTimeInfo();

  let hoursSequence = [];
  for (let i = 0; i < 6; i++) {
    hoursSequence.push(genWgurl(configSet, hoursOfYear + i), basePort);
  }

  return new Response(hoursSequence.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
