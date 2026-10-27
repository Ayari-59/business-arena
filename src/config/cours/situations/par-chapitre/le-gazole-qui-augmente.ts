import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../../scenarios/registry";
import { accord } from "../../accords";
import { anneeJouee, type Cas } from "../../cas";
import { CE_QUE_COUTE_UNE_LIVRAISON, coutDUneLivraison } from "../../chapitres/ce-que-coute-une-livraison";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CE QUE COÛTE UNE LIVRAISON » : LE GAZOLE QUI AUGMENTE (2de pro GATL,
 * palier 1).
 *
 * Le chapitre a compté ce que coûte une palette livrée au premier trimestre : la route, la part du
 * chauffeur, la part des camions. Dans l'arène, le scénario du transporteur fait monter le gazole
 * à un trimestre fixé (`scriptedEvents` : l'événement qui multiplie le coût du carburant et des
 * péages). Le gérant demande s'il faut monter le prix de la palette d'autant. L'élève chiffre la
 * hausse par palette, le nouveau coût d'une palette livrée à volume égal (celui du premier
 * trimestre : seuls le carburant et les péages changent), ce qu'il en reste au prix du client,
 * et répond.
 *
 * Les chiffres sont ceux du chapitre (`coutDUneLivraison`) et de l'événement du scénario ; le
 * coût variable que le moteur compte au trimestre de la hausse est celui que l'élève trouve.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** La hausse du gazole que le scénario programme : le trimestre, et le taux. */
export function hausseDuGazole(code: string) {
  const s = scenarioByCode(code).scenario;
  for (const p of s.scriptedEvents ?? []) {
    const ev = s.events.find((e) => e.code === p.eventCode);
    const m = ev?.modifiers.find((x) => x.target === "material_cost" && x.op === "mul");
    if (m) return { trimestre: p.round, taux: Math.round((m.value - 1) * 1000) / 1000 };
  }
  throw new Error(`Le scénario ${code} ne programme pas de hausse du carburant`);
}

/** Ce que la hausse fait à une palette, à volume égal, et ce que le moteur compte ce trimestre-là. */
export function gazoleQuiAugmente(c: Cas) {
  const k = coutDUneLivraison(c);
  const h = hausseDuGazole(c.code);
  const hausse = auCentime(k.carburant * h.taux);
  const route = auCentime(k.route + hausse);
  const cout = auCentime(route + k.chauffeurParPalette + k.camionsParPalette);
  const reste = auCentime(k.prix - cout);
  const r = anneeJouee(c.code).partie.rounds[h.trimestre - 1]!.results["joueur"]!;
  return {
    k,
    h,
    hausse,
    route,
    cout,
    reste,
    /** Le prix monté du même taux que le gazole, et ce que cela ferait payer en plus au client. */
    prixMonte: auCentime(k.prix * (1 + h.taux)),
    enPlusPourLeClient: auCentime(k.prix * h.taux),
    /** Le coût variable unitaire que le moteur compte au trimestre de la hausse. */
    routeDuMoteur: auCentime(r.breakeven.unitVariableCost),
  };
}

export const LE_GAZOLE_QUI_AUGMENTE: Situation = {
  code: "le-gazole-qui-augmente",
  parcours: "logistique",
  palier: 1,
  blocs: [],
  reprend: [CE_QUE_COUTE_UNE_LIVRAISON.code],
  commanditaire: "Le gérant",
  titre: "Le gazole qui augmente",
  accroche:
    "Le gazole monte d'un coup. Le gérant se demande s'il faut monter le prix de la palette d'autant : chiffrer la hausse par palette, ce que coûte maintenant une palette livrée, ce qu'il en reste, et lui répondre.",
  objectifs: [
    "Chiffrer une hausse du carburant par palette",
    "Recalculer ce que coûte une palette livrée",
    "Comparer ce coût au prix payé par le client, et répondre au gérant",
  ],
  libre: false,
  entreprises: CE_QUE_COUTE_UNE_LIVRAISON.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const g = gazoleQuiAugmente(c);
        return [
          `« Au trimestre ${g.h.trimestre}, le gazole prend ${pct(g.h.taux * 100)}. Faut-il monter notre prix de ${eur(g.k.prix)} par ${c.unite} d'autant ? Dites-moi ce que coûte maintenant ${accord(c, "un")} ${c.unite} ${accord(c, "livré")}, et ce qu'il nous en reste. »`,
          `Pas de cours cette fois : vous avez les coûts d'${accord(c, "un")} ${c.unite} au premier trimestre. Dans l'arène, la hausse touche le carburant et les péages, que le scénario compte ensemble. Raisonnez à volume égal : le chauffeur et les camions se partagent sur les mêmes ${c.unites} qu'au premier trimestre.`,
        ];
      },
      tableau: (c) => {
        const g = gazoleQuiAugmente(c);
        return {
          titre: `${c.entreprise} · ${accord(c, "un")} ${c.unite} au premier trimestre`,
          colonnes: [`Par ${c.unite}`],
          lignes: [
            { libelle: "Carburant et péages", valeurs: [eur(g.k.carburant)] },
            { libelle: "Entretien courant, pneus, primes de route", valeurs: [eur(g.k.entretienCourant)] },
            { libelle: "Part du chauffeur", valeurs: [eur(g.k.chauffeurParPalette)] },
            { libelle: "Part des camions", valeurs: [eur(g.k.camionsParPalette)] },
            { libelle: "Prix payé par le client", valeurs: [eur(g.k.prix)] },
          ],
        };
      },
      repere: () => "À rendre : la hausse par palette, le nouveau coût d'une palette livrée, ce qu'il en reste, et votre réponse.",
    },
    {
      id: "route",
      type: "montants",
      titre: "La route plus chère",
      notions: ["variable_costs"],
      question: (c) => {
        const g = gazoleQuiAugmente(c);
        return `Le carburant et les péages coûtaient ${eur(g.k.carburant)} par ${c.unite}. Calculez la hausse par ${c.unite} (${pct(g.h.taux * 100)} de ${eur(g.k.carburant)}), puis le nouveau coût de la route, qui était de ${eur(g.k.route)}.`;
      },
      champs: (c) => {
        const g = gazoleQuiAugmente(c);
        return [
          { libelle: `Hausse par ${c.unite}`, attendu: g.hausse, calcul: `${eur(g.k.carburant)} × ${pct(g.h.taux * 100)} = ${eur(g.hausse)}` },
          { libelle: `Nouveau coût de la route par ${c.unite}`, attendu: g.route, calcul: `${eur(g.k.route)} + ${eur(g.hausse)} = ${eur(g.route)}` },
        ];
      },
      explication: (c) => {
        const g = gazoleQuiAugmente(c);
        return [
          `Dans l'arène, au trimestre ${g.h.trimestre}, le coût variable d'${accord(c, "un")} ${c.unite} passe bien à ${eur(g.routeDuMoteur)}. La hausse de ${pct(g.h.taux * 100)} ne touche que le carburant et les péages : ${eur(g.hausse)} de plus par ${c.unite}.`,
        ];
      },
    },
    {
      id: "reste",
      type: "montants",
      titre: "Ce qui reste par palette",
      notions: ["full_unit_cost"],
      question: (c) => {
        const g = gazoleQuiAugmente(c);
        return `Ajoutez au nouveau coût de la route (${eur(g.route)}) la part du chauffeur (${eur(g.k.chauffeurParPalette)}) et celle des camions (${eur(g.k.camionsParPalette)}), qui ne changent pas. Puis calculez ce qui reste au prix de ${eur(g.k.prix)}.`;
      },
      champs: (c) => {
        const g = gazoleQuiAugmente(c);
        return [
          {
            libelle: `Coût d'${accord(c, "un")} ${c.unite} ${accord(c, "livré")}`,
            attendu: g.cout,
            calcul: `${eur(g.route)} + ${eur(g.k.chauffeurParPalette)} + ${eur(g.k.camionsParPalette)} = ${eur(g.cout)}`,
          },
          { libelle: `Ce qui reste par ${c.unite}`, attendu: g.reste, calcul: `${eur(g.k.prix)} − ${eur(g.cout)} = ${eur(g.reste)}` },
        ];
      },
      explication: (c) => {
        const g = gazoleQuiAugmente(c);
        return [
          g.reste >= 0
            ? `${majuscule(accord(c, "un"))} ${c.unite} coûte ${eur(g.cout)} au lieu de ${eur(g.k.coutDUnePalette)}. Il en reste ${eur(g.reste)} au lieu de ${eur(g.k.reste)} : moins qu'avant, mais le prix couvre encore la palette.`
            : `${majuscule(accord(c, "un"))} ${c.unite} coûte ${eur(g.cout)}, plus que le prix de ${eur(g.k.prix)} : chaque ${c.unite} fait perdre ${eur(-g.reste)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle réponse envoyez-vous au gérant ?",
      options: (c) => {
        const g = gazoleQuiAugmente(c);
        const couvre = g.reste >= 0;
        return [
          {
            texte: "Garder le prix : la palette couvre encore son coût",
            juste: couvre,
            retour: couvre
              ? `Oui : ${accord(c, "un")} ${c.unite} coûte maintenant ${eur(g.cout)}, et le client la paie ${eur(g.k.prix)}. Il reste ${eur(g.reste)} par ${c.unite}, contre ${eur(g.k.reste)} avant la hausse.`
              : `Non : ${accord(c, "un")} ${c.unite} coûte maintenant ${eur(g.cout)}, plus que les ${eur(g.k.prix)} du client.`,
          },
          {
            texte: `Monter le prix de ${pct(g.h.taux * 100)}, comme le gazole`,
            juste: false,
            retour: `Non : ${pct(g.h.taux * 100)} de ${eur(g.k.prix)}, c'est ${eur(g.enPlusPourLeClient)} de plus pour le client (${eur(g.prixMonte)}), quand ${accord(c, "un")} ${c.unite} ne coûte que ${eur(g.hausse)} de plus. Le gazole n'est qu'une partie du coût, et les clients comparent les prix.`,
          },
          {
            texte: "Monter le prix : la palette coûte plus qu'elle ne rapporte",
            juste: !couvre,
            retour: couvre
              ? `Non : ${accord(c, "un")} ${c.unite} coûte ${eur(g.cout)} et rapporte ${eur(g.k.prix)}. Elle rapporte encore ${eur(g.reste)} de plus que ce qu'elle coûte.`
              : `Oui : ${accord(c, "un")} ${c.unite} coûte ${eur(g.cout)} et ne rapporte que ${eur(g.k.prix)}. Il manque ${eur(-g.reste)} par ${c.unite}.`,
          },
        ];
      },
    },
  ],
};
