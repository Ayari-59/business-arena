import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { CAPACITE_DE_REMBOURSEMENT_MAXIMALE, ENDETTEMENT_MAXIMAL } from "../financement";
import {
  APPORT_DE_LA_BUSINESS_ANGEL,
  BESOIN_EXTERNE,
  EMISSION_OBLIGATAIRE_MINIMALE,
  INTERETS_PLAFOND,
  PART_MINIMALE_DES_FONDATEURS,
  PREMIERE_ANNEE_PLAFOND,
  PRET_DE_BPIFRANCE,
  PRET_EN_COURS,
  TICKET_MINIMAL_DU_FONDS,
} from "../monde/acteurs-du-financement";
import { BPIFRANCE_AU_PLUS, COMPTE_COURANT_POSSIBLE, dossierDeFinancement } from "../monde/dossier-de-financement";
import { EMPRUNT_DE_LA_LIGNE } from "../monde/financement-de-la-gamme";
import { COMPTE_COURANT, PRET_PARTICIPATIF } from "../monde/financement-du-lycee";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LE DOSSIER DE FINANCEMENT (comptabilité générale, palier 4 ; la suite du chapitre « Les
 * acteurs et les modes de financement » et de son cas, « La banque demande une garantie »).
 *
 * En janvier N+1, le président a réuni les offres pour les 80 000 € qui manquent au plan de la gamme :
 * la banque, Bpifrance, une plateforme de prêt participatif, les fondateurs, une business angel, un
 * fonds et une banque d'affaires. Le courriel des fondateurs change la donne : ils ne bloqueront que
 * 30 000 € en compte courant. L'élève trie les offres, chiffre ce que chacune engagerait, puis propose
 * le montage qui tient les contraintes. Tous les chiffres se calculent dans le monde du cours
 * (monde/dossier-de-financement.ts, qui lit monde/acteurs-du-financement.ts) ; ce fichier écrit la pile,
 * les consignes et les corrigés, qui ne partent jamais au navigateur.
 *
 * UN CRAN PLUS LOIN QUE LE CHAPITRE : le montage du chapitre ne tient plus, et l'élève doit en trouver un
 * autre sans laboratoire, en chiffrant chaque offre ; deux offres sont hors de portée, une pièce n'est
 * pas une offre mais un engagement déjà pris.
 */

const f = EXERCICE_DE_NOVA;
const d = dossierDeFinancement();
const o = d.offres;
const m = d.montages;
const eur = (n: number) => montantEcrit(n + 0).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`.replace(/^-/, "−");
const ans = (n: number) => `${n} an${n >= 2 ? "s" : ""}`;
const nombre = (n: number) => n.toLocaleString("fr-FR");
const JOUR = "8 janvier N+1";

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "La direction financière",
  date: JOUR,
  objet: `Les ${eur(BESOIN_EXTERNE)} de la gamme`,
  paragraphes: [
    "Bonjour,",
    `Le plan de la gamme l'a dit : il nous manque ${eur(BESOIN_EXTERNE)} en N+1. J'ai réuni toutes les offres reçues.`,
    `Mes conditions : pas plus de ${eur(PREMIERE_ANNEE_PLAFOND)} de sorties la première année, pas plus de ${eur(INTERETS_PLAFOND)} d'intérêts sur toute la durée, et les fondateurs gardent au moins ${pct(PART_MINIMALE_DES_FONDATEURS, 0)} du capital.`,
    "Si un montage tient sans ouvrir le capital, je le préfère. Dites-moi lequel présenter aux associés.",
    "Merci. Le président",
  ],
};

const LETTRE_DE_LA_BANQUE: PieceDuBureau = {
  code: "banque",
  nature: "lettre",
  titre: "Offre de la banque de NOVA",
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Votre projet de gamme",
  paragraphes: [
    `Nous pouvons vous prêter jusqu'à ${eur(BESOIN_EXTERNE)}, au taux de ${pct(EMPRUNT_DE_LA_LIGNE.taux)} l'an, sur ${ans(EMPRUNT_DE_LA_LIGNE.dureeAns)}.`,
    "Le capital se rembourse en parts égales à la fin de chaque année, avec les intérêts sur le capital encore dû.",
  ],
};

const LETTRE_DE_BPIFRANCE: PieceDuBureau = {
  code: "bpifrance",
  nature: "lettre",
  titre: "Prêt de développement de Bpifrance",
  de: "Bpifrance",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Votre demande de prêt de développement",
  paragraphes: [
    `Nous pouvons prêter jusqu'à ${eur(BPIFRANCE_AU_PLUS)}, au taux de ${pct(PRET_DE_BPIFRANCE.taux)} l'an, sur ${ans(PRET_DE_BPIFRANCE.dureeAns)}, sans caution du dirigeant.`,
    `La première année, vous ne payez que les intérêts ; le capital se rembourse ensuite en ${nombre(PRET_DE_BPIFRANCE.dureeAns - PRET_DE_BPIFRANCE.differeAns)} parts égales.`,
    "Notre prêt accompagne celui d'une banque : il n'en dépasse jamais le montant.",
  ],
};

const LETTRE_DE_LA_PLATEFORME: PieceDuBureau = {
  code: "plateforme",
  nature: "lettre",
  titre: "Offre d'une plateforme de prêt participatif",
  de: "Une plateforme de prêt participatif",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Une collecte auprès des internautes",
  paragraphes: [
    `Nos prêteurs peuvent réunir ${eur(BESOIN_EXTERNE)}, au taux de ${pct(PRET_PARTICIPATIF.taux)} l'an, sur ${ans(PRET_PARTICIPATIF.dureeAns)}.`,
    "Les intérêts se paient chaque année ; le capital se rembourse en une fois, à la fin.",
  ],
};

const COURRIEL_DES_FONDATEURS: PieceDuBureau = {
  code: "fondateurs",
  nature: "courriel",
  titre: "Courriel des fondateurs",
  de: "Les fondateurs de NOVA",
  a: "Le président de NOVA",
  date: "6 janvier N+1",
  objet: "Notre compte courant",
  paragraphes: [
    `Nous avions parlé de ${eur(COMPTE_COURANT.plafond!)} en compte courant. Après réflexion, nous ne pourrons en bloquer que ${eur(COMPTE_COURANT_POSSIBLE)}.`,
    `Aux mêmes conditions : ${pct(COMPTE_COURANT.taux)} l'an, bloqués ${ans(COMPTE_COURANT.dureeAns)}, remboursés en une fois à la fin.`,
  ],
};

const COURRIEL_DE_LA_BUSINESS_ANGEL: PieceDuBureau = {
  code: "business-angel",
  nature: "courriel",
  titre: "Courriel d'une business angel",
  de: "Une business angel",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Entrer au capital de NOVA",
  paragraphes: [
    `Je suis prête à souscrire ${nombre(APPORT_DE_LA_BUSINESS_ANGEL.actions)} actions nouvelles à ${eur(APPORT_DE_LA_BUSINESS_ANGEL.prix)}, soit ${eur(APPORT_DE_LA_BUSINESS_ANGEL.montant)}.`,
    "Je ne demande aucun remboursement, mais une place à vos côtés dans les décisions.",
  ],
};

const LETTRE_DU_FONDS: PieceDuBureau = {
  code: "fonds",
  nature: "lettre",
  titre: "Réponse d'un fonds de capital développement",
  de: "Un fonds de capital développement",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Votre demande d'entrée au capital",
  paragraphes: [
    `Votre projet nous intéresse, mais nous n'étudions pas de dossier sous ${eur(TICKET_MINIMAL_DU_FONDS)}.`,
    "Nous serons heureux de vous revoir quand vos besoins auront grandi.",
  ],
};

const LETTRE_DE_LA_BANQUE_D_AFFAIRES: PieceDuBureau = {
  code: "obligations",
  nature: "lettre",
  titre: "Courrier d'une banque d'affaires",
  de: "Une banque d'affaires",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Une émission d'obligations",
  paragraphes: [
    `Nous plaçons des emprunts obligataires auprès des investisseurs, à partir de ${eur(EMISSION_OBLIGATAIRE_MINIMALE)}.`,
    "Une notation de votre société serait nécessaire avant toute émission.",
  ],
};

const ENGAGEMENTS_EN_COURS: PieceDuBureau = {
  code: "en-cours",
  nature: "extrait",
  titre: "Les engagements de NOVA au 31 décembre N",
  de: "La comptabilité de NOVA",
  a: "Le président de NOVA",
  date: "31 décembre N",
  paragraphes: [
    `L'emprunt de création : ${eur(PRET_EN_COURS.capital)} empruntés à ${pct(PRET_EN_COURS.tauxAnnuel)}, ${nombre(d.enCours.echeancesAVenir)} échéances trimestrielles encore à payer.`,
    "Le bail du local : le loyer de l'année qui vient, que le bilan ne montre pas.",
  ],
  montants: [
    { libelle: "Capital restant dû", montant: d.enCours.capitalRestantDu },
    { libelle: "Intérêts à venir", montant: d.enCours.interetsAVenir },
    { libelle: "Loyers de l'année à venir", montant: d.enCours.loyers },
    { libelle: "Engagements en cours", montant: d.enCours.total, fort: true },
  ],
};

const PILE: readonly PieceDuBureau[] = [
  COURRIEL,
  LETTRE_DE_LA_BANQUE,
  LETTRE_DE_BPIFRANCE,
  LETTRE_DE_LA_PLATEFORME,
  COURRIEL_DES_FONDATEURS,
  COURRIEL_DE_LA_BUSINESS_ANGEL,
  LETTRE_DU_FONDS,
  LETTRE_DE_LA_BANQUE_D_AFFAIRES,
  ENGAGEMENTS_EN_COURS,
];

// ─────────────────────────────────────────────────────────────────────────────
// CE QUE CHAQUE OFFRE ENGAGERAIT
// ─────────────────────────────────────────────────────────────────────────────

const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });
const somme = (xs: readonly number[]) => xs.map(eur).join(" + ");

/** Ce que chaque offre engagerait : les intérêts de toute la durée, et les sorties de la première année. */
export function grilleDesOffres(): TableauACompleter {
  const premiere = (e: typeof o.banque) => e.tableau[0]!;
  return {
    titre: "Ce que chaque offre engagerait",
    colonnes: ["Intérêts de toute la durée", "Sorties de la première année"],
    lignes: [
      {
        libelle: `La banque, ${eur(BESOIN_EXTERNE)}`,
        cellules: [
          saisir(o.banque.interets, `${somme(o.banque.tableau.map((a) => a.interets))} = ${eur(o.banque.interets)}`, "les intérêts sur le capital encore dû, année par année"),
          saisir(o.banque.premiereAnnee, `${eur(premiere(o.banque).capital)} + ${eur(premiere(o.banque).interets)} = ${eur(o.banque.premiereAnnee)}`, "une part du capital et les intérêts de l'année"),
        ],
      },
      {
        libelle: `Bpifrance, ${eur(BPIFRANCE_AU_PLUS)}`,
        cellules: [
          saisir(o.bpifrance.interets, `${somme(o.bpifrance.tableau.map((a) => a.interets))} = ${eur(o.bpifrance.interets)}`, "les intérêts pleins pendant le différé, puis sur ce qui reste dû"),
          saisir(o.bpifrance.premiereAnnee, `${eur(BPIFRANCE_AU_PLUS)} × ${pct(PRET_DE_BPIFRANCE.taux)} = ${eur(o.bpifrance.premiereAnnee)}, sans capital`, "les intérêts seuls, pendant le différé"),
        ],
      },
      {
        libelle: `La plateforme, ${eur(BESOIN_EXTERNE)}`,
        cellules: [
          saisir(o.plateforme.interets, `${eur(BESOIN_EXTERNE)} × ${pct(PRET_PARTICIPATIF.taux)} × ${PRET_PARTICIPATIF.dureeAns} = ${eur(o.plateforme.interets)}`, "les intérêts sur tout le capital, chaque année"),
          saisir(o.plateforme.premiereAnnee, `${eur(BESOIN_EXTERNE)} × ${pct(PRET_PARTICIPATIF.taux)} = ${eur(o.plateforme.premiereAnnee)}`, "les intérêts seuls : le capital attend la fin"),
        ],
      },
      {
        libelle: `Le compte courant, ${eur(COMPTE_COURANT_POSSIBLE)}`,
        cellules: [
          saisir(o.compteCourant.interets, `${eur(COMPTE_COURANT_POSSIBLE)} × ${pct(COMPTE_COURANT.taux)} × ${COMPTE_COURANT.dureeAns} = ${eur(o.compteCourant.interets)}`, "les intérêts sur tout le capital, chaque année"),
          saisir(o.compteCourant.premiereAnnee, `${eur(COMPTE_COURANT_POSSIBLE)} × ${pct(COMPTE_COURANT.taux)} = ${eur(o.compteCourant.premiereAnnee)}`, "les intérêts seuls : le capital attend la fin"),
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

/** Un montage écrit : « 30 000 € en compte courant, 10 000 € de Bpifrance, 40 000 € à la banque ». */
function montageEcrit(x: (typeof m)[keyof typeof m]) {
  const parts = [
    x.capital ? `${eur(x.capital)} de la business angel` : "",
    x.compteCourant ? `${eur(x.compteCourant)} en compte courant` : "",
    x.bpifrance ? `${eur(x.bpifrance)} de Bpifrance` : "",
    x.banque ? `${eur(x.banque)} à la banque` : "",
  ].filter(Boolean);
  return parts.join(", ");
}

const bon = m.avecBpifrance;
const capitalCede = pct(1 - m.avecLaBusinessAngel.partDesFondateurs, 0);

export const LE_DOSSIER_DE_FINANCEMENT: Bureau = {
  code: "le-dossier-de-financement",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["les-acteurs-et-les-modes-de-financement"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Au bureau : le dossier de financement",
  accroche: `Il manque ${eur(BESOIN_EXTERNE)} à la gamme, et les offres s'empilent. Triez-les, chiffrez ce que chacune engagerait, puis proposez au président le montage qui tient.`,
  objectifs: [
    "Reconnaître dans un dossier ce qui est une offre de prêt, un apport au capital, une offre hors de portée, un engagement déjà pris",
    "Valoriser ce que chaque offre engagerait : les intérêts de toute la durée, les sorties de la première année",
    "Composer un montage qui tient les contraintes du dirigeant et des banques, quand celui qu'on attendait ne tient plus",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Le plan de la gamme a conclu qu'il manque ${eur(BESOIN_EXTERNE)} en N+1 ; le président a réuni les réponses.`,
    "Sur votre poste, le dossier : son courriel dessus, puis les offres et les engagements de NOVA. Lisez tout : la dernière nouvelle change le montage qu'on attendait.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-tri",
      type: "classement",
      titre: "Trier le dossier",
      consigne: "Ouvrez chaque pièce et dites ce qu'elle est pour les 80 000 € de la gamme : un prêt possible, un apport au capital possible, une offre hors de portée, ou un engagement déjà pris.",
      pieces: ["courriel"],
      categories: [
        { code: "pret", libelle: "Un prêt possible" },
        { code: "capital", libelle: "Un apport au capital" },
        { code: "hors-de-portee", libelle: "Hors de portée" },
        { code: "deja-pris", libelle: "Un engagement déjà pris" },
      ],
      elements: [
        { code: "banque", piece: "banque", libelle: LETTRE_DE_LA_BANQUE.titre, categorie: "pret", pourquoi: "La banque, intermédiaire financier, prête et sera remboursée avant les associés." },
        { code: "bpifrance", piece: "bpifrance", libelle: LETTRE_DE_BPIFRANCE.titre, categorie: "pret", pourquoi: "La banque publique prête, aux côtés d'une banque et jamais plus qu'elle." },
        { code: "plateforme", piece: "plateforme", libelle: LETTRE_DE_LA_PLATEFORME.titre, categorie: "pret", pourquoi: "Les internautes prêtent par la plateforme, sans devenir associés : c'est une dette." },
        { code: "fondateurs", piece: "fondateurs", libelle: COURRIEL_DES_FONDATEURS.titre, categorie: "pret", pourquoi: `Les fondateurs prêtent leur épargne en compte courant : une dette envers les associés, de ${eur(COMPTE_COURANT_POSSIBLE)} au plus désormais.` },
        { code: "business-angel", piece: "business-angel", libelle: COURRIEL_DE_LA_BUSINESS_ANGEL.titre, categorie: "capital", pourquoi: "Elle souscrit des actions nouvelles : rien à rembourser, mais une part du capital et des voix." },
        { code: "fonds", piece: "fonds", libelle: LETTRE_DU_FONDS.titre, categorie: "hors-de-portee", pourquoi: `Un ticket d'au moins ${eur(TICKET_MINIMAL_DU_FONDS)}, pour un besoin de ${eur(BESOIN_EXTERNE)} : il ne viendra pas.` },
        { code: "obligations", piece: "obligations", libelle: LETTRE_DE_LA_BANQUE_D_AFFAIRES.titre, categorie: "hors-de-portee", pourquoi: `Une émission se compte à partir de ${eur(EMISSION_OBLIGATAIRE_MINIMALE)}, et demande une notation : hors de portée de NOVA.` },
        { code: "en-cours", piece: "en-cours", libelle: ENGAGEMENTS_EN_COURS.titre, categorie: "deja-pris", pourquoi: `Ce n'est pas une offre : NOVA doit déjà ${eur(d.enCours.total)}, et la banque le lira avant de prêter encore.` },
      ],
      explication: [
        "Des offres de prêt, un apport au capital, des offres hors de portée, et ce que NOVA doit déjà. Le courriel des fondateurs change la donne : ils ne prêteront pas les 40 000 € qu'on attendait.",
      ],
    },
    {
      id: "les-offres",
      type: "etat",
      titre: "Chiffrer les offres",
      consigne: "Pour chaque offre de prêt, à son montant le plus haut, calculez ce que NOVA s'engagerait à payer en intérêts sur toute la durée, et ce qui sortirait de sa trésorerie la première année.",
      pieces: ["banque", "bpifrance", "plateforme", "fondateurs"],
      grille: grilleDesOffres(),
      explication: [
        `La banque seule prendrait ${eur(o.banque.premiereAnnee)} la première année, au-delà des ${eur(PREMIERE_ANNEE_PLAFOND)} du président. La plateforme soulage la première année, mais engage ${eur(o.plateforme.interets)} d'intérêts.`,
        "Bpifrance et le compte courant ne prennent que des intérêts la première année : ce sont eux qui allègent le lancement.",
      ],
    },
    {
      id: "le-montage",
      type: "reponse",
      titre: "Proposer le montage",
      consigne: "Répondez au président, chiffres à l'appui.",
      pieces: ["courriel", "fondateurs", "en-cours"],
      questions: [
        {
          id: "le-montage",
          question: `Quel montage des ${eur(BESOIN_EXTERNE)} présentez-vous aux associés ?`,
          options: [
            {
              texte: montageEcrit(bon),
              juste: true,
              retour: `Oui : ${eur(bon.premiereAnnee)} la première année, ${eur(bon.interets)} d'intérêts, et les fondateurs gardent tout le capital. Bpifrance ne dépasse pas la banque.`,
            },
            {
              texte: montageEcrit(m.compteCourantEtBanque),
              juste: false,
              retour: `Non : la banque prendrait plus, et la première année monterait à ${eur(m.compteCourantEtBanque.premiereAnnee)}, au-delà des ${eur(PREMIERE_ANNEE_PLAFOND)}.`,
            },
            {
              texte: montageEcrit(m.avecPlusDeBpifrance),
              juste: false,
              retour: `Non : la première année tient, ${eur(m.avecPlusDeBpifrance.premiereAnnee)}, mais les intérêts montent à ${eur(m.avecPlusDeBpifrance.interets)}, au-delà des ${eur(INTERETS_PLAFOND)}. Le différé se paie.`,
            },
            {
              texte: `${montageEcrit(m.avecLaBusinessAngel)}, sans intérêts de plus à payer chaque année`,
              juste: false,
              retour: `Il tient les conditions, mais cède ${capitalCede} du capital, quand un montage sans ouvrir le capital tient aussi. Le président le préfère : c'est une solution de rechange.`,
            },
          ],
        },
        {
          id: "la-banque",
          question: "Ce montage, la banque l'accepte-t-elle ?",
          options: [
            {
              texte: "Oui : ses deux ratios restent sous leurs plafonds",
              juste: true,
              retour: `Oui : les dettes financières font ${pct(bon.endettement, 0)} des capitaux propres, sous ${pct(ENDETTEMENT_MAXIMAL, 0)}, et ${nombre(Math.round(bon.capaciteDeRemboursement * 100) / 100)} années de CAF, sous ${CAPACITE_DE_REMBOURSEMENT_MAXIMALE}. Le compte courant y compte en dette.`,
            },
            {
              texte: "Non : le compte courant des fondateurs compte pour des capitaux propres, et la banque refuse qu'on le prête",
              juste: false,
              retour: "Non : un compte courant est une dette envers les associés, et la banque le lit comme tel. Bloqué, il la rassure presque comme du capital.",
            },
            {
              texte: `On ne peut pas le savoir sans les ${eur(d.enCours.total)} d'engagements en cours`,
              juste: false,
              retour: `Ils sont dans le dossier : le capital restant dû, ${eur(d.enCours.capitalRestantDu)}, entre dans les dettes financières que la banque compare aux capitaux propres et à la CAF.`,
            },
          ],
        },
        {
          id: "le-risque",
          question: "Si la gamme échouait, qui serait payé en dernier ?",
          options: [
            { texte: "Les associés, et leur capital", juste: true, retour: "Oui : les associés ne sont payés qu'après tous les créanciers. Le compte courant, lui, est une dette : il passe avant le capital." },
            { texte: "Bpifrance, parce qu'elle prête sans caution du dirigeant", juste: false, retour: "Non : sans caution, Bpifrance prend un risque de plus, mais reste un créancier, payé avant les associés." },
            { texte: `Les fondateurs, pour leur compte courant, bloqué ${ans(COMPTE_COURANT.dureeAns)} et remboursé en une seule fois`, juste: false, retour: "Non : bloqué ou non, le compte courant est un prêt. Les fondateurs y sont créanciers, avant leur propre capital." },
          ],
        },
      ],
      explication: [
        `Votre proposition : ${montageEcrit(bon)}. Elle tient la première année, ${eur(bon.premiereAnnee)}, et les intérêts, ${eur(bon.interets)}, sans ouvrir le capital.`,
        "Un montage se refait quand une ressource se dérobe : chaque source se chiffre en intérêts et en trésorerie de la première année, puis on combine.",
      ],
    },
  ],
};
