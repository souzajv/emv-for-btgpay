import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/presentation/components/Navbar";
import { ScrollProgress } from "@/presentation/components/ScrollProgress";
import { AppShell } from "@/presentation/components/AppShell";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "HUB EMV BtgPay",
    template: "%s | HUB EMV BtgPay",
  },
  description:
    "Trilhas de aprendizado EMV para o time BtgPay mobile: fundamentos, contactless, certificação e quiz.",
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.SITE_URL ?? "http://localhost:3000")
  ),
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "HUB EMV BtgPay",
    description: "Capacitação EMV para POS mobile Flutter",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable}>
        <AppShell>
          <ScrollProgress />
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
        </AppShell>
      </body>
    </html>
  );
}
