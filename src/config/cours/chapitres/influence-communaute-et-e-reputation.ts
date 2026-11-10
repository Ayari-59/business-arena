import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { COMMUNAUTE_EN_LIGNE, PHENOMENES_EN_LIGNE, adherentDeLaSalle, campagneSponsorisee, valeurDUnContact } from "../monde/volt-fitness";
import { ENTREPRISES_DE_LA_SALLE } from "./le-plan-de-communication";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : INFLUENCE, COMMUNAUTÉ ET E-RÉPUTATION (Bac STMG, mercatique de terminale, thème 3, question
 * 3.2 : « Comment enrichir la relation client grâce au numérique ? », la part de la communication
 * numérique : influence, community management, buzz, viralité, e-réputation, communication de crise,
 * taux de clic, coût par lead).
 *
 * VOLT FITNESS vit aussi en ligne : un compte suivi sur un réseau social, des avis notés, des campagnes
 * sponsorisées. Le chapitre mesure une campagne (taux de clic, coût par contact laissé, le « coût par
 * lead », taux de transformation), fixe le plus qu'un contact peut coûter (le curseur), choisit une
 * influenceuse, dit ce que fait un community manager, distingue buzz, viralité et e-réputation, et
 * répond à une crise : une vidéo des vestiaires sales qui circule.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/volt-fitness.ts), chez VOLT FITNESS seule : l'abonnement
 * et son coût du cas figé ; la communauté, la campagne et l'influenceuse sont des hypothèses nommées dans
 * la fiche.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const note = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} sur 5`;

/** Les bornes du curseur du coût par contact, en euros. */
const COUT_PAR_CONTACT_DU_CURSEUR = { min: 0, max: 200 } as const;

function laCampagne(): TableauDeDonnees {
  const k = campagneSponsorisee();
  return {
    titre: "La campagne sponsorisée de septembre",
    colonnes: ["Septembre"],
    lignes: [
      { libelle: "Budget", valeurs: [eur(k.budget)] },
      { libelle: "Impressions (publicités affichées)", valeurs: [qte(k.impressions)] },
      { libelle: "Clics vers la page d'inscription", valeurs: [qte(k.clics)] },
      { libelle: "Contacts laissés pour une séance d'essai", valeurs: [qte(k.contacts)] },
      { libelle: "Adhésions", valeurs: [qte(k.adhesions)] },
    ],
  };
}

export const INFLUENCE_COMMUNAUTE_ET_E_REPUTATION: Chapitre = {
  code: "influence-communaute-et-e-reputation",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 3 · La communication de l'offre"],
  titre: "Influence, communauté et e-réputation",
  accroche:
    "Une salle de sport se suit, se commente et se note en ligne. Mesurer ce que rapporte un clic, savoir ce qu'un contact peut coûter, animer une communauté, et répondre quand une vidéo tourne mal.",
  objectifs: [
    "Calculer un taux de clic, un coût par lead et un taux de transformation",
    "Fixer ce qu'un contact peut coûter",
    "Choisir un influenceur et animer une communauté",
    "Distinguer le buzz, la viralité et l'e-réputation, et répondre à une crise",
  ],
  libre: false,
  prerequis: ["le-plan-de-communication"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_SALLE,
    pourquoi: "ce chapitre lit la communauté en ligne de VOLT FITNESS et la campagne de sa rentrée.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une salle qui vit en ligne",
      notions: ["conversion_rate"],
      tableau: laCampagne,
      texte: (c) => {
        const k = COMMUNAUTE_EN_LIGNE;
        return [
          `${c.entreprise} compte ${qte(k.abonnes)} abonnés sur un réseau social, et ses ${qte(k.avis)} avis en ligne lui donnent ${note(k.noteDesAvis)}. En septembre, elle a payé une campagne sponsorisée pour faire réserver une séance d'essai.`,
          "Chaque étape du parcours se compte : la publicité vue, le clic, le contact laissé, l'adhésion. C'est ce qui rend la communication numérique mesurable.",
        ];
      },
      repere: () => "Taux de clic = clics ÷ impressions. Coût par lead = budget ÷ contacts obtenus (un « lead » est un contact qui a montré son intérêt). Taux de transformation = adhésions ÷ contacts.",
    },
    {
      id: "clic-et-lead",
      objectifs: [0],
      type: "montants",
      titre: "Le taux de clic et le coût par lead",
      notions: ["conversion_rate", "customer_acquisition_cost"],
      tableau: laCampagne,
      question: () => "Calculez le taux de clic de la campagne, en pourcentage, puis le coût par lead : ce qu'a coûté chaque contact laissé pour une séance d'essai.",
      champs: () => {
        const k = campagneSponsorisee();
        return [
          { libelle: "Taux de clic (%)", attendu: k.tauxDeClic, tolerance: 0.1, calcul: `${qte(k.clics)} ÷ ${qte(k.impressions)} × 100 = ${pct(k.tauxDeClic)}` },
          { libelle: "Coût par lead", attendu: k.coutParContact, calcul: `${eur(k.budget)} ÷ ${qte(k.contacts)} = ${eur(k.coutParContact)}` },
        ];
      },
      explication: () => {
        const k = campagneSponsorisee();
        return [`Sur cent personnes qui voient la publicité, ${pct(k.tauxDeClic)} cliquent. Chaque contact obtenu a coûté ${eur(k.coutParContact)}.`];
      },
    },
    {
      id: "jusqu-a-l-adhesion",
      objectifs: [0],
      type: "montants",
      titre: "Du contact à l'adhésion",
      notions: ["conversion_rate", "customer_acquisition_cost"],
      tableau: laCampagne,
      question: () => "Calculez le taux de transformation des contacts en adhésions, en pourcentage, puis ce qu'a coûté chaque adhésion obtenue.",
      champs: () => {
        const k = campagneSponsorisee();
        return [
          { libelle: "Taux de transformation (%)", attendu: k.tauxDeTransformation, tolerance: 0.1, calcul: `${qte(k.adhesions)} ÷ ${qte(k.contacts)} × 100 = ${pct(k.tauxDeTransformation)}` },
          { libelle: "Coût d'une adhésion", attendu: k.coutDUneAdhesion, calcul: `${eur(k.budget)} ÷ ${qte(k.adhesions)} = ${eur(k.coutDUneAdhesion)}` },
        ];
      },
      explication: () => {
        const k = campagneSponsorisee();
        const a = adherentDeLaSalle();
        return [`Une adhésion a coûté ${eur(k.coutDUneAdhesion)} ; un nouvel adhérent laisse ${eur(a.margeDUnNouvelAdherent)} sur ses ${qte(a.mois)} mois en moyenne. La campagne a payé.`];
      },
    },
    {
      id: "ce-qu-un-contact-peut-couter",
      objectifs: [1],
      type: "curseur",
      titre: "Ce qu'un contact peut coûter",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: () => {
        const k = campagneSponsorisee();
        const a = adherentDeLaSalle();
        return `${pct(k.tauxDeTransformation)} des contacts deviennent adhérents, et un nouvel adhérent laisse ${eur(a.margeDUnNouvelAdherent)}. Faites varier le coût par lead : une droite donne ce que rapporte un contact en moyenne, l'autre ce qu'il coûte. Placez le curseur sur le coût par lead le plus élevé que la salle peut payer sans perdre d'argent, puis validez.`;
      },
      grandeur: () => ({ libelle: "Coût par lead", unite: "€" }),
      sens: "plus-grande",
      cible: () => ({ attendu: Math.floor(valeurDUnContact() + 1e-9), ...COUT_PAR_CONTACT_DU_CURSEUR }),
      zones: ["Le contact rapporte plus qu'il ne coûte", "Le contact coûte trop"],
      rates: () => ({
        dessous: "À ce coût, un contact rapporte encore plus qu'il ne coûte : la salle pourrait payer plus.",
        dessus: "À ce coût, un contact coûte plus qu'il ne rapporte en moyenne.",
      }),
      montrer: "Montrer le coût",
      lecture: (_c, q) => [
        { libelle: "Ce que rapporte un contact, en moyenne", montant: valeurDUnContact() },
        { libelle: "Ce que coûte un contact", montant: q },
        { libelle: "Ce qui reste par contact", montant: Math.round((valeurDUnContact() - q) * 100) / 100, fort: true },
      ],
      droites: () => ({ produit: () => valeurDUnContact(), cout: (q) => q, libelles: ["Ce que rapporte un contact", "Coût par lead"] }),
      explication: () => {
        const v = valeurDUnContact();
        const k = campagneSponsorisee();
        return [
          `Un contact rapporte ${eur(v)} en moyenne : c'est le coût par lead le plus élevé que la salle peut payer. La campagne de septembre l'a payé ${eur(k.coutParContact)} : une bonne affaire.`,
          "Le coût par lead ne se juge pas seul : il se compare à ce que rapporte un contact, taux de transformation compris.",
        ];
      },
    },
    {
      id: "l-influenceuse",
      objectifs: [2],
      type: "choix",
      titre: "Quelle influence",
      notions: ["customer_acquisition_cost"],
      question: () => "Deux personnes proposent de parler de la salle : une sportive du territoire, suivie par quelques milliers d'abonnés du coin, et une vedette nationale, suivie par des millions, beaucoup plus chère. Laquelle choisir ?",
      options: () => [
        { texte: "La sportive du territoire", juste: true, retour: "Oui : ses abonnés habitent près de la salle, lui font confiance et peuvent venir s'inscrire. C'est la micro-influence : moins d'audience, mais la bonne, et à un coût par contact plus bas." },
        { texte: "La vedette nationale, pour son audience", juste: false, retour: "Non : la plupart de ses abonnés vivent loin du Haut-Verdasse et ne viendront jamais. On paie une audience qui n'est pas la cible." },
        { texte: "Aucune : l'influence ne sert qu'aux grandes marques", juste: false, retour: "Non : une recommandation par une personne à qui l'on fait confiance vaut aussi pour un commerce local, et elle coûte peu." },
      ],
    },
    {
      id: "le-community-manager",
      objectifs: [2],
      type: "choix",
      titre: "Animer la communauté",
      notions: ["customer_portfolio"],
      question: (c) => `${c.entreprise} confie son compte à un community manager. Quel est son travail ?`,
      options: () => [
        { texte: "Publier, répondre, écouter", juste: true, retour: "Oui : il publie régulièrement, répond aux questions et aux critiques, et fait remonter ce que disent les abonnés. Une communauté qu'on n'anime pas se tait, ou parle sans vous." },
        { texte: "Acheter des abonnés pour paraître plus suivi", juste: false, retour: "Non : de faux abonnés n'adhèrent pas et finissent par se voir. Ils abîment la confiance." },
        { texte: "Effacer chaque commentaire négatif", juste: false, retour: "Non : effacer une critique la fait souvent revenir, plus fort. Mieux vaut y répondre, poliment et vite." },
      ],
    },
    {
      id: "buzz-viral-reputation",
      objectifs: [3],
      type: "tri",
      titre: "Buzz, viralité, e-réputation",
      notions: ["brand_capital"],
      question: () => "Rangez chaque phénomène en ligne sous le nom qui lui correspond.",
      categories: [
        { code: "buzz", libelle: "Le buzz" },
        { code: "viral", libelle: "La viralité" },
        { code: "e-reputation", libelle: "L'e-réputation" },
        { code: "communaute", libelle: "Le community management" },
      ],
      elements: () => PHENOMENES_EN_LIGNE.map((x) => ({ libelle: x.libelle, montant: 0, categorie: x.code, pourquoi: x.pourquoi })),
      relance: "S'agit-il d'un bruit bref, d'un message qui se transmet, d'une image qui dure, ou d'un travail quotidien ?",
      explication: () => ["Le buzz se provoque et retombe ; la viralité se propage d'elle-même ; l'e-réputation dure, faite de ce que les autres disent ; le community management l'entretient jour après jour."],
    },
    {
      id: "la-crise",
      objectifs: [3],
      type: "choix",
      titre: "Quand une vidéo tourne mal",
      notions: ["brand_capital"],
      question: () => "Un adhérent publie une vidéo des vestiaires sales, un soir de panne d'eau chaude. Elle est partagée des centaines de fois. Que fait la salle ?",
      options: () => [
        { texte: "Elle répond vite, reconnaît et dit ce qu'elle corrige", juste: true, retour: "Oui : c'est la communication de crise. Répondre vite, reconnaître le problème sans se défausser, dire ce qui est corrigé (la réparation, un nettoyage de plus), puis montrer le résultat. Le silence laisse la vidéo parler seule." },
        { texte: "Elle se tait en attendant que ça passe", juste: false, retour: "Non : sans réponse, chacun interprète la vidéo à sa façon, et l'e-réputation baisse." },
        { texte: "Elle demande à l'adhérent de retirer la vidéo, sinon elle le radie", juste: false, retour: "Non : menacer un client qui dit vrai aggrave la crise, et la menace circulera à son tour." },
      ],
    },
    {
      id: "enrichir-la-relation",
      objectifs: [2, 3],
      type: "choix",
      titre: "Comment le numérique enrichit la relation",
      notions: ["customer_portfolio", "conversion_rate"],
      question: (c) => `La question du programme : comment enrichir la relation client grâce au numérique ? Que retenez-vous pour ${c.entreprise} ?`,
      options: () => [
        { texte: "En dialoguant avec ses clients, et en mesurant", juste: true, retour: "Oui : le numérique permet de parler avec chaque client, d'écouter la communauté, de répondre aux avis, et de mesurer chaque étape (clic, contact, adhésion). La relation devient un dialogue suivi." },
        { texte: "En publiant le plus possible, sans répondre", juste: false, retour: "Non : publier sans écouter, c'est garder la vieille publicité sur un écran neuf. La relation suppose de répondre." },
        { texte: "En remplaçant l'accueil à la salle par une application", juste: false, retour: "Non : le numérique s'ajoute à l'accueil, il ne le remplace pas. La relation se joue aussi au comptoir." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["conversion_rate", "customer_acquisition_cost", "brand_capital"],
      texte: (c) => {
        const k = campagneSponsorisee();
        return [
          `En ligne, ${c.entreprise} mesure tout : ${pct(k.tauxDeClic)} de clics, ${eur(k.coutParContact)} par contact, ${pct(k.tauxDeTransformation)} d'adhésions. Un contact vaut ${eur(valeurDUnContact())} : au-delà, il coûte trop. La communauté s'anime, l'e-réputation se soigne, et une crise se traite vite et franchement.`,
          "Dans l'arène, rapportez à chaque tour votre publicité aux clients gagnés : combien vous coûte chacun ?",
        ];
      },
      repere: () => "Ce qu'un contact peut coûter au plus = taux de transformation × marge d'un nouveau client. Une crise : répondre vite, reconnaître, corriger, informer.",
    },
  ],
};
