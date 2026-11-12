import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BureauDuComptable } from "@/components/cours/bureau";
import { ChapitreReserve } from "@/components/cours/chapitre-reserve";
import { PiedDePage } from "@/components/pied-de-page";
import { bureauParCode } from "@/config/cours/bureaux";
import { essaiPour } from "@/config/cours/chapitres-libres";
import { parcoursDuContenu } from "@/config/cours/devis-du-contenu";
import { lienDuDevisDuCours } from "@/config/parametrage-du-devis";
import { getGuestUserId } from "@/lib/guest";
import { getSession } from "@/lib/session";
import { servirLeBureau } from "@/pedagogy/cours/bureau-servi";
import { classeDeLEleve } from "@/services/cours.service";
import { chapitreDuParcoursDeLaClasse } from "@/services/chapitres-de-la-classe";
import { chapitreOuvert } from "../../acces";
import { ENTREPRISES } from "../../entreprises";


export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const b = bureauParCode(code);
  if (!b) return { title: "Bureau introuvable" };
  return {
    title: `${b.titre} · Le cours par la simulation`,
    description: b.accroche,
    alternates: { canonical: `/cours/bureau/${b.code}` },
  };
}

/**
 * UN BUREAU DU COURS (config/cours/bureaux) : la pile d'un mois, à contrôler et à traiter.
 *
 * L'ACCÈS SE DÉCIDE ICI, comme pour un cas pratique du chapitre repris (../../acces.ts). Le contenu ne
 * part au navigateur qu'après, et sans ses réponses (pedagogy/cours/bureau-servi.ts) : chaque geste
 * de l'élève est corrigé par l'action serveur (../actions.ts), qui refait le même contrôle.
 */
async function BureauPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const bureau = bureauParCode(code);
  if (!bureau) notFound();
  if (!(await chapitreOuvert(bureau))) {
    const userId = await getGuestUserId();
    const classe = userId ? await classeDeLEleve(userId) : null;
    // Du parcours de sa classe (pas encore ouvert) ou hors de son programme (audit UX du 11 novembre 2026, P2-8).
    const eleve =
      classe && !(await getSession())
        ? { classe: classe.classe, dansLeParcours: classe.parcours === null || chapitreDuParcoursDeLaClasse(classe.parcours, bureau) }
        : null;
    return (
      <>
        <ChapitreReserve titre={bureau.titre} reserve="Ce cas pratique est réservé" essai={essaiPour(bureau, { classe: classe?.parcours })} eleve={eleve} devis={lienDuDevisDuCours(parcoursDuContenu(bureau))} />
        <PiedDePage />
      </>
    );
  }
  return (
    <>
      <main id="main" data-metier={ENTREPRISES.find((e) => e.code === bureau.entreprise.code)?.teinte} className="relative overflow-x-clip">
        <BureauDuComptable bureau={servirLeBureau(bureau)} />
      </main>
      <PiedDePage />
    </>
  );
}

export default avecTypographie(BureauPage);
