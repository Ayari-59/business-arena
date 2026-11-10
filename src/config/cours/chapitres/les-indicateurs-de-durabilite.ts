import { eur, nombreAuCentieme, pct as pourcent } from "../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { CENTRES_DE_RESPONSABILITE } from "../monde/centres-de-nova";
import { DELAI_CONVENU_DE_CAMPUSTECH, GESTION_DU_COURS, RETARD_DE_CAMPUSTECH, type FicheDeGestion } from "../monde/nova-gestion";
import { HEURES_LEGALES_PAR_MOIS } from "../monde/ressources-humaines-de-nova";
import {
  INDICATEURS_DURABLES,
  KG_CO2_PAR_KWH,
  KG_D_EMBALLAGE_PAR_ENCEINTE,
  KWH_DU_BATIMENT_PAR_MOIS,
  KWH_PAR_ENCEINTE,
  PART_VALORISEE,
  SEUILS_DE_DURABILITE,
  indicateursDurablesDuMois,
  seuilEnEnceintes,
  tableauDeBordDurable,
  volumeSousLeSeuilDEnergie,
} from "../monde/tableau-de-bord-durable";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES INDICATEURS DE DURABILITÉ AU TABLEAU DE BORD (contrôle de gestion, palier 4 ;
 * DCG UE11 2025, 4.1 : indicateurs clés financiers et extra-financiers, indicateurs de durabilité,
 * indicateurs selon la structure, centre de responsabilité et chaîne de valeur, risques liés aux
 * indicateurs et à leur mesure ; DSCG UE3 3.2 : les KPI ESG ; BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/tableau-de-bord-durable.ts) et prolonge le chapitre
 * « Tableau de bord » : le même semestre de NOVA, de janvier à juin, les mêmes ventes, le même résultat
 * et la même trésorerie, au centime. Il leur ajoute des indicateurs environnementaux (l'énergie, les
 * émissions, les déchets), sociaux (l'absentéisme, les accidents) et de gouvernance (le délai de
 * paiement des fournisseurs, la dépendance au premier client). L'engagement RSE des chapitres « La
 * responsabilité sociétale » et « Ce que rapporte l'engagement » se juge en image et en ventes ; ici,
 * NOVA mesure ce qu'elle consomme, rejette et fait vivre à son équipe, mois par mois.
 *
 * La matière vient du cours du propriétaire (chapitre 15, « Les tableaux de bord ») : le tableau de
 * bord, outil de pilotage, de communication et d'évaluation ; des indicateurs financiers, quantitatifs
 * et qualitatifs par centre ; la méthode OVAR (objectifs, variables d'action, responsables) ; la
 * qualité d'un indicateur (signification, rapidité, utilité) ; ses limites, dont la vision cloisonnée
 * des centres face à la chaîne de valeur.
 *
 * LES TROIS TEMPS :
 *   · guidé : l-energie-de-fevrier (la formule dans la question, avec les chiffres) ;
 *   · l'expérience avant la formule : predire-l-intensite avant le laboratoire durable (les enceintes
 *     de février, l'énergie de la chaîne, la part valorisée des déchets), avec le graphique de
 *     l'énergie par enceinte face à son seuil d'alerte ; puis le-seuil-d-energie formalise le volume ;
 *   · autonome : le-tableau-de-mars est un tableau à compléter, le-semestre un calcul sans formule ;
 *   · expert : le taux de fréquence, les centres, la chaîne de valeur, les normes et les risques de la
 *     mesure, puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les énergies, émissions, déchets et le taux de fréquence des
 * accidents sont des grandeurs au centième (le taux au dixième, avant) ; le volume qui éteint le
 * voyant et le seuil de rentabilité sont des quantités, à l'unité supérieure ; les parts s'écrivent
 * à deux décimales.
 */

/** Le chapitre se calcule sur la fiche de gestion de NOVA. */
export const ENTREPRISES_DE_LA_DURABILITE: readonly string[] = ["nova"];

/** Le mois que l'élève calcule pas à pas : février, le mois sous le seuil. */
export const MOIS_DE_L_ENERGIE = 1;
/** Le mois que l'élève remplit seul : mars, celui de l'accident. */
export const MOIS_DU_TABLEAU = 2;

/** Les leviers du laboratoire : les enceintes de février, les kWh de la chaîne par enceinte, la part valorisée des déchets (%). */
export const LEVIERS_DURABLES = {
  quantite: { min: 1_300, max: 2_000, pas: 10 },
  kwh: { min: 0.8, max: 1.6, pas: 0.1 },
  valorisee: { min: 40, max: 100, pas: 5 },
} as const;

const qte = nombreAuCentieme;
const pct = (t: number) => pourcent(t * 100);
/** Un facteur d'émission, tel que la base carbone l'écrit : « 0,052 ». */
const coef = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
const arrondi = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d + 0;

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise (la fiche est figée). */
export function durabiliteDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = tableauDeBordDurable(f);
  return {
    f,
    t,
    fevrier: t.mois[MOIS_DE_L_ENERGIE]!,
    mars: t.mois[MOIS_DU_TABLEAU]!,
    juin: t.mois.at(-1)!,
    volumeDEnergie: volumeSousLeSeuilDEnergie(),
    seuil: seuilEnEnceintes(f),
    heuresPayeesDuMois: t.mois[0]!.heuresPayees,
  };
}

const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Le tableau de bord financier du semestre : ce que l'élève a sous les yeux. */
export function tableauFinancier(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = durabiliteDuChapitre(c);
  return {
    titre: `Le tableau de bord du semestre · ${x.f.entreprise}`,
    colonnes: x.t.mois.map((m) => m.nom),
    lignes: [
      { libelle: "Enceintes vendues", valeurs: x.t.mois.map((m) => qte(m.quantite)) },
      { libelle: "Chiffre d'affaires", valeurs: x.t.mois.map((m) => eur(m.financier.chiffreDAffaires)) },
      { libelle: "Résultat", valeurs: x.t.mois.map((m) => eur(m.financier.resultat)) },
      { libelle: "Trésorerie de fin de mois", valeurs: x.t.mois.map((m) => eur(m.financier.tresorerie)) },
      { libelle: "Part de marché", valeurs: x.t.mois.map((m) => pct(m.financier.partDeMarche)) },
    ],
  };
}

/** Les indicateurs de durabilité du semestre, mois par mois. */
export function tableauDurable(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = durabiliteDuChapitre(c);
  const M = x.t.mois;
  return {
    titre: `Les indicateurs de durabilité du semestre · ${x.f.entreprise}`,
    colonnes: M.map((m) => m.nom),
    lignes: [
      { libelle: "Énergie par enceinte (kWh)", valeurs: M.map((m) => qte(m.valeurs.kwhParEnceinte)) },
      { libelle: "Part des déchets valorisés", valeurs: M.map((m) => pct(m.valeurs.partValorisee)) },
      { libelle: "Absentéisme", valeurs: M.map((m) => pct(m.valeurs.absenteisme)) },
      { libelle: "Accidents du travail avec arrêt", valeurs: M.map((m) => qte(m.accidents)) },
      { libelle: "Délai de paiement des fournisseurs (jours)", valeurs: M.map((m) => qte(m.valeurs.delaiFournisseurs)) },
      { libelle: "Part de CampusTech dans les enceintes vendues", valeurs: M.map((m) => pct(m.valeurs.partDuPremierClient)) },
    ],
  };
}

/** Une position du laboratoire, lue : février, aux leviers. */
export const laboratoireDurable = (f: FicheDeGestion, p: Readonly<Record<string, number>>) =>
  indicateursDurablesDuMois(f, MOIS_DE_L_ENERGIE, { quantite: p.quantite!, kwhParEnceinte: p.kwh!, partValorisee: p.valorisee! / 100 });

/** Le défi : éteindre en février le voyant du résultat, de l'énergie et des déchets. */
export function defiDurableAtteint(f: FicheDeGestion, p: Readonly<Record<string, number>>) {
  const r = laboratoireDurable(f, p);
  return r.resultat >= 0 && !r.voyants.kwhParEnceinte && !r.voyants.partValorisee;
}

const indicateur = (code: (typeof INDICATEURS_DURABLES)[number]["code"]) => INDICATEURS_DURABLES.find((i) => i.code === code)!;

export const LES_INDICATEURS_DE_DURABILITE: Chapitre = {
  code: "les-indicateurs-de-durabilite",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion", "DSCG UE3 · Contrôle de gestion et stratégie", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "Les indicateurs de durabilité au tableau de bord",
  accroche:
    "Le tableau de bord de NOVA suit l'argent : ventes, résultat, trésorerie. Que consomme-t-elle, que jette-t-elle, comment va son équipe ? Ajoutez au tableau de bord des indicateurs de durabilité, calculez-les, et voyez comment un indicateur peut tromper.",
  objectifs: [
    "Distinguer les indicateurs financiers et extra-financiers d'un tableau de bord, et ranger ces derniers par pilier environnemental, social ou de gouvernance",
    "Calculer des indicateurs de durabilité et leurs intensités : énergie, émissions, déchets, absentéisme, accidents du travail",
    "Rattacher un indicateur à un centre de responsabilité et à un maillon de la chaîne de valeur",
    "Repérer les risques liés à un indicateur et à sa mesure",
    "Traduire une exigence de durabilité en indicateur du tableau de bord",
  ],
  libre: false,
  prerequis: ["tableau-de-bord", "la-responsabilite-societale"],
  ensuite: ["ce-que-rapporte-l-engagement"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_DURABILITE,
    pourquoi: "le tableau de bord durable se calcule ici sur le semestre de NOVA dans la simulation du cours, celui du chapitre « Tableau de bord » ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un tableau de bord qui ne voit que l'argent",
      notions: ["dashboard", "csr_index"],
      tableau: tableauFinancier,
      texte: (c) => {
        const x = durabiliteDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}, de janvier à juin : le semestre du chapitre « Tableau de bord ». Ses voyants suivent la marge de sécurité, le résultat, la trésorerie et la part de marché. Tous parlent d'argent ou de ventes.`,
          `Or ${x.f.entreprise} consomme de l'électricité, jette des emballages, fait travailler ${qte(x.mars.effectif)} opérateurs et paie ses fournisseurs. La performance globale d'une entreprise ne se lit pas dans ses seuls comptes : ses clients, ses salariés, sa banque et la loi lui demandent aussi ce qu'elle fait de ses ressources.`,
          "Vous allez ajouter au tableau de bord des indicateurs de durabilité, les calculer mois par mois, les rattacher à ceux qui en répondent, puis voir comment un indicateur peut tromper celui qui le lit.",
        ];
      },
      repere: () =>
        "Un indicateur extra-financier ne s'exprime pas en euros : des kWh, des kilos, des heures, des jours. Les indicateurs de durabilité se rangent en trois piliers : environnemental, social et de gouvernance (ESG).",
    },
    {
      id: "les-trois-piliers",
      objectifs: [0],
      type: "choix",
      titre: "Ranger les indicateurs",
      notions: ["dashboard", "csr_index"],
      tableau: (c) => ({
        titre: `Les indicateurs que la direction ajoute au tableau de bord · ${durabiliteDuChapitre(c).f.entreprise}`,
        colonnes: ["Se mesure en"],
        lignes: [
          { libelle: indicateur("kwhParEnceinte").libelle, valeurs: ["kWh par enceinte"] },
          { libelle: indicateur("partValorisee").libelle, valeurs: ["% du poids des emballages"] },
          { libelle: indicateur("absenteisme").libelle, valeurs: ["% des heures payées"] },
          { libelle: indicateur("delaiFournisseurs").libelle, valeurs: ["jours"] },
        ],
      }),
      question: () => "La direction ajoute ces indicateurs au tableau de bord. Lequel de ces rangements par pilier est juste ?",
      options: () => [
        {
          texte: "Énergie et déchets : environnement ; absentéisme : social ; délai : gouvernance",
          juste: true,
          retour:
            "Oui. L'énergie et les déchets disent ce que NOVA prend et rejette ; l'absentéisme, comment va son équipe ; le délai de paiement, comment elle se conduit avec ses partenaires. Payer ses fournisseurs à temps est une question de gouvernance : un gros client qui paie tard met en danger les petits fournisseurs.",
        },
        {
          texte: "Énergie : gouvernance, car la direction choisit son fournisseur d'électricité ; le reste : social",
          juste: false,
          retour: "Non : l'énergie consommée est un indicateur environnemental, quel que soit celui qui signe le contrat. Les déchets aussi.",
        },
        {
          texte: "Tous financiers : chacun finit par coûter de l'argent à NOVA",
          juste: false,
          retour: "Non : un indicateur financier s'exprime en euros. Ces quatre-là se mesurent en kWh, en pour cent du poids ou des heures, en jours : ce sont des indicateurs extra-financiers, même si chacun a un coût.",
        },
      ],
    },
    {
      id: "l-energie-de-fevrier",
      objectifs: [1],
      type: "montants",
      titre: "L'énergie de février",
      notions: ["csr_index", "variable_costs"],
      question: (c) => {
        const x = durabiliteDuChapitre(c);
        const m = x.fevrier;
        return `En février, ${x.f.entreprise} monte ${qte(m.quantite)} enceintes. La chaîne consomme ${qte(KWH_PAR_ENCEINTE)} kWh par enceinte ; le bâtiment, ${qte(KWH_DU_BATIMENT_PAR_MOIS)} kWh par mois. Calculez l'énergie du mois, l'énergie par enceinte au centième, puis les émissions du mois à ${coef(KG_CO2_PAR_KWH)} kg de CO2 équivalent par kWh, au centième.`;
      },
      champs: (c) => {
        const m = durabiliteDuChapitre(c).fevrier;
        return [
          { libelle: "Énergie du mois (kWh)", nature: "grandeur", attendu: m.kwh, calcul: `${qte(m.quantite)} × ${qte(KWH_PAR_ENCEINTE)} + ${qte(KWH_DU_BATIMENT_PAR_MOIS)} = ${qte(m.kwh)} kWh` },
          { libelle: "Énergie par enceinte (kWh)", nature: "grandeur", attendu: arrondi(m.valeurs.kwhParEnceinte, 2), calcul: `${qte(m.kwh)} ÷ ${qte(m.quantite)} = ${qte(m.valeurs.kwhParEnceinte)} kWh` },
          { libelle: "Émissions du mois (kg de CO2 équivalent)", nature: "grandeur", attendu: m.co2, calcul: `${qte(m.kwh)} × ${coef(KG_CO2_PAR_KWH)} = ${qte(m.co2)} kg` },
        ];
      },
      explication: (c) => {
        const x = durabiliteDuChapitre(c);
        const m = x.fevrier;
        return [
          `Février consomme ${qte(m.valeurs.kwhParEnceinte)} kWh par enceinte : le voyant, réglé à ${qte(SEUILS_DE_DURABILITE.kwhParEnceinte)} kWh, s'allume. En juin, ${qte(x.juin.valeurs.kwhParEnceinte)} kWh seulement, avec la même chaîne.`,
          "L'énergie par enceinte est une intensité : un total rapporté à une activité. Elle permet de comparer des mois de volumes différents, mais elle porte la part fixe du bâtiment, qui pèse plus quand on vend moins.",
        ];
      },
    },
    {
      id: "predire-l-intensite",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur l'intensité",
      notions: ["csr_index"],
      question: (c) => {
        const x = durabiliteDuChapitre(c);
        return `Avant de manipuler, pariez. Si février avait vendu autant que juin, ${qte(x.juin.quantite)} enceintes, sans rien changer à la chaîne ni au bâtiment, son voyant d'énergie…`;
      },
      options: (c) => {
        const x = durabiliteDuChapitre(c);
        const r = indicateursDurablesDuMois(x.f, MOIS_DE_L_ENERGIE, { quantite: x.juin.quantite });
        const voir = "Faites varier les enceintes de février dans le laboratoire de l'étape suivante.";
        return [
          { texte: "S'éteindrait", juste: !r.voyants.kwhParEnceinte, retour: `Bon pari. ${voir}` },
          { texte: "Resterait allumé : rien n'a changé dans l'atelier", juste: r.voyants.kwhParEnceinte, retour: `Pari à vérifier. ${voir}` },
          { texte: "S'allumerait plus fort : plus d'enceintes, plus d'énergie", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-durable",
      objectifs: [1, 2],
      type: "simulation",
      titre: "Le laboratoire du tableau de bord durable",
      notions: ["csr_index", "dashboard", "breakeven"],
      question: () =>
        "Faites varier, pour février, les enceintes vendues, l'énergie que la chaîne consomme par enceinte et la part valorisée des déchets : le tableau suit le résultat du mois et les indicateurs de durabilité. Relevez le défi, puis cherchez quel voyant aucun de ces leviers n'éteint.",
      leviers: (c) => {
        const x = durabiliteDuChapitre(c);
        const L = LEVIERS_DURABLES;
        return [
          { code: "quantite", libelle: "Enceintes vendues en février", unite: "enceintes", ...L.quantite, depart: x.fevrier.quantite },
          { code: "kwh", libelle: "Énergie de la chaîne par enceinte", unite: "kWh", ...L.kwh, depart: KWH_PAR_ENCEINTE },
          { code: "valorisee", libelle: "Part valorisée des déchets", unite: "%", ...L.valorisee, depart: PART_VALORISEE.avant * 100 },
        ];
      },
      lecture: (c, p) => {
        const x = durabiliteDuChapitre(c);
        const r = laboratoireDurable(x.f, p);
        const d = x.fevrier;
        return [
          { libelle: "Résultat de février", montant: r.resultat, reference: d.resultat, fort: true },
          { libelle: "Énergie par enceinte", montant: arrondi(r.valeurs.kwhParEnceinte, 2), unite: "kWh", reference: arrondi(d.valeurs.kwhParEnceinte, 2) },
          { libelle: "Émissions du mois", montant: r.co2, unite: "kg de CO2 équivalent", reference: d.co2 },
          { libelle: "Déchets valorisés", montant: arrondi(r.valeurs.partValorisee * 100, 1), unite: "%", reference: arrondi(d.valeurs.partValorisee * 100, 1) },
          { libelle: "Absentéisme", montant: arrondi(r.valeurs.absenteisme * 100, 2), unite: "%", reference: arrondi(d.valeurs.absenteisme * 100, 2) },
        ];
      },
      // L'énergie par enceinte baisse quand le volume monte (la part du bâtiment se dilue) ; le seuil d'alerte reste plat.
      graphique: (c) => {
        const x = durabiliteDuChapitre(c);
        return {
          levier: "quantite",
          unite: "kWh",
          courbes: [
            { libelle: "Énergie par enceinte", valeur: (p) => arrondi(laboratoireDurable(x.f, p).valeurs.kwhParEnceinte, 3) },
            { libelle: "Seuil d'alerte", valeur: () => SEUILS_DE_DURABILITE.kwhParEnceinte },
          ],
        };
      },
      defi: (c) => {
        const x = durabiliteDuChapitre(c);
        const L = LEVIERS_DURABLES;
        return {
          consigne: `Éteignez en février le voyant du résultat (au moins ${eur(0)}), celui de l'énergie (au plus ${qte(SEUILS_DE_DURABILITE.kwhParEnceinte)} kWh par enceinte) et celui des déchets (au moins ${pct(SEUILS_DE_DURABILITE.partValorisee)} valorisés).`,
          atteint: (p) => defiDurableAtteint(x.f, p),
          indice: (p) => {
            const r = laboratoireDurable(x.f, p);
            if (r.resultat < 0) return `Février perd ${eur(-r.resultat)} : il faut au moins ${qte(x.seuil)} enceintes pour couvrir les charges fixes.`;
            if (r.voyants.kwhParEnceinte) return `L'énergie fait ${qte(r.valeurs.kwhParEnceinte)} kWh par enceinte : vendez plus, ou réduisez ce que consomme la chaîne.`;
            return `Seuls ${pct(r.valeurs.partValorisee)} des déchets sont valorisés : il faut trouver une filière pour les mousses.`;
          },
          solution: { quantite: Math.ceil(x.volumeDEnergie / L.quantite.pas - 1e-9) * L.quantite.pas, kwh: KWH_PAR_ENCEINTE, valorisee: SEUILS_DE_DURABILITE.partValorisee * 100 },
        };
      },
      explication: (c, p) => {
        const x = durabiliteDuChapitre(c);
        const r = laboratoireDurable(x.f, p);
        return [
          `Défi relevé : ${qte(p.quantite!)} enceintes, ${qte(p.kwh!)} kWh par enceinte à la chaîne, ${qte(p.valorisee!)} % de déchets valorisés. Février gagne ${eur(r.resultat)} et consomme ${qte(r.valeurs.kwhParEnceinte)} kWh par enceinte.`,
          `Le voyant de l'absentéisme reste allumé, ${pct(r.valeurs.absenteisme)} : ni le volume ni l'atelier ne le règlent. Chaque face du tableau de bord a ses propres leviers, et ses propres responsables.`,
        ];
      },
    },
    {
      id: "le-seuil-d-energie",
      objectifs: [1],
      type: "montants",
      titre: "Le volume qui éteint le voyant",
      notions: ["csr_index", "breakeven"],
      question: (c) => {
        const x = durabiliteDuChapitre(c);
        return `Le laboratoire l'a montré : à ${qte(KWH_PAR_ENCEINTE)} kWh par enceinte à la chaîne, l'énergie par enceinte passe sous ${qte(SEUILS_DE_DURABILITE.kwhParEnceinte)} kWh à partir d'un certain volume. Calculez ce volume (bâtiment ÷ (seuil − chaîne), à l'unité supérieure), puis le seuil de rentabilité du mois en enceintes, à l'unité supérieure, avec ${eur(x.f.moisDeReference.prix)} de prix et ${eur(x.f.moisDeReference.coutVariable.composants + x.f.moisDeReference.coutVariable.autres)} de coût variable.`;
      },
      champs: (c) => {
        const x = durabiliteDuChapitre(c);
        const m = x.f.moisDeReference;
        const fixes = m.chargesFixes.loyer + m.chargesFixes.personnel + m.chargesFixes.amortissement;
        const marge = m.prix - m.coutVariable.composants - m.coutVariable.autres;
        return [
          { libelle: "Volume qui éteint le voyant d'énergie (enceintes)", nature: "quantite", attendu: x.volumeDEnergie, calcul: `${qte(KWH_DU_BATIMENT_PAR_MOIS)} ÷ (${qte(SEUILS_DE_DURABILITE.kwhParEnceinte)} − ${qte(KWH_PAR_ENCEINTE)}) = ${qte(KWH_DU_BATIMENT_PAR_MOIS / (SEUILS_DE_DURABILITE.kwhParEnceinte - KWH_PAR_ENCEINTE))} enceintes` },
          { libelle: "Seuil de rentabilité du mois (enceintes)", nature: "quantite", attendu: x.seuil, calcul: `${eur(fixes)} ÷ ${eur(marge)} = ${qte(fixes / marge)}, arrondi à l'unité supérieure : ${qte(x.seuil)} enceintes` },
        ];
      },
      explication: (c) => {
        const x = durabiliteDuChapitre(c);
        return [
          `L'énergie a son « seuil » comme le résultat : une part fixe (le bâtiment) qui se dilue dans le volume. Février, ${qte(x.fevrier.quantite)} enceintes, est sous les deux : sous le seuil de rentabilité (${qte(x.seuil)}) et sous le volume d'énergie (${qte(x.volumeDEnergie)}).`,
          "Un indicateur d'intensité dépend donc du volume autant que de l'efficacité : avant de blâmer l'atelier pour un voyant d'énergie, il faut regarder les ventes.",
        ];
      },
    },
    {
      id: "le-tableau-de-mars",
      objectifs: [1],
      type: "a-completer",
      titre: "Les indicateurs de mars",
      notions: ["csr_index", "dashboard"],
      question: (c) => {
        const x = durabiliteDuChapitre(c);
        const m = x.mars;
        return `À vous, sans formule : remplissez les indicateurs de durabilité de mars. ${qte(m.quantite)} enceintes ; ${qte(KG_D_EMBALLAGE_PAR_ENCEINTE)} kg d'emballage par enceinte, ${pct(m.valeurs.partValorisee)} valorisés ; ${qte(m.effectif)} opérateurs à ${qte(HEURES_LEGALES_PAR_MOIS)} heures payées, ${qte(m.absences)} heures d'absence, ${qte(m.accidents)} accident avec arrêt. Le taux de fréquence = accidents × 1 000 000 ÷ heures travaillées.`;
      },
      grille: (c) => {
        const x = durabiliteDuChapitre(c);
        const m = x.mars;
        return {
          titre: `Le tableau de bord durable de ${m.nom} · ${x.f.entreprise}`,
          colonnes: [m.nom],
          lignes: [
            { libelle: "Énergie du mois (kWh)", cellules: [aSaisir(m.kwh, `${qte(m.quantite)} × ${qte(KWH_PAR_ENCEINTE)} + ${qte(KWH_DU_BATIMENT_PAR_MOIS)} = ${qte(m.kwh)}`, { unite: "kWh", indice: "la chaîne, plus le bâtiment" })] },
            { libelle: "Énergie par enceinte (kWh)", cellules: [aSaisir(arrondi(m.valeurs.kwhParEnceinte, 2), `${qte(m.kwh)} ÷ ${qte(m.quantite)} = ${qte(m.valeurs.kwhParEnceinte)}`, { unite: "kWh", tolerance: 0.01 })] },
            { libelle: "Émissions du mois (kg de CO2 équivalent)", cellules: [aSaisir(m.co2, `${qte(m.kwh)} × ${coef(KG_CO2_PAR_KWH)} = ${qte(m.co2)}`, { unite: "kg", tolerance: 0.01 })] },
            { libelle: "Déchets d'emballage (kg)", cellules: [aSaisir(m.dechets, `${qte(m.quantite)} × ${qte(KG_D_EMBALLAGE_PAR_ENCEINTE)} = ${qte(m.dechets)}`, { unite: "kg" })] },
            { libelle: "Déchets valorisés (kg)", cellules: [aSaisir(m.valorises, `${qte(m.dechets)} × ${pct(m.valeurs.partValorisee)} = ${qte(m.valorises)}`, { unite: "kg", tolerance: 0.01 })] },
            { libelle: "Absentéisme (%)", cellules: [aSaisir(arrondi(m.valeurs.absenteisme * 100, 2), `${qte(m.absences)} ÷ (${qte(m.effectif)} × ${qte(HEURES_LEGALES_PAR_MOIS)}) = ${qte(m.absences)} ÷ ${qte(m.heuresPayees)} = ${pct(m.valeurs.absenteisme)}`, { unite: "%", tolerance: 0.01 })] },
            { libelle: "Taux de fréquence des accidents", cellules: [aSaisir(arrondi(m.valeurs.tauxDeFrequence, 2), `${qte(m.accidents)} × 1 000 000 ÷ (${qte(m.heuresPayees)} − ${qte(m.absences)}) = ${qte(m.valeurs.tauxDeFrequence)}`, { unite: "", nature: "grandeur", indice: "les heures travaillées sont les heures payées moins les absences" })] },
          ],
        };
      },
      explication: (c) => {
        const x = durabiliteDuChapitre(c);
        const m = x.mars;
        return [
          `En ${m.nom}, l'énergie par enceinte retombe à ${qte(m.valeurs.kwhParEnceinte)} kWh, et l'absentéisme à ${pct(m.valeurs.absenteisme)}. Mais le taux de fréquence bondit à ${qte(m.valeurs.tauxDeFrequence)} : un seul accident.`,
          "Chaque indicateur a sa base : l'enceinte pour l'énergie, le kilo d'emballage pour les déchets, l'heure payée pour l'absentéisme, l'heure travaillée pour les accidents. Une base mal choisie change ce que dit le chiffre.",
        ];
      },
    },
    {
      id: "le-taux-de-frequence",
      objectifs: [3],
      type: "choix",
      titre: "Un taux sur une petite base",
      notions: ["csr_index", "dashboard"],
      question: (c) => {
        const x = durabiliteDuChapitre(c);
        return `Le taux de fréquence de mars, ${qte(x.mars.valeurs.tauxDeFrequence)}, est des dizaines de fois celui d'une industrie ordinaire. Le président s'alarme : « Notre atelier est le plus dangereux de France ? »`;
      },
      options: (c) => {
        const x = durabiliteDuChapitre(c);
        const s = x.t.semestre;
        return [
          {
            texte: "Non : un accident sur une base minuscule",
            juste: true,
            retour: `Oui. Le taux de fréquence se rapporte au million d'heures travaillées ; ${x.f.entreprise} en travaille ${qte(x.mars.heuresTravaillees)} en un mois. Un seul accident y pèse comme des centaines dans une grande usine. Sur le semestre, le taux tombe à ${qte(s.tauxDeFrequence)}, toujours sur un seul accident. Pour une petite équipe, le nombre d'accidents et leur cause disent plus que le taux.`,
          },
          {
            texte: "Oui : le taux est fait pour comparer les entreprises entre elles",
            juste: false,
            retour: "Non : il compare des entreprises dont les heures se comptent en millions. Sur quelques centaines d'heures, un seul accident suffit à faire exploser le taux.",
          },
          {
            texte: "Il faut l'ôter du tableau de bord : il fait peur sans rien apprendre",
            juste: false,
            retour: "Non : la sécurité de l'équipe doit se suivre. Il faut garder l'indicateur, mais le lire avec sa base (les heures et le nombre d'accidents), sur une période assez longue.",
          },
        ];
      },
    },
    {
      id: "le-semestre",
      objectifs: [1],
      type: "montants",
      titre: "Le semestre entier",
      notions: ["csr_index", "dashboard"],
      tableau: tableauDurable,
      question: (c) => {
        const s = durabiliteDuChapitre(c).t.semestre;
        return `Sur le semestre, ${qte(s.quantite)} enceintes ont consommé ${qte(s.kwh)} kWh et émis ${qte(s.co2)} kg de CO2 équivalent ; ${qte(s.valorises)} kg des ${qte(s.dechets)} kg d'emballage ont été valorisés ; le chiffre d'affaires fait ${eur(s.chiffreDAffaires)}. Sans formule : calculez l'énergie par enceinte du semestre, la part des déchets valorisés et les émissions pour 1 000 € de chiffre d'affaires, chacun au centième.`;
      },
      champs: (c) => {
        const s = durabiliteDuChapitre(c).t.semestre;
        return [
          { libelle: "Énergie par enceinte du semestre (kWh)", nature: "grandeur", attendu: arrondi(s.kwhParEnceinte, 2), calcul: `${qte(s.kwh)} ÷ ${qte(s.quantite)} = ${qte(s.kwhParEnceinte)} kWh` },
          { libelle: "Part des déchets valorisés (%)", attendu: arrondi(s.partValorisee * 100, 2), tolerance: 0.01, calcul: `${qte(s.valorises)} ÷ ${qte(s.dechets)} = ${pct(s.partValorisee)}` },
          { libelle: "Émissions pour 1 000 € de chiffre d'affaires (kg)", nature: "grandeur", attendu: arrondi(s.co2ParMilleEuros, 2), calcul: `${qte(s.co2)} ÷ ${eur(s.chiffreDAffaires)} × 1 000 = ${qte(s.co2ParMilleEuros)} kg` },
        ];
      },
      explication: (c) => {
        const x = durabiliteDuChapitre(c);
        const s = x.t.semestre;
        return [
          `Une intensité du semestre se calcule sur les totaux, pas en moyenne des mois : la moyenne simple des six parts valorisées donnerait ${pct((PART_VALORISEE.avant * 3 + PART_VALORISEE.apres * 3) / 6)}. Les mois d'avril à juin, plus lourds en emballages, portent la part réelle à ${pct(s.partValorisee)}.`,
          "Rapportées au chiffre d'affaires, les émissions baissent si les prix montent, sans un kWh de moins : une intensité financière se lit avec prudence.",
        ];
      },
    },
    {
      id: "qui-repond-de-l-energie",
      objectifs: [2],
      type: "choix",
      titre: "Qui répond de l'énergie",
      notions: ["dashboard", "csr_index"],
      question: (c) => {
        const x = durabiliteDuChapitre(c);
        return `Dans « Piloter un centre », ${x.f.entreprise} s'est découpée en deux centres : ${CENTRES_DE_RESPONSABILITE.atelier.nom.toLowerCase()} et ${CENTRES_DE_RESPONSABILITE.commercial.nom.toLowerCase()}. À qui confier l'indicateur d'énergie par enceinte, et comment le lire ?`;
      },
      options: (c) => {
        const x = durabiliteDuChapitre(c);
        return [
          {
            texte: "Au chef d'atelier, en séparant chaîne et bâtiment",
            juste: true,
            retour: `Oui. L'énergie se consomme à l'atelier : c'est son indicateur. Mais une part, le bâtiment (${qte(KWH_DU_BATIMENT_PAR_MOIS)} kWh), ne dépend pas de lui, et le volume qui la dilue, c'est le service commercial qui le fait. Le chef d'atelier répond des ${qte(KWH_PAR_ENCEINTE)} kWh de la chaîne ; l'intensité totale se lit au niveau de ${x.f.entreprise}.`,
          },
          {
            texte: "À la responsable commerciale : le volume fait l'intensité",
            juste: false,
            retour: "Non : elle ne règle ni les machines ni leur consommation. Lui confier l'indicateur, c'est la juger sur ce qu'elle ne maîtrise pas, l'erreur du coût réel dans les prix de cession.",
          },
          {
            texte: "À personne : un indicateur de durabilité concerne toute l'entreprise",
            juste: false,
            retour: "Non : un indicateur sans responsable n'est suivi par personne. La méthode OVAR rattache chaque indicateur à un objectif, à une variable d'action et à un responsable.",
          },
        ];
      },
    },
    {
      id: "la-chaine-de-valeur",
      objectifs: [2],
      type: "choix",
      titre: "Les déchets dans la chaîne de valeur",
      notions: ["csr_index", "dashboard"],
      question: (c) => {
        const x = durabiliteDuChapitre(c);
        return `À partir d'avril, la part valorisée des déchets passe de ${pct(PART_VALORISEE.avant)} à ${pct(PART_VALORISEE.apres)}, sans rien changer à l'atelier. Que dit ce progrès de la lecture d'un indicateur par centre, chez ${x.f.entreprise} ?`;
      },
      options: () => [
        {
          texte: "Le levier était en amont, chez le fournisseur",
          juste: true,
          retour:
            "Oui. Les mousses arrivent avec les jeux de composants : c'est quand le fournisseur a accepté de les reprendre que l'indicateur a bougé. Un indicateur se mesure dans un centre, mais ses causes courent le long de la chaîne de valeur, des approvisionnements à la distribution. Un tableau de bord cloisonné par centre ne le voit pas.",
        },
        {
          texte: "Que l'atelier a mieux trié ses déchets à partir d'avril",
          juste: false,
          retour: "Non : rien n'a changé dans l'atelier. Lire l'indicateur comme un mérite du centre qui le mesure serait une erreur d'attribution.",
        },
        {
          texte: "Rien : un indicateur environnemental ne se rattache à aucun maillon",
          juste: false,
          retour: "Non : chaque indicateur naît quelque part dans la chaîne. Les déchets d'emballage naissent aux approvisionnements, l'énergie à la production, la dépendance à un client à la distribution.",
        },
      ],
    },
    {
      id: "traduire-la-norme",
      objectifs: [4],
      type: "choix",
      titre: "Traduire une norme en indicateur",
      notions: ["csr_index", "payment_terms"],
      question: () =>
        "CampusTech publie un rapport de durabilité selon les normes européennes (ESRS). Elle demande à ses fournisseurs, dont NOVA, de quoi renseigner la norme G1, « conduite des affaires », qui demande notamment les pratiques de paiement. Quel indicateur du tableau de bord y répond ?",
      options: (c) => {
        const x = durabiliteDuChapitre(c);
        const d = x.fevrier.valeurs.delaiFournisseurs;
        return [
          {
            texte: `Le délai de paiement des fournisseurs, ${qte(d)} jours`,
            juste: true,
            retour: `Oui. La norme G1 demande comment l'entreprise paie ses fournisseurs : ${x.f.entreprise} paie le sien à ${qte(d)} jours, sous les ${qte(DELAI_CONVENU_DE_CAMPUSTECH)} jours du code de commerce. Traduire une norme, c'est trouver la donnée qui la mesure, sa source et sa période. Ironie du cas : CampusTech, elle, paie ${x.f.entreprise} avec ${qte(RETARD_DE_CAMPUSTECH)} jours de retard.`,
          },
          {
            texte: "L'énergie par enceinte, puisque c'est un rapport de durabilité",
            juste: false,
            retour: "Non : l'énergie répond à la norme E1, sur le climat. Chaque norme a ses indicateurs ; un rapport de durabilité ne se remplit pas avec n'importe quel chiffre vert.",
          },
          {
            texte: "Le résultat du semestre : la conduite des affaires, c'est la rentabilité",
            juste: false,
            retour: "Non : le résultat est un indicateur financier. La conduite des affaires parle d'éthique, de corruption, de relations avec les fournisseurs, de paiement à temps.",
          },
        ];
      },
    },
    {
      id: "les-risques-de-la-mesure",
      objectifs: [3],
      type: "choix",
      titre: "Éteindre un voyant sans rien changer",
      notions: ["dashboard", "csr_index"],
      question: () =>
        `Pour éteindre le voyant d'énergie de février, le chef d'atelier propose de ne plus compter le bâtiment dans l'indicateur : « Ce n'est pas l'atelier. » L'énergie par enceinte tomberait à ${qte(KWH_PAR_ENCEINTE)} kWh. Qu'en dit le contrôleur ?`,
      options: () => [
        {
          texte: "Le voyant s'éteindrait sans un kWh de moins",
          juste: true,
          retour:
            "Oui. Changer le périmètre d'un indicateur change le chiffre, pas la réalité. Le risque est classique : quand un indicateur devient un objectif, ceux qui en répondent travaillent l'indicateur plutôt que ce qu'il mesure. Le bon geste est de garder le total, et d'ajouter l'indicateur de la chaîne seule, celui dont l'atelier répond.",
        },
        {
          texte: "Il a raison : un indicateur ne doit mesurer que ce que l'atelier maîtrise",
          juste: false,
          retour: "Non : le bâtiment consomme vraiment, et ses émissions sont celles de NOVA. On peut séparer les deux parts pour juger l'atelier, mais pas effacer l'une du tableau de bord.",
        },
        {
          texte: "Peu importe : un indicateur de durabilité n'est jamais vérifié",
          juste: false,
          retour: "Non : les informations de durabilité se vérifient, comme les comptes, quand l'entreprise ou ses clients les publient. Un périmètre changé sans le dire est une information trompeuse.",
        },
      ],
    },
    {
      id: "concevoir-le-tableau",
      objectifs: [4],
      type: "choix",
      titre: "Le tableau de bord de juillet",
      notions: ["dashboard", "csr_index"],
      question: () =>
        "Le président veut un tableau de bord d'une page pour le second semestre, avec des indicateurs de durabilité. Lequel de ces principes retenez-vous ?",
      options: () => [
        {
          texte: "Une dizaine d'indicateurs, chacun avec cible, seuil et responsable",
          juste: true,
          retour:
            "Oui. Un tableau de bord se lit d'un coup d'œil : une dizaine d'indicateurs, financiers et extra-financiers, chacun rattaché à un objectif, avec sa cible, son seuil d'alerte, sa source, sa fréquence et son responsable. C'est la démarche OVAR.",
        },
        {
          texte: "Tous les indicateurs qu'on sait calculer, pour ne rien laisser échapper",
          juste: false,
          retour: "Non : un tableau de bord de plusieurs pages ne se lit plus. Il faut choisir les indicateurs qui disent les facteurs clés de succès, et laisser le reste aux tableaux de bord des centres.",
        },
        {
          texte: "Seulement des indicateurs de durabilité : les financiers sont déjà dans les comptes",
          juste: false,
          retour: "Non : les comptes arrivent trop tard pour piloter. La performance globale se suit sur toutes ses faces à la fois, dans le même tableau.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["dashboard", "csr_index"],
      texte: (c) => {
        const x = durabiliteDuChapitre(c);
        const s = x.t.semestre;
        return [
          `Vous avez ajouté au tableau de bord de ${x.f.entreprise} des indicateurs de durabilité, rangés en trois piliers, et les avez calculés : ${qte(s.kwhParEnceinte)} kWh par enceinte sur le semestre, ${pct(s.partValorisee)} des déchets valorisés, ${pct(s.absenteisme)} d'absentéisme.`,
          "Vous avez vu qu'une intensité dépend du volume, et qu'un taux sur une petite base s'emballe. Un indicateur se rattache à un centre, mais ses causes courent le long de la chaîne de valeur ; et un périmètre changé éteint un voyant sans rien changer.",
          "Au niveau de l'examen, vous savez proposer et calculer des indicateurs financiers et extra-financiers, les rattacher à un responsable, traduire une exigence de durabilité en indicateur, et dire les risques de leur mesure.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Intensité = total ÷ activité (kWh par enceinte, kg pour 1 000 € de chiffre d'affaires). Absentéisme = heures d'absence ÷ heures payées. Taux de fréquence = accidents avec arrêt × 1 000 000 ÷ heures travaillées. Un indicateur a une cible, un seuil, une source, une fréquence et un responsable.",
    },
  ],
};
