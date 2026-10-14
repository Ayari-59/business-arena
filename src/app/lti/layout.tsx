import type { Metadata } from "next";

/** Les écrans d'arrivée depuis une plateforme d'enseignement : rien à indexer. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
