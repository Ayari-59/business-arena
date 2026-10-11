import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { MESSAGES_DE_SERVICE } from "@/config/nouveautes";
import { desinscrireParJeton, type ResultatDeDesinscription } from "@/services/nouveautes.service";

export const metadata: Metadata = {
  title: "Désinscription des nouveautés",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LA DÉSINSCRIPTION EN UN CLIC : le lien d'un e-mail de nouveautés (`lienDeDesinscription`,
 * services/nouveautes.service.ts) arrive ici. Le jeton signé désigne le compte ; l'accord
 * est retiré à l'ouverture, sans connexion ni bouton de plus, et la page le confirme.
 * Rouvrir le lien ne fait rien de plus (« déjà désinscrit ») ; un lien faux ou d'un compte
 * supprimé est dit invalide, sans dire lequel des deux. Revenir sur sa décision demande, lui,
 * d'être connecté (Mon compte).
 */

const TEXTES: Record<ResultatDeDesinscription["etat"], { titre: string; chapeau: (le?: Date) => string }> = {
  desinscrit: {
    titre: "Vous êtes désinscrit des nouveautés",
    chapeau: () => "Business Arena ne vous enverra plus ses nouveautés. Votre compte, lui, ne change pas.",
  },
  deja: {
    titre: "Vous étiez déjà désinscrit",
    chapeau: (le) =>
      `Vous ne recevez plus les nouveautés de Business Arena${le ? ` depuis le ${jour(le)}` : ""}. Rien n'a changé.`,
  },
  jamais: {
    titre: "Vous ne recevez pas les nouveautés",
    chapeau: () => "Ce compte n'a pas accepté les nouveautés de Business Arena : il n'y a rien à retirer.",
  },
  invalide: {
    titre: "Ce lien de désinscription n'est pas valide",
    chapeau: () =>
      "Il a peut-être été coupé en deux par votre messagerie. Vous pouvez aussi régler les nouveautés depuis votre espace enseignant, rubrique « Mon compte ».",
  },
};

function jour(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

export default async function DesinscriptionPage({ searchParams }: { searchParams: Promise<{ jeton?: string | string[] }> }) {
  const { jeton } = await searchParams;
  const resultat = await desinscrireParJeton(Array.isArray(jeton) ? jeton[0] : jeton);
  const texte = TEXTES[resultat.etat];
  const le = resultat.etat === "deja" ? resultat.le : undefined;

  return (
    <main id="main" className="pb-16" data-desinscription={resultat.etat}>
      <EnTeteDePage surtitre="Nouveautés de Business Arena" titre={texte.titre} chapeau={texte.chapeau(le)} />
      <div className={`${COLONNE_DE_PAGE} space-y-4`}>
        {resultat.etat !== "invalide" ? <p className="max-w-2xl text-sm text-slate-400">{MESSAGES_DE_SERVICE}</p> : null}
        <p className="text-sm">
          <Link href="/teacher/compte" prefetch={false} className={LIEN_A_L_ENCRE}>
            Régler les nouveautés dans mon espace
          </Link>
        </p>
      </div>
    </main>
  );
}
