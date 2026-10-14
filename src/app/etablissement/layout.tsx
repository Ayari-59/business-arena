import type { Metadata } from "next";

/** Les écrans d'arrivée par la connexion de l'établissement (RENATER) : rien à indexer. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
