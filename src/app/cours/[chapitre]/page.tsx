import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { getSession } from "@/lib/session";
import { ChapitreReserve } from "@/components/cours/chapitre-reserve";

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
    // L'ÉLÈVE D'UNE CLASSE ne lit pas de vente (audit UX du 29 octobre 2026, P1-1) : ni « Voir
    // les offres » ni « Demander un devis », mais à qui en parler. Un enseignant connecté
    // garde la page commerciale, même sur un appareil qui porte une classe d'élève.
    const eleve = classeDeLEleveLue && !(await getSession()) ? { classe: classeDeLEleveLue.classe } : null;
    return (
      <>
        <ChapitreReserve
          titre={chapitre.titre}
          reserve={motsDuContenu(chapitre.code).reserve}
          chapitreLibre={CHAPITRE_LIBRE}
          eleve={eleve}
        />
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
