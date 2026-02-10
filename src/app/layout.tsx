import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "美国生存游戏 | American Dream",
  description: "在美国，贫穷是一种慢性死刑。你能在斩杀线上活多久？",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
