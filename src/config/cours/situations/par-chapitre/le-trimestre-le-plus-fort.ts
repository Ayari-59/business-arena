import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { PART_STABLE, POURQUOI_LES_DONNEES, extraitDesVentes, ordinal, tableDesVentes } from "../../chapitres/des-donnees-a-l-information";
import { ENTREPRISES_DE_LA_GESTION_DE_BASE } from "../../monde/gestion-et-information";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DES DONNÉES À L'INFORMATION » : LE TRIMESTRE LE PLUS FORT
 * (Bac STMG, systèmes d'information de gestion, palier 1).
 *
 * La responsable commerciale prépare le second semestre. Elle veut savoir quel trimestre a pesé le
 * plus en chiffre d'affaires, toutes clientèles réunies, et quelle part les particuliers y prennent,
 * face à leur part du semestre. L'élève refait les traitements du chapitre sur la même table des
 * ventes (`extraitDesVentes`), avec un autre regroupement : par trimestre et non plus par
 * clientèle ; puis il calcule deux parts et rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre suit la part de CampusTech ; le cas regroupe par
 * trimestre, cherche le plus fort et y lit la part des particuliers. La seule règle de lecture est
 * celle du chapitre (`PART_STABLE`).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, chez NOVA seule : la table des ventes du semestre. Il lisait la
 * table des enseignes de l'année de l'arène, dans neuf entreprises.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const NOMS_DES_TRIMESTRES = ["premier", "deuxième"] as const;

export type PlaceAuPlusFort = "moins" | "autant" | "plus";

/** Le chiffre d'affaires de chaque trimestre, et la part des particuliers. */
export function trimestreLePlusFort(c?: Cas) {
  const lignes = extraitDesVentes(c);
  const trimestres = ([1, 2] as const).map((t) => {
    const du = lignes.filter((l) => l.trimestre === t);
    const total = auCentime(du.reduce((s, l) => s + l.chiffreDAffaires, 0));
    const particuliers = auCentime(du.filter((l) => l.clientele === "particuliers").reduce((s, l) => s + l.chiffreDAffaires, 0));
    return { trimestre: t, total, particuliers, part: auDixieme((particuliers / total) * 100), lignes: du };
  });
  const plusFort = trimestres.reduce((m, x) => (x.total > m.total ? x : m), trimestres[0]!);
  const totalDuSemestre = auCentime(trimestres.reduce((s, x) => s + x.total, 0));
  const particuliersDuSemestre = auCentime(trimestres.reduce((s, x) => s + x.particuliers, 0));
  const partDuSemestre = auDixieme((particuliersDuSemestre / totalDuSemestre) * 100);
  const ecart = auDixieme(plusFort.part - partDuSemestre);
  const place: PlaceAuPlusFort = ecart < -PART_STABLE ? "moins" : ecart > PART_STABLE ? "plus" : "autant";
  return { trimestres, plusFort, totalDuSemestre, particuliersDuSemestre, partDuSemestre, ecart, place };
}

export const LE_TRIMESTRE_LE_PLUS_FORT: Situation = {
  code: "le-trimestre-le-plus-fort",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["des-donnees-a-l-information"],
  commanditaire: "La responsable commerciale",
  titre: "Le trimestre le plus fort",
  accroche:
    "Pour préparer le second semestre, la responsable commerciale veut savoir quel trimestre a pesé le plus, et quelle part les particuliers y prennent. La même table des ventes, un autre regroupement.",
  objectifs: ["Regrouper les lignes d'une table par trimestre", "Calculer une part dans le total qui a le même critère", "Répondre à la responsable commerciale, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_LES_DONNEES },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable commerciale",
      tableau: tableDesVentes,
      texte: (c) => [
        `« Pour préparer le second semestre, je veux savoir quel trimestre a pesé le plus en chiffre d'affaires, toutes clientèles réunies. Dites-moi aussi quelle part les particuliers y prennent, comparée à leur part du semestre, et vers qui ${c.entreprise} grandit. »`,
        "Pas de cours cette fois : les traitements sont ceux du chapitre, sur la table des ventes du semestre.",
      ],
      repere: () => "À rendre : le chiffre d'affaires de chaque trimestre, la part des particuliers au trimestre le plus fort et sur le semestre, et votre réponse.",
    },
    {
      id: "par-trimestre",
      type: "montants",
      titre: "Regrouper par trimestre",
      notions: ["revenue", "seasonality"],
      question: () => "Regroupez les lignes de la table par trimestre et additionnez : le chiffre d'affaires de toutes les clientèles, trimestre par trimestre, à l'euro.",
      champs: () =>
        trimestreLePlusFort().trimestres.map((x) => ({
          libelle: `Chiffre d'affaires, ${ordinal(x.trimestre)} trimestre`,
          attendu: x.total,
          calcul: `${x.lignes.map((l) => eur(l.chiffreDAffaires)).join(" + ")} = ${eur(x.total)}`,
        })),
      explication: () => {
        const k = trimestreLePlusFort();
        return [`Le ${NOMS_DES_TRIMESTRES[k.plusFort.trimestre - 1]} trimestre pèse le plus : ${eur(k.plusFort.total)} de chiffre d'affaires, sur ${eur(k.totalDuSemestre)} dans le semestre.`];
      },
    },
    {
      id: "la-part",
      type: "montants",
      titre: "La part des particuliers",
      notions: ["revenue"],
      question: (c) => `Calculez, en pourcentage au dixième, la part des particuliers dans le chiffre d'affaires ${dE(c.entreprise)} au trimestre le plus fort, puis sur le semestre entier.`,
      champs: () => {
        const k = trimestreLePlusFort();
        return [
          { libelle: "Part des particuliers, trimestre le plus fort (%)", attendu: k.plusFort.part, calcul: `${eur(k.plusFort.particuliers)} ÷ ${eur(k.plusFort.total)} × 100 = ${pct(k.plusFort.part)}`, tolerance: 0.1 },
          { libelle: "Part des particuliers, semestre entier (%)", attendu: k.partDuSemestre, calcul: `${eur(k.particuliersDuSemestre)} ÷ ${eur(k.totalDuSemestre)} × 100 = ${pct(k.partDuSemestre)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const k = trimestreLePlusFort();
        return [`Au trimestre le plus fort, les particuliers font ${pct(k.plusFort.part)} du chiffre d'affaires, contre ${pct(k.partDuSemestre)} sur le semestre. Chaque part se calcule dans le total qui a le même critère : le trimestre avec le trimestre, le semestre avec le semestre.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable commerciale",
      notions: ["seasonality"],
      question: (c) => `Vers qui ${c.entreprise} grandit-elle ?`,
      options: (c) => {
        const k = trimestreLePlusFort();
        const p = k.plusFort;
        const chiffres = `au ${NOMS_DES_TRIMESTRES[p.trimestre - 1]} trimestre, le plus fort, les particuliers font ${pct(p.part)} du chiffre d'affaires, contre ${pct(k.partDuSemestre)} sur le semestre`;
        return [
          { texte: "Vers les particuliers : ils pèsent plus au trimestre le plus fort", juste: k.place === "plus", retour: k.place === "plus" ? `Oui : ${chiffres}. ${c.entreprise} grandit par ses ventes en ligne ; c'est elles qu'il faut préparer pour le second semestre.` : `Non : ${chiffres}.` },
          { texte: "Vers CampusTech : les particuliers pèsent moins au trimestre le plus fort", juste: k.place === "moins", retour: k.place === "moins" ? `Oui : ${chiffres}.` : `Non : ${chiffres}. CampusTech commande autant chaque mois : ce sont les particuliers qui font grandir les ventes.` },
          { texte: "Vers personne : les parts ne bougent presque pas", juste: k.place === "autant", retour: k.place === "autant" ? `Oui : ${chiffres}.` : `Non : ${chiffres}, plus de ${PART_STABLE} point d'écart.` },
        ];
      },
    },
  ],
};
