import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { ATLAS_CONSEIL, CABINETS_DU_COURS, type CodeDeCanal } from "../monde/atlas-conseil";
import { contactsDeLaCampagne, entonnoir } from "../monde/relation-client";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VALEUR, POURQUOI_LE_CABINET, ficheDe, valeurDesComptes } from "./valeur-d-un-client";

/**
 * CHAPITRE : LE COÛT D'ACQUISITION ET LA RENTABILITÉ D'UNE CAMPAGNE (BTS NDRC, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le cabinet
 * ATLAS CONSEIL a une fiche figée (monde/atlas-conseil.ts) et l'entonnoir, la courbe de la campagne et
 * le compte en plus se calculent par le modèle du cours (monde/relation-client.ts, partie 4). Une
 * évolution du moteur ne change rien ici.
 *
 * L'objet : les quatre canaux de conquête de l'année N, de l'entonnoir au contrat. Ce que coûte un
 * compte gagné, canal par canal ; les taux de chaque marche, dont le taux de transformation des
 * devis ; ce qu'il faudrait de rendez-vous pour qu'un canal coûte la moyenne ; puis la campagne
 * digitale, dont la courbe figée à cinq paliers est concave : le coût moyen d'un compte monte peu,
 * mais le compte en plus coûte de plus en plus cher, et le budget se décide là où le dernier euro ne
 * rapporte plus, face à ce que vaut un compte gagné (sa valeur vie, du chapitre précédent).
 *
 * Le piège central : la moyenne. À 48 000 €, un compte coûte 19 200 € en moyenne, loin sous ses
 * 84 000 € de valeur vie ; mais le dernier palier coûte 120 000 € par compte en plus, et fait perdre
 * de l'argent. Et sur la seule marge de la première année, on s'arrêterait trop tôt.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, cac-par-canal, le-canal-le-moins-cher, l-entonnoir (la formule est au repère ou
 *     dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) :
 *     predire-les-rendez-vous puis les-rendez-vous-au-curseur (les rendez-vous de la prospection, le
 *     budget que ses comptes justifient face à ce qu'elle coûte) avant les-rendez-vous-qu-il-faut ;
 *     predire-le-budget puis le-laboratoire-de-la-campagne (budget, taux de transformation des devis,
 *     et la valeur d'un compte à choisir : marge de la première année, valeur vie actualisée ou simple ;
 *     avec le graphique de la valeur créée, du budget et du gain) avant le-compte-en-plus ;
 *   · autonome : les-rendez-vous-qu-il-faut, les-paliers (ni formule ni chiffres donnés ; le calcul
 *     de la correction montre le chemin) ;
 *   · expert : le-compte-en-plus (le coût marginal), le-dernier-palier-au-curseur (la valeur d'un
 *     compte qui ferait payer le dernier palier), mieux-transformer (une variante chiffrée, 30 % des
 *     devis signés), jusqu-ou (le jugement, contre la moyenne et contre la marge d'un an) ; puis la
 *     synthèse.
 */

/** Les bornes du curseur des rendez-vous de la prospection. */
export const RENDEZ_VOUS_DU_CURSEUR = { min: 40, max: 100 } as const;

/** Les bornes du curseur de la valeur d'un compte, en milliers d'euros. */
export const VALEUR_DU_CURSEUR = { min: 40, max: 160 } as const;

/** Les leviers du laboratoire : le budget de la campagne (euros) et le taux de transformation des devis (%). */
export const LEVIERS_DE_LA_CAMPAGNE = {
  budget: { min: 0, max: 48_000, pas: 2_000 },
  transformation: { min: 10, max: 40, pas: 5 },
} as const;

/** Le levier à choix du laboratoire : ce que vaut un compte gagné. */
export const VALEUR_D_UN_COMPTE = { premiereAnnee: 0, actualisee: 1, simple: 2 } as const;

/**
 * LA VARIANTE, hypothèse du cours : une équipe qui signerait 30 % de ses devis au lieu de 20 % (un
 * meilleur suivi des propositions). La courbe des contacts, les rendez-vous et les devis ne changent
 * pas.
 */
export const TRANSFORMATION_VARIANTE = 0.3;

/** Le coût d'acquisition se lit sur les canaux de conquête du cabinet du cours, ATLAS CONSEIL. */
export const ENTREPRISES_DE_L_ACQUISITION: readonly string[] = ENTREPRISES_DE_LA_VALEUR;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number, d = 1) => `${(Math.round(x * 100 * 10 ** d) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** « d'ATLAS CONSEIL », « de NOVA » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** L'acquisition du cabinet : tout ce que le chapitre et son cas demandent. */
export function acquisitionDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const v = valeurDesComptes(c);
  const e = entonnoir(f);
  const canal = (code: CodeDeCanal) => e.canaux.find((k) => k.code === code)!;
  const prospection = canal("prospection");
  const digital = canal("digital");
  const apporteurs = canal("apporteurs");
  const total = e.total;
  // La campagne digitale : 1 contact sur (contacts ÷ contrats) devient un compte, au taux de N.
  const contactsParCompte = digital.contacts / digital.contrats;
  const comptesA = (budget: number, transformation = digital.tauxDeTransformationDesDevis) =>
    (contactsDeLaCampagne(f, budget) * digital.devis * transformation) / digital.contacts;
  const paliers = f.courbeDeLaCampagne.map((p) => {
    const comptes = auCentime(comptesA(p.budget));
    return { budget: p.budget, contacts: p.contacts, comptes, cacMoyen: comptes > 0 ? auCentime(p.budget / comptes) : null, gain: auCentime(comptes * v.simple - p.budget) };
  });
  const supplements = paliers.slice(1).map((p, i) => {
    const avant = paliers[i]!;
    const comptes = auCentime(p.comptes - avant.comptes);
    const budget = p.budget - avant.budget;
    return { de: avant.budget, a: p.budget, budget, comptes, cacMarginal: auCentime(budget / comptes), gain: auCentime(comptes * v.simple - budget) };
  });
  const dernier = supplements.at(-1)!;
  const avantDernier = supplements.at(-2)!;
  const meilleur = paliers.reduce((a, b) => (b.gain > a.gain ? b : a));
  // La prospection : les rendez-vous qu'il lui faudrait pour coûter la moyenne du cabinet.
  const cacVise = total.cac;
  const comptesParRendezVous = prospection.contrats / prospection.rendezVous;
  const comptesVises = auCentime(prospection.cout / cacVise);
  const rendezVousNecessaires = Math.ceil((prospection.cout * prospection.rendezVous) / (prospection.contrats * cacVise) - 1e-9);
  // La valeur d'un compte qui ferait payer le dernier palier : son coût marginal.
  const valeurQuiPaieLeDernier = Math.ceil(dernier.budget / dernier.comptes / 1_000 - 1e-9);
  // La variante : 30 % des devis signés.
  const comptesVariante = (budget: number) => auCentime(comptesA(budget, TRANSFORMATION_VARIANTE));
  const dernierVariante = {
    avant: comptesVariante(dernier.de),
    apres: comptesVariante(dernier.a),
  };
  const comptesEnPlusVariante = auCentime(dernierVariante.apres - dernierVariante.avant);
  // La campagne de N, et sur la seule marge de la première année.
  const parLaPremiereAnnee = paliers.reduce((a, b) => (b.comptes * v.m.marge - b.budget > a.comptes * v.m.marge - a.budget ? b : a));
  return {
    f,
    v,
    e,
    prospection,
    digital,
    apporteurs,
    total,
    contactsParCompte,
    paliers,
    supplements,
    dernier,
    avantDernier,
    meilleur,
    budgetDeN: digital.cout,
    cacVise,
    comptesParRendezVous,
    comptesVises,
    rendezVousNecessaires,
    valeurQuiPaieLeDernier,
    dernierVariante,
    comptesEnPlusVariante,
    cacMarginalVariante: auCentime(dernier.budget / comptesEnPlusVariante),
    gainDuDernierVariante: auCentime(comptesEnPlusVariante * v.simple - dernier.budget),
    parLaPremiereAnnee,
    comptesA,
  };
}

export type AcquisitionDuCabinet = ReturnType<typeof acquisitionDuCabinet>;

/**
 * @deprecated Gardé pour les fichiers qui lisaient la campagne de l'arène (tests/cours/commissions-des-partenaires.test.ts
 * lit `campagne(cas).cac`) : le coût d'acquisition d'un compte du cabinet du cours, 15 000 €, lu sur la fiche
 * d'ATLAS CONSEIL quelle que soit l'entreprise. Préférer `acquisitionDuCabinet`.
 */
export function campagne(c: Pick<Cas, "code">) {
  const x = acquisitionDuCabinet({ code: CABINETS_DU_COURS[c.code] ? c.code : ATLAS_CONSEIL.code });
  return { ...x, cac: x.total.cac };
}

/** La valeur d'un compte gagné, selon la mesure choisie au laboratoire. */
function valeurDUnCompte(x: AcquisitionDuCabinet, code: number) {
  return code === VALEUR_D_UN_COMPTE.premiereAnnee ? x.v.m.marge : code === VALEUR_D_UN_COMPTE.actualisee ? x.v.actualisee : x.v.simple;
}

/** La campagne pour un budget, un taux de transformation des devis (en %) et une mesure de la valeur d'un compte quelconques. */
export function laboratoireDeLaCampagne(x: AcquisitionDuCabinet, budget: number, transformationEnPct: number, valeur: number) {
  const pas = LEVIERS_DE_LA_CAMPAGNE.budget.pas;
  const valeurDUn = valeurDUnCompte(x, valeur);
  const comptesDe = (b: number) => x.comptesA(b, transformationEnPct / 100);
  const gainDe = (b: number) => comptesDe(b) * valeurDUn - b;
  const comptes = comptesDe(budget);
  const meilleurGain = Math.max(...Array.from({ length: LEVIERS_DE_LA_CAMPAGNE.budget.max / pas + 1 }, (_, i) => gainDe(i * pas)));
  return {
    contacts: auCentime(contactsDeLaCampagne(x.f, budget)),
    comptes: auCentime(comptes),
    valeurDUn,
    valeurCreee: auCentime(comptes * valeurDUn),
    cacMoyen: comptes > 0 ? auCentime(budget / comptes) : 0,
    gain: auCentime(gainDe(budget)),
    pasSuivant: auCentime(gainDe(budget + pas) - gainDe(budget)),
    pasPrecedent: budget >= pas ? auCentime(gainDe(budget) - gainDe(budget - pas)) : 0,
    meilleurGain: auCentime(meilleurGain),
  };
}

/** Les quatre canaux de N, de l'entonnoir au contrat : le document de départ. */
function tableauDesCanaux(x: AcquisitionDuCabinet): TableauDeDonnees {
  return {
    titre: `Les canaux de conquête ${dE(x.f.entreprise)}, année N`,
    colonnes: ["Contacts", "Rendez-vous", "Devis", "Contrats", "Coût"],
    lignes: x.e.canaux.map((k) => ({ libelle: k.nom, valeurs: [qte(k.contacts), qte(k.rendezVous), qte(k.devis), qte(k.contrats), eur(k.cout)] })),
  };
}

/** La courbe de la campagne digitale : le document des paliers. */
function tableauDeLaCourbe(x: AcquisitionDuCabinet): TableauDeDonnees {
  return {
    titre: "La campagne digitale, selon son budget de l'année",
    colonnes: x.paliers.map((p) => eur(p.budget)),
    lignes: [{ libelle: "Contacts amenés", valeurs: x.paliers.map((p) => qte(p.contacts)) }],
  };
}

export const COUT_D_ACQUISITION: Chapitre = {
  code: "cout-d-acquisition",
  parcours: "ndrc",
  palier: 3,
  blocs: [
    "BTS NDRC Bloc 2 · Relation client à distance et digitalisation",
    "Bac pro MCV Bloc 4B · Prospecter et valoriser l'offre commerciale",
    "BUT TC · Gérer une activité digitale",
  ],
  titre: "Le coût d'acquisition et la rentabilité d'une campagne",
  accroche:
    "Chaque canal de conquête amène des comptes, à son prix. Ce que coûte un compte gagné, ce que dit l'entonnoir des rendez-vous aux contrats, et jusqu'où pousser une campagne quand le compte en plus coûte de plus en plus cher.",
  objectifs: [
    "Calculer le coût d'acquisition d'un compte, canal par canal",
    "Lire un entonnoir de conquête et calculer le taux de transformation des devis",
    "Retrouver les rendez-vous qu'il faut pour qu'un canal coûte la moyenne",
    "Distinguer le coût d'acquisition moyen et celui du compte en plus",
    "Choisir un budget sur ce que rapporte le dernier euro, face à la valeur vie d'un compte",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_ACQUISITION, pourquoi: POURQUOI_LE_CABINET },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Les canaux qui gagnent des comptes",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      tableau: (c) => tableauDesCanaux(acquisitionDuCabinet(c)),
      texte: (c) => {
        const x = acquisitionDuCabinet(c);
        const salons = x.f.canaux.find((k) => k.code === "salons")!;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}, le cabinet qui vend ses journées de conseil à des entreprises. En N, il a gagné ${qte(x.total.contrats)} comptes neufs par ${qte(x.e.canaux.length)} canaux de conquête : la prospection téléphonique et les visites, les salons professionnels, une campagne digitale et des apporteurs d'affaires. Chaque canal mène ses contacts, marche après marche, jusqu'au contrat : c'est l'entonnoir.`,
          `La simulation suppose trois choses. Le coût d'un canal compte le temps des commerciaux qui le font vivre : le commercial de la conquête, à plein temps sur la prospection, et une part du temps des commerciaux seniors sur les salons (${eur(salons.cout)} en tout pour les salons). Un contrat signé est un compte gagné. Et un compte gagné vaut ce qu'il laissera sur sa vie de client : ${eur(x.v.simple)} en valeur simple, ${eur(x.v.actualisee)} actualisé, comme l'a calculé le chapitre de la valeur d'un client.`,
        ];
      },
      repere: () => "Coût d'acquisition = coût du canal ÷ comptes gagnés. Taux de transformation des devis = contrats signés ÷ devis remis.",
    },
    {
      id: "cac-par-canal",
      objectifs: [0],
      type: "montants",
      titre: "Ce que coûte un compte, canal par canal",
      notions: ["customer_acquisition_cost"],
      question: () => "Calculez le coût d'acquisition d'un compte pour chaque canal (son coût ÷ ses contrats), puis pour le cabinet tout entier (le coût de tous les canaux ÷ tous les contrats).",
      champs: (c) => {
        const x = acquisitionDuCabinet(c);
        return [
          ...x.e.canaux.map((k) => ({ libelle: `Coût d'acquisition, ${k.nom.toLowerCase()}`, attendu: k.cac, calcul: `${eur(k.cout)} ÷ ${qte(k.contrats)} = ${eur(k.cac)}` })),
          { libelle: "Coût d'acquisition du cabinet", attendu: x.total.cac, calcul: `${eur(x.total.cout)} ÷ ${qte(x.total.contrats)} = ${eur(x.total.cac)}` },
        ];
      },
      explication: (c) => {
        const x = acquisitionDuCabinet(c);
        return [
          `Un compte coûte ${eur(x.total.cac)} en moyenne, de ${eur(x.apporteurs.cac)} par l'apporteur à ${eur(Math.max(...x.e.canaux.map((k) => k.cac)))} par les salons. Face à un compte qui vaut ${eur(x.v.actualisee)} actualisé, tous les canaux paient ; la question est de savoir où mettre l'euro suivant.`,
        ];
      },
    },
    {
      id: "le-canal-le-moins-cher",
      objectifs: [0],
      type: "choix",
      titre: "Le canal le moins cher",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        return `Le directeur ${dE(x.f.entreprise)} veut mettre l'essentiel du budget de conquête sur le canal le moins cher. Lequel est-ce, et qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = acquisitionDuCabinet(c);
        return [
          {
            texte: "L'apporteur, mais il ne présente que quelques entreprises par an",
            juste: true,
            retour: `Oui : ${eur(x.apporteurs.cac)} par compte, car il ne présente que des entreprises déjà intéressées, et ${pct(x.apporteurs.tauxDeTransformationDesDevis, 0)} de ses devis sont signés. Mais il n'a fait que ${qte(x.apporteurs.contacts)} présentations en N : on ne peut pas y mettre plus de budget, il ne rapporte pas plus de contacts.`,
          },
          {
            texte: `La campagne digitale : ${eur(x.digital.coutParContact)} par contact, le moins cher`,
            juste: false,
            retour: `Non : le contact digital est le moins cher, mais un sur ${qte(x.contactsParCompte)} seulement devient un compte. Par compte, la campagne coûte ${eur(x.digital.cac)}, l'apporteur ${eur(x.apporteurs.cac)}.`,
          },
          {
            texte: "La prospection : c'est elle qui gagne le plus de comptes",
            juste: false,
            retour: `Non : elle gagne ${qte(x.prospection.contrats)} comptes, mais à ${eur(x.prospection.cac)} l'un. Gagner le plus de comptes n'est pas les gagner au meilleur prix.`,
          },
        ];
      },
    },
    {
      id: "l-entonnoir",
      objectifs: [1],
      type: "montants",
      titre: "L'entonnoir et le taux de transformation des devis",
      notions: ["conversion_rate", "customer_acquisition_cost"],
      tableau: (c) => tableauDesCanaux(acquisitionDuCabinet(c)),
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        const d = x.digital;
        return `Pour la campagne digitale (${qte(d.contacts)} contacts, ${qte(d.rendezVous)} rendez-vous, ${qte(d.devis)} devis, ${qte(d.contrats)} contrats), calculez le taux de rendez-vous (rendez-vous ÷ contacts), le taux de devis (devis ÷ rendez-vous) et le taux de transformation des devis (contrats ÷ devis), en pourcentage, au centième. Puis le taux de transformation des devis du cabinet, tous canaux confondus (${qte(x.total.contrats)} contrats pour ${qte(x.total.devis)} devis).`;
      },
      champs: (c) => {
        const x = acquisitionDuCabinet(c);
        const d = x.digital;
        return [
          { libelle: "Taux de rendez-vous de la campagne (%)", attendu: auCentime(d.tauxDeRendezVous * 100), calcul: `${qte(d.rendezVous)} ÷ ${qte(d.contacts)} = ${pct(d.tauxDeRendezVous, 2)}`, tolerance: 0.05 },
          { libelle: "Taux de devis de la campagne (%)", attendu: auCentime(d.tauxDeDevis * 100), calcul: `${qte(d.devis)} ÷ ${qte(d.rendezVous)} = ${pct(d.tauxDeDevis, 2)}`, tolerance: 0.05 },
          { libelle: "Taux de transformation des devis de la campagne (%)", attendu: auCentime(d.tauxDeTransformationDesDevis * 100), calcul: `${qte(d.contrats)} ÷ ${qte(d.devis)} = ${pct(d.tauxDeTransformationDesDevis, 2)}`, tolerance: 0.05 },
          { libelle: "Taux de transformation des devis du cabinet (%)", attendu: auCentime(x.total.tauxDeTransformationDesDevis * 100), calcul: `${qte(x.total.contrats)} ÷ ${qte(x.total.devis)} = ${pct(x.total.tauxDeTransformationDesDevis, 2)}`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const x = acquisitionDuCabinet(c);
        const d = x.digital;
        return [
          `Sur ${qte(d.contacts)} contacts, la campagne obtient ${qte(d.rendezVous)} rendez-vous, ${qte(d.devis)} devis et ${qte(d.contrats)} contrats : un contact sur ${qte(x.contactsParCompte)} devient un compte. Chaque marche multiplie la précédente ; le taux de transformation des devis est la dernière, celle où le commercial signe ou perd une proposition déjà chiffrée.`,
          `Sur l'année, le cabinet signe ${pct(x.total.tauxDeTransformationDesDevis, 2)} de ses devis : ${pct(x.apporteurs.tauxDeTransformationDesDevis, 0)} pour l'apporteur, qui présente des entreprises déjà intéressées, ${pct(x.prospection.tauxDeTransformationDesDevis, 0)} pour la prospection.`,
        ];
      },
    },
    {
      id: "predire-les-rendez-vous",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur les rendez-vous",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        return `Avant de calculer, pariez. La prospection coûte ${eur(x.prospection.cac)} par compte, le cabinet ${eur(x.cacVise)} en moyenne. À coût et taux inchangés, pour descendre à ${eur(x.cacVise)}, elle devrait obtenir…`;
      },
      options: (c) => {
        const x = acquisitionDuCabinet(c);
        const voir = "Faites varier ses rendez-vous à l'étape suivante : le curseur montre combien il en faut.";
        const enPlus = x.rendezVousNecessaires / x.prospection.rendezVous - 1;
        const commeLeCout = 1 - x.cacVise / x.prospection.cac;
        return [
          { texte: `${pct(enPlus, 0)} de rendez-vous en plus`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${pct(commeLeCout, 0)} de rendez-vous en plus, comme la baisse du coût`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Autant de rendez-vous : seul le taux de transformation compte", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-rendez-vous-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Les rendez-vous de la prospection",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        return `La prospection coûte ${eur(x.prospection.cout)} par an, quoi qu'elle obtienne. Faites varier ses rendez-vous de ${qte(RENDEZ_VOUS_DU_CURSEUR.min)} à ${qte(RENDEZ_VOUS_DU_CURSEUR.max)}, ses taux de devis et de transformation restant ceux de N. Une droite donne ce que ses comptes justifient de dépenser, à ${eur(x.cacVise)} le compte ; l'autre, ce qu'elle coûte. Placez le curseur sur le plus petit nombre de rendez-vous où elle coûte au plus la moyenne, puis validez.`;
      },
      grandeur: () => ({ libelle: "Rendez-vous de la prospection", unite: "rendez-vous" }),
      cible: (c) => ({ attendu: acquisitionDuCabinet(c).rendezVousNecessaires, min: RENDEZ_VOUS_DU_CURSEUR.min, max: RENDEZ_VOUS_DU_CURSEUR.max }),
      zones: ["Sous le coût moyen", "Au-dessus du coût moyen"],
      rates: () => ({
        dessous: "À cette position, un compte de la prospection coûte encore plus que la moyenne du cabinet.",
        dessus: "Moins de rendez-vous suffiraient : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les rendez-vous",
      lecture: (c, r) => {
        const x = acquisitionDuCabinet(c);
        const comptes = r * x.comptesParRendezVous;
        const justifie = (r * x.prospection.contrats * x.cacVise) / x.prospection.rendezVous;
        return [
          { libelle: "Budget que justifient ses comptes", montant: auCentime(justifie) },
          { libelle: "Coût de la prospection", montant: x.prospection.cout },
          { libelle: "Coût d'acquisition d'un compte de la prospection", montant: auCentime(x.prospection.cout / comptes) },
          { libelle: "Budget justifié moins coût du canal", montant: auCentime(justifie - x.prospection.cout), fort: true },
        ];
      },
      droites: (c) => {
        const x = acquisitionDuCabinet(c);
        return {
          produit: (r) => (r * x.prospection.contrats * x.cacVise) / x.prospection.rendezVous,
          cout: () => x.prospection.cout,
          libelles: [`Ce que justifient ses comptes, à ${eur(x.cacVise)} l'un`, "Coût de la prospection"],
        };
      },
      explication: (c) => {
        const x = acquisitionDuCabinet(c);
        return [
          `Il faut ${qte(x.rendezVousNecessaires)} rendez-vous, ${qte(x.rendezVousNecessaires - x.prospection.rendezVous)} de plus qu'en N. Le coût du canal ne bouge pas : chaque rendez-vous en plus le divise sur plus de comptes. Un rendez-vous ne vaut que ce qu'il mène à signer : ${pct(x.prospection.tauxDeDevis, 0)} deviennent des devis, ${pct(x.prospection.tauxDeTransformationDesDevis, 0)} de ces devis des contrats.`,
          "L'étape suivante refait ce chemin par le calcul, marche par marche.",
        ];
      },
    },
    {
      id: "les-rendez-vous-qu-il-faut",
      objectifs: [2],
      type: "montants",
      titre: "Les rendez-vous qu'il faut",
      notions: ["conversion_rate", "customer_acquisition_cost"],
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        return `Sans formule cette fois. Pour que la prospection coûte ${eur(x.cacVise)} par compte, calculez les comptes qu'elle gagne pour 100 rendez-vous, les comptes qu'elle devrait gagner dans l'année, puis les rendez-vous qu'il lui faudrait.`;
      },
      champs: (c) => {
        const x = acquisitionDuCabinet(c);
        const p = x.prospection;
        return [
          {
            libelle: "Comptes gagnés pour 100 rendez-vous",
            attendu: auCentime(x.comptesParRendezVous * 100),
            calcul: `100 × ${pct(p.tauxDeDevis, 0)} de devis × ${pct(p.tauxDeTransformationDesDevis, 0)} de devis signés = ${qte(auCentime(x.comptesParRendezVous * 100))} comptes`,
            tolerance: 0.05,
          },
          { libelle: "Comptes à gagner dans l'année", attendu: x.comptesVises, calcul: `${eur(p.cout)} ÷ ${eur(x.cacVise)} = ${qte(x.comptesVises)} comptes`, tolerance: 0.05 },
          {
            libelle: "Rendez-vous nécessaires",
            attendu: x.rendezVousNecessaires,
            calcul: `${qte(x.comptesVises)} ÷ ${qte(auCentime(x.comptesParRendezVous * 100))} × 100 = ${qte(x.rendezVousNecessaires)} rendez-vous`,
          },
        ];
      },
      explication: (c) => {
        const x = acquisitionDuCabinet(c);
        return [
          `Un coût d'acquisition se lit à l'envers dans l'entonnoir : ${eur(x.prospection.cout)} ÷ ${eur(x.cacVise)} donne les comptes à gagner, que les taux de chaque marche ramènent en devis, puis en rendez-vous. Le commercial peut agir sur chaque marche : plus de rendez-vous, plus de devis par rendez-vous, ou plus de devis signés.`,
        ];
      },
    },
    {
      id: "les-paliers",
      objectifs: [3],
      type: "montants",
      titre: "La campagne, palier par palier",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      tableau: (c) => tableauDeLaCourbe(acquisitionDuCabinet(c)),
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        return `La simulation du cours fige ce que la campagne digitale amènerait de contacts à ${qte(x.paliers.length)} budgets de l'année, de zéro au double du budget de N (${eur(x.budgetDeN)}) ; entre deux paliers, la courbe est une droite, et au-delà du dernier, elle ne monte plus. Les contacts suivent l'entonnoir de la campagne de N. Calculez les comptes attendus à ${eur(x.paliers[1]!.budget)}, à ${eur(x.paliers[3]!.budget)} et à ${eur(x.paliers[4]!.budget)}, au centième, puis le coût d'acquisition moyen au dernier palier.`;
      },
      champs: (c) => {
        const x = acquisitionDuCabinet(c);
        const [, a, , b, d] = x.paliers;
        return [
          ...[a!, b!, d!].map((p) => ({ libelle: `Comptes attendus à ${eur(p.budget)}`, attendu: p.comptes, calcul: `${qte(p.contacts)} ÷ ${qte(x.contactsParCompte)} = ${qte(p.comptes)}`, tolerance: 0.05 })),
          { libelle: "Coût d'acquisition moyen au dernier palier", attendu: d!.cacMoyen!, calcul: `${eur(d!.budget)} ÷ ${qte(d!.comptes)} = ${eur(d!.cacMoyen!)}` },
        ];
      },
      explication: (c) => {
        const x = acquisitionDuCabinet(c);
        const moyens = x.paliers.slice(1).map((p) => eur(p.cacMoyen!));
        return [
          `Les comptes gagnés sont des comptes attendus : ${qte(x.paliers[3]!.comptes)} comptes, c'est une moyenne, ce que la campagne gagnerait en moyenne sur bien des années semblables. Le coût moyen monte d'un palier à l'autre : ${moyens.join(", ")}. Il reste partout bien sous la valeur vie d'un compte, ${eur(x.v.simple)}.`,
          "Regardez ce qu'amène chaque tranche de budget : les contacts continuent d'arriver, mais de moins en moins vite. La campagne touche d'abord les entreprises les plus faciles à convaincre.",
        ];
      },
    },
    {
      id: "predire-le-budget",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le budget",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        const d = x.paliers.at(-1)!;
        return `Avant de calculer, pariez. Au dernier palier, ${eur(d.budget)}, un compte coûte ${eur(d.cacMoyen!)} en moyenne, et il vaut ${eur(x.v.simple)}. Faut-il pousser la campagne jusque-là ?`;
      },
      options: () => {
        const voir = "Le laboratoire suivant trace la valeur créée, le budget et le gain, palier par palier : cherchez où le gain cesse de monter.";
        return [
          { texte: "Pas forcément : il faut voir ce que coûte le compte en plus", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Oui : chaque compte coûte bien moins qu'il ne vaut", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : il faut rester au budget de N, qui a fait ses preuves", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-campagne",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de la campagne",
      notions: ["customer_acquisition_cost", "customer_lifetime_value", "conversion_rate"],
      question: () =>
        "Faites varier le budget de la campagne et le taux de transformation des devis, et choisissez ce que vaut un compte gagné : sa marge de la première année, sa valeur vie actualisée, ou sa valeur vie simple. Le tableau suit les comptes attendus, leur coût moyen, ce que rapporteraient les euros suivants et le gain de la campagne.",
      leviers: (c) => {
        const x = acquisitionDuCabinet(c);
        const l = LEVIERS_DE_LA_CAMPAGNE;
        return [
          { code: "budget", libelle: "Budget de la campagne", unite: "€", min: l.budget.min, max: l.budget.max, pas: l.budget.pas, depart: x.budgetDeN },
          {
            code: "transformation",
            libelle: "Devis signés",
            unite: "%",
            min: l.transformation.min,
            max: l.transformation.max,
            pas: l.transformation.pas,
            depart: auCentime(x.digital.tauxDeTransformationDesDevis * 100),
          },
          {
            code: "valeur",
            libelle: "Valeur d'un compte gagné",
            unite: "",
            min: VALEUR_D_UN_COMPTE.premiereAnnee,
            max: VALEUR_D_UN_COMPTE.simple,
            pas: 1,
            depart: VALEUR_D_UN_COMPTE.simple,
            choix: [
              { valeur: VALEUR_D_UN_COMPTE.premiereAnnee, libelle: `Marge de la première année, ${eur(x.v.m.marge)}` },
              { valeur: VALEUR_D_UN_COMPTE.actualisee, libelle: `Valeur vie actualisée, ${eur(x.v.actualisee)}` },
              { valeur: VALEUR_D_UN_COMPTE.simple, libelle: `Valeur vie simple, ${eur(x.v.simple)}` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = acquisitionDuCabinet(c);
        const l = laboratoireDeLaCampagne(x, p.budget!, p.transformation!, p.valeur!);
        const d = laboratoireDeLaCampagne(x, x.budgetDeN, x.digital.tauxDeTransformationDesDevis * 100, VALEUR_D_UN_COMPTE.simple);
        const pas = qte(LEVIERS_DE_LA_CAMPAGNE.budget.pas);
        return [
          { libelle: "Contacts amenés", montant: l.contacts, reference: d.contacts, unite: "contacts" },
          { libelle: "Comptes attendus", montant: l.comptes, reference: d.comptes, unite: "comptes" },
          { libelle: "Coût d'acquisition moyen", montant: l.cacMoyen, reference: d.cacMoyen },
          { libelle: "Valeur créée par les comptes gagnés", montant: l.valeurCreee, reference: d.valeurCreee },
          { libelle: `Ce qu'ont rapporté les ${pas} derniers euros`, montant: l.pasPrecedent, reference: d.pasPrecedent, effet: true },
          { libelle: `Ce que rapporteraient ${pas} € de plus`, montant: l.pasSuivant, reference: d.pasSuivant, effet: true },
          { libelle: "Gain de la campagne", montant: l.gain, reference: d.gain, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = acquisitionDuCabinet(c);
        const lab = (p: Readonly<Record<string, number>>) => laboratoireDeLaCampagne(x, p.budget!, p.transformation!, p.valeur!);
        return {
          levier: "budget",
          courbes: [
            { libelle: "Valeur créée par les comptes gagnés", valeur: (p) => lab(p).valeurCreee },
            { libelle: "Budget de la campagne", valeur: (p) => p.budget! },
            { libelle: "Gain de la campagne", valeur: (p) => lab(p).gain },
          ],
        };
      },
      defi: (c) => {
        const x = acquisitionDuCabinet(c);
        const pas = qte(LEVIERS_DE_LA_CAMPAGNE.budget.pas);
        return {
          consigne: "Trouvez le budget où le dernier euro ne rapporte plus : celui qui donne à la campagne le plus grand gain.",
          atteint: (p) => {
            const l = laboratoireDeLaCampagne(x, p.budget!, p.transformation!, p.valeur!);
            return l.gain >= l.meilleurGain - 0.005;
          },
          indice: (p) => {
            const l = laboratoireDeLaCampagne(x, p.budget!, p.transformation!, p.valeur!);
            return l.pasSuivant > 0
              ? `${pas} € de plus rapporteraient encore ${eur(l.pasSuivant)} une fois payés : montez le budget.`
              : `Les ${pas} derniers euros ont fait perdre ${eur(-l.pasPrecedent)} : baissez le budget.`;
          },
          solution: { budget: x.meilleur.budget, transformation: auCentime(x.digital.tauxDeTransformationDesDevis * 100), valeur: VALEUR_D_UN_COMPTE.simple },
        };
      },
      explication: (c, p) => {
        const x = acquisitionDuCabinet(c);
        const l = laboratoireDeLaCampagne(x, p.budget!, p.transformation!, p.valeur!);
        const meilleurPour = (transformation: number, valeur: number) => {
          let b = 0;
          for (let i = 0; i <= LEVIERS_DE_LA_CAMPAGNE.budget.max; i += LEVIERS_DE_LA_CAMPAGNE.budget.pas) if (laboratoireDeLaCampagne(x, i, transformation, valeur).gain > laboratoireDeLaCampagne(x, b, transformation, valeur).gain + 0.005) b = i;
          return b;
        };
        const t = auCentime(x.digital.tauxDeTransformationDesDevis * 100);
        return [
          `À ${eur(p.budget!)}, la campagne gagne ${eur(l.gain)} : les derniers euros ont encore rapporté plus qu'ils n'ont coûté, les suivants rapporteraient moins. Le coût moyen d'un compte, ${eur(l.cacMoyen)}, ne dit rien de cela : c'est le compte en plus qui décide.`,
          `Au taux de N, le meilleur budget est ${eur(meilleurPour(t, VALEUR_D_UN_COMPTE.simple))} à la valeur vie simple, et encore ${eur(meilleurPour(t, VALEUR_D_UN_COMPTE.actualisee))} actualisée ; sur la seule marge de la première année, on s'arrêterait à ${eur(meilleurPour(t, VALEUR_D_UN_COMPTE.premiereAnnee))}. Avec ${pct(TRANSFORMATION_VARIANTE, 0)} de devis signés, il passe à ${eur(meilleurPour(TRANSFORMATION_VARIANTE * 100, VALEUR_D_UN_COMPTE.simple))} : mieux transformer rend payant un palier de plus.`,
        ];
      },
    },
    {
      id: "le-compte-en-plus",
      objectifs: [3],
      type: "montants",
      titre: "Le coût du compte en plus",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        const [a, b] = [x.avantDernier, x.dernier];
        return `Passer de ${eur(a.de)} à ${eur(a.a)}, puis de ${eur(b.de)} à ${eur(b.a)}, coûte chaque fois ${eur(b.budget)} de plus. Calculez ce que coûte chaque compte en plus de ces deux paliers (budget en plus ÷ comptes en plus), puis le gain du dernier palier, à la valeur vie simple (comptes en plus × valeur vie − budget en plus ; négatif s'il fait perdre).`;
      },
      champs: (c) => {
        const x = acquisitionDuCabinet(c);
        const [a, b] = [x.avantDernier, x.dernier];
        return [
          { libelle: `Coût du compte en plus, de ${eur(a.de)} à ${eur(a.a)}`, attendu: a.cacMarginal, calcul: `${eur(a.budget)} ÷ (${qte(x.paliers[3]!.comptes)} − ${qte(x.paliers[2]!.comptes)}) = ${eur(a.budget)} ÷ ${qte(a.comptes)} = ${eur(a.cacMarginal)}` },
          { libelle: `Coût du compte en plus, de ${eur(b.de)} à ${eur(b.a)}`, attendu: b.cacMarginal, calcul: `${eur(b.budget)} ÷ (${qte(x.paliers[4]!.comptes)} − ${qte(x.paliers[3]!.comptes)}) = ${eur(b.budget)} ÷ ${qte(b.comptes)} = ${eur(b.cacMarginal)}` },
          { libelle: "Gain du dernier palier", attendu: b.gain, calcul: `${qte(b.comptes)} × ${eur(x.v.simple)} − ${eur(b.budget)} = ${eur(b.gain)}` },
        ];
      },
      explication: (c) => {
        const x = acquisitionDuCabinet(c);
        const marginaux = x.supplements.map((s) => eur(s.cacMarginal));
        return [
          `Le compte en plus coûte ${marginaux.join(", puis ")} d'un palier à l'autre, quand le coût moyen ne monte que jusqu'à ${eur(x.paliers.at(-1)!.cacMoyen!)}. Le dernier palier amène ${qte(x.dernier.comptes)} compte pour ${eur(x.dernier.budget)} : il fait perdre ${eur(-x.dernier.gain)}, même à la valeur vie simple.`,
          `Le meilleur budget est donc ${eur(x.meilleur.budget)}, là où le compte en plus coûte encore moins qu'il ne vaut (${eur(x.avantDernier.cacMarginal)}), et où le suivant coûterait plus (${eur(x.dernier.cacMarginal)}).`,
        ];
      },
    },
    {
      id: "le-dernier-palier-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "Ce que devrait valoir un compte",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        return `Le dernier palier coûte ${eur(x.dernier.budget)} et amène ${qte(x.dernier.comptes)} compte. Faites varier la valeur d'un compte gagné, de ${qte(VALEUR_DU_CURSEUR.min)} à ${qte(VALEUR_DU_CURSEUR.max)} milliers d'euros. Placez le curseur sur la plus petite valeur où ce palier paie, puis validez.`;
      },
      grandeur: () => ({ libelle: "Valeur d'un compte gagné", unite: "milliers d'euros" }),
      cible: (c) => ({ attendu: acquisitionDuCabinet(c).valeurQuiPaieLeDernier, min: VALEUR_DU_CURSEUR.min, max: VALEUR_DU_CURSEUR.max }),
      zones: ["Le dernier palier paie", "Le dernier palier fait perdre"],
      rates: () => ({
        dessous: "À cette valeur, les comptes du dernier palier valent moins que son budget.",
        dessus: "Une valeur plus faible suffirait déjà : cherchez la plus petite.",
      }),
      montrer: "Montrer la valeur",
      lecture: (c, k) => {
        const x = acquisitionDuCabinet(c);
        const valeur = auCentime(x.dernier.comptes * k * 1_000);
        return [
          { libelle: "Valeur des comptes du dernier palier", montant: valeur },
          { libelle: "Budget du dernier palier", montant: x.dernier.budget },
          { libelle: "Gain du dernier palier", montant: auCentime(valeur - x.dernier.budget), fort: true },
        ];
      },
      droites: (c) => {
        const x = acquisitionDuCabinet(c);
        return {
          produit: (k) => x.dernier.comptes * k * 1_000,
          cout: () => x.dernier.budget,
          libelles: ["Valeur des comptes du dernier palier", "Budget du dernier palier"],
        };
      },
      explication: (c) => {
        const x = acquisitionDuCabinet(c);
        return [
          `Le dernier palier ne paierait que si un compte valait ${eur(x.valeurQuiPaieLeDernier * 1_000)} : exactement le coût du compte en plus. Le coût marginal d'un compte est la valeur qu'il doit avoir pour mériter l'euro qui va le chercher.`,
          `Un compte ${dE(x.f.entreprise)} vaut ${eur(x.v.simple)} en valeur simple et ${eur(x.v.actualisee)} actualisé : bien moins. Pour que ce palier paie, il faudrait que les comptes valent plus, ou qu'ils coûtent moins à signer.`,
        ];
      },
    },
    {
      id: "mieux-transformer",
      objectifs: [1],
      type: "montants",
      titre: "Variante : mieux signer les devis",
      notions: ["conversion_rate", "customer_acquisition_cost"],
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        return `Variante : l'équipe signe ${pct(TRANSFORMATION_VARIANTE, 0)} des devis de la campagne au lieu de ${pct(x.digital.tauxDeTransformationDesDevis, 0)}, la courbe des contacts, les rendez-vous et les devis ne changeant pas. Refaites le dernier palier, de ${eur(x.dernier.de)} à ${eur(x.dernier.a)} : les comptes attendus aux deux budgets, le coût du compte en plus, puis le gain du palier, à la valeur vie simple (négatif s'il fait perdre).`;
      },
      champs: (c) => {
        const x = acquisitionDuCabinet(c);
        const d = x.digital;
        const devisDe = (b: number) => auCentime((contactsDeLaCampagne(x.f, b) * d.devis) / d.contacts);
        return [
          {
            libelle: `Comptes attendus à ${eur(x.dernier.de)}`,
            attendu: x.dernierVariante.avant,
            calcul: `${qte(devisDe(x.dernier.de))} devis × ${pct(TRANSFORMATION_VARIANTE, 0)} = ${qte(x.dernierVariante.avant)}`,
            tolerance: 0.05,
          },
          {
            libelle: `Comptes attendus à ${eur(x.dernier.a)}`,
            attendu: x.dernierVariante.apres,
            calcul: `${qte(devisDe(x.dernier.a))} devis × ${pct(TRANSFORMATION_VARIANTE, 0)} = ${qte(x.dernierVariante.apres)}`,
            tolerance: 0.05,
          },
          { libelle: "Coût du compte en plus du dernier palier", attendu: x.cacMarginalVariante, calcul: `${eur(x.dernier.budget)} ÷ ${qte(x.comptesEnPlusVariante)} = ${eur(x.cacMarginalVariante)}` },
          { libelle: "Gain du dernier palier, variante", attendu: x.gainDuDernierVariante, calcul: `${qte(x.comptesEnPlusVariante)} × ${eur(x.v.simple)} − ${eur(x.dernier.budget)} = ${eur(x.gainDuDernierVariante)}` },
        ];
      },
      explication: (c) => {
        const x = acquisitionDuCabinet(c);
        return [
          `Mieux signer multiplie chaque palier par ${qte(TRANSFORMATION_VARIANTE / x.digital.tauxDeTransformationDesDevis)} : le compte en plus du dernier palier ne coûte plus que ${eur(x.cacMarginalVariante)}, moins que les ${eur(x.v.simple)} qu'il vaut, et le palier rapporte ${eur(x.gainDuDernierVariante)}. Le meilleur budget monte à ${eur(x.dernier.a)}.`,
          "Le budget d'une campagne ne se fixe pas seul : il dépend de ce que l'équipe sait faire des contacts qu'elle amène. Améliorer la dernière marche de l'entonnoir rend payant un euro qui ne l'était pas.",
        ];
      },
    },
    {
      id: "jusqu-ou",
      objectifs: [4],
      type: "choix",
      titre: "Le budget à proposer",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      question: (c) => {
        const x = acquisitionDuCabinet(c);
        return `Les devis se signent toujours à ${pct(x.digital.tauxDeTransformationDesDevis, 0)}. Le directeur demande quel budget donner à la campagne digitale l'an prochain. Que lui proposez-vous ?`;
      },
      options: (c) => {
        const x = acquisitionDuCabinet(c);
        const dernier = x.paliers.at(-1)!;
        const premier = x.paliers[1]!;
        return [
          {
            texte: `${eur(x.meilleur.budget)} : au-delà, le compte en plus coûte plus qu'il ne vaut`,
            juste: true,
            retour: `Oui : jusqu'à ${eur(x.meilleur.budget)}, le compte en plus coûte ${eur(x.avantDernier.cacMarginal)} pour ${eur(x.v.simple)} de valeur vie ; au-delà, ${eur(x.dernier.cacMarginal)}. Le gain y est le plus grand, ${eur(x.meilleur.gain)}, et le budget reste le même à la valeur vie actualisée.`,
          },
          {
            texte: `${eur(x.parLaPremiereAnnee.budget)} : sur la marge de la première année, c'est le meilleur budget`,
            juste: false,
            retour: `Non : un compte ne laisse pas sa marge une seule année, il revient. Sur la seule première année (${eur(x.v.m.marge)}), on s'arrêterait au budget de N, et on renoncerait à des comptes qui valent ${eur(x.v.actualisee)} actualisés.`,
          },
          {
            texte: `${eur(dernier.budget)} : le coût moyen d'un compte, ${eur(dernier.cacMoyen!)}, reste sous sa valeur vie`,
            juste: false,
            retour: `Non : la moyenne mélange les premiers comptes, bon marché, et les derniers, chers. Le dernier palier coûte ${eur(x.dernier.cacMarginal)} par compte en plus, et fait perdre ${eur(-x.dernier.gain)}.`,
          },
          {
            texte: `${eur(premier.budget)} : c'est là que le coût moyen d'un compte est le plus bas`,
            juste: false,
            retour: `Non : à ${eur(premier.budget)}, un compte coûte ${eur(premier.cacMoyen!)} en moyenne, mais on renonce à des paliers qui paient encore. On ne cherche pas le coût le plus bas, on cherche le gain le plus grand.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_acquisition_cost", "customer_lifetime_value", "conversion_rate"],
      tableau: (c) => {
        const x = acquisitionDuCabinet(c);
        return {
          titre: "La campagne digitale, palier par palier",
          colonnes: x.paliers.slice(1).map((p) => eur(p.budget)),
          lignes: [
            { libelle: "Comptes attendus", valeurs: x.paliers.slice(1).map((p) => qte(p.comptes)) },
            { libelle: "Coût d'acquisition moyen", valeurs: x.paliers.slice(1).map((p) => eur(p.cacMoyen!)) },
            { libelle: "Coût du compte en plus", valeurs: x.supplements.map((s) => eur(s.cacMarginal)) },
            { libelle: "Gain, à la valeur vie simple", valeurs: x.paliers.slice(1).map((p) => eur(p.gain)) },
          ],
        };
      },
      texte: (c) => {
        const x = acquisitionDuCabinet(c);
        return [
          `Chez ${x.f.entreprise}, un compte coûte ${eur(x.total.cac)} en moyenne à gagner, de ${eur(x.apporteurs.cac)} à ${eur(Math.max(...x.e.canaux.map((k) => k.cac)))} selon le canal. L'entonnoir dit où il se gagne ou se perd : les rendez-vous, les devis, et la dernière marche, le taux de transformation des devis, ${pct(x.total.tauxDeTransformationDesDevis, 2)} pour le cabinet.`,
          `Sur la campagne digitale, le coût moyen monte peu, mais le compte en plus coûte de plus en plus cher : ${x.supplements.map((s) => eur(s.cacMarginal)).join(", ")}. Le budget se décide là où le dernier euro ne rapporte plus, ${eur(x.meilleur.budget)}, face à ce que vaut un compte sur sa vie, et non sur sa première année.`,
          "Au niveau de l'examen, vous savez calculer un coût d'acquisition par canal et lire un entonnoir, retrouver à rebours les rendez-vous qu'il faut, distinguer le coût moyen du coût du compte en plus, et fixer un budget sur la valeur vie, en sachant ce qu'y change une meilleure transformation des devis.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût d'acquisition moyen = budget ÷ comptes gagnés. Coût du compte en plus = budget en plus ÷ comptes en plus. Un palier paie tant que le coût du compte en plus reste sous la valeur vie d'un compte.",
    },
  ],
};
