import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bouton } from "@/components/bouton";
import { ChapitreGuide } from "@/components/cours/chapitre-guide";
import { PiedDePage } from "@/components/pied-de-page";
import { casDeLEntreprise } from "@/config/cours/cas";
import { CHAPITRES, chapitreParCode } from "@/config/cours/registre";
import { motsDuContenu } from "@/config/cours/situations";
import { missionAffichee } from "@/config/cours/jouez";
import { getGuestUserId } from "@/lib/guest";
import { classeDeLEleve } from "@/services/cours.service";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";
import { chapitreOuvert } from "../acces";
import { ENTREPRISES } from "../entreprises";
import { suitesDuChapitre } from "@/pedagogy/cours/suites";
import { LIBELLE_DU_DEVIS, OFFRES, OFFRES_DE_L_ARENE } from "@/config/tarifs";
import { LIEN_TARIFS } from "@/config/vitrine-solo";

/** Le chapitre que tout le monde peut ouvrir (`libre: true`), lu dans le registre. */
const CHAPITRE_LIBRE = CHAPITRES.find((c) => c.libre)!.code;

export async function generateMetadata({ params }: { params: Promise<{ chapitre: string }> }): Promise<Metadata> {
  const { chapitre } = await params;
  const c = chapitreParCode(chapitre);
  if (!c) return { title: "Chapitre introuvable" };
  return {
    title: `${c.titre} · Le cours par la simulation`,
    description: c.accroche,
    alternates: { canonical: `/cours/${c.code}` },
  };
}

/**
 * UN CHAPITRE DU COURS, DANS L'ENTREPRISE CHOISIE (`?entreprise=`).
 *
 * Le cas se calcule ici, côté serveur : il fait jouer au moteur le premier
 * trimestre de l'entreprise, et la page n'envoie au navigateur que ses montants.
 * `?classe` ouvre le mode classe : l'enseignant qui projette peut montrer la
 * correction à tout moment.
 *
 * L'ACCÈS SE DÉCIDE ICI : un chapitre libre s'ouvre à tous ; les autres demandent
 * un compte d'enseignant rattaché à un établissement sous licence de l'arène
 * (../acces.ts). Le contenu ne part au navigateur qu'après : le guide reçoit le seul
 * chapitre ouvert, réduit à ses données (pedagogy/cours/chapitre-servi.ts), et n'en
 * importe aucun (audit, P0 : le registre entier était dans les fichiers publics).
 */
export default async function ChapitrePage({
  params,
  searchParams,
}: {
  params: Promise<{ chapitre: string }>;
  searchParams: Promise<{ entreprise?: string; classe?: string }>;
}) {
  const [{ chapitre: code }, { entreprise, classe }] = await Promise.all([params, searchParams]);
  const chapitre = chapitreParCode(code);
  if (!chapitre) notFound();
  // L'ÉLÈVE D'UNE CLASSE remonte sa progression à son enseignant ; une entreprise imposée
  // à la classe l'emporte sur celle de l'adresse.
  const userId = await getGuestUserId();
  const classeDeLEleveLue = userId ? await classeDeLEleve(userId) : null;
  // UN CHAPITRE QUI NE VAUT PAS POUR TOUTES LES ENTREPRISES (un service ne se stocke pas)
  // se joue dans l'une des siennes, même pour une classe qui en a imposé une autre : la
  // page dit pourquoi.
  const possibles = ENTREPRISES.filter((e) => !chapitre.entreprises || chapitre.entreprises.codes.includes(e.code));
  const demandee = ENTREPRISES.find((e) => e.code === (classeDeLEleveLue?.entreprise ?? entreprise));
  const choisie = possibles.find((e) => e.code === demandee?.code) ?? possibles[0]!;
  const remplacee = demandee && demandee.code !== choisie.code ? demandee : null;

  // L'enseignant par son compte, l'élève par sa classe : l'un ou l'autre sous licence.
  if (!(await chapitreOuvert(chapitre))) {
    return (
      <>
        <main id="main" className="mx-auto grid max-w-2xl gap-4 px-6 py-16">
          <p className="surtitre">Le cours par la simulation</p>
          <h1 className="text-3xl font-bold text-slate-50">{chapitre.titre}</h1>
          <p className="text-base text-slate-300">
            {motsDuContenu(chapitre.code).reserve} aux établissements sous licence : le contenu s&apos;ouvre aux enseignants de
            l&apos;établissement, et à leurs élèves par leur classe. Le premier chapitre du cours et son cas pratique, eux, sont libres.
          </p>
          {/* SORTIR DE L'IMPASSE (audit d'octobre 2026) : la page ne proposait que « Voir le cours ».
              Le cours et ses cas pratiques s'ouvrent avec toute licence de l'arène (cours.service,
              unCompteSousLicence) : la page le dit, et mène aux offres et au devis. */}
          <p className="text-base text-slate-300" data-acces-du-cours="">
            Le cours et ses cas pratiques s&apos;ouvrent avec une licence de l&apos;arène : offre{" "}
            {OFFRES_DE_L_ARENE.map((o) => OFFRES[o].nom).join(", ").replace(/, ([^,]*)$/, " ou $1")}.
          </p>
          <p className="flex flex-wrap gap-3">
            <Link href={`/cours/${CHAPITRE_LIBRE}`} className={bouton({ taille: "m" })}>
              Essayer le chapitre libre
            </Link>
            <Link href={LIEN_TARIFS} className={bouton({ variante: "secondaire", taille: "m" })}>
              Voir les offres
            </Link>
            {/* Qui vient du cours ne veut peut-être que lui : l'entreprise et le niveau d'arène y sont facultatifs. */}
            <Link href="/devis?offre=classe&interet=cours" className={bouton({ variante: "secondaire", taille: "m" })}>
              {LIBELLE_DU_DEVIS}
            </Link>
            <Link href="/cours" className={bouton({ variante: "secondaire", taille: "m" })}>
              Voir le cours
            </Link>
          </p>
        </main>
        <PiedDePage />
      </>
    );
  }

  const cas = casDeLEntreprise(choisie.code);
  return (
    <>
      <main id="main" data-metier={choisie.teinte} className="relative overflow-x-clip">
        {remplacee && chapitre.entreprises && (
          <p data-entreprise-remplacee="" className="mx-auto max-w-6xl px-4 pt-6 text-sm text-slate-300 sm:px-6">
            {remplacee.nom} ne joue pas ce chapitre : {chapitre.entreprises.pourquoi} Il se joue ici chez {choisie.nom}.
          </p>
        )}
        <ChapitreGuide
          chapitre={servirLeChapitre(chapitre, cas)}
          cas={cas}
          entreprises={possibles.map(({ code: c, nom }) => ({ code: c, nom }))}
          classe={classe !== undefined}
          mission={missionAffichee(chapitre.code, cas)}
          suites={suitesDuChapitre(chapitre.code)}
          calculatrice={classeDeLEleveLue?.calculatrice ?? true}
          enClasse={classeDeLEleveLue ? { classe: classeDeLEleveLue.classe, eleve: classeDeLEleveLue.eleve } : null}
        />
      </main>
      <PiedDePage />
    </>
  );
}
