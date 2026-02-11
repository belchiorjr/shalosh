import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import NextLink from "next/link";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { ThemeSwitch } from "@/components/theme-switch";
import { MainNav } from "@/components/main-nav";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex flex-col min-h-screen">
            <header className="w-full">
              <div className="container mx-auto max-w-7xl px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <NextLink className="flex items-center h-10 shrink-0" href="/">
                  <img
                    src="/shalosh_marca_x.svg"
                    alt="Shalosh"
                    className="h-10 w-auto dark:hidden"
                  />
                  <img
                    src="/shalosh_marca_x_dark.svg"
                    alt="Shalosh"
                    className="h-10 w-auto hidden dark:block"
                  />
                </NextLink>
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto sm:flex-nowrap sm:h-10">
                  <MainNav />
                  <ThemeSwitch className="text-foreground/80 hover:text-foreground" />
                </div>
              </div>
            </header>
            <main className="container mx-auto max-w-7xl pt-8 px-6 flex-grow">
              {children}
            </main>
            <footer className="w-full border-t border-default-100/40">
              <div className="container mx-auto max-w-7xl px-6 py-6 text-xs text-foreground/70">
                <div className="flex flex-col items-center text-center gap-1">
                  <p className="inline-flex items-center gap-2">
                    <img
                      src="/shalosh_logo.svg"
                      alt="Shalosh"
                      className="h-6 w-auto"
                    />
                    <span>
                      Copyright {currentYear} SHALOSH TECNOLOGIA DA INFORMAÇÃO
                      LTDA
                    </span>
                  </p>
                  <p>
                    CPF/CNPJ: 54.846.281/0001-27 · Inscrição Municipal:
                    1554557/001-6 · RUA RIO DE JANEIRO, 243, SALA: 802, Centro -
                    CEP: 30160-040 · Belo Horizonte
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
