import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { PieceDuBureau } from "../bureaux/types";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import { AFFIRMATIONS_DE_L_ANALYSTE, noteDeLAnalyste, type CodeDeLAffirmation } from "../monde/note-de-l-analyste";
import { ACTION, COURS_AFFICHE, EMETTEUR, HAUSSE_DES_TAUX, NOTATION_DE_L_EMETTEUR, OBLIGATION_VERTE, PLACEMENT_SANS_RISQUE, SCENARIOS, UN_AN_PLUS_TARD } from "../monde/marche-financier";
import { PRIME_DE_RISQUE_DU_MARCHE, TAUX_SANS_RISQUE } from "../monde/projets-et-financement";
import type { Enquete } from "./types";

/**
 * L'ENQUÊTE : LA NOTE DE L'ANALYSTE (comptabilité générale, palier 4 ; la suite du chapitre « Le marché
 * financier : cours, taux et risque » et de son cas, « L'obligation verte à 980 € »).
 *
 * Début janvier N+2, le président de NOVA envisage de placer une part de sa réserve en titres
 * d'Électro-Composants Lyon, son fournisseur coté. Un analyste junior de la banque lui a remis une note
 * de neuf affirmations sur l'obligation verte et l'action ; six sont fausses, chacune d'une façon. L'élève
 * dit de chaque affirmation si elle est juste, ou pourquoi elle est fausse, refait les chiffres justes,
 * puis répond au président. Tout se calcule dans le monde du cours (monde/note-de-l-analyste.ts, qui lit
 * monde/marche-financier.ts) ; les corrigés restent au serveur.
 *
 * LE MOTEUR EST CELUI DU BUREAU, SANS JOURNAL : une note ne s'écrit pas en écritures. Le tri et la
 * raison de l'erreur tiennent en un seul classement (juste, ou la nature de l'erreur), puis un tableau
 * refait les chiffres justes.
 */

const f = EXERCICE_DE_NOVA;
const n = noteDeLAnalyste();
const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number, chiffres = 2) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`.replace(/^-/, "−");
const nombre = (x: number, chiffres = 2) => (x + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−");
const JOUR = "6 janvier N+2";

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "La direction financière",
  date: JOUR,
  objet: "La note de la banque",
  paragraphes: [
    "Bonjour,",
    `J'envisage de placer une part de notre réserve en titres de ${EMETTEUR}, notre fournisseur. La banque m'a remis la note de son analyste.`,
    "Avant de m'y fier, vérifiez-la : ce qui est juste, ce qui est faux et pourquoi, et les bons chiffres. Puis dites-moi ce que vous en concluez.",
    "Merci. Le président",
  ],
};

const FICHE: PieceDuBureau = {
  code: "fiche",
  nature: "extrait",
  titre: `Les titres de ${EMETTEUR}`,
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: JOUR,
  objet: "Les données de marché",
  paragraphes: [
    `L'obligation verte : émise au pair le 1er janvier N+1, ${eur(OBLIGATION_VERTE.nominal)} de nominal, un coupon de ${pct(OBLIGATION_VERTE.tauxNominal)}, remboursée in fine au bout de ${OBLIGATION_VERTE.dureeRestante} ans. Émetteur noté ${NOTATION_DE_L_EMETTEUR}.`,
    `Au 1er janvier N+2, il reste ${UN_AN_PLUS_TARD.dureeRestante} ans ; les emprunteurs notés ${NOTATION_DE_L_EMETTEUR} paient ${pct(UN_AN_PLUS_TARD.tauxEnHausse)} sur le marché. L'obligation se négocie à ${eur(COURS_AFFICHE)}, coupon tout juste payé.`,
    `L'action : un dividende de ${eur(ACTION.dividende)} attendu dans un an, qui croît ensuite de ${pct(ACTION.croissance)} par an. Bêta de ${nombre(ACTION.beta)} ; taux sans risque de ${pct(TAUX_SANS_RISQUE)}, prime de risque du marché de ${pct(PRIME_DE_RISQUE_DU_MARCHE)}.`,
    `La rentabilité de l'action dans un an : ${SCENARIOS.map((s) => `${s.libelle.toLowerCase()} une fois sur ${nombre(1 / s.probabilite)}, ${pct(s.rentabilite)}`).join(" ; ")}.`,
  ],
  mention: `Le compte à terme de NOVA rapporte ${pct(PLACEMENT_SANS_RISQUE)}, sans risque.`,
};

const NOTE: PieceDuBureau = {
  code: "note",
  nature: "note",
  titre: "La note de l'analyste",
  de: "Un analyste de la banque",
  a: "Le président de NOVA",
  date: "5 janvier N+2",
  objet: `Placer en titres de ${EMETTEUR} ?`,
  paragraphes: n.affirmations.map((a, i) => `${i + 1}. ${a.texte}`),
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, FICHE, NOTE];

// ─────────────────────────────────────────────────────────────────────────────
// LE TRI, AVEC LA RAISON DE L'ERREUR
// ─────────────────────────────────────────────────────────────────────────────

/** Juste, ou la nature de l'erreur : six natures et deux leurres. Le plus long libellé est un leurre. */
const CATEGORIES = [
  { code: "juste", libelle: "Juste" },
  { code: "base", libelle: "Le coupon se calcule sur le cours" },
  { code: "taux", libelle: "Le cours ne suit pas le taux du marché" },
  { code: "rendement", libelle: "Le rendement courant n'est pas actuariel" },
  { code: "sens", libelle: "L'effet des taux est inversé" },
  { code: "racine", libelle: "La variance n'est pas l'écart-type" },
  { code: "diversification", libelle: "Le risque de marché ne se diversifie pas" },
  { code: "primaire", libelle: "Le marché n'est pas le bon" },
  { code: "notation", libelle: "La notation de l'émetteur interdit d'acheter ses titres quand on est une petite entreprise non cotée" },
] as const;

const numero = (code: CodeDeLAffirmation) => AFFIRMATIONS_DE_L_ANALYSTE.indexOf(code) + 1;

const POURQUOI: Readonly<Record<CodeDeLAffirmation, string>> = {
  emission: "Juste : une émission se souscrit sur le marché primaire ; les échanges qui suivent se font sur le marché secondaire.",
  coupon: `Faux : le coupon se calcule sur le nominal, ${eur(OBLIGATION_VERTE.nominal)} × ${pct(OBLIGATION_VERTE.tauxNominal)} = ${eur(n.coupon)}, quel que soit le cours.`,
  cours: `Faux : le cours actualise les flux au taux du marché, ${pct(UN_AN_PLUS_TARD.tauxEnHausse)} : ${eur(n.coursAuTauxDuMarche)}. Au taux nominal, il ne vaudrait le pair que si le marché n'avait pas bougé.`,
  rendement: `Faux : ${eur(n.coupon)} ÷ ${eur(COURS_AFFICHE)} est le rendement courant. Le rendement actuariel compte aussi le nominal rendu à ${eur(OBLIGATION_VERTE.nominal)} : ${pct(n.rendementActuariel)}.`,
  action: `Juste : ${eur(ACTION.dividende)} ÷ (${pct(n.exigee)} − ${pct(ACTION.croissance)}) = ${eur(n.coursDeLAction)}.`,
  hausse: `Faux : une exigence plus haute fait baisser le cours : ${eur(ACTION.dividende)} ÷ (${pct(n.exigee + HAUSSE_DES_TAUX)} − ${pct(ACTION.croissance)}) = ${eur(n.apresLaHausse)}.`,
  esperance: `Juste : ${n.risque.lignes.map((l) => `${nombre(l.probabilite)} × ${l.r < 0 ? `(${nombre(l.r)})` : nombre(l.r)}`).join(" + ")} = ${nombre(n.risque.esperance)} %.`,
  risque: `Faux : ${nombre(n.risque.variance)} est la variance, en points au carré. L'écart-type en est la racine : ${nombre(n.ecartType)} points.`,
  diversifier: "Faux : la diversification efface le risque propre à l'entreprise, pas le risque de marché, celui que mesure le bêta.",
};

// ─────────────────────────────────────────────────────────────────────────────
// LES CHIFFRES JUSTES
// ─────────────────────────────────────────────────────────────────────────────

const saisir = (valeur: number, calcul: string, indice: string, unite?: string, tolerance?: number) => ({ valeur, saisir: true, calcul, indice, ...(unite ? { unite } : {}), ...(tolerance ? { tolerance } : {}) });

/** Les chiffres justes de la note : un tableau à compléter, corrigé au serveur. */
export function grilleDesChiffresJustes(): TableauACompleter {
  return {
    titre: "Les chiffres justes de la note",
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Coupon annuel de l'obligation", cellules: [saisir(n.coupon, `${eur(OBLIGATION_VERTE.nominal)} × ${pct(OBLIGATION_VERTE.tauxNominal)} = ${eur(n.coupon)}`, "le taux nominal, sur le nominal")] },
      {
        libelle: `Cours de l'obligation au taux du marché, ${pct(UN_AN_PLUS_TARD.tauxEnHausse)}`,
        cellules: [saisir(n.coursAuTauxDuMarche, `${eur(n.coupon)} × (1 − ${nombre(1 + UN_AN_PLUS_TARD.tauxEnHausse)}^−${UN_AN_PLUS_TARD.dureeRestante}) ÷ ${nombre(UN_AN_PLUS_TARD.tauxEnHausse)} + ${eur(OBLIGATION_VERTE.nominal)} × ${nombre(1 + UN_AN_PLUS_TARD.tauxEnHausse)}^−${UN_AN_PLUS_TARD.dureeRestante} = ${eur(n.coursAuTauxDuMarche)}`, "les coupons et le nominal qui restent, actualisés au taux du marché", undefined, 1)],
      },
      {
        libelle: `Rendement actuariel à ${eur(COURS_AFFICHE)}, en %`,
        cellules: [saisir(n.rendementActuarielEnPourcent, `le taux qui égale ${eur(COURS_AFFICHE)} et les flux qui restent : ${pct(n.rendementActuariel)}`, "le taux qui fait valoir aux flux le cours payé", "%", 0.05)],
      },
      {
        libelle: "Cours de l'action après la hausse des taux",
        cellules: [saisir(n.apresLaHausse, `${eur(ACTION.dividende)} ÷ (${pct(n.exigee + HAUSSE_DES_TAUX)} − ${pct(ACTION.croissance)}) = ${eur(n.apresLaHausse)}`, "le dividende, sur l'exigence plus haute moins la croissance", undefined, 0.01)],
      },
      { libelle: "Écart-type de la rentabilité, en points", cellules: [saisir(n.ecartTypeArrondi, `√${nombre(n.risque.variance)} = ${nombre(n.ecartType)}`, "la racine de la variance", "points", 0.01)] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ENQUÊTE
// ─────────────────────────────────────────────────────────────────────────────

const justes = n.affirmations.filter((a) => a.nature === "juste").length;

export const LA_NOTE_DE_L_ANALYSTE: Enquete = {
  format: "enquete",
  code: "la-note-de-l-analyste",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-marche-financier"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Enquête : la note de l'analyste",
  accroche: `Le président veut placer en titres de ${EMETTEUR}, et la banque lui a remis une note. Vérifiez chaque affirmation, dites pourquoi les fausses le sont, refaites les bons chiffres, puis conseillez le président.`,
  objectifs: [
    "Contrôler une note sur une obligation et une action : le coupon, le cours, le rendement, le risque",
    "Nommer l'erreur : le coupon sur le cours, le taux nominal pour le taux du marché, le rendement courant, le sens, la variance, la diversification",
    "Refaire les chiffres justes et en tirer un conseil",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Le président pense placer une part de la réserve en titres de ${EMETTEUR}, et attend votre avis sur la note de la banque.`,
    "Sur votre poste : son courriel, la fiche des titres et la note de l'analyste. Certaines affirmations sont justes, d'autres non. Rien ne vous dit lesquelles.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-tri",
      type: "classement",
      titre: "Trier les affirmations",
      consigne: "Pour chaque affirmation de la note, comparée à la fiche des titres, dites si elle est juste ; sinon, choisissez ce qui la rend fausse.",
      pieces: ["fiche", "note"],
      categories: CATEGORIES,
      elements: n.affirmations.map((a) => ({ code: a.code, libelle: `${numero(a.code)}. ${a.texte}`, categorie: a.nature, pourquoi: POURQUOI[a.code] })),
      explication: [
        `${nombre(n.affirmations.length - justes)} affirmations sur ${nombre(n.affirmations.length)} sont fausses, chacune d'une façon. Une note de marché se contrôle comme une écriture : la base du calcul, le taux employé, le sens de l'effet.`,
      ],
    },
    {
      id: "les-chiffres",
      type: "etat",
      titre: "Refaire les chiffres justes",
      consigne: "Complétez les chiffres que la note donne faux : le coupon, le cours au taux du marché, le rendement actuariel, le cours de l'action après la hausse des taux, l'écart-type.",
      pieces: ["fiche"],
      grille: grilleDesChiffresJustes(),
      explication: [
        `L'obligation vaut ${eur(n.coursAuTauxDuMarche)} au taux du marché ; à ${eur(COURS_AFFICHE)}, elle rapporte ${pct(n.rendementActuariel)} jusqu'à l'échéance, plus que ses ${pct(n.rendementCourant)} de rendement courant.`,
        `L'action perd ${eur(n.coursDeLAction - n.apresLaHausse)} si les taux montent de ${nombre(HAUSSE_DES_TAUX * 100)} point ; sa rentabilité s'écarte de ${nombre(n.ecartType)} points en moyenne de ses ${nombre(n.risque.esperance)} % attendus.`,
      ],
    },
    {
      id: "le-conseil",
      type: "reponse",
      titre: "Conseiller le président",
      consigne: "Répondez au président, chiffres à l'appui.",
      pieces: ["courriel", "fiche"],
      questions: [
        {
          id: "l-obligation",
          question: `NOVA garderait l'obligation jusqu'à l'échéance. Achetée à ${eur(COURS_AFFICHE)}, que lui rapporterait-elle par an ?`,
          options: [
            { texte: `${pct(n.rendementActuariel)}, son rendement actuariel`, juste: true, retour: `Oui : les coupons et le nominal rendu, actualisés, égalent ${eur(COURS_AFFICHE)} à ${pct(n.rendementActuariel)}. C'est plus que les ${pct(PLACEMENT_SANS_RISQUE)} du compte à terme, pour un risque de défaut d'un émetteur noté ${NOTATION_DE_L_EMETTEUR}.` },
            { texte: `${pct(OBLIGATION_VERTE.tauxNominal)}, son taux nominal, puisqu'elle verse toujours le même coupon`, juste: false, retour: `Non : le coupon rapporte ${pct(OBLIGATION_VERTE.tauxNominal)} du nominal, mais NOVA paie moins que le nominal et le récupère à l'échéance.` },
            { texte: `${pct(n.rendementCourant)}, le coupon rapporté au cours`, juste: false, retour: "Non : c'est le rendement courant. Il oublie le nominal rendu à l'échéance, plus haut que le cours payé." },
          ],
        },
        {
          id: "l-action",
          question: "Et l'action, si les taux montaient encore ?",
          options: [
            { texte: `Son cours baisserait, vers ${eur(n.apresLaHausse)}`, juste: true, retour: `Oui : les actionnaires exigeraient ${pct(n.exigee + HAUSSE_DES_TAUX)} ; au même dividende, le cours baisse. Comme celui d'une obligation, quand les taux montent.` },
            { texte: "Son cours monterait, porté par des placements mieux rémunérés partout sur le marché", juste: false, retour: "Non : une exigence plus haute fait valoir moins les mêmes dividendes. Le cours baisse." },
            { texte: "Rien : le dividende ne change pas", juste: false, retour: "Non : le dividende ne change pas, mais il s'actualise à un taux plus haut. Le cours baisse." },
          ],
        },
        {
          id: "le-risque",
          question: "Le président veut placer une réserve dont il aura besoin. Que lui dites-vous du risque de l'action ?",
          options: [
            { texte: `Sa rentabilité peut tomber à ${nombre(n.risque.pire)} %`, juste: true, retour: `Oui : une année de récession, elle perd ${nombre(-n.risque.pire)} %. Son écart-type, ${nombre(n.ecartType)} points, dit que ses ${nombre(n.risque.esperance)} % ne sont qu'une moyenne. Une réserve dont on aura besoin va plutôt au compte à terme.` },
            { texte: "Aucun, si NOVA achète aussi d'autres actions pour diversifier son placement", juste: false, retour: "Non : la diversification efface le risque propre à l'entreprise, pas celui du marché." },
            { texte: `Le même que le compte à terme, puisqu'elle rapporte ${nombre(n.risque.esperance)} % en moyenne`, juste: false, retour: `Non : le compte à terme rapporte ${pct(PLACEMENT_SANS_RISQUE)} à coup sûr ; l'action, ${nombre(n.risque.esperance)} % en moyenne seulement, avec un écart-type de ${nombre(n.ecartType)} points.` },
          ],
        },
      ],
      explication: [
        `Votre conseil : l'obligation rapporte ${pct(n.rendementActuariel)} si NOVA la garde jusqu'au bout ; l'action expose la réserve aux taux et à la conjoncture. La note de l'analyste, elle, se trompait sur ${nombre(n.affirmations.length - justes)} affirmations.`,
      ],
    },
  ],
};
