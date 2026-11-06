import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../monde/amortissement";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { dateDuCours } from "../dates";
import { paieDeRouteEtCie } from "../monde/paie-de-route-et-cie";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LA PAIE DE JANVIER (comptabilité générale, palier 3 ; la suite du chapitre « La paie » et
 * de son cas, « La prime exceptionnelle »).
 *
 * Le 28 janvier, chez ROUTE & CIE : le journal de paie est arrêté. L'élève trie les pièces de la paie,
 * dresse le récapitulatif des bulletins jusqu'au coût employeur, passe les cinq écritures (l'acompte, les
 * salaires, les cotisations patronales, le virement des nets, le règlement du 15 février), puis répond au
 * dirigeant, qui doit aussi répondre à un chauffeur qui demande une augmentation. Tous les chiffres se
 * calculent dans le monde du cours (monde/paie-de-route-et-cie.ts) ; ce fichier écrit la pile, les
 * consignes et les corrigés, qui ne partent jamais au navigateur.
 *
 * UN CRAN PLUS LOIN QUE LE CAS : la paie entière, des pièces au règlement des organismes, et une demande
 * exprimée en net, qu'il faut remonter au brut et au coût.
 */

const x = paieDeRouteEtCie();
const p = x.p;
const b = x.b;
const t = x.t;
const v = b.aVerser;
const g = x.augmentation;
const eur = (n: number) => montantEcrit(n + 0).replace(/^-/, "−");
const pct = (r: number) => `${(r * 100).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

const ACOMPTE = dateDuCours(p.jourAcompte);
const PAIE = dateDuCours(p.date);
const ECHEANCE = dateDuCours(p.dateUrssaf);

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du dirigeant",
  de: `Le dirigeant de ${x.entreprise}`,
  a: "La comptabilité",
  date: PAIE,
  objet: "La paie de janvier",
  paragraphes: [
    "Bonjour,",
    "Le journal de paie de janvier est arrêté. Passez la paie, puis dites-moi ce que le personnel nous coûte ce mois-ci, et ce que la paie fera sortir de la banque.",
    `Un chauffeur me demande ${eur(g.net)} de plus par mois, « dans la poche ». Si j'accepte, que dois-je mettre en brut, et combien cela nous coûtera-t-il ?`,
    "Merci. Le dirigeant",
  ],
};

const JOURNAL: PieceDuBureau = {
  code: "journal",
  nature: "fiche",
  titre: "Journal de paie de janvier",
  de: "Le logiciel de paie",
  a: x.entreprise,
  date: PAIE,
  objet: `Récapitulatif des bulletins de ses ${qte(p.effectif)} salariés`,
  montants: [
    { libelle: "Salaires bruts", montant: b.brut },
    { libelle: "Net imposable, calculé par le logiciel", montant: b.netImposable, fort: true },
  ],
  mention: "Le net imposable comprend la part de CSG et de CRDS que l'impôt ne déduit pas.",
};

const TAUX: PieceDuBureau = {
  code: "taux",
  nature: "note",
  titre: "Les taux de cotisations",
  de: "Le cabinet de paie",
  a: x.entreprise,
  date: "janvier",
  paragraphes: [
    `Cotisations salariales : URSSAF ${pct(t.salarialUrssaf)} du brut, retraite complémentaire ${pct(t.salarialRetraite)}.`,
    `Cotisations patronales : URSSAF ${pct(t.patronalUrssaf)} du brut, retraite complémentaire ${pct(t.patronalRetraite)}.`,
  ],
  mention: "Des taux d'un salarié non cadre, les mêmes pour toute l'équipe.",
};

const AVIS: PieceDuBureau = {
  code: "avis",
  nature: "avis",
  titre: "Taux du prélèvement à la source",
  de: "L'administration fiscale",
  a: x.entreprise,
  date: "janvier",
  paragraphes: [`Le taux moyen de prélèvement à la source de vos salariés, à appliquer à leur net imposable : ${pct(t.prelevementALaSource)}.`],
};

const DEMANDE_D_ACOMPTE: PieceDuBureau = {
  code: "acompte",
  nature: "lettre",
  titre: `Demande d'acompte du ${ACOMPTE}`,
  de: "Un salarié",
  a: `Le dirigeant de ${x.entreprise}`,
  date: ACOMPTE,
  objet: "Acompte sur mon salaire de janvier",
  paragraphes: ["Je vous demande un acompte pour la quinzaine déjà travaillée."],
  montants: [{ libelle: `Viré le ${ACOMPTE}`, montant: p.acompte, fort: true }],
  mention: "Accordé et viré le jour même.",
};

const DEMANDE_D_AUGMENTATION: PieceDuBureau = {
  code: "augmentation",
  nature: "lettre",
  titre: "Lettre d'un chauffeur",
  de: "Un chauffeur",
  a: `Le dirigeant de ${x.entreprise}`,
  date: dateDuCours(p.date - 3),
  objet: "Ma rémunération",
  paragraphes: [`Je vous demande une augmentation de ${eur(g.net)} par mois, nets sur mon compte.`],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, JOURNAL, TAUX, AVIS, DEMANDE_D_ACOMPTE, DEMANDE_D_AUGMENTATION];

// ─────────────────────────────────────────────────────────────────────────────
// LE RÉCAPITULATIF
// ─────────────────────────────────────────────────────────────────────────────

/** Le récapitulatif des bulletins de janvier, du brut au net à payer et au coût employeur. */
export function grilleDuBulletin(): TableauACompleter {
  const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });
  return {
    titre: "Récapitulatif des bulletins de janvier",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Salaires bruts", cellules: [{ valeur: b.brut }] },
      { libelle: "Cotisations salariales URSSAF", cellules: [saisir(b.cotisationsSalariales.urssaf, `${eur(b.brut)} × ${pct(t.salarialUrssaf)} = ${eur(b.cotisationsSalariales.urssaf)}`, "le brut × le taux salarial URSSAF")] },
      { libelle: "Cotisations salariales de retraite", cellules: [saisir(b.cotisationsSalariales.retraite, `${eur(b.brut)} × ${pct(t.salarialRetraite)} = ${eur(b.cotisationsSalariales.retraite)}`, "le brut × le taux salarial de retraite")] },
      { libelle: "Net avant impôt", fort: true, totalDe: { plus: [0], moins: [1, 2] }, cellules: [saisir(b.netAvantImpot, `${eur(b.brut)} − ${eur(b.cotisationsSalariales.total)} = ${eur(b.netAvantImpot)}`, "le brut moins les cotisations salariales")] },
      { libelle: "Prélèvement à la source", cellules: [saisir(b.prelevementALaSource, `${eur(b.netImposable)} × ${pct(t.prelevementALaSource)} = ${eur(b.prelevementALaSource)}`, "le net imposable du journal × le taux de l'administration")] },
      { libelle: `Acompte du ${ACOMPTE}`, cellules: [{ valeur: p.acompte }] },
      { libelle: `Net à payer le ${PAIE}`, fort: true, totalDe: { plus: [3], moins: [4, 5] }, cellules: [saisir(b.netAPayer, `${eur(b.netAvantImpot)} − ${eur(b.prelevementALaSource)} − ${eur(p.acompte)} = ${eur(b.netAPayer)}`, "le net avant impôt, moins l'impôt et l'acompte")] },
      { libelle: "Cotisations patronales URSSAF", cellules: [saisir(b.cotisationsPatronales.urssaf, `${eur(b.brut)} × ${pct(t.patronalUrssaf)} = ${eur(b.cotisationsPatronales.urssaf)}`, "le brut × le taux patronal URSSAF")] },
      { libelle: "Cotisations patronales de retraite", cellules: [saisir(b.cotisationsPatronales.retraite, `${eur(b.brut)} × ${pct(t.patronalRetraite)} = ${eur(b.cotisationsPatronales.retraite)}`, "le brut × le taux patronal de retraite")] },
      { libelle: "Coût employeur", fort: true, totalDe: { plus: [0, 7, 8] }, cellules: [saisir(b.coutEmployeur, `${eur(b.brut)} + ${eur(b.cotisationsPatronales.total)} = ${eur(b.coutEmployeur)}`, "le brut et les cotisations patronales")] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

export const LA_PAIE_DE_JANVIER: Bureau = {
  code: "la-paie-de-janvier",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["la-paie"],
  commanditaire: "Le dirigeant",
  entreprise: { code: x.c.code, nom: x.entreprise },
  titre: "Au bureau : la paie de janvier",
  accroche: "Le journal de paie est arrêté. Triez les pièces, dressez le récapitulatif des bulletins, passez la paie jusqu'au 15 février, puis répondez au dirigeant et au chauffeur qui demande une augmentation.",
  objectifs: [
    "Trier les pièces de la paie : ce qui se saisit, ce qui sert au calcul, ce qui se chiffre",
    "Dresser le récapitulatif des bulletins, du brut au net à payer et au coût employeur",
    "Passer l'acompte, la paie, les cotisations patronales, le virement des nets et le règlement des organismes",
    "Remonter d'un net promis au brut et au coût employeur",
  ],
  libre: false,
  accueil: [
    `Le ${PAIE}, au bureau de ${x.entreprise}. Le journal de paie de janvier vient de sortir du logiciel ; rien n'est encore passé au journal, pas même l'acompte du ${ACOMPTE}.`,
    "Sur votre poste, le courriel du dirigeant et les pièces de la paie. Ouvrez-les une à une : rien ne vous dit ce qu'il faut en faire.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "la-pile",
      type: "classement",
      titre: "Classer la pile",
      consigne: "Ouvrez chaque pièce et dites ce qu'elle demande : une écriture, une donnée pour le calcul du bulletin, ou un calcul pour le dirigeant, sans écriture.",
      pieces: ["courriel"],
      categories: [
        { code: "a-saisir", libelle: "À saisir" },
        { code: "a-calculer", libelle: "Une donnée du bulletin" },
        { code: "a-chiffrer", libelle: "À chiffrer, sans écriture" },
      ],
      elements: [
        { code: "journal", piece: "journal", libelle: JOURNAL.titre, categorie: "a-saisir", pourquoi: "Le journal de paie arrêté se passe au journal : les salaires et les cotisations patronales." },
        { code: "taux", piece: "taux", libelle: TAUX.titre, categorie: "a-calculer", pourquoi: "Les taux font le bulletin : ils ne se saisissent pas, ils se calculent." },
        { code: "avis", piece: "avis", libelle: AVIS.titre, categorie: "a-calculer", pourquoi: "Le taux de l'administration s'applique au net imposable : une donnée du bulletin, pas une écriture." },
        { code: "acompte", piece: "acompte", libelle: DEMANDE_D_ACOMPTE.titre, categorie: "a-saisir", pourquoi: `L'acompte est parti de la banque le ${ACOMPTE} : une créance sur le salarié, à passer.` },
        { code: "augmentation", piece: "augmentation", libelle: DEMANDE_D_AUGMENTATION.titre, categorie: "a-chiffrer", pourquoi: "Une demande n'est pas une paie : elle se chiffre pour le dirigeant, elle ne s'enregistre pas." },
      ],
      explication: ["Deux pièces se saisissent, deux font le bulletin, une se chiffre pour le dirigeant. L'acompte, déjà viré, attend encore son écriture : on ne l'oublie pas en passant la paie."],
    },
    {
      id: "le-bulletin",
      type: "etat",
      titre: "Dresser le récapitulatif",
      consigne: "Complétez le récapitulatif des bulletins : les cotisations salariales, le net avant impôt, le prélèvement à la source, le net à payer après l'acompte, puis les cotisations patronales et le coût employeur.",
      pieces: ["journal", "taux", "avis"],
      grille: grilleDuBulletin(),
      explication: [
        `Les salariés reçoivent ${eur(b.verseAuxSalaries)} en tout, acompte compris. L'entreprise paie ${eur(b.coutEmployeur)} : le brut et ${eur(b.cotisationsPatronales.total)} de cotisations patronales.`,
        "Le prélèvement à la source se calcule sur le net imposable, un peu plus haut que le net avant impôt : la part de CSG et de CRDS non déductible y reste.",
      ],
    },
    {
      id: "les-ecritures",
      type: "journal",
      titre: "Passer la paie",
      consigne: "Passez les cinq écritures de la paie de janvier, dans l'ordre que vous voulez : l'acompte, les salaires, les cotisations patronales, le virement des nets, puis le règlement du 15 février.",
      pieces: ["journal", "acompte"],
      ecritures: [
        {
          id: "acompte",
          ecriture: {
            date: ACOMPTE,
            libelle: "Acompte sur salaire de janvier",
            lignes: [
              { role: "l'avance faite au salarié", compte: "425", sens: "debit", montant: p.acompte, indice: "le montant de l'acompte" },
              { role: "le paiement par la banque", compte: "512", sens: "credit", montant: p.acompte, indice: "le montant de l'acompte" },
            ],
          },
          indices: ["Ce n'est pas encore une charge : une créance sur le salarié, en attendant la paie.", "Les avances et acomptes au personnel : 425."],
        },
        {
          id: "salaires",
          ecriture: {
            date: PAIE,
            libelle: "Salaires de janvier",
            lignes: [
              { role: "les salaires bruts", compte: "641", sens: "debit", montant: b.brut, indice: "le total des salaires bruts" },
              { role: "les cotisations salariales dues à l'URSSAF", compte: "431", sens: "credit", montant: b.cotisationsSalariales.urssaf, indice: "la part salariale URSSAF" },
              { role: "les cotisations salariales dues à la caisse de retraite", compte: "437", sens: "credit", montant: b.cotisationsSalariales.retraite, indice: "la part salariale de retraite" },
              { role: "l'impôt prélevé à la source, dû à l'État", compte: "442", sens: "credit", montant: b.prelevementALaSource, indice: "le prélèvement à la source" },
              { role: "l'acompte repris sur le salaire", compte: "425", sens: "credit", montant: p.acompte, indice: "l'acompte du 15 janvier" },
              { role: "le net à payer aux salariés", compte: "421", sens: "credit", montant: b.netAPayer, indice: "le net à payer" },
            ],
          },
          indices: ["Une seule ligne au débit, le brut. Au crédit, tous ceux à qui il revient.", "L'URSSAF, la caisse de retraite, l'État, les salariés, et l'acompte qui solde le 425."],
        },
        {
          id: "patronales",
          ecriture: {
            date: PAIE,
            libelle: "Cotisations patronales de janvier",
            lignes: [
              { role: "les cotisations patronales", compte: "645", sens: "debit", montant: b.cotisationsPatronales.total, indice: "les deux parts patronales réunies" },
              { role: "la part due à l'URSSAF", compte: "431", sens: "credit", montant: b.cotisationsPatronales.urssaf, indice: "la part patronale URSSAF" },
              { role: "la part due à la caisse de retraite", compte: "437", sens: "credit", montant: b.cotisationsPatronales.retraite, indice: "la part patronale de retraite" },
            ],
          },
          indices: ["Une charge de l'entreprise, en plus du brut.", "Au crédit, les deux organismes, chacun pour sa part."],
        },
        {
          id: "virement",
          ecriture: {
            date: PAIE,
            libelle: "Virement des salaires nets",
            lignes: [
              { role: "la dette envers les salariés qui s'éteint", compte: "421", sens: "debit", montant: b.netAPayer, indice: "le net à payer" },
              { role: "le paiement par la banque", compte: "512", sens: "credit", montant: b.netAPayer, indice: "le net à payer" },
            ],
          },
          indices: ["La dette envers les salariés disparaît.", "La banque paie."],
        },
        {
          id: "organismes",
          ecriture: {
            date: ECHEANCE,
            libelle: "Cotisations et prélèvement à la source de janvier",
            lignes: [
              { role: "la dette envers l'URSSAF qui s'éteint", compte: "431", sens: "debit", montant: v.urssaf, indice: "les parts salariale et patronale URSSAF réunies" },
              { role: "la dette envers la caisse de retraite qui s'éteint", compte: "437", sens: "debit", montant: v.retraite, indice: "les deux parts de retraite réunies" },
              { role: "la dette envers l'État qui s'éteint", compte: "442", sens: "debit", montant: v.etat, indice: "le prélèvement à la source" },
              { role: "le paiement par la banque", compte: "512", sens: "credit", montant: v.total, indice: "les trois dettes réunies" },
            ],
          },
          indices: ["Trois dettes s'éteignent, chacune pour le solde qu'elle porte.", "Une seule sortie de banque, pour le total."],
        },
      ],
      explication: [`La paie de janvier fait sortir ${eur(p.sortiesDeBanque)} de la banque, en trois fois : ${eur(p.acompte)} le ${ACOMPTE}, ${eur(b.netAPayer)} le ${PAIE}, ${eur(v.total)} le ${ECHEANCE}. C'est le coût employeur, ni plus ni moins.`],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au dirigeant",
      consigne: "Répondez aux questions du courriel, chiffres à l'appui.",
      pieces: ["courriel", "augmentation"],
      questions: [
        {
          id: "le-cout",
          question: "Que nous coûte le personnel de janvier ?",
          options: [
            { texte: eur(b.coutEmployeur), juste: true, retour: `Oui : le brut, ${eur(b.brut)}, et les cotisations patronales, ${eur(b.cotisationsPatronales.total)}, les comptes 641 et 645.` },
            { texte: `${eur(b.verseAuxSalaries)}, ce que les salariés ont reçu`, juste: false, retour: "Non : l'entreprise paie aussi, pour eux, les cotisations salariales et l'impôt prélevé, puis ses propres cotisations." },
            { texte: `${eur(b.brut)}, les salaires bruts`, juste: false, retour: "Non : les cotisations patronales s'ajoutent au brut ; elles sont une charge de l'entreprise." },
            { texte: `${eur(auCentime(b.coutEmployeur + b.prelevementALaSource))}, avec le prélèvement à la source`, juste: false, retour: "Non : le prélèvement fait partie du brut, c'est l'impôt du salarié. Le compter en plus le compterait deux fois." },
          ],
        },
        {
          id: "le-brut",
          question: `Pour ${eur(g.net)} nets de plus par mois, que mettre en brut ?`,
          options: [
            { texte: eur(g.brut), juste: true, retour: `Oui : le plus petit brut dont le bulletin verse ${eur(g.net)} nets, prélèvement à la source retenu.` },
            { texte: `${eur(g.net)}, le même montant`, juste: false, retour: `Non : sur ${eur(g.net)} bruts, le chauffeur ne recevrait que ${eur(g.netSiBrutEgalNet)}. Les cotisations salariales et l'impôt se retiennent.` },
            { texte: `${eur(auCentime(g.net * (1 + t.salarialUrssaf + t.salarialRetraite)))}, le net plus les cotisations salariales`, juste: false, retour: "Non : les cotisations se calculent sur le brut, pas sur le net ; et le prélèvement à la source se retient aussi." },
          ],
        },
        {
          id: "le-cout-de-l-augmentation",
          question: "Que coûtera cette augmentation à l'entreprise, par mois ?",
          options: [
            { texte: eur(g.cout), juste: true, retour: `Oui : ${eur(g.brut)} bruts et leurs cotisations patronales, ${pct(t.patronalUrssaf + t.patronalRetraite)}. Soit ${eur(g.parAn)} sur l'année.` },
            { texte: `${eur(g.brut)}, le brut de l'augmentation`, juste: false, retour: "Non : les cotisations patronales s'ajoutent au brut." },
            { texte: `${eur(g.net)}, ce que touche le chauffeur`, juste: false, retour: "Non : pour verser un net, l'entreprise paie le brut et ses cotisations patronales." },
          ],
        },
      ],
      explication: [`Votre réponse : le personnel de janvier coûte ${eur(b.coutEmployeur)} ; la paie fait sortir autant de la banque, en trois fois ; ${eur(g.net)} nets demandent ${eur(g.brut)} bruts et coûtent ${eur(g.cout)} par mois.`],
    },
  ],
};
