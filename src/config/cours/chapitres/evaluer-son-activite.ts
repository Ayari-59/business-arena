import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { type Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FICHE_DE_GESTION,
  PAS_DU_PRIX_DU_SEMESTRE,
  PRIX_STABLE,
  margeDUneEnceinte,
  moisLePlusFaible,
  prixQuiMetChaqueMoisEnBenefice,
  semestreDeNova,
} from "../monde/gestion-et-information";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : ÉVALUER SON ACTIVITÉ, QUELQUES INDICATEURS POUR PILOTER (seconde, management et
 * gestion, palier 1).
 *
 * Quatre indicateurs, six mois : le chiffre d'affaires, les ventes, le résultat et la trésorerie de
 * fin de mois. L'élève calcule l'évolution en pourcentage du chiffre d'affaires et des ventes du
 * premier au dernier mois, lit ce que les deux pourcentages disent du prix moyen, repère le
 * meilleur mois, mesure en euros ce qu'ont fait le résultat et la trésorerie (un résultat peut être
 * négatif : un pourcentage n'y aurait pas de sens), puis dit ce que les indicateurs disent
 * ensemble. Un curseur (combien d'enceintes de plus sortent le mois le plus faible de la perte ?)
 * et un laboratoire (le prix qui met chaque mois en bénéfice).
 *
 * Il ne double pas « Le tableau de bord » (palier 4 : taux de marge, seuil, indice de sécurité,
 * voyants) : ici, la lecture simple d'un petit nombre d'indicateurs, au niveau de la seconde.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : le semestre du contrôle de gestion
 * (le tableau de bord de couts-et-budgets.ts, lu par monde/gestion-et-information.ts), de janvier à
 * juin. Le résultat est celui de la gestion (la marge des ventes moins les charges fixes du mois),
 * la trésorerie celle du budget de trésorerie. La seule règle de lecture ajoutée est le seuil sous
 * lequel un prix moyen se lit comme stable (PRIX_STABLE).
 *
 * CE QUI A CHANGÉ. Le chapitre lisait quatre trimestres de l'arène, dans neuf entreprises. Il lit
 * maintenant six mois de NOVA : de 93 810 € à 126 909 € de chiffre d'affaires, un mois de février en
 * perte (−733 €).
 */

export { PRIX_STABLE };

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const signe = (t: number) => (t > 0 ? `+${pct(t)}` : pct(t));
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « en janvier », « en avril ». */
const enMois = (nom: string) => `en ${nom}`;

export const POURQUOI_EVALUER = "ce chapitre suit NOVA mois par mois, sur le semestre que le contrôle de gestion du cours tient.";

export interface IndicateursSimples {
  nom: string;
  chiffreDAffaires: number;
  ventes: number;
  resultat: number;
  tresorerie: number;
}

/** Les quatre indicateurs de chaque mois du semestre. */
export const indicateursDuSemestre = (): IndicateursSimples[] => semestreDeNova(FICHE_DE_GESTION);

/** L'évolution en pourcentage, au dixième, d'une valeur de départ à une valeur d'arrivée. */
export const evolution = (depart: number, arrivee: number) => auDixieme(((arrivee - depart) / depart) * 100);

export type Prix = "stable" | "baisse" | "hausse";
export type Lecture = "en-hausse" | "chiffre-en-hausse" | "en-baisse" | "resultat-en-hausse";

/** Ce que disent deux indicateurs ensemble, d'une période à l'autre. */
export const lectureDe = (caMonte: boolean, resultatMonte: boolean): Lecture =>
  caMonte ? (resultatMonte ? "en-hausse" : "chiffre-en-hausse") : resultatMonte ? "resultat-en-hausse" : "en-baisse";

/** Le prix moyen d'une période à l'autre : stable à `PRIX_STABLE` près, sinon en baisse ou en hausse. */
export const prixDe = (avant: number, apres: number): Prix => (Math.abs(apres / avant - 1) < PRIX_STABLE ? "stable" : apres < avant ? "baisse" : "hausse");

/** Le semestre en quatre indicateurs, leurs évolutions, et ce qu'ils disent ensemble. */
export function activiteDuSemestre() {
  const t = indicateursDuSemestre();
  const premier = t[0]!;
  const dernier = t[t.length - 1]!;
  const prixPremier = auCentime(premier.chiffreDAffaires / premier.ventes);
  const prixDernier = auCentime(dernier.chiffreDAffaires / dernier.ventes);
  const resultats = t.map((x) => x.resultat);
  const chiffres = t.map((x) => x.chiffreDAffaires);
  return {
    mois: t,
    premier,
    dernier,
    evolutionDuChiffre: evolution(premier.chiffreDAffaires, dernier.chiffreDAffaires),
    evolutionDesVentes: evolution(premier.ventes, dernier.ventes),
    prixPremier,
    prixDernier,
    prix: prixDe(prixPremier, prixDernier),
    meilleur: resultats.indexOf(Math.max(...resultats)),
    plusGrosChiffre: chiffres.indexOf(Math.max(...chiffres)),
    ecartDeResultat: auCentime(dernier.resultat - premier.resultat),
    ecartDeTresorerie: auCentime(dernier.tresorerie - premier.tresorerie),
    lecture: lectureDe(dernier.chiffreDAffaires > premier.chiffreDAffaires, dernier.resultat > premier.resultat),
  };
}

export function tableauDuSemestre(c: Cas, t: readonly IndicateursSimples[] = indicateursDuSemestre()): TableauDeDonnees {
  const ligne = (libelle: string, f: (x: IndicateursSimples) => string) => ({ libelle, valeurs: t.map(f) });
  return {
    titre: `Le semestre ${dE(c.entreprise)}, mois par mois`,
    colonnes: t.map((x) => majuscule(x.nom)),
    lignes: [
      ligne("Chiffre d'affaires", (x) => eur(x.chiffreDAffaires)),
      ligne(`Ventes (${c.unites})`, (x) => qte(x.ventes)),
      ligne("Résultat de l'activité du mois", (x) => eur(x.resultat)),
      ligne("Trésorerie de fin de mois", (x) => eur(x.tresorerie)),
    ],
  };
}

export const EVALUER_SON_ACTIVITE: Chapitre = {
  code: "evaluer-son-activite",
  parcours: "seconde-mg",
  palier: 1,
  blocs: ["2de MG · Évaluer et évoluer, du pilotage aux développements numériques"],
  titre: "Évaluer son activité : quelques indicateurs pour piloter",
  accroche:
    "Le chiffre d'affaires, les ventes, le résultat, la trésorerie : quatre indicateurs suivis mois après mois, leur évolution en pourcentage, et ce qu'ils disent ensemble de l'activité.",
  objectifs: [
    "Lire quelques indicateurs d'activité dans le temps",
    "Calculer une évolution en pourcentage",
    "Relier l'évolution du chiffre d'affaires à celle des ventes et du prix",
    "Dire, indicateurs à l'appui, si l'activité va mieux ou moins bien",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_EVALUER },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Quatre indicateurs, mois après mois",
      notions: ["dashboard", "revenue"],
      tableau: (c) => tableauDuSemestre(c),
      texte: (c) => [
        `Voici le premier semestre ${dE(c.entreprise)}, mois par mois. Pour savoir si l'activité va bien, la dirigeante ne relit pas tous les comptes : elle suit quelques indicateurs, toujours les mêmes, d'un mois à l'autre.`,
        `Le chiffre d'affaires dit combien l'entreprise a vendu en euros ; les ventes, combien d'${c.unites} ; le résultat de l'activité du mois, ce qu'elle a gagné ou perdu en travaillant (avant les intérêts de l'emprunt) ; la trésorerie, l'argent qu'elle a en banque à la fin du mois.`,
      ],
      repere: () => "Évolution en % = (valeur d'arrivée − valeur de départ) ÷ valeur de départ × 100.",
    },
    {
      id: "evolutions",
      type: "montants",
      titre: "L'évolution du chiffre d'affaires et des ventes",
      notions: ["revenue", "dashboard"],
      tableau: (c) => tableauDuSemestre(c),
      question: () => "Calculez, en pourcentage et au dixième, l'évolution du chiffre d'affaires de janvier à juin, puis celle des ventes. Une baisse donnerait un pourcentage négatif.",
      champs: () => {
        const k = activiteDuSemestre();
        return [
          { libelle: "Évolution du chiffre d'affaires, de janvier à juin (%)", attendu: k.evolutionDuChiffre, calcul: `(${eur(k.dernier.chiffreDAffaires)} − ${eur(k.premier.chiffreDAffaires)}) ÷ ${eur(k.premier.chiffreDAffaires)} × 100 = ${pct(k.evolutionDuChiffre)}`, tolerance: 0.1 },
          { libelle: "Évolution des ventes, de janvier à juin (%)", attendu: k.evolutionDesVentes, calcul: `(${qte(k.dernier.ventes)} − ${qte(k.premier.ventes)}) ÷ ${qte(k.premier.ventes)} × 100 = ${pct(k.evolutionDesVentes)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = activiteDuSemestre();
        return [
          `De janvier à juin, le chiffre d'affaires ${dE(c.entreprise)} évolue de ${signe(k.evolutionDuChiffre)}, ses ventes de ${signe(k.evolutionDesVentes)}. Un pourcentage permet de comparer des indicateurs qui ne se comptent pas dans la même unité : des euros d'un côté, des ${c.unites} de l'autre.`,
        ];
      },
    },
    {
      id: "le-prix-moyen",
      type: "choix",
      titre: "Ce que disent les deux pourcentages",
      notions: ["revenue"],
      question: () => {
        const k = activiteDuSemestre();
        return `De janvier à juin, le chiffre d'affaires évolue de ${signe(k.evolutionDuChiffre)} et les ventes de ${signe(k.evolutionDesVentes)}. Qu'en conclure sur le prix moyen d'une vente ?`;
      },
      options: () => {
        const k = activiteDuSemestre();
        const prix = k.prixPremier === k.prixDernier ? `Le prix moyen (chiffre d'affaires ÷ ventes) reste à ${eur(k.prixPremier)}.` : `Le prix moyen (chiffre d'affaires ÷ ventes) passe de ${eur(k.prixPremier)} à ${eur(k.prixDernier)}.`;
        return [
          { texte: "Il n'a presque pas bougé : les deux évoluent ensemble", juste: k.prix === "stable", retour: k.prix === "stable" ? `Oui. ${prix} Quand le prix ne bouge pas, le chiffre d'affaires suit les ventes.` : `Non. ${prix}` },
          { texte: "Il a baissé : le chiffre d'affaires évolue moins bien que les ventes", juste: k.prix === "baisse", retour: k.prix === "baisse" ? `Oui. ${prix}` : `Non. ${prix}` },
          { texte: "Il a monté : le chiffre d'affaires évolue mieux que les ventes", juste: k.prix === "hausse", retour: k.prix === "hausse" ? `Oui. ${prix}` : `Non. ${prix}` },
        ];
      },
    },
    {
      id: "le-meilleur-mois",
      type: "choix",
      titre: "Le meilleur mois",
      notions: ["income_statement", "seasonality"],
      tableau: (c) => tableauDuSemestre(c),
      question: (c) => `Quel mois a donné à ${c.entreprise} le meilleur résultat ?`,
      options: () => {
        const k = activiteDuSemestre();
        return k.mois.map((x, i) => ({
          texte: majuscule(x.nom),
          juste: i === k.meilleur,
          retour:
            i === k.meilleur
              ? `Oui : ${eur(x.resultat)} de résultat, le meilleur du semestre. ${k.plusGrosChiffre === k.meilleur ? "C'est aussi le mois du plus gros chiffre d'affaires : à prix égal, chaque enceinte vendue en plus ajoute sa marge, et les charges fixes ne bougent pas." : "Ce n'est pourtant pas le mois du plus gros chiffre d'affaires."}`
              : `Non : ${eur(x.resultat)} de résultat ${enMois(x.nom)}, contre ${eur(k.mois[k.meilleur]!.resultat)} ${enMois(k.mois[k.meilleur]!.nom)}.`,
        }));
      },
    },
    {
      id: "resultat-et-tresorerie",
      type: "montants",
      titre: "Le résultat et la trésorerie",
      notions: ["income_statement", "net_treasury"],
      tableau: (c) => tableauDuSemestre(c),
      question: () =>
        "Un résultat peut être négatif : partir d'une perte rendrait un pourcentage trompeur. Mesurez donc en euros, de janvier à juin, l'écart de résultat du mois, puis l'écart de trésorerie de fin de mois (une baisse donnerait un écart négatif).",
      champs: () => {
        const k = activiteDuSemestre();
        return [
          { libelle: "Écart de résultat, de janvier à juin", attendu: k.ecartDeResultat, calcul: `${eur(k.dernier.resultat)} − ${retranche(k.premier.resultat)} = ${eur(k.ecartDeResultat)}` },
          { libelle: "Écart de trésorerie, de janvier à juin", attendu: k.ecartDeTresorerie, calcul: `${eur(k.dernier.tresorerie)} − ${retranche(k.premier.tresorerie)} = ${eur(k.ecartDeTresorerie)}` },
        ];
      },
      explication: () => {
        const k = activiteDuSemestre();
        const plusBas = k.mois.reduce((m, x) => (x.tresorerie < m.tresorerie ? x : m));
        return [
          `Le résultat du mois monte de ${eur(k.ecartDeResultat)}, la trésorerie de ${eur(k.ecartDeTresorerie)}. Mais la trésorerie n'a pas monté tout le semestre : elle est tombée à ${eur(plusBas.tresorerie)} fin ${plusBas.nom}, quand il a fallu payer les composants, la TVA et l'échéance de l'emprunt, avant que CampusTech ne commence à payer, avec du retard.`,
        ];
      },
    },
    {
      id: "va-t-elle-bien",
      type: "choix",
      titre: "L'activité va-t-elle mieux ?",
      notions: ["dashboard", "revenue", "income_statement"],
      tableau: (c) => tableauDuSemestre(c),
      question: (c) => {
        const k = activiteDuSemestre();
        return `De janvier à juin, chiffre d'affaires ${signe(k.evolutionDuChiffre)}, résultat du mois de ${eur(k.premier.resultat)} à ${eur(k.dernier.resultat)}. L'activité ${dE(c.entreprise)} va-t-elle mieux en juin qu'en janvier ?`;
      },
      options: () => {
        const k = activiteDuSemestre();
        const chiffres = `Chiffre d'affaires ${signe(k.evolutionDuChiffre)}, résultat ${k.ecartDeResultat > 0 ? "en hausse" : "en baisse"} de ${eur(Math.abs(k.ecartDeResultat))}, trésorerie ${k.ecartDeTresorerie > 0 ? "en hausse" : "en baisse"} de ${eur(Math.abs(k.ecartDeTresorerie))}.`;
        const lecture = (l: Lecture, oui: string) => ({ juste: k.lecture === l, retour: k.lecture === l ? `Oui. ${chiffres} ${oui}` : `Non. ${chiffres}` });
        return [
          { texte: "Oui : chiffre d'affaires et résultat en hausse", ...lecture("en-hausse", "L'entreprise vend davantage, avec un meilleur résultat : les deux indicateurs les plus importants vont dans le bon sens.") },
          { texte: "En partie : chiffre d'affaires en hausse, mais résultat en baisse", ...lecture("chiffre-en-hausse", "Vendre plus ne suffit pas : les charges ont augmenté plus que le chiffre d'affaires.") },
          { texte: "Non : chiffre d'affaires et résultat en baisse", ...lecture("en-baisse", "L'entreprise vend moins, avec un moins bon résultat.") },
          { texte: "En partie : chiffre d'affaires en baisse, mais résultat en hausse", ...lecture("resultat-en-hausse", "L'entreprise vend moins, mais ses charges ont baissé plus que son chiffre d'affaires.") },
        ];
      },
    },
    {
      id: "le-mois-en-perte",
      type: "curseur",
      titre: "Sortir le mois le plus faible de la perte",
      notions: ["income_statement", "fixed_costs"],
      question: (c) => {
        const p = moisLePlusFaible(FICHE_DE_GESTION);
        return `${majuscule(enMois(p.nom))}, ${c.entreprise} a vendu ${qte(p.ventes)} ${c.unites} et perdu ${eur(-p.resultat)}. Chaque ${c.unite} vendue en plus laisse ${eur(margeDUneEnceinte())} de marge, et les charges du mois ne bougent pas. Faites varier les ${c.unites} vendues en plus, et placez le curseur sur le plus petit nombre qui met le mois à l'équilibre.`;
      },
      grandeur: (c) => ({ libelle: `${majuscule(c.unites)} vendues en plus`, unite: c.unites }),
      cible: () => ({ attendu: moisLePlusFaible(FICHE_DE_GESTION).enPlus, min: 0, max: 100 }),
      zones: ["Le mois est en bénéfice", "Le mois est en perte"],
      montrer: "Montrer le nombre",
      lecture: (_c, q) => {
        const p = moisLePlusFaible(FICHE_DE_GESTION);
        return [
          { libelle: "Marge en plus", montant: auCentime(q * margeDUneEnceinte()) },
          { libelle: "Résultat du mois", montant: auCentime(p.resultat + q * margeDUneEnceinte()), fort: true },
        ];
      },
      droites: () => {
        const p = moisLePlusFaible(FICHE_DE_GESTION);
        return { produit: (q) => p.marge + q * margeDUneEnceinte(), cout: () => auCentime(p.marge - p.resultat), libelles: ["Marge des ventes du mois", "Charges fixes du mois"] };
      },
      explication: (c) => {
        const p = moisLePlusFaible(FICHE_DE_GESTION);
        return [
          `Il suffit de ${qte(p.enPlus)} ${c.unites} de plus : leur marge, ${eur(auCentime(p.enPlus * margeDUneEnceinte()))}, couvre la perte de ${eur(-p.resultat)}. Avec ${qte(p.enPlus - 1)}, le mois reste en perte de ${eur(-auCentime(p.resultat + (p.enPlus - 1) * margeDUneEnceinte()))}.`,
          `Un mois en perte n'est pas une activité qui va mal : ${p.nom} est court, et les charges fixes ne raccourcissent pas avec lui.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-prix",
      type: "simulation",
      titre: "Le laboratoire du prix",
      notions: ["dashboard", "revenue"],
      question: (c) =>
        `Et si ${c.entreprise} montait un peu son prix, ses clients achetant autant ? Faites varier le prix d'une ${c.unite}, et regardez le résultat de chaque mois et du semestre.`,
      leviers: () => [{ code: "prix", libelle: "Prix d'une enceinte, hors taxes", unite: "€", min: 57, max: 62, pas: PAS_DU_PRIX_DU_SEMESTRE, depart: FICHE_DE_GESTION.moisDeReference.prix }],
      lecture: (_c, p) => {
        const t = semestreDeNova(FICHE_DE_GESTION, p.prix!);
        const d = semestreDeNova(FICHE_DE_GESTION);
        const pire = t.reduce((m, x) => (x.resultat < m.resultat ? x : m));
        return [
          { libelle: `Résultat du mois le plus faible (${pire.nom})`, montant: pire.resultat, reference: d.find((x) => x.nom === pire.nom)!.resultat, fort: true },
          { libelle: "Résultat du semestre", montant: auCentime(t.reduce((s, x) => s + x.resultat, 0)), reference: auCentime(d.reduce((s, x) => s + x.resultat, 0)) },
          { libelle: "Trésorerie de fin juin", montant: t.at(-1)!.tresorerie, reference: d.at(-1)!.tresorerie },
        ];
      },
      defi: () => {
        const juste = prixQuiMetChaqueMoisEnBenefice(FICHE_DE_GESTION);
        return {
          consigne: "Trouvez le plus petit prix, au pas de 0,50 €, qui met chaque mois du semestre en bénéfice ou à l'équilibre.",
          atteint: (p) => Math.abs(p.prix! - juste) < 1e-9,
          indice: (p) => {
            const t = semestreDeNova(FICHE_DE_GESTION, p.prix!);
            const pertes = t.filter((x) => x.resultat < 0);
            return pertes.length > 0
              ? `${majuscule(pertes.map((x) => x.nom).join(" et "))} ${pertes.length > 1 ? "restent" : "reste"} en perte : le prix est trop bas.`
              : "Chaque mois est en bénéfice : un prix plus bas suffirait-il ?";
          },
          solution: { prix: juste },
        };
      },
      explication: (c, p) => {
        const t = semestreDeNova(FICHE_DE_GESTION, p.prix!);
        const pire = t.reduce((m, x) => (x.resultat < m.resultat ? x : m));
        return [
          `Défi relevé : à ${eur(p.prix!)}, le mois le plus faible, ${pire.nom}, gagne ${eur(pire.resultat)}. Le cours a gardé les ventes : si des clients partaient, la hausse coûterait des ventes.`,
          `Un indicateur ne décide de rien : il montre où regarder. Ici, c'est le mois le plus court qui est fragile, pas l'activité ${dE(c.entreprise)}.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard", "seasonality"],
      texte: (c) => {
        const k = activiteDuSemestre();
        return [
          `Chez ${c.entreprise}, de janvier à juin, le chiffre d'affaires évolue de ${signe(k.evolutionDuChiffre)} et le résultat du mois passe de ${eur(k.premier.resultat)} à ${eur(k.dernier.resultat)}. Le meilleur mois est ${k.mois[k.meilleur]!.nom}.`,
          "Un indicateur seul dit peu ; quelques indicateurs lus ensemble disent beaucoup : vend-on plus, à quel prix, gagne-t-on davantage, l'argent suit-il ? Dans l'arène, suivez les mêmes indicateurs, tour après tour : les chiffres de votre entreprise seront différents, la lecture sera la même.",
        ];
      },
      repere: () => "Piloter, c'est suivre peu d'indicateurs, toujours les mêmes, et lire leur évolution ensemble.",
    },
  ],
};
