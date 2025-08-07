export function getConfigSet(env, providedAccessKey) {
  // 查找匹配的配置组
  let configSet = null;
  let keyIndex = 0;

  while (env[`ACCESS_KEY_${keyIndex}`] !== undefined) {
    if (providedAccessKey === env[`ACCESS_KEY_${keyIndex}`]) {
      configSet = {
        wgHost: env[`WG_HOST_${keyIndex}`],
        publicKey: env[`PUBLIC_KEY_${keyIndex}`],
        privateKey: env[`PRIVATE_KEY_${keyIndex}`],
        presharedKey: env[`PRESHARED_KEY_${keyIndex}`],
        dns: env[`DNS_${keyIndex}`],
        profileName: env[`NAME_${keyIndex}`],
        mtu: env[`MTU_${keyIndex}`] || "1420",
        local_ip: env[`IP_${keyIndex}`] || "10.11.12.13/32"
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
      presharedKey: env.PRESHARED_KEY,
      dns: env.DNS || "9.9.9.11",
      profileName: env.NAME,
      mtu: env.MTU || "1420",
      local_ip: env.IP || "10.11.12.13/32"
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
  const month = String(currentDateUtc8.getMonth() + 1).padStart(2, '0');
  const day = String(currentDateUtc8.getDate()).padStart(2, '0');
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
    "&ip=" + 
    `${configSet.local_ip}` +
    "&mtu=" +
    `${configSet.mtu}` +
    "&dns=" + 
    `${configSet.dns}` +
    "&keepalive=1&udp=1" +
    "&obfs=amneziawg&obfsParam=336,36,636,0,0,1,2,3,4" +
    "#" +
    `${configSet.profileName}` +
    "-" +
    port;
}

/**
 * Generates a Clash-compatible WireGuard proxy configuration in YAML format.
 * @param {object} configSet - The configuration object containing keys and host.
 * @param {number} suffix - The value to be added to the base port.
 * @param {number} basePort - The base port number.
 * @returns {string} - A string containing the proxy configuration in YAML format.
 */
export function genClashYamlProxy(configSet, suffix, basePort = 50000) {
  const port = suffix + basePort;
  const nodeName = `hk-w-${port}`; // 节点名称

  // 使用模板字符串拼接 YAML，注意缩进
  const yamlString = `
  - name: "${nodeName}"
    type: wireguard
    server: ${configSet.wgHost}
    port: ${port}
    ip: 10.2.1.3/32
    public-key: ${configSet.publicKey}
    private-key: ${configSet.privateKey}
    preshared-key: ${configSet.presharedKey}
    mtu: 1420
    dns: [149.112.112.11]
    keepalive: 1
`;

  // 如果您的 Clash Verge 内核支持, 可以取消下面的注释。
  /*
    udp: true
    obfs: amneziawg
    obfs-opts:
      version: 2
      body: [336, 36, 636, 0, 0, 1, 2, 3, 4]
  */

  return yamlString;
}