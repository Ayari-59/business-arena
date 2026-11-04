import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { affectation } from "../../chapitres/l-affectation-du-resultat";
import { affecter } from "../../monde/affectation-du-resultat";
import { RESERVE_LEGALE } from "../../monde/comptabilite-approfondie";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'AFFECTATION DU RÉSULTAT » : L'ASSOCIÉ QUI VEUT PLUS (Bac STMG,
 * gestion et finance, palier 1).
 *
 * Avant l'assemblée, un associé réclame un dividende deux fois plus gros que celui que chiffre le
 * chapitre. Le gérant veut savoir si la loi le permet, et ce qu'il coûterait à l'entreprise.
 * L'élève refait seul le chemin du chapitre (la réserve légale, le bénéfice distribuable, les
 * dividendes), puis mesure ce que la demande laisse pour la deuxième ligne.
 *
 * Le cas est neuf par sa réponse : la demande du chapitre laisse la ligne autofinancée ; celle-ci
 * est permise par la loi, mais elle oblige à emprunter. Les chiffres sont ceux du chapitre
 * (`affectation`, monde/affectation-du-resultat.ts).
 */

/** Le dividende que réclame l'associé, par action (HYPOTHÈSE DU CAS). */
export const DIVIDENDE_RECLAME_PAR_ACTION = 4;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function demandeReclamee(c: Pick<Cas, "code">) {
  const k = affectation(c);
  // Le gérant laisserait le reste du bénéfice distribuable en réserves facultatives : seul le dividende compte ici.
  const x = affecter(k, { dividendeParAction: DIVIDENDE_RECLAME_PAR_ACTION, reservesFacultatives: 0 });
  return { k, x };
}

export const L_ASSOCIE_QUI_VEUT_PLUS: Situation = {
  code: "l-associe-qui-veut-plus",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["l-affectation-du-resultat"],
  commanditaire: "Le gérant",
  titre: "L'associé qui veut plus",
  accroche: "Avant l'assemblée, un associé réclame un gros dividende. Le gérant demande si la loi le permet, et ce qu'il coûterait à l'avenir de l'entreprise.",
  objectifs: [
    "Calculer la réserve légale et le bénéfice distribuable",
    "Vérifier qu'un dividende reste dans le bénéfice distribuable",
    "Mesurer ce qu'il laisse pour autofinancer un investissement",
    "Rédiger une réponse chiffrée au gérant",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend le bénéfice du premier exercice de NOVA dans la simulation du cours, celui du chapitre ; la méthode vaut pour toute société.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const { k } = demandeReclamee(c);
        return [
          `« Un associé réclame ${eur(DIVIDENDE_RECLAME_PAR_ACTION)} par action. Je veux savoir si la loi nous le permet, et surtout ce qu'il nous resterait pour payer la deuxième ligne de ${eur(k.deuxiemeLigne)}, que nous voulions financer sans emprunter. »`,
          "Pas de cours cette fois : vous avez les chiffres, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const { k } = demandeReclamee(c);
        return {
          titre: `Le bénéfice ${dE(k.entreprise)} et ce qui en dépend`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Bénéfice de l'exercice", valeurs: [eur(k.benefice)] },
            { libelle: "Capital", valeurs: [eur(k.capital)] },
            { libelle: "Nombre d'actions", valeurs: [qte(k.actions)] },
            { libelle: "Part du bénéfice en réserve légale", valeurs: [pct(RESERVE_LEGALE)] },
            { libelle: "Capacité d'autofinancement de l'année", valeurs: [eur(k.caf)] },
            { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(k.capitauxPropres)] },
          ],
        };
      },
      repere: () => "À rendre : le bénéfice distribuable, le dividende réclamé, ce qu'il laisse pour la deuxième ligne, et votre réponse.",
    },
    {
      id: "ce-que-la-loi-permet",
      type: "montants",
      titre: "Ce que la loi permet",
      notions: ["income_statement"],
      question: () => "Calculez la dotation à la réserve légale, le bénéfice distribuable, puis le dividende total que réclame l'associé.",
      champs: (c) => {
        const { k, x } = demandeReclamee(c);
        return [
          { libelle: "Réserve légale", attendu: k.reserveLegale, calcul: `${eur(k.benefice)} × ${pct(RESERVE_LEGALE)} = ${eur(k.reserveLegale)}` },
          { libelle: "Bénéfice distribuable", attendu: k.distribuable, calcul: `${eur(k.benefice)} − ${eur(k.reserveLegale)} = ${eur(k.distribuable)}` },
          { libelle: "Dividende réclamé", attendu: x.dividendes, calcul: `${eur(DIVIDENDE_RECLAME_PAR_ACTION)} × ${qte(k.actions)} = ${eur(x.dividendes)}` },
        ];
      },
      explication: (c) => {
        const { k, x } = demandeReclamee(c);
        return [
          x.possible
            ? `${eur(x.dividendes)} restent sous les ${eur(k.distribuable)} du bénéfice distribuable : la loi permet cette demande.`
            : `${eur(x.dividendes)} dépassent les ${eur(k.distribuable)} du bénéfice distribuable : la loi interdit cette demande.`,
        ];
      },
    },
    {
      id: "ce-qu-il-reste",
      type: "montants",
      titre: "Ce qu'il resterait",
      notions: ["frng", "balance_sheet"],
      question: () =>
        "Calculez l'autofinancement qui resterait (la capacité d'autofinancement moins les dividendes), ce qui manquerait pour payer la deuxième ligne, puis les capitaux propres après le dividende.",
      champs: (c) => {
        const { k, x } = demandeReclamee(c);
        return [
          { libelle: "Autofinancement", attendu: x.autofinancement, calcul: `${eur(k.caf)} − ${eur(x.dividendes)} = ${eur(x.autofinancement)}` },
          { libelle: "Manque pour la ligne", attendu: x.manquePourLaLigne, calcul: `${eur(k.deuxiemeLigne)} − ${eur(x.autofinancement)} = ${eur(x.manquePourLaLigne)}` },
          { libelle: "Capitaux propres après", attendu: x.capitauxPropres, calcul: `${eur(k.capitauxPropres)} − ${eur(x.dividendes)} = ${eur(x.capitauxPropres)}` },
        ];
      },
      explication: (c) => {
        const { x } = demandeReclamee(c);
        return [
          `Il manquerait ${eur(x.manquePourLaLigne)} pour la ligne : il faudrait les emprunter, et payer des intérêts. Avec ${eur(x.capitauxPropres)} de capitaux propres, la banque prêterait encore jusqu'à ${eur(x.empruntPossible)} : l'emprunt resterait possible, mais l'entreprise dépendrait davantage de sa banque.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const { k, x } = demandeReclamee(c);
        return [
          {
            texte: `Permis, mais il faudrait emprunter ${eur(x.manquePourLaLigne)} pour la ligne`,
            juste: true,
            retour: `Oui : ${eur(x.dividendes)} restent dans le bénéfice distribuable, ${eur(k.distribuable)}. Mais ils ne laissent que ${eur(x.autofinancement)} d'autofinancement pour une ligne de ${eur(k.deuxiemeLigne)}. L'assemblée peut accepter ; elle doit savoir qu'elle choisit d'emprunter.`,
          },
          {
            texte: `Interdit : la loi limite les dividendes à la moitié du bénéfice, soit ${eur(Math.round(k.benefice * 50) / 100)}`,
            juste: false,
            retour: `Non : la loi ne fixe pas de moitié. Elle impose la réserve légale, ${eur(k.reserveLegale)}, et interdit de distribuer plus que le bénéfice distribuable, ${eur(k.distribuable)}.`,
          },
          {
            texte: "Sans conséquence : le bénéfice appartient aux associés, et l'entreprise n'en a pas besoin",
            juste: false,
            retour: `Non : le bénéfice leur appartient, c'est vrai, mais l'argent versé ne financera plus la ligne. Il manquerait ${eur(x.manquePourLaLigne)}, à emprunter.`,
          },
        ];
      },
    },
  ],
};
