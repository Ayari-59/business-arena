import type { Metadata } from "next";

/**
 * Espace sous compte ou sous code : rien à indexer, rien à suivre. On y
 * arrive avec un code ou une session, jamais depuis un moteur de recherche.
 */
export const metadata: Metadata = {
  // Sans titre propre, la page reprenait celui de l'accueil.
  title: "Mon profil",
  description: "Vos parties de l'arène et ce qu'elles disent de vos décisions, notion par notion.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
