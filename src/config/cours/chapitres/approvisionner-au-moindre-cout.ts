import { arrondi2, eur, nombreAuCentieme, pct as pourcent } from "../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  ALEA_DU_DELAI,
  COMMANDES_D_AUJOURD_HUI,
  COUT_DE_PASSATION,
  POSSESSION,
  PRIX_DU_JEU,
  SEMAINES_PAR_AN,
  TABLE_DE_LA_LOI_NORMALE,
  TARIF_DEGRESSIF,
  consommationDeNPlus1,
  consommationDuDelai,
  coutPourNCommandes,
  coutTotalDApprovisionnement,
  meilleurNombreDeCommandes,
  risqueDeRupture,
  rupturesParAn,
  securiteAuRisque,
  securiteParLaTable,
  tableauDesTranches,
  troisJoursFaceALaLoi,
  wilson,
} from "../monde/approvisionnement-de-nova";
import { DELAI_DU_FOURNISSEUR } from "../monde/production-et-logistique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : APPROVISIONNER AU MOINDRE COÛT (contrôle de gestion, palier 4 ; DCG UE11 § 3.2, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/approvisionnement-de-nova.ts) : les jeux de
 * composants de NOVA en N + 1, 26 000 jeux, la production de N + 1 des chapitres de la capacité, à
 * 22 € chez Électro-Composants Lyon, livrés en 6 jours. Trois questions :
 *   · LE MODÈLE DE WILSON, SANS PÉNURIE : combien commander à la fois, et combien de fois par an ?
 *     13 commandes de 2 000 jeux, contre 12 aujourd'hui ;
 *   · LE TARIF DÉGRESSIF : le coût total d'approvisionnement (achat et gestion) de chaque tranche, la
 *     tranche de 1 % retenue, 10 commandes de 2 600 jeux ;
 *   · L'AVENIR ALÉATOIRE : la consommation pendant le délai suit une loi normale ; le stock de
 *     sécurité qui tient un risque de rupture de 5 % par commande, 83 jeux, et le point de commande.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui du DCG) :
 *   · guidé : le-cout-d-aujourd-hui (les formules sont dans la question), le-point-de-commande ;
 *   · l'expérience avant la formule : predire-la-cadence puis le-laboratoire-de-wilson avant
 *     la-formule-de-wilson ; predire-la-remise puis le-laboratoire-du-tarif avant le-tableau-des-
 *     tranches ; predire-le-risque puis le-laboratoire-du-stock-de-securite avant la table ;
 *   · autonome : la-formule-de-wilson, le-tableau-des-tranches, la-securite-par-la-table ;
 *   · expert : trois-jours-ou-la-loi (deux protections, deux aléas), un-service-a-99 (ce que coûte un
 *     risque plus faible) ; puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le coût de possession d'un jeu se donne au centime (2,58 € et
 * non 2,578 €, monde/approvisionnement-de-nova.ts) ; Q* s'écrit à deux décimales, puis se commande
 * à l'unité la plus proche, et le corrigé dit pourquoi ; la quantité d'une commande sur douze monte
 * à l'unité supérieure ; les stocks de sécurité et points de commande sont des quantités, à l'unité
 * supérieure ; le nombre de commandes, la période, les jours entre deux commandes et les ruptures
 * attendues sont des grandeurs au centième ; les coûts du tableau des tranches attendent le centime
 * (à 5 centimes près, avant).
 */

/** Le chapitre se joue chez NOVA : ses jeux de composants, son fournisseur et son délai sont ceux du monde du cours. */
export const ENTREPRISES_DE_L_APPROVISIONNEMENT: readonly string[] = ["nova"];

/** Le laboratoire de Wilson : le nombre de commandes par an. */
export const COMMANDES_DU_LABORATOIRE = { min: 1, max: 26, pas: 1 } as const;

/** Le laboratoire du tarif : la quantité commandée à la fois, en jeux. */
export const QUANTITES_DU_LABORATOIRE = { min: 1_000, max: 13_000, pas: 100 } as const;

/** Le laboratoire du stock de sécurité, en jeux. */
export const SECURITES_DU_LABORATOIRE = { min: 0, max: 200, pas: 1 } as const;

/** Le taux de service du chapitre expert. */
export const SERVICE_EXPERT = 0.99;

const qte = nombreAuCentieme;
const pct = (p: number) => pourcent(p * 100);
/** Un coefficient de la table de la loi normale, tel que la table l'écrit : « 1,645 ». */
const coef = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 4 });

const donnee = (valeur: number, unite?: string, texte?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}), ...(texte ? { texte } : {}) });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

let memoire: ReturnType<typeof calculerLApprovisionnement> | null = null;

/** Tout ce que le chapitre lit, calculé une fois (les données sont figées : le résultat se garde). */
export function approvisionnement() {
  memoire ??= calculerLApprovisionnement();
  return memoire;
}

function calculerLApprovisionnement() {
  const conso = consommationDeNPlus1();
  const aujourdhui = coutPourNCommandes(COMMANDES_D_AUJOURD_HUI);
  const w = wilson();
  const tranches = tableauDesTranches();
  const delai = consommationDuDelai();
  const table = securiteParLaTable();
  const expert = securiteParLaTable(SERVICE_EXPERT);
  const trois = troisJoursFaceALaLoi();
  return { conso, aujourdhui, w, tranches, retenue: tranches.meilleure, delai, table, expert, trois };
}

/** Les données du chapitre. */
function tableauDesDonnees(): TableauDeDonnees {
  const { conso } = approvisionnement();
  return {
    titre: "Les jeux de composants de N + 1",
    colonnes: ["Donnée"],
    lignes: [
      { libelle: "Jeux consommés, trimestre par trimestre", valeurs: [conso.trimestres.map((x) => qte(x)).join(" ; ")] },
      { libelle: "Jeux consommés sur l'année (D)", valeurs: [qte(conso.annee)] },
      { libelle: "Prix d'un jeu", valeurs: [eur(PRIX_DU_JEU)] },
      { libelle: "Coût de passation d'une commande", valeurs: [eur(COUT_DE_PASSATION)] },
      { libelle: "Taux de possession, par an", valeurs: [pct(POSSESSION.taux)] },
      { libelle: "Coût physique d'un jeu en stock, par an", valeurs: [eur(POSSESSION.physiqueParJeu)] },
      { libelle: "Délai de livraison", valeurs: [`${qte(DELAI_DU_FOURNISSEUR)} jours de montage`] },
    ],
  };
}

/** Le tarif du fournisseur. */
function tableauDuTarif(): TableauDeDonnees {
  return {
    titre: "Le tarif dégressif d'Électro-Composants",
    colonnes: ["Prix du jeu", "Remise"],
    lignes: TARIF_DEGRESSIF.map((t, i) => {
      const suivante = TARIF_DEGRESSIF[i + 1];
      const libelle = i === 0 ? `Moins de ${qte(suivante!.des)} jeux par commande` : suivante ? `De ${qte(t.des)} à ${qte(suivante.des - 1)} jeux` : `${qte(t.des)} jeux et plus`;
      return { libelle, valeurs: [eur(t.prix), t.remise ? pct(t.remise) : "aucune"] };
    }),
  };
}

/** La table de la loi normale centrée réduite. */
function tableauDeLaLoi(): TableauDeDonnees {
  return {
    titre: "La loi normale centrée réduite : la valeur t telle que P(T ≤ t) vaut le taux de service",
    colonnes: ["t"],
    lignes: TABLE_DE_LA_LOI_NORMALE.map((x) => ({ libelle: `Taux de service de ${pct(x.service)}`, valeurs: [qte(x.t)] })),
  };
}

/** Le tableau des tranches, à compléter. */
function grilleDesTranches(): TableauACompleter {
  const { tranches } = approvisionnement();
  return {
    titre: "Le coût total d'approvisionnement, tranche par tranche",
    colonnes: ["Prix du jeu", "Q* à ce prix", "Quantité retenue", "Achat de l'année", "Gestion du stock", "Coût total"],
    colonneDeTotal: 5,
    lignes: tranches.lignes.map((l, i) => {
      const nom = i === 0 ? "Tranche à 22 €" : `Tranche de ${pct(l.tranche.remise)}`;
      const retenue = l.dedans ? `Q* tombe dans la tranche : ${qte(l.retenue)} jeux` : `Q* est sous la tranche, qui commence à ${qte(l.tranche.des)} : on retient sa borne, ${qte(l.retenue)} jeux`;
      return {
        libelle: nom,
        cellules: [
          { ...donnee(l.prix), horsTotal: true },
          aSaisir(l.qEtoile, `√(2 × ${qte(l.D)} × ${qte(COUT_DE_PASSATION)} ÷ ${eur(l.cs)}) = ${qte(l.qEtoileExacte)}, à l'unité : ${qte(l.qEtoile)}`, { unite: "jeux", nature: "quantite", horsTotal: true, indice: "√(2 D cl ÷ cs), avec cs au prix de la tranche" }),
          aSaisir(l.retenue, retenue, { unite: "jeux", nature: "quantite", horsTotal: true, indice: "Q* s'il tombe dans la tranche, sinon la borne de la tranche" }),
          aSaisir(l.achat, `${qte(l.D)} × ${eur(l.prix)} = ${eur(l.achat)}`, { indice: "les jeux de l'année au prix de la tranche" }),
          aSaisir(l.total, `${qte(l.commandes)} × ${eur(COUT_DE_PASSATION)} + ${qte(l.stockMoyen)} × ${eur(l.cs)} = ${eur(l.total)}`, { indice: "la passation des commandes et la possession du stock moyen" }),
          aSaisir(l.totalDApprovisionnement, `${eur(l.achat)} + ${eur(l.total)} = ${eur(l.totalDApprovisionnement)}`, { indice: "l'achat plus la gestion du stock" }),
        ],
      };
    }),
  };
}

export const APPROVISIONNER_AU_MOINDRE_COUT: Chapitre = {
  code: "approvisionner-au-moindre-cout",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "Approvisionner au moindre coût",
  accroche:
    "NOVA commande ses jeux de composants une fois par mois. Est-ce le moindre coût ? Le modèle de Wilson, le tarif dégressif du fournisseur, puis la loi normale pour le stock de sécurité : combien commander, quand, et avec quelle réserve.",
  objectifs: [
    "Calculer le coût de gestion d'un stock et la quantité économique de Wilson",
    "Choisir une quantité à commander face à un tarif dégressif, par le coût total d'approvisionnement",
    "Calculer un point de commande et un stock de sécurité pour un risque de rupture donné",
    "Arbitrer entre le coût de possession d'un stock de sécurité et le risque de rupture",
  ],
  libre: false,
  prerequis: ["des-ventes-aux-achats"],
  ensuite: ["equilibrer-la-tresorerie"],
  entreprises: {
    codes: ENTREPRISES_DE_L_APPROVISIONNEMENT,
    pourquoi: "les approvisionnements se calculent ici sur les jeux de composants de NOVA, que la simulation du cours tient d'un bout à l'autre ; la méthode vaut pour toute entreprise qui achète pour produire.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une commande par mois, est-ce le moindre coût ?",
      notions: ["stock"],
      tableau: () => tableauDesDonnees(),
      texte: () => {
        const { conso } = approvisionnement();
        return [
          `En N + 1, la ligne montera ${qte(conso.annee)} enceintes : ${qte(conso.annee)} jeux de composants à acheter à Électro-Composants. Comme en N, NOVA les commande une fois par mois, ${qte(COMMANDES_D_AUJOURD_HUI)} commandes par an.`,
          "Chaque commande coûte : la saisie, le contrôle à réception, le transport. Chaque jeu en stock coûte aussi : l'argent qu'il immobilise et la place qu'il prend. Commander souvent multiplie les premiers ; commander gros gonfle les seconds.",
          "Le modèle de Wilson cherche l'équilibre, en supposant une consommation régulière et une livraison sans attente, donc sans rupture. Puis on lèvera ces hypothèses : un tarif qui baisse avec la quantité, une consommation qui varie.",
        ];
      },
      repere: () => "D : la consommation de l'année ; Q : la quantité d'une commande ; n = D ÷ Q commandes ; stock moyen = Q ÷ 2 ; cs : le coût de possession d'un jeu pendant un an.",
    },
    {
      id: "predire-la-cadence",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur la cadence",
      notions: ["stock"],
      question: () => "Commander plus souvent baisse le stock moyen, mais multiplie les commandes. Avant de calculer, pariez : le coût de gestion le plus bas est atteint…",
      options: () => [
        { texte: "Là où passation et possession s'égalent", juste: true, retour: "Bon pari : le laboratoire suivant le montre. Une passation qui monte, une possession qui descend : leur somme est la plus basse à leur croisement." },
        { texte: "Avec une seule commande par an : une seule passation", juste: false, retour: "Non : une commande de toute l'année laisserait un stock moyen de la moitié de l'année, cher à posséder." },
        { texte: "Avec une commande par semaine : presque aucun stock à payer", juste: false, retour: `Non : le stock moyen fond, mais ${qte(SEMAINES_PAR_AN)} passations coûtent bien plus que ce qu'il économise.` },
      ],
    },
    {
      id: "le-cout-d-aujourd-hui",
      objectifs: [0],
      type: "montants",
      titre: "Ce que coûte une commande par mois",
      notions: ["stock"],
      question: () =>
        `Calculez cs = ${pct(POSSESSION.taux)} × ${eur(PRIX_DU_JEU)} + ${eur(POSSESSION.physiqueParJeu)}. Puis, pour ${qte(COMMANDES_D_AUJOURD_HUI)} commandes par an : la quantité d'une commande (D ÷ n), la passation (n × ${eur(COUT_DE_PASSATION)}), la possession (Q ÷ 2 × cs) et le coût de gestion.`,
      champs: () => {
        const { aujourdhui: a } = approvisionnement();
        return [
          { libelle: "Coût de possession d'un jeu par an (cs)", attendu: a.cs, calcul: `${pct(POSSESSION.taux)} × ${eur(PRIX_DU_JEU)} + ${eur(POSSESSION.physiqueParJeu)} = ${eur(a.cs)}` },
          { libelle: "Quantité d'une commande, en jeux", nature: "quantite", attendu: a.quantite, calcul: `${qte(a.D)} ÷ ${qte(a.commandes)} = ${qte(a.D / a.commandes)}, arrondi à l'unité supérieure : ${qte(a.quantite)} (des commandes d'un jeu de moins ne couvriraient pas l'année)` },
          { libelle: "Coût de passation de l'année", attendu: a.passation, calcul: `${qte(a.commandes)} × ${eur(COUT_DE_PASSATION)} = ${eur(a.passation)}` },
          { libelle: "Coût de possession de l'année", attendu: a.possession, calcul: `${qte(a.stockMoyen)} × ${eur(a.cs)} = ${eur(a.possession)}` },
          { libelle: "Coût de gestion du stock", attendu: a.total, calcul: `${eur(a.passation)} + ${eur(a.possession)} = ${eur(a.total)}` },
        ];
      },
      explication: () => {
        const { aujourdhui: a } = approvisionnement();
        return [`Une commande par mois coûte ${eur(a.total)} par an à gérer : la possession pèse plus que la passation. Commander un peu plus souvent devrait donc coûter moins.`];
      },
    },
    {
      id: "le-laboratoire-de-wilson",
      objectifs: [0],
      type: "simulation",
      titre: "Le laboratoire de Wilson",
      notions: ["stock"],
      question: () =>
        "Choisissez le nombre de commandes de l'année. Le tableau suit la quantité de chaque commande, la passation, la possession et leur somme ; le graphique les trace selon le nombre de commandes. Relevez le défi.",
      leviers: () => [{ code: "commandes", libelle: "Commandes par an", unite: "commandes", ...COMMANDES_DU_LABORATOIRE, depart: COMMANDES_D_AUJOURD_HUI }],
      lecture: (_, p) => {
        const c = coutPourNCommandes(p.commandes!);
        const depart = coutPourNCommandes(COMMANDES_D_AUJOURD_HUI);
        return [
          { libelle: "Quantité d'une commande", montant: Math.round(c.quantite * 100) / 100, unite: "jeux" },
          { libelle: "Coût de passation de l'année", montant: c.passation, reference: depart.passation },
          { libelle: "Coût de possession de l'année", montant: c.possession, reference: depart.possession },
          { libelle: "Coût de gestion du stock", montant: c.total, reference: depart.total, fort: true },
        ];
      },
      graphique: () => ({
        levier: "commandes",
        courbes: [
          { libelle: "Passation", valeur: (p) => coutPourNCommandes(p.commandes!).passation },
          { libelle: "Possession", valeur: (p) => coutPourNCommandes(p.commandes!).possession },
          { libelle: "Coût de gestion", valeur: (p) => coutPourNCommandes(p.commandes!).total },
        ],
      }),
      montrer: "Montrer la cadence",
      defi: () => {
        const n = meilleurNombreDeCommandes(COMMANDES_DU_LABORATOIRE.max);
        return {
          consigne: "Trouvez le nombre de commandes par an qui rend le coût de gestion le plus bas.",
          atteint: (p) => p.commandes === n,
          indice: (p) => {
            const ici = coutPourNCommandes(p.commandes!);
            return ici.possession > ici.passation ? "La possession pèse encore plus que la passation : commandez plus souvent." : "La passation pèse plus que la possession : commandez moins souvent.";
          },
          solution: { commandes: n },
        };
      },
      explication: (_, p) => {
        const c = coutPourNCommandes(p.commandes!);
        return [
          `À ${qte(p.commandes!)} commandes de ${qte(c.quantite)} jeux, la passation et la possession font chacune ${eur(c.passation)} : leur somme, ${eur(c.total)}, est au plus bas. Sur le graphique, c'est le croisement des deux courbes.`,
          "Autour de ce point, la courbe du coût est presque plate. L'étape suivante trouve la quantité sans tâtonner.",
        ];
      },
    },
    {
      id: "la-formule-de-wilson",
      objectifs: [0],
      type: "montants",
      titre: "La formule de Wilson",
      notions: ["stock"],
      question: () => "Calculez la quantité économique Q* = √(2 D cl ÷ cs), le nombre de commandes n* = D ÷ Q*, la période T* entre deux commandes, en semaines sur 52, et le coût de gestion à l'optimum.",
      champs: () => {
        const { w } = approvisionnement();
        return [
          { libelle: "Quantité économique Q*, en jeux", nature: "quantite", attendu: w.quantite, calcul: `√(2 × ${qte(w.D)} × ${qte(COUT_DE_PASSATION)} ÷ ${eur(w.cs)}) = ${qte(w.quantiteExacte)}, arrondi à l'unité la plus proche : ${qte(w.quantite)} jeux (on commande des jeux entiers, et le coût de gestion est plat autour de l'optimum)` },
          { libelle: "Nombre de commandes n*", nature: "grandeur", attendu: w.commandes, calcul: `${qte(w.D)} ÷ ${qte(w.quantite)} = ${qte(w.commandes)}` },
          { libelle: "Période T*, en semaines", nature: "grandeur", attendu: w.semaines, calcul: `${qte(SEMAINES_PAR_AN)} ÷ ${qte(w.commandes)} = ${qte(w.semaines)}` },
          { libelle: "Coût de gestion à l'optimum", attendu: w.total, calcul: `${eur(w.passation)} + ${eur(w.possession)} = ${eur(w.total)}` },
        ];
      },
      explication: () => {
        const { w } = approvisionnement();
        return [`La formule vient de là : la passation D cl ÷ Q égale la possession Q cs ÷ 2 quand Q² = 2 D cl ÷ cs. Elle confirme le laboratoire : ${qte(w.commandes)} commandes de ${qte(w.quantite)} jeux, une toutes les ${qte(w.semaines)} semaines.`];
      },
    },
    {
      id: "a-l-optimum",
      objectifs: [0],
      type: "choix",
      titre: "Ce que dit l'optimum",
      notions: ["stock"],
      question: () => {
        const { w, aujourdhui } = approvisionnement();
        return `L'optimum coûte ${eur(w.total)} par an ; la commande mensuelle, ${eur(aujourdhui.total)}, soit ${eur(aujourdhui.total - w.total)} de plus. Que retenir ?`;
      },
      options: () => [
        { texte: "Le coût est plat près de l'optimum", juste: true, retour: "Oui. Une erreur sur la quantité coûte peu tant qu'on reste près de Q* : un rythme mensuel, plus simple à suivre, se défend. Ce sont les erreurs fortes, une commande par an ou par semaine, qui coûtent." },
        { texte: `Il faut passer à ${qte(wilson().commandes)} commandes : c'est la seule bonne cadence`, juste: false, retour: "Non : le gain serait de quelques euros. Le modèle dit où est le fond de la courbe, pas qu'il faut y être au jour près." },
        { texte: "Le modèle se trompe : une commande par mois serait l'optimum", juste: false, retour: "Non : le calcul est juste, une commande par mois coûte un peu plus. Mais si peu que la simplicité peut l'emporter." },
      ],
    },
    {
      id: "predire-la-remise",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur la remise",
      notions: ["stock"],
      tableau: () => tableauDuTarif(),
      question: () => "Électro-Composants propose un tarif dégressif : plus la commande est grosse, moins le jeu coûte. Mais une grosse commande fait un gros stock. Avant de calculer, pariez : quelle quantité coûtera le moins, achat compris ?",
      options: () => {
        const { tranches, w } = approvisionnement();
        return [
          { texte: `${qte(TARIF_DEGRESSIF[1]!.des)} jeux, la remise de ${pct(TARIF_DEGRESSIF[1]!.remise)}`, juste: true, retour: `Bon pari, le laboratoire suivant le montre : ${pct(TARIF_DEGRESSIF[1]!.remise)} sur ${qte(tranches.meilleure.D)} jeux paie largement quelques jeux de plus en stock.` },
          { texte: `${qte(TARIF_DEGRESSIF[2]!.des)} jeux, la plus forte remise, ${pct(TARIF_DEGRESSIF[2]!.remise)}`, juste: false, retour: "Pas si vite : à cette quantité, le stock moyen grossit tant que sa possession mange la remise. Le laboratoire suivant le chiffre." },
          { texte: `${qte(w.quantite)} jeux, la quantité de Wilson, sans remise`, juste: false, retour: "Pas si vite : Wilson ne voit que la gestion du stock. Une remise sur tous les jeux de l'année pèse bien plus." },
        ];
      },
    },
    {
      id: "le-laboratoire-du-tarif",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire du tarif",
      notions: ["stock"],
      question: () =>
        "Choisissez la quantité de chaque commande. Le tableau suit le prix du jeu, l'achat de l'année, la gestion du stock et le coût total d'approvisionnement ; le graphique le trace selon la quantité, avec ses sauts aux seuils du tarif. Relevez le défi.",
      leviers: () => [{ code: "quantite", libelle: "Quantité d'une commande", unite: "jeux", ...QUANTITES_DU_LABORATOIRE, depart: wilson().quantite }],
      lecture: (_, p) => {
        const c = coutTotalDApprovisionnement(p.quantite!);
        const depart = coutTotalDApprovisionnement(wilson().quantite);
        return [
          { libelle: "Prix du jeu", montant: c.prix, reference: depart.prix },
          { libelle: "Achat de l'année", montant: c.achat, reference: depart.achat },
          { libelle: "Gestion du stock de l'année", montant: c.total, reference: depart.total },
          { libelle: "Coût total d'approvisionnement", montant: c.totalDApprovisionnement, reference: depart.totalDApprovisionnement, fort: true },
        ];
      },
      graphique: () => ({
        levier: "quantite",
        courbes: [{ libelle: "Coût total d'approvisionnement", valeur: (p) => coutTotalDApprovisionnement(p.quantite!).totalDApprovisionnement }],
      }),
      montrer: "Montrer la quantité",
      defi: () => {
        const { retenue } = approvisionnement();
        return {
          consigne: "Trouvez la quantité qui rend le coût total d'approvisionnement le plus bas.",
          atteint: (p) => Math.abs(p.quantite! - retenue.retenue) < 1e-9,
          indice: (p) => {
            const ici = coutTotalDApprovisionnement(p.quantite!);
            const plus = coutTotalDApprovisionnement(p.quantite! + QUANTITES_DU_LABORATOIRE.pas);
            if (plus.prix < ici.prix) return "Juste au-dessus, un seuil du tarif baisse le prix de tous les jeux de l'année : essayez-le.";
            return ici.prix < PRIX_DU_JEU && p.quantite! > TARIF_DEGRESSIF[1]!.des ? "Dans une tranche, chaque jeu de plus par commande grossit le stock : redescendez vers le seuil de la tranche." : "Regardez les seuils du tarif : la remise porte sur tous les jeux de l'année.";
          },
          solution: { quantite: retenue.retenue },
        };
      },
      explication: (_, p) => {
        const { tranches, retenue } = approvisionnement();
        const t3 = tranches.lignes[2]!;
        return [
          `À ${qte(p.quantite!)} jeux, le coût total tombe à ${eur(retenue.totalDApprovisionnement)} : la remise de ${pct(retenue.tranche.remise)} fait gagner ${eur(tranches.lignes[0]!.achat - retenue.achat)} d'achat, pour ${eur(retenue.total - tranches.lignes[0]!.total)} de gestion en plus.`,
          `À ${qte(t3.retenue)} jeux, la plus forte remise ne paie pas sa possession : ${eur(t3.totalDApprovisionnement)}. Dans chaque tranche, le minimum est à Q* s'il y tombe, sinon au seuil.`,
        ];
      },
    },
    {
      id: "le-tableau-des-tranches",
      objectifs: [1],
      type: "a-completer",
      titre: "Le tableau des tranches",
      notions: ["stock"],
      question: () =>
        "Pour chaque tranche : le Q* de son prix (cs y change avec le prix), la quantité retenue (Q* s'il tombe dans la tranche, sinon sa borne), l'achat de l'année, la gestion du stock et le coût total d'approvisionnement.",
      grille: () => grilleDesTranches(),
      explication: () => {
        const { tranches } = approvisionnement();
        return [
          `Les Q* des tranches remisées tombent sous leur seuil : on étudie chacune à sa borne. La tranche de ${pct(tranches.meilleure.tranche.remise)} l'emporte, ${eur(tranches.meilleure.totalDApprovisionnement)} pour l'année.`,
        ];
      },
    },
    {
      id: "le-choix-de-la-tranche",
      objectifs: [1],
      type: "choix",
      titre: "La commande retenue",
      notions: ["stock"],
      question: () => "Que commande NOVA à Électro-Composants pour N + 1 ?",
      options: () => {
        const { retenue, w, tranches } = approvisionnement();
        return [
          { texte: `${qte(retenue.commandes)} commandes de ${qte(retenue.retenue)} jeux`, juste: true, retour: `Oui : le coût total le plus bas, ${eur(retenue.totalDApprovisionnement)}, une commande toutes les ${qte(SEMAINES_PAR_AN / retenue.commandes)} semaines.` },
          { texte: `${qte(tranches.lignes[2]!.commandes)} commandes de ${qte(tranches.lignes[2]!.retenue)} jeux, la plus forte remise`, juste: false, retour: `Non : ${eur(tranches.lignes[2]!.totalDApprovisionnement)}, la possession d'un gros stock mange la remise.` },
          { texte: `${qte(w.commandes)} commandes de ${qte(w.quantite)} jeux, la quantité de Wilson`, juste: false, retour: `Non : ${eur(tranches.lignes[0]!.totalDApprovisionnement)}. Wilson minimise la seule gestion ; la remise change l'objectif.` },
        ];
      },
    },
    {
      id: "le-point-de-commande",
      objectifs: [2],
      type: "montants",
      titre: "Le point de commande",
      notions: ["stock"],
      question: () => {
        const { delai } = approvisionnement();
        return `Au 1er trimestre de N + 1, la ligne consomme ${qte(delai.parJour)} jeux par jour de montage, et Électro-Composants livre ${qte(delai.delai)} jours après la commande. Calculez la consommation pendant le délai, puis les jours entre deux commandes de ${qte(approvisionnement().retenue.retenue)} jeux.`;
      },
      champs: () => {
        const { delai, retenue } = approvisionnement();
        return [
          { libelle: "Consommation pendant le délai, en jeux", nature: "quantite", attendu: delai.moyenne, calcul: `${qte(delai.parJour)} × ${qte(delai.delai)} = ${qte(delai.moyenne)}` },
          { libelle: "Jours de montage entre deux commandes", nature: "grandeur", attendu: arrondi2(retenue.retenue / delai.parJour), calcul: `${qte(retenue.retenue)} ÷ ${qte(delai.parJour)} = ${qte(retenue.retenue / delai.parJour)}` },
        ];
      },
      explication: () => {
        const { delai, retenue } = approvisionnement();
        return [
          `Sans stock de sécurité, NOVA commande quand il reste ${qte(delai.moyenne)} jeux : c'est le point de commande, ou stock d'alerte. Une commande couvre ${qte(retenue.retenue / delai.parJour)} jours, plus que le délai : aucune autre commande n'est en route quand on passe la suivante.`,
        ];
      },
    },
    {
      id: "l-alea",
      type: "lecture",
      titre: "Quand la consommation varie",
      notions: ["stock"],
      tableau: () => tableauDeLaLoi(),
      texte: () => {
        const { delai } = approvisionnement();
        return [
          `La ligne monte ce que les clients demandent : pendant les ${qte(delai.delai)} jours du délai, elle consomme ${qte(delai.moyenne)} jeux en moyenne, mais parfois plus, parfois moins. Les relevés disent que cette consommation suit une loi normale de moyenne ${qte(delai.moyenne)} et d'écart type ${qte(delai.ecartType)} jeux.`,
          `NOVA admet une rupture dans ${pct(ALEA_DU_DELAI.risqueAdmis)} des commandes au plus. Le stock de sécurité S doit donc tenir P(consommation du délai > ${qte(delai.moyenne)} + S) ≤ ${pct(ALEA_DU_DELAI.risqueAdmis)}. On centre et on réduit : t = S ÷ ${qte(delai.ecartType)}.`,
        ];
      },
      repere: () => "Point de commande = consommation moyenne du délai + stock de sécurité ; stock de sécurité = t × écart type, t lu dans la table pour le taux de service voulu.",
    },
    {
      id: "predire-le-risque",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le risque",
      notions: ["stock"],
      question: () => {
        const { delai } = approvisionnement();
        return `Sans stock de sécurité, NOVA commande à ${qte(delai.moyenne)} jeux, la consommation moyenne du délai. Avant de calculer, pariez : quel risque de rupture prend-elle à chaque commande ?`;
      },
      options: () => [
        { texte: "Une commande sur deux", juste: true, retour: "Bon pari. La loi normale est symétrique : la moitié des délais consomment plus que la moyenne. Commander à la moyenne, c'est un risque de 50 %." },
        { texte: "Aucun : c'est la consommation du délai", juste: false, retour: "Non : c'est la consommation moyenne. Dès que le délai consomme plus, la ligne s'arrête avant la livraison." },
        { texte: `${pct(ALEA_DU_DELAI.risqueAdmis)} des commandes, le risque que NOVA admet`, juste: false, retour: "Non : ce risque se tient avec un stock de sécurité, pas sans. À la moyenne, le risque est d'une commande sur deux." },
      ],
    },
    {
      id: "le-laboratoire-du-stock-de-securite",
      objectifs: [2, 3],
      type: "simulation",
      titre: "Le laboratoire du stock de sécurité",
      notions: ["stock"],
      question: () =>
        "Choisissez le stock de sécurité. Le tableau suit le point de commande, le risque de rupture d'une commande, les ruptures attendues sur l'année et ce que le stock coûte à posséder ; le graphique suit le risque. Relevez le défi.",
      leviers: () => [{ code: "securite", libelle: "Stock de sécurité", unite: "jeux", ...SECURITES_DU_LABORATOIRE, depart: SECURITES_DU_LABORATOIRE.min }],
      lecture: (_, p) => {
        const { delai, retenue } = approvisionnement();
        const r = risqueDeRupture(p.securite!);
        return [
          { libelle: "Point de commande", montant: delai.moyenne + p.securite!, unite: "jeux" },
          { libelle: "Risque de rupture d'une commande", montant: Math.round(r * 10_000) / 100, unite: "%", reference: 50, fort: true },
          { libelle: `Ruptures attendues sur l'année, en ${qte(retenue.commandes)} commandes`, montant: Math.round(rupturesParAn(retenue.commandes, r) * 100) / 100, unite: "ruptures" },
          { libelle: "Possession du stock de sécurité, par an", montant: Math.round(p.securite! * retenue.cs * 100) / 100 },
        ];
      },
      graphique: () => ({
        levier: "securite",
        unite: "%",
        courbes: [
          { libelle: "Risque de rupture d'une commande", valeur: (p) => Math.round(risqueDeRupture(p.securite!) * 10_000) / 100 },
          { libelle: "Risque admis", valeur: () => ALEA_DU_DELAI.risqueAdmis * 100 },
        ],
      }),
      montrer: "Montrer le stock",
      defi: () => {
        const s = securiteAuRisque();
        return {
          consigne: `Trouvez le plus petit stock de sécurité qui tient le risque de rupture à ${pct(ALEA_DU_DELAI.risqueAdmis)} au plus.`,
          atteint: (p) => p.securite === s,
          indice: (p) =>
            risqueDeRupture(p.securite!) > ALEA_DU_DELAI.risqueAdmis
              ? `À ${qte(p.securite!)} jeux, le risque dépasse ${pct(ALEA_DU_DELAI.risqueAdmis)} : ajoutez des jeux.`
              : `À ${qte(p.securite!)} jeux, le risque est tenu, mais un jeu de moins le tiendrait peut-être encore : chaque jeu se paie.`,
          solution: { securite: s },
        };
      },
      explication: (_, p) => {
        const { retenue } = approvisionnement();
        return [
          `À ${qte(p.securite!)} jeux, le risque passe sous ${pct(ALEA_DU_DELAI.risqueAdmis)} : ${pct(risqueDeRupture(p.securite!))}. Les premiers jeux de sécurité font beaucoup baisser le risque, les suivants de moins en moins.`,
          `Sur ${qte(retenue.commandes)} commandes, cela fait une rupture attendue tous les ${qte(1 / rupturesParAn(retenue.commandes, ALEA_DU_DELAI.risqueAdmis))} ans environ. L'étape suivante trouve ce stock par la table, sans tâtonner.`,
        ];
      },
    },
    {
      id: "la-securite-par-la-table",
      objectifs: [2],
      type: "montants",
      titre: "Le stock de sécurité par la table",
      notions: ["stock"],
      tableau: () => tableauDeLaLoi(),
      question: () => {
        const { table } = approvisionnement();
        return `Pour un taux de service de ${pct(table.service)}, lisez t dans la table. Calculez le stock de sécurité t × ${qte(table.ecartType)}, à l'unité supérieure, le point de commande, et ce que ce stock coûte à posséder sur l'année, au cs de la tranche retenue (${qte(table.cs)} €).`;
      },
      champs: () => {
        const { table } = approvisionnement();
        return [
          { libelle: "Stock de sécurité, en jeux", nature: "quantite", attendu: table.securite, calcul: `${coef(table.t)} × ${qte(table.ecartType)} = ${qte(table.brut)}, arrondi à l'unité supérieure : ${qte(table.securite)} (un jeu de moins laisserait le risque au-dessus du seuil admis)` },
          { libelle: "Point de commande, en jeux", nature: "quantite", attendu: table.pointDeCommande, calcul: `${qte(table.moyenne)} + ${qte(table.securite)} = ${qte(table.pointDeCommande)}` },
          { libelle: "Possession du stock de sécurité, par an", attendu: table.coutAnnuel, calcul: `${qte(table.securite)} × ${qte(table.cs)} = ${eur(table.coutAnnuel)}` },
        ];
      },
      explication: () => {
        const { table } = approvisionnement();
        return [
          `NOVA commandera ses ${qte(approvisionnement().retenue.retenue)} jeux quand il en restera ${qte(table.pointDeCommande)}. Le stock de sécurité est une constante : il ne change ni Q* ni le nombre de commandes, il ajoute ${eur(table.coutAnnuel)} de possession par an.`,
        ];
      },
    },
    {
      id: "trois-jours-ou-la-loi",
      objectifs: [3],
      type: "choix",
      titre: "Le stock de 3 jours, ou la loi normale",
      notions: ["stock"],
      question: () => {
        const { trois, table } = approvisionnement();
        return `Le chapitre « Le stock de sécurité » garde ${qte(trois.jours)} jours de consommation, ${qte(trois.securite)} jeux, contre un retard du fournisseur. La loi normale demande ${qte(table.securite)} jeux contre les écarts de consommation. Que conclure ?`;
      },
      options: () => {
        const { trois, table } = approvisionnement();
        return [
          { texte: "Ils ne couvrent pas le même aléa", juste: true, retour: `Oui. Les ${qte(trois.securite)} jeux couvrent un retard de livraison ; face aux seuls écarts de consommation, ils tiennent un risque presque nul (t = ${qte(trois.z)}), pour ${eur(trois.coutAnnuel)} par an. Choisir un stock de sécurité, c'est d'abord nommer le risque qu'il couvre.` },
          { texte: `${qte(table.securite)} jeux suffisent : les ${qte(trois.securite)} jeux sont du gaspillage`, juste: false, retour: "Non : sans les jours de sécurité, un retard du fournisseur arrêterait la ligne. La loi normale ne mesure que les écarts de consommation." },
          { texte: `Les ${qte(trois.securite)} jeux sont trop peu : il faut les ajouter aux ${qte(table.securite)} jeux, toujours`, juste: false, retour: "Pas toujours : les deux aléas arrivent rarement ensemble. Un stock qui couvre leur cumul coûte cher ; c'est un choix de risque, pas une règle." },
        ];
      },
    },
    {
      id: "un-service-a-99",
      objectifs: [2, 3],
      type: "montants",
      titre: "Un service de 99 %",
      notions: ["stock"],
      question: () => {
        const { expert, retenue } = approvisionnement();
        return `La direction veut un taux de service de ${pct(expert.service)}. Calculez le stock de sécurité (à l'unité supérieure), la possession de plus sur l'année face au service de ${pct(1 - ALEA_DU_DELAI.risqueAdmis)}, et les ruptures attendues en ${qte(retenue.commandes)} commandes.`;
      },
      champs: () => {
        const { expert, table, retenue } = approvisionnement();
        return [
          { libelle: "Stock de sécurité, en jeux", nature: "quantite", attendu: expert.securite, calcul: `${coef(expert.t)} × ${qte(expert.ecartType)} = ${qte(expert.brut)}, arrondi à l'unité supérieure : ${qte(expert.securite)}` },
          { libelle: "Possession de plus, par an", attendu: Math.round((expert.coutAnnuel - table.coutAnnuel) * 100) / 100, calcul: `${eur(expert.coutAnnuel)} − ${eur(table.coutAnnuel)} = ${eur(expert.coutAnnuel - table.coutAnnuel)}` },
          { libelle: "Ruptures attendues sur l'année", nature: "grandeur", attendu: arrondi2(rupturesParAn(retenue.commandes, 1 - expert.service)), calcul: `${qte(retenue.commandes)} × ${pct(1 - expert.service)} = ${qte(rupturesParAn(retenue.commandes, 1 - expert.service))}` },
        ];
      },
      explication: () => {
        const { expert, table, retenue } = approvisionnement();
        const ans = (service: number) => qte(1 / rupturesParAn(retenue.commandes, 1 - service));
        return [
          `Passer de ${pct(table.service)} à ${pct(expert.service)} coûte ${eur(expert.coutAnnuel - table.coutAnnuel)} par an : une rupture tous les ${ans(expert.service)} ans au lieu d'une tous les ${ans(table.service)} ans. Est-ce assez cher payé ? Cela dépend de ce que coûte une ligne arrêtée.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["stock"],
      texte: () => {
        const { w, retenue, table } = approvisionnement();
        return [
          `Le coût de gestion d'un stock est la passation, n × cl, plus la possession, Q ÷ 2 × cs. Le modèle de Wilson le minimise : Q* = √(2 D cl ÷ cs), ici ${qte(w.quantite)} jeux, et la passation y égale la possession.`,
          `Un tarif dégressif change l'objectif : le coût total d'approvisionnement ajoute l'achat. Chaque tranche s'étudie en Q* s'il y tombe, sinon à sa borne : NOVA retient ${qte(retenue.commandes)} commandes de ${qte(retenue.retenue)} jeux.`,
          `En avenir aléatoire, le stock de sécurité est t × écart type pour le taux de service voulu, ${qte(table.securite)} jeux ici ; le point de commande, la consommation moyenne du délai plus ce stock.`,
          "Dans l'arène, vos stocks se paient aussi : la méthode, elle, est la même.",
        ];
      },
      repere: () => "Q* = √(2 D cl ÷ cs) ; n* = D ÷ Q*. Tarif dégressif : coût total = achat + passation + possession, tranche par tranche. Stock de sécurité = t × σ ; point de commande = consommation du délai + sécurité.",
    },
  ],
};
