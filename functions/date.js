import { getConfigSet, getTimeInfo, genWgurl } from './utils';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const providedAccessKey = url.searchParams.get("accesskey");
  const basePort = Number(url.searchParams.get("baseport")) || 60000;

  const configSet = getConfigSet(env, providedAccessKey);

  if (!configSet) {
    return new Response("Unauthorized: Invalid access key.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { curDateNumber } = getTimeInfo();

  let dateSequence = [];
  for (let i = 0; i < 1; i++) {
    dateSequence.push(genWgurl(configSet, (curDateNumber + i), basePort));
  }

  return new Response(dateSequence.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
