import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { accord, accordPluriel } from "../accords";
import type { Cas } from "../cas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VENTE, POURQUOI_LA_VENTE, trimestreDeLArene } from "./le-panier-moyen";

/**
 * CHAPITRE : SUIVRE SES VENTES, L'OBJECTIF, LE RÉALISÉ, L'ÉCART (Bac pro MCV, palier 1 :
 * seconde professionnelle relation client, première bac pro Métiers du commerce et de la vente).
 *
 * Le geste du vendeur devant son tableau de suivi : l'objectif de ventes du trimestre, ce qu'il a
 * vendu, l'écart en unités et en pourcentage, le taux de réalisation. Puis ce qui explique
 * l'écart, dans l'arène : les clients venus (la demande reçue), les clients servis (les ventes),
 * les clients repartis sans être servis, et les prix. Enfin, ce que le vendeur fait au trimestre
 * suivant.
 *
 * Il ne double pas « Se fixer des objectifs et les suivre » (Stratégie, palier 1) : là, la
 * direction pose en janvier un objectif sur la capacité de produire et le juge sur l'année.
 * Ici, l'objectif du vendeur se pose chaque trimestre sur ce qu'il a vendu au trimestre d'avant,
 * et se suit en unités du métier, clients et prix à l'appui. Ni « Le tableau de bord du
 * manager » (BTS MCO, palier 4), qui range une dizaine d'indicateurs.
 *
 * CE QUI VIENT DE L'ARÈNE. Les ventes, la demande adressée à l'entreprise et les prix de chaque
 * trimestre de l'année du cours (`anneeJouee`). Les prix ne sont pas un prix moyen : à la
 * boutique, le prix moyen bouge avec ce que les clients choisissent, alors que l'étiquette de
 * chaque article reste la même ; le chapitre lit donc le prix de chaque article.
 *
 * CE QUI N'EN VIENT PAS. La règle de l'objectif (les ventes du trimestre d'avant, majorées de
 * `PROGRESSION_EN_POURCENT`) est une hypothèse du cours, nommée ci-dessous, et le texte le dit.
 */

/**
 * L'objectif du trimestre : les ventes du trimestre d'avant, plus 10 %. HYPOTHÈSE DU COURS : la
 * règle la plus simple qu'un responsable de rayon donne à son équipe, « faire mieux que le
 * trimestre dernier ». En pourcentage entier, pour que l'objectif se calcule sans erreur
 * d'arrondi.
 */
export const PROGRESSION_EN_POURCENT = 10;

/** Le trimestre suivi : le deuxième, dont l'objectif se pose sur le premier. */
export const TRIMESTRE_SUIVI = 2;

/** L'écart de prix au-delà duquel un prix « a changé » d'un trimestre à l'autre : 1 %. */
export const SEUIL_DE_PRIX = 0.01;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
/** Un écart signé : « +690 », « −2 092 ». */
const signe = (n: number) => (n > 0 ? `+${qte(n)}` : qte(n));
const signePct = (t: number) => (t > 0 ? `+${pct(t)}` : pct(t));
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** L'objectif posé sur les ventes du trimestre d'avant : arrondi à l'unité du dessus. */
export const objectifSur = (ventes: number, progression = PROGRESSION_EN_POURCENT) => Math.ceil((ventes * (100 + progression)) / 100);

/** Les prix d'un trimestre : chaque article à la boutique, le prix d'une vente ailleurs. */
export function prixDuTrimestre(c: Cas, r: CompanyRoundResult): { nom: string; prix: number }[] {
  const s = scenarioByCode(c.code).scenario;
  if ((s.products?.length ?? 0) > 1) {
    return s.products!.map((p) => ({ nom: `Prix de l'article « ${p.name} »`, prix: auCentime(r.products![p.code]!.price) }));
  }
  const ventes = Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0);
  return [{ nom: `Prix d'${accord(c, "un")} ${c.unite}`, prix: auCentime(r.incomeStatement.revenue / ventes) }];
}

/** Ce que l'arène a fait d'un trimestre : les ventes, les clients venus, les clients repartis. */
function lu(r: CompanyRoundResult) {
  const segments = Object.values(r.market.bySegment);
  const ventes = Math.round(segments.reduce((t, v) => t + v.sold, 0));
  const demande = Math.round(segments.reduce((t, v) => t + v.demandForCompany, 0));
  return { ventes, demande, repartis: demande - ventes };
}

export type Verdict = "atteint" | "prix" | "clients" | "service";

/** Le suivi d'un trimestre : son objectif, son réalisé, l'écart, et ce qui l'explique. */
export function suiviDesVentes(c: Cas, trimestre = TRIMESTRE_SUIVI, progression = PROGRESSION_EN_POURCENT) {
  if (trimestre < 2) throw new Error("Le premier trimestre n'a pas de trimestre d'avant");
  const rAvant = trimestreDeLArene(c, trimestre - 1);
  const r = trimestreDeLArene(c, trimestre);
  const avant = lu(rAvant);
  const pendant = lu(r);
  const objectif = objectifSur(avant.ventes, progression);
  const ecart = pendant.ventes - objectif;
  const prixAvant = prixDuTrimestre(c, rAvant);
  const prix = prixDuTrimestre(c, r).map((p, i) => ({ nom: p.nom, avant: prixAvant[i]!.prix, pendant: p.prix }));
  const prixChanges = prix.some((p) => Math.abs(p.pendant - p.avant) > p.avant * SEUIL_DE_PRIX);
  // D'abord l'objectif ; manqué, les prix s'ils ont bougé, puis les clients venus, enfin les clients servis.
  const verdict: Verdict = ecart >= 0 ? "atteint" : prixChanges ? "prix" : pendant.demande < objectif ? "clients" : "service";
  return {
    trimestre,
    progression,
    avant,
    pendant,
    objectif,
    ecart,
    ecartEnPourcentage: auDixieme((ecart / objectif) * 100),
    tauxDeRealisation: auDixieme((pendant.ventes / objectif) * 100),
    demandeFaceALObjectif: pendant.demande - objectif,
    prix,
    prixChanges,
    verdict,
  };
}

export type Suivi = ReturnType<typeof suiviDesVentes>;

const du = (c: Cas) => suiviDesVentes(c, TRIMESTRE_SUIVI);

/** « 2 092 articles », « 151 commandes ». */
const unites = (c: Cas, n: number) => `${qte(Math.abs(n))} ${Math.abs(n) > 1 ? c.unites : c.unite}`;

export function tableauDuSuivi(c: Cas, k: Suivi): TableauDeDonnees {
  return {
    titre: `${c.entreprise} · trimestre ${k.trimestre - 1} et trimestre ${k.trimestre}`,
    colonnes: [`Trimestre ${k.trimestre - 1}`, `Trimestre ${k.trimestre}`],
    lignes: [
      { libelle: `${majuscule(c.unites)} ${accordPluriel(c, "vendu")}`, valeurs: [qte(k.avant.ventes), qte(k.pendant.ventes)] },
      { libelle: `${majuscule(c.unites)} ${accordPluriel(c, "demandé")} par les clients`, valeurs: [qte(k.avant.demande), qte(k.pendant.demande)] },
      ...k.prix.map((p) => ({ libelle: p.nom, valeurs: [eur(p.avant), eur(p.pendant)] })),
    ],
  };
}

export function tableauDuPremierTrimestre(c: Cas, k: Suivi): TableauDeDonnees {
  return {
    titre: `${c.entreprise} · le trimestre ${k.trimestre - 1} de l'arène`,
    colonnes: [`Trimestre ${k.trimestre - 1}`],
    lignes: [{ libelle: `${majuscule(c.unites)} ${accordPluriel(c, "vendu")}`, valeurs: [qte(k.avant.ventes)] }],
  };
}

/** Le suivi de l'année : chaque trimestre face à l'objectif posé sur le trimestre d'avant. */
export function suiviDeLAnnee(c: Cas) {
  return [2, 3, 4].map((t) => suiviDesVentes(c, t));
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const annee = suiviDeLAnnee(c);
  return {
    titre: `${c.entreprise} · l'objectif de chaque trimestre, face au réalisé`,
    colonnes: annee.map((k) => `Trimestre ${k.trimestre}`),
    lignes: [
      { libelle: "Objectif", valeurs: annee.map((k) => qte(k.objectif)) },
      { libelle: "Réalisé", valeurs: annee.map((k) => qte(k.pendant.ventes)) },
      { libelle: "Taux de réalisation", valeurs: annee.map((k) => pct(k.tauxDeRealisation)) },
    ],
  };
}

/** Ce que disent les prix, en une phrase. */
export function ceQueDisentLesPrix(k: Suivi): string {
  if (!k.prixChanges) {
    return k.prix.length > 1
      ? `les prix des articles n'ont pas bougé d'un trimestre à l'autre`
      : `le prix n'a pas bougé : ${eur(k.prix[0]!.avant)} au trimestre ${k.trimestre - 1}, ${eur(k.prix[0]!.pendant)} au trimestre ${k.trimestre}`;
  }
  const changes = k.prix.filter((p) => Math.abs(p.pendant - p.avant) > p.avant * SEUIL_DE_PRIX);
  return `${changes.map((p) => `${p.nom.charAt(0).toLowerCase()}${p.nom.slice(1)} est passé de ${eur(p.avant)} à ${eur(p.pendant)}`).join(", ")}`;
}

/** Les options du « pourquoi », communes au chapitre et à son cas pratique. */
export function optionsDuPourquoi(c: Cas, k: Suivi) {
  const faits = `${qte(k.pendant.demande)} ${c.unites} ${accordPluriel(c, "demandé")}, ${qte(k.pendant.ventes)} ${accordPluriel(c, "vendu")}, pour un objectif de ${qte(k.objectif)}`;
  const prix = ceQueDisentLesPrix(k);
  return [
    {
      texte: "Assez de clients ont été servis pour l'atteindre",
      juste: k.verdict === "atteint",
      retour:
        k.verdict === "atteint"
          ? `Oui : ${faits}. L'objectif est atteint${k.pendant.repartis > 0 ? `, même si ${unites(c, k.pendant.repartis)} n'ont pas pu être ${accordPluriel(c, "servi")}` : ""}.`
          : `Non : ${faits}. L'objectif est manqué de ${unites(c, k.ecart)}.`,
    },
    {
      texte: "Il est venu moins de clients que l'objectif",
      juste: k.verdict === "clients",
      retour:
        k.verdict === "clients"
          ? `Oui : ${faits}. Même en servant tous les clients venus, l'objectif n'était pas à portée. Et ${prix}.`
          : k.pendant.demande >= k.objectif
            ? `Non : ${faits}. Les clients venus suffisaient pour l'objectif.`
            : `Non : ${faits}. Il est venu moins de clients que l'objectif, mais ${prix}.`,
    },
    {
      texte: "Assez de clients sont venus, mais tous n'ont pas été servis",
      juste: k.verdict === "service",
      retour:
        k.verdict === "service"
          ? `Oui : ${faits}. ${majuscule(unites(c, k.pendant.repartis))} n'ont pas été ${accordPluriel(c, "servi")} : des clients sont repartis. Et ${prix}.`
          : `Non : ${faits}. ${k.pendant.demande < k.objectif ? "Il ne venait pas assez de clients pour l'objectif." : "L'objectif est atteint."}`,
    },
    {
      texte: "Les prix ont changé d'un trimestre à l'autre",
      juste: k.verdict === "prix",
      retour: k.verdict === "prix" ? `Oui : ${prix}. L'écart ne se lit pas sans eux.` : `Non : ${prix}.`,
    },
  ];
}

const ACTIONS: Record<Exclude<Verdict, "prix">, string> = {
  atteint: "Garder sa façon de vendre, et viser plus haut",
  clients: "Faire venir plus de clients",
  service: "Servir tous les clients qui viennent",
};

export const SUIVRE_SES_VENTES: Chapitre = {
  code: "suivre-ses-ventes",
  parcours: "vente",
  palier: 1,
  blocs: [
    "Bac pro MCV · Bloc 2 · Suivre les ventes",
    "2de pro RC · Collecter et exploiter l'information dans le cadre de la relation client",
  ],
  titre: "Suivre ses ventes : l'objectif, le réalisé, l'écart",
  accroche:
    "Un objectif de ventes pour le trimestre, ce que l'équipe a vendu, l'écart et le taux de réalisation. Puis ce qui l'explique : les clients venus, les clients servis, les prix.",
  objectifs: [
    "Calculer un objectif de ventes à partir du trimestre d'avant",
    "Calculer l'écart avec l'objectif, en unités et en pourcentage",
    "Calculer un taux de réalisation",
    "Expliquer l'écart : les clients venus, les clients servis, les prix",
    "Choisir ce qu'on fait au trimestre suivant",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_VENTE, pourquoi: POURQUOI_LA_VENTE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le tableau de suivi",
      notions: ["dashboard"],
      tableau: (c) => tableauDuPremierTrimestre(c, du(c)),
      texte: (c) => {
        const k = du(c);
        return [
          `Chez ${c.entreprise}, l'équipe de vente a un objectif chaque trimestre. Au bout du trimestre, elle compare : ce qu'elle visait, ce qu'elle a vendu, l'écart.`,
          `Dans le cas du cours, la règle est simple : l'objectif, ce sont les ventes du trimestre d'avant, plus ${qte(k.progression)} %. Le tableau donne les ventes du trimestre ${k.trimestre - 1} dans l'arène.`,
        ];
      },
      repere: () => "Écart = réalisé − objectif. Taux de réalisation = réalisé ÷ objectif × 100.",
    },
    {
      id: "l-objectif",
      type: "montants",
      titre: "L'objectif du trimestre",
      notions: ["dashboard"],
      question: (c) => {
        const k = du(c);
        return `Calculez l'objectif du trimestre ${k.trimestre} : les ${qte(k.avant.ventes)} ${c.unites} du trimestre ${k.trimestre - 1}, plus ${qte(k.progression)} %. Arrondissez à l'unité du dessus.`;
      },
      champs: (c) => {
        const k = du(c);
        const exact = (k.avant.ventes * (100 + k.progression)) / 100;
        return [
          {
            libelle: `Objectif du trimestre ${k.trimestre}`,
            attendu: k.objectif,
            calcul: `${qte(k.avant.ventes)} × ${(1 + k.progression / 100).toLocaleString("fr-FR")} = ${exact.toLocaleString("fr-FR")}${exact === k.objectif ? "" : `, arrondi à ${qte(k.objectif)}`}`,
          },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [`L'équipe vise ${qte(k.objectif)} ${c.unites} au trimestre ${k.trimestre}. Un objectif est un nombre, avec une date : on saura dire s'il est atteint.`];
      },
    },
    {
      id: "l-ecart",
      type: "montants",
      titre: "L'écart avec l'objectif",
      notions: ["dashboard", "volume_price_variance"],
      question: (c) => {
        const k = du(c);
        return `Au trimestre ${k.trimestre}, l'arène compte ${qte(k.pendant.ventes)} ${c.unites} ${accordPluriel(c, "vendu")}, pour un objectif de ${qte(k.objectif)}. Calculez l'écart en ${c.unites} (négatif s'il en manque), puis l'écart en pourcentage de l'objectif, au dixième.`;
      },
      champs: (c) => {
        const k = du(c);
        return [
          { libelle: `Écart en ${c.unites}`, attendu: k.ecart, calcul: `${qte(k.pendant.ventes)} − ${qte(k.objectif)} = ${qte(k.ecart)}` },
          {
            libelle: "Écart en pourcentage (%)",
            attendu: k.ecartEnPourcentage,
            calcul: `${qte(k.ecart)} ÷ ${qte(k.objectif)} × 100 = ${pct(k.ecartEnPourcentage)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [
          k.ecart >= 0
            ? `L'équipe a vendu ${unites(c, k.ecart)} de plus que l'objectif : ${signePct(k.ecartEnPourcentage)}. Un écart positif est favorable.`
            : `Il manque ${unites(c, k.ecart)} pour l'objectif : ${pct(k.ecartEnPourcentage)}. Un écart négatif est défavorable.`,
        ];
      },
    },
    {
      id: "le-taux-de-realisation",
      type: "montants",
      titre: "Le taux de réalisation",
      notions: ["dashboard"],
      question: (c) => {
        const k = du(c);
        return `Calculez le taux de réalisation du trimestre ${k.trimestre} : divisez les ${qte(k.pendant.ventes)} ${c.unites} ${accordPluriel(c, "vendu")} par l'objectif de ${qte(k.objectif)}, puis multipliez par 100. Arrondissez au dixième.`;
      },
      champs: (c) => {
        const k = du(c);
        return [
          {
            libelle: "Taux de réalisation (%)",
            attendu: k.tauxDeRealisation,
            calcul: `${qte(k.pendant.ventes)} ÷ ${qte(k.objectif)} × 100 = ${pct(k.tauxDeRealisation)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [
          k.tauxDeRealisation >= 100
            ? `${pct(k.tauxDeRealisation)} : l'objectif est atteint. Au-dessus de 100 %, l'équipe a fait mieux que prévu.`
            : `${pct(k.tauxDeRealisation)} : l'objectif n'est pas atteint. Il aurait fallu 100 %.`,
          "Le taux de réalisation et l'écart en pourcentage disent la même chose : le taux, c'est 100 % plus l'écart, au dixième près.",
        ];
      },
    },
    {
      id: "les-clients",
      type: "montants",
      titre: "Les clients venus et les clients servis",
      notions: ["conversion_rate", "dashboard"],
      tableau: (c) => tableauDuSuivi(c, du(c)),
      question: (c) => {
        const k = du(c);
        return `Le tableau donne aussi ce que les clients sont venus chercher : la demande. Calculez, au trimestre ${k.trimestre}, les ${c.unites} que les clients ont ${accordPluriel(c, "demandé")} sans être ${accordPluriel(c, "servi")}, puis l'écart entre la demande et l'objectif.`;
      },
      champs: (c) => {
        const k = du(c);
        return [
          {
            libelle: `${majuscule(c.unites)} ${accordPluriel(c, "demandé")} sans être ${accordPluriel(c, "servi")}`,
            attendu: k.pendant.repartis,
            calcul: `${qte(k.pendant.demande)} − ${qte(k.pendant.ventes)} = ${qte(k.pendant.repartis)}`,
          },
          {
            libelle: "Demande face à l'objectif",
            attendu: k.demandeFaceALObjectif,
            calcul: `${qte(k.pendant.demande)} − ${qte(k.objectif)} = ${signe(k.demandeFaceALObjectif)}`,
          },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [
          k.demandeFaceALObjectif >= 0
            ? `Les clients ont demandé ${qte(k.pendant.demande)} ${c.unites} : assez pour l'objectif, s'ils étaient tous servis.`
            : `Les clients n'ont demandé que ${qte(k.pendant.demande)} ${c.unites} : même tous servis, ils ne faisaient pas l'objectif.`,
          k.pendant.repartis > 0
            ? `${majuscule(unites(c, k.pendant.repartis))} n'ont pas été ${accordPluriel(c, "servi")} : des clients sont repartis.`
            : "Tous les clients venus ont été servis.",
        ];
      },
    },
    {
      id: "pourquoi",
      type: "choix",
      titre: "Ce qui explique l'écart",
      notions: ["dashboard", "conversion_rate"],
      tableau: (c) => tableauDuSuivi(c, du(c)),
      question: (c) => `Qu'est-ce qui explique le résultat du trimestre ${du(c).trimestre}, face à l'objectif ?`,
      options: (c) => optionsDuPourquoi(c, du(c)),
    },
    {
      id: "et-ensuite",
      type: "choix",
      titre: "Ce que l'équipe fait ensuite",
      notions: ["dashboard"],
      si: (c) => du(c).verdict !== "prix",
      question: (c) => `Pour le trimestre ${du(c).trimestre + 1}, que doit faire l'équipe de vente d'abord ?`,
      options: (c) => {
        const k = du(c);
        const retours: Record<Exclude<Verdict, "prix">, string> = {
          atteint:
            k.verdict === "atteint"
              ? `Oui : l'objectif est atteint à ${pct(k.tauxDeRealisation)}. Le prochain partira des ${qte(k.pendant.ventes)} ${c.unites} ${accordPluriel(c, "vendu")}, plus ${qte(k.progression)} % : il sera plus haut.`
              : `Non : l'objectif est manqué, à ${pct(k.tauxDeRealisation)}. Il y a d'abord une cause à traiter.`,
          clients:
            k.verdict === "clients"
              ? `Oui : seuls ${qte(k.pendant.demande)} ${c.unites} ont été ${accordPluriel(c, "demandé")}, pour un objectif de ${qte(k.objectif)}. Il faut faire venir les clients : vitrine, accueil, relance des clients fidèles.`
              : `Non : ce ne sont pas les clients qui ont manqué, ${qte(k.pendant.demande)} ${c.unites} ont été ${accordPluriel(c, "demandé")}.`,
          service:
            k.verdict === "service"
              ? `Oui : les clients étaient là, mais ${unites(c, k.pendant.repartis)} n'ont pas été ${accordPluriel(c, "servi")}. Le vendeur le signale : il faut de quoi servir chaque client qui vient.`
              : k.pendant.repartis === 0
                ? "Non : tous les clients venus ont été servis."
                : k.verdict === "atteint"
                  ? `Pas d'abord : l'objectif est atteint. Les ${unites(c, k.pendant.repartis)} qui n'ont pas été ${accordPluriel(c, "servi")} sont à suivre, mais ce n'est pas ce qui a manqué.`
                  : `Pas d'abord : ${unites(c, k.pendant.repartis)} n'ont pas été ${accordPluriel(c, "servi")}, mais même tous servis, les clients venus ne faisaient pas l'objectif.`,
        };
        return (Object.keys(ACTIONS) as Exclude<Verdict, "prix">[]).map((v) => ({ texte: ACTIONS[v], juste: v === k.verdict, retour: retours[v] }));
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const annee = suiviDeLAnnee(c);
        const atteints = annee.filter((k) => k.verdict === "atteint").length;
        const manquesFauteDeClients = annee.filter((k) => k.verdict === "clients").map((k) => k.trimestre);
        const lignes = [
          `Le tableau suit toute l'année avec la même règle : chaque trimestre, les ventes du trimestre d'avant plus ${qte(PROGRESSION_EN_POURCENT)} %. Chez ${c.entreprise}, l'objectif est atteint ${qte(atteints)} ${atteints > 1 ? "trimestres" : "trimestre"} sur ${qte(annee.length)}.`,
          "Un écart se calcule, puis s'explique : sont-ils venus, les clients ? Ont-ils été servis ? Les prix ont-ils changé ?",
        ];
        if (manquesFauteDeClients.length > 0) {
          lignes.push(
            `${manquesFauteDeClients.length > 1 ? "Aux trimestres" : "Au trimestre"} ${manquesFauteDeClients.map(qte).join(" et ")}, il est venu moins de clients que l'objectif. Une règle qui part du trimestre d'avant ne voit pas la saison : après un bon trimestre, elle peut viser plus de ventes que la saison n'amène de clients.`,
          );
        }
        return lignes;
      },
      repere: () => "Taux de réalisation = réalisé ÷ objectif × 100. Au-dessus de 100 %, l'objectif est atteint.",
    },
  ],
};
