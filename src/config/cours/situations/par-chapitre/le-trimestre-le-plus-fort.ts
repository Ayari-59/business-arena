import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { PART_STABLE, extraitDesVentes, ordinal, tableDesVentes } from "../../chapitres/des-donnees-a-l-information";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DES DONNÉES À L'INFORMATION » : LE TRIMESTRE LE PLUS FORT
 * (Bac STMG, systèmes d'information de gestion, palier 1).
 *
 * La responsable commerciale prépare l'année suivante. Elle veut savoir sur quel trimestre le
 * marché pèse le plus en chiffre d'affaires, toutes enseignes réunies, et quelle part
 * l'entreprise y prend face à sa part de l'année. L'élève refait les traitements du chapitre sur
 * la même table des ventes (`extraitDesVentes`), avec un autre regroupement : par trimestre et non
 * plus par enseigne ; puis il calcule deux parts et rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre regroupe par enseigne et compare deux semestres ;
 * le cas regroupe par trimestre et cherche le plus fort. La seule règle de lecture est celle du
 * chapitre (`PART_STABLE`).
 */

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const NOMS_DES_TRIMESTRES = ["premier", "deuxième", "troisième", "quatrième"] as const;

export type PlaceAuPlusFort = "moins" | "autant" | "plus";

/** Le chiffre d'affaires des enseignes, trimestre par trimestre, et la part de l'entreprise. */
export function trimestreLePlusFort(c: Cas) {
  const lignes = extraitDesVentes(c);
  const trimestres = [...new Set(lignes.map((l) => l.trimestre))].sort((a, b) => a - b).map((t) => {
    const du = lignes.filter((l) => l.trimestre === t);
    const total = du.reduce((s, l) => s + l.chiffreDAffaires, 0);
    const deLEntreprise = du.filter((l) => l.id === "joueur").reduce((s, l) => s + l.chiffreDAffaires, 0);
    return { trimestre: t, total, deLEntreprise, part: auDixieme((deLEntreprise / total) * 100), lignes: du };
  });
  const plusFort = trimestres.reduce((m, x) => (x.total > m.total ? x : m), trimestres[0]!);
  const totalDeLAnnee = trimestres.reduce((s, x) => s + x.total, 0);
  const entrepriseDeLAnnee = trimestres.reduce((s, x) => s + x.deLEntreprise, 0);
  const partDeLAnnee = auDixieme((entrepriseDeLAnnee / totalDeLAnnee) * 100);
  const ecart = auDixieme(plusFort.part - partDeLAnnee);
  const place: PlaceAuPlusFort = ecart < -PART_STABLE ? "moins" : ecart > PART_STABLE ? "plus" : "autant";
  return { trimestres, plusFort, totalDeLAnnee, entrepriseDeLAnnee, partDeLAnnee, ecart, place };
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
    "Pour préparer l'année suivante, la responsable commerciale veut savoir sur quel trimestre le marché pèse le plus, et quelle part l'entreprise y prend. La même table des ventes, un autre regroupement.",
  objectifs: [
    "Regrouper les lignes d'une table par trimestre",
    "Calculer une part dans le total qui a le même critère",
    "Répondre à la responsable commerciale, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable commerciale",
      tableau: tableDesVentes,
      texte: (c) => [
        `« Pour préparer l'an prochain, je veux savoir sur quel trimestre le marché pèse le plus en chiffre d'affaires, toutes enseignes réunies. Dites-moi aussi quelle part ${c.entreprise} y prend, comparée à sa part de l'année, et quel trimestre préparer en priorité. »`,
        "Pas de cours cette fois : les traitements sont ceux du chapitre, sur la table des ventes de l'année du cours.",
      ],
      repere: () => "À rendre : le chiffre d'affaires des enseignes de chaque trimestre, la part de l'entreprise au trimestre le plus fort et sur l'année, et votre réponse.",
    },
    {
      id: "par-trimestre",
      type: "montants",
      titre: "Regrouper par trimestre",
      notions: ["revenue", "seasonality"],
      question: () => "Regroupez les lignes de la table par trimestre et additionnez : le chiffre d'affaires des enseignes réunies, trimestre par trimestre, à l'euro.",
      champs: (c) =>
        trimestreLePlusFort(c).trimestres.map((x) => ({
          libelle: `Chiffre d'affaires des enseignes, ${ordinal(x.trimestre)} trimestre`,
          attendu: x.total,
          calcul: `${x.lignes.map((l) => eur(l.chiffreDAffaires)).join(" + ")} = ${eur(x.total)}`,
          tolerance: 1,
        })),
      explication: (c) => {
        const k = trimestreLePlusFort(c);
        return [
          `Le marché pèse le plus au ${NOMS_DES_TRIMESTRES[k.plusFort.trimestre - 1]} trimestre : ${eur(k.plusFort.total)} de chiffre d'affaires, toutes enseignes réunies, sur ${eur(k.totalDeLAnnee)} dans l'année.`,
        ];
      },
    },
    {
      id: "la-part",
      type: "montants",
      titre: "La part de l'entreprise",
      notions: ["demand_market_share", "revenue"],
      question: (c) =>
        `Calculez, en pourcentage au dixième, la part ${dE(c.entreprise)} dans le chiffre d'affaires des enseignes au trimestre le plus fort, puis sur l'année entière.`,
      champs: (c) => {
        const k = trimestreLePlusFort(c);
        return [
          {
            libelle: `Part ${dE(c.entreprise)}, trimestre le plus fort (%)`,
            attendu: k.plusFort.part,
            calcul: `${eur(k.plusFort.deLEntreprise)} ÷ ${eur(k.plusFort.total)} × 100 = ${pct(k.plusFort.part)}`,
            tolerance: 0.1,
          },
          {
            libelle: `Part ${dE(c.entreprise)}, année entière (%)`,
            attendu: k.partDeLAnnee,
            calcul: `${eur(k.entrepriseDeLAnnee)} ÷ ${eur(k.totalDeLAnnee)} × 100 = ${pct(k.partDeLAnnee)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = trimestreLePlusFort(c);
        return [
          `Au trimestre le plus fort, ${c.entreprise} prend ${pct(k.plusFort.part)} du chiffre d'affaires des enseignes, contre ${pct(k.partDeLAnnee)} sur l'année. Chaque part se calcule dans le total qui a le même critère : le trimestre avec le trimestre, l'année avec l'année.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable commerciale",
      notions: ["seasonality"],
      question: () => "Quel trimestre conseillez-vous de préparer en priorité ?",
      options: (c) => {
        const k = trimestreLePlusFort(c);
        const p = k.plusFort;
        const lecture =
          k.place === "moins"
            ? `${c.entreprise} y pèse moins que sur l'année (${pct(p.part)} contre ${pct(k.partDeLAnnee)}) : le marché y est le plus grand et elle y pèse moins que d'habitude, c'est là qu'elle a le plus à gagner.`
            : k.place === "plus"
              ? `${c.entreprise} y pèse plus que sur l'année (${pct(p.part)} contre ${pct(k.partDeLAnnee)}) : le marché y est le plus grand et elle y tient mieux sa place que d'habitude, c'est là qu'elle a le plus à perdre.`
              : `${c.entreprise} y pèse comme sur l'année (${pct(p.part)} contre ${pct(k.partDeLAnnee)}) : sa place y est la même, mais chaque point de part y vaut plus de chiffre d'affaires.`;
        return k.trimestres.map((x) => ({
          texte: `Le ${NOMS_DES_TRIMESTRES[x.trimestre - 1]} trimestre`,
          juste: x === p,
          retour:
            x === p
              ? `Oui : ${eur(p.total)} de chiffre d'affaires sur le marché, le plus fort de l'année. ${lecture}`
              : `Non : ${eur(x.total)} de chiffre d'affaires sur le marché, contre ${eur(p.total)} au ${NOMS_DES_TRIMESTRES[p.trimestre - 1]} trimestre.`,
        }));
      },
    },
  ],
};
