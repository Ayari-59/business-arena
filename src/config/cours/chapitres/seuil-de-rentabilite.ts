import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { accord } from "../accords";
import type { Cas } from "../cas";
import { coutsDeLaGamme, donneesDuMois, seuilDeRentabilite } from "../monde/couts-et-budgets";
import { GESTION_DU_COURS, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE SEUIL DE RENTABILITÉ (contrôle de gestion, palier 2 ; BTS CG, DCG UE11, BUT GEA et
 * GACO). C'est la porte d'entrée du parcours : la progression commence doucement, puis monte jusqu'au
 * niveau de l'examen.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le mois de
 * janvier de NOVA a une fiche figée (monde/nova-gestion.ts) et le seuil se calcule par le modèle du
 * cours (monde/couts-et-budgets.ts, `seuilDeRentabilite`, `coutsDeLaGamme`). Une évolution du moteur
 * ne change rien ici.
 *
 * L'objet : à partir de combien de ventes NOVA gagne-t-elle de l'argent ? L'élève range les charges
 * (variables ou fixes), bâtit le compte de résultat différentiel, trouve le seuil sur la simulation
 * avant de le calculer, puis le point mort, la marge et l'indice de sécurité. Il cherche ensuite les
 * charges fixes que NOVA peut porter, mesure ce que coûte une baisse de prix, et fait jouer prix,
 * coût variable, charges fixes et ventes ensemble au laboratoire. L'expert lit le levier
 * opérationnel, calcule le seuil d'une gamme de trois références et franchit un palier de charges
 * fixes.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, classement, marge-unitaire, resultat-differentiel, une-de-plus, seuil (la
 *     formule est au repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-seuil
 *     puis simulation (un curseur sur les ventes, le chiffre d'affaires face au coût total, qui se
 *     croisent au seuil) avant seuil ; predire-les-fixes puis les-fixes-au-curseur (un curseur sur
 *     les charges fixes, face à la marge de janvier) avant les-fixes-tenables ;
 *   · autonome : securite, les-fixes-tenables (ni formule ni chiffres à prendre ; le calcul de la
 *     correction montre le chemin) ;
 *   · le laboratoire : le-laboratoire-du-seuil (prix, coût variable, charges fixes et ventes ; baisser
 *     le prix de 10 % sans monter le seuil ; un graphique du seuil selon le prix, qui n'est pas une
 *     droite), après la variante baisse-de-prix ;
 *   · expert : baisse-de-prix (une variante chiffrée), le-levier-operationnel et lire-le-levier (la
 *     sensibilité du résultat, et ce qu'elle dit), seuil-de-la-gamme et la-composition-de-la-gamme
 *     (le seuil multi-produits, et ce que la composition lui fait), charges-fixes-par-paliers et
 *     franchir-le-palier (deux seuils, et un jugement) ; puis la synthèse.
 */

/** La baisse de prix qu'envisage le dirigeant, face à un concurrent qui casse les siens. */
export const BAISSE_DE_PRIX = 0.1;

/** La baisse des ventes sur laquelle se lit le levier opérationnel : 5 % de chiffre d'affaires en moins. */
export const BAISSE_DES_VENTES_DU_LEVIER = 0.05;

/**
 * LES CHARGES FIXES PAR PALIERS, hypothèse du cours : au-delà de son activité normale (2 120 enceintes
 * par mois, la fiche), NOVA doit louer un second atelier (8 000 € par mois) et embaucher deux
 * salariés (7 000 € par mois) : ses charges fixes montent d'un coup de 15 000 €.
 */
export const SUPPLEMENT_DU_PALIER = 15_000;

/** La demande que le dirigeant croit pouvoir servir au-delà du palier, en enceintes par mois (hypothèse du cours). */
export const DEMANDE_AU_DELA_DU_PALIER = 2_400;

/** Les bornes du curseur des charges fixes, en euros. */
export const FIXES_DU_CURSEUR = { min: 25_000, max: 40_000 } as const;

/** Les leviers du laboratoire du seuil : leurs bornes et leur pas. */
export const LEVIERS_DU_LABORATOIRE = {
  prix: { min: 45, max: 70, pas: 0.1 },
  coutVariable: { min: 28, max: 40, pas: 0.1 },
  chargesFixes: { min: 15_000, max: 40_000, pas: 1 },
  ventes: { min: 1_000, max: 2_500, pas: 10 },
} as const;

/** Le seuil se calcule sur le mois de janvier de NOVA, la fiche de gestion du monde du cours. */
export const ENTREPRISES_DU_SEUIL: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number, d = 2) => `${qte(t * 100, d)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Arrondi à l'unité supérieure, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);
const majuscule = (t: string) => `${t.charAt(0).toUpperCase()}${t.slice(1)}`;

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** Le seuil du mois, et tout ce que le chapitre en demande, calculé une fois sur la fiche. */
export function seuilDuMois(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = f.moisDeReference;
  const s = seuilDeRentabilite(donneesDuMois(f));
  const ch = m.chargesFixes;
  const achats = auCentime(m.quantite * m.coutVariable.composants);
  const autres = auCentime(m.quantite * m.coutVariable.autres);
  // L'erreur classique : le prix moins le coût complet, comme si une vente de plus portait des fixes.
  const coutCompletUnitaire = (s.chargesVariables + s.chargesFixes) / m.quantite;
  const seuilQuantite = s.seuilQuantite!;
  const seuilValeur = s.seuilValeur!;
  const margeDeSecurite = s.margeDeSecurite!;
  const indiceDeSecurite = s.indiceDeSecurite!;
  // Les charges fixes tenables : la marge de janvier, toute entière.
  const fixesTenables = s.marge;
  const hausseTenable = (fixesTenables - s.chargesFixes) / s.chargesFixes;
  // La baisse de prix : la nouvelle marge, le nouveau seuil, et les ventes qui gardent le résultat.
  const prixBaisse = auCentime(m.prix * (1 - BAISSE_DE_PRIX));
  const b = seuilDeRentabilite(donneesDuMois(f, { prix: prixBaisse }));
  const ventesPourLeResultat = plafond((s.chargesFixes + s.resultat) / b.margeUnitaire);
  // Le défi du laboratoire : le coût variable (au dixième) ou les charges fixes (à l'euro) qui gardent le seuil de janvier.
  const coutVariablePlafond = Math.floor((prixBaisse - s.chargesFixes / seuilQuantite) * 10 + 1e-9) / 10;
  const fixesPlafond = Math.floor(seuilQuantite * b.margeUnitaire + 1e-9);
  // Le levier opérationnel, et ce qu'il annonce pour 5 % de ventes en moins.
  const levier = s.levierOperationnel!;
  const margeApresBaisse = auCentime(s.marge * (1 - BAISSE_DES_VENTES_DU_LEVIER));
  const resultatApresBaisse = auCentime(margeApresBaisse - s.chargesFixes);
  const variationDuResultat = (resultatApresBaisse - s.resultat) / s.resultat;
  // La gamme : les charges communes et la publicité des trois références, sur leur taux de marge moyen.
  const g = coutsDeLaGamme(f);
  const gamme = {
    references: g.parReference.map((r) => ({
      code: r.code,
      nom: r.nom,
      quantite: r.quantite,
      prix: r.prix,
      coutVariable: r.coutVariableUnitaire,
      publicite: r.publicite,
      taux: (r.prix - r.coutVariableUnitaire) / r.prix,
    })),
    communes: g.communes,
    publicite: g.publicite,
    chargesFixes: g.seuil.chargesFixes,
    chiffreDAffaires: g.seuil.chiffreDAffaires,
    marge: g.seuil.marge,
    taux: g.seuil.tauxDeMarge,
    seuilValeur: g.seuil.seuilValeur,
    indice: g.seuil.indiceDeSecurite,
  };
  // Les charges fixes par paliers : au-delà de l'activité normale, un second atelier et deux salariés.
  const limite = f.centres.activiteNormale;
  const fixesDuPalier = s.chargesFixes + SUPPLEMENT_DU_PALIER;
  const resultatA = (q: number) => auCentime(q * s.margeUnitaire - (q > limite ? fixesDuPalier : s.chargesFixes));
  const palier = {
    limite,
    fixes: fixesDuPalier,
    resultatALaLimite: resultatA(limite),
    resultatApresLaLimite: resultatA(limite + 1),
    secondSeuil: plafond(fixesDuPalier / s.margeUnitaire),
    resultatALaDemande: resultatA(DEMANDE_AU_DELA_DU_PALIER),
    /** Le plus petit volume, au-delà du palier, qui gagne plus que l'activité normale. */
    pourFaireMieux: Math.floor((resultatA(limite) + fixesDuPalier) / s.margeUnitaire + 1e-9) + 1,
  };
  return {
    f,
    m,
    s,
    ch,
    achats,
    autres,
    coutCompletUnitaire,
    seuilQuantite,
    seuilValeur,
    margeDeSecurite,
    indiceDeSecurite,
    fixesTenables,
    hausseTenable,
    seuilAuPlafond: plafond(fixesTenables / s.margeUnitaire),
    prixBaisse,
    margeBaisse: b.margeUnitaire,
    seuilBaisse: b.seuilQuantite!,
    ventesPourLeResultat,
    coutVariablePlafond,
    fixesPlafond,
    levier,
    margeApresBaisse,
    resultatApresBaisse,
    variationDuResultat,
    gamme,
    palier,
    /** L'erreur du pari : les charges fixes divisées par le prix. */
    seuilSurLePrix: plafond(s.chargesFixes / m.prix),
  };
}

export type SeuilDuMois = ReturnType<typeof seuilDuMois>;

/** Une position du laboratoire : le prix, le coût variable d'une unité, les charges fixes et les ventes. */
export interface PositionDuSeuil {
  prix: number;
  coutVariable: number;
  chargesFixes: number;
  ventes: number;
}

/** Le seuil pour un prix, un coût variable, des charges fixes et des ventes quelconques : le laboratoire. */
export function laboratoireDuSeuil(x: SeuilDuMois, p: PositionDuSeuil) {
  const marge = auCentime(p.prix - p.coutVariable);
  const chiffreDAffaires = auCentime(p.ventes * p.prix);
  const seuilExact = p.chargesFixes / marge;
  const seuilValeur = auCentime((p.chargesFixes * p.prix) / marge);
  return {
    marge,
    seuilExact,
    seuilQuantite: plafond(seuilExact),
    seuilValeur,
    indice: auCentime(((chiffreDAffaires - seuilValeur) / chiffreDAffaires) * 100),
    resultat: auCentime(p.ventes * marge - p.chargesFixes),
    /** Le défi : un prix baissé de 10 % au moins, et un seuil qui ne dépasse pas celui de janvier. */
    reussi: p.prix <= x.prixBaisse + 1e-9 && plafond(seuilExact) <= x.seuilQuantite,
  };
}

const position = (p: Readonly<Record<string, number>>): PositionDuSeuil => ({ prix: p.prix!, coutVariable: p.coutVariable!, chargesFixes: p.chargesFixes!, ventes: p.ventes! });

/** Le mois de janvier de NOVA : le document du chapitre. */
export function tableauDuMois(c: Pick<Cas, "code">): TableauDeDonnees {
  const { f, m, ch } = seuilDuMois(c);
  return {
    titre: `Le mois de janvier de ${f.entreprise}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: `${majuscule(f.unites)} ${accord(f, "vendu")}s`, valeurs: [qte(m.quantite)] },
      { libelle: `Prix de vente d'une ${f.unite}, hors taxes`, valeurs: [eur(m.prix)] },
      { libelle: `Composants d'une ${f.unite}`, valeurs: [eur(m.coutVariable.composants)] },
      { libelle: `Autres coûts d'une ${f.unite} (${m.autresCoutsVariables})`, valeurs: [eur(m.coutVariable.autres)] },
      { libelle: "Loyer du local, du mois", valeurs: [eur(ch.loyer)] },
      { libelle: "Personnel, salaires et cotisations du mois", valeurs: [eur(ch.personnel)] },
      { libelle: "Usure de la ligne de montage, du mois", valeurs: [eur(ch.amortissement)] },
    ],
  };
}

/** La gamme de NOVA, plus tard : le document du seuil multi-produits. */
function tableauDeLaGamme(x: SeuilDuMois): TableauDeDonnees {
  return {
    titre: `La gamme de ${x.f.entreprise}, un mois`,
    colonnes: ["Unités vendues", "Prix de vente", "Coût variable d'une unité", "Publicité du mois"],
    lignes: x.gamme.references.map((r) => ({ libelle: r.nom, valeurs: [qte(r.quantite), eur(r.prix), eur(r.coutVariable), eur(r.publicite)] })),
  };
}

/** NOVA One, la référence la plus vendue de la gamme. */
const laPlusVendue = (x: SeuilDuMois) => [...x.gamme.references].sort((a, b) => b.quantite - a.quantite)[0]!;

const voirLeCurseur = "Déplacez le curseur à l'étape suivante : la simulation tranchera.";

export const SEUIL_DE_RENTABILITE: Chapitre = {
  code: "seuil-de-rentabilite",
  parcours: "controle-de-gestion",
  palier: 2,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
    "BTS MHR Bloc 4 · Pilotage de la production de services en hôtellerie restauration",
  ],
  titre: "Le seuil de rentabilité",
  accroche:
    "À partir de combien de ventes l'entreprise gagne-t-elle de l'argent ? Vous le trouvez sur la simulation, puis vous le calculez, jusqu'au levier opérationnel, au seuil d'une gamme et aux charges fixes par paliers.",
  objectifs: [
    "Distinguer les charges variables des charges fixes, et bâtir un compte de résultat différentiel",
    "Calculer la marge sur coût variable, le seuil de rentabilité en quantité et en valeur, et le point mort",
    "Mesurer la marge et l'indice de sécurité, et les charges fixes qu'une entreprise peut porter",
    "Chiffrer l'effet d'une baisse de prix, et lire le levier opérationnel",
    "Calculer le seuil d'une gamme et celui de charges fixes par paliers, et en tirer une décision",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SEUIL,
    pourquoi:
      "le seuil se calcule ici sur le mois de janvier de NOVA, dans la simulation du cours, avec ses prix, ses coûts et ses charges fixes ; la méthode est celle que vous appliquerez à votre entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La question du dirigeant",
      notions: ["fixed_costs", "variable_costs"],
      tableau: tableauDuMois,
      texte: (c) => {
        const { f, m, s } = seuilDuMois(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, qui fabrique et vend des ${f.unites}. Le mois étudié est janvier : ${qte(m.quantite)} ${f.unites} ${accord(f, "vendu")}s à ${eur(m.prix)} hors taxes, soit ${eur(s.chiffreDAffaires)} de chiffre d'affaires.`,
          `La simulation suppose un seul prix pour toutes les ${f.unites}, des coûts variables qui suivent exactement les ventes (${f.entreprise} fabrique ce qu'elle vend, sans stock), des charges fixes qui ne bougent pas tant que l'activité reste sous ${qte(f.centres.activiteNormale)} ${f.unites} par mois, et des ventes régulières sur les ${qte(m.jours)} jours du mois.`,
          `Le dirigeant pose une seule question : à partir de combien d'${f.unites} ${accord(f, "vendu")}s par mois l'entreprise gagne-t-elle de l'argent ? La comptabilité générale dit ce qui s'est passé ; le contrôle de gestion aide à décider ce qui va se passer.`,
          "Pour répondre, il faut d'abord savoir quelles charges grandissent avec les ventes, et lesquelles restent les mêmes quoi qu'on vende.",
        ];
      },
      repere: () =>
        "Une charge variable suit les quantités vendues : deux fois plus de ventes, deux fois plus de charge. Une charge fixe ne bouge pas, dans les limites de la capacité de l'entreprise.",
    },
    {
      id: "classement",
      type: "tri",
      titre: "Variables ou fixes",
      notions: ["fixed_costs", "variable_costs"],
      question: (c) => `Voici les charges de ${ficheDe(c).entreprise} en janvier. Rangez chacune : variable ou fixe ?`,
      categories: [
        { code: "variable", libelle: "Variable" },
        { code: "fixe", libelle: "Fixe" },
      ],
      elements: (c) => {
        const { f, m, ch, achats, autres } = seuilDuMois(c);
        return [
          { libelle: "Composants consommés", montant: achats, categorie: "variable", pourquoi: `${eur(m.coutVariable.composants)} par ${f.unite} : sans vente, pas de composant à acheter.` },
          { libelle: `Autres coûts par ${f.unite} (${m.autresCoutsVariables})`, montant: autres, categorie: "variable", pourquoi: `${eur(m.coutVariable.autres)} par ${f.unite} : ils suivent les ventes.` },
          { libelle: "Loyer du local", montant: ch.loyer, categorie: "fixe", pourquoi: "Le même chaque mois, quoi qu'on vende." },
          { libelle: "Personnel (salaires et cotisations)", montant: ch.personnel, categorie: "fixe", pourquoi: "Les salariés sont payés le même salaire, que le mois soit bon ou mauvais." },
          {
            libelle: "Usure de la ligne de montage (amortissement)",
            montant: ch.amortissement,
            categorie: "fixe",
            pourquoi: "La ligne s'use au fil des mois, qu'elle tourne beaucoup ou peu : son amortissement est le même chaque mois.",
          },
        ];
      },
      explication: (c) => {
        const { f, s } = seuilDuMois(c);
        return [
          `Les charges variables de janvier font ${eur(s.chargesVariables)}, soit ${eur(s.coutVariableUnitaire)} par ${f.unite}. Les charges fixes font ${eur(s.chargesFixes)}, quoi qu'on vende.`,
          "Le personnel est fixe ici : ce mois-là, l'effectif ne change pas avec les ventes. Une entreprise qui paierait ses vendeurs à la commission en aurait une part variable.",
        ];
      },
    },
    {
      id: "marge-unitaire",
      type: "montants",
      titre: "La marge sur coût variable",
      notions: ["contribution_margin", "margin_rates"],
      question: (c) => {
        const { f, m } = seuilDuMois(c);
        return `Chaque ${f.unite} se vend ${eur(m.prix)} hors taxes et coûte ${eur(m.coutVariable.composants)} de composants et ${eur(m.coutVariable.autres)} d'autres coûts variables. Calculez le coût variable d'une ${f.unite}, sa marge sur coût variable (le prix moins le coût variable), puis le taux de marge (la marge rapportée au prix), en pourcentage.`;
      },
      champs: (c) => {
        const { m, s } = seuilDuMois(c);
        return [
          { libelle: "Coût variable unitaire", attendu: s.coutVariableUnitaire, calcul: `${eur(m.coutVariable.composants)} + ${eur(m.coutVariable.autres)} = ${eur(s.coutVariableUnitaire)}` },
          { libelle: "Marge sur coût variable unitaire", attendu: s.margeUnitaire, calcul: `${eur(m.prix)} − ${eur(s.coutVariableUnitaire)} = ${eur(s.margeUnitaire)}` },
          { libelle: "Taux de marge sur coût variable, en %", attendu: auCentime(s.tauxDeMarge * 100), tolerance: 0.1, calcul: `${eur(s.margeUnitaire)} ÷ ${eur(m.prix)} = ${pct(s.tauxDeMarge)}` },
        ];
      },
      explication: (c) => {
        const { f, s } = seuilDuMois(c);
        return [
          `Chaque ${f.unite} ${accord(f, "vendu")} laisse ${eur(s.margeUnitaire)} une fois payés ses coûts variables. C'est cette marge, et elle seule, qui sert à payer les charges fixes ; ce qui reste ensuite est le bénéfice.`,
          `Le taux, ${pct(s.tauxDeMarge)}, dit la même chose pour 1 € de chiffre d'affaires : ${pct(s.tauxDeMarge)} de chaque euro vendu restent pour couvrir les charges fixes.`,
        ];
      },
    },
    {
      id: "resultat-differentiel",
      type: "montants",
      titre: "Le compte de résultat différentiel",
      notions: ["contribution_margin", "income_statement"],
      question: (c) => {
        const { f, m, s, ch } = seuilDuMois(c);
        return `Présentez le résultat de janvier en séparant charges variables et charges fixes : ${qte(m.quantite)} ${f.unites} ${accord(f, "vendu")}s à ${eur(m.prix)}, un coût variable de ${eur(s.coutVariableUnitaire)} par ${f.unite}, et des charges fixes de ${eur(ch.loyer)} de loyer, ${eur(ch.personnel)} de personnel et ${eur(ch.amortissement)} d'usure.`;
      },
      champs: (c) => {
        const { m, s, ch } = seuilDuMois(c);
        return [
          { libelle: "Chiffre d'affaires", attendu: s.chiffreDAffaires, calcul: `${qte(m.quantite)} × ${eur(m.prix)} = ${eur(s.chiffreDAffaires)}` },
          { libelle: "Charges variables", attendu: s.chargesVariables, calcul: `${qte(m.quantite)} × ${eur(s.coutVariableUnitaire)} = ${eur(s.chargesVariables)}` },
          { libelle: "Marge sur coût variable", attendu: s.marge, calcul: `${eur(s.chiffreDAffaires)} − ${eur(s.chargesVariables)} = ${eur(s.marge)}` },
          { libelle: "Charges fixes", attendu: s.chargesFixes, calcul: `${eur(ch.loyer)} + ${eur(ch.personnel)} + ${eur(ch.amortissement)} = ${eur(s.chargesFixes)}` },
          { libelle: "Résultat", attendu: s.resultat, calcul: `${eur(s.marge)} − ${eur(s.chargesFixes)} = ${eur(s.resultat)}` },
        ];
      },
      explication: (c) => {
        const { f, s } = seuilDuMois(c);
        return [
          s.resultat >= 0
            ? `La marge couvre les charges fixes et laisse ${eur(s.resultat)} de bénéfice.`
            : `La marge, ${eur(s.marge)}, ne couvre pas les charges fixes : ${f.entreprise} perd ${eur(-s.resultat)} en janvier.`,
          "Le compte de résultat de la comptabilité générale range les charges par nature (achats, loyer, salaires). Celui-ci les range par comportement : c'est ce qui permet de prévoir.",
        ];
      },
    },
    {
      id: "une-de-plus",
      type: "choix",
      titre: "Une vente de plus",
      notions: ["contribution_margin"],
      question: (c) => {
        const { f } = seuilDuMois(c);
        return `Si ${f.entreprise} vend une ${f.unite} de plus en janvier, de combien son résultat augmente-t-il ?`;
      },
      options: (c) => {
        const { f, m, s, coutCompletUnitaire } = seuilDuMois(c);
        return [
          { texte: `De ${eur(m.prix)} : le prix de vente.`, juste: false, retour: `Il faut aussi payer ses coûts variables, ${eur(s.coutVariableUnitaire)}.` },
          { texte: `De ${eur(s.margeUnitaire)} : la marge sur coût variable unitaire.`, juste: true, retour: "Les charges fixes sont déjà là : une vente de plus n'apporte que sa marge, mais toute sa marge." },
          {
            texte: `De ${eur(auCentime(m.prix - coutCompletUnitaire))} : le prix moins le coût complet par ${f.unite}.`,
            juste: false,
            retour: "Le coût complet répartit les charges fixes sur les ventes ; or une vente de plus ne les augmente pas. Raisonner au coût complet fait refuser des ventes rentables.",
          },
        ];
      },
    },
    {
      id: "predire-le-seuil",
      type: "choix",
      titre: "Pariez sur le seuil",
      notions: ["breakeven"],
      question: (c) => {
        const { f, s } = seuilDuMois(c);
        return `Avant de calculer, pariez. Les charges fixes de janvier font ${eur(s.chargesFixes)}, et chaque ${f.unite} ${accord(f, "vendu")} en paie ${eur(s.margeUnitaire)}. Le nombre d'${f.unites} qui couvre tout juste les charges fixes tombe…`;
      },
      options: (c) => {
        const { f, s, seuilSurLePrix } = seuilDuMois(c);
        return [
          { texte: "Sous les ventes de janvier : la marge du mois couvre déjà les charges fixes", juste: s.resultat >= 0, retour: `Bon pari. ${voirLeCurseur}` },
          { texte: "Au-dessus des ventes de janvier : la marge de chaque vente est trop mince", juste: s.resultat < 0, retour: `Pari à vérifier. ${voirLeCurseur}` },
          {
            texte: `Vers ${qte(seuilSurLePrix)} ${f.unites} : les charges fixes divisées par le prix`,
            juste: false,
            retour: `Pari à vérifier : le prix ne reste pas en entier pour payer les charges fixes. ${voirLeCurseur}`,
          },
        ];
      },
    },
    {
      id: "simulation",
      type: "curseur",
      titre: "Faites tourner les ventes",
      notions: ["breakeven", "dead_point"],
      question: (c) => {
        const { f } = seuilDuMois(c);
        return `Faites varier les ventes de ${f.entreprise} sur un mois. Une droite donne le chiffre d'affaires, l'autre le coût total, charges fixes comprises. Placez le curseur sur le plus petit nombre d'${f.unites} qui ne fait pas perdre d'argent, puis validez.`;
      },
      cible: (c) => {
        const x = seuilDuMois(c);
        return { attendu: x.seuilQuantite, max: Math.ceil(Math.max(x.seuilQuantite * 2, x.m.quantite * 1.3) / 10) * 10 };
      },
      lecture: (c, q) => {
        const { s } = seuilDuMois(c);
        const ca = auCentime(q * s.prix);
        const cv = auCentime(q * s.coutVariableUnitaire);
        return [
          { libelle: "Chiffre d'affaires", montant: ca },
          { libelle: "Charges variables", montant: cv },
          { libelle: "Marge sur coût variable", montant: auCentime(ca - cv) },
          { libelle: "Charges fixes", montant: s.chargesFixes },
          { libelle: "Résultat", montant: auCentime(ca - cv - s.chargesFixes), fort: true },
        ];
      },
      droites: (c) => {
        const { s } = seuilDuMois(c);
        return {
          produit: (q) => q * s.prix,
          cout: (q) => s.chargesFixes + q * s.coutVariableUnitaire,
          libelles: ["Chiffre d'affaires", "Coût total (fixes + variables)"],
        };
      },
      explication: (c) => {
        const { f, s, seuilQuantite } = seuilDuMois(c);
        return [
          `Les deux droites se croisent au seuil : à ${qte(seuilQuantite)} ${f.unites}, le chiffre d'affaires couvre le coût total. À gauche, la zone de perte ; à droite, la zone de bénéfice.`,
          `Le coût total ne part pas de zéro : même sans rien vendre, les ${eur(s.chargesFixes)} de charges fixes sont là. Chaque ${f.unite} en couvre ${eur(s.margeUnitaire)}, l'écart entre les pentes des deux droites : c'est la formule que l'étape suivante fait calculer.`,
        ];
      },
    },
    {
      id: "seuil",
      type: "montants",
      titre: "Le seuil de rentabilité",
      notions: ["breakeven"],
      question: (c) => {
        const { f, s } = seuilDuMois(c);
        return `Le seuil de rentabilité est le niveau de ventes où la marge couvre tout juste les charges fixes : le résultat est nul. En quantité, divisez les charges fixes (${eur(s.chargesFixes)}) par la marge d'une ${f.unite} (${eur(s.margeUnitaire)}), à l'unité supérieure. En valeur, divisez-les par le taux de marge (${eur(s.margeUnitaire)} ÷ ${eur(s.prix)}, sans l'arrondir).`;
      },
      champs: (c) => {
        const { f, s, seuilQuantite, seuilValeur } = seuilDuMois(c);
        return [
          {
            libelle: `En quantité (${f.unites}, arrondi à l'unité supérieure)`,
            attendu: seuilQuantite,
            tolerance: 1,
            calcul: `${eur(s.chargesFixes)} ÷ ${eur(s.margeUnitaire)} = ${qte(s.seuilExact!)}, arrondi à ${qte(seuilQuantite)} ${f.unites}`,
          },
          {
            libelle: "En valeur (chiffre d'affaires)",
            attendu: seuilValeur,
            tolerance: auCentime(seuilValeur * 0.005),
            calcul: `${eur(s.chargesFixes)} ÷ (${eur(s.margeUnitaire)} ÷ ${eur(s.prix)}) = ${eur(s.chargesFixes)} × ${eur(s.prix)} ÷ ${eur(s.margeUnitaire)} = ${eur(seuilValeur)}`,
          },
        ];
      },
      explication: (c) => {
        const { f, m, s, seuilQuantite, seuilValeur } = seuilDuMois(c);
        const tauxArrondi = Math.round(s.tauxDeMarge * 1000) / 1000;
        return [
          `En dessous de ${qte(seuilQuantite)} ${f.unites} par mois, ${f.entreprise} perd de l'argent ; au-dessus, chaque ${f.unite} ajoute ${eur(s.margeUnitaire)} au bénéfice.`,
          `Le seuil en valeur se calcule sur le taux exact. Avec un taux arrondi à ${pct(tauxArrondi, 1)}, on trouverait ${eur(auCentime(s.chargesFixes / tauxArrondi))} : la correction l'accepte, mais le seuil exact est ${eur(seuilValeur)}, soit ${qte(s.seuilExact!)} ${f.unites} à ${eur(m.prix)}.`,
        ];
      },
    },
    {
      id: "securite",
      type: "montants",
      titre: "La marge de sécurité et le point mort",
      notions: ["safety_margin", "dead_point"],
      question: (c) => {
        const { m } = seuilDuMois(c);
        return `Sans formule cette fois. De combien le chiffre d'affaires de janvier pourrait-il baisser avant la perte, en euros, puis en pourcentage de ce chiffre d'affaires ? Et quel jour de janvier le seuil est-il atteint, les ventes étant régulières sur les ${qte(m.jours)} jours du mois ?`;
      },
      champs: (c) => {
        const { m, s, seuilValeur, margeDeSecurite, indiceDeSecurite } = seuilDuMois(c);
        return [
          { libelle: "Marge de sécurité", attendu: margeDeSecurite, tolerance: auCentime(seuilValeur * 0.005), calcul: `${eur(s.chiffreDAffaires)} − ${eur(seuilValeur)} = ${eur(margeDeSecurite)}` },
          { libelle: "Indice de sécurité, en %", attendu: auCentime(indiceDeSecurite * 100), tolerance: 0.5, calcul: `${eur(margeDeSecurite)} ÷ ${eur(s.chiffreDAffaires)} = ${pct(indiceDeSecurite)}` },
          {
            libelle: "Point mort, le jour du mois",
            attendu: s.pointMort ?? 0,
            calcul: `${eur(seuilValeur)} ÷ ${eur(s.chiffreDAffaires)} × ${qte(m.jours)} jours = ${qte((seuilValeur / s.chiffreDAffaires) * m.jours)}, donc le ${qte(s.pointMort ?? 0)} ${m.nom}`,
          },
        ];
      },
      explication: (c) => {
        const { f, m, s, indiceDeSecurite } = seuilDuMois(c);
        return s.pointMort !== null
          ? [
              `Les ventes pourraient baisser de ${pct(indiceDeSecurite, 1)} avant que ${f.entreprise} ne perde de l'argent : c'est peu. Le seuil est atteint le ${qte(s.pointMort)} ${m.nom} ; les jours de vente qui suivent font tout le bénéfice du mois.`,
              "Le point mort suppose des ventes régulières sur le mois. Une entreprise qui vend surtout en fin de mois l'atteint plus tard, pour le même seuil.",
            ]
          : [`La marge de sécurité est négative : le seuil n'est pas atteint en ${m.nom}.`];
      },
    },
    {
      id: "predire-les-fixes",
      type: "choix",
      titre: "Pariez sur les charges fixes",
      notions: ["fixed_costs", "safety_margin"],
      question: (c) => {
        const { f } = seuilDuMois(c);
        return `Le bailleur parle de revoir le loyer. Avant de chercher, pariez : avec les ventes de janvier, de combien les charges fixes de ${f.entreprise} pourraient-elles monter avant la perte ?`;
      },
      options: (c) => {
        const { s, margeDeSecurite, indiceDeSecurite } = seuilDuMois(c);
        const voir = "Faites monter les charges fixes à l'étape suivante : le curseur montre où la marge cède.";
        return [
          { texte: `De ${eur(s.resultat)}, le résultat de janvier`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `De ${eur(margeDeSecurite)}, la marge de sécurité`, juste: false, retour: `Pari à vérifier : la marge de sécurité se compte en chiffre d'affaires, pas en charges. ${voir}` },
          { texte: `De ${eur(auCentime(s.chargesFixes * indiceDeSecurite))}, l'indice de sécurité appliqué aux charges fixes`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-fixes-au-curseur",
      type: "curseur",
      titre: "Faites monter les charges fixes",
      notions: ["fixed_costs", "breakeven"],
      question: (c) => {
        const { f } = seuilDuMois(c);
        return `Faites monter les charges fixes du mois de ${eur(FIXES_DU_CURSEUR.min)} à ${eur(FIXES_DU_CURSEUR.max)}, les ventes restant celles de janvier. Une droite donne la marge sur coût variable de janvier, l'autre les charges fixes. Placez le curseur sur les plus grandes charges fixes que ${f.entreprise} peut porter sans perte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Charges fixes du mois", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: Math.floor(seuilDuMois(c).fixesTenables + 1e-9), min: FIXES_DU_CURSEUR.min, max: FIXES_DU_CURSEUR.max }),
      zones: ["Bénéfice", "Perte"],
      rates: (c) => ({
        dessous: `${ficheDe(c).entreprise} peut encore porter plus de charges fixes sans perte : cherchez la plus grande position.`,
        dessus: "À cette position, la marge de janvier ne couvre plus les charges fixes : le mois est en perte.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, x) => {
        const { s } = seuilDuMois(c);
        return [
          { libelle: "Marge sur coût variable de janvier", montant: s.marge },
          { libelle: "Charges fixes du mois", montant: x },
          { libelle: "Seuil en chiffre d'affaires", montant: auCentime((x * s.prix) / s.margeUnitaire) },
          { libelle: "Résultat du mois", montant: auCentime(s.marge - x), fort: true },
        ];
      },
      droites: (c) => {
        const { s } = seuilDuMois(c);
        return { produit: () => s.marge, cout: (x) => x, libelles: ["Marge sur coût variable de janvier", "Charges fixes du mois"] };
      },
      explication: (c) => {
        const { s, fixesTenables, margeDeSecurite } = seuilDuMois(c);
        return [
          `Les deux droites se croisent à ${eur(fixesTenables)}, la marge de janvier : jusque-là, le mois reste en bénéfice. À ce point, le seuil en chiffre d'affaires vaut exactement le chiffre d'affaires de janvier, ${eur(s.chiffreDAffaires)} : il ne reste plus aucune marge de sécurité.`,
          `Les charges fixes peuvent donc monter du résultat de janvier, ${eur(s.resultat)}, et non de la marge de sécurité, ${eur(margeDeSecurite)} : celle-ci se compte en chiffre d'affaires, dont il faut d'abord payer les coûts variables.`,
        ];
      },
    },
    {
      id: "les-fixes-tenables",
      type: "montants",
      titre: "Les charges fixes tenables",
      notions: ["fixed_costs", "breakeven", "safety_margin"],
      question: (c) => {
        const { f } = seuilDuMois(c);
        return `Sans formule. Avec les ventes de janvier, quelles charges fixes ${f.entreprise} peut-elle porter au plus ? De combien, en pourcentage, ses charges fixes d'aujourd'hui pourraient-elles monter ? Et quel serait le seuil en quantité à ce plafond ?`;
      },
      champs: (c) => {
        const { f, s, fixesTenables, hausseTenable, seuilAuPlafond } = seuilDuMois(c);
        return [
          { libelle: "Charges fixes tenables", attendu: fixesTenables, calcul: `la marge sur coût variable de janvier : ${eur(s.chiffreDAffaires)} − ${eur(s.chargesVariables)} = ${eur(fixesTenables)}` },
          {
            libelle: "Hausse tenable des charges fixes, en %",
            attendu: auCentime(hausseTenable * 100),
            tolerance: 0.05,
            calcul: `(${eur(fixesTenables)} − ${eur(s.chargesFixes)}) ÷ ${eur(s.chargesFixes)} = ${eur(s.resultat)} ÷ ${eur(s.chargesFixes)} = ${pct(hausseTenable)}`,
          },
          {
            libelle: "Seuil en quantité à ce plafond",
            attendu: seuilAuPlafond,
            calcul: `${eur(fixesTenables)} ÷ ${eur(s.margeUnitaire)} = ${qte(fixesTenables / s.margeUnitaire)} ${f.unites} : les ventes de janvier`,
          },
        ];
      },
      explication: (c) => {
        const { f, hausseTenable, indiceDeSecurite } = seuilDuMois(c);
        return [
          `Au plafond, le seuil rejoint les ventes de janvier : toute la marge part dans les charges fixes. ${f.entreprise} ne peut laisser monter ses charges fixes que de ${pct(hausseTenable)}, avec un indice de sécurité de ${pct(indiceDeSecurite, 1)} : elle travaille près de son seuil, et une hausse de loyer se discute à l'euro près.`,
        ];
      },
    },
    {
      id: "baisse-de-prix",
      type: "montants",
      titre: "Et si le prix baissait ?",
      notions: ["breakeven", "operating_leverage", "price_elasticity"],
      question: (c) => {
        const { f } = seuilDuMois(c);
        return `Un concurrent casse ses prix. ${f.entreprise} envisage de baisser le sien de ${pct(BAISSE_DE_PRIX, 0)}, sans que ses coûts ne bougent. Calculez la nouvelle marge d'une ${f.unite}, le nouveau seuil en quantité, puis les ventes qu'il faudrait pour garder le résultat de janvier.`;
      },
      champs: (c) => {
        const { f, s, prixBaisse, margeBaisse, seuilBaisse, ventesPourLeResultat } = seuilDuMois(c);
        return [
          {
            libelle: "Nouvelle marge sur coût variable unitaire",
            attendu: margeBaisse,
            calcul: `${eur(s.prix)} × ${pct(1 - BAISSE_DE_PRIX, 0)} = ${eur(prixBaisse)}, puis ${eur(prixBaisse)} − ${eur(s.coutVariableUnitaire)} = ${eur(margeBaisse)}`,
          },
          {
            libelle: `Nouveau seuil en quantité (${f.unites})`,
            attendu: seuilBaisse,
            tolerance: 1,
            calcul: `${eur(s.chargesFixes)} ÷ ${eur(margeBaisse)} = ${qte(s.chargesFixes / margeBaisse)}, arrondi à ${qte(seuilBaisse)}`,
          },
          {
            libelle: "Ventes pour garder le résultat de janvier",
            attendu: ventesPourLeResultat,
            tolerance: 1,
            calcul: `(${eur(s.chargesFixes)} + ${eur(s.resultat)}) ÷ ${eur(margeBaisse)} = ${qte((s.chargesFixes + s.resultat) / margeBaisse)}, arrondi à ${qte(ventesPourLeResultat)}`,
          },
        ];
      },
      explication: (c) => {
        const { f, m, s, margeBaisse, seuilBaisse, ventesPourLeResultat } = seuilDuMois(c);
        return [
          `Le prix baisse de ${pct(BAISSE_DE_PRIX, 0)}, mais la marge d'une ${f.unite} baisse de ${pct(1 - margeBaisse / s.margeUnitaire, 0)} : les coûts variables, eux, n'ont pas bougé. Le seuil passe de ${qte(s.seuilQuantite!)} à ${qte(seuilBaisse)} ${f.unites}.`,
          `Pour garder le résultat de janvier, il faudrait vendre ${qte(ventesPourLeResultat)} ${f.unites}, ${pct(ventesPourLeResultat / m.quantite - 1, 0)} de plus ; or la ligne et l'équipe ne tournent normalement que ${qte(f.centres.activiteNormale)} ${f.unites} par mois. Une baisse de prix ne se décide qu'en sachant combien de ventes elle doit gagner, et si l'entreprise peut les servir.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-seuil",
      type: "simulation",
      titre: "Le laboratoire du seuil",
      notions: ["breakeven", "contribution_margin", "fixed_costs"],
      question: (c) => {
        const { f } = seuilDuMois(c);
        return `Faites jouer ensemble le prix, le coût variable d'une ${f.unite}, les charges fixes et les ventes du mois : le tableau suit le seuil et le résultat, et le graphique montre le seuil selon le prix, face aux ventes. Relevez le défi.`;
      },
      leviers: (c) => {
        const { f, m, s } = seuilDuMois(c);
        const l = LEVIERS_DU_LABORATOIRE;
        return [
          { code: "prix", libelle: `Prix de vente d'une ${f.unite}`, unite: "€", ...l.prix, depart: m.prix },
          { code: "coutVariable", libelle: `Coût variable d'une ${f.unite}`, unite: "€", ...l.coutVariable, depart: s.coutVariableUnitaire },
          { code: "chargesFixes", libelle: "Charges fixes du mois", unite: "€", ...l.chargesFixes, depart: s.chargesFixes },
          { code: "ventes", libelle: "Ventes du mois", unite: f.unites, ...l.ventes, depart: m.quantite },
        ];
      },
      lecture: (c, p) => {
        const x = seuilDuMois(c);
        const l = laboratoireDuSeuil(x, position(p));
        const d = laboratoireDuSeuil(x, { prix: x.m.prix, coutVariable: x.s.coutVariableUnitaire, chargesFixes: x.s.chargesFixes, ventes: x.m.quantite });
        return [
          { libelle: `Marge sur coût variable d'une ${x.f.unite}`, montant: l.marge, reference: d.marge },
          { libelle: "Seuil de rentabilité", montant: l.seuilQuantite, reference: d.seuilQuantite, unite: x.f.unites },
          { libelle: "Seuil en chiffre d'affaires", montant: l.seuilValeur, reference: d.seuilValeur },
          { libelle: "Indice de sécurité", montant: l.indice, reference: d.indice, unite: "%" },
          { libelle: "Résultat du mois", montant: l.resultat, reference: d.resultat, effet: true, fort: true },
        ];
      },
      // Le seuil selon le prix n'est pas une droite : il s'envole quand le prix approche le coût variable.
      graphique: (c) => {
        const x = seuilDuMois(c);
        return {
          levier: "prix",
          unite: x.f.unites,
          courbes: [
            { libelle: "Seuil de rentabilité", valeur: (p) => auCentime(p.chargesFixes! / (p.prix! - p.coutVariable!)) },
            { libelle: "Ventes du mois", valeur: (p) => p.ventes! },
          ],
        };
      },
      defi: (c) => {
        const x = seuilDuMois(c);
        return {
          consigne: `Baissez le prix de ${pct(BAISSE_DE_PRIX, 0)}, à ${eur(x.prixBaisse)} ou moins, sans que le seuil de rentabilité ne dépasse celui de janvier, ${qte(x.seuilQuantite)} ${x.f.unites}.`,
          atteint: (p) => laboratoireDuSeuil(x, position(p)).reussi,
          indice: (p) => {
            const l = laboratoireDuSeuil(x, position(p));
            if (p.prix! > x.prixBaisse + 1e-9) return `Le prix est encore de ${eur(p.prix!)} : baissez-le à ${eur(x.prixBaisse)} au plus.`;
            return `À ${eur(p.prix!)}, la marge d'une ${x.f.unite} n'est plus que de ${eur(l.marge)}, et le seuil monte à ${qte(l.seuilQuantite)} ${x.f.unites}. Les ventes n'y changent rien : agissez sur le coût variable ou sur les charges fixes.`;
          },
          solution: { prix: x.prixBaisse, coutVariable: x.coutVariablePlafond, chargesFixes: x.s.chargesFixes, ventes: x.m.quantite },
        };
      },
      explication: (c, p) => {
        const x = seuilDuMois(c);
        const l = laboratoireDuSeuil(x, position(p));
        return [
          `À ${eur(p.prix!)}, le seuil reste à ${qte(l.seuilQuantite)} ${x.f.unites}. Avec les charges fixes de janvier, il faut pour cela un coût variable d'au plus ${eur(x.coutVariablePlafond)}, ${pct(1 - x.coutVariablePlafond / x.s.coutVariableUnitaire, 0)} de moins ; avec le coût variable de janvier, des charges fixes d'au plus ${eur(x.fixesPlafond)}, ${pct(1 - x.fixesPlafond / x.s.chargesFixes, 0)} de moins.`,
          "Les ventes, elles, ne déplacent pas le seuil : elles en éloignent ou en rapprochent, et changent le résultat et l'indice de sécurité. Sur le graphique, le seuil n'est pas une droite : il monte de plus en plus vite quand le prix se rapproche du coût variable.",
        ];
      },
    },
    {
      id: "leviers",
      type: "choix",
      titre: "Abaisser le seuil",
      notions: ["breakeven", "operating_leverage"],
      question: (c) => `Que peut faire ${ficheDe(c).entreprise} pour abaisser son seuil de rentabilité ?`,
      options: () => [
        { texte: "Vendre davantage.", juste: false, retour: "Vendre plus éloigne du seuil (la marge de sécurité grandit), mais ne déplace pas le seuil lui-même : le laboratoire l'a montré." },
        {
          texte: "Gagner plus sur chaque vente, ou réduire ses charges fixes.",
          juste: true,
          retour: "Le seuil est le rapport des charges fixes à la marge unitaire : on l'abaisse en réduisant le numérateur ou en augmentant le dénominateur.",
        },
        { texte: "Baisser son prix pour vendre plus.", juste: false, retour: "Baisser le prix réduit la marge par vente : le seuil monte, comme vous l'avez calculé." },
      ],
    },
    {
      id: "le-levier-operationnel",
      type: "montants",
      titre: "Le levier opérationnel",
      notions: ["operating_leverage", "safety_margin"],
      question: (c) => {
        const { f } = seuilDuMois(c);
        return `Le levier opérationnel dit de combien de pour cent le résultat varie quand le chiffre d'affaires varie de 1 %. Sans formule : calculez celui de ${f.entreprise} en janvier, au centième, puis le résultat du mois si les ventes avaient été inférieures de ${pct(BAISSE_DES_VENTES_DU_LEVIER, 0)}, et la variation du résultat, en pourcentage.`;
      },
      champs: (c) => {
        const { s, levier, margeApresBaisse, resultatApresBaisse, variationDuResultat } = seuilDuMois(c);
        return [
          { libelle: "Levier opérationnel", attendu: auCentime(levier), tolerance: 0.01, calcul: `marge sur coût variable ÷ résultat : ${eur(s.marge)} ÷ ${eur(s.resultat)} = ${qte(levier)}` },
          {
            libelle: `Résultat avec ${pct(BAISSE_DES_VENTES_DU_LEVIER, 0)} de ventes en moins`,
            attendu: resultatApresBaisse,
            calcul: `la marge baisse de ${pct(BAISSE_DES_VENTES_DU_LEVIER, 0)}, les charges fixes non : ${eur(s.marge)} × ${pct(1 - BAISSE_DES_VENTES_DU_LEVIER, 0)} − ${eur(s.chargesFixes)} = ${eur(margeApresBaisse)} − ${eur(s.chargesFixes)} = ${eur(resultatApresBaisse)}`,
          },
          {
            libelle: "Variation du résultat, en %",
            attendu: auCentime(variationDuResultat * 100),
            tolerance: 0.1,
            calcul: `(${eur(resultatApresBaisse)} − ${eur(s.resultat)}) ÷ ${eur(s.resultat)} = ${pct(variationDuResultat)}, soit −${pct(BAISSE_DES_VENTES_DU_LEVIER, 0)} × ${qte(levier)}`,
          },
        ];
      },
      explication: (c) => {
        const { f, levier, indiceDeSecurite, variationDuResultat } = seuilDuMois(c);
        return [
          `Une baisse de ${pct(BAISSE_DES_VENTES_DU_LEVIER, 0)} des ventes fait perdre ${pct(-variationDuResultat)} du résultat : le levier, ${qte(levier)}, multiplie la variation des ventes. Les charges fixes ne baissent pas avec les ventes : tout le recul de la marge tombe sur le résultat.`,
          `Le levier opérationnel est l'inverse de l'indice de sécurité : 1 ÷ ${pct(indiceDeSecurite)} = ${qte(1 / indiceDeSecurite)}. Plus ${f.entreprise} est près de son seuil, plus son résultat est sensible aux ventes.`,
        ];
      },
    },
    {
      id: "lire-le-levier",
      type: "choix",
      titre: "Ce que dit le levier",
      notions: ["operating_leverage"],
      question: (c) => {
        const { levier } = seuilDuMois(c);
        return `Le dirigeant lit un levier opérationnel de ${qte(levier)} et s'en réjouit : « Notre résultat réagit très fort aux ventes, c'est une force. » Que lui répondez-vous ?`;
      },
      options: (c) => {
        const { s, variationDuResultat } = seuilDuMois(c);
        return [
          {
            texte: "C'est un signe de fragilité : l'entreprise travaille près de son seuil",
            juste: true,
            retour: `Oui. Un levier élevé veut dire que le résultat est petit devant la marge (${eur(s.resultat)} pour ${eur(s.marge)}) : ${pct(BAISSE_DES_VENTES_DU_LEVIER, 0)} de ventes en moins effacent ${pct(-variationDuResultat, 0)} du résultat. À la hausse, il joue dans l'autre sens ; c'est un risque, pas une rentabilité.`,
          },
          {
            texte: "C'est une force : un levier élevé veut dire une rentabilité élevée",
            juste: false,
            retour: `Non : c'est l'inverse. Le levier est élevé parce que le résultat (${eur(s.resultat)}) est mince devant la marge. Une entreprise très rentable, loin de son seuil, a un levier faible.`,
          },
          {
            texte: "Le levier ne dit rien du risque : il ne dépend que des charges fixes",
            juste: false,
            retour: "Non : le levier se lit sur la marge et le résultat, donc sur les ventes autant que sur les charges fixes. Il baisse quand les ventes s'éloignent du seuil.",
          },
        ];
      },
    },
    {
      id: "seuil-de-la-gamme",
      type: "montants",
      titre: "Le seuil d'une gamme",
      notions: ["breakeven", "margin_rates", "safety_margin"],
      tableau: (c) => tableauDeLaGamme(seuilDuMois(c)),
      question: (c) => {
        const { f, gamme } = seuilDuMois(c);
        return `Plus tard, ${f.entreprise} vend trois références dans le même local (tableau). Ses charges fixes du mois sont les charges communes, ${eur(gamme.communes)}, et la publicité des trois références. Sans formule, à composition des ventes constante : le taux de marge sur coût variable moyen de la gamme, son seuil de rentabilité en chiffre d'affaires, puis son indice de sécurité.`;
      },
      champs: (c) => {
        const { gamme } = seuilDuMois(c);
        const variables = auCentime(gamme.chiffreDAffaires - gamme.marge);
        return [
          {
            libelle: "Taux de marge moyen de la gamme, en %",
            attendu: auCentime(gamme.taux * 100),
            tolerance: 0.1,
            calcul: `chiffre d'affaires ${gamme.references.map((r) => `${qte(r.quantite)} × ${eur(r.prix)}`).join(" + ")} = ${eur(gamme.chiffreDAffaires)} ; coûts variables ${gamme.references.map((r) => `${qte(r.quantite)} × ${eur(r.coutVariable)}`).join(" + ")} = ${eur(variables)} ; taux ${eur(gamme.marge)} ÷ ${eur(gamme.chiffreDAffaires)} = ${pct(gamme.taux)}`,
          },
          {
            libelle: "Seuil de rentabilité de la gamme",
            attendu: gamme.seuilValeur,
            tolerance: auCentime(gamme.seuilValeur * 0.005),
            calcul: `(${eur(gamme.communes)} + ${eur(gamme.publicite)} de publicité) ÷ ${pct(gamme.taux)} = ${eur(gamme.chargesFixes)} × ${eur(gamme.chiffreDAffaires)} ÷ ${eur(gamme.marge)} = ${eur(gamme.seuilValeur)}`,
          },
          {
            libelle: "Indice de sécurité de la gamme, en %",
            attendu: auCentime(gamme.indice * 100),
            tolerance: 0.2,
            calcul: `(${eur(gamme.chiffreDAffaires)} − ${eur(gamme.seuilValeur)}) ÷ ${eur(gamme.chiffreDAffaires)} = ${pct(gamme.indice)}`,
          },
        ];
      },
      explication: (c) => {
        const { gamme } = seuilDuMois(c);
        return [
          `Avec plusieurs références, le seuil se dit en chiffre d'affaires, à une composition des ventes donnée : ${eur(gamme.seuilValeur)}. Le taux moyen, ${pct(gamme.taux)}, pondère les taux de chaque référence par leur chiffre d'affaires : ${gamme.references.map((r) => `${r.nom} ${pct(r.taux, 1)}`).join(", ")}.`,
          `La publicité est propre à chaque référence, mais elle est fixe : elle entre dans les charges à couvrir. L'indice de sécurité de la gamme, ${pct(gamme.indice)}, est plus large que celui de janvier : les références les plus rentables tirent le taux vers le haut.`,
        ];
      },
    },
    {
      id: "la-composition-de-la-gamme",
      type: "choix",
      titre: "Le seuil et la composition des ventes",
      notions: ["breakeven", "margin_rates"],
      question: (c) => {
        const x = seuilDuMois(c);
        return `Le directeur commercial veut pousser ${laPlusVendue(x).nom}, la référence la plus vendue, au détriment des deux autres, à chiffre d'affaires égal. Que devient le seuil de la gamme de ${x.f.entreprise} ?`;
      },
      options: (c) => {
        const x = seuilDuMois(c);
        const one = laPlusVendue(x);
        const plusFaible = x.gamme.references.every((r) => r.taux >= one.taux);
        return [
          {
            texte: `Il monte : ${one.nom} a le plus faible taux de marge, ${pct(one.taux, 1)}`,
            juste: plusFaible,
            retour: `Oui. Le taux moyen se rapproche de celui de ${one.nom}, ${pct(one.taux, 1)} contre ${pct(x.gamme.taux, 1)} aujourd'hui : chaque euro vendu couvre moins de charges fixes, et le seuil en chiffre d'affaires monte. Un seuil de gamme ne vaut que pour la composition sur laquelle on l'a calculé.`,
          },
          {
            texte: `Il baisse : ${one.nom} est la référence la plus vendue`,
            juste: !plusFaible,
            retour: "Non : le seuil dépend du taux de marge de ce qu'on vend, pas de la popularité d'une référence. Vendre plus d'une référence moins rentable fait monter le seuil.",
          },
          { texte: "Il ne bouge pas : les charges fixes de la gamme restent les mêmes", juste: false, retour: "Non : les charges fixes ne bougent pas, mais le taux de marge moyen, oui. Le seuil est le rapport des deux." },
        ];
      },
    },
    {
      id: "charges-fixes-par-paliers",
      type: "montants",
      titre: "Des charges fixes par paliers",
      notions: ["fixed_costs", "breakeven", "capacity"],
      question: (c) => {
        const { f, palier } = seuilDuMois(c);
        return `Au-delà de ${qte(palier.limite)} ${f.unites} par mois, son activité normale, ${f.entreprise} doit louer un second atelier et embaucher deux salariés : ses charges fixes montent de ${eur(SUPPLEMENT_DU_PALIER)}. Le prix et le coût variable ne changent pas. Calculez le résultat à ${qte(palier.limite)} ${f.unites}, puis à ${qte(palier.limite + 1)}, et le second seuil de rentabilité.`;
      },
      champs: (c) => {
        const { f, s, palier } = seuilDuMois(c);
        return [
          {
            libelle: `Résultat à ${qte(palier.limite)} ${f.unites}`,
            attendu: palier.resultatALaLimite,
            calcul: `${qte(palier.limite)} × ${eur(s.margeUnitaire)} − ${eur(s.chargesFixes)} = ${eur(palier.resultatALaLimite)}`,
          },
          {
            libelle: `Résultat à ${qte(palier.limite + 1)} ${f.unites}`,
            attendu: palier.resultatApresLaLimite,
            calcul: `${qte(palier.limite + 1)} × ${eur(s.margeUnitaire)} − (${eur(s.chargesFixes)} + ${eur(SUPPLEMENT_DU_PALIER)}) = ${eur(palier.resultatApresLaLimite)}`,
          },
          {
            libelle: "Second seuil de rentabilité",
            attendu: palier.secondSeuil,
            tolerance: 1,
            calcul: `${eur(palier.fixes)} ÷ ${eur(s.margeUnitaire)} = ${qte(palier.fixes / s.margeUnitaire)}, arrondi à ${qte(palier.secondSeuil)} ${f.unites}`,
          },
        ];
      },
      explication: (c) => {
        const { f, palier } = seuilDuMois(c);
        return [
          `Une ${f.unite} de plus que l'activité normale fait passer le résultat de ${eur(palier.resultatALaLimite)} à ${eur(palier.resultatApresLaLimite)} : le palier coûte d'un coup ${eur(SUPPLEMENT_DU_PALIER)}, qu'une seule ${f.unite} ne paie pas. Il y a donc deux seuils, et entre ${qte(palier.limite + 1)} et ${qte(palier.secondSeuil - 1)} ${f.unites}, une zone de perte.`,
          "Sur un graphique, la droite du coût total fait une marche au palier. Un seuil calculé sans voir le palier serait faux dès que l'activité le franchit.",
        ];
      },
    },
    {
      id: "franchir-le-palier",
      type: "choix",
      titre: "Franchir le palier ?",
      notions: ["fixed_costs", "breakeven", "capacity"],
      question: (c) => {
        const { f, palier } = seuilDuMois(c);
        return `Le marché demanderait ${qte(DEMANDE_AU_DELA_DU_PALIER)} ${f.unites} par mois. Le dirigeant hésite à franchir le palier de ${qte(palier.limite)} ${f.unites}. Que lui conseillez-vous ?`;
      },
      options: (c) => {
        const { f, s, palier } = seuilDuMois(c);
        const enPlus = DEMANDE_AU_DELA_DU_PALIER - palier.limite;
        const mieux = palier.resultatALaDemande > palier.resultatALaLimite;
        return [
          {
            texte: `Pas pour ${qte(DEMANDE_AU_DELA_DU_PALIER)} : il faut plus de ${qte(palier.pourFaireMieux - 1)} ${f.unites} pour gagner plus qu'à ${qte(palier.limite)}`,
            juste: !mieux,
            retour: `Oui. À ${qte(DEMANDE_AU_DELA_DU_PALIER)} ${f.unites}, le résultat serait de ${eur(palier.resultatALaDemande)}, contre ${eur(palier.resultatALaLimite)} en restant à ${qte(palier.limite)}. Pour repayer les ${eur(SUPPLEMENT_DU_PALIER)} du palier, il faut ${qte(palier.pourFaireMieux - palier.limite)} ${f.unites} de plus que l'activité normale, soit ${qte(palier.pourFaireMieux)} au moins.`,
          },
          {
            texte: `Oui : ${qte(DEMANDE_AU_DELA_DU_PALIER)} ${f.unites} dépassent le second seuil, ${qte(palier.secondSeuil)}`,
            juste: false,
            retour: `Non : dépasser le second seuil veut dire ne pas perdre d'argent, pas gagner plus. Le résultat tomberait de ${eur(palier.resultatALaLimite)} à ${eur(palier.resultatALaDemande)}.`,
          },
          {
            texte: `Oui : ${qte(enPlus)} ${f.unites} de plus à ${eur(s.margeUnitaire)} font ${eur(enPlus * s.margeUnitaire)} de résultat en plus`,
            juste: mieux,
            retour: `Non : c'est oublier le palier. Les ${eur(enPlus * s.margeUnitaire)} de marge en plus ne paient pas les ${eur(SUPPLEMENT_DU_PALIER)} de charges fixes nouvelles.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["breakeven", "safety_margin", "operating_leverage"],
      texte: (c) => {
        const { f, s, seuilQuantite, seuilValeur, indiceDeSecurite, levier, gamme, palier } = seuilDuMois(c);
        return [
          `En janvier, ${f.entreprise} couvre ses charges fixes à partir de ${qte(seuilQuantite)} ${f.unites}, ${eur(seuilValeur)} de chiffre d'affaires ; avec ${qte(s.quantite)} ${f.unites}, son indice de sécurité est de ${pct(indiceDeSecurite, 1)} et son levier opérationnel de ${qte(levier)}.`,
          `Trois pièges. Le seuil se divise par la marge, pas par le prix. Vendre plus ne déplace pas le seuil, et une baisse de prix le fait monter bien plus vite qu'elle ne baisse le prix. Enfin, un seuil ne vaut que dans ses hypothèses : à une composition des ventes donnée pour une gamme (${eur(gamme.seuilValeur)}), et sous le palier de ${qte(palier.limite)} ${f.unites} pour les charges fixes.`,
          "Au niveau de l'examen, vous savez bâtir un compte de résultat différentiel, calculer le seuil en quantité et en valeur, le point mort, la marge et l'indice de sécurité, le levier opérationnel, le seuil d'une gamme et celui de charges fixes par paliers, et en tirer une décision chiffrée.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Seuil de rentabilité = charges fixes ÷ marge sur coût variable unitaire (en valeur : ÷ taux de marge). Indice de sécurité = (chiffre d'affaires − seuil) ÷ chiffre d'affaires. Levier opérationnel = marge sur coût variable ÷ résultat = 1 ÷ indice de sécurité.",
    },
  ],
};
