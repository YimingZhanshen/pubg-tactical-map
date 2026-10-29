# PUBG 战术地图

一个纯前端的 PUBG 战术工具：在官方高清地图上**两点测距**、换算**迫击炮表盘读数**，并查看**密室、载具、复活站等社区标注点位**。

无后端、无账号、无追踪，构建产物是纯静态文件。

## 功能

- **迫击炮计算**：点选 A（阵地）、B（目标），实时显示平面距离、表盘读数、方位角与网格坐标；有效射程 121–700 m，超界会明确提示。
- **纯测距**：只想量距离时切换到测距模式，仍支持拖动 A/B 微调。
- **100 m 网格**：1 km 大格 + 100 m 小格，格子带 A1–H8 编号，方便报点。
- **点位图层**：密室、地下室、熊洞、固定刷车、车库、船只、滑翔机、复活站、加油站等，可分组开关、搜索、点击定位。
- **9 张地图**：艾伦格、米拉玛、泰戈、维寒迪、荣都、蒂斯顿、萨诺、帕拉莫、卡拉金。
- **移动端适配**：抽屉式图层面板、底部读数卡。

快捷键：`G` 网格、`M` 模式切换、`Esc` 清空 A/B。

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS 4 · Leaflet 1.9

地图使用 8192×8192 世界像素的自定义 CRS，`1 px ≈ 0.98 m`（8 km 地图）。距离为地图平面距离，不含地形高低差。

## 本地运行

要求 Node.js `^22.13.0 || >=24.0.0`。

```bash
npm ci
```

仓库已包含 `public/tiles/` 下的 z0–z4 瓦片，克隆后可直接构建。需要重新生成（例如地图更新）时：

```bash
npm run maps   # 需要 Python 3 + Pillow
```

该脚本会从 PUBG 官方 API 资源库下载 8192px 地图原图（约 800 MB），重新生成 z0–z4 的 256px WebP 瓦片。默认只生成到 z4；如需更深的 z5：

```bash
MAX_ZOOM=5 npm run maps
```

网络受限时可通过环境变量指定 HTTP 代理，例如：

```bash
PUBG_PROXY=http://127.0.0.1:8080 npm run maps
```

启动开发服务器：

```bash
npm run dev
```

生产构建与本地预览：

```bash
npm run build
npm run preview
```

点位数据由 `dev/gen-points.mjs` 从 `dev/data/points.js` 生成到 `data/points.ts`：

```bash
npm run points
```

## 目录结构

```
components/      地图、侧栏、读数卡
data/            地图元数据、点位数据（生成）
lib/             距离/方位/网格计算
src/             入口与全局样式
dev/             瓦片与点位生成脚本
public/          图标、生成的瓦片
```

## 部署到 Cloudflare

`npm run build` 会把 `public/`（含瓦片）复制进 `dist/`，Cloudflare 可以直接构建。

**Cloudflare Pages**（Connect to Git）：

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- 环境变量：`NODE_VERSION=22.13.0`（或 24.x）

**Cloudflare Workers**（Workers Builds，仓库已含 `wrangler.jsonc`）：

- 构建命令：`npm run build`
- 部署命令：`npx wrangler deploy`
- 预览命令：`npx wrangler versions upload`
- 环境变量：`NODE_VERSION=22.13.0`（或 24.x）

`wrangler.jsonc` 以 assets 模式把 `dist/` 作为静态资源上传，无需 Worker 入口代码。

## SEO / 分享

- `public/guide.html`：静态使用说明与 FAQ 页（含 FAQPage / Breadcrumb 结构化数据），从侧栏底部进入。
- `public/robots.txt`、`public/sitemap.xml`、`public/llms.txt`、`public/og-cover.jpg`：抓取与分享元数据。
- `index.html` 内含 WebApplication 结构化数据与 Open Graph / Twitter 卡片。
- 更换域名时，需要同步替换 `index.html`、`public/guide.html`、`public/robots.txt`、`public/sitemap.xml`、`public/llms.txt` 里的绝对地址。

## 数据来源与免责声明

- 底图来自 PUBG 官方 API 资源库 [pubg/api-assets](https://github.com/pubg/api-assets)，版权归 KRAFTON 所有；仓库内 `public/tiles` 是由其生成的瓦片，仅用于非商业粉丝用途，不适用 MIT 许可。
- 点位数据来自社区标注项目 [ziphow/pubg-map-toolkit](https://github.com/ziphow/pubg-map-toolkit)，为人工标注，可能存在偏差，仅供战术参考。
- 本项目是非官方粉丝工具，与 KRAFTON 无关联，不用于商业用途。

## 许可

代码以 [MIT](./LICENSE) 许可开源。PUBG 地图图像、游戏名称及相关素材不属于本许可证范围，其权利归 KRAFTON 所有。
