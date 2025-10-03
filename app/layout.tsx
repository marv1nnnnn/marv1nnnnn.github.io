import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANOMALY SCANNER // SIGNAL DETECTION SYSTEM",
  description: "Vertical signal scanner for detecting anomalous frequencies",
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
