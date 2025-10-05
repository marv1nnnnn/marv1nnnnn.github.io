import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MARV1NNNNN // Creative Technologist",
  description: "Personal website and portfolio of Marvin, a designer and creative technologist exploring narrative systems and experiential web installations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
