import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { recrutement } from "../../chapitres/recruter";
import { EMBAUCHES, rejouerLAnnee, vendues } from "../../ressources-humaines";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RECRUTER » : EMBAUCHER UN TRIMESTRE PLUS TARD (Bac STMG,
 * ressources humaines, palier 1).
 *
 * Le gérant a lu le chapitre : une embauche décidée au premier trimestre coûte son recrutement
 * tout de suite et un salaire à chaque trimestre suivant. Il propose d'attendre un trimestre,
 * pour payer un salaire de moins. L'élève refait les calculs du chapitre sur l'embauche décalée
 * (son coût, les ventes qu'elle doit apporter), puis lit ce que l'arène en fait, à côté de
 * l'embauche du chapitre.
 *
 * Le cas est neuf par sa question : le chapitre juge une embauche, le cas compare deux dates pour
 * la même embauche. L'embauche du premier trimestre est celle du chapitre (`recrutement`) ;
 * l'embauche décalée est la même année rejouée (`rejouerLAnnee`), le salarié décidé un trimestre
 * plus tard, présent un trimestre de moins.
 */

/**
 * Le trimestre où le gérant propose d'embaucher : le suivant de celui du chapitre. Le salarié
 * arrive au trimestre d'après, comme dans l'arène, et reste jusqu'à la fin de l'année.
 */
export const TRIMESTRE_DE_L_EMBAUCHE_DECALEE = 2;

const qte = (n: number) => n.toLocaleString("fr-FR");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const somme = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
/** Un montant qu'on retranche : entre parenthèses quand il est négatif. */
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));

export type Verdict = "aucune" | "perte" | "maintenant" | "attendre";

/** Les deux embauches, celle du chapitre et la décalée, calculées une fois du cas. */
export function embaucheDecalee(c: Cas) {
  const r = recrutement(c);
  const decalee = rejouerLAnnee(c.code, "embauche-decalee", (t) =>
    t === TRIMESTRE_DE_L_EMBAUCHE_DECALEE ? { hire: EMBAUCHES } : undefined,
  );
  const trimestresAvecLui = decalee.length - TRIMESTRE_DE_L_EMBAUCHE_DECALEE;
  const salaires = r.salaireTrimestriel * EMBAUCHES * trimestresAvecLui;
  const cout = r.coutDuRecrutement + salaires;
  const ventesPourSePayer = Math.ceil(cout / r.margeUnitaire - 1e-9);
  const venduesApres = Math.round(somme(decalee.map(vendues)));
  const resultatApres = Math.round(somme(decalee.map((x) => x.incomeStatement.operatingIncome)));
  const venduesEnPlus = venduesApres - r.venduesAvant;
  const ecartDeResultat = resultatApres - r.resultatAvant;
  // Ce que l'attente change au résultat, par rapport à l'embauche du chapitre.
  const gainDeLAttente = ecartDeResultat - r.ecartDeResultat;
  const verdict: Verdict =
    venduesEnPlus <= 0 && r.venduesEnPlus <= 0
      ? "aucune"
      : ecartDeResultat <= 0 && r.ecartDeResultat <= 0
        ? "perte"
        : r.ecartDeResultat >= ecartDeResultat
          ? "maintenant"
          : "attendre";
  return {
    r,
    trimestresAvecLui,
    salaires,
    cout,
    economie: r.coutDeLEmbauche - cout,
    ventesPourSePayer,
    venduesApres,
    venduesEnPlus,
    resultatApres,
    ecartDeResultat,
    gainDeLAttente,
    verdict,
  };
}

export const EMBAUCHER_UN_TRIMESTRE_PLUS_TARD: Situation = {
  code: "embaucher-un-trimestre-plus-tard",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["recruter"],
  commanditaire: "Le gérant",
  titre: "Embaucher un trimestre plus tard",
  accroche:
    "Le gérant veut attendre un trimestre avant d'embaucher, pour payer un salaire de moins. Ce que coûte l'embauche décalée, ce qu'elle doit faire vendre, et ce que l'arène en fait.",
  objectifs: [
    "Calculer le coût d'une embauche selon le trimestre où on la décide",
    "Calculer les ventes qu'elle doit apporter pour se payer",
    "Comparer deux dates d'embauche dans l'année rejouée",
    "Répondre au gérant, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => [
        `« Si nous embauchons au premier trimestre, nous payons le salarié dès le trimestre suivant. Si ${c.entreprise} attend et le recrute au trimestre ${TRIMESTRE_DE_L_EMBAUCHE_DECALEE}, c'est un salaire de moins à payer cette année. Dites-moi ce que coûterait l'embauche décalée, ce qu'elle devrait faire vendre, et s'il vaut mieux attendre. »`,
        "Pas de cours cette fois : vous avez les chiffres de l'embauche, et les calculs sont ceux du chapitre. L'arène a rejoué l'année avec les deux dates.",
      ],
      tableau: (c) => {
        const e = embaucheDecalee(c);
        return {
          titre: `L'embauche ${dE(c.entreprise)}, selon sa date`,
          colonnes: ["Au trimestre 1", `Au trimestre ${TRIMESTRE_DE_L_EMBAUCHE_DECALEE}`],
          lignes: [
            { libelle: "Coût du recrutement", valeurs: [eur(e.r.coutDuRecrutement), eur(e.r.coutDuRecrutement)] },
            { libelle: "Coût du salarié par trimestre", valeurs: [eur(e.r.salaireTrimestriel), eur(e.r.salaireTrimestriel)] },
            { libelle: "Trimestres où il est présent dans l'année", valeurs: [String(e.r.trimestresAvecLui), String(e.trimestresAvecLui)] },
            { libelle: "Marge d'une unité vendue (prix moins coût variable)", valeurs: [eur(e.r.margeUnitaire), eur(e.r.margeUnitaire)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le coût de l'embauche décalée, les ventes qu'elle doit apporter et ce qu'elle économise, ce que l'arène en fait, et votre réponse.",
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que coûte l'embauche décalée",
      notions: ["payroll", "contribution_margin"],
      question: (c) =>
        `Pour l'embauche au trimestre ${TRIMESTRE_DE_L_EMBAUCHE_DECALEE}, calculez son coût sur l'année (le recrutement, plus le salaire des trimestres où il est présent), le nombre ${dE(c.unites)} à vendre en plus pour le couvrir (arrondi à l'unité supérieure), et ce qu'elle coûte de moins que l'embauche au premier trimestre.`,
      champs: (c) => {
        const e = embaucheDecalee(c);
        return [
          { libelle: "Coût de l'embauche décalée sur l'année", attendu: e.cout, tolerance: 1, calcul: `${eur(e.r.coutDuRecrutement)} + ${eur(e.r.salaireTrimestriel)} × ${e.trimestresAvecLui} = ${eur(e.cout)}` },
          { libelle: `Ventes à faire en plus (${c.unites})`, attendu: e.ventesPourSePayer, tolerance: 1, calcul: `${eur(e.cout)} ÷ ${eur(e.r.margeUnitaire)} = ${qte(e.ventesPourSePayer)}` },
          { libelle: "Coût en moins qu'au premier trimestre", attendu: e.economie, tolerance: 1, calcul: `${eur(e.r.coutDeLEmbauche)} − ${eur(e.cout)} = ${eur(e.economie)}` },
        ];
      },
      explication: (c) => {
        const e = embaucheDecalee(c);
        return [
          `Attendre fait bien économiser ${eur(e.economie)} : le recrutement coûte autant, mais il y a un salaire de moins à payer. L'embauche décalée doit encore faire vendre ${qte(e.ventesPourSePayer)} ${c.unites} de plus, contre ${qte(e.r.ventesPourSePayer)} pour celle du premier trimestre, et en un trimestre de moins.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue les deux dates",
      notions: ["capacity", "productivity"],
      tableau: (c) => {
        const e = embaucheDecalee(c);
        return {
          titre: "L'année jouée, sans embauche et avec l'embauche à chaque date",
          colonnes: ["Sans", "Au trimestre 1", `Au trimestre ${TRIMESTRE_DE_L_EMBAUCHE_DECALEE}`],
          lignes: [
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(e.r.venduesAvant), qte(e.r.venduesApres), qte(e.venduesApres)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(e.r.resultatAvant), eur(e.r.resultatApres), eur(e.resultatApres)] },
          ],
        };
      },
      question: (c) =>
        `Pour l'embauche au trimestre ${TRIMESTRE_DE_L_EMBAUCHE_DECALEE}, calculez les ventes en plus sur l'année (en ${c.unites}) et l'écart de résultat de l'activité, par rapport à l'année sans embauche. Puis calculez ce que l'attente change au résultat, par rapport à l'embauche au premier trimestre (résultat avec l'embauche décalée moins résultat avec l'embauche au premier trimestre).`,
      champs: (c) => {
        const e = embaucheDecalee(c);
        return [
          { libelle: `Ventes en plus, embauche décalée (${c.unites})`, attendu: e.venduesEnPlus, tolerance: 1, calcul: `${qte(e.venduesApres)} − ${qte(e.r.venduesAvant)} = ${qte(e.venduesEnPlus)}` },
          { libelle: "Écart de résultat, embauche décalée", attendu: e.ecartDeResultat, tolerance: 1, calcul: `${eur(e.resultatApres)} − ${retranche(e.r.resultatAvant)} = ${eur(e.ecartDeResultat)}` },
          { libelle: "Ce que l'attente change au résultat", attendu: e.gainDeLAttente, tolerance: 1, calcul: `${eur(e.resultatApres)} − ${retranche(e.r.resultatApres)} = ${eur(e.gainDeLAttente)}` },
        ];
      },
      explication: (c) => {
        const e = embaucheDecalee(c);
        return [
          e.venduesEnPlus > 0 || e.r.venduesEnPlus > 0
            ? `Embauché au premier trimestre, le salarié fait vendre ${qte(e.r.venduesEnPlus)} ${c.unites} de plus ; embauché au trimestre ${TRIMESTRE_DE_L_EMBAUCHE_DECALEE}, ${qte(e.venduesEnPlus)}. Le travail manquait par moments : un trimestre de moins avec lui, ce sont aussi des ventes de moins.`
            : `À aucune des deux dates l'embauche ne fait vendre une unité de plus : ce n'est pas le travail qui limitait les ventes. Attendre réduit seulement la perte, de ${eur(e.gainDeLAttente)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const e = embaucheDecalee(c);
        const perteMaintenant = eur(-e.r.ecartDeResultat);
        const perteDecalee = eur(-e.ecartDeResultat);
        return [
          {
            texte: "Ni maintenant ni plus tard : l'équipe ne limite pas nos ventes",
            juste: e.verdict === "aucune",
            retour:
              e.verdict === "aucune"
                ? `Oui : à aucune des deux dates l'arène ne vend une unité de plus. Attendre réduit la perte à ${perteDecalee} au lieu de ${perteMaintenant}, mais ne pas embaucher n'en fait aucune.`
                : `Non : l'embauche fait vendre ${qte(Math.max(e.venduesEnPlus, e.r.venduesEnPlus))} ${c.unites} de plus à l'une des deux dates. L'équipe limitait les ventes par moments.`,
          },
          {
            texte: "Elle fait vendre, mais ne se paie à aucune des deux dates",
            juste: e.verdict === "perte",
            retour:
              e.verdict === "perte"
                ? `Oui : ${qte(e.r.venduesEnPlus)} ${c.unites} de plus au premier trimestre, ${qte(e.venduesEnPlus)} au trimestre ${TRIMESTRE_DE_L_EMBAUCHE_DECALEE}, quand il en faudrait ${qte(e.r.ventesPourSePayer)} et ${qte(e.ventesPourSePayer)}. Le résultat baisse de ${perteMaintenant} ou de ${perteDecalee} : le travail ne manque pas assez pour un salarié de plus.`
                : e.verdict === "aucune"
                  ? "Non : elle ne fait rien vendre de plus, à aucune des deux dates."
                  : "Non : à l'une des deux dates au moins, elle rapporte plus qu'elle ne coûte.",
          },
          {
            texte: "Embauchons dès maintenant : attendre nous ferait perdre des ventes",
            juste: e.verdict === "maintenant",
            retour:
              e.verdict === "maintenant"
                ? `Oui : au premier trimestre, le résultat monte de ${eur(e.r.ecartDeResultat)}, contre ${eur(e.ecartDeResultat)} au trimestre ${TRIMESTRE_DE_L_EMBAUCHE_DECALEE}. Le salaire économisé ne vaut pas les ventes d'un trimestre.`
                : `Non : ${e.verdict === "aucune" ? "elle ne fait rien vendre de plus, à aucune des deux dates" : e.verdict === "perte" ? `elle coûte plus qu'elle ne rapporte, à chacune des deux dates` : "attendre rapporte davantage au résultat"}.`,
          },
          {
            texte: `Attendons : l'embauche coûtera ${eur(e.economie)} de moins, et elle se paiera`,
            juste: e.verdict === "attendre",
            retour:
              e.verdict === "attendre"
                ? `Oui : au trimestre ${TRIMESTRE_DE_L_EMBAUCHE_DECALEE}, le résultat monte de ${eur(e.ecartDeResultat)}, contre ${eur(e.r.ecartDeResultat)} au premier trimestre. Le salaire économisé vaut plus que les ventes du trimestre attendu.`
                : e.ecartDeResultat <= 0
                  ? `Non : attendre économise bien ${eur(e.economie)}, mais l'embauche décalée fait encore baisser le résultat de ${perteDecalee}. Une embauche moins chère n'est pas une embauche qui se paie.`
                  : `Non : attendre économise bien ${eur(e.economie)}, mais l'embauche au premier trimestre rapporte davantage au résultat (${eur(e.r.ecartDeResultat)} contre ${eur(e.ecartDeResultat)}).`,
          },
        ];
      },
    },
  ],
};
