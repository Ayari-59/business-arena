import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  DEPARTS_AVEC_LA_REMISE,
  ENTREES_PERDUES_PAR_DIXIEME,
  JOURS_POUR_REPARER_OU_REMPLACER,
  MOIS_DE_GARANTIE_LEGALE,
  NOTES_DE_SATISFACTION,
  RECLAMATIONS_DU_MOIS,
  RECLAMATION_DU_MERINOS,
  REMISE_ETUDIEE,
  eReputation,
  reclamation,
  remiseQuiTient,
  satisfaction,
  valeurDUneCliente,
} from "../monde/clientele-de-la-boutique";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "./taux-de-marque";

/**
 * CHAPITRE : FIDÉLISER LA CLIENTÈLE (BTS MCO, bloc 1, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : les clientes de la carte de MAILLE & CO (le bac pro les a
 * comptées : 340 clientes, un passage par mois, 5 % de départs, monde/vente-et-caisse.ts) et ce que la
 * boutique sait d'elles (monde/clientele-de-la-boutique.ts, `satisfaction`, `valeurDUneCliente`,
 * `remiseQuiTient`, `eReputation`, `reclamation`).
 *
 * L'objet : la satisfaction se mesure (note moyenne, NPS, réclamations), la fidélité aussi (taux de
 * départ, durée de vie), et la valeur d'une cliente fidèle se calcule : la marge d'un mois × sa durée de
 * vie. L'élève chiffre une remise de la carte face à la marge qu'elle retient et trouve, au curseur, le
 * taux au-delà duquel elle coûte ; il mesure l'effet d'une e-réputation qui baisse ; il traite une
 * réclamation sous la garantie légale de conformité, qu'il distingue de la garantie commerciale.
 *
 * Le piège central : une remise retient des clientes, mais elle se paie sur toutes, même celles qui
 * seraient restées. Elle ne vaut que si les départs baissent assez : à 4 %, jusqu'à 10 % de remise ; à
 * 4,5 %, pas au-delà de 5 %.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, la-satisfaction, les-reclamations (la formule dans la question) ;
 *   · l'expérience avant la formule : predire-la-valeur, puis la-valeur-d-une-cliente ; predire-la-remise
 *     puis la-remise-au-curseur (la valeur d'une cliente selon la remise, face à celle d'aujourd'hui) ;
 *   · autonome : la-remise-chiffree, les-indicateurs (un tri), l-e-reputation ;
 *   · le laboratoire : le-laboratoire-de-la-carte (la remise et les départs obtenus ; le graphique de la
 *     valeur selon la remise) ;
 *   · expert : les-garanties (un tri), le-cout-de-la-reclamation ; puis lancer-la-remise et la synthèse.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

export const POURQUOI_LA_FIDELISATION =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît les clientes de la carte mois par mois : la fidélisation se chiffre chez elle, quelle que soit votre entreprise.";

/** Le curseur de la remise : de 0 à 15 %. */
export const REMISES_DU_CURSEUR = { min: 0, max: 15 } as const;

/** Le laboratoire de la carte : la remise de 0 à 12 %, les départs obtenus de 3 % à 5 % par demi-point. Le défi : les départs ne tombent qu'à 4,5 %. */
export const REMISES_DU_LABORATOIRE = { min: 0, max: 12, pas: 1 } as const;
export const DEPARTS_DU_LABORATOIRE = { min: 3, max: 5, pas: 0.5 } as const;
export const DEPARTS_DU_DEFI = 4.5;
export const DEPART_DU_LABORATOIRE = { remise: 8, departs: 4 };

/** La fidélisation du chapitre : tout ce que le chapitre et son cas demandent. */
export function fidelisationDuChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = satisfaction(f);
  const base = valeurDUneCliente(f);
  const avecRemise = valeurDUneCliente(f, REMISE_ETUDIEE, DEPARTS_AVEC_LA_REMISE);
  return {
    f,
    s,
    base,
    avecRemise,
    fideliteSurUnAn: auDixieme(base.fidelite ** 12 * 100),
    gainParCliente: auCentime(avecRemise.valeur - base.valeur),
    remiseMax: remiseQuiTient(f, DEPARTS_AVEC_LA_REMISE),
    remiseMaxDuDefi: remiseQuiTient(f, DEPARTS_DU_DEFI / 100),
    e: eReputation(f),
    r: reclamation(f),
  };
}

/** La valeur d'une cliente à une remise (en %) et des départs (en %) donnés. */
export const valeurA = (c: Pick<Cas, "code">, remise: number, departs: number) => valeurDUneCliente(ficheDe(c), remise / 100, departs / 100);

/** Les notes de l'enquête de satisfaction, de 3 à 10. */
export function tableauDesNotes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = fidelisationDuChapitre(c);
  return {
    titre: `L'enquête de satisfaction de ${x.f.entreprise} : ${qte(x.s.reponses)} notes sur 10`,
    colonnes: ["Clients"],
    lignes: NOTES_DE_SATISFACTION.map((n, note) => ({ note, n }))
      .filter((l) => l.n > 0)
      .map((l) => ({ libelle: `Note ${qte(l.note)}`, valeurs: [qte(l.n)] })),
  };
}

/** Les clientes de la carte, leur passage, leur marge. */
function tableauDeLaCarte(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = fidelisationDuChapitre(c);
  return {
    titre: `Les clientes de la carte, en ${x.f.moisDeReference}`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Clientes de la carte (un passage par mois)", valeurs: [qte(x.base.clientes)] },
      { libelle: "Panier hors taxes d'un passage", valeurs: [eur(x.base.panierHt)] },
      { libelle: "Marge d'un passage", valeurs: [eur(x.base.margeDUnPassage)] },
      { libelle: "Clientes qui ne reviennent pas, chaque mois", valeurs: [pct(x.base.departs * 100)] },
    ],
  };
}

function tableauDeLaSynthese(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = fidelisationDuChapitre(c);
  const ligne = (libelle: string, remise: number, departs: number) => {
    const v = valeurA(c, remise, departs);
    return { libelle, valeurs: [pct(remise, 0), pct(departs), `${qte(v.dureeDeVie)} mois`, eur(v.valeur)] };
  };
  return {
    titre: "Ce que vaut une cliente fidèle, avec ou sans remise",
    colonnes: ["Remise", "Départs par mois", "Durée de vie", "Valeur"],
    lignes: [
      ligne("Sans remise", 0, x.base.departs * 100),
      ligne("Remise étudiée", REMISE_ETUDIEE * 100, DEPARTS_AVEC_LA_REMISE * 100),
      ligne("Remise la plus forte qui tient", x.remiseMax, DEPARTS_AVEC_LA_REMISE * 100),
      ligne(`Si les départs ne tombent qu'à ${pct(DEPARTS_DU_DEFI)}`, x.remiseMaxDuDefi, DEPARTS_DU_DEFI),
    ],
  };
}

export const FIDELISER_LA_CLIENTELE: Chapitre = {
  code: "fideliser-la-clientele",
  parcours: "mco",
  palier: 3,
  blocs: ["BTS MCO Bloc 1 · Développer la relation client et assurer la vente conseil"],
  titre: "Fidéliser la clientèle",
  accroche:
    "Une cliente fidèle vaut sa marge d'un mois multipliée par sa durée de vie. Satisfaction et NPS, réclamations, valeur client, remise de la carte, e-réputation et garanties : ce que coûte et ce que rapporte une cliente qui reste.",
  objectifs: [
    "Mesurer la satisfaction par la note moyenne et le NPS, et le taux de réclamations",
    "Calculer le taux de fidélité, la durée de vie et la valeur d'une cliente fidèle",
    "Chiffrer une remise de fidélité face à la marge qu'elle retient, et le taux au-delà duquel elle coûte",
    "Chiffrer l'effet d'une e-réputation qui baisse sur les entrées et la marge",
    "Traiter une réclamation sous la garantie légale de conformité, et la distinguer de la garantie commerciale",
  ],
  libre: false,
  prerequis: ["la-vente-conseil"],
  ensuite: ["valeur-d-un-client"],
  entreprises: { codes: ENTREPRISES_DU_POINT_DE_VENTE, pourquoi: POURQUOI_LA_FIDELISATION },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Satisfaite, fidèle, fidélisée",
      notions: ["churn_rate", "customer_lifetime_value"],
      tableau: tableauDesNotes,
      texte: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. Une cliente satisfaite a trouvé ce qu'elle attendait ; une cliente fidèle revient ; la fidélisation est ce que la boutique fait pour qu'elle revienne. Une cliente satisfaite peut partir, une cliente fidèle peut être déçue.`,
          "Le marketing après-vente suit la cliente après l'achat : la carte de fidélité, les retouches, le service après-vente, les courriels, le traitement des réclamations. Son enjeu : garder coûte moins cher que conquérir.",
          `Ce que la simulation suppose. ${qte(x.s.reponses)} clients ont noté la boutique de 0 à 10, par un lien au bas du ticket. Les clientes de la carte sont celles du bac pro : un passage par mois, ${pct(x.base.departs * 100, 0)} de départs chaque mois.`,
        ];
      },
      repere: () => "NPS = part des promoteurs (notes 9 et 10) − part des détracteurs (notes 0 à 6), en points.",
    },
    {
      id: "la-satisfaction",
      objectifs: [0],
      type: "montants",
      titre: "La note moyenne et le NPS",
      notions: ["churn_rate"],
      tableau: tableauDesNotes,
      question: () => "Calculez la note moyenne (au dixième), la part des promoteurs (notes 9 et 10) et celle des détracteurs (notes 0 à 6) en %, puis le NPS : promoteurs − détracteurs, en points.",
      champs: (c) => {
        const x = fidelisationDuChapitre(c);
        const points = NOTES_DE_SATISFACTION.map((n, note) => [n, note] as const).filter(([n]) => n > 0);
        return [
          { libelle: "Note moyenne", attendu: auDixieme(x.s.noteMoyenne), tolerance: 0.1, calcul: `(${points.map(([n, note]) => `${qte(n)} × ${qte(note)}`).join(" + ")}) ÷ ${qte(x.s.reponses)} = ${qte(auDixieme(x.s.noteMoyenne))}` },
          { libelle: "Promoteurs (%)", attendu: auDixieme(x.s.partDesPromoteurs * 100), tolerance: 0.1, calcul: `${qte(x.s.promoteurs)} ÷ ${qte(x.s.reponses)} × 100 = ${pct(auDixieme(x.s.partDesPromoteurs * 100))}` },
          { libelle: "Détracteurs (%)", attendu: auDixieme(x.s.partDesDetracteurs * 100), tolerance: 0.1, calcul: `${qte(x.s.detracteurs)} ÷ ${qte(x.s.reponses)} × 100 = ${pct(auDixieme(x.s.partDesDetracteurs * 100))}` },
          { libelle: "NPS (points)", attendu: x.s.nps, calcul: `${pct(auDixieme(x.s.partDesPromoteurs * 100))} − ${pct(auDixieme(x.s.partDesDetracteurs * 100))} = ${qte(x.s.nps)} points` },
        ];
      },
      explication: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          `La note moyenne, ${qte(auDixieme(x.s.noteMoyenne))}, paraît bonne ; le NPS, ${qte(x.s.nps)} points, est plus sévère : il ne compte que ceux qui recommanderaient la boutique, moins ceux qui la déconseilleraient. Un client à 7 ou 8 est passif : il ne fait pas venir d'autres clients.`,
        ];
      },
    },
    {
      id: "les-reclamations",
      objectifs: [0],
      type: "montants",
      titre: "Les réclamations",
      notions: ["churn_rate"],
      question: (c) => {
        const x = fidelisationDuChapitre(c);
        return `En janvier, la boutique a reçu ${qte(x.s.reclamations)} réclamations : ${RECLAMATIONS_DU_MOIS.map((r) => `${qte(r.nombre)} pour ${r.libelle.charAt(0).toLowerCase()}${r.libelle.slice(1)}`).join(", ")}. Calculez le taux de réclamations sur les ${qte(x.s.passages)} passages en caisse, puis la part des défauts dans les réclamations, en %, au dixième.`;
      },
      champs: (c) => {
        const x = fidelisationDuChapitre(c);
        const defauts = RECLAMATIONS_DU_MOIS.find((r) => r.code === "defaut")!.nombre;
        return [
          { libelle: "Taux de réclamations (%)", attendu: auDixieme(x.s.tauxDeReclamations * 100), tolerance: 0.1, calcul: `${qte(x.s.reclamations)} ÷ ${qte(x.s.passages)} × 100 = ${pct(auDixieme(x.s.tauxDeReclamations * 100))}` },
          { libelle: "Part des défauts (%)", attendu: auDixieme(x.s.partDesDefauts * 100), tolerance: 0.1, calcul: `${qte(defauts)} ÷ ${qte(x.s.reclamations)} × 100 = ${pct(auDixieme(x.s.partDesDefauts * 100))}` },
        ];
      },
      explication: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          `${pct(auDixieme(x.s.tauxDeReclamations * 100))} des passages finissent en réclamation, dont ${pct(auDixieme(x.s.partDesDefauts * 100))} pour un défaut. Une réclamation bien traitée retient la cliente : écouter sans interrompre, reformuler, proposer une solution, la tenir, puis rappeler. Chaque réclamation se note, pour repérer l'article ou le moment qui pose problème.`,
        ];
      },
    },
    {
      id: "predire-la-valeur",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur une cliente",
      notions: ["customer_lifetime_value", "churn_rate"],
      tableau: tableauDeLaCarte,
      question: (c) => {
        const x = fidelisationDuChapitre(c);
        return `Avant de calculer, pariez. Une cliente de la carte laisse ${eur(x.base.margeDUnPassage)} de marge par mois, et ${pct(x.base.departs * 100, 0)} des clientes partent chaque mois. Sur toute sa vie de cliente, elle vaut environ…`;
      },
      options: (c) => {
        const x = fidelisationDuChapitre(c);
        const voir = "L'étape suivante le calcule : la durée de vie moyenne se déduit du taux de départ.";
        return [
          { texte: `Environ ${eur(Math.round(x.base.valeur / 100) * 100)}`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Environ ${eur(Math.round((x.base.margeDUnPassage * 12) / 100) * 100)}`, juste: false, retour: `Pari à vérifier : c'est à peu près une année de marge. ${voir}` },
          { texte: `Plus de ${eur(Math.round((x.base.valeur * 4) / 1000) * 1000)}`, juste: false, retour: `Pari à vérifier : ce serait plus de ${qte(Math.floor((Math.round((x.base.valeur * 4) / 1000) * 1000) / x.base.margeDUnPassage))} mois de fidélité. ${voir}` },
        ];
      },
    },
    {
      id: "la-valeur-d-une-cliente",
      objectifs: [1],
      type: "montants",
      titre: "Ce que vaut une cliente fidèle",
      notions: ["customer_lifetime_value", "churn_rate"],
      tableau: tableauDeLaCarte,
      question: () =>
        "Calculez le taux de fidélité mensuel (1 − départs, en %), la durée de vie moyenne d'une cliente (1 ÷ départs, en mois) et sa valeur (marge d'un mois × durée de vie). Puis calculez la part des clientes encore là dans un an : le taux de fidélité à la puissance 12, en %, au dixième.",
      champs: (c) => {
        const x = fidelisationDuChapitre(c);
        const b = x.base;
        return [
          { libelle: "Taux de fidélité mensuel (%)", attendu: auDixieme(b.fidelite * 100), calcul: `100 % − ${pct(b.departs * 100)} = ${pct(b.fidelite * 100)}` },
          { libelle: "Durée de vie moyenne (mois)", attendu: b.dureeDeVie, calcul: `1 ÷ ${qte(b.departs)} = ${qte(b.dureeDeVie)} mois` },
          { libelle: "Valeur d'une cliente fidèle", attendu: b.valeur, calcul: `${eur(b.margeDUnPassage)} × ${qte(b.dureeDeVie)} = ${eur(b.valeur)}` },
          { libelle: "Clientes encore là dans un an (%)", attendu: x.fideliteSurUnAn, tolerance: 0.1, calcul: `${qte(b.fidelite)}¹² × 100 = ${pct(x.fideliteSurUnAn)}` },
        ];
      },
      explication: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          `Une cliente reste en moyenne ${qte(x.base.dureeDeVie)} mois : elle vaut ${eur(x.base.valeur)} de marge, pas ${eur(x.base.margeDUnPassage)}. Mais au bout d'un an, il ne reste que ${pct(x.fideliteSurUnAn)} des clientes de janvier : un taux de fidélité de ${pct(x.base.fidelite * 100, 0)} par mois s'effrite vite.`,
          "C'est le capital client : la valeur de toutes les clientes qui reviendront. Il se protège comme un stock, et se construit avec l'image et la notoriété de la boutique.",
        ];
      },
    },
    {
      id: "predire-la-remise",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la remise",
      notions: ["customer_lifetime_value", "churn_rate"],
      question: () =>
        `Avant de calculer, pariez. Le prestataire du programme de fidélité promet qu'une remise sur chaque achat ferait tomber les départs de 5 % à ${pct(DEPARTS_AVEC_LA_REMISE * 100, 0)} par mois. Jusqu'à quelle remise la carte reste-t-elle gagnante ?`,
      options: (c) => {
        const x = fidelisationDuChapitre(c);
        const voir = "Le curseur suivant fait varier la remise : la valeur d'une cliente face à celle d'aujourd'hui.";
        return [
          { texte: `Environ ${pct(x.remiseMax, 0)}`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Environ 1 %", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Toute remise : garder une cliente rapporte toujours", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-remise-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "La remise qui tient",
      notions: ["customer_lifetime_value", "churn_rate"],
      question: (c) => {
        const x = fidelisationDuChapitre(c);
        return `Faites varier la remise de la carte, de ${qte(REMISES_DU_CURSEUR.min)} à ${qte(REMISES_DU_CURSEUR.max)} %, avec ${pct(DEPARTS_AVEC_LA_REMISE * 100, 0)} de départs par mois. Une droite donne la valeur d'une cliente avec la remise, l'autre sa valeur d'aujourd'hui (${eur(x.base.valeur)}). Placez le curseur sur la plus forte remise où la carte vaut au moins autant, puis validez.`;
      },
      grandeur: () => ({ libelle: "Remise de la carte", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: fidelisationDuChapitre(c).remiseMax, min: REMISES_DU_CURSEUR.min, max: REMISES_DU_CURSEUR.max }),
      zones: ["La remise rapporte", "La remise coûte"],
      rates: () => ({
        dessous: "À cette remise, la carte rapporte encore : elle peut monter.",
        dessus: "À cette remise, une cliente vaut moins qu'aujourd'hui : baissez la remise.",
      }),
      montrer: "Montrer la remise qui tient",
      lecture: (c, r) => {
        const x = fidelisationDuChapitre(c);
        const v = valeurA(c, r, DEPARTS_AVEC_LA_REMISE * 100);
        return [
          { libelle: "Remise sur un passage", montant: v.remiseDUnPassage },
          { libelle: "Marge d'un passage après remise", montant: v.margeDUnPassage },
          { libelle: "Valeur d'une cliente avec la remise", montant: v.valeur },
          { libelle: "Valeur d'une cliente aujourd'hui", montant: x.base.valeur },
          { libelle: "Gain par cliente", montant: auCentime(v.valeur - x.base.valeur), fort: true },
        ];
      },
      droites: (c) => {
        const x = fidelisationDuChapitre(c);
        return {
          produit: (r) => valeurA(c, r, DEPARTS_AVEC_LA_REMISE * 100).valeur,
          cout: () => x.base.valeur,
          libelles: ["Valeur avec la remise", "Valeur d'aujourd'hui"],
        };
      },
      explication: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          `Jusqu'à ${pct(x.remiseMax, 0)}, la remise rapporte : la marge perdue sur chaque passage est plus que rattrapée par les mois en plus. Au-delà, elle coûte. Le calcul exact : remise maximale = marge d'un passage × (1 − départs avec la carte ÷ départs sans) ÷ panier d'un passage.`,
        ];
      },
    },
    {
      id: "la-remise-chiffree",
      objectifs: [2],
      type: "montants",
      titre: "Une remise de 5 %, chiffrée",
      notions: ["customer_lifetime_value", "churn_rate"],
      tableau: tableauDeLaCarte,
      question: () =>
        `Sans formule cette fois. La direction étudie ${pct(REMISE_ETUDIEE * 100, 0)} de remise, avec ${pct(DEPARTS_AVEC_LA_REMISE * 100, 0)} de départs. Calculez la remise sur un passage, la marge d'un passage après remise, la valeur d'une cliente, le gain par cliente face à aujourd'hui, puis ce que la remise coûte chaque mois sur toutes les clientes de la carte.`,
      champs: (c) => {
        const x = fidelisationDuChapitre(c);
        const a = x.avecRemise;
        return [
          { libelle: "Remise sur un passage", attendu: a.remiseDUnPassage, calcul: `${eur(a.panierHt)} × ${pct(REMISE_ETUDIEE * 100, 0)} = ${eur(a.remiseDUnPassage)}` },
          { libelle: "Marge d'un passage après remise", attendu: a.margeDUnPassage, calcul: `${eur(x.base.margeDUnPassage)} − ${eur(a.remiseDUnPassage)} = ${eur(a.margeDUnPassage)}` },
          { libelle: "Valeur d'une cliente avec la remise", attendu: a.valeur, calcul: `${eur(a.margeDUnPassage)} ÷ ${qte(a.departs)} = ${eur(a.valeur)}` },
          { libelle: "Gain par cliente", attendu: x.gainParCliente, calcul: `${eur(a.valeur)} − ${eur(x.base.valeur)} = ${eur(x.gainParCliente)}` },
          { libelle: "Remise du mois sur les clientes de la carte", attendu: a.remiseDuMois, calcul: `${pct(REMISE_ETUDIEE * 100, 0)} × ${eur(a.chiffreDuMois)}, le chiffre hors taxes des fidèles = ${eur(a.remiseDuMois)}` },
        ];
      },
      explication: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          `La remise coûte ${eur(x.avecRemise.remiseDuMois)} chaque mois, versés à toutes les clientes, même celles qui seraient restées. Elle rapporte parce que chaque cliente reste ${qte(x.avecRemise.dureeDeVie)} mois au lieu de ${qte(x.base.dureeDeVie)} : ${eur(x.gainParCliente)} de valeur en plus par cliente.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-carte",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de la carte",
      notions: ["customer_lifetime_value", "churn_rate"],
      question: () =>
        "La promesse du prestataire n'est qu'une promesse. Faites varier la remise de la carte et les départs qu'elle obtient vraiment. Le tableau suit la marge d'un passage, la durée de vie et la valeur d'une cliente ; le graphique trace la valeur selon la remise, face à celle d'aujourd'hui. Puis relevez le défi.",
      leviers: () => [
        { code: "remise", libelle: "Remise de la carte", unite: "%", min: REMISES_DU_LABORATOIRE.min, max: REMISES_DU_LABORATOIRE.max, pas: REMISES_DU_LABORATOIRE.pas, depart: DEPART_DU_LABORATOIRE.remise },
        { code: "departs", libelle: "Départs par mois avec la carte", unite: "%", min: DEPARTS_DU_LABORATOIRE.min, max: DEPARTS_DU_LABORATOIRE.max, pas: DEPARTS_DU_LABORATOIRE.pas, depart: DEPART_DU_LABORATOIRE.departs },
      ],
      lecture: (c, p) => {
        const x = fidelisationDuChapitre(c);
        const v = valeurA(c, p.remise!, p.departs!);
        const d = valeurA(c, DEPART_DU_LABORATOIRE.remise, DEPART_DU_LABORATOIRE.departs);
        return [
          { libelle: "Marge d'un passage après remise", montant: v.margeDUnPassage, reference: d.margeDUnPassage },
          { libelle: "Durée de vie d'une cliente", montant: auCentime(v.dureeDeVie), reference: auCentime(d.dureeDeVie), unite: "mois" },
          { libelle: "Valeur d'une cliente", montant: v.valeur, reference: d.valeur },
          { libelle: "Gain par cliente face à aujourd'hui", montant: auCentime(v.valeur - x.base.valeur), reference: auCentime(d.valeur - x.base.valeur), effet: true, fort: true },
          { libelle: "Remise du mois sur les fidèles", montant: v.remiseDuMois, reference: d.remiseDuMois },
        ];
      },
      graphique: (c) => {
        const x = fidelisationDuChapitre(c);
        return {
          levier: "remise",
          courbes: [
            { libelle: "Valeur d'une cliente avec la carte", valeur: (p) => valeurA(c, p.remise!, p.departs!).valeur },
            { libelle: "Valeur d'une cliente aujourd'hui", valeur: () => x.base.valeur },
          ],
        };
      },
      defi: (c) => {
        const x = fidelisationDuChapitre(c);
        const tient = (r: number, d: number) => valeurA(c, r, d).valeur >= x.base.valeur;
        return {
          consigne: `Si la carte ne fait tomber les départs qu'à ${pct(DEPARTS_DU_DEFI)}, trouvez la plus forte remise qui garde la valeur d'une cliente au moins à celle d'aujourd'hui.`,
          atteint: (p) => Math.abs(p.departs! - DEPARTS_DU_DEFI) < 1e-9 && tient(p.remise!, p.departs!) && !tient(p.remise! + 1, p.departs!),
          indice: (p) => {
            if (Math.abs(p.departs! - DEPARTS_DU_DEFI) > 1e-9) return `Le défi suppose ${pct(DEPARTS_DU_DEFI)} de départs : placez d'abord ce levier.`;
            if (!tient(p.remise!, p.departs!)) return `À ${pct(p.remise!, 0)} de remise, une cliente vaut ${eur(valeurA(c, p.remise!, p.departs!).valeur)}, moins qu'aujourd'hui (${eur(x.base.valeur)}) : baissez la remise.`;
            return `À ${pct(p.remise!, 0)}, la carte tient encore : essayez un point de plus.`;
          },
          solution: { remise: x.remiseMaxDuDefi, departs: DEPARTS_DU_DEFI },
        };
      },
      montrer: "Montrer la remise qui tient",
      explication: (c, p) => {
        const x = fidelisationDuChapitre(c);
        return [
          `À ${pct(p.departs!)} de départs, la carte ne tient que jusqu'à ${pct(p.remise!, 0)} de remise, contre ${pct(x.remiseMax, 0)} si la promesse du prestataire se vérifiait. La remise maximale dépend d'abord de l'effet réel sur les départs : avant de l'offrir, on la teste, et on mesure les départs.`,
        ];
      },
    },
    {
      id: "les-indicateurs",
      objectifs: [0, 3],
      type: "tri",
      titre: "Satisfaction, fidélité, capital client",
      notions: ["churn_rate", "brand_capital"],
      question: () =>
        "Le tableau de bord de la relation client range ses indicateurs. Rangez chacun : il mesure la satisfaction (ce que pensent les clients), la fidélité (s'ils reviennent) ou le capital client (l'image et la notoriété de la boutique).",
      categories: [
        { code: "satisfaction", libelle: "Satisfaction" },
        { code: "fidelite", libelle: "Fidélité" },
        { code: "capital", libelle: "Capital client" },
      ],
      elements: () => [
        { libelle: "La note moyenne de l'enquête", montant: 0, categorie: "satisfaction", pourquoi: "Elle mesure ce que les clients pensent de leur visite." },
        { libelle: "Le taux de réclamations", montant: 0, categorie: "satisfaction", pourquoi: "Une réclamation est une insatisfaction exprimée." },
        { libelle: "Le taux de départ des clientes de la carte", montant: 0, categorie: "fidelite", pourquoi: "Il dit qui ne revient pas : c'est la fidélité, en négatif." },
        { libelle: "La durée de vie moyenne d'une cliente", montant: 0, categorie: "fidelite", pourquoi: "Elle se déduit du taux de départ." },
        { libelle: "La note de la boutique sur les sites d'avis", montant: 0, categorie: "capital", pourquoi: "C'est l'e-réputation : ce que lisent ceux qui ne sont jamais venus." },
        { libelle: "La part des habitants de la zone qui connaissent la boutique", montant: 0, categorie: "capital", pourquoi: "C'est la notoriété, spontanée ou assistée, mesurée par une enquête dans la zone." },
      ],
      explication: () => [
        "L'expérience client relie les trois : chaque point de contact (la vitrine, le site, l'accueil, la caisse, le retour d'un article) la construit ou l'abîme. Une cliente satisfaite revient, et parle de la boutique : la satisfaction nourrit la fidélité, qui nourrit l'image.",
      ],
      relance: "Demandez-vous ce que l'indicateur regarde : une visite, un retour, ou ce que l'on dit de la boutique ?",
    },
    {
      id: "l-e-reputation",
      objectifs: [3],
      type: "montants",
      titre: "Une e-réputation qui baisse",
      notions: ["brand_capital", "conversion_rate"],
      question: (c) => {
        const x = fidelisationDuChapitre(c);
        return `Après des avis sur l'attente en caisse, la note en ligne de la boutique passe de ${qte(x.e.avant)} à ${qte(x.e.apres)} sur 5. Chaque dixième de point perdu fait ${pct(ENTREES_PERDUES_PAR_DIXIEME * 100, 0)} d'entrées de passants en moins. Calculez les entrées perdues sur les ${qte(x.e.entrees)} du mois (à l'unité), les passages perdus à la transformation des passants (${pct(auDixieme(x.e.transformation * 100))}, à l'unité), puis la marge perdue à ${eur(x.e.margeDUneVente)} la vente.`;
      },
      champs: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          { libelle: "Entrées perdues", attendu: x.e.entreesPerdues, calcul: `${qte(x.e.dixiemes)} dixièmes × ${pct(ENTREES_PERDUES_PAR_DIXIEME * 100, 0)} = ${pct(x.e.baisse * 100, 0)} ; ${qte(x.e.entrees)} × ${pct(x.e.baisse * 100, 0)} = ${qte(x.e.entreesPerdues)}` },
          { libelle: "Passages perdus", attendu: x.e.passagesPerdus, calcul: `${qte(x.e.entreesPerdues)} × ${pct(auDixieme(x.e.transformation * 100))} = ${qte(x.e.passagesPerdus)}` },
          { libelle: "Marge perdue par mois", attendu: x.e.margePerdue, calcul: `${qte(x.e.passagesPerdus)} × ${eur(x.e.margeDUneVente)} = ${eur(x.e.margePerdue)}` },
        ];
      },
      explication: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          `${qte(x.e.dixiemes)} dixièmes de note coûtent ${eur(x.e.margePerdue)} de marge par mois. L'e-réputation se surveille comme un indicateur : répondre à chaque avis, poliment et vite, corriger la cause (ici, l'attente en caisse) et inviter les clients satisfaits à donner le leur.`,
        ];
      },
    },
    {
      id: "les-garanties",
      objectifs: [4],
      type: "tri",
      titre: "Quelle garantie ?",
      notions: ["churn_rate"],
      question: () =>
        `La garantie légale de conformité couvre pendant ${qte(MOIS_DE_GARANTIE_LEGALE)} mois un article qui ne correspond pas à ce qui était promis ; la garantie commerciale est un engagement en plus, que la boutique choisit d'offrir et écrit. Rangez chaque situation.`,
      categories: [
        { code: "legale", libelle: "Garantie légale de conformité" },
        { code: "commerciale", libelle: "Garantie commerciale" },
        { code: "aucune", libelle: "Ni l'une ni l'autre" },
      ],
      elements: () => [
        { libelle: `Un mérinos dont la maille a filé au premier lavage, acheté il y a ${qte(RECLAMATION_DU_MERINOS.moisDepuisLAchat)} mois`, montant: 0, categorie: "legale", pourquoi: `Un défaut qui apparaît dans les ${qte(MOIS_DE_GARANTIE_LEGALE)} mois est présumé exister à l'achat : la boutique doit le reprendre.` },
        { libelle: "Un cardigan qui déteint, lavé selon l'étiquette, acheté il y a 3 mois", montant: 0, categorie: "legale", pourquoi: "L'article ne se comporte pas comme un cardigan doit le faire : c'est un défaut de conformité." },
        { libelle: "L'ourlet repris gratuitement pendant 1 an, promis par la carte", montant: 0, categorie: "commerciale", pourquoi: "La loi ne l'impose pas : c'est un service que la boutique s'engage à rendre, par écrit." },
        { libelle: "Une écharpe rendue après 3 semaines : la cliente n'aime plus la couleur", montant: 0, categorie: "aucune", pourquoi: "L'article est conforme : changer d'avis ne relève d'aucune garantie. Un échange reste un geste possible." },
        { libelle: "Un bonnet troué par une accroche, rapporté après 2 mois", montant: 0, categorie: "aucune", pourquoi: "Un accident d'usage n'est pas un défaut de l'article." },
      ],
      explication: () => [
        `Sous la garantie légale, la cliente choisit la réparation ou le remplacement ; la boutique s'exécute dans les ${qte(JOURS_POUR_REPARER_OU_REMPLACER)} jours, sinon elle rembourse ou réduit le prix. La garantie commerciale s'ajoute à la garantie légale, elle ne la remplace jamais. Et la boutique se retourne contre son façonnier pour un défaut de fabrication.`,
      ],
      relance: "Demandez-vous si l'article a un défaut, et si la boutique a promis quelque chose de plus que la loi.",
    },
    {
      id: "le-cout-de-la-reclamation",
      objectifs: [4],
      type: "montants",
      titre: "Ce que coûte la réclamation",
      notions: ["contribution_margin", "churn_rate"],
      question: (c) => {
        const x = fidelisationDuChapitre(c);
        return `La cliente au mérinos (vendu ${eur(x.r.prixHt)} hors taxes) choisit le remplacement. Calculez ce que coûte un mérinos neuf à la boutique (son coût variable) et le résultat de la vente une fois le pull remplacé. Puis calculez le résultat si elle avait dû rembourser, le pull défectueux ne se revendant pas (négatif s'il en fait perdre).`;
      },
      champs: (c) => {
        const x = fidelisationDuChapitre(c);
        const g = x.f.gamme.find((r) => r.code === x.r.reference)!;
        return [
          { libelle: "Coût d'un mérinos neuf", attendu: x.r.cout, calcul: `${eur(g.coutDAchat)} + ${eur(g.autresCoutsVariables)} = ${eur(x.r.cout)}` },
          { libelle: "Résultat de la vente, pull remplacé", attendu: x.r.resultatSiRemplace, calcul: `${eur(x.r.prixHt)} − ${eur(x.r.cout)} − ${eur(x.r.cout)} = ${eur(x.r.resultatSiRemplace)}` },
          { libelle: "Résultat de la vente, pull remboursé", attendu: x.r.resultatSiRembourse, calcul: `${eur(x.r.prixHt)} − ${eur(x.r.prixHt)} − ${eur(x.r.cout)} = ${eur(x.r.resultatSiRembourse)}` },
        ];
      },
      explication: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          `Remplacé, le pull laisse encore ${eur(x.r.resultatSiRemplace)} ; remboursé, la vente coûte ${eur(-x.r.resultatSiRembourse)}. Dans les deux cas, la cliente reste : une réclamation bien traitée garde une cliente qui vaut ${eur(fidelisationDuChapitre(c).base.valeur)}. Le défaut se signale au façonnier, qui reprend la pièce.`,
        ];
      },
    },
    {
      id: "lancer-la-remise",
      objectifs: [2],
      type: "choix",
      titre: "Lancer la remise ?",
      notions: ["customer_lifetime_value", "churn_rate"],
      question: () => "La direction vous demande s'il faut ajouter une remise à la carte, et à quel taux au plus. Que répondez-vous ?",
      options: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          {
            texte: `L'essayer à ${pct(REMISE_ETUDIEE * 100, 0)}, et mesurer les départs`,
            juste: true,
            retour: `Oui : à ${pct(REMISE_ETUDIEE * 100, 0)}, une cliente vaut ${eur(x.gainParCliente)} de plus si les départs tombent à ${pct(DEPARTS_AVEC_LA_REMISE * 100, 0)}, et la carte tient encore si les départs ne tombent qu'à ${pct(DEPARTS_DU_DEFI)}. Au-delà de ${pct(x.remiseMax, 0)}, la remise coûterait même avec la promesse tenue.`,
          },
          {
            texte: `L'offrir à ${pct(x.remiseMax, 0)} : c'est le taux le plus fort qui reste gagnant`,
            juste: false,
            retour: `Seulement si la promesse du prestataire se vérifie : avec ${pct(DEPARTS_DU_DEFI)} de départs, la carte ne tiendrait que jusqu'à ${pct(x.remiseMaxDuDefi, 0)}. Le taux maximal n'est pas un taux prudent.`,
          },
          {
            texte: "Ne pas l'offrir : une remise fait toujours perdre de la marge sur chaque achat",
            juste: false,
            retour: `Elle en fait perdre sur chaque passage, ${eur(x.avecRemise.remiseDUnPassage)} à ${pct(REMISE_ETUDIEE * 100, 0)}, mais elle allonge la vie de la cliente. Le calcul se fait sur la durée de vie, pas sur un ticket.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_lifetime_value", "churn_rate", "brand_capital"],
      tableau: tableauDeLaSynthese,
      texte: (c) => {
        const x = fidelisationDuChapitre(c);
        return [
          `La satisfaction se mesure (note moyenne, NPS = promoteurs − détracteurs, taux de réclamations), la fidélité aussi (départs, durée de vie = 1 ÷ départs). Valeur d'une cliente = marge d'un mois × durée de vie : ${eur(x.base.valeur)} ici.`,
          `Une remise de fidélité se paie sur toutes les clientes et rapporte par les mois gagnés. À ${pct(DEPARTS_AVEC_LA_REMISE * 100, 0)} de départs, elle tient jusqu'à ${pct(x.remiseMax, 0)} ; à ${pct(DEPARTS_DU_DEFI)}, jusqu'à ${pct(x.remiseMaxDuDefi, 0)}. On la teste avant de l'étendre.`,
          `Le capital client tient aussi à l'image et à l'e-réputation : ${qte(x.e.dixiemes)} dixièmes de note en ligne coûtent ${eur(x.e.margePerdue)} de marge par mois. Une réclamation se traite sous la garantie légale de conformité (${qte(MOIS_DE_GARANTIE_LEGALE)} mois), que la garantie commerciale complète sans la remplacer.`,
          "Au niveau de l'examen, vous savez mesurer satisfaction et fidélité, calculer la valeur d'un client, chiffrer une remise de fidélité et son taux limite, mesurer l'effet d'une e-réputation, et traiter une réclamation selon la garantie qui s'applique.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Durée de vie = 1 ÷ taux de départ. Valeur d'un client = marge d'une période × durée de vie. NPS = % de promoteurs − % de détracteurs.",
    },
  ],
};
