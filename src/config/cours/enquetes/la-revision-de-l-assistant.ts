import { montantEcrit, type EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { LigneDeCompte, PieceDuBureau } from "../bureaux/types";
import { auCentime } from "../monde/amortissement";
import type { LigneDEcriture } from "../monde/cloture";
import { BATTERIES_DE_L_ANCIEN_MODELE, COMPTE_D_ATTENTE, MAJORATION_CONTESTEE, PARTICIPATION_DE_N_PLUS_1, REGLE_DU_DIXIEME, SEUIL_DU_FORFAIT_SOCIAL, batteries, brutDesMois, congesPayes, garantie } from "../monde/dossier-de-revision";
import { TRAVAUX_DE_L_ASSISTANT, chiffresDeLAssistant, resultatDeLAssistant, revisionDeLAssistant, type TravailDeLAssistant } from "../monde/revision-de-l-assistant";
import type { Enquete } from "./types";

/**
 * L'ENQUÊTE : LA RÉVISION DE L'ASSISTANT (comptabilité générale, palier 4 ; la suite du chapitre « Le
 * dossier de révision » et de son cas, « La garantie de deux ans »).
 *
 * À la clôture de N+1, un assistant du cabinet a passé les écritures du dossier de révision de NOVA.
 * L'expert-comptable ne signera pas le dossier sans qu'on les ait relues. L'élève reçoit le dossier (le
 * courriel, les notes de la révision, les sept écritures), trie les écritures, rectifie les fausses, puis
 * chiffre le résultat révisé. Tous les chiffres se calculent dans le monde du cours
 * (monde/revision-de-l-assistant.ts, qui lit monde/dossier-de-revision.ts) ; ce fichier écrit le dossier,
 * les consignes et les corrigés, qui ne partent jamais au navigateur.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const dossier = revisionDeLAssistant();
const r = resultatDeLAssistant();
const k = chiffresDeLAssistant();
const cp = congesPayes();
const b = batteries();
const g = garantie();
const a = COMPTE_D_ATTENTE;

const AU_31 = "31 décembre N+1";
const ecriture = (code: TravailDeLAssistant) => dossier.find((d) => d.code === code)!;

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel de l'expert-comptable",
  de: "L'expert-comptable du cabinet",
  a: "Vous",
  date: "février N+2",
  objet: "La révision de NOVA",
  paragraphes: [
    "Bonjour,",
    `Notre assistant a passé les écritures du dossier de révision de NOVA. Il annonce un résultat avant impôt de ${eur(r.annonce)}. Je ne signerai pas le dossier sans qu'on les ait relues.`,
    "Pour chaque écriture, dites-moi si elle est juste. Pour chaque écriture fausse, je veux la raison de l'erreur et l'écriture juste. Puis donnez-moi le résultat révisé.",
    "Merci.",
  ],
};

const NOTES: PieceDuBureau = {
  code: "notes",
  nature: "note",
  titre: "Notes de la révision",
  de: "Le cabinet",
  a: "L'assistant",
  date: AU_31,
  objet: "Les points ouverts de la feuille de travail",
  paragraphes: [
    `Compte d'attente, au crédit : ${eur(a.acompte.montant)} reçus le ${a.acompte.date}. C'est un acompte du comité social d'une entreprise de la région, pour ${qte(a.acompte.enceintes)} enceintes à livrer en janvier N+2.`,
    `Compte d'attente, au débit : ${eur(a.frais.montant)} prélevés le ${a.frais.date}. Ce sont des frais de tenue de compte, exonérés de TVA.`,
    `Congés payés : la période de référence court du 1er juin au 31 mai ; aucun congé n'a encore été pris sur la période ouverte. Règle du dixième ; cotisations patronales à ${pct(cp.tauxPatronal)}. Le brut de N+1, mois par mois, est en bas de la note.`,
    `Participation : ${eur(PARTICIPATION_DE_N_PLUS_1)}, calculée par le cabinet. NOVA compte ${qte(cp.effectif)} salariés.`,
    `Majoration de TVA : ${eur(MAJORATION_CONTESTEE)}, contestée ; l'expert-comptable juge probable qu'elle soit maintenue.`,
    `Batteries de l'ancien modèle : ${qte(BATTERIES_DE_L_ANCIEN_MODELE.quantite)} au stock, à leur coût de ${eur(BATTERIES_DE_L_ANCIEN_MODELE.coutUnitaire)} ; elles ne serviront plus ; un recycleur les reprend à ${eur(BATTERIES_DE_L_ANCIEN_MODELE.prixDeReprise)}.`,
    `Garantie d'un an : ${qte(g.volume)} enceintes vendues en N+1, ${pct(g.tauxDeDefaut)} de défauts, ${pct(g.tauxDeDetection)} trouvés au contrôle ; les autres reviennent sous garantie, ${eur(g.coutDUnRetour)} chacun. La moitié de ces retours est déjà faite et passée en charges ; l'autre moitié est encore à venir.`,
  ],
  montants: brutDesMois().map((x, i) => ({ libelle: `Brut ${/^[aeiou]/.test(MOIS[i]!) ? "d'" : "de "}${MOIS[i]} N+1`, montant: x })),
};

const TITRES: Readonly<Record<TravailDeLAssistant, string>> = {
  acompte: "Le virement du comité social",
  frais: "Les frais prélevés par la banque",
  conges: "Les congés payés",
  participation: "La participation",
  amende: "La majoration contestée",
  batteries: "Les batteries de l'ancien modèle",
  garantie: "La garantie",
};

const numeroDe = (code: TravailDeLAssistant) => TRAVAUX_DE_L_ASSISTANT.indexOf(code) + 1;
const titreDe = (code: TravailDeLAssistant) => `Écriture ${numeroDe(code)} : ${TITRES[code].charAt(0).toLowerCase()}${TITRES[code].slice(1)}`;
const pieceDe = (code: TravailDeLAssistant) => `ecriture-${code}`;
const enComptes = (lignes: readonly LigneDEcriture[]): LigneDeCompte[] => lignes.map((l) => ({ compte: l.compte, intitule: intituleDe(l.compte), debit: l.debit, credit: l.credit }));

const ECRITURES: PieceDuBureau[] = dossier.map((d) => ({ code: pieceDe(d.code), nature: "ecriture", titre: titreDe(d.code), de: "L'assistant", a: "L'expert-comptable", date: AU_31, comptes: enComptes(d.assistant) }));

const PILE: readonly PieceDuBureau[] = [COURRIEL, NOTES, ...ECRITURES];

// ─────────────────────────────────────────────────────────────────────────────
// LA RECTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/** Les raisons à choisir : les cinq natures, et trois leurres. La plus longue est un leurre. */
const RAISONS: readonly { code: string; libelle: string }[] = [
  { code: "compte", libelle: "Le compte retenu ne convient pas" },
  { code: "periode", libelle: "La base couvre une autre période que la bonne" },
  { code: "regle", libelle: "Une charge est passée qu'aucune règle n'impose" },
  { code: "base", libelle: "La base retenue est le coût entier, pas la perte" },
  { code: "part", libelle: "La provision couvre aussi ce qui est déjà arrivé" },
  { code: "sens", libelle: "Le débit et le crédit sont inversés" },
  { code: "tva", libelle: "La TVA est oubliée" },
  { code: "montant", libelle: "Le montant donné par le cabinet n'est pas celui qu'il fallait reprendre" },
];

const ROLES: Readonly<Record<string, { role: string; indice: string }>> = {
  "471": { role: "le compte d'attente qui se solde", indice: "le virement reçu" },
  "4191": { role: "l'acompte reçu sur commande", indice: "le virement reçu" },
  "6412": { role: "la charge de congés payés", indice: "le dixième du brut de la période de référence" },
  "645": { role: "les cotisations patronales sur les congés", indice: "les cotisations sur la dette de congés" },
  "4282": { role: "la dette de congés envers les salariés", indice: "le dixième du brut de la période de référence" },
  "4382": { role: "les charges sociales à payer sur les congés", indice: "les cotisations sur la dette de congés" },
  "691": { role: "la participation, charge de l'exercice", indice: "le montant calculé par le cabinet" },
  "4284": { role: "la dette envers les salariés", indice: "le montant calculé par le cabinet" },
  "6817": { role: "la dotation aux dépréciations", indice: "le coût moins la valeur actuelle" },
  "391": { role: "la dépréciation du stock de matières", indice: "le coût moins la valeur actuelle" },
  "6815": { role: "la dotation aux provisions", indice: "les retours encore à venir, à leur coût" },
  "1512": { role: "la provision pour garanties", indice: "les retours encore à venir, à leur coût" },
};

const ACCEPTES: Readonly<Record<string, readonly string[]>> = { "4191": ["419"], "6412": ["641"], "4282": ["428"], "4382": ["438", "4386"], "4284": ["428"], "6817": ["681"], "391": ["39"], "6815": ["681"], "1512": ["151"] };

function attendue(code: TravailDeLAssistant, libelle: string): EcritureAttendue {
  return {
    date: AU_31,
    libelle,
    lignes: ecriture(code).juste.map((l) => ({
      role: ROLES[l.compte]!.role,
      compte: l.compte,
      ...(ACCEPTES[l.compte] ? { acceptes: ACCEPTES[l.compte] } : {}),
      sens: l.debit > 0 ? ("debit" as const) : ("credit" as const),
      montant: l.debit > 0 ? l.debit : l.credit,
      indice: ROLES[l.compte]!.indice,
    })),
  };
}

const RECTIFICATIONS = [
  {
    id: "acompte",
    raison: "compte",
    ecriture: attendue("acompte", "Acompte du comité social, reçu sur commande"),
    pourquoi: `Les enceintes ne sont livrées qu'en janvier N+2 : une vente n'est pas faite avant la livraison. Les ${eur(a.acompte.montant)} sont un acompte reçu sur commande, au 4191, sans TVA tant que rien n'est livré. L'assistant comptait ${eur(k.venteHt)} de ventes en trop.`,
    indices: ["Relisez la date de livraison des enceintes, dans les notes.", "Un client qui paie avant la livraison verse un acompte : il a son compte, chez les clients."],
  },
  {
    id: "conges",
    raison: "periode",
    ecriture: attendue("conges", "Dette de congés payés au 31 décembre"),
    pourquoi: `La période de référence s'ouvre le 1er juin : seuls les congés acquis depuis restent dus. Le dixième du brut de juin à décembre, ${eur(k.brutDeLaPeriode)} × ${pct(REGLE_DU_DIXIEME)} = ${eur(cp.dette)}, et non celui de toute l'année, ${eur(k.brutDeLAnnee)}. Les cotisations suivent : ${eur(cp.charges)}.`,
    indices: ["Les congés de l'hiver se prennent sur la période précédente : relisez quand s'ouvre la période de référence.", "Le dixième ne porte que sur le brut de la période ouverte."],
  },
  {
    id: "participation",
    raison: "regle",
    ecriture: attendue("participation", "Participation des salariés de N+1"),
    pourquoi: `Sous ${qte(SEUIL_DU_FORFAIT_SOCIAL)} salariés, la participation échappe au forfait social : NOVA en compte ${qte(cp.effectif)}. Les ${eur(k.forfait)} passés en charges sociales n'étaient pas dus.`,
    indices: ["Combien NOVA a-t-elle de salariés ?", "Le forfait social de la participation dépend de l'effectif de l'entreprise."],
  },
  {
    id: "batteries",
    raison: "base",
    ecriture: attendue("batteries", "Dépréciation des batteries de l'ancien modèle"),
    pourquoi: `Le stock garde son coût, ${eur(b.cout)} ; la dépréciation constate l'écart avec la valeur actuelle, ${eur(b.valeurActuelle)}, soit ${eur(b.depreciation)}. Le recycleur reprend les batteries : elles ne valent pas rien.`,
    indices: ["Que vaudront les batteries une fois reprises par le recycleur ?", "Une dépréciation mesure la perte de valeur : le coût moins la valeur actuelle."],
  },
  {
    id: "garantie",
    raison: "part",
    ecriture: attendue("garantie", "Provision pour les retours sous garantie à venir"),
    pourquoi: `${qte(g.defautsLivres)} enceintes défectueuses sont parties chez les clients ; la moitié est déjà revenue, et passée en charges. La provision ne couvre que les ${qte(g.retoursAVenir)} retours à venir, ${eur(g.provision)}, et non les ${eur(k.tousLesRetours.provision)} de toute l'année.`,
    indices: ["Les notes disent quelle part des retours est déjà faite.", "Une provision couvre une charge à venir, pas une charge déjà passée."],
  },
];

const POURQUOI_DES_JUSTES: Partial<Record<TravailDeLAssistant, string>> = {
  frais: `Juste : l'avis de la banque, retrouvé, dit des frais de tenue de compte, exonérés de TVA : ${eur(a.frais.montant)} au 627, le compte d'attente se solde d'autant.`,
  amende: `Juste : la majoration de ${eur(MAJORATION_CONTESTEE)} sera probablement maintenue ; elle se provisionne au 1514, par une dotation exceptionnelle.`,
};

const POURQUOI_DES_FAUSSES = "Fausse : vous direz pourquoi, et vous la rectifierez, à l'étape suivante.";

// ─────────────────────────────────────────────────────────────────────────────
// LE RÉSULTAT RÉVISÉ
// ─────────────────────────────────────────────────────────────────────────────

const terme = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);

/** Le résultat révisé corrigé : un tableau à compléter, corrigé au serveur. */
export function grilleDuResultatRevise(): TableauACompleter {
  const somme = r.ecarts.filter((x) => Math.abs(x.ecart) > 0.005).map((x, i) => (i === 0 ? eur(x.ecart) : terme(x.ecart))).join(" ");
  return {
    titre: "Le résultat révisé de N+1",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Résultat avant impôt annoncé par l'assistant", cellules: [{ valeur: r.annonce }] },
      { libelle: "Effet des rectifications sur le résultat", cellules: [{ valeur: r.correction, saisir: true, calcul: `${somme} = ${eur(r.correction)}`, indice: "ce que chaque rectification change au résultat, en plus ou en moins" }] },
      { libelle: "Résultat avant impôt révisé", fort: true, totalDe: { plus: [0, 1] }, cellules: [{ valeur: r.corrige, saisir: true, calcul: `${eur(r.annonce)} ${terme(r.correction)} = ${eur(r.corrige)}`, indice: "le résultat annoncé, plus l'effet des rectifications" }] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ENQUÊTE
// ─────────────────────────────────────────────────────────────────────────────

export const LA_REVISION_DE_L_ASSISTANT: Enquete = {
  format: "enquete",
  code: "la-revision-de-l-assistant",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-dossier-de-revision"],
  commanditaire: "L'expert-comptable",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Enquête : la révision de l'assistant",
  accroche: "Un assistant du cabinet a passé les écritures de la révision de NOVA. Relisez-les une à une, trouvez les erreurs, dites pourquoi, rectifiez, puis donnez le résultat révisé.",
  objectifs: [
    "Contrôler les écritures d'un dossier de révision face aux notes de la feuille de travail",
    "Nommer la nature d'une erreur : le compte, la période, la règle, la base, la part",
    "Passer l'écriture juste de chaque travail de révision faux",
    "Ramener le résultat annoncé au résultat révisé",
  ],
  libre: false,
  accueil: [
    `En février N+2, au cabinet. Les comptes de NOVA au ${AU_31} attendent la signature de l'expert-comptable ; l'assistant a passé les écritures de la révision.`,
    "Sur votre poste, le courriel de l'expert-comptable, les notes de la révision et les sept écritures de l'assistant. Certaines sont justes, d'autres non : c'est votre enquête.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-tri",
      type: "classement",
      titre: "Trier les écritures",
      consigne: "Ouvrez chaque écriture de l'assistant, comparez-la aux notes de la révision, puis dites si elle est juste ou fausse.",
      pieces: ["courriel", "notes"],
      categories: [
        { code: "juste", libelle: "Juste" },
        { code: "fausse", libelle: "Fausse" },
      ],
      elements: dossier.map((d) => ({ code: d.code, piece: pieceDe(d.code), libelle: titreDe(d.code), categorie: d.erreur ? "fausse" : "juste", pourquoi: d.erreur ? POURQUOI_DES_FAUSSES : POURQUOI_DES_JUSTES[d.code]! })),
      explication: [`${qte(RECTIFICATIONS.length)} écritures sur ${qte(dossier.length)} sont fausses. Une écriture de révision se contrôle sur son compte, sa base, sa période et la règle qu'elle applique.`],
    },
    {
      id: "les-rectifications",
      type: "rectification",
      titre: "Rectifier les écritures fausses",
      consigne: "Pour chaque écriture fausse, choisissez la raison de l'erreur, puis passez l'écriture juste à sa place. Le formulaire part de l'écriture de l'assistant.",
      pieces: ["notes"],
      depuis: { etape: "le-tri", dans: "fausse" },
      raisons: RAISONS,
      ecritures: RECTIFICATIONS,
      explication: [
        "Cinq erreurs, cinq natures : un acompte pris pour une vente, une période trop longue, une règle qui ne s'applique pas, une base trop large, une part déjà passée en charges.",
      ],
    },
    {
      id: "le-resultat",
      type: "etat",
      titre: "Donner le résultat révisé",
      consigne: "Complétez le tableau : l'effet de vos rectifications sur le résultat avant impôt, en négatif s'il le baisse, puis le résultat révisé.",
      pieces: ["courriel"],
      grille: grilleDuResultatRevise(),
      explication: [`Le résultat révisé de N+1 est de ${eur(r.corrige)} avant impôt : celui que l'impôt sur les sociétés de NOVA retient. L'assistant s'en écartait de ${eur(Math.abs(auCentime(r.annonce - r.corrige)))}.`],
    },
  ],
};
