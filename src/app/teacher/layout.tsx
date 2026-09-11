import type { Metadata } from "next";

/**
 * Espace sous compte ou sous code : rien à indexer, rien à suivre. On y
 * arrive avec un code ou une session, jamais depuis un moteur de recherche.
 */
export const metadata: Metadata = {
  title: "Espace enseignant",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
