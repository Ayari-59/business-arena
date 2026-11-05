import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_RESEAU, reseauDeLaBoutique } from "../../chapitres/le-marche-et-le-reseau";
import { SECONDE_ENSEIGNE, hausseQuiEgale, moisSelonLaForme } from "../../monde/reseau-de-la-boutique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE MARCHÉ ET LE RÉSEAU » : UNE SECONDE ENSEIGNE FRAPPE À LA PORTE (BTS MCO,
 * palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le mois de janvier de MAILLE & CO et les formes de commerce du
 * chapitre (monde/reseau-de-la-boutique.ts), face à une seconde enseigne aux conditions différentes
 * (`SECONDE_ENSEIGNE`). Elle prend moins de redevances que la première, sa centrale achète moins bien,
 * et elle promet 10 % de ventes en plus quand ses franchisés en observent 6 %. L'élève refait seul le
 * résultat du mois en franchise, à la hausse observée et à la hausse promise, trouve au curseur la
 * hausse qui bat le groupement, et répond. Le piège : juger sur la hausse promise, ou sur des
 * redevances plus basses.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres de la réponse. */
export function secondeEnseigne(c: Pick<Cas, "code">) {
  const x = reseauDeLaBoutique(c);
  const observee = moisSelonLaForme(x.f, "franchise", SECONDE_ENSEIGNE.hausseObservee, SECONDE_ENSEIGNE);
  const promise = moisSelonLaForme(x.f, "franchise", SECONDE_ENSEIGNE.haussePromise, SECONDE_ENSEIGNE);
  const hausseQuiBatLeGroupement = hausseQuiEgale(x.f, "groupement", true, SECONDE_ENSEIGNE);
  return { ...x, observee, promise, hausseQuiBatLeGroupement, redevances: (SECONDE_ENSEIGNE.redevanceDExploitation + SECONDE_ENSEIGNE.redevanceDeCommunication) * 100 };
}

const tableauDeLOffre = (c: Pick<Cas, "code">) => {
  const x = secondeEnseigne(c);
  return {
    titre: "Ce que propose la seconde enseigne",
    colonnes: ["Conditions"],
    lignes: [
      { libelle: "Remise de sa centrale sur les achats", valeurs: [pct(SECONDE_ENSEIGNE.remiseCentrale * 100, 0)] },
      { libelle: "Redevances, en part du chiffre d'affaires", valeurs: [pct(x.redevances, 0)] },
      { libelle: "Droit d'entrée", valeurs: [`${eur(SECONDE_ENSEIGNE.droitDEntree)} sur ${qte(SECONDE_ENSEIGNE.dureeDuContratEnMois)} mois`] },
      { libelle: "Hausse des ventes promise", valeurs: [pct(SECONDE_ENSEIGNE.haussePromise * 100, 0)] },
      { libelle: "Hausse observée chez ses franchisés", valeurs: [pct(SECONDE_ENSEIGNE.hausseObservee * 100, 0)] },
      { libelle: "Résultat de janvier, indépendante", valeurs: [eur(x.independante.resultat)] },
      { libelle: "Résultat de janvier, au groupement", valeurs: [eur(x.groupement.resultat)] },
    ],
  };
};

export const UNE_SECONDE_ENSEIGNE: Situation = {
  code: "une-seconde-enseigne",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["le-marche-et-le-reseau"],
  commanditaire: "La dirigeante",
  titre: "Une seconde enseigne frappe à la porte",
  accroche:
    "Une seconde enseigne prend moins de redevances que la première et promet 10 % de ventes en plus. Ses franchisés en observent 6 %. Bat-elle le groupement d'achat ?",
  objectifs: [
    "Calculer le résultat du mois en franchise à une hausse des ventes donnée",
    "Trouver la hausse qui rend la franchise meilleure que le groupement",
    "Répondre à la dirigeante en distinguant la hausse promise de la hausse observée",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_RESEAU, pourquoi: "ce cas reprend le mois du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la dirigeante",
      tableau: tableauDeLOffre,
      texte: () => [
        "« Une seconde enseigne me fait une offre : des redevances plus basses que la première, et elle promet 10 % de ventes en plus. Mais ses franchisés que j'ai appelés parlent plutôt de 6 %. Fait-elle mieux que le groupement d'achat ? »",
        "Pas de cours cette fois : vous avez les conditions de l'offre et les résultats de janvier, et la méthode est celle du chapitre.",
      ],
      repere: () => "À rendre : le résultat du mois en franchise à la hausse observée, puis à la hausse promise, la hausse qui bat le groupement, et votre réponse.",
    },
    {
      id: "a-la-hausse-observee",
      objectifs: [0],
      type: "montants",
      titre: "À la hausse observée",
      notions: ["contribution_margin", "fixed_costs"],
      tableau: tableauDeLOffre,
      question: () => "Avec la hausse observée chez les franchisés, calculez la remise de la centrale, les redevances du mois, puis le résultat du mois en franchise.",
      champs: (c) => {
        const x = secondeEnseigne(c);
        const o = x.observee;
        return [
          { libelle: "Remise de la centrale", attendu: o.remise, calcul: `${eur(x.independante.achats)} × ${qte(1 + o.hausse)} × ${pct(SECONDE_ENSEIGNE.remiseCentrale * 100, 0)} = ${eur(o.remise)}` },
          { libelle: "Redevances du mois", attendu: o.redevances, calcul: `${eur(x.independante.chiffreDAffaires)} × ${qte(1 + o.hausse)} × ${pct(x.redevances, 0)} = ${eur(o.redevances)}` },
          { libelle: "Résultat du mois en franchise", attendu: o.resultat, calcul: `${eur(o.marge)} + ${eur(o.remise)} − ${eur(o.redevances)} − ${eur(o.droitDEntreeDuMois)} − ${eur(o.chargesFixes)} = ${eur(o.resultat)}` },
        ];
      },
      explication: (c) => {
        const x = secondeEnseigne(c);
        return [`À ${pct(SECONDE_ENSEIGNE.hausseObservee * 100, 0)}, la seconde enseigne laisse ${eur(x.observee.resultat)} : plus que l'indépendance (${eur(x.independante.resultat)}), moins que le groupement (${eur(x.groupement.resultat)}).`];
      },
    },
    {
      id: "a-la-hausse-promise",
      objectifs: [0],
      type: "montants",
      titre: "À la hausse promise",
      notions: ["contribution_margin"],
      question: () => "Refaites le résultat du mois en franchise avec la hausse que l'enseigne promet.",
      champs: (c) => {
        const p = secondeEnseigne(c).promise;
        return [{ libelle: "Résultat du mois à la hausse promise", attendu: p.resultat, calcul: `${eur(p.marge)} + ${eur(p.remise)} − ${eur(p.redevances)} − ${eur(p.droitDEntreeDuMois)} − ${eur(p.chargesFixes)} = ${eur(p.resultat)}` }];
      },
      explication: (c) => {
        const x = secondeEnseigne(c);
        return [`À ${pct(SECONDE_ENSEIGNE.haussePromise * 100, 0)}, la franchise laisserait ${eur(x.promise.resultat)}, ${eur(auCentime(x.promise.resultat - x.groupement.resultat))} de plus que le groupement. Tout dépend de la hausse que l'on croit.`];
      },
    },
    {
      id: "la-hausse-qui-suffit",
      objectifs: [1],
      type: "curseur",
      titre: "La hausse qui bat le groupement",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) =>
        `Faites varier la hausse des ventes, de 0 à 20 %. Une courbe donne le résultat en franchise chez la seconde enseigne, l'autre le résultat au groupement (${eur(secondeEnseigne(c).groupement.resultat)}). Placez le curseur sur la plus petite hausse où la franchise laisse plus, puis validez.`,
      grandeur: () => ({ libelle: "Hausse des ventes", unite: "%" }),
      cible: (c) => ({ attendu: secondeEnseigne(c).hausseQuiBatLeGroupement, min: 0, max: 20 }),
      zones: ["La franchise laisse plus", "Le groupement laisse plus"],
      rates: () => ({ dessous: "À cette hausse, le groupement laisse encore plus.", dessus: "La franchise laisse déjà plus avec moins de ventes en plus : cherchez la plus petite hausse." }),
      montrer: "Montrer la hausse qui suffit",
      lecture: (c, h) => {
        const x = secondeEnseigne(c);
        const r = moisSelonLaForme(x.f, "franchise", h / 100, SECONDE_ENSEIGNE);
        return [
          { libelle: "Résultat en franchise", montant: r.resultat },
          { libelle: "Résultat au groupement", montant: x.groupement.resultat },
          { libelle: "Écart avec le groupement", montant: auCentime(r.resultat - x.groupement.resultat), fort: true },
        ];
      },
      droites: (c) => {
        const x = secondeEnseigne(c);
        return { produit: (h) => moisSelonLaForme(x.f, "franchise", h / 100, SECONDE_ENSEIGNE).resultat, cout: () => x.groupement.resultat, libelles: ["Résultat en franchise", "Résultat au groupement"] };
      },
      explication: (c) => {
        const x = secondeEnseigne(c);
        return [`Il faut ${pct(x.hausseQuiBatLeGroupement, 0)} de ventes en plus : plus que ce que ses franchisés observent, ${pct(SECONDE_ENSEIGNE.hausseObservee * 100, 0)}.`];
      },
    },
    {
      id: "reponse",
      objectifs: [2],
      type: "choix",
      titre: "Votre réponse à la dirigeante",
      question: () => "Quelle phrase envoyez-vous à la dirigeante ?",
      options: (c) => {
        const x = secondeEnseigne(c);
        return [
          {
            texte: `Le groupement reste meilleur : il faudrait ${pct(x.hausseQuiBatLeGroupement, 0)} de hausse, on en observe ${pct(SECONDE_ENSEIGNE.hausseObservee * 100, 0)}`,
            juste: true,
            retour: `Oui : à la hausse observée, ${eur(x.observee.resultat)} contre ${eur(x.groupement.resultat)} au groupement. La promesse de ${pct(SECONDE_ENSEIGNE.haussePromise * 100, 0)} n'est qu'une promesse ; avant de signer, il faudrait aussi lire son document d'information précontractuel.`,
          },
          {
            texte: `La seconde enseigne : ${eur(x.promise.resultat)} à la hausse promise`,
            juste: false,
            retour: "Ce chiffre repose sur la promesse de l'enseigne, pas sur ce que ses franchisés observent. On décide sur l'observé.",
          },
          {
            texte: "La seconde enseigne : ses redevances sont plus basses que celles de la première",
            juste: false,
            retour: `Des redevances plus basses, mais une centrale qui achète moins bien (${pct(SECONDE_ENSEIGNE.remiseCentrale * 100, 0)}) et un droit d'entrée plus lourd : c'est le résultat qui compte, ${eur(x.observee.resultat)}.`,
          },
        ];
      },
    },
  ],
};
