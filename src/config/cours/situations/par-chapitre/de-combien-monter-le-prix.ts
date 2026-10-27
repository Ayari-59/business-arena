import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { HAUSSE_DU_PRIX, LA_CONCURRENCE, marcheAuPrixMonte, marcheDeReference, prixMonte, vendeursDe, type Vendeur } from "../../chapitres/la-concurrence";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA CONCURRENCE : PLUSIEURS VENDEURS POUR LES MÊMES CLIENTS » : DE
 * COMBIEN MONTER LE PRIX ? (Seconde, sciences économiques et sociales, palier 1).
 *
 * La dirigeante veut monter son prix, et hésite entre une petite hausse et la hausse du chapitre.
 * L'arène rejoue l'année aux deux prix (`marcheAuPrixMonte` : un prix absolu, celui du premier
 * trimestre monté de la hausse, posé à chaque trimestre ; clés « la-concurrence:prix-… »), avec
 * les mêmes concurrents et la même façon de gérer. L'élève reprend les calculs du chapitre : la
 * part de marché à chaque prix, ce que chaque hausse change au bénéfice, et rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre montre qu'une hausse fait partir des clients ; le
 * cas demande jusqu'où la concurrence laisse monter le prix. La réponse se calcule : le prix au
 * meilleur bénéfice de l'année, tel que le moteur le rejoue. Selon l'entreprise, c'est garder son
 * prix, la petite hausse ou la grande. La petite hausse est la seule hypothèse du cas.
 */

/** La petite hausse que la dirigeante envisage : 5 % (hypothèse du cas). */
export const HAUSSE_DOUCE = 0.05;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const ecart = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

export type Choix = "garder" | "douce" | "forte";

/** L'année jouée à un prix : les trois vendeurs, la part de marché et le bénéfice de l'entreprise. */
function aCePrix(vendeurs: Vendeur[]) {
  const total = vendeurs.reduce((t, v) => t + v.ventes, 0);
  const e = vendeurs[0]!;
  return { vendeurs, entreprise: e, ventesDuMarche: total, part: auDixieme((e.ventes / total) * 100), benefice: e.benefice };
}

/** L'année au prix du cours, puis montée de 5 % et de 10 % : ce que le cas lit et calcule. */
export function troisPrix(c: Cas) {
  const f = {
    garder: aCePrix(vendeursDe(c, marcheDeReference(c.code))),
    douce: aCePrix(vendeursDe(c, marcheAuPrixMonte(c.code, HAUSSE_DOUCE))),
    forte: aCePrix(vendeursDe(c, marcheAuPrixMonte(c.code, HAUSSE_DU_PRIX))),
  };
  const ordre: Choix[] = ["garder", "douce", "forte"];
  const meilleur = ordre.reduce((a, b) => (f[b].benefice > f[a].benefice ? b : a));
  return {
    ...f,
    prixDouce: prixMonte(c.code, HAUSSE_DOUCE),
    prixForte: prixMonte(c.code, HAUSSE_DU_PRIX),
    perduesDouce: f.garder.entreprise.ventes - f.douce.entreprise.ventes,
    ecartDouce: f.douce.benefice - f.garder.benefice,
    ecartForte: f.forte.benefice - f.garder.benefice,
    meilleur,
  };
}

const COLONNES = ["Prix de l'année", `Monté de ${pct(HAUSSE_DOUCE * 100)}`, `Monté de ${pct(HAUSSE_DU_PRIX * 100)}`];

function tableauDesTroisPrix(c: Cas): TableauDeDonnees {
  const k = troisPrix(c);
  const annees = [k.garder, k.douce, k.forte];
  const [, a, b] = k.garder.vendeurs as [Vendeur, Vendeur, Vendeur];
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée à chaque prix`,
    colonnes: COLONNES,
    lignes: [
      { libelle: `Prix moyen ${dE(c.entreprise)}`, valeurs: annees.map((x) => eur(x.entreprise.prix)) },
      { libelle: `Ventes ${dE(c.entreprise)}`, valeurs: annees.map((x) => qte(x.entreprise.ventes)) },
      { libelle: `Ventes ${dE(a.nom)}`, valeurs: annees.map((x) => qte(x.vendeurs[1]!.ventes)) },
      { libelle: `Ventes ${dE(b.nom)}`, valeurs: annees.map((x) => qte(x.vendeurs[2]!.ventes)) },
      { libelle: `Bénéfice ${dE(c.entreprise)}`, valeurs: annees.map((x) => eur(x.benefice)) },
    ],
  };
}

export const DE_COMBIEN_MONTER_LE_PRIX: Situation = {
  code: "de-combien-monter-le-prix",
  parcours: "seconde-ses",
  palier: 1,
  blocs: [],
  reprend: [LA_CONCURRENCE.code],
  commanditaire: "La dirigeante de l'entreprise",
  titre: "De combien monter le prix ?",
  accroche:
    "La dirigeante veut monter son prix, un peu ou beaucoup. Mais ses deux concurrents attendent les clients qu'elle laissera partir. L'arène rejoue l'année à chaque prix : à vous de dire jusqu'où monter.",
  objectifs: [
    "Calculer une part de marché à chaque prix",
    "Chiffrer ce qu'une hausse de prix change au bénéfice",
    "Choisir un prix face à la concurrence, chiffres à l'appui",
  ],
  libre: false,
  entreprises: LA_CONCURRENCE.entreprises,
  etapes: [
    {
      id: "la-question",
      type: "lecture",
      titre: "La question de la dirigeante",
      tableau: tableauDesTroisPrix,
      texte: (c) => {
        const k = troisPrix(c);
        const [, a, b] = k.garder.vendeurs as [Vendeur, Vendeur, Vendeur];
        const prix = k.prixDouce.articles
          ? `chaque article ${pct(HAUSSE_DOUCE * 100)} ou ${pct(HAUSSE_DU_PRIX * 100)} plus cher qu'au premier trimestre`
          : `${eur(k.prixDouce.apres)} ou ${eur(k.prixForte.apres)} au lieu de ${eur(k.prixDouce.avant)}`;
        return [
          `« Je veux monter notre prix : ${prix}, toute l'année. Mais ${a.nom} et ${b.nom} sont là, et je ne veux pas leur offrir nos clients. De combien monter, ou faut-il ne rien changer ? »`,
          "L'arène a rejoué l'année à chaque prix, avec les mêmes concurrents et la même façon de gérer. Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : la part de marché de l'entreprise à chaque prix, ce que chaque hausse change au bénéfice, et votre réponse.",
    },
    {
      id: "les-parts",
      type: "montants",
      titre: "La part de marché à chaque prix",
      notions: ["demand_market_share"],
      question: (c) =>
        `Calculez la part de marché ${dE(c.entreprise)} à chaque prix (la petite hausse est de ${pct(HAUSSE_DOUCE * 100)}, la grande de ${pct(HAUSSE_DU_PRIX * 100)}) : ses ventes, sur les ventes des trois vendeurs, en pourcentage au dixième.`,
      champs: (c) => {
        const k = troisPrix(c);
        const champ = (libelle: string, x: ReturnType<typeof aCePrix>) => ({
          libelle,
          attendu: x.part,
          calcul: `${qte(x.entreprise.ventes)} ÷ (${x.vendeurs.map((v) => qte(v.ventes)).join(" + ")}) × 100 = ${pct(x.part)}`,
          tolerance: 0.1,
        });
        return [
          champ("Part de marché au prix de l'année (%)", k.garder),
          champ("Part de marché après la petite hausse (%)", k.douce),
          champ("Part de marché après la grande hausse (%)", k.forte),
        ];
      },
      explication: (c) => {
        const k = troisPrix(c);
        return [
          `Chaque hausse coûte des clients à ${c.entreprise} : sa part de marché passe de ${pct(k.garder.part)} à ${pct(k.douce.part)}, puis à ${pct(k.forte.part)}.`,
        ];
      },
    },
    {
      id: "le-benefice",
      type: "montants",
      titre: "Ce que chaque hausse change au bénéfice",
      notions: ["income_statement", "price_elasticity"],
      question: (c) =>
        `Calculez les ventes perdues par ${c.entreprise} avec la petite hausse (${pct(HAUSSE_DOUCE * 100)}), puis l'écart de bénéfice de chaque hausse face au prix de l'année, la petite et la grande (${pct(HAUSSE_DU_PRIX * 100)}) ; négatif si le bénéfice baisse.`,
      champs: (c) => {
        const k = troisPrix(c);
        return [
          {
            libelle: "Ventes perdues avec la petite hausse",
            attendu: k.perduesDouce,
            calcul: `${qte(k.garder.entreprise.ventes)} − ${qte(k.douce.entreprise.ventes)} = ${qte(k.perduesDouce)}`,
          },
          {
            libelle: "Écart de bénéfice de la petite hausse",
            attendu: k.ecartDouce,
            calcul: `${eur(k.douce.benefice)} − ${eur(k.garder.benefice)} = ${ecart(k.ecartDouce)}`,
          },
          {
            libelle: "Écart de bénéfice de la grande hausse",
            attendu: k.ecartForte,
            calcul: `${eur(k.forte.benefice)} − ${eur(k.garder.benefice)} = ${ecart(k.ecartForte)}`,
          },
        ];
      },
      explication: (c) => {
        const k = troisPrix(c);
        return [
          `Avec ${pct(HAUSSE_DOUCE * 100)} de plus, le bénéfice ${dE(c.entreprise)} change de ${ecart(k.ecartDouce)} ; avec ${pct(HAUSSE_DU_PRIX * 100)}, de ${ecart(k.ecartForte)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la dirigeante",
      notions: ["price_elasticity", "demand_market_share"],
      question: () => "Que répondez-vous à la dirigeante ?",
      options: (c) => {
        const k = troisPrix(c);
        const dit = (x: Choix) =>
          x === k.meilleur
            ? `Oui : c'est le meilleur bénéfice de l'année, ${eur(k[x].benefice)}, avec ${pct(k[x].part)} du marché.`
            : `Non : ${eur(k[x].benefice)} de bénéfice, contre ${eur(k[k.meilleur].benefice)} pour le meilleur choix.`;
        const lecon =
          k.meilleur === "garder"
            ? " Ici, la concurrence ne laisse pas monter le prix : chaque client perdu coûte plus que la hausse ne rapporte."
            : k.meilleur === "douce"
              ? " Un peu plus cher, les clients restent ; beaucoup plus cher, trop partent chez les concurrents ou renoncent."
              : ` Les clients tiennent à ce vendeur : la concurrence laisse monter le prix, au prix de ${qte(auDixieme(k.garder.part - k.forte.part))} points de part de marché.`;
        return [
          { texte: "Garder le prix", juste: k.meilleur === "garder", retour: `${dit("garder")}${k.meilleur === "garder" ? lecon : ""}` },
          { texte: `Monter de ${pct(HAUSSE_DOUCE * 100)}`, juste: k.meilleur === "douce", retour: `${dit("douce")}${k.meilleur === "douce" ? lecon : ""}` },
          { texte: `Monter de ${pct(HAUSSE_DU_PRIX * 100)}`, juste: k.meilleur === "forte", retour: `${dit("forte")}${k.meilleur === "forte" ? lecon : ""}` },
        ];
      },
    },
  ],
};
