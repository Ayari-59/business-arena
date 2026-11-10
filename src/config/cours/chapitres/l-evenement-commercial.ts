import { arrondi2 as auCentime, eur, nombreAuCentieme, pct as enPoints } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  BUDGET_DES_SALONS,
  MATINALES,
  PIPELINE_DES_SALONS,
  RETROPLANNING_D_UN_SALON,
  matinales,
  pipelineDesSalons,
  salonRefait,
  salonsDeN,
} from "../monde/terrain-d-atlas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VALEUR, POURQUOI_LE_CABINET, ficheDe } from "./valeur-d-un-client";

/**
 * CHAPITRE : L'ÉVÉNEMENT COMMERCIAL : BUDGET, BILAN ET SUIVI DES CONTACTS (BTS NDRC, bloc 1, et la gestion
 * de projet du bloc 3, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le cabinet ATLAS
 * CONSEIL a une fiche figée (monde/atlas-conseil.ts), et ses salons, leur pipeline et les matinales se
 * calculent par monde/terrain-d-atlas.ts, partie 4. Les salons sont ceux de la fiche : 17 200 € de stands,
 * 37 200 € avec le temps des commerciaux, 400 visiteurs, 40 rendez-vous, 8 devis et 2 contrats.
 *
 * L'objet : organiser et exploiter un événement commercial. Son budget et son rétroplanning ; les contrats
 * qu'il faut pour le payer, sur la marge d'une année puis sur la valeur vie ; son bilan quantitatif (coût
 * par contact, par rendez-vous, par contrat) ; le suivi des contacts par un pipeline pondéré ; puis la
 * décision : refaire les salons, ou les remplacer par deux matinales clients.
 *
 * Le piège central : le coût par contact. Un visiteur de salon coûte 93 €, un prospect de matinale 200 € ;
 * mais le prospect de matinale, venu pour un sujet, mène cinq fois plus souvent à un rendez-vous, et un
 * compte gagné y coûte 4 800 €, contre 18 600 € au salon.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, le-budget, le-retroplanning ;
 *   · l'expérience avant la formule : predire-le-point-mort puis les-contrats-qui-paient (au curseur) avant
 *     le-point-mort ; predire-la-matinale puis le-laboratoire-de-l-evenement (visiteurs, taux de rendez-vous
 *     et de signature, avec le graphique des deux gains) avant les-matinales ;
 *   · autonome : le-bilan, le-suivi-des-contacts, les-matinales ;
 *   · expert : refaire-le-salon (le jugement) ; puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les contrats qui paient sont des quantités : le corrigé écrit le
 * quotient à deux décimales, puis l'arrondit à l'unité au-dessus ; les rendez-vous et les comptes
 * attendus, moyennes d'un entonnoir, sont des grandeurs au centième, à un centième près (à 5 centièmes
 * près, avant), et les coûts et le gain partent d'eux (monde/terrain-d-atlas.ts).
 */

/** Les bornes du curseur des contrats gagnés. */
export const CONTRATS_DU_CURSEUR = { min: 0, max: 8 } as const;

/** Les leviers du laboratoire : les visiteurs du stand, le taux de rendez-vous (%) et le taux de signature des devis (%). */
export const LEVIERS_DE_L_EVENEMENT = {
  visiteurs: { min: 200, max: 800, pas: 50 },
  rendezVous: { min: 5, max: 25, pas: 1 },
  signature: { min: 10, max: 40, pas: 5 },
} as const;

/** L'événement se lit sur les canaux et les comptes du cabinet du cours, ATLAS CONSEIL. */
export const ENTREPRISES_DE_L_EVENEMENT: readonly string[] = ENTREPRISES_DE_LA_VALEUR;

const MOMENTS = [
  { code: "trois-mois-avant", libelle: "3 mois avant" },
  { code: "un-mois-avant", libelle: "1 mois avant" },
  { code: "la-semaine-du-salon", libelle: "La semaine du salon" },
  { code: "apres-le-salon", libelle: "Après le salon" },
] as const;

const POURQUOI_DU_MOMENT: Readonly<Record<string, string>> = {
  "Réserver l'emplacement et fixer le budget": "Les bons emplacements partent tôt, et le budget dit ce que le stand peut être.",
  "Choisir l'objectif : contacts, rendez-vous, contrats": "Un objectif fixé d'avance permet de juger le salon après : sans lui, pas de bilan.",
  "Commander les plaquettes et le kakémono": "Il faut le temps de les rédiger, de les faire valider et de les imprimer.",
  "Inviter les clients et les prospects du fichier": "Une invitation se lance assez tôt pour que l'invité réserve sa journée.",
  "Fixer le planning des commerciaux sur le stand": "Le stand doit être tenu à toute heure, sans vider le terrain.",
  "Relancer les invités par téléphone": "Un appel la semaine du salon transforme une inscription en visite.",
  "Saisir les contacts du stand dans le CRM": "Un contact non saisi dans les jours qui suivent est un contact perdu.",
  "Dresser le bilan : coût par contact et par contrat": "Le bilan compare le résultat à l'objectif fixé 3 mois avant.",
};

const qte = nombreAuCentieme;
const pct = (t: number) => enPoints(t * 100);
const auCentiemeDePct = (x: number) => auCentime(x * 100);

/** Les salons, leur pipeline et les matinales du cabinet : tout ce que le chapitre et son cas demandent. */
export function evenementDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = salonsDeN(f);
  const p = pipelineDesSalons();
  const m = matinales(f);
  const avecLePipeline = auCentime((s.canal.contrats + p.comptesAttendus) * s.valeurDUnCompte - s.coutComplet);
  // Le taux de rendez-vous (au point entier) qui rendrait les salons aussi bons que les matinales, à visiteurs et signature de N.
  let rendezVousQuiEgale = LEVIERS_DE_L_EVENEMENT.rendezVous.min;
  while (rendezVousQuiEgale < 100 && salonRefait(f, { tauxDeRendezVous: rendezVousQuiEgale / 100 }).gain < m.gain - 1e-9) rendezVousQuiEgale += 1;
  return { f, s, p, m, avecLePipeline, rendezVousQuiEgale, seniors: f.commerciaux.filter((k) => k.code !== "conquete").map((k) => k.prenom) };
}

export type EvenementDuCabinet = ReturnType<typeof evenementDuCabinet>;

/** Le salon refait pour une position du laboratoire, face aux matinales. */
export function laboratoireDeLEvenement(x: EvenementDuCabinet, visiteurs: number, rendezVousEnPct: number, signatureEnPct: number) {
  const r = salonRefait(x.f, { visiteurs, tauxDeRendezVous: rendezVousEnPct / 100, tauxDeSignature: signatureEnPct / 100 });
  return { comptes: auCentime(r.comptes), coutParContact: r.coutParContact, coutParCompte: r.comptes > 0 ? r.coutParCompte : 0, gain: r.gain, gainDesMatinales: x.m.gain, ecart: auCentime(r.gain - x.m.gain) };
}

/** Le budget des salons de N, ligne par ligne : le document de départ. */
function tableauDuBudget(x: EvenementDuCabinet): TableauDeDonnees {
  return {
    titre: `Le budget des salons de N, ${x.f.entreprise}`,
    colonnes: ["Montant"],
    lignes: BUDGET_DES_SALONS.map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] })),
  };
}

/** Les opportunités encore ouvertes des salons : le document du suivi des contacts. */
function tableauDuPipeline(x: EvenementDuCabinet): TableauDeDonnees {
  return {
    titre: "Les opportunités ouvertes des salons, au 31 décembre N",
    colonnes: ["Stade", "Chiffre d'affaires", "Chance de signer"],
    lignes: x.p.lignes.map((l) => ({ libelle: l.prospect, valeurs: [l.nom, eur(l.montant), pct(l.probabilite)] })),
  };
}

export const L_EVENEMENT_COMMERCIAL: Chapitre = {
  code: "l-evenement-commercial",
  parcours: "ndrc",
  palier: 3,
  blocs: ["BTS NDRC Bloc 1 · Relation client et négociation-vente", "BTS NDRC Bloc 3 · Relation client et animation de réseaux"],
  titre: "L'événement commercial : budget, bilan et suivi des contacts",
  accroche:
    "Un salon se prépare, se paie et se juge. Son budget et son rétroplanning, les contrats qu'il faut pour le payer, son bilan par contact et par contrat, le suivi de ses contacts, puis le choix de le refaire ou non.",
  objectifs: [
    "Établir le budget d'un événement commercial et son rétroplanning",
    "Calculer les contrats qu'il faut pour payer un événement",
    "Dresser le bilan quantitatif d'un événement : coût par contact, par rendez-vous et par contrat",
    "Suivre les contacts d'un événement par un pipeline pondéré",
    "Choisir un événement sur ce qu'il gagne, et non sur son coût par contact",
  ],
  libre: false,
  prerequis: ["valeur-d-un-client", "cout-d-acquisition"],
  ensuite: ["le-fichier-et-la-cible"],
  entreprises: { codes: ENTREPRISES_DE_L_EVENEMENT, pourquoi: POURQUOI_LE_CABINET },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Les salons du cabinet",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      tableau: (c) => tableauDuBudget(evenementDuCabinet(c)),
      texte: (c) => {
        const x = evenementDuCabinet(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}. En N, le cabinet a tenu un stand sur deux salons professionnels de 3 jours, au printemps : le Salon de l'entreprise de Granvaux, en mars, et le Forum régional des ressources humaines, en juin.`,
          `Le stand y a reçu ${qte(x.s.canal.contacts)} visiteurs ; ${qte(x.s.canal.rendezVous)} ont accepté un rendez-vous, ${qte(x.s.canal.devis)} ont reçu un devis et ${qte(x.s.canal.contrats)} l'ont signé : les ${x.s.comptes.map((k) => k.nom).join(" et les ")}.`,
          `La simulation compte le coût d'un salon comme celui d'un canal de conquête : les stands et les déplacements, et le temps des commerciaux seniors, ${x.seniors.join(" et ")}, sur le stand puis aux rendez-vous qui suivent (${eur(x.s.temps)}).`,
        ];
      },
      repere: () => "Coût complet d'un événement = son budget + le temps de ceux qui le tiennent. Un événement se juge sur ce qu'il gagne de comptes, face à son coût complet.",
    },
    {
      id: "le-budget",
      objectifs: [0],
      type: "montants",
      titre: "Le budget des salons",
      notions: ["fixed_costs", "customer_acquisition_cost"],
      tableau: (c) => tableauDuBudget(evenementDuCabinet(c)),
      question: (c) => {
        const x = evenementDuCabinet(c);
        return `Calculez le budget des stands, puis le coût complet des salons, avec les ${eur(x.s.temps)} de temps des commerciaux, et la part de ce temps dans le coût complet (en %, au centième).`;
      },
      champs: (c) => {
        const x = evenementDuCabinet(c);
        return [
          { libelle: "Budget des stands", attendu: x.s.budget, calcul: `${BUDGET_DES_SALONS.map((l) => eur(l.montant)).join(" + ")} = ${eur(x.s.budget)}` },
          { libelle: "Coût complet des salons", attendu: x.s.coutComplet, calcul: `${eur(x.s.budget)} + ${eur(x.s.temps)} = ${eur(x.s.coutComplet)}` },
          { libelle: "Part du temps des commerciaux (%)", attendu: auCentiemeDePct(x.s.temps / x.s.coutComplet), calcul: `${eur(x.s.temps)} ÷ ${eur(x.s.coutComplet)} = ${pct(x.s.temps / x.s.coutComplet)}` },
        ];
      },
      explication: (c) => {
        const x = evenementDuCabinet(c);
        return [
          `Le budget des stands, ${eur(x.s.budget)}, n'est que la partie visible : le temps des commerciaux fait ${pct(x.s.temps / x.s.coutComplet)} du coût complet. Ce temps est payé de toute façon, mais il n'est pas passé chez les clients : il se compte quand on compare deux façons de prospecter.`,
        ];
      },
    },
    {
      id: "le-retroplanning",
      objectifs: [0],
      type: "tri",
      titre: "Le rétroplanning d'un salon",
      notions: ["conversion_rate"],
      question: () => "Un rétroplanning part du jour du salon et remonte le temps. Rangez chaque tâche au moment où elle doit être faite.",
      categories: MOMENTS,
      elements: () => RETROPLANNING_D_UN_SALON.map((t) => ({ libelle: t.tache, montant: 0, categorie: t.moment, pourquoi: POURQUOI_DU_MOMENT[t.tache]! })),
      relance: "Demandez-vous ce qui doit être prêt pour que la tâche suivante puisse se faire.",
      explication: () => [
        "Un événement est un projet : un objectif, un budget, des tâches qui s'enchaînent, une date qui ne bouge pas. Le rétroplanning fixe chaque tâche en partant de cette date.",
        "Le travail ne s'arrête pas au démontage du stand : la saisie des contacts et leur relance font le résultat du salon.",
      ],
    },
    {
      id: "predire-le-point-mort",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur les contrats",
      notions: ["breakeven", "customer_lifetime_value"],
      question: (c) => {
        const x = evenementDuCabinet(c);
        return `Avant de calculer, pariez. Un compte gagné au salon laisse ${eur(x.s.margePremiereAnnee)} de marge sa première année, en moyenne. Combien de contrats faut-il pour que cette marge paie les ${eur(x.s.coutComplet)} des salons ?`;
      },
      options: (c) => {
        const x = evenementDuCabinet(c);
        const voir = "Faites varier les contrats à l'étape suivante : le curseur montre où la marge rattrape le coût.";
        return [
          { texte: "Environ 5", juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${qte(x.s.canal.contrats)}, ceux de N`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Un seul suffit", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-contrats-qui-paient",
      objectifs: [1],
      type: "curseur",
      titre: "Les contrats qui paient les salons",
      notions: ["breakeven", "customer_acquisition_cost"],
      question: (c) => {
        const x = evenementDuCabinet(c);
        return `Faites varier les contrats gagnés aux salons, de zéro à ${qte(CONTRATS_DU_CURSEUR.max)}. Une droite donne la marge de leur première année, à ${eur(x.s.margePremiereAnnee)} l'un ; l'autre, le coût complet des salons. Placez le curseur sur le plus petit nombre de contrats qui paie les salons, puis validez.`;
      },
      grandeur: () => ({ libelle: "Contrats gagnés aux salons", unite: "contrats" }),
      cible: (c) => ({ attendu: evenementDuCabinet(c).s.contratsQuiPaientLaPremiereAnnee, min: CONTRATS_DU_CURSEUR.min, max: CONTRATS_DU_CURSEUR.max }),
      zones: ["Les salons sont payés", "Les salons ne sont pas payés"],
      rates: () => ({
        dessous: "À cette position, la marge de la première année ne paie pas encore les salons.",
        dessus: "Moins de contrats suffiraient : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les contrats",
      lecture: (c, n) => {
        const x = evenementDuCabinet(c);
        const marge = auCentime(n * x.s.margePremiereAnnee);
        return [
          { libelle: "Marge de la première année des contrats", montant: marge },
          { libelle: "Coût complet des salons", montant: x.s.coutComplet },
          { libelle: "Marge moins coût des salons", montant: auCentime(marge - x.s.coutComplet), fort: true },
        ];
      },
      droites: (c) => {
        const x = evenementDuCabinet(c);
        return { produit: (n) => n * x.s.margePremiereAnnee, cout: () => x.s.coutComplet, libelles: ["Marge de la première année des contrats", "Coût complet des salons"] };
      },
      explication: (c) => {
        const x = evenementDuCabinet(c);
        return [
          `Il faut ${qte(x.s.contratsQuiPaientLaPremiereAnnee)} contrats pour que la marge d'une année paie les salons ; ils en ont gagné ${qte(x.s.canal.contrats)}. Sur une seule année, les salons de N ne sont pas payés.`,
          "Mais un compte gagné ne laisse pas sa marge une seule année : l'étape suivante refait le calcul sur sa vie de client.",
        ];
      },
    },
    {
      id: "le-point-mort",
      objectifs: [1],
      type: "montants",
      titre: "Le point mort des salons",
      notions: ["breakeven", "customer_lifetime_value"],
      question: (c) => {
        const x = evenementDuCabinet(c);
        return `Les ${qte(x.s.comptes.length)} comptes gagnés aux salons ont ${pct(x.s.attrition)} de risque de partir chaque année. Calculez la marge moyenne d'un compte de salon, les contrats qui paient les salons sur cette marge, la valeur vie d'un compte de salon (marge ÷ attrition), puis les contrats qui paient les salons sur leur valeur vie.`;
      },
      champs: (c) => {
        const x = evenementDuCabinet(c);
        const s = x.s;
        return [
          { libelle: "Marge moyenne d'un compte de salon", attendu: s.margePremiereAnnee, calcul: `(${s.comptes.map((k) => eur(k.marge)).join(" + ")}) ÷ ${qte(s.comptes.length)} = ${eur(s.margePremiereAnnee)}` },
          { libelle: "Contrats qui paient, sur la marge d'une année", nature: "quantite", attendu: s.contratsQuiPaientLaPremiereAnnee, calcul: `${eur(s.coutComplet)} ÷ ${eur(s.margePremiereAnnee)} = ${qte(auCentime(s.coutComplet / s.margePremiereAnnee))}, soit ${qte(s.contratsQuiPaientLaPremiereAnnee)} contrats à l'unité au-dessus : un contrat ne se signe pas en partie` },
          { libelle: "Valeur vie d'un compte de salon", attendu: s.valeurDUnCompte, calcul: `${eur(s.margePremiereAnnee)} ÷ ${pct(s.attrition)} = ${eur(s.valeurDUnCompte)}` },
          { libelle: "Contrats qui paient, sur la valeur vie", nature: "quantite", attendu: s.contratsQuiPaientEnValeurVie, calcul: `${eur(s.coutComplet)} ÷ ${eur(s.valeurDUnCompte)} = ${qte(auCentime(s.coutComplet / s.valeurDUnCompte))}, soit ${qte(s.contratsQuiPaientEnValeurVie)} contrats à l'unité au-dessus` },
        ];
      },
      explication: (c) => {
        const x = evenementDuCabinet(c);
        return [
          `Sur leur vie de client, ${qte(x.s.contratsQuiPaientEnValeurVie)} contrats paient les salons : ceux de N y suffisent. Le point mort d'un événement se calcule comme un seuil de rentabilité, avec ce que vaut vraiment un contrat gagné.`,
        ];
      },
    },
    {
      id: "le-bilan",
      objectifs: [2],
      type: "montants",
      titre: "Le bilan quantitatif des salons",
      notions: ["customer_acquisition_cost", "conversion_rate", "customer_lifetime_value"],
      question: () =>
        "Sans formule cette fois. Dressez le bilan des salons de N : le coût par visiteur, par rendez-vous et par contrat, la valeur vie des comptes gagnés, puis le gain des salons (valeur vie des comptes − coût complet ; négatif pour une perte).",
      champs: (c) => {
        const x = evenementDuCabinet(c);
        const b = x.s.bilan;
        return [
          { libelle: "Coût par visiteur", attendu: b.coutParContact, calcul: `${eur(b.cout)} ÷ ${qte(b.contacts)} = ${eur(b.coutParContact)}` },
          { libelle: "Coût par rendez-vous", attendu: b.coutParRendezVous, calcul: `${eur(b.cout)} ÷ ${qte(b.rendezVous)} = ${eur(b.coutParRendezVous)}` },
          { libelle: "Coût par contrat", attendu: b.coutParCompte, calcul: `${eur(b.cout)} ÷ ${qte(b.comptes)} = ${eur(b.coutParCompte)}` },
          { libelle: "Valeur vie des comptes gagnés", attendu: b.valeurCreee, calcul: `${qte(b.comptes)} × ${eur(x.s.valeurDUnCompte)} = ${eur(b.valeurCreee)}` },
          { libelle: "Gain des salons", attendu: b.gain, calcul: `${eur(b.valeurCreee)} − ${eur(b.cout)} = ${eur(b.gain)}` },
        ];
      },
      explication: (c) => {
        const x = evenementDuCabinet(c);
        const b = x.s.bilan;
        return [
          `Chaque marche multiplie le coût : ${eur(b.coutParContact)} le visiteur, ${eur(b.coutParRendezVous)} le rendez-vous, ${eur(b.coutParCompte)} le contrat. Les salons gagnent ${eur(b.gain)} sur la vie des comptes.`,
          "Le bilan se complète d'un bilan qualitatif : l'image du cabinet, les clients revus sur le stand, ce que les visiteurs ont dit des concurrents. Il ne se chiffre pas, il s'écrit dans le compte rendu.",
        ];
      },
    },
    {
      id: "le-suivi-des-contacts",
      objectifs: [3],
      type: "montants",
      titre: "Le suivi des contacts",
      notions: ["conversion_rate", "customer_lifetime_value"],
      tableau: (c) => tableauDuPipeline(evenementDuCabinet(c)),
      question: (c) => {
        const x = evenementDuCabinet(c);
        const st = PIPELINE_DES_SALONS.stades;
        return `Des ${qte(x.s.canal.devis)} devis, ${qte(x.s.canal.contrats)} sont signés, ${qte(PIPELINE_DES_SALONS.devisPerdus)} perdus, et il reste les opportunités du tableau. Un devis sans réponse se joue à ${qte(st["devis-remis"].horizon)} mois, un projet à ${qte(st["projet-sans-devis"].horizon)} mois. Calculez le chiffre d'affaires pondéré (chiffre d'affaires × chance de signer) à ${qte(st["devis-remis"].horizon)} mois, puis à ${qte(st["projet-sans-devis"].horizon)} mois, et les comptes qu'on peut en attendre, à deux décimales.`;
      },
      champs: (c) => {
        const x = evenementDuCabinet(c);
        const devis = x.p.lignes.filter((l) => l.stade === "devis-remis");
        const projets = x.p.lignes.filter((l) => l.stade === "projet-sans-devis");
        return [
          { libelle: "Chiffre d'affaires pondéré à 3 mois", attendu: x.p.aTroisMois, calcul: `(${devis.map((l) => eur(l.montant)).join(" + ")}) × ${pct(devis[0]!.probabilite)} = ${eur(x.p.aTroisMois)}` },
          {
            libelle: "Chiffre d'affaires pondéré à 6 mois",
            attendu: x.p.aSixMois,
            calcul: `${eur(x.p.aTroisMois)} + (${projets.map((l) => eur(l.montant)).join(" + ")}) × ${pct(projets[0]!.probabilite)} = ${eur(x.p.aSixMois)}`,
          },
          {
            libelle: "Comptes attendus du pipeline",
            nature: "grandeur",
            attendu: auCentime(x.p.comptesAttendus),
            calcul: `${qte(devis.length)} × ${pct(devis[0]!.probabilite)} + ${qte(projets.length)} × ${pct(projets[0]!.probabilite)} = ${qte(auCentime(x.p.comptesAttendus))} compte`,
          },
        ];
      },
      explication: (c) => {
        const x = evenementDuCabinet(c);
        return [
          `Le pipeline affiche ${eur(x.p.brut)} d'opportunités, mais n'en promet que ${eur(x.p.aSixMois)} à ${qte(PIPELINE_DES_SALONS.stades["projet-sans-devis"].horizon)} mois : une opportunité vaut son montant multiplié par sa chance de signer. Ce sont des contacts du printemps ; plus ils vieillissent, plus leur chance baisse.`,
          `Avec ce pipeline, les salons gagneraient ${eur(x.avecLePipeline)} sur la vie des comptes. Le suivi des contacts fait partie de l'événement : chaque relance tardive retire une part de ce qu'il a coûté.`,
        ];
      },
    },
    {
      id: "predire-la-matinale",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur les matinales",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => {
        const x = evenementDuCabinet(c);
        return `Avant de calculer, pariez. À la place des salons, le cabinet peut tenir ${qte(x.m.nombre)} matinales clients dans ses locaux, pour ${eur(x.m.cout)} : ${qte(x.m.contacts)} prospects présents, à ${eur(x.m.coutParContact)} l'un, contre ${eur(x.s.bilan.coutParContact)} le visiteur de salon. Que gagneraient-elles, face aux salons ?`;
      },
      options: () => {
        const voir = "Le laboratoire suivant compare le gain des salons à celui des matinales : faites varier ce que le salon obtient.";
        return [
          { texte: "Plus que les salons", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Moins : leur contact coûte plus du double", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Autant, à budget égal", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-evenement",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de l'événement",
      notions: ["customer_acquisition_cost", "conversion_rate", "customer_lifetime_value"],
      question: (c) => {
        const x = evenementDuCabinet(c);
        return `Le coût complet des salons reste de ${eur(x.s.coutComplet)}. Faites varier leurs visiteurs, la part qui accepte un rendez-vous et la part des devis signés ; un rendez-vous sur ${qte(x.s.canal.rendezVous / x.s.canal.devis)} mène toujours à un devis. Le tableau compare le gain des salons, à ${eur(x.s.valeurDUnCompte)} le compte gagné, à celui des matinales.`;
      },
      leviers: (c) => {
        const x = evenementDuCabinet(c);
        const l = LEVIERS_DE_L_EVENEMENT;
        const k = x.s.canal;
        return [
          { code: "visiteurs", libelle: "Visiteurs du stand", unite: "visiteurs", min: l.visiteurs.min, max: l.visiteurs.max, pas: l.visiteurs.pas, depart: k.contacts },
          { code: "rendezVous", libelle: "Visiteurs qui acceptent un rendez-vous", unite: "%", min: l.rendezVous.min, max: l.rendezVous.max, pas: l.rendezVous.pas, depart: auCentime((k.rendezVous / k.contacts) * 100) },
          { code: "signature", libelle: "Devis signés", unite: "%", min: l.signature.min, max: l.signature.max, pas: l.signature.pas, depart: auCentime((k.contrats / k.devis) * 100) },
        ];
      },
      lecture: (c, p) => {
        const x = evenementDuCabinet(c);
        const l = laboratoireDeLEvenement(x, p.visiteurs!, p.rendezVous!, p.signature!);
        const k = x.s.canal;
        const d = laboratoireDeLEvenement(x, k.contacts, (k.rendezVous / k.contacts) * 100, (k.contrats / k.devis) * 100);
        return [
          { libelle: "Comptes gagnés aux salons", montant: l.comptes, reference: d.comptes, unite: "comptes" },
          { libelle: "Coût par visiteur", montant: l.coutParContact, reference: d.coutParContact },
          { libelle: "Coût par compte gagné", montant: l.coutParCompte, reference: d.coutParCompte },
          { libelle: "Gain des salons", montant: l.gain, reference: d.gain, effet: true },
          { libelle: "Gain des matinales", montant: l.gainDesMatinales },
          { libelle: "Salons moins matinales", montant: l.ecart, reference: d.ecart, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = evenementDuCabinet(c);
        return {
          levier: "rendezVous",
          courbes: [
            { libelle: "Gain des salons", valeur: (p) => laboratoireDeLEvenement(x, p.visiteurs!, p.rendezVous!, p.signature!).gain },
            { libelle: "Gain des matinales", valeur: () => x.m.gain },
          ],
        };
      },
      defi: (c) => {
        const x = evenementDuCabinet(c);
        return {
          consigne: "Trouvez ce que les salons devraient obtenir pour gagner au moins autant que les matinales.",
          atteint: (p) => laboratoireDeLEvenement(x, p.visiteurs!, p.rendezVous!, p.signature!).ecart >= -1e-9,
          indice: (p) => {
            const l = laboratoireDeLEvenement(x, p.visiteurs!, p.rendezVous!, p.signature!);
            return `Les salons gagnent encore ${eur(-l.ecart)} de moins : il leur faut plus de visiteurs, plus de rendez-vous ou plus de devis signés.`;
          },
          solution: { visiteurs: x.s.canal.contacts, rendezVous: x.rendezVousQuiEgale, signature: auCentime((x.s.canal.contrats / x.s.canal.devis) * 100) },
        };
      },
      explication: (c) => {
        const x = evenementDuCabinet(c);
        return [
          `À visiteurs et signature de N, les salons ne rattrapent les matinales qu'avec ${qte(x.rendezVousQuiEgale)} % de visiteurs qui acceptent un rendez-vous, contre ${pct(x.s.canal.rendezVous / x.s.canal.contacts)} en N. Un stand reçoit beaucoup de passants, peu de projets.`,
          "Le coût par visiteur ne bouge presque pas d'une position à l'autre ; le coût par compte, lui, décide du gain.",
        ];
      },
    },
    {
      id: "les-matinales",
      objectifs: [2, 4],
      type: "montants",
      titre: "Le bilan attendu des matinales",
      notions: ["customer_acquisition_cost", "conversion_rate", "customer_lifetime_value"],
      question: (c) => {
        const x = evenementDuCabinet(c);
        const m = MATINALES;
        return `Sans formule cette fois. ${qte(x.m.nombre)} matinales, ${eur(x.m.coutDUne)} l'une, ${qte(m.prospectsPresents)} prospects présents à chacune : un sur ${qte(1 / m.tauxDeRendezVous)} accepte un rendez-vous, un rendez-vous sur ${qte(1 / m.devisParRendezVous)} mène à un devis, et les devis se signent au taux des salons. Calculez les rendez-vous, les comptes attendus, le coût par prospect présent, le coût par compte, puis le gain des matinales, à la valeur vie d'un compte de salon.`;
      },
      champs: (c) => {
        const x = evenementDuCabinet(c);
        const m = x.m;
        return [
          { libelle: "Rendez-vous des matinales", nature: "grandeur", attendu: m.rendezVous, calcul: `${qte(m.nombre)} × ${qte(m.presents)} × ${pct(MATINALES.tauxDeRendezVous)} = ${qte(m.rendezVous)} rendez-vous` },
          { libelle: "Comptes attendus des matinales", nature: "grandeur", attendu: m.comptes, calcul: `${qte(m.rendezVous)} ÷ ${qte(1 / MATINALES.devisParRendezVous)} = ${qte(m.devis)} devis ; ${qte(m.devis)} × ${pct(MATINALES.tauxDeSignature)} = ${qte(m.comptes)} comptes` },
          { libelle: "Coût par prospect présent", attendu: m.coutParContact, calcul: `${eur(m.cout)} ÷ ${qte(m.contacts)} = ${eur(m.coutParContact)}` },
          { libelle: "Coût par compte des matinales", attendu: m.coutParCompte, calcul: `${eur(m.cout)} ÷ ${qte(m.comptes)} = ${eur(m.coutParCompte)}` },
          { libelle: "Gain des matinales", attendu: m.gain, calcul: `${qte(m.comptes)} × ${eur(x.s.valeurDUnCompte)} − ${eur(m.cout)} = ${eur(m.gain)}` },
        ];
      },
      explication: (c) => {
        const x = evenementDuCabinet(c);
        return [
          `Un prospect de matinale coûte ${eur(x.m.coutParContact)}, ${qte(Math.round((x.m.coutParContact / x.s.bilan.coutParContact) * 10) / 10)} fois un visiteur de salon ; mais un compte y coûte ${eur(x.m.coutParCompte)}, contre ${eur(x.s.bilan.coutParCompte)}. Les matinales gagneraient ${eur(x.m.gain)}, les salons ${eur(x.s.bilan.gain)}, et ${eur(x.avecLePipeline)} même avec tout leur pipeline.`,
          "Ces taux sont des estimations : les invités d'une matinale viennent du fichier qualifié, pour un sujet. Une première matinale les vérifie avant de renoncer aux salons.",
        ];
      },
    },
    {
      id: "refaire-le-salon",
      objectifs: [4],
      type: "choix",
      titre: "Refaire les salons ?",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      question: () => "Le directeur doit réserver, ou non, les emplacements des salons de l'an prochain. Que lui proposez-vous ?",
      options: (c) => {
        const x = evenementDuCabinet(c);
        return [
          {
            texte: "Les matinales, qui gagnent plus pour moins cher",
            juste: true,
            retour: `Oui : ${eur(x.m.gain)} de gain attendu pour ${eur(x.m.cout)}, contre ${eur(x.s.bilan.gain)} pour ${eur(x.s.coutComplet)}. Il faudrait ${qte(x.rendezVousQuiEgale)} % de rendez-vous au salon pour faire aussi bien. Une première matinale vérifie les taux avant de renoncer aux emplacements.`,
          },
          {
            texte: `Les salons : un visiteur y coûte ${eur(x.s.bilan.coutParContact)}, un prospect de matinale ${eur(x.m.coutParContact)}`,
            juste: false,
            retour: `Non : un contact ne se signe pas. Par compte gagné, les salons coûtent ${eur(x.s.bilan.coutParCompte)}, les matinales ${eur(x.m.coutParCompte)}.`,
          },
          {
            texte: `Ni l'un ni l'autre : les salons ne sont pas payés sur la marge d'une année`,
            juste: false,
            retour: `Non : un compte gagné reste client plusieurs années. Sur leur valeur vie, ${qte(x.s.contratsQuiPaientEnValeurVie)} contrats paient les salons, et les matinales gagnent plus encore.`,
          },
          {
            texte: `Les salons : ils ont gagné ${qte(x.s.canal.contrats)} comptes, les matinales n'en promettent que ${qte(x.m.comptes)}`,
            juste: false,
            retour: `Non : les matinales en promettent plus (${qte(x.m.comptes)}), pour ${pct(x.m.cout / x.s.coutComplet)} du coût. Et même avec leur pipeline, les salons gagneraient ${eur(x.avecLePipeline)}, moins que les matinales.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_acquisition_cost", "conversion_rate", "breakeven"],
      tableau: (c) => {
        const x = evenementDuCabinet(c);
        const s = x.s.bilan;
        const m = x.m;
        return {
          titre: "Les salons de N et les matinales, marche par marche",
          colonnes: ["Salons", "Matinales"],
          lignes: [
            { libelle: "Coût complet", valeurs: [eur(s.cout), eur(m.cout)] },
            { libelle: "Coût par contact", valeurs: [eur(s.coutParContact), eur(m.coutParContact)] },
            { libelle: "Coût par rendez-vous", valeurs: [eur(s.coutParRendezVous), eur(m.coutParRendezVous)] },
            { libelle: "Coût par compte", valeurs: [eur(s.coutParCompte), eur(m.coutParCompte)] },
            { libelle: "Gain sur la vie des comptes", valeurs: [eur(s.gain), eur(m.gain)] },
          ],
        };
      },
      texte: (c) => {
        const x = evenementDuCabinet(c);
        return [
          `Un événement commercial est un projet : un objectif, un budget, un rétroplanning. Son coût complet compte le temps de ceux qui le tiennent : ${eur(x.s.coutComplet)} pour les salons de N, dont ${eur(x.s.budget)} de stands.`,
          `Il se juge sur les comptes qu'il gagne : ${qte(x.s.contratsQuiPaientEnValeurVie)} contrats le paient sur leur valeur vie. Son bilan descend l'entonnoir, du coût par contact au coût par contrat, et son pipeline pondéré dit ce qu'il peut encore rapporter. Le coût par contact trompe : les matinales coûtent plus cher par contact, et moins cher par compte.`,
          "Au niveau de l'examen, vous savez établir le budget et le rétroplanning d'un événement, calculer son point mort en contrats, dresser son bilan quantitatif, pondérer un pipeline et choisir entre deux événements.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Contrats qui paient un événement = coût complet ÷ valeur d'un compte, à l'unité supérieure. Pipeline pondéré = somme des montants × chance de signer.",
    },
  ],
};
