import { montantEcrit, type EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { PieceDuBureau } from "../bureaux/types";
import { CABINE, CHARIOT, DATES_DE_LA_SUBVENTION, GRANDE_REVISION, cabine, chariot, creditBailDuBanc, provisionPourGrosEntretien, subvention } from "../monde/acquisition-et-financement";
import { dossierDesImmobilisations, rectificationsDuDossier, type CodeDuDossier, type LigneDuDossier, type NatureDeLErreurDuDossier } from "../monde/dossier-des-immobilisations";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import { TAUX_DE_TVA } from "../monde/nova-gestion";
import type { Enquete } from "./types";

/**
 * L'ENQUÊTE : LE DOSSIER DES IMMOBILISATIONS (comptabilité générale, palier 4 ; la suite du chapitre
 * « Acquérir et financer une immobilisation » et de son cas, « La cabine subventionnée »).
 *
 * Début janvier N+2, l'alternant de NOVA a passé les huit écritures des immobilisations de N+1 : l'acompte
 * du chariot, la cabine produite par l'atelier et sa dotation, la subvention (octroi, versement, quote-part),
 * la redevance du crédit-bail et la provision pour gros entretien. L'élève trie les écritures, rectifie
 * les fausses, puis chiffre l'effet des rectifications sur le résultat de N+1. Tous les chiffres se
 * calculent dans le monde du cours (monde/dossier-des-immobilisations.ts, qui lit
 * monde/acquisition-et-financement.ts) ; ce fichier écrit le dossier et les corrigés, servis au serveur.
 *
 * UN CRAN PLUS LOIN QUE LE CHAPITRE : toutes les opérations du chapitre à la fois, passées par un autre,
 * avec cinq erreurs de natures différentes, dont une qui ne change pas le résultat.
 */

const f = EXERCICE_DE_NOVA;
const dossier = dossierDesImmobilisations();
const r = rectificationsDuDossier();
const eur = (n: number) => montantEcrit(n + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`.replace(/^-/, "−");
const nombre = (n: number) => n.toLocaleString("fr-FR");
const JOUR = "5 janvier N+2";

const ecriture = (code: CodeDuDossier) => dossier.find((d) => d.code === code)!;
const ecart = (code: CodeDuDossier) => r.ecarts.find((x) => x.code === code)?.ecart ?? 0;
const k = chariot();
const c = cabine();
const s = subvention();
const b = creditBailDuBanc();

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Les immobilisations de N+1",
  paragraphes: [
    "Bonjour,",
    "Notre alternant a passé les écritures des immobilisations de N+1 : le chariot, la cabine, la subvention, le banc et la grande révision.",
    "Avant la clôture, contrôlez-les. Pour chaque écriture fausse, je veux savoir pourquoi et l'écriture juste. Puis dites-moi ce que vos rectifications changent au résultat de N+1.",
    "Merci. Le président",
  ],
};

const NOTES: PieceDuBureau = {
  code: "notes",
  nature: "note",
  titre: "Notes sur les immobilisations de N+1",
  de: "Le service comptable de NOVA",
  a: "L'alternant",
  date: "31 décembre N+1",
  objet: "Ce qu'il faut savoir pour passer les écritures",
  paragraphes: [
    `Le chariot : commandé le ${CHARIOT.commande.replace("N + 1", "N+1")}, ${eur(CHARIOT.ht)} hors taxes, livré en N+2. Un acompte de ${pct(CHARIOT.tauxDAcompte)} du hors taxes, ${eur(k.acompte)}, versé par virement à la commande.`,
    `La cabine : construite par l'atelier, ${eur(CABINE.matieres)} de matières, ${nombre(CABINE.heures)} heures à ${eur(CABINE.coutHoraire)}, ${eur(CABINE.chargesIndirectes)} de charges indirectes ; en service le ${CABINE.miseEnService.replace("N + 1", "N+1")}.`,
    `NOVA amortit la cabine selon ses heures d'essai : ${nombre(CABINE.heuresPrevues)} heures prévues sur sa vie, ${nombre(CABINE.heuresDeNPlus1)} faites en N+1. Elle durerait ${nombre(CABINE.dureeLineaireAns)} ans en linéaire.`,
    `La subvention : ${pct(s.taux)} des équipements d'efficacité, ${eur(s.equipements)}, notifiée le ${DATES_DE_LA_SUBVENTION.octroi.replace("N + 1", "N+1")} et versée le ${DATES_DE_LA_SUBVENTION.versement.replace("N + 1", "N+1")}. Les équipements s'amortissent en linéaire sur ${nombre(s.duree)} ans, ${nombre(s.jours)} jours en N+1.`,
    `Le banc en crédit-bail : une redevance de ${eur(b.redevance)} hors taxes et ${eur(b.tva)} de TVA, prélevée le 31 décembre N+1.`,
    `La grande révision de la première ligne : devis de ${eur(GRANDE_REVISION.devis)} hors taxes, ${pct(TAUX_DE_TVA)} de TVA, en ${GRANDE_REVISION.date} ; NOVA répartit la dépense sur les ${nombre(GRANDE_REVISION.exercices)} exercices qui la précèdent.`,
  ],
  mention: "Mois de 30 jours, années de 360 jours.",
};

/** Le titre de chaque écriture de l'alternant : rien n'y dit si elle est juste. */
const TITRES: Readonly<Record<CodeDuDossier, string>> = {
  acompte: "l'acompte du chariot",
  production: "la cabine, à l'actif",
  dotation: "la dotation de la cabine",
  octroi: "la subvention, accordée",
  versement: "la subvention, versée",
  "quote-part": "la subvention, au résultat",
  redevance: "la redevance du banc",
  provision: "la grande révision",
};

const numeroDe = (code: CodeDuDossier) => dossier.findIndex((d) => d.code === code) + 1;
const titreDe = (code: CodeDuDossier) => `Écriture ${numeroDe(code)} : ${TITRES[code]}`;
const pieceDe = (code: CodeDuDossier) => `ecriture-${code}`;
const enComptes = (lignes: readonly LigneDuDossier[]) => lignes.map((l) => ({ compte: l.compte, intitule: intituleDe(l.compte), debit: l.debit, credit: l.credit }));

const ECRITURES: PieceDuBureau[] = dossier.map((d) => ({
  code: pieceDe(d.code),
  nature: "ecriture",
  titre: titreDe(d.code),
  de: "L'alternant",
  a: "Le service comptable",
  date: d.date,
  comptes: enComptes(d.alternant),
}));

const PILE: readonly PieceDuBureau[] = [COURRIEL, NOTES, ...ECRITURES];

// ─────────────────────────────────────────────────────────────────────────────
// LE TRI ET LA RECTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

const POURQUOI_DES_JUSTES: Partial<Record<CodeDuDossier, string>> = {
  production: `Juste : ${eur(CABINE.matieres)} + ${eur(c.mainDOeuvre)} + ${eur(CABINE.chargesIndirectes)} = ${eur(c.cout)} de coût de production, à l'actif contre la production immobilisée.`,
  octroi: `Juste : la subvention accordée est une créance (441) et une ressource durable (131), ${eur(s.montant)}. Elle ne va pas au résultat de l'année.`,
  versement: "Juste : le versement change une créance en trésorerie, sans toucher le résultat.",
};

/** Les raisons à choisir : les cinq natures et trois leurres. La plus longue est un leurre. */
const RAISONS: readonly { code: NatureDeLErreurDuDossier | "prorata" | "sens" | "cout"; libelle: string }[] = [
  { code: "tva-a-tort", libelle: "Une TVA est comptée là où il n'y en a pas" },
  { code: "mode", libelle: "Le mode d'amortissement n'est pas celui de NOVA" },
  { code: "etalement", libelle: "Le montant n'est pas étalé sur la durée" },
  { code: "compte", libelle: "Le compte de TVA ne convient pas" },
  { code: "base", libelle: "La base retenue comprend la TVA" },
  { code: "prorata", libelle: "Le prorata temporis est oublié" },
  { code: "sens", libelle: "Le débit et le crédit sont inversés" },
  { code: "cout", libelle: "Le coût de production oublie une partie des charges que l'atelier a consommées pour la construire" },
];

type Roles = Readonly<Record<string, { role: string; indice: string }>>;
const ACCEPTES: Readonly<Record<string, readonly string[]>> = { "2181": ["218"], "722": ["72"], "6811": ["681"], "6815": ["681"], "6122": ["612"] };

function attendue(code: CodeDuDossier, libelle: string, roles: Roles): EcritureAttendue {
  const e = ecriture(code);
  return {
    date: e.date,
    libelle,
    lignes: e.juste.map((l) => {
      const x = roles[l.compte]!;
      return { role: x.role, compte: l.compte, ...(ACCEPTES[l.compte] ? { acceptes: ACCEPTES[l.compte] } : {}), sens: l.debit > 0 ? "debit" : "credit", montant: l.debit || l.credit, indice: x.indice };
    }),
  };
}

const RECTIFICATIONS = [
  {
    id: "acompte",
    raison: "tva-a-tort",
    ecriture: attendue("acompte", "Acompte sur la commande du chariot élévateur", {
      "238": { role: "l'acompte versé sur une commande d'immobilisation", indice: "tout le montant versé" },
      "512": { role: "le paiement par la banque", indice: "le montant versé" },
    }),
    pourquoi: `Pour une livraison de biens, la TVA est exigible à la livraison : l'acompte de ${eur(k.acompte)} n'en porte pas, et va en entier au 238. Le résultat n'en était pas changé, mais une TVA de ${eur(ecriture("acompte").alternant[1]!.debit)} se serait déduite trop tôt.`,
    indices: ["Relisez les notes : l'acompte porte-t-il une TVA ?", "Un acompte versé avant la livraison d'un bien ne porte pas de TVA : tout va au 238."],
  },
  {
    id: "dotation",
    raison: "mode",
    ecriture: attendue("dotation", "Dotation aux amortissements de la cabine", {
      "6811": { role: "la dotation de N+1", indice: "le coût, au prorata des heures d'essai de l'année" },
      "28181": { role: "l'amortissement de la cabine", indice: "le coût, au prorata des heures d'essai de l'année" },
    }),
    pourquoi: `Le mode de NOVA est celui des heures d'essai : ${eur(c.cout)} × ${nombre(CABINE.heuresDeNPlus1)} ÷ ${nombre(CABINE.heuresPrevues)} = ${eur(c.dotationEnUnites)}, et non ${eur(c.dotationLineaire)} en linéaire. En unités d'œuvre, pas de prorata de temps.`,
    indices: ["Relisez dans les notes le mode d'amortissement de la cabine.", "En unités d'œuvre : le coût × les heures de l'année ÷ les heures prévues."],
  },
  {
    id: "quote-part",
    raison: "etalement",
    ecriture: attendue("quote-part", "Quote-part de la subvention d'équipement virée au résultat", {
      "139": { role: "la subvention inscrite au compte de résultat", indice: "la quote-part de N+1, au rythme de l'amortissement" },
      "777": { role: "le produit de l'exercice", indice: "la quote-part de N+1, au rythme de l'amortissement" },
    }),
    pourquoi: `La subvention se reprend au rythme de l'amortissement des équipements : ${eur(s.montant)} ÷ ${nombre(s.duree)} × ${nombre(s.jours)} ÷ 360 = ${eur(s.quotePart)}, et non ${eur(s.montant)} d'un coup : ${eur(-ecart("quote-part"))} de produit en trop.`,
    indices: ["La subvention finance des équipements qui durent : à quel rythme passe-t-elle au résultat ?", "La quote-part suit la dotation : le montant ÷ la durée, au prorata des jours de N+1."],
  },
  {
    id: "redevance",
    raison: "compte",
    ecriture: attendue("redevance", "Redevance de crédit-bail du banc de mesure", {
      "6122": { role: "la redevance, en charge", indice: "la redevance hors taxes" },
      "44566": { role: "la TVA déductible sur services", indice: "la TVA de la redevance" },
      "512": { role: "le paiement par la banque", indice: "la redevance, taxes comprises" },
    }),
    pourquoi: "La redevance paie un service, la location du banc : sa TVA va au 44566. Le 44562 reçoit la TVA des immobilisations qu'on achète ; NOVA n'est pas propriétaire du banc. Le résultat n'en était pas changé.",
    indices: ["NOVA est-elle propriétaire du banc ?", "La TVA d'un service se déduit au 44566."],
  },
  {
    id: "provision",
    raison: "base",
    ecriture: attendue("provision", "Provision pour la grande révision de la première ligne", {
      "6815": { role: "la dotation aux provisions d'exploitation", indice: "le devis hors taxes, réparti sur les exercices" },
      "1572": { role: "la provision pour gros entretien", indice: "le devis hors taxes, réparti sur les exercices" },
    }),
    pourquoi: `La TVA de la révision se déduira : la provision porte sur le hors taxes, ${eur(GRANDE_REVISION.devis)} ÷ ${nombre(GRANDE_REVISION.exercices)} = ${eur(provisionPourGrosEntretien())}, et non ${eur(ecriture("provision").alternant[0]!.debit)} : ${eur(ecart("provision"))} de charge en trop.`,
    indices: ["La TVA de la future facture coûtera-t-elle à NOVA ?", "La provision porte sur le hors taxes du devis, réparti sur les exercices qui précèdent la révision."],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// L'EFFET SUR LE RÉSULTAT
// ─────────────────────────────────────────────────────────────────────────────

const terme = (n: number) => (n < 0 ? `− ${eur(-n)}` : `+ ${eur(n)}`);
const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });

/** L'effet de chaque rectification sur le résultat de N+1 : un tableau à compléter, corrigé au serveur. */
export function grilleDesEffets(): TableauACompleter {
  const ligne = (code: CodeDuDossier, calcul: string) => ({ libelle: titreDe(code), cellules: [saisir(ecart(code), calcul, "ce que l'écriture juste change au résultat, par rapport à celle de l'alternant")] });
  const alt = (code: CodeDuDossier) => ecriture(code).alternant[0]!.debit;
  const CALCULS: Partial<Record<CodeDuDossier, string>> = {
    acompte: "le 238 et le 44562 sont au bilan : aucun effet",
    dotation: `${eur(c.dotationLineaire)} − ${eur(c.dotationEnUnites)} = ${eur(ecart("dotation"))} : une charge plus forte`,
    "quote-part": `${eur(s.quotePart)} − ${eur(alt("quote-part"))} = ${eur(ecart("quote-part"))} : un produit plus faible`,
    redevance: "le 44562 et le 44566 sont au bilan : aucun effet",
    provision: `${eur(alt("provision"))} − ${eur(provisionPourGrosEntretien())} = ${eur(ecart("provision"))} : une charge plus faible`,
  };
  return {
    titre: "L'effet des rectifications sur le résultat de N+1",
    colonnes: ["Effet sur le résultat"],
    lignes: [
      ...dossier.map((d) => ligne(d.code, CALCULS[d.code] ?? "l'écriture est juste : rien à rectifier, aucun effet")),
      {
        libelle: "Effet total sur le résultat de N+1",
        fort: true,
        totalDe: { plus: dossier.map((_, i) => i) },
        cellules: [saisir(r.total, `${r.ecarts.map((x, i) => (i === 0 ? eur(x.ecart) : terme(x.ecart))).join(" ")} = ${eur(r.total)}`, "la somme des effets")],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ENQUÊTE
// ─────────────────────────────────────────────────────────────────────────────

export const LE_DOSSIER_DES_IMMOBILISATIONS: Enquete = {
  format: "enquete",
  code: "le-dossier-des-immobilisations",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["acquerir-et-financer-une-immobilisation"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Enquête : le dossier des immobilisations",
  accroche: "L'alternant a passé les écritures des immobilisations de N+1. Contrôlez-les, trouvez les erreurs, dites pourquoi, rectifiez, puis chiffrez ce que vos rectifications changent au résultat.",
  objectifs: [
    "Contrôler les écritures d'un acompte, d'une production immobilisée, d'une subvention, d'un crédit-bail et d'une provision face aux faits",
    "Nommer la nature d'une erreur : une TVA à tort, le mode, l'étalement, le compte, la base",
    "Passer l'écriture juste de chaque opération fausse",
    "Mesurer l'effet des erreurs sur le résultat, y compris celles qui n'en ont pas",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Les comptes de N+1 ne sont pas clos ; l'alternant a passé les écritures des immobilisations de l'année.`,
    "Sur votre poste, le dossier : le courriel du président, les notes du service comptable, et les écritures de l'alternant. Certaines sont justes, d'autres non. Rien ne vous dit lesquelles.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-tri",
      type: "classement",
      titre: "Trier les écritures",
      consigne: "Ouvrez chaque écriture de l'alternant, comparez-la aux notes, puis dites si elle est juste ou fausse.",
      pieces: ["courriel", "notes"],
      categories: [
        { code: "juste", libelle: "Juste" },
        { code: "fausse", libelle: "Fausse" },
      ],
      elements: dossier.map((d) => ({
        code: d.code,
        piece: pieceDe(d.code),
        libelle: titreDe(d.code),
        categorie: d.erreur ? "fausse" : "juste",
        pourquoi: d.erreur ? "Fausse : vous direz pourquoi, et vous la rectifierez, à l'étape suivante." : POURQUOI_DES_JUSTES[d.code]!,
      })),
      explication: [`${nombre(RECTIFICATIONS.length)} écritures sur ${nombre(dossier.length)} sont fausses. Une écriture se contrôle sur ses comptes, ses montants et la règle qu'elle applique.`],
    },
    {
      id: "les-rectifications",
      type: "rectification",
      titre: "Rectifier les écritures fausses",
      consigne: "Pour chaque écriture fausse, choisissez la raison de l'erreur, puis passez l'écriture juste à sa place. Le formulaire part de l'écriture de l'alternant.",
      pieces: ["notes"],
      depuis: { etape: "le-tri", dans: "fausse" },
      raisons: RAISONS,
      ecritures: RECTIFICATIONS,
      explication: [
        "Autant d'erreurs que de natures : une TVA à tort, le mauvais mode, un étalement oublié, un compte de TVA qui ne convient pas, une base qui comprend la TVA. Deux ne changent pas le résultat.",
      ],
    },
    {
      id: "le-resultat",
      type: "etat",
      titre: "Chiffrer l'effet sur le résultat",
      consigne: "Pour chaque écriture du dossier, donnez ce que sa rectification change au résultat de N+1, en négatif s'il baisse, zéro s'il ne bouge pas ; puis l'effet total.",
      pieces: ["notes"],
      grille: grilleDesEffets(),
      explication: [
        `Les rectifications ${r.total < 0 ? "baissent" : "montent"} le résultat de N+1 de ${eur(Math.abs(r.total))}. La subvention passée d'un coup pesait le plus : un produit de ${eur(s.montant)} au lieu de ${eur(s.quotePart)}.`,
        "Les erreurs de l'acompte et de la redevance ne se voient pas au résultat : elles faussent pourtant la TVA à déduire.",
      ],
    },
  ],
};
