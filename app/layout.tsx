import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"麦穗股份簿｜面包店股份管理",description:"面包店认购、交易、经营收支与分红预测管理工具。",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
