# WG-Dynamic: 动态 WireGuard 配置订阅端口轮换

这是一个部署在 [Cloudflare Pages](https://pages.cloudflare.com/) 上的项目，旨在根据环境变量动态生成适用于 [Shadowrocket](https://www.google.com/search?q=https://shadowrocket.app/) 的 WireGuard 配置链接。

在某些网络环境下，标准的 WireGuard 协议可能会受到干扰或阻断。本项目通过动态生成包含时间相关端口的配置，提供一种简单的<ins>端口轮换</ins>机制，以期缓解此问题，提高连接的稳定性。

## ✨ 功能特性

  - **动态端口**：根据时间（例如，当前小时或日期）自动生成不同的端口号。
  - **自定义端口算法**：支持通过 `baseport` 参数自定义端口生成逻辑。
  - **简易部署**：可轻松部署于免费的 Cloudflare Pages 平台。
  - **环境变量配置**：通过设置环境变量即可完成所有配置，无需修改代码。
  - **多配置支持**：支持通过索引号（如 `_0`, `_1`）在同一项目中管理多个 WireGuard 配置。
  - **Shadowrocket 兼容**：生成的 `wg://` 链接格式与 Shadowrocket 无缝集成，支持一键导入。

## 🚀 部署与配置

1.  **Fork 本项目**：将本项目 Fork 到您自己的 GitHub 仓库。
2.  **连接到 Cloudflare Pages**：登录您的 Cloudflare 账户，进入 "Workers & Pages" \> "创建应用程序" \> "Pages"，然后连接您刚刚 Fork 的 GitHub 仓库。
3.  **配置环境变量**：在 Cloudflare Pages 项目的 "设置" \> "环境变量" 中，添加以下变量。如果您有多个 WireGuard 配置，请更改索引号 `0` 继续添加（例如 `NAME_1`, `ACCESS_KEY_1` 等）。

### 环境变量示例 (`.env`)

```env
# --- 配置 0 ---
# 显示在 Shadowrocket 中的配置文件名称
NAME_0 = Profile_name
# 用于访问配置的密钥
ACCESS_KEY_0 = ACCESS_KEY_0
# WireGuard 服务器的域名或 IP 地址
WG_HOST_0 = Remote_WG_HOST_0
# WireGuard 服务器的公钥
PUBLIC_KEY_0 = Remote_PUBLIC_KEY_0
# 本地客户端的私钥
PRIVATE_KEY_0 = Local_PRIVATE_KEY_0
# 预共享密钥 (可选)
PRESHARED_KEY_0 = PRESHARED_KEY_0
# 分配给客户端的 IP 地址
IP_0 = 10.0.0.1/32
# 配置使用的 DNS 服务器
DNS_0 = 9.9.9.9

# --- 配置 1 (示例) ---
# NAME_1 = Profile_name_2
# ACCESS_KEY_1 = ACCESS_KEY_1
# ...
```

4.  **部署**：保存环境变量并部署项目。Cloudflare Pages 将为您生成一个唯一的 `*.pages.dev` 域名。

## 🛠️ 使用方法

部署成功后，您可以通过构造特定的 URL 来获取 WireGuard 配置。

### 请求格式

```
HTTP GET https://<您的-pages-域名>.pages.dev/[时间周期]?[参数]
```

  - **[时间周期]**: 第一级路径，用于选择端口生成模式，时间基于 UTC+8。
      - `hour`: 返回 (今年第N小时 + 基础端口)作为端口，端口每小时变化一次。
      - `date`: 返回 (格式化日期 "MMDD" + 基础端口) 作为端口，端口每天变化一次。

### 请求参数

| 参数 | 必选 | 描述 |
| :--- | :--- | :--- |
| `accesskey` | 是 | 您的访问密钥，用于匹配环境变量中设置的 `ACCESS_KEY_*`，以获取对应的配置信息。 |
| `baseport` | 否 | 基础端口号。一个整数，用于计算最终端口。如果未提供，当模式为 `hour` 时为 `50000`，当模式为 `date` 时为 `60000`。 |

### 请求示例

假设您的 Cloudflare Pages 域名是 `wg-dynamic.pages.dev`，您想获取索引为 `0` 的配置，并使用基于日期的端口生成方式。

**请求 URL:**

```
https://wg-dynamic.pages.dev/date?accesskey=ACCESS_KEY_0&baseport=30000
```

**端口计算逻辑:**
如果今天是 6 月 4 日，`baseport` 是 `30000`，那么最终端口将是 `30000 + 604 = 30604`。

### 响应示例

服务器将返回一个标准的 `wg://` 格式链接。您可以直接复制此链接或使用 Shadowrocket 扫描其生成的二维码来导入配置。

```
wg://WG_HOST_0:30604?publicKey=Remote_PUBLIC_KEY_0&privateKey=Local_PRIVATE_KEY_0&presharedKey=PRESHARED_KEY_0&ip=10.0.0.1/32&dns=9.9.9.9#Profile_name-30604
```

**响应参数说明:**

| 参数 | 来源 | 描述 |
| :--- | :--- | :--- |
| `wg://...` | - | Shadowrocket 识别的 WireGuard 配置协议头。 |
| `WG_HOST_0` | `WG_HOST_0` | 您的 WireGuard 服务器地址。 |
| `:30604` | 动态生成 | 基于请求路径 (`date`) 和参数 (`baseport`) 计算出的端口。 |
| `publicKey` | `PUBLIC_KEY_0` | WireGuard 服务器公钥。 |
| `privateKey` | `PRIVATE_KEY_0` | 您的客户端私钥。 |
| `presharedKey`| `PRESHARED_KEY_0`| 预共享密钥。 |
| `ip` | `IP_0` | 客户端 IP 地址。 |
| `dns` | `DNS_0` | DNS 服务器地址。 |
| `#Profile_name-30604` | `NAME_0` + 动态端口 | 在 Shadowrocket 中显示的配置文件名，后缀为当前端口。 |

**注意**: 示例响应中的 `mtu`, `keepalive`, `udp`, `obfs` 等参数是 Shadowrocket 支持的额外参数，此项目默认生成的链接可能不包含这些，具体取决于实现。上述示例主要依据您提供的内容生成。

## 💡 工作原理

当您发起请求时，Cloudflare Pages 上的函数会执行以下操作：

1.  **验证密钥**：检查 URL 参数中的 `accesskey` 是否与环境变量中某个 `ACCESS_KEY_*` 匹配，从而找到对应的配置集（`NAME_*`, `WG_HOST_*` 等）。
2.  **解析路径与参数**：识别请求路径（`hour` 或 `date`）和 `baseport` 等参数。
3.  **计算动态端口**：
      - 如果路径是 `/hour`，则获取当前距离今年年初的 UTC+8 小时数生成端口。
      - 如果路径是 `/date`，则获取当前的 UTC+8 月份和日期。如果提供了 `baseport` 参数（例如 `30000`），则端口计算公式为 `端口 = baseport + 月份 * 100 + 日期`。
4.  **构建配置链接**：将所有相关的环境变量（`WG_HOST`, `PUBLIC_KEY` 等）与上一步计算出的动态端口组合起来，构建成一个完整的 `wg://` 格式链接。
5.  **返回链接**：将生成的链接作为响应返回。

通过这种方式，您可以根据预设的规则（每小时或每天）自动轮换端口，有效应对基于端口的连接干扰。

-----
