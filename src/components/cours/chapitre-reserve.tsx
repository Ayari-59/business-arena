import Link from "next/link";
import { bouton } from "@/components/bouton";
import { LIBELLE_DU_DEVIS, OFFRES, OFFRES_DE_L_ARENE } from "@/config/tarifs";
import { LIEN_TARIFS } from "@/config/vitrine-solo";

/**
 * LA PAGE D'UN CHAPITRE RÉSERVÉ (cours.service, coursOuvert).
 *
 * Deux lecteurs, deux pages (audit UX du 29 octobre 2026, P1-1) :
 *  · l'ÉLÈVE d'une classe du cours n'achète rien : la page lui dit que le chapitre n'est pas
 *    encore ouvert pour sa classe et qu'il en parle à son enseignant, sans « Voir les offres »
 *    ni « Demander un devis » ;
 *  · le visiteur ou l'enseignant lit ce que le chapitre demande, et le chemin vers les offres
 *    et le devis (SORTIR DE L'IMPASSE, audit d'octobre 2026).
 */
export function ChapitreReserve({
  titre,
  reserve,
  chapitreLibre,
  eleve,
}: {
  titre: string;
  /** « Ce chapitre est réservé » / « Ce cas pratique est réservé » (config/cours/situations.ts). */
  reserve: string;
  /** Le code du chapitre libre. */
  chapitreLibre: string;
  /** L'élève d'une classe du cours, s'il en est un : sa classe. */
  eleve: { classe: string } | null;
}) {
  if (eleve) {
    return (
      <main id="main" className="mx-auto grid max-w-2xl gap-4 px-6 py-16" data-chapitre-ferme-a-l-eleve="">
        <p className="surtitre">Le cours par la simulation</p>
        <h1 className="text-3xl font-bold text-slate-50">{titre}</h1>
        <p className="text-base text-slate-300">
          Ce chapitre n&apos;est pas encore ouvert pour ta classe, « {eleve.classe} ». Parles-en à ton enseignant :
          c&apos;est lui qui peut l&apos;ouvrir. En attendant, le chapitre libre et son cas pratique restent à ta portée.
        </p>
        <p className="flex flex-wrap gap-3">
          <Link href={`/cours/${chapitreLibre}`} className={bouton({ taille: "m" })}>
            Ouvrir le chapitre libre
          </Link>
          <Link href="/cours" className={bouton({ variante: "secondaire", taille: "m" })}>
            Revenir au cours
          </Link>
        </p>
      </main>
    );
  }
  return (
    <main id="main" className="mx-auto grid max-w-2xl gap-4 px-6 py-16">
      <p className="surtitre">Le cours par la simulation</p>
      <h1 className="text-3xl font-bold text-slate-50">{titre}</h1>
      <p className="text-base text-slate-300">
        {reserve} aux établissements sous licence : le contenu s&apos;ouvre aux enseignants de
        l&apos;établissement, et à leurs élèves par leur classe. Le premier chapitre du cours et son cas pratique, eux, sont libres.
        Avec l&apos;offre {OFFRES.classe.nom} ou {OFFRES.programme.nom}, une classe ouvre les chapitres de son parcours ; avec
        l&apos;offre {OFFRES.campus.nom}, tous les chapitres sont ouverts.
      </p>
      {/* SORTIR DE L'IMPASSE (audit d'octobre 2026) : la page ne proposait que « Voir le cours ».
          Le cours et ses cas pratiques s'ouvrent avec une licence de l'arène, selon l'offre
          (cours.service, coursOuvert) : la page le dit, et mène aux offres et au devis. */}
      <p className="text-base text-slate-300" data-acces-du-cours="">
        Le cours et ses cas pratiques s&apos;ouvrent avec une licence de l&apos;arène : offre{" "}
        {OFFRES_DE_L_ARENE.map((o) => OFFRES[o].nom).join(", ").replace(/, ([^,]*)$/, " ou $1")}.
      </p>
      <p className="flex flex-wrap gap-3">
        <Link href={`/cours/${chapitreLibre}`} className={bouton({ taille: "m" })}>
          Essayer le chapitre libre
        </Link>
        <Link href={LIEN_TARIFS} className={bouton({ variante: "secondaire", taille: "m" })}>
          Voir les offres
        </Link>
        {/* Le cours vient avec une offre de l'arène (« le cours seul » n'est plus un choix du devis). */}
        <Link href="/devis?offre=classe" className={bouton({ variante: "secondaire", taille: "m" })}>
          {LIBELLE_DU_DEVIS}
        </Link>
        <Link href="/cours" className={bouton({ variante: "secondaire", taille: "m" })}>
          Voir le cours
        </Link>
      </p>
    </main>
  );
}
