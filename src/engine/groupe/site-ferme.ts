import type { CompanyState, EngineScenarioConfig, EquipmentItem, MachineRecord } from "../types";
import { dansLaFourchette, fluxPropre } from "./flux-propre";
import type { EtatDuSite, SiteAcquis, SiteFerme } from "./types";

/**
 * RACHETER UN SITE À L'ARRÊT (niveau 7).
 *
 * Une entreprise fermée depuis quelques années : ses murs et ses lignes se
 * vendent à leur valeur liquidative, sans dettes, sans personnel, sans
 * clients. C'est un rachat d'ACTIFS : pas d'écart d'acquisition, puisqu'on
 * n'achète pas de titres, et pas de paiement en actions, un liquidateur n'en
 * prend pas.
 *
 * L'ÉTAT CACHÉ. Combien de lignes repartent, ce que coûte leur remise en état,
 * et s'il faut dépolluer ou remettre aux normes : tirés sur le flux propre du
 * site (`fluxPropre`), le même pour toute la partie. L'audit, payé un tour
 * avant, le révèle ; sans audit, l'équipe ne connaît que les fourchettes.
 *
 * LES ÉCRITURES. Au jour 1 du tour du rachat : le prix et la remise en état
 * sont immobilisés (une immobilisation en cours, non amortie tant qu'elle ne
 * produit pas) ; le passif environnemental et les frais sont des charges du
 * tour. Ce qui dépasse la valeur recouvrable (le coût de lignes neuves
 * équivalentes, moins leur usure) est déprécié aussitôt, avec les
 * amortissements du tour : une ligne qui ne repart pas ne vaut rien.
 *
 * LE REDÉMARRAGE. La moitié des lignes remises en route rejoint le parc
 * `delai` tours après le rachat, le reste au tour d'après : c'est la montée
 * en charge. Elles s'amortissent dès lors sur leur valeur inscrite, et ne
 * produisent que si l'équipe a embauché pour les faire tourner.
 */

export const cleDuSite = (id: string) => `site_ferme:${id}`;

/** L'état réel du site, tiré sur son flux propre : trois tirages, toujours dans le même ordre. */
export function etatDuSite(site: SiteFerme, graine: number): EtatDuSite {
  const rng = fluxPropre(graine, cleDuSite(site.id));
  const part = dansLaFourchette(rng.next(), site.remiseEnRoute);
  const parLigne = dansLaFourchette(rng.next(), site.remiseEnEtatParLigne);
  const passif = rng.next() < site.passifEnvironnemental.probabilite ? site.passifEnvironnemental.montant : 0;
  const total = site.lignes.reduce((n, l) => n + l.count, 0);
  let reste = Math.round(part * total);
  const lignes: { typeCode: string; count: number }[] = [];
  // Les lignes repartent dans l'ordre où le site les déclare.
  for (const l of site.lignes) {
    const n = Math.min(l.count, reste);
    if (n > 0) lignes.push({ typeCode: l.typeCode, count: n });
    reste -= n;
  }
  const remises = lignes.reduce((n, l) => n + l.count, 0);
  return {
    lignes,
    lignesRemisesEnRoute: remises,
    lignesPerdues: total - remises,
    remiseEnEtat: remises * parLigne,
    passifEnvironnemental: passif,
  };
}

/** La valeur recouvrable des lignes qui repartent : des lignes neuves équivalentes, moins leur usure. */
export function valeurRecouvrable(site: SiteFerme, etat: EtatDuSite, scenario: EngineScenarioConfig): number {
  const types = new Map((scenario.equipment?.types ?? []).map((t) => [t.code, t]));
  return etat.lignes.reduce((s, l) => s + l.count * (types.get(l.typeCode)?.costPerUnit ?? 0), 0) * (1 - site.usure);
}

/** Le site racheté : ce qu'il coûte, ce qui est inscrit, déprécié, et quand ses lignes rejoignent le parc. */
export function siteAcquis(site: SiteFerme, etat: EtatDuSite, scenario: EngineScenarioConfig, tour: number): SiteAcquis {
  const cout = site.prix + etat.remiseEnEtat;
  const recouvrable = valeurRecouvrable(site, etat, scenario);
  const valeurInscrite = Math.min(cout, recouvrable);
  const types = new Map((scenario.equipment?.types ?? []).map((t) => [t.code, t]));
  const neuf = (code: string) => types.get(code)?.costPerUnit ?? 0;
  const valeurNeuve = etat.lignes.reduce((s, l) => s + l.count * neuf(l.typeCode), 0);
  // La première moitié des lignes (arrondie au-dessus) au tour `tour + delai`, le reste au tour d'après.
  const premiere = Math.ceil(etat.lignesRemisesEnRoute / 2);
  const enAttente: SiteAcquis["enAttente"] = [];
  let vues = 0;
  for (const l of etat.lignes) {
    const avant = Math.max(0, Math.min(l.count, premiere - vues));
    const apres = l.count - avant;
    vues += l.count;
    const part = (n: number) => (valeurNeuve > 0 ? (valeurInscrite * n * neuf(l.typeCode)) / valeurNeuve : 0);
    if (avant > 0) enAttente.push({ typeCode: l.typeCode, count: avant, tour: tour + site.delai, valeur: part(avant) });
    if (apres > 0) enAttente.push({ typeCode: l.typeCode, count: apres, tour: tour + site.delai + 1, valeur: part(apres) });
  }
  return {
    id: site.id,
    nom: site.nom,
    tour,
    prix: site.prix,
    etat,
    valeurInscrite,
    depreciation: cout - valeurInscrite,
    chargesParTour: site.chargesParTour,
    enAttente,
  };
}

/**
 * À l'ouverture d'un tour : les lignes des sites dont c'est le tour rejoignent
 * le parc (lot d'équipement amorti sur sa valeur inscrite, et machines suivies
 * une à une, à l'usure du site). Sans ligne à mettre en route : l'état tel quel.
 */
export function mettreEnRoute(state: CompanyState, scenario: EngineScenarioConfig, roundIndex: number): CompanyState {
  const g = state.groupe;
  if (!g || !g.sites.some((s) => s.enAttente.some((l) => l.tour <= roundIndex))) return state;
  const cfg = new Map((scenario.groupe?.sites ?? []).map((s) => [s.id, s]));
  const lots: EquipmentItem[] = [];
  const machines: MachineRecord[] = [];
  const sites = g.sites.map((s) => {
    const prets = s.enAttente.filter((l) => l.tour <= roundIndex);
    if (prets.length === 0) return s;
    const usure = cfg.get(s.id)?.usure ?? 0;
    for (const l of prets) {
      lots.push({ typeCode: l.typeCode, count: l.count, acquiredRound: roundIndex, bookValue: l.valeur, coutDOrigine: l.valeur });
      for (let i = 0; i < l.count; i++) {
        machines.push({
          id: `${cleDuSite(s.id)}-${l.typeCode}-r${roundIndex}-${i}`,
          typeCode: l.typeCode,
          purchasedRound: roundIndex,
          age: 0,
          wear: usure,
          isOperational: true,
          lastMaintenanceRound: roundIndex,
        });
      }
    }
    return { ...s, enAttente: s.enAttente.filter((l) => l.tour > roundIndex) };
  });
  return {
    ...state,
    fleet: [...(state.fleet ?? []), ...lots],
    ...(state.machineFleet ? { machineFleet: [...state.machineFleet, ...machines] } : {}),
    groupe: { ...g, sites },
  };
}

/** Les charges des sites rachetés, par tour, dès le tour du rachat. */
export function chargesDesSites(state: CompanyState): number {
  return (state.groupe?.sites ?? []).reduce((s, x) => s + x.chargesParTour, 0);
}
