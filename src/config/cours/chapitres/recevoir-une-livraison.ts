import type { CompanyRoundResult } from "../../../engine/types";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : RECEVOIR UNE LIVRAISON, LE BON DE LIVRAISON ET LA COMMANDE (CAP Équipier
 * polyvalent du commerce, palier 1).
 *
 * Le geste de l'équipier à la réception : il lit la commande que le magasin a passée, prend le
 * bon de livraison que le livreur lui tend, compte les articles carton par carton, ligne par
 * ligne, trouve l'écart, l'écrit sur le bon avant de signer (la réserve), prévient son
 * responsable, et calcule le stock en réserve après la réception. Un calcul simple par étape :
 * une addition, une soustraction.
 *
 * CE QUI VIENT DE L'ARÈNE. La commande est celle que l'année du cours (`anneeJouee`) fait passer
 * à MAILLE & CO au premier trimestre, référence par référence (`products[code].planned`, la case
 * « Articles à mettre en rayon » de la feuille de décision), arrondie à l'article. Le stock avant
 * la réception est le stock d'ouverture de la boutique, référence par référence
 * (`finishedGoodsByProduct`). Le fournisseur est celui que le moteur a servi (`supplier.name`).
 *
 * CE QUE L'ARÈNE NE FAIT PAS. Le moteur ne simule ni bon de livraison, ni cartons, ni écart de
 * livraison : ce qui est commandé entre en stock en entier (`produced` = `planned` sur toute
 * l'année du cours, sans rupture du fournisseur). Le bon de livraison, les cartons et le carton
 * manquant sont donc des HYPOTHÈSES DU COURS, posées ci-dessous en constantes nommées, et le
 * texte le dit à l'élève.
 */

/** Le premier trimestre de l'année du cours : celui où la commande est reçue. */
export const TRIMESTRE_DE_LA_LIVRAISON = 1;

/**
 * LES ARTICLES ARRIVENT EN CARTONS DE 10 : hypothèse du cours. Le moteur ne compte pas de
 * cartons ; un carton de dix pièces se compte facilement de tête.
 */
export const ARTICLES_PAR_CARTON = 10;

/**
 * UN CARTON MANQUE, sur la ligne la plus grosse de la commande : hypothèse du cours. Dans
 * l'arène, la livraison arrive toujours complète ; le cours imagine un carton perdu en route pour
 * entraîner l'élève au contrôle.
 */
export const CARTONS_MANQUANTS = 1;

/** Les entreprises du chapitre : un magasin, qui reçoit plusieurs articles de son fournisseur. */
export const MAGASINS: readonly string[] = ["boutique"];

/**
 * LE NOM DES ARTICLES DANS UNE PHRASE. Le scénario les nomme pour un tableau (« Col rond ») ;
 * une phrase demande le pluriel et le genre (« les écharpes manquantes »). Ce n'est pas un
 * chiffre : c'est la façon de dire. La garde vérifie que chaque référence de la boutique a le sien.
 */
export const ARTICLES_DE_LA_BOUTIQUE: Readonly<Record<string, { pluriel: string; feminin: boolean }>> = {
  "pull-col-rond": { pluriel: "pulls col rond", feminin: false },
  cardigan: { pluriel: "cardigans", feminin: false },
  "pull-merinos": { pluriel: "pulls mérinos", feminin: false },
  echarpe: { pluriel: "écharpes", feminin: true },
  bonnet: { pluriel: "bonnets", feminin: false },
};

export const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
/** « de » devant un nom : élidé devant une voyelle. */
export const de = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Un adjectif accordé au pluriel avec l'article (« manquants », « manquantes »). */
export const accordeA = (feminin: boolean, adjectif: string) => `${adjectif}${feminin ? "es" : "s"}`;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface LigneDeLivraison {
  code: string;
  /** Le nom du tableau, celui du scénario. */
  nom: string;
  /** Le nom d'une phrase, au pluriel. */
  pluriel: string;
  feminin: boolean;
  /** En réserve avant la réception. */
  avant: number;
  commandee: number;
}

/** Les références de la boutique, dans l'ordre du scénario. */
export function referencesDuMagasin(code: string) {
  const s = scenarioByCode(code).scenario;
  return (s.products ?? []).map((p) => {
    const mots = ARTICLES_DE_LA_BOUTIQUE[p.code];
    if (!mots) throw new Error(`Pas de nom de phrase pour l'article ${p.code}`);
    return { code: p.code, nom: p.name, ...mots };
  });
}

/** Le résultat du joueur au trimestre donné (1 à 4) de l'année du cours. */
export function trimestreDuCours(code: string, trimestre: number): CompanyRoundResult {
  const r = anneeJouee(code).partie.rounds[trimestre - 1]?.results["joueur"];
  if (!r?.products) throw new Error(`Pas de trimestre ${trimestre} par référence pour ${code}`);
  return r;
}

/** Ce qui est en réserve, article par article, au début du trimestre donné. */
export function stockAuDebut(code: string, trimestre: number): Record<string, number> {
  if (trimestre === 1) {
    const fg = anneeJouee(code).depart.finishedGoodsByProduct ?? {};
    return Object.fromEntries(Object.entries(fg).map(([k, v]) => [k, Math.round(v.quantity)]));
  }
  const avant = trimestreDuCours(code, trimestre - 1).products!;
  return Object.fromEntries(Object.entries(avant).map(([k, v]) => [k, Math.round(v.stock.quantity)]));
}

/** La commande d'un trimestre, référence par référence, et ce qui était en réserve avant. */
export function commandeDuTrimestre(code: string, trimestre: number) {
  const r = trimestreDuCours(code, trimestre);
  const avant = stockAuDebut(code, trimestre);
  const lignes: LigneDeLivraison[] = referencesDuMagasin(code).map((a) => ({
    ...a,
    avant: avant[a.code] ?? 0,
    commandee: Math.round(r.products![a.code]!.planned),
  }));
  const fournisseurs = new Set(Object.values(r.products!).map((p) => p.supplier?.name ?? ""));
  if (fournisseurs.size !== 1) throw new Error(`Plusieurs fournisseurs au trimestre ${trimestre} chez ${code}`);
  return {
    lignes,
    fournisseur: [...fournisseurs][0]!,
    totalCommande: lignes.reduce((t, l) => t + l.commandee, 0),
    totalAvant: lignes.reduce((t, l) => t + l.avant, 0),
  };
}

/** La livraison du chapitre : la commande, le bon, le compte, l'écart, le stock après. */
export function livraison(c: Cas) {
  const commande = commandeDuTrimestre(c.code, TRIMESTRE_DE_LA_LIVRAISON);
  const { lignes } = commande;
  const plusGrosse = lignes.reduce((a, b) => (b.commandee > a.commandee ? b : a));
  const plusPetite = lignes.reduce((a, b) => (b.commandee < a.commandee ? b : a));
  const manquants = CARTONS_MANQUANTS * ARTICLES_PAR_CARTON;
  // Le bon de livraison reprend la commande : le fournisseur annonce tout ce qui a été commandé.
  const comptes = lignes.map((l) => ({ ...l, surLeBon: l.commandee, comptee: l.code === plusGrosse.code ? l.commandee - manquants : l.commandee }));
  const totalRecu = comptes.reduce((t, l) => t + l.comptee, 0);
  const ecart = comptes.find((l) => l.code === plusGrosse.code)!;
  return {
    ...commande,
    comptes,
    ecart,
    enTrop: plusPetite,
    manquants,
    totalRecu,
    apresDeLEcart: ecart.avant + ecart.comptee,
    totalApres: commande.totalAvant + totalRecu,
    /** Dans l'arène : ce qui est entré en stock au trimestre, la commande entière. */
    entreDansLArene: Math.round(trimestreDuCours(c.code, TRIMESTRE_DE_LA_LIVRAISON).products![ecart.code]!.produced),
  };
}

const tableauDeLaCommande = (c: Cas) => {
  const l = livraison(c);
  return {
    titre: `La commande ${de(c.entreprise)} au trimestre ${TRIMESTRE_DE_LA_LIVRAISON} (fournisseur : ${l.fournisseur})`,
    colonnes: ["Articles commandés"],
    lignes: l.lignes.map((x) => ({ libelle: x.nom, valeurs: [qte(x.commandee)] })),
  };
};

const tableauDuControle = (c: Cas) => {
  const l = livraison(c);
  return {
    titre: "Le bon de livraison et votre compte, carton par carton",
    colonnes: ["Sur le bon de livraison", "Compté dans les cartons"],
    lignes: l.comptes.map((x) => ({ libelle: x.nom, valeurs: [qte(x.surLeBon), qte(x.comptee)] })),
  };
};

export const RECEVOIR_UNE_LIVRAISON: Chapitre = {
  code: "recevoir-une-livraison",
  parcours: "cap-epc",
  palier: 1,
  blocs: ["CAP EPC Bloc 1 · Recevoir et suivre les commandes"],
  titre: "Recevoir une livraison : le bon de livraison et la commande",
  accroche:
    "Le livreur dépose les cartons et tend un papier à signer. Avant de signer, on compte. Ce que le magasin a commandé, ce que le bon annonce, ce qui est vraiment arrivé.",
  objectifs: [
    "Lire une commande et un bon de livraison",
    "Compter une livraison ligne par ligne",
    "Trouver un écart : un manquant, un article en trop",
    "Écrire une réserve sur le bon avant de signer, et prévenir son responsable",
    "Calculer le stock en réserve après la réception",
  ],
  libre: false,
  entreprises: {
    codes: MAGASINS,
    pourquoi: "ce chapitre reçoit les articles d'un magasin, référence par référence, et elle n'a pas de magasin.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La commande de la boutique",
      notions: ["stock"],
      texte: (c) => {
        const l = livraison(c);
        return [
          `Au trimestre ${TRIMESTRE_DE_LA_LIVRAISON}, ${c.entreprise} commande ${qte(l.totalCommande)} articles à son fournisseur (${l.fournisseur}). Dans l'arène, c'est la case « ${scenarioByCode(c.code).vocabulary.productionPlanLabel} » de la feuille de décision. Le tableau donne la commande, article par article.`,
          "La commande, c'est ce que le magasin a demandé. Le jour de la livraison, le livreur dépose les cartons et vous tend le bon de livraison : ce que le fournisseur dit avoir envoyé. Votre travail : compter ce qui est vraiment arrivé.",
          `Dans l'arène, une livraison arrive toujours complète. Pour vous entraîner, le cours imagine des cartons de ${qte(ARTICLES_PAR_CARTON)} articles, et un carton perdu en route.`,
        ];
      },
      tableau: tableauDeLaCommande,
      repere: () => "La commande : ce qu'on a demandé. Le bon de livraison : ce qu'on dit nous livrer. Le compte : ce qui est vraiment là.",
    },
    {
      id: "total-commande",
      type: "montants",
      titre: "Le total commandé",
      notions: ["stock"],
      tableau: tableauDeLaCommande,
      question: () => "Additionnez les lignes de la commande : combien d'articles le magasin attend-il en tout ?",
      champs: (c) => {
        const l = livraison(c);
        return [
          {
            libelle: "Total des articles commandés",
            attendu: l.totalCommande,
            calcul: `${l.lignes.map((x) => qte(x.commandee)).join(" + ")} = ${qte(l.totalCommande)}`,
          },
        ];
      },
      explication: (c) => {
        const l = livraison(c);
        return [`Le magasin attend ${qte(l.totalCommande)} articles. Ce total servira à la fin : si le compte ne tombe pas juste, il y a un écart quelque part.`];
      },
    },
    {
      id: "le-document",
      type: "choix",
      titre: "Le papier du livreur",
      question: () => "Le livreur arrive avec les cartons. Quel document vous tend-il, pour que vous le signiez ?",
      options: () => [
        {
          texte: "Le bon de livraison",
          juste: true,
          retour: "Oui. Le bon de livraison dit ce que le fournisseur a envoyé. En le signant, vous dites que vous avez bien tout reçu : on compte donc avant de signer.",
        },
        {
          texte: "Le bon de commande",
          juste: false,
          retour: "Non. Le bon de commande, c'est le magasin qui l'a envoyé au fournisseur, avant. Le livreur apporte le bon de livraison.",
        },
        {
          texte: "Le ticket de caisse",
          juste: false,
          retour: "Non. Le ticket de caisse se donne au client qui achète. Le livreur apporte le bon de livraison.",
        },
      ],
    },
    {
      id: "la-ligne",
      type: "choix",
      titre: "La ligne qui ne va pas",
      notions: ["stock"],
      tableau: tableauDuControle,
      question: () => "Vous avez compté les cartons, ligne par ligne. Sur quelle ligne le compte ne correspond-il pas au bon de livraison ?",
      options: (c) => {
        const l = livraison(c);
        return l.comptes.map((x) => ({
          texte: `Les ${x.pluriel}`,
          juste: x.code === l.ecart.code,
          retour:
            x.code === l.ecart.code
              ? `Oui : le bon annonce ${qte(x.surLeBon)} ${x.pluriel}, vous en comptez ${qte(x.comptee)}. Les autres lignes tombent juste.`
              : `Non : ${qte(x.surLeBon)} sur le bon, ${qte(x.comptee)} dans les cartons, la ligne est juste. Regardez les ${l.ecart.pluriel}.`,
        }));
      },
    },
    {
      id: "l-ecart",
      type: "montants",
      titre: "L'écart compté",
      notions: ["stock"],
      tableau: tableauDuControle,
      question: (c) => {
        const l = livraison(c);
        return `Calculez combien ${de(l.ecart.pluriel)} manquent : ce que dit le bon, moins ce que vous avez compté. Puis le total des articles vraiment reçus.`;
      },
      champs: (c) => {
        const l = livraison(c);
        return [
          {
            libelle: `${majuscule(l.ecart.pluriel)} ${accordeA(l.ecart.feminin, "manquant")}`,
            attendu: l.manquants,
            calcul: `${qte(l.ecart.surLeBon)} − ${qte(l.ecart.comptee)} = ${qte(l.manquants)}`,
          },
          {
            libelle: "Total des articles reçus",
            attendu: l.totalRecu,
            calcul: `${l.comptes.map((x) => qte(x.comptee)).join(" + ")} = ${qte(l.totalRecu)}`,
          },
        ];
      },
      explication: (c) => {
        const l = livraison(c);
        return [
          `Il manque ${qte(l.manquants)} ${l.ecart.pluriel}, un carton entier. Le magasin attendait ${qte(l.totalCommande)} articles, il en a reçu ${qte(l.totalRecu)}.`,
        ];
      },
    },
    {
      id: "signer",
      type: "choix",
      titre: "Signer le bon",
      question: (c) => {
        const l = livraison(c);
        return `Il manque ${qte(l.manquants)} ${l.ecart.pluriel}. Le livreur attend votre signature. Que faites-vous ?`;
      },
      options: (c) => {
        const l = livraison(c);
        const manquants = `${qte(l.manquants)} ${l.ecart.pluriel} ${accordeA(l.ecart.feminin, "manquant")}`;
        return [
          {
            texte: `Signer en écrivant sur le bon : « ${manquants} »`,
            juste: true,
            retour: `Oui. C'est la réserve : écrite sur le bon, datée, signée, elle prouve que le carton n'est pas arrivé. Vous prévenez ensuite votre responsable, qui réclame les ${l.ecart.pluriel} au fournisseur.`,
          },
          {
            texte: "Signer sans rien écrire, et prévenir le fournisseur plus tard",
            juste: false,
            retour: `Non. Un bon signé sans réserve dit que tout est arrivé. Le fournisseur pourra répondre que les ${qte(l.manquants)} ${l.ecart.pluriel} ont été livrés.`,
          },
          {
            texte: "Refuser toute la livraison et rendre les cartons",
            juste: false,
            retour: `Non. ${qte(l.totalRecu)} articles sont bien là, et le magasin en a besoin. On garde ce qui est arrivé, et on écrit ce qui manque.`,
          },
        ];
      },
    },
    {
      id: "stock-apres",
      type: "montants",
      titre: "Le stock après la réception",
      notions: ["stock"],
      question: (c) => {
        const l = livraison(c);
        return `Avant la livraison, il y avait ${qte(l.ecart.avant)} ${l.ecart.pluriel} en réserve, et ${qte(l.totalAvant)} articles en tout. Calculez le stock ${de(l.ecart.pluriel)} après la réception, puis le stock total en réserve. Comptez ce que vous avez vraiment reçu.`;
      },
      champs: (c) => {
        const l = livraison(c);
        return [
          {
            libelle: `Stock ${de(l.ecart.pluriel)} après la réception`,
            attendu: l.apresDeLEcart,
            calcul: `${qte(l.ecart.avant)} + ${qte(l.ecart.comptee)} = ${qte(l.apresDeLEcart)}`,
          },
          {
            libelle: "Stock total après la réception",
            attendu: l.totalApres,
            calcul: `${qte(l.totalAvant)} + ${qte(l.totalRecu)} = ${qte(l.totalApres)}`,
          },
        ];
      },
      explication: (c) => {
        const l = livraison(c);
        return [
          `En réserve : ${qte(l.apresDeLEcart)} ${l.ecart.pluriel}, et ${qte(l.totalApres)} articles en tout. Si vous aviez ajouté le bon de livraison au lieu de votre compte, le stock afficherait ${qte(l.manquants)} ${l.ecart.pluriel} de trop : des articles que personne ne trouverait en réserve.`,
        ];
      },
    },
    {
      id: "en-trop",
      type: "choix",
      titre: "Un carton en plus",
      question: (c) => {
        const l = livraison(c);
        return `Une autre fois, un carton de ${qte(ARTICLES_PAR_CARTON)} ${l.enTrop.pluriel} arrive en plus : il n'est ni sur la commande, ni sur le bon. Que faites-vous ?`;
      },
      options: (c) => {
        const l = livraison(c);
        return [
          {
            texte: "L'écrire sur le bon, et prévenir votre responsable",
            juste: true,
            retour: `Oui. Un écart en trop se signale comme un manquant : le fournisseur les facturera peut-être, ou viendra les reprendre. C'est votre responsable qui décide : garder les ${l.enTrop.pluriel}, ou les rendre.`,
          },
          {
            texte: "Les mettre en rayon : ce sont des ventes en plus",
            juste: false,
            retour: `Non. Ces ${l.enTrop.pluriel} ne sont pas commandés : le fournisseur peut les facturer plus tard. Sans rien écrire, le stock ne correspond plus aux papiers.`,
          },
          {
            texte: "Les rendre au livreur sans rien noter",
            juste: false,
            retour: "Non. Rendre peut être la bonne décision, mais elle se prend avec le responsable, et elle s'écrit sur le bon : sinon, rien ne prouve que le carton est reparti.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["stock"],
      texte: (c) => {
        const l = livraison(c);
        return [
          `On compte avant de signer. Ici, le bon annonçait ${qte(l.totalCommande)} articles, il en est arrivé ${qte(l.totalRecu)} : la réserve écrite sur le bon protège le magasin.`,
          `Dans l'arène, la livraison arrive complète : ${qte(l.entreDansLArene)} ${l.ecart.pluriel} entrent en réserve au trimestre ${TRIMESTRE_DE_LA_LIVRAISON}, ce que la boutique a commandé. Dans un vrai magasin, le contrôle trouve parfois un carton qui manque, ou un carton en trop.`,
        ];
      },
      repere: () => "Écart = quantité sur le bon − quantité comptée. Stock après la réception = stock avant + quantité vraiment reçue.",
    },
  ],
};
