import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  ENTREPRISES_DU_CLIENT_NUMERIQUE,
  PANIERS_ABANDONNES_DES_INSCRITES,
  PASSAGES_PERDUS_PAR_DESINSCRIPTION,
  RELANCES,
  margeDUnPanier,
  relances,
  relancesQuiRapportentLePlus,
  tunnelDuSite,
} from "../monde/client-numerique-de-maille";
import { HAUT_VERDASSE } from "../monde/haut-verdasse";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE CLIENT À L'ÈRE NUMÉRIQUE, PARCOURS D'ACHAT, TRACES ET RELATION (Bac STMG, management,
 * sciences de gestion et numérique de terminale, enseignement commun, thème 2, question 2.2 : « Les
 * transformations numériques, vecteur d'amélioration de la relation avec les clients et les usagers ? »).
 *
 * Le consommateur et l'usager, le processus d'achat et ses étapes en ligne, les facteurs qui expliquent
 * le comportement (besoins, motivations, freins, attitudes), le tunnel d'un site de vente, la
 * digitalisation de la relation client et ses outils (dont la gestion de la relation client, Customer
 * Relationship Management), les traces numériques et les réseaux sociaux, la relance des paniers
 * abandonnés chiffrée au laboratoire, et l'administration électronique, chez la communauté de communes.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez MAILLE & CO : monde/client-numerique-de-maille.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;

export const LE_CLIENT_A_L_ERE_NUMERIQUE: Chapitre = {
  code: "le-client-a-l-ere-numerique",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Les organisations et les acteurs"],
  titre: "Le client à l'ère numérique : parcours d'achat, traces et relation",
  accroche:
    "Une cliente qui compare les avis sur son téléphone, remplit un panier, le laisse, revient quelques jours plus tard : ce que le numérique apprend du client, ce qu'il change à la relation, et ce qu'il ne faut pas en faire.",
  objectifs: [
    "Décrire le processus d'achat et ses facteurs explicatifs",
    "Mesurer le tunnel d'un site de vente",
    "Reconnaître les outils et les traces de la relation client numérique",
    "Chiffrer une relance sans abîmer la relation",
    "Reconnaître l'apport de l'administration électronique aux usagers",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CLIENT_NUMERIQUE,
    pourquoi: "ce chapitre suit les clientes de MAILLE & CO, en boutique et sur son site.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le client au cœur du processus d'achat",
      texte: (c) => [
        `${c.entreprise} vend en boutique et sur son site, avec retrait en boutique. Une cliente découvre un cardigan sur un réseau social, lit les avis, compare les prix sur son téléphone, réserve en ligne, essaie en boutique, puis laisse un avis.`,
        "La révolution numérique a mis le consommateur, et l'usager d'un service public, au cœur du processus d'achat. Chaque étape laisse des informations : l'organisation connaît mieux son client, et peut lui proposer une offre mieux adaptée.",
      ],
      repere: () => "Processus d'achat : éveil du besoin → recherche d'information → évaluation et achat → comportement après l'achat.",
    },
    {
      id: "le-processus",
      objectifs: [0],
      type: "tri",
      titre: "Les étapes du processus d'achat",
      question: () => "Rangez chaque geste de la cliente selon l'étape du processus d'achat.",
      categories: [
        { code: "besoin", libelle: "Éveil du besoin" },
        { code: "information", libelle: "Recherche d'information" },
        { code: "achat", libelle: "Évaluation et achat" },
        { code: "apres", libelle: "Après l'achat" },
      ],
      elements: () => [
        { libelle: "Elle voit une amie porter un cardigan sur un réseau social", montant: 0, categorie: "besoin", pourquoi: "L'envie naît : l'éveil du besoin." },
        { libelle: "Elle lit les avis et compare les prix sur plusieurs sites", montant: 0, categorie: "information", pourquoi: "Elle s'informe avant de choisir." },
        { libelle: "Elle réserve en ligne et paie au retrait en boutique", montant: 0, categorie: "achat", pourquoi: "Elle choisit et achète." },
        { libelle: "Elle laisse un avis et une photo sur le site", montant: 0, categorie: "apres", pourquoi: "Son avis pèsera sur les achats des autres : le comportement après l'achat." },
      ],
      relance: "La cliente découvre-t-elle son envie, s'informe-t-elle, achète-t-elle, ou parle-t-elle de son achat ?",
      explication: () => ["En ligne, chaque étape se voit et se mesure ; l'avis laissé après l'achat devient l'information du client suivant."],
    },
    {
      id: "les-facteurs",
      objectifs: [0],
      type: "tri",
      titre: "Ce qui explique le comportement",
      question: () => "Rangez chaque phrase entendue en boutique selon le facteur qu'elle révèle.",
      categories: [
        { code: "besoin", libelle: "Un besoin" },
        { code: "motivation", libelle: "Une motivation" },
        { code: "frein", libelle: "Un frein" },
        { code: "attitude", libelle: "Une attitude" },
      ],
      elements: () => [
        { libelle: "« Il me faut un pull chaud pour l'hiver »", montant: 0, categorie: "besoin", pourquoi: "Un manque à combler : le besoin." },
        { libelle: "« J'aime porter quelque chose fait près d'ici »", montant: 0, categorie: "motivation", pourquoi: "Une raison qui pousse à acheter : la motivation." },
        { libelle: "« J'ai peur que la taille ne m'aille pas, si je commande en ligne »", montant: 0, categorie: "frein", pourquoi: "Une crainte qui retient d'acheter : le frein." },
        { libelle: "« Les marques de mode rapide, je n'en achète plus »", montant: 0, categorie: "attitude", pourquoi: "Une opinion durable, favorable ou non : l'attitude." },
      ],
      relance: "La phrase dit-elle un manque, une raison d'acheter, une crainte, ou une opinion durable ?",
      explication: () => ["Lever un frein (le retrait en boutique pour essayer, l'échange gratuit) fait parfois plus vendre qu'une promotion."],
    },
    {
      id: "le-tunnel",
      objectifs: [1],
      type: "montants",
      titre: "Le tunnel du site",
      tableau: (c) => {
        const t = tunnelDuSite();
        return {
          titre: `Le site de ${c.entreprise}, sur un mois`,
          colonnes: ["Nombre"],
          lignes: [
            { libelle: "Visites", valeurs: [qte(t.visites)] },
            { libelle: "Paniers remplis", valeurs: [qte(t.paniers)] },
            { libelle: "Commandes payées", valeurs: [qte(t.commandes)] },
          ],
        };
      },
      question: () => "Calculez le taux de transformation (commandes sur visites, au dixième), les paniers abandonnés, et le taux d'abandon des paniers (au dixième).",
      champs: () => {
        const t = tunnelDuSite();
        return [
          { libelle: "Taux de transformation (%)", attendu: t.transformationPct, calcul: `${qte(t.commandes)} ÷ ${qte(t.visites)} × 100 = ${pct(t.transformationPct)}`, tolerance: 0.1 },
          { libelle: "Paniers abandonnés", attendu: t.abandons, calcul: `${qte(t.paniers)} − ${qte(t.commandes)} = ${qte(t.abandons)}`, tolerance: 0 },
          { libelle: "Taux d'abandon des paniers (%)", attendu: t.abandonPct, calcul: `${qte(t.abandons)} ÷ ${qte(t.paniers)} × 100 = ${pct(t.abandonPct)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const t = tunnelDuSite();
        return [`${pct(t.abandonPct)} des paniers sont abandonnés : ${qte(t.abandons)} dans le mois. Ce n'est pas rare en ligne, mais chaque abandon dit un frein (le prix du retrait, la taille, le temps) que la boutique peut chercher à lever.`];
      },
    },
    {
      id: "la-relation-digitale",
      type: "lecture",
      titre: "La relation client digitalisée",
      texte: () => [
        "Le numérique change la relation : la connaissance du client (ses achats, ses préférences), l'interactivité (il répond, il note, il pose une question), des outils (le site, l'application, la discussion en ligne, les courriels, les réseaux sociaux).",
        "Un logiciel de gestion de la relation client (Customer Relationship Management) rassemble ces informations dans le système d'information, partagé par la vendeuse en boutique et par celle qui répond en ligne.",
      ],
      repere: () => "Relation client digitalisée : connaissance du client, interactivité, outils, et un système d'information partagé.",
    },
    {
      id: "les-traces",
      objectifs: [2],
      type: "tri",
      titre: "Les traces numériques",
      question: () => "Rangez chaque donnée selon la façon dont la cliente la laisse.",
      categories: [
        { code: "volontaire", libelle: "Donnée laissée volontairement" },
        { code: "trace", libelle: "Trace laissée sans y penser" },
      ],
      elements: () => [
        { libelle: "Son adresse électronique, saisie pour la carte de fidélité", montant: 0, categorie: "volontaire", pourquoi: "Elle la donne, en le sachant." },
        { libelle: "L'avis qu'elle publie sur un cardigan", montant: 0, categorie: "volontaire", pourquoi: "Elle choisit de le publier." },
        { libelle: "Les pages qu'elle a regardées sur le site, et combien de temps", montant: 0, categorie: "trace", pourquoi: "Le site les enregistre pendant qu'elle navigue : une trace numérique." },
        { libelle: "Le panier qu'elle a laissé sans le payer", montant: 0, categorie: "trace", pourquoi: "Une trace de son passage, qu'elle n'a pas choisi de laisser." },
      ],
      relance: "La cliente donne-t-elle cette information en le sachant, ou le site l'enregistre-t-il pendant qu'elle navigue ?",
      explication: () => ["Les traces numériques renseignent sur le comportement ; leur usage est encadré par la loi, qui demande l'accord de la personne pour la plupart des traceurs."],
    },
    {
      id: "un-avis-negatif",
      objectifs: [2],
      type: "choix",
      titre: "Un avis négatif sur un réseau social",
      question: (c) => `Une cliente publie sur un réseau social : « Pull déformé après un lavage, ${c.entreprise} ne répond pas ». Que faire ?`,
      options: () => [
        {
          texte: "Lui répondre vite, en public, et proposer un échange",
          juste: true,
          retour: "Oui : sur un réseau social, la réponse est lue par tous. Une réponse rapide et une solution transforment souvent la critique en preuve de sérieux.",
        },
        {
          texte: "Supprimer le message, ou demander à la plateforme de le retirer",
          juste: false,
          retour: "Non : un avis honnête ne se supprime pas, et le tenter ferait pire encore. Il faut répondre.",
        },
        {
          texte: "Ne rien dire : le message sera vite oublié",
          juste: false,
          retour: "Non : un avis resté sans réponse reste visible, et dit aux autres clients que la boutique ne s'occupe pas d'eux.",
        },
      ],
    },
    {
      id: "le-laboratoire-des-relances",
      objectifs: [3],
      type: "simulation",
      titre: "Combien de relances ?",
      question: () => {
        const r = RELANCES.map((x) => `${x.quand} (${qte(x.reprises)} paniers repris, ${qte(x.desinscriptions)} désinscriptions)`).join(", ");
        return `Chaque mois, ${qte(PANIERS_ABANDONNES_DES_INSCRITES)} paniers abandonnés viennent de clientes inscrites qui acceptent les messages. Un courriel leur rappelle leur panier : ${r}. Un panier repris laisse ${eur(margeDUnPanier())} de marge ; une cliente désinscrite en fait perdre ${qte(PASSAGES_PERDUS_PAR_DESINSCRIPTION)} passages dans l'année. Faites varier le nombre de relances.`;
      },
      leviers: () => [{ code: "relances", libelle: "Courriels de relance", unite: "courriels", min: 0, max: RELANCES.length, pas: 1, depart: 0 }],
      lecture: (_c, p) => {
        const r = relances(p.relances!);
        return [
          { libelle: "Paniers repris", montant: r.reprises, unite: "paniers" },
          { libelle: "Clientes désinscrites", montant: r.desinscriptions, unite: "clientes" },
          { libelle: "Marge des paniers repris", montant: r.marge },
          { libelle: "Marge perdue par les désinscriptions", montant: r.perte },
          { libelle: "Ce que les relances laissent", montant: r.gain, effet: true, fort: true },
        ];
      },
      defi: () => {
        const juste = relancesQuiRapportentLePlus();
        return {
          consigne: "Trouvez le nombre de relances qui laisse le plus à la boutique.",
          atteint: (p) => p.relances === juste,
          indice: (p) => `À ${qte(p.relances!)} relances, la boutique garde ${eur(relances(p.relances!).gain)}. Une de plus, ou une de moins, ferait-elle mieux ?`,
          solution: { relances: juste },
        };
      },
      explication: (_c, p) => {
        const r = relances(p.relances!);
        return [
          `Défi relevé : ${qte(r.k)} relances reprennent ${qte(r.reprises)} paniers et laissent ${eur(r.gain)}. La suivante agacerait plus de clientes qu'elle ne ramènerait de paniers.`,
          "Le numérique permet de relancer sans effort ; trop relancer abîme la relation. Une relation client se juge sur la durée.",
        ];
      },
    },
    {
      id: "le-consentement",
      objectifs: [3],
      type: "choix",
      titre: "Qui peut-on relancer ?",
      question: () => "Une cliente a rempli un panier sans créer de compte ni donner son accord. La boutique peut-elle lui écrire ?",
      options: () => [
        {
          texte: "Non : il lui faut d'abord son accord",
          juste: true,
          retour: "Oui : la prospection par courriel demande le consentement de la personne (le règlement général sur la protection des données et la loi française). C'est pourquoi le laboratoire ne compte que les clientes qui l'ont donné.",
        },
        {
          texte: "Oui : un panier rempli vaut accord pour recevoir des offres",
          juste: false,
          retour: "Non : remplir un panier n'est pas accepter des messages commerciaux. Le consentement doit être donné clairement.",
        },
        {
          texte: "Oui, si la boutique retrouve son adresse sur un réseau social",
          juste: false,
          retour: "Non : collecter une adresse ailleurs pour lui écrire, sans son accord, est interdit.",
        },
      ],
    },
    {
      id: "l-administration-electronique",
      objectifs: [4],
      type: "choix",
      titre: "L'usager et l'administration électronique",
      question: () => `La ${HAUT_VERDASSE.nom} met en ligne l'inscription aux cours de natation et les comptes rendus du conseil communautaire. Qu'apporte cette administration électronique, et à quoi doit-elle veiller ?`,
      options: () => [
        {
          texte: "Des démarches plus simples, sans oublier ceux qui n'ont pas internet",
          juste: true,
          retour: "Oui : l'usager s'inscrit à toute heure, accède aux documents administratifs (un droit depuis la loi de 1978), et les services échangent plus vite. Mais un guichet ou un accompagnement reste nécessaire pour ceux qui n'ont pas d'accès ou d'aisance numérique.",
        },
        {
          texte: "Elle permet de fermer l'accueil de la piscine, puisque tout se fait en ligne",
          juste: false,
          retour: "Non : le service public doit rester accessible à tous, principe d'égalité oblige. Fermer l'accueil écarterait une partie des usagers.",
        },
        {
          texte: "Rien : une organisation publique n'a pas de relation avec ses usagers",
          juste: false,
          retour: "Non : l'usager est au cœur du service public, et le numérique améliore aussi cette relation.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const t = tunnelDuSite();
        const n = relancesQuiRapportentLePlus();
        return [
          `${c.entreprise} suit sa cliente à chaque étape de son achat : ${pct(t.transformationPct)} des visites deviennent des commandes, ${pct(t.abandonPct)} des paniers sont abandonnés. ${qte(n)} relances, envoyées aux seules clientes qui l'ont accepté, laissent ${eur(relances(n).gain)} par mois ; au-delà, la relation s'abîme.`,
          "Dans l'arène, la demande de chaque tour réagit à vos prix et à votre communication : ce sont les mêmes clients, vus de loin.",
        ];
      },
      repere: () => "Processus d'achat et facteurs · tunnel de vente · relation client digitalisée et ses outils · traces numériques · consentement · administration électronique.",
    },
  ],
};
