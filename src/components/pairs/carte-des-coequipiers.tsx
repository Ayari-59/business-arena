import Link from "next/link";
import { bouton } from "@/components/bouton";
import { Icone } from "@/components/icone";
import { NOMS_DES_MOMENTS } from "@/config/pairs/criteres";
import { carteDeLEtudiant } from "@/services/pairs.service";

/**
 * LA CARTE « ÉVALUEZ VOS COÉQUIPIERS », DANS L'ARÈNE ET LE BILAN.
 *
 * Elle ne paraît qu'au moment prévu par l'enseignant (mi-parcours, fin de partie), et
 * seulement pour un membre d'équipe qui a des coéquipiers à noter. Avant, rien : la
 * partie n'a pas à s'encombrer d'un rappel. Après publication, elle mène à ses moyennes.
 *
 * Son lien est un filet, jamais l'aplat orange : l'écran a déjà son geste principal
 * (valider le tour, ou rejouer au bilan).
 */
export async function CarteDesCoequipiers({ gameId, userId }: { gameId: string; userId: string }) {
  const carte = await carteDeLEtudiant(gameId, userId).catch(() => null);
  if (!carte) return null;
  const textes = {
    "a-faire": {
      titre: "Évaluez vos coéquipiers",
      phrase:
        carte.coequipiers > 1
          ? `Quelques notes pour chacun de vos ${carte.coequipiers} coéquipiers. Ils ne sauront jamais ce que vous leur avez donné.`
          : "Quelques notes pour votre coéquipier. Il ne saura jamais ce que vous lui avez donné.",
      lien: "Évaluer mes coéquipiers",
    },
    envoyee: {
      titre: "Votre évaluation est envoyée",
      phrase: "Vous pouvez la modifier jusqu'à ce que votre enseignant la clôture.",
      lien: "Modifier mon évaluation",
    },
    publiee: {
      titre: "Ce que vos coéquipiers disent de vous",
      phrase: "Votre enseignant a publié les résultats : vos moyennes, critère par critère, sans le nom de qui a noté.",
      lien: "Voir mes moyennes",
    },
  }[carte.etat];
  return (
    <section
      aria-labelledby="carte-coequipiers-titre"
      data-carte-coequipiers={carte.etat}
      className="panneau-info flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4 sm:p-5"
    >
      <div className="min-w-0 flex-1 basis-64">
        <p className="surtitre">
          <Icone nom="equipes" className="mr-1.5 h-3.5 w-3.5" />
          {NOMS_DES_MOMENTS[carte.moment]}
        </p>
        <h2 id="carte-coequipiers-titre" className="titre-carte mt-1 text-slate-50">
          {textes.titre}
        </h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-slate-300">{textes.phrase}</p>
      </div>
      <Link
        href={`/arena/${gameId}/coequipiers?moment=${carte.moment}`}
        className={bouton({ variante: "secondaire" })}
        data-lien-coequipiers=""
      >
        {textes.lien}
      </Link>
    </section>
  );
}
