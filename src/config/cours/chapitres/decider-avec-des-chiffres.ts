import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import {
  BUDGETS_ESSAYES,
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FICHE_DU_MARCHE,
  PUBLICITE_ENVISAGEE,
  anneeAvecLaPublicite,
  deuxChoix as deuxChoixDuMarche,
  meilleurBudgetDePublicite,
} from "../monde/gestion-et-information";
import { GAMME_DE_NOVA } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DÉCIDER AVEC DES CHIFFRES, COMPARER DEUX CHOIX (seconde, management et gestion,
 * palier 1).
 *
 * Une décision simple, que tout dirigeant prend : faire de la publicité toute l'année, ou s'en
 * passer. Le chapitre suit le raisonnement en trois temps que le programme de seconde demande :
 * PRÉVOIR (ce que chaque choix coûte, et ce que la publicité doit faire gagner pour se payer),
 * CHOISIR (une règle fixée avant de connaître la réponse), CONSTATER (l'année jouée avec chaque
 * choix, face aux mêmes concurrents). Un curseur (les ventes qui paient la publicité) et un
 * laboratoire (le budget qui donne le meilleur résultat).
 *
 * Il ne double pas « Décider : prix, fabriquer ou acheter » (palier 4), ni « Ce que rapporte la
 * communication » (bac STMG) : ici, deux choix seulement, sur l'année entière, et la méthode avant le
 * calcul.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule, sur le marché à trois (marche-a-trois.ts
 * et attractivite.ts) : pendant son premier exercice, NOVA ne paie aucune publicité (elle en fera
 * pour sa gamme, PUBLICITE_DE_LA_GAMME, comme le coût par produit et le cas figé) ; la publicité envisagée,
 * 4 000 € par trimestre, ajoute à son image ce que dit la courbe de la communication, et les clients
 * se partagent entre les trois enseignes. La publicité envisagée est une hypothèse du cours, nommée
 * dans monde/gestion-et-information.ts.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait l'année de l'arène sans la publicité de l'élève, dans neuf
 * entreprises. Il compare maintenant deux années du marché à trois : avec 16 000 € de publicité,
 * NOVA vend 648 enceintes de plus, il en faudrait 762 ; elle gagne 2 392 € de moins.
 */

/** Les deux choix du dirigeant, en part de la publicité envisagée : la faire, ou s'en passer. */
export const AVEC_LA_PUBLICITE = 1;
export const SANS_PUBLICITE = 0;

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DU_CHOIX = ENTREPRISES_DE_LA_GESTION_DE_BASE;

export const POURQUOI_DECIDER =
  "ce chapitre suit NOVA sur le marché qu'elle partage avec SoundBox et Auris : le cours y rejoue l'année avec chaque choix, face aux mêmes concurrents.";

/** La publicité de NOVA une fois sa gamme lancée : celle de ses trois références, par mois. */
const PUBLICITE_DE_LA_GAMME = GAMME_DE_NOVA.references.reduce((t, r) => t + r.publicite, 0);

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const ventesEcrites = (n: number) => (Math.abs(n) === 1 ? `${qte(n)} vente` : `${qte(n)} ventes`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Une année jouée, avec un budget de publicité par trimestre. */
export type AnneeDuChoix = ReturnType<typeof anneeAvecLaPublicite>;

/** L'année de NOVA avec la publicité envisagée multipliée par `facteur` (0 : sans ; 2 : le double). */
export const anneeAvecUnFacteur = (facteur: number) => anneeAvecLaPublicite(FICHE_DU_MARCHE, PUBLICITE_ENVISAGEE * facteur);

/** Les deux choix, ce que la prévision demande, et ce que l'année jouée constate. */
export function deuxChoix() {
  const k = deuxChoixDuMarche(FICHE_DU_MARCHE);
  return { ...k, margeParVente: k.margeUnitaire, previsionJuste: (k.ventesGagnees >= k.ventesAGagner) === (k.ecartDeResultat > 0) };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const k = deuxChoix();
  return {
    titre: `L'année ${dE(c.entreprise)}, sans publicité`,
    colonnes: ["Sur l'année"],
    lignes: [
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.sans.ventes)] },
      { libelle: "Chiffre d'affaires", valeurs: [eur(k.sans.chiffreDAffaires)] },
      { libelle: "Marge sur les ventes", valeurs: [eur(k.sans.marge)] },
      { libelle: "Résultat de l'année", valeurs: [eur(k.sans.resultat)] },
    ],
  };
}

function tableauDesDeuxChoix(c: Cas): TableauDeDonnees {
  const k = deuxChoix();
  const ligne = (libelle: string, f: (a: AnneeDuChoix) => string) => ({ libelle, valeurs: [f(k.avec), f(k.sans)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, jouée avec chaque choix`,
    colonnes: ["Avec la publicité", "Sans publicité"],
    lignes: [
      ligne("Publicité", (a) => eur(a.publicite)),
      ligne(`Ventes (${c.unites})`, (a) => qte(a.ventes)),
      ligne("Chiffre d'affaires", (a) => eur(a.chiffreDAffaires)),
      ligne("Marge sur les ventes", (a) => eur(a.marge)),
      ligne("Résultat de l'année", (a) => eur(a.resultat)),
    ],
  };
}

export const DECIDER_AVEC_DES_CHIFFRES: Chapitre = {
  code: "decider-avec-des-chiffres",
  parcours: "seconde-mg",
  palier: 1,
  blocs: ["2de MG · Organiser et décider, des objectifs à la réalisation"],
  titre: "Décider avec des chiffres : comparer deux choix",
  accroche:
    "Faire de la publicité toute l'année, ou s'en passer ? Prévoir ce que chaque choix coûte et rapporte, choisir avec une règle claire, puis rejouer l'année pour constater.",
  objectifs: [
    "Chiffrer ce que coûte chacun de deux choix",
    "Calculer ce qu'une dépense doit faire gagner pour se payer",
    "Choisir avec une règle fixée à l'avance",
    "Comparer la prévision à ce qui s'est vraiment passé",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_CHOIX, pourquoi: POURQUOI_DECIDER },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Faire de la publicité, ou pas ?",
      notions: ["customer_acquisition_cost", "income_statement"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const k = deuxChoix();
        return [
          `Pendant son premier exercice, ${c.entreprise} ne vend que la NOVA One et ne paie aucune publicité ; elle en fera quand elle lancera sa gamme, ${eur(PUBLICITE_DE_LA_GAMME)} par mois. Pour la NOVA One seule, une agence lui propose une campagne de ${eur(PUBLICITE_ENVISAGEE)} par trimestre, ${eur(k.budget)} sur l'année : son image serait meilleure, et des clients de SoundBox et d'Auris viendraient chez elle. Sans publicité, elle garde cet argent. Deux choix, et il faut en prendre un.`,
          "Pour décider avec des chiffres, on avance en trois temps. Prévoir : ce que chaque choix coûte, et ce qu'il doit rapporter. Choisir : avec une règle fixée avant de connaître la réponse. Constater : on rejoue l'année avec la publicité, les mêmes concurrents en face, et on compare.",
        ];
      },
      repere: () => "Prévoir, choisir, constater : on chiffre chaque choix avant de décider, puis on vérifie ce que la décision a donné.",
    },
    {
      id: "prevoir",
      type: "montants",
      titre: "Prévoir : ce que la publicité doit rapporter",
      notions: ["contribution_margin", "customer_acquisition_cost"],
      tableau: tableauDeLAnnee,
      question: (c) => {
        const k = deuxChoix();
        return `La publicité coûterait ${eur(k.budget)} sur l'année ; s'en passer ne coûte rien. Une vente de plus ne rapporte pas son prix, mais sa marge : ce qui reste une fois payé ce que la ${c.unite} elle-même coûte. Calculez la marge d'une vente (marge sur les ventes ÷ ventes), puis les ventes que la publicité doit faire gagner pour se payer, à l'unité supérieure.`;
      },
      champs: () => {
        const k = deuxChoix();
        return [
          { libelle: "Marge d'une vente", attendu: k.margeParVente, calcul: `${eur(k.sans.marge)} ÷ ${qte(k.sans.ventes)} = ${eur(k.margeParVente)}`, tolerance: 0.01 },
          { libelle: "Ventes que la publicité doit faire gagner", attendu: k.ventesAGagner, calcul: `${eur(k.budget)} ÷ ${eur(k.margeParVente)} = ${qte(k.ventesAGagner)}, à l'unité supérieure` },
        ];
      },
      explication: (c) => {
        const k = deuxChoix();
        return [
          `Avec la publicité, ${c.entreprise} paie ${eur(k.budget)}. Pour que ce soit le bon choix, elle doit faire gagner au moins ${qte(k.ventesAGagner)} ventes dans l'année, à ${eur(k.margeParVente)} de marge chacune. C'est la prévision : on ne sait pas encore ce que la publicité fera vraiment.`,
        ];
      },
    },
    {
      id: "les-ventes-qui-paient",
      type: "curseur",
      titre: "Les ventes qui paient la publicité",
      notions: ["contribution_margin", "customer_acquisition_cost"],
      question: (c) => {
        const k = deuxChoix();
        return `Faites varier les ventes que la publicité ferait gagner dans l'année : une droite donne la marge qu'elles laissent, à ${eur(k.margeParVente)} chacune, l'autre le coût de la publicité, ${eur(k.budget)}. Placez le curseur sur le plus petit nombre de ventes qui paie la publicité, puis validez. Une ${c.unite} vendue en plus, c'est une vente.`;
      },
      grandeur: () => ({ libelle: "Ventes gagnées dans l'année", unite: "ventes" }),
      cible: () => ({ attendu: deuxChoix().ventesAGagner, min: 0, max: 1_500 }),
      zones: ["La publicité se paie", "La publicité coûte plus qu'elle ne rapporte"],
      rates: () => ({ dessous: "Avec si peu de ventes en plus, la marge gagnée ne paie pas la publicité.", dessus: "Ces ventes paient la publicité, mais moins suffirait : cherchez le plus petit nombre." }),
      montrer: "Montrer le nombre",
      lecture: (_c, q) => {
        const k = deuxChoix();
        return [
          { libelle: "Marge des ventes gagnées", montant: auCentime(q * k.margeParVente), fort: true },
          { libelle: "Coût de la publicité", montant: k.budget },
        ];
      },
      droites: () => {
        const k = deuxChoix();
        return { produit: (q) => q * k.margeParVente, cout: () => k.budget, libelles: ["Marge des ventes gagnées", "Coût de la publicité"] };
      },
      explication: () => {
        const k = deuxChoix();
        return [
          `Il faut ${qte(k.ventesAGagner)} ventes : leur marge, ${eur(auCentime(k.ventesAGagner * k.margeParVente))}, dépasse les ${eur(k.budget)}. Avec ${qte(k.ventesAGagner - 1)}, elle n'en fait que ${eur(auCentime((k.ventesAGagner - 1) * k.margeParVente))}.`,
          "C'est la règle de la prévision : une dépense se paie avec la marge des ventes qu'elle fait gagner, jamais avec leur chiffre d'affaires.",
        ];
      },
    },
    {
      id: "choisir",
      type: "choix",
      titre: "Choisir : la règle de décision",
      notions: ["contribution_margin"],
      question: () => "Avant de rejouer l'année, le dirigeant se fixe une règle de décision. Laquelle est la bonne ?",
      options: () => {
        const k = deuxChoix();
        return [
          { texte: `Faire la publicité si elle fait gagner au moins ${qte(k.ventesAGagner)} ventes`, juste: true, retour: "Oui : c'est le nombre de ventes dont la marge paie la publicité. En dessous, elle coûte plus qu'elle ne rapporte ; au-dessus, elle rapporte plus qu'elle ne coûte." },
          { texte: "Faire la publicité si elle fait monter le chiffre d'affaires", juste: false, retour: `Non : le chiffre d'affaires peut monter sans que la publicité soit payée. Une vente de plus ne laisse que sa marge, ${eur(k.margeParVente)}, pas son prix.` },
          { texte: "S'en passer, puisque toute dépense fait baisser le résultat", juste: false, retour: "Non : c'est une dépense, mais elle peut faire vendre davantage. Tout dépend de ce qu'elle rapporte en face de ce qu'elle coûte." },
        ];
      },
    },
    {
      id: "constater",
      type: "montants",
      titre: "Constater : l'année rejouée",
      notions: ["contribution_margin", "income_statement"],
      tableau: tableauDesDeuxChoix,
      question: (c) =>
        `Le tableau rejoue l'année ${dE(c.entreprise)} avec la publicité, face aux mêmes concurrents : son image monte, et une part des clients du marché change d'enseigne. Calculez les ventes gagnées grâce à la publicité, la marge qu'elle a fait gagner, puis l'écart de résultat de l'année, avec moins sans.`,
      champs: () => {
        const k = deuxChoix();
        return [
          { libelle: "Ventes gagnées grâce à la publicité", attendu: k.ventesGagnees, calcul: `${qte(k.avec.ventes)} − ${qte(k.sans.ventes)} = ${qte(k.ventesGagnees)}` },
          { libelle: "Marge gagnée grâce à la publicité", attendu: k.margeGagnee, calcul: `${eur(k.avec.marge)} − ${eur(k.sans.marge)} = ${eur(k.margeGagnee)}` },
          { libelle: "Écart de résultat de l'année, avec moins sans", attendu: k.ecartDeResultat, calcul: `${eur(k.avec.resultat)} − ${eur(k.sans.resultat)} = ${eur(k.ecartDeResultat)}` },
        ];
      },
      explication: () => {
        const k = deuxChoix();
        return [
          `La publicité a fait gagner ${ventesEcrites(k.ventesGagnees)} et ${eur(k.margeGagnee)} de marge, pour ${eur(k.budget)} de dépense. ${k.ecartDeResultat > 0 ? `Sa marge dépasse son coût : avec elle, le résultat est plus haut de ${eur(k.ecartDeResultat)}.` : `Sa marge ne couvre pas son coût : sans elle, le résultat est plus haut de ${eur(-k.ecartDeResultat)}.`}`,
          `L'écart de résultat, c'est la marge gagnée moins le coût de la publicité : ${eur(k.margeGagnee)} − ${eur(k.budget)}.`,
        ];
      },
    },
    {
      id: "le-bon-choix",
      type: "choix",
      titre: "Le bon choix, cette année",
      notions: ["income_statement"],
      tableau: tableauDesDeuxChoix,
      question: (c) => {
        const k = deuxChoix();
        return `Avec la publicité, le résultat de l'année ${dE(c.entreprise)} est de ${eur(k.avec.resultat)} ; sans, il est de ${eur(k.sans.resultat)}. Quel était le bon choix ?`;
      },
      options: () => {
        const k = deuxChoix();
        const garder = k.verdict === "garder";
        return [
          {
            texte: "Faire la publicité : elle rapporte plus qu'elle ne coûte",
            juste: garder,
            retour: garder ? `Oui : sa marge (${eur(k.margeGagnee)}) dépasse son coût (${eur(k.budget)}).` : `Non : elle fait gagner ${eur(k.margeGagnee)} de marge, pour ${eur(k.budget)} de dépense. Sans elle, le résultat est plus haut de ${eur(-k.ecartDeResultat)}.`,
          },
          {
            texte: "S'en passer : la publicité coûte plus qu'elle ne rapporte",
            juste: !garder,
            retour: !garder ? `Oui : sa marge (${eur(k.margeGagnee)}) ne couvre pas son coût (${eur(k.budget)}). Sans elle, le résultat est plus haut de ${eur(-k.ecartDeResultat)}.` : `Non : avec elle, le résultat est plus haut de ${eur(k.ecartDeResultat)}.`,
          },
          { texte: "On ne peut pas savoir : les concurrents auraient pu jouer autrement", juste: false, retour: "Non : l'année est rejouée avec les mêmes concurrents et les mêmes offres ; seule la publicité de NOVA a changé. L'écart de résultat en est la conséquence." },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-publicite",
      type: "simulation",
      titre: "Le laboratoire de la publicité",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => `Et avec un autre budget ? Faites varier la publicité ${dE(c.entreprise)}, par trimestre, et regardez ses ventes et son résultat de l'année.`,
      leviers: () => [{ code: "budget", libelle: "Publicité par trimestre", unite: "€", ...BUDGETS_ESSAYES, depart: PUBLICITE_ENVISAGEE }],
      lecture: (_c, p) => {
        const a = anneeAvecLaPublicite(FICHE_DU_MARCHE, p.budget!);
        const d = anneeAvecLaPublicite(FICHE_DU_MARCHE, PUBLICITE_ENVISAGEE);
        return [
          { libelle: "Publicité de l'année", montant: a.publicite, reference: d.publicite },
          { libelle: "Enceintes vendues", montant: a.ventes, unite: "enceintes", reference: d.ventes },
          { libelle: "Marge sur les ventes", montant: a.marge, reference: d.marge },
          { libelle: "Résultat de l'année", montant: a.resultat, reference: d.resultat, fort: true },
        ];
      },
      graphique: () => ({ levier: "budget", courbes: [{ libelle: "Résultat de l'année", valeur: (p) => anneeAvecLaPublicite(FICHE_DU_MARCHE, p.budget!).resultat }] }),
      defi: () => {
        const juste = meilleurBudgetDePublicite(FICHE_DU_MARCHE);
        return {
          consigne: "Trouvez le budget de publicité qui donne à NOVA le meilleur résultat de l'année.",
          atteint: (p) => p.budget === juste,
          indice: (p) => {
            const a = anneeAvecLaPublicite(FICHE_DU_MARCHE, p.budget!);
            return `Avec ${eur(p.budget!)} par trimestre, NOVA vend ${qte(a.ventes)} enceintes et gagne ${eur(a.resultat)}. Un autre budget fait-il mieux ?`;
          },
          solution: { budget: juste },
        };
      },
      explication: (_c, p) => {
        const a = anneeAvecLaPublicite(FICHE_DU_MARCHE, p.budget!);
        return [
          `Défi relevé : ${p.budget === 0 ? "sans publicité" : `avec ${eur(p.budget!)} par trimestre`}, NOVA gagne ${eur(a.resultat)}. Chaque euro de publicité fait venir des clients, mais de moins en moins : leur marge ne paie jamais ce qu'ils ont coûté.`,
          "Ce n'est pas une règle pour toutes les entreprises : une marge plus forte, ou des clients plus sensibles à la publicité, changeraient la réponse. C'est pour cela qu'on prévoit, puis qu'on constate.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Prévoir, choisir, constater",
      notions: ["contribution_margin"],
      texte: (c) => {
        const k = deuxChoix();
        return [
          `${k.previsionJuste ? `La prévision avait vu juste : il fallait ${qte(k.ventesAGagner)} ventes de plus pour payer la publicité, elle n'en a fait gagner que ${qte(k.ventesGagnees)}.` : `La prévision s'est trompée : il fallait ${qte(k.ventesAGagner)} ventes de plus, la publicité en a fait gagner ${qte(k.ventesGagnees)}.`} Chez ${c.entreprise}, cette année, le bon choix était ${k.verdict === "garder" ? "de faire la publicité" : "de s'en passer"}.`,
          "Une prévision n'est qu'une estimation : c'est pour cela qu'on constate ensuite, et qu'on compare. Dans l'arène, essayez : jouez un tour avec de la publicité, un autre sans, et comparez la marge gagnée à ce qu'elle a coûté.",
        ];
      },
      repere: () => "Ventes à gagner pour payer une dépense = coût de la dépense ÷ marge d'une vente.",
    },
  ],
};
