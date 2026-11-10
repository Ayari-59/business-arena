import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_INVESTISSEMENT, dureeDeLAssocie } from "../../monde/investir-et-cloturer";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « INVESTIR, AMORTIR, CLÔTURER » : AMORTIR SUR 8 ANS ? (Bac STMG, gestion et
 * finance de terminale, palier 1).
 *
 * Le chapitre construisait le plan de la ligne sur sa durée d'utilisation ; le cas demande ce que
 * changerait une durée plus longue, choisie pour embellir le résultat. Hypothèses :
 * monde/investir-et-cloturer.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const AMORTIR_SUR_8_ANS: Situation = {
  code: "amortir-sur-8-ans",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["investir-amortir-cloturer"],
  commanditaire: "Un associé",
  titre: "Amortir sur 8 ans ?",
  accroche: "Un associé propose d'amortir la ligne sur une durée plus longue, pour afficher un meilleur résultat. Que changerait-elle, et en a-t-on le droit ?",
  objectifs: ["Calculer la dotation sur deux durées", "Mesurer l'effet sur le résultat", "Répondre à l'associé, au nom de l'image fidèle"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_INVESTISSEMENT, pourquoi: "le cas reprend la ligne de montage de NOVA et son plan." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'associé",
      texte: () => {
        const d = dureeDeLAssocie();
        return [
          `« Amortissons la ligne sur ${qte(d.duree)} ans au lieu de ${qte(d.dureeDUsage)} : la dotation de N serait plus petite, et le résultat plus beau pour la banque. Les postes s'usent bien en ${qte(d.dureeDUsage)} ans, mais qui le verra ? » Un associé`,
          "Pas de cours cette fois : les calculs et les principes sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : la dotation de N sur chaque durée, l'effet sur le résultat, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Deux durées, deux dotations",
      question: () => {
        const d = dureeDeLAssocie();
        return `Calculez la dotation de N sur ${qte(d.dureeDUsage)} ans, puis sur ${qte(d.duree)} ans (au prorata des jours de N, au centime), et ce que le résultat de N gagnerait.`;
      },
      champs: () => {
        const d = dureeDeLAssocie();
        return [
          { libelle: `Dotation de N sur ${qte(d.dureeDUsage)} ans`, attendu: d.six, calcul: `coût ÷ ${qte(d.dureeDUsage)} × jours ÷ 360 = ${eur(d.six)}` },
          { libelle: `Dotation de N sur ${qte(d.duree)} ans`, attendu: d.huit, calcul: `coût ÷ ${qte(d.duree)} × jours ÷ 360 = ${eur(d.huit)}` },
          { libelle: "Ce que gagnerait le résultat de N", attendu: d.effet, calcul: `${eur(d.six)} − ${eur(d.huit)} = ${eur(d.effet)}` },
        ];
      },
      explication: () => [`Le résultat de N gagnerait ${eur(dureeDeLAssocie().effet)} ; il le perdrait plus tard, quand la ligne usée continuerait d'être amortie.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'associé",
      question: () => "Que répondez-vous à l'associé ?",
      options: () => {
        const d = dureeDeLAssocie();
        return [
          {
            texte: `Non : la durée doit suivre l'usure réelle, ${qte(d.dureeDUsage)} ans`,
            juste: true,
            retour: "Oui : l'amortissement suit une approche économique, la durée d'utilisation réelle. Choisir une durée pour embellir le résultat tromperait la banque, et changer de méthode sans raison irait contre la permanence des méthodes. Les comptes doivent donner une image fidèle.",
          },
          {
            texte: `Oui : la durée se choisit librement, et ${qte(d.duree)} ans rendent le résultat plus beau`,
            juste: false,
            retour: "Non : la durée n'est pas libre, elle suit l'usage du bien. Un résultat embelli n'est pas un résultat fidèle.",
          },
          {
            texte: "Oui, à condition de ne pas le dire dans l'annexe",
            juste: false,
            retour: "Non : l'annexe doit justement dire les méthodes retenues. Cacher le changement aggraverait la faute.",
          },
        ];
      },
    },
  ],
};
