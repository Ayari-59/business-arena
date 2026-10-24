import { accordPluriel } from "../accords";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";
import { ANNEES, TRIMESTRES_PAR_AN, troisAnnees } from "../trois-annees";
import { COMMERCES } from "./taux-de-marque";

/**
 * CHAPITRE : PRÉVOIR LES VENTES (BTS MCO, palier 3).
 *
 * Deux années observées, la troisième à prévoir : la tendance d'une année à l'autre, le
 * coefficient saisonnier du trimestre fort, la prévision de ce trimestre l'année suivante.
 * Puis l'arène joue la troisième année, et l'élève mesure l'écart entre sa prévision et la
 * réalité : une tendance ne se prolonge pas toute seule.
 *
 * LA DEMANDE, PAS LES VENTES. Au trimestre fort, les ventes du magasin plafonnent sous la
 * demande (le stock ou la salle ne suivent pas) : prévoir sur les ventes, c'est reconduire
 * la rupture. Le chapitre prévoit la demande que le marché adresse à l'entreprise.
 *
 * Aucune hypothèse : les trois années sont celles que l'arène joue, prolongée comme une
 * partie longue (`trois-annees.ts`). La méthode est celle du programme : un taux de
 * croissance annuel et un coefficient saisonnier moyen, rapport du trimestre à la moyenne
 * trimestrielle de son année.
 */

const qte = (n: number) => Math.round(n).toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;

/** Le trimestre fort : celui où la demande de la deuxième année est la plus haute. */
const trimestreFort = (c: Cas) => {
  const an2 = troisAnnees(c.code).filter((q) => q.annee === 2);
  return an2.reduce((a, b) => (b.demande > a.demande ? b : a)).trimestre;
};

/** La prévision du trimestre fort de la troisième année, pas à pas, aux arrondis de l'élève. */
export function prevision(c: Cas) {
  const serie = troisAnnees(c.code);
  const fort = trimestreFort(c);
  const total = (annee: number) => serie.filter((q) => q.annee === annee).reduce((t, q) => t + q.demande, 0);
  const du = (annee: number, trimestre: number) => serie.find((q) => q.annee === annee && q.trimestre === trimestre)!;
  const total1 = total(1);
  const total2 = total(2);
  const croissance = auDixieme((total2 / total1 - 1) * 100);
  const coef1 = auCentieme(du(1, fort).demande / (total1 / TRIMESTRES_PAR_AN));
  const coef2 = auCentieme(du(2, fort).demande / (total2 / TRIMESTRES_PAR_AN));
  const coef = auCentieme((coef1 + coef2) / 2);
  const total3 = Math.round(total2 * (1 + croissance / 100));
  const prevu = Math.round((total3 / TRIMESTRES_PAR_AN) * coef);
  const reel = du(3, fort).demande;
  return {
    serie,
    fort,
    total1,
    total2,
    croissance,
    coef1,
    coef2,
    coef,
    total3,
    prevu,
    reel,
    ecart: auDixieme(((reel - prevu) / prevu) * 100),
    total3Reel: total(3),
    venduFort2: du(2, fort).vendu,
    demandeFort2: du(2, fort).demande,
  };
}

const tableauDesDeuxAnnees = (c: Cas) => ({
  titre: `${c.entreprise} · deux années de l'arène, trimestre par trimestre`,
  colonnes: ["Demande", "Vendu"],
  lignes: troisAnnees(c.code)
    .filter((q) => q.annee < ANNEES)
    .map((q) => ({ libelle: `Année ${q.annee}, trimestre ${q.trimestre}`, valeurs: [qte(q.demande), qte(q.vendu)] })),
});

export const PREVOIR_LES_VENTES: Chapitre = {
  code: "prevoir-les-ventes",
  parcours: "mco",
  palier: 3,
  titre: "Prévoir les ventes",
  accroche:
    "Deux années observées, la troisième à prévoir : la tendance, la saison, la prévision du trimestre fort. Puis l'arène joue l'année, et l'on mesure l'écart.",
  objectifs: [
    "Choisir la bonne série : la demande, quand les ventes ont été plafonnées",
    "Calculer un taux de croissance annuel",
    "Calculer un coefficient saisonnier moyen",
    "Prévoir un trimestre de l'année suivante",
    "Mesurer l'écart entre la prévision et la réalité, et l'expliquer",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce chapitre prévoit la demande d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux années pour en prévoir une",
      notions: ["seasonality"],
      texte: (c) => [
        `Le tableau donne deux années de ${c.entreprise} dans l'arène, trimestre par trimestre : la demande que le marché lui a adressée, et ce qu'elle a vendu.`,
        "Deux mouvements s'y mêlent : la saison, qui revient chaque année au même trimestre, et la tendance, qui fait grandir ou baisser l'année entière. Prévoir, c'est séparer les deux, puis les recomposer pour l'année qui vient.",
      ],
      repere: () =>
        "Coefficient saisonnier = demande du trimestre ÷ moyenne trimestrielle de l'année. Prévision du trimestre = total prévu de l'année ÷ 4 × coefficient saisonnier.",
      tableau: tableauDesDeuxAnnees,
    },
    {
      id: "quelle-serie",
      type: "choix",
      titre: "Les ventes, ou la demande ?",
      notions: ["seasonality", "stock"],
      tableau: tableauDesDeuxAnnees,
      question: (c) => {
        const p = prevision(c);
        return `Au trimestre ${p.fort} de la deuxième année, ${c.entreprise} a vendu ${qte(p.venduFort2)} ${c.unites} pour une demande de ${qte(p.demandeFort2)}. Sur quelle série faut-il bâtir la prévision ?`;
      },
      options: (c) => {
        const p = prevision(c);
        return [
          {
            texte: "Sur la demande : les ventes du trimestre fort ont été plafonnées.",
            juste: true,
            retour: `Oui. Au trimestre ${p.fort}, ${c.entreprise} n'a pas pu servir toute la demande : ses ventes disent ce qu'elle avait, pas ce que le marché voulait. Prévoir sur les ventes reconduirait la rupture l'an prochain.`,
          },
          {
            texte: "Sur les ventes : c'est le seul chiffre certain.",
            juste: false,
            retour: `Les ventes sont certaines, mais elles sont bornées par le stock ou la capacité. Au trimestre ${p.fort}, ${qte(p.demandeFort2 - p.venduFort2)} ${c.unites} ${accordPluriel(c, "demandé")} n'ont pas été ${accordPluriel(c, "servi")}.`,
          },
          {
            texte: "Sur la moyenne des deux : pour ne pas trop se tromper.",
            juste: false,
            retour: "Mélanger les deux séries ne corrige rien : la prévision serait toujours tirée vers le bas par les ventes manquées.",
          },
        ];
      },
    },
    {
      id: "tendance",
      type: "montants",
      titre: "La tendance d'une année à l'autre",
      notions: ["seasonality"],
      tableau: tableauDesDeuxAnnees,
      question: () =>
        "Additionnez la demande des quatre trimestres de chaque année, puis calculez le taux de croissance de la deuxième année sur la première, en pourcentage, au dixième.",
      champs: (c) => {
        const p = prevision(c);
        const an = (y: number) => p.serie.filter((q) => q.annee === y).map((q) => qte(q.demande)).join(" + ");
        return [
          { libelle: "Demande de l'année 1", attendu: p.total1, calcul: `${an(1)} = ${qte(p.total1)}` },
          { libelle: "Demande de l'année 2", attendu: p.total2, calcul: `${an(2)} = ${qte(p.total2)}` },
          { libelle: "Taux de croissance (%)", attendu: p.croissance, calcul: `(${qte(p.total2)} ÷ ${qte(p.total1)} − 1) × 100 = ${pct(p.croissance)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const p = prevision(c);
        return [`D'une année à l'autre, la demande adressée à ${c.entreprise} a grandi de ${pct(p.croissance)}. C'est la tendance.`];
      },
    },
    {
      id: "saison",
      type: "montants",
      titre: "Le coefficient saisonnier",
      notions: ["seasonality"],
      tableau: tableauDesDeuxAnnees,
      question: (c) => {
        const p = prevision(c);
        return `Le trimestre ${p.fort} est le plus fort de l'année. Pour chaque année, rapportez sa demande à la moyenne trimestrielle de l'année (le total divisé par 4), au centième. Puis faites la moyenne des deux coefficients.`;
      },
      champs: (c) => {
        const p = prevision(c);
        const d1 = p.serie.find((q) => q.annee === 1 && q.trimestre === p.fort)!.demande;
        const d2 = p.demandeFort2;
        return [
          { libelle: "Coefficient de l'année 1", attendu: p.coef1, calcul: `${qte(d1)} ÷ (${qte(p.total1)} ÷ 4) = ${deux(p.coef1)}`, tolerance: 0.01 },
          { libelle: "Coefficient de l'année 2", attendu: p.coef2, calcul: `${qte(d2)} ÷ (${qte(p.total2)} ÷ 4) = ${deux(p.coef2)}`, tolerance: 0.01 },
          { libelle: "Coefficient saisonnier moyen", attendu: p.coef, calcul: `(${deux(p.coef1)} + ${deux(p.coef2)}) ÷ 2 = ${deux(p.coef)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const p = prevision(c);
        return [
          `Au trimestre ${p.fort}, la demande vaut ${deux(p.coef)} fois un trimestre moyen : ${pct(auDixieme((p.coef - 1) * 100))} de plus. Le coefficient ne dit rien de la tendance ; il dit seulement comment l'année se répartit.`,
        ];
      },
    },
    {
      id: "prevision",
      type: "montants",
      titre: "La prévision",
      notions: ["seasonality"],
      question: (c) => {
        const p = prevision(c);
        return `Prolongez la tendance : la demande de l'année 3 grandit encore de ${pct(p.croissance)} (à l'unité). Puis appliquez la saison : la prévision du trimestre ${p.fort} de l'année 3 est le total divisé par 4, multiplié par ${deux(p.coef)} (à l'unité).`;
      },
      champs: (c) => {
        const p = prevision(c);
        return [
          { libelle: "Demande prévue pour l'année 3", attendu: p.total3, calcul: `${qte(p.total2)} × ${(1 + p.croissance / 100).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} = ${qte(p.total3)}`, tolerance: 2 },
          {
            libelle: `Prévision du trimestre ${p.fort}`,
            attendu: p.prevu,
            calcul: `${qte(p.total3)} ÷ 4 × ${deux(p.coef)} = ${qte(p.prevu)}`,
            tolerance: 2,
          },
        ];
      },
      explication: (c) => {
        const p = prevision(c);
        return [`Si tout continue comme avant, ${c.entreprise} doit s'attendre à une demande de ${qte(p.prevu)} ${c.unites} au trimestre ${p.fort} de l'année 3. C'est sur ce chiffre qu'elle commandera, embauchera, ou réservera de la place.`];
      },
    },
    {
      id: "ecart",
      type: "montants",
      titre: "L'arène a joué l'année",
      notions: ["seasonality"],
      question: (c) => {
        const p = prevision(c);
        return `L'arène a joué la troisième année : la demande réelle du trimestre ${p.fort} a été de ${qte(p.reel)} ${c.unites}. Calculez l'écart de la réalité à la prévision, en pourcentage de la prévision, au dixième (négatif si la réalité est plus basse).`;
      },
      champs: (c) => {
        const p = prevision(c);
        return [{ libelle: "Écart (%)", attendu: p.ecart, calcul: `(${qte(p.reel)} − ${qte(p.prevu)}) ÷ ${qte(p.prevu)} × 100 = ${pct(p.ecart)}`, tolerance: 0.2 }];
      },
      explication: (c) => {
        const p = prevision(c);
        return [
          p.ecart < 0
            ? `La réalité est ${pct(Math.abs(p.ecart))} sous la prévision. En s'organisant pour ${qte(p.prevu)} ${c.unites}, ${c.entreprise} en aurait eu trop : du stock ou des heures de travail payés pour rien.`
            : `La réalité dépasse la prévision de ${pct(p.ecart)}. En s'organisant pour ${qte(p.prevu)} ${c.unites}, ${c.entreprise} aurait manqué des ventes.`,
        ];
      },
    },
    {
      id: "pourquoi-l-ecart",
      type: "choix",
      titre: "Pourquoi la prévision s'est trompée",
      notions: ["seasonality"],
      question: (c) => {
        const p = prevision(c);
        return `Sur toute l'année 3, la demande a été de ${qte(p.total3Reel)} ${c.unites}, contre ${qte(p.total2)} l'année 2. Qu'est-ce qui explique d'abord l'écart ?`;
      },
      options: (c) => {
        const p = prevision(c);
        const croissance3 = auDixieme((p.total3Reel / p.total2 - 1) * 100);
        return [
          {
            texte: "La croissance de l'année 2 ne s'est pas répétée : le marché est arrivé à maturité.",
            juste: true,
            retour: `Oui. La demande a grandi de ${pct(p.croissance)} l'année 2, mais de ${pct(croissance3)} seulement l'année 3. Prolonger une tendance, c'est parier qu'elle dure : il faut la surveiller, et corriger la prévision chaque trimestre.`,
          },
          {
            texte: "Le coefficient saisonnier était faux.",
            juste: false,
            retour: "La saison s'est bien répétée : c'est l'année entière qui a moins grandi que prévu.",
          },
          {
            texte: "Une erreur de calcul : la méthode donne toujours le bon chiffre.",
            juste: false,
            retour: "Aucune méthode ne connaît l'avenir. Une prévision est une hypothèse chiffrée, que la réalité vient corriger.",
          },
        ];
      },
    },
  ],
};
