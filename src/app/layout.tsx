import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rental Portfolio",
  description: "Rental apartment investment portfolio tracker",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={`${plexSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {session?.user && <Nav userEmail={session.user.email} />}
        {children}
      </body>
    </html>
  );
}
