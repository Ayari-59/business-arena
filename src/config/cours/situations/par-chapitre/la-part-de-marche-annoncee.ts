import { accordPluriel } from "../../accords";
import { type Cas } from "../../cas";
import { POURQUOI_L_INDICATEUR } from "../../chapitres/construire-un-indicateur-juste";
import { ENTREPRISES_DE_LA_GESTION_DE_BASE, FICHE_DE_GESTION, PART_STABLE, semestreDeNova } from "../../monde/gestion-et-information";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CONSTRUIRE UN INDICATEUR JUSTE » : LA PART DE MARCHÉ ANNONCÉE
 * (Bac STMG, systèmes d'information de gestion, palier 1).
 *
 * Le commercial annonce, pour le rapport du semestre, une part de marché égale à la moyenne de ses
 * parts mensuelles. La directrice commerciale veut savoir si c'est la part du semestre avant de la
 * publier. L'élève refait le calcul du chapitre (la moyenne de ratios face au ratio des sommes) sur
 * un autre indicateur : la part de marché de NOVA, ses ventes rapportées aux enceintes vendues par
 * tout le marché, sur les six mois du semestre.
 *
 * Le cas est neuf par sa question : le chapitre pondère des prix par les ventes des enseignes ; le
 * cas pondère des parts de marché par la taille du marché de chaque mois, qui grandit au printemps.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, chez NOVA seule : ses ventes du semestre et le marché des
 * enceintes mois par mois (nova-gestion.ts, lus par monde/gestion-et-information.ts). Il lisait
 * l'année de l'arène, dans huit entreprises.
 */

/**
 * L'ÉCART QUI NE CHANGE RIEN : sous 1 point de part de marché, la moyenne annoncée et la part du
 * semestre disent la même chose au lecteur du rapport. C'est la règle de lecture du cours, la même
 * que celle d'une part stable dans « Des données à l'information ».
 */
export const ECART_NEGLIGEABLE = PART_STABLE;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const points = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} point${Math.abs(t) >= 2 ? "s" : ""}`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export type VerdictDeLaPart = "plus-basse" | "plus-haute" | "la-meme";

/** Les parts de marché de chaque mois, leur moyenne simple et la part du semestre. */
export function partAnnoncee() {
  const f = FICHE_DE_GESTION;
  const mois = semestreDeNova(f).map((m, k) => {
    const marche = f.semestre.marche[k]!;
    return { nom: m.nom, ventes: m.ventes, marche, part: auDixieme((m.ventes / marche) * 100) };
  });
  const sommeDesParts = auDixieme(mois.reduce((t, x) => t + x.part, 0));
  const moyenne = auDixieme(sommeDesParts / mois.length);
  const ventes = mois.reduce((t, x) => t + x.ventes, 0);
  const marche = mois.reduce((t, x) => t + x.marche, 0);
  const partDuSemestre = auDixieme((ventes / marche) * 100);
  const ecart = auDixieme(partDuSemestre - moyenne);
  const verdict: VerdictDeLaPart = ecart < -ECART_NEGLIGEABLE ? "plus-basse" : ecart > ECART_NEGLIGEABLE ? "plus-haute" : "la-meme";
  const plusGrosMarche = mois.reduce((m, x) => (x.marche > m.marche ? x : m), mois[0]!);
  return { mois, sommeDesParts, moyenne, ventes, marche, partDuSemestre, ecart, verdict, plusGrosMarche };
}

export const LA_PART_DE_MARCHE_ANNONCEE: Situation = {
  code: "la-part-de-marche-annoncee",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["construire-un-indicateur-juste"],
  commanditaire: "La directrice commerciale",
  titre: "La part de marché annoncée",
  accroche: "Le commercial annonce une part de marché du semestre égale à la moyenne de ses parts mensuelles. Avant de la publier, la directrice commerciale veut savoir si c'est la bonne.",
  objectifs: ["Calculer la moyenne simple de parts mensuelles", "Calculer la part du semestre comme un ratio des sommes", "Dire si l'indicateur annoncé est juste, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_L_INDICATEUR },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La part que le commercial annonce",
      tableau: (c: Cas) => {
        const k = partAnnoncee();
        return {
          titre: `Les ventes ${dE(c.entreprise)} et le marché des ${c.unites}, mois par mois`,
          colonnes: k.mois.map((x) => majuscule(x.nom)),
          lignes: [
            { libelle: `Ventes (${c.unites})`, valeurs: k.mois.map((x) => qte(x.ventes)) },
            { libelle: `Marché : ${c.unites} vendues par toutes les enseignes`, valeurs: k.mois.map((x) => qte(x.marche)) },
            { libelle: "Part de marché du mois", valeurs: k.mois.map((x) => pct(x.part)) },
          ],
        };
      },
      texte: (c) => [
        `« Pour le rapport du semestre, le commercial annonce la part de marché ${dE(c.entreprise)} : la moyenne de ses parts mensuelles. Avant de la publier, dites-moi si c'est bien la part du semestre, et sinon laquelle. »`,
        "Pas de cours cette fois : le calcul est celui du chapitre. La part de marché d'un mois est ce que l'entreprise a vendu, divisé par ce que tout le marché a vendu ce mois-là.",
      ],
      repere: () => "À rendre : la moyenne annoncée, la part du semestre et l'écart entre les deux, et votre réponse.",
    },
    {
      id: "la-moyenne",
      type: "montants",
      titre: "La part annoncée",
      notions: ["demand_market_share", "dashboard"],
      question: () => "Calculez la part que le commercial annonce : la moyenne simple des parts de marché mensuelles, en pourcentage au dixième.",
      champs: () => {
        const k = partAnnoncee();
        return [{ libelle: "Moyenne des parts mensuelles (%)", attendu: k.moyenne, calcul: `(${k.mois.map((x) => pct(x.part)).join(" + ")}) ÷ ${qte(k.mois.length)} = ${pct(k.moyenne)}`, tolerance: 0.1 }];
      },
      explication: () => [`Le commercial annoncerait ${pct(partAnnoncee().moyenne)}. Chaque mois y compte pour autant, que le marché y soit petit ou grand.`],
    },
    {
      id: "la-part-du-semestre",
      type: "montants",
      titre: "La part du semestre",
      notions: ["demand_market_share", "seasonality"],
      question: (c) =>
        `Calculez la part de marché ${dE(c.entreprise)} sur le semestre comme un ratio des sommes : ses ventes du semestre, celles du marché, leur rapport en pourcentage au dixième, puis l'écart avec la moyenne annoncée, en points (part du semestre moins moyenne).`,
      champs: () => {
        const k = partAnnoncee();
        return [
          { libelle: "Ventes du semestre", attendu: k.ventes, calcul: `${k.mois.map((x) => qte(x.ventes)).join(" + ")} = ${qte(k.ventes)}` },
          { libelle: "Ventes du marché sur le semestre", attendu: k.marche, calcul: `${k.mois.map((x) => qte(x.marche)).join(" + ")} = ${qte(k.marche)}` },
          { libelle: "Part de marché du semestre (%)", attendu: k.partDuSemestre, calcul: `${qte(k.ventes)} ÷ ${qte(k.marche)} × 100 = ${pct(k.partDuSemestre)}`, tolerance: 0.1 },
          { libelle: "Écart avec la moyenne annoncée (points)", attendu: k.ecart, calcul: `${pct(k.partDuSemestre)} − ${pct(k.moyenne)} = ${points(k.ecart)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = partAnnoncee();
        const g = k.plusGrosMarche;
        return [
          `Le marché est le plus grand en ${g.nom} (${qte(g.marche)} ${c.unites} ${accordPluriel(c, "vendu")}), où ${c.entreprise} ne prend que ${pct(g.part)}. La part du semestre pèse chaque mois par la taille de son marché ; la moyenne simple donne autant de poids au petit mois de février qu'au grand mois de juin.`,
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
        const k = partAnnoncee();
        const chiffres = `${pct(k.partDuSemestre)} sur le semestre, contre ${pct(k.moyenne)} annoncés : ${points(k.ecart)} d'écart`;
        return [
          {
            texte: "Non : la part du semestre est plus basse que celle annoncée",
            juste: k.verdict === "plus-basse",
            retour: k.verdict === "plus-basse" ? `Oui : ${chiffres}. ${c.entreprise} pèse moins dans les mois où le marché est grand : la moyenne simple embellit le semestre.` : `Non : ${chiffres}.`,
          },
          {
            texte: "Non : la part du semestre est plus haute que celle annoncée",
            juste: k.verdict === "plus-haute",
            retour: k.verdict === "plus-haute" ? `Oui : ${chiffres}. ${c.entreprise} pèse plus dans les mois où le marché est grand : la moyenne simple sous-estime le semestre.` : `Non : ${chiffres}.`,
          },
          {
            texte: `Oui : l'écart reste sous ${points(ECART_NEGLIGEABLE)}, c'est la même`,
            juste: k.verdict === "la-meme",
            retour:
              k.verdict === "la-meme"
                ? `Oui : ${chiffres}. Ici, l'écart ne change pas la lecture du rapport. La part juste reste pourtant celle du semestre : c'est elle qu'on publie, la moyenne simple tombe juste par chance, parce que la part de ${c.entreprise} bouge peu d'un mois à l'autre.`
                : `Non : ${chiffres}. L'écart dépasse ${points(ECART_NEGLIGEABLE)} : la moyenne simple ne pèse pas chaque mois par la taille de son marché.`,
          },
        ];
      },
    },
  ],
};
