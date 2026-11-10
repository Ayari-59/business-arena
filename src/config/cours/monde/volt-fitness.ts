import { aLUnite, arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { CAS_DES_ENTREPRISES } from "./cas-des-entreprises";
import { HAUT_VERDASSE_HANDBALL } from "./haut-verdasse-handball";

/**
 * LE MONDE DU COURS : LA COMMUNICATION DE VOLT FITNESS (les chapitres « Le plan de communication :
 * objectifs, cibles, médias, copy strategy » et « Influence, communauté et e-réputation », mercatique de
 * terminale, questions 3.1 et 3.2).
 *
 * CE QUI VIENT DU CAS FIGÉ DE LA SALLE (cas-des-entreprises.ts) : l'abonnement mensuel hors taxes, le
 * coût variable d'un adhérent par mois (produits d'entretien, énergie, eau, serviettes), les adhérents
 * du mois et ce que la salle dépense en publicité chaque mois. Le Handball Club du Haut-Verdasse vient de
 * sa fiche (haut-verdasse-handball.ts).
 *
 * LES HYPOTHÈSES DES CHAPITRES, dites ici :
 *   · VOLT FITNESS est la salle de sport du Haut-Verdasse ; un adhérent gagné par une campagne reste en
 *     moyenne 4 mois (les « bonnes résolutions » partent vite) ;
 *   · LA CAMPAGNE DE LA RENTRÉE : 3 600 € pour faire s'inscrire de nouveaux adhérents en septembre ;
 *     trois supports proposés, avec leur prix, leurs contacts et la part de ces contacts dans la cible
 *     (les 18 à 35 ans du territoire) ;
 *   · LE PARRAINAGE : 2 500 € par saison pour le logo de la salle sur les maillots du club (parmi ses
 *     partenaires) ; LE MÉCÉNAT : un don de matériel à l'école de handball, sans contrepartie ;
 *   · LA COMMUNAUTÉ EN LIGNE : le compte de la salle sur un réseau social, une campagne sponsorisée
 *     (impressions, clics, contacts laissés pour une séance d'essai, adhésions), la note des avis ;
 *   · LE CAS « L'INFLUENCEUSE DU HAUT-VERDASSE » : une influenceuse sportive locale propose une vidéo.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les taux de clic et de transformation se donnaient au
 * dixième, ils sont à deux décimales ; les clics, les contacts et les adhésions attendues sont des
 * quantités, à l'unité la plus proche, et les adhésions de la vidéo se comptent sur le taux de
 * transformation à deux décimales.
 */

const auCentime = arrondi2;

const SALLE = CAS_DES_ENTREPRISES.fitness!;

/** Un adhérent gagné par une campagne reste en moyenne ces mois (hypothèse des chapitres). */
export const MOIS_D_UN_NOUVEL_ADHERENT = 4;

export const CAMPAGNE_DE_LA_RENTREE = { budget: 3_600, cible: "les 18 à 35 ans du territoire" } as const;

export interface SupportDeLaCampagne {
  code: string;
  nom: string;
  media: string;
  prix: number;
  contacts: number;
  /** La part des contacts qui sont dans la cible (les 18 à 35 ans du territoire). */
  partDansLaCible: number;
}

export const SUPPORTS_DE_LA_RENTREE: readonly SupportDeLaCampagne[] = [
  { code: "abribus", nom: "Les abribus du Haut-Verdasse", media: "Affichage", prix: 1_200, contacts: 40_000, partDansLaCible: 0.3 },
  { code: "radio", nom: "La radio locale, un mois de spots", media: "Radio", prix: 900, contacts: 60_000, partDansLaCible: 0.15 },
  { code: "reseau", nom: "Des publicités sur un réseau social", media: "Internet", prix: 1_500, contacts: 50_000, partDansLaCible: 0.8 },
];

export const PARRAINAGE_DU_CLUB = { montantParSaison: 2_500 } as const;

export type CodeDeMoyen = "media" | "marketing-direct" | "promotion" | "parrainage" | "mecenat" | "evenement";

/** Les actions envisagées pour la rentrée, rangées par moyen de communication (hypothèse du chapitre). */
export const ACTIONS_DE_LA_RENTREE: readonly { libelle: string; moyen: CodeDeMoyen; pourquoi: string }[] = [
  { libelle: "Des affiches dans les abribus du territoire", moyen: "media", pourquoi: "L'affichage est un grand média : un message payé, vu par tous ceux qui passent." },
  { libelle: "Un SMS aux anciens adhérents qui ont accepté d'en recevoir", moyen: "marketing-direct", pourquoi: "Un message personnel, envoyé à une personne connue : c'est le marketing direct." },
  { libelle: "Les frais d'inscription offerts pendant septembre", moyen: "promotion", pourquoi: "Un avantage limité dans le temps, pour déclencher l'achat : la promotion des ventes." },
  { libelle: `Le logo de la salle sur les maillots du ${HAUT_VERDASSE_HANDBALL.nom}`, moyen: "parrainage", pourquoi: "La salle soutient le club et en attend une contrepartie visible : c'est le parrainage, ou sponsoring." },
  { libelle: "Un don de tapis et de ballons à l'école de handball, sans logo", moyen: "mecenat", pourquoi: "Un soutien sans contrepartie publicitaire, pour une cause d'intérêt général : c'est le mécénat." },
  { libelle: "Une journée portes ouvertes, avec des cours gratuits", moyen: "evenement", pourquoi: "Un moment organisé pour faire vivre la salle à ceux qui viennent : c'est l'événementiel." },
];

/** L'annonce de la rentrée, phrase par phrase, et le rôle de chacune dans la copy strategy (hypothèse du chapitre). */
export const ANNONCE_DE_LA_RENTREE = {
  promesse: "Retrouvez la forme dès la rentrée, à votre rythme.",
  preuve: "Des coachs diplômés, une salle ouverte tôt et tard.",
  ton: "Un ton dynamique et complice, avec des photos de vrais adhérents.",
} as const;

/** La communauté en ligne de la salle (hypothèses du chapitre « Influence, communauté et e-réputation »). */
export const COMMUNAUTE_EN_LIGNE = {
  abonnes: 2_400,
  noteDesAvis: 4.3,
  avis: 312,
  campagne: { budget: 1_200, impressions: 30_000, clics: 450, contacts: 60, adhesions: 15 },
} as const;

/** L'influenceuse du cas (hypothèses du cas) : son prix, les vues attendues, le taux de clic, la part des clics qui laissent un contact. */
export const INFLUENCEUSE = { prix: 1_500, abonnes: 8_000, vues: 9_000, tauxDeClic: 0.02, contactsParClic: 0.25 } as const;

export type CodeDePhenomene = "buzz" | "viral" | "e-reputation" | "communaute";

/** Ce qui se passe en ligne autour de la salle, par phénomène (hypothèse du chapitre). */
export const PHENOMENES_EN_LIGNE: readonly { libelle: string; code: CodeDePhenomene; pourquoi: string }[] = [
  { libelle: "Un défi sportif lancé par la salle dont tout le territoire parle pendant une semaine", code: "buzz", pourquoi: "Un bruit fort et bref, provoqué pour faire parler : c'est le buzz." },
  { libelle: "Une vidéo d'adhérents partagée d'ami en ami, bien au-delà des abonnés", code: "viral", pourquoi: "Le message se transmet de proche en proche, comme un virus : c'est la viralité." },
  { libelle: "La note des avis et ce qu'en disent les clients sur les sites d'avis", code: "e-reputation", pourquoi: "L'image que l'on garde de la salle en ligne, faite de ce que disent les autres : l'e-réputation." },
  { libelle: "Répondre chaque jour aux questions et aux commentaires des abonnés", code: "communaute", pourquoi: "Animer la communauté, lui parler, l'écouter : c'est le métier du community manager." },
];

/** L'abonnement d'un mois, ce qu'il coûte, ce qu'il laisse, et ce que laisse un nouvel adhérent sur sa durée moyenne. */
export function adherentDeLaSalle() {
  const prix = SALLE.gestion.prixMoyen;
  const cout = SALLE.gestion.coutVariableUnitaire;
  const margeDUnMois = auCentime(prix - cout);
  return {
    entreprise: SALLE.entreprise,
    adherents: SALLE.gestion.quantite,
    publiciteDuMois: SALLE.marche.marketing,
    prix,
    cout,
    margeDUnMois,
    mois: MOIS_D_UN_NOUVEL_ADHERENT,
    margeDUnNouvelAdherent: auCentime(margeDUnMois * MOIS_D_UN_NOUVEL_ADHERENT),
  };
}

/** Un support de la campagne : son coût pour mille contacts, ses contacts dans la cible, et son coût pour mille contacts dans la cible. */
export function lireLeSupport(s: SupportDeLaCampagne) {
  const utiles = aLUnite(s.contacts * s.partDansLaCible);
  return { ...s, coutPourMille: auCentime((s.prix / s.contacts) * 1_000), utiles, coutPourMilleUtiles: auCentime((s.prix / utiles) * 1_000) };
}

export const supportsLus = () => SUPPORTS_DE_LA_RENTREE.map(lireLeSupport);

/** Le support le moins cher pour toucher la cible. */
export const meilleurSupport = () => supportsLus().reduce((a, b) => (b.coutPourMilleUtiles < a.coutPourMilleUtiles ? b : a));

/** n nouveaux adhérents : la marge qu'ils laissent sur leur durée moyenne, face au budget de la campagne. */
export function campagneAvec(n: number, budget: number = CAMPAGNE_DE_LA_RENTREE.budget) {
  const marge = auCentime(n * adherentDeLaSalle().margeDUnNouvelAdherent);
  return { adhesions: n, marge, budget, gain: auCentime(marge - budget) };
}

/** Le plus petit nombre d'adhésions qui paie la campagne. */
export const adhesionsQuiPaient = (budget: number = CAMPAGNE_DE_LA_RENTREE.budget) => Math.ceil(budget / adherentDeLaSalle().margeDUnNouvelAdherent - 1e-9);

/** La campagne sponsorisée : taux de clic, coût par contact (le coût par lead), taux de transformation, coût d'une adhésion. */
export function campagneSponsorisee() {
  const k = COMMUNAUTE_EN_LIGNE.campagne;
  return {
    ...k,
    tauxDeClic: arrondi2((k.clics / k.impressions) * 100),
    coutParContact: auCentime(k.budget / k.contacts),
    tauxDeTransformation: arrondi2((k.adhesions / k.contacts) * 100),
    coutDUneAdhesion: auCentime(k.budget / k.adhesions),
  };
}

/** Ce que vaut un contact : la part des contacts qui adhèrent, fois la marge d'un nouvel adhérent. C'est le plus qu'un contact peut coûter. */
export const valeurDUnContact = () => {
  const k = COMMUNAUTE_EN_LIGNE.campagne;
  return auCentime((k.adhesions / k.contacts) * adherentDeLaSalle().margeDUnNouvelAdherent);
};

/** La vidéo de l'influenceuse : clics, contacts, coût par contact, adhésions attendues et ce qu'elles laissent. */
export function videoDeLInfluenceuse() {
  const k = INFLUENCEUSE;
  const clics = aLUnite(k.vues * k.tauxDeClic);
  const contacts = aLUnite(clics * k.contactsParClic);
  // Les adhésions au taux de transformation de septembre, à deux décimales, comme l'élève le relève.
  const adhesions = aLUnite((contacts * campagneSponsorisee().tauxDeTransformation) / 100);
  const marge = auCentime(adhesions * adherentDeLaSalle().margeDUnNouvelAdherent);
  return { ...k, clics, contacts, coutParContact: auCentime(k.prix / contacts), adhesions, marge, gain: auCentime(marge - k.prix) };
}
