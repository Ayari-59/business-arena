import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { PieceDuBureau } from "../bureaux/types";
import { dateDe } from "../chapitres/la-cloture";
import { cloture } from "../monde/cloture";
import { empruntALaCloture } from "../monde/emprunt";
import {
  JOUR_DU_BILAN_DE_L_ALTERNANT,
  bilanFonctionnelDeLAlternant,
  bilanFonctionnelJuste,
  postesDuBilanDeLAlternant,
  type ErreurDeLAlternant,
  type MassesFonctionnelles,
} from "../monde/bilan-fonctionnel-de-l-alternant";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import { eur, etapeDuControle, terme, type LigneDuDossier } from "./lignes-du-dossier";
import type { Enquete } from "./types";

/**
 * L'ENQUÊTE : LE BILAN FONCTIONNEL DE L'ALTERNANT (comptabilité générale, palier 4 ; la suite du chapitre
 * « Bilan fonctionnel et BFR »).
 *
 * Début février N+1, l'alternant a relu par fonction le bilan comptable de NOVA au 31 décembre N, pour le
 * dossier de la banque. Le président veut savoir s'il peut l'envoyer. L'élève reçoit le dossier (le
 * courriel du président, le bilan comptable, les notes, le bilan fonctionnel de l'alternant), contrôle
 * chaque reclassement, nomme l'erreur de chaque faux, puis refait les masses et dit au président ce qui
 * change. Le format « enquête » sur un document de synthèse : enquetes/lignes-du-dossier.ts.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : les bons dans la clôture de NOVA
 * (monde/cloture.ts), ceux de l'alternant dans monde/bilan-fonctionnel-de-l-alternant.ts.
 */

const f = EXERCICE_DE_NOVA;
const k = cloture(f);
const p = postesDuBilanDeLAlternant(f);
const j = bilanFonctionnelJuste(f);
const a = bilanFonctionnelDeLAlternant(f);
const auCentimeDe = (x: number) => Math.round(x * 100) / 100 + 0;
const echeanceDuPlacement = dateDe(f.placement.echeance);
/** La date de la prochaine échéance de l'emprunt, avec laquelle se paient les intérêts courus. */
const empruntSuivant = () => empruntALaCloture(f.pret).interetsCourus.echeanceSuivante!.date;

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

const JOUR = dateDe(JOUR_DU_BILAN_DE_L_ALTERNANT);
const AU_31_DECEMBRE = `${dateDe(f.cloture)} N`;

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Le bilan fonctionnel pour la banque",
  paragraphes: [
    "Bonjour,",
    `Notre alternant a relu le bilan du 31 décembre par fonction. Il trouve un fonds de roulement de ${eur(a.fondsDeRoulement)} et une trésorerie nette de ${eur(a.tresorerieNette)}, et il me dit que tout est juste, puisque le fonds de roulement moins le besoin tombe bien sur la trésorerie.`,
    "Avant d'envoyer son tableau à la banque, contrôlez chacun de ses reclassements. Pour chaque reclassement faux, dites-moi ce qui ne va pas. Puis refaites les masses, et dites-moi ce qui change.",
    "Merci. Le président",
  ],
};

/** Les comptes de bilan de la clôture : ce que le bilan comptable porte, compte par compte. */
const COMPTES_DU_BILAN = Object.entries(k.soldes)
  .filter(([c, v]) => /^[1-5]/.test(c) && Math.abs(v) > 0.004)
  .sort(([x], [y]) => x.localeCompare(y))
  .map(([compte, v]) => ({ compte, intitule: compte === "4455" ? "TVA à décaisser" : intituleDe(compte), debit: v > 0 ? v : 0, credit: v < 0 ? -v : 0 }));

const BILAN: PieceDuBureau = {
  code: "bilan",
  nature: "balance",
  titre: "Les comptes de bilan au 31 décembre N",
  de: "La comptabilité de NOVA",
  a: "Le service comptable",
  date: AU_31_DECEMBRE,
  comptes: COMPTES_DU_BILAN,
  montants: [
    { libelle: "Résultat de l'exercice, au passif", montant: k.resultatNet },
    { libelle: "Total du bilan", montant: k.bilan.totalActif, fort: true },
  ],
  mention: "Après les travaux d'inventaire et l'impôt.",
};

const NOTES: PieceDuBureau = {
  code: "notes",
  nature: "note",
  titre: "Notes du service comptable",
  de: "Le service comptable de NOVA",
  a: "L'alternant",
  date: AU_31_DECEMBRE,
  objet: "Ce qu'il faut savoir des postes du bilan",
  paragraphes: [
    `Le compte à terme : ${eur(f.placement.montant)} placés le ${dateDe(f.placement.date)} pour ${f.placement.dureeMois} mois, ils reviennent le ${echeanceDuPlacement}. Ses intérêts courus, ${eur(k.soldes[f.placement.compteDesInteretsCourus] ?? 0)}, se touchent avec lui.`,
    `L'emprunt : ${eur(p.interetsCourus)} d'intérêts courus depuis la dernière échéance, payés avec la prochaine, le ${dateDe(empruntSuivant())}.`,
    `L'impôt sur les sociétés de N, ${eur(p.impot)}, reste dû à l'État : aucun acompte n'a été versé.`,
    `La provision pour litige, ${eur(p.provision)} : le client qui assigne NOVA n'a pas encore été jugé.`,
    `La facture de Composants Express, livrée en décembre, n'est pas arrivée : sa TVA, ${eur(p.tvaSurFactureNonParvenue)}, se déduira à son arrivée.`,
  ],
  mention: "Le bilan fonctionnel lit les immobilisations à leur valeur brute.",
};


/** Les masses d'un bilan fonctionnel, comme une pièce les présente. */
const montantsDesMasses = (m: MassesFonctionnelles) => [
  { libelle: "Emplois stables", montant: m.emploisStables },
  { libelle: "Ressources stables", montant: m.ressourcesStables },
  { libelle: "Fonds de roulement net global", montant: m.fondsDeRoulement, fort: true },
  { libelle: "Actif d'exploitation", montant: m.actifDExploitation },
  { libelle: "Passif d'exploitation", montant: m.passifDExploitation },
  { libelle: "Besoin en fonds de roulement d'exploitation", montant: m.besoinDExploitation, fort: true },
  { libelle: "Actif hors exploitation", montant: m.actifHorsExploitation },
  { libelle: "Passif hors exploitation", montant: m.passifHorsExploitation },
  { libelle: "Trésorerie nette", montant: m.tresorerieNette, fort: true },
];

const BILAN_DE_L_ALTERNANT: PieceDuBureau = {
  code: "bilan-de-l-alternant",
  nature: "note",
  titre: "Le bilan fonctionnel de l'alternant",
  de: "L'alternant",
  a: "Le président",
  date: JOUR,
  objet: "Le bilan fonctionnel au 31 décembre N",
  paragraphes: [
    `Emplois stables : la ligne de montage, ${eur(p.ligneBrute - p.amortissements)}, et le compte à terme avec ses intérêts courus, ${eur(p.placement)}.`,
    `Ressources stables : les capitaux propres, la dépréciation de la créance de Sonora, l'emprunt et ses intérêts courus, ${eur(p.interetsCourus)}.`,
    `Actif d'exploitation : le stock, les clients, la TVA sur la facture non parvenue, ${eur(p.tvaSurFactureNonParvenue)}, et la charge constatée d'avance, ${eur(p.chargeConstateeDAvance)}.`,
    `Passif d'exploitation : les fournisseurs, les dettes sociales, la TVA à décaisser, l'impôt dû, ${eur(p.impot)}, la provision pour litige, ${eur(p.provision)}, et le produit constaté d'avance, ${eur(p.produitConstateDAvance)}.`,
    "Trésorerie : la banque. Rien hors exploitation.",
  ],
  montants: montantsDesMasses(a),
  mention: "Vérification : le fonds de roulement, moins le besoin, égale la trésorerie nette.",
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, BILAN, NOTES, BILAN_DE_L_ALTERNANT];

// ─────────────────────────────────────────────────────────────────────────────
// LE CONTRÔLE
// ─────────────────────────────────────────────────────────────────────────────

/** Les raisons : les cinq erreurs, et trois leurres ; la plus longue est un leurre. */
const RAISONS: readonly { code: ErreurDeLAlternant | "tva" | "cote" | "exercice"; libelle: string }[] = [
  { code: "valeur-nette", libelle: "Le poste est pris pour sa valeur nette" },
  { code: "placement", libelle: "Un placement à court terme est rangé en emplois stables" },
  { code: "interets-courus", libelle: "Une dette à payer sous peu est rangée en dettes financières" },
  { code: "impot", libelle: "Une dette hors exploitation est rangée en exploitation" },
  { code: "provision", libelle: "Une provision est rangée avec les dettes" },
  { code: "tva", libelle: "La TVA est comptée deux fois" },
  { code: "cote", libelle: "Le poste est du mauvais côté du bilan" },
  { code: "exercice", libelle: "Le poste concerne l'exercice suivant et ne doit pas figurer au bilan fonctionnel" },
];

const LIGNES: readonly LigneDuDossier[] = [
  {
    code: "ligne",
    libelle: "La ligne de montage, aux emplois stables",
    piece: "bilan-de-l-alternant",
    dossier: auCentimeDe(p.ligneBrute - p.amortissements),
    juste: p.ligneBrute,
    raison: "valeur-nette",
    pourquoi: `Fausse : le bilan fonctionnel lit les emplois stables à leur valeur brute, ${eur(p.ligneBrute)}, et range les amortissements, ${eur(p.amortissements)}, dans les ressources stables. L'alternant les a retirés des deux côtés : le fonds de roulement ne change pas, les deux masses sont trop basses.`,
  },
  {
    code: "placement",
    libelle: "Le compte à terme et ses intérêts courus, aux emplois stables",
    piece: "notes",
    dossier: p.placement,
    juste: p.placement,
    raison: "placement",
    pourquoi: `Fausse : le compte à terme revient le ${echeanceDuPlacement}, moins d'un an après la clôture. C'est un placement de trésorerie, à la trésorerie active, avec ses intérêts courus : ${eur(p.placement)}.`,
  },
  {
    code: "tva",
    libelle: "La TVA sur la facture non parvenue, à l'actif d'exploitation",
    piece: "notes",
    dossier: p.tvaSurFactureNonParvenue,
    juste: p.tvaSurFactureNonParvenue,
    raison: null,
    pourquoi: "Juste : cette TVA naît d'un achat de composants, le cycle d'exploitation. Elle est à l'actif d'exploitation.",
  },
  {
    code: "charge",
    libelle: "La charge constatée d'avance, à l'actif d'exploitation",
    piece: "bilan",
    dossier: p.chargeConstateeDAvance,
    juste: p.chargeConstateeDAvance,
    raison: null,
    pourquoi: "Juste : la prime d'assurance payée d'avance couvre l'activité de N+1. Elle est à l'actif d'exploitation.",
  },
  {
    code: "provision",
    libelle: "La provision pour litige, au passif d'exploitation",
    piece: "notes",
    dossier: p.provision,
    juste: p.provision,
    raison: "provision",
    pourquoi: `Fausse : une provision pour risque n'est pas une dette. Le bilan fonctionnel la range dans les ressources stables, avec les capitaux propres : ${eur(p.provision)}.`,
  },
  {
    code: "interets",
    libelle: "Les intérêts courus de l'emprunt, aux dettes financières",
    piece: "notes",
    dossier: p.interetsCourus,
    juste: p.interetsCourus,
    raison: "interets-courus",
    pourquoi: `Fausse : les intérêts courus se paient le ${dateDe(empruntSuivant())}, avec l'échéance. Ce n'est pas une ressource stable : ils vont au passif hors exploitation.`,
  },
  {
    code: "impot",
    libelle: "L'impôt sur les sociétés dû, au passif d'exploitation",
    piece: "notes",
    dossier: p.impot,
    juste: p.impot,
    raison: "impot",
    pourquoi: `Fausse : l'impôt sur les bénéfices ne naît pas du cycle d'exploitation. La dette, ${eur(p.impot)}, va au passif hors exploitation.`,
  },
  {
    code: "produit",
    libelle: "Le produit constaté d'avance, au passif d'exploitation",
    piece: "bilan",
    dossier: p.produitConstateDAvance,
    juste: p.produitConstateDAvance,
    raison: null,
    pourquoi: "Juste : les enceintes facturées en décembre et livrées en janvier relèvent des ventes. Le produit constaté d'avance est au passif d'exploitation.",
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// LES MASSES CORRIGÉES
// ─────────────────────────────────────────────────────────────────────────────

/** Les masses corrigées : celles de l'alternant en regard, les justes à saisir. */
export function grilleDesMasses(): TableauACompleter {
  const ligne = (libelle: string, dossier: number, juste: number, calcul: string, indice: string, fort?: boolean) => ({
    libelle,
    ...(fort ? { fort } : {}),
    cellules: [{ valeur: dossier }, { valeur: juste, saisir: true, calcul, indice }],
  });
  return {
    titre: "Le bilan fonctionnel au 31 décembre N, corrigé",
    colonnes: ["L'alternant", "Corrigé"],
    lignes: [
      ligne("Emplois stables", a.emploisStables, j.emploisStables, `la ligne de montage en brut, ${eur(j.emploisStables)} ; le compte à terme n'en est pas`, "les immobilisations à leur valeur brute, sans les placements à court terme"),
      ligne(
        "Ressources stables",
        a.ressourcesStables,
        j.ressourcesStables,
        `${eur(a.ressourcesStables)} + ${eur(p.amortissements)} d'amortissements + ${eur(p.provision)} de provision − ${eur(p.interetsCourus)} d'intérêts courus = ${eur(j.ressourcesStables)}`,
        "les capitaux propres, les amortissements, les dépréciations, les provisions et l'emprunt seul",
      ),
      { ...ligne("Fonds de roulement net global", a.fondsDeRoulement, j.fondsDeRoulement, `${eur(j.ressourcesStables)} − ${eur(j.emploisStables)} = ${eur(j.fondsDeRoulement)}`, "les ressources stables moins les emplois stables", true), totalDe: { plus: [1], moins: [0] } },
      ligne("Actif d'exploitation", a.actifDExploitation, j.actifDExploitation, `inchangé : ${eur(j.actifDExploitation)}`, "le stock, les clients en brut, la TVA déductible et la charge constatée d'avance"),
      ligne("Passif d'exploitation", a.passifDExploitation, j.passifDExploitation, `${eur(a.passifDExploitation)} − ${eur(p.impot)} d'impôt − ${eur(p.provision)} de provision = ${eur(j.passifDExploitation)}`, "les dettes nées des achats, de la paie, de la TVA et des ventes facturées d'avance"),
      { ...ligne("Besoin en fonds de roulement d'exploitation", a.besoinDExploitation, j.besoinDExploitation, `${eur(j.actifDExploitation)} − ${eur(j.passifDExploitation)} = ${eur(j.besoinDExploitation)}`, "l'actif d'exploitation moins le passif d'exploitation", true), totalDe: { plus: [3], moins: [4] } },
      ligne("Actif hors exploitation", a.actifHorsExploitation, j.actifHorsExploitation, "aucune créance hors exploitation : zéro", "une créance qui ne naît pas de l'exploitation"),
      ligne("Passif hors exploitation", a.passifHorsExploitation, j.passifHorsExploitation, `${eur(p.impot)} d'impôt + ${eur(p.interetsCourus)} d'intérêts courus = ${eur(j.passifHorsExploitation)}`, "les dettes qui ne naissent pas de l'exploitation"),
      { ...ligne("Besoin en fonds de roulement hors exploitation", a.besoinHorsExploitation, j.besoinHorsExploitation, `${eur(j.actifHorsExploitation)} − ${eur(j.passifHorsExploitation)} = ${eur(j.besoinHorsExploitation)}`, "l'actif hors exploitation moins le passif hors exploitation, en négatif s'il l'emporte", true), totalDe: { plus: [6], moins: [7] } },
      {
        ...ligne("Trésorerie nette", a.tresorerieNette, j.tresorerieNette, `${eur(j.fondsDeRoulement)} ${terme(-j.besoinDExploitation)} ${terme(-j.besoinHorsExploitation)} = ${eur(j.tresorerieNette)}, la banque et le compte à terme`, "le fonds de roulement moins les deux besoins", true),
        totalDe: { plus: [2], moins: [5, 8] },
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ENQUÊTE
// ─────────────────────────────────────────────────────────────────────────────

const nombreDErreurs = LIGNES.filter((l) => l.raison).length;
const ecartDuFondsDeRoulement = auCentimeDe(j.fondsDeRoulement - a.fondsDeRoulement);

export const LE_BILAN_FONCTIONNEL_DE_L_ALTERNANT: Enquete = {
  format: "enquete",
  code: "le-bilan-fonctionnel-de-l-alternant",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["bilan-fonctionnel-et-bfr"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Enquête : le bilan fonctionnel de l'alternant",
  accroche: "L'alternant a relu le bilan de NOVA par fonction, et son égalité tombe juste. Le président veut l'envoyer à la banque : contrôlez chaque reclassement, nommez les erreurs, refaites les masses.",
  objectifs: [
    "Contrôler les reclassements d'un bilan fonctionnel face au bilan comptable et aux notes",
    "Nommer l'erreur d'un reclassement : la valeur nette, le placement, les intérêts courus, l'impôt, la provision",
    "Refaire le fonds de roulement, les besoins et la trésorerie nette, et mesurer ce que les erreurs changent",
    "Comprendre qu'une égalité vérifiée ne prouve pas un classement juste",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Le premier exercice est clos ; l'alternant a préparé le bilan fonctionnel du ${AU_31_DECEMBRE} pour la banque.`,
    "Sur votre poste, le dossier : le courriel du président, les comptes de bilan, les notes du service comptable et le bilan fonctionnel de l'alternant. Certains reclassements sont justes, d'autres non. Rien ne vous dit lesquels : c'est votre enquête.",
  ],
  pile: PILE,
  etapes: [
    etapeDuControle({
      id: "le-controle",
      titre: "Contrôler les reclassements",
      consigne: "Pour chaque reclassement de l'alternant, dites s'il est juste. S'il est faux, choisissez ce qui ne va pas.",
      pieces: ["bilan-de-l-alternant", "notes"],
      raisons: RAISONS,
      lignes: LIGNES,
      explication: [
        `${nombreDErreurs} reclassements sur ${LIGNES.length} sont faux, chacun d'une nature différente. Aucun ne déséquilibre le bilan : chaque erreur déplace un poste d'une masse à une autre, ou le retire des deux côtés.`,
      ],
    }),
    {
      id: "les-masses",
      type: "etat",
      titre: "Refaire les masses",
      consigne: "Complétez la colonne corrigée, masse par masse. Un besoin négatif s'écrit en négatif ; une masse sans poste vaut zéro.",
      pieces: ["bilan-de-l-alternant", "bilan"],
      grille: grilleDesMasses(),
      reussite: "Le bilan fonctionnel corrigé est juste.",
      explication: [
        `Le fonds de roulement passe de ${eur(a.fondsDeRoulement)} à ${eur(j.fondsDeRoulement)} : ${eur(ecartDuFondsDeRoulement)} de plus, le compte à terme sorti des emplois stables et la provision rendue aux ressources stables.`,
        `La trésorerie nette passe de ${eur(a.tresorerieNette)} à ${eur(j.tresorerieNette)} : la banque et le compte à terme. Le besoin hors exploitation devient négatif, ${eur(j.besoinHorsExploitation)} : l'impôt et les intérêts à payer financent le reste.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez au président, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "le-fonds-de-roulement",
          question: "Quel fonds de roulement net global la banque doit-elle lire ?",
          options: [
            { texte: `${eur(j.fondsDeRoulement)}`, juste: true, retour: `Oui : ${eur(j.ressourcesStables)} de ressources stables moins ${eur(j.emploisStables)} d'emplois stables.` },
            { texte: `${eur(a.fondsDeRoulement)}, celui de l'alternant`, juste: false, retour: "Non : le compte à terme n'est pas un emploi stable, et la provision est une ressource stable." },
            {
              texte: `${eur(auCentimeDe(j.ressourcesStables - (p.ligneBrute - p.amortissements)))}, les ressources moins la ligne nette`,
              juste: false,
              retour: "Non : ce calcul mêle les deux lectures. Si les amortissements sont aux ressources stables, la ligne est aux emplois stables pour sa valeur brute.",
            },
            { texte: `${eur(auCentimeDe(a.fondsDeRoulement + p.placement))}, sans le compte à terme`, juste: false, retour: "Presque : le compte à terme sort bien des emplois stables, mais la provision et les intérêts courus restent mal rangés." },
          ],
        },
        {
          id: "l-egalite",
          question: "L'égalité de l'alternant tombe juste. Qu'est-ce que cela prouve ?",
          options: [
            { texte: "Rien sur son classement", juste: true, retour: "Oui : chaque erreur déplace un poste d'une masse à une autre sans déséquilibrer le bilan. L'égalité tient, que le classement soit juste ou non." },
            { texte: "Que son bilan fonctionnel est juste", juste: false, retour: `Non : ${nombreDErreurs} reclassements sont faux, et l'égalité tient quand même.` },
            { texte: "Que seule sa trésorerie nette peut être fausse", juste: false, retour: "Non : le fonds de roulement et les besoins le sont aussi ; ils se trompent ensemble." },
            { texte: "Que ses erreurs se compensent, sans effet sur aucune des masses du bilan", juste: false, retour: `Non : le fonds de roulement est faux de ${eur(ecartDuFondsDeRoulement)}. L'égalité tient, les masses sont fausses.` },
          ],
        },
        {
          id: "la-tresorerie",
          question: "Quelle trésorerie nette NOVA a-t-elle au 31 décembre ?",
          options: [
            { texte: `${eur(j.tresorerieNette)}, la banque et le compte à terme`, juste: true, retour: `Oui : le compte à terme revient le ${echeanceDuPlacement}. C'est de la trésorerie, avec ses intérêts courus.` },
            { texte: `${eur(a.tresorerieNette)}, la banque seule`, juste: false, retour: "Non : un placement à moins d'un an fait partie de la trésorerie active." },
            { texte: `${eur(auCentimeDe(j.tresorerieNette - p.impot))}, l'impôt dû retranché, puisqu'il sera payé bientôt`, juste: false, retour: "Non : l'impôt dû est au passif hors exploitation. Il entre dans le besoin, pas dans la trésorerie." },
          ],
        },
      ],
      explication: [
        `Votre réponse au président : le fonds de roulement est de ${eur(j.fondsDeRoulement)}, la trésorerie nette de ${eur(j.tresorerieNette)}. Le tableau de l'alternant ne part pas tel quel à la banque.`,
      ],
    },
  ],
};
