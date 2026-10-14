import type { Metadata } from "next";

/**
 * Les pages des nouveautés (la désinscription) : on y arrive par le lien d'un e-mail,
 * jamais depuis un moteur de recherche.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
