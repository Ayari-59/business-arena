import type { CompanyRoundResult } from "../../../../engine/types";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../../scenarios/registry";
import { anneeJouee, type Cas } from "../../cas";
import {
  LE_TAUX_DE_REMPLISSAGE,
  demandeDuTrimestre,
  eur,
  jusquALaDefaillance,
  pct,
  prixEtCout,
  qte,
  retranche,
} from "../../chapitres/le-taux-de-remplissage";
import { rejouerAvec } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TAUX DE REMPLISSAGE DES VÉHICULES » : LE LOT DE LA BOURSE DE FRET
 * (2de pro GATL, le transport et la logistique, palier 1).
 *
 * Le chapitre a montré qu'une place vide est perdue, et qu'une palette de plus rapporte toute sa
 * marge. Ici, une offre arrive : la bourse de fret propose un lot, moins cher que ce que paient les
 * clients. Le responsable d'exploitation a prévu de charger toute la demande de ses clients ; son
 * adjoint veut refuser le lot, parce qu'il paie moins qu'eux. L'élève compte les places que les
 * clients laissent, ce que le lot y rapporte, ce qu'il fait aux charges fixes d'une palette, et lit
 * dans l'arène ce que le lot laisse sur l'année.
 *
 * Tout vient de l'arène : la commande exceptionnelle du trimestre (`orderOffer`, tirée à la graine du
 * cours dans `orderOffers`), la capacité offerte, la demande des clientèles, le prix et le coût
 * variable d'une palette. Le moteur sert les clientèles d'abord et le lot sur ce qui reste
 * (`offerDelivered`). L'année est rejouée deux fois au trimestre du lot : les « Palettes à charger »
 * à la demande des clients (l'hypothèse du cas : le responsable charge exactement ce que ses clients
 * ont commandé), puis à la demande des clients plus le lot, sans dépasser la flotte, le lot accepté.
 * L'année s'additionne jusqu'à une éventuelle défaillance.
 */

/**
 * Le trimestre du lot : celui où l'arène du cours propose les lots de la bourse de fret, et où la
 * flotte garde des places après ses clients (la garde le vérifie).
 */
export const TRIMESTRE_DU_LOT = 2;

export type ReponseAuLot = "accepter" | "refuser" | "pas-de-place";

const T = TRIMESTRE_DU_LOT;

const resultatDeLAnnee = (a: readonly CompanyRoundResult[]) => Math.round(jusquALaDefaillance(a).reduce((t, r) => t + r.incomeStatement.operatingIncome, 0));

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Le trimestre du lot, les places qu'il trouve, ce qu'il rapporte, et l'année rejouée avec et sans lui. */
export function lotDeLaBourse(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const def = scenarioByCode(c.code);
  const s = def.scenario;
  const { partie } = anneeJouee(c.code);
  const r = partie.rounds[T - 1]!.results["joueur"]!;
  const offre = r.orderOffer;
  const catalogue = s.orderOffers?.find((o) => o.code === offre?.code);
  if (!offre || !catalogue) throw new Error(`Pas de commande exceptionnelle au trimestre ${T} chez ${c.code}`);
  const capacite = Math.round(r.production.machineCapacity);
  const demande = Math.round(demandeDuTrimestre(r));
  const placesLibres = Math.max(0, capacite - demande);
  const palettesDuLot = Math.min(catalogue.units, placesLibres);
  const { prix, coutVariable } = prixEtCout(r);
  const prixDuLot = catalogue.price;
  const margeParPaletteDuLot = auCentime(prixDuLot - coutVariable);
  const margeDuLot = auCentime(palettesDuLot * margeParPaletteDuLot);
  const chargesFixes = Math.round(r.incomeStatement.fixedCosts + r.incomeStatement.depreciation);
  const fixeSansLot = auCentime(chargesFixes / demande);
  const fixeAvecLot = auCentime(chargesFixes / (demande + palettesDuLot));

  // L'année rejouée : les clients seuls, puis les clients et le lot.
  const demandeExacte = demandeDuTrimestre(r);
  const sans = rejouerAvec(c.code, "le-lot-de-la-bourse-de-fret:les-clients-seuls", (tour, d) =>
    tour === T ? { ...d, productionPlan: demandeExacte, acceptOrder: false } : undefined,
  );
  const planAvec = Math.min(r.production.machineCapacity, demandeExacte + catalogue.units);
  const avec = rejouerAvec(c.code, "le-lot-de-la-bourse-de-fret:les-clients-et-le-lot", (tour, d) =>
    tour === T ? { ...d, productionPlan: planAvec, acceptOrder: true } : undefined,
  );
  const venduesEnsuite = (a: readonly CompanyRoundResult[]) =>
    Math.round(jusquALaDefaillance(a).slice(T).reduce((t, x) => t + Object.values(x.market.bySegment).reduce((u, v) => u + v.sold, 0), 0));
  const lire = (a: readonly CompanyRoundResult[]) => ({
    plan: Math.round(a[T - 1]!.production.produced),
    part: Math.round(a[T - 1]!.production.utilizationRate * 1000) / 10,
    lotLivre: Math.round(a[T - 1]!.orderOffer?.delivered ?? 0),
    resultatT: Math.round(a[T - 1]!.incomeStatement.operatingIncome),
    demandeSuivante: a[T] ? Math.round(demandeDuTrimestre(a[T]!)) : null,
    /** Les palettes vendues aux clients après le trimestre du lot. */
    venduesEnsuite: venduesEnsuite(a),
    resultatAnnee: resultatDeLAnnee(a),
  });
  const clientsSeuls = lire(sans);
  const clientsEtLot = lire(avec);
  const gainT = clientsEtLot.resultatT - clientsSeuls.resultatT;
  const gainAnnee = clientsEtLot.resultatAnnee - clientsSeuls.resultatAnnee;
  const reponse: ReponseAuLot = placesLibres <= 0 ? "pas-de-place" : gainAnnee > 0 ? "accepter" : "refuser";
  return {
    vocabulaire: def.vocabulary,
    titreDuLot: offre.title,
    unitesDuLot: catalogue.units,
    prixDuLot,
    capacite,
    demande,
    placesLibres,
    palettesDuLot,
    resteAQuai: catalogue.units - palettesDuLot,
    prix,
    coutVariable,
    ecartDePrix: auCentime(prix - prixDuLot),
    margeParPaletteDuLot,
    margeDuLot,
    chargesFixes,
    fixeSansLot,
    fixeAvecLot,
    clientsSeuls,
    clientsEtLot,
    gainT,
    gainAnnee,
    reponse,
  };
}

export const LE_LOT_DE_LA_BOURSE_DE_FRET: Situation = {
  code: "le-lot-de-la-bourse-de-fret",
  parcours: "logistique",
  palier: 1,
  blocs: [],
  reprend: [LE_TAUX_DE_REMPLISSAGE.code],
  commanditaire: "Le responsable d'exploitation",
  titre: "Le lot de la bourse de fret",
  accroche:
    "La bourse de fret propose un lot de palettes, moins bien payé que les clients. Compter les places que les clients laissent, ce que le lot y rapporte, et dire au responsable d'exploitation s'il faut le prendre.",
  objectifs: [
    "Compter les places vides qu'une flotte garde après ses clients",
    "Calculer la marge d'un lot payé moins cher",
    "Voir ce qu'un lot fait aux charges fixes d'une palette",
    "Lire dans l'arène ce que le lot laisse sur l'année, et répondre au responsable",
  ],
  libre: false,
  entreprises: LE_TAUX_DE_REMPLISSAGE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable d'exploitation",
      texte: (c) => {
        const k = lotDeLaBourse(c);
        return [
          `« Au trimestre ${T}, nos clients nous demandent ${qte(k.demande)} ${c.unites}, et je compte toutes les charger. La bourse de fret nous propose en plus un lot, « ${k.titreDuLot} » : ${qte(k.unitesDuLot)} ${c.unites} à ${eur(k.prixDuLot)}, payées comptant. Mon adjoint veut refuser : nos clients paient ${eur(k.prix)} la ${c.unite}. Dites-moi s'il faut prendre ce lot, et combien on peut en charger. »`,
          `Pas de cours cette fois : vous avez les chiffres du trimestre. L'arène a rejoué l'année deux fois : avec les seuls clients, puis avec les clients et le lot.`,
        ];
      },
      tableau: (c) => {
        const k = lotDeLaBourse(c);
        return {
          titre: `Le trimestre ${T} de ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Capacité de la flotte (${c.unites})`, valeurs: [qte(k.capacite)] },
            { libelle: `Demande des clients (${c.unites})`, valeurs: [qte(k.demande)] },
            { libelle: `Prix moyen payé par les clients, la ${c.unite}`, valeurs: [eur(k.prix)] },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} du lot proposées`, valeurs: [qte(k.unitesDuLot)] },
            { libelle: `Prix du lot, la ${c.unite}`, valeurs: [eur(k.prixDuLot)] },
            { libelle: `Coût variable d'une ${c.unite} (gazole, péages, entretien)`, valeurs: [eur(k.coutVariable)] },
            { libelle: "Charges fixes du trimestre", valeurs: [eur(k.chargesFixes)] },
          ],
        };
      },
      repere: () => "À rendre : les palettes du lot que la flotte peut charger, ce qu'elles rapportent, et votre réponse.",
    },
    {
      id: "places",
      type: "montants",
      titre: "Les places pour le lot",
      notions: ["capacity"],
      question: (c) => `Les clients passent d'abord. Calculez les places qui restent libres dans la flotte une fois leurs ${c.unites} chargées, puis les ${c.unites} du lot qui peuvent partir.`,
      champs: (c) => {
        const k = lotDeLaBourse(c);
        return [
          { libelle: `Places libres après les clients (${c.unites})`, attendu: k.placesLibres, calcul: `${qte(k.capacite)} − ${qte(k.demande)} = ${qte(k.placesLibres)}`, tolerance: 1 },
          {
            libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} du lot chargées`,
            attendu: k.palettesDuLot,
            calcul: `le plus petit des deux nombres : ${qte(k.unitesDuLot)} ${c.unites} proposées, ${qte(k.placesLibres)} places libres, soit ${qte(k.palettesDuLot)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = lotDeLaBourse(c);
        return [
          k.resteAQuai > 0
            ? `Sur les ${qte(k.unitesDuLot)} ${c.unites} du lot, ${qte(k.palettesDuLot)} trouvent une place ; les ${qte(k.resteAQuai)} autres ne partiraient pas.`
            : `Tout le lot trouve sa place : ${qte(k.palettesDuLot)} ${c.unites}.`,
        ];
      },
    },
    {
      id: "marge",
      type: "montants",
      titre: "Ce que rapporte le lot",
      notions: ["contribution_margin", "variable_costs"],
      question: (c) => {
        const k = lotDeLaBourse(c);
        return `Une ${c.unite} du lot rapporte ${eur(k.prixDuLot)} et coûte son gazole, ses péages et son entretien, ${eur(k.coutVariable)}. Calculez la marge d'une ${c.unite} du lot, puis la marge des ${qte(k.palettesDuLot)} ${c.unites} chargées.`;
      },
      champs: (c) => {
        const k = lotDeLaBourse(c);
        return [
          { libelle: `Marge par ${c.unite} du lot`, attendu: k.margeParPaletteDuLot, calcul: `${eur(k.prixDuLot)} − ${eur(k.coutVariable)} = ${eur(k.margeParPaletteDuLot)}` },
          { libelle: "Marge du lot", attendu: k.margeDuLot, calcul: `${qte(k.palettesDuLot)} × ${retranche(k.margeParPaletteDuLot)} = ${eur(k.margeDuLot)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = lotDeLaBourse(c);
        return [
          k.margeParPaletteDuLot > 0
            ? `Le lot paie ${eur(k.ecartDePrix)} de moins par ${c.unite} que les clients, mais il paie plus que ce que coûte une ${c.unite} de plus : chaque place remplie rapporte ${eur(k.margeParPaletteDuLot)}.`
            : `Le lot ne paie même pas ce que coûte une ${c.unite} de plus : chaque ${c.unite} chargée ferait perdre ${eur(-k.margeParPaletteDuLot)}.`,
        ];
      },
    },
    {
      id: "charges-fixes",
      type: "montants",
      titre: "Les charges fixes d'une palette",
      notions: ["fixed_costs"],
      question: (c) =>
        `Les charges fixes du trimestre ne changent pas avec le lot. Calculez ce qu'elles pèsent sur chaque ${c.unite} transportée sans le lot (les seuls clients), puis avec le lot.`,
      champs: (c) => {
        const k = lotDeLaBourse(c);
        return [
          { libelle: `Charges fixes par ${c.unite}, sans le lot`, attendu: k.fixeSansLot, calcul: `${eur(k.chargesFixes)} ÷ ${qte(k.demande)} = ${eur(k.fixeSansLot)}` },
          {
            libelle: `Charges fixes par ${c.unite}, avec le lot`,
            attendu: k.fixeAvecLot,
            calcul: `${eur(k.chargesFixes)} ÷ (${qte(k.demande)} + ${qte(k.palettesDuLot)}) = ${eur(k.fixeAvecLot)}`,
          },
        ];
      },
      explication: (c) => {
        const k = lotDeLaBourse(c);
        return [`Avec le lot, chaque ${c.unite} porte ${eur(auCentime(k.fixeSansLot - k.fixeAvecLot))} de charges fixes de moins : les mêmes charges se partagent sur plus de ${c.unites}.`];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'année rejouée, avec et sans le lot",
      notions: ["contribution_margin", "capacity"],
      tableau: (c) => {
        const k = lotDeLaBourse(c);
        const a = k.clientsSeuls;
        const b = k.clientsEtLot;
        return {
          titre: `L'année de ${c.entreprise}, rejouée au trimestre ${T}`,
          colonnes: ["Les clients seuls", "Les clients et le lot"],
          lignes: [
            { libelle: `« ${k.vocabulaire.productionPlanLabel} » au trimestre ${T}`, valeurs: [qte(a.plan), qte(b.plan)] },
            { libelle: `Part de la capacité chargée au trimestre ${T}`, valeurs: [pct(a.part), pct(b.part)] },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} du lot livrées`, valeurs: [qte(a.lotLivre), qte(b.lotLivre)] },
            { libelle: `Résultat d'exploitation du trimestre ${T}`, valeurs: [eur(a.resultatT), eur(b.resultatT)] },
            ...(a.demandeSuivante !== null && b.demandeSuivante !== null
              ? [{ libelle: `Demande des clients au trimestre ${T + 1}`, valeurs: [qte(a.demandeSuivante), qte(b.demandeSuivante)] }]
              : []),
            { libelle: "Résultat d'exploitation de l'année", valeurs: [eur(a.resultatAnnee), eur(b.resultatAnnee)] },
          ],
        };
      },
      question: () => `D'après le tableau, calculez ce que le lot change au résultat d'exploitation du trimestre ${T}, puis à celui de l'année.`,
      champs: (c) => {
        const k = lotDeLaBourse(c);
        return [
          {
            libelle: `Écart de résultat au trimestre ${T}`,
            attendu: k.gainT,
            calcul: `${eur(k.clientsEtLot.resultatT)} − ${retranche(k.clientsSeuls.resultatT)} = ${eur(k.gainT)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat sur l'année",
            attendu: k.gainAnnee,
            calcul: `${eur(k.clientsEtLot.resultatAnnee)} − ${retranche(k.clientsSeuls.resultatAnnee)} = ${eur(k.gainAnnee)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = lotDeLaBourse(c);
        const a = k.clientsSeuls;
        const b = k.clientsEtLot;
        const baisse = a.demandeSuivante !== null && b.demandeSuivante !== null && b.demandeSuivante < a.demandeSuivante;
        const moinsDeDemande = baisse
          ? `chargée à ${pct(b.part)} de sa capacité, la flotte a roulé sans marge, la qualité de service a baissé, et les clients ont demandé ${qte(a.demandeSuivante! - b.demandeSuivante!)} ${c.unites} de moins au trimestre ${T + 1}`
          : "";
        return [
          `Au trimestre ${T}, le lot rapporte ${eur(k.gainT)}, la marge calculée à l'arrondi près.`,
          baisse && k.gainAnnee < k.gainT
            ? `Sur l'année, il n'en reste que ${eur(k.gainAnnee)} : ${moinsDeDemande}.`
            : baisse && a.venduesEnsuite === b.venduesEnsuite
              ? `Sur l'année, l'écart est de ${eur(k.gainAnnee)} : ${moinsDeDemande}. Mais ${c.entreprise} n'en a pas vendu une ${c.unite} de moins ensuite : elle chargeait déjà moins que ses clients ne demandaient, et cette demande-là ne serait pas partie.`
              : `Sur l'année, l'écart est de ${eur(k.gainAnnee)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      notions: ["contribution_margin"],
      question: () => "Quelle réponse envoyez-vous au responsable d'exploitation ?",
      options: (c) => {
        const k = lotDeLaBourse(c);
        const chiffres = `${qte(k.palettesDuLot)} ${c.unites} du lot trouvent une place, à ${eur(k.margeParPaletteDuLot)} de marge chacune : ${eur(k.gainT)} au trimestre ${T}, ${eur(k.gainAnnee)} sur l'année.`;
        return [
          {
            texte: "Accepter le lot, pour remplir les places vides",
            juste: k.reponse === "accepter",
            retour:
              k.reponse === "accepter"
                ? `Oui. ${chiffres} Les charges fixes sont payées de toute façon : une place vide ne rapporte rien, une place remplie rapporte sa marge, même à un prix plus bas que celui des clients.`
                : k.reponse === "pas-de-place"
                  ? `Non : les clients remplissent déjà toute la flotte, et l'arène sert les clients d'abord. Le lot ne trouverait aucune place.`
                  : `Non. ${chiffres} Sur l'année, le lot coûte plus qu'il ne rapporte.`,
          },
          {
            texte: `Refuser : le lot paie ${eur(k.ecartDePrix)} de moins que nos clients`,
            juste: k.reponse === "refuser",
            retour:
              k.reponse === "refuser"
                ? `Oui. ${chiffres} Sur l'année, le lot coûte plus qu'il ne rapporte.`
                : `Non : comparer au prix des clients est un piège. Le lot ne prend la place d'aucun client, il remplit des places qui seraient restées vides. ${chiffres}`,
          },
          {
            texte: "Refuser : les clients remplissent déjà la flotte",
            juste: k.reponse === "pas-de-place",
            retour:
              k.reponse === "pas-de-place"
                ? "Oui : les clients remplissent toute la flotte, et l'arène les sert d'abord. Le lot ne trouverait aucune place."
                : `Non : il reste ${qte(k.placesLibres)} places une fois les ${qte(k.demande)} ${c.unites} des clients chargées. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
