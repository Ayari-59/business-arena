import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { anneeDeProduction, hausseQuiAnnuleLaVan, machineDe, machineEnPlus, margeUnitaire, planDEmprunt } from "../monde/capacite";
import { CAPACITES_DU_COURS, type CodeDeMachine, type FicheDeLaCapacite } from "../monde/nova-capacite";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CROÎTRE EN INVESTISSANT : CAPACITÉ, FINANCEMENT, RENTABILITÉ (stratégie et management,
 * palier 3 ; DCG UE6, DSCG UE3, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'atelier de
 * NOVA a une fiche figée (monde/nova-capacite.ts) et la machine en plus se calcule par le modèle du
 * cours (monde/capacite.ts : `anneeDeProduction`, `machineEnPlus`, `hausseQuiAnnuleLaVan`). Une
 * évolution du moteur ne change rien ici.
 *
 * L'objet : l'année N + 1 prévue de NOVA, où l'outil refuse 1 200 enceintes aux trimestres 2 et 4.
 * Un cinquième poste manuel (15 000 €) les servirait, à condition d'embaucher : sans opérateur de
 * plus, le goulot passe de l'outil à l'équipe. Production = min(demande, outil × disponibilité,
 * équipe). Le chapitre chiffre ce que la machine et son embauche coûtent sur l'année
 * (amortissement, intérêts, salaire, entretien), les ventes qu'il faudrait gagner pour que l'année
 * n'y perde rien, puis juge l'investissement comme un investissement : ses flux, sa VAN sur 6 ans
 * et son délai de récupération, qui remplacent la « rentabilité » d'avant (le résultat net gagné de
 * la première année rapporté au prix, que l'audit a relevée : ce n'est pas une mesure). La VAN
 * dépend de la demande bien plus que de la machine : le curseur cherche la hausse qui l'annule.
 * La ligne automatisée, l'autre machine du catalogue, entre par le laboratoire (un levier à choix)
 * et par le cas dédié, « Voir plus grand ».
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, ce-que-l-outil-refuse, le-goulot-se-deplace, les-charges-de-l-annee,
 *     les-flux-et-la-van (la formule est au repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-goulot
 *     puis le-laboratoire-de-l-atelier (machine, embauche, demande, taux : le goulot qui se déplace)
 *     avant le-goulot-se-deplace ; predire-le-point-mort puis le-point-mort-de-la-machine (un curseur
 *     sur les ventes gagnées, la marge face aux charges de l'année) avant le-resultat-gagne ;
 *     predire-la-hausse puis la-hausse-qui-annule-la-van (un curseur sur la hausse de la demande)
 *     avant a-plus-cinq et a-rebours ;
 *   · autonome : le-resultat-gagne, la-van-du-poste-seul (ni formule ni chiffres donnés ; le calcul
 *     de la correction montre le chemin) ;
 *   · expert : a-plus-cinq (une variante chiffrée, la demande haussée de 5 %), a-rebours (de la VAN
 *     nulle aux ventes, puis à la hausse de la demande), les-interets et la-rentabilite-d-une-annee
 *     (deux critiques de la méthode), puis le verdict et la synthèse.
 *
 * LES HYPOTHÈSES DE LA SIMULATION (dites à l'élève dans l'intro) : la marge d'une enceinte, 21 € ;
 * une demande non servie dans son trimestre est perdue ; la demande de N + 1 est une prévision,
 * gardée la même toute la durée de la machine ; la ligne reste à 100 % de disponibilité ; la machine
 * est achetée le 1er janvier N + 1 et sert dès le trimestre 1 ; l'emprunt est du même montant, à
 * 5 %, sur la durée de la machine ; l'impôt est de 25 %, y compris l'économie d'impôt d'un résultat
 * perdu ; le recrutement se compte au départ ; le taux d'actualisation est de 8 %.
 */

/**
 * LA VARIANTE CHIFFRÉE, l'une des hausses de la fiche : la demande de chaque trimestre de N + 1
 * haussée de 5 %, gardée 6 ans. Elle oblige à refaire le raisonnement : la demande haussée, le
 * goulot de chaque trimestre, les ventes gagnées, puis le flux et la VAN.
 */
export const HAUSSE_DE_LA_VARIANTE = 0.05;

/**
 * LA HAUSSE DE LA CRITIQUE, l'une des hausses de la fiche : à 10 % de demande en plus, le « ratio de
 * rentabilité » d'un collègue (le résultat gagné de la première année rapporté au prix) paraît
 * énorme. La critique le confronte à la VAN et au délai de récupération.
 */
export const HAUSSE_DE_LA_CRITIQUE = 0.1;

/** Les bornes du curseur des ventes gagnées, en enceintes par an. */
export const VENTES_DU_CURSEUR = { min: 0, max: 3_000 } as const;

/**
 * Les bornes du curseur de la hausse de la demande, en ‰ (pour mille). Jusqu'à 100 ‰, la VAN du
 * poste est une droite de la hausse : seuls les trimestres 2 et 4 gagnent des ventes, et ni l'outil
 * agrandi ni l'équipe ne les bornent encore (à l'arrondi de la demande à l'enceinte près).
 */
export const HAUSSE_DU_CURSEUR = { min: 0, max: 100 } as const;

/** Les leviers du laboratoire qui glissent : la hausse de la demande (%) et le taux d'actualisation (%). */
export const HAUSSE_DU_LABORATOIRE = { min: 0, max: 30, pas: 1 } as const;
export const TAUX_DU_LABORATOIRE = { min: 4, max: 12, pas: 0.5 } as const;

/** Le levier à choix du laboratoire : chaque machine du catalogue, codée par une valeur. */
export const MACHINES_DU_LABORATOIRE: readonly { valeur: number; code: CodeDeMachine }[] = [
  { valeur: 1, code: "poste-manuel" },
  { valeur: 2, code: "ligne-automatisee" },
];

/** La machine se juge sur une production : l'atelier de NOVA. */
export const ENTREPRISES_DE_LA_CROISSANCE: readonly string[] = ["nova"];

/**
 * @deprecated La mission « jouez » (jouez.ts) fait acheter la machine dans l'arène : au tour 1, comme
 * avant. Le chapitre, lui, achète la machine le 1er janvier N + 1 (monde/capacite.ts).
 */
export const TRIMESTRE_DE_L_ACHAT = 1;

/**
 * Le nom que porte le poste manuel dans le parc de l'arène (le scénario nova : la « Ligne manuelle »,
 * 15 000 € sur 24 trimestres), pour la mission « jouez ». Le cours ne lit pas l'arène : ce nom est
 * recopié, et seul jouez.ts s'en sert.
 */
const NOM_DU_POSTE_DANS_L_ARENE = "Ligne manuelle";

/**
 * @deprecated Gardé pour la mission « jouez » (jouez.ts), qui fait acheter le poste manuel dans
 * l'arène. Il se lit désormais sur la fiche du cours (le poste manuel, son prix et sa durée en
 * trimestres), sans le scénario de l'arène.
 */
export function machineDuChapitre(code: string): { code: string; name: string; costPerUnit: number; depreciationRounds: number } {
  const m = machineDe(ficheDe({ code }), "poste-manuel");
  return { code: m.code, name: NOM_DU_POSTE_DANS_L_ARENE, costPerUnit: m.prix, depreciationRounds: m.dureeEnAnnees * 4 };
}

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (x: number, d = 2) => `${(x * 100).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** À l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « un cinquième poste manuel » : le nom de la fiche, en minuscule au milieu d'une phrase. */
const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
/** Le facteur d'actualisation tel que l'élève l'écrit, à quatre décimales. */
const facteurEcrit = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
/** Une durée en années, au centième. */
const ans = (x: number) => `${qte(auCentime(x))} an${x >= 2 ? "s" : ""}`;

/** La fiche de la capacité du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaCapacite => CAPACITES_DU_COURS[c.code]!;

/**
 * La plus petite hausse de la demande (au ‰) à partir de laquelle la machine avec son opérateur a
 * une VAN au moins égale à la même machine sans embauche : là où l'embauche liée se paie. Null si
 * aucune hausse jusqu'à 100 % ne le fait.
 */
export function hausseOuLOperateurPaie(f: FicheDeLaCapacite, code: CodeDeMachine): number | null {
  for (let pm = 0; pm <= 1000; pm++) {
    const h = pm / 1000;
    if (machineEnPlus(f, code, { hausseDeLaDemande: h }).van >= machineEnPlus(f, code, { hausseDeLaDemande: h, embauches: 0 }).van) return h;
  }
  return null;
}

export type Verdict = "acheter-avec-l-operateur" | "attendre-la-demande" | "ne-pas-acheter";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Tout ce que le chapitre demande, sur la fiche de l'entreprise. */
export function croissance(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(ficheDe(c));
  calculs.set(c.code, r);
  return r;
}

function calculer(f: FicheDeLaCapacite) {
  const m = margeUnitaire(f);
  const impot = f.investissement.tauxDImpot;
  const sans = anneeDeProduction(f);
  const poste = machineEnPlus(f, "poste-manuel");
  const posteSeul = machineEnPlus(f, "poste-manuel", { embauches: 0 });
  const variante = machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: HAUSSE_DE_LA_VARIANTE });
  const critique = machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: HAUSSE_DE_LA_CRITIQUE });
  const machine = poste.machine;
  // Les trimestres où l'outil est le goulot de N + 1 : là seulement une machine fait vendre.
  const goulots = sans.trimestres.filter((t) => t.goulot === "outil");
  const demandeDesGoulots = somme(goulots.map((t) => t.demande));
  // Ce que la machine seule coûte, sans son opérateur : les ventes qui paient l'amortissement et les intérêts.
  const ventesDeLaMachineSeule = plafond((poste.amortissement + poste.interets) / m);
  // Le calcul à rebours : de la VAN nulle au flux, au résultat avant impôt, aux ventes gagnées, à la hausse.
  const fluxQuiAnnule = auCentime(poste.investissement / poste.facteurDActualisation);
  const resultatQuiAnnule = auCentime((fluxQuiAnnule - poste.amortissement) / (1 - impot));
  const ventesQuiAnnulent = plafond((resultatQuiAnnule + poste.salaires + poste.entretien + poste.amortissement) / m);
  // Tant que seuls les trimestres où l'outil bornait gagnent des ventes, chaque point de hausse en ajoute leur demande.
  const hausseARebours = auCentime(((ventesQuiAnnulent - poste.ventesGagnees) / demandeDesGoulots) * 100);
  const hausseNulle = hausseQuiAnnuleLaVan(f, "poste-manuel");
  const operateurPaie = hausseOuLOperateurPaie(f, "poste-manuel");
  const verdict: Verdict = poste.van > 0 ? "acheter-avec-l-operateur" : hausseNulle !== null ? "attendre-la-demande" : "ne-pas-acheter";
  return {
    f,
    m,
    impot,
    machine,
    sans,
    goulots,
    demandeDesGoulots,
    poste,
    posteSeul,
    variante,
    critique,
    /** Les enceintes qu'un opérateur de plus monte par trimestre (1 800). */
    enceintesParOperateur: poste.equipeEnPlus / poste.embauches,
    ventesDeLaMachineSeule,
    partDeLOperateur: auCentime((poste.salaires / poste.charges) * 100),
    fluxQuiAnnule,
    resultatQuiAnnule,
    ventesQuiAnnulent,
    hausseARebours,
    hausseNulle,
    operateurPaie,
    rentabiliteDuCollegue: auCentime((critique.resultatGagne / machine.prix) * 100),
    emprunt: planDEmprunt(machine.prix, f.investissement.tauxDeLEmprunt, machine.dureeEnAnnees),
    verdict,
  };
}

export type Croissance = ReturnType<typeof croissance>;

/** La position d'un laboratoire : la machine et l'embauche (des choix), la hausse et le taux (en %). */
export function machineDuLaboratoire(c: Pick<Cas, "code">, p: Readonly<Record<string, number>>, embauches?: number) {
  const code = MACHINES_DU_LABORATOIRE.find((x) => x.valeur === p.machine)!.code;
  return machineEnPlus(ficheDe(c), code, {
    embauches: embauches ?? p.embauches!,
    hausseDeLaDemande: p.hausse! / 100,
    tauxDActualisation: p.taux! / 100,
  });
}

/** L'année N + 1 prévue, sans machine : le document de départ. */
export function tableauDeLAnnee(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = croissance(c);
  const t = x.sans.trimestres;
  return {
    titre: `L'année N + 1 prévue ${dE(x.f.entreprise)}, sans machine de plus (${x.f.unites})`,
    colonnes: [...t.map((y) => `T${y.trimestre}`), "Année"],
    lignes: [
      { libelle: "Demande prévue", valeurs: [...t.map((y) => qte(y.demande)), qte(x.sans.demande)] },
      { libelle: "Capacité de l'outil (ligne à 100 %)", valeurs: [...t.map((y) => qte(y.capaciteOutil)), ""] },
      { libelle: `Capacité de l'équipe (${qte(x.f.plan.operateurs)} opérateurs)`, valeurs: [...t.map((y) => qte(y.capaciteEquipe)), ""] },
    ],
  };
}

/** Une machine du catalogue, telle que la fiche la décrit. */
export function tableauDesMachines(c: Pick<Cas, "code">, codes: readonly CodeDeMachine[]): TableauDeDonnees {
  const f = ficheDe(c);
  const ms = codes.map((k) => machineDe(f, k));
  return {
    titre: ms.length > 1 ? `Les machines du catalogue ${dE(f.entreprise)}` : `${ms[0]!.nom}, au catalogue ${dE(f.entreprise)}`,
    colonnes: ms.map((m) => m.nom),
    lignes: [
      { libelle: "Prix", valeurs: ms.map((m) => eur(m.prix)) },
      { libelle: `Capacité d'outil en plus, par trimestre (${f.unites})`, valeurs: ms.map((m) => qte(m.capaciteEnPlus)) },
      { libelle: "Opérateurs à embaucher", valeurs: ms.map((m) => qte(m.embauches)) },
      { libelle: `Heures de travail d'une ${f.unite} montée dessus`, valeurs: ms.map((m) => qte(m.heuresParEnceinte)) },
      { libelle: "Entretien par an", valeurs: ms.map((m) => eur(m.entretienParAn)) },
      { libelle: "Durée d'utilisation (ans)", valeurs: ms.map((m) => qte(m.dureeEnAnnees)) },
    ],
  };
}

/** Le calcul des ventes gagnées, trimestre par trimestre : « (7 200 − 7 000) + (7 200 − 7 000) = 400 ». */
function ventesGagneesEcrites(r: ReturnType<typeof machineEnPlus>) {
  const gains = r.trimestres.filter((t) => t.ventesGagnees !== 0);
  if (gains.length === 0) return `aucun trimestre ne vend plus : 0`;
  return `${gains.map((t) => `(${qte(t.ventesAvec)} − ${qte(t.ventesSans)}) au T${t.trimestre}`).join(" + ")} = ${qte(r.ventesGagnees)}`;
}

/** Le flux annuel écrit : « (25 200 € − 31 950 € − 4 500 € − 2 500 €) × 0,75 + 2 500 € = −7 812,50 € ». */
function fluxEcrit(x: Croissance, r: ReturnType<typeof machineEnPlus>) {
  const salaires = r.salaires > 0 ? ` − ${eur(r.salaires)}` : "";
  return `(${eur(r.margeGagnee)}${salaires} − ${eur(r.entretien)} − ${eur(r.amortissement)}) × ${qte(1 - x.impot)} + ${eur(r.amortissement)} = ${eur(r.fluxAnnuel)}`;
}

/** La VAN écrite : « −18 000 € + (−7 812,50 €) × 4,6229 = −54 116,25 € ». */
const vanEcrite = (r: ReturnType<typeof machineEnPlus>) => `−${eur(r.investissement)} + ${entre(r.fluxAnnuel)} × ${facteurEcrit(r.facteurDActualisation)} = ${eur(r.van)}`;

/** Le plan de l'emprunt du poste : le capital dû, les intérêts et l'annuité de chaque année. */
function tableauDeLEmprunt(x: Croissance): TableauDeDonnees {
  return {
    titre: `L'emprunt du poste, ${eur(x.machine.prix)} à ${pct(x.f.investissement.tauxDeLEmprunt)} sur ${qte(x.machine.dureeEnAnnees)} ans`,
    colonnes: ["Capital dû en début d'année", "Intérêts", "Capital remboursé", "Annuité"],
    lignes: x.emprunt.map((l) => ({ libelle: `Année ${l.annee}`, valeurs: [eur(l.du), eur(l.interets), eur(l.remboursement), eur(l.annuite)] })),
  };
}

export const CROITRE_EN_INVESTISSANT: Chapitre = {
  code: "croitre-en-investissant",
  parcours: "strategie",
  palier: 3,
  blocs: ["DCG UE6 · Finance d'entreprise", "DSCG UE3 · Contrôle de gestion et stratégie", "BUT GEA · Concevoir la stratégie de création de valeur"],
  titre: "Croître en investissant : capacité, financement, rentabilité",
  accroche:
    "L'outil de NOVA refuse des ventes : une machine de plus les servirait, à condition d'embaucher. Ce qu'elle coûte sur l'année, les ventes qu'il lui faut, puis sa VAN et son délai de récupération, qui dépendent de la demande bien plus que de la machine.",
  objectifs: [
    "Trouver le goulot d'une production, et voir où il passe quand on ajoute une machine",
    "Chiffrer les charges d'un investissement et de l'embauche qui va avec : amortissement, intérêts, salaire, entretien",
    "Calculer les ventes à gagner pour que l'année n'y perde rien",
    "Calculer les flux, la VAN et le délai de récupération d'un investissement, et dire pourquoi les intérêts n'y entrent pas",
    "Remonter de la VAN nulle aux ventes et à la hausse de la demande qu'elle exige, et critiquer un ratio qui n'est pas une rentabilité",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CROISSANCE,
    pourquoi:
      "ce chapitre se calcule sur l'atelier de NOVA, la PME industrielle de la comptabilité et du contrôle de gestion : en N + 1, son outil refuse des ventes, et chaque machine de son catalogue a un prix, une capacité et une embauche connus.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une machine de plus",
      notions: ["capacity", "contribution_margin"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const x = croissance(c);
        const f = x.f;
        const e = f.enceinte;
        return [
          `Ce chapitre se joue dans la simulation du cours, à l'atelier ${dE(f.entreprise)}, sur l'année N + 1, trimestre par trimestre. ${f.entreprise} monte une seule enceinte, la ${e.nom}, sur une ligne de ${qte(f.ligne.postes)} postes manuels qui en monte ${qte(f.ligne.capaciteParTrimestre)} par trimestre ; ses ${qte(f.plan.operateurs)} opérateurs en montent ${qte(x.sans.trimestres[0]!.capaciteEquipe)}. Chaque ${f.unite} vendue laisse ${eur(x.m)} de marge sur coût variable (${eur(e.prix)} − ${eur(e.coutVariable.composants)} − ${eur(e.coutVariable.autres)}).`,
          `La demande de N + 1 est une prévision, ${qte(x.sans.demande)} ${f.unites}. Une ${f.unite} demandée qui n'est pas montée dans son trimestre est perdue : ${f.entreprise} n'a pas de stock. Chaque trimestre, la production est la plus petite des trois : la demande, l'outil, l'équipe ; ce qui la borne est le goulot. La ligne reste disponible à 100 %, entretenue au budget de référence.`,
          `La direction envisage une machine de plus, achetée le 1er janvier N + 1 et en service dès le trimestre 1, payée par un emprunt du même montant à ${pct(f.investissement.tauxDeLEmprunt)}, capital remboursé par parts égales sur sa durée. La simulation la juge comme un investissement : sur sa durée, au taux d'actualisation de ${pct(f.investissement.tauxDActualisation)} que ${f.entreprise} attend de sa croissance, avec un impôt de ${pct(x.impot)} (un résultat perdu fait économiser l'impôt d'autant), le recrutement compté au départ (${eur(f.personnel.coutDUnRecrutement)}), et une demande gardée la même toute la durée de la machine.`,
          (() => {
            const seuil = f.personnel.salaireDuMarche.nPlus1 * f.personnel.seuilDeDemission;
            const surcout = auCentime((seuil - f.operateurs.salaireBrutMensuel) * (1 + f.operateurs.tauxDesCotisationsPatronales) * 12);
            return `L'opérateur embauché est payé comme les autres, ${eur(f.operateurs.salaireBrutMensuel)} bruts par mois. C'est ${pct(f.operateurs.salaireBrutMensuel / f.personnel.salaireDuMarche.nPlus1)} du marché de N + 1, sous le seuil de démission de ${pct(f.personnel.seuilDeDemission, 0)} que montre le chapitre « Le départ d'un salarié ». La simulation garde ce salaire pour juger l'investissement seul ; payer l'opérateur au seuil, ${eur(seuil)}, coûterait ${eur(surcout)} de plus par an.`;
          })(),
        ];
      },
      repere: () =>
        "Production du trimestre = min(demande, capacité de l'outil × disponibilité, capacité de l'équipe). Une machine de plus ne fait vendre que là où l'outil est le goulot.",
    },
    {
      id: "ce-que-l-outil-refuse",
      type: "montants",
      titre: "Ce que l'outil refuse",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const x = croissance(c);
        const t4 = x.sans.trimestres[3]!;
        return `Au trimestre 4, la demande est de ${qte(t4.demande)}, l'outil en monte ${qte(t4.capaciteOutil)}, l'équipe ${qte(t4.capaciteEquipe)}. Calculez les ventes du trimestre 4 (la plus petite des trois), les ${x.f.unites} refusées sur l'année (la demande moins les ventes, à chaque trimestre), puis la marge qu'elles emportent, à ${eur(x.m)} l'${x.f.unite}.`;
      },
      champs: (c) => {
        const x = croissance(c);
        const t4 = x.sans.trimestres[3]!;
        return [
          { libelle: "Ventes du trimestre 4", attendu: t4.production, calcul: `min(${qte(t4.demande)} ; ${qte(t4.capaciteOutil)} ; ${qte(t4.capaciteEquipe)}) = ${qte(t4.production)}`, tolerance: 0 },
          {
            libelle: `${x.f.unites.charAt(0).toUpperCase()}${x.f.unites.slice(1)} refusées sur l'année`,
            attendu: x.sans.refusees,
            calcul: `${x.goulots.map((t) => `(${qte(t.demande)} − ${qte(t.production)})`).join(" + ")} = ${qte(x.sans.refusees)}, aux trimestres où l'outil est le goulot`,
            tolerance: 0,
          },
          { libelle: "Marge refusée sur l'année", attendu: x.sans.margeRefusee, calcul: `${qte(x.sans.refusees)} × ${eur(x.m)} = ${eur(x.sans.margeRefusee)}` },
        ];
      },
      explication: (c) => {
        const x = croissance(c);
        return [
          `${eur(x.sans.margeRefusee)} : c'est tout ce qu'une capacité en plus peut rapporter en N + 1, quelle que soit la taille de la machine. Aux trimestres ${x.sans.trimestres
            .filter((t) => t.goulot === "demande")
            .map((t) => t.trimestre)
            .join(" et ")}, l'outil a du jeu : aucune machine n'y fera vendre une ${x.f.unite} de plus.`,
        ];
      },
    },
    {
      id: "predire-le-goulot",
      type: "choix",
      titre: "Pariez sur le goulot",
      notions: ["capacity"],
      tableau: (c) => tableauDesMachines(c, ["poste-manuel"]),
      question: (c) => {
        const x = croissance(c);
        return `Avant de calculer, pariez. ${x.machine.nom} ajoute ${qte(x.machine.capaciteEnPlus)} ${x.f.unites} d'outil par trimestre. Si ${x.f.entreprise} l'achète sans embaucher, combien d'${x.f.unites} de plus vendra-t-elle en N + 1 ?`;
      },
      options: (c) => {
        const x = croissance(c);
        const voir = "Faites tourner l'atelier à l'étape suivante : le laboratoire montre ce qui borne la production, machine par machine.";
        const quatre = x.machine.capaciteEnPlus * 4;
        return [
          { texte: `${qte(x.sans.refusees)} : toute la demande que l'outil refusait`, juste: x.posteSeul.ventesGagnees === x.sans.refusees, retour: `Pari à vérifier. ${voir}` },
          { texte: `${qte(x.posteSeul.ventesGagnees)} : l'équipe devient le goulot`, juste: x.posteSeul.ventesGagnees !== x.sans.refusees, retour: `Bon pari. ${voir}` },
          { texte: `${qte(quatre)} : ${qte(x.machine.capaciteEnPlus)} de plus à chaque trimestre`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-atelier",
      type: "simulation",
      titre: "Le laboratoire de l'atelier",
      notions: ["capacity", "discounting", "irr_payback"],
      question: (c) => {
        const x = croissance(c);
        return `Choisissez la machine, l'embauche, la hausse de la demande de N + 1 (gardée toute la durée de la machine) et le taux d'actualisation. Le tableau suit l'outil, l'équipe, les ventes gagnées et ce que l'année y gagne ; la dernière ligne est la VAN, ce que la machine rapporte sur ${qte(x.machine.dureeEnAnnees)} ans, actualisé, moins ce qu'elle coûte au départ : la suite du chapitre la fait calculer. Le graphique suit la VAN selon la demande, avec et sans l'opérateur.`;
      },
      leviers: (c) => {
        const x = croissance(c);
        const f = x.f;
        return [
          {
            code: "machine",
            libelle: "Machine achetée",
            unite: "",
            min: MACHINES_DU_LABORATOIRE[0]!.valeur,
            max: MACHINES_DU_LABORATOIRE.at(-1)!.valeur,
            pas: 1,
            depart: MACHINES_DU_LABORATOIRE[0]!.valeur,
            choix: MACHINES_DU_LABORATOIRE.map((m) => ({ valeur: m.valeur, libelle: machineDe(f, m.code).nom })),
          },
          {
            code: "embauches",
            libelle: "Embauche",
            unite: "",
            min: 0,
            max: x.machine.embauches,
            pas: 1,
            depart: x.machine.embauches,
            choix: [
              { valeur: 0, libelle: "Sans embauche" },
              { valeur: x.machine.embauches, libelle: `Avec ${qte(x.machine.embauches)} opérateur de plus` },
            ],
          },
          { code: "hausse", libelle: "Hausse de la demande de N + 1", unite: "%", ...HAUSSE_DU_LABORATOIRE, depart: 0 },
          { code: "taux", libelle: "Taux d'actualisation", unite: "%", ...TAUX_DU_LABORATOIRE, depart: auCentime(f.investissement.tauxDActualisation * 100) },
        ];
      },
      lecture: (c, p) => {
        const x = croissance(c);
        const r = machineDuLaboratoire(c, p);
        const d = x.poste;
        return [
          { libelle: "Capacité de l'outil, par trimestre", montant: r.capaciteOutil, unite: x.f.unites, reference: d.capaciteOutil },
          { libelle: "Capacité de l'équipe, par trimestre", montant: r.capaciteEquipe, unite: x.f.unites, reference: d.capaciteEquipe },
          { libelle: "Ventes gagnées sur l'année", montant: r.ventesGagnees, unite: x.f.unites, reference: d.ventesGagnees },
          { libelle: "Marge gagnée", montant: r.margeGagnee, reference: d.margeGagnee, effet: true },
          { libelle: "Charges de l'année (amortissement, intérêts, salaires, entretien)", montant: -r.charges, reference: -d.charges, effet: true },
          { libelle: "Résultat gagné de l'année", montant: r.resultatGagne, reference: d.resultatGagne, effet: true, fort: true },
          { libelle: "VAN de la machine", montant: r.van, reference: d.van, effet: true, fort: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      // La VAN selon la demande n'est pas une droite : elle plafonne quand l'équipe, puis l'outil
      // agrandi, bornent à leur tour ; avec et sans l'opérateur, les deux courbes se croisent.
      graphique: (c) => {
        const x = croissance(c);
        return {
          levier: "hausse",
          courbes: [
            { libelle: "VAN avec l'opérateur", valeur: (p) => machineDuLaboratoire(c, p, x.machine.embauches).van + 0 },
            { libelle: "VAN sans embauche", valeur: (p) => machineDuLaboratoire(c, p, 0).van + 0 },
          ],
        };
      },
      defi: (c) => {
        const x = croissance(c);
        const taux = auCentime(x.f.investissement.tauxDActualisation * 100);
        return {
          consigne: `Sur la demande prévue de N + 1, sans hausse, et au taux de ${qte(taux)} %, faites gagner du résultat à ${x.f.entreprise} dès l'année N + 1, avec une VAN positive.`,
          atteint: (p) => {
            if (p.hausse !== 0 || p.taux !== taux) return false;
            const r = machineDuLaboratoire(c, p);
            return r.resultatGagne > 0 && r.van > 0;
          },
          indice: (p) => {
            const r = machineDuLaboratoire(c, p);
            if (p.hausse !== 0) return "Le défi se joue sur la demande prévue : remettez la hausse à 0 %. Une hausse est un pari, pas une prévision.";
            if (p.taux !== taux) return `Gardez le taux que ${x.f.entreprise} attend de sa croissance, ${qte(taux)} % : baisser le taux n'ajoute pas une vente.`;
            if (r.machine.code !== "poste-manuel")
              return `${r.machine.nom} vend ${qte(r.ventesGagnees)} ${x.f.unites} de plus, pas une de plus que ce que l'outil refusait, et coûte ${eur(r.charges)} sur l'année : la demande plafonne, pas l'outil.`;
            return `Avec l'opérateur, l'équipe monte à ${qte(r.capaciteEquipe)} et ${x.f.entreprise} sert toute la demande, mais son salaire, ${eur(r.salaires)}, pèse plus que la marge gagnée. Que borne la production sans lui ?`;
          },
          solution: { machine: MACHINES_DU_LABORATOIRE[0]!.valeur, embauches: 0, hausse: 0, taux },
        };
      },
      explication: (c, p) => {
        const x = croissance(c);
        const r = machineDuLaboratoire(c, p);
        const s = x.posteSeul;
        const parOperateur = x.poste.ventesGagnees - s.ventesGagnees;
        return [
          `Sans embauche, l'outil passe à ${qte(r.capaciteOutil)}, mais l'équipe reste à ${qte(r.capaciteEquipe)} : le goulot se déplace de l'outil à l'équipe, et ${x.f.entreprise} ne vend que ${qte(r.ventesGagnees)} ${x.f.unites} de plus. C'est peu, mais elles ne coûtent que la machine : le résultat de l'année gagne ${eur(r.resultatGagne)}, et la VAN vaut ${eur(r.van)}.`,
          `L'opérateur, lui, coûte ${eur(x.poste.salaires)} par an pour ${qte(parOperateur)} ventes de plus (${eur(auCentime(parOperateur * x.m))} de marge) : sur la demande prévue, c'est l'embauche liée qui fait perdre, pas la machine. Le graphique le montre : la courbe avec l'opérateur ne passe au-dessus qu'à partir de ${x.operateurPaie === null ? "aucune hausse" : pct(x.operateurPaie, 1)} de demande en plus. Et ${minuscule(machineDe(x.f, "ligne-automatisee").nom)} ne vend pas une ${x.f.unite} de plus que le poste sur la demande prévue : la demande plafonne, quelle que soit la machine.`,
        ];
      },
    },
    {
      id: "le-goulot-se-deplace",
      type: "montants",
      titre: "Le goulot se déplace",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const x = croissance(c);
        const o = x.f.operateurs;
        return `Le poste ajoute ${qte(x.machine.capaciteEnPlus)} ${x.f.unites} à l'outil (${qte(x.f.ligne.capaciteParTrimestre)} aujourd'hui). Un opérateur travaille ${qte(o.heuresParMois)} heures par mois, à ${qte(x.machine.heuresParEnceinte)} heure l'${x.f.unite} : ${qte(x.enceintesParOperateur / 3)} par mois, ${qte(x.enceintesParOperateur)} par trimestre. Calculez la capacité de l'outil avec le poste, les ventes gagnées sur l'année sans embauche (l'équipe reste à ${qte(x.sans.trimestres[0]!.capaciteEquipe)}), la capacité de l'équipe avec l'opérateur de plus, puis les ventes gagnées avec lui.`;
      },
      champs: (c) => {
        const x = croissance(c);
        const equipe = x.sans.trimestres[0]!.capaciteEquipe;
        return [
          { libelle: "Capacité de l'outil avec le poste", attendu: x.poste.capaciteOutil, calcul: `${qte(x.f.ligne.capaciteParTrimestre)} + ${qte(x.machine.capaciteEnPlus)} = ${qte(x.poste.capaciteOutil)}`, tolerance: 0 },
          { libelle: "Ventes gagnées sans embauche", attendu: x.posteSeul.ventesGagnees, calcul: `${ventesGagneesEcrites(x.posteSeul)} : l'équipe borne à ${qte(equipe)}`, tolerance: 0 },
          { libelle: "Capacité de l'équipe avec l'opérateur", attendu: x.poste.capaciteEquipe, calcul: `${qte(equipe)} + ${qte(x.enceintesParOperateur)} = ${qte(x.poste.capaciteEquipe)}`, tolerance: 0 },
          { libelle: "Ventes gagnées avec l'opérateur", attendu: x.poste.ventesGagnees, calcul: `${ventesGagneesEcrites(x.poste)} : la demande redevient le goulot`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const x = croissance(c);
        return [
          `Ajouter de l'outil déplace le goulot : sans embauche, l'équipe le devient, et le poste ne vend que ${qte(x.posteSeul.ventesGagnees)} ${x.f.unites} de plus. Avec l'opérateur, l'équipe monte à ${qte(x.poste.capaciteEquipe)}, l'outil à ${qte(x.poste.capaciteOutil)}, et c'est la demande qui borne : ${qte(x.poste.ventesGagnees)} ${x.f.unites}, toute la demande refusée, et pas une de plus. Une capacité ne se vend qu'avec des clients et des bras.`,
        ];
      },
    },
    {
      id: "les-charges-de-l-annee",
      type: "montants",
      titre: "Ce que coûtent la machine et son opérateur",
      notions: ["depreciation", "loan_schedule", "payroll"],
      question: (c) => {
        const x = croissance(c);
        const f = x.f;
        return `Le poste coûte ${eur(x.machine.prix)} et s'amortit en linéaire sur ${qte(x.machine.dureeEnAnnees)} ans. L'emprunt du même montant porte intérêt à ${pct(f.investissement.tauxDeLEmprunt)} sur le capital dû : la première année, tout le capital est dû. L'opérateur est payé ${eur(f.operateurs.salaireBrutMensuel)} bruts par mois, et ${f.entreprise} paie ${pct(f.operateurs.tauxDesCotisationsPatronales)} de cotisations patronales en plus. L'entretien du poste coûte ${eur(x.poste.entretien)} par an. Calculez l'amortissement de l'année, les intérêts de la première année, le coût de l'opérateur sur l'année, puis les charges de l'année.`;
      },
      champs: (c) => {
        const x = croissance(c);
        const f = x.f;
        const p = x.poste;
        return [
          { libelle: "Amortissement de l'année", attendu: p.amortissement, calcul: `${eur(x.machine.prix)} ÷ ${qte(x.machine.dureeEnAnnees)} = ${eur(p.amortissement)}` },
          { libelle: "Intérêts de la première année", attendu: p.interets, calcul: `${eur(x.machine.prix)} × ${pct(f.investissement.tauxDeLEmprunt)} = ${eur(p.interets)}` },
          {
            libelle: "Coût de l'opérateur sur l'année",
            attendu: p.salaires,
            calcul: `${eur(f.operateurs.salaireBrutMensuel)} × ${qte(1 + f.operateurs.tauxDesCotisationsPatronales)} × 12 = ${eur(p.salaires)}`,
          },
          {
            libelle: "Charges de l'année",
            attendu: p.charges,
            calcul: `${eur(p.amortissement)} + ${eur(p.interets)} + ${eur(p.salaires)} + ${eur(p.entretien)} = ${eur(p.charges)}`,
          },
        ];
      },
      explication: (c) => {
        const x = croissance(c);
        const p = x.poste;
        return [
          `La machine elle-même ne pèse que ${eur(auCentime(p.amortissement + p.interets))} sur l'année (amortissement et intérêts) ; avec son entretien, ${eur(auCentime(p.amortissement + p.interets + p.entretien))}. L'opérateur, ${eur(p.salaires)}, pèse plus que tout le reste : l'embauche liée est la vraie charge de cette croissance.`,
          `Le remboursement du capital, ${eur(x.emprunt[0]!.remboursement)} par an, n'est pas une charge : il sort de la trésorerie, pas du résultat.`,
        ];
      },
    },
    {
      id: "predire-le-point-mort",
      type: "choix",
      titre: "Pariez sur les ventes qu'il faut",
      notions: ["contribution_margin", "breakeven"],
      question: (c) => {
        const x = croissance(c);
        return `Le poste et son opérateur coûtent ${eur(x.poste.charges)} sur l'année. Pariez : combien d'${x.f.unites} vendues de plus, à ${eur(x.m)} de marge, faudrait-il pour que l'année n'y perde rien ?`;
      },
      options: (c) => {
        const x = croissance(c);
        const voir = "Déplacez le curseur à l'étape suivante : la marge gagnée y croise les charges de l'année.";
        const suffit = x.poste.ventesNecessaires <= x.sans.refusees;
        return [
          { texte: `Environ ${qte(x.ventesDeLaMachineSeule)} : de quoi payer l'amortissement et les intérêts`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Environ ${qte(Math.round(x.poste.ventesNecessaires / 100) * 100)} : plus que la demande refusée`, juste: !suffit, retour: `${suffit ? "Pari à vérifier." : "Bon pari."} ${voir}` },
          { texte: `${qte(x.sans.refusees)} : la demande refusée suffit`, juste: suffit, retour: `${suffit ? "Bon pari." : "Pari à vérifier."} ${voir}` },
        ];
      },
    },
    {
      id: "le-point-mort-de-la-machine",
      type: "curseur",
      titre: "Les ventes qui paient l'année",
      notions: ["contribution_margin", "breakeven"],
      question: (c) => {
        const x = croissance(c);
        return `Faites varier les ventes gagnées sur l'année, de ${qte(VENTES_DU_CURSEUR.min)} à ${qte(VENTES_DU_CURSEUR.max)} ${x.f.unites}. Une droite donne la marge qu'elles laissent (${eur(x.m)} l'${x.f.unite}), l'autre les charges de l'année du poste et de son opérateur (${eur(x.poste.charges)}). Placez le curseur sur le plus petit nombre de ventes où la marge couvre les charges, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Ventes gagnées sur l'année", unite: ficheDe(c).unites }),
      cible: (c) => {
        const x = croissance(c);
        return { attendu: x.poste.ventesNecessaires, min: VENTES_DU_CURSEUR.min, max: VENTES_DU_CURSEUR.max };
      },
      zones: ["Résultat gagné", "Résultat perdu"],
      rates: () => ({
        dessous: "À cette position, la marge gagnée ne couvre pas les charges de l'année : l'année y perd.",
        dessus: "Moins de ventes couvrent encore les charges : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le point mort",
      lecture: (c, q) => {
        const x = croissance(c);
        const marge = auCentime(q * x.m);
        return [
          { libelle: "Marge gagnée", montant: marge },
          { libelle: "Charges de l'année", montant: x.poste.charges },
          { libelle: "Résultat gagné de l'année", montant: auCentime(marge - x.poste.charges), fort: true },
        ];
      },
      droites: (c) => {
        const x = croissance(c);
        return { produit: (q) => q * x.m, cout: () => x.poste.charges, libelles: ["Marge des ventes gagnées", "Charges du poste et de son opérateur"] };
      },
      explication: (c) => {
        const x = croissance(c);
        return [
          `Il faut ${qte(x.poste.ventesNecessaires)} ventes gagnées pour que l'année n'y perde rien ; la demande de N + 1 n'en refuse que ${qte(x.sans.refusees)}. Même en servant toute la demande, le poste et son opérateur font perdre de l'argent à l'année.`,
          `Sans l'opérateur, ${qte(x.ventesDeLaMachineSeule)} ventes paieraient l'amortissement et les intérêts : c'est le salaire qui place le point mort si haut. L'étape suivante le chiffre.`,
        ];
      },
    },
    {
      id: "le-resultat-gagne",
      type: "montants",
      titre: "Le résultat que l'année y gagne",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => {
        const x = croissance(c);
        return `Sans formule cette fois. Avec son opérateur, le poste fait vendre ${qte(x.poste.ventesGagnees)} ${x.f.unites} de plus en N + 1. Calculez la marge gagnée, le résultat que l'année y gagne (avant impôt), la part de l'opérateur dans les charges de l'année (en %), et les ventes gagnées qui rendraient ce résultat nul.`;
      },
      champs: (c) => {
        const x = croissance(c);
        const p = x.poste;
        return [
          { libelle: "Marge gagnée", attendu: p.margeGagnee, calcul: `${qte(p.ventesGagnees)} × ${eur(x.m)} = ${eur(p.margeGagnee)}` },
          { libelle: "Résultat gagné de l'année", attendu: p.resultatGagne, calcul: `${eur(p.margeGagnee)} − ${eur(p.charges)} = ${eur(p.resultatGagne)}` },
          { libelle: "Part de l'opérateur dans les charges (%)", attendu: x.partDeLOperateur, calcul: `${eur(p.salaires)} ÷ ${eur(p.charges)} × 100 = ${qte(x.partDeLOperateur)} %`, tolerance: 0.1 },
          { libelle: "Ventes gagnées qui rendent le résultat nul", attendu: p.ventesNecessaires, calcul: `${eur(p.charges)} ÷ ${eur(x.m)} = ${qte(auCentime(p.charges / x.m))}, soit ${qte(p.ventesNecessaires)} à l'${x.f.unite} supérieure`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const x = croissance(c);
        const p = x.poste;
        return [
          `L'année ${p.resultatGagne >= 0 ? `gagne ${eur(p.resultatGagne)}` : `perd ${eur(-p.resultatGagne)}`} : la marge gagnée, ${eur(p.margeGagnee)}, ne couvre pas les ${eur(p.charges)} de charges, dont ${qte(x.partDeLOperateur)} % pour l'opérateur. Les ${qte(p.ventesNecessaires)} ventes qu'il faudrait, la demande prévue ne les donne pas.`,
          "Mais un résultat d'une année ne juge pas un investissement qui dure : il faut regarder ses flux, sur toute sa durée.",
        ];
      },
    },
    {
      id: "les-flux-et-la-van",
      type: "montants",
      titre: "Les flux et la VAN",
      notions: ["discounting", "irr_payback"],
      question: (c) => {
        const x = croissance(c);
        const p = x.poste;
        return `On juge un investissement sur l'argent qu'il fait entrer et sortir. Investissement du départ = prix + ${eur(x.f.personnel.coutDUnRecrutement)} de recrutement. Flux de chaque année = (marge gagnée − salaire − entretien − amortissement) × (1 − ${pct(x.impot)}) + amortissement ; les intérêts n'y entrent pas. La demande reste celle de N + 1 pendant ${qte(x.machine.dureeEnAnnees)} ans : le flux est le même chaque année, et VAN = − investissement + flux × ${facteurEcrit(p.facteurDActualisation)} (le facteur d'actualisation de ${qte(x.machine.dureeEnAnnees)} ans à ${pct(p.tauxDActualisation)}). Calculez l'investissement du départ, le flux de chaque année et la VAN du poste avec son opérateur.`;
      },
      champs: (c) => {
        const x = croissance(c);
        const p = x.poste;
        return [
          { libelle: "Investissement du départ", attendu: p.investissement, calcul: `${eur(x.machine.prix)} + ${eur(p.recrutements)} = ${eur(p.investissement)}` },
          { libelle: "Flux de chaque année", attendu: p.fluxAnnuel, calcul: fluxEcrit(x, p), tolerance: 0.5 },
          // L'élève qui garde le facteur à quatre décimales tombe à quelques dizaines de centimes.
          { libelle: "VAN du poste avec son opérateur", attendu: p.van, calcul: vanEcrite(p), tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = croissance(c);
        const p = x.poste;
        return [
          p.fluxAnnuel <= 0
            ? `Le flux de chaque année est négatif, ${eur(p.fluxAnnuel)} : la machine et son opérateur font sortir plus d'argent qu'ils n'en font entrer, même après l'économie d'impôt. Il n'y a pas de délai de récupération, et la VAN, ${eur(p.van)}, dit ce que l'investissement détruit de valeur.`
            : `Le flux de chaque année vaut ${eur(p.fluxAnnuel)}, et la VAN ${eur(p.van)}.`,
          `L'amortissement n'est pas une sortie d'argent : il ne compte que par l'impôt qu'il fait économiser, d'où son retour dans le flux. Les intérêts, eux, sont déjà dans le taux de ${pct(p.tauxDActualisation)} : une étape d'expert y revient.`,
        ];
      },
    },
    {
      id: "la-van-du-poste-seul",
      type: "montants",
      titre: "La VAN du poste seul",
      notions: ["discounting", "irr_payback", "capacity"],
      question: (c) => {
        const x = croissance(c);
        return `Le laboratoire l'a montré : sans embauche, le poste ne vend que ${qte(x.posteSeul.ventesGagnees)} ${x.f.unites} de plus. Sans formule cette fois, calculez l'investissement du départ, le flux de chaque année, la VAN et le délai de récupération (en années) du poste seul.`;
      },
      champs: (c) => {
        const x = croissance(c);
        const s = x.posteSeul;
        return [
          { libelle: "Investissement du départ, sans recrutement", attendu: s.investissement, calcul: `${eur(x.machine.prix)}, sans recrutement` },
          { libelle: "Flux de chaque année du poste seul", attendu: s.fluxAnnuel, calcul: `${qte(s.ventesGagnees)} × ${eur(x.m)} = ${eur(s.margeGagnee)} de marge ; ${fluxEcrit(x, s)}`, tolerance: 0.5 },
          { libelle: "VAN du poste seul", attendu: s.van, calcul: vanEcrite(s), tolerance: 1 },
          {
            libelle: "Délai de récupération (années)",
            attendu: auCentime(s.delaiDeRecuperation ?? 0),
            calcul: `${eur(s.investissement)} ÷ ${eur(s.fluxAnnuel)} = ${qte(auCentime(s.delaiDeRecuperation ?? 0))} ans`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = croissance(c);
        const s = x.posteSeul;
        return [
          `Le poste seul crée un peu de valeur, ${eur(s.van)}, et se récupère en ${ans(s.delaiDeRecuperation ?? 0)} sur ${qte(x.machine.dureeEnAnnees)}. C'est mince : un taux un peu plus haut l'effacerait. Mais il dit l'essentiel : la machine n'est pas ce qui fait perdre ; l'opérateur, oui, tant que la demande ne monte pas.`,
          `Deux décisions se jugent donc à part : acheter le poste, puis embaucher. L'embauche ne se paie que si les ventes qu'elle permet en plus couvrent son salaire.`,
        ];
      },
    },
    {
      id: "predire-la-hausse",
      type: "choix",
      titre: "Pariez sur la demande",
      notions: ["discounting", "demand_market_share"],
      question: (c) => {
        const x = croissance(c);
        return `Avec son opérateur, le poste a une VAN de ${eur(x.poste.van)} sur la demande prévue. Pariez : de combien la demande de chaque trimestre devrait-elle monter, et le rester ${qte(x.machine.dureeEnAnnees)} ans, pour que cette VAN devienne positive ?`;
      },
      options: (c) => {
        const x = croissance(c);
        const h = x.hausseNulle;
        const voir = "Déplacez le curseur à l'étape suivante : la VAN y suit la demande.";
        return [
          { texte: "D'environ 5 %", juste: h !== null && h <= 0.1, retour: `${h !== null && h <= 0.1 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "D'environ 25 %", juste: h !== null && h > 0.1, retour: `${h !== null && h > 0.1 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Aucune hausse n'y suffit : le salaire pèse trop", juste: h === null, retour: `${h === null ? "Bon pari." : "Pari à vérifier."} ${voir}` },
        ];
      },
    },
    {
      id: "la-hausse-qui-annule-la-van",
      type: "curseur",
      titre: "La hausse qui annule la VAN",
      notions: ["discounting", "demand_market_share"],
      question: (c) => {
        const x = croissance(c);
        return `Faites monter la demande de chaque trimestre de N + 1, de ${qte(HAUSSE_DU_CURSEUR.min)} à ${qte(HAUSSE_DU_CURSEUR.max)} ‰ (pour mille), gardée ${qte(x.machine.dureeEnAnnees)} ans. Une droite donne les flux du poste et de son opérateur, actualisés sur sa durée ; l'autre, l'investissement du départ (${eur(x.poste.investissement)}). Placez le curseur sur la plus petite hausse où les flux actualisés couvrent l'investissement, puis validez.`;
      },
      grandeur: () => ({ libelle: "Hausse de la demande de N + 1", unite: "‰" }),
      cible: (c) => {
        const x = croissance(c);
        return { attendu: Math.round((x.hausseNulle ?? 0) * 1000), min: HAUSSE_DU_CURSEUR.min, max: HAUSSE_DU_CURSEUR.max };
      },
      zones: ["VAN positive", "VAN négative"],
      rates: () => ({
        dessous: "À cette hausse, les flux actualisés ne couvrent pas l'investissement : la VAN reste négative.",
        dessus: "Une hausse plus petite rend déjà la VAN positive : cherchez la plus petite.",
      }),
      montrer: "Montrer la hausse",
      lecture: (c, h) => {
        const r = machineEnPlus(ficheDe(c), "poste-manuel", { hausseDeLaDemande: h / 1000 });
        return [
          { libelle: "Marge gagnée sur l'année", montant: r.margeGagnee },
          { libelle: "Flux de chaque année", montant: r.fluxAnnuel },
          { libelle: "Flux actualisés sur la durée", montant: auCentime(r.van + r.investissement) },
          { libelle: "VAN du poste avec son opérateur", montant: r.van, fort: true },
        ];
      },
      droites: (c) => {
        const f = ficheDe(c);
        const r = (h: number) => machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: h / 1000 });
        return {
          produit: (h) => r(h).van + r(h).investissement,
          cout: (h) => r(h).investissement,
          libelles: ["Flux actualisés du poste et de son opérateur", "Investissement du départ"],
        };
      },
      explication: (c) => {
        const x = croissance(c);
        const h = x.hausseNulle ?? 0;
        return [
          `La VAN s'annule à ${qte(Math.round(h * 1000))} ‰, soit ${pct(h, 1)} de demande en plus, gardée ${qte(x.machine.dureeEnAnnees)} ans. Chaque point de hausse ne fait vendre qu'aux trimestres où l'outil bornait, ${x.goulots.map((t) => `T${t.trimestre}`).join(" et ")} : ${qte(x.demandeDesGoulots)} ${x.f.unites} de demande, donc environ ${qte(Math.round(x.demandeDesGoulots / 100))} ventes de plus par point.`,
          `De ${eur(x.poste.van)} à zéro pour quelques points de demande : la VAN dépend de la demande bien plus que de la machine. Le calcul à rebours le refait sans curseur.`,
        ];
      },
    },
    {
      id: "a-plus-cinq",
      type: "montants",
      titre: `Variante : la demande monte de ${pct(HAUSSE_DE_LA_VARIANTE, 1)}`,
      notions: ["discounting", "irr_payback", "capacity"],
      question: (c) => {
        const x = croissance(c);
        return `Variante : la demande de chaque trimestre de N + 1 monte de ${pct(HAUSSE_DE_LA_VARIANTE, 1)}, et le reste ${qte(x.machine.dureeEnAnnees)} ans. Refaites le raisonnement pour le poste et son opérateur : les ventes gagnées sur l'année (trimestre par trimestre, la demande arrondie à l'${x.f.unite}), le flux de chaque année, la VAN et le délai de récupération (en années).`;
      },
      champs: (c) => {
        const x = croissance(c);
        const v = x.variante;
        const demandes = v.trimestres.map((t) => qte(t.demande)).join(", ");
        return [
          {
            libelle: "Ventes gagnées sur l'année",
            attendu: v.ventesGagnees,
            calcul: `Demande ${demandes} ; sans le poste, l'outil borne à ${qte(x.f.ligne.capaciteParTrimestre)} ; avec lui, toute la demande est servie : ${ventesGagneesEcrites(v)}`,
            tolerance: 0,
          },
          { libelle: `Flux de chaque année à ${pct(HAUSSE_DE_LA_VARIANTE, 1)}`, attendu: v.fluxAnnuel, calcul: `${qte(v.ventesGagnees)} × ${eur(x.m)} = ${eur(v.margeGagnee)} ; ${fluxEcrit(x, v)}`, tolerance: 0.5 },
          { libelle: `VAN à ${pct(HAUSSE_DE_LA_VARIANTE, 1)}`, attendu: v.van, calcul: vanEcrite(v), tolerance: 1 },
          {
            libelle: `Délai de récupération à ${pct(HAUSSE_DE_LA_VARIANTE, 1)} (années)`,
            attendu: auCentime(v.delaiDeRecuperation ?? 0),
            calcul: `${eur(v.investissement)} ÷ ${eur(v.fluxAnnuel)} = ${qte(auCentime(v.delaiDeRecuperation ?? 0))} ans`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = croissance(c);
        const v = x.variante;
        return [
          `À ${pct(HAUSSE_DE_LA_VARIANTE, 1)} de plus, le poste et son opérateur vendent ${qte(v.ventesGagnees)} ${x.f.unites} de plus au lieu de ${qte(x.poste.ventesGagnees)}, et la VAN passe de ${eur(x.poste.van)} à ${eur(v.van)} : positive, de peu. Le délai de récupération, ${ans(v.delaiDeRecuperation ?? 0)}, reste sous les ${qte(x.machine.dureeEnAnnees)} ans de la machine, mais il ne dit pas la valeur créée : seule la VAN la dit.`,
          `Au même point, le poste seul aurait encore une VAN de ${eur(x.posteSeul.van)}, meilleure : l'opérateur ne se paie qu'à partir de ${x.operateurPaie === null ? "aucune hausse" : pct(x.operateurPaie, 1)} de demande en plus.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "De la VAN nulle à la demande, à rebours",
      notions: ["discounting", "breakeven"],
      question: (c) => {
        const x = croissance(c);
        return `Sans curseur cette fois. La VAN du poste et de son opérateur est nulle quand ses flux actualisés égalent l'investissement du départ, ${eur(x.poste.investissement)}. Remontez : le flux de chaque année qui annule la VAN (au facteur de ${facteurEcrit(x.poste.facteurDActualisation)}), les ventes gagnées par an qu'il demande (à l'${x.f.unite} supérieure), puis la hausse de la demande qui les donne (en %).`;
      },
      champs: (c) => {
        const x = croissance(c);
        const p = x.poste;
        return [
          { libelle: "Flux de chaque année qui annule la VAN", attendu: x.fluxQuiAnnule, calcul: `${eur(p.investissement)} ÷ ${facteurEcrit(p.facteurDActualisation)} = ${eur(x.fluxQuiAnnule)}`, tolerance: 0.5 },
          {
            libelle: "Ventes gagnées par an qui annulent la VAN",
            attendu: x.ventesQuiAnnulent,
            calcul: `(${eur(x.fluxQuiAnnule)} − ${eur(p.amortissement)}) ÷ ${qte(1 - x.impot)} = ${eur(x.resultatQuiAnnule)} de résultat avant impôt ; (${eur(x.resultatQuiAnnule)} + ${eur(p.salaires)} + ${eur(p.entretien)} + ${eur(p.amortissement)}) ÷ ${eur(x.m)} = ${qte(auCentime((x.resultatQuiAnnule + p.salaires + p.entretien + p.amortissement) / x.m))}, soit ${qte(x.ventesQuiAnnulent)}`,
            tolerance: 0,
          },
          {
            libelle: "Hausse de la demande qui annule la VAN (%)",
            attendu: x.hausseARebours,
            calcul: `Seuls les trimestres où l'outil bornait gagnent des ventes : (${qte(x.ventesQuiAnnulent)} − ${qte(p.ventesGagnees)}) ÷ (${x.goulots.map((t) => qte(t.demande)).join(" + ")}) × 100 = ${qte(x.hausseARebours)} %`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const x = croissance(c);
        return [
          `Le rebours retrouve la hausse du curseur, ${qte(x.hausseARebours)} %. Il demande de savoir d'où viennent les ventes : une hausse de la demande ne fait vendre que là où l'outil était le goulot, et les trimestres où il avait du jeu n'y gagnent rien, tant que leur demande reste sous la capacité de la ligne.`,
          `Remonter de la VAN nulle à une demande, c'est poser la vraie question de la croissance : ${x.f.entreprise} croit-elle à ${qte(x.hausseARebours)} % de demande en plus, chaque année, pendant ${qte(x.machine.dureeEnAnnees)} ans ?`,
        ];
      },
    },
    {
      id: "les-interets",
      type: "choix",
      titre: "Les intérêts et la VAN",
      notions: ["loan_schedule", "discounting"],
      tableau: (c) => tableauDeLEmprunt(croissance(c)),
      question: (c) => {
        const x = croissance(c);
        return `Le poste est payé par un emprunt : ${eur(x.emprunt[0]!.interets)} d'intérêts la première année, puis de moins en moins. Un collègue veut les retrancher des flux de la VAN. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = croissance(c);
        const total = auCentime(somme(x.emprunt.map((l) => l.interets)));
        return [
          {
            texte: `Non : le taux de ${pct(x.poste.tauxDActualisation)} rémunère déjà l'argent engagé, emprunté ou non`,
            juste: true,
            retour: `Oui. Actualiser à ${pct(x.poste.tauxDActualisation)}, c'est déjà demander à chaque euro engagé de rapporter ce qu'il coûte. Retrancher les intérêts (${eur(total)} sur ${qte(x.machine.dureeEnAnnees)} ans) compterait deux fois le coût de l'argent. Ils changent le résultat de l'année (le résultat gagné de N + 1, ${eur(x.poste.resultatGagne)}, compte les ${eur(x.emprunt[0]!.interets)} de la première année), pas la VAN : le financement se juge à part.`,
          },
          {
            texte: "Oui : ce sont des charges, elles baissent le résultat de chaque année",
            juste: false,
            retour: `Non : le résultat n'est pas le flux. Les intérêts sont bien des charges, mais la VAN actualise les flux au taux de ${pct(x.poste.tauxDActualisation)}, qui rémunère déjà l'argent engagé : les retrancher, c'est payer deux fois le même argent.`,
          },
          {
            texte: "Oui : il faut retrancher toute l'annuité, intérêts et capital remboursé",
            juste: false,
            retour: `Non : le capital remboursé, ${eur(x.emprunt[0]!.remboursement)} par an, rend l'argent prêté ; l'investissement du départ compte déjà la machine entière. Le retrancher, c'est compter la machine deux fois, et les intérêts aussi.`,
          },
        ];
      },
    },
    {
      id: "la-rentabilite-d-une-annee",
      type: "choix",
      titre: "Un ratio qui n'est pas une rentabilité",
      notions: ["profitability_vs_return", "irr_payback"],
      question: (c) => {
        const x = croissance(c);
        const k = x.critique;
        return `À ${pct(HAUSSE_DE_LA_CRITIQUE, 1)} de demande en plus, le poste et son opérateur font gagner ${eur(k.resultatGagne)} de résultat la première année. Un collègue en tire une « rentabilité » : ${eur(k.resultatGagne)} ÷ ${eur(x.machine.prix)} = ${qte(x.rentabiliteDuCollegue)} %, bien au-dessus des ${pct(x.f.investissement.tauxDeLEmprunt)} de l'emprunt. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = croissance(c);
        const k = x.critique;
        const caf = auCentime(k.fluxAnnuel);
        return [
          {
            texte: "Ce ratio ne juge rien : seule la VAN compte tous les flux de la durée, actualisés",
            juste: true,
            retour: `Oui. À ${pct(HAUSSE_DE_LA_CRITIQUE, 1)}, la VAN vaut ${eur(k.van)}, et le poste se récupère en ${ans(k.delaiDeRecuperation ?? 0)}. Le ratio du collègue rapporte un résultat comptable d'une seule année (amortissement et intérêts compris, avant impôt) au seul prix : il oublie le recrutement, la durée de ${qte(x.machine.dureeEnAnnees)} ans, le moment où l'argent rentre et ce que l'argent coûte. Il dirait la même chose d'une machine qui ne durerait qu'un an.`,
          },
          {
            texte: "Il a raison : un investissement paie dès que ce ratio dépasse le taux de l'emprunt",
            juste: false,
            retour: `Non : comparer un ratio d'une année au taux de l'emprunt ne dit pas si l'investissement crée de la valeur sur sa durée. C'est la VAN qui le dit, ${eur(k.van)} ici, au taux de ${pct(k.tauxDActualisation)} que ${x.f.entreprise} attend de sa croissance, pas à celui de sa banque.`,
          },
          {
            texte: `Il faut y mettre le flux de l'année, ${eur(caf)}, au lieu du résultat, puis comparer au taux de l'emprunt`,
            juste: false,
            retour: `Non : le flux rapporté au prix n'est que l'inverse d'un délai de récupération. Il ignore toujours la durée et l'actualisation ; c'est la somme des flux actualisés, moins l'investissement entier (${eur(k.investissement)}), qui juge.`,
          },
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "Acheter le poste ?",
      notions: ["capacity", "discounting", "irr_payback"],
      question: (c) => {
        const x = croissance(c);
        return `La direction vous demande s'il faut acheter ${minuscule(x.machine.nom)} et embaucher son opérateur, sur la demande prévue de N + 1. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = croissance(c);
        const p = x.poste;
        const h = x.hausseNulle;
        return [
          {
            texte: `Pas sur la demande prévue : avec son opérateur, il lui faut ${h === null ? "plus de demande qu'il n'y en aura" : `${pct(h, 1)} de demande en plus`}, chaque année`,
            juste: x.verdict === "attendre-la-demande",
            retour:
              x.verdict === "attendre-la-demande"
                ? `Oui. Sur la demande prévue, la VAN vaut ${eur(p.van)} : l'opérateur coûte ${eur(p.salaires)} par an, plus que ce que les ventes refusées rapportent (${eur(p.margeGagnee)}). Le poste ne paie qu'à ${pct(h ?? 0, 1)} de demande en plus, gardée ${qte(x.machine.dureeEnAnnees)} ans ; le poste seul, sans embauche, ne crée que ${eur(x.posteSeul.van)}. La décision tient à un pari sur la demande, et c'est lui qu'il faut étayer.`
                : `Non : la VAN du poste avec son opérateur vaut ${eur(p.van)}.`,
          },
          {
            texte: `Oui : la marge refusée, ${eur(x.sans.margeRefusee)}, paie le poste, ${eur(x.machine.prix)}, dès la première année`,
            juste: false,
            retour: `Non : c'est comparer une marge à un prix, et oublier ce qui va avec la machine. L'opérateur coûte ${eur(p.salaires)} par an : avec lui, les charges de l'année font ${eur(p.charges)}, et l'année perd ${eur(-p.resultatGagne)}.`,
          },
          {
            texte: `Oui : la marge gagnée, ${eur(p.margeGagnee)}, couvre largement l'amortissement et les intérêts`,
            juste: x.verdict === "acheter-avec-l-operateur",
            retour:
              x.verdict === "acheter-avec-l-operateur"
                ? `Oui : la VAN vaut ${eur(p.van)}.`
                : `Non : c'est oublier l'embauche liée. Sans opérateur, le poste ne vend que ${qte(x.posteSeul.ventesGagnees)} ${x.f.unites} de plus ; avec lui, son salaire (${eur(p.salaires)}) fait passer les charges de l'année à ${eur(p.charges)}.`,
          },
          {
            texte: "Non : jamais une machine dont la première année perd de l'argent",
            juste: x.verdict === "ne-pas-acheter",
            retour:
              x.verdict === "ne-pas-acheter"
                ? "Oui : aucune hausse de la demande ne la rend rentable."
                : `Non : une première année en perte ne condamne pas un investissement. À ${pct(HAUSSE_DE_LA_CRITIQUE, 1)} de demande en plus, la VAN vaudrait ${eur(x.critique.van)}. C'est la demande qu'il faut juger, pas l'année.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "discounting", "irr_payback"],
      texte: (c) => {
        const x = croissance(c);
        const p = x.poste;
        return [
          `Chez ${x.f.entreprise}, l'outil refuse ${qte(x.sans.refusees)} ${x.f.unites} en N + 1, ${eur(x.sans.margeRefusee)} de marge. ${x.machine.nom} les sert toutes, à condition d'embaucher : sans opérateur, le goulot passe à l'équipe, et il n'en sert que ${qte(x.posteSeul.ventesGagnees)}.`,
          `Une croissance par l'investissement se juge en trois questions. La capacité est-elle le goulot, et que devient-il ensuite ? Quelle embauche va avec ? La VAN, sur toute la durée, est-elle positive ? Ici, le poste et son opérateur coûtent ${eur(p.charges)} par an, dont ${eur(p.salaires)} de salaire : sur la demande prévue, leur VAN vaut ${eur(p.van)}, et elle devient positive à ${pct(x.hausseNulle ?? 0, 1)} de demande en plus, gardée ${qte(x.machine.dureeEnAnnees)} ans. La VAN dépend de la demande bien plus que de la machine. Les intérêts changent le résultat de l'année, pas la VAN, et un résultat d'une année rapporté au prix n'est pas une rentabilité.`,
          "Au niveau de l'examen, vous savez dire ce qui borne une production, chiffrer les charges d'un investissement et de l'embauche qui va avec, calculer ses flux, sa VAN et son délai de récupération, remonter de la VAN nulle aux ventes et à la hausse de la demande qu'elle exige, et critiquer un ratio qui n'en est pas un.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "VAN = − investissement + flux × (1 − (1 + i)^−n) ÷ i, avec flux = (marge gagnée − charges décaissées − amortissement) × (1 − taux d'impôt) + amortissement, sans les intérêts. Délai de récupération = investissement ÷ flux de chaque année.",
    },
  ],
};
