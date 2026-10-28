import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  anneeDuMarche,
  budgetConstantDuLabel,
  budgetPlancherDuLabel,
  capitalImage,
  effortRse,
  engagementRse,
  enseigneDe,
  labelsDeLAnnee,
  planLeMoinsCherDuLabel,
  poidsDesTrimestres,
  trimestresPourLeSeuil,
} from "../monde/attractivite";
import { MARCHES_DU_COURS, type FicheDuMarche } from "../monde/marche-a-trois";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA RESPONSABILITÉ SOCIÉTALE : CE QU'ELLE COÛTE, CE QU'ELLE RAPPORTE (stratégie et
 * management, palier 4 ; DSCG UE3, BUT GEA, STMG).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le marché des
 * enceintes que NOVA partage avec SoundBox et Auris a une fiche figée (monde/marche-a-trois.ts), et le
 * capital-image, le label et l'année se calculent par le modèle du cours (monde/attractivite.ts,
 * parties 5 et 6 : `effortRse`, `capitalImage`, `poidsDesTrimestres`, `budgetPlancherDuLabel`,
 * `budgetConstantDuLabel`, `planLeMoinsCherDuLabel`, `labelsDeLAnnee`, `engagementRse`). Une évolution
 * du moteur ne change rien ici.
 *
 * L'objet : un budget RSE se paie dans son trimestre ; il bâtit un capital-image qui garde 65 % de
 * lui-même chaque trimestre, relève l'attractivité du trimestre suivant et, s'il atteint 0,70 à
 * l'ouverture d'un trimestre (dès le trimestre 3), vaut un label de 2 trimestres. Trois idées :
 *   · à 12 000 € par trimestre, le budget du cours, le label ne vient JAMAIS : le capital plafonne à
 *     l'effort, ln 2 = 0,69 (c'est le cas d'Auris, engagée depuis des années) ;
 *   · l'inertie : dépenser tard compte plus. Dans le capital de la fin du trimestre 3, l'effort du
 *     trimestre 3 pèse 0,35, celui du trimestre 1 seulement 0,15. Les mêmes 56 000 € donnent le label
 *     au trimestre 4 dans l'ordre 4 000, 16 000, 36 000 €, et le ratent dans l'ordre inverse ; le
 *     budget constant qui l'obtient coûte 58 494 €, le plan le moins cher 53 070 € ;
 *   · le coût et le gain sur l'année : au budget du cours, 915 enceintes de plus, 19 215 € de marge
 *     pour 48 000 € : −28 785 €, « pas encore ». Le label au trimestre 4 ne paie pas dans l'année (à
 *     budget du trimestre 4 égal, −7 778 € face au budget du cours) ; le label dès le trimestre 3,
 *     avec les mêmes 56 000 € mis aux trimestres 1 et 2, bat le budget du cours de 9 316 €, sans battre
 *     l'année sans engagement.
 *
 * CE QUI A DISPARU AVEC L'ARÈNE : le process propre et les rebuts (l'étape `process-propre`), le bad
 * buzz, la sanction et la zone tiède, l'éco-subvention, la confiance bancaire et la rétention des
 * salariés, le bon gestionnaire qui produisait selon la demande. La simulation du cours n'a que le
 * capital-image et le label ; le chapitre le dit à l'élève (intro), et l'étape de fond se juge sans
 * la sanction.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, capital, le-plafond, le-poids-des-trimestres (la formule est au repère ou dans
 *     la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-label
 *     puis l-effort-du-seuil (un curseur sur l'effort d'un trimestre, le capital de la fin du
 *     trimestre 3 face au seuil) avant le-plafond et le-budget-constant ; predire-l-ordre puis
 *     le-laboratoire-du-label (les budgets des trimestres 1 à 3 et leur ordre, un levier à choix, et
 *     le graphique du capital) avant le-poids-des-trimestres et deux-ordres ; predire-les-ventes
 *     puis ce-qu-il-faut-vendre (un curseur sur les enceintes vendues en plus, la marge face au coût
 *     de l'engagement) avant l-annee-engagee ;
 *   · autonome : le-budget-constant, deux-ordres, l-annee-engagee, le-cout-complet, verdict (ni
 *     formule ni chiffres donnés ; le calcul de la correction montre le chemin) ;
 *   · expert : a-rebours (le budget du trimestre 3 qu'il faut, après 4 000 et 16 000 €),
 *     le-plan-le-moins-cher (une critique : pourquoi pas tout au trimestre 3), a-budget-du-t4-egal
 *     (une critique de la méthode : comparer des plans au même budget du trimestre 4),
 *     le-label-des-le-t3 (une variante chiffrée), ce-que-paie-le-label, puis de-fond et la synthèse.
 *
 * LES HYPOTHÈSES DE LA SIMULATION (dites à l'élève dans l'intro) : l'année de la simulation du cours,
 * une année type de 4 trimestres égaux, qui n'est ni N ni N + 1 ; un marché de 17 500 enceintes par
 * trimestre partagé entre les 3 enseignes, qui ne grandit pas ; la part de marché est la part de
 * l'attractivité ; les concurrents ne réagissent pas ; NOVA garde ses autres leviers d'aujourd'hui ;
 * le budget RSE est une charge du trimestre ; le capital joue au trimestre suivant, le label se lit
 * sur le capital d'ouverture, dès le trimestre 3, pour 2 trimestres ; le résultat est avant impôt.
 */

/** Le trimestre du label que le chapitre vise : le dernier de l'année. Le capital doit passer le seuil à la fin du trimestre d'avant. */
export const TRIMESTRE_DU_LABEL_VISE = 4;
/** Les trimestres d'engagement avant le label visé. */
export const TRIMESTRES_AVANT_LE_LABEL = TRIMESTRE_DU_LABEL_VISE - 1;

/**
 * LE PLAN QUI MONTE, hypothèse du cours : 4 000, 16 000 puis 36 000 € aux trimestres 1 à 3 (56 000 €),
 * rien au trimestre 4. Le PLAN QUI DESCEND dépense les mêmes montants dans l'ordre inverse.
 */
export const PLAN_QUI_MONTE: readonly number[] = [4_000, 16_000, 36_000];
export const PLAN_QUI_DESCEND: readonly number[] = [...PLAN_QUI_MONTE].reverse();

/** LA VARIANTE TOUT AU TRIMESTRE 3, hypothèse du cours : 48 000 €, le budget du cours de l'année, mis au seul trimestre 3. */
export const TOUT_AU_T3 = 48_000;

/**
 * LE PLAN DU TRIMESTRE 3, hypothèse du cours : les mêmes 56 000 € que le plan qui monte, mais aux
 * trimestres 1 et 2 (20 000 puis 36 000 €), rien ensuite. Le capital de la fin du trimestre 2 passe le
 * seuil (0,71) : le label vient au trimestre 3 et joue 2 trimestres dans l'année.
 */
export const PLAN_DU_T3: readonly number[] = [20_000, 36_000, 0];

/** Le défi du laboratoire : le label au trimestre 4 pour moins que ce montant (le budget constant en coûte 58 494 €). */
export const PLAFOND_DU_DEFI = 58_500;

/** Les bornes et le pas des budgets du laboratoire, en euros par trimestre. */
export const BUDGETS_DU_LABORATOIRE = { min: 0, max: 40_000, pas: 500 } as const;

/** Le levier à choix du laboratoire : l'ordre des budgets saisis. */
export const ORDRES_DU_LABORATOIRE: readonly { valeur: number; libelle: string }[] = [
  { valeur: 0, libelle: "Dans l'ordre saisi" },
  { valeur: 1, libelle: "Inversé (trimestres 1 et 3 échangés)" },
];

/** Les bornes du curseur de l'effort, en centièmes : de rien à 1,50. */
export const EFFORT_DU_CURSEUR = { min: 0, max: 150 } as const;

/** Les bornes du curseur des enceintes vendues en plus sur l'année. */
export const VENTES_DU_CURSEUR = { min: 0, max: 4_000 } as const;

/** Le pari des ventes gagnées : la hausse des ventes de l'année sous laquelle « moins de 5 % » est le bon pari. */
export const SEUIL_DU_PARI_DES_VENTES = 0.05;

/** Le chapitre se calcule sur le marché à trois du cours : celui de NOVA. */
export const ENTREPRISES_DE_LA_RSE: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const dec = (x: number, n = 2) => x.toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n }).replace(/^-/, "−");
const pct = (t: number, n = 1) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: n }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auCentieme = auCentime;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** « de NOVA », « d'Auris » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Un écart de résultat, dit avec son sens : « 9 316 € de mieux », « 7 778 € de moins ». */
const sensDuResultat = (x: number) => (x > 0 ? `${eur(x)} de mieux` : x < 0 ? `${eur(-x)} de moins` : "au même niveau");

/** La fiche du marché à trois du cours. */
export function ficheDe(c: Pick<Cas, "code">): FicheDuMarche {
  const f = MARCHES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de marché à trois pour ${c.code}`);
  return f;
}

/**
 * Le budget RSE du cours, par trimestre : celui de la fiche (12 000 €, qui est aussi l'échelle de
 * dépense du scénario nova de l'arène). Gardé pour la mission « et maintenant, jouez-le »
 * (jouez.ts), qui le fait mettre à chaque tour dans l'arène.
 */
export const budgetRse = (code: string) => ficheDe({ code }).rse.budgetDuCours;

/** Un plan des trimestres 1 à 3, complété d'un budget au trimestre 4. */
const surLAnnee = (plan: readonly number[], t4 = 0) => [...plan, t4];

/** Tout ce que le chapitre demande, calculé sur la fiche par le modèle du cours. */
export function responsabilite(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const r = f.rse;
  const k = r.inertie;
  const b = r.budgetDuCours;
  const n = TRIMESTRES_AVANT_LE_LABEL;
  const nova = enseigneDe(f, "nova");
  const auris = enseigneDe(f, "auris");
  const aujourdhui = anneeDuMarche(f).nova;

  // Le capital, au budget du cours, comme l'élève le calcule : au centième à chaque étape.
  const effortExact = effortRse(f, b);
  const effort = auCentieme(effortExact);
  const capitalT1 = auCentieme((1 - k) * effort);
  const capitalT2 = auCentieme(k * capitalT1 + (1 - k) * effort);
  const hausseT2 = auDixieme(r.sensibilite * capitalT1 * 100);
  const constant = capitalImage(f, [b, b, b, b]);
  const capitalFin = auCentieme(constant.fins[3]!);
  const capitalT3 = auCentieme(constant.fins[2]!);
  const facteurT4 = auCentieme(1 + r.sensibilite * constant.ouvertures[3]!);

  // Le plafond, et le budget constant du label au trimestre 4.
  const plancher = budgetPlancherDuLabel(f);
  const manque = auCentime(plancher - b);
  const poidsTotal = 1 - Math.pow(k, n);
  const effortDuLabelExact = r.seuilDuLabel / poidsTotal;
  const effortDuLabel = auCentieme(effortDuLabelExact);
  const budgetConstant = budgetConstantDuLabel(f, n);
  const coutConstant = auCentime(n * budgetConstant);
  const seuilEnCentiemes = Math.round(r.seuilDuLabel * 100);
  const effortDuCurseur = Math.ceil(seuilEnCentiemes / poidsTotal - 1e-9);
  const budgetDuCurseur = auCentime(r.echelle * (Math.exp(effortDuCurseur / 100) - 1));

  // L'inertie : le poids de chaque trimestre, deux ordres, tout au trimestre 3.
  const poids = poidsDesTrimestres(f, n);
  const monte = capitalImage(f, surLAnnee(PLAN_QUI_MONTE));
  const descend = capitalImage(f, surLAnnee(PLAN_QUI_DESCEND));
  const toutAuT3 = capitalImage(f, [0, 0, TOUT_AU_T3, 0]);
  const budgetToutAuT3 = auCentime(r.echelle * (Math.exp(r.seuilDuLabel / (1 - k)) - 1));
  const labelMonte = labelsDeLAnnee(f, monte.ouvertures).premier;
  const labelDescend = labelsDeLAnnee(f, descend.ouvertures).premier;
  const totalDuPlan = somme(PLAN_QUI_MONTE);

  // Le calcul à rebours : le budget du trimestre 3 qu'il faut, après les deux premiers budgets du plan qui monte.
  const finT2 = monte.fins[1]!;
  const effortT3ARebours = (r.seuilDuLabel - k * finT2) / (1 - k);
  const budgetT3ARebours = auCentime(r.echelle * (Math.exp(effortT3ARebours) - 1));
  const coutARebours = auCentime(PLAN_QUI_MONTE[0]! + PLAN_QUI_MONTE[1]! + budgetT3ARebours);
  const moinsCher = planLeMoinsCherDuLabel(f, n);

  // L'année engagée au budget du cours, face à l'année sans engagement.
  const annee = engagementRse(f, [b, b, b, b]);
  const m = annee.avec.margeUnitaire;
  const ventesPourPayer = Math.ceil(annee.cout / m - 1e-9);
  const hausseDesVentes = annee.ventesGagnees / annee.sans.ventes;
  const haussesDAttractivite = annee.haussesDAttractivite.map((h) => auDixieme(h * 100));
  const hausseMoyenne = auDixieme(somme(haussesDAttractivite) / haussesDAttractivite.length);

  // Comparer à budget du trimestre 4 égal ; le label dès le trimestre 3.
  const sansT4 = engagementRse(f, surLAnnee([b, b, b]));
  const anneeMonte = engagementRse(f, surLAnnee(PLAN_QUI_MONTE));
  const anneeT3 = engagementRse(f, surLAnnee(PLAN_DU_T3));
  const ecartMonteAuCours = auCentime(anneeMonte.avec.resultat - annee.avec.resultat);
  const effetDuT4 = auCentime(annee.avec.resultat - sansT4.avec.resultat);
  const ecartMonteAT4Egal = auCentime(anneeMonte.avec.resultat - sansT4.avec.resultat);
  const capitalT2DuPlanT3 = anneeT3.capital.fins[1]!;
  const ecartT3AuCours = auCentime(anneeT3.avec.resultat - sansT4.avec.resultat);
  const ecartT3AuSans = anneeT3.ecart;
  const trimestresDeLabelT3 = anneeT3.labels.actifs.filter(Boolean).length;

  return {
    f,
    r,
    k,
    b,
    n,
    nova,
    auris,
    aujourdhui,
    effortExact,
    effort,
    capitalT1,
    capitalT2,
    capitalT3,
    hausseT2,
    capitalFin,
    facteurT4,
    plancher,
    manque,
    /** Les trimestres d'engagement au budget du cours qu'il faut pour le label ; null : jamais. */
    trimestresDuLabel: trimestresPourLeSeuil(f, b),
    poidsTotal,
    effortDuLabelExact,
    effortDuLabel,
    budgetConstant,
    coutConstant,
    seuilEnCentiemes,
    effortDuCurseur,
    budgetDuCurseur,
    poids,
    monte,
    descend,
    toutAuT3,
    budgetToutAuT3,
    labelMonte,
    labelDescend,
    totalDuPlan,
    finT2,
    effortT3ARebours,
    budgetT3ARebours,
    coutARebours,
    moinsCher,
    annee,
    m,
    ventesPourPayer,
    hausseDesVentes,
    haussesDAttractivite,
    hausseMoyenne,
    sansT4,
    anneeMonte,
    anneeT3,
    ecartMonteAuCours,
    effetDuT4,
    ecartMonteAT4Egal,
    capitalT2DuPlanT3,
    ecartT3AuCours,
    ecartT3AuSans,
    trimestresDeLabelT3,
  };
}

export type Responsabilite = ReturnType<typeof responsabilite>;

/** Le plan du laboratoire : les budgets des trimestres 1 à 3 dans l'ordre choisi, rien au trimestre 4. */
export function planDuLaboratoire(p: Readonly<Record<string, number>>): number[] {
  const saisis = [p.t1!, p.t2!, p.t3!];
  return surLAnnee(p.ordre === 1 ? [...saisis].reverse() : saisis);
}

/** Ce que le laboratoire lit d'un plan : le capital d'ouverture du trimestre 4 (en centièmes), le label, le coût et l'année. */
export function laboratoireDuLabel(x: Pick<Responsabilite, "f">, plan: readonly number[]) {
  const e = engagementRse(x.f, plan);
  return {
    capitalT4: auCentime(e.capital.ouvertures[3]! * 100),
    trimestresDeLabel: e.labels.actifs.filter(Boolean).length,
    labelAuT4: e.labels.actifs[3]!,
    premier: e.labels.premier,
    cout: e.cout,
    ventes: e.avec.ventes,
    ecart: e.ecart,
    resultat: e.avec.resultat,
  };
}

/** Le capital et le label, et l'année sans engagement : le document de départ. */
export function tableauDesReglages(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = responsabilite(c);
  return {
    titre: `Le capital-image et le label, chez ${x.f.entreprise}`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Budget RSE envisagé, par trimestre", valeurs: [eur(x.b)] },
      { libelle: "Échelle de l'effort", valeurs: [eur(x.r.echelle)] },
      { libelle: "Inertie du capital-image", valeurs: [dec(x.k)] },
      { libelle: "Sensibilité de l'attractivité au capital", valeurs: [dec(x.r.sensibilite)] },
      { libelle: "Seuil du label (capital d'ouverture)", valeurs: [dec(x.r.seuilDuLabel)] },
      { libelle: "Premier trimestre où le label peut venir", valeurs: [`trimestre ${x.r.premierTrimestreDuLabel}`] },
      { libelle: "Hausse d'attractivité du label", valeurs: [pct(x.r.bonusDuLabel, 0)] },
      { libelle: "Durée du label", valeurs: [`${qte(x.r.dureeDuLabel)} trimestres`] },
      { libelle: `Ventes ${dE(x.f.entreprise)} sur l'année, sans engagement`, valeurs: [`${qte(x.aujourdhui.ventes)} ${x.f.unites}`] },
      { libelle: `Résultat ${dE(x.f.entreprise)} sur l'année, sans engagement`, valeurs: [eur(x.aujourdhui.resultat)] },
      { libelle: `Budget RSE ${dE(x.auris.nom)}, par trimestre, depuis des années`, valeurs: [eur(x.auris.offre.budgetRse)] },
      { libelle: `Capital-image ${dE(x.auris.nom)}`, valeurs: [dec(x.auris.capitalImage)] },
    ],
  };
}

const CONVENTION_DES_ECARTS = "Un écart de résultat est le résultat de l'année engagée moins celui de l'année comparée : négatif, l'année finit plus bas.";

export const LA_RESPONSABILITE_SOCIETALE: Chapitre = {
  code: "la-responsabilite-societale",
  parcours: "strategie",
  palier: 4,
  blocs: [
    "STMG Thème 3 · Les organisations et la société",
    "DSCG UE3 · Contrôle de gestion et stratégie",
    "BUT GEA · Piloter les relations avec les parties prenantes de l'organisation",
  ],
  titre: "La responsabilité sociétale : ce qu'elle coûte, ce qu'elle rapporte",
  accroche:
    "Un budget RSE se paie dans son trimestre ; ce qu'il rapporte passe par un capital-image qui se bâtit lentement, et par un label qui ne vient qu'au-delà d'un seuil. Le plafond du capital, l'inertie qui fait compter plus les derniers euros, ce que l'engagement coûte et rapporte sur l'année, et la question de fond : contrainte, investissement ou stratégie ?",
  objectifs: [
    "Calculer la construction d'un capital-image et son effet sur l'attractivité",
    "Calculer le budget sous lequel un label ne vient jamais, et le budget constant qui l'obtient à une date",
    "Expliquer pourquoi dépenser tard compte plus, et retrouver un budget à rebours",
    "Mesurer sur l'année ce que l'engagement coûte et rapporte, coût complet compris",
    "Comparer deux plans à tout le reste égal, et juger la RSE comme une contrainte, un investissement ou une stratégie",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_RSE,
    pourquoi:
      "ce chapitre se calcule sur le marché des enceintes que NOVA partage avec SoundBox et Auris dans la simulation du cours : NOVA y est la même PME que dans le reste du cours, et son capital-image se bâtit face à ces deux concurrents.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un capital qui se bâtit, un label qui se mérite",
      notions: ["csr_index", "brand_capital"],
      tableau: tableauDesReglages,
      texte: (c) => {
        const x = responsabilite(c);
        const f = x.f;
        const o = x.aujourdhui;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, sur l'année de la simulation du cours : une année type de ${qte(f.marche.trimestres)} trimestres égaux, qui n'est ni l'année N ni l'année N + 1 des autres chapitres. ${f.entreprise} y vend la NOVA One ${eur(o.offre.prix)} (${eur(o.coutVariable)} de coût variable, ${eur(o.margeUnitaire)} de marge) face à SoundBox et Auris. Le marché, ${qte(f.marche.parTrimestre)} ${f.unites} par trimestre, se partage entre les ${qte(f.enseignes.length)} enseignes et ne grandit pas : ce qu'une enseigne gagne, elle le prend aux autres. Sa part est son attractivité rapportée à celle de toutes. Les concurrents ne réagissent pas, ${f.entreprise} garde ses autres leviers d'aujourd'hui, et le résultat est avant impôt.`,
          `La direction envisage de s'engager : ${eur(x.b)} de budget RSE chaque trimestre. Ce budget est une charge du trimestre, payée tout de suite. Il bâtit un capital-image : chaque trimestre, le capital garde ${pct(x.k, 0)} de ce qu'il était, et l'effort du trimestre, ln(1 + budget ÷ ${eur(x.r.echelle)}), fait le reste. Le capital de la fin d'un trimestre relève l'attractivité du trimestre suivant de ${dec(x.r.sensibilite)} × capital : l'engagement d'un trimestre ne rapporte rien dans le trimestre même.`,
          `Le label : à partir du trimestre ${x.r.premierTrimestreDuLabel}, la simulation l'accorde au trimestre dont le capital d'ouverture, celui de la fin du trimestre d'avant, atteint ${dec(x.r.seuilDuLabel)}. Il relève alors l'attractivité de ${pct(x.r.bonusDuLabel, 0)} pendant ${qte(x.r.dureeDuLabel)} trimestres. ${x.auris.nom} engage ${eur(x.auris.offre.budgetRse)} par trimestre depuis des années : son capital vaut ${dec(x.auris.capitalImage)}, et elle n'a pas le label.`,
          "La simulation du cours ne retient de la RSE que ce capital et ce label : ni obligation ni sanction, ni effet sur la banque ou sur les salariés, ni rebuts évités. Ce qu'un engagement rapporte ici, il le rapporte par les clients qu'il attire.",
        ];
      },
      repere: () => "Effort du trimestre = ln(1 + budget ÷ échelle). Capital de fin = inertie × capital d'avant + (1 − inertie) × effort.",
    },
    {
      id: "capital",
      type: "montants",
      titre: "Un capital qui se bâtit lentement",
      notions: ["brand_capital"],
      question: (c) => {
        const x = responsabilite(c);
        return `Le capital-image part de zéro. Calculez l'effort d'un trimestre, ln(1 + ${eur(x.b)} ÷ ${eur(x.r.echelle)}), puis le capital-image à la fin du trimestre 1 et à la fin du trimestre 2 (au centième, en reprenant à chaque étape le chiffre arrondi), et la hausse d'attractivité que le capital de la fin du trimestre 1 donne au trimestre 2 (la sensibilité × le capital, en %).`;
      },
      champs: (c) => {
        const x = responsabilite(c);
        const kk = dec(x.k);
        const reste = dec(1 - x.k);
        return [
          { libelle: "Effort d'un trimestre", attendu: x.effort, calcul: `ln(1 + ${eur(x.b)} ÷ ${eur(x.r.echelle)}) = ${dec(x.effort)}`, tolerance: 0.01 },
          { libelle: "Capital-image à la fin du trimestre 1", attendu: x.capitalT1, calcul: `${kk} × 0 + ${reste} × ${dec(x.effort)} = ${dec(x.capitalT1)}`, tolerance: 0.01 },
          { libelle: "Capital-image à la fin du trimestre 2", attendu: x.capitalT2, calcul: `${kk} × ${dec(x.capitalT1)} + ${reste} × ${dec(x.effort)} = ${dec(x.capitalT2)}`, tolerance: 0.01 },
          { libelle: "Hausse d'attractivité au trimestre 2 (%)", attendu: x.hausseT2, calcul: `${dec(x.r.sensibilite)} × ${dec(x.capitalT1)} × 100 = ${dec(x.hausseT2, 1)} %`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        return [
          `Au trimestre 1, l'engagement coûte ${eur(x.b)} et ne rapporte rien : la simulation lit le capital d'ouverture, encore nul. Au trimestre 2, l'offre ${dE(x.f.entreprise)} gagne ${dec(x.hausseT2, 1)} % d'attractivité ; à la fin du trimestre 3, le capital en est à ${dec(x.capitalT3)}, et à la fin de l'année à ${dec(x.capitalFin)}. Au trimestre 4, l'attractivité est multipliée par ${dec(x.facteurT4)}.`,
          "La publicité agit dans son trimestre et s'éteint ; le capital-image se bâtit, et reste.",
        ];
      },
    },
    {
      id: "predire-le-label",
      type: "choix",
      titre: "Pariez sur le label",
      notions: ["brand_capital", "csr_index"],
      question: (c) => {
        const x = responsabilite(c);
        return `Avant de calculer, pariez. ${x.f.entreprise} engage ${eur(x.b)} chaque trimestre, et ne s'arrête plus. Le capital monte de ${dec(x.capitalT1)} à ${dec(x.capitalT2)}, puis à ${dec(x.capitalT3)} ; le label demande ${dec(x.r.seuilDuLabel)}. Le label viendra…`;
      },
      options: (c) => {
        const x = responsabilite(c);
        const voir = "Le curseur de l'étape suivante montre ce que le capital peut atteindre, et à quel effort.";
        const jamais = x.trimestresDuLabel === null;
        const cetteAnnee = x.trimestresDuLabel !== null && x.trimestresDuLabel < TRIMESTRE_DU_LABEL_VISE;
        const plusTard = !jamais && !cetteAnnee;
        const dit = (juste: boolean) => `${juste ? "Bon pari" : "Pari à vérifier"}. ${voir}`;
        return [
          { texte: "Jamais, à ce budget : le capital plafonne sous le seuil", juste: jamais, retour: dit(jamais) },
          { texte: "Plus tard : il suffit de tenir quelques années", juste: plusTard, retour: dit(plusTard) },
          { texte: "Dès cette année, au trimestre 4", juste: cetteAnnee, retour: dit(cetteAnnee) },
        ];
      },
    },
    {
      id: "l-effort-du-seuil",
      type: "curseur",
      titre: "Cherchez l'effort du label",
      notions: ["brand_capital", "csr_index"],
      question: (c) => {
        const x = responsabilite(c);
        return `Faites varier l'effort d'un trimestre, tenu aux trimestres 1 à ${x.n}, compté en centièmes (${dec(x.effort)} vaut ${qte(Math.round(x.effort * 100))}). Une droite donne le capital à la fin du trimestre ${x.n}, (1 − ${dec(x.k)} puissance ${x.n}) × effort, l'autre le seuil du label, ${qte(x.seuilEnCentiemes)} centièmes. Placez le curseur sur le plus petit effort qui donne le label au trimestre ${TRIMESTRE_DU_LABEL_VISE}, puis validez.`;
      },
      grandeur: () => ({ libelle: "Effort d'un trimestre", unite: "centièmes" }),
      cible: (c) => ({ attendu: responsabilite(c).effortDuCurseur, min: EFFORT_DU_CURSEUR.min, max: EFFORT_DU_CURSEUR.max }),
      zones: ["Label au trimestre 4", "Pas de label au trimestre 4"],
      rates: () => ({
        dessous: "À cet effort, le capital de la fin du trimestre 3 reste sous le seuil : le label ne vient pas au trimestre 4.",
        dessus: "Plus bas, le capital passe encore le seuil : cherchez le plus petit effort.",
      }),
      montrer: "Montrer l'effort du seuil",
      lecture: (c, e) => {
        const x = responsabilite(c);
        const budget = auCentime(x.r.echelle * (Math.exp(e / 100) - 1));
        return [
          { libelle: "Budget par trimestre qui donne cet effort", montant: budget },
          { libelle: `Coût des trimestres 1 à ${x.n}`, montant: auCentime(x.n * budget), fort: true },
          { libelle: "Budget du cours, pour comparer", montant: x.b },
        ];
      },
      droites: (c) => {
        const x = responsabilite(c);
        return {
          produit: (e) => x.poidsTotal * e,
          cout: () => x.seuilEnCentiemes,
          libelles: [`Capital à la fin du trimestre ${x.n}, en centièmes`, "Seuil du label, en centièmes"],
        };
      },
      explication: (c) => {
        const x = responsabilite(c);
        const effortEnCentiemes = Math.round(x.effort * 100);
        return [
          `Il faut un effort de ${dec(x.effortDuCurseur / 100)} au moins : ${x.n} trimestres ne bâtissent que ${dec(x.poidsTotal, 4)} de l'effort, et ${dec(x.poidsTotal, 4)} × ${dec(x.effortDuCurseur / 100)} passe tout juste ${dec(x.r.seuilDuLabel)}. Au budget du cours, l'effort vaut ${dec(x.effort)} : même tenu pour toujours, le capital tend vers l'effort sans le dépasser, et ${dec(x.effort)} reste sous ${dec(x.r.seuilDuLabel)}. Le label ne viendra jamais à ${eur(x.b)} par trimestre.`,
          `L'effort grandit comme le logarithme du budget : passer de ${qte(effortEnCentiemes)} à ${qte(x.effortDuCurseur)} centièmes, ${pct(x.effortDuCurseur / effortEnCentiemes - 1)} d'effort en plus, demande ${eur(x.budgetDuCurseur)} par trimestre, ${pct(x.budgetDuCurseur / x.b - 1)} de budget en plus. Les étapes suivantes chiffrent le plancher du label et le budget constant qui l'obtient.`,
        ];
      },
    },
    {
      id: "le-plafond",
      type: "montants",
      titre: "Jusqu'où monte le capital",
      notions: ["brand_capital", "csr_index"],
      question: (c) => {
        const x = responsabilite(c);
        return `À budget constant, le capital tend vers l'effort d'un trimestre sans jamais le dépasser. Le label demande ${dec(x.r.seuilDuLabel)}. Calculez le budget par trimestre sous lequel le label ne vient jamais, ${eur(x.r.echelle)} × (e puissance ${dec(x.r.seuilDuLabel)} − 1), au centime ; ce qu'il manque par trimestre au budget du cours ; puis le capital à la fin de l'année au budget du cours, l'effort × (1 − ${dec(x.k)} puissance 4), au centième.`;
      },
      champs: (c) => {
        const x = responsabilite(c);
        // Une puissance de e arrondie au millième déplace le budget d'un millième de l'échelle au plus.
        const tolerance = Math.max(1, Math.ceil(x.r.echelle * 0.001));
        return [
          { libelle: "Budget par trimestre sous lequel le label ne vient jamais", attendu: x.plancher, calcul: `${eur(x.r.echelle)} × (e puissance ${dec(x.r.seuilDuLabel)} − 1) = ${eur(x.plancher)}`, tolerance },
          { libelle: "Ce qu'il manque par trimestre au budget du cours", attendu: x.manque, calcul: `${eur(x.plancher)} − ${eur(x.b)} = ${eur(x.manque)}`, tolerance },
          { libelle: "Capital-image à la fin de l'année", attendu: x.capitalFin, calcul: `${dec(x.effort)} × (1 − ${dec(x.k)} puissance 4) = ${dec(x.capitalFin)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        return [
          `Il manque ${eur(x.manque)} par trimestre : un quasi-succès qui ne vient jamais. Le capital s'approche du plafond de ${dec(x.effort)} sans l'atteindre, et ce plafond est sous le seuil. C'est l'histoire ${dE(x.auris.nom)}, qui dépense ${eur(x.auris.offre.budgetRse)} par trimestre depuis des années pour un capital de ${dec(x.auris.capitalImage)}, sans label.`,
          `À la fin de l'année, le capital ${dE(x.f.entreprise)} n'en est qu'à ${dec(x.capitalFin)}. Un budget à peine au-dessus du plancher ne suffirait pas non plus cette année : il lui faudrait des années pour s'approcher de son plafond.`,
        ];
      },
    },
    {
      id: "le-budget-constant",
      type: "montants",
      titre: "Le budget constant du label",
      notions: ["brand_capital", "csr_index"],
      question: (c) => {
        const x = responsabilite(c);
        return `Sans formule cette fois. La direction veut le label au trimestre ${TRIMESTRE_DU_LABEL_VISE}, avec le même budget chaque trimestre. Retrouvez l'effort qu'il faut tenir (au centième), le budget par trimestre qui le donne (au centime, en gardant l'effort non arrondi), et ce que coûtent les trimestres 1 à ${x.n}.`;
      },
      champs: (c) => {
        const x = responsabilite(c);
        return [
          {
            libelle: "Effort à tenir chaque trimestre",
            attendu: x.effortDuLabel,
            calcul: `Le capital de la fin du trimestre ${x.n} vaut effort × (1 − ${dec(x.k)} puissance ${x.n}) = effort × ${dec(x.poidsTotal, 6)} ; il faut ${dec(x.r.seuilDuLabel)} ÷ ${dec(x.poidsTotal, 6)} = ${dec(x.effortDuLabelExact, 4)}, soit ${dec(x.effortDuLabel)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Budget constant par trimestre",
            attendu: x.budgetConstant,
            calcul: `${eur(x.r.echelle)} × (e puissance ${dec(x.effortDuLabelExact, 4)} − 1) = ${eur(x.budgetConstant)}`,
            // L'effort gardé au millième déplace le budget d'une vingtaine d'euros.
            tolerance: 20,
          },
          { libelle: `Coût des trimestres 1 à ${x.n}`, attendu: x.coutConstant, calcul: `${x.n} × ${eur(x.budgetConstant)} = ${eur(x.coutConstant)}`, tolerance: 60 },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        return [
          `${eur(x.budgetConstant)} par trimestre, ${eur(x.coutConstant)} sur les trimestres 1 à ${x.n} : le capital de la fin du trimestre ${x.n} touche alors exactement ${dec(x.r.seuilDuLabel)}, et le label vient au trimestre ${TRIMESTRE_DU_LABEL_VISE}. Au curseur, l'effort arrondi à ${dec(x.effortDuCurseur / 100)} demandait ${eur(x.budgetDuCurseur)} : l'exponentielle grossit le moindre arrondi.`,
          `Le budget du trimestre ${TRIMESTRE_DU_LABEL_VISE}, lui, ne compte pas pour ce label : il se lit sur le capital de la fin du trimestre ${x.n}. Reste à savoir si le même budget chaque trimestre est la façon la moins chère d'y arriver.`,
        ];
      },
    },
    {
      id: "predire-l-ordre",
      type: "choix",
      titre: "Pariez sur l'ordre des budgets",
      notions: ["brand_capital"],
      question: (c) => {
        const x = responsabilite(c);
        const [a, b, d] = PLAN_QUI_MONTE.map(eur);
        return `Avant le laboratoire, pariez. Les mêmes ${eur(x.totalDuPlan)} sur les trimestres 1 à ${x.n}, dans deux ordres : ${a}, ${b} puis ${d}, ou ${d}, ${b} puis ${a}. Lequel donne le label au trimestre ${TRIMESTRE_DU_LABEL_VISE} ?`;
      },
      options: (c) => {
        const x = responsabilite(c);
        const voir = "Le laboratoire suivant vous laisse essayer les deux ordres.";
        const monte = x.labelMonte === TRIMESTRE_DU_LABEL_VISE && x.labelDescend === null;
        const descend = x.labelDescend !== null && x.labelMonte === null;
        const egal = !monte && !descend;
        const dit = (juste: boolean) => `${juste ? "Bon pari" : "Pari à vérifier"}. ${voir}`;
        return [
          { texte: "Le plan qui monte : la plus grosse dépense est la plus récente", juste: monte, retour: dit(monte) },
          { texte: "Le plan qui descend : le capital commence à se bâtir plus tôt", juste: descend, retour: dit(descend) },
          { texte: "Les deux ou aucun : seul le total compte", juste: egal, retour: dit(egal) },
        ];
      },
    },
    {
      id: "le-laboratoire-du-label",
      type: "simulation",
      titre: "Le laboratoire du label",
      notions: ["brand_capital", "csr_index", "contribution_margin"],
      question: (c) => {
        const x = responsabilite(c);
        return `Répartissez le budget RSE des trimestres 1 à ${x.n}, et choisissez l'ordre. Le trimestre ${TRIMESTRE_DU_LABEL_VISE} reste sans budget : il ne compte pas pour un label au trimestre ${TRIMESTRE_DU_LABEL_VISE}. Le tableau suit le capital d'ouverture du trimestre ${TRIMESTRE_DU_LABEL_VISE}, compté en centièmes (le seuil, ${dec(x.r.seuilDuLabel)}, y vaut ${qte(x.seuilEnCentiemes)}), le label et l'année ; le graphique, ce capital selon le budget du trimestre ${x.n}, dans l'ordre choisi et dans l'autre.`;
      },
      leviers: (c) => {
        const x = responsabilite(c);
        const l = BUDGETS_DU_LABORATOIRE;
        const valeurs = ORDRES_DU_LABORATOIRE.map((o) => o.valeur);
        return [
          { code: "t1", libelle: "Budget RSE du trimestre 1", unite: "€", min: l.min, max: l.max, pas: l.pas, depart: x.b },
          { code: "t2", libelle: "Budget RSE du trimestre 2", unite: "€", min: l.min, max: l.max, pas: l.pas, depart: x.b },
          { code: "t3", libelle: "Budget RSE du trimestre 3", unite: "€", min: l.min, max: l.max, pas: l.pas, depart: x.b },
          { code: "ordre", libelle: "Ordre des budgets", unite: "", min: Math.min(...valeurs), max: Math.max(...valeurs), pas: 1, depart: valeurs[0]!, choix: ORDRES_DU_LABORATOIRE },
        ];
      },
      lecture: (c, p) => {
        const x = responsabilite(c);
        const l = laboratoireDuLabel(x, planDuLaboratoire(p));
        const d = laboratoireDuLabel(x, surLAnnee([x.b, x.b, x.b]));
        return [
          { libelle: `Capital-image à l'ouverture du trimestre ${TRIMESTRE_DU_LABEL_VISE}`, montant: l.capitalT4, unite: "centièmes", reference: d.capitalT4 },
          { libelle: "Seuil du label", montant: x.seuilEnCentiemes, unite: "centièmes", reference: x.seuilEnCentiemes },
          { libelle: "Trimestres sous label dans l'année", montant: l.trimestresDeLabel, unite: "sur 4", reference: d.trimestresDeLabel },
          { libelle: `Budget RSE des trimestres 1 à ${x.n}`, montant: l.cout, reference: d.cout },
          { libelle: "Ventes de l'année", montant: l.ventes, unite: x.f.unites, reference: d.ventes },
          { libelle: "Écart de résultat face à l'année sans engagement", montant: l.ecart, reference: d.ecart, effet: true },
          { libelle: "Résultat de l'année", montant: l.resultat, reference: d.resultat, fort: true },
        ];
      },
      // Le capital d'ouverture du trimestre 4 n'est pas une droite du budget du trimestre 3 : chaque
      // euro en plus y ajoute moins que le précédent. L'autre ordre montre ce que l'inertie oublie.
      graphique: (c) => {
        const x = responsabilite(c);
        const capital = (p: Readonly<Record<string, number>>) => auCentime(capitalImage(x.f, planDuLaboratoire(p)).ouvertures[3]! * 100);
        return {
          levier: "t3",
          unite: "centièmes",
          courbes: [
            { libelle: `Capital à l'ouverture du trimestre ${TRIMESTRE_DU_LABEL_VISE}`, valeur: (p) => capital(p) },
            { libelle: "Le même plan dans l'autre ordre", valeur: (p) => capital({ ...p, ordre: p.ordre === 1 ? 0 : 1 }) },
            { libelle: "Seuil du label", valeur: () => x.seuilEnCentiemes },
          ],
        };
      },
      defi: (c) => {
        const x = responsabilite(c);
        return {
          consigne: `Obtenez le label au trimestre ${TRIMESTRE_DU_LABEL_VISE} pour moins de ${eur(PLAFOND_DU_DEFI)} de budget RSE.`,
          atteint: (p) => {
            const l = laboratoireDuLabel(x, planDuLaboratoire(p));
            return l.labelAuT4 && l.cout < PLAFOND_DU_DEFI;
          },
          indice: (p) => {
            const l = laboratoireDuLabel(x, planDuLaboratoire(p));
            if (!l.labelAuT4) {
              const tard =
                p.ordre === 1
                  ? "Dans cet ordre, les plus gros budgets passent les premiers, et le capital en oublie une part chaque trimestre : essayez l'autre ordre."
                  : `L'effort du trimestre ${x.n} pèse ${dec(x.poids[2]!)} dans ce capital, celui du trimestre 1 seulement ${dec(x.poids[0]!)} : mettez le gros du budget au trimestre ${x.n}.`;
              return `Le capital à l'ouverture du trimestre ${TRIMESTRE_DU_LABEL_VISE} vaut ${qte(l.capitalT4)} centièmes, sous les ${qte(x.seuilEnCentiemes)} du seuil. ${tard}`;
            }
            return `Le label vient, mais pour ${eur(l.cout)} : il faut moins de ${eur(PLAFOND_DU_DEFI)}. Déplacez du budget des premiers trimestres vers le trimestre ${x.n}, où chaque euro pèse plus.`;
          },
          solution: { t1: PLAN_QUI_MONTE[0]!, t2: PLAN_QUI_MONTE[1]!, t3: PLAN_QUI_MONTE[2]!, ordre: ORDRES_DU_LABORATOIRE[0]!.valeur },
        };
      },
      explication: (c, p) => {
        const x = responsabilite(c);
        const l = laboratoireDuLabel(x, planDuLaboratoire(p));
        const depart = laboratoireDuLabel(x, surLAnnee([x.b, x.b, x.b]));
        const quand =
          l.premier !== null && l.premier < TRIMESTRE_DU_LABEL_VISE
            ? `Le label vient même dès le trimestre ${l.premier}, et joue ${qte(l.trimestresDeLabel)} trimestres dans l'année : le capital de la fin du trimestre ${l.premier - 1} passait déjà le seuil.`
            : `Le label vient au trimestre ${TRIMESTRE_DU_LABEL_VISE}, sur un capital d'ouverture de ${qte(l.capitalT4)} centièmes.`;
        const autre = laboratoireDuLabel(x, planDuLaboratoire({ ...p, ordre: p.ordre === 1 ? 0 : 1 }));
        const lAutreOrdre = autre.labelAuT4
          ? "Dans l'autre ordre, le label viendrait aussi : votre plan est assez fort pour que l'ordre ne le décide pas."
          : `Dans l'autre ordre, les mêmes budgets ne donnent pas le label au trimestre ${TRIMESTRE_DU_LABEL_VISE} (${qte(autre.capitalT4)} centièmes) : l'ordre compte autant que le total.`;
        return [
          `${quand} Votre plan coûte ${eur(l.cout)}, moins que les ${eur(x.coutConstant)} du budget constant : dépensés juste avant la date du label, moins d'euros y bâtissent autant de capital. ${lAutreOrdre}`,
          `Le plan le moins cher possible pour un label au trimestre ${TRIMESTRE_DU_LABEL_VISE} coûte environ ${eur(Math.round(x.moinsCher.total))}. Votre année finit à ${eur(l.resultat)}, contre ${eur(depart.resultat)} au départ (${eur(depart.cout)} de budget, sans label) : la suite du chapitre chiffre ce que le label rapporte vraiment.`,
        ];
      },
    },
    {
      id: "le-poids-des-trimestres",
      type: "montants",
      titre: "Dépenser tard compte plus",
      notions: ["brand_capital"],
      question: (c) => {
        const x = responsabilite(c);
        return `Le capital de la fin du trimestre ${x.n}, parti de zéro, vaut ${dec(1 - x.k)} × (${dec(x.k)} puissance 2 × effort du trimestre 1 + ${dec(x.k)} × effort du trimestre 2 + effort du trimestre 3). Calculez le poids de l'effort de chaque trimestre dans ce capital, au centième.`;
      },
      champs: (c) => {
        const x = responsabilite(c);
        const reste = dec(1 - x.k);
        const kk = dec(x.k);
        return [
          { libelle: "Poids de l'effort du trimestre 1", attendu: auCentieme(x.poids[0]!), calcul: `${reste} × ${kk} × ${kk} = ${dec(x.poids[0]!, 4)}, soit ${dec(x.poids[0]!)}`, tolerance: 0.01 },
          { libelle: "Poids de l'effort du trimestre 2", attendu: auCentieme(x.poids[1]!), calcul: `${reste} × ${kk} = ${dec(x.poids[1]!, 4)}, soit ${dec(x.poids[1]!)}`, tolerance: 0.01 },
          { libelle: "Poids de l'effort du trimestre 3", attendu: auCentieme(x.poids[2]!), calcul: `${reste} = ${dec(x.poids[2]!)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        return [
          `L'effort du trimestre 3 pèse ${dec(x.poids[2]! / x.poids[0]!, 1)} fois plus que celui du trimestre 1 dans le capital qui décide du label du trimestre ${TRIMESTRE_DU_LABEL_VISE}. Les ${x.n} poids font ${dec(x.poidsTotal, 4)}, soit 1 − ${dec(x.k)} puissance ${x.n} : la formule du budget constant n'était que leur somme.`,
          "Un budget dépensé tôt n'est pas perdu : il relève l'attractivité des trimestres qui suivent. Mais pour un capital à une date, c'est le dernier trimestre avant cette date qui compte le plus.",
        ];
      },
    },
    {
      id: "deux-ordres",
      type: "montants",
      titre: "Deux ordres, un même total",
      notions: ["brand_capital", "csr_index"],
      question: (c) => {
        const x = responsabilite(c);
        const [a, b, d] = PLAN_QUI_MONTE.map(eur);
        return `Sans formule. Calculez le capital à la fin du trimestre ${x.n} (au centième) avec le plan qui monte (${a}, ${b}, ${d}), avec le plan qui descend (${d}, ${b}, ${a}), puis avec ${eur(TOUT_AU_T3)} mis au seul trimestre ${x.n}.`;
      },
      champs: (c) => {
        const x = responsabilite(c);
        const reste = dec(1 - x.k);
        const kk = dec(x.k);
        const ef = (b: number) => dec(effortRse(x.f, b));
        const formule = (p: readonly number[]) => `${reste} × (${kk} × ${kk} × ${ef(p[0]!)} + ${kk} × ${ef(p[1]!)} + ${ef(p[2]!)})`;
        return [
          { libelle: "Capital, plan qui monte", attendu: auCentieme(x.monte.fins[2]!), calcul: `${formule(PLAN_QUI_MONTE)} = ${dec(x.monte.fins[2]!)}`, tolerance: 0.01 },
          { libelle: "Capital, plan qui descend", attendu: auCentieme(x.descend.fins[2]!), calcul: `${formule(PLAN_QUI_DESCEND)} = ${dec(x.descend.fins[2]!)}`, tolerance: 0.01 },
          {
            libelle: `Capital, tout au trimestre ${x.n}`,
            attendu: auCentieme(x.toutAuT3.fins[2]!),
            calcul: `${reste} × ln(1 + ${eur(TOUT_AU_T3)} ÷ ${eur(x.r.echelle)}) = ${reste} × ${ef(TOUT_AU_T3)} = ${dec(x.toutAuT3.fins[2]!)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        return [
          `Le plan qui monte finit le trimestre ${x.n} à ${dec(x.monte.fins[2]!)}, au-dessus du seuil ; le plan qui descend à ${dec(x.descend.fins[2]!)}, loin dessous, pour le même total. Dépenser tard compte plus.`,
          `Mais pas tout au dernier moment : ${eur(TOUT_AU_T3)} au seul trimestre ${x.n} ne donnent que ${dec(x.toutAuT3.fins[2]!)}. Le logarithme rend chaque euro en plus d'un même trimestre moins utile que le précédent : il faudrait ${eur(x.budgetToutAuT3)} au trimestre ${x.n} pour atteindre le seuil seul.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Le budget du trimestre 3, à rebours",
      notions: ["brand_capital", "csr_index"],
      question: (c) => {
        const x = responsabilite(c);
        return `${x.f.entreprise} a déjà engagé ${eur(PLAN_QUI_MONTE[0]!)} au trimestre 1 et ${eur(PLAN_QUI_MONTE[1]!)} au trimestre 2. Quel budget faut-il au moins au trimestre ${x.n} pour que le capital de sa fin atteigne ${dec(x.r.seuilDuLabel)} ? Retrouvez le capital de la fin du trimestre 2, l'effort qu'il faut au trimestre ${x.n}, ce budget, puis le coût des trimestres 1 à ${x.n}. Gardez les décimales : l'exponentielle grossit les arrondis.`;
      },
      champs: (c) => {
        const x = responsabilite(c);
        const reste = dec(1 - x.k);
        const kk = dec(x.k);
        return [
          {
            libelle: "Capital à la fin du trimestre 2",
            attendu: auCentieme(x.finT2),
            calcul: `${reste} × (${kk} × ${dec(effortRse(x.f, PLAN_QUI_MONTE[0]!), 4)} + ${dec(effortRse(x.f, PLAN_QUI_MONTE[1]!), 4)}) = ${dec(x.finT2, 4)}`,
            tolerance: 0.01,
          },
          {
            libelle: `Effort nécessaire au trimestre ${x.n}`,
            attendu: auCentieme(x.effortT3ARebours),
            calcul: `(${dec(x.r.seuilDuLabel)} − ${kk} × ${dec(x.finT2, 4)}) ÷ ${reste} = ${dec(x.effortT3ARebours, 4)}`,
            tolerance: 0.01,
          },
          // Un capital ou un effort arrondi au centième déplace le budget de quelques centaines d'euros.
          { libelle: `Budget du trimestre ${x.n}`, attendu: x.budgetT3ARebours, calcul: `${eur(x.r.echelle)} × (e puissance ${dec(x.effortT3ARebours, 4)} − 1) = ${eur(x.budgetT3ARebours)}`, tolerance: 200 },
          {
            libelle: `Coût des trimestres 1 à ${x.n}`,
            attendu: x.coutARebours,
            calcul: `${eur(PLAN_QUI_MONTE[0]!)} + ${eur(PLAN_QUI_MONTE[1]!)} + ${eur(x.budgetT3ARebours)} = ${eur(x.coutARebours)}`,
            tolerance: 200,
          },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        return [
          `Le capital de la fin du trimestre 2 garde ${pct(x.k, 0)} de lui-même : il apporte ${dec(x.k * x.finT2, 4)}, et l'effort du trimestre ${x.n}, pondéré par ${dec(1 - x.k)}, doit faire le reste, ${dec(x.r.seuilDuLabel - x.k * x.finT2, 4)}. Ce plan coûte ${eur(x.coutARebours)} : moins que les ${eur(x.coutConstant)} du budget constant, à peine plus que le plan le moins cher, environ ${eur(Math.round(x.moinsCher.total))}.`,
        ];
      },
    },
    {
      id: "le-plan-le-moins-cher",
      type: "choix",
      titre: "Pourquoi pas tout au trimestre 3 ?",
      notions: ["brand_capital"],
      question: (c) => {
        const x = responsabilite(c);
        const [a, b, d] = x.moinsCher.budgets.map((v) => eur(Math.round(v)));
        return `Le plan le moins cher pour le label au trimestre ${TRIMESTRE_DU_LABEL_VISE} dépense environ ${a}, ${b} puis ${d} (${eur(Math.round(x.moinsCher.total))}). Un collègue s'étonne : puisque le trimestre ${x.n} pèse le plus, pourquoi ne pas tout y mettre ? Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = responsabilite(c);
        return [
          {
            texte: "Chaque euro de plus dans un même trimestre y rapporte moins que le précédent",
            juste: true,
            retour: `Oui. L'effort est le logarithme du budget : le dernier euro d'un trimestre déjà chargé rapporte peu de capital. Le plan le moins cher égalise ce que rapporte le dernier euro de chaque trimestre, pondéré par son poids : c'est pourquoi chaque budget, échelle comprise, y est proportionnel au poids de son trimestre. Tout au trimestre ${x.n}, il faudrait ${eur(x.budgetToutAuT3)}.`,
          },
          {
            texte: `Tout au trimestre ${x.n} serait moins cher, puisqu'il y pèse le plus`,
            juste: false,
            retour: `Non : c'est traiter l'effort comme proportionnel au budget. Tout au trimestre ${x.n}, le label demanderait ${eur(x.budgetToutAuT3)}, bien plus que ${eur(Math.round(x.moinsCher.total))}.`,
          },
          {
            texte: "Le budget constant est le moins cher, parce qu'il étale l'effort",
            juste: false,
            retour: `Non : le budget constant coûte ${eur(x.coutConstant)}, plus que le plan le moins cher. Il donne autant aux premiers trimestres, dont l'inertie oublie une part.`,
          },
          {
            texte: `Il faut aussi dépenser au trimestre ${TRIMESTRE_DU_LABEL_VISE}, celui du label`,
            juste: false,
            retour: `Non : le label du trimestre ${TRIMESTRE_DU_LABEL_VISE} se lit sur le capital de la fin du trimestre ${x.n}. Un budget au trimestre ${TRIMESTRE_DU_LABEL_VISE} ne sert que l'année suivante.`,
          },
        ];
      },
    },
    {
      id: "predire-les-ventes",
      type: "choix",
      titre: "Pariez sur les ventes gagnées",
      notions: ["demand_market_share", "brand_capital"],
      question: (c) => {
        const x = responsabilite(c);
        const [, h2, h3, h4] = x.haussesDAttractivite;
        return `Revenons au budget du cours, ${eur(x.b)} chaque trimestre. Le capital relève l'attractivité ${dE(x.f.entreprise)} de ${dec(h2!, 1)} % au trimestre 2, ${dec(h3!, 1)} % au trimestre 3 et ${dec(h4!, 1)} % au trimestre 4, rien au trimestre 1. Pariez : ses ventes de l'année monteront…`;
      },
      options: (c) => {
        const x = responsabilite(c);
        const voir = "Le curseur suivant compare ce que ces ventes rapportent au coût de l'engagement.";
        const h = x.hausseDesVentes;
        const moins = h < SEUIL_DU_PARI_DES_VENTES;
        const moyenne = !moins && Math.abs(h * 100 - x.hausseMoyenne) < 1;
        const t4 = !moins && !moyenne;
        const dit = (juste: boolean) => `${juste ? "Bon pari" : "Pari à vérifier"}. ${voir}`;
        return [
          { texte: `De moins de ${pct(SEUIL_DU_PARI_DES_VENTES, 0)} : une part monte moins vite que l'attractivité`, juste: moins, retour: dit(moins) },
          { texte: `D'environ ${qte(Math.round(x.hausseMoyenne))} %, la hausse moyenne de l'attractivité`, juste: moyenne, retour: dit(moyenne) },
          { texte: `D'environ ${qte(Math.round(x.haussesDAttractivite[3]!))} %, la hausse du trimestre 4`, juste: t4, retour: dit(t4) },
        ];
      },
    },
    {
      id: "ce-qu-il-faut-vendre",
      type: "curseur",
      titre: "Ce qu'il faudrait vendre en plus",
      notions: ["contribution_margin", "csr_index"],
      question: (c) => {
        const x = responsabilite(c);
        return `L'engagement coûte ${eur(x.annee.cout)} sur l'année ; chaque ${x.f.unite} vendue en plus laisse ${eur(x.m)} de marge sur coût variable. Faites varier les ${x.f.unites} vendues en plus sur l'année, placez le curseur sur le plus petit nombre qui paie l'engagement, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Enceintes vendues en plus sur l'année", unite: ficheDe(c).unites }),
      cible: (c) => ({ attendu: responsabilite(c).ventesPourPayer, min: VENTES_DU_CURSEUR.min, max: VENTES_DU_CURSEUR.max }),
      zones: ["L'engagement se paie dans l'année", "L'engagement ne se paie pas dans l'année"],
      rates: () => ({
        dessous: "À cette position, la marge gagnée ne couvre pas encore le coût de l'engagement.",
        dessus: "Plus bas, la marge gagnée couvre encore l'engagement : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le point mort",
      lecture: (c, q) => {
        const x = responsabilite(c);
        return [
          { libelle: "Marge gagnée", montant: auCentime(x.m * q) },
          { libelle: "Coût de l'engagement", montant: x.annee.cout },
          { libelle: "Écart de résultat", montant: auCentime(x.m * q - x.annee.cout), fort: true },
        ];
      },
      droites: (c) => {
        const x = responsabilite(c);
        return { produit: (q) => x.m * q, cout: () => x.annee.cout, libelles: ["Marge des ventes gagnées", "Coût de l'engagement de l'année"] };
      },
      explication: (c) => {
        const x = responsabilite(c);
        return [
          `Il faudrait ${qte(x.ventesPourPayer)} ${x.f.unites} de plus pour payer ${eur(x.annee.cout)} à ${eur(x.m)} l'${x.f.unite}. Le capital en fait vendre ${qte(x.annee.ventesGagnees)} de plus, ${pct(x.hausseDesVentes)} des ventes : la part de marché monte moins vite que l'attractivité, parce que les autres enseignes gardent la leur au dénominateur.`,
          "L'étape suivante refait l'année entière, trimestre par trimestre.",
        ];
      },
    },
    {
      id: "l-annee-engagee",
      type: "montants",
      titre: "L'année engagée",
      notions: ["contribution_margin", "csr_index"],
      tableau: (c) => {
        const x = responsabilite(c);
        const s = x.annee.sans;
        const a = x.annee.avec;
        return {
          titre: `L'année ${dE(x.f.entreprise)}, sans et avec l'engagement`,
          colonnes: ["Sans engagement", "Au budget du cours"],
          lignes: [
            ...s.trimestres.map((t, i) => ({ libelle: `Ventes du trimestre ${t.trimestre} (${x.f.unites})`, valeurs: [qte(t.ventes), qte(a.trimestres[i]!.ventes)] })),
            { libelle: "Prix de vente", valeurs: [eur(s.offre.prix), eur(a.offre.prix)] },
            { libelle: `Coût variable d'une ${x.f.unite}`, valeurs: [eur(s.coutVariable), eur(a.coutVariable)] },
            { libelle: "Charges fixes de l'année", valeurs: [eur(s.chargesFixes), eur(a.chargesFixes)] },
            { libelle: "Budget qualité de l'année", valeurs: [eur(s.budgetQualite), eur(a.budgetQualite)] },
            { libelle: "Budget RSE de l'année", valeurs: [eur(s.budgetRse), eur(a.budgetRse)] },
          ],
        };
      },
      question: () =>
        "Sans formule. Calculez les ventes gagnées sur l'année, la marge sur coût variable gagnée, le résultat de l'année engagée, puis l'écart de résultat avec l'année sans engagement. Négatif pour un écart défavorable.",
      champs: (c) => {
        const x = responsabilite(c);
        const s = x.annee.sans;
        const a = x.annee.avec;
        return [
          { libelle: "Ventes gagnées sur l'année", attendu: x.annee.ventesGagnees, calcul: `${qte(a.ventes)} − ${qte(s.ventes)} = ${qte(x.annee.ventesGagnees)}` },
          { libelle: "Marge gagnée sur l'année", attendu: x.annee.margeGagnee, calcul: `${qte(x.annee.ventesGagnees)} × (${eur(a.offre.prix)} − ${eur(a.coutVariable)}) = ${eur(x.annee.margeGagnee)}`, tolerance: 1 },
          {
            libelle: "Résultat de l'année engagée",
            attendu: a.resultat,
            calcul: `${qte(a.ventes)} × ${eur(x.m)} − ${eur(a.chargesFixes)} − ${eur(a.budgetQualite)} − ${eur(a.budgetRse)} = ${eur(a.marge)} − ${eur(a.charges)} = ${eur(a.resultat)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat avec l'année sans engagement",
            attendu: x.annee.ecart,
            calcul: `${eur(a.resultat)} − ${entre(s.resultat)} = ${eur(x.annee.ecart)}, soit ${eur(x.annee.margeGagnee)} − ${eur(x.annee.cout)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        return [
          `Les ventes montent de ${qte(x.annee.ventesGagnees)} ${x.f.unites}, à partir du trimestre 2 : la ligne de ${qte(x.nova.capacite)} ${x.f.unites} par trimestre les sert toutes. L'écart de résultat, ${eur(x.annee.ecart)}, est la marge gagnée moins le coût de l'engagement : rien d'autre n'a changé. ${CONVENTION_DES_ECARTS}`,
        ];
      },
    },
    {
      id: "le-cout-complet",
      type: "montants",
      titre: "Le coût complet d'une enceinte",
      notions: ["full_unit_cost", "csr_index"],
      question: (c) => {
        const x = responsabilite(c);
        return `Sans formule. Calculez le coût complet d'une ${x.f.unite} vendue sur l'année, sans engagement puis au budget du cours (au centime), et sa hausse.`;
      },
      champs: (c) => {
        const x = responsabilite(c);
        const s = x.annee.sans;
        const a = x.annee.avec;
        const hausse = auCentime(a.coutComplet - s.coutComplet);
        return [
          { libelle: "Coût complet sans engagement", attendu: s.coutComplet, calcul: `${eur(s.coutVariable)} + ${eur(s.charges)} ÷ ${qte(s.ventes)} = ${eur(s.coutComplet)}` },
          { libelle: "Coût complet au budget du cours", attendu: a.coutComplet, calcul: `${eur(a.coutVariable)} + ${eur(a.charges)} ÷ ${qte(a.ventes)} = ${eur(a.coutComplet)}` },
          { libelle: "Hausse du coût complet", attendu: hausse, calcul: `${eur(a.coutComplet)} − ${eur(s.coutComplet)} = ${eur(hausse)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        const s = x.annee.sans;
        const a = x.annee.avec;
        return [
          `L'engagement ajoute ${eur(x.annee.cout)} de charges, répartis sur ${qte(a.ventes)} ${x.f.unites} : le coût complet monte de ${eur(auCentime(a.coutComplet - s.coutComplet))}, à prix inchangé. Les ventes en plus amortissent une partie des charges fixes, mais pas assez : il faudrait vendre ${qte(x.ventesPourPayer)} ${x.f.unites} de plus, et non ${qte(x.annee.ventesGagnees)}.`,
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "L'engagement de l'année a-t-il payé ?",
      notions: ["csr_index", "brand_capital"],
      question: (c) => {
        const x = responsabilite(c);
        return `Sur l'année, l'engagement coûte ${eur(x.annee.cout)} à ${x.f.entreprise}, et le résultat change de ${eur(x.annee.ecart)}. Que retenir ?`;
      },
      options: (c) => {
        const x = responsabilite(c);
        const v = x.annee.verdict;
        return [
          {
            texte: "Il paie déjà : la marge gagnée dépasse son coût dès la première année",
            juste: v === "paie-deja",
            retour:
              v === "paie-deja"
                ? `Oui : la marge gagnée, ${eur(x.annee.margeGagnee)}, dépasse les ${eur(x.annee.cout)} de l'engagement.`
                : `Non : le résultat ${x.annee.ecart < 0 ? `baisse de ${eur(-x.annee.ecart)}` : "ne monte pas"}.`,
          },
          {
            texte: "Pas encore : la demande gagnée se vend, mais pas assez pour payer l'année",
            juste: v === "pas-encore",
            retour:
              v === "pas-encore"
                ? `Oui : ${x.f.entreprise} vend ${qte(x.annee.ventesGagnees)} ${x.f.unites} de plus, mais la marge gagnée (${eur(x.annee.margeGagnee)}) reste sous le coût de l'engagement (${eur(x.annee.cout)}). Le capital bâti cette année, ${dec(x.capitalFin)}, reste au début de l'année suivante : c'est sur plusieurs années que l'engagement se juge.`
                : v === "paie-deja"
                  ? `Non : la marge gagnée dépasse déjà le coût, et le résultat monte de ${eur(x.annee.ecart)}.`
                  : "Non : les ventes n'ont pas bougé du tout.",
          },
          {
            texte: "La demande gagnée ne se vend pas : la ligne ne sert pas plus de clients",
            juste: v === "la-demande-ne-se-vend-pas",
            retour:
              v === "la-demande-ne-se-vend-pas"
                ? `Oui : la demande monte, mais la ligne de ${qte(x.nova.capacite)} ${x.f.unites} par trimestre ne la sert pas.`
                : `Non : les ventes montent de ${qte(x.annee.ventesGagnees)} ${x.f.unites}, et la ligne de ${qte(x.nova.capacite)} ${x.f.unites} par trimestre les sert toutes.`,
          },
        ];
      },
    },
    {
      id: "a-budget-du-t4-egal",
      type: "montants",
      titre: "Comparer à budget du trimestre 4 égal",
      notions: ["csr_index", "brand_capital"],
      tableau: (c) => {
        const x = responsabilite(c);
        const col = [x.annee, x.sansT4, x.anneeMonte];
        const label = (e: (typeof col)[number]) => (e.labels.premier === null ? "aucun" : `au trimestre ${e.labels.premier}`);
        return {
          titre: "Le budget du cours et le plan qui monte, sur l'année",
          colonnes: ["Budget du cours", "Budget du cours sans le trimestre 4", "Plan qui monte"],
          lignes: [
            { libelle: "Budget RSE des trimestres 1 à 3", valeurs: col.map((e) => eur(somme(e.budgets.slice(0, 3)))) },
            { libelle: "Budget RSE du trimestre 4", valeurs: col.map((e) => eur(e.budgets[3]!)) },
            { libelle: "Capital à la fin du trimestre 3", valeurs: col.map((e) => dec(e.capital.fins[2]!)) },
            { libelle: "Label dans l'année", valeurs: col.map(label) },
            { libelle: `Ventes de l'année (${x.f.unites})`, valeurs: col.map((e) => qte(e.avec.ventes)) },
            { libelle: "Résultat de l'année", valeurs: col.map((e) => eur(e.avec.resultat)) },
            { libelle: "Capital à la fin de l'année", valeurs: col.map((e) => dec(e.capital.fins[3]!)) },
          ],
        };
      },
      question: () =>
        `Un collègue conclut du laboratoire que le label paie : le plan qui monte finit l'année au-dessus du budget du cours. Calculez cet écart, puis ce que le budget du trimestre ${TRIMESTRE_DU_LABEL_VISE} change au résultat de l'année au budget du cours, et l'écart du plan qui monte à budget du trimestre ${TRIMESTRE_DU_LABEL_VISE} égal. Négatif pour un écart défavorable.`,
      champs: (c) => {
        const x = responsabilite(c);
        return [
          {
            libelle: "Écart du plan qui monte au budget du cours",
            attendu: x.ecartMonteAuCours,
            calcul: `${eur(x.anneeMonte.avec.resultat)} − ${entre(x.annee.avec.resultat)} = ${eur(x.ecartMonteAuCours)}`,
            tolerance: 1,
          },
          {
            libelle: `Effet du budget du trimestre ${TRIMESTRE_DU_LABEL_VISE} sur le résultat de l'année`,
            attendu: x.effetDuT4,
            calcul: `${eur(x.annee.avec.resultat)} − ${entre(x.sansT4.avec.resultat)} = ${eur(x.effetDuT4)}, le budget lui-même : il ne fait rien vendre cette année`,
            tolerance: 1,
          },
          {
            libelle: `Écart du plan qui monte, à budget du trimestre ${TRIMESTRE_DU_LABEL_VISE} égal`,
            attendu: x.ecartMonteAT4Egal,
            calcul: `${eur(x.anneeMonte.avec.resultat)} − ${entre(x.sansT4.avec.resultat)} = ${eur(x.ecartMonteAT4Egal)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        const ventes = x.anneeMonte.avec.ventes - x.sansT4.avec.ventes;
        const enPlus = somme(PLAN_QUI_MONTE) - x.n * x.b;
        return [
          `Les ${eur(x.ecartMonteAuCours)} du collègue ne viennent pas du label : le budget du cours dépense ${eur(x.b)} au trimestre ${TRIMESTRE_DU_LABEL_VISE}, qui ne rapportent rien cette année (le capital qu'ils bâtissent joue l'année suivante), quand le plan qui monte n'y dépense rien. À budget du trimestre ${TRIMESTRE_DU_LABEL_VISE} égal, les deux plans disent l'inverse : le label coûte ${eur(enPlus)} de plus sur les trimestres 1 à ${x.n}, fait vendre ${qte(ventes)} ${x.f.unites} de plus, et l'année finit ${sensDuResultat(x.ecartMonteAT4Egal)} que le budget du cours sans le trimestre ${TRIMESTRE_DU_LABEL_VISE}.`,
          `Comparer deux plans, c'est les comparer à tout le reste égal. Et le plan qui monte finit l'année avec un capital plus bas, ${dec(x.anneeMonte.capital.fins[3]!)} contre ${dec(x.annee.capital.fins[3]!)} : l'année suivante commence moins bien.`,
        ];
      },
    },
    {
      id: "le-label-des-le-t3",
      type: "montants",
      titre: "Variante : le label dès le trimestre 3",
      notions: ["brand_capital", "csr_index"],
      tableau: (c) => {
        const x = responsabilite(c);
        const col = [x.anneeMonte, x.anneeT3];
        return {
          titre: `Les mêmes ${eur(x.totalDuPlan)}, à deux dates`,
          colonnes: ["Plan qui monte", "Plan du trimestre 3"],
          lignes: [
            ...[0, 1, 2, 3].map((i) => ({ libelle: `Budget RSE du trimestre ${i + 1}`, valeurs: col.map((e) => eur(e.budgets[i]!)) })),
            { libelle: `Ventes de l'année (${x.f.unites})`, valeurs: col.map((e) => qte(e.avec.ventes)) },
            { libelle: "Résultat de l'année", valeurs: col.map((e) => eur(e.avec.resultat)) },
            { libelle: "Résultat au budget du cours sans le trimestre 4", valeurs: col.map(() => eur(x.sansT4.avec.resultat)) },
            { libelle: "Résultat sans engagement", valeurs: col.map(() => eur(x.annee.sans.resultat)) },
          ],
        };
      },
      question: (c) => {
        const x = responsabilite(c);
        return `Les mêmes ${eur(x.totalDuPlan)}, mais aux trimestres 1 et 2 : ${eur(PLAN_DU_T3[0]!)} puis ${eur(PLAN_DU_T3[1]!)}, plus rien ensuite. Calculez le capital à la fin du trimestre 2 (au centième), puis l'écart de résultat de ce plan avec le budget du cours sans le trimestre 4, et avec l'année sans engagement. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = responsabilite(c);
        const reste = dec(1 - x.k);
        const kk = dec(x.k);
        const r = x.anneeT3.avec.resultat;
        return [
          {
            libelle: "Capital à la fin du trimestre 2",
            attendu: auCentieme(x.capitalT2DuPlanT3),
            calcul: `${reste} × (${kk} × ${dec(effortRse(x.f, PLAN_DU_T3[0]!))} + ${dec(effortRse(x.f, PLAN_DU_T3[1]!))}) = ${dec(x.capitalT2DuPlanT3)}`,
            tolerance: 0.01,
          },
          { libelle: "Écart au budget du cours sans le trimestre 4", attendu: x.ecartT3AuCours, calcul: `${eur(r)} − ${entre(x.sansT4.avec.resultat)} = ${eur(x.ecartT3AuCours)}`, tolerance: 1 },
          { libelle: "Écart à l'année sans engagement", attendu: x.ecartT3AuSans, calcul: `${eur(r)} − ${entre(x.annee.sans.resultat)} = ${eur(x.ecartT3AuSans)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = responsabilite(c);
        return [
          `${dec(x.capitalT2DuPlanT3)} à la fin du trimestre 2 : le label vient dès le trimestre ${x.anneeT3.labels.premier}, le premier où la simulation l'accorde, et joue ${qte(x.trimestresDeLabelT3)} trimestres dans l'année au lieu d'un. Pour le même budget, l'année finit ${sensDuResultat(auCentime(x.anneeT3.avec.resultat - x.anneeMonte.avec.resultat))} qu'avec le plan qui monte, et ${sensDuResultat(x.ecartT3AuCours)} qu'au budget du cours, à budget du trimestre ${TRIMESTRE_DU_LABEL_VISE} égal.`,
          `Dépenser tard, c'est dépenser juste avant la date du label ; et la date compte autant que le budget. L'année reste pourtant ${eur(-x.ecartT3AuSans)} sous l'année sans engagement : même bien placé, l'engagement ne se paie pas en une année.`,
        ];
      },
    },
    {
      id: "ce-que-paie-le-label",
      type: "choix",
      titre: "Ce que le label rapporte dans l'année",
      notions: ["csr_index", "brand_capital"],
      question: (c) => {
        const x = responsabilite(c);
        return `Le label relève l'attractivité de ${pct(x.r.bonusDuLabel, 0)} tant qu'il joue. Dans l'année de la simulation du cours, que retenir de ce qu'il rapporte ?`;
      },
      options: (c) => {
        const x = responsabilite(c);
        const t4 = x.anneeMonte.avec.trimestres[3]!.ventes - x.sansT4.avec.trimestres[3]!.ventes;
        const tot = x.ecartT3AuCours > 0 && x.ecartMonteAT4Egal < 0;
        return [
          {
            texte: "Plus il vient tôt, plus il rapporte : au trimestre 3, il paie son budget",
            juste: tot,
            retour: tot
              ? `Oui : au trimestre ${TRIMESTRE_DU_LABEL_VISE}, il ne joue qu'un trimestre, et l'année finit ${sensDuResultat(x.ecartMonteAT4Egal)} qu'au budget du cours ; dès le trimestre 3, il en joue ${qte(x.trimestresDeLabelT3)}, et l'année finit ${sensDuResultat(x.ecartT3AuCours)}, à budget du trimestre ${TRIMESTRE_DU_LABEL_VISE} égal. Aucun plan ne bat pour autant l'année sans engagement.`
              : "Non : dans cette année, la date du label ne change pas son verdict.",
          },
          {
            texte: "Il paie dès le trimestre 4 : l'année finit au-dessus du budget du cours",
            juste: false,
            retour: `Non : c'est comparer deux plans qui ne dépensent pas la même chose au trimestre ${TRIMESTRE_DU_LABEL_VISE}. À budget du trimestre ${TRIMESTRE_DU_LABEL_VISE} égal, le label du trimestre ${TRIMESTRE_DU_LABEL_VISE} finit ${sensDuResultat(x.ecartMonteAT4Egal)}.`,
          },
          {
            texte: `Il fait vendre ${pct(x.r.bonusDuLabel, 0)} de plus tant qu'il joue`,
            juste: false,
            retour: `Non : ${pct(x.r.bonusDuLabel, 0)} d'attractivité ne font pas ${pct(x.r.bonusDuLabel, 0)} de ventes, car la part de marché monte moins vite. Au trimestre ${TRIMESTRE_DU_LABEL_VISE}, le plan qui monte vend ${qte(t4)} ${x.f.unites} de plus que le budget du cours.`,
          },
        ];
      },
    },
    {
      id: "de-fond",
      type: "choix",
      titre: "Contrainte, investissement ou stratégie ?",
      notions: ["csr_index", "brand_capital"],
      question: () => "Dans la simulation du cours, qu'est-ce que l'engagement RSE ?",
      options: (c) => {
        const x = responsabilite(c);
        return [
          {
            texte: "Une contrainte : une charge qu'on subit, sans rien en retour",
            juste: false,
            retour: `Non : rien n'oblige ${x.f.entreprise} à s'engager, et rien ne la punit si elle ne le fait pas ; SoundBox n'engage rien. Et l'engagement rapporte : ${qte(x.annee.ventesGagnees)} ${x.f.unites} vendues de plus dès la première année. Hors de la simulation, des obligations existent (les grandes entreprises publient des informations de durabilité) ; la simulation du cours n'en retient aucune.`,
          },
          {
            texte: "Un investissement : un capital payé maintenant, qui rapporte ensuite",
            juste: true,
            retour: `Oui : la dépense est une charge du trimestre, et elle bâtit un capital qui relève l'attractivité les trimestres suivants. Le capital garde ${pct(x.k, 0)} de lui-même chaque trimestre : il s'use lentement si l'on arrête. Devenu assez fort pour le label, il distingue l'offre : une stratégie de différenciation, qui se juge sur plusieurs années, et qui demande un budget assez fort et bien placé.`,
          },
          {
            texte: "Une publicité : elle fait vendre dans son trimestre, puis s'éteint",
            juste: false,
            retour: "Non : l'engagement d'un trimestre ne rapporte rien dans le trimestre même ; il joue à partir du suivant, et dure. C'est l'inverse de la publicité, qui agit tout de suite et s'éteint vite.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["csr_index", "brand_capital"],
      texte: (c) => {
        const x = responsabilite(c);
        return [
          `Chez ${x.f.entreprise}, ${eur(x.b)} de budget RSE par trimestre ne donnent jamais le label : le capital plafonne à l'effort, ${dec(x.effort)}, sous le seuil de ${dec(x.r.seuilDuLabel)}, et il manque ${eur(x.manque)} par trimestre. Sur l'année, l'engagement coûte ${eur(x.annee.cout)}, fait vendre ${qte(x.annee.ventesGagnees)} ${x.f.unites} de plus et change le résultat de ${eur(x.annee.ecart)} : pas encore.`,
          `L'inertie fait compter plus les derniers euros avant la date du label : le budget constant qui l'obtient au trimestre ${TRIMESTRE_DU_LABEL_VISE} coûte ${eur(x.coutConstant)}, le plan qui monte ${eur(x.totalDuPlan)}, le moins cher environ ${eur(Math.round(x.moinsCher.total))}. Mais le budget d'un même trimestre rapporte de moins en moins, et un plan ne se compare à un autre qu'à tout le reste égal, budget du dernier trimestre compris. Dès le trimestre 3, le label paie son budget ; il ne paie pas encore l'engagement entier.`,
          "Au niveau de l'examen, vous savez bâtir un capital trimestre par trimestre, dire le budget sous lequel un seuil ne s'atteint jamais, retrouver un budget à rebours, chiffrer ce qu'un engagement coûte et rapporte sur l'année, coût complet compris, et critiquer une comparaison qui ne tient pas tout le reste égal.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Capital à budget constant après n trimestres = effort × (1 − inertie puissance n) ; il tend vers l'effort sans le dépasser. Poids de l'effort du trimestre t dans le capital du trimestre n = (1 − inertie) × inertie puissance (n − t).",
    },
  ],
};
