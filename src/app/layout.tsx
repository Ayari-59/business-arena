import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BUSINESS ARENA",
  description:
    "Simulation, apprentissage, aide à la décision et compétition en management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
