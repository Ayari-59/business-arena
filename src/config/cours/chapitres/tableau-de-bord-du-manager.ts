import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { accordPluriel } from "../accords";
import { type Cas } from "../cas";
import { anneeDuCours as anneeJouee } from "../monde/annee-du-cours";
import type { Chapitre, TableauDeDonnees } from "../types";
import { equipe } from "./equipe-et-planning";
import { indicateurs } from "./indicateurs-du-point-de-vente";
import { seuilDuPointDeVente } from "./seuil-du-point-de-vente";
import { stockDuPointDeVente } from "./stock-du-point-de-vente";
import { COMMERCES, tauxDeMarque } from "./taux-de-marque";

/**
 * CHAPITRE : LE TABLEAU DE BORD DU MANAGER (BTS MCO, palier 4).
 *
 * Le dernier chapitre du parcours rassemble les indicateurs des précédents : il les range
 * par ce qu'ils surveillent (vendre, la rentabilité, le stock et la trésorerie, l'équipe),
 * puis lit deux trimestres de l'arène côte à côte pour trouver le voyant rouge : ce qui
 * change, et ce qui demande d'agir.
 *
 * Aucune hypothèse : les indicateurs sont ceux que les chapitres du parcours calculent sur le
 * cas ; les deux trimestres sont les deux premiers de l'année de l'arène (`anneeJouee`),
 * ramenés à un mois.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auDixieme = (x: number) => Math.round(x * 10) / 10;

export const AXES_DU_TABLEAU = [
  { code: "vendre", libelle: "Vendre" },
  { code: "rentabilite", libelle: "Rentabilité" },
  { code: "stock", libelle: "Stock et trésorerie" },
  { code: "equipe", libelle: "Équipe" },
] as const;

type Voyant = "ventes-bloquees" | "croissance" | "repli";

/** Deux trimestres de l'arène, ramenés à un mois, et leurs évolutions. */
export function deuxTrimestres(c: Cas) {
  const rounds = anneeJouee(c.code).partie.rounds.slice(0, 2);
  const [t1, t2] = rounds.map((tour) => {
    const r = tour.results["joueur"]!;
    const segments = Object.values(r.market.bySegment);
    return {
      ca: Math.round(r.incomeStatement.revenue / 3),
      ventes: Math.round(segments.reduce((t, s) => t + s.sold, 0) / 3),
      demande: Math.round(segments.reduce((t, s) => t + s.demandForCompany, 0) / 3),
    };
  }) as [{ ca: number; ventes: number; demande: number }, { ca: number; ventes: number; demande: number }];
  const evolution = (a: number, b: number) => auDixieme((b / a - 1) * 100);
  const transformation2 = auDixieme((t2.ventes / t2.demande) * 100);
  // D'abord l'offre (la demande est-elle servie ?), puis la demande (vient-elle ?), enfin la croissance.
  const evolutionDemande = evolution(t1.demande, t2.demande);
  const voyant: Voyant = transformation2 < 95 ? "ventes-bloquees" : evolutionDemande < -5 ? "repli" : "croissance";
  return {
    t1,
    t2,
    evolutionCa: evolution(t1.ca, t2.ca),
    evolutionVentes: evolution(t1.ventes, t2.ventes),
    evolutionDemande,
    transformation2,
    voyant,
  };
}

/** Les indicateurs du parcours, rangés par ce qu'ils surveillent. */
export function indicateursDuParcours(c: Cas) {
  const k = indicateurs(c);
  const s = seuilDuPointDeVente(c);
  const e = equipe(c);
  const m = tauxDeMarque(c);
  const metier =
    k.manque > 0
      ? { libelle: "Taux de transformation", valeur: pct(k.transformation) }
      : c.marche.clienteles.some((x) => x.code === "acquisition")
        ? { libelle: "Coût d'acquisition d'un client", valeur: eur(k.cac) }
        : { libelle: "Taux de remplissage", valeur: pct(k.remplissage) };
  const lignes: { libelle: string; valeur: string; axe: (typeof AXES_DU_TABLEAU)[number]["code"] }[] = [
    { libelle: "Chiffre d'affaires du mois", valeur: eur(c.gestion.chiffreDAffaires), axe: "vendre" },
    { libelle: k.nomDuPanier, valeur: eur(k.panier), axe: "vendre" },
    { ...metier, axe: "vendre" },
    { libelle: "Taux de marque", valeur: pct(m.tMarque), axe: "rentabilite" },
    { libelle: "Indice de sécurité", valeur: pct(s.indice), axe: "rentabilite" },
    { libelle: "Point mort", valeur: `le ${qte(s.pointMort)} du mois`, axe: "rentabilite" },
    { libelle: "Part du personnel dans le chiffre d'affaires", valeur: pct(e.partDuPersonnel), axe: "equipe" },
    { libelle: "Chiffre d'affaires par heure payée", valeur: eur(e.caParHeure), axe: "equipe" },
  ];
  if (c.stock) {
    const st = stockDuPointDeVente(c);
    lignes.push({ libelle: "Rotation du stock", valeur: deux(st.rotation), axe: "stock" });
    lignes.push({ libelle: "Durée moyenne de stockage", valeur: `${qte(st.duree)} jours`, axe: "stock" });
  } else {
    lignes.push({ libelle: "Délai de paiement du fournisseur", valeur: `${qte(c.achat.delai)} jours`, axe: "stock" });
  }
  return lignes;
}

const tableauDesDeuxTrimestres = (c: Cas): TableauDeDonnees => {
  const d = deuxTrimestres(c);
  return {
    titre: `${c.entreprise} · deux trimestres de l'arène, ramenés à un mois`,
    colonnes: ["Trimestre 1", "Trimestre 2"],
    lignes: [
      { libelle: "Chiffre d'affaires HT", valeurs: [eur(d.t1.ca), eur(d.t2.ca)] },
      { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} ${accordPluriel(c, "vendu")} ou ${accordPluriel(c, "servi")}`, valeurs: [qte(d.t1.ventes), qte(d.t2.ventes)] },
      { libelle: "Demande adressée", valeurs: [qte(d.t1.demande), qte(d.t2.demande)] },
    ],
  };
};

export const TABLEAU_DE_BORD_DU_MANAGER: Chapitre = {
  code: "tableau-de-bord-du-manager",
  parcours: "mco",
  palier: 4,
  blocs: [
    "BTS MCO Bloc 3 · Assurer la gestion opérationnelle",
    "BUT TC · Piloter un espace de vente",
  ],
  titre: "Le tableau de bord du manager",
  accroche:
    "Tous les indicateurs du parcours sur une seule page, rangés par ce qu'ils surveillent. Puis deux trimestres côte à côte, pour trouver le voyant rouge.",
  objectifs: [
    "Ranger les indicateurs du point de vente par ce qu'ils surveillent",
    "Calculer les évolutions d'un trimestre à l'autre",
    "Repérer le voyant rouge d'un tableau de bord",
    "Relier un indicateur à la décision qu'il appelle",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce chapitre rassemble les indicateurs d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une page, quelques voyants",
      notions: ["dashboard"],
      texte: (c) => [
        `Le manager de ${c.entreprise} n'a pas le temps de tout relire chaque semaine. Son tableau de bord tient sur une page : une dizaine d'indicateurs, ceux que vous avez calculés dans ce parcours, et pour chacun ce qu'il valait avant.`,
        "Un tableau de bord ne sert pas à tout savoir : il sert à voir vite ce qui change, et à savoir quoi faire. Chaque indicateur répond à une question, et chaque question appelle une décision.",
      ],
      repere: () => "Un indicateur n'a de sens que comparé : au mois précédent, à l'objectif, ou à un repère du métier.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Ce que chaque indicateur surveille",
      notions: ["dashboard"],
      question: (c) =>
        `Voici les indicateurs de ${c.entreprise}, avec leur valeur sur le mois du cas. Rangez chacun selon ce qu'il surveille : vendre, la rentabilité, le stock et la trésorerie, ou l'équipe.`,
      categories: AXES_DU_TABLEAU,
      elements: (c) =>
        indicateursDuParcours(c).map((l) => ({
          libelle: `${l.libelle} : ${l.valeur}`,
          montant: 0,
          categorie: l.axe,
          pourquoi:
            l.axe === "vendre"
              ? "Il dit si les clients viennent et achètent."
              : l.axe === "rentabilite"
                ? "Il dit si les ventes laissent assez pour payer les charges et gagner de l'argent."
                : l.axe === "stock"
                  ? "Il dit combien d'argent dort en réserve, ou qui le finance."
                  : "Il dit ce que coûte l'équipe et ce qu'elle fait vendre.",
        })),
      explication: () => [
        "Quatre familles de questions, quatre familles d'indicateurs. Un bon tableau de bord en garde deux ou trois par famille, pas plus : au-delà, plus personne ne le lit.",
      ],
    },
    {
      id: "evolutions",
      type: "montants",
      titre: "D'un trimestre à l'autre",
      notions: ["dashboard"],
      tableau: tableauDesDeuxTrimestres,
      question: (c) =>
        `Calculez, en pourcentage et au dixième, l'évolution du chiffre d'affaires, celle des ${c.unites} ${accordPluriel(c, "vendu")} ou ${accordPluriel(c, "servi")}, et celle de la demande, du trimestre 1 au trimestre 2. Puis le taux de transformation du trimestre 2 : les ventes rapportées à la demande.`,
      champs: (c) => {
        const d = deuxTrimestres(c);
        return [
          { libelle: "Évolution du chiffre d'affaires (%)", attendu: d.evolutionCa, calcul: `(${eur(d.t2.ca)} ÷ ${eur(d.t1.ca)} − 1) × 100 = ${pct(d.evolutionCa)}`, tolerance: 0.1 },
          { libelle: "Évolution des ventes (%)", attendu: d.evolutionVentes, calcul: `(${qte(d.t2.ventes)} ÷ ${qte(d.t1.ventes)} − 1) × 100 = ${pct(d.evolutionVentes)}`, tolerance: 0.1 },
          { libelle: "Évolution de la demande (%)", attendu: d.evolutionDemande, calcul: `(${qte(d.t2.demande)} ÷ ${qte(d.t1.demande)} − 1) × 100 = ${pct(d.evolutionDemande)}`, tolerance: 0.1 },
          { libelle: "Taux de transformation du trimestre 2 (%)", attendu: d.transformation2, calcul: `${qte(d.t2.ventes)} ÷ ${qte(d.t2.demande)} × 100 = ${pct(d.transformation2)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const d = deuxTrimestres(c);
        return [
          `Le chiffre d'affaires évolue de ${pct(d.evolutionCa)}, les ventes de ${pct(d.evolutionVentes)}, la demande de ${pct(d.evolutionDemande)}. Au trimestre 2, ${c.entreprise} sert ${pct(d.transformation2)} de la demande qu'elle reçoit.`,
        ];
      },
    },
    {
      id: "voyant",
      type: "choix",
      titre: "Le voyant rouge",
      notions: ["dashboard"],
      question: (c) => {
        const d = deuxTrimestres(c);
        return `Ventes ${pct(d.evolutionVentes)}, demande ${pct(d.evolutionDemande)}, ${pct(d.transformation2)} de la demande servie au trimestre 2. Que dit d'abord le tableau de bord de ${c.entreprise} ?`;
      },
      options: (c) => {
        const d = deuxTrimestres(c);
        return [
          {
            texte: "Les ventes ne suivent pas la demande : le stock ou la capacité bloquent, il faut agir sur l'offre.",
            juste: d.voyant === "ventes-bloquees",
            retour:
              d.voyant === "ventes-bloquees"
                ? `Oui. Des clients sont venus et sont repartis : ${pct(Math.round((100 - d.transformation2) * 10) / 10)} de la demande n'a pas été servie. Le voyant rouge est sur l'offre : commander plus, ouvrir plus de places, renforcer l'équipe au bon moment.`
                : `La demande est servie à ${pct(d.transformation2)} : ce n'est pas l'offre qui bloque.`,
          },
          {
            texte: "La demande progresse et elle est servie : il faut s'assurer que le stock et l'équipe suivront.",
            juste: d.voyant === "croissance",
            retour:
              d.voyant === "croissance"
                ? `Oui. Le chiffre d'affaires progresse de ${pct(d.evolutionCa)} et la demande est servie : le voyant à surveiller, c'est la capacité à suivre au trimestre prochain.`
                : d.voyant === "ventes-bloquees"
                  ? "Le chiffre d'affaires ne dit pas tout : une partie de la demande n'a pas été servie."
                  : `La demande ne progresse pas : elle recule de ${pct(Math.abs(d.evolutionDemande))}, et le chiffre d'affaires évolue de ${pct(d.evolutionCa)}.`,
          },
          {
            texte: "La demande baisse : il faut attirer des clients, ou préparer la saison creuse.",
            juste: d.voyant === "repli",
            retour:
              d.voyant === "repli"
                ? `Oui. La demande reçue recule de ${pct(Math.abs(d.evolutionDemande))} : saison creuse, concurrence ou prix. La demande est servie à ${pct(d.transformation2)}, le voyant est donc sur l'attractivité : la communication, l'offre, et des achats ajustés pour ne pas garder de stock.`
                : `La demande ne baisse pas : elle évolue de ${pct(d.evolutionDemande)}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Le tableau de bord de votre point de vente",
      notions: ["dashboard"],
      texte: (c) => [
        `Voici le tableau de bord de ${c.entreprise}, avec les indicateurs du parcours. Chacun répond à une question que vous savez maintenant calculer, et chacun appelle une décision que vous pouvez jouer dans l'arène.`,
        "Le métier de manager commence là : lire ces chiffres chaque semaine, repérer celui qui bouge, et décider avant que le compte de résultat ne le dise.",
      ],
      tableau: (c) => ({
        titre: `${c.entreprise} · le tableau de bord du mois`,
        colonnes: ["Valeur", "Ce qu'il surveille"],
        lignes: indicateursDuParcours(c).map((l) => ({
          libelle: l.libelle,
          valeurs: [l.valeur, AXES_DU_TABLEAU.find((a) => a.code === l.axe)!.libelle],
        })),
      }),
    },
  ],
};
