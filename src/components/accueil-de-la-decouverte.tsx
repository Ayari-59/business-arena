import Link from "next/link";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { Icone } from "@/components/icone";
import { lienDuDevis, LIBELLE_DU_DEVIS, OFFRES } from "@/config/tarifs";
import { LIEN_TARIFS } from "@/config/vitrine-solo";
import type { ReglageDeLEssai } from "@/config/decouverte";

/**
 * L'ARRIVÉE D'UN ENSEIGNANT SANS OFFRE (audit UX du 29 octobre 2026, P0-1).
 *
 * Le nouvel enseignant tombait sur un long formulaire de partie de classe, l'envoyait, et
 * apprenait ensuite qu'il faut une offre. L'encart dit, dès l'arrivée, ce que la Découverte
 * permet TOUT DE SUITE (l'arène en solo, une classe du cours sur le chapitre libre, les
 * épisodes de démonstration), puis le chemin vers une offre : l'essai de l'offre Classe s'il
 * est ouvert (réglage de /admin/offres, rubrique Gratuités ; config/tarifs.ts,
 * `reponseSurLEssai`), sinon le devis. Les formulaires qui exigent une offre (partie,
 * cohorte, examen) sont grisés sous leur bouton, avec leur message.
 */
export function AccueilDeLaDecouverte({
  essai,
  niveauMax,
}: {
  essai: ReglageDeLEssai;
  /** Le dernier niveau de l'arène ouvert en solo sans offre. */
  niveauMax: number;
}) {
  return (
    <section
      aria-labelledby="decouverte-titre"
      data-accueil-de-la-decouverte=""
      className="carte grid gap-3 p-4 sm:p-6"
    >
      <h2 id="decouverte-titre" className="titre-carte text-slate-100">
        Votre compte est en Découverte : voici ce que vous pouvez faire tout de suite
      </h2>
      <ul className="grid gap-2 text-sm leading-relaxed text-slate-300">
        <li>
          <Link href="/jouer" className={LIEN_A_L_ENCRE}>
            Jouer l&apos;arène en solo
          </Link>
          , aux niveaux 1 à {niveauMax}, pour prendre en main le simulateur avant vos élèves.
        </li>
        <li>
          <Link href="/teacher/cours" className={LIEN_A_L_ENCRE}>
            Ouvrir une classe du cours
          </Link>{" "}
          : vos élèves suivent le chapitre libre et son cas pratique avec un code, sans compte, et vous voyez où
          chacun en est.
        </li>
        <li>
          <Link href="/enseignants/episodes" className={LIEN_A_L_ENCRE}>
            Faire jouer les épisodes de démonstration
          </Link>{" "}
          : ils se jouent par leur lien, sans cohorte.
        </li>
      </ul>
      <p className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300" data-essai-ou-devis={essai.autorise ? "essai" : "devis"}>
        <Icone nom="verrou" className="mr-1.5 h-3.5 w-3.5" />
        Les parties de classe, les concours, les cohortes d&apos;épisodes et les examens demandent une offre.{" "}
        {essai.autorise ? (
          <>
            Pour essayer avec un groupe, demandez l&apos;essai de l&apos;offre {OFFRES.classe.nom} : {essai.dureeMaxJours}{" "}
            jours au plus, sans paiement, qui se ferme seul à son terme.{" "}
            <Link href={lienDuDevis("classe")} prefetch={false} className={LIEN_A_L_ENCRE}>
              Demander l&apos;essai
            </Link>
          </>
        ) : (
          <Link href={lienDuDevis("classe")} prefetch={false} className={LIEN_A_L_ENCRE}>
            {LIBELLE_DU_DEVIS}
          </Link>
        )}{" "}
        ·{" "}
        <Link href={LIEN_TARIFS} prefetch={false} className={LIEN_A_L_ENCRE}>
          Voir les offres
        </Link>
      </p>
    </section>
  );
}
