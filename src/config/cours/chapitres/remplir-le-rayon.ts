import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import { rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";
import { MAGASINS, accordeA, de, qte, referencesDuMagasin, stockAuDebut } from "./recevoir-une-livraison";

/**
 * CHAPITRE : REMPLIR LE RAYON AVANT LA RUPTURE (CAP Équipier polyvalent du commerce, palier 1).
 *
 * Le geste de l'équipier en rayon : regarder ce qui reste d'un article, en réserve et en rayon,
 * savoir combien il s'en vend par jour, en déduire dans combien de jours le rayon sera vide, et
 * prévenir son responsable à temps, quand le fournisseur met plusieurs semaines à livrer. Puis
 * lire ce qu'une rupture a coûté dans l'arène : les clients repartis sans l'article, multipliés
 * par son prix. Un calcul simple par étape : une division, une soustraction, une multiplication.
 *
 * CE QUI VIENT DE L'ARÈNE. L'année du cours (`anneeJouee`) chez MAILLE & CO, référence par
 * référence. La gestion du cours commande chaque article à chaque trimestre : l'année du cours n'a
 * aucun article sans commande (la garde le vérifie). Le chapitre rejoue donc l'année avec une
 * commande oubliée (`sansLaCommande`) : au trimestre étudié, la commande d'un seul article mise à
 * zéro, la seule décision changée. L'article étudié est celui qui commence le trimestre avec du
 * stock et le finit en rupture (`lost` > 0) ; parmi tous les trimestres et tous les articles,
 * celui dont la rupture a coûté le plus (`lost` × `price`). Le stock du début est celui de la fin
 * du trimestre d'avant (`stock.quantity`), la demande est ce que les clients ont acheté (`sold`)
 * plus ce qu'ils n'ont pas trouvé (`lost`), le trimestre dure `roundDays` jours.
 *
 * CE QUE L'ARÈNE NE FAIT PAS. Le moteur compte par trimestre, pas par jour : les ventes d'une
 * journée sont la demande du trimestre répartie sur ses jours, un rythme régulier que le texte
 * annonce. Il ne pose pas non plus de délai de livraison : le délai du cours est une hypothèse,
 * prise dans la fiche du fournisseur que l'arène montre au joueur (`DELAI_DE_REASSORT`).
 *
 * « Le stock du point de vente » (BTS MCO) mesure la rotation et la couverture ; « Le stock de
 * sécurité » (logistique) calcule le point de commande d'un entrepôt. Ce chapitre-ci reste au
 * rayon, au niveau du CAP : combien de jours, et quand prévenir.
 */

/**
 * LE DÉLAI DE RÉASSORT, HYPOTHÈSE DU COURS. Le moteur n'en pose pas. Le cours prend celui que la
 * fiche du fournisseur annonce au joueur : le façonnier de référence de MAILLE & CO promet un
 * « réassort en six semaines », soit 42 jours. La garde vérifie que la fiche le dit toujours.
 */
export const DELAI_DE_REASSORT = { jours: 42, annonce: "réassort en six semaines" } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Les trimestres de l'année du cours, ceux du joueur. */
const anneeDuCours = (code: string) => anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);

/**
 * L'année du cours rejouée avec une commande oubliée : au trimestre donné, rien de commandé pour
 * l'article donné, la seule décision changée.
 */
export const sansLaCommande = (code: string, trimestre: number, article: string) =>
  rejouerAvec(code, `remplir-le-rayon:sans-commande:${trimestre}:${article}`, (t, d) =>
    t === trimestre && d.products?.[article] ? { ...d, products: { ...d.products, [article]: { ...d.products[article]!, productionPlan: 0 } } } : undefined,
  );

/** Un article d'un trimestre, vu du rayon : dans l'année du cours, ou dans les trimestres donnés. */
export function articleDuTrimestre(code: string, trimestre: number, article: string, tours: readonly CompanyRoundResult[] = anneeDuCours(code)) {
  const s = scenarioByCode(code).scenario;
  const r = tours[trimestre - 1]!.products![article]!;
  const a = referencesDuMagasin(code).find((x) => x.code === article)!;
  const avant = trimestre > 1 ? tours[trimestre - 2]!.products![article]! : null;
  const vendues = Math.round(r.sold);
  const perdues = Math.round(r.lost);
  return {
    ...a,
    trimestre,
    jours: s.roundDays,
    stock: avant ? Math.round(avant.stock.quantity) : (stockAuDebut(code, 1)[article] ?? 0),
    commandee: Math.round(r.planned),
    /** Ce que la gestion du cours a commandé ce trimestre-là, dans l'année du cours. */
    commandeeDansLAnnee: Math.round(anneeDuCours(code)[trimestre - 1]!.products![article]!.planned),
    vendues,
    perdues,
    demande: vendues + perdues,
    demandeAvant: avant ? Math.round(avant.sold + avant.lost) : null,
    prix: auCentime(r.price),
    fournisseur: r.supplier?.code ?? "",
  };
}

const enRupture = new Map<string, ReturnType<typeof articleDuTrimestre>>();

/**
 * L'article du chapitre : sa commande oubliée au trimestre, parti avec du stock, fini en rupture.
 * Chaque trimestre et chaque article qui commence avec du stock se rejouent sans leur commande ;
 * le chapitre retient la rupture qui a coûté le plus.
 */
export function articleEnRupture(code: string) {
  const deja = enRupture.get(code);
  if (deja) return deja;
  const candidats = [1, 2, 3, 4].flatMap((t) =>
    referencesDuMagasin(code)
      .filter((a) => (stockAuDebut(code, t)[a.code] ?? 0) > 0)
      .map((a) => articleDuTrimestre(code, t, a.code, sansLaCommande(code, t, a.code)))
      .filter((x) => x.commandee === 0 && x.stock > 0 && x.perdues > 0),
  );
  if (candidats.length === 0) throw new Error(`Aucun article en rupture sans commande chez ${code}`);
  const x = candidats.reduce((a, b) => (b.perdues * b.prix > a.perdues * a.prix ? b : a));
  enRupture.set(code, x);
  return x;
}

/** Les chiffres du rayon : le rythme, les jours qui restent, le réassort, la rupture. */
export function calculsDuRayon(x: ReturnType<typeof articleDuTrimestre>, stock = x.stock) {
  const parJour = Math.round(x.demande / x.jours);
  const joursAvant = Math.floor(stock / parJour);
  const delai = DELAI_DE_REASSORT.jours;
  return {
    parJour,
    joursAvant,
    delai,
    /** Les jours sans l'article, même en prévenant aujourd'hui : le réassort arrive après la rupture. */
    joursSans: Math.max(0, delai - joursAvant),
    aTemps: joursAvant >= delai,
    ventesPerdues: auCentime(x.perdues * x.prix),
  };
}

export function rayon(c: Cas) {
  const x = articleEnRupture(c.code);
  return { x, ...calculsDuRayon(x) };
}

const tableauDuRayon = (c: Cas) => {
  const { x } = rayon(c);
  return {
    titre: `${c.entreprise} · les ${x.pluriel} au trimestre ${x.trimestre}`,
    colonnes: ["Nombre"],
    lignes: [
      { libelle: `${majuscule(x.pluriel)} en stock au début du trimestre`, valeurs: [qte(x.stock)] },
      { libelle: `${majuscule(x.pluriel)} ${accordeA(x.feminin, "commandé")} pendant le trimestre`, valeurs: [qte(x.commandee)] },
      { libelle: `${majuscule(x.pluriel)} ${accordeA(x.feminin, "demandé")} par les clients`, valeurs: [qte(x.demande)] },
      { libelle: "Jours dans le trimestre", valeurs: [qte(x.jours)] },
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
    "Un rayon vide, c'est un client qui repart sans rien. Combien il en reste, combien il s'en vend par jour, dans combien de jours il n'y en aura plus, et quand prévenir.",
  objectifs: [
    "Calculer les ventes d'un article en une journée",
    "Calculer le nombre de jours avant la rupture : stock ÷ ventes par jour",
    "Comparer ces jours au délai du fournisseur, et prévenir à temps",
    "Chiffrer ce que coûte une rupture : les ventes perdues × le prix",
  ],
  libre: false,
  entreprises: {
    codes: MAGASINS,
    pourquoi: "ce chapitre suit le rayon d'un magasin, article par article, et elle n'a pas de rayon.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui reste d'un article",
      notions: ["stock"],
      texte: (c) => {
        const { x } = rayon(c);
        return [
          `Au début du trimestre ${x.trimestre}, ${c.entreprise} a ${qte(x.stock)} ${x.pluriel} en stock, en réserve et en rayon. Dans l'année du cours, elle en commande ${qte(x.commandeeDansLAnnee)} pendant ce trimestre. L'arène rejoue l'année avec cette commande oubliée : au trimestre ${x.trimestre}, elle n'en commande aucun${x.feminin ? "e" : ""}, et rien d'autre ne change. Le tableau donne les chiffres de l'arène rejouée.`,
          "Chaque matin, l'équipier remplit le rayon avec la réserve. Mais la réserve aussi se vide. S'il voit trop tard qu'il n'en reste presque plus, le rayon reste vide, et les clients repartent sans rien.",
          `L'arène compte par trimestre, pas par jour. Le cours suppose donc que les clients achètent au même rythme tous les jours du trimestre.`,
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
        const { x } = rayon(c);
        return `Les clients demandent ${qte(x.demande)} ${x.pluriel} en ${qte(x.jours)} jours. Combien en demandent-ils par jour ? Arrondissez à l'unité.`;
      },
      champs: (c) => {
        const r = rayon(c);
        return [
          {
            libelle: `${majuscule(r.x.pluriel)} ${accordeA(r.x.feminin, "vendu")} par jour`,
            attendu: r.parJour,
            calcul: `${qte(r.x.demande)} ÷ ${qte(r.x.jours)} = ${qte(r.parJour)}, arrondi à l'unité`,
          },
        ];
      },
      explication: (c) => {
        const r = rayon(c);
        return [`Chaque jour, ${qte(r.parJour)} ${r.x.pluriel} partent du rayon, si le rayon en a.`];
      },
    },
    {
      id: "jours-avant",
      type: "montants",
      titre: "Les jours avant la rupture",
      notions: ["stock"],
      question: (c) => {
        const r = rayon(c);
        return `Il reste ${qte(r.x.stock)} ${r.x.pluriel}, et il s'en vend ${qte(r.parJour)} par jour. Dans combien de jours n'y en aura-t-il plus ? Gardez les jours entiers.`;
      },
      champs: (c) => {
        const r = rayon(c);
        return [
          {
            libelle: "Jours avant la rupture",
            attendu: r.joursAvant,
            calcul: `${qte(r.x.stock)} ÷ ${qte(r.parJour)} = ${qte(r.joursAvant)} jours entiers`,
          },
        ];
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
        return `La fiche du fournisseur annonce un « ${DELAI_DE_REASSORT.annonce} » : ${qte(r.delai)} jours entre la commande et la livraison. Si votre responsable commande aujourd'hui, combien de jours le rayon restera-t-il vide avant la livraison ? Écrivez 0 si la livraison arrive à temps.`;
      },
      champs: (c) => {
        const r = rayon(c);
        return [
          {
            libelle: "Jours avec un rayon vide",
            attendu: r.joursSans,
            calcul: r.aTemps
              ? `${qte(r.joursAvant)} jours de stock, plus que ${qte(r.delai)} jours de délai : 0`
              : `${qte(r.delai)} − ${qte(r.joursAvant)} = ${qte(r.joursSans)}`,
          },
        ];
      },
      explication: (c) => {
        const r = rayon(c);
        return [
          r.aTemps
            ? `Le stock tient ${qte(r.joursAvant)} jours, plus que les ${qte(r.delai)} jours du réassort : une commande passée aujourd'hui arrive avant la rupture.`
            : `Le stock tient ${qte(r.joursAvant)} jours, le réassort en demande ${qte(r.delai)} : même ${accordeA(r.x.feminin, "commandé")} aujourd'hui, les ${r.x.pluriel} arrivent ${qte(r.joursSans)} jours trop tard. Il fallait prévenir plus tôt.`,
        ];
      },
    },
    {
      id: "le-geste",
      type: "choix",
      titre: "Ce que fait l'équipier",
      question: (c) => {
        const r = rayon(c);
        return `Ce matin, vous avez fait le calcul : ${qte(r.joursAvant)} jours ${de(r.x.pluriel)}, pour ${qte(r.delai)} jours de réassort. Que faites-vous ?`;
      },
      options: (c) => {
        const r = rayon(c);
        return [
          {
            texte: "Prévenir votre responsable aujourd'hui, avec vos chiffres",
            juste: true,
            retour: r.aTemps
              ? `Oui. C'est l'équipier qui voit le rayon : il prévient, le responsable commande. Avec ${qte(r.joursAvant)} jours de stock, la commande arrive à temps.`
              : `Oui. Même en retard, chaque jour compte : prévenu aujourd'hui, le responsable commande, et le rayon ne reste vide que ${qte(r.joursSans)} jours. Chaque jour d'attente en ajoute un.`,
          },
          {
            texte: "Attendre que le rayon soit vide pour le signaler",
            juste: false,
            retour: `Non. Le rayon vide, il faut encore ${qte(r.delai)} jours pour être livré : ${qte(r.delai)} jours de clients qui repartent sans rien.`,
          },
          {
            texte: "Mettre moins d'articles en rayon pour qu'ils durent",
            juste: false,
            retour: "Non. Un rayon à moitié vide vend moins, et les articles restent en réserve. Le stock ne dure pas plus : les clients achètent ailleurs.",
          },
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
        return `Dans l'arène rejouée, la boutique a vendu ${qte(r.x.vendues)} ${r.x.pluriel} au trimestre ${r.x.trimestre}, pour ${qte(r.x.demande)} ${accordeA(r.x.feminin, "demandé")}. Le prix de vente : ${eur(r.x.prix)} pièce. Calculez les ${r.x.pluriel} que les clients n'ont pas ${accordeA(r.x.feminin, "trouvé")}, puis les ventes perdues en euros.`;
      },
      champs: (c) => {
        const r = rayon(c);
        return [
          {
            libelle: `${majuscule(r.x.pluriel)} non ${accordeA(r.x.feminin, "trouvé")}`,
            attendu: r.x.perdues,
            calcul: `${qte(r.x.demande)} − ${qte(r.x.vendues)} = ${qte(r.x.perdues)}`,
          },
          {
            libelle: "Ventes perdues",
            attendu: r.ventesPerdues,
            calcul: `${qte(r.x.perdues)} × ${eur(r.x.prix)} = ${eur(r.ventesPerdues)}`,
          },
        ];
      },
      explication: (c) => {
        const r = rayon(c);
        return [
          `${qte(r.x.perdues)} ${r.x.pluriel} ${accordeA(r.x.feminin, "demandé")} n'étaient plus là : ${eur(r.ventesPerdues)} de ventes que la boutique n'a pas faites. Dans l'arène, c'est la colonne « Manqué » du tableau des références.`,
        ];
      },
    },
    {
      id: "lire-la-rupture",
      type: "choix",
      titre: "Ce que dit la rupture",
      question: (c) => {
        const r = rayon(c);
        return `Au trimestre ${r.x.trimestre}, ${qte(r.x.vendues)} ${r.x.pluriel} ${accordeA(r.x.feminin, "vendu")}, ${qte(r.x.perdues)} non ${accordeA(r.x.feminin, "trouvé")}. Qu'est-ce qui est vrai ?`;
      },
      options: (c) => {
        const r = rayon(c);
        const plus = r.x.perdues > r.x.vendues;
        return [
          {
            texte: "Plus d'articles ont manqué que d'articles vendus",
            juste: plus,
            retour: plus
              ? `Oui : ${qte(r.x.perdues)} articles manqués, ${qte(r.x.vendues)} articles vendus. La rupture a fait perdre plus de ventes que le stock n'en a fait.`
              : `Non : ${qte(r.x.perdues)} articles manqués, mais ${qte(r.x.vendues)} articles vendus.`,
          },
          {
            texte: "La plupart des articles demandés ont été vendus",
            juste: !plus,
            retour: !plus
              ? `Oui : ${qte(r.x.vendues)} articles vendus, ${qte(r.x.perdues)} articles manqués. La rupture coûte quand même ${eur(r.ventesPerdues)}.`
              : `Non : ${qte(r.x.vendues)} articles vendus seulement, pour ${qte(r.x.perdues)} articles manqués : plus de la moitié des clients sont repartis sans rien.`,
          },
          {
            texte: "La rupture ne coûte rien : l'article n'a pas été payé au fournisseur",
            juste: false,
            retour: `Non. L'article non acheté ne coûte rien, mais la vente perdue, si : ${eur(r.ventesPerdues)} qui ne sont pas entrés dans la caisse.`,
          },
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
        const avant =
          r.x.demandeAvant !== null
            ? ` Au trimestre d'avant, les clients en demandaient ${qte(r.x.demandeAvant)} : le rythme change avec la saison, il faut refaire le calcul souvent.`
            : "";
        return [
          `${majuscule(r.x.pluriel)} : ${qte(r.x.stock)} en stock, ${qte(r.parJour)} par jour, ${qte(r.joursAvant)} jours avant la rupture, pour ${qte(r.delai)} jours de réassort.${avant}`,
          `L'équipier ne commande pas : il compte, il calcule, il prévient à temps. Ici, la rupture a fait perdre ${eur(r.ventesPerdues)} de ventes à la boutique.`,
        ];
      },
      repere: () => "Jours avant la rupture = stock ÷ ventes par jour. Prévenir quand ces jours approchent du délai du fournisseur. Ventes perdues = articles non trouvés × prix.",
    },
  ],
};
