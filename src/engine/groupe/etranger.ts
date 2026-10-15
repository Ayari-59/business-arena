import type { EngineScenarioConfig } from "../types";
import { fluxPropre } from "./flux-propre";
import type { CibleEtrangere, ComptesDUneFiliale } from "./types";

/**
 * RACHETER UNE ENTREPRISE ÉTRANGÈRE (niveau 7) : l'internationalisation.
 *
 * LE MODÈLE COMPACT, dans sa devise. Ses ventes locales suivent leur saison
 * et leur croissance ; un risque pays peut en amputer un tour ; son coût
 * variable, ses charges fixes, ses immobilisations renouvelées, sa dette, son
 * besoin en fonds de roulement et son impôt local font le reste, comme pour
 * un fournisseur (`fournisseur.ts`). Rien ne dépend de la partie : ses
 * comptes se recalculent de la graine, à n'importe quel tour.
 *
 * LE COURS. Une marche aléatoire par tour, de départ `coursInitial`, tirée
 * avec le risque pays sur le flux propre de la cible (`fluxPropre`) : trois
 * tirages par tour, toujours dans le même ordre, qui ne décalent aucun autre
 * tirage de la partie. Le bilan se convertit au cours de clôture, le compte
 * de résultat au cours moyen du tour (la moyenne de l'ouverture et de la
 * clôture), et la différence va en écart de conversion (`consolidation.ts`).
 *
 * LES SYNERGIES, chacune un choix de l'équipe, tour par tour, et dans le
 * compte de résultat de l'équipe (`index.ts`, `rationner`) :
 *   - écouler des produits NOVA par son réseau : pris sur le stock de
 *     l'équipe après ses propres ventes, vendus au prix local, au cours moyen,
 *     moins le coût de distribution local ; la moitié de la capacité au tour du
 *     rachat (l'intégration progressive) ;
 *   - faire fabriquer chez elle : des produits finis livrés en stock au coût
 *     local converti, qualité de son usine, sans heure ni ligne de l'équipe,
 *     mais exposés au cours.
 */

export const laCibleEtrangere = (scenario: EngineScenarioConfig, id: string): CibleEtrangere | undefined =>
  scenario.groupe?.etrangers?.find((c) => c.id === id);

/** Le cours de clôture de chaque tour (0 : le départ) et les tours de risque pays, de 1 à `n`. */
export function trajectoireDeLEtranger(c: CibleEtrangere, graine: number, n: number): { cours: number[]; risque: boolean[] } {
  const rng = fluxPropre(graine, `etranger:${c.id}`);
  const cours = [c.change.coursInitial];
  const risque: boolean[] = [];
  for (let t = 1; t <= n; t++) {
    const u1 = Math.max(1e-12, rng.next());
    const u2 = rng.next();
    const u3 = rng.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const s = c.change.volatilite;
    cours.push(cours[t - 1]! * Math.exp(s * z - (s * s) / 2));
    risque.push(c.risquePays !== undefined && u3 < c.risquePays.probabilite);
  }
  return { cours, risque };
}

/** Le cours moyen du tour `t` (1 = premier tour). */
export const coursMoyen = (cours: readonly number[], t: number): number => (cours[t - 1]! + cours[t]!) / 2;

/** Ses ventes locales au tour `t`, hors risque pays. */
export function ventesLocales(c: CibleEtrangere, t: number): number {
  const v = c.ventes;
  const saison = v.saisonnalite.length > 0 ? v.saisonnalite[(t - 1) % v.saisonnalite.length]! : 1;
  return v.chiffreDAffaires * saison * Math.pow(1 + v.croissance, t - 1);
}

/** Ses comptes, dans sa devise, tour par tour jusqu'à `n` ; [0] est son bilan de départ. */
export function comptesDeLEtranger(c: CibleEtrangere, graine: number, n: number): ComptesDUneFiliale[] {
  const { risque } = trajectoireDeLEtranger(c, graine, n);
  const depart: ComptesDUneFiliale = {
    chiffreDAffaires: 0,
    ebe: 0,
    amortissement: 0,
    interets: 0,
    impot: 0,
    resultat: 0,
    immobilisations: c.immobilisations,
    bfr: 0,
    tresorerie: c.tresorerie,
    dette: c.dette,
    capitauxPropres: c.immobilisations + c.tresorerie - c.dette,
  };
  const out = [depart];
  for (let t = 1; t <= n; t++) {
    const p = out[t - 1]!;
    const ca = ventesLocales(c, t) * (risque[t - 1] ? 1 - c.risquePays!.perteDeVentes : 1);
    const ebe = ca * (1 - c.tauxDeCoutVariable) - c.chargesFixesParTour;
    const amortissement = c.immobilisations / c.dureeDAmortissement;
    const interets = c.tauxDInteretParTour * c.dette;
    const avantImpot = ebe - amortissement - interets;
    const impot = c.tauxDImpot * Math.max(0, avantImpot);
    const resultat = avantImpot - impot;
    const bfr = c.bfr * ca;
    out.push({
      chiffreDAffaires: ca,
      ebe,
      amortissement,
      interets,
      impot,
      resultat,
      immobilisations: c.immobilisations,
      bfr,
      tresorerie: p.tresorerie + ebe - interets - impot - amortissement - (bfr - p.bfr),
      dette: c.dette,
      capitauxPropres: p.capitauxPropres + resultat,
    });
  }
  return out;
}

/** L'EBE d'un tour moyen, en euros au cours de départ : l'amorce de sa fenêtre de valeur. */
export const ebeDeReferenceEtranger = (c: CibleEtrangere): number =>
  (c.ventes.chiffreDAffaires * (1 - c.tauxDeCoutVariable) - c.chargesFixesParTour) * c.change.coursInitial;

