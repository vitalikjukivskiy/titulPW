import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Поле чудес · Розіграш наживо",
  description: "Запишись на колесо та дивись результати розіграшу наживо.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className="antialiased">{children}</body>
    </html>
  );
}
