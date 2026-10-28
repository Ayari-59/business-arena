import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import { COMMANDES_ESSAYEES, commandeDeFevrier, fevrierAvecUneCommande, rayonDuMois } from "../monde/vente-et-caisse";
import type { Chapitre } from "../types";
import { MAGASINS, accordeA, de, majuscule, motsDe, qte } from "./recevoir-une-livraison";

/**
 * CHAPITRE : REMPLIR LE RAYON AVANT LA RUPTURE (CAP Équipier polyvalent du commerce, palier 1).
 *
 * Le geste de l'équipier en rayon : regarder ce qui reste d'un article, savoir combien il s'en
 * vend par jour, en déduire dans combien de jours le rayon sera vide, et prévenir son responsable
 * à temps, quand le façonnier met trois semaines à livrer. Puis lire ce qu'une rupture a coûté :
 * les clients repartis sans l'article, multipliés par son prix. Un calcul simple par étape : une
 * division, une soustraction, une multiplication. Puis l'expérience : un curseur (le stock qu'il
 * faut encore avoir le jour où l'on commande) et un laboratoire (combien commander pour le mois
 * suivant).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO en janvier (monde/maille-et-co.ts).
 * L'article est celui qui manque dans la fiche : le cardigan, 384 demandés pour 360 en stock (120 au
 * 1er janvier, 240 livrés le 12), 24 ventes manquées. Le façonnier livre en 21 jours. Les calculs
 * sont dans monde/vente-et-caisse.ts.
 *
 * HYPOTHÈSES DU COURS, dites à l'élève : les clients achètent au même rythme tous les jours du mois
 * (le mois commercial de 30 jours de la fiche), et le rythme se retient à l'unité ; au laboratoire,
 * février demande autant de cardigans que janvier, la réserve est vide au 1er février, et la
 * commande se passe en cartons de 10.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait le premier trimestre de l'arène avec la commande du pull
 * col rond oubliée (400 pulls, 19 par jour, 21 jours avant la rupture, 1 326 pulls manqués, 72 930 €
 * de ventes perdues). Il lit maintenant le cardigan de janvier : 120 en stock, 13 par jour, 9 jours
 * avant la rupture, 24 cardigans manqués, 1 800 € de ventes perdues.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Les chiffres du rayon, avec les mots de l'article. */
export function rayon(c: Pick<Cas, "code">) {
  const r = rayonDuMois(ficheDe(c));
  return { ...r, ...motsDe(r.code) };
}

const tableauDuRayon = (c: Cas) => {
  const r = rayon(c);
  return {
    titre: `${c.entreprise} · les ${r.pluriel} en janvier`,
    colonnes: ["Nombre"],
    lignes: [
      { libelle: `${majuscule(r.pluriel)} en stock au 1er janvier`, valeurs: [qte(r.stock)] },
      { libelle: `${majuscule(r.pluriel)} ${accordeA(r.feminin, "demandé")} par les clients dans le mois`, valeurs: [qte(r.demande)] },
      { libelle: "Jours dans le mois", valeurs: [qte(r.jours)] },
      { libelle: "Délai de livraison du façonnier, en jours", valeurs: [qte(r.delai)] },
      { libelle: `Livraison déjà commandée, le ${r.livraison.jour} janvier`, valeurs: [qte(r.livraison.quantite)] },
    ],
  };
};

export const REMPLIR_LE_RAYON: Chapitre = {
  code: "remplir-le-rayon",
  parcours: "cap-epc",
  palier: 1,
  blocs: ["CAP EPC Bloc 2 · Mettre en valeur et approvisionner"],
  titre: "Remplir le rayon avant la rupture",
  accroche:
    "Un rayon vide, c'est un client qui repart sans rien. Combien il en reste, combien il s'en vend par jour, dans combien de jours il n'y en aura plus, quand prévenir, et combien commander.",
  objectifs: [
    "Calculer les ventes d'un article en une journée",
    "Calculer le nombre de jours avant la rupture : stock ÷ ventes par jour",
    "Comparer ces jours au délai du fournisseur, et prévenir à temps",
    "Chiffrer ce que coûte une rupture : les ventes perdues × le prix",
    "Commander juste ce qu'il faut pour le mois suivant",
  ],
  libre: false,
  entreprises: {
    codes: MAGASINS,
    pourquoi: "ce chapitre suit le rayon de la boutique du cours, MAILLE & CO, article par article.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui reste d'un article",
      notions: ["stock"],
      texte: (c) => {
        const r = rayon(c);
        return [
          `Au 1er janvier, ${c.entreprise} a ${qte(r.stock)} ${r.pluriel} en stock, en réserve et en rayon. Une livraison de ${qte(r.livraison.quantite)} ${r.pluriel}, commandée en décembre, est attendue le ${r.livraison.jour} janvier. Le façonnier met ${qte(r.delai)} jours à livrer une commande.`,
          "Chaque matin, l'équipier remplit le rayon avec la réserve. Mais la réserve aussi se vide. S'il voit trop tard qu'il n'en reste presque plus, le rayon reste vide, et les clients repartent sans rien.",
          "Le cours suppose que les clients achètent au même rythme tous les jours du mois.",
        ];
      },
      tableau: tableauDuRayon,
      repere: () => "Ventes par jour = demande ÷ nombre de jours. Jours avant la rupture = stock ÷ ventes par jour.",
    },
    {
      id: "par-jour",
      type: "montants",
      titre: "Les ventes d'une journée",
      notions: ["stock"],
      tableau: tableauDuRayon,
      question: (c) => {
        const r = rayon(c);
        return `Les clients demandent ${qte(r.demande)} ${r.pluriel} en ${qte(r.jours)} jours. Combien en demandent-ils par jour ? Arrondissez à l'unité.`;
      },
      champs: (c) => {
        const r = rayon(c);
        return [{ libelle: `${majuscule(r.pluriel)} ${accordeA(r.feminin, "vendu")} par jour`, attendu: r.parJour, calcul: `${qte(r.demande)} ÷ ${qte(r.jours)} = ${(r.demande / r.jours).toLocaleString("fr-FR")}, arrondi à ${qte(r.parJour)}` }];
      },
      explication: (c) => {
        const r = rayon(c);
        return [`Chaque jour, ${qte(r.parJour)} ${r.pluriel} partent du rayon, si le rayon en a.`];
      },
    },
    {
      id: "jours-avant",
      type: "montants",
      titre: "Les jours avant la rupture",
      notions: ["stock"],
      question: (c) => {
        const r = rayon(c);
        return `Il reste ${qte(r.stock)} ${r.pluriel}, et il s'en vend ${qte(r.parJour)} par jour. Dans combien de jours n'y en aura-t-il plus ? Gardez les jours entiers.`;
      },
      champs: (c) => {
        const r = rayon(c);
        return [{ libelle: "Jours avant la rupture", attendu: r.joursAvant, calcul: `${qte(r.stock)} ÷ ${qte(r.parJour)} = ${qte(r.joursAvant)} jours entiers` }];
      },
      explication: (c) => {
        const r = rayon(c);
        return [`Au bout de ${qte(r.joursAvant)} jours, le dernier article est vendu : le rayon sera vide, et la réserve aussi.`];
      },
    },
    {
      id: "reassort",
      type: "montants",
      titre: "Le temps du réassort",
      notions: ["stock"],
      question: (c) => {
        const r = rayon(c);
        return `Si votre responsable commandait aujourd'hui, 1er janvier, la commande arriverait dans ${qte(r.delai)} jours. Combien de jours le rayon resterait-il vide avant elle ? Puis, avec la livraison déjà commandée qui arrive le matin du ${r.livraison.jour} janvier, combien de jours le rayon sera-t-il vide avant elle ?`;
      },
      champs: (c) => {
        const r = rayon(c);
        return [
          { libelle: "Jours de rayon vide, en commandant aujourd'hui", attendu: r.joursSans, calcul: `${qte(r.delai)} − ${qte(r.joursAvant)} = ${qte(r.joursSans)}` },
          { libelle: `Jours de rayon vide avant la livraison du ${r.livraison.jour}`, attendu: r.joursVidesAvantLaLivraison, calcul: `${qte(r.livraison.jour - 1)} jours avant la livraison − ${qte(r.joursAvant)} jours de stock = ${qte(r.joursVidesAvantLaLivraison)}` },
        ];
      },
      explication: (c) => {
        const r = rayon(c);
        return [
          `Le stock tient ${qte(r.joursAvant)} jours, le réassort en demande ${qte(r.delai)} : ${accordeA(r.feminin, "commandé")} aujourd'hui, les ${r.pluriel} arriveraient ${qte(r.joursSans)} jours trop tard. Heureusement, une livraison a été commandée en décembre : le rayon ne sera vide que ${qte(r.joursVidesAvantLaLivraison)} jours. Il fallait la commander un peu plus tôt.`,
        ];
      },
    },
    {
      id: "le-geste",
      type: "choix",
      titre: "Ce que fait l'équipier",
      question: (c) => {
        const r = rayon(c);
        return `Ce matin, vous avez fait le calcul : ${qte(r.joursAvant)} jours ${de(r.pluriel)}, pour ${qte(r.delai)} jours de réassort. Que faites-vous ?`;
      },
      options: (c) => {
        const r = rayon(c);
        return [
          {
            texte: "Prévenir votre responsable aujourd'hui, avec vos chiffres",
            juste: true,
            retour: `Oui. C'est l'équipier qui voit le rayon : il prévient, le responsable commande. Même en retard, chaque jour compte : prévenu aujourd'hui, le responsable vérifie la livraison attendue et commande la suite.`,
          },
          { texte: "Attendre que le rayon soit vide pour le signaler", juste: false, retour: `Non. Le rayon vide, il faut encore ${qte(r.delai)} jours pour être livré : ${qte(r.delai)} jours de clients qui repartent sans rien.` },
          { texte: "Mettre moins d'articles en rayon pour qu'ils durent", juste: false, retour: "Non. Un rayon à moitié vide vend moins, et les articles restent en réserve. Le stock ne dure pas plus : les clients achètent ailleurs." },
        ];
      },
    },
    {
      id: "ce-que-coute",
      type: "montants",
      titre: "Ce que coûte la rupture",
      notions: ["stock", "revenue"],
      question: (c) => {
        const r = rayon(c);
        return `Sur tout le mois de janvier, la boutique a vendu ${qte(r.vendues)} ${r.pluriel}, pour ${qte(r.demande)} ${accordeA(r.feminin, "demandé")}. Le prix de vente : ${eur(r.prixHt)} hors taxes pièce. Calculez les ${r.pluriel} que les clients n'ont pas ${accordeA(r.feminin, "trouvé")}, puis les ventes perdues en euros.`;
      },
      champs: (c) => {
        const r = rayon(c);
        return [
          { libelle: `${majuscule(r.pluriel)} non ${accordeA(r.feminin, "trouvé")}`, attendu: r.manquees, calcul: `${qte(r.demande)} − ${qte(r.vendues)} = ${qte(r.manquees)}` },
          { libelle: "Ventes perdues hors taxes", attendu: r.ventesPerdues, calcul: `${qte(r.manquees)} × ${eur(r.prixHt)} = ${eur(r.ventesPerdues)}` },
        ];
      },
      explication: (c) => {
        const r = rayon(c);
        return [`${qte(r.manquees)} ${r.pluriel} ${accordeA(r.feminin, "demandé")} n'étaient plus là : ${eur(r.ventesPerdues)} de ventes que la boutique n'a pas faites.`];
      },
    },
    {
      id: "lire-la-rupture",
      type: "choix",
      titre: "Ce que dit la rupture",
      question: (c) => {
        const r = rayon(c);
        return `En janvier, ${qte(r.vendues)} ${r.pluriel} ${accordeA(r.feminin, "vendu")}, ${qte(r.manquees)} non ${accordeA(r.feminin, "trouvé")}. Qu'est-ce qui est vrai ?`;
      },
      options: (c) => {
        const r = rayon(c);
        const plus = r.manquees > r.vendues;
        return [
          {
            texte: "Plus d'articles ont manqué que d'articles vendus",
            juste: plus,
            retour: plus ? `Oui : ${qte(r.manquees)} articles manqués, ${qte(r.vendues)} articles vendus.` : `Non : ${qte(r.manquees)} articles manqués, mais ${qte(r.vendues)} articles vendus.`,
          },
          {
            texte: "La plupart des articles demandés ont été vendus",
            juste: !plus,
            retour: !plus
              ? `Oui : ${qte(r.vendues)} articles vendus, ${qte(r.manquees)} articles manqués. La rupture coûte quand même ${eur(r.ventesPerdues)}, et des clients déçus.`
              : `Non : ${qte(r.vendues)} articles vendus seulement, pour ${qte(r.manquees)} articles manqués.`,
          },
          { texte: "La rupture ne coûte rien : l'article n'a pas été payé au fournisseur", juste: false, retour: `Non. L'article non acheté ne coûte rien, mais la vente perdue, si : ${eur(r.ventesPerdues)} qui ne sont pas entrés dans la caisse.` },
        ];
      },
    },
    {
      id: "quand-prevenir",
      type: "curseur",
      titre: "Quand prévenir ?",
      notions: ["stock"],
      question: (c) => {
        const r = rayon(c);
        return `Le façonnier met ${qte(r.delai)} jours à livrer, et il se vend ${qte(r.parJour)} ${r.pluriel} par jour. Faites varier le stock qui reste le jour où l'équipier prévient : une droite donne ce stock, l'autre ce que les clients achèteront pendant le délai. Placez le curseur sur le plus petit stock qui tient jusqu'à la livraison, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Stock le jour où l'on commande", unite: rayon(c).pluriel }),
      cible: (c) => ({ attendu: rayon(c).stockPourLeDelai, min: 0, max: 500 }),
      zones: ["Le stock tient jusqu'à la livraison", "Le rayon sera vide avant la livraison"],
      rates: () => ({
        dessous: "Avec ce stock, le rayon sera vide avant que la commande arrive : il fallait prévenir plus tôt.",
        dessus: "Ce stock tient, mais un peu moins tiendrait encore : cherchez le plus petit stock.",
      }),
      montrer: "Montrer le stock",
      lecture: (c, q) => {
        const r = rayon(c);
        return [
          { libelle: "Stock le jour de la commande", montant: q, fort: true },
          { libelle: "Ventes pendant le délai", montant: r.parJour * r.delai },
          { libelle: "Jours que le stock tient", montant: Math.floor(q / r.parJour) },
        ];
      },
      droites: (c) => {
        const r = rayon(c);
        return { produit: (q) => q, cout: () => r.parJour * r.delai, libelles: ["Stock le jour de la commande", "Ventes pendant le délai"] };
      },
      explication: (c) => {
        const r = rayon(c);
        return [
          `${qte(r.parJour)} ${r.pluriel} par jour pendant ${qte(r.delai)} jours : il faut en avoir au moins ${qte(r.stockPourLeDelai)} le jour où l'on commande. C'est le seuil où l'équipier prévient son responsable.`,
          `Le 1er janvier, il n'en restait que ${qte(r.stock)} : il fallait prévenir bien avant.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-commande",
      type: "simulation",
      titre: "Le laboratoire de la commande",
      notions: ["stock"],
      question: (c) => {
        const r = rayon(c);
        return `Votre responsable commande à temps, ${qte(r.delai)} jours avant, les ${r.pluriel} de février : la commande arrivera le 1er février. Le cours suppose que février demande autant ${de(r.pluriel)} que janvier, et que la réserve est vide au 1er février. La commande se passe en cartons de 10. Faites-la varier, et relevez le défi.`;
      },
      leviers: (c) => [{ code: "commande", libelle: `${majuscule(rayon(c).pluriel)} ${accordeA(rayon(c).feminin, "commandé")} pour février`, unite: rayon(c).pluriel, ...COMMANDES_ESSAYEES, depart: rayon(c).vendues }],
      lecture: (c, p) => {
        const x = fevrierAvecUneCommande(ficheDe(c), p.commande!);
        return [
          { libelle: "Demandés en février", montant: x.demande, unite: "articles" },
          { libelle: "Vendus en février", montant: x.vendues, unite: "articles" },
          { libelle: "Clients repartis sans l'article", montant: x.manquees, unite: "clients", fort: true },
          { libelle: "Restent en réserve à la fin du mois", montant: x.reste, unite: "articles" },
          { libelle: "Ventes perdues hors taxes", montant: x.ventesPerdues },
          { libelle: "Achat au façonnier", montant: x.achat },
        ];
      },
      graphique: (c) => ({
        levier: "commande",
        courbes: [
          { libelle: "Vendus en février", valeur: (p) => fevrierAvecUneCommande(ficheDe(c), p.commande!).vendues },
          { libelle: "Restent en réserve", valeur: (p) => fevrierAvecUneCommande(ficheDe(c), p.commande!).reste },
        ],
        unite: "articles",
      }),
      defi: (c) => {
        const juste = commandeDeFevrier(ficheDe(c));
        return {
          consigne: "Trouvez la plus petite commande, en cartons entiers, qui ne laisse aucun client sans son article en février.",
          atteint: (p) => p.commande === juste,
          indice: (p) => {
            const x = fevrierAvecUneCommande(ficheDe(c), p.commande!);
            return x.manquees > 0
              ? `${qte(x.manquees)} clients repartiraient sans l'article : commandez plus.`
              : `Personne ne manque, mais ${qte(x.reste)} articles resteraient en réserve : un carton de moins suffirait-il ?`;
          },
          solution: { commande: juste },
        };
      },
      explication: (c, p) => {
        const x = fevrierAvecUneCommande(ficheDe(c), p.commande!);
        return [
          `Défi relevé : ${qte(x.commande)} ${rayon(c).pluriel} servent les ${qte(x.demande)} clients de février, et il n'en reste que ${qte(x.reste)} en réserve. Un carton de moins, et des clients repartiraient sans rien.`,
          `En janvier, la boutique n'en avait que ${qte(rayon(c).vendues)} : c'est ce qui a fait les ${qte(rayon(c).manquees)} ventes perdues.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["stock", "seasonality"],
      texte: (c) => {
        const r = rayon(c);
        return [
          `${majuscule(r.pluriel)} : ${qte(r.stock)} en stock, ${qte(r.parJour)} par jour, ${qte(r.joursAvant)} jours avant la rupture, pour ${qte(r.delai)} jours de réassort. Le rythme change avec la saison : il faut refaire le calcul souvent.`,
          `L'équipier ne commande pas : il compte, il calcule, il prévient à temps. Ici, la rupture a fait perdre ${eur(r.ventesPerdues)} de ventes à la boutique. Dans l'arène, les chiffres de votre entreprise seront différents : le calcul des jours sera le même.`,
        ];
      },
      repere: () => "Jours avant la rupture = stock ÷ ventes par jour. Prévenir quand ces jours approchent du délai du fournisseur. Ventes perdues = articles non trouvés × prix.",
    },
  ],
};
