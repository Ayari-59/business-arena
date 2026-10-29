import { enEcriture, montantEcrit, type EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import { auCentime, bilan, compteDeResultat, soldes, tvaNette } from "../../../pedagogy/cours/etats";
import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import { accordPluriel } from "../accords";
import type { Cas, Facture } from "../cas";
import { dateDuCours as date } from "../dates";
import { joursCompris, JOURS_DE_L_ANNEE } from "../monde/amortissement";
import type { Ecriture } from "../../../pedagogy/cours/etats";
import type { Chapitre, EtatDuCours, Piece, TableauDeDonnees } from "../types";

/**
 * CHAPITRE PILOTE : DE LA CRÉATION AU PREMIER BILAN (comptabilité générale, palier 2 ; BTS CG,
 * DCG UE9, BUT GEA).
 *
 * Un mois de la vie d'une entreprise qu'on crée, opération par opération : les apports, l'emprunt,
 * le loyer, l'équipement, un achat et deux ventes, la paie, puis la TVA, le compte de résultat et le
 * bilan du 31 janvier, que l'élève construit lui-même à partir de son journal. On finit par les
 * échéances (le fournisseur et l'URSSAF payés, le client qui règle) et le constat qui ouvre la
 * suite du cours : le résultat n'a pas bougé, la trésorerie si. Puis le mois vu par un examinateur :
 * la banque remontée à rebours, le bilan du mois complet à partir de la seule balance, et la
 * critique du résultat annoncé.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : les montants sont ceux du cas figé de l'entreprise
 * choisie (monde/cas-des-entreprises.ts, lu par `casDeLEntreprise`), dans les NEUF entreprises du
 * cours (décision du propriétaire). Les expériences se calculent sur ce cas, sans l'arène.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, apport, emprunt, loyer, immobilisation, achat, vente-credit, bulletin, paie,
 *     versement-salaires, vente-comptant (chaque ligne d'écriture est nommée, le compte se cherche
 *     dans les indices ; le bulletin donne les taux et nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-tva puis
 *     la-tva-de-l-equipement (un curseur sur le prix de l'équipement : la TVA collectée face à la TVA
 *     déductible, TVA due ou crédit de TVA) avant tva-nette ; predire-la-banque puis
 *     le-laboratoire-de-la-tresorerie (le délai du client, ses ventes à crédit, le délai du
 *     fournisseur et le jour du règlement de l'URSSAF : la banque bouge, le résultat jamais) avant
 *     du-resultat-a-la-banque ;
 *   · autonome : tva-nette, resultat, bilan, du-resultat-a-la-banque, les trois règlements des
 *     échéances (ni formule ni chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : a-rebours (retrouver les ventes au comptant à partir du seul relevé de banque),
 *     le-mois-complet (le bilan de janvier à partir de la seule balance, avec l'usure de
 *     l'équipement et les intérêts courus du mois), critique (ce résultat est-il celui du mois ?) ;
 *     puis la synthèse.
 *
 * AUDIT PÉDAGOGIQUE (P1-4, P1-8) : le chapitre faisait trente étapes, et c'est la démonstration
 * libre du cours. Il s'arrête maintenant au bilan du 31 janvier (dix-neuf étapes, avec la synthèse) ;
 * la trésorerie, les échéances et le niveau de l'examen forment la suite, DU_RESULTAT_A_LA_TRESORERIE
 * (plus bas), qui repart de la balance du 31 janvier. Les étapes, leurs textes et leurs chiffres
 * n'ont pas changé.
 *
 * Ce qui a disparu, pour resserrer le guidé : le calcul guidé de la facture de l'équipement (la pièce
 * la donne), le solde de la banque en une étape à part (il entre au bilan), les cotisations
 * patronales en écriture séparée (la paie se passe en une écriture), les questions « coût du
 * personnel » (le bulletin le calcule), « TVA collectée » (le pari et le curseur la travaillent) et
 * « résultat et trésorerie » (le laboratoire et le passage du résultat à la banque la remplacent).
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE PLAFOND LÉGAL DES DÉLAIS DE PAIEMENT ENTRE PROFESSIONNELS : 60 jours à compter de la facture
 * (code de commerce, art. L441-10). DÉCISION DU PROPRIÉTAIRE : chez NOVA, le délai convenu avec
 * CampusTech est ce plafond, et CampusTech paie à 80 jours, 20 jours en retard ; les montants ne
 * changent pas. Le chapitre applique la même lecture à tout client dont le cas dépasse le plafond :
 * la facture porte le délai convenu, le règlement arrive au délai du cas.
 */
export const PLAFOND_DES_DELAIS_ENTRE_PROFESSIONNELS = 60;

/** Le titre de la suite (la seconde moitié du mois), que la fin du premier chapitre annonce. */
export const TITRE_DE_LA_SUITE = "Du résultat à la trésorerie : les échéances du premier mois";

/** Le dernier jour du mois du chapitre : ce qui se règle au plus tard ce jour-là passe par la banque de janvier. */
export const FIN_DE_JANVIER = 31;

/** Les bornes des délais du laboratoire, en jours : le client, le fournisseur, l'URSSAF après la paie. */
export const DELAIS_DU_LABORATOIRE = { client: 90, fournisseur: 60, urssaf: 30 } as const;

/** Le seuil du défi du laboratoire s'arrondit au millier d'euros inférieur. */
export const ARRONDI_DU_DEFI = 1_000;

/** La borne haute du curseur de l'équipement s'arrondit à la dizaine de milliers d'euros supérieure. */
export const ARRONDI_DU_CURSEUR = 10_000;

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS
// ─────────────────────────────────────────────────────────────────────────────

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const majuscule = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
/** La minuscule d'un libellé en tête de phrase, sauf devant un sigle (« TVA due à l'État »). */
const minuscule = (s: string) => (/^[A-ZÉ][a-zé]/.test(s) ? `${s.charAt(0).toLowerCase()}${s.slice(1)}` : s);
/** Un terme d'une somme : « + 13 500 € » ou « − 34 500 € ». */
const terme = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);
/** « de NOVA », « d'ATLAS CONSEIL », « d'Hygiène Pro » : l'élision devant une voyelle ou un h muet. */
export const dE = (nom: string) => (/^([aeiouyéèêAEIOUYÉÈ]|[Hh][yéèêô])/.test(nom) ? `d'${nom}` : `de ${nom}`);

const banqueDe = (e: EtatDuCours) => e.soldes["512"] ?? 0;

/**
 * Le client nommé court, pour qu'il tienne dans une phrase : sans la précision qui suit la virgule,
 * et « le cabinet médical » plutôt que « un cabinet médical qui rénove ses locaux ».
 */
export function nomDuClient(client: string): string {
  const court = client.split(",")[0]!.trim();
  const m = /^un (.+?) qui /.exec(court);
  return m ? `le ${m[1]}` : court;
}

/** « de » devant un nom, contracté comme en français : du groupe, de la société, de l'agence. */
export const deNom = (nom: string) => (nom.startsWith("le ") ? `du ${nom.slice(3)}` : nom.startsWith("les ") ? `des ${nom.slice(4)}` : dE(nom));

/** « à » devant un nom, contracté : au groupe, à la société, à l'agence. */
export const aNom = (nom: string) => (nom.startsWith("le ") ? `au ${nom.slice(3)}` : nom.startsWith("les ") ? `aux ${nom.slice(4)}` : `à ${nom}`);

/**
 * Le délai du client professionnel : celui que porte le cas (le jour où il paie vraiment), celui que
 * la facture convient (au plus le plafond légal), et le retard entre les deux.
 */
export function delaiDuClient(c: Pick<Cas, "venteCredit">) {
  const reel = c.venteCredit.delai;
  const convenu = Math.min(reel, PLAFOND_DES_DELAIS_ENTRE_PROFESSIONNELS);
  return { reel, convenu, retard: reel - convenu, echeanceConvenue: c.venteCredit.date + convenu };
}

/** « paie à 80 jours, 20 jours au-delà des 60 jours convenus », ou « paie à 45 jours ». */
export function paiementDuClient(c: Pick<Cas, "venteCredit">) {
  const d = delaiDuClient(c);
  return d.retard > 0 ? `paie à ${qte(d.reel)} jours, ${qte(d.retard)} jours au-delà des ${qte(d.convenu)} jours convenus` : `paie à ${qte(d.reel)} jours`;
}

function facturePiece(args: { nature: string; de: string; a: string; quand: number; designation: string; f: Facture; mention?: string }): Piece {
  const { f } = args;
  return {
    nature: args.nature,
    de: args.de,
    a: args.a,
    date: date(args.quand),
    lignes: [{ libelle: args.designation, quantite: qte(f.quantite), prixUnitaire: f.prixUnitaire, montant: f.ht }],
    totaux: [
      { libelle: "Total hors taxes", montant: f.ht },
      { libelle: `TVA ${pct(f.tauxTva)}`, montant: f.tva },
      { libelle: "Total TTC", montant: f.ttc, fort: true },
    ],
    mention: args.mention,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES ÉCRITURES DU MOIS (une seule source : les étapes et la balance du chapitre)
// ─────────────────────────────────────────────────────────────────────────────

const cotisationsDe = (c: Cas) => auCentime(c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales);

const ecritureDeLApport = (c: Cas): EcritureAttendue => ({
  date: date(c.dates.capital),
  libelle: "Apport en capital",
  lignes: [
    { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: c.capital, indice: "la somme versée par les associés" },
    { role: "l'apport des associés", compte: "101", acceptes: ["108"], sens: "credit", montant: c.capital, indice: "la somme versée par les associés" },
  ],
});

const ecritureDeLEmprunt = (c: Cas): EcritureAttendue => ({
  date: date(c.dates.emprunt),
  libelle: "Emprunt bancaire",
  lignes: [
    { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: c.emprunt, indice: "le montant prêté" },
    { role: "la dette envers la banque", compte: "164", acceptes: ["1641"], sens: "credit", montant: c.emprunt, indice: "le montant prêté" },
  ],
});

const ecritureDuLoyer = (c: Cas): EcritureAttendue => ({
  date: date(c.loyer.date),
  libelle: "Loyer de janvier",
  lignes: [
    { role: "le loyer, consommé dans le mois", compte: "6132", acceptes: ["613"], sens: "debit", montant: c.loyer.montant, indice: "le montant de la quittance" },
    { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.loyer.montant, indice: "le montant de la quittance" },
  ],
});

const ecritureDeLEquipement = (c: Cas): EcritureAttendue => ({
  date: date(c.immobilisation.date),
  libelle: `Achat : ${c.immobilisation.designation}`,
  lignes: [
    { role: "l'équipement, au prix hors taxes", compte: c.immobilisation.compte, acceptes: c.immobilisation.acceptes, sens: "debit", montant: c.immobilisation.ht, indice: "le montant hors taxes de la facture" },
    { role: "la TVA déductible", compte: "44562", acceptes: ["44566"], sens: "debit", montant: c.immobilisation.tva, indice: "le montant de TVA de la facture" },
    { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.immobilisation.ttc, indice: "ce que la banque a réellement payé, taxes comprises" },
  ],
});

const ecritureDeLAchat = (c: Cas): EcritureAttendue => ({
  date: date(c.achat.date),
  libelle: `Facture ${c.achat.fournisseur}`,
  lignes: [
    { role: "l'achat, au prix hors taxes", compte: c.achat.compte, acceptes: c.achat.acceptes, sens: "debit", montant: c.achat.ht, indice: "le montant hors taxes de la facture" },
    { role: "la TVA déductible", compte: "44566", sens: "debit", montant: c.achat.tva, indice: "le montant de TVA de la facture" },
    { role: "la dette envers le fournisseur", compte: "401", sens: "credit", montant: c.achat.ttc, indice: "ce que l'entreprise devra payer, taxes comprises" },
  ],
});

const ecritureDeLaVenteACredit = (c: Cas): EcritureAttendue => ({
  date: date(c.venteCredit.date),
  libelle: "Facture de vente à échéance",
  lignes: [
    { role: "la créance sur le client", compte: "411", sens: "debit", montant: c.venteCredit.ttc, indice: "ce que le client devra payer, taxes comprises" },
    { role: "la vente, au prix hors taxes", compte: c.venteCredit.compte, acceptes: c.venteCredit.acceptes, sens: "credit", montant: c.venteCredit.ht, indice: "le montant hors taxes de la facture" },
    { role: "la TVA collectée", compte: "44571", sens: "credit", montant: c.venteCredit.tva, indice: "le montant de TVA de la facture" },
  ],
});

const ecritureDeLaPaie = (c: Cas): EcritureAttendue => ({
  date: date(c.personnel.date),
  libelle: "Salaires de janvier",
  lignes: [
    { role: "les salaires bruts", compte: "641", sens: "debit", montant: c.personnel.brut, indice: "le total des salaires bruts" },
    { role: "les cotisations patronales", compte: "645", sens: "debit", montant: c.personnel.cotisationsPatronales, indice: "la part patronale du journal de paie" },
    { role: "les cotisations dues aux organismes sociaux", compte: "431", acceptes: ["437"], sens: "credit", montant: cotisationsDe(c), indice: "les cotisations salariales et patronales réunies" },
    { role: "le net dû aux salariés", compte: "421", sens: "credit", montant: c.personnel.net, indice: "ce que les salariés recevront" },
  ],
});

const ecritureDuVersementDesSalaires = (c: Cas): EcritureAttendue => ({
  date: date(c.personnel.date),
  libelle: "Virement des salaires nets",
  lignes: [
    { role: "la dette envers les salariés qui s'éteint", compte: "421", sens: "debit", montant: c.personnel.net, indice: "le net à payer" },
    { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.personnel.net, indice: "le net à payer" },
  ],
});

const ecritureDesVentesAuComptant = (c: Cas): EcritureAttendue => ({
  date: date(c.venteComptant.date),
  libelle: "Ventes au comptant de janvier",
  lignes: [
    { role: "l'argent encaissé en banque", compte: "512", acceptes: ["530"], sens: "debit", montant: c.venteComptant.ttc, indice: "ce que les clients ont payé, taxes comprises" },
    { role: "les ventes, au prix hors taxes", compte: c.venteComptant.compte, acceptes: c.venteComptant.acceptes, sens: "credit", montant: c.venteComptant.ht, indice: "le montant hors taxes des ventes" },
    { role: "la TVA collectée", compte: "44571", sens: "credit", montant: c.venteComptant.tva, indice: "la TVA sur ces ventes" },
  ],
});

/** Les écritures du mois de janvier, dans l'ordre du chapitre, avant les échéances. */
const ECRITURES_DE_JANVIER = [
  ecritureDeLApport,
  ecritureDeLEmprunt,
  ecritureDuLoyer,
  ecritureDeLEquipement,
  ecritureDeLAchat,
  ecritureDeLaVenteACredit,
  ecritureDeLaPaie,
  ecritureDuVersementDesSalaires,
  ecritureDesVentesAuComptant,
] as const;

/** Les soldes des comptes au 31 janvier, le journal du mois passé (débiteur positif). */
export function soldesDeJanvier(c: Cas): Record<string, number> {
  return soldes(ECRITURES_DE_JANVIER.map((f) => enEcriture(f(c))));
}

// ─────────────────────────────────────────────────────────────────────────────
// LE MOIS DE JANVIER, ET CE QUE LES EXPÉRIENCES EN FONT
// ─────────────────────────────────────────────────────────────────────────────

/** Tout ce que le chapitre dit du mois de janvier, calculé sur le cas. */
export function janvierDe(c: Cas) {
  const s = soldesDeJanvier(c);
  const cr = compteDeResultat(s);
  const b = bilan(s);
  const collectee = auCentime(c.venteCredit.tva + c.venteComptant.tva);
  const deductible = auCentime(c.immobilisation.tva + c.achat.tva);
  const banque = s["512"] ?? 0;
  const cotisations = cotisationsDe(c);
  const variation = auCentime(banque - c.capital - c.emprunt);
  // LE CALCUL À REBOURS : ce que les ventes au comptant ont encaissé, à partir du seul relevé de banque.
  const comptantTtc = auCentime(banque - c.capital - c.emprunt + c.loyer.montant + c.immobilisation.ttc + c.personnel.net);
  const comptantHt = auCentime(comptantTtc / (1 + c.venteComptant.tauxTva));
  const comptantQuantite = Math.round(comptantHt / c.venteComptant.prixUnitaire);
  // LE MOIS COMPLET : l'usure de l'équipement depuis sa mise en service, et les intérêts nés depuis le
  // versement des fonds, en mois de 30 jours, jour de départ et jour d'arrivée compris.
  const dureeAns = c.gestion.dureeAmortissementMois / 12;
  const joursDeService = joursCompris({ jour: c.immobilisation.date, mois: 1 }, { jour: FIN_DE_JANVIER, mois: 1 });
  const joursDInterets = joursCompris({ jour: c.dates.emprunt, mois: 1 }, { jour: FIN_DE_JANVIER, mois: 1 });
  const dotation = auCentime((c.immobilisation.ht * joursDeService) / (dureeAns * JOURS_DE_L_ANNEE));
  const interets = auCentime((c.emprunt * c.pret.tauxAnnuel * joursDInterets) / JOURS_DE_L_ANNEE);
  const complet = bilan({ ...s, "6811": dotation, "281": -dotation, "6611": interets, "1688": -interets });
  return {
    soldes: s,
    produits: cr.totalProduits,
    charges: cr.totalCharges,
    resultat: cr.resultat,
    collectee,
    deductible,
    tvaNette: auCentime(collectee - deductible),
    banque,
    cotisations,
    variation,
    creances: c.venteCredit.ttc,
    dettes: auCentime(c.achat.ttc + cotisations),
    totalActif: b.totalActif,
    totalPassif: b.totalPassif,
    comptantTtc,
    comptantHt,
    comptantQuantite,
    dureeAns,
    joursDeService,
    joursDInterets,
    dotation,
    interets,
    resultatComplet: complet.resultat,
    totalComplet: complet.totalActif,
  };
}

/**
 * LE CURSEUR DE LA TVA : le prix hors taxes de l'équipement le plus élevé où la TVA collectée du mois
 * couvre encore la TVA déductible (celle des achats, plus celle de l'équipement), à l'euro près.
 */
export function limiteDeLEquipement(c: Cas) {
  const j = janvierDe(c);
  return Math.floor((j.collectee - c.achat.tva) / c.immobilisation.tauxTva + 1e-9);
}

/** La borne haute du curseur de l'équipement : le double du plus grand des deux prix, arrondi. */
export function borneDuCurseur(c: Cas) {
  return Math.ceil((2 * Math.max(c.immobilisation.ht, limiteDeLEquipement(c))) / ARRONDI_DU_CURSEUR) * ARRONDI_DU_CURSEUR;
}

/** Une position du laboratoire de la trésorerie. */
export interface PositionDeLaTresorerie {
  /** Le délai du client professionnel, en jours après sa facture. */
  delaiClient: number;
  /** Les ventes du mois facturées à crédit, toutes taxes comprises ; le reste est payé à la commande. */
  aCredit: number;
  /** Le délai du fournisseur, en jours après sa facture. */
  delaiFournisseur: number;
  /** Le règlement des cotisations à l'URSSAF, en jours après la paie. */
  joursUrssaf: number;
}

/** La position du cas : celle d'où part le laboratoire. */
export function departDeLaTresorerie(c: Cas): PositionDeLaTresorerie {
  return {
    delaiClient: c.venteCredit.delai,
    aCredit: c.venteCredit.ttc,
    delaiFournisseur: c.achat.delai,
    joursUrssaf: c.personnel.dateUrssaf - c.personnel.date,
  };
}

/** Les ventes du mois, toutes taxes comprises : le plus que le client peut acheter à crédit. */
export const ventesDuMoisTtc = (c: Cas) => auCentime(c.venteCredit.ttc + c.venteComptant.ttc);

/**
 * LE LABORATOIRE DE LA TRÉSORERIE : la banque, les créances et les dettes au 31 janvier pour des
 * délais et une part de ventes à crédit quelconques. Le résultat ne dépend d'aucun levier : les
 * charges et les produits naissent à la facture, quels que soient les règlements.
 */
export function tresorerieDeJanvier(c: Cas, p: PositionDeLaTresorerie) {
  const j = janvierDe(c);
  const comptant = auCentime(ventesDuMoisTtc(c) - p.aCredit);
  const clientPaye = c.venteCredit.date + p.delaiClient <= FIN_DE_JANVIER;
  const fournisseurPaye = c.achat.date + p.delaiFournisseur <= FIN_DE_JANVIER;
  const urssafPayee = c.personnel.date + p.joursUrssaf <= FIN_DE_JANVIER;
  const banque = auCentime(
    c.capital + c.emprunt - c.loyer.montant - c.immobilisation.ttc - c.personnel.net + comptant + (clientPaye ? p.aCredit : 0) - (fournisseurPaye ? c.achat.ttc : 0) - (urssafPayee ? j.cotisations : 0),
  );
  return {
    resultat: j.resultat,
    banque,
    variation: auCentime(banque - c.capital - c.emprunt),
    creances: clientPaye ? 0 : p.aCredit,
    fournisseur: fournisseurPaye ? 0 : c.achat.ttc,
    urssaf: urssafPayee ? 0 : j.cotisations,
  };
}

/** Le seuil du défi : la banque du départ plus la facture du client, arrondie au millier inférieur. */
export function seuilDuDefi(c: Cas) {
  const d = tresorerieDeJanvier(c, departDeLaTresorerie(c));
  return Math.floor((d.banque + c.venteCredit.ttc) / ARRONDI_DU_DEFI) * ARRONDI_DU_DEFI;
}

/** La balance du 31 janvier, compte par compte, telle qu'un examinateur la donne. */
function balanceDeJanvier(c: Cas): TableauDeDonnees {
  const s = soldesDeJanvier(c);
  const comptes = Object.keys(s)
    .filter((k) => s[k] !== 0)
    .sort();
  return {
    titre: `La balance ${dE(c.entreprise)} au 31 janvier`,
    colonnes: ["Solde débiteur", "Solde créditeur"],
    lignes: comptes.map((k) => ({ libelle: `${k} ${intituleDe(k)}`, valeurs: s[k]! > 0 ? [eur(s[k]!), ""] : ["", eur(-s[k]!)] })),
  };
}

/** Le relevé de banque de janvier sans les ventes au comptant : le document du calcul à rebours. */
function releveSansLesVentes(c: Cas): TableauDeDonnees {
  const j = janvierDe(c);
  return {
    titre: `Le relevé de banque ${dE(c.entreprise)}, janvier`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Apport des associés", valeurs: [`+ ${eur(c.capital)}`] },
      { libelle: "Fonds du prêt", valeurs: [`+ ${eur(c.emprunt)}`] },
      { libelle: "Loyer de janvier", valeurs: [`− ${eur(c.loyer.montant)}`] },
      { libelle: `Équipement : ${c.immobilisation.designation}`, valeurs: [`− ${eur(c.immobilisation.ttc)}`] },
      { libelle: "Salaires nets", valeurs: [`− ${eur(c.personnel.net)}`] },
      { libelle: "Ventes au comptant", valeurs: ["illisible"] },
      { libelle: "Solde au 31 janvier", valeurs: [eur(j.banque)] },
    ],
  };
}

const resultatDit = (x: number) => (x >= 0 ? `un bénéfice de ${eur(x)}` : `une perte de ${eur(-x)}`);
const tvaDite = (x: number) => (x >= 0 ? `${eur(x)} de TVA due à l'État` : `un crédit de TVA de ${eur(-x)}`);

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const CREATION_PREMIER_BILAN: Chapitre = {
  code: "creation-premier-bilan",
  parcours: "comptabilite-generale",
  palier: 2,
  blocs: [
    "BTS CG P1 · Contrôle et traitement comptable des opérations commerciales",
    "BTS CG P2 · Contrôle et production de l'information financière",
    "BTS CG P3 · Gestion des obligations fiscales",
    "BTS CG P4 · Gestion des relations sociales",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "De la création au premier bilan",
  accroche:
    "Un mois de la vie d'une entreprise qu'on crée : vous passez chaque écriture, faites bouger la TVA dans la simulation, puis construisez vous-même son compte de résultat et son bilan.",
  objectifs: [
    "Passer une écriture en partie double dans le journal",
    "Distinguer une charge, une immobilisation et un simple règlement",
    "Calculer la TVA du mois et dire s'il s'agit d'une TVA due ou d'un crédit de TVA",
    "Enregistrer la paie : salaires bruts, cotisations, net à payer, règlement à l'URSSAF",
    "Construire le compte de résultat et le bilan à partir du journal",
  ],
  libre: true,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La partie double",
      notions: ["balance_sheet"],
      texte: (c) => [
        `Ce chapitre se joue dans la simulation du cours : le premier mois ${dE(c.entreprise)}, figé, aux montants de son métier. Vous tenez sa comptabilité depuis sa création, le 1er janvier. Chaque opération arrive avec sa pièce : un relevé de banque, une facture, une quittance. Vous l'enregistrez dans le journal ; puis un curseur fait bouger le mois, pour voir ce que chaque montant change dans les comptes.`,
        `Ce que la simulation suppose : un seul achat, consommé dans le mois (il n'y a pas de stock) ; deux ventes, l'une à un client professionnel payable à échéance, l'autre au comptant ; une TVA due dès la facture (c'est la règle d'une vente de biens ; pour un service, elle n'est due qu'à l'encaissement, sauf option pour les débits : pour garder le même calcul dans toutes les entreprises, ce chapitre la compte dès la facture, comme si l'option était prise, alors que plus loin dans le cours ATLAS CONSEIL et MARTEL & FILS n'ont pas opté) ; des jours comptés en mois de 30 jours.`,
        "Une opération s'écrit toujours deux fois, sur deux comptes au moins : c'est la partie double. Quand l'entreprise reçoit 100 € sur son compte bancaire, il faut dire aussi d'où ils viennent.",
        "Les comptes portent un numéro. Le premier chiffre dit leur famille : 1 les capitaux, 2 les immobilisations, 4 les tiers (clients, fournisseurs, État), 5 la trésorerie, 6 les charges, 7 les produits. Le plan de comptes du cours reste ouvert à côté du journal.",
      ],
      repere: () =>
        "Au débit, ce que l'entreprise reçoit ou consomme (l'emploi). Au crédit, d'où cela vient (la ressource). Dans chaque écriture, le total du débit est égal au total du crédit.",
    },
    {
      id: "apport",
      type: "ecriture",
      titre: "Les apports des associés",
      notions: ["balance_sheet"],
      evenement: (c) =>
        `Le ${date(c.dates.capital)}, les associés ${dE(c.entreprise)} versent ${eur(c.capital)} sur le compte bancaire de l'entreprise : c'est leur apport en capital.`,
      piece: (c) => ({
        nature: "Relevé bancaire",
        de: "Votre banque",
        a: c.entreprise,
        date: date(c.dates.capital),
        lignes: [{ libelle: "Virement reçu des associés : apport en capital", montant: c.capital }],
        totaux: [{ libelle: "Crédit en votre faveur", montant: c.capital, fort: true }],
      }),
      ecriture: ecritureDeLApport,
      indices: () => [
        "L'argent arrive sur le compte bancaire de l'entreprise : c'est un compte de trésorerie, classe 5.",
        "D'où vient-il ? Des associés, qui apportent le capital de départ : classe 1.",
      ],
      explication: (c) => [
        `La banque reçoit ${eur(c.capital)} : c'est ce que l'entreprise reçoit, au débit du 512.`,
        "Le capital dit d'où vient cet argent : des associés. C'est une ressource durable, au crédit du 101. L'entreprise ne la rembourse pas, mais elle la doit à ses associés : elle figure au passif.",
        "Le bilan s'équilibre déjà : à l'actif, ce que l'entreprise possède (la banque) ; au passif, d'où cela vient (le capital).",
      ],
      vue: "bilan",
    },
    {
      id: "emprunt",
      type: "ecriture",
      titre: "L'emprunt bancaire",
      notions: ["loan_schedule"],
      evenement: (c) => `Le ${date(c.dates.emprunt)}, la banque accorde un prêt de ${eur(c.emprunt)} à ${c.entreprise} et verse les fonds sur son compte.`,
      piece: (c) => ({
        nature: "Contrat de prêt et relevé bancaire",
        de: "Votre banque",
        a: c.entreprise,
        date: date(c.dates.emprunt),
        lignes: [{ libelle: "Déblocage des fonds du prêt", montant: c.emprunt }],
        totaux: [{ libelle: "Crédit en votre faveur", montant: c.emprunt, fort: true }],
        mention: `Taux annuel ${pct(c.pret.tauxAnnuel)}. Remboursement par échéances, intérêts en sus.`,
      }),
      ecriture: ecritureDeLEmprunt,
      indices: () => ["Comme pour l'apport, l'argent arrive en banque.", "Cette fois, il vient d'un prêteur qu'il faudra rembourser : une dette financière, classe 1 aussi."],
      explication: (c, e) => [
        `La banque de l'entreprise atteint ${eur(banqueDe(e))}. L'emprunt de ${eur(c.emprunt)} est une ressource, comme le capital, mais elle se rembourse : c'est une dette, au passif.`,
      ],
      vue: "bilan",
    },
    {
      id: "emprunt-charge",
      type: "choix",
      titre: "Un emprunt, une charge ?",
      notions: ["loan_schedule"],
      question: (c) => `Les ${eur(c.emprunt)} empruntés sont-ils une charge de janvier pour ${c.entreprise} ?`,
      options: () => [
        {
          texte: "Oui : emprunter coûte de l'argent.",
          juste: false,
          retour: "Ce qui coûte, ce sont les intérêts, qui courent jour après jour et se paient aux échéances : eux sont des charges (compte 661). Le capital emprunté, lui, se rend.",
        },
        {
          texte: "Non : c'est une ressource, une dette qu'il faudra rembourser.",
          juste: true,
          retour: "Exactement. L'emprunt ne change pas le résultat : il ajoute la même somme à l'actif (la banque) et au passif (la dette).",
        },
        {
          texte: "Non : c'est un produit, l'entreprise s'enrichit.",
          juste: false,
          retour: "L'entreprise n'est pas plus riche : elle a reçu de l'argent qu'elle doit rendre. L'actif et le passif augmentent ensemble.",
        },
      ],
    },
    {
      id: "loyer",
      type: "ecriture",
      titre: "Le loyer du local",
      notions: ["fixed_costs"],
      evenement: (c) =>
        `Le ${date(c.loyer.date)}, le loyer de janvier du local est prélevé : ${eur(c.loyer.montant)}. Le bailleur n'a pas opté pour la TVA : la quittance est sans TVA.`,
      piece: (c) => ({
        nature: "Quittance de loyer",
        de: "Le bailleur",
        a: c.entreprise,
        date: date(c.loyer.date),
        lignes: [{ libelle: "Loyer du local, mois de janvier", montant: c.loyer.montant }],
        totaux: [{ libelle: "Net à payer, prélevé", montant: c.loyer.montant, fort: true }],
      }),
      ecriture: ecritureDuLoyer,
      indices: () => [
        "L'occupation du local pendant janvier est consommée dans le mois : c'est une charge, classe 6 (les locations).",
        "La banque paie : l'argent sort, au crédit du compte de trésorerie.",
      ],
      explication: (c) => [
        `Le loyer est une charge : ${c.entreprise} a consommé un mois d'occupation du local. Il entre au compte de résultat, au débit du 6132.`,
        "Premier effet sur le résultat : sans aucune vente encore, il est négatif du montant du loyer.",
      ],
      vue: "resultat",
    },
    {
      id: "immobilisation",
      type: "ecriture",
      titre: "L'achat de l'équipement",
      notions: ["depreciation", "vat_payable"],
      evenement: (c) =>
        `Le ${date(c.immobilisation.date)}, ${c.entreprise} reçoit son équipement, ${qte(c.immobilisation.quantite)} × « ${c.immobilisation.designation} », le met en service et règle la facture par virement.`,
      piece: (c) =>
        facturePiece({
          nature: "Facture d'achat",
          de: "Le fournisseur d'équipement",
          a: c.entreprise,
          quand: c.immobilisation.date,
          designation: c.immobilisation.designation,
          f: c.immobilisation,
          mention: "Réglée par virement à réception.",
        }),
      ecriture: ecritureDeLEquipement,
      indices: (c) => [
        `L'équipement va servir plusieurs années : ce n'est pas une charge du mois, c'est une immobilisation, classe 2. Cherchez le compte qui correspond à « ${c.immobilisation.designation} ».`,
        "Trois lignes : l'équipement hors taxes, la TVA que l'État rendra (classe 4, TVA déductible sur immobilisations), et la banque qui paie le TTC.",
      ],
      explication: (c) => [
        `L'équipement entre à l'actif pour ${eur(c.immobilisation.ht)} hors taxes, au compte ${c.immobilisation.compte} (${intituleDe(c.immobilisation.compte)}). Il appartient à l'entreprise et servira plusieurs années : c'est une immobilisation.`,
        `La TVA de ${eur(c.immobilisation.tva)} (${eur(c.immobilisation.ht)} × ${pct(c.immobilisation.tauxTva)}) n'est pas un coût : l'entreprise la récupère sur l'État. C'est une créance, au compte 44562.`,
        `La banque a payé ${eur(c.immobilisation.ttc)}. L'actif n'a pas grossi : de l'argent est devenu un équipement et une créance de TVA.`,
      ],
      vue: "bilan",
    },
    {
      id: "immo-resultat",
      type: "choix",
      titre: "Un équipement, une charge ?",
      notions: ["depreciation"],
      question: (c) => `Après cet achat de ${eur(c.immobilisation.ht)} hors taxes, le résultat de janvier a-t-il baissé ?`,
      options: (c) => [
        {
          texte: `Oui, de ${eur(c.immobilisation.ht)}.`,
          juste: false,
          retour: "L'équipement n'est pas consommé dans le mois : il reste à l'actif. Le compte de résultat ne verra que son usure.",
        },
        {
          texte: "Non : l'équipement est une immobilisation. Il coûtera au fil de son usage, par l'amortissement.",
          juste: true,
          retour: "C'est cela. Chaque mois de service, une part de sa valeur deviendra une charge : la dotation aux amortissements (compte 681). Vous la calculerez pour janvier en fin de chapitre.",
        },
        {
          texte: `Oui, de ${eur(c.immobilisation.ttc)}, taxes comprises.`,
          juste: false,
          retour: "Ni le hors taxes ni la TVA ne sont des charges ici : l'équipement est un actif, la TVA une créance sur l'État.",
        },
      ],
      vue: "resultat",
    },
    {
      id: "achat",
      type: "ecriture",
      titre: "Un achat à crédit",
      notions: ["payment_terms", "vat_payable"],
      evenement: (c) =>
        `Le ${date(c.achat.date)}, ${c.achat.fournisseur} livre et facture : ${c.achat.designation.toLowerCase()}. La facture se paiera à ${qte(c.achat.delai)} jours, le ${date(c.achat.echeance)}. Tout est consommé dans le mois.`,
      piece: (c) =>
        facturePiece({
          nature: "Facture d'achat",
          de: c.achat.fournisseur,
          a: c.entreprise,
          quand: c.achat.date,
          designation: c.achat.designation,
          f: c.achat,
          mention: `Payable à ${qte(c.achat.delai)} jours, le ${date(c.achat.echeance)}.`,
        }),
      ecriture: ecritureDeLAchat,
      indices: (c) => [
        `Ce qui est acheté est consommé dans le mois : une charge, classe 6. Quel compte d'achats convient à « ${c.achat.designation} » ?`,
        "Rien n'est payé aujourd'hui : l'entreprise doit la facture à son fournisseur, classe 4. La TVA, elle, se récupère (TVA déductible sur autres biens et services).",
      ],
      explication: (c) => [
        `L'achat est une charge de ${eur(c.achat.ht)} hors taxes : il entre au compte de résultat, au débit du ${c.achat.compte}.`,
        `Rien n'est sorti de la banque. ${c.achat.fournisseur} attend ${eur(c.achat.ttc)} : une dette, au passif, au compte 401. La charge naît à la facture, pas au paiement.`,
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "vente-credit",
      type: "ecriture",
      titre: "Une vente à un client professionnel",
      notions: ["revenue", "payment_terms", "vat_payable"],
      evenement: (c) => {
        const d = delaiDuClient(c);
        const client = nomDuClient(c.venteCredit.client);
        const paiement =
          d.retard > 0
            ? `La facture est payable à ${qte(d.convenu)} jours, le ${date(d.echeanceConvenue)} ; mais ${client} ${paiementDuClient(c)} : son règlement est attendu le ${date(c.venteCredit.echeance)}.`
            : `${majuscule(client)} paiera à ${qte(d.reel)} jours, le ${date(c.venteCredit.echeance)}.`;
        return `Le ${date(c.venteCredit.date)}, ${c.entreprise} facture ${c.venteCredit.client} : ${qte(c.venteCredit.quantite)} ${c.unites} à ${eur(c.venteCredit.prixUnitaire)} hors taxes. ${paiement}`;
      },
      piece: (c) => {
        const d = delaiDuClient(c);
        return facturePiece({
          nature: "Facture de vente",
          de: c.entreprise,
          a: c.venteCredit.client,
          quand: c.venteCredit.date,
          designation: majuscule(c.unites),
          f: c.venteCredit,
          mention: `Payable à ${qte(d.convenu)} jours, le ${date(d.echeanceConvenue)}.`,
        });
      },
      ecriture: ecritureDeLaVenteACredit,
      indices: (c) => [
        `La vente est un produit, classe 7. Quel compte de ventes convient à ce que vend ${c.entreprise} ?`,
        "Le client ne paie pas tout de suite : il doit la facture TTC, classe 4. Et la TVA qu'il paie, l'entreprise la collecte pour l'État.",
      ],
      explication: (c) => [
        `La vente est un produit de ${eur(c.venteCredit.ht)} hors taxes, au crédit du ${c.venteCredit.compte} (${intituleDe(c.venteCredit.compte)}). Elle compte dans le résultat de janvier, même si rien n'est encore encaissé.`,
        `${majuscule(nomDuClient(c.venteCredit.client))} doit ${eur(c.venteCredit.ttc)} : une créance, à l'actif, au compte 411.`,
        `La TVA de ${eur(c.venteCredit.tva)} n'appartient pas à l'entreprise : elle la collecte pour l'État et la lui reversera. C'est une dette, au compte 44571, et elle ne fait pas partie du chiffre d'affaires, qui se lit toujours hors taxes.`,
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "bulletin",
      type: "montants",
      titre: "La paie de janvier",
      notions: ["payroll", "fixed_costs"],
      question: (c) =>
        `Les ${qte(c.personnel.effectif)} salariés ${dE(c.entreprise)} ont gagné ${eur(c.personnel.brut)} bruts en janvier. Les cotisations salariales, retenues sur le brut, en font ${pct(c.personnel.tauxSalarial)} ; les cotisations patronales, que l'entreprise paie en plus, ${pct(c.personnel.tauxPatronal)}. Calculez le récapitulatif de la paie.`,
      champs: (c) => {
        const p = c.personnel;
        return [
          { libelle: "Cotisations salariales", attendu: p.cotisationsSalariales, calcul: `${eur(p.brut)} × ${pct(p.tauxSalarial)} = ${eur(p.cotisationsSalariales)}` },
          { libelle: "Net à payer aux salariés", attendu: p.net, calcul: `${eur(p.brut)} − ${eur(p.cotisationsSalariales)} = ${eur(p.net)}` },
          { libelle: "Cotisations patronales", attendu: p.cotisationsPatronales, calcul: `${eur(p.brut)} × ${pct(p.tauxPatronal)} = ${eur(p.cotisationsPatronales)}` },
          { libelle: "Coût total pour l'entreprise", attendu: p.cout, calcul: `${eur(p.brut)} + ${eur(p.cotisationsPatronales)} = ${eur(p.cout)}` },
        ];
      },
      explication: (c) => [
        `Le brut, ${eur(c.personnel.brut)}, est le salaire du contrat. Le salarié n'en reçoit que le net, ${eur(c.personnel.net)} : ses cotisations sont retenues et versées pour lui aux organismes sociaux.`,
        `L'entreprise, elle, paie le brut et ses propres cotisations : le personnel lui coûte ${eur(c.personnel.cout)}, et non le net qu'elle vire. Les cotisations, salariales et patronales, se règlent à l'URSSAF le ${date(c.personnel.dateUrssaf)}.`,
      ],
    },
    {
      id: "paie",
      type: "ecriture",
      titre: "Les salaires du mois",
      notions: ["payroll", "fixed_costs"],
      evenement: (c) =>
        `Le ${date(c.personnel.date)}, le journal de paie de janvier est arrêté. Passez-le en une écriture : les deux charges de personnel, puis ce que l'entreprise doit aux organismes sociaux et à ses salariés.`,
      piece: (c) => ({
        nature: "Journal de paie de janvier",
        de: c.entreprise,
        a: `Ses ${qte(c.personnel.effectif)} salariés`,
        date: date(c.personnel.date),
        lignes: [
          { libelle: "Salaires bruts", montant: c.personnel.brut },
          { libelle: `Cotisations salariales (${pct(c.personnel.tauxSalarial)})`, montant: c.personnel.cotisationsSalariales },
          { libelle: `Cotisations patronales (${pct(c.personnel.tauxPatronal)})`, montant: c.personnel.cotisationsPatronales },
        ],
        totaux: [
          { libelle: "Net à payer aux salariés", montant: c.personnel.net, fort: true },
          { libelle: "Coût total pour l'entreprise", montant: c.personnel.cout },
        ],
      }),
      ecriture: ecritureDeLaPaie,
      indices: () => [
        "Deux charges, classe 6 : les salaires bruts (rémunérations du personnel) et les cotisations patronales (charges de sécurité sociale).",
        "Rien n'est encore payé. L'entreprise doit le net à ses salariés (compte 421) et toutes les cotisations, salariales et patronales, aux organismes sociaux (compte 431).",
      ],
      explication: (c) => [
        `Deux charges, ${eur(c.personnel.brut)} au 641 et ${eur(c.personnel.cotisationsPatronales)} au 645 : ${eur(c.personnel.cout)} en tout. Elles se partagent en deux dettes : le net dû aux salariés (421) et ${eur(cotisationsDe(c))} de cotisations dues à l'URSSAF (431), la part salariale retenue sur le brut et la part patronale réunies.`,
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "versement-salaires",
      type: "ecriture",
      titre: "Le versement des salaires",
      notions: ["payroll"],
      evenement: (c) => `Le ${date(c.personnel.date)}, ${c.entreprise} vire leur net à payer aux salariés : ${eur(c.personnel.net)}.`,
      ecriture: ecritureDuVersementDesSalaires,
      indices: () => ["La dette envers les salariés disparaît : le compte 421 passe au débit.", "La banque paie."],
      explication: (c) => [
        `Seul le net, ${eur(c.personnel.net)}, sort aujourd'hui de la banque. Les cotisations restent dues à l'URSSAF jusqu'au ${date(c.personnel.dateUrssaf)} : c'est une dette sociale, au passif.`,
      ],
      vue: "bilan",
    },
    {
      id: "vente-comptant",
      type: "ecriture",
      titre: "Les ventes au comptant",
      notions: ["revenue", "vat_payable"],
      evenement: (c) =>
        `Le ${date(c.venteComptant.date)}, la caisse récapitule ${c.venteComptant.qui} : ${qte(c.venteComptant.quantite)} ${c.unites} à ${eur(c.venteComptant.prixUnitaire)} hors taxes, TVA ${pct(c.venteComptant.tauxTva)}. L'argent est déjà sur le compte bancaire.`,
      piece: (c) =>
        facturePiece({
          nature: "Récapitulatif des ventes du mois",
          de: c.entreprise,
          a: "Clients au comptant",
          quand: c.venteComptant.date,
          designation: majuscule(c.unites),
          f: c.venteComptant,
          mention: "Encaissé.",
        }),
      ecriture: ecritureDesVentesAuComptant,
      indices: () => ["C'est la même vente que tout à l'heure, à une différence près : le client a déjà payé.", "Au lieu d'une créance client, c'est la banque qui reçoit le TTC."],
      explication: (c) => [
        `Mêmes produit et TVA que pour une vente à échéance, mais le TTC, ${eur(c.venteComptant.ttc)}, arrive directement en banque : aucune créance ne naît.`,
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "predire-la-tva",
      type: "choix",
      titre: "Pariez sur la TVA du mois",
      notions: ["vat_payable"],
      question: (c) =>
        `Le mois est passé au journal. Avant de calculer, pariez. ${c.entreprise} a acheté son équipement ${eur(c.immobilisation.ht)} hors taxes et ses achats du mois ${eur(c.achat.ht)} ; elle a vendu pour ${eur(janvierDe(c).produits)} hors taxes. La TVA de janvier sera…`,
      options: (c) => {
        const t = janvierDe(c).tvaNette;
        const voir = "Faites varier le prix de l'équipement à l'étape suivante : le curseur montre de quel côté passe la TVA du mois, et pourquoi.";
        return [
          { texte: "Un crédit de TVA : l'État devra de l'argent à l'entreprise", juste: t < 0, retour: `${t < 0 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Une TVA due : l'entreprise devra de l'argent à l'État", juste: t > 0, retour: `${t > 0 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Nulle : la TVA collectée et la TVA déductible s'annulent", juste: t === 0, retour: `${t === 0 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          {
            texte: "Une charge de plus : la TVA de l'équipement ne se récupère pas",
            juste: false,
            retour: `Non : la TVA payée sur l'équipement est déductible, comme celle des achats ; l'entreprise la récupère sur l'État. ${voir}`,
          },
        ];
      },
    },
    {
      id: "la-tva-de-l-equipement",
      type: "curseur",
      titre: "Faites varier l'équipement",
      notions: ["vat_payable"],
      question: (c) =>
        `Faites varier le prix hors taxes de l'équipement, de 0 à ${eur(borneDuCurseur(c))}, le reste du mois restant le même. Une droite donne la TVA collectée sur les ventes de janvier, qui ne dépend pas de l'équipement ; l'autre, la TVA déductible : celle des achats, plus celle de l'équipement. Jusqu'à quel prix la TVA collectée couvre-t-elle la TVA déductible ? Placez le curseur sur le prix le plus élevé, à l'euro près, puis validez.`,
      grandeur: () => ({ libelle: "Prix hors taxes de l'équipement", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: limiteDeLEquipement(c), max: borneDuCurseur(c) }),
      zones: ["TVA due à l'État", "Crédit de TVA"],
      rates: () => ({
        dessous: "À ce prix, la TVA collectée couvre encore la TVA déductible : l'équipement peut coûter plus cher avant que la TVA du mois ne devienne un crédit.",
        dessus: "À ce prix, la TVA déductible dépasse déjà la TVA collectée : c'est un crédit de TVA. Cherchez plus bas.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, prix) => {
        const j = janvierDe(c);
        const surLEquipement = auCentime(prix * c.immobilisation.tauxTva);
        return [
          { libelle: "TVA collectée sur les ventes", montant: j.collectee },
          { libelle: "TVA déductible sur les achats", montant: c.achat.tva },
          { libelle: "TVA déductible sur l'équipement", montant: surLEquipement },
          { libelle: "TVA du mois : due si positive, crédit si négative", montant: auCentime(j.collectee - c.achat.tva - surLEquipement), fort: true },
        ];
      },
      droites: (c) => {
        const j = janvierDe(c);
        return {
          produit: () => j.collectee,
          cout: (prix) => c.achat.tva + c.immobilisation.tauxTva * prix,
          libelles: ["TVA collectée sur les ventes", "TVA déductible, équipement compris"],
        };
      },
      explication: (c) => {
        const j = janvierDe(c);
        const limite = limiteDeLEquipement(c);
        return [
          `Jusqu'à ${eur(limite)} d'équipement, ${c.entreprise} doit de la TVA à l'État pour janvier ; au-delà, c'est l'État qui lui en doit. Son équipement coûte ${eur(c.immobilisation.ht)} : ${j.tvaNette < 0 ? `il dépasse la limite, et janvier finit sur ${tvaDite(j.tvaNette)}` : `il reste sous la limite, et janvier finit sur ${tvaDite(j.tvaNette)}`}.`,
          "La TVA de l'équipement n'est jamais une charge : elle se déduit de la TVA collectée, et ce qui n'est pas déduit ce mois-ci devient une créance sur l'État. C'est le calcul que l'étape suivante fait faire à partir du journal.",
        ];
      },
    },
    {
      id: "tva-nette",
      type: "montants",
      titre: "La TVA du mois",
      notions: ["vat_payable"],
      question: () =>
        "Sans formule cette fois : à partir de votre journal, calculez la TVA de janvier. Donnez-la positive si l'entreprise la doit à l'État, négative si l'État la lui doit.",
      champs: (_c, e) => {
        const collectee = auCentime(-(e.soldes["44571"] ?? 0));
        const deductible = auCentime((e.soldes["44562"] ?? 0) + (e.soldes["44566"] ?? 0));
        const t = tvaNette(e.soldes);
        return [
          { libelle: "TVA collectée", attendu: collectee, calcul: `le solde créditeur du 44571 : ${eur(collectee)}` },
          { libelle: "TVA déductible", attendu: deductible, calcul: `${eur(e.soldes["44562"] ?? 0)} sur l'équipement (44562) + ${eur(e.soldes["44566"] ?? 0)} sur les achats (44566) = ${eur(deductible)}` },
          { libelle: "TVA du mois, collectée moins déductible", attendu: t, calcul: `${eur(collectee)} − ${eur(deductible)} = ${eur(t)}` },
        ];
      },
      explication: (_c, e) => {
        const t = tvaNette(e.soldes);
        return t >= 0
          ? [`L'entreprise doit ${eur(t)} de TVA à l'État pour janvier. Elle la déclare et la paie en février : c'est une dette, au passif du bilan.`]
          : [
              `L'entreprise a payé plus de TVA qu'elle n'en a collecté : l'État lui doit ${eur(-t)}. C'est un crédit de TVA, une créance à l'actif, qu'elle imputera sur la TVA des mois suivants ou dont elle demandera le remboursement.`,
              "C'est fréquent le mois où l'on achète son équipement, et le curseur l'a montré : le crédit ne dit rien de la santé de l'entreprise.",
            ];
      },
      vue: "tva",
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Le compte de résultat",
      notions: ["income_statement"],
      question: () => "Construisez le compte de résultat de janvier à partir de votre journal : le total des produits, le total des charges, puis le résultat.",
      champs: (_c, e) => {
        const cr = compteDeResultat(e.soldes);
        return [
          { libelle: "Total des produits", attendu: cr.totalProduits, calcul: `les comptes de classe 7 : ${cr.produits.map((p) => eur(p.montant)).join(" + ")} = ${eur(cr.totalProduits)}` },
          { libelle: "Total des charges", attendu: cr.totalCharges, calcul: `les comptes de classe 6 : ${cr.charges.map((p) => eur(p.montant)).join(" + ")} = ${eur(cr.totalCharges)}` },
          { libelle: "Résultat (produits moins charges)", attendu: cr.resultat, calcul: `${eur(cr.totalProduits)} − ${eur(cr.totalCharges)} = ${eur(cr.resultat)}` },
        ];
      },
      explication: (c, e) => {
        const r = compteDeResultat(e.soldes).resultat;
        return [
          r >= 0
            ? `${c.entreprise} dégage un bénéfice de ${eur(r)} en janvier : ses produits dépassent ses charges.`
            : `${c.entreprise} perd ${eur(-r)} en janvier : ses charges dépassent ses produits.`,
          "Ni l'équipement, ni l'emprunt, ni la TVA n'y figurent : ce ne sont ni des charges ni des produits. Ce résultat reste pourtant incomplet, et le chapitre suivant dira ce qui lui manque.",
        ];
      },
      vue: "resultat",
    },
    {
      id: "bilan",
      type: "montants",
      titre: "Le bilan au 31 janvier",
      notions: ["balance_sheet", "net_treasury"],
      question: () => "Construisez le bilan au 31 janvier à partir de votre journal : le solde de la banque, puis le total de l'actif et le total du passif.",
      champs: (_c, e) => {
        const b = bilan(e.soldes);
        return [
          { libelle: "Banque au 31 janvier", attendu: banqueDe(e), calcul: `le solde débiteur du 512, tout ce qui est entré moins tout ce qui est sorti : ${eur(banqueDe(e))}` },
          { libelle: "Total de l'actif", attendu: b.totalActif, calcul: `${b.actif.map((l) => `${minuscule(l.libelle)} ${eur(l.montant)}`).join(" + ")} = ${eur(b.totalActif)}` },
          { libelle: "Total du passif", attendu: b.totalPassif, calcul: `${b.passif.map((l) => `${minuscule(l.libelle)} ${eur(l.montant)}`).join(" + ")} = ${eur(b.totalPassif)}` },
        ];
      },
      explication: (_c, e) => {
        const b = bilan(e.soldes);
        return [
          `Les deux totaux sont égaux : ${eur(b.totalActif)}. Ce n'est pas un hasard : chaque écriture avait autant de débit que de crédit.`,
          "Le résultat se range au passif, avec le capital : il appartient aux associés. C'est lui qui équilibre le bilan, parce que les charges et les produits ne figurent pas au bilan. La TVA nette va à l'actif si l'État la doit, au passif si l'entreprise la doit.",
        ];
      },
      vue: "bilan",
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["balance_sheet", "income_statement", "vat_payable"],
      texte: (c) => {
        const j = janvierDe(c);
        return [
          `Vous avez tenu le premier mois ${dE(c.entreprise)} : chaque opération dans le journal, puis la TVA (${tvaDite(j.tvaNette)}), le compte de résultat (${resultatDit(j.resultat)}) et le bilan, construits à partir de vos propres écritures.`,
          "Le curseur l'a montré avant la formule : la TVA de l'équipement se récupère, et un gros investissement fait un crédit de TVA, pas une charge.",
          `La suite, « ${TITRE_DE_LA_SUITE} », repart de votre balance du 31 janvier : les règlements qui font bouger la banque sans toucher au résultat, puis le mois vu par un examinateur.`,
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Une charge ou un produit naît à la facture ; une immobilisation n'est pas une charge ; la TVA ne passe jamais par le résultat. Le bilan est équilibré parce que chaque écriture l'est.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LA SUITE : DU RÉSULTAT À LA TRÉSORERIE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * La balance du 31 janvier en une écriture : le journal du premier chapitre, déjà passé, d'où la suite
 * repart. Les soldes débiteurs au débit, les créditeurs au crédit.
 */
export function ouvertureDeJanvier(c: Cas): Ecriture {
  const s = soldesDeJanvier(c);
  const comptes = Object.keys(s)
    .filter((k) => s[k] !== 0)
    .sort();
  return {
    date: date(FIN_DE_JANVIER),
    libelle: "Balance au 31 janvier : le journal du mois, passé au chapitre « De la création au premier bilan »",
    lignes: comptes.map((k) => ({ compte: k, debit: s[k]! > 0 ? s[k]! : 0, credit: s[k]! < 0 ? -s[k]! : 0 })),
  };
}

/**
 * CHAPITRE : DU RÉSULTAT À LA TRÉSORERIE (comptabilité générale, palier 2). La seconde moitié de
 * l'ancien chapitre pilote, qui faisait trente étapes (audit pédagogique, P1-4 et P1-8) : le pari et
 * le laboratoire de la trésorerie, le passage du résultat à la banque, les trois échéances, puis le
 * niveau de l'examen (la banque à rebours, le bilan du mois complet, la critique du résultat). Le
 * journal s'ouvre sur la balance du 31 janvier du premier chapitre : mêmes écritures, mêmes chiffres.
 */
export const DU_RESULTAT_A_LA_TRESORERIE: Chapitre = {
  code: "du-resultat-a-la-tresorerie",
  parcours: "comptabilite-generale",
  palier: 2,
  blocs: [
    "BTS CG P1 · Contrôle et traitement comptable des opérations commerciales",
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: TITRE_DE_LA_SUITE,
  accroche:
    "Le premier mois est au journal, le bilan est dressé : faites jouer les règlements dans la simulation, passez les échéances, puis lisez le mois comme un examinateur.",
  objectifs: [
    "Passer du résultat à la variation de la banque, et expliquer pourquoi le résultat n'est pas la trésorerie",
    "Enregistrer les règlements d'un fournisseur, de l'URSSAF et d'un client",
    "Remonter un relevé de banque à rebours",
    "Dresser un bilan à partir de la seule balance, avec l'amortissement et les intérêts courus du mois",
  ],
  libre: false,
  prerequis: ["creation-premier-bilan"],
  ouverture: ouvertureDeJanvier,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le journal au 31 janvier",
      notions: ["balance_sheet", "net_treasury"],
      tableau: balanceDeJanvier,
      texte: (c) => {
        const j = janvierDe(c);
        return [
          `Ce chapitre suit « De la création au premier bilan » : le journal ${dE(c.entreprise)} repart de la balance du 31 janvier, ci-dessous, celle de vos écritures du premier mois. Le mois a fait ${resultatDit(j.resultat)}, et la banque finit à ${eur(j.banque)}.`,
          "Il reste à comprendre pourquoi le résultat n'est pas la trésorerie : un laboratoire fait jouer les règlements, puis vous passez les échéances du mois. Enfin, vous lirez le mois comme un examinateur.",
        ];
      },
      repere: () => "Le résultat naît des factures ; la banque bouge avec les règlements. Les deux ne mesurent pas la même chose.",
    },
    {
      id: "predire-la-banque",
      type: "choix",
      titre: "Pariez sur le résultat",
      notions: ["net_treasury", "income_statement"],
      question: (c) => {
        const client = nomDuClient(c.venteCredit.client);
        return `Avant de manipuler, pariez. Si ${client} avait réglé sa facture de ${eur(c.venteCredit.ttc)} dès janvier, au lieu d'attendre, le résultat de janvier aurait été…`;
      },
      options: (c) => {
        const voir = "Faites jouer les règlements au laboratoire, à l'étape suivante : il montre ce qui bouge, et ce qui ne bouge pas.";
        return [
          { texte: "Le même : la vente compte à la facture, payée ou non", juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Plus élevé de ${eur(c.venteCredit.ttc)} : l'argent serait entré en banque`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Plus élevé de ${eur(c.venteCredit.ht)} : la vente aurait enfin été encaissée`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-tresorerie",
      type: "simulation",
      titre: "Le laboratoire de la trésorerie",
      notions: ["net_treasury", "payment_terms", "income_statement"],
      question: (c) =>
        `Le mois reste le même : mêmes factures, mêmes charges, mêmes produits. Faites jouer les règlements : le délai du client professionnel, la part des ventes du mois facturée à crédit (le reste est payé à la commande), le délai du fournisseur et le jour du règlement de l'URSSAF après la paie. Ce qui se règle au plus tard le 31 janvier passe par la banque de janvier. Relevez le défi, et regardez le résultat ${dE(c.entreprise)}.`,
      leviers: (c) => {
        const d = departDeLaTresorerie(c);
        return [
          { code: "delaiClient", libelle: `Délai ${deNom(nomDuClient(c.venteCredit.client))}`, unite: "jours", min: 0, max: DELAIS_DU_LABORATOIRE.client, pas: 1, depart: d.delaiClient },
          { code: "aCredit", libelle: "Ventes du mois facturées à crédit, toutes taxes comprises", unite: "€", min: 0, max: ventesDuMoisTtc(c), pas: 1, depart: d.aCredit },
          { code: "delaiFournisseur", libelle: `Délai ${dE(c.achat.fournisseur)}`, unite: "jours", min: 0, max: DELAIS_DU_LABORATOIRE.fournisseur, pas: 1, depart: d.delaiFournisseur },
          { code: "joursUrssaf", libelle: "Règlement de l'URSSAF, après la paie", unite: "jours", min: 0, max: DELAIS_DU_LABORATOIRE.urssaf, pas: 1, depart: d.joursUrssaf },
        ];
      },
      lecture: (c, p) => {
        const l = tresorerieDeJanvier(c, p as unknown as PositionDeLaTresorerie);
        const d = tresorerieDeJanvier(c, departDeLaTresorerie(c));
        return [
          { libelle: "Résultat de janvier", montant: l.resultat, reference: d.resultat, fort: true },
          { libelle: "Banque au 31 janvier", montant: l.banque, reference: d.banque, fort: true },
          { libelle: "Variation de la banque, hors apports et emprunt", montant: l.variation, reference: d.variation },
          { libelle: "Créance sur le client", montant: l.creances, reference: d.creances },
          { libelle: "Dette envers le fournisseur", montant: l.fournisseur, reference: d.fournisseur },
          { libelle: "Dette envers l'URSSAF", montant: l.urssaf, reference: d.urssaf },
        ];
      },
      // La banque selon le délai du client : une marche, le jour où le règlement passe en janvier ;
      // le résultat, une droite qui ne bouge pas.
      graphique: (c) => ({
        levier: "delaiClient",
        courbes: [
          { libelle: "Banque au 31 janvier", valeur: (p) => tresorerieDeJanvier(c, p as unknown as PositionDeLaTresorerie).banque },
          { libelle: "Résultat de janvier", valeur: (p) => tresorerieDeJanvier(c, p as unknown as PositionDeLaTresorerie).resultat },
        ],
      }),
      defi: (c) => {
        const seuil = seuilDuDefi(c);
        const depart = departDeLaTresorerie(c);
        return {
          consigne: `Portez la banque au 31 janvier à ${eur(seuil)} au moins, sans toucher à une seule facture.`,
          atteint: (p) => tresorerieDeJanvier(c, p as unknown as PositionDeLaTresorerie).banque >= seuil,
          indice: (p) => {
            const l = tresorerieDeJanvier(c, p as unknown as PositionDeLaTresorerie);
            return `La banque n'est qu'à ${eur(l.banque)}, et le résultat reste à ${eur(l.resultat)} quoi que vous fassiez. Seule la date des règlements fait bouger la banque : quelle facture pourrait être payée avant le 31 janvier ?`;
          },
          solution: { ...depart, delaiClient: FIN_DE_JANVIER - c.venteCredit.date },
        };
      },
      explication: (c, p) => {
        const l = tresorerieDeJanvier(c, p as unknown as PositionDeLaTresorerie);
        const d = tresorerieDeJanvier(c, departDeLaTresorerie(c));
        return [
          `La banque atteint ${eur(l.banque)}, ${eur(auCentime(l.banque - d.banque))} de plus qu'au départ. Le résultat, lui, n'a pas bougé d'un centime : ${eur(l.resultat)}. Les règlements changent la forme de l'actif et du passif (une créance devient de l'argent, une dette disparaît avec l'argent qui la paie), jamais le résultat.`,
          "Le graphique le dit d'un trait : la banque fait une marche le jour où le règlement du client tombe en janvier ; le résultat est une droite plate. Le résultat mesure ce que l'entreprise a gagné ; la trésorerie, ce dont elle dispose, et quand.",
        ];
      },
    },
    {
      id: "du-resultat-a-la-banque",
      type: "montants",
      titre: "Du résultat à la banque",
      notions: ["net_treasury", "income_statement", "balance_sheet"],
      question: (_c, e) =>
        `Le résultat de janvier est de ${eur(compteDeResultat(e.soldes).resultat)}. Passez du résultat à la variation de la banque, hors apports et emprunt, à partir de votre journal : ce que le résultat compte sans que l'argent soit encore entré, ce qu'il compte sans que l'argent soit encore sorti, puis la variation de la banque (négative si la banque a baissé).`,
      champs: (c, e) => {
        const r = compteDeResultat(e.soldes).resultat;
        const creance = e.soldes["411"] ?? 0;
        const dettes = auCentime(-(e.soldes["401"] ?? 0) - (e.soldes["431"] ?? 0));
        const t = tvaNette(e.soldes);
        const variation = auCentime(banqueDe(e) - c.capital - c.emprunt);
        return [
          { libelle: "Créance sur le client, non encaissée", attendu: creance, calcul: `le solde du 411 : ${eur(creance)}, une vente comptée au résultat, pas en banque` },
          { libelle: "Dettes envers le fournisseur et l'URSSAF, non payées", attendu: dettes, calcul: `${eur(-(e.soldes["401"] ?? 0))} au 401 + ${eur(-(e.soldes["431"] ?? 0))} au 431 = ${eur(dettes)}, des charges comptées au résultat, pas encore sorties de la banque` },
          {
            libelle: "Variation de la banque, hors apports et emprunt",
            attendu: variation,
            calcul: `résultat ${eur(r)} − créance ${eur(creance)} + dettes ${eur(dettes)} − équipement hors taxes ${eur(c.immobilisation.ht)} ${terme(t)} de TVA ${t < 0 ? "à récupérer" : "due"} = ${eur(variation)}`,
          },
        ];
      },
      explication: (c, e) => {
        const r = compteDeResultat(e.soldes).resultat;
        const variation = auCentime(banqueDe(e) - c.capital - c.emprunt);
        return [
          `${majuscule(resultatDit(r))} d'un côté, une banque qui a varié de ${eur(variation)} de l'autre, hors apports et emprunt. Tout l'écart s'explique : la créance du client, les dettes du fournisseur et de l'URSSAF, l'équipement payé sans être une charge, et la TVA, qui passe par la banque sans jamais passer par le résultat.`,
          "C'est le tableau de passage du résultat à la trésorerie : il n'y a pas d'erreur dans le journal, les deux nombres ne mesurent pas la même chose.",
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "echeances",
      type: "lecture",
      titre: "Les échéances",
      notions: ["payment_terms"],
      texte: (c) => {
        const d = delaiDuClient(c);
        const client = nomDuClient(c.venteCredit.client);
        const reglements = [
          { jour: c.achat.echeance, texte: `la facture ${dE(c.achat.fournisseur)} arrive à échéance` },
          { jour: c.personnel.dateUrssaf, texte: "les cotisations de janvier se paient à l'URSSAF" },
          { jour: c.venteCredit.echeance, texte: d.retard > 0 ? `${client} règle sa facture, ${qte(d.retard)} jours après l'échéance convenue du ${date(d.echeanceConvenue)}` : `${client} doit régler sa facture` },
        ].sort((a, b) => a.jour - b.jour);
        return [
          `Le temps passe. ${reglements.map((x) => `Le ${date(x.jour)}, ${x.texte}`).join(". ")}.`,
          "Ces règlements ne sont ni des achats, ni des ventes, ni des charges de personnel : ils soldent des dettes et une créance déjà enregistrées. Passez-les dans l'ordre des dates, puis regardez ce qu'ils changent.",
        ];
      },
    },
    {
      id: "paiement-fournisseur",
      type: "ecriture",
      titre: "Le fournisseur est payé",
      notions: ["payment_terms"],
      echeance: (c) => c.achat.echeance,
      evenement: (c) => `Le ${date(c.achat.echeance)}, ${c.entreprise} paie ${c.achat.fournisseur} par virement : ${eur(c.achat.ttc)}.`,
      ecriture: (c) => ({
        date: date(c.achat.echeance),
        libelle: `Règlement ${c.achat.fournisseur}`,
        lignes: [
          { role: "la dette fournisseur qui s'éteint", compte: "401", sens: "debit", montant: c.achat.ttc, indice: "le montant de la facture, taxes comprises" },
          { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.achat.ttc, indice: "le montant de la facture, taxes comprises" },
        ],
      }),
      indices: () => ["Une dette s'éteint, la banque paie : quel compte de tiers passe au débit ?"],
      explication: (c) => [`La dette de ${eur(c.achat.ttc)} est éteinte, la banque a baissé d'autant. Aucune charge nouvelle : l'achat avait déjà été enregistré à la facture.`],
      vue: "bilan",
    },
    {
      id: "paiement-urssaf",
      type: "ecriture",
      titre: "L'URSSAF est payée",
      notions: ["payment_terms", "payroll"],
      echeance: (c) => c.personnel.dateUrssaf,
      evenement: (c) => `Le ${date(c.personnel.dateUrssaf)}, ${c.entreprise} verse à l'URSSAF les cotisations de janvier, salariales et patronales réunies.`,
      ecriture: (c) => ({
        date: date(c.personnel.dateUrssaf),
        libelle: "Cotisations de janvier à l'URSSAF",
        lignes: [
          { role: "la dette sociale qui s'éteint", compte: "431", acceptes: ["437"], sens: "debit", montant: cotisationsDe(c), indice: "les cotisations salariales et patronales réunies" },
          { role: "le paiement par la banque", compte: "512", sens: "credit", montant: cotisationsDe(c), indice: "les cotisations salariales et patronales réunies" },
        ],
      }),
      indices: () => ["La dette envers les organismes sociaux disparaît : c'est le compte de la paie qui attendait ces cotisations."],
      explication: (c) => [`La dette sociale de ${eur(cotisationsDe(c))} est soldée. Aucune charge nouvelle : les cotisations avaient été enregistrées avec la paie de janvier.`],
      vue: "bilan",
    },
    {
      id: "encaissement-client",
      type: "ecriture",
      titre: "Le client paie",
      notions: ["payment_terms"],
      echeance: (c) => c.venteCredit.echeance,
      evenement: (c) => {
        const d = delaiDuClient(c);
        const retard = d.retard > 0 ? `, ${qte(d.retard)} jours après l'échéance convenue` : "";
        return `Le ${date(c.venteCredit.echeance)}, ${nomDuClient(c.venteCredit.client)} règle sa facture par virement${retard} : ${eur(c.venteCredit.ttc)}.`;
      },
      ecriture: (c) => ({
        date: date(c.venteCredit.echeance),
        libelle: "Règlement client",
        lignes: [
          { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: c.venteCredit.ttc, indice: "le montant de la facture, taxes comprises" },
          { role: "la créance client qui s'éteint", compte: "411", sens: "credit", montant: c.venteCredit.ttc, indice: "le montant de la facture, taxes comprises" },
        ],
      }),
      indices: () => ["La banque reçoit ; quelle créance disparaît ?"],
      explication: (c) => [`La créance de ${eur(c.venteCredit.ttc)} est devenue de l'argent en banque. Aucun produit nouveau : la vente avait été enregistrée à la facture.`],
      vue: "bilan",
    },
    {
      id: "apres-echeances",
      type: "comparaison",
      titre: "Ce qui a changé",
      notions: ["net_treasury", "income_statement", "balance_sheet"],
      question: (c) => `Entre le 31 janvier et le ${date(Math.max(c.achat.echeance, c.venteCredit.echeance, c.personnel.dateUrssaf))}, le résultat de janvier a-t-il changé ?`,
      avantLEtape: "echeances",
      libelles: { avant: "Au 31 janvier", apres: "Après les échéances" },
      options: (c) => [
        { texte: "Oui, il a augmenté : le client a payé.", juste: false, retour: "Le client a payé une vente déjà comptée en janvier : la payer ne la compte pas une deuxième fois." },
        {
          texte: "Non : payer et encaisser ne créent ni charge ni produit. Ils changent la forme de l'actif et du passif.",
          juste: true,
          retour: `C'est la leçon du laboratoire, vérifiée au journal : le résultat ${dE(c.entreprise)} est né des factures ; les règlements ne font que transformer une créance ou une dette en argent.`,
        },
        { texte: "Oui, il a baissé : le fournisseur et l'URSSAF ont été payés.", juste: false, retour: "L'achat et les cotisations étaient déjà comptés en janvier. Les payer ne fait qu'éteindre les dettes." },
      ],
      explication: (_c, avant, apres) => {
        const a = bilan(avant.soldes);
        const b = bilan(apres.soldes);
        return [
          `Le résultat reste à ${eur(a.resultat)}. La banque passe de ${eur(avant.soldes["512"] ?? 0)} à ${eur(apres.soldes["512"] ?? 0)}, le client, le fournisseur et l'URSSAF sont soldés.`,
          `Le total du bilan, lui, passe de ${eur(a.totalActif)} à ${eur(b.totalActif)} : payer une dette fait baisser l'actif et le passif ensemble.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver les ventes à rebours",
      notions: ["revenue", "net_treasury", "vat_payable"],
      tableau: releveSansLesVentes,
      question: (c) =>
        `Le récapitulatif des ventes au comptant s'est perdu, et la ligne du relevé est illisible. Il vous reste le relevé de banque de janvier. Retrouvez ce que les ventes au comptant ont encaissé, toutes taxes comprises, leur montant hors taxes (TVA à ${pct(c.venteComptant.tauxTva)}), puis le nombre ${dE(c.unites)} ${accordPluriel(c, "vendu")} au comptant à ${eur(c.venteComptant.prixUnitaire)} hors taxes.`,
      champs: (c) => {
        const j = janvierDe(c);
        return [
          {
            libelle: "Ventes au comptant encaissées, toutes taxes comprises",
            attendu: j.comptantTtc,
            calcul: `${eur(j.banque)} − ${eur(c.capital)} − ${eur(c.emprunt)} + ${eur(c.loyer.montant)} + ${eur(c.immobilisation.ttc)} + ${eur(c.personnel.net)} = ${eur(j.comptantTtc)} : le solde, moins ce qui est entré, plus ce qui est sorti`,
          },
          { libelle: "Ventes au comptant, hors taxes", attendu: j.comptantHt, calcul: `${eur(j.comptantTtc)} ÷ ${(1 + c.venteComptant.tauxTva).toLocaleString("fr-FR")} = ${eur(j.comptantHt)}` },
          { libelle: `Nombre ${dE(c.unites)} au comptant`, attendu: j.comptantQuantite, calcul: `${eur(j.comptantHt)} ÷ ${eur(c.venteComptant.prixUnitaire)} = ${qte(j.comptantQuantite)}` },
        ];
      },
      explication: (c) => {
        const j = janvierDe(c);
        return [
          `Remonter la banque, c'est refaire le compte à l'envers : le solde moins les entrées connues, plus les sorties connues, laisse ce qui manque. Puis le TTC se divise par 1 + le taux, jamais ne se multiplie par 1 − le taux : ${eur(j.comptantTtc)} × ${(1 - c.venteComptant.tauxTva).toLocaleString("fr-FR")} donnerait ${eur(auCentime(j.comptantTtc * (1 - c.venteComptant.tauxTva)))}, une erreur classique.`,
          "Seules les ventes au comptant se retrouvent ainsi : la vente au client professionnel n'est pas passée par la banque de janvier.",
        ];
      },
    },
    {
      id: "le-mois-complet",
      type: "montants",
      titre: "Le bilan du mois complet",
      notions: ["balance_sheet", "depreciation", "loan_schedule"],
      tableau: balanceDeJanvier,
      question: (c) => {
        const j = janvierDe(c);
        return `Le gérant veut le bilan de janvier tel qu'un comptable l'arrêterait, et vous n'avez que la balance ci-dessus. Il y manque deux charges du mois : l'usure de l'équipement, mis en service le ${date(c.immobilisation.date)} et amorti en linéaire sur ${qte(j.dureeAns)} ans, et les intérêts de l'emprunt au taux de ${pct(c.pret.tauxAnnuel)}, nés depuis le ${date(c.dates.emprunt)} et payables à la première échéance. Comptez les jours en mois de 30 jours, jour de départ et jour d'arrivée compris, sur une année de 360 jours. Calculez ces deux charges, puis le résultat et le total du bilan du mois complet.`;
      },
      champs: (c) => {
        const j = janvierDe(c);
        return [
          {
            libelle: "Dotation aux amortissements de janvier",
            attendu: j.dotation,
            calcul: `${eur(c.immobilisation.ht)} ÷ ${qte(j.dureeAns)} ans × ${qte(j.joursDeService)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(j.dotation)}`,
          },
          {
            libelle: "Intérêts courus de janvier",
            attendu: j.interets,
            calcul: `${eur(c.emprunt)} × ${pct(c.pret.tauxAnnuel)} × ${qte(j.joursDInterets)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(j.interets)}`,
          },
          { libelle: "Résultat de janvier, mois complet", attendu: j.resultatComplet, calcul: `${eur(j.resultat)} − ${eur(j.dotation)} − ${eur(j.interets)} = ${eur(j.resultatComplet)}` },
          {
            libelle: "Total du bilan, mois complet",
            attendu: j.totalComplet,
            calcul: `${eur(j.totalActif)} − ${eur(j.dotation)} = ${eur(j.totalComplet)} : l'amortissement baisse l'actif ; les intérêts courus baissent le résultat et ajoutent une dette, le passif ne change pas de total`,
          },
        ];
      },
      explication: (c) => {
        const j = janvierDe(c);
        return [
          `La dotation (compte 6811) a pour contrepartie l'amortissement de l'équipement (compte 281), qui se retranche de sa valeur brute à l'actif : l'immobilisation nette tombe à ${eur(auCentime(c.immobilisation.ht - j.dotation))}. Les intérêts courus (compte 6611) ont pour contrepartie une dette, les intérêts courus sur emprunts (compte 1688) : le passif garde son total, mais le résultat baisse.`,
          `Le résultat du mois complet est de ${eur(j.resultatComplet)}, et le bilan totalise ${eur(j.totalComplet)}. Une balance suffit à dresser un bilan : chaque compte sait de quel côté il se range, à condition de n'oublier aucune charge du mois.`,
        ];
      },
      vue: "bilan",
    },
    {
      id: "critique",
      type: "choix",
      titre: "Ce résultat est-il celui du mois ?",
      notions: ["income_statement", "depreciation"],
      question: (c) => {
        const j = janvierDe(c);
        return `Le gérant veut annoncer aux associés ${resultatDit(j.resultat)} pour janvier, le résultat de votre journal. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const j = janvierDe(c);
        return [
          {
            texte: `Il manque l'usure de l'équipement et les intérêts du mois : le mois complet fait ${eur(j.resultatComplet)}`,
            juste: true,
            retour: `Oui. Un mois a consommé une part de l'équipement (${eur(j.dotation)}) et fait naître des intérêts (${eur(j.interets)}), payés ou non : ce sont des charges de janvier. Le résultat annoncé surestime le mois de ${eur(auCentime(j.dotation + j.interets))}.`,
          },
          {
            texte: "Rien ne manque : tout ce qui a été facturé en janvier est au journal",
            juste: false,
            retour: "Une charge ne naît pas que d'une facture : l'usure d'un équipement et des intérêts qui courent sont des charges du mois sans pièce reçue. C'est le travail d'inventaire.",
          },
          {
            texte: `Il faut encore retirer l'équipement payé en janvier : ${eur(auCentime(j.resultat - c.immobilisation.ht))}`,
            juste: false,
            retour: `Non : l'équipement est une immobilisation, qui sert plusieurs années. Seule son usure du mois, ${eur(j.dotation)}, est une charge de janvier.`,
          },
          {
            texte: `Il faut retirer la vente au client, qui n'a pas payé : ${eur(auCentime(j.resultat - c.venteCredit.ht))}`,
            juste: false,
            retour: "Non : la vente compte à la facture, payée ou non. Le laboratoire l'a montré : le règlement change la banque, jamais le résultat.",
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["balance_sheet", "income_statement", "net_treasury"],
      texte: (c) => {
        const j = janvierDe(c);
        return [
          `Vous avez suivi le premier mois ${dE(c.entreprise)} jusqu'à ses échéances : ${resultatDit(j.resultat)} au journal, une banque qui bouge avec les règlements et jamais avec le résultat.`,
          "Au niveau de l'examen, vous savez passer du résultat à la variation de la banque, remonter un relevé à rebours, dresser un bilan à partir de la seule balance, et dire ce qui manque à un résultat pour être celui du mois : l'amortissement et les intérêts courus, que les chapitres de l'emprunt, des immobilisations et de la clôture approfondissent.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Une charge ou un produit naît à la facture, ou à l'usage pour l'amortissement et les intérêts ; un règlement ne fait que solder une dette ou une créance. Le résultat mesure ce que l'entreprise a gagné, la trésorerie ce dont elle dispose.",
    },
  ],
};
