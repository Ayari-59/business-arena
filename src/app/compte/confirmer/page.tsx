import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { confirmerParJeton, DUREE_DU_LIEN_DITE, type ResultatDeConfirmation } from "@/services/confirmation-email.service";

export const metadata: Metadata = {
  title: "Confirmation de l'adresse",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LA CONFIRMATION DE L'ADRESSE (migration 0046) : le lien reçu à l'inscription arrive ici
 * (`lienDeConfirmation`, services/confirmation-email.service.ts). Le jeton signé désigne le
 * compte et son adresse ; l'ouvrir confirme, sans connexion ni bouton de plus. Rouvrir le
 * lien ne fait rien de plus ; un lien faux, d'un compte supprimé ou d'une adresse changée
 * est dit invalide, sans dire lequel.
 */

const TEXTES: Record<ResultatDeConfirmation["etat"], { titre: string; chapeau: (le?: Date) => string }> = {
  confirme: {
    titre: "Votre adresse est confirmée",
    chapeau: () => "Merci. Votre établissement peut désormais recevoir une licence.",
  },
  deja: {
    titre: "Votre adresse était déjà confirmée",
    chapeau: (le) => `Elle l'est${le ? ` depuis le ${jour(le)}` : ""}. Rien n'a changé.`,
  },
  expire: {
    titre: "Ce lien a expiré",
    chapeau: () =>
      `Un lien de confirmation reste valable ${DUREE_DU_LIEN_DITE}. Connectez-vous : la page « Mon compte » en renvoie un nouveau.`,
  },
  invalide: {
    titre: "Ce lien de confirmation n'est pas valide",
    chapeau: () =>
      "Il a peut-être été coupé en deux par votre messagerie. Connectez-vous : la page « Mon compte » en renvoie un nouveau.",
  },
};

function jour(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ jeton?: string | string[] }> }) {
  const { jeton } = await searchParams;
  const resultat = await confirmerParJeton(Array.isArray(jeton) ? jeton[0] : jeton);
  const texte = TEXTES[resultat.etat];
  const le = resultat.etat === "deja" ? resultat.le : undefined;

  return (
    <main id="main" className="pb-16" data-confirmation-adresse={resultat.etat}>
      <EnTeteDePage surtitre="Votre compte Business Arena" titre={texte.titre} chapeau={texte.chapeau(le)} />
      <div className={COLONNE_DE_PAGE}>
        <p className="text-sm">
          <Link href="/teacher/compte" prefetch={false} className={LIEN_A_L_ENCRE}>
            Aller à mon compte
          </Link>
        </p>
      </div>
    </main>
  );
}
