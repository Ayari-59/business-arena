import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { compteDeResultat } from "../../chapitres/lire-le-compte-de-resultat";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COMPTE DE RÉSULTAT » : LA HAUSSE DES SALAIRES
 * (Bac STMG, gestion et finance, palier 1).
 *
 * L'équipe demande une revalorisation des salaires. Avant de répondre, le gérant veut
 * savoir ce qu'elle aurait coûté sur l'année qui vient de se terminer, et ce qu'il serait
 * resté comme résultat. L'élève a le compte de résultat de l'année et refait seul le
 * chemin du chapitre : les charges de l'activité, le résultat de l'activité, le résultat
 * avant impôt, puis le même compte avec des charges de personnel plus lourdes.
 *
 * Le cas est neuf par sa question : le chapitre lit l'année telle qu'elle a été, le cas
 * la refait avec une charge qui change. Il joue dans le monde du cours : le premier exercice
 * de NOVA, celui du chapitre (`compteDeResultat`, monde/comptes-du-lycee.ts). Le résultat est
 * pris avant impôt : l'impôt se recalcule sur le nouveau bénéfice, ce que le chapitre n'enseigne pas.
 */

/**
 * La revalorisation demandée : 4 % de la masse salariale, cotisations comprises, l'ordre
 * de grandeur des hausses générales négociées ces dernières années dans les petites
 * entreprises, quand les prix montaient vite.
 */
export const HAUSSE_DES_SALAIRES = 0.04;

/** Un montant, le signe moins typographique : « −582,38 € ». */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function hausseDesSalaires(c: Pick<Cas, "code">) {
  const k = compteDeResultat(c);
  const avantImpot = k.resultatAvantImpot;
  const cout = auCentime(k.personnel * HAUSSE_DES_SALAIRES);
  const apres = auCentime(avantImpot - cout);
  return {
    ...k,
    avantImpot,
    cout,
    personnelApres: auCentime(k.personnel + cout),
    apres,
    tauxAvant: auDixieme((avantImpot / k.ventes) * 100),
    tauxApres: auDixieme((apres / k.ventes) * 100),
    // L'erreur classique : appliquer la hausse au résultat, et non aux salaires.
    surLeResultat: auCentime(avantImpot * (1 - HAUSSE_DES_SALAIRES)),
  };
}

export const LA_HAUSSE_DES_SALAIRES: Situation = {
  code: "la-hausse-des-salaires",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["lire-le-compte-de-resultat"],
  commanditaire: "Le gérant",
  titre: "La hausse des salaires",
  accroche:
    "L'équipe demande une revalorisation des salaires. Avant de répondre, le gérant veut savoir ce qu'elle aurait coûté sur l'année, et ce qu'il serait resté de résultat.",
  objectifs: [
    "Calculer les charges de l'activité et le résultat de l'activité",
    "Calculer le résultat avant impôt",
    "Refaire le compte de résultat avec une charge de personnel plus lourde",
    "Rédiger une réponse chiffrée au gérant",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend le compte de résultat du premier exercice de NOVA dans la simulation du cours, celui du chapitre ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => [
        `« L'équipe me demande une hausse générale des salaires de ${pct(HAUSSE_DES_SALAIRES * 100)}. Avant de répondre, je veux savoir ce qu'elle aurait coûté à ${hausseDesSalaires(c).entreprise} sur l'année qui vient de se terminer, et ce qu'il nous serait resté de résultat avant impôt. Le comptable recalculera l'impôt ensuite. »`,
        "Pas de cours cette fois : vous avez le compte de résultat de l'année, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const k = hausseDesSalaires(c);
        const lignes = k.lignes
          .filter((l) => l.nature !== "impot")
          .map((l) => ({ libelle: l.libelle, valeurs: [l.nature === "produit" ? eur(l.montant) : `− ${eur(l.montant)}`] }));
        lignes.push({ libelle: "Hausse des salaires demandée", valeurs: [pct(HAUSSE_DES_SALAIRES * 100)] });
        return { titre: `L'année ${dE(k.entreprise)} · compte de résultat`, colonnes: ["Montant"], lignes };
      },
      repere: () =>
        "À rendre : les charges de l'activité, le résultat de l'activité et le résultat avant impôt de l'année, puis ce que la hausse coûte, le résultat avant impôt qui resterait, et votre réponse.",
    },
    {
      id: "l-annee",
      type: "montants",
      titre: "L'année telle qu'elle a été",
      notions: ["income_statement"],
      question: () =>
        "Commencez par l'année réelle : le total des charges de l'activité (tout sauf le financement), le résultat de l'activité (les ventes moins les charges de l'activité), puis le résultat avant impôt (en ajoutant les revenus du compte à terme et en retranchant les charges du financement).",
      champs: (c) => {
        const k = hausseDesSalaires(c);
        return [
          { libelle: "Charges de l'activité", attendu: k.activite, calcul: `${k.lignes.filter((l) => l.nature === "activite").map((l) => eur(l.montant)).join(" + ")} = ${eur(k.activite)}`, tolerance: 1 },
          { libelle: "Résultat de l'activité", attendu: k.resultatDActivite, calcul: `${eur(k.ventes)} − ${eur(k.activite)} = ${eur(k.resultatDActivite)}`, tolerance: 1 },
          { libelle: "Résultat avant impôt", attendu: k.avantImpot, calcul: `${eur(k.resultatDActivite)} + ${eur(k.produitsFinanciers)} − ${eur(k.financement)} = ${eur(k.avantImpot)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = hausseDesSalaires(c);
        return [
          k.avantImpot >= 0
            ? `Avant impôt, ${k.entreprise} a gagné ${eur(k.avantImpot)} sur l'année. La hausse porterait sur le personnel, ${eur(k.personnel)} de charges : tout le reste du compte ne bouge pas.`
            : `Avant impôt, ${k.entreprise} a perdu ${eur(-k.avantImpot)} sur l'année. Une charge de plus creusera cette perte.`,
        ];
      },
    },
    {
      id: "avec-la-hausse",
      type: "montants",
      titre: "L'année avec la hausse",
      notions: ["income_statement"],
      question: () =>
        "Refaites l'année avec la hausse : combien aurait-elle coûté, quel résultat avant impôt serait resté, et quel taux de résultat avant impôt (résultat avant impôt ÷ ventes × 100), au dixième ?",
      champs: (c) => {
        const k = hausseDesSalaires(c);
        return [
          { libelle: "Coût de la hausse sur l'année", attendu: k.cout, calcul: `${eur(k.personnel)} × ${pct(HAUSSE_DES_SALAIRES * 100)} = ${eur(k.cout)}` },
          { libelle: "Résultat avant impôt avec la hausse", attendu: k.apres, calcul: `${eur(k.avantImpot)} − ${eur(k.cout)} = ${eur(k.apres)}`, tolerance: 1 },
          { libelle: "Taux de résultat avant impôt (%)", attendu: k.tauxApres, calcul: `${eur(k.apres)} ÷ ${eur(k.ventes)} × 100 = ${pct(k.tauxApres)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = hausseDesSalaires(c);
        return [
          `Les ventes ne bougent pas : toute la hausse se retrouve, euro pour euro, dans le résultat. Sur 100 € de ventes, le résultat avant impôt passerait de ${pct(k.tauxAvant).replace(" %", " €")} à ${pct(k.tauxApres).replace(" %", " €")}.`,
          k.apres >= 0
            ? `${k.entreprise} resterait bénéficiaire avant impôt, avec ${eur(k.apres)}.`
            : k.avantImpot >= 0
              ? `${k.entreprise} passerait en perte : la hausse coûte plus que le bénéfice de l'année.`
              : `${k.entreprise} perdait déjà de l'argent : sa perte avant impôt passerait à ${eur(-k.apres)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const k = hausseDesSalaires(c);
        return [
          {
            texte: `La hausse aurait coûté ${eur(k.cout)} : le résultat avant impôt serait de ${eur(k.apres)}`,
            juste: true,
            retour: `Oui : ${pct(HAUSSE_DES_SALAIRES * 100)} de ${eur(k.personnel)} de charges de personnel font ${eur(k.cout)} de charges en plus. Les produits ne changent pas, et le résultat avant impôt passe de ${eur(k.avantImpot)} à ${eur(k.apres)}.`,
          },
          {
            texte: `Le résultat avant impôt serait réduit de ${pct(HAUSSE_DES_SALAIRES * 100)}, à ${eur(k.surLeResultat)}`,
            juste: false,
            retour: `Non : les ${pct(HAUSSE_DES_SALAIRES * 100)} s'appliquent aux salaires, pas au résultat. La hausse coûte ${pct(HAUSSE_DES_SALAIRES * 100)} de ${eur(k.personnel)}, soit ${eur(k.cout)}, que le résultat perd en entier.`,
          },
          {
            texte: "Le résultat ne bougerait pas : une hausse des salaires pèse sur la trésorerie, pas sur le résultat",
            juste: false,
            retour: `Non : les salaires et leurs cotisations sont une charge de l'année. Ils pèsent sur la trésorerie quand on les paie, et sur le résultat parce qu'ils sont une charge : ${eur(k.cout)} de plus.`,
          },
        ];
      },
    },
  ],
};
