import type { Metadata } from "next";
import { Inria_Sans, Inria_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/Providers/theme-provider"
import TanStackProvider from "@/components/Providers/TanStackProvider";

const inria2 = Inria_Sans({
  display: 'swap',
  subsets: ['latin'],
  weight: ["300", "400", "700"]
})
const inria = Inria_Serif({
  display: 'swap',
  subsets: ['latin'],
  weight: ["300", "400", "700"]
})
export const metadata: Metadata = {
  title: "Chatie",
  description: "Chat Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/logos/logo.svg" sizes="any" />
        <link href="https://fonts.googleapis.com/css2?family=Inria+Serif:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap" rel="stylesheet" />
      </head>

      <body className={inria2.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TanStackProvider>
            {children}
          </TanStackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
