import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";
import { seuilDuPointDeVente } from "./seuil-du-point-de-vente";
import { COMMERCES } from "./taux-de-marque";

/**
 * CHAPITRE : L'ÉQUIPE ET SON PLANNING (BTS MCO, palier 4).
 *
 * Ce que coûte l'équipe et ce qu'elle produit : le coût horaire chargé, le chiffre d'affaires
 * par salarié et par heure, la part du personnel dans le chiffre d'affaires. Puis les
 * heures que l'activité demande face à celles que l'équipe peut donner : l'équipe est-elle ce
 * qui limite les ventes ? Enfin ce qu'une embauche doit rapporter pour se payer.
 *
 * Aucune hypothèse : l'effectif et la paie sont ceux du cas (`cas.personnel`), les heures
 * d'un salarié et les heures de travail par unité vendue sont celles du scénario de l'arène
 * (`hoursPerEmployee` de l'entreprise au départ, par trimestre ; `hoursPerUnit`). L'arène ne modélise pas l'affluence
 * heure par heure : le chapitre ne bâtit pas de planning horaire, et le dit.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const heures = (h: number) => `${h.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} h`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
/** « de commandes », mais « d'articles » : l'élision devant une voyelle. */
const dE = (mot: string) => (/^[aeiouyéèê]/i.test(mot) ? `d'${mot}` : `de ${mot}`);

/** Les trois mois d'un trimestre de l'arène. */
const MOIS_PAR_TRIMESTRE = 3;

/** Le coût, la productivité et la charge de l'équipe sur le mois du cas. */
export function equipe(c: Cas) {
  const def = scenarioByCode(c.code);
  const s = def.scenario;
  const p = c.personnel;
  const g = c.gestion;
  // Les heures d'un salarié sont celles de l'entreprise au départ de la partie, par trimestre.
  const depart = def.company("joueur", def.playerTeamName, "bot", "balanced");
  const heuresParSalarie = auCentieme(depart.hoursPerEmployee / MOIS_PAR_TRIMESTRE);
  const heuresPayees = auCentieme(p.effectif * heuresParSalarie);
  const heuresParUnite = s.product.hoursPerUnit;
  const heuresNecessaires = auCentieme(g.quantite * heuresParUnite);
  const coutParSalarie = auCentime(p.cout / p.effectif);
  const tauxMcv = seuilDuPointDeVente(c).tauxMcv;
  return {
    effectif: p.effectif,
    cout: p.cout,
    heuresParSalarie,
    heuresPayees,
    coutHoraire: auCentime(p.cout / heuresPayees),
    caParSalarie: Math.round(g.chiffreDAffaires / p.effectif),
    caParHeure: auCentime(g.chiffreDAffaires / heuresPayees),
    partDuPersonnel: auDixieme((p.cout / g.chiffreDAffaires) * 100),
    quantite: g.quantite,
    heuresParUnite,
    heuresNecessaires,
    occupation: auDixieme((heuresNecessaires / heuresPayees) * 100),
    capaciteDeLEquipe: Math.floor(heuresPayees / heuresParUnite),
    coutParSalarie,
    tauxMcv,
    caPourUneEmbauche: Math.ceil(coutParSalarie / (tauxMcv / 100) - 1e-9),
  };
}

export const EQUIPE_ET_PLANNING: Chapitre = {
  code: "equipe-et-planning",
  parcours: "mco",
  palier: 4,
  blocs: [
    "BTS MCO Bloc 4 · Manager l'équipe commerciale",
    "Bac pro AGORA Bloc 3 · Administrer le personnel",
    "2de pro GATL 2 · Organiser et planifier l'activité",
    "BUT TC · Manager une équipe commerciale sur un espace de vente",
  ],
  titre: "L'équipe et son planning",
  accroche:
    "Ce que coûte une heure de l'équipe, ce qu'elle fait vendre, et si elle limite les ventes. Puis ce qu'une embauche doit rapporter pour se payer.",
  objectifs: [
    "Calculer le coût horaire chargé de l'équipe",
    "Calculer la productivité : chiffre d'affaires par salarié et par heure",
    "Calculer la part du personnel dans le chiffre d'affaires",
    "Comparer les heures que l'activité demande à celles que l'équipe donne",
    "Calculer le chiffre d'affaires qu'une embauche doit apporter",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce chapitre suit l'équipe d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une équipe, des heures, une paie",
      notions: ["productivity", "fixed_costs"],
      texte: (c) => {
        const e = equipe(c);
        return [
          `${c.entreprise} emploie ${qte(e.effectif)} salariés. Leur paie, cotisations patronales comprises, coûte ${eur(e.cout)} par mois : c'est la paie du cours. Dans l'arène, chaque salarié donne ${heures(e.heuresParSalarie)} par mois, la durée légale de 35 heures par semaine.`,
          "Le manager regarde trois choses : ce que coûte une heure de son équipe, ce qu'elle fait vendre, et si elle suffit à l'activité. L'arène ne suit pas l'affluence heure par heure : le planning de la semaine reste à bâtir sur le terrain, ce chapitre en pose les chiffres.",
        ];
      },
      repere: () => "Coût horaire chargé = coût total du personnel ÷ heures payées.",
    },
    {
      id: "cout-horaire",
      type: "montants",
      titre: "Le coût d'une heure",
      notions: ["productivity"],
      question: (c) => {
        const e = equipe(c);
        return `Calculez les heures payées du mois (${qte(e.effectif)} salariés à ${heures(e.heuresParSalarie)}), au centième, puis le coût horaire chargé de l'équipe, au centime.`;
      },
      champs: (c) => {
        const e = equipe(c);
        return [
          { libelle: "Heures payées du mois", attendu: e.heuresPayees, calcul: `${qte(e.effectif)} × ${heures(e.heuresParSalarie)} = ${heures(e.heuresPayees)}`, tolerance: 0.05 },
          { libelle: "Coût horaire chargé", attendu: e.coutHoraire, calcul: `${eur(e.cout)} ÷ ${heures(e.heuresPayees)} = ${eur(e.coutHoraire)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const e = equipe(c);
        return [`Une heure de l'équipe de ${c.entreprise} coûte ${eur(e.coutHoraire)}. Une heure de vendeur inoccupé coûte autant qu'une heure de vente.`];
      },
    },
    {
      id: "productivite",
      type: "montants",
      titre: "Ce que l'équipe fait vendre",
      notions: ["productivity", "revenue"],
      question: (c) => {
        const e = equipe(c);
        return `Le mois fait ${eur(c.gestion.chiffreDAffaires)} de chiffre d'affaires hors taxes. Calculez le chiffre d'affaires par salarié (à l'euro), par heure payée (au centime), puis la part du personnel dans le chiffre d'affaires (${eur(e.cout)} de paie), en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const e = equipe(c);
        const ca = c.gestion.chiffreDAffaires;
        return [
          { libelle: "Chiffre d'affaires par salarié", attendu: e.caParSalarie, calcul: `${eur(ca)} ÷ ${qte(e.effectif)} = ${eur(e.caParSalarie)}`, tolerance: 1 },
          { libelle: "Chiffre d'affaires par heure", attendu: e.caParHeure, calcul: `${eur(ca)} ÷ ${heures(e.heuresPayees)} = ${eur(e.caParHeure)}`, tolerance: 0.02 },
          { libelle: "Part du personnel (%)", attendu: e.partDuPersonnel, calcul: `${eur(e.cout)} ÷ ${eur(ca)} × 100 = ${pct(e.partDuPersonnel)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const e = equipe(c);
        return [
          `Chaque heure payée fait vendre ${eur(e.caParHeure)} et en coûte ${eur(e.coutHoraire)}. Le personnel pèse ${pct(e.partDuPersonnel)} du chiffre d'affaires : c'est souvent la plus grosse charge du point de vente après les achats.`,
        ];
      },
    },
    {
      id: "charge",
      type: "montants",
      titre: "Les heures que l'activité demande",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const e = equipe(c);
        return `Dans l'arène, chaque ${c.unite} demande ${heures(e.heuresParUnite)} de travail. Pour ${qte(e.quantite)} ${c.unites} ce mois-ci, calculez les heures nécessaires (au centième), le taux d'occupation de l'équipe (au dixième), puis le nombre ${dE(c.unites)} que l'équipe pourrait servir avec toutes ses heures (à l'unité, arrondi en dessous).`;
      },
      champs: (c) => {
        const e = equipe(c);
        return [
          { libelle: "Heures nécessaires", attendu: e.heuresNecessaires, calcul: `${qte(e.quantite)} × ${heures(e.heuresParUnite)} = ${heures(e.heuresNecessaires)}`, tolerance: 0.05 },
          { libelle: "Taux d'occupation (%)", attendu: e.occupation, calcul: `${heures(e.heuresNecessaires)} ÷ ${heures(e.heuresPayees)} × 100 = ${pct(e.occupation)}`, tolerance: 0.1 },
          { libelle: "Capacité de l'équipe", attendu: e.capaciteDeLEquipe, calcul: `${heures(e.heuresPayees)} ÷ ${heures(e.heuresParUnite)} = ${qte(e.capaciteDeLEquipe)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const e = equipe(c);
        return [
          `L'activité occupe ${pct(e.occupation)} des heures de l'équipe : elle pourrait servir ${qte(e.capaciteDeLEquipe)} ${c.unites} au lieu de ${qte(e.quantite)}. Le reste du temps sert à ce que l'arène ne compte pas : accueillir, conseiller, ranger, encaisser.`,
        ];
      },
    },
    {
      id: "goulot",
      type: "choix",
      titre: "L'équipe limite-t-elle les ventes ?",
      notions: ["capacity"],
      question: (c) => {
        const e = equipe(c);
        return `L'équipe de ${c.entreprise} pourrait servir ${qte(e.capaciteDeLEquipe)} ${c.unites} par mois ; elle en sert ${qte(e.quantite)}. Une embauche ferait-elle vendre plus, ce mois-ci ?`;
      },
      options: (c) => {
        const e = equipe(c);
        const limite = e.capaciteDeLEquipe <= e.quantite * 1.05;
        return [
          {
            texte: "Non : l'équipe a de la marge, ce n'est pas elle qui limite les ventes.",
            juste: !limite,
            retour: !limite
              ? `Oui. Avec ${pct(e.occupation)} d'occupation, l'équipe pourrait servir bien plus. Si les ventes plafonnent, la cause est ailleurs : le stock, la salle, ou la demande. Embaucher ajouterait ${eur(e.coutParSalarie)} de charges sans vente de plus.`
              : `L'équipe est presque à son maximum : elle pourrait bien limiter les ventes.`,
          },
          {
            texte: "Oui : plus de salariés, c'est toujours plus de ventes.",
            juste: limite,
            retour: limite
              ? "Oui, ici l'équipe est presque à son maximum : une personne de plus permettrait de servir davantage."
              : "Une personne de plus ne vend que s'il y a des clients à servir et de quoi les servir. Ici, l'équipe n'est pas le goulot.",
          },
          {
            texte: "On ne peut pas le savoir sans planning horaire.",
            juste: false,
            retour: "Le planning dit comment répartir les heures dans la semaine ; la comparaison entre heures nécessaires et heures payées dit déjà si l'équipe, au total, suffit.",
          },
        ];
      },
    },
    {
      id: "embauche",
      type: "montants",
      titre: "Ce qu'une embauche doit rapporter",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => {
        const e = equipe(c);
        return `Un salarié de plus coûterait en moyenne ${eur(e.cout)} ÷ ${qte(e.effectif)} par mois. Avec un taux de marge sur coût variable de ${pct(e.tauxMcv)} (le chapitre sur le seuil), calculez ce coût mensuel (au centime), puis le chiffre d'affaires supplémentaire qu'il doit faire réaliser pour se payer (à l'euro, arrondi au-dessus).`;
      },
      champs: (c) => {
        const e = equipe(c);
        return [
          { libelle: "Coût mensuel d'un salarié", attendu: e.coutParSalarie, calcul: `${eur(e.cout)} ÷ ${qte(e.effectif)} = ${eur(e.coutParSalarie)}` },
          { libelle: "Chiffre d'affaires à réaliser en plus", attendu: e.caPourUneEmbauche, calcul: `${eur(e.coutParSalarie)} ÷ ${pct(e.tauxMcv)} = ${eur(e.caPourUneEmbauche)}`, tolerance: 2 },
        ];
      },
      explication: (c) => {
        const e = equipe(c);
        return [
          `Pour se payer, une embauche doit faire vendre ${eur(e.caPourUneEmbauche)} de plus chaque mois, soit ${pct(auDixieme((e.caPourUneEmbauche / c.gestion.chiffreDAffaires) * 100))} du chiffre d'affaires actuel. C'est la question à poser avant chaque recrutement : quelles ventes cette personne permettra-t-elle ?`,
        ];
      },
    },
  ],
};
