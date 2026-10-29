import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_TABLEAU_DE_BORD, tableauDeBordDuMois, tableauDesDeuxJanviers } from "../../chapitres/tableau-de-bord-du-manager";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TABLEAU DE BORD DU MANAGER » : JANVIER FACE À L'OBJECTIF (BTS MCO,
 * palier 4). Le code reste celui de l'ancien cas, « le trimestre face à l'objectif » ; le titre suit
 * ce que le cas compare désormais, janvier et l'objectif du trimestre.
 *
 * Janvier est clos : MAILLE & CO a manqué son objectif du mois. Le responsable de la boutique assure
 * que février et mars rattraperont le trimestre « en vendant mieux » : la transformation suffira. La
 * direction régionale veut la ligne du tableau de bord et un avis sur ce plan. L'élève calcule l'écart
 * et le taux de réalisation, croise les trois effets (trafic, transformation, panier) pour trouver la
 * cause, puis remonte à rebours du reste du budget au taux de transformation qu'il faudrait. Un curseur
 * sur les entrées montre le trafic qui rattraperait à lui seul. La réponse demande un jugement : le plan
 * du responsable demande une transformation que la boutique n'a jamais eue.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `tableauDeBordDuMois`, sur la fiche de la boutique.
 */

/** Les bornes du curseur des entrées d'un mois de rattrapage. */
export const ENTREES_DU_RATTRAPAGE = { min: 3_800, max: 4_800 } as const;

/** Les mois qui restent au trimestre après janvier. */
export const MOIS_RESTANTS = 2;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);

export type Verdict = "le-trafic-doit-revenir" | "la-transformation-suffit";

/** Les chiffres de la réponse, calculés une fois du cas. */
export function janvierFaceALObjectif(c: Pick<Cas, "code">) {
  const x = tableauDeBordDuMois(c);
  const reste = auCentime(x.budgetDuTrimestre - x.ca);
  const parMois = auCentime(reste / MOIS_RESTANTS);
  // Un seul panier, celui de la caisse : les commandes des comités (hors caisse) font leur part du mois.
  const parMoisEnCaisse = parMois - x.commandes;
  const transformationDuRattrapage = auDixieme((parMoisEnCaisse / (x.m.entrees * x.m.panierMoyen)) * 100);
  const entreesDuRattrapage = plafond(parMoisEnCaisse / x.caParEntree);
  // La plus haute transformation connue : celle de janvier N ou de janvier N − 1.
  const meilleureTransformation = Math.max(x.transformationN, x.transformationN1);
  return {
    x,
    reste,
    parMois,
    parMoisEnCaisse: auCentime(parMoisEnCaisse),
    transformationDuRattrapage,
    entreesDuRattrapage,
    hausseDuTraficSurN1: auDixieme((entreesDuRattrapage / x.n1.trafic - 1) * 100),
    verdict: (transformationDuRattrapage > meilleureTransformation + 1 ? "le-trafic-doit-revenir" : "la-transformation-suffit") as Verdict,
    // L'erreur classique : rapporter janvier N à janvier N − 1 au lieu de l'objectif.
    surN1: auDixieme((x.ca / x.n1.chiffreDAffaires) * 100),
  };
}

export const LE_TRIMESTRE_FACE_A_L_OBJECTIF: Situation = {
  code: "le-trimestre-face-a-l-objectif",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["tableau-de-bord-du-manager"],
  commanditaire: "La direction régionale",
  titre: "Janvier face à l'objectif",
  accroche:
    "Janvier a manqué son objectif. Le responsable promet de rattraper le trimestre en vendant mieux. La direction régionale attend la ligne du tableau de bord, ce qui l'explique, et un avis sur ce plan.",
  objectifs: [
    "Calculer l'objectif du mois, l'écart et le taux de réalisation",
    "Décomposer l'écart sur l'an passé en effet trafic, transformation et panier",
    "Remonter du reste du budget au taux de transformation et au trafic qu'il demande",
    "Répondre à la direction régionale avec un jugement sur le plan proposé",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_DE_BORD,
    pourquoi: "ce cas reprend le chapitre « Le tableau de bord du manager », qui se joue à la boutique du cours, MAILLE & CO, sur son mois de janvier.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction régionale",
      tableau: tableauDesDeuxJanviers,
      texte: (c) => {
        const { x } = janvierFaceALObjectif(c);
        return [
          `« Le budget du trimestre de ${x.f.entreprise} est de ${eur(x.budgetDuTrimestre)}, soit un objectif d'un tiers par mois. Janvier est clos, et l'objectif est manqué. Votre responsable m'écrit que février et mars rattraperont le trimestre en vendant mieux : la transformation suffira. Envoyez-moi la ligne de janvier, ce qui explique l'écart, et votre avis sur ce plan. »`,
          "Pas de cours cette fois : vous avez janvier N et janvier N − 1, et la méthode est celle du chapitre. À vous d'en trouver l'ordre.",
        ];
      },
      repere: () => "À rendre : l'objectif de janvier, l'écart et le taux de réalisation, les trois effets de l'écart sur N − 1, ce que février et mars doivent faire, et votre réponse.",
    },
    {
      id: "l-objectif",
      type: "montants",
      titre: "Janvier face à l'objectif",
      notions: ["dashboard", "revenue"],
      question: () => "Calculez l'objectif de janvier (au centime), l'écart entre le réalisé et l'objectif, puis le taux de réalisation de l'objectif, en pourcentage, au dixième. Négatif pour un écart défavorable.",
      champs: (c) => {
        const { x } = janvierFaceALObjectif(c);
        return [
          { libelle: "Objectif de janvier", attendu: x.objectif, calcul: `${eur(x.budgetDuTrimestre)} ÷ 3 = ${eur(x.objectif)}` },
          { libelle: "Écart à l'objectif", attendu: x.ecartALObjectif, calcul: `${eur(x.ca)} − ${eur(x.objectif)} = ${eur(x.ecartALObjectif)}` },
          { libelle: "Taux de réalisation (%)", attendu: x.realisation, tolerance: 0.1, calcul: `${eur(x.ca)} ÷ ${eur(x.objectif)} × 100 = ${pct(x.realisation)}` },
        ];
      },
      explication: (c) => {
        const { x } = janvierFaceALObjectif(c);
        return [`${x.f.entreprise} n'a réalisé que ${pct(x.realisation)} de son objectif de janvier : il lui manque ${eur(-x.ecartALObjectif)}.`];
      },
    },
    {
      id: "ce-qui-explique",
      type: "montants",
      titre: "Le trafic, la transformation ou le panier ?",
      notions: ["dashboard", "conversion_rate", "average_basket"],
      question: (c) => {
        const { x } = janvierFaceALObjectif(c);
        return `Sur janvier N − 1, le chiffre d'affaires perd ${eur(-(x.ca - x.n1.chiffreDAffaires))}. Décomposez cet écart en effet du trafic, effet de la transformation, puis effet du panier, dans cet ordre, comme au chapitre. Négatif pour un effet défavorable.`;
      },
      champs: (c) => {
        const { x } = janvierFaceALObjectif(c);
        const n1 = x.n1;
        return [
          { libelle: "Effet du trafic", attendu: x.effetDuTrafic, tolerance: 0.5, calcul: `(${qte(x.m.entrees)} − ${qte(n1.trafic)}) × (${eur(n1.chiffreDAffaires)} ÷ ${qte(n1.trafic)}) = ${eur(x.effetDuTrafic)}` },
          {
            libelle: "Effet de la transformation",
            attendu: x.effetDeLaTransformation,
            tolerance: 0.5,
            calcul: `(${qte(x.m.tickets)} − ${qte(x.m.entrees)} × ${qte(n1.tickets)} ÷ ${qte(n1.trafic)}) × ${eur(x.panierN1)} = (${qte(x.m.tickets)} − ${qte(x.passagesAuTauxN1)}) × ${eur(x.panierN1)} = ${eur(x.effetDeLaTransformation)}`,
          },
          { libelle: "Effet du panier", attendu: x.effetDuPanier, tolerance: 0.5, calcul: `${eur(x.caEnCaisse)} − ${qte(x.m.tickets)} × ${eur(x.panierN1)} = ${eur(x.effetDuPanier)}` },
        ];
      },
      explication: (c) => {
        const { x } = janvierFaceALObjectif(c);
        return [
          `Le trafic coûte ${eur(-x.effetDuTrafic)} ; la transformation et le panier en rendent ${eur(auCentime(x.effetDeLaTransformation + x.effetDuPanier))}. Les vendeurs ont déjà mieux vendu qu'en N − 1 : ce qui manque, ce sont des clients.`,
        ];
      },
    },
    {
      id: "ce-qui-reste-a-faire",
      type: "montants",
      titre: "Ce que février et mars doivent faire",
      notions: ["dashboard", "conversion_rate"],
      question: () =>
        "Pour tenir le budget du trimestre, combien de chiffre d'affaires reste-t-il à faire après janvier ? Combien par mois, en février et en mars ? Quel taux de transformation faudrait-il chaque mois pour y arriver aux entrées et au panier de janvier (au dixième) ?",
      champs: (c) => {
        const r = janvierFaceALObjectif(c);
        const x = r.x;
        return [
          { libelle: "Reste à faire sur le trimestre", attendu: r.reste, calcul: `${eur(x.budgetDuTrimestre)} − ${eur(x.ca)} = ${eur(r.reste)}` },
          { libelle: "Chiffre d'affaires par mois", attendu: r.parMois, calcul: `${eur(r.reste)} ÷ ${qte(MOIS_RESTANTS)} = ${eur(r.parMois)}` },
          {
            libelle: "Taux de transformation nécessaire (%)",
            attendu: r.transformationDuRattrapage,
            tolerance: 0.1,
            calcul: `(${eur(r.parMois)} − ${eur(x.commandes)} des commandes des comités) ÷ (${qte(x.m.entrees)} entrées × ${eur(x.panierN)}) × 100 = ${pct(r.transformationDuRattrapage)}`,
          },
        ];
      },
      explication: (c) => {
        const r = janvierFaceALObjectif(c);
        const x = r.x;
        return [
          `Il faudrait ${pct(r.transformationDuRattrapage)} de transformation deux mois de suite, quand la boutique a fait ${pct(x.transformationN)} en janvier N et ${pct(x.transformationN1)} en N − 1. Le plan du responsable demande à l'équipe de faire d'un coup ce qu'elle n'a jamais fait.`,
        ];
      },
    },
    {
      id: "le-trafic-du-rattrapage",
      type: "curseur",
      titre: "Le trafic qui rattraperait",
      notions: ["dashboard", "conversion_rate"],
      question: (c) => {
        const r = janvierFaceALObjectif(c);
        return `Gardez la transformation et le panier de janvier : chaque entrée rapporte ${eur(auCentime(r.x.caParEntree))} en caisse, et les commandes des comités ajoutent ${eur(r.x.commandes)} au mois. Faites varier les entrées d'un mois de rattrapage : à partir de combien le mois fait-il ${eur(r.parMois)} ? Placez le curseur sur le plus petit nombre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Entrées du mois", unite: "entrées" }),
      cible: (c) => ({ attendu: janvierFaceALObjectif(c).entreesDuRattrapage, min: ENTREES_DU_RATTRAPAGE.min, max: ENTREES_DU_RATTRAPAGE.max }),
      zones: ["Le trimestre est rattrapé", "Le trimestre reste en retard"],
      rates: () => ({
        dessous: "À ce trafic, le mois ne fait pas encore sa part du reste du budget.",
        dessus: "Plus bas, le mois fait encore sa part : cherchez le plus petit nombre d'entrées.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, n) => {
        const r = janvierFaceALObjectif(c);
        const ca = auCentime(n * r.x.caParEntree + r.x.commandes);
        return [
          { libelle: "Chiffre d'affaires du mois", montant: ca },
          { libelle: "Part du reste du budget", montant: r.parMois },
          { libelle: "Chiffre d'affaires de janvier N − 1", montant: r.x.n1.chiffreDAffaires },
          { libelle: "Avance sur la part du budget", montant: auCentime(ca - r.parMois), fort: true },
        ];
      },
      droites: (c) => {
        const r = janvierFaceALObjectif(c);
        return { produit: (n) => n * r.x.caParEntree + r.x.commandes, cout: () => r.parMois, libelles: ["Chiffre d'affaires des entrées", "Part du reste du budget"] };
      },
      explication: (c) => {
        const r = janvierFaceALObjectif(c);
        return [
          `Il faudrait ${qte(r.entreesDuRattrapage)} entrées chaque mois, ${pct(r.hausseDuTraficSurN1)} de plus que janvier N − 1 (${qte(r.x.n1.trafic)}). Ni le trafic seul, ni la transformation seule ne rattrapent sans effort : il faut faire revenir les clients, et garder ce que l'équipe a gagné.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction régionale",
      notions: ["dashboard"],
      question: () => "Quelle ligne envoyez-vous à la direction régionale ?",
      options: (c) => {
        const r = janvierFaceALObjectif(c);
        const x = r.x;
        const trafic = r.verdict === "le-trafic-doit-revenir";
        return [
          {
            texte: `Manqué à ${pct(x.realisation)} par le trafic : il faut faire revenir des clients`,
            juste: trafic,
            retour: trafic
              ? `Oui : ${eur(x.ca)} pour ${eur(x.objectif)}, et le trafic coûte ${eur(-x.effetDuTrafic)} quand la transformation et le panier progressent. Rattraper par la seule transformation demanderait ${pct(r.transformationDuRattrapage)}, jamais atteint : le plan du responsable ne tient pas sans les clients.`
              : "Non : la transformation demandée reste à portée de l'équipe.",
          },
          {
            texte: `Manqué à ${pct(x.realisation)} : ${pct(r.transformationDuRattrapage)} de transformation rattraperont le trimestre`,
            juste: !trafic,
            retour: trafic
              ? `Non : c'est valider le plan sans le comparer à l'historique. ${pct(r.transformationDuRattrapage)} deux mois de suite, quand la boutique fait ${pct(x.transformationN)} ; et le voyant rouge est le trafic.`
              : "Oui : cette transformation est à la portée de l'équipe.",
          },
          {
            texte: `Presque tenu : ${pct(r.surN1)} de réalisation, rapporté à janvier N − 1`,
            juste: false,
            retour: `Non : ${pct(r.surN1)} compare janvier N à janvier N − 1, pas à l'objectif. Le taux de réalisation rapporte le réalisé à l'objectif : ${eur(x.ca)} ÷ ${eur(x.objectif)} = ${pct(x.realisation)}.`,
          },
          {
            texte: `Manqué à ${pct(x.realisation)} : l'équipe vend moins bien, il faut la former`,
            juste: false,
            retour: `Non : la transformation monte de ${pct(x.transformationN1)} à ${pct(x.transformationN)}, et l'effet de la transformation est favorable, ${eur(x.effetDeLaTransformation)}. L'équipe vend mieux ; ce sont les entrées qui manquent.`,
          },
        ];
      },
    },
  ],
};
