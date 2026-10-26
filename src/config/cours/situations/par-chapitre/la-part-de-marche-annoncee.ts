import { accordPluriel } from "../../accords";
import { anneeJouee, type Cas } from "../../cas";
import { MARCHES } from "../../chapitres/marche-et-part-de-marche";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CONSTRUIRE UN INDICATEUR JUSTE » : LA PART DE MARCHÉ ANNONCÉE
 * (Bac STMG, systèmes d'information de gestion, palier 1).
 *
 * Le commercial annonce, pour le rapport de l'année, une part de marché égale à la moyenne de ses
 * parts trimestrielles. La directrice commerciale veut savoir si c'est la part de l'année avant de
 * la publier. L'élève refait le calcul du chapitre (la moyenne de ratios face au ratio des
 * sommes) sur un autre indicateur : la part de marché de l'entreprise, ses ventes rapportées à la
 * demande des clients du marché, sur les quatre trimestres de l'année du cours (`anneeJouee`).
 *
 * Le cas est neuf par sa question : le chapitre pondère des prix par les ventes des enseignes ; le
 * cas pondère des parts de marché par la taille du marché de chaque trimestre, qui change avec la
 * saison. Il se joue dans les mêmes entreprises que le chapitre.
 */

/**
 * L'ÉCART QUI NE CHANGE RIEN : sous 1 point de part de marché, la moyenne annoncée et la part de
 * l'année disent la même chose au lecteur du rapport. C'est la règle de lecture du cours, la même
 * que celle d'une part stable dans « Des données à l'information ».
 */
export const ECART_NEGLIGEABLE = 1;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const points = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} point${Math.abs(t) >= 2 ? "s" : ""}`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type VerdictDeLaPart = "plus-basse" | "plus-haute" | "la-meme";

/** Les parts de marché de chaque trimestre, leur moyenne simple et la part de l'année. */
export function partAnnoncee(c: Cas) {
  const { partie } = anneeJouee(c.code);
  const trimestres = partie.rounds.map((tour, k) => {
    const segments = Object.values(tour.results["joueur"]!.market.bySegment);
    const ventes = Math.round(segments.reduce((t, v) => t + v.sold, 0));
    const marche = Math.round(segments.reduce((t, v) => t + v.potential, 0));
    return { trimestre: k + 1, ventes, marche, part: auDixieme((ventes / marche) * 100) };
  });
  const sommeDesParts = auDixieme(trimestres.reduce((t, x) => t + x.part, 0));
  const moyenne = auDixieme(sommeDesParts / trimestres.length);
  const ventes = trimestres.reduce((t, x) => t + x.ventes, 0);
  const marche = trimestres.reduce((t, x) => t + x.marche, 0);
  const partDeLAnnee = auDixieme((ventes / marche) * 100);
  const ecart = auDixieme(partDeLAnnee - moyenne);
  const verdict: VerdictDeLaPart = ecart < -ECART_NEGLIGEABLE ? "plus-basse" : ecart > ECART_NEGLIGEABLE ? "plus-haute" : "la-meme";
  const plusGrosMarche = trimestres.reduce((m, x) => (x.marche > m.marche ? x : m), trimestres[0]!);
  return { trimestres, sommeDesParts, moyenne, ventes, marche, partDeLAnnee, ecart, verdict, plusGrosMarche };
}

const TRIMESTRES = ["1er trim.", "2e trim.", "3e trim.", "4e trim."] as const;

export const LA_PART_DE_MARCHE_ANNONCEE: Situation = {
  code: "la-part-de-marche-annoncee",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["construire-un-indicateur-juste"],
  commanditaire: "La directrice commerciale",
  titre: "La part de marché annoncée",
  accroche:
    "Le commercial annonce une part de marché de l'année égale à la moyenne de ses parts trimestrielles. Avant de la publier, la directrice commerciale veut savoir si c'est la bonne.",
  objectifs: [
    "Calculer la moyenne simple de parts trimestrielles",
    "Calculer la part de l'année comme un ratio des sommes",
    "Dire si l'indicateur annoncé est juste, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: MARCHES,
    pourquoi:
      "ce cas reprend le chapitre « Construire un indicateur juste », qui ne se joue pas chez VOLT FITNESS : son chiffre d'affaires compte aussi les abonnés gardés, que ses ventes ne comptent pas.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La part que le commercial annonce",
      tableau: (c) => {
        const k = partAnnoncee(c);
        return {
          titre: `Les ventes ${dE(c.entreprise)} et la demande du marché, trimestre par trimestre`,
          colonnes: TRIMESTRES.slice(0, k.trimestres.length),
          lignes: [
            { libelle: `Ventes (${c.unites})`, valeurs: k.trimestres.map((x) => qte(x.ventes)) },
            { libelle: `Marché : demande des clients (${c.unites})`, valeurs: k.trimestres.map((x) => qte(x.marche)) },
            { libelle: "Part de marché du trimestre", valeurs: k.trimestres.map((x) => pct(x.part)) },
          ],
        };
      },
      texte: (c) => [
        `« Pour le rapport de l'année, le commercial annonce la part de marché ${dE(c.entreprise)} : la moyenne de ses parts trimestrielles. Avant de la publier, dites-moi si c'est bien la part de l'année, et sinon laquelle. »`,
        "Pas de cours cette fois : le calcul est celui du chapitre. La part de marché d'un trimestre est ce que l'entreprise a vendu, divisé par la demande de tous les clients du marché ce trimestre.",
      ],
      repere: () => "À rendre : la moyenne annoncée, la part de l'année et l'écart entre les deux, et votre réponse.",
    },
    {
      id: "la-moyenne",
      type: "montants",
      titre: "La part annoncée",
      notions: ["demand_market_share", "dashboard"],
      question: () => "Calculez la part que le commercial annonce : la moyenne simple des parts de marché des trimestres, en pourcentage au dixième.",
      champs: (c) => {
        const k = partAnnoncee(c);
        return [
          {
            libelle: "Moyenne des parts trimestrielles (%)",
            attendu: k.moyenne,
            calcul: `(${k.trimestres.map((x) => pct(x.part)).join(" + ")}) ÷ ${qte(k.trimestres.length)} = ${pct(k.moyenne)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = partAnnoncee(c);
        return [`Le commercial annoncerait ${pct(k.moyenne)}. Chaque trimestre y compte pour autant, que le marché y soit petit ou grand.`];
      },
    },
    {
      id: "la-part-de-l-annee",
      type: "montants",
      titre: "La part de l'année",
      notions: ["demand_market_share", "seasonality"],
      question: (c) =>
        `Calculez la part de marché ${dE(c.entreprise)} sur l'année comme un ratio des sommes : les ventes de l'année, la demande du marché sur l'année, leur rapport en pourcentage au dixième, puis l'écart avec la moyenne annoncée, en points (part de l'année moins moyenne).`,
      champs: (c) => {
        const k = partAnnoncee(c);
        return [
          {
            libelle: "Ventes de l'année",
            attendu: k.ventes,
            calcul: `${k.trimestres.map((x) => qte(x.ventes)).join(" + ")} = ${qte(k.ventes)}`,
            tolerance: 1,
          },
          {
            libelle: "Demande du marché sur l'année",
            attendu: k.marche,
            calcul: `${k.trimestres.map((x) => qte(x.marche)).join(" + ")} = ${qte(k.marche)}`,
            tolerance: 1,
          },
          {
            libelle: "Part de marché de l'année (%)",
            attendu: k.partDeLAnnee,
            calcul: `${qte(k.ventes)} ÷ ${qte(k.marche)} × 100 = ${pct(k.partDeLAnnee)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Écart avec la moyenne annoncée (points)",
            attendu: k.ecart,
            calcul: `${pct(k.partDeLAnnee)} − ${pct(k.moyenne)} = ${points(k.ecart)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = partAnnoncee(c);
        const g = k.plusGrosMarche;
        return [
          `Le marché est le plus grand au ${TRIMESTRES[g.trimestre - 1]!.replace(" trim.", " trimestre")} (${qte(g.marche)} ${c.unites} ${accordPluriel(c, "demandé")}), où ${c.entreprise} prend ${pct(g.part)}. La part de l'année pèse chaque trimestre par la taille de son marché ; la moyenne simple, non.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice commerciale",
      notions: ["demand_market_share"],
      question: () => "Quelle réponse envoyez-vous à la directrice commerciale ?",
      options: (c) => {
        const k = partAnnoncee(c);
        const chiffres = `${pct(k.partDeLAnnee)} sur l'année, contre ${pct(k.moyenne)} annoncés : ${points(k.ecart)} d'écart`;
        return [
          {
            texte: "Non : la part de l'année est plus basse que celle annoncée",
            juste: k.verdict === "plus-basse",
            retour:
              k.verdict === "plus-basse"
                ? `Oui : ${chiffres}. ${c.entreprise} pèse moins dans les trimestres où le marché est grand : la moyenne simple embellit l'année. Publiée, elle ferait croire à une place que l'entreprise n'a pas, et fixerait des objectifs sur un chiffre faux.`
                : `Non : ${chiffres}.`,
          },
          {
            texte: "Non : la part de l'année est plus haute que celle annoncée",
            juste: k.verdict === "plus-haute",
            retour:
              k.verdict === "plus-haute"
                ? `Oui : ${chiffres}. ${c.entreprise} pèse plus dans les trimestres où le marché est grand : la moyenne simple sous-estime l'année.`
                : `Non : ${chiffres}.`,
          },
          {
            texte: `Oui : l'écart reste sous ${points(ECART_NEGLIGEABLE)}, c'est la même`,
            juste: k.verdict === "la-meme",
            retour:
              k.verdict === "la-meme"
                ? `Oui : ${chiffres}. Ici, l'écart ne change pas la lecture du rapport. La part juste reste pourtant celle de l'année : c'est elle qu'on publie, la moyenne simple tomberait juste par hasard.`
                : `Non : ${chiffres}. L'écart dépasse ${points(ECART_NEGLIGEABLE)} : la moyenne simple ne pèse pas chaque trimestre par la taille de son marché.`,
          },
        ];
      },
    },
  ],
};
