import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { dateDuCours as date } from "../../dates";
import { ASSIETTE_CSG, CSG_CRDS_NON_DEDUCTIBLES, TAUX_DE_LA_PAIE, TAUX_PAS } from "../../paie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA PAIE » : LA PRIME EXCEPTIONNELLE
 * (comptabilité générale, palier 3).
 *
 * Le gérant veut verser une prime à chaque salarié avec la paie de février. Avant de
 * l'annoncer, il veut savoir ce qu'elle coûtera à l'entreprise et ce que les salariés en
 * toucheront. L'élève fait le bulletin de la prime (cotisations salariales organisme par
 * organisme, prélèvement à la source, net), passe ses deux écritures, puis répond.
 *
 * Le cas est neuf par sa question : ce n'est plus le salaire de janvier, c'est une
 * somme de plus, décidée par le gérant. Les taux sont ceux du chapitre (`paie.ts`),
 * l'effectif celui du cas (`cas.ts`).
 */

/**
 * La prime brute par salarié : 500 €, l'ordre de grandeur d'une prime exceptionnelle de
 * fin de saison dans une petite entreprise. Elle est soumise aux cotisations et à
 * l'impôt comme le salaire.
 */
export const PRIME_PAR_SALARIE = 500;

/** La prime part avec la paie de février, arrêtée le dernier jour du mois. */
const JOUR_DE_LA_PAIE = 59;
/** Ses cotisations et son prélèvement se règlent avec ceux de février, le 15 mars. */
const JOUR_DES_ORGANISMES = 74;

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const T = TAUX_DE_LA_PAIE;

/** Le bulletin de la prime, pour toute l'équipe, arrondi comme celui du chapitre. */
export function primeExceptionnelle(c: Cas) {
  const effectif = c.personnel.effectif;
  const brut = PRIME_PAR_SALARIE * effectif;
  const urssafSalariale = Math.round(brut * T.salarial.urssaf);
  const retraiteSalariale = Math.round(brut * T.salarial.retraite);
  const urssafPatronale = Math.round(brut * T.patronal.urssaf);
  const retraitePatronale = Math.round(brut * T.patronal.retraite);
  const netAvantImpot = brut - urssafSalariale - retraiteSalariale;
  const netImposable = auCentime(netAvantImpot + brut * ASSIETTE_CSG * CSG_CRDS_NON_DEDUCTIBLES);
  const pas = auCentime(netImposable * TAUX_PAS);
  const net = auCentime(netAvantImpot - pas);
  const patronales = urssafPatronale + retraitePatronale;
  return {
    effectif,
    brut,
    urssafSalariale,
    retraiteSalariale,
    urssafPatronale,
    retraitePatronale,
    netAvantImpot,
    netImposable,
    pas,
    net,
    patronales,
    cout: brut + patronales,
    netParSalarie: auCentime(net / effectif),
  };
}

export const LA_PRIME_EXCEPTIONNELLE: Situation = {
  code: "la-prime-exceptionnelle",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["la-paie"],
  commanditaire: "Le gérant",
  titre: "La prime exceptionnelle",
  accroche:
    "Le gérant veut verser une prime à toute l'équipe avec la paie de février. Avant de l'annoncer, il veut savoir ce qu'elle coûtera et ce que les salariés toucheront vraiment.",
  objectifs: [
    "Calculer les cotisations salariales d'une prime, organisme par organisme",
    "Calculer le prélèvement à la source et le net versé aux salariés",
    "Enregistrer la prime et ses cotisations patronales",
    "Distinguer ce que la prime coûte à l'entreprise de ce que les salariés en reçoivent",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const k = primeExceptionnelle(c);
        return [
          `« Le début d'année a été bon. Je veux verser à chacun de nos ${qte(k.effectif)} salariés une prime exceptionnelle de ${eur(PRIME_PAR_SALARIE)} bruts, avec la paie de février. Avant de l'annoncer, dites-moi ce qu'elle coûtera à ${c.entreprise}, et ce que les salariés en toucheront vraiment. »`,
          "Pas de cours cette fois : la prime suit les règles du salaire, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const k = primeExceptionnelle(c);
        return {
          titre: `La prime de février · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Salariés", valeurs: [qte(k.effectif)] },
            { libelle: "Prime brute par salarié", valeurs: [eur(PRIME_PAR_SALARIE)] },
            { libelle: "Cotisations salariales URSSAF, en % du brut", valeurs: [pct(T.salarial.urssaf)] },
            { libelle: "Cotisations salariales de retraite complémentaire", valeurs: [pct(T.salarial.retraite)] },
            { libelle: "Cotisations patronales URSSAF", valeurs: [pct(T.patronal.urssaf)] },
            { libelle: "Cotisations patronales de retraite complémentaire", valeurs: [pct(T.patronal.retraite)] },
            { libelle: "Net imposable des primes, calculé par le logiciel de paie", valeurs: [eur(k.netImposable)] },
            { libelle: "Taux moyen de prélèvement à la source", valeurs: [pct(TAUX_PAS)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le bulletin des primes jusqu'au net, ses deux écritures au journal, et votre réponse.",
    },
    {
      id: "bulletin",
      type: "montants",
      titre: "Le bulletin des primes",
      notions: ["fixed_costs"],
      question: (c) =>
        `Pour les ${qte(primeExceptionnelle(c).effectif)} salariés réunis : le total des primes brutes, les cotisations salariales URSSAF et de retraite complémentaire, le net avant impôt, le prélèvement à la source, puis le net à verser.`,
      champs: (c) => {
        const k = primeExceptionnelle(c);
        return [
          { libelle: "Primes brutes", attendu: k.brut, calcul: `${qte(k.effectif)} × ${eur(PRIME_PAR_SALARIE)} = ${eur(k.brut)}` },
          { libelle: "Cotisations salariales URSSAF", attendu: k.urssafSalariale, calcul: `${eur(k.brut)} × ${pct(T.salarial.urssaf)} = ${eur(k.urssafSalariale)}` },
          { libelle: "Cotisations salariales de retraite complémentaire", attendu: k.retraiteSalariale, calcul: `${eur(k.brut)} × ${pct(T.salarial.retraite)} = ${eur(k.retraiteSalariale)}` },
          { libelle: "Net avant impôt", attendu: k.netAvantImpot, calcul: `${eur(k.brut)} − ${eur(k.urssafSalariale)} − ${eur(k.retraiteSalariale)} = ${eur(k.netAvantImpot)}` },
          { libelle: "Prélèvement à la source", attendu: k.pas, calcul: `${eur(k.netImposable)} × ${pct(TAUX_PAS)} = ${eur(k.pas)}` },
          { libelle: "Net à verser aux salariés", attendu: k.net, calcul: `${eur(k.netAvantImpot)} − ${eur(k.pas)} = ${eur(k.net)}` },
        ];
      },
      explication: (c) => {
        const k = primeExceptionnelle(c);
        return [
          `Sur ${eur(PRIME_PAR_SALARIE)} annoncés, chaque salarié touchera environ ${eur(k.netParSalarie)}. Le reste n'est pas perdu pour lui : ses cotisations financent sa protection sociale et sa retraite, et le prélèvement règle une part de son impôt.`,
          "Le prélèvement se calcule sur le net imposable, un peu plus haut que le net avant impôt : une part de la CSG et la CRDS ne se déduisent pas de l'impôt.",
        ];
      },
    },
    {
      id: "ecriture-prime",
      type: "ecriture",
      titre: "La prime, au journal",
      notions: ["fixed_costs"],
      evenement: (c) => {
        const k = primeExceptionnelle(c);
        return `Le ${date(JOUR_DE_LA_PAIE)}, le journal de paie de février porte les primes : ${eur(k.brut)} bruts. Passez l'écriture des primes seules ; le salaire de février s'écrit comme celui de janvier.`;
      },
      piece: (c) => {
        const k = primeExceptionnelle(c);
        return {
          nature: "Journal de paie de février : les primes",
          de: c.entreprise,
          a: `Ses ${qte(k.effectif)} salariés`,
          date: date(JOUR_DE_LA_PAIE),
          lignes: [
            { libelle: "Primes exceptionnelles brutes", quantite: qte(k.effectif), prixUnitaire: PRIME_PAR_SALARIE, montant: k.brut },
            { libelle: `Cotisations salariales URSSAF (${pct(T.salarial.urssaf)})`, montant: k.urssafSalariale },
            { libelle: `Cotisations salariales de retraite complémentaire (${pct(T.salarial.retraite)})`, montant: k.retraiteSalariale },
            { libelle: `Prélèvement à la source (${pct(TAUX_PAS)} du net imposable)`, montant: k.pas },
          ],
          totaux: [
            { libelle: "Net avant impôt", montant: k.netAvantImpot },
            { libelle: "Net à payer", montant: k.net, fort: true },
          ],
        };
      },
      ecriture: (c) => {
        const k = primeExceptionnelle(c);
        return {
          date: date(JOUR_DE_LA_PAIE),
          libelle: "Primes exceptionnelles de février",
          lignes: [
            { role: "les primes brutes", compte: "641", sens: "debit", montant: k.brut, indice: "le total des primes brutes" },
            { role: "les cotisations salariales dues à l'URSSAF", compte: "431", sens: "credit", montant: k.urssafSalariale, indice: "la part URSSAF retenue sur les primes" },
            { role: "les cotisations salariales dues à la caisse de retraite", compte: "437", sens: "credit", montant: k.retraiteSalariale, indice: "la part de retraite complémentaire retenue sur les primes" },
            { role: "l'impôt prélevé à la source, dû à l'État", compte: "442", sens: "credit", montant: k.pas, indice: "le prélèvement à la source sur les primes" },
            { role: "le net à verser aux salariés", compte: "421", sens: "credit", montant: k.net, indice: "le net à payer des primes" },
          ],
        };
      },
      indices: () => [
        "Une prime est une rémunération : la charge, au débit, est son montant brut, au même compte que les salaires.",
        "Au crédit, chacun de ceux à qui elle revient : l'URSSAF (431), la caisse de retraite (437), l'État pour l'impôt prélevé (442), les salariés pour le net (421).",
      ],
      explication: (c) => {
        const k = primeExceptionnelle(c);
        return [
          `La charge est le brut, ${eur(k.brut)}, au débit du 641. Les salariés recevront ${eur(k.net)} avec leur salaire de février ; le reste attendra le ${date(JOUR_DES_ORGANISMES)}, avec les cotisations de février.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "ecriture-patronales",
      type: "ecriture",
      titre: "Les cotisations patronales de la prime",
      notions: ["fixed_costs"],
      evenement: (c) => {
        const k = primeExceptionnelle(c);
        return `Le même jour, ${c.entreprise} enregistre ses propres cotisations sur les primes : URSSAF ${pct(T.patronal.urssaf)} du brut, retraite complémentaire ${pct(T.patronal.retraite)}. Calculez-les et passez l'écriture, sur ${eur(k.brut)} de primes brutes.`;
      },
      ecriture: (c) => {
        const k = primeExceptionnelle(c);
        return {
          date: date(JOUR_DE_LA_PAIE),
          libelle: "Cotisations patronales sur les primes de février",
          lignes: [
            { role: "les cotisations patronales", compte: "645", sens: "debit", montant: k.patronales, indice: "les deux parts patronales réunies" },
            { role: "la part due à l'URSSAF", compte: "431", sens: "credit", montant: k.urssafPatronale, indice: `les primes brutes × ${pct(T.patronal.urssaf)}` },
            { role: "la part due à la caisse de retraite", compte: "437", sens: "credit", montant: k.retraitePatronale, indice: `les primes brutes × ${pct(T.patronal.retraite)}` },
          ],
        };
      },
      indices: () => [
        "Ces cotisations s'ajoutent au brut : une charge de l'entreprise, en un seul montant au débit.",
        "Au crédit, deux dettes : l'URSSAF et la caisse de retraite, chacune pour sa part.",
      ],
      explication: (c) => {
        const k = primeExceptionnelle(c);
        return [
          `${eur(k.patronales)} de charges en plus des primes, au débit du 645 : ${eur(k.urssafPatronale)} pour l'URSSAF, ${eur(k.retraitePatronale)} pour la caisse de retraite. Les primes coûtent donc ${eur(k.cout)} à ${c.entreprise}.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      notions: ["fixed_costs", "income_statement"],
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const k = primeExceptionnelle(c);
        return [
          {
            texte: `Les primes coûteront ${eur(k.cout)} ; les salariés en toucheront ${eur(k.net)}`,
            juste: true,
            retour: `Oui : le brut et les cotisations patronales, ${eur(k.brut)} + ${eur(k.patronales)}, sont la charge de l'entreprise. Les salariés reçoivent le net, environ ${eur(k.netParSalarie)} chacun : les cotisations salariales et l'impôt sont retenus sur le brut.`,
          },
          {
            texte: `Les primes coûteront ${eur(k.brut)}, le brut annoncé, et les salariés en toucheront ${eur(k.net)}`,
            juste: false,
            retour: `Non : c'est oublier les cotisations patronales, ${eur(k.patronales)}, que l'entreprise paie en plus du brut. Les primes coûtent ${eur(k.cout)}.`,
          },
          {
            texte: `Les primes coûteront ${eur(k.cout)}, et les salariés toucheront les ${eur(k.brut)} annoncés`,
            juste: false,
            retour: `Non : les salariés ne touchent pas le brut. Leurs cotisations et le prélèvement à la source en sont retenus : il leur reste ${eur(k.net)}.`,
          },
          {
            texte: `Les primes coûteront ${eur(k.cout + k.pas)}, le prélèvement compris, pour ${eur(k.net)} versés aux salariés`,
            juste: false,
            retour: `Non : le prélèvement à la source, ${eur(k.pas)}, est l'impôt des salariés, retenu sur le brut. Le compter en plus le compterait deux fois : les primes coûtent ${eur(k.cout)}.`,
          },
        ];
      },
    },
  ],
};
