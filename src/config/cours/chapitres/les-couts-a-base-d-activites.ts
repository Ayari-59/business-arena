import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { auCentime } from "../monde/amortissement";
import { CHARGES_DE_GESTION, type ChargeDeGestion } from "../monde/comptabilite-de-gestion";
import { COMMANDES_DE_JANVIER, methodeABC, venteAuxCoutsDeJanvier, type CodeDeProduit } from "../monde/couts-par-activites";
import { OPERATEURS } from "../monde/nova-capacite";
import { NOVA_GESTION } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES COÛTS À BASE D'ACTIVITÉS : LA MÉTHODE ABC (contrôle de gestion, palier 4 ; BTS CG P5
 * 5.2.4, DCG UE11 § 2.3, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : janvier N chez NOVA, le mois de la comptabilité de gestion
 * de l'exercice (monde/comptabilite-de-gestion.ts), sans stock, comme le BTS le veut pour la méthode
 * ABC. Les mêmes charges indirectes que les centres d'analyse (35 383 €), mais regroupées en
 * 5 activités (monde/couts-par-activites.ts) ; deux produits, la même enceinte vendue en ligne ou à
 * CampusTech, que les centres d'analyse coûtent pareil (60,25 €) et que la méthode ABC sépare.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui du BTS CG et du DCG) :
 *   · guidé : le-cout-des-activites (les parts au tableau), le-cout-des-inducteurs (la formule est
 *     dans la question) ;
 *   · l'expérience avant la formule : predire-le-cout (un pari) avant les calculs ;
 *     le-pari-des-frais-de-port puis le-laboratoire-des-frais-de-port (la méthode et les frais de
 *     port, avec un graphique du résultat de la vente en ligne) ;
 *   · autonome : les-inducteurs (un tri), le-cout-des-produits, la-comparaison (sans formule ;
 *     le calcul se lit une fois l'étape réussie) ;
 *   · expert : le-subventionnement (lire la comparaison), la-livraison-chaque-jour (une variante
 *     chiffrée aux coûts d'inducteurs du mois), les-limites (ce qu'un coût d'inducteur ne dit pas) ;
 *     puis la synthèse.
 */

/** La méthode ABC se calcule sur le mois de janvier de NOVA, dans le monde du cours. */
export const ENTREPRISES_DE_LA_METHODE_ABC: readonly string[] = ["nova"];

/** Le laboratoire : les frais de port d'une commande en ligne, hors taxes. */
export const FRAIS_DE_PORT_DU_LABORATOIRE = { min: 0, max: 5, pas: 0.1 } as const;

/** Les deux méthodes du levier à choix. */
export const METHODES_DU_LABORATOIRE = [
  { valeur: 0, libelle: "Centres d'analyse" },
  { valeur: 1, libelle: "Méthode ABC" },
] as const;

/** La variante experte : CampusTech livrée chaque jour ouvré du mois. */
export const ENVOIS_QUOTIDIENS = 20;

/** Les commandes en ligne que l'étape des limites suppose perdues. */
export const COMMANDES_PERDUES = 100;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t * 100, 0)} %`;

const LIBELLES_DES_CHARGES: Readonly<Record<ChargeDeGestion, string>> = {
  loyer: "Loyer",
  personnel: "Personnel",
  amortissement: "Usure de la ligne",
  assurance: "Assurance",
  gerante: "Travail du président",
};
/** Les charges de janvier : l'assurance ne commence qu'en octobre, elle n'a pas de ligne. */
const CHARGES_DE_JANVIER = CHARGES_DE_GESTION.filter((k) => k !== "assurance");
const PRODUITS: readonly CodeDeProduit[] = ["en-ligne", "campustech"];
const COURT: Readonly<Record<CodeDeProduit, string>> = { "en-ligne": "En ligne", campustech: "CampusTech" };

const donnee = (valeur: number, unite?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}) });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Janvier, et tout ce que le chapitre en lit, calculé une fois. */
export function janvierABC() {
  const m = methodeABC();
  const enLigne = m.produits["en-ligne"];
  const campustech = m.produits.campustech;
  const centres = enLigne.centres.unitaire;
  return { m, enLigne, campustech, centres, prix: NOVA_GESTION.moisDeReference.prix };
}

/** Le laboratoire : le résultat de la vente en ligne de janvier selon la méthode et les frais de port. */
export function laboratoireDesFraisDePort(methode: number, fraisDePort: number) {
  const p = methodeABC({ fraisDePort }).produits["en-ligne"];
  return { abc: p, resultat: methode === 1 ? p.resultat : p.centres.resultat, unitaire: auCentime(methode === 1 ? p.unitaire : p.centres.unitaire) };
}

/** Les plus petits frais de port, au cran du laboratoire, qui laissent la vente en ligne sans perte selon la méthode. */
export function fraisDePortQuiCouvrent(methode: number) {
  const { min, max, pas } = FRAIS_DE_PORT_DU_LABORATOIRE;
  for (let i = 0; i <= Math.round((max - min) / pas); i++) {
    const frais = Math.round((min + i * pas) * 1e6) / 1e6;
    if (laboratoireDesFraisDePort(methode, frais).resultat >= 0) return frais;
  }
  return max;
}

/** Les ventes de janvier : le document du chapitre. */
function tableauDesVentes(): TableauDeDonnees {
  const { m } = janvierABC();
  return {
    titre: "Les ventes de janvier, produit par produit",
    colonnes: PRODUITS.map((p) => COURT[p]),
    lignes: [
      { libelle: "Enceintes vendues", valeurs: PRODUITS.map((p) => qte(m.produits[p].vente.enceintes)) },
      { libelle: "Prix d'une enceinte, hors taxes", valeurs: PRODUITS.map((p) => eur(m.produits[p].vente.prix)) },
      { libelle: "Chiffre d'affaires", valeurs: PRODUITS.map((p) => eur(m.produits[p].chiffreDAffaires)) },
      { libelle: "Commandes reçues", valeurs: PRODUITS.map((p) => qte(COMMANDES_DE_JANVIER[p].commandes)) },
      { libelle: "Envois expédiés", valeurs: PRODUITS.map((p) => qte(COMMANDES_DE_JANVIER[p].envois)) },
      { libelle: "Heures de montage d'une enceinte", valeurs: PRODUITS.map(() => qte(OPERATEURS.heuresParEnceinte)) },
      { libelle: "Coût de revient d'une enceinte, par les centres d'analyse", valeurs: PRODUITS.map((p) => eur(auCentime(m.produits[p].centres.unitaire))) },
    ],
  };
}

/** Les parts de chaque charge dans chaque activité. */
function tableauDesParts(): TableauDeDonnees {
  const { m } = janvierABC();
  return {
    titre: "La part de chaque charge que chaque activité consomme",
    colonnes: m.activites.map((a) => a.libelle),
    lignes: CHARGES_DE_JANVIER.map((k) => ({ libelle: `${LIBELLES_DES_CHARGES[k]} (${eur(m.charges[k])})`, valeurs: m.activites.map((a) => pct(a.parts[k])) })),
  };
}

/** Le tableau des activités : chaque charge × sa part. */
function grilleDesActivites(): TableauACompleter {
  const { m } = janvierABC();
  return {
    titre: "Le coût des activités de janvier",
    colonnes: [...m.activites.map((a) => a.libelle), "Total"],
    colonneDeTotal: m.activites.length,
    lignes: [
      ...CHARGES_DE_JANVIER.map((k) => ({
        libelle: LIBELLES_DES_CHARGES[k],
        cellules: [
          ...m.activites.map((a) => (a.parts[k] === 0 ? donnee(0) : aSaisir(a.montants[k], `${eur(m.charges[k])} × ${pct(a.parts[k])} = ${eur(a.montants[k])}`, { indice: "la charge du mois multipliée par la part de l'activité" }))),
          donnee(m.charges[k]),
        ],
      })),
      {
        libelle: "Coût de l'activité",
        fort: true,
        totalDe: { plus: CHARGES_DE_JANVIER.map((_, i) => i) },
        cellules: [...m.activites.map((a) => aSaisir(a.cout, `${CHARGES_DE_JANVIER.filter((k) => a.parts[k] > 0).map((k) => eur(a.montants[k])).join(" + ")} = ${eur(a.cout)}`)), donnee(m.total)],
      },
    ],
  };
}

/** Le volume et le coût de chaque inducteur. */
function grilleDesInducteurs(): TableauACompleter {
  const { m } = janvierABC();
  const [l, c] = [m.produits["en-ligne"], m.produits.campustech];
  return {
    titre: "Le coût d'un inducteur, au centime",
    colonnes: ["Coût de l'activité", "Volume de l'inducteur", "Coût d'un inducteur"],
    lignes: m.activites.map((a, i) => ({
      libelle: `${a.libelle} (${a.inducteur.libelle})`,
      cellules: [
        donnee(a.cout),
        aSaisir(a.volume, `${qte(l.imputations[i]!.volume)} + ${qte(c.imputations[i]!.volume)} = ${qte(a.volume)}`, { unite: a.inducteur.unite, indice: "ce que la vente en ligne et CampusTech consomment, réunis" }),
        aSaisir(a.coutDeLInducteur, `${eur(a.cout)} ÷ ${qte(a.volume)} = ${eur(a.coutDeLInducteur)}`, { indice: "le coût de l'activité divisé par le volume de son inducteur" }),
      ],
    })),
  };
}

/** Le coût de revient de chaque produit, activité par activité. */
function grilleDesProduits(): TableauACompleter {
  const { m } = janvierABC();
  const n = m.activites.length;
  return {
    titre: "Le coût de revient de janvier, par la méthode ABC",
    colonnes: PRODUITS.map((p) => COURT[p]),
    lignes: [
      ...m.activites.map((a, i) => ({
        libelle: `${a.libelle} (${eur(a.coutDeLInducteur)} par ${a.inducteur.libelle})`,
        cellules: PRODUITS.map((p) => {
          const x = m.produits[p].imputations[i]!;
          return aSaisir(x.montant, `${qte(x.volume)} × ${eur(a.coutDeLInducteur)} = ${eur(x.montant)}`, { indice: "le volume que le produit consomme multiplié par le coût de l'inducteur" });
        }),
      })),
      { libelle: "Charges indirectes", fort: true, totalDe: { plus: m.activites.map((_, i) => i) }, cellules: PRODUITS.map((p) => aSaisir(m.produits[p].indirectes, `${m.produits[p].imputations.map((x) => eur(x.montant)).join(" + ")} = ${eur(m.produits[p].indirectes)}`)) },
      { libelle: "Charges directes (composants et autres coûts)", cellules: PRODUITS.map((p) => donnee(m.produits[p].directes)) },
      { libelle: "Coût de revient", fort: true, totalDe: { plus: [n, n + 1] }, cellules: PRODUITS.map((p) => aSaisir(m.produits[p].coutDeRevient, `${eur(m.produits[p].indirectes)} + ${eur(m.produits[p].directes)} = ${eur(m.produits[p].coutDeRevient)}`)) },
      {
        libelle: "Coût de revient d'une enceinte",
        cellules: PRODUITS.map((p) => aSaisir(auCentime(m.produits[p].unitaire), `${eur(m.produits[p].coutDeRevient)} ÷ ${qte(m.produits[p].vente.enceintes)} = ${eur(auCentime(m.produits[p].unitaire))}`, { horsTotal: true })),
      },
    ],
  };
}

export const LES_COUTS_A_BASE_D_ACTIVITES: Chapitre = {
  code: "les-couts-a-base-d-activites",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Les coûts à base d'activités : la méthode ABC",
  accroche:
    "En janvier, les centres d'analyse donnent le même coût à toutes les enceintes de NOVA. Regroupées en activités, les mêmes charges disent autre chose : une enceinte vendue en ligne coûte plus qu'une enceinte vendue à CampusTech.",
  objectifs: [
    "Calculer le coût des activités à partir des charges indirectes et de leurs parts",
    "Choisir l'inducteur d'une activité et calculer le coût d'un inducteur",
    "Calculer le coût de revient d'un produit par la méthode ABC",
    "Comparer le coût ABC au coût par les centres d'analyse et repérer un subventionnement",
    "Se servir du coût ABC pour fixer un prix, et en dire les limites",
  ],
  libre: false,
  prerequis: ["cout-complet"],
  ensuite: ["decider-prix-fabriquer-acheter"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_METHODE_ABC,
    pourquoi:
      "la méthode ABC se calcule ici sur le mois de janvier de NOVA, dans la simulation du cours, avec les charges de ses centres d'analyse ; la méthode vaut pour toute entreprise sans stock.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La même enceinte, deux façons de la vendre",
      notions: ["full_unit_cost", "fixed_costs"],
      tableau: () => tableauDesVentes(),
      texte: () => {
        const { m, centres } = janvierABC();
        return [
          `Ce chapitre se joue dans la simulation du cours, chez NOVA, en janvier N : un mois sans stock, tout ce qui est monté est livré. Ses charges indirectes, ${eur(m.total)}, sont celles des centres d'analyse, travail du président compris.`,
          `NOVA vend la même enceinte de deux façons : en ligne, à des particuliers qui commandent une enceinte à la fois, et à CampusTech, qui passe ${qte(COMMANDES_DE_JANVIER.campustech.commandes)} commande par mois livrée en ${qte(COMMANDES_DE_JANVIER.campustech.envois)} palettes. Par les centres d'analyse, une enceinte revient à ${eur(auCentime(centres))}, qu'elle parte dans un colis ou sur une palette.`,
          "Les unités d'œuvre des centres comptent des euros d'achat, des enceintes, des euros de chiffre d'affaires : rien qui distingue un colis d'une palette. La méthode ABC part de ce que l'entreprise fait, ses activités, et de ce qui déclenche chacune, son inducteur.",
        ];
      },
      repere: () => "Coût d'une activité = Σ charges × part de l'activité. Coût d'un inducteur = coût de l'activité ÷ volume de l'inducteur. Coût d'un produit = charges directes + Σ volume consommé × coût de l'inducteur.",
    },
    {
      id: "predire-le-cout",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur les 2 produits",
      notions: ["full_unit_cost"],
      question: () => "Avant de calculer, pariez : par la méthode ABC, l'enceinte vendue en ligne coûtera…",
      options: () => [
        { texte: "Plus que celle de CampusTech", juste: true, retour: "Bon pari. Chaque enceinte en ligne est une commande et un colis ; celles de CampusTech se partagent une commande et 4 palettes. Les étapes suivantes le chiffrent." },
        { texte: "Autant : c'est la même enceinte, montée de la même façon", juste: false, retour: "Pari à vérifier : le montage coûte pareil, mais une enceinte en ligne demande aussi une commande et un colis à elle seule. Les étapes suivantes le chiffrent." },
        { texte: "Moins : CampusTech paie en retard, et cela coûte", juste: false, retour: "Pari à vérifier : le retard de paiement coûte en trésorerie et en intérêts, que le coût de revient n'incorpore pas. Ce qui pèse ici, ce sont les commandes et les envois." },
      ],
    },
    {
      id: "le-cout-des-activites",
      objectifs: [0],
      type: "a-completer",
      titre: "Le coût des activités",
      notions: ["full_unit_cost", "fixed_costs"],
      tableau: () => tableauDesParts(),
      question: () =>
        "NOVA a relevé ses 5 activités et la part de chaque charge que chacune consomme (tableau) : le loyer selon les surfaces, la paie selon le temps des opérateurs. Répartissez chaque charge de janvier entre les activités, puis faites le coût de chaque activité.",
      grille: () => grilleDesActivites(),
      explication: () => {
        const { m } = janvierABC();
        const [envois, commandes] = [m.activites.find((a) => a.code === "expedier")!, m.activites.find((a) => a.code === "commandes")!];
        return [
          `Les ${eur(m.total)} sont tous rangés, comme dans les centres d'analyse ; ils le sont autrement. ${eur(auCentime(envois.cout + commandes.cout))} vont aux envois et aux commandes, que les centres mêlaient à la distribution et à l'administration.`,
        ];
      },
    },
    {
      id: "les-inducteurs",
      objectifs: [1],
      type: "tri",
      titre: "Inducteurs de volume, ou non",
      notions: ["full_unit_cost"],
      question: () => "Rangez chaque activité selon son inducteur : suit-il le nombre d'enceintes, ou autre chose, le nombre de commandes ou d'envois, quelle que soit leur taille ?",
      categories: [
        { code: "volume", libelle: "Inducteur de volume" },
        { code: "hors-volume", libelle: "Inducteur hors volume" },
      ],
      relance: "Demandez-vous : si chaque commande comptait 2 enceintes au lieu d'une, l'activité doublerait-elle ?",
      elements: () => {
        const { m } = janvierABC();
        const pourquoi: Readonly<Record<string, string>> = {
          approvisionner: "Un jeu reçu par enceinte montée : l'activité suit les enceintes.",
          monter: "Un quart d'heure par enceinte : l'activité suit les enceintes.",
          expedier: "Un colis coûte à peu près le même travail qu'une palette, quel que soit le nombre d'enceintes dedans.",
          commandes: `Une commande de ${qte(m.produits.campustech.vente.enceintes)} enceintes se saisit et se suit comme une commande d'une seule.`,
          administrer: "Le chiffre d'affaires suit les enceintes vendues : un inducteur de volume, comme l'unité d'œuvre de la distribution.",
        };
        return m.activites.map((a) => ({ libelle: `${a.libelle} (${a.inducteur.libelle})`, montant: a.cout, categorie: a.volumique ? "volume" : "hors-volume", pourquoi: pourquoi[a.code]! }));
      },
      explication: () => [
        "Les activités à inducteur de volume répartissent leurs charges comme les centres d'analyse : par enceinte ou par euro. Ce sont les autres, les envois et les commandes, qui séparent la vente en ligne de CampusTech.",
      ],
    },
    {
      id: "le-cout-des-inducteurs",
      objectifs: [1],
      type: "a-completer",
      titre: "Le coût d'un inducteur",
      notions: ["full_unit_cost"],
      tableau: () => tableauDesVentes(),
      question: () =>
        "Comptez le volume de chaque inducteur en janvier, vente en ligne et CampusTech réunies (tableau) : les jeux reçus, les heures de montage, les envois, les commandes, les centaines d'euros de chiffre d'affaires. Puis le coût d'un inducteur, au centime : le coût de l'activité ÷ son volume.",
      grille: () => grilleDesInducteurs(),
      explication: () => {
        const { m } = janvierABC();
        const [envois, commandes] = [m.activites.find((a) => a.code === "expedier")!, m.activites.find((a) => a.code === "commandes")!];
        return [`Un envoi coûte ${eur(envois.coutDeLInducteur)}, une commande ${eur(commandes.coutDeLInducteur)} : c'est le prix d'un colis comme d'une palette, d'une commande d'une enceinte comme de ${qte(m.produits.campustech.vente.enceintes)}.`];
      },
    },
    {
      id: "le-cout-des-produits",
      objectifs: [2],
      type: "a-completer",
      titre: "Le coût de revient de chaque produit",
      notions: ["full_unit_cost"],
      tableau: () => tableauDesVentes(),
      question: () =>
        "Chaque produit reçoit, de chaque activité, le volume d'inducteur qu'il consomme × le coût de l'inducteur. Remplissez les charges indirectes des deux produits, leur coût de revient, puis le coût de revient d'une enceinte, au centime.",
      grille: () => grilleDesProduits(),
      explication: () => {
        const { enLigne, campustech, m } = janvierABC();
        return [
          `Une enceinte en ligne revient à ${eur(auCentime(enLigne.unitaire))}, une enceinte de CampusTech à ${eur(auCentime(campustech.unitaire))}. Les produits ont reçu ${eur(m.imputees)} sur ${eur(m.total)} : l'écart, ${eur(Math.abs(m.arrondi))}, vient des coûts d'inducteur arrondis au centime.`,
        ];
      },
    },
    {
      id: "la-comparaison",
      objectifs: [3],
      type: "montants",
      titre: "Deux méthodes, deux résultats",
      notions: ["full_unit_cost"],
      tableau: () => tableauDesVentes(),
      question: () =>
        "Calculez le résultat de janvier de chaque produit, par la méthode ABC, puis par les centres d'analyse (le coût de revient d'une enceinte par les centres est au tableau).",
      champs: () => {
        const { enLigne, campustech } = janvierABC();
        return [
          { libelle: "Résultat de la vente en ligne, méthode ABC", attendu: enLigne.resultat, calcul: `${eur(enLigne.chiffreDAffaires)} − ${eur(enLigne.coutDeRevient)} = ${eur(enLigne.resultat)}` },
          { libelle: "Résultat de CampusTech, méthode ABC", attendu: campustech.resultat, calcul: `${eur(campustech.chiffreDAffaires)} − ${eur(campustech.coutDeRevient)} = ${eur(campustech.resultat)}` },
          { libelle: "Résultat de la vente en ligne, centres d'analyse", attendu: enLigne.centres.resultat, tolerance: 1, calcul: `${eur(enLigne.chiffreDAffaires)} − ${eur(enLigne.centres.coutDeRevient)} = ${eur(enLigne.centres.resultat)}` },
          { libelle: "Résultat de CampusTech, centres d'analyse", attendu: campustech.centres.resultat, tolerance: 1, calcul: `${eur(campustech.chiffreDAffaires)} − ${eur(campustech.centres.coutDeRevient)} = ${eur(campustech.centres.resultat)}` },
        ];
      },
      explication: () => {
        const { enLigne, campustech } = janvierABC();
        return [
          `Par les centres, les deux produits perdent, chacun ${eur(auCentime(enLigne.centres.unitaire - enLigne.vente.prix))} par enceinte. Par la méthode ABC, la vente en ligne perd ${eur(auCentime(enLigne.unitaire - enLigne.vente.prix))} par enceinte et CampusTech en gagne ${eur(auCentime(campustech.vente.prix - campustech.unitaire))}. Le mois perd presque autant dans les deux cas : la méthode ne change pas le total, elle change qui le fait.`,
        ];
      },
    },
    {
      id: "le-subventionnement",
      objectifs: [3],
      type: "choix",
      titre: "Qui paie pour qui",
      notions: ["full_unit_cost"],
      question: () => "Les centres d'analyse donnaient aux deux produits le même coût. Que faisaient-ils, sans le dire ?",
      options: () => {
        const { campustech } = janvierABC();
        const subvention = auCentime(campustech.centres.coutDeRevient - campustech.coutDeRevient);
        return [
          { texte: "CampusTech portait des coûts de la vente en ligne", juste: true, retour: `Oui : un subventionnement. Par les centres, CampusTech portait ${eur(subvention)} de plus que ce qu'elle consomme, que la vente en ligne ne portait pas. Un client à ${qte(campustech.vente.enceintes)} enceintes la commande paraissait perdre de l'argent ; c'est la vente en ligne qui en perd.` },
          { texte: "La vente en ligne portait des coûts de CampusTech, qui paie en retard", juste: false, retour: "Non : c'est l'inverse. Le retard de paiement de CampusTech ne passe pas dans le coût de revient ; ses commandes et ses palettes, très peu nombreuses, coûtent peu." },
          { texte: "Rien : les 2 enceintes coûtent la même chose, montage compris", juste: false, retour: "Non : le montage coûte pareil, mais une commande et un colis par enceinte en ligne pèsent, que les centres répartissaient sur toutes les enceintes." },
        ];
      },
    },
    {
      id: "le-pari-des-frais-de-port",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur les frais de port",
      notions: ["full_unit_cost", "margin_rates"],
      question: () =>
        "Le président veut facturer des frais de port à chaque commande en ligne, juste assez pour que la vente en ligne cesse de perdre de l'argent. Pariez : la méthode ABC demandera des frais…",
      options: () => {
        const voir = "Le laboratoire suivant fait essayer les deux méthodes.";
        return [
          { texte: "Plus élevés que les centres d'analyse", juste: true, retour: `Bon pari : la méthode ABC met les commandes et les colis à la charge de la vente en ligne. ${voir}` },
          { texte: "Moins élevés : un colis coûte peu de chose", juste: false, retour: `Pari à vérifier : un colis coûte peu, mais il y en a un par enceinte. ${voir}` },
          { texte: "Les mêmes : le total des charges ne change pas", juste: false, retour: `Pari à vérifier : le total ne change pas, sa répartition si. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-frais-de-port",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire des frais de port",
      notions: ["full_unit_cost", "margin_rates"],
      question: () =>
        "Choisissez la méthode de calcul des coûts, et les frais de port facturés à chaque commande en ligne, hors taxes. Le tableau suit le coût et le résultat de la vente en ligne de janvier ; le graphique montre son résultat selon les frais, pour les deux méthodes. Relevez le défi.",
      leviers: () => [
        { code: "methode", libelle: "Méthode de calcul des coûts", unite: "", min: 0, max: 1, pas: 1, depart: 0, choix: METHODES_DU_LABORATOIRE.map((x) => ({ valeur: x.valeur, libelle: x.libelle })) },
        { code: "frais", libelle: "Frais de port d'une commande en ligne", unite: "€", min: FRAIS_DE_PORT_DU_LABORATOIRE.min, max: FRAIS_DE_PORT_DU_LABORATOIRE.max, pas: FRAIS_DE_PORT_DU_LABORATOIRE.pas, depart: FRAIS_DE_PORT_DU_LABORATOIRE.min },
      ],
      lecture: (_, p) => {
        const depart = laboratoireDesFraisDePort(0, 0);
        const l = laboratoireDesFraisDePort(p.methode!, p.frais!);
        return [
          { libelle: "Chiffre d'affaires de la vente en ligne, frais de port compris", montant: l.abc.chiffreDAffaires, reference: depart.abc.chiffreDAffaires },
          { libelle: "Coût de revient d'une enceinte vendue en ligne", montant: l.unitaire, reference: depart.unitaire },
          { libelle: "Résultat de la vente en ligne en janvier", montant: l.resultat, reference: depart.resultat, effet: true, fort: true },
        ];
      },
      graphique: () => ({
        levier: "frais",
        courbes: METHODES_DU_LABORATOIRE.map((x) => ({ libelle: `Résultat de la vente en ligne, ${x.libelle.toLowerCase().replace("méthode abc", "méthode ABC")}`, valeur: (p: Readonly<Record<string, number>>) => laboratoireDesFraisDePort(x.valeur, p.frais!).resultat })),
      }),
      defi: () => {
        const frais = fraisDePortQuiCouvrent(1);
        return {
          consigne: "Selon la méthode ABC, trouvez les plus petits frais de port, au dixième d'euro, qui laissent la vente en ligne sans perte.",
          atteint: (p) => p.methode === 1 && Math.abs(p.frais! - frais) < 1e-9,
          indice: (p) => {
            if (p.methode !== 1) return "Les centres d'analyse ne voient ni les commandes ni les colis : passez à la méthode ABC.";
            const l = laboratoireDesFraisDePort(1, p.frais!);
            return l.resultat < 0 ? `À ${eur(p.frais!)} par commande, la vente en ligne perd encore ${eur(-l.resultat)} : montez les frais.` : `À ${eur(p.frais!)} par commande, la vente en ligne gagne ${eur(l.resultat)} : cherchez les plus petits frais qui suffisent.`;
          },
          solution: { methode: 1, frais },
        };
      },
      montrer: "Montrer les frais",
      explication: (_, p) => {
        const centres = fraisDePortQuiCouvrent(0);
        return [
          `Selon la méthode ABC, il faut ${eur(p.frais!)} par commande ; selon les centres d'analyse, ${eur(centres)} auraient semblé suffire. Avec ces frais-là, la vente en ligne aurait encore perdu ${eur(-laboratoireDesFraisDePort(1, centres).resultat)} en janvier, en silence.`,
          "Les frais de port relèvent aussi un peu la part de la direction, qui suit le chiffre d'affaires : c'est pourquoi le coût d'une enceinte en ligne bouge à peine quand les frais montent.",
        ];
      },
    },
    {
      id: "la-livraison-chaque-jour",
      objectifs: [2],
      type: "montants",
      titre: "Livrer CampusTech chaque jour",
      notions: ["full_unit_cost"],
      question: () => {
        const { campustech } = janvierABC();
        return `CampusTech demande à être livrée chaque jour ouvré : ${ENVOIS_QUOTIDIENS} envois par mois au lieu de ${qte(campustech.vente.envois)}. Aux coûts d'inducteurs de janvier, que deviennent ses charges indirectes, son coût de revient et le coût d'une enceinte ?`;
      },
      champs: () => {
        const { campustech } = janvierABC();
        const v = venteAuxCoutsDeJanvier({ ...campustech.vente, envois: ENVOIS_QUOTIDIENS });
        const e = v.imputations.find((x) => x.code === "expedier")!;
        return [
          { libelle: "Charges indirectes de CampusTech", attendu: v.indirectes, calcul: `${eur(campustech.indirectes)} + (${ENVOIS_QUOTIDIENS} − ${qte(campustech.vente.envois)}) × ${eur(e.coutDeLInducteur)} = ${eur(v.indirectes)}` },
          { libelle: "Coût de revient de CampusTech", attendu: v.coutDeRevient, calcul: `${eur(v.indirectes)} + ${eur(v.directes)} = ${eur(v.coutDeRevient)}` },
          { libelle: "Coût de revient d'une enceinte", attendu: auCentime(v.unitaire), calcul: `${eur(v.coutDeRevient)} ÷ ${qte(v.vente.enceintes)} = ${eur(auCentime(v.unitaire))}` },
        ];
      },
      explication: () => {
        const { campustech, enLigne } = janvierABC();
        const v = venteAuxCoutsDeJanvier({ ...campustech.vente, envois: ENVOIS_QUOTIDIENS });
        return [
          `Même livrée chaque jour, une enceinte de CampusTech revient à ${eur(auCentime(v.unitaire))}, bien sous les ${eur(auCentime(enLigne.unitaire))} d'une enceinte en ligne : ${ENVOIS_QUOTIDIENS} palettes pèsent peu face à ${qte(enLigne.vente.envois)} colis. Par les centres d'analyse, la demande ne coûterait rien : leurs unités d'œuvre ne comptent pas les envois.`,
        ];
      },
    },
    {
      id: "les-limites",
      objectifs: [4],
      type: "choix",
      titre: "Ce que dit un coût d'inducteur",
      notions: ["full_unit_cost", "fixed_costs"],
      question: () => {
        const { m } = janvierABC();
        const [envois, commandes] = [m.activites.find((a) => a.code === "expedier")!, m.activites.find((a) => a.code === "commandes")!];
        return `Une commande en ligne coûte ${eur(commandes.coutDeLInducteur)} et son colis ${eur(envois.coutDeLInducteur)}. Si NOVA perdait ${COMMANDES_PERDUES} commandes en ligne en février, ses charges baisseraient-elles de ${COMMANDES_PERDUES} × ${eur(auCentime(envois.coutDeLInducteur + commandes.coutDeLInducteur))} ?`;
      },
      options: () => [
        { texte: "Non : le loyer et la paie restent", juste: true, retour: "Oui. Le coût d'un inducteur est une moyenne de charges fixes : le loyer, la paie, le travail du président ne baissent pas avec une commande de moins. La méthode ABC dit ce que chaque produit consomme des ressources ; pour décider d'une commande de plus ou de moins, c'est le coût variable qui compte." },
        { texte: "Oui : chaque commande perdue économise son coût d'inducteur", juste: false, retour: "Non : ce serait vrai si NOVA payait ses opérateurs à la commande. Ses charges indirectes sont fixes dans le mois : moins de commandes, c'est un coût d'inducteur plus élevé, pas une charge plus basse." },
        { texte: "Oui, mais seulement pour les colis, pas pour les commandes", juste: false, retour: "Non : les deux activités ont les mêmes ressources fixes, la surface et le temps des opérateurs. Aucune ne baisse dans le mois." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["full_unit_cost", "fixed_costs"],
      texte: () => {
        const { enLigne, campustech, centres } = janvierABC();
        return [
          `En janvier, les centres d'analyse donnaient ${eur(auCentime(centres))} à toute enceinte. La méthode ABC donne ${eur(auCentime(enLigne.unitaire))} à l'enceinte vendue en ligne et ${eur(auCentime(campustech.unitaire))} à celle de CampusTech : les mêmes charges, rangées selon ce qui les déclenche.`,
          "La démarche : les charges indirectes vont aux activités, chaque activité a son inducteur, le coût d'un inducteur est le coût de l'activité divisé par son volume, et chaque produit paie les inducteurs qu'il consomme.",
          "Ce qu'elle révèle : un subventionnement, quand une unité d'œuvre de volume fait payer aux grosses commandes ce que coûtent les petites. Ce qu'elle ne dit pas : ce qu'une commande de plus ou de moins coûterait, car ses coûts restent des coûts complets.",
          "Dans l'arène, les charges de votre entreprise ne sont pas découpées en activités : la méthode, elle, est la même.",
        ];
      },
      repere: () => "Coût d'un inducteur = coût de l'activité ÷ volume de l'inducteur. Coût ABC d'un produit = charges directes + Σ (volume d'inducteur consommé × coût de l'inducteur).",
    },
  ],
};
