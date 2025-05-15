export function getConfigSet(env, providedAccessKey) {
  // 查找匹配的配置组
  let configSet = null;
  let keyIndex = 1;

  while (env[`ACCESS_KEY_${keyIndex}`] !== undefined) {
    if (providedAccessKey === env[`ACCESS_KEY_${keyIndex}`]) {
      configSet = {
        wgHost: env[`WG_HOST_${keyIndex}`],
        publicKey: env[`PUBLIC_KEY_${keyIndex}`],
        privateKey: env[`PRIVATE_KEY_${keyIndex}`],
        presharedKey: env[`PRESHARED_KEY_${keyIndex}`]
      };
      break;
    }
    keyIndex++;
  }

  // 检查默认配置
  if (!configSet && providedAccessKey === env.ACCESS_KEY) {
    configSet = {
      wgHost: env.WG_HOST,
      publicKey: env.PUBLIC_KEY,
      privateKey: env.PRIVATE_KEY,
      presharedKey: env.PRESHARED_KEY
    };
  }

  return configSet;
}

export function getTimeInfo() {
  const currentDate = new Date();
  const utc8Offset = 8 * 60 * 60 * 1000;
  const currentDateUtc8 = new Date(currentDate.getTime() + utc8Offset);
  const startOfYear = new Date(currentDateUtc8.getFullYear(), 0, 1);
  const hoursOfYear = Math.floor(
    (currentDateUtc8.getTime() - startOfYear.getTime()) / (1000 * 60 * 60)
  );

  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const utc8Time = new Date(utcTime + 8 * 3600000);
  const month = String(utc8Time.getMonth() + 1).padStart(2, '0');
  const day = String(utc8Time.getDate()).padStart(2, '0');
  const curDateNumber = Number(month + day);

  return {
    hoursOfYear,
    curDateNumber
  };
}

export function genWgurl(configSet, suffix, basePort = 50000) {
  const port = suffix + basePort;
  return `wg://${configSet.wgHost}:${port}` +
    `?publicKey=${configSet.publicKey}&privateKey=${configSet.privateKey}&presharedKey=${configSet.presharedKey}` +
    "&ip=10.2.1.3/32&mtu=1420&dns=149.112.112.11&keepalive=1&udp=1" +
    "&obfs=amneziawg&obfsParam=336,36,636,0,0,1,2,3,4&flag=HK#hk-w" +
    "-" + port;
}