import Link from "next/link";
import { bouton } from "@/components/bouton";
import { LIBELLE_DU_DEVIS, OFFRES, OFFRES_DE_L_ARENE } from "@/config/tarifs";
import { lienDuDevisDuCours } from "@/config/parametrage-du-devis";
import { LIEN_TARIFS } from "@/config/vitrine-solo";
import type { LienDEssai } from "@/config/cours/chapitres-libres";

/**
 * LA PAGE D'UN CHAPITRE RÉSERVÉ (cours.service, coursOuvert).
 *
 * Deux lecteurs, deux pages (audit UX du 29 octobre 2026, P1-1) :
 *  · l'ÉLÈVE d'une classe du cours n'achète rien : la page lui dit que le chapitre n'est pas
 *    encore ouvert pour sa classe et qu'il en parle à son enseignant, sans « Voir les offres »
 *    ni « Demander un devis » ;
 *  · le visiteur ou l'enseignant lit ce que le chapitre demande, et le chemin vers les offres
 *    et le devis (SORTIR DE L'IMPASSE, audit d'octobre 2026).
 * L'un et l'autre trouvent le chapitre libre le plus proche : celui du diplôme d'où ils viennent
 * (novembre 2026, un chapitre libre par diplôme : config/cours/chapitres-libres.ts, `essaiPour`).
 * Le devis est celui d'une demande qui vient du cours (audit produit du 10 novembre 2026, P1-4) :
 * le parcours qui ouvre ce contenu prérempli (config/cours/devis-du-cours.ts, `parcoursDuContenu`),
 * ni entreprise ni niveau exigés.
 */
export function ChapitreReserve({
  titre,
  reserve,
  essai,
  eleve,
  devis = lienDuDevisDuCours(),
}: {
  titre: string;
  /** « Ce chapitre est réservé » / « Ce cas pratique est réservé » (config/cours/situations.ts). */
  reserve: string;
  /** Le chapitre libre à proposer : celui du diplôme d'où l'on vient, sinon l'essai par défaut. */
  essai: LienDEssai;
  /**
   * L'élève d'une classe du cours, s'il en est un : sa classe, et si le contenu est de son parcours
   * (services/chapitres-de-la-classe.ts, `chapitreDuParcoursDeLaClasse`) ; absent, il l'est.
   */
  eleve: { classe: string; dansLeParcours?: boolean } | null;
  /** L'adresse du devis, le parcours du contenu prérempli (`lienDuDevisDuCours`). */
  devis?: string;
}) {
  if (eleve) {
    // DEUX RAISONS, DEUX PHRASES (audit UX du 11 novembre 2026, P2-8) : un contenu du parcours de la
    // classe que l'enseignant n'a pas encore ouvert, ou un contenu hors de son programme, que
    // l'enseignant ne peut pas ouvrir. Ni l'une ni l'autre ne dit « réservé », le mot de la vente.
    const ceContenu = reserve.replace(/ est réservé$/, "");
    const dansLeParcours = eleve.dansLeParcours !== false;
    const libre = `le chapitre libre${essai.sigle ? ` en ${essai.sigle}` : ""}, « ${essai.titre} », et son cas pratique`;
    return (
      <main
        id="main"
        className="mx-auto grid max-w-2xl gap-4 px-6 py-16"
        data-chapitre-ferme-a-l-eleve={dansLeParcours ? "pas-encore-ouvert" : "hors-programme"}
      >
        <p className="surtitre">Le cours par la simulation</p>
        <h1 className="text-3xl font-bold text-slate-50">{titre}</h1>
        <p className="text-base text-slate-300">
          {dansLeParcours
            ? `${ceContenu} n'est pas encore ouvert pour votre classe, « ${eleve.classe} ». Parlez-en à votre enseignant : c'est lui qui peut l'ouvrir. En attendant, ${libre} restent à votre portée.`
            : `${ceContenu} est hors du programme de votre classe, « ${eleve.classe} » : il n'est pas de son parcours, et il ne s'ouvre pas pour elle. Votre classe suit les chapitres de son parcours ; ${libre} restent à votre portée.`}
        </p>
        <p className="flex flex-wrap gap-3">
          <Link href={essai.href} className={bouton({ taille: "m" })}>
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
        l&apos;établissement, et à leurs élèves par leur classe. Chaque diplôme a son chapitre libre, qui s&apos;ouvre sans compte avec son cas
        pratique{essai.sigle ? ` : en ${essai.sigle}, « ${essai.titre} »` : `, comme « ${essai.titre} »`}.
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
        <Link href={essai.href} className={bouton({ taille: "m" })}>
          Essayer le chapitre libre
        </Link>
        <Link href={LIEN_TARIFS} className={bouton({ variante: "secondaire", taille: "m" })}>
          Voir les offres
        </Link>
        {/* Le cours vient avec une offre de l'arène (« le cours seul » n'est plus un choix du devis) :
            l'offre Classe, demandée depuis le cours, son parcours prérempli. */}
        <Link href={devis} className={bouton({ variante: "secondaire", taille: "m" })}>
          {LIBELLE_DU_DEVIS}
        </Link>
        <Link href="/cours" className={bouton({ variante: "secondaire", taille: "m" })}>
          Voir le cours
        </Link>
      </p>
    </main>
  );
}
