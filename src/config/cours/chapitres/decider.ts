import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { coutCompletDuMois, demandeAuPrix, meilleurPrixSansDemandeNonServie, trimestreDeDecision } from "../monde/couts-et-budgets";
import { GESTION_DU_COURS, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, LigneDeSimulation, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DÉCIDER, PRIX, FABRIQUER OU ACHETER (contrôle de gestion, palier 4 ; BTS CG, DCG UE11,
 * BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le premier
 * trimestre de NOVA a une fiche figée (monde/nova-gestion.ts, `decision`) et se calcule par le modèle
 * du cours (monde/couts-et-budgets.ts, `trimestreDeDecision`) : une droite de demande figée, la
 * capacité de la ligne, un sous-traitant, des ventes égales à la plus petite de la demande et de ce
 * qui est disponible. L'arène ne rejoue plus rien ; une évolution du moteur ne change rien ici.
 *
 * L'objet : décider en comparant ce qui change. L'élève prévoit à la main l'effet d'un prix plus haut
 * ou plus bas (à volume constant, puis le volume qu'il faudrait), puis fait jouer le prix, la
 * production et la sous-traitance sur la demande figée : la demande répond, le plan de production
 * borne, et le meilleur prix n'est aucun des trois que le dirigeant envisageait. Puis fabriquer ou
 * acheter : une commande au-delà de la capacité, et, en expert, une commande exceptionnelle sous le
 * coût complet, avec puis sans sous-traitant. Depuis la réconciliation d'octobre 2026 (une seule
 * demande de NOVA : 4 778 enceintes à 59 €, toute la demande de N servie), la commande tient dans la
 * capacité restante : sans sous-traitant, elle ne chasse aucune vente ; le prix du trimestre est le
 * meilleur des trois, et le sommet de la courbe est à 60,27 €.
 *
 * LES CHARGES FIXES DU TRIMESTRE valent 93 549 €, trois mois des charges fixes de janvier : l'arène en
 * comptait 106 686 €. Les résultats du trimestre aux trois prix en changent (−21 401,20 €, 6 789 € et
 * 2 753 €), et le chapitre le dit à l'élève dès l'intro.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, volume-constant (la question donne le calcul), fabriquer-ou-acheter ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-volume
 *     puis volume-au-curseur (les ventes qu'une baisse de 10 % oblige à faire) avant
 *     volume-necessaire ; predire-la-baisse puis le-laboratoire-du-prix (prix, production,
 *     sous-traitance sur la demande figée, avec le graphique du résultat selon le prix) avant
 *     les-trois-prix ; predire-la-commande puis le-prix-plancher (un curseur sur le prix de la
 *     commande exceptionnelle) avant la-commande-exceptionnelle ;
 *   · autonome : volume-necessaire, les-trois-prix, ce-qui-borne, meilleur-prix, la-commande (ni
 *     formule ni chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : le-prix-optimal (retrouver par le calcul le prix que le laboratoire a fait trouver),
 *     la-commande-exceptionnelle (une commande sous le coût complet, en partie sous-traitée, et son
 *     prix plancher), sans-sous-traitant (la capacité comme facteur rare : le coût d'opportunité des
 *     ventes chassées) ; puis la synthèse.
 *
 * Ce qui a disparu avec l'arène : les concurrents qui jouaient le même trimestre, le prix moyen d'une
 * gamme, et les entreprises sans sous-traitant (le chapitre ne se joue plus que chez NOVA).
 */

/** L'écart de prix que le dirigeant envisage, à la hausse ou à la baisse (celui de la fiche). */
const ecartDe = (f: FicheDeGestion) => f.decision.ecartDePrix;

/**
 * LA COMMANDE AU PRIX DU TRIMESTRE, hypothèse du cours : un client demande 3 300 enceintes de plus à
 * 59 €, plus que la capacité restante au plan du trimestre (la moitié de plus, à la centaine).
 */
export const COMMANDE_AU_PRIX_DU_TRIMESTRE = 3_300;

/**
 * LA COMMANDE EXCEPTIONNELLE, hypothèse du cours : une enseigne propose 2 000 enceintes à 50 €, sous
 * le coût complet d'une enceinte. Elle arrive quand NOVA a décidé de servir toute sa demande au prix
 * du trimestre ; elle est à prendre en entier ou pas du tout.
 */
export const COMMANDE_EXCEPTIONNELLE = { quantite: 2_000, prix: 50 } as const;

/** Les bornes du curseur du prix plancher, en euros entiers. */
export const PRIX_DU_CURSEUR_PLANCHER = { min: 30, max: 60 } as const;

/** Les leviers du laboratoire : le prix (au pas de 10 centimes, la demande étant à l'enceinte inférieure), la production, la sous-traitance. */
export const PRIX_DU_LABORATOIRE = { min: 45, max: 75, pas: 0.1 } as const;
export const PRODUCTION_DU_LABORATOIRE = { min: 3_000, pas: 1 } as const;
export const SOUS_TRAITANCE_DU_LABORATOIRE = { min: 0, max: 3_000, pas: 10 } as const;

/** Le chapitre se calcule sur la décision de la fiche de gestion : celle de NOVA, la seule à avoir un sous-traitant. */
export const ENTREPRISES_DE_LA_DECISION: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 1000) / 10).toLocaleString("fr-FR")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** Tout ce que le chapitre et son cas demandent, calculé une fois sur la fiche. */
export function decision(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const d = f.decision;
  const e = ecartDe(f);
  const cv = f.moisDeReference.coutVariable.composants + f.moisDeReference.coutVariable.autres;
  const fixesDuMois = f.moisDeReference.chargesFixes.loyer + f.moisDeReference.chargesFixes.personnel + f.moisDeReference.chargesFixes.amortissement;
  const base = trimestreDeDecision(f);
  const bas = trimestreDeDecision(f, { prix: auCentime(d.prix * (1 - e)) });
  const haut = trimestreDeDecision(f, { prix: auCentime(d.prix * (1 + e)) });
  // À volume constant : l'écart de prix va tout droit à la marge.
  const ecartDeMarge = auCentime(base.chiffreDAffaires * e);
  // Le volume qu'une baisse oblige à vendre pour garder la marge.
  const margeUnitaire = base.margeFabriquee;
  const margeBaissee = auCentime(margeUnitaire - d.prix * e);
  const volume = Math.ceil(base.marge / margeBaissee - 1e-9);
  // Le meilleur prix sans demande non servie, et le même prix retrouvé par le calcul (le sommet de la parabole).
  const meilleur = meilleurPrixSansDemandeNonServie(f, { min: PRIX_DU_LABORATOIRE.min, max: PRIX_DU_LABORATOIRE.max, pas: PRIX_DU_LABORATOIRE.pas });
  const prixOptimal = auCentime((d.demande.aPrixNul / d.demande.perdueParEuro + cv) / 2);
  // La commande au prix du trimestre : fabriquer d'abord, sous-traiter le reste.
  const restante = base.capaciteRestante;
  const commande = COMMANDE_AU_PRIX_DU_TRIMESTRE;
  const fabriquee = Math.min(restante, commande);
  const soustraitee = commande - fabriquee;
  const gainDeLaCommande = auCentime(fabriquee * base.margeFabriquee + soustraitee * base.margeSousTraitee);
  // La commande exceptionnelle, quand toute la demande au prix du trimestre est servie.
  const x = COMMANDE_EXCEPTIONNELLE;
  const servie = Math.min(base.demande, d.capacite);
  const restanteServie = d.capacite - servie;
  const xFabriquee = Math.min(restanteServie, x.quantite);
  const xSousTraitee = x.quantite - xFabriquee;
  const margeXFabriquee = auCentime(xFabriquee * (x.prix - cv));
  const margeXSousTraitee = auCentime(xSousTraitee * (x.prix - d.coutDuSousTraitant));
  const coutDeLaCommande = auCentime(xFabriquee * cv + xSousTraitee * d.coutDuSousTraitant);
  const margeDeLaCommande = auCentime(x.quantite * x.prix - coutDeLaCommande);
  const prixPlancher = auCentime(coutDeLaCommande / x.quantite);
  const prixPlancherEntier = Math.ceil(coutDeLaCommande / x.quantite - 1e-9);
  // Sans sous-traitant : la commande, tout ou rien, chasse des ventes à 59 € ; leur marge est le coût d'opportunité de la capacité.
  const sansSousTraitant = {
    chassees: xSousTraitee,
    margeDeLaCommande: auCentime(x.quantite * (x.prix - cv)),
    margeChassee: auCentime(xSousTraitee * base.margeFabriquee),
  };
  return {
    f,
    d,
    e,
    cv,
    fixesDuMois,
    base,
    bas,
    haut,
    trois: [bas, base, haut],
    ecartDeMarge,
    margeUnitaire,
    margeBaissee,
    volume,
    hausseDuVolume: auDixieme((volume / base.ventes - 1) * 100),
    meilleur,
    prixOptimal,
    demandeOptimale: demandeAuPrix(f, prixOptimal),
    resultatOptimal: trimestreDeDecision(f, { prix: prixOptimal, production: demandeAuPrix(f, prixOptimal) }).resultat,
    restante,
    commande,
    fabriquee,
    soustraitee,
    gainDeLaCommande,
    commandeExceptionnelle: x,
    servie,
    restanteServie,
    xFabriquee,
    xSousTraitee,
    margeXFabriquee,
    margeXSousTraitee,
    coutDeLaCommande,
    margeDeLaCommande,
    prixPlancher,
    prixPlancherEntier,
    sansSousTraitant: { ...sansSousTraitant, net: auCentime(sansSousTraitant.margeDeLaCommande - sansSousTraitant.margeChassee) },
    coutDeRevientDeJanvier: auCentime(coutCompletDuMois(f).coutDeRevientUnitaire),
  };
}

export type Decision = ReturnType<typeof decision>;

const LIBELLES = (e: number) => [`Prix −${pct(e)}`, "Prix du trimestre", `Prix +${pct(e)}`] as const;

/** Le trimestre aux trois prix, au plan de production du trimestre : le document des étapes de choix. */
export function tableauDesTroisPrix(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = decision(c);
  const ligne = (libelle: string, val: (t: Decision["base"]) => string) => ({ libelle, valeurs: k.trois.map(val) });
  return {
    titre: `Le premier trimestre ${dE(k.f.entreprise)} à trois prix, au plan de production du trimestre`,
    colonnes: LIBELLES(k.e),
    lignes: [
      ligne("Prix d'une enceinte", (t) => eur(t.prix)),
      ligne("Enceintes demandées", (t) => qte(t.demande)),
      ligne("Enceintes vendues", (t) => qte(t.ventes)),
      ligne("Demande non servie", (t) => qte(t.nonServie)),
      ligne("Enceintes en stock", (t) => qte(t.stock)),
      ligne("Chiffre d'affaires", (t) => eur(t.chiffreDAffaires)),
      ligne("Marge sur coût variable", (t) => eur(t.marge)),
      ligne("Résultat d'exploitation", (t) => eur(t.resultat)),
    ],
  };
}

/** La lecture du laboratoire, pour une position des trois leviers. */
function lectureDuLaboratoire(k: Decision, p: Readonly<Record<string, number>>): LigneDeSimulation[] {
  const t = trimestreDeDecision(k.f, { prix: p.prix!, production: p.production!, sousTraitance: p.sousTraitance! });
  const b = k.base;
  return [
    { libelle: "Enceintes demandées", montant: t.demande, unite: "enceintes", reference: b.demande },
    { libelle: "Enceintes fabriquées et vendues", montant: t.fabriqueesVendues, unite: "enceintes", reference: b.fabriqueesVendues },
    { libelle: "Enceintes sous-traitées et vendues", montant: t.sousTraitees, unite: "enceintes", reference: b.sousTraitees },
    { libelle: "Demande non servie", montant: t.nonServie, unite: "enceintes", reference: b.nonServie },
    { libelle: "Enceintes en stock", montant: t.stock, unite: "enceintes", reference: b.stock },
    { libelle: "Marge sur coût variable", montant: t.marge, reference: b.marge },
    { libelle: "Résultat d'exploitation", montant: t.resultat, reference: b.resultat, fort: true },
    { libelle: "Gain sur le trimestre joué", montant: auCentime(t.resultat - b.resultat), reference: 0, effet: true },
  ];
}

/** Le résultat du trimestre quand toute la demande est servie : la ligne fabrique ce qu'elle peut, le sous-traitant le reste. */
function resultatToutServi(k: Decision, prix: number) {
  const demande = demandeAuPrix(k.f, prix);
  return trimestreDeDecision(k.f, { prix, production: Math.min(demande, k.d.capacite), sousTraitance: Math.max(0, demande - k.d.capacite) }).resultat;
}

export const DECIDER: Chapitre = {
  code: "decider-prix-fabriquer-acheter",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GEA · Aider à la prise de décision",
  ],
  titre: "Décider : prix, fabriquer ou acheter",
  accroche:
    "Monter ou baisser son prix, fabriquer ou faire fabriquer, accepter une commande sous le coût complet : prévoir ce qui change, puis faire jouer la demande, la capacité et le sous-traitant.",
  objectifs: [
    "Prévoir l'effet d'un changement de prix sur la marge, à volume constant, puis le volume qu'une baisse oblige à vendre",
    "Faire jouer le prix sur une demande qui répond, et dire ce qui borne les ventes : la demande ou le plan de production",
    "Retrouver par le calcul le prix qui maximise le résultat",
    "Décider de fabriquer ou de sous-traiter selon la capacité et le coût de chaque unité",
    "Juger une commande exceptionnelle à sa marge différentielle, avec le coût d'opportunité d'une capacité saturée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_DECISION,
    pourquoi: "la décision se calcule sur le premier trimestre de NOVA dans la simulation du cours, avec sa demande, la capacité de sa ligne et son sous-traitant.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Décider, c'est comparer ce qui change",
      notions: ["contribution_margin", "price_elasticity", "fixed_costs"],
      texte: (c) => {
        const k = decision(c);
        const b = k.base;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${k.f.entreprise}, sur le premier trimestre : janvier, février et mars. ${k.f.entreprise} a fabriqué et vendu ${qte(b.ventes)} enceintes à ${eur(b.prix)} : ${eur(b.chiffreDAffaires)} de chiffre d'affaires et, à ${eur(k.cv)} de coût variable par enceinte, ${eur(b.marge)} de marge sur coût variable. Ses charges fixes du trimestre sont trois mois des charges fixes de janvier, 3 × ${eur(k.fixesDuMois)} = ${eur(k.d.chargesFixes)} : le résultat d'exploitation est de ${eur(b.resultat)}.`,
          `Ce que la simulation suppose : au prix p, les clients demandent ${qte(k.d.demande.aPrixNul)} − ${qte(k.d.demande.perdueParEuro)} × p enceintes par trimestre, à l'enceinte inférieure ; la ligne de montage en produit au plus ${qte(k.d.capacite)} ; un sous-traitant livre des enceintes finies à ${eur(k.d.coutDuSousTraitant)} pièce, sur commande ferme ; ce qui est fabriqué et ne se vend pas reste en stock à son coût variable, sans effet sur le résultat du trimestre ; les charges fixes ne bougent pas.`,
          `Le dirigeant hésite : monter son prix de ${pct(k.e)}, ou le baisser d'autant ? Une décision se juge à ce qu'elle change : les charges fixes ne bougent pas, la marge, si. Vous allez prévoir, puis faire jouer le trimestre.`,
        ];
      },
      repere: () =>
        "Une décision se juge à ses effets différentiels : ce qu'elle ajoute, ce qu'elle retire. Les charges qui ne changent pas n'entrent pas dans le calcul.",
    },
    {
      id: "volume-constant",
      type: "montants",
      titre: "Si les ventes ne bougeaient pas",
      notions: ["contribution_margin"],
      question: (c) => {
        const k = decision(c);
        return `Supposez d'abord que le volume ne bouge pas : seul le prix change. La marge sur coût variable gagne ou perd ${pct(k.e)} du chiffre d'affaires (${pct(k.e)} × ${eur(k.base.chiffreDAffaires)}). Quelle serait-elle à +${pct(k.e)}, puis à −${pct(k.e)} ?`;
      },
      champs: (c) => {
        const k = decision(c);
        const b = k.base;
        return [
          { libelle: `Marge à +${pct(k.e)}, à volume constant`, attendu: auCentime(b.marge + k.ecartDeMarge), calcul: `${eur(b.marge)} + ${pct(k.e)} × ${eur(b.chiffreDAffaires)} = ${eur(auCentime(b.marge + k.ecartDeMarge))}` },
          { libelle: `Marge à −${pct(k.e)}, à volume constant`, attendu: auCentime(b.marge - k.ecartDeMarge), calcul: `${eur(b.marge)} − ${pct(k.e)} × ${eur(b.chiffreDAffaires)} = ${eur(auCentime(b.marge - k.ecartDeMarge))}` },
        ];
      },
      explication: (c) => {
        const k = decision(c);
        return [
          `À volume constant, ${pct(k.e)} de prix déplacent ${eur(k.ecartDeMarge)} de marge, tout droit au résultat : le coût variable de chaque enceinte ne change pas. Mais le volume, lui, bouge : c'est toute la question.`,
        ];
      },
    },
    {
      id: "predire-le-volume",
      type: "choix",
      titre: "Pariez sur le volume",
      notions: ["contribution_margin"],
      question: (c) => {
        const k = decision(c);
        return `À −${pct(k.e)}, chaque enceinte rapporte moins. Avant de calculer, pariez : pour garder la marge du trimestre, ${eur(k.base.marge)}, les ventes devront monter…`;
      },
      options: (c) => {
        const k = decision(c);
        const voir = "Faites varier les ventes à l'étape suivante : le curseur le montre.";
        return [
          { texte: `De bien plus de ${pct(k.e)}`, juste: k.hausseDuVolume > k.e * 100, retour: `Bon pari. ${voir}` },
          { texte: `D'autant que la baisse, ${pct(k.e)}`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `De moins de ${pct(k.e)} : chaque enceinte rapporte encore`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "volume-au-curseur",
      type: "curseur",
      titre: "Le volume qu'il faudrait",
      notions: ["contribution_margin", "price_elasticity"],
      question: (c) => {
        const k = decision(c);
        return `Faites varier les ventes du trimestre au prix baissé, ${eur(k.bas.prix)}. Placez le curseur sur la plus petite quantité qui garde au moins la marge du trimestre, ${eur(k.base.marge)}.`;
      },
      grandeur: () => ({ libelle: "Ventes du trimestre au prix baissé", unite: "enceintes" }),
      cible: (c) => {
        const k = decision(c);
        return { attendu: k.volume, min: Math.floor(k.base.ventes / 10) * 10, max: Math.ceil((k.volume * 1.3) / 10) * 10 };
      },
      lecture: (c, q) => {
        const k = decision(c);
        const marge = auCentime(q * k.margeBaissee);
        return [
          { libelle: "Marge par enceinte au prix baissé", montant: k.margeBaissee },
          { libelle: "Marge au prix baissé", montant: marge },
          { libelle: "Marge du trimestre, au prix actuel", montant: k.base.marge },
          { libelle: "Différence", montant: auCentime(marge - k.base.marge), fort: true },
        ];
      },
      droites: (c) => {
        const k = decision(c);
        return { produit: (q) => q * k.margeBaissee, cout: () => k.base.marge, libelles: ["Marge au prix baissé", "Marge du trimestre"] };
      },
      zones: ["Marge gardée", "Marge perdue"],
      rates: () => ({
        dessous: "À ce volume, la baisse de prix fait perdre de la marge.",
        dessus: "Moins de ventes suffiraient encore : cherchez la plus petite quantité.",
      }),
      montrer: "Montrer le volume",
      explication: (c) => {
        const k = decision(c);
        return [
          `Il faut ${qte(k.volume)} enceintes au lieu de ${qte(k.base.ventes)} : pour ${pct(k.e)} de prix en moins, ${qte(k.hausseDuVolume)} % de ventes en plus. La pente de la droite, c'est la marge d'une enceinte au prix baissé : plus elle est faible, plus il faut de volume.`,
        ];
      },
    },
    {
      id: "volume-necessaire",
      type: "montants",
      titre: "Ce qu'une baisse oblige à vendre",
      notions: ["contribution_margin", "breakeven"],
      question: () =>
        "Formalisez ce que le curseur a montré : la marge d'une enceinte au prix baissé, le volume qui garde la marge du trimestre (à l'enceinte supérieure), puis la hausse des ventes que cela demande, en pourcentage au dixième.",
      champs: (c) => {
        const k = decision(c);
        return [
          { libelle: "Marge par enceinte au prix baissé", attendu: k.margeBaissee, calcul: `${eur(k.margeUnitaire)} − ${pct(k.e)} × ${eur(k.d.prix)} = ${eur(k.margeBaissee)}` },
          { libelle: "Volume qui garde la marge", attendu: k.volume, calcul: `${eur(k.base.marge)} ÷ ${eur(k.margeBaissee)}, à l'enceinte supérieure = ${qte(k.volume)}` },
          { libelle: "Hausse des ventes nécessaire (%)", attendu: k.hausseDuVolume, tolerance: 0.1, calcul: `(${qte(k.volume)} ÷ ${qte(k.base.ventes)} − 1) × 100 ≈ ${qte(k.hausseDuVolume)} %` },
        ];
      },
      explication: (c) => {
        const k = decision(c);
        return [
          `Une baisse de prix se paie en volume, et le volume a ses limites : la demande, et ce que l'on produit. La baisse retire ${eur(auCentime(k.d.prix * k.e))} à chaque enceinte, soit ${qte(Math.round(((k.d.prix * k.e) / k.margeUnitaire) * 100))} % de sa marge : c'est la marge, pas le prix, qui fixe le volume à trouver.`,
        ];
      },
    },
    {
      id: "predire-la-baisse",
      type: "choix",
      titre: "Pariez sur la baisse",
      notions: ["price_elasticity", "capacity"],
      question: (c) => {
        const k = decision(c);
        return `À ${eur(k.bas.prix)}, la demande va monter. Le plan de production, lui, reste celui du trimestre : ${qte(k.d.production)} enceintes. Pariez : les ventes atteindront-elles les ${qte(k.volume)} qu'il faudrait ?`;
      },
      options: (c) => {
        const k = decision(c);
        const voir = "Le laboratoire de l'étape suivante fait jouer le trimestre : le prix, la production, la sous-traitance.";
        const plan = k.bas.nonServie > 0;
        return [
          { texte: "Non : le plan de production les bornera", juste: plan, retour: `${plan ? "Bon pari" : "Pari à vérifier"}. ${voir}` },
          { texte: `Oui : la demande dépassera ${qte(k.volume)} enceintes`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : la demande ne montera pas assez", juste: !plan, retour: `${plan ? "Pari à vérifier" : "Bon pari"}. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-prix",
      type: "simulation",
      titre: "Le laboratoire du prix",
      notions: ["price_elasticity", "capacity", "make_or_buy"],
      question: (c) => {
        const k = decision(c);
        return `Faites jouer le trimestre : le prix d'une enceinte, ce que la ligne fabrique (au plus ${qte(k.d.capacite)}) et le plafond de ce que vous faites sous-traiter à ${eur(k.d.coutDuSousTraitant)}. Les ventes valent la plus petite de la demande et de ce qui est disponible. Le graphique suit le résultat selon le prix : celui de votre plan, et celui qu'on aurait en servant toute la demande.`;
      },
      leviers: (c) => {
        const k = decision(c);
        return [
          { code: "prix", libelle: "Prix d'une enceinte", unite: "€", ...PRIX_DU_LABORATOIRE, depart: k.d.prix },
          { code: "production", libelle: "Enceintes fabriquées par la ligne", unite: "enceintes", min: PRODUCTION_DU_LABORATOIRE.min, max: k.d.capacite, pas: PRODUCTION_DU_LABORATOIRE.pas, depart: k.d.production },
          { code: "sousTraitance", libelle: "Plafond de la sous-traitance", unite: "enceintes", ...SOUS_TRAITANCE_DU_LABORATOIRE, depart: 0 },
        ];
      },
      lecture: (c, p) => lectureDuLaboratoire(decision(c), p),
      // Le résultat selon le prix n'est pas une droite : la demande baisse quand le prix monte, et la marge d'une enceinte monte.
      graphique: (c) => {
        const k = decision(c);
        return {
          levier: "prix",
          courbes: [
            { libelle: "Résultat de votre plan", valeur: (p) => trimestreDeDecision(k.f, { prix: p.prix!, production: p.production!, sousTraitance: p.sousTraitance! }).resultat + 0 },
            { libelle: "Résultat en servant toute la demande", valeur: (p) => resultatToutServi(k, p.prix!) + 0 },
          ],
        };
      },
      defi: (c) => {
        const k = decision(c);
        const m = k.meilleur;
        const t = (p: Readonly<Record<string, number>>) => trimestreDeDecision(k.f, { prix: p.prix!, production: p.production!, sousTraitance: p.sousTraitance! });
        return {
          consigne: "Trouvez le meilleur résultat d'exploitation sans demande non servie ni enceinte en stock.",
          atteint: (p) => {
            const x = t(p);
            return x.nonServie === 0 && x.stock === 0 && x.resultat >= m.resultat - 0.005;
          },
          indice: (p) => {
            const x = t(p);
            if (x.nonServie > 0) return `${qte(x.nonServie)} enceintes demandées ne sont pas servies : fabriquez-en plus, faites sous-traiter, ou montez le prix.`;
            if (x.stock > 0) return `${qte(x.stock)} enceintes fabriquées restent en stock : ne fabriquez que la demande, ${qte(x.demande)} à ce prix.`;
            return `Toute la demande est servie, sans stock, pour ${eur(x.resultat)}. La courbe « toute la demande » monte encore ailleurs : cherchez son sommet.`;
          },
          solution: { prix: m.prix, production: m.production, sousTraitance: 0 },
        };
      },
      explication: (c, p) => {
        const k = decision(c);
        const x = trimestreDeDecision(k.f, { prix: p.prix!, production: p.production!, sousTraitance: p.sousTraitance! });
        return [
          `À ${eur(x.prix)}, la demande est de ${qte(x.demande)} enceintes, toutes fabriquées et vendues : ${eur(x.resultat)} de résultat, contre ${eur(k.base.resultat)} au trimestre joué et ${eur(Math.max(...k.trois.map((t) => t.resultat)))} au meilleur des trois prix envisagés. Ni ${eur(k.bas.prix)}, ni ${eur(k.d.prix)}, ni ${eur(k.haut.prix)} : le meilleur prix se trouve entre deux, au sommet de la courbe.`,
          `Le résultat selon le prix n'est pas une droite. Monter le prix fait gagner sur chaque enceinte vendue et perdre des enceintes : tant que le gain l'emporte, le résultat monte, puis il redescend. Et un plan de production qui ne suit pas le prix laisse soit des clients sans réponse, soit du stock.`,
        ];
      },
    },
    {
      id: "les-trois-prix",
      type: "montants",
      titre: "Le trimestre aux trois prix",
      notions: ["price_elasticity", "contribution_margin"],
      question: (c) => {
        const k = decision(c);
        return `Sans formule : au plan de production du trimestre (${qte(k.d.production)} enceintes fabriquées, sans sous-traitance), calculez la demande et le résultat d'exploitation à −${pct(k.e)} et à +${pct(k.e)}.`;
      },
      champs: (c) => {
        const k = decision(c);
        const ligne = (t: Decision["base"], signe: string) => [
          { libelle: `Enceintes demandées à ${signe}${pct(k.e)}`, attendu: t.demande, calcul: `${qte(k.d.demande.aPrixNul)} − ${qte(k.d.demande.perdueParEuro)} × ${eur(t.prix)}, à l'enceinte inférieure = ${qte(t.demande)}` },
          {
            libelle: `Résultat d'exploitation à ${signe}${pct(k.e)}`,
            attendu: t.resultat,
            calcul: `${qte(t.ventes)} vendues (la plus petite de ${qte(t.demande)} et ${qte(t.production)}) × (${eur(t.prix)} − ${eur(k.cv)}) − ${eur(k.d.chargesFixes)} = ${eur(t.resultat)}`,
          },
        ];
        return [...ligne(k.bas, "−"), ...ligne(k.haut, "+")];
      },
      explication: (c) => {
        const k = decision(c);
        return [
          `À −${pct(k.e)}, la demande monte à ${qte(k.bas.demande)} enceintes, mais les ventes restent à ${qte(k.bas.ventes)} : ${qte(k.bas.nonServie)} clients repartent sans enceinte. À +${pct(k.e)}, la demande tombe à ${qte(k.haut.demande)} : toute la demande est servie, et ${qte(k.haut.stock)} enceintes fabriquées restent en stock.`,
        ];
      },
    },
    {
      id: "ce-qui-borne",
      type: "choix",
      titre: "Ce qui borne les ventes",
      notions: ["price_elasticity", "capacity"],
      tableau: tableauDesTroisPrix,
      question: (c) => {
        const k = decision(c);
        return `À −${pct(k.e)}, la demande monte à ${qte(k.bas.demande)} enceintes, mais les ventes restent à ${qte(k.bas.ventes)}. Qu'est-ce qui les borne ?`;
      },
      options: (c) => {
        const k = decision(c);
        const plan = k.bas.nonServie > 0;
        return [
          {
            texte: "Le plan de production : le marché demandait plus que ce qui était fabriqué",
            juste: plan,
            retour: plan
              ? `Oui : ${qte(k.bas.nonServie)} enceintes demandées n'ont pas été servies. Baisser le prix sans produire plus, c'est vendre moins cher les mêmes enceintes : ${eur(k.ecartDeMarge)} de marge perdus, sans une vente de plus.`
              : "Non : toute la demande a été servie, rien n'est resté sur la table.",
          },
          {
            texte: "La capacité de la ligne de montage",
            juste: false,
            retour: `Non : la ligne peut fabriquer ${qte(k.d.capacite)} enceintes, et le plan n'en a lancé que ${qte(k.d.production)}. C'est le plan qui borne, pas la capacité : il restait ${qte(k.restante)} enceintes de capacité.`,
          },
          {
            texte: "La demande : les clients n'achètent pas autant de plus que la baisse l'exigerait",
            juste: !plan,
            retour: plan
              ? k.bas.demande >= k.volume
                ? `Non : la demande était là, ${qte(k.bas.demande)} enceintes, plus que les ${qte(k.volume)} qu'il fallait. Elle n'a pas été servie faute de production.`
                : `Pas d'abord : la demande, ${qte(k.bas.demande)} enceintes, n'atteint pas non plus les ${qte(k.volume)} qu'il faudrait ; mais ce qui borne les ventes ce trimestre, c'est le plan, qui n'en fabrique que ${qte(k.d.production)}.`
              : "Oui : toute la demande a été servie, et elle n'a pas assez grandi.",
          },
        ];
      },
    },
    {
      id: "meilleur-prix",
      type: "choix",
      titre: "Le meilleur des trois prix",
      notions: ["price_elasticity", "contribution_margin"],
      tableau: tableauDesTroisPrix,
      question: (c) => {
        const k = decision(c);
        return `Des trois prix envisagés, au plan de production du trimestre, lequel donne à ${k.f.entreprise} le meilleur résultat d'exploitation ?`;
      },
      options: (c) => {
        const k = decision(c);
        const meilleur = [...k.trois].sort((a, b) => b.resultat - a.resultat)[0]!;
        return k.trois.map((t, i) => ({
          texte: `${LIBELLES(k.e)[i]} (${eur(t.prix)})`,
          juste: t === meilleur,
          retour:
            t === meilleur
              ? `Oui : ${eur(t.resultat)} de résultat d'exploitation, le meilleur des trois. ${t === k.base ? "Plus bas, chaque enceinte rapporte moins sans une vente de plus ; plus haut, les clients perdus coûtent plus que ce que rapportent les autres." : "Les clients perdus coûtent moins que ce que rapportent les autres, payés plus cher."}${t.stock > 0 ? ` Mais ${qte(t.stock)} enceintes restent en stock.` : ""} Le laboratoire a trouvé mieux : ${eur(k.meilleur.resultat)} à ${eur(k.meilleur.prix)}, la production ajustée à la demande.`
              : `${eur(t.resultat)} de résultat d'exploitation, pour ${eur(meilleur.resultat)} au meilleur des trois.`,
        }));
      },
    },
    {
      id: "le-prix-optimal",
      type: "montants",
      titre: "Le meilleur prix, par le calcul",
      notions: ["price_elasticity", "contribution_margin"],
      question: (c) => {
        const k = decision(c);
        return `Retrouvez par le calcul le sommet de la courbe du laboratoire. Quand toute la demande est fabriquée, le résultat du trimestre est un polynôme du second degré du prix p : (${qte(k.d.demande.aPrixNul)} − ${qte(k.d.demande.perdueParEuro)} × p) × (p − ${eur(k.cv)}) − ${eur(k.d.chargesFixes)}. Calculez le prix qui le rend le plus grand, au centime, la demande à ce prix, puis le résultat du trimestre.`;
      },
      champs: (c) => {
        const k = decision(c);
        const prixNul = auCentime(k.d.demande.aPrixNul / k.d.demande.perdueParEuro);
        return [
          {
            libelle: "Prix qui rend le résultat le plus grand",
            attendu: k.prixOptimal,
            calcul: `Le sommet est au milieu des deux prix où le résultat avant charges fixes s'annule, ${eur(prixNul)} (plus de demande) et ${eur(k.cv)} (plus de marge) : (${qte(k.d.demande.aPrixNul)} ÷ ${qte(k.d.demande.perdueParEuro)} + ${qte(k.cv)}) ÷ 2 ≈ ${eur(k.prixOptimal)}`,
          },
          { libelle: "Enceintes demandées à ce prix", attendu: k.demandeOptimale, tolerance: 3, calcul: `${qte(k.d.demande.aPrixNul)} − ${qte(k.d.demande.perdueParEuro)} × ${eur(k.prixOptimal)}, à l'enceinte inférieure = ${qte(k.demandeOptimale)}` },
          {
            libelle: "Résultat du trimestre à ce prix",
            attendu: k.resultatOptimal,
            tolerance: 10,
            calcul: `${qte(k.demandeOptimale)} × (${eur(k.prixOptimal)} − ${eur(k.cv)}) − ${eur(k.d.chargesFixes)} = ${eur(k.resultatOptimal)}`,
          },
        ];
      },
      explication: (c) => {
        const k = decision(c);
        return [
          `Le calcul retrouve le laboratoire : ${eur(k.prixOptimal)}, ${qte(k.demandeOptimale)} enceintes, ${eur(k.resultatOptimal)}. Les charges fixes ne déplacent pas le sommet : elles abaissent toute la courbe du même montant. C'est la règle de la décision : seuls comptent les effets qui changent avec elle.`,
          `Une limite : la droite de demande est une hypothèse, ajustée sur trois points. Loin d'eux, rien ne dit que les clients répondent encore de la même façon.`,
        ];
      },
    },
    {
      id: "fabriquer-ou-acheter",
      type: "montants",
      titre: "Fabriquer ou acheter",
      notions: ["contribution_margin", "capacity", "make_or_buy"],
      question: (c) => {
        const k = decision(c);
        return `Retour au plan du trimestre. La ligne peut produire ${qte(k.d.capacite)} enceintes par trimestre ; elle en a produit ${qte(k.d.production)}. Une enceinte fabriquée coûte ${eur(k.cv)} de coût variable ; le sous-traitant la livre finie à ${eur(k.d.coutDuSousTraitant)}. Calculez la capacité restante, puis la marge d'une enceinte vendue ${eur(k.d.prix)}, fabriquée, puis sous-traitée.`;
      },
      champs: (c) => {
        const k = decision(c);
        return [
          { libelle: "Capacité restante du trimestre", attendu: k.restante, calcul: `${qte(k.d.capacite)} − ${qte(k.d.production)} = ${qte(k.restante)} enceintes` },
          { libelle: "Marge d'une enceinte fabriquée", attendu: k.base.margeFabriquee, calcul: `${eur(k.d.prix)} − ${eur(k.cv)} = ${eur(k.base.margeFabriquee)}` },
          { libelle: "Marge d'une enceinte sous-traitée", attendu: k.base.margeSousTraitee, calcul: `${eur(k.d.prix)} − ${eur(k.d.coutDuSousTraitant)} = ${eur(k.base.margeSousTraitee)}` },
        ];
      },
      explication: () => [
        "Les charges fixes ne comptent pas : le local, l'équipe et la ligne sont payés qu'on fabrique ou non. Ce qui départage, c'est le coût de chaque enceinte de plus : son coût variable si on la fabrique, le prix du sous-traitant si on l'achète.",
      ],
    },
    {
      id: "la-commande",
      type: "choix",
      titre: "La commande au-delà de la capacité",
      notions: ["contribution_margin", "capacity", "make_or_buy"],
      question: (c) => {
        const k = decision(c);
        return `Un client commande ${qte(k.commande)} enceintes de plus ce trimestre, au prix de ${eur(k.d.prix)}. Il reste de quoi en fabriquer ${qte(k.restante)}. Que fait ${k.f.entreprise} ?`;
      },
      options: (c) => {
        const k = decision(c);
        const b = k.base;
        const surcout = auCentime(k.d.coutDuSousTraitant - k.cv);
        return [
          {
            texte: `Elle fabrique ${qte(k.fabriquee)} enceintes et fait sous-traiter les ${qte(k.soustraitee)} autres`,
            juste: true,
            retour: `Oui : ${qte(k.fabriquee)} × ${eur(b.margeFabriquee)} + ${qte(k.soustraitee)} × ${eur(b.margeSousTraitee)} = ${eur(k.gainDeLaCommande)} de marge en plus. Fabriquer d'abord, parce que c'est moins cher tant qu'il reste de la capacité ; sous-traiter ensuite, parce qu'une enceinte sous-traitée rapporte encore ${eur(b.margeSousTraitee)}.`,
          },
          {
            texte: "Elle fait tout sous-traiter : c'est plus simple",
            juste: false,
            retour: `Chaque enceinte sous-traitée alors qu'elle pouvait être fabriquée coûte ${eur(surcout)} de marge : ${eur(auCentime(k.fabriquee * surcout))} perdus sur la commande.`,
          },
          {
            texte: "Elle n'accepte que ce qu'elle peut fabriquer : sous-traiter rapporte trop peu",
            juste: false,
            retour: `Une enceinte sous-traitée rapporte encore ${eur(b.margeSousTraitee)} : refuser les ${qte(k.soustraitee)} dernières, c'est laisser ${eur(auCentime(k.soustraitee * b.margeSousTraitee))} de marge, et un client mécontent.`,
          },
        ];
      },
    },
    {
      id: "predire-la-commande",
      type: "choix",
      titre: "Pariez sur une commande sous le coût complet",
      notions: ["contribution_margin", "full_unit_cost", "price_floor"],
      question: (c) => {
        const k = decision(c);
        const x = k.commandeExceptionnelle;
        return `Un autre trimestre, ${k.f.entreprise} sert toute sa demande à ${eur(k.d.prix)}, ${qte(k.servie)} enceintes : il reste ${qte(k.restanteServie)} enceintes de capacité. Une enseigne propose ${qte(x.quantite)} enceintes à ${eur(x.prix)}, tout ou rien. En janvier, une enceinte coûtait ${eur(k.coutDeRevientDeJanvier)} en coût complet. Pariez : cette commande…`;
      },
      options: () => {
        const voir = "Faites varier son prix à l'étape suivante : le curseur montre où elle commence à rapporter.";
        return [
          { texte: "Peut rapporter : seul compte ce qu'elle rapporte face à ce qu'elle coûte en plus", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Fait perdre : son prix ne couvre pas le coût complet", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Fait perdre : son prix est sous celui du trimestre", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-prix-plancher",
      type: "curseur",
      titre: "Le prix plancher de la commande",
      notions: ["contribution_margin", "price_floor", "make_or_buy"],
      question: (c) => {
        const k = decision(c);
        const x = k.commandeExceptionnelle;
        return `La ligne fabrique ${qte(k.xFabriquee)} enceintes de la commande, le sous-traitant les ${qte(k.xSousTraitee)} autres à ${eur(k.d.coutDuSousTraitant)}. Faites varier le prix proposé pour les ${qte(x.quantite)} enceintes, à l'euro. Placez le curseur sur le plus petit prix où la commande couvre ce qu'elle coûte en plus, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix d'une enceinte de la commande, à l'euro", unite: "€" }),
      cible: (c) => ({ attendu: decision(c).prixPlancherEntier, min: PRIX_DU_CURSEUR_PLANCHER.min, max: PRIX_DU_CURSEUR_PLANCHER.max }),
      zones: ["La commande rapporte", "La commande coûte"],
      rates: () => ({
        dessous: "À ce prix, la commande rapporte moins qu'elle ne coûte en plus.",
        dessus: "Un prix plus bas couvrirait encore la commande : cherchez le plus petit.",
      }),
      montrer: "Montrer le prix plancher",
      lecture: (c, p) => {
        const k = decision(c);
        const ca = auCentime(k.commandeExceptionnelle.quantite * p);
        return [
          { libelle: "Chiffre d'affaires de la commande", montant: ca },
          { libelle: "Ce qu'elle coûte en plus (fabriqué et sous-traité)", montant: k.coutDeLaCommande },
          { libelle: "Marge de la commande", montant: auCentime(ca - k.coutDeLaCommande), fort: true },
        ];
      },
      droites: (c) => {
        const k = decision(c);
        return { produit: (p) => k.commandeExceptionnelle.quantite * p, cout: () => k.coutDeLaCommande, libelles: ["Chiffre d'affaires de la commande", "Ce qu'elle coûte en plus"] };
      },
      explication: (c) => {
        const k = decision(c);
        const x = k.commandeExceptionnelle;
        return [
          `À ${eur(k.prixPlancherEntier - 1)}, la commande coûte plus qu'elle ne rapporte ; à ${eur(k.prixPlancherEntier)}, elle rapporte. Le prix plancher se trouve entre les deux : ce qu'elle coûte en plus, ${eur(k.coutDeLaCommande)}, divisé par ${qte(x.quantite)} enceintes. À ${eur(x.prix)}, très au-dessus, la commande rapporte, bien que sous le coût complet de janvier : les charges fixes sont déjà payées par les autres ventes.`,
        ];
      },
    },
    {
      id: "la-commande-exceptionnelle",
      type: "montants",
      titre: "La commande exceptionnelle",
      notions: ["contribution_margin", "make_or_buy", "price_floor", "capacity"],
      question: (c) => {
        const k = decision(c);
        const x = k.commandeExceptionnelle;
        return `Formalisez : pour les ${qte(x.quantite)} enceintes à ${eur(x.prix)}, calculez la marge des enceintes que la ligne fabrique, celle des enceintes sous-traitées (négative si elles coûtent plus qu'elles ne rapportent), la marge de la commande entière, puis son prix plancher au centime.`;
      },
      champs: (c) => {
        const k = decision(c);
        const x = k.commandeExceptionnelle;
        return [
          { libelle: "Marge des enceintes fabriquées", attendu: k.margeXFabriquee, calcul: `${qte(k.xFabriquee)} × (${eur(x.prix)} − ${eur(k.cv)}) = ${eur(k.margeXFabriquee)}, la capacité restante étant ${qte(k.d.capacite)} − ${qte(k.servie)}` },
          { libelle: "Marge des enceintes sous-traitées", attendu: k.margeXSousTraitee, calcul: `${qte(k.xSousTraitee)} × (${eur(x.prix)} − ${eur(k.d.coutDuSousTraitant)}) = ${eur(k.margeXSousTraitee)}` },
          { libelle: "Marge de la commande entière", attendu: k.margeDeLaCommande, calcul: `${eur(k.margeXFabriquee)} + ${entre(k.margeXSousTraitee)} = ${eur(k.margeDeLaCommande)}` },
          { libelle: "Prix plancher de la commande", attendu: k.prixPlancher, calcul: `(${qte(k.xFabriquee)} × ${eur(k.cv)} + ${qte(k.xSousTraitee)} × ${eur(k.d.coutDuSousTraitant)}) ÷ ${qte(x.quantite)} = ${eur(k.coutDeLaCommande)} ÷ ${qte(x.quantite)} ≈ ${eur(k.prixPlancher)}` },
        ];
      },
      explication: (c) => {
        const k = decision(c);
        return [
          `Tout ou rien, la commande rapporte ${eur(k.margeDeLaCommande)} : à accepter. Mais les ${qte(k.xSousTraitee)} enceintes sous-traitées coûtent ${eur(-k.margeXSousTraitee)} : si l'enseigne acceptait une livraison partielle, ${qte(k.xFabriquee)} enceintes rapporteraient ${eur(k.margeXFabriquee)}, davantage. Le prix plancher, ${eur(k.prixPlancher)}, est une moyenne du coût variable et du prix du sous-traitant, pondérée par ce que chacun fournit.`,
        ];
      },
    },
    {
      id: "sans-sous-traitant",
      type: "choix",
      titre: "Sans sous-traitant : la capacité, facteur rare",
      notions: ["capacity", "contribution_margin", "full_unit_cost"],
      question: (c) => {
        const k = decision(c);
        const x = k.commandeExceptionnelle;
        return `Variante : ce trimestre, le sous-traitant est complet. L'enseigne veut ses ${qte(x.quantite)} enceintes à ${eur(x.prix)}, tout ou rien. Pour la servir, ${k.f.entreprise} devrait renoncer à ${qte(k.sansSousTraitant.chassees)} ventes à ${eur(k.d.prix)} : la ligne ne fabrique pas plus de ${qte(k.d.capacite)} enceintes. Que décidez-vous ?`;
      },
      options: (c) => {
        const k = decision(c);
        const s = k.sansSousTraitant;
        const x = k.commandeExceptionnelle;
        return [
          {
            texte: `Accepter : ${eur(s.net)} de plus, une fois perdue la marge des ventes qu'elle chasse`,
            juste: s.net > 0,
            retour: `Oui. La commande apporte ${qte(x.quantite)} × ${eur(auCentime(x.prix - k.cv))} = ${eur(s.margeDeLaCommande)}, mais chasse ${qte(s.chassees)} ventes qui rapportaient ${eur(k.base.margeFabriquee)} chacune, ${eur(s.margeChassee)} : c'est le coût d'opportunité de la capacité. Il reste ${eur(s.net)}. Quand la capacité manque, une enceinte se juge face à la vente dont elle prend la place.`,
          },
          {
            texte: `Accepter : ${eur(s.margeDeLaCommande)} de marge en plus, à ${eur(auCentime(x.prix - k.cv))} l'enceinte`,
            juste: false,
            retour: `Non : c'est oublier les ${qte(s.chassees)} ventes à ${eur(k.d.prix)} que la commande chasse. Leur marge, ${eur(s.margeChassee)}, est perdue : la commande ne rapporte que ${eur(s.net)} en net.`,
          },
          {
            texte: `Refuser : ${eur(x.prix)} ne couvrent pas le coût complet d'une enceinte, ${eur(k.coutDeRevientDeJanvier)}`,
            juste: false,
            retour: "Non : c'est traiter les charges fixes comme des variables. Le loyer, la paie et l'usure de la ligne sont payés, commande ou pas ; seul compte ce que la commande ajoute et retire.",
          },
          {
            texte: `Refuser : une vente chassée perd ${eur(k.base.margeFabriquee)}, plus que les ${eur(auCentime(x.prix - k.cv))} d'une enceinte de la commande`,
            juste: false,
            retour: `Non : la comparaison unité par unité oublie que ${qte(k.restanteServie)} enceintes de la commande prennent une capacité libre, qui ne chasse rien. Seules ${qte(s.chassees)} chassent une vente ; au total, la commande rapporte ${eur(s.net)}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["contribution_margin", "price_elasticity", "make_or_buy"],
      tableau: (c) => {
        const k = decision(c);
        const optimal = trimestreDeDecision(k.f, { prix: k.prixOptimal, production: k.demandeOptimale });
        const cols = [...k.trois, optimal];
        const ligne = (libelle: string, val: (t: Decision["base"]) => string) => ({ libelle, valeurs: cols.map(val) });
        return {
          titre: `Le premier trimestre ${dE(k.f.entreprise)}, quatre décisions`,
          colonnes: [...LIBELLES(k.e), "Prix du sommet, production ajustée"],
          lignes: [
            ligne("Prix d'une enceinte", (t) => eur(t.prix)),
            ligne("Enceintes fabriquées", (t) => qte(t.production)),
            ligne("Enceintes vendues", (t) => qte(t.ventes)),
            ligne("Demande non servie", (t) => qte(t.nonServie)),
            ligne("Enceintes en stock", (t) => qte(t.stock)),
            ligne("Résultat d'exploitation", (t) => eur(t.resultat)),
          ],
        };
      },
      texte: (c) => {
        const k = decision(c);
        return [
          `Décider, c'est comparer ce qui change : la marge de chaque enceinte, le volume que le marché accepte, la capacité qui borne. Chez ${k.f.entreprise}, le meilleur des trois prix envisagés donnait ${eur(Math.max(...k.trois.map((t) => t.resultat)))} ; le prix du sommet, ${eur(k.prixOptimal)} avec une production ajustée à la demande, en donne ${eur(k.resultatOptimal)}.`,
          `Fabriquer ou acheter se joue au coût de l'enceinte de plus : son coût variable tant qu'il reste de la capacité, le prix du sous-traitant au-delà. Une commande sous le coût complet peut rapporter ; quand la capacité manque, elle se juge face à la marge des ventes qu'elle chasse.`,
          "Au niveau de l'examen, vous savez calculer l'effet différentiel d'un prix, le volume qu'une baisse exige, le prix qui maximise le résultat sur une demande linéaire, le choix de fabriquer ou de sous-traiter, et le prix plancher d'une commande, avec ou sans capacité libre.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Volume à vendre après une baisse de prix = marge à garder ÷ nouvelle marge unitaire. Fabriquer ou acheter : coût variable de l'unité fabriquée face au prix du sous-traitant, dans la limite de la capacité. Commande exceptionnelle : elle se prend si sa marge différentielle, coût d'opportunité compris, est positive.",
    },
  ],
};
