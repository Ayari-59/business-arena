import { auCentime } from "./amortissement";
import { avecLaTva } from "./cloture";
import { EXERCICE_DE_NOVA } from "./exercice-de-nova";
import { CONTROLE_FISCAL, DROIT_DE_REPRISE_EN_ANNEES, DUREES_DE_CONSERVATION, cadrageDeLaTva } from "./securite-des-processus";

/**
 * LE MONDE DU COURS : LE CONTRÔLE FISCAL DE NOVA EN N+1, EN TROIS DÉCISIONS (décision du propriétaire,
 * novembre 2026 : une activité par chapitre ; le format « scénario à embranchements » ; chapitre
 * « Sécuriser les processus »).
 *
 * Le scénario (config/cours/scenarios/le-controle-fiscal.ts) lit tout ici. NOVA est contrôlée en N+1 sur
 * son exercice N : en mars, le président veut vider l'armoire des factures de N ; le 20 octobre, le
 * vérificateur demande le fichier des écritures ; en novembre, il rapproche les ventes de N des bases de
 * TVA déclarées. Chaque branche se CALCULE (`resultatDeLaSuite`).
 *
 * CE QUI VIENT DU MONDE, ET NE S'ÉCRIT DONC PAS ICI : l'exercice N de NOVA (monde/exercice-de-nova.ts),
 * les factures d'Électro-Composants Lyon (monde/cloture.ts), le cadrage de la TVA et son écart, les
 * durées de conservation, le droit de reprise et le contrôle fiscal du chapitre
 * (monde/securite-des-processus.ts, avec leurs À VÉRIFIER).
 *
 * CE QUI EST CHOISI (hypothèses du scénario, chacune nommée ci-dessous et dite à l'élève) : le
 * vérificateur contrôle la TVA déduite sur les factures du premier fournisseur ; une TVA déduite sans
 * facture est rappelée en entier ; un écart de TVA admis sans le justifier se paie au taux normal ; le
 * scénario laisse de côté les intérêts de retard et les majorations.
 */

const f = EXERCICE_DE_NOVA;

/** LE MOIS DE L'ARMOIRE (hypothèse du scénario) : en mars N+1, le président veut vider l'armoire des factures papier de N. */
export const MOIS_DE_L_ARMOIRE = "mars N+1";

/**
 * LA TVA DÉDUITE SANS FACTURE (hypothèse du scénario) : le droit à déduction suppose la facture ; sans
 * elle, le vérificateur rappelle la TVA déduite, en entier. Il contrôle ici les factures d'Électro-
 * Composants Lyon, le premier fournisseur de NOVA.
 * // À VÉRIFIER : la détention de la facture comme condition de la déduction (CGI, art. 271, II).
 */
export const RAPPEL_DE_LA_TVA_SANS_FACTURE = 1;

/**
 * LE RAPPEL ADMIS SANS JUSTIFICATION (hypothèse du scénario) : si NOVA admet l'écart du cadrage sans
 * l'expliquer, le vérificateur rappelle la TVA de l'écart au taux de la fiche. Le scénario laisse de côté
 * les intérêts de retard et les majorations. // À VÉRIFIER : l'intérêt de retard (CGI, art. 1727).
 */
export const TAUX_DU_RAPPEL = f.tauxDeTva;

export const CHOIX_DE_L_ARMOIRE = ["dix-ans", "jeter", "reprise"] as const;
export const CHOIX_DU_FICHIER = ["fec", "papier", "attendre"] as const;
export const CHOIX_DE_L_ECART = ["cadrage", "payer", "rouvrir"] as const;
export type ChoixDeLArmoire = (typeof CHOIX_DE_L_ARMOIRE)[number];
export type ChoixDuFichier = (typeof CHOIX_DU_FICHIER)[number];
export type ChoixDeLEcart = (typeof CHOIX_DE_L_ECART)[number];

/** Les options de chaque décision, dans l'ordre. */
export const CHOIX_DES_DECISIONS: readonly (readonly string[])[] = [CHOIX_DE_L_ARMOIRE, CHOIX_DU_FICHIER, CHOIX_DE_L_ECART];

export interface SuiteDeChoix {
  armoire?: ChoixDeLArmoire;
  fichier?: ChoixDuFichier;
  ecart?: ChoixDeLEcart;
}
export type SuiteComplete = Required<SuiteDeChoix>;

/** La suite que des codes décrivent, ou null s'ils n'en sont pas une. */
export function suiteDesCodes(codes: readonly string[]): SuiteDeChoix | null {
  if (codes.length > CHOIX_DES_DECISIONS.length || !codes.every((c, i) => CHOIX_DES_DECISIONS[i]!.includes(c))) return null;
  return { armoire: codes[0] as ChoixDeLArmoire | undefined, fichier: codes[1] as ChoixDuFichier | undefined, ecart: codes[2] as ChoixDeLEcart | undefined };
}

/** Les chiffres du contrôle, tous du monde. */
export function chiffresDuControle() {
  const tvaDuFournisseur = auCentime(f.facturesDeComposantsHt.reduce((t, ht) => t + avecLaTva(ht, f.tauxDeTva).tva, 0));
  const c = cadrageDeLaTva(f);
  return {
    fournisseur: f.fournisseur.nom,
    factures: f.facturesDeComposantsHt.length,
    tvaDuFournisseur,
    rappelSansFacture: auCentime(tvaDuFournisseur * RAPPEL_DE_LA_TVA_SANS_FACTURE),
    amende: CONTROLE_FISCAL.amendePourDefautDeFec,
    zones: CONTROLE_FISCAL.zonesDuFec,
    avis: CONTROLE_FISCAL.avis,
    intervention: CONTROLE_FISCAL.premiereIntervention,
    delaiDeReponse: CONTROLE_FISCAL.delaiDeReponseEnJours,
    cadrage: c,
    rappelSurLEcart: auCentime(c.ecart * TAUX_DU_RAPPEL),
    conservation: DUREES_DE_CONSERVATION.comptable,
    reprise: DROIT_DE_REPRISE_EN_ANNEES,
  };
}

const k = chiffresDuControle();

/** Les fins du scénario, de la plus grave à la meilleure. */
export type CodeDeFin = "reecrite" | "pieces" | "amende" | "payee" | "fragile" | "tenu";

/** Ce que coûtent les décisions déjà prises. */
export function coutsApres(s: SuiteDeChoix) {
  const couts = {
    tvaSansFacture: s.armoire === "jeter" ? k.rappelSansFacture : 0,
    amende: s.fichier && s.fichier !== "fec" ? k.amende : 0,
    rappelSurLEcart: s.ecart && s.ecart !== "cadrage" ? k.rappelSurLEcart : 0,
  };
  return { couts, total: auCentime(couts.tvaSansFacture + couts.amende + couts.rappelSurLEcart) };
}

/** Le résultat d'une suite complète : ce qu'elle coûte, ce qu'elle laisse de conforme, sa fin. */
export function resultatDeLaSuite(s: SuiteComplete) {
  const { couts, total } = coutsApres(s);
  const conforme = s.armoire === "dix-ans" && s.fichier === "fec" && s.ecart === "cadrage";
  const fin: CodeDeFin =
    s.ecart === "rouvrir" ? "reecrite" : s.armoire === "jeter" ? "pieces" : s.fichier !== "fec" ? "amende" : s.ecart === "payer" ? "payee" : s.armoire === "reprise" ? "fragile" : "tenu";
  return { suite: s, couts, cout: total, conforme, probante: s.ecart !== "rouvrir", fin };
}
export type ResultatDeLaSuite = ReturnType<typeof resultatDeLaSuite>;

/** Les 27 suites, dans l'ordre des choix. */
export function toutesLesSuites(): SuiteComplete[] {
  return CHOIX_DE_L_ARMOIRE.flatMap((armoire) => CHOIX_DU_FICHIER.flatMap((fichier) => CHOIX_DE_L_ECART.map((ecart) => ({ armoire, fichier, ecart }))));
}

/**
 * LA MEILLEURE SUITE, et la règle qui la désigne : une comptabilité probante et conforme d'abord (les
 * pièces gardées le temps que la loi demande, le fichier remis, aucune période rouverte), puis le coût le
 * plus bas. Une seule suite y arrive, et elle ne coûte rien.
 */
export function meilleureSuite(): ResultatDeLaSuite {
  const admises = toutesLesSuites()
    .map(resultatDeLaSuite)
    .filter((r) => r.conforme);
  if (admises.length !== 1) throw new Error("une seule suite conforme");
  return admises[0]!;
}
