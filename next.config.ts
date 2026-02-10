import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // 静态导出，生成纯静态 HTML/CSS/JS 到 out 目录
  output: "export",

  // GitHub Pages 子路径部署支持
  // 本地开发时 basePath 为空，CI 中会自动设置为 /仓库名
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,

  // 图片优化在静态导出中不可用，使用 unoptimized
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
