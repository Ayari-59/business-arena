import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  APPLICATION,
  CLUB_REPONDANT,
  CONVERSIONS_ESSAYEES,
  ENTREPRISES_DE_L_OFFRE,
  PACK_SALLE,
  conversionQuiPaie,
  freemium,
  marchePotentiel,
  packPrevisionnel,
  valeurAjouteeDeN,
} from "../monde/offre-et-modele-de-nova";
import { HAUT_VERDASSE } from "../monde/haut-verdasse";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : UNE OFFRE POUR UN BESOIN, ÉTUDE DE MARCHÉ ET MODÈLE ÉCONOMIQUE (Bac STMG, management,
 * sciences de gestion et numérique de terminale, enseignement commun, thème 1, question 1.1 : « Quels
 * produits ou quels services pour quels besoins ? »).
 *
 * NOVA repère un besoin que personne ne sert (sonoriser une salle sans technicien), choisit sa démarche
 * et son approche marketing, lit une étude de marché et sa veille, mesure la valeur créée par la valeur
 * ajoutée (celle de l'année N, puis celle du pack au compte prévisionnel), la compare à la valeur que
 * crée une organisation publique, distingue l'innovation de produit de celle du modèle économique, range
 * quatre modèles (plateforme, low cost, gratuité, freemium), et cherche au laboratoire le taux de
 * conversion qui fait payer son application gratuite.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/offre-et-modele-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;

function lEtude(c: Cas): TableauDeDonnees {
  const m = marchePotentiel();
  return {
    titre: `L'étude de ${c.entreprise} auprès des clubs`,
    colonnes: ["Nombre"],
    lignes: [
      { libelle: "Clubs et associations sportives de la zone livrée", valeurs: [qte(m.clubsDeLaZone)] },
      { libelle: "Clubs interrogés par questionnaire", valeurs: [qte(m.interroges)] },
      { libelle: "Réponses reçues", valeurs: [qte(m.reponses)] },
      { libelle: "Répondants prêts à acheter le pack", valeurs: [qte(m.interesses)] },
    ],
  };
}

export const UNE_OFFRE_POUR_UN_BESOIN: Chapitre = {
  code: "une-offre-pour-un-besoin",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · Les organisations et l'activité de production de biens et de services"],
  titre: "Une offre pour un besoin : étude de marché et modèle économique",
  accroche:
    "Les clubs veulent sonoriser une salle sans technicien, et personne ne le leur propose. Comment une entreprise repère ce besoin, l'étudie, chiffre la valeur qu'elle en tirerait, et choisit la façon de se faire payer.",
  objectifs: [
    "Reconnaître la démarche et les approches marketing",
    "Lire une étude de marché et distinguer l'étude de la veille",
    "Mesurer la valeur créée par la valeur ajoutée",
    "Distinguer l'innovation de produit et les modèles économiques",
    "Chiffrer un modèle freemium",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_OFFRE,
    pourquoi: "ce chapitre suit une offre nouvelle de NOVA, dont le cours tient les comptes de l'année N.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un besoin que personne ne sert",
      texte: (c) => [
        `Dans les avis de ses clients, ${c.entreprise} lit souvent la même demande : « nous voudrions sonoriser la salle pour un match ou une fête, sans technicien ni table de mixage ». Le ${CLUB_REPONDANT.nom} l'a écrit aussi. La veille des concurrents le confirme : aucune offre simple n'existe.`,
        "Une organisation choisit ce qu'elle produit selon ses finalités, et pour cela elle doit connaître son marché : ses clients ou ses usagers, leurs besoins, ses concurrents. C'est le rôle du marketing : répondre à un besoin non satisfait par une offre, en restant cohérent avec la stratégie de l'organisation.",
      ],
      repere: () => "Démarche marketing : partir du besoin (exprimé ou non), l'étudier, puis construire une offre qui y répond et crée de la valeur.",
    },
    {
      id: "la-demarche",
      objectifs: [0],
      type: "choix",
      titre: "Par où commencer ?",
      question: (c) => `Le président de ${c.entreprise} propose de fabriquer d'abord le pack, puis de chercher à qui le vendre. Que dit la démarche marketing ?`,
      options: () => [
        {
          texte: "Partir du besoin des clubs, l'étudier, puis concevoir le pack",
          juste: true,
          retour: "Oui : la démarche marketing part du besoin, pas du produit. Une offre conçue pour un besoin étudié a plus de chances de trouver ses clients.",
        },
        {
          texte: "Fabriquer le pack d'abord : un bon produit finit toujours par trouver ses acheteurs",
          juste: false,
          retour: "Non : c'est partir du produit. Sans étude, rien ne dit que les clubs en veulent, ni à ce prix.",
        },
        {
          texte: "Copier le premier concurrent qui lancera une offre semblable, plus tard",
          juste: false,
          retour: "Non : il n'y en a pas, c'est justement l'occasion. Attendre laisse le besoin à un autre.",
        },
      ],
    },
    {
      id: "les-approches",
      objectifs: [0],
      type: "tri",
      titre: "Quatre approches marketing",
      question: () => "Rangez chaque façon de faire selon l'approche marketing qu'elle illustre.",
      categories: [
        { code: "anticipatrice", libelle: "Anticipatrice" },
        { code: "creative", libelle: "Créative" },
        { code: "reactive", libelle: "Réactive" },
        { code: "mediatrice", libelle: "Médiatrice" },
      ],
      elements: () => [
        { libelle: "Préparer une enceinte pour les salles avant que les clubs ne la demandent, parce que les matchs se diffusent de plus en plus en direct", montant: 0, categorie: "anticipatrice", pourquoi: "On devance un besoin qui va naître : l'approche anticipatrice." },
        { libelle: "Inventer un usage nouveau, l'enceinte qui suit le score du match, auquel personne n'avait pensé", montant: 0, categorie: "creative", pourquoi: "On crée le besoin par l'innovation : l'approche créative." },
        { libelle: "Répondre à la demande écrite dans les avis : sonoriser une salle sans technicien", montant: 0, categorie: "reactive", pourquoi: "On répond à un besoin exprimé : l'approche réactive." },
        { libelle: "Concevoir un pack qui plaise aux clubs sans gêner les voisins de la salle, avec une limite de volume", montant: 0, categorie: "mediatrice", pourquoi: "On concilie les attentes du client et celles de la société : l'approche médiatrice." },
      ],
      relance: "L'offre répond-elle à une demande déjà dite, devance-t-elle un besoin qui vient, invente-t-elle un usage, ou concilie-t-elle le client et la société ?",
      explication: () => ["Le pack des clubs relève surtout de l'approche réactive : le besoin est exprimé. Mais une entreprise mêle souvent les quatre approches, selon ses avantages et sa stratégie."],
    },
    {
      id: "etude-ou-veille",
      objectifs: [1],
      type: "tri",
      titre: "Étudier le marché, veiller",
      question: () => "Rangez chaque information selon la façon dont NOVA l'obtient.",
      categories: [
        { code: "documentaire", libelle: "Étude documentaire" },
        { code: "terrain", libelle: "Étude de terrain" },
        { code: "veille", libelle: "Veille marketing et commerciale" },
      ],
      elements: () => [
        { libelle: "Le nombre de clubs déclarés dans les départements livrés, lu dans un annuaire public", montant: 0, categorie: "documentaire", pourquoi: "Une information qui existe déjà, qu'on va chercher : l'étude documentaire." },
        { libelle: "Les dépenses des ménages en matériel audio, publiées par un institut de statistique", montant: 0, categorie: "documentaire", pourquoi: "Une donnée publiée : l'étude documentaire." },
        { libelle: "Le questionnaire envoyé aux clubs, et leurs réponses", montant: 0, categorie: "terrain", pourquoi: "L'information est recueillie auprès des clients eux-mêmes : l'étude de terrain." },
        { libelle: "Un entretien d'une heure avec l'entraîneur d'un club, pour comprendre comment se passe un match", montant: 0, categorie: "terrain", pourquoi: "Une étude de terrain qualitative : on comprend les motivations, sans les compter." },
        { libelle: "Le suivi, chaque semaine, des prix et des nouveautés des sites concurrents", montant: 0, categorie: "veille", pourquoi: "Une surveillance continue de l'environnement : la veille." },
      ],
      relance: "L'information existe-t-elle déjà quelque part, est-elle demandée aux clients, ou est-elle surveillée en continu ?",
      explication: () => ["L'étude répond à une question, une fois ; la veille surveille en continu le marché et les concurrents. Les outils numériques et les données massives aident à recueillir et à traiter cette information."],
    },
    {
      id: "le-marche-potentiel",
      objectifs: [1],
      type: "montants",
      titre: "Ce que dit l'étude",
      tableau: lEtude,
      question: () => `Calculez le taux de réponse (au dixième), la part des répondants prêts à acheter (au dixième), le nombre de clubs de la zone qui achèteraient si cette part valait pour tous, et le chiffre d'affaires à ${eur(PACK_SALLE.prix)} le pack.`,
      champs: () => {
        const m = marchePotentiel();
        return [
          { libelle: "Taux de réponse (%)", attendu: m.tauxDeReponsePct, calcul: `${qte(m.reponses)} ÷ ${qte(m.interroges)} × 100 = ${pct(m.tauxDeReponsePct)}`, tolerance: 0.1 },
          { libelle: "Répondants prêts à acheter (%)", attendu: m.tauxPct, calcul: `${qte(m.interesses)} ÷ ${qte(m.reponses)} × 100 = ${pct(m.tauxPct)}`, tolerance: 0.1 },
          { libelle: "Clubs acheteurs dans la zone", attendu: m.clubs, calcul: `${qte(m.clubsDeLaZone)} × ${pct(m.tauxPct)} = ${qte(m.clubs)}`, tolerance: 0 },
          { libelle: "Chiffre d'affaires potentiel", attendu: m.chiffreDAffaires, calcul: `${qte(m.clubs)} × ${eur(PACK_SALLE.prix)} = ${eur(m.chiffreDAffaires)}` },
        ];
      },
      explication: () => {
        const m = marchePotentiel();
        return [`L'étude laisse espérer ${qte(m.clubs)} clubs, ${eur(m.chiffreDAffaires)} de chiffre d'affaires. C'est une estimation : un club qui se dit prêt n'achète pas toujours, et ceux qui n'ont pas répondu sont peut-être moins intéressés.`];
      },
    },
    {
      id: "creer-de-la-valeur",
      type: "lecture",
      titre: "Une offre doit créer de la valeur",
      texte: (c) => [
        `Un produit n'est mis sur le marché que s'il crée de la valeur : des flux qui garantissent une rentabilité. Dans une entreprise comme ${c.entreprise}, la valeur créée se lit d'abord par la valeur ajoutée : ce que l'entreprise ajoute à ce qu'elle achète à ses fournisseurs.`,
        "Elle se calcule sur le compte de résultat : le chiffre d'affaires moins les consommations venues de l'extérieur (achats, transports, loyer, sous-traitance). Elle paie ensuite le personnel, l'État, les prêteurs et les associés. Au bilan, la valeur créée et gardée fait grandir les capitaux propres.",
      ],
      repere: () => "Valeur ajoutée = chiffre d'affaires − consommations venues des tiers. Taux de valeur ajoutée = valeur ajoutée ÷ chiffre d'affaires.",
    },
    {
      id: "la-valeur-de-n",
      objectifs: [2],
      type: "montants",
      titre: "La valeur ajoutée de l'année N",
      tableau: (c) => {
        const v = valeurAjouteeDeN();
        return {
          titre: `Le compte de résultat de ${c.entreprise}, année N`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Ventes d'enceintes", valeurs: [eur(v.ventes)] },
            { libelle: "Consommations venues des tiers (composants, emballage, transport, loyer, assurance)", valeurs: [eur(v.consommations)] },
          ],
        };
      },
      question: () => "Calculez la valeur ajoutée de l'année N, puis son taux (au dixième).",
      champs: () => {
        const v = valeurAjouteeDeN();
        return [
          { libelle: "Valeur ajoutée", attendu: v.valeurAjoutee, calcul: `${eur(v.ventes)} − ${eur(v.consommations)} = ${eur(v.valeurAjoutee)}` },
          { libelle: "Taux de valeur ajoutée (%)", attendu: v.tauxPct, calcul: `${eur(v.valeurAjoutee)} ÷ ${eur(v.ventes)} × 100 = ${pct(v.tauxPct)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const v = valeurAjouteeDeN();
        return [`Sur 100 € de ventes, NOVA a ajouté ${pct(v.tauxPct).replace(" %", " €")} de valeur : le reste payait des fournisseurs. Une offre nouvelle se juge aussi sur ce qu'elle ajoute.`];
      },
    },
    {
      id: "la-valeur-du-pack",
      objectifs: [2],
      type: "montants",
      titre: "La valeur ajoutée prévue du pack",
      question: () => `Le compte prévisionnel compte ${qte(PACK_SALLE.packsPrevus)} packs à ${eur(PACK_SALLE.prix)}, et ${eur(PACK_SALLE.consommations)} de consommations venues des fournisseurs par pack. Calculez le chiffre d'affaires prévu, les consommations, et la valeur ajoutée prévue.`,
      champs: () => {
        const p = packPrevisionnel();
        return [
          { libelle: "Chiffre d'affaires prévu", attendu: p.chiffreDAffaires, calcul: `${qte(p.packs)} × ${eur(p.prix)} = ${eur(p.chiffreDAffaires)}` },
          { libelle: "Consommations prévues", attendu: p.consommations, calcul: `${qte(p.packs)} × ${eur(PACK_SALLE.consommations)} = ${eur(p.consommations)}` },
          { libelle: "Valeur ajoutée prévue", attendu: p.valeurAjoutee, calcul: `${eur(p.chiffreDAffaires)} − ${eur(p.consommations)} = ${eur(p.valeurAjoutee)}` },
        ];
      },
      explication: () => {
        const p = packPrevisionnel();
        return [`Le pack ajouterait ${eur(p.valeurAjoutee)} de valeur, ${eur(p.parPack)} par pack. C'est une prévision : elle dépend de la capacité de NOVA à servir ce besoin durablement.`];
      },
    },
    {
      id: "la-valeur-publique",
      objectifs: [2],
      type: "choix",
      titre: "Et dans une organisation publique ?",
      question: () => `La ${HAUT_VERDASSE.nom} ouvre sa piscine à tous. Comment mesure-t-elle la valeur qu'elle crée ?`,
      options: () => [
        {
          texte: "Par l'équilibre de son budget et le service rendu aux habitants",
          juste: true,
          retour: "Oui : une organisation publique vise la couverture de ses coûts ou l'équilibre budgétaire, et une valeur sociale (l'apprentissage de la natation, le sport pour tous), difficile à chiffrer en euros.",
        },
        {
          texte: "Par le bénéfice de la piscine, comme une entreprise mesure sa valeur ajoutée",
          juste: false,
          retour: "Non : la piscine n'a pas à faire de bénéfice. Sa valeur se mesure surtout par le service rendu.",
        },
        {
          texte: "Elle ne crée aucune valeur, puisque les usagers ne paient qu'une partie de ses coûts",
          juste: false,
          retour: "Non : la valeur créée n'est pas seulement financière. Elle doit aussi s'apprécier dans sa dimension sociale.",
        },
      ],
    },
    {
      id: "innover",
      objectifs: [3],
      type: "tri",
      titre: "Innover sur le produit ou sur le modèle",
      question: () => "Rangez chaque idée : innove-t-elle sur le produit, ou sur la façon de le mettre à disposition et de le faire payer ?",
      categories: [
        { code: "produit", libelle: "Innovation de produit" },
        { code: "modele", libelle: "Modèle économique" },
      ],
      elements: () => [
        { libelle: "Des enceintes qui s'appairent toutes seules pour couvrir une grande salle", montant: 0, categorie: "produit", pourquoi: "Le bien lui-même change : une innovation de produit." },
        { libelle: "Ajouter au pack un service de réglage à distance", montant: 0, categorie: "produit", pourquoi: "Intégrer un service à l'offre d'un bien : une innovation de produit." },
        { libelle: "Louer le pack au week-end au lieu de le vendre", montant: 0, categorie: "modele", pourquoi: "Le produit est le même ; la façon de le mettre à disposition change : le modèle économique." },
        { libelle: "Une application gratuite, avec des fonctions payantes pour qui en veut plus", montant: 0, categorie: "modele", pourquoi: "C'est la fixation du prix qui change : le modèle économique." },
      ],
      relance: "Est-ce le bien ou le service lui-même qui change, ou la façon de le proposer et de le faire payer ?",
      explication: () => ["Beaucoup d'organisations ont grandi sans produit nouveau, en changeant leur modèle économique : présenter l'offre autrement, la proposer à un autre public, en démocratiser l'accès."],
    },
    {
      id: "quatre-modeles",
      objectifs: [3],
      type: "tri",
      titre: "Quatre modèles économiques",
      question: () => "Rangez chaque offre selon son modèle économique.",
      categories: [
        { code: "plateforme", libelle: "Plateforme" },
        { code: "low-cost", libelle: "Low cost" },
        { code: "gratuite", libelle: "Gratuité" },
        { code: "freemium", libelle: "Freemium" },
      ],
      elements: () => [
        { libelle: "Un site met en relation des clubs qui prêtent leur sono et des clubs qui en cherchent, contre une commission", montant: 0, categorie: "plateforme", pourquoi: "Le site ne vend rien lui-même : il relie deux groupes d'utilisateurs, une plateforme." },
        { libelle: "Une enceinte sans finitions ni service, vendue seulement en ligne, au prix le plus bas du marché", montant: 0, categorie: "low-cost", pourquoi: "On retire tout ce qui n'est pas essentiel pour baisser le prix : le low cost." },
        { libelle: "Une radio en ligne gratuite pour l'auditeur, payée par la publicité", montant: 0, categorie: "gratuite", pourquoi: "L'utilisateur ne paie pas : un autre paie pour lui, ici l'annonceur." },
        { libelle: `L'application ${APPLICATION.nom}, gratuite, avec une formule premium payante`, montant: 0, categorie: "freemium", pourquoi: "La base est gratuite, les fonctions avancées payantes : le freemium." },
      ],
      relance: "Qui paie, et pour quoi : une commission entre deux groupes, un prix réduit à l'essentiel, un tiers à la place de l'utilisateur, ou quelques utilisateurs pour des fonctions en plus ?",
      explication: () => ["Ces modèles en rupture permettent à des concurrents inattendus de devenir des leaders en quelques mois. Une entreprise doit les surveiller, et parfois les adopter."],
    },
    {
      id: "le-laboratoire-du-freemium",
      objectifs: [4],
      type: "simulation",
      titre: "Le freemium paie-t-il ?",
      question: () => `${qte(APPLICATION.utilisateurs)} personnes utiliseraient ${APPLICATION.nom} gratuitement. La formule premium coûte ${eur(APPLICATION.premiumParMois)} par mois, et l'application coûte ${eur(APPLICATION.coutAnnuel)} par an. Faites varier la part des utilisateurs qui passent à la formule premium.`,
      leviers: () => [{ code: "conversion", libelle: "Utilisateurs qui passent à la formule premium", unite: "%", ...CONVERSIONS_ESSAYEES, depart: CONVERSIONS_ESSAYEES.min }],
      lecture: (_c, p) => {
        const f = freemium(p.conversion!);
        return [
          { libelle: "Abonnés à la formule premium", montant: f.abonnes, unite: "abonnés" },
          { libelle: "Recettes de l'année", montant: f.recettes },
          { libelle: "Coût de l'application", montant: f.cout },
          { libelle: "Ce que l'application laisse", montant: f.solde, effet: true, fort: true },
        ];
      },
      defi: () => {
        const juste = conversionQuiPaie();
        return {
          consigne: "Trouvez la plus petite part d'abonnés, de point en point, pour laquelle l'application paie son coût de l'année.",
          atteint: (p) => p.conversion === juste,
          indice: (p) => {
            const f = freemium(p.conversion!);
            return f.solde < 0 ? `À ${pct(p.conversion!)}, l'application perd encore ${eur(-f.solde)}.` : `À ${pct(p.conversion!)}, elle paie son coût : une part plus petite le ferait-elle encore ?`;
          },
          solution: { conversion: juste },
        };
      },
      explication: (_c, p) => {
        const f = freemium(p.conversion!);
        return [
          `Défi relevé : à ${pct(p.conversion!)}, ${qte(f.abonnes)} abonnés paient l'application pour ${qte(f.gratuits)} utilisateurs gratuits, et il reste ${eur(f.solde)}. Un point de moins, et elle perd de l'argent.`,
          "Le freemium tient à une petite part d'utilisateurs qui paient pour tous les autres : il faut une base gratuite très large.",
        ];
      },
    },
    {
      id: "juger-le-modele",
      objectifs: [4],
      type: "choix",
      titre: "Ce que dit le laboratoire",
      question: () => `Les applications semblables convertissent 3 % de leurs utilisateurs. Que conseillez-vous pour ${APPLICATION.nom} ?`,
      options: () => {
        const trois = freemium(3);
        return [
          {
            texte: "La garder, pour vendre le pack, sans compter sur elle pour gagner",
            juste: true,
            retour: `Oui : à 3 %, elle perdrait ${eur(-trois.solde)} par an. Elle se justifie si elle aide à vendre des packs et des enceintes ; seule, elle ne paie pas.`,
          },
          {
            texte: "La lancer seule : un modèle freemium rapporte toujours, puisque l'application est gratuite",
            juste: false,
            retour: `Non : gratuit pour l'utilisateur ne veut pas dire sans coût. À 3 %, il manque ${eur(-trois.solde)} par an.`,
          },
          {
            texte: "Faire payer tout le monde : le freemium ne marche jamais",
            juste: false,
            retour: "Non : beaucoup n'auraient pas téléchargé une application payante. La gratuité fait la base qui attire.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const m = marchePotentiel();
        const p = packPrevisionnel();
        return [
          `${c.entreprise} part d'un besoin exprimé, l'étudie (${qte(m.clubs)} clubs acheteurs estimés), mesure la valeur que le pack ajouterait (${eur(p.valeurAjoutee)} la première année), et choisit comment se faire payer : vendre, louer, offrir une base gratuite.`,
          "Une offre se décide sur la connaissance du marché, sur la valeur qu'elle crée, et sur un modèle économique qui tient. Dans l'arène, la demande de chaque tour vous dit si votre offre répond au besoin.",
        ];
      },
      repere: () => "Besoin → étude de marché et veille → offre → valeur créée (valeur ajoutée) → modèle économique.",
    },
  ],
};
