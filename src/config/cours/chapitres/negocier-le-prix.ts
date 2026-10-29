import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { CABINETS_DU_COURS, type FicheDuCabinet } from "../monde/atlas-conseil";
import {
  affaireEnPlus,
  baisseDePrixPourTous,
  capaciteDuTrimestre,
  chargesFixesDeLAnnee,
  clientelesFaceAUneHausse,
  contrepartieDUneRemise,
  coutVariableDUneJournee,
  prixPlancher,
  remiseDemandee,
  trimestresDeLAnnee,
} from "../monde/relation-client";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : NÉGOCIER LE PRIX, MARGE DE MANŒUVRE ET PRIX PLANCHER (BTS NDRC, palier 2 ; BUT TC).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le cabinet
 * ATLAS CONSEIL a une fiche figée (monde/atlas-conseil.ts) et ses chiffres se calculent par le modèle
 * de la relation client (monde/relation-client.ts, partie 1 et partie 2). Une évolution du moteur ne
 * change rien ici. Le chapitre ne lit du cas que son code.
 *
 * L'objet : une journée d'intervention à 800 € au catalogue, qui coûte 150 € en plus quand elle est
 * vendue et porte 480 € des charges fixes de l'année. Le coût complet (630 €) est le plancher d'un prix
 * fait à tous les clients ; la marge de manœuvre (170 €) et la remise maximale (21,25 %) en découlent.
 * La remise de 20 % que demande le groupe Orvane tient, et se paie en volume (40 journées au lieu de
 * 30). Puis la contre-proposition à 400 € : sous le coût complet, une affaire en plus ne se juge qu'à
 * la place qu'il reste. Au T3 creux, elle rapporte 12 500 € ; au T4 plein, elle prend ses journées à
 * des clients au prix catalogue et fait perdre 20 000 € : son plancher remonte à 800 €. Enfin, une
 * baisse accordée à tous (plus de ventes, moins de marge) et les clientèles qui tiennent le prix.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, cout-complet, marge-de-manoeuvre (la formule est au repère ou dans la question,
 *     qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-remise
 *     puis remise-maximale (un curseur sur la remise, le chiffre d'affaires de l'affaire face à son
 *     coût complet) avant marge-de-manoeuvre ; predire-le-t4 puis les-jours-libres (un curseur sur
 *     les jours libres du trimestre, la marge de l'affaire face à la marge qu'elle fait perdre) avant
 *     deux-planchers ;
 *   · autonome : remise-demandee, au-t3-ou-au-t4, baisse-pour-tous, qui-tient-le-prix (ni formule ni
 *     chiffres à prendre ; la correction montre le chemin) ;
 *   · expert : contrepartie (le volume qui paie une remise, à rebours), deux-planchers (le plancher
 *     d'une affaire en plus quand le carnet est plein), vingt-jours-libres (une variante chiffrée, un
 *     trimestre presque plein) et le-laboratoire-de-l-affaire (remise, journées, jours libres, avec le
 *     graphique du gain selon les journées : trois chemins pour rendre l'affaire acceptable) ; puis la
 *     synthèse.
 */

/** Le chapitre se joue chez le cabinet du cours, qui vend ses journées affaire par affaire. */
export const ENTREPRISES_DE_LA_NEGOCIATION: readonly string[] = ["conseil"];

/**
 * LA VARIANTE D'UN TRIMESTRE PRESQUE PLEIN, hypothèse du cours : il ne reste que 20 jours libres au
 * trimestre où la contre-proposition (50 journées à 400 €) se placerait. La fiche ne change pas : seuls
 * les jours libres sont posés. C'est aussi le départ du laboratoire.
 */
export const JOURS_LIBRES_DE_LA_VARIANTE = 20;

/**
 * LE GAIN QUE LE DIRECTEUR EXIGE D'UNE AFFAIRE SOUS LE COÛT COMPLET, hypothèse du cours : 5 000 €.
 * Mobiliser des consultants pour une affaire à prix bas demande du temps de préparation et de suivi :
 * en dessous de ce gain, le cabinet préfère garder ses jours libres pour une demande au prix catalogue.
 * C'est le défi du laboratoire.
 */
export const GAIN_EXIGE_D_UNE_AFFAIRE_EN_PLUS = 5_000;

/** La baisse de prix accordée à tous et la hausse étudiée, en part du prix catalogue. */
export const BAISSE_POUR_TOUS = 0.1;
export const HAUSSE_DU_PRIX = 0.1;

/** Les bornes du curseur de la remise, en pourcentage du prix catalogue. */
export const REMISE_DU_CURSEUR = { min: 0, max: 30 } as const;

/** Les bornes du curseur des jours libres : du T4 plein (0) aux jours que demande la contre-proposition. */
export const JOURS_LIBRES_DU_CURSEUR = { min: 0, max: 50 } as const;

/** Les leviers du laboratoire : la remise (en %), les journées de l'affaire, les jours libres du trimestre. */
export const LEVIERS_DU_LABORATOIRE = {
  remise: { min: 0, max: 80, pas: 1 },
  journees: { min: 10, max: 100, pas: 5 },
  libres: { min: 0, max: 300, pas: 10 },
} as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Un pourcentage, la part étant donnée en fraction (0,2125 → « 21,25 % »). */
const pct = (part: number, chiffres = 2) => `${(Math.round(part * 100 * 10 ** chiffres) / 10 ** chiffres + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`.replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « le groupe Orvane » → « du groupe Orvane ». */
const du = (x: string) => x.replace(/^le /, "du ").replace(/^la /, "de la ");

/** La fiche du cabinet du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDuCabinet => CABINETS_DU_COURS[c.code]!;

/** Le prix d'une journée à une remise donnée (en pourcentage entier du prix catalogue). */
const prixARemise = (f: FicheDuCabinet, remise: number) => auCentime(f.prixCatalogue * (1 - remise / 100));

/** Tout ce que le chapitre et son cas demandent, calculé une fois sur la fiche. */
export function negociationDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const p = prixPlancher(f);
  const a = f.affaire;
  const r = remiseDemandee(f);
  const contrepartie = contrepartieDUneRemise(f);
  const trimestres = trimestresDeLAnnee(f);
  const auT3 = affaireEnPlus(f, { trimestre: 3 });
  const auT4 = affaireEnPlus(f, { trimestre: 4 });
  const variante = affaireEnPlus(f, { joursLibres: JOURS_LIBRES_DE_LA_VARIANTE });
  const baisse = baisseDePrixPourTous(f, BAISSE_POUR_TOUS);
  const hausse = clientelesFaceAUneHausse(f, HAUSSE_DU_PRIX);
  const cv = coutVariableDUneJournee(f);
  const remiseEntiere = p.remiseMaximaleEntiere;
  return {
    f,
    entreprise: f.entreprise,
    prix: f.prixCatalogue,
    fraisDeMission: f.coutVariableDUneJournee.fraisDeMission,
    supports: f.coutVariableDUneJournee.supports,
    coutVariable: cv,
    chargesFixes: chargesFixesDeLAnnee(f).total,
    journeesDeLAnnee: p.journees,
    capaciteDeLAnnee: capaciteDuTrimestre(f) * 4,
    capaciteDuTrimestre: capaciteDuTrimestre(f),
    partDesFixes: p.partDesFixes,
    coutComplet: p.coutComplet,
    margeDeManoeuvre: p.margeDeManoeuvre,
    margeSurCoutVariable: p.margeSurCoutVariable,
    /** La remise maximale exacte, en fraction du prix catalogue (0,2125). */
    remiseMaximale: p.remiseMaximale,
    remiseEntiere,
    prixALaRemiseEntiere: prixARemise(f, remiseEntiere),
    resultatALaRemiseEntiere: auCentime(a.journees * (prixARemise(f, remiseEntiere) - p.coutComplet)),
    prixAUnPointDePlus: prixARemise(f, remiseEntiere + 1),
    /** Les erreurs du pari : la marge rapportée au coût complet, la remise jusqu'au coût variable. */
    remiseSurLeCoutComplet: p.margeDeManoeuvre / p.coutComplet,
    remiseJusquAuCoutVariable: p.remiseMaximaleDUneAffaireEnPlus,
    client: a.client,
    secteur: a.secteur,
    journeesDeLAffaire: a.journees,
    remiseDemandee: a.remiseDemandee,
    prixRemise: r.prixRemise,
    tient: r.tient,
    ecartAuCoutComplet: r.ecartAuCoutComplet,
    coutDeLaRemiseParJournee: r.coutDeLaRemiseParJournee,
    coutDeLaRemise: auCentime(r.coutDeLaRemiseParJournee * a.journees),
    contrepartie,
    contreProposition: a.contreProposition,
    trimestres,
    auT3,
    auT4,
    variante,
    baisse,
    hausse,
  };
}

export type NegociationDuCabinet = ReturnType<typeof negociationDuCabinet>;

/** L'affaire en plus pour une position du laboratoire : remise (en %), journées, jours libres. */
export function laboratoireDeLAffaire(c: Pick<Cas, "code">, remise: number, journees: number, libres: number) {
  const f = ficheDe(c);
  return affaireEnPlus(f, { prix: prixARemise(f, remise), journees, joursLibres: libres });
}

/** Les chiffres du cabinet et de l'affaire : le document de départ du chapitre et de son cas. */
export function tableauDuCabinet(c: Pick<Cas, "code">): TableauDeDonnees {
  const n = negociationDuCabinet(c);
  return {
    titre: `${n.entreprise}, l'année N`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Prix catalogue d'une journée, hors taxes", valeurs: [eur(n.prix)] },
      { libelle: "Frais de mission d'une journée", valeurs: [eur(n.fraisDeMission)] },
      { libelle: "Supports d'une journée", valeurs: [eur(n.supports)] },
      { libelle: "Charges fixes de l'année", valeurs: [eur(n.chargesFixes)] },
      { libelle: "Journées vendues en N", valeurs: [qte(n.journeesDeLAnnee)] },
      { libelle: "Capacité des consultants, par trimestre", valeurs: [`${qte(n.capaciteDuTrimestre)} journées`] },
      { libelle: `Journées demandées par ${n.client}`, valeurs: [qte(n.journeesDeLAffaire)] },
      { libelle: "Remise demandée sur le prix catalogue", valeurs: [pct(n.remiseDemandee)] },
    ],
  };
}

/** Les trimestres de N : demandées, vendues, libres. */
function tableauDesTrimestres(n: NegociationDuCabinet): TableauDeDonnees {
  return {
    titre: `Les journées ${dE(n.entreprise)}, trimestre par trimestre`,
    colonnes: n.trimestres.map((t) => `T${t.trimestre}`),
    lignes: [
      { libelle: "Journées demandées", valeurs: n.trimestres.map((t) => qte(t.demandees)) },
      { libelle: "Journées vendues", valeurs: n.trimestres.map((t) => qte(t.vendues)) },
      { libelle: "Jours libres", valeurs: n.trimestres.map((t) => qte(t.libres)) },
    ],
  };
}

export const NEGOCIER_LE_PRIX: Chapitre = {
  code: "negocier-le-prix",
  parcours: "ndrc",
  palier: 2,
  blocs: ["BTS NDRC Bloc 1 · Relation client et négociation-vente", "BUT TC · Vendre une offre commerciale"],
  titre: "Négocier le prix : marge de manœuvre et prix plancher",
  accroche:
    "Le client demande une remise. Jusqu'où descendre sans perdre d'argent ? Que demander en échange ? Quand accepter un prix sous le coût complet, et quand le refuser parce que le carnet est plein ?",
  objectifs: [
    "Calculer le coût complet d'une journée et la marge de manœuvre",
    "Calculer la remise maximale, et décider d'une remise demandée par un client",
    "Chiffrer la contrepartie d'une remise : le volume qui garde la marge",
    "Fixer le plancher d'une affaire en plus selon la capacité qui reste libre",
    "Mesurer ce qu'une baisse de prix accordée à tous rapporte vraiment, et repérer les clients qui tiennent le prix",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_NEGOCIATION,
    pourquoi:
      "ce chapitre se joue chez ATLAS CONSEIL, le cabinet de la simulation du cours, qui vend ses journées à des entreprises affaire par affaire : un prix qui se négocie, une capacité de consultants qui se remplit trimestre par trimestre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le client demande une remise",
      notions: ["full_unit_cost", "price_floor"],
      tableau: tableauDuCabinet,
      texte: (c) => {
        const n = negociationDuCabinet(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${n.entreprise}, un cabinet de conseil et de formation qui vend des journées d'intervention à des entreprises et à des collectivités. Ses ${qte(n.f.consultants.nombre)} consultants peuvent facturer ${qte(n.capaciteDuTrimestre)} journées par trimestre ; en N, le cabinet en a vendu ${qte(n.journeesDeLAnnee)}, au prix catalogue de ${eur(n.prix)} la journée avant remise.`,
          `${majuscule(n.client)}, une entreprise de l'ameublement qui n'est pas encore cliente, veut confier ${qte(n.journeesDeLAffaire)} journées de formation de ses managers au cabinet, et demande ${pct(n.remiseDemandee)} de remise. Avant d'entrer en négociation, le commercial connaît son plancher : le prix sous lequel l'affaire fait perdre de l'argent.`,
          `Ce que la simulation suppose. Une journée coûte ${eur(n.coutVariable)} en plus quand elle est vendue (${eur(n.fraisDeMission)} de frais de mission, ${eur(n.supports)} de supports) : c'est son coût variable. Les consultants sont payés de toute façon ; leur salaire est dans les charges fixes de l'année, ${eur(n.chargesFixes)}. Une mission signée dans un trimestre y est réalisée. Quand le carnet est plein, les journées qu'une affaire prend à d'autres clients valent le prix catalogue. La demande de chaque clientèle répond au prix en ligne droite. Tout est hors taxes.`,
        ];
      },
      repere: () => "Coût complet d'une journée = coût variable + charges fixes de l'année ÷ journées vendues dans l'année. Marge de manœuvre = prix catalogue − coût complet.",
    },
    {
      id: "cout-complet",
      objectifs: [0],
      type: "montants",
      titre: "Le coût complet d'une journée",
      notions: ["variable_costs", "full_unit_cost", "fixed_costs"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        return `Une journée coûte ${eur(n.fraisDeMission)} de frais de mission et ${eur(n.supports)} de supports. Les charges fixes de l'année, ${eur(n.chargesFixes)}, se répartissent sur les ${qte(n.journeesDeLAnnee)} journées vendues en N. Calculez le coût variable d'une journée, la part des charges fixes qu'elle porte, puis son coût complet.`;
      },
      champs: (c) => {
        const n = negociationDuCabinet(c);
        return [
          { libelle: "Coût variable d'une journée", attendu: n.coutVariable, calcul: `${eur(n.fraisDeMission)} + ${eur(n.supports)} = ${eur(n.coutVariable)}` },
          { libelle: "Part des charges fixes par journée", attendu: n.partDesFixes, calcul: `${eur(n.chargesFixes)} ÷ ${qte(n.journeesDeLAnnee)} = ${eur(n.partDesFixes)}` },
          { libelle: "Coût complet d'une journée", attendu: n.coutComplet, calcul: `${eur(n.coutVariable)} + ${eur(n.partDesFixes)} = ${eur(n.coutComplet)}` },
        ];
      },
      explication: (c) => {
        const n = negociationDuCabinet(c);
        return [
          `Une journée coûte ${eur(n.coutVariable)} en plus quand elle est vendue, et porte ${eur(n.partDesFixes)} des salaires des consultants et des commerciaux, du loyer et de la direction. Vendue sous ${eur(n.coutComplet)} à tous les clients, elle ne paie plus les charges fixes de l'année : le coût complet est le plancher d'un prix fait à tous.`,
        ];
      },
    },
    {
      id: "predire-la-remise",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur la remise maximale",
      notions: ["price_floor"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        return `Avant de calculer, pariez. Le commercial cède la remise point par point sur le prix catalogue de ${eur(n.prix)}. La plus forte remise, au pourcentage entier, qui laisse le prix au-dessus du coût complet de ${eur(n.coutComplet)} sera d'environ…`;
      },
      options: (c) => {
        const n = negociationDuCabinet(c);
        const voir = "Déplacez le curseur à l'étape suivante : il montre où le prix remisé passe sous le coût complet.";
        return [
          { texte: `${qte(n.remiseEntiere)} %`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${qte(Math.round(n.remiseSurLeCoutComplet * 100))} %`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${qte(Math.round(n.remiseJusquAuCoutVariable * 100))} %`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "remise-maximale",
      objectifs: [1],
      type: "curseur",
      titre: "Jusqu'où céder",
      notions: ["price_floor", "full_unit_cost"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        return `Sur l'affaire ${du(n.client)} (${qte(n.journeesDeLAffaire)} journées), faites varier la remise accordée sur le prix catalogue. Une droite donne le chiffre d'affaires de l'affaire, l'autre son coût complet (${qte(n.journeesDeLAffaire)} × ${eur(n.coutComplet)}). Placez le curseur sur la plus forte remise, au pourcentage entier, qui laisse le chiffre d'affaires au-dessus du coût complet, puis validez.`;
      },
      grandeur: () => ({ libelle: "Remise accordée", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: negociationDuCabinet(c).remiseEntiere, min: REMISE_DU_CURSEUR.min, max: REMISE_DU_CURSEUR.max }),
      lecture: (c, remise) => {
        const n = negociationDuCabinet(c);
        const prix = prixARemise(n.f, remise);
        const ca = auCentime(prix * n.journeesDeLAffaire);
        const cout = auCentime(n.coutComplet * n.journeesDeLAffaire);
        return [
          { libelle: "Prix remisé de la journée", montant: prix },
          { libelle: "Chiffre d'affaires de l'affaire", montant: ca },
          { libelle: "Coût complet de l'affaire", montant: cout },
          { libelle: "Résultat de l'affaire", montant: auCentime(ca - cout), fort: true },
        ];
      },
      droites: (c) => {
        const n = negociationDuCabinet(c);
        return {
          produit: (r) => n.journeesDeLAffaire * n.prix * (1 - r / 100),
          cout: () => n.journeesDeLAffaire * n.coutComplet,
          libelles: ["Chiffre d'affaires de l'affaire", "Coût complet de l'affaire"],
        };
      },
      zones: ["L'affaire paie ses coûts", "L'affaire fait perdre"],
      rates: () => ({
        dessous: "Plus forte, la remise laisse encore l'affaire au-dessus de son coût complet : cherchez la plus forte.",
        dessus: "À cette remise, le prix passe sous le coût complet : l'affaire fait perdre de l'argent.",
      }),
      montrer: "Montrer la remise maximale",
      explication: (c) => {
        const n = negociationDuCabinet(c);
        return [
          `Jusqu'à ${qte(n.remiseEntiere)} %, le prix remisé (${eur(n.prixALaRemiseEntiere)}) reste au-dessus du coût complet de ${eur(n.coutComplet)} : l'affaire paie ses frais et sa part des charges fixes, et laisse ${eur(n.resultatALaRemiseEntiere)}. Un point de plus, et la journée tombe à ${eur(n.prixAUnPointDePlus)} : chacune manque ${eur(auCentime(n.coutComplet - n.prixAUnPointDePlus))} pour payer sa part des fixes.`,
          `La remise maximale exacte tombe entre les deux, un peu au-dessus de ${qte(n.remiseEntiere)} % : elle se calcule sur la marge de manœuvre, et le prix catalogue en est la base. C'est l'étape suivante.`,
        ];
      },
    },
    {
      id: "marge-de-manoeuvre",
      objectifs: [0, 1],
      type: "montants",
      titre: "La marge de manœuvre",
      notions: ["price_floor"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        return `Le prix catalogue est de ${eur(n.prix)}, le coût complet de ${eur(n.coutComplet)}. Calculez la marge de manœuvre d'une journée, la remise maximale qu'elle permet en pourcentage du prix catalogue (au centième), puis le résultat de l'affaire ${du(n.client)} à ${qte(n.remiseEntiere)} % de remise.`;
      },
      champs: (c) => {
        const n = negociationDuCabinet(c);
        return [
          { libelle: "Marge de manœuvre par journée", attendu: n.margeDeManoeuvre, calcul: `${eur(n.prix)} − ${eur(n.coutComplet)} = ${eur(n.margeDeManoeuvre)}` },
          { libelle: "Remise maximale (%)", attendu: auCentime(n.remiseMaximale * 100), calcul: `${eur(n.margeDeManoeuvre)} ÷ ${eur(n.prix)} × 100 = ${pct(n.remiseMaximale)}` },
          {
            libelle: `Résultat de l'affaire à ${qte(n.remiseEntiere)} % de remise`,
            attendu: n.resultatALaRemiseEntiere,
            calcul: `${qte(n.journeesDeLAffaire)} × (${eur(n.prixALaRemiseEntiere)} − ${eur(n.coutComplet)}) = ${eur(n.resultatALaRemiseEntiere)}`,
          },
        ];
      },
      explication: (c) => {
        const n = negociationDuCabinet(c);
        return [
          `Le commercial peut céder jusqu'à ${eur(n.margeDeManoeuvre)} par journée, soit ${pct(n.remiseMaximale)} du prix catalogue, avant que l'affaire ne cesse de payer sa part des charges fixes. Le curseur s'arrêtait à ${qte(n.remiseEntiere)} % : au pourcentage entier, c'est la plus forte qui tient. Chaque euro cédé sort du bénéfice : à ${qte(n.remiseEntiere)} %, l'affaire ne laisse plus que ${eur(n.resultatALaRemiseEntiere)}.`,
        ];
      },
    },
    {
      id: "remise-demandee",
      objectifs: [1],
      type: "choix",
      titre: "La remise demandée",
      notions: ["price_floor"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        return `${majuscule(n.client)} demande ${pct(n.remiseDemandee)} de remise sur ses ${qte(n.journeesDeLAffaire)} journées. Le commercial peut-il l'accorder sans faire perdre d'argent au cabinet ?`;
      },
      options: (c) => {
        const n = negociationDuCabinet(c);
        return [
          {
            texte: "Oui : le prix remisé reste au-dessus du coût complet",
            juste: n.tient,
            retour: n.tient
              ? `Oui : à ${eur(n.prixRemise)}, la journée couvre le coût complet de ${eur(n.coutComplet)}, à ${eur(n.ecartAuCoutComplet)} près. La remise de ${pct(n.remiseDemandee)} reste sous la remise maximale de ${pct(n.remiseMaximale)} ; elle coûte pourtant ${eur(n.coutDeLaRemiseParJournee)} par journée, ${eur(n.coutDeLaRemise)} sur l'affaire, qui sortent du bénéfice.`
              : `Non : ${eur(n.prixRemise)} est sous le coût complet de ${eur(n.coutComplet)}. La remise de ${pct(n.remiseDemandee)} dépasse la remise maximale de ${pct(n.remiseMaximale)}.`,
          },
          {
            texte: "Non : le prix remisé passe sous le coût complet",
            juste: !n.tient,
            retour: n.tient
              ? `Non : ${eur(n.prixRemise)} reste au-dessus du coût complet de ${eur(n.coutComplet)}, et la remise de ${pct(n.remiseDemandee)} sous la remise maximale de ${pct(n.remiseMaximale)}.`
              : `Oui : à ${eur(n.prixRemise)}, chaque journée manque ${eur(-n.ecartAuCoutComplet)} pour payer sa part des charges fixes.`,
          },
          {
            texte: "Non : une remise fait toujours perdre de l'argent",
            juste: false,
            retour: `Non : une remise réduit le bénéfice ; elle ne crée une perte que sous le coût complet de ${eur(n.coutComplet)}. Entre les deux, le commercial négocie sur sa marge de manœuvre.`,
          },
        ];
      },
    },
    {
      id: "contrepartie",
      objectifs: [2],
      type: "montants",
      titre: "Une remise contre du volume",
      notions: ["contribution_margin", "price_floor"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        return `Le commercial accepte de parler des ${pct(n.remiseDemandee)}, mais contre du volume. Combien de journées ${n.client} doit-il commander à ${eur(n.prixRemise)} pour laisser au cabinet la même marge sur coût variable que ses ${qte(n.journeesDeLAffaire)} journées au prix catalogue ? Les journées en plus se placent sur des jours libres.`;
      },
      champs: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contrepartie;
        return [
          {
            libelle: "Marge sur coût variable de l'affaire au prix catalogue",
            attendu: k.margeSansRemise,
            calcul: `${qte(k.journees)} × (${eur(n.prix)} − ${eur(n.coutVariable)}) = ${eur(k.margeSansRemise)}`,
          },
          { libelle: "Marge sur coût variable d'une journée remisée", attendu: k.margeParJourneeRemisee, calcul: `${eur(k.prixRemise)} − ${eur(n.coutVariable)} = ${eur(k.margeParJourneeRemisee)}` },
          {
            libelle: "Journées à commander au prix remisé",
            attendu: k.journeesNecessaires ?? 0,
            calcul: `${eur(k.margeSansRemise)} ÷ ${eur(k.margeParJourneeRemisee)} = ${qte(Math.round((k.margeSansRemise / k.margeParJourneeRemisee) * 10) / 10)}, soit ${qte(k.journeesNecessaires ?? 0)} journées (à la journée supérieure)`,
          },
        ];
      },
      explication: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contrepartie;
        return [
          `La remise de ${pct(n.remiseDemandee)} coûte ${eur(auCentime(k.margeSansRemise - k.margeAvecRemise))} de marge sur les ${qte(k.journees)} journées ; ${qte(k.journeesEnPlus ?? 0)} journées de plus la rendent. C'est la contrepartie que le commercial demande : une remise contre un volume, et jamais une remise sans rien en échange.`,
          `On compte en marge sur coût variable, et non en coût complet : les journées en plus ne coûtent que leurs frais, puisque les consultants sont payés de toute façon. Cela ne vaut que si elles trouvent des jours libres. Au T4, où le carnet est plein, elles prendraient la place d'autres clients : c'est la suite du chapitre.`,
        ];
      },
    },
    {
      id: "predire-le-t4",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le trimestre plein",
      notions: ["capacity", "price_floor"],
      tableau: (c) => tableauDesTrimestres(negociationDuCabinet(c)),
      question: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        return `${majuscule(n.client)} propose un second programme : ${qte(k.journees)} journées à ${eur(k.prix)}, sous le coût complet (${eur(n.coutComplet)}) mais au-dessus du coût variable (${eur(n.coutVariable)}). Placée au T3, l'affaire rapporte ${eur(n.auT3.gain)} de marge sur coût variable. Pariez : placée au T4, où le carnet est plein, elle…`;
      },
      options: (c) => {
        const n = negociationDuCabinet(c);
        const voir = "Faites varier les jours libres à l'étape suivante : le curseur montre ce que l'affaire prend aux autres clients.";
        return [
          { texte: `Rapporte encore ${eur(n.auT3.gain)} : le prix couvre le coût variable`, juste: n.auT4.gain === n.auT3.gain, retour: `Pari à vérifier. ${voir}` },
          { texte: "Rapporte moins, mais rapporte encore", juste: n.auT4.gain > 0 && n.auT4.gain < n.auT3.gain, retour: `Pari à vérifier. ${voir}` },
          { texte: "Fait perdre de l'argent au cabinet", juste: n.auT4.gain < 0, retour: `Bon pari. ${voir}` },
        ];
      },
    },
    {
      id: "les-jours-libres",
      objectifs: [3],
      type: "curseur",
      titre: "Les jours qu'il reste",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        return `Faites varier les jours libres du trimestre où se place l'affaire de ${qte(k.journees)} journées à ${eur(k.prix)}, de ${qte(JOURS_LIBRES_DU_CURSEUR.min)} (le T4, plein) à ${qte(JOURS_LIBRES_DU_CURSEUR.max)}. Une droite donne la marge sur coût variable de l'affaire (${qte(k.journees)} × ${eur(n.auT4.margeParJournee)}), l'autre la marge perdue sur les journées qu'elle prend à d'autres clients (${eur(n.margeSurCoutVariable)} chacune, au prix catalogue). Placez le curseur sur le moins de jours libres où l'affaire ne fait rien perdre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Jours libres du trimestre", unite: "jours" }),
      cible: (c) => {
        const n = negociationDuCabinet(c);
        return { attendu: n.auT4.joursLibresNecessaires ?? 0, min: JOURS_LIBRES_DU_CURSEUR.min, max: JOURS_LIBRES_DU_CURSEUR.max };
      },
      lecture: (c, libres) => {
        const x = affaireEnPlus(ficheDe(c), { joursLibres: libres });
        return [
          { libelle: "Marge sur coût variable de l'affaire", montant: x.margeDeLAffaire },
          { libelle: "Marge perdue sur les journées déplacées", montant: x.margePerdue },
          { libelle: "Plancher de l'affaire", montant: x.prixPlancher },
          { libelle: "Gain de l'affaire", montant: x.gain, fort: true },
        ];
      },
      droites: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        return {
          produit: () => n.auT4.margeDeLAffaire,
          cout: (l) => (k.journees - l) * n.margeSurCoutVariable,
          libelles: ["Marge sur coût variable de l'affaire", "Marge perdue sur les journées déplacées"],
        };
      },
      zones: ["L'affaire rapporte", "L'affaire fait perdre"],
      rates: () => ({
        dessous: "Avec si peu de jours libres, l'affaire prend trop de journées à d'autres clients : elle fait perdre de l'argent.",
        dessus: "Avec moins de jours libres, l'affaire ne fait encore rien perdre : cherchez le moins de jours libres.",
      }),
      montrer: "Montrer les jours libres nécessaires",
      explication: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        return [
          `Il faut au moins ${qte(n.auT4.joursLibresNecessaires ?? 0)} jours libres. En dessous, chaque journée ${du(n.client)} qui ne trouve pas de jour libre prend la place d'une journée vendue ${eur(n.prix)} : elle fait perdre ${eur(n.margeSurCoutVariable)} de marge pour en rapporter ${eur(n.auT4.margeParJournee)}.`,
          `Au T3, avec ${qte(n.auT3.joursLibres)} jours libres, les ${qte(k.journees)} journées tiennent et l'affaire rapporte ${eur(n.auT3.gain)}. Au T4, sans aucun jour libre, elle en fait perdre ${eur(-n.auT4.gain)} : le même prix, deux décisions contraires.`,
        ];
      },
    },
    {
      id: "deux-planchers",
      objectifs: [3],
      type: "montants",
      titre: "Le plancher d'une affaire en plus",
      notions: ["price_floor", "capacity", "contribution_margin"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        return `Placée au T4, où le carnet est plein, l'affaire prend ses ${qte(k.journees)} journées à des clients qui paient ${eur(n.prix)}. Calculez la marge sur coût variable de l'affaire, la marge perdue sur les journées déplacées, le gain de l'affaire (négatif pour une perte), puis son plancher au T4 : le prix qui annulerait ce gain.`;
      },
      champs: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        const x = n.auT4;
        return [
          { libelle: "Marge sur coût variable de l'affaire au T4", attendu: x.margeDeLAffaire, calcul: `${qte(k.journees)} × (${eur(k.prix)} − ${eur(n.coutVariable)}) = ${eur(x.margeDeLAffaire)}` },
          { libelle: "Marge perdue sur les journées déplacées", attendu: x.margePerdue, calcul: `${qte(x.deplacees)} × (${eur(n.prix)} − ${eur(n.coutVariable)}) = ${eur(x.margePerdue)}` },
          { libelle: "Gain de l'affaire au T4", attendu: x.gain, calcul: `${eur(x.margeDeLAffaire)} − ${eur(x.margePerdue)} = ${eur(x.gain)}` },
          {
            libelle: "Plancher de l'affaire au T4",
            attendu: x.prixPlancher,
            calcul: `${eur(n.coutVariable)} + ${qte(x.deplacees)} ÷ ${qte(k.journees)} × ${eur(n.margeSurCoutVariable)} = ${eur(x.prixPlancher)}`,
          },
        ];
      },
      explication: (c) => {
        const n = negociationDuCabinet(c);
        return [
          `Le coût variable n'est le plancher que sur une capacité qui resterait libre. Au T4, chaque journée de l'affaire coûte aussi la marge de la journée qu'elle chasse : son plancher remonte au prix catalogue, ${eur(n.auT4.prixPlancher)}, et ${eur(n.contreProposition.prix)} font perdre ${eur(-n.auT4.gain)}.`,
          `Deux planchers, donc. Pour un prix fait à tous les clients, le coût complet (${eur(n.coutComplet)}). Pour une affaire en plus, le coût variable (${eur(n.coutVariable)}) plus la marge des journées qu'elle prend à d'autres clients : il dépend de la place qu'il reste.`,
        ];
      },
    },
    {
      id: "au-t3-ou-au-t4",
      objectifs: [3],
      type: "choix",
      titre: "Où placer la contre-proposition",
      notions: ["price_floor", "capacity"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        return `${majuscule(n.client)} accepterait que son second programme se déroule au T3 ou au T4. Que répond le commercial à sa contre-proposition de ${eur(n.contreProposition.prix)} la journée ?`;
      },
      options: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        return [
          {
            texte: `Oui, au T3 seulement : l'affaire y rapporte ${eur(n.auT3.gain)}`,
            juste: n.auT3.gain >= 0 && n.auT4.gain < 0,
            retour: `Oui : au T3, les ${qte(k.journees)} journées tiennent dans ${qte(n.auT3.joursLibres)} jours libres, et chacune laisse ${eur(n.auT3.margeParJournee)} qui paient une partie des charges fixes, qui tombent de toute façon. Au T4, le même prix ferait perdre ${eur(-n.auT4.gain)}.`,
          },
          {
            texte: "Oui, au trimestre qu'il préfère : le prix couvre le coût variable",
            juste: false,
            retour: `Non : au T4, plein, l'affaire prend ses journées à des clients au prix catalogue. Elle rapporte ${eur(n.auT4.margeDeLAffaire)} et en fait perdre ${eur(n.auT4.margePerdue)} : ${eur(n.auT4.gain)}. Son plancher y est de ${eur(n.auT4.prixPlancher)}.`,
          },
          {
            texte: "Non : le prix est sous le coût complet",
            juste: false,
            retour: `Pas au T3 : sur des jours qui resteraient libres, l'affaire ne prend la place de personne. Ses ${eur(n.auT3.margeParJournee)} par journée au-dessus du coût variable paient ${eur(n.auT3.gain)} de charges fixes, qui tombent de toute façon. Le coût complet est le plancher d'un prix fait à tous, pas celui d'une affaire en plus.`,
          },
          {
            texte: `Oui, pour tous les clients du T3 : ${eur(k.prix)} couvrent le coût variable`,
            juste: false,
            retour: `Non : à ${eur(k.prix)} pour tous les clients, les journées du trimestre ne paieraient plus leur part des charges fixes (${eur(n.partDesFixes)} chacune). Le prix bas ne vaut que pour l'affaire en plus, sur les jours libres.`,
          },
        ];
      },
    },
    {
      id: "vingt-jours-libres",
      objectifs: [3],
      type: "montants",
      titre: "Variante : un trimestre presque plein",
      notions: ["price_floor", "capacity"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        return `Variante : il ne reste que ${qte(JOURS_LIBRES_DE_LA_VARIANTE)} jours libres au trimestre où l'affaire se placerait. Pour les ${qte(k.journees)} journées à ${eur(k.prix)}, calculez les journées prises à d'autres clients, la marge perdue sur elles, le gain de l'affaire (négatif pour une perte), puis son plancher.`;
      },
      champs: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        const x = n.variante;
        return [
          { libelle: "Journées prises à d'autres clients", attendu: x.deplacees, calcul: `${qte(k.journees)} − ${qte(x.joursLibres)} = ${qte(x.deplacees)}` },
          { libelle: "Marge perdue sur ces journées", attendu: x.margePerdue, calcul: `${qte(x.deplacees)} × ${eur(n.margeSurCoutVariable)} = ${eur(x.margePerdue)}` },
          { libelle: "Gain de l'affaire", attendu: x.gain, calcul: `${qte(k.journees)} × ${eur(x.margeParJournee)} − ${eur(x.margePerdue)} = ${eur(x.margeDeLAffaire)} − ${eur(x.margePerdue)} = ${eur(x.gain)}` },
          {
            libelle: "Plancher de l'affaire",
            attendu: x.prixPlancher,
            calcul: `${eur(n.coutVariable)} + ${qte(x.deplacees)} ÷ ${qte(k.journees)} × ${eur(n.margeSurCoutVariable)} = ${eur(x.prixPlancher)}`,
          },
        ];
      },
      explication: (c) => {
        const n = negociationDuCabinet(c);
        const x = n.variante;
        return [
          `Avec ${qte(x.joursLibres)} jours libres, l'affaire ne rapporte plus : les ${qte(x.deplacees)} journées déplacées effacent ses ${eur(x.margeDeLAffaire)} de marge, et ${eur(-x.gain)} de plus.`,
          `Son plancher, ${eur(x.prixPlancher)}, est la moyenne des deux planchers, pondérée par les journées : ${eur(n.coutVariable)} sur les ${qte(x.surJoursLibres)} journées qui trouvent un jour libre, ${eur(n.prix)} sur les ${qte(x.deplacees)} qui en chassent une autre, (${qte(x.surJoursLibres)} × ${eur(n.coutVariable)} + ${qte(x.deplacees)} × ${eur(n.prix)}) ÷ ${qte(x.journees)}. Plus le trimestre est plein, plus le plancher d'une affaire en plus monte vers le prix catalogue.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-affaire",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de l'affaire",
      notions: ["price_floor", "capacity", "contribution_margin"],
      question: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        return `Le départ est la variante : ${qte(k.journees)} journées à ${eur(k.prix)} (une remise de ${qte(Math.round((1 - k.prix / n.prix) * 100))} %), avec ${qte(JOURS_LIBRES_DE_LA_VARIANTE)} jours libres. Faites varier la remise, les journées de l'affaire et les jours libres du trimestre : le tableau suit la marge de l'affaire, la marge qu'elle fait perdre et son gain, et le graphique le gain selon les journées. Relevez le défi, puis cherchez-en un autre chemin.`;
      },
      leviers: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        const l = LEVIERS_DU_LABORATOIRE;
        return [
          { code: "remise", libelle: "Remise sur le prix catalogue", unite: "%", ...l.remise, depart: Math.round((1 - k.prix / n.prix) * 100) },
          { code: "journees", libelle: "Journées de l'affaire", unite: "journées", ...l.journees, depart: k.journees },
          { code: "libres", libelle: "Jours libres du trimestre", unite: "jours", ...l.libres, depart: JOURS_LIBRES_DE_LA_VARIANTE },
        ];
      },
      lecture: (c, p) => {
        const n = negociationDuCabinet(c);
        const x = laboratoireDeLAffaire(c, p.remise!, p.journees!, p.libres!);
        const d = n.variante;
        return [
          { libelle: "Prix de la journée", montant: x.prix, reference: d.prix },
          { libelle: "Journées sur des jours libres", montant: x.surJoursLibres, unite: "journées", reference: d.surJoursLibres },
          { libelle: "Journées prises à d'autres clients", montant: x.deplacees, unite: "journées", reference: d.deplacees },
          { libelle: "Plancher de l'affaire", montant: x.prixPlancher, reference: d.prixPlancher },
          { libelle: "Marge sur coût variable de l'affaire", montant: x.margeDeLAffaire, reference: d.margeDeLAffaire, effet: true },
          { libelle: "Marge perdue sur les journées déplacées", montant: -x.margePerdue, reference: -d.margePerdue, effet: true },
          { libelle: "Gain de l'affaire", montant: x.gain, reference: d.gain, effet: true, fort: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      // Le gain selon les journées : il monte de (prix − coût variable) par journée tant qu'il reste des jours
      // libres, puis descend de (prix catalogue − prix) par journée au-delà. Une ligne brisée, pas une droite.
      graphique: (c) => ({
        levier: "journees",
        courbes: [
          { libelle: "Marge sur coût variable de l'affaire", valeur: (p) => laboratoireDeLAffaire(c, p.remise!, p.journees!, p.libres!).margeDeLAffaire + 0 },
          { libelle: "Marge perdue sur les journées déplacées", valeur: (p) => laboratoireDeLAffaire(c, p.remise!, p.journees!, p.libres!).margePerdue + 0 },
          { libelle: "Gain de l'affaire", valeur: (p) => laboratoireDeLAffaire(c, p.remise!, p.journees!, p.libres!).gain + 0 },
        ],
      }),
      defi: (c) => {
        const n = negociationDuCabinet(c);
        const k = n.contreProposition;
        const depart = Math.round((1 - k.prix / n.prix) * 100);
        // Une solution : garder le prix, et ne vendre que les journées qui tiennent dans les jours libres.
        const solution = { remise: depart, journees: Math.ceil(GAIN_EXIGE_D_UNE_AFFAIRE_EN_PLUS / (k.prix - n.coutVariable) / 5 - 1e-9) * 5, libres: JOURS_LIBRES_DE_LA_VARIANTE };
        return {
          consigne: `Rendez l'affaire acceptable pour le directeur : un gain d'au moins ${eur(GAIN_EXIGE_D_UNE_AFFAIRE_EN_PLUS)}.`,
          atteint: (p) => laboratoireDeLAffaire(c, p.remise!, p.journees!, p.libres!).gain >= GAIN_EXIGE_D_UNE_AFFAIRE_EN_PLUS,
          indice: (p) => {
            const x = laboratoireDeLAffaire(c, p.remise!, p.journees!, p.libres!);
            return x.deplacees > 0
              ? `L'affaire laisse ${eur(x.gain)} : ses ${qte(x.deplacees)} journées prises à d'autres clients coûtent chacune ${eur(n.margeSurCoutVariable)} de marge. Remontez le prix au-dessus de son plancher (${eur(x.prixPlancher)}), réduisez les journées, ou placez-la sur plus de jours libres.`
              : `L'affaire tient dans les jours libres et laisse ${eur(x.gain)} : il manque ${eur(auCentime(GAIN_EXIGE_D_UNE_AFFAIRE_EN_PLUS - x.gain))}. Chaque journée y rapporte son prix moins ${eur(n.coutVariable)} : remontez le prix, ou ajoutez des journées tant qu'il reste des jours libres.`;
          },
          solution,
        };
      },
      explication: (c, p) => {
        const n = negociationDuCabinet(c);
        const x = laboratoireDeLAffaire(c, p.remise!, p.journees!, p.libres!);
        return [
          `Défi relevé : ${qte(x.journees)} journées à ${eur(x.prix)}, avec ${qte(x.joursLibres)} jours libres, laissent ${eur(x.gain)}. Trois chemins y mènent : ne vendre que les journées qui tiennent dans les jours libres, remonter le prix pour qu'il paie les journées déplacées, ou placer l'affaire sur un trimestre qui a de la place.`,
          `Le graphique le montre : le gain monte de (prix − ${eur(n.coutVariable)}) par journée tant qu'il reste des jours libres, puis il descend de (${eur(n.prix)} − prix) par journée au-delà. Sous le coût complet, une affaire ne rapporte que sur des jours qui resteraient libres : c'est la capacité, autant que le prix, qui décide.`,
        ];
      },
    },
    {
      id: "baisse-pour-tous",
      objectifs: [4],
      type: "choix",
      titre: "Une baisse accordée à tous",
      notions: ["price_elasticity", "contribution_margin"],
      tableau: (c) => {
        const n = negociationDuCabinet(c);
        const b = n.baisse;
        return {
          titre: `L'année N rejouée avec un prix ${pct(b.baisse)} plus bas pour tous`,
          colonnes: ["Journées en N", "Journées après la baisse", "Marge sur coût variable en N", "Marge après la baisse"],
          lignes: [
            ...b.clienteles.map((k) => ({ libelle: k.nom, valeurs: [qte(k.journees), qte(k.journeesApres), eur(k.marge), eur(k.margeApres)] })),
            { libelle: "Le cabinet", valeurs: [qte(b.journees), qte(b.journeesApres), eur(b.marge), eur(b.margeApres)] },
          ],
        };
      },
      question: (c) => {
        const n = negociationDuCabinet(c);
        return `La simulation du cours rejoue l'année N avec un prix ${pct(n.baisse.baisse)} plus bas pour tous les clients, sans rien changer d'autre : chaque clientèle demande plus de journées selon sa sensibilité au prix. Qu'a donné la baisse ?`;
      },
      options: (c) => {
        const n = negociationDuCabinet(c);
        const b = n.baisse;
        const plusDeVentes = b.journeesApres > b.journees;
        const plusDeMarge = b.margeApres > b.marge;
        const ecart = eur(Math.abs(auCentime(b.margeApres - b.marge)));
        const t4 = n.trimestres[3]!;
        const gagnantes = b.clienteles.filter((k) => k.margeApres > k.marge).map((k) => k.nom);
        return [
          {
            texte: "Plus de ventes, mais moins de marge",
            juste: plusDeVentes && !plusDeMarge,
            retour: `Oui : ${qte(b.journeesApres - b.journees)} journées de plus n'ont pas compensé la marge cédée sur chacune : ${ecart} de marge sur coût variable en moins.${gagnantes.length === 1 ? ` Seule la clientèle « ${gagnantes[0]} », la plus sensible au prix, y gagne.` : ""} Et la capacité de l'année tient (${qte(b.journeesApres)} journées sur ${qte(n.capaciteDeLAnnee)}), mais le T4 est déjà plein (${qte(t4.vendues)} sur ${qte(t4.capacite)}) : une partie des journées en plus n'y trouverait pas de consultant.`,
          },
          {
            texte: "Plus de ventes, et plus de marge",
            juste: plusDeVentes && plusDeMarge,
            retour: plusDeMarge ? `Oui : ${ecart} de marge en plus.` : `Non : les journées en plus n'ont pas compensé la marge cédée sur chacune : ${ecart} de moins.`,
          },
          {
            texte: "Les mêmes ventes, et moins de marge",
            juste: !plusDeVentes && !plusDeMarge,
            retour: plusDeVentes ? `Non : la baisse a fait demander ${qte(b.journeesApres)} journées au lieu de ${qte(b.journees)}.` : `Oui : ${ecart} de marge en moins.`,
          },
        ];
      },
    },
    {
      id: "qui-tient-le-prix",
      objectifs: [4],
      type: "choix",
      titre: "Les clients qui tiennent le prix",
      notions: ["price_elasticity", "segmentation"],
      tableau: (c) => {
        const n = negociationDuCabinet(c);
        return {
          titre: `Si ${n.entreprise} montait son prix de ${pct(n.hausse.hausse)}`,
          colonnes: ["Élasticité au prix", "Demande perdue"],
          lignes: n.hausse.clienteles.map((k) => ({ libelle: k.nom, valeurs: [qte(k.elasticite), pct(k.perte)] })),
        };
      },
      question: (c) => `Le tableau dit, pour chaque clientèle ${dE(negociationDuCabinet(c).entreprise)}, la part de la demande qu'une hausse de prix ferait perdre, toutes choses égales par ailleurs. Avec quels clients le commercial peut-il tenir son prix le plus fermement ?`,
      options: (c) => {
        const n = negociationDuCabinet(c);
        const t = n.hausse.tenace;
        return n.hausse.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === t.code,
          retour:
            k.code === t.code
              ? `Oui : une hausse de ${pct(n.hausse.hausse)} ne leur ferait perdre qu'environ ${pct(k.perte)} de la demande. Ils achètent la relation et la fiabilité avant le prix : c'est auprès d'eux qu'une remise se cède le moins.`
              : `Non : une hausse de ${pct(n.hausse.hausse)} leur ferait perdre environ ${pct(k.perte)} de la demande, plus que pour la clientèle « ${t.nom} » (${pct(t.perte)}). Ils comparent davantage, et la remise y pèse plus dans la décision.`,
        }));
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["price_floor", "full_unit_cost", "capacity", "price_elasticity"],
      texte: (c) => {
        const n = negociationDuCabinet(c);
        return [
          `${n.entreprise} vend ${eur(n.prix)} une journée qui lui coûte ${eur(n.coutComplet)} tout compris : sa marge de manœuvre est de ${eur(n.margeDeManoeuvre)}, une remise de ${pct(n.remiseMaximale)} au plus pour un prix fait à tous les clients. La remise de ${pct(n.remiseDemandee)} ${du(n.client)} tient, à ${eur(n.ecartAuCoutComplet)} près, et se paie en volume : ${qte(n.contrepartie.journeesNecessaires ?? 0)} journées au lieu de ${qte(n.journeesDeLAffaire)} pour garder la marge.`,
          `Sous le coût complet, une affaire en plus ne se juge pas à son prix seul, mais à la place qu'il reste : ${eur(n.contreProposition.prix)} rapportent ${eur(n.auT3.gain)} au T3, où les jours libres abondent, et font perdre ${eur(-n.auT4.gain)} au T4, où le carnet est plein. Son plancher va du coût variable (${eur(n.coutVariable)}) au prix catalogue (${eur(n.prix)}), selon les journées qu'elle prend à d'autres clients. Une baisse accordée à tous fait vendre plus, mais laisse moins de marge ; les grands comptes, eux, tiennent le prix.`,
          "Au niveau de l'examen, vous savez calculer un coût complet, une marge de manœuvre et une remise maximale, chiffrer la contrepartie d'une remise, fixer le plancher d'une affaire en plus selon la capacité libre, juger une baisse de prix accordée à tous, et dire quelles clientèles tiennent le prix.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Plancher d'un prix fait à tous : le coût complet. Plancher d'une affaire en plus : le coût variable sur des jours libres, plus la marge des journées qu'elle prend à d'autres clients quand le carnet est plein. Une remise se paie en volume : journées nécessaires = marge sans remise ÷ marge d'une journée remisée.",
    },
  ],
};

/** « d'ATLAS CONSEIL », « de NOVA » : l'élision devant une voyelle. */
function dE(nom: string) {
  return /^[aeiouyéèêhAEIOUYÉÈH]/.test(nom) ? `d'${nom}` : `de ${nom}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LES EXPORTS DE L'ARÈNE, GARDÉS POUR CEUX QUI LES LISENT ENCORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @deprecated Les entreprises où le chapitre se jouait dans l'arène. Le chapitre se joue désormais chez
 * ATLAS CONSEIL seule (`ENTREPRISES_DE_LA_NEGOCIATION`). Gardé pour les fichiers qui le lisent encore et
 * ne sont pas passés sur le monde du cours : remises-et-conditions, tableau-de-bord-commercial, les cas
 * la-remise-du-grand-compte et l-objectif-de-taux-de-service, et leurs tests.
 */
export const NEGOCIATIONS = ["conseil", "transport", "batiment"] as const;

/**
 * @deprecated Le coût complet d'une unité sur le mois du cas de l'arène (`c.gestion`), tel que le chapitre
 * le calculait avant de passer sur le monde du cours. Gardé, sans plus rien importer de l'arène, pour les
 * fichiers qui le lisent encore : remises-et-conditions (`coutVariable`) et le cas la-remise-du-grand-compte
 * (`coutVariable`, `coutComplet`, `partDesFixes`, `chargesFixes`, `quantiteDuMois`). Le chapitre, lui, lit
 * `negociationDuCabinet`.
 */
export function negociation(c: Cas) {
  const g = c.gestion;
  const prix = g.prixMoyen;
  const coutVariable = g.coutVariableUnitaire;
  const partDesFixes = auCentime(g.chargesFixes / g.quantite);
  const coutComplet = auCentime(coutVariable + partDesFixes);
  const margeDeManoeuvre = auCentime(prix - coutComplet);
  return {
    prix,
    matiere: g.matiereParUnite,
    autres: g.autresParUnite,
    autresCoutsVariables: g.autresCoutsVariables,
    coutVariable,
    chargesFixes: g.chargesFixes,
    quantiteDuMois: g.quantite,
    partDesFixes,
    coutComplet,
    margeDeManoeuvre,
    remiseMaximale: Math.round((margeDeManoeuvre / prix) * 1000) / 10,
    client: c.venteCredit.client,
    quantite: c.venteCredit.quantite,
  };
}
