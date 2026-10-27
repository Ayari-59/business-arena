import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { TRIMESTRE_DE_L_ACHAT, machineDuChapitre } from "../../chapitres/croitre-en-investissant";
import { COUT_DU_CAPITAL_ANNUEL, LA_VALEUR_ACTUELLE_NETTE, TAUX_TRIMESTRIEL, projet } from "../../chapitres/la-valeur-actuelle-nette";
import type { Situation } from "../types";

/** Au centime, sans zéro négatif. */
const centime = (x: number) => auCentime(x) || 0;
/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const coef4 = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/**
 * CAS PRATIQUE DU CHAPITRE « LA VALEUR ACTUELLE NETTE D'UN INVESTISSEMENT » : REVENDRE LA MACHINE
 * PLUS TÔT (DSCG, UE2 Finance, palier 4).
 *
 * Le chapitre a gardé la machine pendant les douze trimestres du projet. Le directeur financier
 * envisage de la revendre au bout de huit (`DUREE_AVANT_LA_REVENTE`) : moins de flux, mais une
 * revente plus forte, la machine étant moins amortie. L'élève refait seul les calculs du chapitre
 * sur ce projet raccourci : la valeur résiduelle au bout du huitième trimestre, la valeur actuelle
 * des flux, la VAN, et la compare à celle du chapitre.
 *
 * Là où la machine détruit de la valeur gardée jusqu'au bout (L'ESCALE), la revendre tôt peut en
 * créer : moins amortie, elle se reprend plus cher, et les trimestres abandonnés rapportaient peu.
 * Là où elle en crée gardée, la revendre tôt peut en détruire (LA TABLE D'AUGUSTIN), ou en créer
 * moins (ailleurs). Les textes ne disent pas « encore de la valeur » là où il n'y en avait pas.
 *
 * Les flux sont ceux du chapitre, trimestre pour trimestre : l'arène ne décide rien en fonction
 * de la durée de la partie (seule la boucle de `runGame` lit `roundsCount`), si bien que les huit
 * premiers trimestres du projet de douze sont ceux d'un projet de huit. La revente suit la règle
 * du moteur, à la part du catalogue de la valeur nette comptable.
 */

/** La revente envisagée par le directeur financier, une hypothèse du cas : au bout du huitième trimestre, deux exercices. */
export const DUREE_AVANT_LA_REVENTE = 8;

export type Verdict = "garder-cree-plus" | "revendre-detruit" | "revendre-cree-plus";

/** Le projet raccourci, face à celui du chapitre. */
export function revendrePlusTot(c: Cas) {
  const machine = machineDuChapitre(c.code);
  const court = projet(c.code, [machine], DUREE_AVANT_LA_REVENTE);
  const long = projet(c.code, [machine]);
  const ecart = centime(court.van - long.van);
  const verdict: Verdict = court.van <= 0 ? "revendre-detruit" : court.van >= long.van ? "revendre-cree-plus" : "garder-cree-plus";
  return { court, long, ecart, verdict };
}

const T = TRIMESTRE_DE_L_ACHAT;
const TAUX_PCT = auCentieme(TAUX_TRIMESTRIEL * 100);

export const REVENDRE_LA_MACHINE_PLUS_TOT: Situation = {
  code: "revendre-la-machine-plus-tot",
  parcours: "dscg-finance",
  palier: 4,
  blocs: [],
  reprend: [LA_VALEUR_ACTUELLE_NETTE.code],
  commanditaire: "Le directeur financier",
  titre: "Revendre la machine plus tôt",
  accroche: `Le directeur financier voudrait revendre la machine au bout de ${DUREE_AVANT_LA_REVENTE} trimestres : moins de flux, mais une revente plus forte. L'investissement crée-t-il de la valeur, et autant qu'en gardant la machine ?`,
  objectifs: [
    "Calculer la valeur résiduelle d'un équipement revendu avant la fin de son amortissement",
    "Actualiser les flux d'un projet raccourci et calculer sa VAN",
    "Comparer deux durées d'un même projet par leur VAN",
    "Répondre au directeur financier, chiffre à l'appui",
  ],
  libre: false,
  entreprises: LA_VALEUR_ACTUELLE_NETTE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du directeur financier",
      texte: (c) => {
        const { court, long } = revendrePlusTot(c);
        return [
          `« Nous aurons peut-être besoin de la place dans ${DUREE_AVANT_LA_REVENTE} trimestres. Si nous achetons la machine « ${court.machine} » au trimestre ${T} et la revendons à la fin du trimestre ${DUREE_AVANT_LA_REVENTE}, au lieu de la garder ${long.duree} trimestres, ${long.van > 0 ? "l'investissement crée-t-il encore de la valeur ? Et autant ?" : "reprise plus cher, la machine crée-t-elle alors de la valeur ?"} »`,
          `Pas de cours cette fois : vous avez les flux de la machine, trimestre par trimestre, ceux que l'arène a rejoués au chapitre, et les conditions de la revente. Au chapitre, gardée ${long.duree} trimestres, la machine avait une VAN de ${eur(long.van)}.`,
        ];
      },
      tableau: (c) => {
        const { court } = revendrePlusTot(c);
        return {
          titre: `La machine ${dE(c.entreprise)}, revendue au bout de ${DUREE_AVANT_LA_REVENTE} trimestres`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Prix de la machine, décaissé au trimestre ${T}`, valeurs: [eur(court.cout)] },
            { libelle: "Durée d'amortissement (trimestres)", valeurs: [qte(court.dureeDAmortissement)] },
            { libelle: "Part de la valeur nette comptable reprise à la revente", valeurs: [pct(court.vr.ratio * 100)] },
            { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(court.tauxPct)] },
            { libelle: "Taux d'actualisation, par trimestre", valeurs: [pct(TAUX_PCT)] },
            ...court.lignes.map((l) => ({ libelle: `Flux de trésorerie du trimestre ${l.trimestre}`, valeurs: [eur(l.flux)] })),
          ],
        };
      },
      repere: () => "À rendre : la valeur résiduelle de la machine revendue tôt, la VAN du projet raccourci, et votre réponse.",
    },
    {
      id: "revente",
      type: "montants",
      titre: "Ce que rend la revente",
      notions: ["depreciation"],
      question: (c) => {
        const { court } = revendrePlusTot(c);
        return `Revendue à la fin du trimestre ${DUREE_AVANT_LA_REVENTE}, la machine aura servi ${court.vr.enService} trimestres. Calculez sa valeur nette comptable à la revente, son prix de cession, puis la valeur résiduelle nette d'impôt.`;
      },
      champs: (c) => {
        const { court: p } = revendrePlusTot(c);
        const v = p.vr;
        return [
          {
            libelle: "Valeur nette comptable à la revente",
            attendu: v.vnc,
            calcul: `${eur(p.cout)} × (1 − ${v.enService} ÷ ${p.dureeDAmortissement}) = ${eur(v.vnc)}`,
            tolerance: 1,
          },
          { libelle: "Prix de cession", attendu: v.prix, calcul: `${eur(v.vnc)} × ${pct(v.ratio * 100)} = ${eur(v.prix)}`, tolerance: 1 },
          {
            libelle: "Valeur résiduelle nette d'impôt",
            attendu: v.nette,
            calcul: `${eur(v.prix)} + ${pct(p.tauxPct)} × (${eur(v.vnc)} − ${eur(v.prix)}) = ${eur(v.nette)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const { court, long } = revendrePlusTot(c);
        return [
          `Revendue tôt, la machine rend ${eur(court.vr.nette)}, impôt compris, contre ${eur(long.vr.nette)} au bout de ${long.duree} trimestres : moins amortie, elle se reprend plus cher. Mais l'arène n'en reprend que ${pct(court.vr.ratio * 100)} de la valeur nette comptable : la revente ne rend jamais ce que la machine n'a pas encore amorti.`,
        ];
      },
    },
    {
      id: "van",
      type: "montants",
      titre: "La VAN du projet raccourci",
      notions: ["discounting"],
      question: () =>
        `Au taux de ${pct(TAUX_PCT)} par trimestre, calculez la valeur actuelle des flux des ${DUREE_AVANT_LA_REVENTE} trimestres, celle de la valeur résiduelle, puis la VAN du projet raccourci.`,
      champs: (c) => {
        const { court: p } = revendrePlusTot(c);
        return [
          { libelle: "Valeur actuelle des flux d'exploitation", attendu: p.va, calcul: `la somme des flux × (1 + ${pct(TAUX_PCT)})^(−k), k de 1 à ${p.duree} : ${eur(p.va)}`, tolerance: p.tolerance },
          { libelle: "Valeur actuelle de la valeur résiduelle", attendu: p.vaResiduelle, calcul: `${eur(p.vr.nette)} × ${coef4(p.coefFin)} = ${eur(p.vaResiduelle)}`, tolerance: 1 },
          { libelle: "VAN du projet raccourci", attendu: p.van, calcul: `${eur(p.va)} + ${eur(p.vaResiduelle)} − ${eur(p.cout)} = ${eur(p.van)}`, tolerance: p.tolerance + 1 },
        ];
      },
      explication: (c) => {
        const { court, long, ecart } = revendrePlusTot(c);
        const abandonnes = centime(long.va - court.va);
        const revente = centime(court.vaResiduelle - long.vaResiduelle);
        return [
          `Gardée ${long.duree} trimestres, la machine avait une VAN de ${eur(long.van)} ; revendue au bout de ${court.duree}, ${eur(court.van)}, soit ${eur(Math.abs(ecart))} ${ecart <= 0 ? "de moins" : "de plus"}. ${
            ecart <= 0
              ? `Les ${long.duree - court.duree} trimestres abandonnés rapportaient ${eur(abandonnes)} en valeur actuelle ; la revente avancée n'en rend que ${eur(revente)} de plus.`
              : abandonnes >= 0
                ? `La revente avancée rend ${eur(revente)} de plus en valeur actuelle, plus que les ${eur(abandonnes)} que rapportaient les ${long.duree - court.duree} trimestres abandonnés.`
                : `La revente avancée rend ${eur(revente)} de plus en valeur actuelle, et les ${long.duree - court.duree} trimestres abandonnés, loin de rapporter, retiraient ${eur(-abandonnes)} en valeur actuelle.`
          }`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      notions: ["discounting"],
      question: () => "Quelle phrase envoyez-vous au directeur financier ?",
      options: (c) => {
        const { court, long, verdict } = revendrePlusTot(c);
        const cout = pct(auCentieme(COUT_DU_CAPITAL_ANNUEL * 100));
        return [
          {
            texte: "Revendre tôt crée encore de la valeur, mais moins que garder la machine",
            juste: verdict === "garder-cree-plus",
            retour:
              verdict === "garder-cree-plus"
                ? `Oui : la VAN reste positive, ${eur(court.van)}, mais garder la machine ${long.duree} trimestres en crée ${eur(long.van)}. Si la place ne manque pas, mieux vaut la garder.`
                : verdict === "revendre-detruit"
                  ? `Non : revendue tôt, la machine a une VAN négative, ${eur(court.van)}.`
                  : `Non : revendue tôt, elle crée plus de valeur, ${eur(court.van)} contre ${eur(long.van)}.`,
          },
          {
            texte: "Revendre tôt détruit de la valeur : sa VAN est négative",
            juste: verdict === "revendre-detruit",
            retour:
              verdict === "revendre-detruit"
                ? `Oui : sur ${court.duree} trimestres, ses flux et sa revente, actualisés à ${cout} par an, ne rendent pas son prix : la VAN est de ${eur(court.van)}. ${
                    long.van > 0
                      ? `Gardée ${long.duree} trimestres, elle en créait ${eur(long.van)}. Mieux vaut ne pas l'acheter si elle doit partir si tôt.`
                      : `Gardée ${long.duree} trimestres, elle n'en créait pas non plus : sa VAN était de ${eur(long.van)}. Mieux vaut ne pas l'acheter du tout.`
                  }`
                : `Non : la VAN du projet raccourci reste positive, ${eur(court.van)}.`,
          },
          {
            texte: "Revendre tôt crée plus de valeur que garder la machine",
            juste: verdict === "revendre-cree-plus",
            retour:
              verdict === "revendre-cree-plus"
                ? `Oui : la VAN du projet raccourci, ${eur(court.van)}, dépasse celle du projet entier, ${eur(long.van)}.`
                : verdict === "revendre-detruit"
                  ? `Non : revendue tôt, la machine ne crée pas de valeur : la VAN du projet raccourci est négative, ${eur(court.van)}.`
                  : `Non : la VAN du projet raccourci, ${eur(court.van)}, est sous celle du projet entier, ${eur(long.van)}.`,
          },
          {
            texte: "Rien ne change : la revente rend à l'entreprise tout ce que la machine n'a pas encore amorti",
            juste: false,
            retour: `Non : l'arène ne reprend que ${pct(court.vr.ratio * 100)} de la valeur nette comptable, et les trimestres abandonnés ne rapportent plus rien. La VAN passe de ${eur(long.van)} à ${eur(court.van)}.`,
          },
        ];
      },
    },
  ],
};
