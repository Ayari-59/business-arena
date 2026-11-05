import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  ANNUAIRE_RESILIE,
  CHEQUES,
  CHEQUE_DE_L_ATELIER,
  JOUR_DE_L_ENTRETIEN,
  JOUR_DU_BUREAU,
  JOUR_DU_CHEQUE_DE_FEVRIER,
  JOUR_DU_COMITE,
  PUBLICITE_DE_MARS,
  SOLDE_DE_L_EPARGNE,
  compteDeMars,
  montantsDeMars,
  operationsDeMars,
  rapprochementDeMars,
  releveDeMars,
  type PointDuMois,
} from "../monde/bureau-de-la-boutique";
import { dateEcrite } from "../monde/comptes-de-la-boutique";
import { CONDITIONS_DE_LA_BANQUE } from "../monde/fournisseurs-et-banque-de-la-boutique";
import { MAILLE_ET_CO } from "../monde/maille-et-co";
import type { Bureau, LigneDeDocument, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LE RAPPROCHEMENT DE MARS (comptabilité générale, palier 4 ; BTS CG P1, 1.6.3).
 *
 * La suite du chapitre « Fournisseurs et banque » et de son cas, « Le chèque qui n'est pas passé » : le
 * mois de mars de MAILLE & CO, au bureau. Tous les chiffres se calculent dans le monde du cours
 * (monde/bureau-de-la-boutique.ts) ; ce fichier écrit la pile, les consignes et les corrigés, qui ne
 * partent jamais au navigateur (pedagogy/cours/bureau-servi.ts, app/cours/bureau/actions.ts).
 *
 * LE DÉROULÉ, EN GESTES DE BUREAU : classer la pile ; pointer le relevé face au compte 512 ; dresser l'état
 * de rapprochement ; passer les écritures ; répondre à la gérante.
 */

const f = MAILLE_ET_CO;
const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const mars = (jour: number) => `${dateEcrite({ jour, mois: 3 })} N`;
const m = montantsDeMars(f);
const r = rapprochementDeMars(f);
const releve = releveDeMars(f);
const compte = compteDeMars(f);

/** Les libellés de la banque, qui ne sont pas ceux de la boutique : le relevé parle sa propre langue. */
const LIBELLES_DE_LA_BANQUE: Readonly<Record<string, string>> = {
  faconnier: "Virement émis, façonnier de référence",
  loyer: "Virement permanent, loyer",
  "cheque-fevrier": `Chèque n° ${CHEQUES.entretienDeFevrier}`,
  atelier: `Chèque n° ${CHEQUES.atelierLocal}`,
  comite: "Virement reçu, comité d'entreprise, règlement de facture",
  annuaire: "Prélèvement SEPA, annuaire professionnel en ligne",
  tva: "Prélèvement, impôts, TVA",
  publicite: "Prélèvement SEPA, régie publicitaire",
  salaires: "Virements de salaires",
  frais: "Frais de tenue de compte, TVA comprise",
};
const libelleDeLaBanque = (code: string) => LIBELLES_DE_LA_BANQUE[code] ?? "Remise de cartes bancaires";

const lignes = (cote: typeof releve, banque: boolean): LigneDeDocument[] =>
  cote.lignes.map((l) => ({ date: l.date, libelle: banque ? libelleDeLaBanque(l.code) : l.libelle, montant: l.montant }));

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel de la gérante",
  de: "La gérante de MAILLE & CO",
  a: "Le service comptable",
  date: `${dateEcrite(JOUR_DU_BUREAU)} N`,
  objet: "Le relevé de mars",
  paragraphes: [
    "Bonjour,",
    `Le relevé de mars est arrivé : la banque nous donne ${eur(r.releve)} au 31 mars, notre compte ${eur(r.compte)}. Je n'aime pas quand les deux ne disent pas la même chose.`,
    "Pouvez-vous rapprocher le mois ? J'ai besoin de trois choses : le vrai solde du compte au 31 mars, pour le tableau de bord ; les chèques qui attendent encore d'être débités ; ce que nous faisons du prélèvement de l'annuaire, que je croyais résilié.",
    `Pour mémoire, le chèque n° ${CHEQUES.entretienDeFevrier} de l'entretien de février était encore en suspens à l'état de février.`,
    "Merci. La gérante",
  ],
};

const RELEVE: PieceDuBureau = {
  code: "releve",
  nature: "releve",
  titre: "Relevé du compte courant, mars",
  de: "La banque de la boutique, agence du centre-ville",
  a: "MAILLE & CO, SARL",
  date: mars(31),
  lignes: lignes(releve, true),
  montants: [
    { libelle: "Solde créditeur au 28 février N", montant: releve.depart },
    { libelle: "Solde créditeur au 31 mars N", montant: releve.fin, fort: true },
  ],
  mention: "Débit : ce qui sort du compte ; crédit : ce qui y entre, vu de la banque.",
};

const EXTRAIT: PieceDuBureau = {
  code: "extrait",
  nature: "extrait",
  titre: "Extrait du compte 512 Banque, mars",
  de: "La comptabilité de MAILLE & CO",
  a: "Le service comptable",
  date: mars(31),
  lignes: lignes(compte, false),
  montants: [
    { libelle: "Solde débiteur au 1er mars N", montant: compte.depart },
    { libelle: "Solde débiteur au 31 mars N", montant: compte.fin, fort: true },
  ],
  mention: `Solde du 1er mars après les écritures du rapprochement de février. En suspens à l'état de février : le chèque n° ${CHEQUES.entretienDeFevrier}, ${eur(m.chequeDeFevrier)}.`,
};

const TALON_DE_L_ATELIER: PieceDuBureau = {
  code: "talon-atelier",
  nature: "talon",
  titre: `Talon du chèque n° ${CHEQUES.atelierLocal}`,
  de: "MAILLE & CO",
  a: "Atelier de tricotage local",
  date: mars(CHEQUE_DE_L_ATELIER.jourDEmission),
  objet: `Chèque n° ${CHEQUES.atelierLocal}`,
  paragraphes: [`Facture du ${dateEcrite(m.factureDeLAtelier.date)}, ${m.factureDeLAtelier.libelle}, échéance du ${dateEcrite(m.factureDeLAtelier.echeance)}.`],
  montants: [{ libelle: "Montant du chèque", montant: m.atelier, fort: true }],
};

const TALON_DE_L_ENTRETIEN: PieceDuBureau = {
  code: "talon-entretien",
  nature: "talon",
  titre: `Talon du chèque n° ${CHEQUES.entretienDeMars}`,
  de: "MAILLE & CO",
  a: "L'entreprise d'entretien",
  date: mars(JOUR_DE_L_ENTRETIEN),
  objet: `Chèque n° ${CHEQUES.entretienDeMars}`,
  paragraphes: ["L'entretien de mars, facture du mois."],
  montants: [{ libelle: "Montant du chèque", montant: m.entretien, fort: true }],
};

const AVIS_DE_LA_REGIE: PieceDuBureau = {
  code: "avis-regie",
  nature: "avis",
  titre: "Avis de prélèvement de la régie publicitaire",
  de: "La régie publicitaire",
  a: "MAILLE & CO",
  date: mars(PUBLICITE_DE_MARS.avisRecuLe),
  objet: "Avis de prélèvement SEPA",
  paragraphes: [`Nous prélèverons le ${dateEcrite({ jour: PUBLICITE_DE_MARS.jour, mois: 3 })}, sur votre compte, la publicité de mars.`],
  montants: [
    { libelle: "Publicité de mars, hors taxes", montant: m.publicite.ht },
    { libelle: "TVA", montant: m.publicite.tva },
    { libelle: "Montant prélevé", montant: m.publicite.ttc, fort: true },
  ],
};

const LETTRE_DE_RESILIATION: PieceDuBureau = {
  code: "lettre",
  nature: "lettre",
  titre: "Lettre de résiliation de l'annuaire",
  de: "La gérante de MAILLE & CO",
  a: "L'annuaire professionnel en ligne, service des abonnements",
  date: `${dateEcrite(ANNUAIRE_RESILIE.resiliation)} N`,
  objet: "Résiliation de l'abonnement et révocation du mandat de prélèvement",
  paragraphes: [
    "Madame, Monsieur,",
    `Je résilie l'abonnement de MAILLE & CO à votre annuaire, ${eur(ANNUAIRE_RESILIE.abonnement)} par mois, à compter du ${dateEcrite(ANNUAIRE_RESILIE.effet)} N, et je révoque le mandat de prélèvement qui s'y rattache. Copie de cette lettre est adressée à notre banque.`,
    "La gérante",
  ],
  mention: `Lettre recommandée avec avis de réception, reçue le ${dateEcrite(ANNUAIRE_RESILIE.recueLe)} N.`,
};

const EPARGNE: PieceDuBureau = {
  code: "epargne",
  nature: "releve",
  titre: "Relevé du compte d'épargne, mars",
  de: "La banque de la boutique, agence du centre-ville",
  a: "MAILLE & CO, SARL",
  date: mars(31),
  paragraphes: ["Aucune opération sur la période."],
  montants: [
    { libelle: "Solde au 28 février N", montant: SOLDE_DE_L_EPARGNE },
    { libelle: "Solde au 31 mars N", montant: SOLDE_DE_L_EPARGNE, fort: true },
  ],
};

/** La pile, telle qu'elle est posée sur le bureau : le courriel dessus, le reste dans l'ordre d'arrivée. */
const PILE: readonly PieceDuBureau[] = [COURRIEL, LETTRE_DE_RESILIATION, TALON_DE_L_ATELIER, AVIS_DE_LA_REGIE, TALON_DE_L_ENTRETIEN, EPARGNE, RELEVE, EXTRAIT];

// ─────────────────────────────────────────────────────────────────────────────
// LE POINTAGE ET L'ÉTAT
// ─────────────────────────────────────────────────────────────────────────────

/** Les trois façons dont une ligne se pointe. */
const POINTAGE = [
  { code: "pointee", libelle: "Pointée" },
  { code: "ecart", libelle: "Montant différent" },
  { code: "seule", libelle: "D'un seul côté" },
] as const;

const categorieDuPoint = (p: PointDuMois) => (p === "pointee" || p === "fevrier" ? "pointee" : p === "ecart" ? "ecart" : "seule");

/** Pourquoi une ligne se pointe ainsi, selon le côté où on la lit. */
function pourquoiDuPoint(code: string, p: PointDuMois, ici: "releve" | "compte"): string {
  if (p === "pointee") return "Elle est au relevé et au compte, à la même date ou presque, pour le même montant.";
  if (p === "fevrier") return "Le compte de mars ne l'a pas, mais l'état de février l'avait en suspens : elle se pointe avec lui, et sort des suspens.";
  if (p === "ecart") return `Le talon dit ${eur(m.atelier)}, la banque a débité ${eur(m.atelier)}, le compte a pris ${eur(m.atelierSaisi)} : deux chiffres inversés à la saisie.`;
  if (ici === "compte") return "La banque ne l'a pas encore : le chèque n'a pas été remis. Il reste en suspens, sans écriture.";
  if (code === "annuaire") return "Le compte ne l'a pas, et ne doit pas l'avoir : l'abonnement est résilié, le mandat révoqué.";
  return "Le compte ne l'a pas : seule la banque la connaît pour l'instant.";
}

function elementsDuPointage() {
  return operationsDeMars(f).flatMap((o) => [
    ...(o.releve
      ? [{ code: `r-${o.code}`, libelle: `Relevé · ${dateEcrite({ jour: o.releve.jour, mois: 3 })} · ${libelleDeLaBanque(o.code)}`, montant: o.releve.montant, categorie: categorieDuPoint(o.point), pourquoi: pourquoiDuPoint(o.code, o.point, "releve") }]
      : []),
    ...(o.compte
      ? [{ code: `c-${o.code}`, libelle: `Compte 512 · ${dateEcrite({ jour: o.compte.jour, mois: 3 })} · ${o.libelle}`, montant: o.compte.montant, categorie: categorieDuPoint(o.point), pourquoi: pourquoiDuPoint(o.code, o.point, "compte") }]
      : []),
  ]);
}

const COMPTE = "Compte 512";
const BANQUE = "Relevé";

/** L'état de rapprochement à compléter : la présentation de l'examen, une ligne par nature, zéros compris. */
export function grilleDeLEtat(): TableauACompleter {
  const vide = { valeur: null };
  const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });
  return {
    titre: "État de rapprochement au 31 mars N",
    colonnes: [COMPTE, BANQUE],
    lignes: [
      { libelle: "Solde au 31 mars", cellules: [{ valeur: r.compte }, { valeur: r.releve }] },
      { libelle: "Virements reçus connus de la seule banque", cellules: [saisir(r.auCompte.virements, `le virement du comité, ${eur(m.comite)}, s'ajoute au compte`, "le virement que le compte n'a pas"), vide] },
      { libelle: "Prélèvements connus de la seule banque", cellules: [saisir(r.auCompte.prelevements, `le prélèvement de la régie, ${eur(m.publicite.ttc)}, se retranche ; celui de l'annuaire n'est pas dû`, "le prélèvement dû que le compte n'a pas, en négatif"), vide] },
      { libelle: "Frais bancaires", cellules: [saisir(r.auCompte.frais, `la tenue de compte et sa TVA, ${eur(m.frais.ttc)}, se retranchent`, "les frais de l'arrêté, en négatif"), vide] },
      { libelle: "Erreur de saisie de la boutique", cellules: [saisir(r.auCompte.erreur, `${eur(m.atelier)} − ${eur(m.atelierSaisi)} = ${eur(r.erreur)} de trop au compte : ils se retranchent`, "l'écart entre le talon et le compte"), vide] },
      { libelle: "Remises connues de la seule boutique", cellules: [vide, saisir(r.aLaBanque.remises, "aucune remise n'attend d'être créditée : zéro", "les remises au compte que le relevé n'a pas")] },
      { libelle: "Chèques émis non encore débités", cellules: [vide, saisir(r.aLaBanque.cheques, `le chèque n° ${CHEQUES.entretienDeMars}, ${eur(m.entretien)}, se retranche du relevé`, "les chèques au compte que le relevé n'a pas, en négatif")] },
      { libelle: "Prélèvement contesté, à rembourser par la banque", cellules: [vide, saisir(r.aLaBanque.contestes, `le prélèvement de l'annuaire, ${eur(m.annuaire)}, revient au relevé`, "le prélèvement non autorisé, que la banque doit rendre")] },
      {
        libelle: "Solde rectifié",
        fort: true,
        totalDe: { plus: [0, 1, 2, 3, 4, 5, 6, 7] },
        cellules: [
          saisir(r.compteRectifie, `${eur(r.compte)} + ${eur(m.comite)} − ${eur(m.publicite.ttc)} − ${eur(m.frais.ttc)} − ${eur(r.erreur)} = ${eur(r.compteRectifie)}`, "le solde, plus et moins les lignes de la colonne"),
          saisir(r.releveRectifie, `${eur(r.releve)} − ${eur(m.entretien)} + ${eur(m.annuaire)} = ${eur(r.releveRectifie)}`, "le solde, plus et moins les lignes de la colonne"),
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

export const RAPPROCHEMENT_DE_MARS: Bureau = {
  code: "rapprochement-de-mars",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["fournisseurs-et-banque"],
  commanditaire: "La gérante",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Au bureau : le rapprochement de mars",
  accroche: "Début avril, la pile de mars attend sur votre poste. Ouvrez chaque pièce, contrôlez, rapprochez le relevé du compte, régularisez, puis répondez à la gérante.",
  objectifs: [
    "Trier les pièces d'un mois : ce qui se pointe, ce qui se saisit, ce qui se signale",
    "Pointer un relevé bancaire face au compte 512 et y trouver une erreur de saisie",
    "Dresser un état de rapprochement aux deux soldes égaux, et passer ses écritures",
    "Signaler une anomalie au lieu de la saisir, et rendre un solde juste",
  ],
  libre: false,
  accueil: [
    `Le ${dateEcrite(JOUR_DU_BUREAU)} N, au bureau de MAILLE & CO. Le rapprochement de février est fait ; celui de mars vous attend.`,
    "Sur votre poste, la pile de mars : le courriel de la gérante dessus, puis les pièces du mois. Ouvrez-les une à une. Rien ne vous dit ce qu'il faut en faire : c'est votre travail de le voir.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "la-pile",
      type: "classement",
      titre: "Classer la pile",
      consigne: "Ouvrez chaque pièce et dites ce qu'elle demande : la pointer, la saisir, la signaler, ou rien du tout ce mois-ci.",
      pieces: ["courriel"],
      categories: [
        { code: "a-pointer", libelle: "À pointer" },
        { code: "a-saisir", libelle: "À saisir" },
        { code: "a-signaler", libelle: "À signaler" },
        { code: "rien", libelle: "Rien à faire" },
      ],
      elements: [
        { code: "releve", piece: "releve", libelle: RELEVE.titre, categorie: "a-pointer", pourquoi: "Le relevé se pointe ligne à ligne face au compte 512 : c'est le cœur du rapprochement." },
        { code: "extrait", piece: "extrait", libelle: EXTRAIT.titre, categorie: "a-pointer", pourquoi: "L'extrait est l'autre moitié du pointage : ce que la boutique a enregistré." },
        {
          code: "talon-atelier",
          piece: "talon-atelier",
          libelle: TALON_DE_L_ATELIER.titre,
          categorie: "a-saisir",
          pourquoi: `Le talon dit ${eur(m.atelier)}, le compte ${eur(m.atelierSaisi)} : une écriture de correction est à passer.`,
        },
        {
          code: "avis-regie",
          piece: "avis-regie",
          libelle: AVIS_DE_LA_REGIE.titre,
          categorie: "a-saisir",
          pourquoi: `Arrivé le ${dateEcrite({ jour: PUBLICITE_DE_MARS.avisRecuLe, mois: 3 })}, resté dans la pile : aucune écriture du compte n'y renvoie. Le prélèvement est dû, il se saisit.`,
        },
        {
          code: "talon-entretien",
          piece: "talon-entretien",
          libelle: TALON_DE_L_ENTRETIEN.titre,
          categorie: "a-pointer",
          pourquoi: "Le chèque est au compte ; il se pointe, et s'il n'est pas au relevé il reste en suspens. Il n'y a rien à saisir.",
        },
        {
          code: "lettre",
          piece: "lettre",
          libelle: LETTRE_DE_RESILIATION.titre,
          categorie: "a-signaler",
          pourquoi: "L'annuaire n'a plus de mandat depuis la fin janvier : tout prélèvement de sa part se conteste auprès de la banque, il ne se saisit pas.",
        },
        { code: "epargne", piece: "epargne", libelle: EPARGNE.titre, categorie: "rien", pourquoi: "Aucune opération en mars : le compte d'épargne ne change rien au rapprochement du compte courant." },
      ],
      explication: [
        "Une pièce ne se saisit pas parce qu'elle est dans la pile : elle se contrôle d'abord. Le relevé et l'extrait se pointent, le talon de l'atelier et l'avis de la régie demandent une écriture, la lettre de résiliation demande un signalement.",
      ],
    },
    {
      id: "le-pointage",
      type: "classement",
      titre: "Pointer le relevé face au compte",
      consigne: "Pour chaque ligne du relevé et du compte 512, dites si elle se pointe de l'autre côté, si elle s'y trouve pour un autre montant, ou si elle n'est que d'un seul côté.",
      pieces: ["releve", "extrait", "talon-atelier"],
      categories: POINTAGE,
      elements: elementsDuPointage(),
      explication: [
        `Restent d'un seul côté : au relevé, le virement du comité, le prélèvement de la régie, celui de l'annuaire et la tenue de compte ; au compte, le chèque n° ${CHEQUES.entretienDeMars}. Le chèque de l'atelier est des deux côtés, pour deux montants.`,
        `Le chèque n° ${CHEQUES.entretienDeFevrier}, débité le ${dateEcrite({ jour: JOUR_DU_CHEQUE_DE_FEVRIER, mois: 3 })}, sort des suspens de février : il n'entrera pas dans l'état de mars.`,
      ],
    },
    {
      id: "l-etat",
      type: "etat",
      titre: "Dresser l'état de rapprochement",
      consigne: "Complétez l'état au 31 mars. Chaque montant va dans la colonne de celui qui ne le connaît pas encore, en négatif s'il se retranche ; une ligne sans objet vaut zéro. Les deux soldes rectifiés sont égaux.",
      pieces: ["releve", "extrait"],
      grille: grilleDeLEtat(),
      explication: [
        `Les deux soldes tombent sur ${eur(r.compteRectifie)}. Le compte se corrige de ce que la banque a fait seule et de l'erreur de la boutique ; le relevé, du chèque qu'elle ne connaît pas encore et du prélèvement qu'elle doit rendre.`,
      ],
    },
    {
      id: "les-ecritures",
      type: "journal",
      titre: "Passer les écritures",
      consigne: "Passez au journal les écritures que l'état de rapprochement demande, une à une, dans l'ordre que vous voulez. Le prélèvement contesté ne se saisit pas.",
      pieces: ["avis-regie", "talon-atelier"],
      ecritures: [
        {
          id: "comite",
          ecriture: {
            date: mars(JOUR_DU_COMITE),
            libelle: "Virement du comité, règlement de sa facture de janvier",
            lignes: [
              { role: "la banque, créditée du virement", compte: "512", sens: "debit", montant: m.comite, indice: "le montant viré" },
              { role: "la créance du comité, réglée", compte: "411", sens: "credit", montant: m.comite, indice: "le montant de la créance réglée" },
            ],
          },
          indices: ["Le comité règle une facture déjà enregistrée : sa créance s'éteint.", "La banque reçoit : elle se débite."],
        },
        {
          id: "publicite",
          ecriture: {
            date: mars(PUBLICITE_DE_MARS.jour),
            libelle: "Prélèvement de la régie, publicité de mars",
            lignes: [
              { role: "la publicité du mois", compte: "623", sens: "debit", montant: m.publicite.ht, indice: "le hors taxes de l'avis" },
              { role: "la TVA déductible", compte: "44566", sens: "debit", montant: m.publicite.tva, indice: "la TVA de l'avis" },
              { role: "la banque, prélevée", compte: "512", sens: "credit", montant: m.publicite.ttc, indice: "le montant prélevé" },
            ],
          },
          indices: ["La publicité est un service extérieur, avec de la TVA déductible.", "L'avis donne les trois montants."],
        },
        {
          id: "frais",
          ecriture: {
            date: mars(31),
            libelle: "Tenue de compte de mars",
            lignes: [
              { role: "le service bancaire", compte: "627", sens: "debit", montant: m.frais.ht, indice: "les frais hors taxes" },
              { role: "la TVA déductible sur les frais", compte: "44566", sens: "debit", montant: m.frais.tva, indice: "la TVA des frais" },
              { role: "la banque, débitée", compte: "512", sens: "credit", montant: m.frais.ttc, indice: "le total prélevé" },
            ],
          },
          indices: [`Des services bancaires, avec de la TVA à ${CONDITIONS_DE_LA_BANQUE.tvaDesFrais * 100} %.`, "La banque se crédite du total."],
        },
        {
          id: "erreur",
          ecriture: {
            date: mars(31),
            libelle: `Correction du chèque n° ${CHEQUES.atelierLocal}, chiffres inversés`,
            lignes: [
              { role: "le complément du règlement de l'atelier", compte: "401", sens: "debit", montant: r.erreur, indice: "l'écart entre le talon et le compte" },
              { role: "la banque, pour l'écart", compte: "512", sens: "credit", montant: r.erreur, indice: "l'écart entre le talon et le compte" },
            ],
          },
          indices: ["Le règlement a été saisi trop bas : on complète l'écriture d'origine, du même côté.", "La dette envers l'atelier se solde, la banque baisse de l'écart."],
        },
      ],
      explication: [
        `Le compte 512 porte désormais ${eur(r.compteRectifie)} : le solde rectifié de l'état. Le chèque de l'entretien, déjà au compte, attend la banque ; le prélèvement de l'annuaire attend son remboursement.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre à la gérante",
      consigne: "Répondez aux trois questions du courriel, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "le-solde",
          question: "Quel est le vrai solde du compte au 31 mars, celui du tableau de bord ?",
          options: [
            { texte: `${eur(r.compteRectifie)}, le solde rectifié`, juste: true, retour: `Oui : les deux soldes rectifiés de l'état tombent sur ${eur(r.compteRectifie)}, et le compte 512 le porte une fois les écritures passées.` },
            { texte: `${eur(r.releve)}, celui que donne le relevé`, juste: false, retour: `Non : le relevé ignore le chèque de l'entretien, ${eur(m.entretien)}, et porte un prélèvement que la banque doit rendre.` },
            { texte: `${eur(r.compte)}, celui que porte le compte`, juste: false, retour: "Non : le compte n'avait ni le virement du comité, ni la publicité, ni les frais, et portait une erreur de saisie." },
            { texte: `${eur(r.releve + r.aLaBanque.cheques)}, le relevé moins le chèque`, juste: false, retour: `Presque : le chèque est bien retranché, mais le prélèvement de l'annuaire, ${eur(m.annuaire)}, n'est pas dû ; la banque le rendra.` },
          ],
        },
        {
          id: "les-cheques",
          question: "Quels chèques attendent encore d'être débités ?",
          options: [
            { texte: `Le n° ${CHEQUES.entretienDeMars}, ${eur(m.entretien)}`, juste: true, retour: `Oui : le chèque de l'entretien de mars, émis le ${JOUR_DE_L_ENTRETIEN} mars. Celui de février a été débité le ${dateEcrite({ jour: JOUR_DU_CHEQUE_DE_FEVRIER, mois: 3 })}.` },
            { texte: `Les n° ${CHEQUES.entretienDeFevrier} et ${CHEQUES.entretienDeMars}, ${eur(m.chequeDeFevrier + m.entretien)}`, juste: false, retour: `Non : le chèque de février est au relevé du ${dateEcrite({ jour: JOUR_DU_CHEQUE_DE_FEVRIER, mois: 3 })}, il est sorti des suspens.` },
            { texte: `Le n° ${CHEQUES.atelierLocal}, ${eur(m.atelier)}`, juste: false, retour: `Non : la banque l'a débité le ${dateEcrite({ jour: CHEQUE_DE_L_ATELIER.jourDuDebit, mois: 3 })}. C'est la saisie du compte qui était fausse.` },
            { texte: "Aucun, tous sont passés", juste: false, retour: `Non : le chèque n° ${CHEQUES.entretienDeMars} est au compte, pas au relevé.` },
          ],
        },
        {
          id: "l-annuaire",
          question: `Que faire du prélèvement de l'annuaire, ${eur(m.annuaire)} ?`,
          options: [
            { texte: "Le contester à la banque, sans le saisir", juste: true, retour: "Oui : sans mandat, le prélèvement n'est pas autorisé. La banque le rembourse sur contestation, la lettre de résiliation à l'appui ; d'ici là, il figure à l'état, côté banque." },
            { texte: "Le saisir en charge : l'abonnement a couru", juste: false, retour: "Non : l'abonnement est résilié depuis la fin janvier. Saisir la charge, ce serait accepter de payer un service qui n'est plus dû." },
            { texte: "Le saisir, puis attendre une facture de l'annuaire pour savoir", juste: false, retour: "Non : la lettre de résiliation suffit à savoir que rien n'est dû. On ne saisit pas une dépense qu'on conteste." },
            { texte: "Faire opposition sur tous les prélèvements du compte", juste: false, retour: "Non : la régie et les impôts prélèvent aussi, à bon droit. On conteste le seul prélèvement non autorisé." },
          ],
        },
      ],
      explication: [
        `Votre réponse : le compte vaut ${eur(r.compteRectifie)} au 31 mars ; le chèque n° ${CHEQUES.entretienDeMars} attend encore ; le prélèvement de l'annuaire est contesté. Le mois est rapproché.`,
      ],
    },
  ],
};
