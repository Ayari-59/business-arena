import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapitreGuide } from "@/components/cours/chapitre-guide";
import { PiedDePage } from "@/components/pied-de-page";
import { casDeLEntreprise } from "@/config/cours/cas";
import { CHAPITRES, chapitreParCode } from "@/config/cours/registre";
import { chapitrePropose } from "@/config/formations-proposees";
import { motsDuContenu } from "@/config/cours/situations";
import { missionAffichee } from "@/config/cours/jouez";
import { getGuestUserId } from "@/lib/guest";
import { classeDeLEleve } from "@/services/cours.service";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";
import { chapitreOuvert, diaporamaPermis } from "../acces";
import { ENTREPRISES } from "../entreprises";
import { suitesDuChapitre } from "@/pedagogy/cours/suites";
import { getSession } from "@/lib/session";
import { ChapitreReserve } from "@/components/cours/chapitre-reserve";
import Link from "next/link";
import { bureauxDuChapitre, lienDuBureau } from "@/config/cours/bureaux";
import { enquetesDuChapitre, lienDeLEnquete } from "@/config/cours/enquetes";
import { aSonDiaporama, fichierDuDiaporama, lienDuDiaporama } from "@/config/cours/diaporamas";

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
    // Un chapitre retiré (config/formations-proposees.ts) se joue encore pour la classe qui l'a,
    // mais ne se propose plus : il sort des moteurs de recherche.
    ...(chapitrePropose(c) ? {} : { robots: { index: false, follow: false } }),
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
async function ChapitrePage({
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
  const diaporama = aSonDiaporama(chapitre.code) && (await diaporamaPermis(chapitre));
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
        {diaporama && <Diaporama chapitre={chapitre.code} entreprise={choisie.code} />}
        <AuBureau chapitre={chapitre.code} />
        <EnEnquete chapitre={chapitre.code} />
      </main>
      <PiedDePage />
    </>
  );
}

/**
 * LE DIAPORAMA DE L'ENSEIGNANT (config/cours/diaporamas.ts) : un lien de téléchargement, montré au seul
 * enseignant sous licence (../acces.ts, `diaporamaPermis`). La route refait le contrôle.
 */
function Diaporama({ chapitre, entreprise }: { chapitre: string; entreprise: string }) {
  return (
    <aside className="mx-auto grid max-w-6xl gap-1 px-4 pb-12 sm:px-6" aria-label="Pour projeter en classe" data-diaporama-du-chapitre="">
      <p className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">Pour projeter en classe</p>
      <p className="text-sm text-slate-300">
        <a
          href={`${lienDuDiaporama(chapitre)}?entreprise=${entreprise}`}
          download={fichierDuDiaporama(chapitre)}
          data-diaporama={chapitre}
          className="font-semibold text-amber-300 underline-offset-4 hover:underline"
        >
          Télécharger le diaporama
        </a>{" "}
        · le chapitre étape par étape, chaque question suivie de sa correction, vos notes sous chaque diapositive.
      </p>
    </aside>
  );
}

/**
 * LE CHAPITRE SE PROLONGE AU BUREAU (config/cours/bureaux) : un lien, sous le guide, vers la pile du mois
 * suivant. Il ne change rien aux étapes du chapitre.
 */
function AuBureau({ chapitre }: { chapitre: string }) {
  const bureaux = bureauxDuChapitre(chapitre);
  if (bureaux.length === 0) return null;
  return (
    <aside className="mx-auto grid max-w-6xl gap-1 px-4 pb-12 sm:px-6" aria-label="Au bureau" data-bureaux-du-chapitre="">
      <p className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">Et au bureau</p>
      {bureaux.map((b) => (
        <p key={b.code} className="text-sm text-slate-300">
          <Link href={lienDuBureau(b)} data-bureau-du-chapitre={b.code} className="font-semibold text-amber-300 underline-offset-4 hover:underline">
            {b.titre}
          </Link>{" "}
          · {b.accroche}
        </p>
      ))}
    </aside>
  );
}

/**
 * LE CHAPITRE SE PROLONGE EN ENQUÊTE (config/cours/enquetes) : un lien, sous le guide, vers un dossier
 * qui cache des erreurs. Une activité à part : il ne change rien aux étapes du chapitre.
 */
function EnEnquete({ chapitre }: { chapitre: string }) {
  const enquetes = enquetesDuChapitre(chapitre);
  if (enquetes.length === 0) return null;
  return (
    <aside className="mx-auto grid max-w-6xl gap-1 px-4 pb-12 sm:px-6" aria-label="En enquête" data-enquetes-du-chapitre="">
      <p className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">Et en enquête</p>
      {enquetes.map((e) => (
        <p key={e.code} className="text-sm text-slate-300">
          <Link href={lienDeLEnquete(e)} data-enquete-du-chapitre={e.code} className="font-semibold text-amber-300 underline-offset-4 hover:underline">
            {e.titre}
          </Link>{" "}
          · {e.accroche}
        </p>
      ))}
    </aside>
  );
}

export default avecTypographie(ChapitrePage);
