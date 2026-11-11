import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BureauDuComptable } from "@/components/cours/bureau";
import { ChapitreReserve } from "@/components/cours/chapitre-reserve";
import { PiedDePage } from "@/components/pied-de-page";
import { enqueteParCode, lienDeLEnquete } from "@/config/cours/enquetes";
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
  const e = enqueteParCode(code);
  if (!e) return { title: "Enquête introuvable" };
  return {
    title: `${e.titre} · Le cours par la simulation`,
    description: e.accroche,
    alternates: { canonical: lienDeLEnquete(e) },
  };
}

/**
 * UNE ENQUÊTE DU COURS (config/cours/enquetes) : un dossier qui cache des erreurs, à trouver, à expliquer
 * et à rectifier. Le moteur et l'écran sont ceux du bureau.
 *
 * L'ACCÈS SE DÉCIDE ICI, comme pour un cas pratique du chapitre repris (../../acces.ts). Le dossier ne
 * part au navigateur qu'après, et sans ses réponses (pedagogy/cours/bureau-servi.ts) : chaque geste de
 * l'élève est corrigé par l'action serveur (../actions.ts), qui refait le même contrôle.
 */
async function EnquetePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const enquete = enqueteParCode(code);
  if (!enquete) notFound();
  if (!(await chapitreOuvert(enquete))) {
    const userId = await getGuestUserId();
    const classe = userId ? await classeDeLEleve(userId) : null;
    // Du parcours de sa classe (pas encore ouvert) ou hors de son programme (audit UX du 11 novembre 2026, P2-8).
    const eleve =
      classe && !(await getSession())
        ? { classe: classe.classe, dansLeParcours: classe.parcours === null || chapitreDuParcoursDeLaClasse(classe.parcours, enquete) }
        : null;
    return (
      <>
        <ChapitreReserve titre={enquete.titre} reserve="Ce cas pratique est réservé" essai={essaiPour(enquete, { classe: classe?.parcours })} eleve={eleve} devis={lienDuDevisDuCours(parcoursDuContenu(enquete))} />
        <PiedDePage />
      </>
    );
  }
  return (
    <>
      <main id="main" data-metier={ENTREPRISES.find((e) => e.code === enquete.entreprise.code)?.teinte} className="relative overflow-x-clip">
        <BureauDuComptable bureau={servirLeBureau(enquete)} />
      </main>
      <PiedDePage />
    </>
  );
}

export default avecTypographie(EnquetePage);
