import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { controleBudgetaire } from "../monde/ecarts";
import { USINES_DU_COURS, type FicheDeLUsine, type ModeleDeNova } from "../monde/nova-usine";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES ÉCARTS SUR CHARGES INDIRECTES : BUDGET, ACTIVITÉ, RENDEMENT (contrôle de gestion,
 * palier 4 ; BTS CG, DCG UE11, BUT GEA et GACO).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'usine de NOVA
 * a une fiche figée (monde/nova-usine.ts) et le contrôle budgétaire se calcule par le modèle du cours
 * (monde/ecarts.ts, `controleBudgetaire`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : le centre de montage, seul centre d'analyse de l'usine, dont l'unité d'œuvre est
 * l'heure-machine. Son écart global (coût réel − coût préétabli de la production réelle) se partage
 * en trois : l'écart sur budget (réel − budget flexible de l'activité réelle), l'écart sur activité
 * (budget flexible − coût préétabli de l'activité réelle : les charges fixes mieux ou moins bien
 * absorbées) et l'écart sur rendement (heures réelles − heures préétablies de la production réelle,
 * au coût standard de l'heure). Puis l'imputation rationnelle, qui chiffre le même effet de
 * l'activité par le coefficient activité réelle ÷ activité normale.
 *
 * Le piège central : un écart sur activité favorable n'est pas une économie. Le centre a dépensé
 * ses charges fixes ; elles se sont réparties sur plus d'heures. Et ces heures en plus ont été en
 * grande partie perdues : l'écart sur rendement le dit, et une même heure de trop pèse sur les
 * deux écarts à la fois.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, l-heure-machine, activite-preetablie, ecart-global, la-bonne-reference,
 *     ecart-sur-budget (la formule est au repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-l-activite
 *     puis faire-tourner-le-centre (un curseur sur les heures-machine, le coût imputé face au budget
 *     flexible, qui se croisent à l'activité normale) avant activite-et-rendement ; jusqu-ou-tourner
 *     (le plus d'heures que le centre pouvait tourner sans dépasser le coût préétabli de la production
 *     réelle) avant les-heures-perdues ;
 *   · autonome : activite-et-rendement, imputation-rationnelle, le-boni-de-suractivite (ni formule
 *     ni chiffres donnés ; le calcul de la correction montre le chemin) ;
 *   · expert : les-heures-perdues et ce-que-coute-une-heure-perdue (l'interdépendance de l'activité
 *     et du rendement), en-sous-activite (une variante chiffrée, le tableau complet du centre),
 *     a-rebours (retrouver l'activité réelle et le coût réel à partir de deux écarts) ; avant la
 *     variante, le-laboratoire-du-centre (heures-machine et coût réel : annuler le rendement et le
 *     budget laisse un écart sur activité, la tension entre activité normale et rendement) ; puis
 *     qui-doit-agir et la synthèse.
 */

/**
 * LA VARIANTE EN SOUS-ACTIVITÉ, hypothèse du cours : un autre trimestre où le centre tourne sous son
 * activité normale. L'usine fabrique 10 000 Nomade et 4 000 Salon (4 500 heures-machine préétablies),
 * le centre tourne 4 600 heures-machine et coûte 198 000 €. Elle se calcule sur la fiche, dont seul le
 * réel change : les standards, le budget et l'activité normale restent ceux de l'usine.
 */
export const VARIANTE_EN_SOUS_ACTIVITE: {
  heuresMachine: number;
  cout: number;
  production: Readonly<Record<ModeleDeNova["code"], number>>;
} = {
  heuresMachine: 4_600,
  cout: 198_000,
  production: { nomade: 10_000, salon: 4_000 },
};

/**
 * LE CALCUL À REBOURS, hypothèse du cours : au trimestre suivant, le contrôleur n'a reçu que deux
 * écarts du centre, un écart sur activité de −2 400 € (favorable) et un écart sur budget de 3 000 €
 * (défavorable). Les standards et le budget restent ceux de la fiche.
 */
export const ECART_SUR_ACTIVITE_A_REBOURS = -2_400;
export const ECART_SUR_BUDGET_A_REBOURS = 3_000;

/** Les bornes des curseurs du centre, en heures-machine : de part et d'autre de l'activité normale. */
export const HEURES_DU_CURSEUR = { min: 4_000, max: 6_000 } as const;

/** Les bornes du coût réel dans le laboratoire du centre, et son pas, en euros. */
export const COUT_DU_LABORATOIRE = { min: 180_000, max: 240_000, pas: 100 } as const;

/** Le contrôle budgétaire se calcule sur une production : l'usine de NOVA. */
export const ENTREPRISES_DU_CONTROLE_BUDGETAIRE: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const auCentime = (x: number) => Math.round(x * 100) / 100;
/** Le sens d'un écart sur une charge : positif, défavorable. */
const sens = (x: number) => (x > 0 ? "défavorable" : x < 0 ? "favorable" : "nul");
const ecartDit = (x: number) => `${eur(x)} ${sens(x)}`;
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La fiche de l'usine du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLUsine => USINES_DU_COURS[c.code]!;

/** La fiche de la variante : seul le réel change (production, heures-machine, coût du centre). */
export function ficheEnSousActivite(f: FicheDeLUsine): FicheDeLUsine {
  const v = VARIANTE_EN_SOUS_ACTIVITE;
  const ventes = Object.fromEntries(f.modeles.map((m) => [m.code, { ...f.realise.ventes[m.code], quantite: v.production[m.code] }])) as FicheDeLUsine["realise"]["ventes"];
  return { ...f, realise: { ...f.realise, ventes, centre: { heuresMachine: v.heuresMachine, cout: v.cout } } };
}

/** Le contrôle du centre de montage : tout ce que le chapitre et son cas demandent. */
export function centreDeMontage(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const e = controleBudgetaire(f);
  const k = f.centre;
  const r = f.realise;
  const cHm = e.coutStandardDeLHeureMachine;
  const partFixe = auCentime(k.chargesFixes / k.activiteNormale);
  const heuresReelles = r.centre.heuresMachine;
  const heuresPreetablies = e.preetabliDuReel.heuresMachine;
  const parModele = f.modeles.map((m) => ({
    code: m.code,
    nom: m.nom,
    quantite: r.ventes[m.code].quantite,
    parUnite: m.heuresMachineParUnite,
    heures: auCentime(r.ventes[m.code].quantite * m.heuresMachineParUnite),
  }));
  // Les heures au-delà de l'activité normale : celles que la production demandait, celles perdues.
  const auDelaDeLaNormale = auCentime(heuresReelles - k.activiteNormale);
  const perdues = auCentime(heuresReelles - heuresPreetablies);
  const utiles = auCentime(heuresPreetablies - k.activiteNormale);
  // L'interdépendance : la part fixe d'une heure perdue revient en écart sur activité.
  const activiteDesPerdues = auCentime(-perdues * partFixe);
  const activiteSansLesPerdues = auCentime(-utiles * partFixe);
  const coutNetDesPerdues = auCentime(e.centre.rendement + activiteDesPerdues);
  // Le cas : le centre n'aurait tourné que les heures de la production, avec la même dépense au-delà du budget flexible.
  const coutSansLesPerdues = auCentime(k.chargesFixes + k.coutVariableParHeure * heuresPreetablies + e.centre.budget);
  const depassementSansLesPerdues = auCentime(coutSansLesPerdues - e.preetabliDuReel.centre);
  // La variante en sous-activité.
  const fv = ficheEnSousActivite(f);
  const ev = controleBudgetaire(fv);
  const variante = {
    heuresReelles: fv.realise.centre.heuresMachine,
    heuresPreetablies: ev.preetabliDuReel.heuresMachine,
    cout: fv.realise.centre.cout,
    budgetFlexible: ev.centre.budgetFlexible,
    preetabliDeLActivite: auCentime(cHm * fv.realise.centre.heuresMachine),
    preetabliDeLaProduction: ev.preetabliDuReel.centre,
    budget: ev.centre.budget,
    activite: ev.centre.activite,
    rendement: ev.centre.rendement,
    global: ev.centre.global,
    coefficient: ev.centre.coefficient,
    fixesImputes: ev.centre.fixesImputes,
    sousActivite: auCentime(k.chargesFixes - ev.centre.fixesImputes),
  };
  // Le calcul à rebours : activité réelle = activité normale − écart sur activité ÷ part fixe d'une heure.
  const activiteARebours = auCentime(k.activiteNormale - ECART_SUR_ACTIVITE_A_REBOURS / partFixe);
  const budgetFlexibleARebours = auCentime(k.chargesFixes + k.coutVariableParHeure * activiteARebours);
  const coutReelARebours = auCentime(budgetFlexibleARebours + ECART_SUR_BUDGET_A_REBOURS);
  // Les curseurs : le plus d'heures que le centre pouvait tourner sans dépasser le coût préétabli de la
  // production réelle, en tenant son budget flexible, puis avec sa dépense au-delà de ce budget.
  const heuresSansDepasser = Math.floor((e.preetabliDuReel.centre - k.chargesFixes) / k.coutVariableParHeure + 1e-9);
  const heuresSansDepasserAvecLeBudget = Math.floor((e.preetabliDuReel.centre - k.chargesFixes - e.centre.budget) / k.coutVariableParHeure + 1e-9);
  return {
    f,
    k,
    cHm,
    heuresSansDepasser,
    heuresSansDepasserAvecLeBudget,
    partFixe,
    heuresReelles,
    heuresPreetablies,
    parModele,
    coutReel: r.centre.cout,
    coutReelDeLHeure: auCentime(r.centre.cout / heuresReelles),
    budgetInitial: e.budgetStandard.centre,
    ecartAuBudgetInitial: auCentime(r.centre.cout - e.budgetStandard.centre),
    preetabliDeLaProduction: e.preetabliDuReel.centre,
    budgetFlexible: e.centre.budgetFlexible,
    preetabliDeLActivite: auCentime(cHm * heuresReelles),
    global: e.centre.global,
    budget: e.centre.budget,
    activite: e.centre.activite,
    rendement: e.centre.rendement,
    coefficient: e.centre.coefficient,
    fixesImputes: e.centre.fixesImputes,
    /** Positif : un boni de suractivité ; négatif : un coût de la sous-activité. */
    boni: auCentime(e.centre.fixesImputes - k.chargesFixes),
    auDelaDeLaNormale,
    perdues,
    utiles,
    activiteDesPerdues,
    activiteSansLesPerdues,
    coutNetDesPerdues,
    coutSansLesPerdues,
    depassementSansLesPerdues,
    variante,
    activiteARebours,
    budgetFlexibleARebours,
    coutReelARebours,
  };
}

export type CentreDeMontage = ReturnType<typeof centreDeMontage>;

/** Les écarts du centre pour des heures-machine et un coût réel quelconques, la production restant la réelle. */
export function laboratoireDuCentre(x: CentreDeMontage, heures: number, cout: number) {
  const budgetFlexible = auCentime(x.k.chargesFixes + x.k.coutVariableParHeure * heures);
  const budget = auCentime(cout - budgetFlexible);
  const activite = auCentime(budgetFlexible - x.cHm * heures);
  const rendement = auCentime((heures - x.heuresPreetablies) * x.cHm);
  return { budgetFlexible, budget, activite, rendement, global: auCentime(budget + activite + rendement) };
}

/** Le centre au budget et au réel, et ce que demande une enceinte : le document de départ. */
export function tableauDuCentre(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = centreDeMontage(c);
  const f = x.f;
  return {
    titre: `Le centre de montage ${dE(f.entreprise)}, un trimestre`,
    colonnes: ["Budget", "Réel"],
    lignes: [
      { libelle: "Activité, en heures-machine", valeurs: [qte(x.k.activiteNormale), qte(x.heuresReelles)] },
      { libelle: "Coût variable par heure-machine", valeurs: [eur(x.k.coutVariableParHeure), ""] },
      { libelle: "Charges fixes du trimestre", valeurs: [eur(x.k.chargesFixes), ""] },
      { libelle: "Coût du centre", valeurs: [eur(x.budgetInitial), eur(x.coutReel)] },
      ...f.modeles.map((m) => ({ libelle: `${m.nom} fabriquées`, valeurs: [qte(m.quantitePrevue), qte(f.realise.ventes[m.code].quantite)] })),
      ...f.modeles.map((m) => ({ libelle: `Heures-machine d'une ${m.nom}`, valeurs: [qte(m.heuresMachineParUnite), ""] })),
    ],
  };
}

/** Le tableau complet du contrôle du centre, en quatre colonnes, et les écarts entre elles. */
function tableauComplet(x: CentreDeMontage): TableauDeDonnees {
  return {
    titre: `Le contrôle du centre de montage ${dE(x.f.entreprise)}`,
    colonnes: ["Réel", "Budget flexible de l'activité réelle", "Coût préétabli de l'activité réelle", "Coût préétabli de la production réelle"],
    lignes: [
      { libelle: "Heures-machine", valeurs: [qte(x.heuresReelles), qte(x.heuresReelles), qte(x.heuresReelles), qte(x.heuresPreetablies)] },
      { libelle: "Coût de l'heure-machine", valeurs: [eur(x.coutReelDeLHeure), "", eur(x.cHm), eur(x.cHm)] },
      { libelle: "Montant", valeurs: [eur(x.coutReel), eur(x.budgetFlexible), eur(x.preetabliDeLActivite), eur(x.preetabliDeLaProduction)] },
      { libelle: "Écart avec la colonne suivante", valeurs: [`sur budget : ${eur(x.budget)}`, `sur activité : ${eur(x.activite)}`, `sur rendement : ${eur(x.rendement)}`, ""] },
    ],
  };
}

const CONVENTION =
  "Une convention pour tout le chapitre : un écart est le réel moins le prévu. Sur une charge, un écart positif est défavorable (le centre a coûté plus), un écart négatif est favorable.";

export const LES_ECARTS_SUR_CHARGES_INDIRECTES: Chapitre = {
  code: "les-ecarts-sur-charges-indirectes",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Les écarts sur charges indirectes : budget, activité, rendement",
  accroche:
    "Le centre de montage de l'usine a coûté plus que prévu, et il a tourné plus d'heures que son activité normale. Décomposer son écart en écart sur budget, sur activité et sur rendement, chiffrer l'imputation rationnelle, et voir pourquoi un écart sur activité favorable n'est pas une économie.",
  objectifs: [
    "Calculer le coût standard de l'heure-machine et l'activité préétablie de la production réelle",
    "Bâtir le budget flexible de l'activité réelle et le tableau complet du contrôle d'un centre",
    "Décomposer l'écart global d'un centre en écart sur budget, sur activité et sur rendement",
    "Chiffrer l'imputation rationnelle, le boni de suractivité et le coût de la sous-activité",
    "Relier l'écart sur activité et l'écart sur rendement, et retrouver un coût réel à rebours",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CONTROLE_BUDGETAIRE,
    pourquoi: "les coûts préétablis et leurs écarts se calculent sur une production, celle de l'usine du cours, qui fabrique la Nomade et la Salon.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le centre de montage",
      notions: ["standard_costing", "fixed_costs"],
      tableau: tableauDuCentre,
      texte: (c) => {
        const x = centreDeMontage(c);
        const [a, b] = x.parModele;
        return [
          `Ce chapitre se joue dans la simulation du cours, à l'usine ${dE(x.f.entreprise)}, sur un trimestre. L'usine fabrique deux modèles d'enceintes, la ${a!.nom} et la ${b!.nom}, et toute la production du trimestre est vendue : il n'y a pas de stock. Les charges indirectes de production passent par un seul centre d'analyse, le centre de montage ; son unité d'œuvre est l'heure-machine. La distribution, hors production, n'y entre pas.`,
          `Le budget du centre est bâti sur son activité normale, ${qte(x.k.activiteNormale)} heures-machine par trimestre. Ses charges fixes, ${eur(x.k.chargesFixes)}, ne bougent pas avec les heures ; son coût variable, ${eur(x.k.coutVariableParHeure)} par heure-machine, les suit.`,
          `Au trimestre, le centre a tourné ${qte(x.heuresReelles)} heures-machine et coûté ${eur(x.coutReel)}. Une ${a!.nom} demande ${qte(a!.parUnite)} heure-machine, une ${b!.nom} ${qte(b!.parUnite)} ; l'usine en a fabriqué ${qte(a!.quantite)} et ${qte(b!.quantite)}.`,
          CONVENTION,
        ];
      },
      repere: () =>
        "Coût standard de l'heure-machine = coût variable par heure + charges fixes ÷ activité normale. Un écart = réel − prévu ; sur une charge, positif est défavorable.",
    },
    {
      id: "l-heure-machine",
      type: "montants",
      titre: "Le coût standard de l'heure-machine",
      notions: ["standard_costing", "fixed_costs"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `Les charges fixes du centre, ${eur(x.k.chargesFixes)}, se répartissent sur son activité normale, ${qte(x.k.activiteNormale)} heures-machine. Calculez la part fixe d'une heure-machine, puis son coût standard (le coût variable de ${eur(x.k.coutVariableParHeure)} plus la part fixe).`;
      },
      champs: (c) => {
        const x = centreDeMontage(c);
        return [
          { libelle: "Part fixe d'une heure-machine", attendu: x.partFixe, calcul: `${eur(x.k.chargesFixes)} ÷ ${qte(x.k.activiteNormale)} = ${eur(x.partFixe)}` },
          { libelle: "Coût standard de l'heure-machine", attendu: x.cHm, calcul: `${eur(x.k.coutVariableParHeure)} + ${eur(x.partFixe)} = ${eur(x.cHm)}` },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          `Une heure-machine coûte ${eur(x.cHm)} au standard. La part fixe, ${eur(x.partFixe)}, ne vaut qu'à l'activité normale : si le centre tourne plus, ses charges fixes se partagent sur plus d'heures, et chaque heure en porte moins. Tout l'écart sur activité vient de là.`,
        ];
      },
    },
    {
      id: "activite-preetablie",
      type: "montants",
      titre: "L'activité préétablie de la production réelle",
      notions: ["standard_costing"],
      question: (c) => {
        const x = centreDeMontage(c);
        const [a, b] = x.parModele;
        return `Combien d'heures-machine la production réelle aurait-elle dû prendre ? Multipliez les ${qte(a!.quantite)} ${a!.nom} fabriquées par ${qte(a!.parUnite)} heure-machine, les ${qte(b!.quantite)} ${b!.nom} par ${qte(b!.parUnite)}, puis additionnez.`;
      },
      champs: (c) => {
        const x = centreDeMontage(c);
        return [
          ...x.parModele.map((m) => ({
            libelle: `Heures-machine préétablies des ${m.nom}`,
            attendu: m.heures,
            calcul: `${qte(m.quantite)} × ${qte(m.parUnite)} = ${qte(m.heures)}`,
          })),
          {
            libelle: "Activité préétablie de la production réelle",
            attendu: x.heuresPreetablies,
            calcul: `${x.parModele.map((m) => qte(m.heures)).join(" + ")} = ${qte(x.heuresPreetablies)}`,
          },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          `Trois activités à ne pas confondre : l'activité normale (${qte(x.k.activiteNormale)} heures-machine, celle du budget), l'activité réelle (${qte(x.heuresReelles)}, celle que le centre a tournée) et l'activité préétablie de la production réelle (${qte(x.heuresPreetablies)}, celle que la production aurait dû prendre). Chaque écart du centre se loge entre deux d'entre elles.`,
        ];
      },
    },
    {
      id: "ecart-global",
      type: "montants",
      titre: "L'écart global du centre",
      notions: ["cost_variance", "standard_costing"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `Valorisez l'activité préétablie de la production réelle (${qte(x.heuresPreetablies)} heures-machine) au coût standard de ${eur(x.cHm)} : c'est le coût préétabli de la production réelle. Puis calculez l'écart global du centre, coût réel (${eur(x.coutReel)}) moins ce coût préétabli. Négatif pour un écart favorable.`;
      },
      champs: (c) => {
        const x = centreDeMontage(c);
        return [
          { libelle: "Coût préétabli de la production réelle", attendu: x.preetabliDeLaProduction, calcul: `${qte(x.heuresPreetablies)} × ${eur(x.cHm)} = ${eur(x.preetabliDeLaProduction)}` },
          { libelle: "Écart global du centre", attendu: x.global, calcul: `${eur(x.coutReel)} − ${eur(x.preetabliDeLaProduction)} = ${eur(x.global)}` },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [`Le centre a coûté ${eur(x.coutReel)} pour une production qui en valait ${eur(x.preetabliDeLaProduction)} au standard : un écart global de ${ecartDit(x.global)}. Reste à savoir d'où il vient.`];
      },
    },
    {
      id: "la-bonne-reference",
      type: "choix",
      titre: "À quoi comparer le coût réel",
      notions: ["cost_variance", "standard_costing"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `Le centre a coûté ${eur(x.coutReel)}. Le budget du trimestre lui accordait ${eur(x.budgetInitial)} (${qte(x.k.activiteNormale)} heures-machine à ${eur(x.cHm)}). Pour juger le centre, à quoi comparer son coût réel ?`;
      },
      options: (c) => {
        const x = centreDeMontage(c);
        return [
          {
            texte: `Au coût préétabli de la production réelle, ${eur(x.preetabliDeLaProduction)}`,
            juste: true,
            retour: `Oui : on juge un coût sur ce que l'usine a réellement fabriqué. L'écart global est de ${ecartDit(x.global)}, et c'est lui qu'on décompose.`,
          },
          {
            texte: `Au budget du trimestre, ${eur(x.budgetInitial)}`,
            juste: false,
            retour: `Non : le budget de départ suppose la production prévue. L'écart de ${eur(x.ecartAuBudgetInitial)} mêle ce que le centre a mal fait et ce que la production réelle demandait de plus (${eur(x.preetabliDeLaProduction)} au standard, et non ${eur(x.budgetInitial)}).`,
          },
          {
            texte: `Au budget flexible de l'activité réelle, ${eur(x.budgetFlexible)}`,
            juste: false,
            retour: `Non : cette comparaison ne donne que l'écart sur budget, ${eur(x.budget)}. Elle accepte toutes les heures tournées, y compris celles que la production ne demandait pas.`,
          },
        ];
      },
    },
    {
      id: "ecart-sur-budget",
      type: "montants",
      titre: "Le budget flexible et l'écart sur budget",
      notions: ["cost_variance", "fixed_costs", "variable_costs"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `Le budget flexible de l'activité réelle, c'est ce que le centre aurait dû coûter pour les heures qu'il a tournées : les charges fixes (${eur(x.k.chargesFixes)}), plus ${eur(x.k.coutVariableParHeure)} par heure-machine réelle (${qte(x.heuresReelles)}). Calculez-le, puis l'écart sur budget, coût réel moins budget flexible. Négatif pour un écart favorable.`;
      },
      champs: (c) => {
        const x = centreDeMontage(c);
        return [
          {
            libelle: "Budget flexible de l'activité réelle",
            attendu: x.budgetFlexible,
            calcul: `${eur(x.k.chargesFixes)} + ${eur(x.k.coutVariableParHeure)} × ${qte(x.heuresReelles)} = ${eur(x.budgetFlexible)}`,
          },
          { libelle: "Écart sur budget", attendu: x.budget, calcul: `${eur(x.coutReel)} − ${eur(x.budgetFlexible)} = ${eur(x.budget)}` },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          `Pour ${qte(x.heuresReelles)} heures-machine, le centre aurait dû coûter ${eur(x.budgetFlexible)} ; il a coûté ${eur(x.coutReel)}. L'écart sur budget, ${ecartDit(x.budget)}, est une dépense : il ne doit rien au nombre d'heures, puisque le budget flexible les a déjà prises en compte. Il relève du responsable du centre.`,
        ];
      },
    },
    {
      id: "predire-l-activite",
      type: "choix",
      titre: "Pariez sur l'écart sur activité",
      notions: ["fixed_costs", "cost_variance"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `Avant de calculer, pariez. Le centre tourne ${qte(x.auDelaDeLaNormale)} heures-machine de plus que son activité normale, et chaque heure est imputée aux coûts à ${eur(x.cHm)}, part fixe comprise. Face au budget flexible de ces heures, l'écart sur activité sera…`;
      },
      options: (c) => {
        const x = centreDeMontage(c);
        const voir = "Faites tourner le centre à l'étape suivante : le curseur montre de quel côté passe l'écart, et pourquoi.";
        return [
          { texte: "Favorable : les charges fixes se répartissent sur plus d'heures", juste: x.activite < 0, retour: `Bon pari. ${voir}` },
          { texte: "Défavorable : plus d'heures, c'est plus de charges", juste: x.activite > 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Nul : le budget flexible suit déjà les heures", juste: x.activite === 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "faire-tourner-le-centre",
      type: "curseur",
      titre: "Faites tourner le centre",
      notions: ["fixed_costs", "cost_variance"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `Faites tourner le centre de ${qte(HEURES_DU_CURSEUR.min)} à ${qte(HEURES_DU_CURSEUR.max)} heures-machine. Une droite donne ce que le centre impute aux coûts (${eur(x.cHm)} par heure), l'autre ce qu'il doit coûter pour ces heures, son budget flexible. Placez le curseur sur le plus petit nombre d'heures où le coût imputé couvre le budget flexible, puis validez.`;
      },
      grandeur: () => ({ libelle: "Heures-machine du centre", unite: "heures-machine" }),
      cible: (c) => {
        const x = centreDeMontage(c);
        // Le coût imputé couvre le budget flexible dès que coût standard × h ≥ fixes + variable × h.
        return { attendu: Math.ceil(x.k.chargesFixes / (x.cHm - x.k.coutVariableParHeure) - 1e-9), min: HEURES_DU_CURSEUR.min, max: HEURES_DU_CURSEUR.max };
      },
      zones: ["Boni de suractivité", "Coût de la sous-activité"],
      rates: () => ({
        dessous: "À cette position, le coût imputé ne couvre pas le budget flexible : des charges fixes restent sans heures pour les porter.",
        dessus: "Plus bas, le coût imputé couvre encore le budget flexible : cherchez le plus petit nombre d'heures.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, h) => {
        const x = centreDeMontage(c);
        const impute = auCentime(x.cHm * h);
        const flexible = auCentime(x.k.chargesFixes + x.k.coutVariableParHeure * h);
        return [
          { libelle: "Coût imputé (coût préétabli de l'activité)", montant: impute },
          { libelle: "Budget flexible de ces heures", montant: flexible },
          { libelle: "Charges fixes imputées", montant: auCentime((x.k.chargesFixes * h) / x.k.activiteNormale) },
          { libelle: "Écart sur activité", montant: auCentime(flexible - impute), fort: true },
        ];
      },
      droites: (c) => {
        const x = centreDeMontage(c);
        return {
          produit: (h) => x.cHm * h,
          cout: (h) => x.k.chargesFixes + x.k.coutVariableParHeure * h,
          libelles: ["Coût imputé aux heures tournées", "Budget flexible de ces heures"],
        };
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          `Les deux droites se croisent à l'activité normale, ${qte(x.k.activiteNormale)} heures-machine : là seulement, la part fixe imputée à chaque heure (${eur(x.partFixe)}) refait exactement les charges fixes. À droite, le centre impute plus de fixes qu'il n'en paie : un boni de suractivité. À gauche, des fixes restent sans heures : un coût de la sous-activité.`,
          `À ${qte(x.heuresReelles)} heures, l'écart vaut ${eur(x.activite)} ; à ${qte(x.variante.heuresReelles)}, il vaudrait ${eur(x.variante.activite)}. L'écart sur activité ne dépend que de la distance à l'activité normale, à ${eur(x.partFixe)} l'heure : c'est la formule que l'étape suivante fait calculer.`,
        ];
      },
    },
    {
      id: "activite-et-rendement",
      type: "montants",
      titre: "L'écart sur activité et l'écart sur rendement",
      notions: ["cost_variance", "fixed_costs", "efficiency_variance"],
      question: () =>
        "Sans formule cette fois. Calculez le coût préétabli de l'activité réelle, puis l'écart sur activité (ce que les heures réelles devaient coûter au budget flexible, face à leur coût standard) et l'écart sur rendement (les heures tournées face à celles que la production demandait, au coût standard). Négatif pour un écart favorable.",
      champs: (c) => {
        const x = centreDeMontage(c);
        return [
          { libelle: "Coût préétabli de l'activité réelle", attendu: x.preetabliDeLActivite, calcul: `${qte(x.heuresReelles)} × ${eur(x.cHm)} = ${eur(x.preetabliDeLActivite)}` },
          {
            libelle: "Écart sur activité",
            attendu: x.activite,
            calcul: `${eur(x.budgetFlexible)} − ${eur(x.preetabliDeLActivite)} = ${eur(x.activite)}, soit (${qte(x.k.activiteNormale)} − ${qte(x.heuresReelles)}) × ${eur(x.partFixe)} de part fixe`,
          },
          {
            libelle: "Écart sur rendement",
            attendu: x.rendement,
            calcul: `(${qte(x.heuresReelles)} − ${qte(x.heuresPreetablies)}) × ${eur(x.cHm)} = ${eur(x.rendement)}`,
          },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          `Les trois écarts font l'écart global : ${eur(x.budget)} + ${entre(x.activite)} + ${eur(x.rendement)} = ${eur(x.global)}. Chacun garde son signe : on additionne des écarts signés, jamais leurs valeurs absolues.`,
          `L'écart sur activité, ${ecartDit(x.activite)}, ne touche que les charges fixes : au-dessus de l'activité normale, chaque heure en plus porte ${eur(x.partFixe)} de charges fixes que le budget n'a pas eu à payer en plus. L'écart sur rendement, ${ecartDit(x.rendement)}, compte au coût standard les ${qte(x.perdues)} heures-machine que la production ne demandait pas.`,
        ];
      },
    },
    {
      id: "imputation-rationnelle",
      type: "montants",
      titre: "L'imputation rationnelle",
      notions: ["fixed_costs", "standard_costing"],
      question: () =>
        "L'imputation rationnelle n'incorpore aux coûts que la part des charges fixes qui correspond à l'activité réelle. Calculez le coefficient d'imputation rationnelle, les charges fixes imputées, puis la différence d'imputation (charges fixes imputées moins charges fixes du budget : positive, c'est un boni de suractivité ; négative, un coût de la sous-activité).",
      champs: (c) => {
        const x = centreDeMontage(c);
        return [
          { libelle: "Coefficient d'imputation rationnelle", attendu: x.coefficient, calcul: `${qte(x.heuresReelles)} ÷ ${qte(x.k.activiteNormale)} = ${qte(x.coefficient)}` },
          { libelle: "Charges fixes imputées", attendu: x.fixesImputes, calcul: `${eur(x.k.chargesFixes)} × ${qte(x.coefficient)} = ${eur(x.fixesImputes)}` },
          { libelle: "Différence d'imputation", attendu: x.boni, calcul: `${eur(x.fixesImputes)} − ${eur(x.k.chargesFixes)} = ${eur(x.boni)}` },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          x.boni >= 0
            ? `Le centre a imputé aux coûts ${eur(x.fixesImputes)} de charges fixes pour ${eur(x.k.chargesFixes)} à payer : un boni de suractivité de ${eur(x.boni)}. C'est l'écart sur activité vu de l'autre côté (${eur(x.activite)}) : deux façons de chiffrer la même chose.`
            : `Le centre n'a imputé aux coûts que ${eur(x.fixesImputes)} de charges fixes pour ${eur(x.k.chargesFixes)} à payer : un coût de la sous-activité de ${eur(-x.boni)}. C'est l'écart sur activité (${eur(x.activite)}) : deux façons de chiffrer la même chose.`,
        ];
      },
    },
    {
      id: "le-boni-de-suractivite",
      type: "choix",
      titre: "Un écart sur activité favorable",
      notions: ["fixed_costs", "cost_variance"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `L'écart sur activité est ${sens(x.activite)} de ${eur(Math.abs(x.activite))}. Le responsable du centre le présente comme une économie. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = centreDeMontage(c);
        return [
          {
            texte: "Ce n'est pas une économie : le centre a payé toutes ses charges fixes, réparties sur plus d'heures",
            juste: true,
            retour: `Oui. Les charges fixes restent ${eur(x.k.chargesFixes)} ; ${qte(x.heuresReelles)} heures-machine les ont portées au lieu de ${qte(x.k.activiteNormale)}, d'où ${eur(Math.abs(x.activite))} de fixes mieux absorbés. Aucun euro n'est sorti en moins, et de ces heures en plus, la production n'en demandait que ${qte(x.utiles)}.`,
          },
          {
            texte: `C'est une économie de ${eur(Math.abs(x.activite))} sur les charges fixes du centre`,
            juste: false,
            retour: `Non : les charges fixes du budget, ${eur(x.k.chargesFixes)}, ont été payées en entier. L'écart sur activité ne mesure pas une dépense en moins : il mesure des fixes répartis sur plus d'heures.`,
          },
          {
            texte: "C'est une économie sur les charges variables, grâce aux heures en plus",
            juste: false,
            retour: `Non : le budget flexible donne à chaque heure réelle son coût variable, ${eur(x.k.coutVariableParHeure)}. L'écart sur activité ne touche que les charges fixes ; les heures en plus ont, elles, coûté leur variable.`,
          },
        ];
      },
    },
    {
      id: "jusqu-ou-tourner",
      type: "curseur",
      titre: "Jusqu'où le centre pouvait tourner",
      notions: ["efficiency_variance", "fixed_costs"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `La production réelle valait ${eur(x.preetabliDeLaProduction)} au coût préétabli. Supposez que le centre tienne son budget flexible (pas un euro de dépense en plus). Faites varier ses heures-machine : jusqu'où pouvait-il tourner sans dépasser ce coût préétabli ? Placez le curseur sur le plus grand nombre d'heures, puis validez.`;
      },
      grandeur: () => ({ libelle: "Heures-machine du centre", unite: "heures-machine" }),
      sens: "plus-grande",
      cible: (c) => {
        const x = centreDeMontage(c);
        return { attendu: x.heuresSansDepasser, min: HEURES_DU_CURSEUR.min, max: HEURES_DU_CURSEUR.max };
      },
      zones: ["Dans le coût préétabli", "Au-delà du coût préétabli"],
      rates: () => ({
        dessous: "Le centre peut encore tourner plus sans dépasser : cherchez le plus grand nombre d'heures.",
        dessus: "À cette position, le centre dépasse déjà le coût préétabli de la production réelle.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, h) => {
        const x = centreDeMontage(c);
        const activite = auCentime(x.k.chargesFixes + x.k.coutVariableParHeure * h - x.cHm * h);
        const rendement = auCentime((h - x.heuresPreetablies) * x.cHm);
        return [
          { libelle: "Budget flexible de ces heures", montant: auCentime(x.k.chargesFixes + x.k.coutVariableParHeure * h) },
          { libelle: "Écart sur activité", montant: activite },
          { libelle: "Écart sur rendement", montant: rendement },
          { libelle: "Écart global, sans écart sur budget", montant: auCentime(activite + rendement), fort: true },
        ];
      },
      droites: (c) => {
        const x = centreDeMontage(c);
        return {
          produit: () => x.preetabliDeLaProduction,
          cout: (h) => x.k.chargesFixes + x.k.coutVariableParHeure * h,
          libelles: ["Coût préétabli de la production réelle", "Budget flexible des heures tournées"],
        };
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          `Le centre pouvait tourner jusqu'à ${qte(x.heuresSansDepasser)} heures-machine, alors que la production n'en demandait que ${qte(x.heuresPreetablies)}. Au-delà de ${qte(x.heuresPreetablies)}, chaque heure perdue ajoute ${eur(x.cHm)} d'écart sur rendement, mais retire ${eur(x.partFixe)} d'écart sur activité : en net, elle ne coûte que ${eur(x.k.coutVariableParHeure)}, son coût variable.`,
          "Les deux écarts bougent ensemble : une heure de trop pèse sur les deux à la fois. C'est ce que l'étape suivante chiffre.",
        ];
      },
    },
    {
      id: "les-heures-perdues",
      type: "montants",
      titre: "Une heure de trop pèse deux fois",
      notions: ["efficiency_variance", "fixed_costs"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `Le centre a tourné ${qte(x.auDelaDeLaNormale)} heures-machine au-delà de son activité normale, mais la production n'en demandait que ${qte(x.utiles)} de plus. Calculez la part de l'écart sur activité qui vient des heures perdues, l'écart sur activité si le centre n'avait tourné que les heures de la production, puis ce que coûtent vraiment les heures perdues, écart sur rendement et part d'écart sur activité réunis. Négatif pour un écart favorable.`;
      },
      champs: (c) => {
        const x = centreDeMontage(c);
        return [
          {
            libelle: "Part de l'écart sur activité due aux heures perdues",
            attendu: x.activiteDesPerdues,
            calcul: `−${qte(x.perdues)} × ${eur(x.partFixe)} = ${eur(x.activiteDesPerdues)}`,
          },
          {
            libelle: "Écart sur activité aux seules heures de la production",
            attendu: x.activiteSansLesPerdues,
            calcul: `(${qte(x.k.activiteNormale)} − ${qte(x.heuresPreetablies)}) × ${eur(x.partFixe)} = ${eur(x.activiteSansLesPerdues)}`,
          },
          {
            libelle: "Coût net des heures perdues",
            attendu: x.coutNetDesPerdues,
            calcul: `${eur(x.rendement)} + ${entre(x.activiteDesPerdues)} = ${eur(x.coutNetDesPerdues)}, soit ${qte(x.perdues)} × ${eur(x.k.coutVariableParHeure)} de coût variable`,
          },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          `Les écarts ne sont pas indépendants. L'écart sur rendement compte les ${qte(x.perdues)} heures perdues au coût standard complet, ${eur(x.cHm)}, part fixe comprise ; mais ces mêmes heures ont gonflé l'activité, et leur part fixe revient en écart sur activité favorable, ${eur(x.activiteDesPerdues)}. Leur coût net pour l'usine n'est que leur coût variable, ${eur(x.coutNetDesPerdues)}.`,
          `Sans heure perdue, l'écart sur activité n'aurait été que de ${eur(x.activiteSansLesPerdues)} : l'essentiel du « gain » de l'activité a été acheté par des heures que la production ne demandait pas.`,
        ];
      },
    },
    {
      id: "ce-que-coute-une-heure-perdue",
      type: "choix",
      titre: "Ce que coûtent les heures perdues",
      notions: ["efficiency_variance", "fixed_costs", "variable_costs"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `Le directeur veut chiffrer ce que les ${qte(x.perdues)} heures-machine perdues ont coûté à l'usine sur le trimestre, à charges fixes inchangées. Quelle réponse lui donnez-vous ?`;
      },
      options: (c) => {
        const x = centreDeMontage(c);
        const somme = auCentime(x.rendement + Math.abs(x.activiteDesPerdues));
        return [
          {
            texte: `${eur(x.coutNetDesPerdues)} : leur seul coût variable`,
            juste: true,
            retour: `Oui. Les charges fixes, ${eur(x.k.chargesFixes)}, auraient été payées de toute façon ; ce que ces heures ont fait dépenser en plus, c'est leur coût variable, ${qte(x.perdues)} × ${eur(x.k.coutVariableParHeure)}. L'écart sur rendement (${eur(x.rendement)}) et la part d'écart sur activité qu'elles créent (${eur(x.activiteDesPerdues)}) se compensent pour la part fixe.`,
          },
          {
            texte: `${eur(x.rendement)} : l'écart sur rendement entier`,
            juste: false,
            retour: `Non : c'est oublier l'interdépendance. L'écart sur rendement valorise ces heures à ${eur(x.cHm)}, part fixe comprise, alors que cette part fixe n'a pas été dépensée en plus ; elle revient en écart sur activité favorable.`,
          },
          {
            texte: `${eur(somme)} : l'écart sur rendement plus la part fixe de ces heures`,
            juste: false,
            retour: `Non : c'est additionner des écarts sans leur signe. La part fixe des heures perdues est un écart favorable, ${eur(x.activiteDesPerdues)} : elle se retranche de l'écart sur rendement, elle ne s'y ajoute pas.`,
          },
          {
            texte: `${eur(Math.abs(x.activiteDesPerdues))} : la part fixe de ces heures`,
            juste: false,
            retour: `Non : c'est traiter les charges fixes comme des variables. La part fixe d'une heure ne se dépense pas heure par heure ; seul le coût variable, ${eur(x.k.coutVariableParHeure)} par heure, suit les heures tournées.`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-du-centre",
      type: "simulation",
      titre: "Le laboratoire du centre",
      notions: ["cost_variance", "fixed_costs", "efficiency_variance"],
      question: (c) => {
        const x = centreDeMontage(c);
        return `La production reste celle du trimestre : elle demandait ${qte(x.heuresPreetablies)} heures-machine. Faites tourner le centre et faites varier son coût réel : le tableau suit les trois écarts, en effet sur le résultat. Relevez le défi, et regardez ce qui reste.`;
      },
      leviers: (c) => {
        const x = centreDeMontage(c);
        return [
          { code: "heures", libelle: "Heures-machine du centre", unite: "heures-machine", min: HEURES_DU_CURSEUR.min, max: HEURES_DU_CURSEUR.max, pas: 10, depart: x.heuresReelles },
          { code: "cout", libelle: "Coût réel du centre", unite: "€", min: COUT_DU_LABORATOIRE.min, max: COUT_DU_LABORATOIRE.max, pas: COUT_DU_LABORATOIRE.pas, depart: x.coutReel },
        ];
      },
      lecture: (c, p) => {
        const x = centreDeMontage(c);
        const l = laboratoireDuCentre(x, p.heures!, p.cout!);
        const d = laboratoireDuCentre(x, x.heuresReelles, x.coutReel);
        return [
          { libelle: "Budget flexible de ces heures", montant: l.budgetFlexible, reference: d.budgetFlexible },
          { libelle: "Coût préétabli de la production réelle", montant: x.preetabliDeLaProduction, reference: x.preetabliDeLaProduction },
          { libelle: "Écart sur budget", montant: -l.budget, reference: -d.budget, effet: true },
          { libelle: "Écart sur activité", montant: -l.activite, reference: -d.activite, effet: true },
          { libelle: "Écart sur rendement", montant: -l.rendement, reference: -d.rendement, effet: true },
          { libelle: "Écart global du centre", montant: -l.global, reference: -d.global, effet: true, fort: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      defi: (c) => {
        const x = centreDeMontage(c);
        const solution = { heures: x.heuresPreetablies, cout: auCentime(x.k.chargesFixes + x.k.coutVariableParHeure * x.heuresPreetablies) };
        return {
          consigne: "Annulez à la fois l'écart sur rendement et l'écart sur budget.",
          atteint: (p) => {
            const l = laboratoireDuCentre(x, p.heures!, p.cout!);
            return l.rendement === 0 && l.budget === 0;
          },
          indice: (p) => {
            const l = laboratoireDuCentre(x, p.heures!, p.cout!);
            return l.rendement !== 0
              ? `L'écart sur rendement vaut ${eur(l.rendement)} : le centre doit tourner exactement les heures que la production demandait, ${qte(x.heuresPreetablies)}.`
              : `L'écart sur budget vaut ${eur(l.budget)} : à ${qte(p.heures!)} heures-machine, le coût réel doit égaler le budget flexible, ${eur(l.budgetFlexible)}.`;
          },
          solution,
        };
      },
      explication: (c, p) => {
        const x = centreDeMontage(c);
        const l = laboratoireDuCentre(x, p.heures!, p.cout!);
        return [
          `Le centre a tourné juste ce que la production demandait, et dépensé juste son budget flexible : un centre parfait. Il reste pourtant un écart sur activité de ${ecartDit(l.activite)}, et c'est tout l'écart global.`,
          `L'activité normale (${qte(x.k.activiteNormale)} heures-machine) et l'activité préétablie de la production réelle (${qte(x.heuresPreetablies)}) ne coïncident pas : on ne peut pas annuler à la fois l'écart sur activité et l'écart sur rendement. L'écart sur activité qui reste ne juge pas le centre : il mesure le volume produit face au budget, dont répond la direction.`,
        ];
      },
    },
    {
      id: "en-sous-activite",
      type: "montants",
      titre: "Variante : un trimestre en sous-activité",
      notions: ["cost_variance", "fixed_costs", "efficiency_variance"],
      tableau: (c) => {
        const x = centreDeMontage(c);
        const f = x.f;
        const v = VARIANTE_EN_SOUS_ACTIVITE;
        return {
          titre: `Un autre trimestre du centre de montage ${dE(f.entreprise)}`,
          colonnes: ["Budget", "Réel de la variante"],
          lignes: [
            { libelle: "Activité, en heures-machine", valeurs: [qte(x.k.activiteNormale), qte(x.variante.heuresReelles)] },
            ...f.modeles.map((m) => ({ libelle: `${m.nom} fabriquées`, valeurs: [qte(m.quantitePrevue), qte(v.production[m.code])] })),
            { libelle: "Coût du centre", valeurs: [eur(x.budgetInitial), eur(x.variante.cout)] },
          ],
        };
      },
      question: () =>
        "Un autre trimestre : le centre tourne sous son activité normale. Les standards et le budget ne changent pas. Dressez le tableau complet du contrôle du centre (budget flexible de l'activité réelle, coût préétabli de l'activité réelle, coût préétabli de la production réelle), puis ses trois écarts. Négatif pour un écart favorable.",
      champs: (c) => {
        const x = centreDeMontage(c);
        const v = x.variante;
        const k = x.k;
        return [
          { libelle: "Budget flexible de l'activité réelle", attendu: v.budgetFlexible, calcul: `${eur(k.chargesFixes)} + ${eur(k.coutVariableParHeure)} × ${qte(v.heuresReelles)} = ${eur(v.budgetFlexible)}` },
          { libelle: "Coût préétabli de l'activité réelle", attendu: v.preetabliDeLActivite, calcul: `${qte(v.heuresReelles)} × ${eur(x.cHm)} = ${eur(v.preetabliDeLActivite)}` },
          {
            libelle: "Coût préétabli de la production réelle",
            attendu: v.preetabliDeLaProduction,
            calcul: `(${x.f.modeles.map((m) => `${qte(VARIANTE_EN_SOUS_ACTIVITE.production[m.code])} × ${qte(m.heuresMachineParUnite)}`).join(" + ")}) × ${eur(x.cHm)} = ${qte(v.heuresPreetablies)} × ${eur(x.cHm)} = ${eur(v.preetabliDeLaProduction)}`,
          },
          { libelle: "Écart sur budget", attendu: v.budget, calcul: `${eur(v.cout)} − ${eur(v.budgetFlexible)} = ${eur(v.budget)}` },
          { libelle: "Écart sur activité", attendu: v.activite, calcul: `${eur(v.budgetFlexible)} − ${eur(v.preetabliDeLActivite)} = ${eur(v.activite)}` },
          { libelle: "Écart sur rendement", attendu: v.rendement, calcul: `(${qte(v.heuresReelles)} − ${qte(v.heuresPreetablies)}) × ${eur(x.cHm)} = ${eur(v.rendement)}` },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        const v = x.variante;
        return [
          `Les trois écarts font l'écart global de la variante : ${eur(v.budget)} + ${entre(v.activite)} + ${eur(v.rendement)} = ${eur(v.global)}, soit ${eur(v.cout)} − ${eur(v.preetabliDeLaProduction)}.`,
          `Sous l'activité normale, l'écart sur activité devient ${sens(v.activite)} : les ${qte(auCentime(x.k.activiteNormale - v.heuresReelles))} heures-machine non tournées laissent chacune ${eur(x.partFixe)} de charges fixes sans production pour les porter. En imputation rationnelle, le coefficient est de ${qte(v.coefficient)}, les fixes imputés de ${eur(v.fixesImputes)} : un coût de la sous-activité de ${eur(v.sousActivite)}, qui ne charge pas le coût des enceintes mais le résultat.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver le coût réel à rebours",
      notions: ["cost_variance", "fixed_costs"],
      question: () =>
        `Au trimestre suivant, le contrôleur n'a reçu que deux écarts du centre : un écart sur activité de ${eur(ECART_SUR_ACTIVITE_A_REBOURS)} et un écart sur budget de ${eur(ECART_SUR_BUDGET_A_REBOURS)}. Les standards et le budget sont ceux du chapitre. Retrouvez l'activité réelle du centre, son budget flexible, puis son coût réel.`,
      champs: (c) => {
        const x = centreDeMontage(c);
        const k = x.k;
        return [
          {
            libelle: "Activité réelle, en heures-machine",
            attendu: x.activiteARebours,
            calcul: `L'écart sur activité vaut (activité normale − activité réelle) × ${eur(x.partFixe)} : ${qte(k.activiteNormale)} − ${entre(ECART_SUR_ACTIVITE_A_REBOURS)} ÷ ${eur(x.partFixe)} = ${qte(x.activiteARebours)}`,
          },
          {
            libelle: "Budget flexible de cette activité",
            attendu: x.budgetFlexibleARebours,
            calcul: `${eur(k.chargesFixes)} + ${eur(k.coutVariableParHeure)} × ${qte(x.activiteARebours)} = ${eur(x.budgetFlexibleARebours)}`,
          },
          {
            libelle: "Coût réel du centre",
            attendu: x.coutReelARebours,
            calcul: `${eur(x.budgetFlexibleARebours)} + ${entre(ECART_SUR_BUDGET_A_REBOURS)} = ${eur(x.coutReelARebours)}`,
          },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          `Un écart sur activité ${sens(ECART_SUR_ACTIVITE_A_REBOURS)} veut dire que le centre a tourné ${ECART_SUR_ACTIVITE_A_REBOURS < 0 ? "au-dessus" : "en dessous"} de son activité normale, et de combien d'heures : l'écart divisé par la part fixe d'une heure. Le budget flexible s'en déduit, et le coût réel est ce budget plus l'écart sur budget. Remonter les écarts oblige à savoir ce que chacun compare.`,
          `Sans les quantités produites, l'écart sur rendement de ce trimestre ne se retrouve pas : il faudrait l'activité préétablie de la production réelle, que les deux écarts reçus ne donnent pas. Le coût réel de ${eur(x.coutReelARebours)} ne dit donc rien encore des heures perdues.`,
        ];
      },
    },
    {
      id: "qui-doit-agir",
      type: "tri",
      titre: "Qui doit agir",
      notions: ["cost_variance", "efficiency_variance"],
      question: () =>
        "Rangez chaque écart chez celui qui peut agir dessus. Le modèle ne connaît pas les causes, seulement les écarts : on désigne qui doit expliquer, pas un coupable.",
      categories: [
        { code: "centre", libelle: "Le responsable du centre" },
        { code: "atelier", libelle: "L'atelier" },
        { code: "direction", libelle: "La direction" },
      ],
      elements: (c) => {
        const x = centreDeMontage(c);
        return [
          { libelle: "Écart sur budget", montant: x.budget, categorie: "centre", pourquoi: "Une dépense au-delà de ce que les heures tournées justifiaient : les achats et les consommations du centre." },
          { libelle: "Écart sur rendement", montant: x.rendement, categorie: "atelier", pourquoi: "Des heures-machine que la production ne demandait pas : réglages, pannes, organisation du travail." },
          { libelle: "Écart sur activité", montant: x.activite, categorie: "direction", pourquoi: "Les heures tournées face à l'activité normale : le volume, que décide la direction." },
          {
            libelle: "Écart sur activité de la variante",
            montant: x.variante.activite,
            categorie: "direction",
            pourquoi: "Une sous-activité : une capacité payée et non employée. C'est une question de volume et de dimensionnement de l'usine.",
          },
        ];
      },
      explication: (c) => {
        const x = centreDeMontage(c);
        return [
          `Le responsable du centre ne répond que de l'écart sur budget, ${ecartDit(x.budget)}. L'écart sur activité dépend du volume ; l'écart sur rendement, de l'efficacité de l'atelier. Juger le centre sur son écart global, ce serait le tenir pour responsable de ce qu'il ne décide pas.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["cost_variance", "fixed_costs", "efficiency_variance"],
      tableau: (c) => tableauComplet(centreDeMontage(c)),
      texte: (c) => {
        const x = centreDeMontage(c);
        return [
          `L'écart global du centre de montage, ${ecartDit(x.global)}, se lit dans le tableau du contrôle, colonne à colonne : écart sur budget ${ecartDit(x.budget)}, écart sur activité ${ecartDit(x.activite)}, écart sur rendement ${ecartDit(x.rendement)}. La somme se fait avec les signes.`,
          `Deux pièges. Un écart sur activité favorable n'est pas une économie : les charges fixes sont payées, elles se répartissent sur plus d'heures, et l'imputation rationnelle le chiffre par un boni de suractivité (ou, sous l'activité normale, par un coût de la sous-activité). Et des heures en plus ne sont pas forcément de la production en plus : ici, ${qte(x.perdues)} des ${qte(x.auDelaDeLaNormale)} heures au-delà de la normale ont été perdues, et une même heure perdue pèse sur l'écart sur rendement et sur l'écart sur activité.`,
          "Au niveau de l'examen, vous savez dresser le tableau complet d'un centre, en tirer ses trois écarts et le coût de la sous-activité, remonter d'un écart à l'activité ou au coût réel, et dire qui doit répondre de chaque écart.",
          "Dans l'arène, les chiffres de votre usine seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Écart sur budget = coût réel − budget flexible de l'activité réelle. Écart sur activité = budget flexible − coût préétabli de l'activité réelle. Écart sur rendement = (heures réelles − heures préétablies de la production réelle) × coût standard de l'heure. Coefficient d'imputation rationnelle = activité réelle ÷ activité normale.",
    },
  ],
};
