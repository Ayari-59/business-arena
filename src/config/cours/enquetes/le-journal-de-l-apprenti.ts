import { enEcriture, montantEcrit, type EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import { auCentime, compteDeResultat, soldes } from "../../../pedagogy/cours/etats";
import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { LigneDeCompte, PieceDuBureau } from "../bureaux/types";
import { casDeLEntreprise } from "../cas";
import {
  ECRITURES_DE_JANVIER,
  ecritureDeLAchat,
  ecritureDeLApport,
  ecritureDeLEmprunt,
  ecritureDeLEquipement,
  ecritureDeLaPaie,
  ecritureDeLaVenteACredit,
  ecritureDesVentesAuComptant,
  ecritureDuLoyer,
  ecritureDuVersementDesSalaires,
} from "../chapitres/creation-premier-bilan";
import { dateDuCours as date } from "../dates";
import type { Enquete } from "./types";

/**
 * L'ENQUÊTE : LE JOURNAL DE L'APPRENTI (comptabilité générale, palier 2 ; la suite du chapitre « De la
 * création au premier bilan » et de son cas, « La commande du 31 janvier »).
 *
 * Début février N, l'apprenti de NOVA a saisi seul le journal du premier mois, et annonce un résultat.
 * Le président veut un journal juste avant d'envoyer le bilan de janvier à sa banque. L'élève reçoit le
 * dossier (le courriel du président, le relevé des pièces de janvier, les neuf écritures de l'apprenti),
 * trie les écritures, rectifie les fausses, puis chiffre le résultat et la banque corrigés.
 *
 * UN CRAN PLUS LOIN QUE LE CHAPITRE : le chapitre faisait passer chaque écriture ; l'enquête les fait
 * contrôler, et nommer la nature de chaque erreur. Six erreurs, de six natures : un compte de tiers
 * confondu avec le capital, une TVA déduite qui n'existe pas, un bien durable passé en charge, une TVA
 * collectée oubliée, une charge de la paie oubliée, un virement passé à l'envers.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : le mois de janvier du cas figé de NOVA
 * (monde/cas-des-entreprises.ts) ; les écritures justes sont celles du chapitre
 * (chapitres/creation-premier-bilan.ts), les écritures de l'apprenti les lisent de travers ; le résultat
 * et la banque se refont par les soldes (pedagogy/cours/etats.ts). Aucune hypothèse nouvelle, sauf la
 * date de l'enquête et les erreurs elles-mêmes.
 */

const c = casDeLEntreprise("nova");

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const terme = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);

/** Le jour où l'élève ouvre le dossier (hypothèse de l'enquête) : le 3 février, le mois clos. */
export const JOUR_DE_L_ENQUETE = 34;

/** Une écriture du dossier : celle de l'apprenti, la juste, et la nature de l'erreur s'il y en a une. */
type CodeDEcriture = "apport" | "emprunt" | "loyer" | "equipement" | "achat" | "vente-credit" | "paie" | "salaires" | "ventes-comptant";
export type NatureDeLErreur = "compte" | "tva-a-tort" | "immobilisation" | "tva-oubliee" | "oubli" | "sens";

type Ligne = { compte: string; debit: number; credit: number };
const d = (compte: string, montant: number): Ligne => ({ compte, debit: montant, credit: 0 });
const k = (compte: string, montant: number): Ligne => ({ compte, debit: 0, credit: montant });

/** Le loyer que l'apprenti a cru taxé à 20 % : le montant de la quittance, découpé en hors taxes et TVA. */
const loyerHt = auCentime(c.loyer.montant / (1 + c.immobilisation.tauxTva));
const loyerTva = auCentime(c.loyer.montant - loyerHt);

/** Les neuf écritures du dossier, dans l'ordre du journal. */
export const DOSSIER_DE_L_APPRENTI: readonly { code: CodeDEcriture; titre: string; juste: EcritureAttendue; apprenti: readonly Ligne[]; erreur?: NatureDeLErreur }[] = [
  { code: "apport", titre: "L'apport des associés", juste: ecritureDeLApport(c), apprenti: [d("512", c.capital), k("101", c.capital)] },
  { code: "emprunt", titre: "L'emprunt", juste: ecritureDeLEmprunt(c), apprenti: [d("512", c.emprunt), k("101", c.emprunt)], erreur: "compte" },
  { code: "loyer", titre: "Le loyer de janvier", juste: ecritureDuLoyer(c), apprenti: [d("6132", loyerHt), d("44566", loyerTva), k("512", c.loyer.montant)], erreur: "tva-a-tort" },
  {
    code: "equipement",
    titre: `La ${c.immobilisation.designation.toLowerCase()}`,
    juste: ecritureDeLEquipement(c),
    apprenti: [d("6063", c.immobilisation.ht), d("44566", c.immobilisation.tva), k("512", c.immobilisation.ttc)],
    erreur: "immobilisation",
  },
  { code: "achat", titre: `La facture d'${c.achat.fournisseur}`, juste: ecritureDeLAchat(c), apprenti: [d("601", c.achat.ht), d("44566", c.achat.tva), k("401", c.achat.ttc)] },
  { code: "vente-credit", titre: `La vente à ${c.venteCredit.client}`, juste: ecritureDeLaVenteACredit(c), apprenti: [d("411", c.venteCredit.ttc), k("701", c.venteCredit.ttc)], erreur: "tva-oubliee" },
  { code: "paie", titre: "La paie de janvier", juste: ecritureDeLaPaie(c), apprenti: [d("641", c.personnel.brut), k("431", c.personnel.cotisationsSalariales), k("421", c.personnel.net)], erreur: "oubli" },
  { code: "salaires", titre: "Le virement des salaires", juste: ecritureDuVersementDesSalaires(c), apprenti: [d("512", c.personnel.net), k("421", c.personnel.net)], erreur: "sens" },
  {
    code: "ventes-comptant",
    titre: "Les ventes en ligne de janvier",
    juste: ecritureDesVentesAuComptant(c),
    apprenti: [d("512", c.venteComptant.ttc), k("701", c.venteComptant.ht), k("44571", c.venteComptant.tva)],
  },
];

/** Le résultat et la banque de janvier, selon un journal. */
function resultatEtBanque(lignes: readonly (readonly Ligne[])[]) {
  const s = soldes(lignes.map((l) => ({ lignes: [...l] })));
  return { resultat: compteDeResultat(s).resultat, banque: s["512"] ?? 0 };
}

/** Ce que l'apprenti annonce, ce que le journal juste donne, et l'écart de chaque erreur. */
export function journalDeLApprenti() {
  const annonce = resultatEtBanque(DOSSIER_DE_L_APPRENTI.map((x) => x.apprenti));
  const juste = resultatEtBanque(ECRITURES_DE_JANVIER.map((f) => enEcriture(f(c)).lignes));
  const ecarts = DOSSIER_DE_L_APPRENTI.filter((x) => x.erreur).map((x) => {
    const avec = resultatEtBanque([enEcriture(x.juste).lignes]);
    const sans = resultatEtBanque([x.apprenti]);
    return { code: x.code, resultat: auCentime(avec.resultat - sans.resultat), banque: auCentime(avec.banque - sans.banque) };
  });
  return {
    annonce,
    juste,
    ecarts,
    correction: { resultat: auCentime(juste.resultat - annonce.resultat), banque: auCentime(juste.banque - annonce.banque) },
  };
}

const r = journalDeLApprenti();
const ecart = (code: CodeDEcriture) => r.ecarts.find((x) => x.code === code)!.resultat;
const AU_31_JANVIER = `${date(31)} N`;

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: `${date(JOUR_DE_L_ENQUETE)} N`,
  objet: "Le journal de janvier",
  paragraphes: [
    "Bonjour,",
    `Notre apprenti a saisi seul le journal de notre premier mois. Il annonce ${r.annonce.resultat < 0 ? `une perte de ${eur(-r.annonce.resultat)}` : `un bénéfice de ${eur(r.annonce.resultat)}`} et une banque de ${eur(r.annonce.banque)} au 31 janvier. La banque attend notre premier bilan, et je n'y crois pas.`,
    "Pouvez-vous relire son journal ? Dites-moi quelles écritures sont justes, pourquoi les autres sont fausses, passez-les justes, puis donnez-moi le vrai résultat et la vraie banque.",
    "Merci. Le président",
  ],
};

const PIECES: PieceDuBureau = {
  code: "pieces",
  nature: "note",
  titre: "Les pièces de janvier",
  de: "Le président de NOVA",
  a: "L'apprenti",
  date: AU_31_JANVIER,
  objet: "Ce que disent les pièces du mois",
  paragraphes: [
    `Le ${date(c.dates.capital)}, les associés versent ${eur(c.capital)} au capital ; le ${date(c.dates.emprunt)}, la banque nous prête ${eur(c.emprunt)}, remboursables en ${c.pret.nombreEcheances} échéances.`,
    `Le ${date(c.loyer.date)}, le loyer de janvier est prélevé : ${eur(c.loyer.montant)}. La quittance du propriétaire ne porte pas de TVA.`,
    `Le ${date(c.immobilisation.date)}, la ${c.immobilisation.designation.toLowerCase()} est payée : ${eur(c.immobilisation.ht)} hors taxes, ${eur(c.immobilisation.tva)} de TVA. Elle servira ${c.gestion.dureeAmortissementMois / 12} ans.`,
    `Le ${date(c.achat.date)}, ${c.achat.fournisseur} facture les composants : ${eur(c.achat.ht)} hors taxes, ${eur(c.achat.tva)} de TVA, payables le ${date(c.achat.echeance)}.`,
    `Le ${date(c.venteCredit.date)}, nous facturons ${c.venteCredit.client} : ${eur(c.venteCredit.ht)} hors taxes, ${eur(c.venteCredit.tva)} de TVA, ${eur(c.venteCredit.ttc)} en tout.`,
    `Le ${date(c.personnel.date)}, la paie : ${eur(c.personnel.brut)} de salaires bruts, ${eur(c.personnel.cotisationsSalariales)} de cotisations salariales, ${eur(c.personnel.cotisationsPatronales)} de cotisations patronales ; les nets, ${eur(c.personnel.net)}, sont virés le jour même.`,
    `Le ${date(c.venteComptant.date)}, les ventes en ligne du mois sont encaissées : ${eur(c.venteComptant.ht)} hors taxes, ${eur(c.venteComptant.tva)} de TVA, ${eur(c.venteComptant.ttc)} en tout.`,
  ],
};

const enComptes = (lignes: readonly Ligne[]): LigneDeCompte[] => lignes.map((l) => ({ compte: l.compte, intitule: intituleDe(l.compte), debit: l.debit, credit: l.credit }));
const numeroDe = (code: CodeDEcriture) => DOSSIER_DE_L_APPRENTI.findIndex((x) => x.code === code) + 1;
const titreDe = (x: (typeof DOSSIER_DE_L_APPRENTI)[number]) => `Écriture ${numeroDe(x.code)} : ${x.titre.charAt(0).toLowerCase()}${x.titre.slice(1)}`;
const pieceDe = (code: CodeDEcriture) => `ecriture-${code}`;

const ECRITURES: PieceDuBureau[] = DOSSIER_DE_L_APPRENTI.map((x) => ({
  code: pieceDe(x.code),
  nature: "ecriture",
  titre: titreDe(x),
  de: "L'apprenti",
  a: "Le service comptable",
  date: x.juste.date + " N",
  comptes: enComptes(x.apprenti),
}));

const PILE: readonly PieceDuBureau[] = [COURRIEL, PIECES, ...ECRITURES];

// ─────────────────────────────────────────────────────────────────────────────
// LE TRI ET LA RECTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

const POURQUOI_DES_JUSTES: Partial<Record<CodeDEcriture, string>> = {
  apport: `Juste : la banque reçoit ${eur(c.capital)}, le capital des associés aussi.`,
  achat: `Juste : l'achat hors taxes, la TVA déductible, et la dette envers ${c.achat.fournisseur} pour le tout.`,
  "ventes-comptant": `Juste : la banque reçoit ${eur(c.venteComptant.ttc)}, les ventes se créditent hors taxes, la TVA collectée à part.`,
};

/** Les raisons à choisir : les six natures, et deux leurres ; la plus longue est un leurre. */
const RAISONS: readonly { code: NatureDeLErreur | "date" | "montant"; libelle: string }[] = [
  { code: "compte", libelle: "Une dette est passée en capital" },
  { code: "tva-a-tort", libelle: "Une TVA est déduite que la pièce ne porte pas" },
  { code: "immobilisation", libelle: "Un bien durable est passé en charge" },
  { code: "tva-oubliee", libelle: "La TVA collectée est oubliée" },
  { code: "oubli", libelle: "Une charge de la paie est oubliée" },
  { code: "sens", libelle: "Le débit et le crédit sont inversés" },
  { code: "date", libelle: "La date n'est pas celle de la pièce" },
  { code: "montant", libelle: "Le montant retenu est celui d'une autre pièce du mois, recopié par erreur" },
];

const effet = (x: number) => (x > 0 ? `${eur(x)} de résultat en moins` : x < 0 ? `${eur(-x)} de résultat en trop` : "aucun effet sur le résultat");

const RECTIFICATIONS = DOSSIER_DE_L_APPRENTI.filter((x) => x.erreur).map((x) => {
  const textes: Record<NatureDeLErreur, { pourquoi: string; indices: string[] }> = {
    compte: {
      pourquoi: `L'emprunt se rendra : c'est une dette envers la banque, au 164, et non un apport des associés. Le résultat n'en change pas, le bilan si : ${eur(c.emprunt)} de capitaux propres en trop, autant de dettes en moins.`,
      indices: ["Relisez qui verse cet argent, et s'il faudra le rendre.", "L'argent prêté par la banque va à un compte de dettes, pas au capital."],
    },
    "tva-a-tort": {
      pourquoi: `La quittance ne porte pas de TVA : il n'y a rien à déduire. Le loyer est une charge de ${eur(c.loyer.montant)} ; l'apprenti n'en comptait que ${eur(loyerHt)}, soit ${effet(ecart("loyer"))}.`,
      indices: ["Relisez la quittance du loyer, dans les pièces.", "On ne déduit que la TVA qu'une facture porte."],
    },
    immobilisation: {
      pourquoi: `La ligne servira ${c.gestion.dureeAmortissementMois / 12} ans : c'est une immobilisation, au ${c.immobilisation.compte}, pas une charge du mois. En charge, elle retirait ${eur(c.immobilisation.ht)} au résultat de janvier.`,
      indices: ["Combien de temps la ligne servira-t-elle ?", `Un bien qui sert plusieurs années va à l'actif, au compte ${c.immobilisation.compte}.`],
    },
    "tva-oubliee": {
      pourquoi: `La facture porte ${eur(c.venteCredit.tva)} de TVA, que NOVA doit à l'État : elle va au 44571. Comptée en vente, elle gonflait le résultat de ${eur(c.venteCredit.tva)}.`,
      indices: ["La vente, est-ce le hors taxes ou le toutes taxes comprises ?", "La TVA facturée au client est due à l'État : TVA collectée, au crédit."],
    },
    oubli: {
      pourquoi: `Les cotisations patronales, ${eur(c.personnel.cotisationsPatronales)}, sont une charge de NOVA, au 645, et une dette envers l'URSSAF avec les salariales : ${eur(auCentime(c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales))} au 431.`,
      indices: ["Relisez la paie : quelles cotisations l'apprenti a-t-il passées ?", "Le coût du personnel, c'est le brut et les cotisations patronales."],
    },
    sens: {
      pourquoi: `Le virement fait sortir l'argent : la dette envers les salariés s'éteint au débit du 421, la banque se crédite. À l'envers, la banque gagnait ${eur(c.personnel.net)} au lieu de les perdre : ${eur(-r.ecarts.find((y) => y.code === "salaires")!.banque)} d'écart au 512.`,
      indices: ["Le virement des salaires fait-il entrer de l'argent en banque, ou en sortir ?", "Une dette qui s'éteint se débite."],
    },
  };
  const t = textes[x.erreur!];
  return { id: x.code, raison: x.erreur!, ecriture: x.juste, pourquoi: t.pourquoi, indices: t.indices };
});

// ─────────────────────────────────────────────────────────────────────────────
// LE RÉSULTAT ET LA BANQUE CORRIGÉS
// ─────────────────────────────────────────────────────────────────────────────

/** Le résultat et la banque corrigés : un tableau à compléter, corrigé au serveur. */
export function grilleDuJournalCorrige(): TableauACompleter {
  const somme = (champ: "resultat" | "banque") =>
    r.ecarts
      .filter((x) => x[champ] !== 0)
      .map((x, i) => (i === 0 ? eur(x[champ]) : terme(x[champ])))
      .join(" ");
  return {
    titre: "Le résultat et la banque de janvier, corrigés",
    colonnes: ["Résultat", "Banque"],
    lignes: [
      { libelle: "Annoncés par l'apprenti", cellules: [{ valeur: r.annonce.resultat }, { valeur: r.annonce.banque }] },
      {
        libelle: "Effet des rectifications",
        cellules: [
          { valeur: r.correction.resultat, saisir: true, calcul: `${somme("resultat")} = ${eur(r.correction.resultat)}`, indice: "ce que chaque rectification change au résultat, en plus ou en moins" },
          { valeur: r.correction.banque, saisir: true, calcul: `${somme("banque")} = ${eur(r.correction.banque)}`, indice: "ce que chaque rectification change au compte 512" },
        ],
      },
      {
        libelle: "Corrigés",
        fort: true,
        totalDe: { plus: [0, 1] },
        cellules: [
          { valeur: r.juste.resultat, saisir: true, calcul: `${eur(r.annonce.resultat)} ${terme(r.correction.resultat)} = ${eur(r.juste.resultat)}`, indice: "l'annoncé, plus l'effet des rectifications" },
          { valeur: r.juste.banque, saisir: true, calcul: `${eur(r.annonce.banque)} ${terme(r.correction.banque)} = ${eur(r.juste.banque)}`, indice: "l'annoncé, plus l'effet des rectifications" },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ENQUÊTE
// ─────────────────────────────────────────────────────────────────────────────

export const LE_JOURNAL_DE_L_APPRENTI: Enquete = {
  format: "enquete",
  code: "le-journal-de-l-apprenti",
  parcours: "comptabilite-generale",
  palier: 2,
  blocs: [],
  reprend: ["creation-premier-bilan"],
  commanditaire: "Le président",
  entreprise: { code: c.code, nom: c.entreprise },
  titre: "Enquête : le journal de l'apprenti",
  accroche: "L'apprenti a saisi seul le premier mois de NOVA, et la banque attend le bilan. Relisez chaque écriture, trouvez les erreurs, dites pourquoi, rectifiez, puis donnez le vrai résultat et la vraie banque.",
  objectifs: [
    "Contrôler une écriture face à sa pièce : ses comptes, ses montants, son sens",
    "Nommer la nature d'une erreur de saisie",
    "Passer l'écriture juste à la place de la fausse",
    "Mesurer ce que les erreurs changent au résultat et à la banque",
  ],
  libre: false,
  accueil: [
    `Le ${date(JOUR_DE_L_ENQUETE)} N, au siège de NOVA. Le premier mois est clos ; l'apprenti a passé toutes les écritures, et le président attend votre relecture.`,
    "Sur votre poste, le dossier : le courriel du président, les pièces de janvier résumées, et les écritures de l'apprenti. Certaines sont justes, d'autres non. Rien ne vous dit lesquelles.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-tri",
      type: "classement",
      titre: "Trier les écritures",
      consigne: "Ouvrez chaque écriture de l'apprenti, comparez-la aux pièces de janvier, puis dites si elle est juste ou fausse.",
      pieces: ["courriel", "pieces"],
      categories: [
        { code: "juste", libelle: "Juste" },
        { code: "fausse", libelle: "Fausse" },
      ],
      elements: DOSSIER_DE_L_APPRENTI.map((x) => ({
        code: x.code,
        piece: pieceDe(x.code),
        libelle: titreDe(x),
        categorie: x.erreur ? "fausse" : "juste",
        pourquoi: x.erreur ? "Fausse : vous direz pourquoi, et vous la rectifierez, à l'étape suivante." : POURQUOI_DES_JUSTES[x.code]!,
      })),
      explication: [`${RECTIFICATIONS.length} écritures sur ${DOSSIER_DE_L_APPRENTI.length} sont fausses. Une écriture équilibrée n'est pas forcément juste : chacune de celles de l'apprenti l'est.`],
    },
    {
      id: "les-rectifications",
      type: "rectification",
      titre: "Rectifier les écritures fausses",
      consigne: "Pour chaque écriture fausse, choisissez la raison de l'erreur, puis passez l'écriture juste à sa place. Le formulaire part de l'écriture de l'apprenti.",
      pieces: ["pieces"],
      depuis: { etape: "le-tri", dans: "fausse" },
      raisons: RAISONS,
      ecritures: RECTIFICATIONS,
      explication: [
        "Six erreurs, six natures : une dette passée en capital, une TVA déduite à tort, un bien durable passé en charge, une TVA collectée oubliée, une charge de la paie oubliée, un sens inversé. Deux ne changent pas le résultat : la dette passée en capital et le virement inversé ne touchent que le bilan.",
      ],
    },
    {
      id: "le-resultat",
      type: "etat",
      titre: "Le vrai résultat, la vraie banque",
      consigne: "Complétez le tableau : l'effet de vos rectifications, en négatif s'il baisse le montant, puis le résultat et la banque corrigés.",
      pieces: ["courriel"],
      grille: grilleDuJournalCorrige(),
      explication: [
        `Le résultat de janvier est ${r.juste.resultat >= 0 ? "un bénéfice" : "une perte"} de ${eur(Math.abs(r.juste.resultat))}, et la banque porte ${eur(r.juste.banque)}. L'apprenti annonçait ${eur(r.annonce.resultat)} et ${eur(r.annonce.banque)} : ses erreurs se compensaient en partie.`,
        "Le relevé de banque aurait trahi l'erreur de sens : un solde comptable se contrôle toujours face au relevé.",
      ],
    },
  ],
};
