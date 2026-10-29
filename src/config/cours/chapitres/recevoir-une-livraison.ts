import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { BOUTIQUES_DU_COURS, type CodeDeReference, type FicheDeLaBoutique } from "../monde/maille-et-co";
import {
  ARTICLES_PAR_CARTON,
  cartonsQuiPeuventManquer,
  disponibleAvecDesCartonsManquants,
  receptionDuFaconnier,
  saisieDeLaReception,
} from "../monde/vente-et-caisse";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : RECEVOIR UNE LIVRAISON, LE BON DE LIVRAISON ET LA COMMANDE (CAP Équipier
 * polyvalent du commerce, palier 1).
 *
 * Le geste de l'équipier à la réception : il lit ce que le magasin attend, prend le bon de
 * livraison que le livreur lui tend, compte les articles carton par carton, ligne par ligne,
 * trouve l'écart, l'écrit sur le bon avant de signer (la réserve), prévient son responsable, et
 * calcule le stock en réserve après la réception. Puis l'expérience : un curseur (combien de
 * cartons peuvent manquer avant que le rayon manque des ventes ?) et un laboratoire (saisir en
 * stock et réclamer au fournisseur ce qui est juste).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts), son
 * stock du 1er janvier et les livraisons de janvier de son façonnier, à leur prix d'achat. Les
 * calculs sont dans monde/vente-et-caisse.ts.
 *
 * HYPOTHÈSES DU COURS, dites à l'élève : les livraisons du mois regroupées sur un seul bon ; des
 * cartons de 10 articles ; un carton qui manque sur la ligne la plus grosse.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait la commande du premier trimestre de l'arène (4 564 articles,
 * 4 554 reçus, 5 664 en réserve après). Il lit maintenant le bon de janvier : 1 000 articles sur le
 * bon, 990 reçus, 2 150 en réserve après.
 */

/** Les entreprises du chapitre : la boutique du cours, qui reçoit plusieurs articles de son façonnier. */
export const MAGASINS: readonly string[] = ["boutique"];

/**
 * LE NOM DES ARTICLES DANS UNE PHRASE. La fiche les nomme pour un tableau (« Pull col rond ») ; une
 * phrase demande le pluriel et le genre (« les écharpes manquantes »). Ce n'est pas un chiffre :
 * c'est la façon de dire.
 */
export const ARTICLES_DE_LA_BOUTIQUE: Readonly<Record<CodeDeReference, { pluriel: string; feminin: boolean }>> = {
  "col-rond": { pluriel: "pulls col rond", feminin: false },
  cardigan: { pluriel: "cardigans", feminin: false },
  merinos: { pluriel: "pulls mérinos", feminin: false },
  echarpe: { pluriel: "écharpes", feminin: true },
  bonnet: { pluriel: "bonnets", feminin: false },
};

export const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** « de » devant un nom : élidé devant une voyelle. */
export const de = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Un adjectif accordé au pluriel avec l'article (« manquants », « manquantes »). */
export const accordeA = (feminin: boolean, adjectif: string) => `${adjectif}${feminin ? "es" : "s"}`;
export const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Les mots d'une référence : son pluriel et son genre. */
export const motsDe = (code: CodeDeReference) => ARTICLES_DE_LA_BOUTIQUE[code];

/** La livraison du chapitre, avec les mots de chaque ligne. */
export function livraison(c: Pick<Cas, "code">) {
  const r = receptionDuFaconnier(ficheDe(c));
  const avecLesMots = <T extends { code: CodeDeReference }>(l: T) => ({ ...l, ...motsDe(l.code) });
  return { ...r, lignes: r.lignes.map(avecLesMots), comptes: r.comptes.map(avecLesMots), ecart: avecLesMots(r.ecart), enTrop: avecLesMots(r.enTrop) };
}

const tableauDeLaCommande = (c: Cas) => {
  const l = livraison(c);
  return {
    titre: `Ce que le façonnier livre à ${c.entreprise} en janvier`,
    colonnes: ["Articles attendus"],
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
    "Le livreur dépose les cartons et tend un papier à signer. Avant de signer, on compte. Ce que le magasin a commandé, ce que le bon annonce, ce qui est vraiment arrivé, et ce qu'on saisit en stock.",
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
    pourquoi: "ce chapitre reçoit les articles de la boutique du cours, MAILLE & CO, référence par référence.",
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
          `En janvier, ${c.entreprise} attend ${qte(l.totalCommande)} articles de son façonnier. Le tableau les donne, article par article : c'est la commande, ce que le magasin a demandé.`,
          "Le jour de la livraison, le livreur dépose les cartons et vous tend le bon de livraison : ce que le fournisseur dit avoir envoyé. Votre travail : compter ce qui est vraiment arrivé.",
          `Pour l'exercice, le cours regroupe les livraisons du mois sur un seul bon, en cartons de ${qte(ARTICLES_PAR_CARTON)} articles, et imagine un carton perdu en route.`,
        ];
      },
      tableau: tableauDeLaCommande,
      repere: () => "La commande : ce qu'on a demandé. Le bon de livraison : ce qu'on dit nous livrer. Le compte : ce qui est vraiment là.",
    },
    {
      id: "total-commande",
      objectifs: [0],
      type: "montants",
      titre: "Le total commandé",
      notions: ["stock"],
      tableau: tableauDeLaCommande,
      question: () => "Additionnez les lignes de la commande : combien d'articles le magasin attend-il en tout ?",
      champs: (c) => {
        const l = livraison(c);
        return [{ libelle: "Total des articles commandés", attendu: l.totalCommande, calcul: `${l.lignes.map((x) => qte(x.commandee)).join(" + ")} = ${qte(l.totalCommande)}` }];
      },
      explication: (c) => [`Le magasin attend ${qte(livraison(c).totalCommande)} articles. Ce total servira à la fin : si le compte ne tombe pas juste, il y a un écart quelque part.`],
    },
    {
      id: "le-document",
      objectifs: [0],
      type: "choix",
      titre: "Le papier du livreur",
      question: () => "Le livreur arrive avec les cartons. Quel document vous tend-il, pour que vous le signiez ?",
      options: () => [
        { texte: "Le bon de livraison", juste: true, retour: "Oui. Le bon de livraison dit ce que le fournisseur a envoyé. En le signant, vous dites que vous avez bien tout reçu : on compte donc avant de signer." },
        { texte: "Le bon de commande", juste: false, retour: "Non. Le bon de commande, c'est le magasin qui l'a envoyé au fournisseur, avant. Le livreur apporte le bon de livraison." },
        { texte: "Le ticket de caisse", juste: false, retour: "Non. Le ticket de caisse se donne au client qui achète. Le livreur apporte le bon de livraison." },
      ],
    },
    {
      id: "la-ligne",
      objectifs: [1, 2],
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
      objectifs: [2],
      type: "montants",
      titre: "L'écart compté",
      notions: ["stock"],
      tableau: tableauDuControle,
      question: (c) => `Calculez combien ${de(livraison(c).ecart.pluriel)} manquent : ce que dit le bon, moins ce que vous avez compté. Puis le total des articles vraiment reçus.`,
      champs: (c) => {
        const l = livraison(c);
        return [
          { libelle: `${majuscule(l.ecart.pluriel)} ${accordeA(l.ecart.feminin, "manquant")}`, attendu: l.manquants, calcul: `${qte(l.ecart.surLeBon)} − ${qte(l.ecart.comptee)} = ${qte(l.manquants)}` },
          { libelle: "Total des articles reçus", attendu: l.totalRecu, calcul: `${l.comptes.map((x) => qte(x.comptee)).join(" + ")} = ${qte(l.totalRecu)}` },
        ];
      },
      explication: (c) => {
        const l = livraison(c);
        return [`Il manque ${qte(l.manquants)} ${l.ecart.pluriel}, un carton entier. Le magasin attendait ${qte(l.totalCommande)} articles, il en a reçu ${qte(l.totalRecu)}.`];
      },
    },
    {
      id: "signer",
      objectifs: [3],
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
          { texte: "Signer sans rien écrire, et prévenir le fournisseur plus tard", juste: false, retour: `Non. Un bon signé sans réserve dit que tout est arrivé. Le fournisseur pourra répondre que les ${qte(l.manquants)} ${l.ecart.pluriel} ont été livrés.` },
          { texte: "Refuser toute la livraison et rendre les cartons", juste: false, retour: `Non. ${qte(l.totalRecu)} articles sont bien là, et le magasin en a besoin. On garde ce qui est arrivé, et on écrit ce qui manque.` },
        ];
      },
    },
    {
      id: "stock-apres",
      objectifs: [4],
      type: "montants",
      titre: "Le stock après la réception",
      notions: ["stock"],
      question: (c) => {
        const l = livraison(c);
        return `Au 1er janvier, il y avait ${qte(l.ecart.avant)} ${l.ecart.pluriel} en réserve, et ${qte(l.totalAvant)} articles en tout. Calculez le stock ${de(l.ecart.pluriel)} après la réception, puis le stock total en réserve. Comptez ce que vous avez vraiment reçu.`;
      },
      champs: (c) => {
        const l = livraison(c);
        return [
          { libelle: `Stock ${de(l.ecart.pluriel)} après la réception`, attendu: l.apresDeLEcart, calcul: `${qte(l.ecart.avant)} + ${qte(l.ecart.comptee)} = ${qte(l.apresDeLEcart)}` },
          { libelle: "Stock total après la réception", attendu: l.totalApres, calcul: `${qte(l.totalAvant)} + ${qte(l.totalRecu)} = ${qte(l.totalApres)}` },
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
      objectifs: [2, 3],
      type: "choix",
      titre: "Un carton en plus",
      question: (c) => `Une autre fois, un carton de ${qte(ARTICLES_PAR_CARTON)} ${livraison(c).enTrop.pluriel} arrive en plus : il n'est ni sur la commande, ni sur le bon. Que faites-vous ?`,
      options: (c) => {
        const l = livraison(c);
        return [
          {
            texte: "L'écrire sur le bon, et prévenir votre responsable",
            juste: true,
            retour: `Oui. Un écart en trop se signale comme un manquant : le fournisseur les facturera peut-être, ou viendra les reprendre. C'est votre responsable qui décide : garder les ${l.enTrop.pluriel}, ou les rendre.`,
          },
          { texte: "Les mettre en rayon : ce sont des ventes en plus", juste: false, retour: `Non. Ces ${l.enTrop.pluriel} ne sont pas commandés : le fournisseur peut les facturer plus tard. Sans rien écrire, le stock ne correspond plus aux papiers.` },
          { texte: "Les rendre au livreur sans rien noter", juste: false, retour: "Non. Rendre peut être la bonne décision, mais elle se prend avec le responsable, et elle s'écrit sur le bon : sinon, rien ne prouve que le carton est reparti." },
        ];
      },
    },
    {
      id: "combien-peuvent-manquer",
      objectifs: [4],
      type: "curseur",
      titre: "Combien de cartons peuvent manquer ?",
      notions: ["stock"],
      question: (c) => {
        const l = livraison(c);
        const demande = ficheDe(c).gamme.find((r) => r.code === l.ecart.code)!.demandeDuMois;
        return `En janvier, les clients demandent ${qte(demande)} ${l.ecart.pluriel}. Il y en avait ${qte(l.ecart.avant)} en réserve, et le bon en annonce ${qte(l.ecart.surLeBon)}. Faites varier les cartons qui manquent sur cette ligne : une droite donne les ${l.ecart.pluriel} disponibles dans le mois, l'autre la demande. Placez le curseur sur le plus grand nombre de cartons qui peuvent manquer sans qu'un client reparte sans son article, puis validez.`;
      },
      grandeur: () => ({ libelle: "Cartons manquants sur la ligne", unite: "cartons" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: cartonsQuiPeuventManquer(ficheDe(c)), min: 0, max: 50 }),
      zones: ["Le rayon sert toute la demande du mois", "Des clients repartent sans leur article"],
      rates: () => ({
        dessous: "Le rayon tient encore : un carton de plus peut manquer. Cherchez le plus grand nombre.",
        dessus: "Avec autant de cartons perdus, le rayon ne sert plus toute la demande du mois.",
      }),
      montrer: "Montrer les cartons",
      lecture: (c, q) => {
        const l = livraison(c);
        const demande = ficheDe(c).gamme.find((r) => r.code === l.ecart.code)!.demandeDuMois;
        const dispo = disponibleAvecDesCartonsManquants(ficheDe(c), q);
        return [
          { libelle: "Articles manquants sur la ligne", montant: q * ARTICLES_PAR_CARTON },
          { libelle: "Disponibles dans le mois", montant: dispo, fort: true },
          { libelle: "Demandés dans le mois", montant: demande },
        ];
      },
      droites: (c) => {
        const demande = ficheDe(c).gamme.find((r) => r.code === livraison(c).ecart.code)!.demandeDuMois;
        return { produit: (q) => disponibleAvecDesCartonsManquants(ficheDe(c), q), cout: () => demande, libelles: ["Articles disponibles dans le mois", "Articles demandés"] };
      },
      explication: (c) => {
        const l = livraison(c);
        const q = cartonsQuiPeuventManquer(ficheDe(c));
        return [
          `Jusqu'à ${qte(q)} cartons perdus, la réserve suffit encore pour le mois. Ici, ${qte(l.manquants / ARTICLES_PAR_CARTON)} sur ${qte(l.ecart.surLeBon / ARTICLES_PAR_CARTON)} manque : le rayon n'en souffre pas.`,
          `Mais le façonnier facture ce que dit le bon. Sans la réserve écrite, la boutique paierait les ${qte(l.manquants)} ${l.ecart.pluriel} qu'elle n'a pas reçus, même si ses clients ne s'en aperçoivent pas.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-saisie",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de la saisie",
      notions: ["stock"],
      question: (c) => {
        const l = livraison(c);
        return `Après la réception, vous saisissez les ${l.ecart.pluriel} reçus dans le stock de la caisse, et votre responsable réclame au façonnier ce qui manque. Le façonnier facture ce que dit le bon : ${qte(l.ecart.surLeBon)} ${l.ecart.pluriel} à ${eur(l.ecart.prixDAchat)} pièce. Faites varier ce que vous saisissez et ce que vous réclamez, et relevez le défi.`;
      },
      leviers: (c) => {
        const l = livraison(c);
        return [
          { code: "saisis", libelle: `${majuscule(l.ecart.pluriel)} ${accordeA(l.ecart.feminin, "saisi")} en stock`, unite: "articles", min: l.ecart.surLeBon - 3 * ARTICLES_PAR_CARTON, max: l.ecart.surLeBon + ARTICLES_PAR_CARTON, pas: ARTICLES_PAR_CARTON, depart: l.ecart.surLeBon },
          { code: "reclames", libelle: `${majuscule(l.ecart.pluriel)} ${accordeA(l.ecart.feminin, "réclamé")} au façonnier`, unite: "articles", min: 0, max: 3 * ARTICLES_PAR_CARTON, pas: ARTICLES_PAR_CARTON, depart: 0 },
        ];
      },
      lecture: (c, p) => {
        const x = saisieDeLaReception(ficheDe(c), p.saisis!, p.reclames!);
        return [
          { libelle: "Stock affiché par la caisse", montant: x.enMachine, unite: "articles", reference: x.enReserve },
          { libelle: "Stock vraiment en réserve", montant: x.enReserve, unite: "articles" },
          { libelle: "Écart entre le stock affiché et la réserve", montant: x.ecartDInventaire, unite: "articles", fort: true },
          { libelle: "Facture du façonnier pour la ligne", montant: x.facture },
          { libelle: "Avoir réclamé", montant: x.avoir },
          { libelle: "Payé pour des articles jamais reçus", montant: x.payeSansEtreRecu, fort: true },
        ];
      },
      defi: (c) => {
        const l = livraison(c);
        return {
          consigne: "Faites que le stock affiché soit celui de la réserve, et que la boutique ne paie ni plus ni moins que ce qu'elle a reçu.",
          atteint: (p) => saisieDeLaReception(ficheDe(c), p.saisis!, p.reclames!).juste,
          indice: (p) => {
            const x = saisieDeLaReception(ficheDe(c), p.saisis!, p.reclames!);
            if (x.ecartDInventaire !== 0) return `Le stock affiché compte ${qte(Math.abs(x.ecartDInventaire))} articles ${x.ecartDInventaire > 0 ? "de trop" : "de moins"} : on saisit ce qu'on a compté, pas ce que dit le bon.`;
            return x.payeSansEtreRecu > 0
              ? `La boutique paierait ${eur(x.payeSansEtreRecu)} pour des articles qu'elle n'a pas reçus : réclamez ce qui manque.`
              : "La boutique réclame plus que ce qui manque : le façonnier refusera. Réclamez seulement ce qui manque.";
          },
          solution: { saisis: l.ecart.comptee, reclames: l.manquants },
        };
      },
      explication: (c, p) => {
        const x = saisieDeLaReception(ficheDe(c), p.saisis!, p.reclames!);
        return [
          `Défi relevé : le stock affiché est de ${qte(x.enMachine)} articles, comme la réserve, et la boutique paie ${eur(x.aPayer)} au lieu de ${eur(x.facture)}, grâce à l'avoir de ${eur(x.avoir)}.`,
          "On saisit ce qu'on a compté, et on réclame ce qui manque. C'est la réserve écrite sur le bon qui permet de réclamer.",
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
          `On compte avant de signer. Ici, le bon annonçait ${qte(l.totalCommande)} articles, il en est arrivé ${qte(l.totalRecu)} : la réserve écrite sur le bon protège le magasin, et l'avoir lui évite de payer ${eur(l.manquants * l.ecart.prixDAchat)} pour rien.`,
          "Dans l'arène, la livraison arrive toujours complète, et les chiffres de votre entreprise seront différents. Dans un vrai magasin, le contrôle trouve parfois un carton qui manque, ou un carton en trop.",
        ];
      },
      repere: () => "Écart = quantité sur le bon − quantité comptée. Stock après la réception = stock avant + quantité vraiment reçue.",
    },
  ],
};
