import type { Cas } from "../../cas";
import { MARCHES, marcheEtPart } from "../../chapitres/marche-et-part-de-marche";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE MARCHÉ ET LA PART DE MARCHÉ » : GARDER SA PART DE MARCHÉ
 * (Bac STMG, mercatique, palier 1).
 *
 * L'étude de marché annonce que le marché va encore grandir au prochain trimestre. La
 * direction demande ce que deviendrait la part de marché de l'entreprise si ses ventes ne
 * bougeaient pas, et combien il faudrait vendre pour la garder. L'élève part du dernier
 * trimestre de l'arène et refait seul les calculs du chapitre : la part de marché, la
 * taille du marché prévue, la part sans ventes en plus, les points perdus, puis les ventes
 * qui gardent la part.
 *
 * Le cas est neuf par sa question : le chapitre mesure ce qui s'est passé dans l'année, le
 * cas prévoit le trimestre qui vient. Les chiffres du dernier trimestre sont ceux du
 * chapitre (`marcheEtPart`).
 */

/**
 * La croissance du marché que l'étude prévoit pour le prochain trimestre : 8 %, un marché
 * qui continue de grandir sans s'emballer. Elle suffit à faire perdre des points à une
 * entreprise dont les ventes restent les mêmes.
 */
export const CROISSANCE_PREVUE_DU_MARCHE = 0.08;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function garderSaPart(c: Cas) {
  const m = marcheEtPart(c);
  const marche = m.fin.marche;
  const ventes = m.fin.entreprise.ventes;
  const part = auDixieme((ventes / marche) * 100);
  const marchePrevu = Math.round(marche * (1 + CROISSANCE_PREVUE_DU_MARCHE));
  const partSansEffort = auDixieme((ventes / marchePrevu) * 100);
  // Garder la même part, c'est vendre la même fraction du marché prévu : à l'unité
  // supérieure, puisqu'une unité de moins laisserait la part un peu en dessous.
  const ventesExactes = Math.round(((ventes * marchePrevu) / marche) * 10) / 10;
  const ventesNecessaires = Math.ceil((ventes * marchePrevu) / marche - 1e-9);
  return {
    trimestre: m.trimestres,
    marche,
    ventes,
    part,
    marchePrevu,
    partSansEffort,
    pointsPerdus: auDixieme(part - partSansEffort),
    ventesExactes,
    ventesNecessaires,
    ventesEnPlus: ventesNecessaires - ventes,
    // Avec la part arrondie au dixième, le calcul de l'élève peut s'écarter de quelques unités.
    toleranceVentes: Math.ceil(marchePrevu * 0.0005) + 1,
    // L'erreur classique : prendre pour soi toute la croissance du marché.
    croissanceDuMarche: marchePrevu - marche,
  };
}

export const GARDER_SA_PART_DE_MARCHE: Situation = {
  code: "garder-sa-part-de-marche",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["marche-et-part-de-marche"],
  commanditaire: "La direction",
  titre: "Garder sa part de marché",
  accroche:
    "Le marché va encore grandir au prochain trimestre. La direction veut savoir ce que deviendrait sa part de marché sans ventes en plus, et combien vendre pour la garder.",
  objectifs: [
    "Calculer une part de marché à partir des ventes et de la taille du marché",
    "Prévoir la taille du marché avec un taux de croissance",
    "Mesurer en points ce qu'une part de marché perd quand le marché grandit plus vite que les ventes",
    "Calculer les ventes qui gardent la même part de marché",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  entreprises: {
    codes: MARCHES,
    pourquoi: "ce cas mesure un marché en ventes, et chez VOLT FITNESS le marché se compte d'abord en abonnés gardés.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => [
        `« L'étude de marché prévoit que notre marché grandira encore de ${pct(CROISSANCE_PREVUE_DU_MARCHE * 100)} au prochain trimestre. Si ${c.entreprise} vend autant qu'au dernier trimestre, que devient notre part de marché ? Et combien faut-il vendre pour la garder ? J'ai besoin de ce chiffre pour fixer l'objectif de l'équipe commerciale. »`,
        "Pas de cours cette fois : vous avez les chiffres du dernier trimestre, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = garderSaPart(c);
        return {
          titre: `Le marché du dernier trimestre · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Taille du marché au trimestre ${r.trimestre} (${c.unites})`, valeurs: [qte(r.marche)] },
            { libelle: `Ventes ${dE(c.entreprise)} au trimestre ${r.trimestre} (${c.unites})`, valeurs: [qte(r.ventes)] },
            { libelle: "Croissance du marché prévue au prochain trimestre", valeurs: [pct(CROISSANCE_PREVUE_DU_MARCHE * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la part de marché d'aujourd'hui, la taille du marché prévue, la part sans ventes en plus, les ventes qui gardent la part, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "La part de marché et le marché prévu",
      notions: ["demand_market_share"],
      question: () =>
        "Calculez la part de marché de l'entreprise au dernier trimestre, en pourcentage au dixième, puis la taille du marché prévue au prochain trimestre, à l'unité.",
      champs: (c) => {
        const r = garderSaPart(c);
        return [
          { libelle: "Part de marché au dernier trimestre (%)", attendu: r.part, tolerance: 0.1, calcul: `${qte(r.ventes)} ÷ ${qte(r.marche)} × 100 = ${pct(r.part)}` },
          { libelle: `Taille du marché prévue (${c.unites})`, attendu: r.marchePrevu, tolerance: 1, calcul: `${qte(r.marche)} × (1 + ${pct(CROISSANCE_PREVUE_DU_MARCHE * 100)}) = ${qte(r.marchePrevu)}` },
        ];
      },
      explication: (c) => {
        const r = garderSaPart(c);
        return [
          `Aujourd'hui, ${c.entreprise} vend ${pct(r.part)} de ce que le marché achète. Au prochain trimestre, le marché passerait à ${qte(r.marchePrevu)} ${c.unites} : ${qte(r.croissanceDuMarche)} de plus à se partager entre tous les vendeurs.`,
        ];
      },
    },
    {
      id: "sans-ventes-en-plus",
      type: "montants",
      titre: "Si les ventes ne bougent pas",
      notions: ["demand_market_share"],
      question: () =>
        "Si l'entreprise vend autant qu'au dernier trimestre, quelle sera sa part de marché au prochain trimestre, en pourcentage au dixième ? Combien de points aura-t-elle perdus ?",
      champs: (c) => {
        const r = garderSaPart(c);
        return [
          { libelle: "Part de marché sans ventes en plus (%)", attendu: r.partSansEffort, tolerance: 0.1, calcul: `${qte(r.ventes)} ÷ ${qte(r.marchePrevu)} × 100 = ${pct(r.partSansEffort)}` },
          { libelle: "Points de part de marché perdus", attendu: r.pointsPerdus, tolerance: 0.1, calcul: `${pct(r.part)} − ${pct(r.partSansEffort)} = ${qte(r.pointsPerdus)} point${r.pointsPerdus >= 2 ? "s" : ""}` },
        ];
      },
      explication: (c) => {
        const r = garderSaPart(c);
        return [
          `Même sans vendre moins, ${c.entreprise} perdrait ${qte(r.pointsPerdus)} point${r.pointsPerdus >= 2 ? "s" : ""} de part de marché : ses concurrents prendraient les clients que le marché gagne. Rester immobile sur un marché qui grandit, c'est reculer.`,
          `Le marché grandit de ${pct(CROISSANCE_PREVUE_DU_MARCHE * 100)}, mais la part ne perd pas ${qte(CROISSANCE_PREVUE_DU_MARCHE * 100)} points : elle en perd ${qte(r.pointsPerdus)}. L'écart entre deux parts de marché se compte en points, pas en pourcentage.`,
        ];
      },
    },
    {
      id: "ventes-necessaires",
      type: "montants",
      titre: "Les ventes qui gardent la part",
      notions: ["demand_market_share"],
      question: () =>
        "Pour garder la part de marché d'aujourd'hui, combien l'entreprise doit-elle vendre au prochain trimestre (taille du marché prévue × part d'aujourd'hui, à l'unité supérieure) ? Combien est-ce de plus qu'au dernier trimestre ?",
      champs: (c) => {
        const r = garderSaPart(c);
        return [
          { libelle: `Ventes nécessaires (${c.unites})`, attendu: r.ventesNecessaires, tolerance: r.toleranceVentes, calcul: `${qte(r.marchePrevu)} × ${qte(r.ventes)} ÷ ${qte(r.marche)} = ${qte(r.ventesExactes)}, soit ${qte(r.ventesNecessaires)} à l'unité supérieure` },
          { libelle: `Ventes en plus (${c.unites})`, attendu: r.ventesEnPlus, tolerance: r.toleranceVentes, calcul: `${qte(r.ventesNecessaires)} − ${qte(r.ventes)} = ${qte(r.ventesEnPlus)}` },
        ];
      },
      explication: (c) => {
        const r = garderSaPart(c);
        return [
          `Pour garder sa part, ${c.entreprise} doit faire grandir ses ventes au même rythme que le marché : ${qte(r.ventesEnPlus)} ${c.unites} de plus, soit ${qte(r.ventesNecessaires)} dans le trimestre. C'est l'objectif minimal à donner à l'équipe commerciale ; en dessous, la part recule.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = garderSaPart(c);
        return [
          {
            texte: `Pour garder notre part, il faut vendre ${qte(r.ventesEnPlus)} ${c.unites} de plus`,
            juste: true,
            retour: `Oui : le marché passe de ${qte(r.marche)} à ${qte(r.marchePrevu)} ${c.unites}. Pour en garder ${pct(r.part)}, ${c.entreprise} doit en vendre ${qte(r.ventesNecessaires)}, ${qte(r.ventesEnPlus)} de plus qu'aujourd'hui ; sinon sa part tombe à ${pct(r.partSansEffort)}.`,
          },
          {
            texte: "Si nous vendons autant qu'aujourd'hui, notre part de marché ne bougera pas",
            juste: false,
            retour: `Non : la part se calcule sur la taille du marché, qui grandit. Avec les mêmes ventes, elle passerait de ${pct(r.part)} à ${pct(r.partSansEffort)}.`,
          },
          {
            texte: `Sans ventes en plus, notre part de marché perdrait ${qte(CROISSANCE_PREVUE_DU_MARCHE * 100)} points`,
            juste: false,
            retour: `Non : c'est confondre les points et le pourcentage. Le marché grandit de ${pct(CROISSANCE_PREVUE_DU_MARCHE * 100)}, mais la part passe de ${pct(r.part)} à ${pct(r.partSansEffort)} : ${qte(r.pointsPerdus)} point${r.pointsPerdus >= 2 ? "s" : ""} de moins.`,
          },
          {
            texte: `Il faut vendre ${qte(r.croissanceDuMarche)} ${c.unites} de plus, toute la croissance du marché`,
            juste: false,
            retour: `Non : ce serait prendre pour nous tous les clients en plus du marché, et donc gagner des points. Pour seulement garder ${pct(r.part)}, il suffit d'en prendre la même part : ${qte(r.ventesEnPlus)} ${c.unites}.`,
          },
        ];
      },
    },
  ],
};
