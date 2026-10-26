import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { ECART_D_INDICE, rejouerLAnnee } from "../ressources-humaines";
import type { Chapitre } from "../types";


/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CHAPITRE : LES INDICATEURS SOCIAUX (Bac STMG, ressources humaines, palier 1).
 *
 * Le tableau de bord social d'une année difficile : celle où l'entreprise a payé ses salariés
 * 10 % de moins que d'habitude (le chapitre « Rémunération et motivation »). Effectif, départs,
 * masse salariale, chiffre d'affaires par salarié, trimestre après trimestre : le taux de
 * rotation du personnel, puis un indicateur qui trompe, le chiffre d'affaires par salarié, qui
 * peut monter quand l'équipe fond.
 *
 * L'année est celle que l'arène rejoue avec les salaires baissés (ressources-humaines.ts,
 * ECART_D_INDICE) ; l'effectif et les départs sont ceux que le moteur compte (`hr`). L'arène ne
 * simule ni l'absentéisme ni les accidents du travail : le tableau de bord n'en a pas, et le
 * chapitre le dit.
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const somme = (xs: number[]) => xs.reduce((t, x) => t + x, 0);

/** Le tableau de bord social de l'année aux salaires baissés. */
export function indicateursSociaux(c: Cas) {
  const hr = scenarioByCode(c.code).scenario.hr!;
  const indice = 1 - ECART_D_INDICE;
  const annee = rejouerLAnnee(c.code, "salaires-baisses", () => ({ salaryIndex: indice }));
  const trimestres = annee.map((r, i) => ({
    trimestre: i + 1,
    effectif: r.hr!.headcount,
    departs: r.hr!.departed,
    masse: Math.round(r.hr!.headcount * hr.salaryPerEmployeePerRound * indice),
    ventes: Math.round(r.incomeStatement.revenue),
    caParSalarie: Math.round(r.incomeStatement.revenue / r.hr!.headcount),
  }));
  const departs = somme(trimestres.map((t) => t.departs));
  const effectifMoyen = auDixieme(somme(trimestres.map((t) => t.effectif)) / trimestres.length);
  const premier = trimestres[0]!;
  const dernier = trimestres.at(-1)!;
  return {
    ecart: Math.round(ECART_D_INDICE * 100),
    trimestres,
    departs,
    effectifMoyen,
    rotation: auDixieme((departs / effectifMoyen) * 100),
    caParSalarieDebut: premier.caParSalarie,
    caParSalarieFin: dernier.caParSalarie,
    evolution: auDixieme(((dernier.caParSalarie - premier.caParSalarie) / premier.caParSalarie) * 100),
    ventesDebut: premier.ventes,
    ventesFin: dernier.ventes,
  };
}

export const INDICATEURS_SOCIAUX: Chapitre = {
  code: "indicateurs-sociaux",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
  ],
  titre: "Les indicateurs sociaux",
  accroche:
    "Le tableau de bord social d'une année où les salaires ont baissé : l'effectif, les départs, le taux de rotation, et un indicateur qui peut tromper.",
  objectifs: [
    "Lire un tableau de bord social trimestre par trimestre",
    "Calculer un effectif moyen et un taux de rotation du personnel",
    "Calculer l'évolution du chiffre d'affaires par salarié",
    "Interpréter un indicateur avec les autres, et pas seul",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le tableau de bord social",
      notions: ["staff_turnover", "payroll"],
      texte: (c) => {
        const s = indicateursSociaux(c);
        return [
          `Cette année, ${c.entreprise} a payé ses salariés ${s.ecart} % de moins que d'habitude. Son tableau de bord social suit, trimestre après trimestre, l'effectif, les départs, la masse salariale et ce que l'équipe fait vendre.`,
          "Un vrai tableau de bord social suit aussi l'absentéisme, les accidents du travail ou les heures de formation. L'arène ne les simule pas : celui-ci s'en tient à ce qu'elle compte.",
        ];
      },
      tableau: (c) => {
        const s = indicateursSociaux(c);
        return {
          titre: `Le tableau de bord social ${dE(c.entreprise)}`,
          colonnes: s.trimestres.map((t) => `T${t.trimestre}`),
          lignes: [
            { libelle: "Effectif", valeurs: s.trimestres.map((t) => String(t.effectif)) },
            { libelle: "Départs", valeurs: s.trimestres.map((t) => String(t.departs)) },
            { libelle: "Masse salariale", valeurs: s.trimestres.map((t) => eur(t.masse)) },
            { libelle: "Chiffre d'affaires", valeurs: s.trimestres.map((t) => eur(t.ventes)) },
          ],
        };
      },
      repere: () => "Taux de rotation = départs de la période ÷ effectif moyen de la période.",
    },
    {
      id: "rotation",
      type: "montants",
      titre: "Le taux de rotation",
      notions: ["staff_turnover"],
      question: (c) =>
        `Calculez les départs de l'année, l'effectif moyen (la moyenne des ${indicateursSociaux(c).trimestres.length} trimestres, au dixième), puis le taux de rotation du personnel sur l'année, en pourcentage au dixième.`,
      champs: (c) => {
        const s = indicateursSociaux(c);
        return [
          { libelle: "Départs de l'année", attendu: s.departs, calcul: `${s.trimestres.map((t) => t.departs).join(" + ")} = ${s.departs}`, tolerance: 0 },
          { libelle: "Effectif moyen", attendu: s.effectifMoyen, calcul: `(${s.trimestres.map((t) => t.effectif).join(" + ")}) ÷ ${s.trimestres.length} = ${qte(s.effectifMoyen)}`, tolerance: 0.1 },
          { libelle: "Taux de rotation (%)", attendu: s.rotation, calcul: `${s.departs} ÷ ${qte(s.effectifMoyen)} × 100 = ${pct(s.rotation)}`, tolerance: 0.2 },
        ];
      },
      explication: (c) => {
        const s = indicateursSociaux(c);
        return [
          `Sur l'année, ${pct(s.rotation)} de l'effectif moyen ${dE(c.entreprise)} est parti. Chaque départ est un poste à pourvoir, un savoir-faire perdu, et souvent le signe que d'autres pensent à partir.`,
          ...(s.rotation > 100
            ? ["Un taux au-dessus de 100 % n'est pas une erreur : l'équipe a perdu plus de salariés qu'elle n'en comptait en moyenne, parce qu'elle a fondu en route."]
            : []),
        ];
      },
    },
    {
      id: "ca-par-salarie",
      type: "montants",
      titre: "Ce que fait vendre chaque salarié",
      notions: ["payroll", "productivity"],
      question: () =>
        "Calculez le chiffre d'affaires par salarié au premier et au dernier trimestre (à l'euro), puis son évolution, en pourcentage au dixième.",
      champs: (c) => {
        const s = indicateursSociaux(c);
        const p = s.trimestres[0]!;
        const d = s.trimestres.at(-1)!;
        return [
          { libelle: "Chiffre d'affaires par salarié au premier trimestre", attendu: s.caParSalarieDebut, calcul: `${eur(p.ventes)} ÷ ${p.effectif} = ${eur(s.caParSalarieDebut)}`, tolerance: 1 },
          { libelle: "Chiffre d'affaires par salarié au dernier trimestre", attendu: s.caParSalarieFin, calcul: `${eur(d.ventes)} ÷ ${d.effectif} = ${eur(s.caParSalarieFin)}`, tolerance: 1 },
          { libelle: "Évolution (%)", attendu: s.evolution, calcul: `(${eur(s.caParSalarieFin)} − ${retranche(s.caParSalarieDebut)}) ÷ ${eur(s.caParSalarieDebut)} × 100 = ${pct(s.evolution)}`, tolerance: 0.2 },
        ];
      },
      explication: (c) => {
        const s = indicateursSociaux(c);
        return [
          `Du premier au dernier trimestre, le chiffre d'affaires par salarié ${s.evolution >= 0 ? "monte" : "baisse"} de ${pct(Math.abs(s.evolution))}, pendant que l'effectif passe de ${s.trimestres[0]!.effectif} à ${s.trimestres.at(-1)!.effectif}.`,
        ];
      },
    },
    {
      id: "lecture",
      type: "choix",
      titre: "Une bonne nouvelle ?",
      notions: ["staff_turnover", "productivity"],
      question: (c) => {
        const s = indicateursSociaux(c);
        return `Le chiffre d'affaires par salarié ${dE(c.entreprise)} est passé de ${eur(s.caParSalarieDebut)} à ${eur(s.caParSalarieFin)}. Comment le lire ?`;
      },
      options: (c) => {
        const s = indicateursSociaux(c);
        const monte = s.caParSalarieFin > s.caParSalarieDebut;
        return [
          {
            texte: "C'est une bonne nouvelle : chaque salarié vend davantage, l'équipe est plus efficace",
            juste: false,
            retour: monte
              ? `Non : l'indicateur monte parce que l'effectif fond (${s.departs} départs dans l'année), pas parce que l'équipe vend mieux. Lu seul, il prend une crise sociale pour un succès.`
              : "Non : il baisse, et ce n'est pas une question d'efficacité : les ventes chutent plus vite que l'effectif.",
          },
          {
            texte: "Il monte parce que l'équipe fond, pas parce qu'elle vend mieux",
            juste: monte,
            retour: monte
              ? `Oui : le chiffre d'affaires se partage entre moins de salariés. Le taux de rotation (${pct(s.rotation)}) dit ce qui se passe vraiment : l'entreprise perd son équipe.`
              : "Non : ici, l'indicateur baisse.",
          },
          {
            texte: "Il baisse : les ventes chutent plus vite que l'effectif",
            juste: !monte,
            retour: !monte
              ? `Oui : l'équipe, moins motivée puis moins nombreuse, ne peut plus servir les clients ; les ventes tombent de ${eur(s.ventesDebut)} à ${eur(s.ventesFin)} par trimestre, plus vite que l'effectif.`
              : "Non : ici, l'indicateur monte. Mais c'est parce que l'équipe fond.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["staff_turnover"],
      texte: (c) => {
        const s = indicateursSociaux(c);
        return [
          `En une année aux salaires baissés, ${c.entreprise} a perdu ${s.departs} salariés : un taux de rotation de ${pct(s.rotation)}.`,
          "Un indicateur social ne se lit jamais seul. Le chiffre d'affaires par salarié peut monter pendant que l'équipe s'effondre ; c'est le taux de rotation, l'effectif et les ventes, lus ensemble, qui disent si l'entreprise va bien.",
        ];
      },
      repere: () => "Lire un tableau de bord social : l'effectif, les départs et la rotation d'abord, les ratios ensuite.",
    },
  ],
};
