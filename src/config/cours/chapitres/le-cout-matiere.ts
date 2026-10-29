import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { MARGE_DE_PREPARATION, anneeDeCuisine, couvertsServables, coutDuCouvert, trimestreDeCuisine, type TrimestreDeCuisine } from "../monde/cuisine";
import { BISTROTS_DU_COURS, type FicheDuBistrot } from "../monde/la-table-d-augustin";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE COÛT MATIÈRE ET LE PRIX D'UN PLAT (BTS MHR, palier 2).
 *
 * Le calcul que le chef fait pour chaque plat de sa carte : ce que coûtent ses denrées (le coût
 * matière), la part du prix qu'elles prennent (le ratio coût matière), le coefficient qui passe
 * de l'un à l'autre, et le prix de vente, hors taxes puis toutes taxes comprises, qui garde le
 * ratio quand les denrées augmentent. Puis le ratio de l'année, trimestre par trimestre, et ce
 * qu'il dit de la carte et de la cuisine.
 *
 * IL NE DOUBLE PAS « Taux de marque, taux de marge, coefficient » (BTS MCO), qui compare le prix
 * de vente au prix d'achat d'un article et change de fournisseur, ni « Prix, coût et marge », qui
 * compare le prix à tout le coût variable. Ici, les mots et les ratios de la cuisine : le coût
 * matière ne compte que les denrées, le coefficient se lit comme l'inverse du ratio visé, et le
 * ratio de l'année dit ce que la cuisine a consommé, plats préparés et non servis compris.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le bistrot
 * du cours, LA TABLE D'AUGUSTIN, a une fiche figée (ses couverts servables, son ticket, ses
 * denrées et leur fiche technique, la demande de chaque clientèle, la hausse des denrées de
 * l'année) et un modèle simple de sa cuisine (monde/cuisine.ts) : elle prépare la demande plus
 * une marge de préparation, dans la limite des couverts servables, et jette ce qui n'est pas
 * servi. Une évolution du moteur de l'arène ne change rien ici. Décision du propriétaire
 * (octobre 2026) : le contenu du cours fait l'objet de la simulation, inspirée des entreprises de
 * l'arène sans en être le reflet exact.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, ce-qui-entre, le-ratio-du-couvert, la-hausse, le-prix-du-plat (la formule est au
 *     repère ou dans la question, qui nomme les chiffres à prendre) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-prix puis
 *     le-prix-au-curseur (le ticket HT, ce que le ratio laisse aux denrées face aux denrées après la
 *     hausse) avant le-prix-du-plat ; predire-la-marge-de-manoeuvre puis la-hausse-au-curseur (la
 *     hausse des denrées que la fourchette de la profession absorbe, couverts jetés compris) avant
 *     l-annee et les-denrees-perdues ;
 *   · autonome : l-annee, ce-que-dit-le-ratio (ni formule ni chiffres à prendre ; le calcul de la
 *     correction montre le chemin) ;
 *   · expert : les-denrees-perdues (le ratio du trimestre décomposé : la carte, le prix des denrées,
 *     les couverts jetés), le-laboratoire-de-la-cuisine (le ticket et la marge de préparation : ramener
 *     le ratio dans la fourchette sans perdre de marge demande les deux leviers, et le meilleur ticket
 *     n'est pas celui du meilleur ratio), la-prime-au-ratio (une critique de la méthode), le-plat-du-jour
 *     (un calcul à rebours, du prix TTC au coût d'une portion préparée) ; puis la synthèse.
 */

/**
 * La fourchette de ratio coût matière que la profession vise en restauration traditionnelle
 * (celle que l'arène écrit sous son indicateur « Ratio matières », relevée une fois).
 */
export const FOURCHETTE_DE_LA_PROFESSION = { min: 28, max: 32 } as const;

/** Les bornes du curseur du prix : le ticket HT du couvert, à l'euro, de 30 à 45 €. */
export const PRIX_DU_CURSEUR = { min: 30, max: 45 } as const;

/** Les bornes du curseur de la hausse des denrées, en pour cent. */
export const HAUSSE_DU_CURSEUR = { min: 0, max: 20 } as const;

/**
 * LE LABORATOIRE DE LA CUISINE : le ticket HT (de 30 à 42 €, par 50 centimes) et la marge de
 * préparation (de 0 à 10 %, par point), au trimestre du ratio le plus haut.
 */
export const TICKET_DU_LABORATOIRE = { min: 30, max: 42, pas: 0.5 } as const;
export const MARGE_DU_LABORATOIRE = { min: 0, max: 10, pas: 1 } as const;

/**
 * LE PLAT DU JOUR, hypothèse du cours pour le calcul à rebours : un plat vendu 19,80 € TTC, dont le
 * chef veut tenir le ratio au bas de la fourchette de la profession, la cuisine en préparant autant
 * de plus que d'habitude (la marge de préparation du modèle).
 */
export const PLAT_DU_JOUR_TTC = 19.8;

/** Les entreprises du cours qui ont une cuisine. */
export const CUISINES = ["bistrot"] as const;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
/** Un écart entre deux ratios : des points, pas des pour cent. */
const points = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} ${Math.abs(t) >= 2 ? "points" : "point"}`;
const coef = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auCentime = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « 1er », « 3e » : le rang d'un trimestre, compté à partir de 1. */
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
/** « 3e trimestre », dans une phrase. */
const trimestre = (n: number) => `${rang(n)} trimestre`;

export type { TrimestreDeCuisine };

/** La fiche du bistrot du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDuBistrot => BISTROTS_DU_COURS[c.code]!;

/** Le couvert, sa carte, la hausse des denrées de l'année, et le ratio des quatre trimestres. */
export function coutMatiere(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const matiere = f.coutMatiereParCouvert;
  const prix = f.prixDeLAnnee;
  const tauxTva = f.tauxTva;
  const ratio = auDixieme((matiere / prix) * 100);
  const coefficient = auCentime(100 / ratio);
  const annee = anneeDeCuisine(f);
  const t = annee.trimestres;
  // La hausse des denrées : les trimestres où le couvert coûte plus que sa fiche.
  const touches = t.filter((x) => x.coutDuCouvert > matiere).map((x) => x.numero);
  const premier = touches[0] ?? 0;
  const coutHausse = premier ? coutDuCouvert(f, premier) : matiere;
  const prixQuiGarde = auCentime(coutHausse * coefficient);
  const ratios = t.map((x) => x.ratio);
  const pire = ratios.indexOf(Math.max(...ratios)) + 1;
  const p = t[pire - 1]!;
  const coutDesPerdus = auCentime(p.perdus * p.coutDuCouvert);
  // Le curseur du prix : le plus petit ticket, à l'euro, où la part que le ratio de la carte laisse aux
  // denrées couvre les denrées du couvert après la hausse.
  const prixAuCurseur = Math.ceil(coutHausse / (ratio / 100) - 1e-9);
  // Le curseur de la hausse : ce que le haut de la fourchette laisse aux denrées d'un couvert servi au
  // ticket de l'année, et la plus forte hausse qu'il absorbe, couverts jetés compris, puis sans eux.
  const permisParCouvert = auCentime((FOURCHETTE_DE_LA_PROFESSION.max / 100) * prix);
  const servi = auCentime(matiere * (1 + MARGE_DE_PREPARATION));
  const hausseAbsorbee = Math.floor((permisParCouvert / servi - 1) * 100 + 1e-9);
  const hausseSansPerte = Math.floor((permisParCouvert / matiere - 1) * 100 + 1e-9);
  // Le plat du jour, à rebours : du prix TTC au prix HT, au coût matière par plat servi, puis par portion préparée.
  const platHt = auCentime(PLAT_DU_JOUR_TTC / (1 + tauxTva));
  const platServi = auCentime((platHt * FOURCHETTE_DE_LA_PROFESSION.min) / 100);
  const platPortion = auCentime(platServi / (1 + MARGE_DE_PREPARATION));
  return {
    f,
    entreprise: f.entreprise,
    fournisseur: f.cuisine.fournisseur,
    matiere,
    autres: f.autresCoutsParCouvert,
    coutVariable: matiere + f.autresCoutsParCouvert,
    tauxTvaAchat: f.cuisine.tauxTvaDesDenrees,
    matiereTtc: auCentime(matiere * (1 + f.cuisine.tauxTvaDesDenrees)),
    prix,
    tauxTva,
    prixTtc: auCentime(prix * (1 + tauxTva)),
    ratio,
    coefficient,
    dansLaFourchette: ratio >= FOURCHETTE_DE_LA_PROFESSION.min && ratio <= FOURCHETTE_DE_LA_PROFESSION.max,
    servables: couvertsServables(f),
    hausse: {
      trimestres: touches,
      premier,
      taux: auDixieme(f.hausseDesDenrees.taux * 100),
      motif: f.cuisine.motifDeLaHausse,
      cout: coutHausse,
      ratio: auDixieme((coutHausse / prix) * 100),
      prixHt: prixQuiGarde,
      prixTtc: auCentime(prixQuiGarde * (1 + tauxTva)),
    },
    trimestres: t,
    denreesDeLAnnee: annee.denrees,
    chiffreDeLAnnee: annee.chiffreDAffaires,
    ratioDeLAnnee: annee.ratio,
    /** Le trimestre au ratio le plus haut, compté à partir de 1. */
    pire,
    perdus: p.perdus,
    coutDesPerdus,
    ratioSansPerte: auDixieme(((p.denrees - coutDesPerdus) / p.chiffreDAffaires) * 100),
    prixAuCurseur,
    /** Le ratio d'un couvert à un prix donné, après la hausse : les denrées ÷ le prix. */
    ratioAuPrix: (x: number) => auDixieme((coutHausse / x) * 100),
    permisParCouvert,
    /** Les denrées d'un couvert servi, les couverts préparés en plus compris, avant la hausse. */
    servi,
    hausseAbsorbee,
    hausseSansPerte,
    plat: { ttc: PLAT_DU_JOUR_TTC, ht: platHt, servi: platServi, portion: platPortion },
  };
}

export type CoutMatiere = ReturnType<typeof coutMatiere>;

/** Les tickets que le laboratoire propose, de son minimum à son maximum, par son pas. */
const ticketsDuLaboratoire = () => {
  const t = TICKET_DU_LABORATOIRE;
  return Array.from({ length: Math.round((t.max - t.min) / t.pas) + 1 }, (_, i) => t.min + i * t.pas);
};

/**
 * LE LABORATOIRE DE LA CUISINE : le trimestre du ratio le plus haut, rejoué à un ticket et une marge de
 * préparation (en pour cent) quelconques, par le modèle de la cuisine ; le défi (ratio dans la
 * fourchette, pas moins de marge sur coûts variables que le trimestre joué), sa solution (en préparant
 * juste, le plus petit ticket qui le relève) et le meilleur ticket en préparant juste.
 */
export function laboratoireDeLaCuisine(c: Pick<Cas, "code">) {
  const m = coutMatiere(c);
  const f = m.f;
  const n = m.pire;
  const rejoue = (ticket: number, marge: number) => trimestreDeCuisine(f, n, ticket, marge / 100);
  const joue = rejoue(f.prixDeLAnnee, Math.round(MARGE_DE_PREPARATION * 100));
  const reussit = (t: TrimestreDeCuisine) => t.ratio <= FOURCHETTE_DE_LA_PROFESSION.max && t.margeSurCoutsVariables >= joue.margeSurCoutsVariables;
  const tickets = ticketsDuLaboratoire();
  const ticket = tickets.find((p) => reussit(rejoue(p, 0)));
  if (ticket === undefined) throw new Error(`${f.entreprise} : le laboratoire de la cuisine n'a pas de solution`);
  const meilleur = tickets.reduce((a, b) => (rejoue(b, 0).margeSurCoutsVariables > rejoue(a, 0).margeSurCoutsVariables ? b : a));
  return {
    m,
    joue,
    rejoue,
    reussit,
    solution: { ticket, marge: 0 },
    aLaSolution: rejoue(ticket, 0),
    /** Préparer juste, au ticket de l'année. */
    justeAuTicket: rejoue(f.prixDeLAnnee, 0),
    meilleur: { ticket: meilleur, trimestre: rejoue(meilleur, 0) },
    /** Avec la marge de préparation habituelle, aucun ticket ne relève le défi ; au ticket de l'année, aucune marge. */
    leTicketSeul: tickets.some((p) => reussit(rejoue(p, Math.round(MARGE_DE_PREPARATION * 100)))),
    laCuisineSeule: Array.from({ length: MARGE_DU_LABORATOIRE.max + 1 }, (_, k) => k).some((k) => reussit(rejoue(f.prixDeLAnnee, k))),
  };
}

/** L'année de la cuisine, trimestre par trimestre. */
export function tableauDeLaCuisine(c: Cas): TableauDeDonnees {
  const m = coutMatiere(c);
  const t = m.trimestres;
  const ligne = (libelle: string, f: (x: TrimestreDeCuisine) => string) => ({ libelle, valeurs: t.map(f) });
  return {
    titre: `La cuisine ${dE(m.entreprise)}, trimestre par trimestre`,
    colonnes: t.map((x) => trimestre(x.numero)),
    lignes: [
      ligne("Couverts demandés", (x) => qte(x.demande)),
      ligne("Couverts préparés", (x) => qte(x.prepares)),
      ligne("Couverts servis", (x) => qte(x.servis)),
      ligne("Coût matière d'un couvert", (x) => eur(x.coutDuCouvert)),
      ligne("Coût matière consommé", (x) => eur(x.denrees)),
      ligne("Chiffre d'affaires HT", (x) => eur(x.chiffreDAffaires)),
    ],
  };
}

export const LE_COUT_MATIERE: Chapitre = {
  code: "le-cout-matiere",
  parcours: "mhr",
  palier: 2,
  blocs: [
    "BTS MHR Bloc 1 · Conception et production de services en hôtellerie restauration",
    "BTS MHR Bloc 4 · Pilotage de la production de services en hôtellerie restauration",
  ],
  titre: "Le coût matière et le prix d'un plat",
  accroche:
    "Ce que coûtent les denrées d'un couvert, la part du prix qu'elles prennent, le coefficient qui en sort et le prix de la carte. Puis le ratio de l'année, et ce qu'il dit de la cuisine.",
  objectifs: [
    "Dire ce qui entre dans le coût matière d'un plat",
    "Calculer le ratio coût matière et le coefficient multiplicateur",
    "Fixer le prix de vente HT et TTC qui garde le ratio quand les denrées augmentent",
    "Calculer le ratio coût matière d'un trimestre et de l'année",
    "Chiffrer ce que coûtent les plats préparés et non servis",
  ],
  libre: false,
  entreprises: {
    codes: CUISINES,
    pourquoi: "le coût matière est celui des denrées qu'une cuisine transforme en plats, et elle n'a pas de cuisine.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La fiche technique du couvert",
      notions: ["variable_costs", "markup_coefficient"],
      texte: (c) => {
        const m = coutMatiere(c);
        return [
          `Ce chapitre se joue dans la simulation du cours. Chez ${m.entreprise}, la cuisine raisonne au couvert : la fiche technique du menu du jour additionne les denrées d'une portion, hors taxes, chez le fournisseur habituel, « ${m.fournisseur} ». Elles coûtent ${eur(m.matiere)} le couvert. S'y ajoutent ${eur(m.autres)} d'autres coûts variables (${m.f.cuisine.autresCouts}). Le client paie en moyenne ${eur(m.prix)} hors taxes : c'est le ticket moyen de l'année.`,
          "Le coût matière d'un plat, c'est ce que coûtent ses denrées, hors taxes : la fiche technique les additionne, ingrédient par ingrédient, pour une portion. Le restaurateur le compare au prix de vente hors taxes : la part que les denrées prennent, c'est le ratio coût matière.",
          `Dans la simulation, la salle et la cuisine servent au plus ${qte(m.f.couvertsParJour)} couverts par jour, soit ${qte(m.servables)} par trimestre de ${qte(m.f.joursParTrimestre)} jours. Chaque trimestre, la cuisine prépare la demande qu'elle attend, plus ${pct(MARGE_DE_PREPARATION * 100)} pour ne jamais manquer, dans la limite de ces ${qte(m.servables)} couverts : ce qui est préparé et non servi part à la poubelle.`,
        ];
      },
      repere: () =>
        "Ratio coût matière = coût matière ÷ chiffre d'affaires HT × 100. Coefficient multiplicateur = prix de vente HT ÷ coût matière : c'est 100 divisé par le ratio.",
      tableau: (c) => {
        const m = coutMatiere(c);
        return {
          titre: `Le couvert ${dE(m.entreprise)}`,
          colonnes: ["Par couvert"],
          lignes: [
            ...m.f.cuisine.ficheTechnique.map((d) => ({ libelle: d.libelle, valeurs: [eur(d.cout)] })),
            { libelle: "Coût matière du couvert", valeurs: [eur(m.matiere)] },
            { libelle: "Autres coûts variables", valeurs: [eur(m.autres)] },
            { libelle: "Ticket moyen HT", valeurs: [eur(m.prix)] },
          ],
        };
      },
    },
    {
      id: "ce-qui-entre",
      objectifs: [0],
      type: "choix",
      titre: "Ce qui entre dans le coût matière",
      notions: ["variable_costs"],
      question: () => "Pour calculer le ratio coût matière d'un couvert, quel coût le chef retient-il ?",
      options: (c) => {
        const m = coutMatiere(c);
        return [
          {
            texte: `Les denrées seules, hors taxes : ${eur(m.matiere)}`,
            juste: true,
            retour: `Oui. Le coût matière ne compte que les denrées, et hors taxes, comme le prix auquel on le compare. Les ${eur(m.autres)} d'autres coûts (${m.f.cuisine.autresCouts}) sont bien des coûts du couvert, mais pas de la matière.`,
          },
          {
            texte: `Tout le coût variable du couvert : ${eur(m.coutVariable)}`,
            juste: false,
            retour: `Ce sont les denrées et les ${eur(m.autres)} d'autres coûts (${m.f.cuisine.autresCouts}). Le chapitre « Prix, coût et marge » compare le prix à ce coût-là ; le ratio de la cuisine ne prend que les denrées.`,
          },
          {
            texte: `Les denrées, TVA de ${pct(m.tauxTvaAchat * 100)} comprise : ${eur(m.matiereTtc)}`,
            juste: false,
            retour: "La TVA payée au fournisseur se récupère : elle ne coûte rien au restaurant. Et le prix de vente auquel on compare le coût matière est hors taxes : les deux se comptent hors taxes.",
          },
        ];
      },
    },
    {
      id: "le-ratio-du-couvert",
      objectifs: [1],
      type: "montants",
      titre: "Le ratio et le coefficient",
      notions: ["markup_coefficient", "margin_rates"],
      question: (c) => {
        const m = coutMatiere(c);
        return `Le couvert coûte ${eur(m.matiere)} de denrées et se vend ${eur(m.prix)} HT. Calculez son ratio coût matière, en pourcentage, au dixième. Puis le coefficient multiplicateur qui en découle : 100 divisé par le ratio, au centième.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        return [
          { libelle: "Ratio coût matière (%)", attendu: m.ratio, calcul: `${eur(m.matiere)} ÷ ${eur(m.prix)} × 100 = ${pct(m.ratio)}`, tolerance: 0.1 },
          { libelle: "Coefficient multiplicateur", attendu: m.coefficient, calcul: `100 ÷ ${pct(m.ratio).replace(" %", "")} = ${coef(m.coefficient)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const f = FOURCHETTE_DE_LA_PROFESSION;
        return [
          `Sur ${eur(m.prix)} de ticket, ${eur(m.matiere)} paient les denrées : ${pct(m.ratio)}. Le coefficient de ${coef(m.coefficient)} dit la même chose dans l'autre sens : le prix hors taxes vaut ${coef(m.coefficient)} fois le coût matière.`,
          `En restauration traditionnelle, la profession vise un ratio de ${f.min} à ${f.max} % : la carte ${dE(m.entreprise)} ${m.dansLaFourchette ? "y est" : "en sort"}.`,
        ];
      },
    },
    {
      id: "la-hausse",
      objectifs: [2],
      type: "montants",
      titre: "Les denrées augmentent",
      notions: ["material_price_variance", "margin_rates"],
      si: (c) => coutMatiere(c).hausse.premier > 0,
      question: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        const dernier = h.trimestres[h.trimestres.length - 1]!;
        const duree = dernier > h.premier ? `Elle dure jusqu'au ${trimestre(dernier)} compris.` : "Elle ne dure que ce trimestre.";
        return `Au ${trimestre(h.premier)}, les denrées augmentent de ${pct(h.taux)}, sur toute la fiche technique : ${h.motif}. ${duree} Calculez le nouveau coût matière d'un couvert, puis son ratio si le ticket reste à ${eur(m.prix)} HT, au dixième.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return [
          { libelle: "Nouveau coût matière", attendu: h.cout, calcul: `${eur(m.matiere)} × ${coef(1 + h.taux / 100)} = ${eur(h.cout)}` },
          { libelle: "Ratio au même ticket (%)", attendu: h.ratio, calcul: `${eur(h.cout)} ÷ ${eur(m.prix)} × 100 = ${pct(h.ratio)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return [
          `Au même prix, le ratio passe de ${pct(m.ratio)} à ${pct(h.ratio)} : ${points(auDixieme(h.ratio - m.ratio))} de plus. Chaque couvert laisse ${eur(auCentime(h.cout - m.matiere))} de moins pour payer la brigade, la salle et le loyer.`,
        ];
      },
    },
    {
      id: "predire-le-prix",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le prix qui garde le ratio",
      notions: ["markup_coefficient", "margin_rates"],
      si: (c) => coutMatiere(c).hausse.premier > 0,
      question: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return `Avant de calculer, pariez. Les denrées du couvert passent de ${eur(m.matiere)} à ${eur(h.cout)}, une hausse de ${pct(h.taux)}. Pour que le ratio reste à ${pct(m.ratio)}, le ticket HT de ${eur(m.prix)} doit monter…`;
      },
      options: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        const voir = "Déplacez le curseur à l'étape suivante : il montre à partir de quel ticket le ratio est tenu.";
        return [
          { texte: `De ${pct(h.taux)}, comme les denrées`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `De ${eur(auCentime(h.cout - m.matiere))}, le montant de la hausse`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `De ${pct(auDixieme(h.ratio - m.ratio))}, les points de ratio perdus`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-prix-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Le ticket au curseur",
      notions: ["markup_coefficient", "margin_rates"],
      si: (c) => coutMatiere(c).hausse.premier > 0,
      question: (c) => {
        const m = coutMatiere(c);
        return `Faites varier le ticket HT du couvert de ${eur(PRIX_DU_CURSEUR.min)} à ${eur(PRIX_DU_CURSEUR.max)}. Une droite donne ce que le ratio de ${pct(m.ratio)} laisse aux denrées (${pct(m.ratio)} du ticket), l'autre ce que coûtent les denrées après la hausse, ${eur(m.hausse.cout)}. Placez le curseur sur le plus petit ticket, à l'euro, où le ratio est tenu, puis validez.`;
      },
      grandeur: () => ({ libelle: "Ticket moyen HT", unite: "€" }),
      cible: (c) => ({ attendu: coutMatiere(c).prixAuCurseur, min: PRIX_DU_CURSEUR.min, max: PRIX_DU_CURSEUR.max }),
      zones: ["Ratio tenu", "Ratio dépassé"],
      rates: (c) => {
        const m = coutMatiere(c);
        return {
          dessous: `À ce ticket, les denrées prennent plus de ${pct(m.ratio)} du prix : le ratio est dépassé.`,
          dessus: "Un ticket plus bas tient encore le ratio : cherchez le plus petit.",
        };
      },
      montrer: "Montrer le ticket",
      lecture: (c, p) => {
        const m = coutMatiere(c);
        const permis = auCentime((m.ratio / 100) * p);
        return [
          { libelle: `Ce que ${pct(m.ratio)} du ticket laisse aux denrées`, montant: permis },
          { libelle: "Denrées du couvert, après la hausse", montant: m.hausse.cout },
          { libelle: "Ticket TTC de la carte", montant: auCentime(p * (1 + m.tauxTva)) },
          { libelle: "Ce que le ratio laisse de plus que les denrées", montant: auCentime(permis - m.hausse.cout), fort: true },
        ];
      },
      droites: (c) => {
        const m = coutMatiere(c);
        return {
          produit: (p) => (m.ratio / 100) * p,
          cout: () => m.hausse.cout,
          libelles: [`Ce que ${pct(m.ratio)} du ticket laisse aux denrées`, "Denrées du couvert après la hausse"],
        };
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        const k = m.prixAuCurseur;
        const plusUn = auCentime(m.prix + h.cout - m.matiere);
        return [
          `À ${eur(k)} HT, les denrées ne prennent que ${pct(m.ratioAuPrix(k))} du ticket ; à ${eur(k - 1)}, déjà ${pct(m.ratioAuPrix(k - 1))}. Le ticket exact qui garde ${pct(m.ratio)} est entre les deux : c'est le nouveau coût matière multiplié par le coefficient de la carte, que l'étape suivante fait calculer.`,
          `Monter le ticket du seul montant de la hausse ne suffit pas : à ${eur(plusUn)}, les denrées prendraient ${pct(m.ratioAuPrix(plusUn))} du prix. Garder un ratio, c'est monter le prix dans la même proportion que les denrées, ${pct(h.taux)}.`,
        ];
      },
    },
    {
      id: "le-prix-du-plat",
      objectifs: [2],
      type: "montants",
      titre: "Le prix qui garde le ratio",
      notions: ["markup_coefficient", "vat_payable"],
      si: (c) => coutMatiere(c).hausse.premier > 0,
      question: (c) => {
        const m = coutMatiere(c);
        return `Pour garder son ratio, le chef applique le même coefficient, ${coef(m.coefficient)}, au nouveau coût matière de ${eur(m.hausse.cout)}. Calculez le prix de vente HT, puis le prix TTC : les repas servis sur place portent une TVA de ${pct(m.tauxTva * 100)}.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return [
          // Le coefficient arrondi au centième que l'élève a gardé déplace le prix d'un centime.
          { libelle: "Prix de vente HT", attendu: h.prixHt, calcul: `${eur(h.cout)} × ${coef(m.coefficient)} = ${eur(h.prixHt)}`, tolerance: 0.05 },
          { libelle: "Prix de vente TTC", attendu: h.prixTtc, calcul: `${eur(h.prixHt)} × ${coef(1 + m.tauxTva)} = ${eur(h.prixTtc)}`, tolerance: 0.06 },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return [
          `Sur la carte, le couvert passerait de ${eur(m.prixTtc)} à ${eur(h.prixTtc)} TTC. Le ratio serait sauf, mais le client paierait ${eur(auCentime(h.prixTtc - m.prixTtc))} de plus : reste à savoir s'il suivra. La TVA ne change rien au ratio : elle n'est pas au restaurant, il la reverse à l'État.`,
        ];
      },
    },
    {
      id: "predire-la-marge-de-manoeuvre",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur la hausse que la carte absorbe",
      notions: ["margin_rates", "variable_costs"],
      question: (c) => {
        const m = coutMatiere(c);
        const f = FOURCHETTE_DE_LA_PROFESSION;
        return `Pariez encore. Au ticket de ${eur(m.prix)} HT, la cuisine prépare ${pct(MARGE_DE_PREPARATION * 100)} de couverts de plus que la demande, et jette ce qui n'est pas servi. Jusqu'où les denrées peuvent-elles monter avant que le ratio dépasse le haut de la fourchette de la profession, ${f.max} % ?`;
      },
      options: (c) => {
        const m = coutMatiere(c);
        const voir = "Faites monter les denrées au curseur de l'étape suivante, et voyez où le ratio sort de la fourchette.";
        const sous = Math.ceil(m.hausseAbsorbee + 1);
        return [
          { texte: `De ${pct(m.hausse.taux)} : la hausse de l'année passe`, juste: false, retour: `Pari à vérifier. ${voir}` },
          {
            texte: `D'environ ${pct(m.hausseSansPerte + 1)} : ${FOURCHETTE_DE_LA_PROFESSION.max} % du ticket font ${eur(m.permisParCouvert)}`,
            juste: false,
            retour: `Pari à vérifier. ${voir}`,
          },
          { texte: `De moins de ${pct(sous)} : les couverts jetés prennent leur part`, juste: true, retour: `Bon pari. ${voir}` },
        ];
      },
    },
    {
      id: "la-hausse-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "La hausse au curseur",
      notions: ["margin_rates", "variable_costs"],
      question: (c) => {
        const m = coutMatiere(c);
        return `Faites monter les denrées de ${pct(HAUSSE_DU_CURSEUR.min)} à ${pct(HAUSSE_DU_CURSEUR.max)}. Une droite donne ce que ${FOURCHETTE_DE_LA_PROFESSION.max} % du ticket de ${eur(m.prix)} laissent aux denrées d'un couvert servi ; l'autre, ce que coûtent les denrées d'un couvert servi, couverts préparés en plus compris. Placez le curseur sur la plus forte hausse, en pour cent entier, que la fourchette absorbe, puis validez.`;
      },
      grandeur: () => ({ libelle: "Hausse des denrées", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: coutMatiere(c).hausseAbsorbee, min: HAUSSE_DU_CURSEUR.min, max: HAUSSE_DU_CURSEUR.max }),
      zones: ["Dans la fourchette", "Hors de la fourchette"],
      rates: () => ({
        dessous: "La fourchette absorbe encore une hausse plus forte : cherchez la plus grande.",
        dessus: `À cette hausse, le ratio dépasse déjà ${FOURCHETTE_DE_LA_PROFESSION.max} %.`,
      }),
      montrer: "Montrer la hausse",
      lecture: (c, h) => {
        const m = coutMatiere(c);
        const servi = auCentime(m.servi * (1 + h / 100));
        return [
          { libelle: "Denrées d'une portion", montant: auCentime(m.matiere * (1 + h / 100)) },
          { libelle: "Denrées d'un couvert servi, couverts jetés compris", montant: servi },
          { libelle: `Ce que ${FOURCHETTE_DE_LA_PROFESSION.max} % du ticket laissent aux denrées`, montant: m.permisParCouvert },
          { libelle: "Ce qui reste avant de sortir de la fourchette", montant: auCentime(m.permisParCouvert - servi), fort: true },
        ];
      },
      droites: (c) => {
        const m = coutMatiere(c);
        return {
          produit: () => m.permisParCouvert,
          cout: (h) => m.servi * (1 + h / 100),
          libelles: [`Ce que ${FOURCHETTE_DE_LA_PROFESSION.max} % du ticket laissent aux denrées`, "Denrées d'un couvert servi"],
        };
      },
      explication: (c) => {
        const m = coutMatiere(c);
        return [
          `La carte n'absorbe que ${pct(m.hausseAbsorbee)} de hausse : chaque couvert servi porte les denrées de ${coef(1 + MARGE_DE_PREPARATION)} couvert préparé, ${eur(m.servi)} au lieu de ${eur(m.matiere)}. En préparant juste, elle en absorberait ${pct(m.hausseSansPerte)}.`,
          `La hausse de l'année, ${pct(m.hausse.taux)}, sort donc le ratio de la fourchette, et les couverts jetés l'en éloignent encore. Le ratio d'un trimestre se lit en deux morceaux : le prix des denrées, et ce que la cuisine prépare sans le servir. C'est ce que l'année de la cuisine va chiffrer.`,
        ];
      },
    },
    {
      id: "l-annee",
      objectifs: [3],
      type: "montants",
      titre: "Le ratio de l'année",
      notions: ["margin_rates", "variable_costs"],
      tableau: tableauDeLaCuisine,
      question: (c) => {
        const m = coutMatiere(c);
        return `Le tableau donne l'année de la simulation : la cuisine a préparé la demande plus ${pct(MARGE_DE_PREPARATION * 100)}, dans la limite des ${qte(m.servables)} couverts servables, et ses denrées sont celles de tous les couverts préparés. Calculez le coût matière consommé de l'année et son ratio, puis le ratio du trimestre le plus élevé, au dixième.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        const p = m.trimestres[m.pire - 1]!;
        return [
          {
            libelle: "Coût matière de l'année",
            attendu: m.denreesDeLAnnee,
            calcul: `${m.trimestres.map((x) => eur(x.denrees)).join(" + ")} = ${eur(m.denreesDeLAnnee)}`,
          },
          {
            libelle: "Ratio de l'année (%)",
            attendu: m.ratioDeLAnnee,
            calcul: `${eur(m.denreesDeLAnnee)} ÷ ${eur(m.chiffreDeLAnnee)} × 100 = ${pct(m.ratioDeLAnnee)}`,
            tolerance: 0.1,
          },
          {
            libelle: `Ratio du ${trimestre(m.pire)} (%)`,
            attendu: p.ratio,
            calcul: `${eur(p.denrees)} ÷ ${eur(p.chiffreDAffaires)} × 100 = ${pct(p.ratio)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const pleins = m.trimestres.filter((x) => x.perdus === 0 && x.servis === x.servables);
        return [
          `Trimestre par trimestre, le ratio a fait ${m.trimestres.map((x) => pct(x.ratio)).join(", ")}. Sur l'année, ${pct(m.ratioDeLAnnee)}, quand la fiche du couvert promettait ${pct(m.ratio)}.`,
          ...pleins.map(
            (x) => `Au ${trimestre(x.numero)}, la demande dépasse ce que la salle peut servir : la cuisine ne prépare que les ${qte(x.servables)} couverts servables, et rien n'est jeté.`,
          ),
        ];
      },
    },
    {
      id: "les-denrees-perdues",
      objectifs: [4],
      type: "montants",
      titre: "Les plats préparés et non servis",
      notions: ["variable_costs", "material_price_variance"],
      question: (c) => {
        const m = coutMatiere(c);
        const p = m.trimestres[m.pire - 1]!;
        return `Au ${trimestre(m.pire)}, la cuisine a préparé ${qte(p.prepares)} couverts et en a servi ${qte(p.servis)}. Ce qui n'est pas servi part à la poubelle, et ses denrées sont payées. Calculez les couverts préparés et non servis, le coût de leurs denrées à ${eur(p.coutDuCouvert)} le couvert, puis le ratio du trimestre sans ces pertes, au dixième.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        const p = m.trimestres[m.pire - 1]!;
        return [
          { libelle: "Couverts préparés et non servis", attendu: m.perdus, calcul: `${qte(p.prepares)} − ${qte(p.servis)} = ${qte(m.perdus)}` },
          { libelle: "Coût des denrées perdues", attendu: m.coutDesPerdus, calcul: `${qte(m.perdus)} × ${eur(p.coutDuCouvert)} = ${eur(m.coutDesPerdus)}`, tolerance: 1 },
          {
            libelle: "Ratio sans les pertes (%)",
            attendu: m.ratioSansPerte,
            calcul: `(${eur(p.denrees)} − ${eur(m.coutDesPerdus)}) ÷ ${eur(p.chiffreDAffaires)} × 100 = ${pct(m.ratioSansPerte)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const p = m.trimestres[m.pire - 1]!;
        const pertes = auDixieme(p.ratio - m.ratioSansPerte);
        const prixDesDenrees = auDixieme(m.ratioSansPerte - m.ratio);
        return [
          prixDesDenrees > 0
            ? `Le ratio de ${pct(p.ratio)} se lit en trois morceaux : ${pct(m.ratio)} pour la carte telle qu'elle est calculée, ${points(prixDesDenrees)} de plus pour le prix des denrées, et ${points(pertes)} de plus pour les plats préparés et non servis.`
            : `Le ratio de ${pct(p.ratio)} se lit en deux morceaux : ${pct(m.ratioSansPerte)} pour les couverts servis, et ${points(pertes)} de plus pour les plats préparés et non servis.`,
          `Les denrées perdues ont coûté ${eur(m.coutDesPerdus)} sans rien rapporter : c'est le premier poste que la cuisine surveille.`,
        ];
      },
    },
    {
      id: "ce-que-dit-le-ratio",
      objectifs: [3],
      type: "choix",
      titre: "Ce que le ratio dit de la carte",
      notions: ["margin_rates", "material_price_variance"],
      question: (c) => {
        const m = coutMatiere(c);
        return `Le ratio de l'année est de ${pct(m.ratioDeLAnnee)}, quand la fiche du couvert en promettait ${pct(m.ratio)}. Que dit cet écart ?`;
      },
      options: (c) => {
        const m = coutMatiere(c);
        const servis = m.trimestres.map((x) => x.servis);
        const charge = m.trimestres[servis.indexOf(Math.max(...servis))]!;
        const pire = m.trimestres[m.pire - 1]!;
        const auPlusCharge =
          charge.numero !== m.pire && charge.ratio < pire.ratio
            ? ` Au ${trimestre(charge.numero)}, le plus chargé, le ratio (${pct(charge.ratio)}) est plus bas qu'au ${rang(m.pire)} (${pct(pire.ratio)}).`
            : "";
        return [
          {
            texte: "Le prix n'a pas suivi les denrées, et la cuisine a trop préparé.",
            juste: true,
            retour: `Oui. Le ticket est resté à ${eur(m.prix)} quand les denrées montaient, et une partie des plats est partie à la poubelle. Le ratio ne juge pas seulement la carte : il juge aussi ce que la cuisine prépare.`,
          },
          {
            texte: "Le ticket moyen est trop élevé pour la clientèle du quartier.",
            juste: false,
            retour: "Le ticket n'a pas bougé de l'année. Et un prix plus haut ferait baisser le ratio, pas monter : le coût matière se divise par le prix.",
          },
          {
            texte: "Le bistrot a servi beaucoup de couverts : il a consommé plus de denrées.",
            juste: false,
            retour: `Le ratio est un rapport : un couvert servi apporte ses denrées et son prix à la fois. Ce sont les couverts préparés sans être servis qui le font monter, et le prix des denrées.${auPlusCharge}`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-cuisine",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la cuisine",
      notions: ["margin_rates", "price_elasticity", "contribution_margin"],
      question: (c) => {
        const l = laboratoireDeLaCuisine(c);
        return `Rejouez le ${trimestre(l.m.pire)}, celui du ratio le plus haut (${pct(l.joue.ratio)}). Deux leviers : le ticket moyen HT, auquel la demande répond (un prix plus haut de 1 % en fait perdre environ ${qte(-l.m.f.elasticite)} %), et la marge de préparation, ce que la cuisine prépare en plus de la demande. Le tableau suit le ratio et la marge sur coûts variables : le chiffre d'affaires, moins les denrées et les autres coûts variables. Relevez le défi, puis regardez ce que le ratio vous a coûté.`;
      },
      leviers: (c) => {
        const l = laboratoireDeLaCuisine(c);
        return [
          { code: "ticket", libelle: "Ticket moyen HT", unite: "€", ...TICKET_DU_LABORATOIRE, depart: l.m.prix },
          { code: "marge", libelle: "Marge de préparation", unite: "%", ...MARGE_DU_LABORATOIRE, depart: Math.round(MARGE_DE_PREPARATION * 100) },
        ];
      },
      lecture: (c, p) => {
        const l = laboratoireDeLaCuisine(c);
        const t = l.rejoue(p.ticket!, p.marge!);
        const d = l.joue;
        return [
          { libelle: "Couverts demandés", montant: t.demande, reference: d.demande, unite: "couverts" },
          { libelle: "Couverts préparés", montant: t.prepares, reference: d.prepares, unite: "couverts" },
          { libelle: "Couverts jetés", montant: t.perdus, reference: d.perdus, unite: "couverts" },
          { libelle: "Chiffre d'affaires HT", montant: t.chiffreDAffaires, reference: d.chiffreDAffaires },
          { libelle: "Coût matière consommé", montant: t.denrees, reference: d.denrees },
          { libelle: "Ratio coût matière", montant: t.ratio, reference: d.ratio, unite: "%" },
          { libelle: "Marge sur coûts variables", montant: t.margeSurCoutsVariables, reference: d.margeSurCoutsVariables },
          {
            libelle: "Écart de marge avec le trimestre joué",
            montant: auCentime(t.margeSurCoutsVariables - d.margeSurCoutsVariables) + 0,
            reference: 0,
            effet: true,
            fort: true,
          },
        ];
      },
      // La marge du trimestre selon le ticket : elle n'est pas une droite, la demande répond au prix.
      graphique: (c) => {
        const l = laboratoireDeLaCuisine(c);
        const ecart = (ticket: number, marge: number) => auCentime(l.rejoue(ticket, marge).margeSurCoutsVariables - l.joue.margeSurCoutsVariables) + 0;
        return {
          levier: "ticket",
          courbes: [
            { libelle: "Écart de marge, à cette marge de préparation", valeur: (p) => ecart(p.ticket!, p.marge!) },
            { libelle: "Écart de marge, en préparant juste", valeur: (p) => ecart(p.ticket!, 0) },
          ],
        };
      },
      defi: (c) => {
        const l = laboratoireDeLaCuisine(c);
        const f = FOURCHETTE_DE_LA_PROFESSION;
        return {
          consigne: `Ramenez le ratio du trimestre dans la fourchette de la profession (au plus ${f.max} %), sans faire moins de marge sur coûts variables que le trimestre joué, ${eur(l.joue.margeSurCoutsVariables)}.`,
          atteint: (p) => l.reussit(l.rejoue(p.ticket!, p.marge!)),
          indice: (p) => {
            const t = l.rejoue(p.ticket!, p.marge!);
            if (t.ratio > f.max) {
              return t.perdus > 0
                ? `Le ratio vaut ${pct(t.ratio)}, et la cuisine jette ${qte(t.perdus)} couverts : leurs denrées pèsent sur le ratio sans rien rapporter.`
                : `Le ratio vaut ${pct(t.ratio)} : même sans couvert jeté, les denrées prennent trop du ticket, qui doit monter.`;
            }
            return `Le ratio est tenu (${pct(t.ratio)}), mais la marge sur coûts variables vaut ${eur(t.margeSurCoutsVariables)} : ${t.perdus > 0 ? "les couverts jetés et " : ""}les clients que le ticket fait partir coûtent trop.`;
          },
          solution: l.solution,
        };
      },
      montrer: "Montrer une carte qui relève le défi",
      explication: (c, p) => {
        const l = laboratoireDeLaCuisine(c);
        const t = l.rejoue(p.ticket!, p.marge!);
        const b = l.meilleur;
        const lesDeux =
          !l.leTicketSeul && !l.laCuisineSeule
            ? `Il fallait les deux leviers : avec ${pct(MARGE_DE_PREPARATION * 100)} de couverts préparés en plus, aucun ticket ne relève le défi ; au ticket de ${eur(l.m.prix)}, préparer juste laisse le ratio à ${pct(l.justeAuTicket.ratio)}.`
            : "Un seul levier pouvait suffire ici : regardez lequel, et à quel prix pour la marge.";
        return [
          `À ${eur(p.ticket!)} HT, en préparant ${p.marge === 0 ? "juste la demande" : `${pct(p.marge!)} de plus`}, le ratio passe à ${pct(t.ratio)} et la marge sur coûts variables à ${eur(t.margeSurCoutsVariables)}. ${lesDeux}`,
          `Mais suivez la courbe en préparant juste : la marge est la plus haute à ${eur(b.ticket)} HT, ${eur(b.trimestre.margeSurCoutsVariables)}, avec un ratio de ${pct(b.trimestre.ratio)}, hors de la fourchette. Tenir la fourchette coûte ici ${eur(auCentime(b.trimestre.margeSurCoutsVariables - t.margeSurCoutsVariables))} de marge : le ratio est un repère qui dit où regarder, pas un but.`,
        ];
      },
    },
    {
      id: "la-prime-au-ratio",
      objectifs: [3],
      type: "choix",
      titre: "Une prime sur le ratio ?",
      notions: ["margin_rates", "contribution_margin"],
      question: () =>
        `Le gérant veut verser au chef une prime chaque trimestre où le ratio coût matière passe sous ${FOURCHETTE_DE_LA_PROFESSION.max} %. Qu'en dites-vous ?`,
      options: (c) => {
        const l = laboratoireDeLaCuisine(c);
        const s = l.aLaSolution;
        const b = l.meilleur;
        const m = l.m;
        const p = m.trimestres[m.pire - 1]!;
        return [
          {
            texte: "Elle pousserait à des choix qui coûtent de la marge",
            juste: true,
            retour: `Oui. Au laboratoire, le ratio repasse sous ${FOURCHETTE_DE_LA_PROFESSION.max} % à ${eur(l.solution.ticket)} HT, avec ${eur(s.margeSurCoutsVariables)} de marge sur coûts variables ; le meilleur ticket en rapporte ${eur(b.trimestre.margeSurCoutsVariables)}, à ${pct(b.trimestre.ratio)}. Primer un ratio, c'est primer un rapport : on peut l'améliorer en montant la carte ou en rognant les portions, et perdre de l'argent. On prime plutôt ce qui dépend du chef, les couverts jetés, et on juge la carte à la marge.`,
          },
          {
            texte: "Bonne idée : un ratio plus bas veut dire plus de marge",
            juste: false,
            retour: `Non : c'est confondre un rapport et un montant. Au laboratoire, la plus haute marge du trimestre, ${eur(b.trimestre.margeSurCoutsVariables)}, se fait avec un ratio de ${pct(b.trimestre.ratio)}, et le ratio de ${pct(s.ratio)} n'en laisse que ${eur(s.margeSurCoutsVariables)}.`,
          },
          {
            texte: "Inutile : le ratio ne dépend que du prix des denrées",
            juste: false,
            retour: `Non : au ${trimestre(m.pire)}, les couverts jetés ont ajouté ${points(auDixieme(p.ratio - m.ratioSansPerte))} au ratio, et ce que la cuisine prépare dépend du chef.`,
          },
        ];
      },
    },
    {
      id: "le-plat-du-jour",
      objectifs: [2],
      type: "montants",
      titre: "Le plat du jour, à rebours",
      notions: ["markup_coefficient", "margin_rates", "vat_payable"],
      question: (c) => {
        const m = coutMatiere(c);
        return `Le chef veut un plat du jour vendu ${eur(m.plat.ttc)} TTC, avec un ratio au bas de la fourchette, ${FOURCHETTE_DE_LA_PROFESSION.min} %. La cuisine en préparera ${pct(MARGE_DE_PREPARATION * 100)} de plus qu'elle n'en sert, comme d'habitude. Combien la fiche technique d'une portion peut-elle coûter, au plus ? Remontez du prix de la carte jusqu'à la portion.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        const k = m.plat;
        return [
          { libelle: "Prix HT du plat du jour", attendu: k.ht, calcul: `${eur(k.ttc)} ÷ ${coef(1 + m.tauxTva)} = ${eur(k.ht)}` },
          { libelle: "Coût matière par plat servi", attendu: k.servi, calcul: `${eur(k.ht)} × ${FOURCHETTE_DE_LA_PROFESSION.min} % = ${eur(k.servi)}` },
          { libelle: "Coût d'une portion préparée, au plus", attendu: k.portion, calcul: `${eur(k.servi)} ÷ ${coef(1 + MARGE_DE_PREPARATION)} = ${eur(k.portion)}` },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const k = m.plat;
        return [
          `Le calcul remonte le chemin de la carte : du prix TTC au prix HT (la TVA n'est pas au restaurant), du prix HT au coût matière que le ratio permet, puis du plat servi à la portion préparée. Sans portion jetée, la fiche pourrait coûter ${eur(k.servi)} ; avec ${pct(MARGE_DE_PREPARATION * 100)} de portions en plus, ${eur(k.portion)}.`,
          `Le coefficient du plat est donc de ${coef(auCentime(100 / FOURCHETTE_DE_LA_PROFESSION.min))} sur le coût matière d'un plat servi : plus le ratio visé est bas, plus la fiche technique doit être tenue serrée.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["margin_rates", "markup_coefficient"],
      texte: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return [
          `Le coût matière ne compte que les denrées, hors taxes. Le ratio coût matière les divise par le prix HT ; le coefficient multiplicateur dit la même chose dans l'autre sens.${h.premier > 0 ? ` Quand les denrées montent de ${pct(h.taux)}, garder le ratio demande de monter le prix HT d'autant : ${eur(h.prixHt)} au lieu de ${eur(m.prix)}.` : ""}`,
          `Sur l'année, le ratio ${dE(m.entreprise)} a fait ${pct(m.ratioDeLAnnee)}, quand la fiche du couvert promettait ${pct(m.ratio)} : le prix des denrées et les plats préparés et non servis font l'écart. Le ratio juge la carte, et ce que la cuisine prépare ; mais un ratio tenu n'est pas une marge gagnée, et la carte se juge à ce qu'elle rapporte.`,
          "Au niveau de l'examen, vous savez calculer un ratio et un coefficient, fixer le prix qui garde le ratio, décomposer le ratio d'un trimestre entre la carte, le prix des denrées et les pertes, remonter du prix TTC au coût d'une portion, et dire quand un meilleur ratio coûte de la marge.",
          "Dans l'arène, les chiffres de votre restaurant seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Ratio coût matière = coût matière consommé ÷ chiffre d'affaires HT × 100. Prix de vente HT = coût matière × coefficient, et coefficient = 100 ÷ ratio visé.",
    },
  ],
};
