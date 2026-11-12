import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapitreReserve } from "@/components/cours/chapitre-reserve";
import { ScenarioAEmbranchements } from "@/components/cours/scenario";
import { PiedDePage } from "@/components/pied-de-page";
import { essaiPour } from "@/config/cours/chapitres-libres";
import { parcoursDuContenu } from "@/config/cours/devis-du-contenu";
import { lienDuDevisDuCours } from "@/config/parametrage-du-devis";
import { lienDuScenario, scenarioParCode } from "@/config/cours/scenarios";
import { getGuestUserId } from "@/lib/guest";
import { getSession } from "@/lib/session";
import { servirLeScenario } from "@/pedagogy/cours/scenario-servi";
import { classeDeLEleve } from "@/services/cours.service";
import { chapitreDuParcoursDeLaClasse } from "@/services/chapitres-de-la-classe";
import { chapitreOuvert } from "../../acces";
import { ENTREPRISES } from "../../entreprises";


export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const s = scenarioParCode(code);
  if (!s) return { title: "Scénario introuvable" };
  return {
    title: `${s.titre} · Le cours par la simulation`,
    description: s.accroche,
    alternates: { canonical: lienDuScenario(s) },
  };
}

/**
 * UN SCÉNARIO À EMBRANCHEMENTS DU COURS (config/cours/scenarios) : des décisions à la suite, chacune
 * calculée sur ce que la précédente a laissé.
 *
 * L'ACCÈS SE DÉCIDE ICI, comme pour un bureau ou un cas pratique du chapitre repris (../../acces.ts). La
 * page ne sert ensuite que la première décision (pedagogy/cours/scenario-servi.ts) : chaque choix est
 * calculé par l'action serveur (../actions.ts), qui refait le même contrôle.
 */
async function ScenarioPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const scenario = scenarioParCode(code);
  if (!scenario) notFound();
  if (!(await chapitreOuvert(scenario))) {
    const userId = await getGuestUserId();
    const classe = userId ? await classeDeLEleve(userId) : null;
    // Du parcours de sa classe (pas encore ouvert) ou hors de son programme (audit UX du 11 novembre 2026, P2-8).
    const eleve =
      classe && !(await getSession())
        ? { classe: classe.classe, dansLeParcours: classe.parcours === null || chapitreDuParcoursDeLaClasse(classe.parcours, scenario) }
        : null;
    return (
      <>
        <ChapitreReserve titre={scenario.titre} reserve="Ce cas pratique est réservé" essai={essaiPour(scenario, { classe: classe?.parcours })} eleve={eleve} devis={lienDuDevisDuCours(parcoursDuContenu(scenario))} />
        <PiedDePage />
      </>
    );
  }
  return (
    <>
      <main id="main" data-metier={ENTREPRISES.find((e) => e.code === scenario.entreprise.code)?.teinte} className="relative overflow-x-clip">
        <ScenarioAEmbranchements scenario={servirLeScenario(scenario)} />
      </main>
      <PiedDePage />
    </>
  );
}

export default avecTypographie(ScenarioPage);
