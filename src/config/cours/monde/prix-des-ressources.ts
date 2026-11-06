import { auCentime } from "./amortissement";
import { AUGMENTATION_DE_CAPITAL, BESOIN_DE_FONDS, PRIX_DE_L_INVESTISSEUSE, augmentationDeCapital } from "./comptabilite-approfondie";
import {
  BETA_DES_CAPITAUX_PROPRES,
  DETTES_DU_31_DECEMBRE,
  DETTE_A_LA_PLACE_DU_CAPITAL,
  EMPRUNT_DE_N_PLUS_1,
  FRAIS_DE_DOSSIER,
  cmpcDeNova,
  coutParLeMedaf,
  empruntObligataire,
  fluxApresImpot,
  coutActuariel,
  tableauDeLEmprunt,
  type SourceDuCapital,
} from "./couts-de-financement";
import { coutApresImpot } from "./financement-de-la-gamme";

/**
 * LE MONDE DU SCÉNARIO « LE PRIX DES RESSOURCES » (la suite du chapitre « Arbitrer les coûts de
 * financement » et de son cas, « L'associé qui préfère la dette »).
 *
 * Tout vient du monde du chapitre (couts-de-financement.ts) : l'emprunt de 80 000 € de N+1 et ses frais de
 * dossier, ses modes de remboursement, le placement privé obligataire, le coût des capitaux propres par
 * le MEDAF, l'augmentation de capital de juin N+1, la dette de plus que propose l'associé du cas, et le
 * CMPC en valeurs du bilan. Le prix de 11 € est celui que l'investisseuse du cas « L'investisseuse au
 * capital » propose (comptabilite-approfondie.ts, PRIX_DE_L_INVESTISSEUSE).
 *
 * CE QUI EST NEUF EST UNE HYPOTHÈSE DU SCÉNARIO : la banque prend ses frais de dossier quel que soit le
 * mode ; le CMPC de la structure se calcule avec le coût après impôt de la dette de N+1 que l'élève a
 * choisie. La garde tests/cours/scenario-le-prix-des-ressources.test.ts refait chaque chiffre à la main.
 *
 * L'ARBRE : 3 dettes × 3 façons de lever les 60 000 € de plus, toutes calculées. La meilleure suite : la
 * dette au plus faible coût après impôt, puis la structure au plus faible CMPC parmi celles qui lèvent
 * tout le besoin.
 */

export const DETTES = ["amortissement-constant", "in-fine", "obligataire"] as const;
export type Dette = (typeof DETTES)[number];
export const FONDS_PROPRES = ["capital-a-12", "capital-a-11", "dette-de-plus"] as const;
export type FondsPropres = (typeof FONDS_PROPRES)[number];
export const CHOIX_DES_DECISIONS: readonly (readonly string[])[] = [DETTES, FONDS_PROPRES];

export interface SuiteDesRessources {
  dette?: Dette;
  fonds?: FondsPropres;
}
export type SuiteCompleteDesRessources = Required<SuiteDesRessources>;

export function suiteDesCodes(codes: readonly string[]): SuiteDesRessources | null {
  if (codes.length > CHOIX_DES_DECISIONS.length) return null;
  if (codes.some((c, i) => !CHOIX_DES_DECISIONS[i]!.includes(c))) return null;
  const [dette, fonds] = codes as [Dette?, FondsPropres?];
  return { ...(dette ? { dette } : {}), ...(fonds ? { fonds } : {}) };
}

/** Une dette de 80 000 € : son coût actuariel avant et après impôt, la première année, ce qu'elle laisse à rendre à la fin. */
export function laDette(d: Dette) {
  if (d === "obligataire") {
    const o = empruntObligataire();
    return { dette: d, avantImpot: o.avantImpot, apresImpot: o.apresImpot, fondsRecus: o.fondsNets, premiereAnnee: o.coupons, derniereAnnee: auCentime(o.coupons + o.nominal), interets: auCentime(o.coupons * o.dureeAns) };
  }
  const mode = d === "in-fine" ? "in-fine" : "amortissement-constant";
  const t = tableauDeLEmprunt(mode);
  return {
    dette: d,
    avantImpot: coutActuariel([auCentime(EMPRUNT_DE_N_PLUS_1.montant - FRAIS_DE_DOSSIER), ...t.flux.slice(1)]),
    apresImpot: coutActuariel(fluxApresImpot(mode, FRAIS_DE_DOSSIER)),
    fondsRecus: auCentime(EMPRUNT_DE_N_PLUS_1.montant - FRAIS_DE_DOSSIER),
    premiereAnnee: t.annees[0]!.annuite,
    derniereAnnee: t.annees.at(-1)!.annuite,
    interets: t.interets,
  };
}

/** Le prix d'émission de chaque façon de lever des capitaux propres. */
const PRIX: Readonly<Record<Exclude<FondsPropres, "dette-de-plus">, number>> = { "capital-a-12": AUGMENTATION_DE_CAPITAL.prixDEmission, "capital-a-11": PRIX_DE_L_INVESTISSEUSE };

/** La structure après les financements de N+1 : ce qu'elle lève, le bêta des actionnaires, le CMPC, la valeur de l'action. */
export function laStructure(s: SuiteCompleteDesRessources) {
  const kd = laDette(s.dette).apresImpot;
  const dettes: SourceDuCapital[] = [
    { libelle: "Le prêt de l'exercice N", montant: DETTES_DU_31_DECEMBRE, cout: coutApresImpot(EMPRUNT_DE_N_PLUS_1.taux) },
    { libelle: "La dette de N+1", montant: EMPRUNT_DE_N_PLUS_1.montant, cout: kd },
  ];
  if (s.fonds === "dette-de-plus") {
    const a = augmentationDeCapital();
    const beta = DETTE_A_LA_PLACE_DU_CAPITAL.beta;
    const c = cmpcDeNova([{ libelle: "Capitaux propres", montant: a.capitauxPropres, cout: coutParLeMedaf(beta) }, ...dettes, { libelle: "La dette de plus", montant: BESOIN_DE_FONDS, cout: coutApresImpot(DETTE_A_LA_PLACE_DU_CAPITAL.taux) }]);
    return { suite: s, leve: BESOIN_DE_FONDS, beta, kc: coutParLeMedaf(beta), cmpc: c.cmpc, lignes: c.lignes, valeurDeLAction: a.valeurAvant, prix: null as number | null, valeurAvant: a.valeurAvant };
  }
  const a = augmentationDeCapital(AUGMENTATION_DE_CAPITAL.parite, PRIX[s.fonds]);
  const beta = BETA_DES_CAPITAUX_PROPRES;
  const c = cmpcDeNova([{ libelle: "Capitaux propres", montant: a.capitauxPropresApres, cout: coutParLeMedaf(beta) }, ...dettes]);
  return { suite: s, leve: a.fonds, beta, kc: coutParLeMedaf(beta), cmpc: c.cmpc, lignes: c.lignes, valeurDeLAction: a.valeurApres, prix: a.prix, valeurAvant: a.valeurAvant };
}

export type CodeDeFin = "non-couvert" | "risque" | "dette-chere" | "juste-prix";

/** Le résultat d'une suite complète : la dette, la structure, et la fin. */
export function resultatDeLaSuite(s: SuiteCompleteDesRessources) {
  const dette = laDette(s.dette);
  const structure = laStructure(s);
  const moinsChere = Math.min(...DETTES.map((d) => laDette(d).apresImpot));
  const couvert = structure.leve >= BESOIN_DE_FONDS - 1e-9;
  const fin: CodeDeFin = !couvert ? "non-couvert" : s.fonds === "dette-de-plus" ? "risque" : dette.apresImpot > moinsChere + 1e-12 ? "dette-chere" : "juste-prix";
  return { suite: s, dette, structure, couvert, fin };
}
export type ResultatDesRessources = ReturnType<typeof resultatDeLaSuite>;

export function toutesLesSuites(): SuiteCompleteDesRessources[] {
  return DETTES.flatMap((dette) => FONDS_PROPRES.map((fonds) => ({ dette, fonds })));
}

/** LA MEILLEURE SUITE : parmi les suites qui lèvent tout le besoin, le plus faible CMPC. */
export function meilleureSuite(): ResultatDesRessources {
  return toutesLesSuites()
    .map(resultatDeLaSuite)
    .filter((r) => r.couvert)
    .reduce((a, b) => (b.structure.cmpc < a.structure.cmpc - 1e-12 ? b : a));
}
