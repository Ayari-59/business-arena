import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { DELAI_MAXIMAL_CONVENU, MARTEL_ET_FILS, type FicheDuBatiment, type RegimeDExigibilite } from "../monde/delais-et-tva";
import { comparerLesRegimes, declarationDuTrimestre, declarationsDeLAnnee, ventesDuTrimestre, type LeviersDeLaTva } from "../monde/delais";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA DÉCLARATION DE TVA : COLLECTÉE, DÉDUCTIBLE, À PAYER (fiscalité, palier 3 ; BTS CG,
 * DCG UE4, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : MARTEL & FILS,
 * l'entreprise de bâtiment, a une fiche figée (monde/delais-et-tva.ts : six trimestres, de l'été de
 * N − 1 à la fin de N, trois clientèles, un négoce, un investissement au printemps) et sa TVA se
 * calcule par le modèle du cours (monde/delais.ts : `declarationDuTrimestre`, `declarationsDeLAnnee`,
 * `comparerLesRegimes`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : la TVA collectée, la TVA déductible, la TVA nette et l'écriture qui la constate ; le
 * crédit de TVA, que l'investissement du printemps fait naître, et son imputation sur la déclaration
 * suivante ; L'EXIGIBILITÉ, NOMMÉE (le défaut 2 de l'audit d'octobre 2026, corrigé) : MARTEL & FILS
 * fait des travaux, sa TVA n'est due qu'à l'encaissement ; l'option pour les débits, qui la rendrait
 * due à la facture, est un levier du laboratoire, jamais la réalité de l'entreprise.
 *
 * Le piège central : croire que la TVA se collecte sur ce qui est facturé. Pour des travaux, elle se
 * collecte sur ce qui est encaissé ; le délai des clients entre donc dans la déclaration, et le même
 * trimestre ne doit pas la même TVA selon le régime (un crédit aux encaissements, une TVA à payer aux
 * débits, au printemps).
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, l-exigibilite, les-encaissements, calcul, liquidation, deductible (la formule est
 *     au repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-credit puis
 *     jusqu-ou-investir (un curseur sur l'investissement du printemps, la TVA collectée face à la
 *     déductible : le crédit naît au-delà de 154 milliers d'euros) avant le-credit ;
 *     predire-le-delai puis le-delai-qui-fait-le-credit (un curseur sur le délai des entreprises, aux
 *     encaissements : au-delà de 18 jours, le printemps se déclare en crédit) ; predire-l-option puis
 *     le-laboratoire-de-la-declaration (régime, délai des entreprises, investissement, taux ; le
 *     graphique des TVA à payer et du crédit, qui cassent au délai où le crédit naît) avant aux-debits ;
 *   · autonome : le-credit, l-imputation, lire-le-credit, aux-debits, echeance (ni formule ni chiffres
 *     donnés ; le calcul de la correction montre le chemin) ;
 *   · expert : l-ecart-de-l-annee (les deux régimes sur l'année, et la hausse des créances retrouvée à
 *     partir de leur seul écart), a-rebours (retrouver les encaissements d'un trimestre de N + 1 à
 *     partir de sa TVA à payer), l-option-pour-les-debits (la critique de l'option) ; puis la synthèse.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : le deuxième trimestre de l'année jouée et sa « TVA à décaisser » du
 * bilan du moteur ; la TVA collectée sur les ventes facturées « comme si l'entreprise avait opté pour
 * les débits » (le moteur ne connaît pas d'autre régime) ; la TVA déduite sur les seuls achats de
 * production ; l'hypothèse « tous les achats de l'année au même trimestre » qui fabriquait un crédit ;
 * le crédit « rendu au trimestre suivant » ; le transport, qui sort du chapitre.
 */

/** Les entreprises où la TVA se déclare : MARTEL & FILS, l'entreprise de bâtiment de la simulation du cours. */
export const ENTREPRISES_DE_LA_TVA: readonly string[] = ["batiment"];

/** Pourquoi les chapitres de TVA se jouent chez MARTEL & FILS, dit à l'élève qui arrive d'une autre entreprise (les cas aussi). */
export const POURQUOI_LA_TVA =
  "la TVA se déclare ici chez MARTEL & FILS, l'entreprise de bâtiment de la simulation du cours : des travaux dont la TVA n'est due qu'à l'encaissement, trois clientèles qui paient à des délais différents, et un investissement qui fait naître un crédit de TVA. Venu d'une autre entreprise, vous y apprenez la mécanique que vous retrouverez sur vos propres chiffres.";

/** Le trimestre que le chapitre déclare d'abord : le premier de N, le cas simple. */
export const TRIMESTRE_DECLARE = 1;

/** Le trimestre du crédit : le deuxième, celui de l'investissement du printemps. */
export const TRIMESTRE_DU_CREDIT = 2;

/** Les bornes du curseur de l'investissement du printemps, en milliers d'euros hors taxes. */
export const INVESTISSEMENT_DU_CURSEUR = { min: 0, max: 300 } as const;

/**
 * Les bornes du délai des entreprises, au curseur et au laboratoire, en jours : jusqu'au délai maximal
 * qu'un professionnel peut convenir avec un autre, 60 jours après la facture (code de commerce, article
 * L. 441-10). Un délai plus long ne serait pas un délai, ce serait un retard.
 */
export const DELAI_DU_CURSEUR = { min: 0, max: DELAI_MAXIMAL_CONVENU.joursDeLaFacture } as const;

/**
 * LE CALCUL À REBOURS, hypothèse du cours : la déclaration du premier trimestre de N + 1 porte
 * 42 600 € de TVA à payer, sans crédit à imputer. Ce trimestre-là, MARTEL & FILS a reçu 108 000 € HT
 * de matériaux et une mini-pelle de 45 000 € HT. Elle est toujours au régime des encaissements.
 */
export const TRIMESTRE_A_REBOURS = { aPayer: 42_600, achatsHT: 108_000, immobilisationHT: 45_000, immobilisation: "une mini-pelle" } as const;

/** Les fins de trimestre, par rang (0 : le dernier trimestre de N − 1). */
export const FINS_DES_TRIMESTRES = ["31 décembre de N − 1", "31 mars", "30 juin", "30 septembre", "31 décembre"] as const;

/** Les trimestres en colonne de tableau, par rang (0 à 4). */
export const COLONNES_DES_TRIMESTRES = ["4e trimestre de N − 1", "1er trimestre", "2e trimestre", "3e trimestre", "4e trimestre"] as const;

/** Les noms des trimestres de N, par rang (1 à 4). */
const NOMS = ["", "premier", "deuxième", "troisième", "quatrième"] as const;
export const nomDuTrimestre = (rang: number) => `${NOMS[rang]} trimestre`;

export const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** Un montant retranché ou ajouté : un négatif va entre parenthèses. */
export const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
export const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
export const jours = (j: number) => (j === 0 ? "comptant" : `${j} jours`);
const auCentime = (x: number) => Math.round(x * 100) / 100;

const FICHES: Readonly<Record<string, FicheDuBatiment>> = { [MARTEL_ET_FILS.code]: MARTEL_ET_FILS };

/** La fiche de MARTEL & FILS, lue par le code de l'entreprise. */
export function ficheDe(c: Pick<Cas, "code">): FicheDuBatiment {
  const f = FICHES[c.code];
  if (!f) throw new Error(`La TVA du cours ne se déclare pas chez ${c.code}`);
  return f;
}

/** Le régime, dit en clair. */
export const nomDuRegime = (r: RegimeDExigibilite) => (r === "debits" ? "débits" : "encaissements");

/** Ce qu'une clientèle paie dans un trimestre : la part de ses travaux du trimestre, et celle du trimestre d'avant, en clair. */
export function calculDeLEncaisse(f: FicheDuBatiment, rang: number) {
  const v = ventesDuTrimestre(f, rang);
  const avant = ventesDuTrimestre(f, rang - 1);
  return v.clienteles.map((g, i) => {
    const precedent = avant.clienteles[i]!.ventesHT;
    const calcul =
      g.delai === 0
        ? `${eur(g.ventesHT)}, payés comptant`
        : `${eur(g.ventesHT)} × ${90 - g.delai} ÷ 90 + ${eur(precedent)} × ${g.delai} ÷ 90 = ${eur(g.encaisseHT!)}`;
    return { code: g.code, nom: g.nom, delai: g.delai, ventesHT: g.ventesHT, precedentHT: precedent, encaisseHT: g.encaisseHT!, calcul };
  });
}

/** La TVA du printemps pour un investissement de i milliers d'euros HT (le curseur) : la collectée ne bouge pas. */
export function printempsAvecUnInvestissement(f: FicheDuBatiment, milliers: number) {
  const d = declarationDuTrimestre(f, TRIMESTRE_DU_CREDIT);
  const investissement = milliers * 1_000;
  const surLesMateriaux = auCentime(d.achatsHT * f.tauxDeTva);
  const surLInvestissement = auCentime(investissement * f.tauxDeTva);
  const deductible = auCentime(surLesMateriaux + surLInvestissement);
  return { collectee: d.collectee, surLesMateriaux, surLInvestissement, deductible, nette: auCentime(d.collectee - deductible) };
}

/** La TVA du printemps, aux encaissements, pour un délai des entreprises de j jours (le curseur). */
export function printempsAuDelai(f: FicheDuBatiment, j: number) {
  const leviers: Partial<LeviersDeLaTva> = { delais: { entreprises: j } };
  const d = declarationDuTrimestre(f, TRIMESTRE_DU_CREDIT, leviers);
  const entreprises = ventesDuTrimestre(f, TRIMESTRE_DU_CREDIT, leviers).clienteles.find((g) => g.code === "entreprises")!;
  return { encaisseDesEntreprises: entreprises.encaisseHT!, encaissements: d.encaissementsHT!, collectee: d.collectee, deductible: d.deductible, nette: d.nette };
}

/** Les leviers du laboratoire, codés : régime (0 encaissements, 1 débits), délai des entreprises, investissement (0 ou 1), taux en %. */
export interface PositionDeLaDeclaration {
  regime: number;
  entreprises: number;
  investissement: number;
  taux: number;
}

export const leviersDe = (p: PositionDeLaDeclaration): Partial<LeviersDeLaTva> => ({
  regime: p.regime === 1 ? "debits" : "encaissements",
  delais: { entreprises: p.entreprises },
  avecLInvestissement: p.investissement === 1,
  tauxDeTva: p.taux / 100,
});

/** Le printemps, son crédit et l'année, pour une position des leviers du laboratoire. */
export function laboratoireDeLaDeclaration(f: FicheDuBatiment, p: PositionDeLaDeclaration) {
  const l = leviersDe(p);
  const annee = declarationsDeLAnnee(f, l);
  const t2 = annee.trimestres[TRIMESTRE_DU_CREDIT - 1]!;
  const t3 = annee.trimestres[TRIMESTRE_DU_CREDIT]!;
  return {
    base: t2.baseHT,
    collectee: t2.collectee,
    deductible: t2.deductible,
    nette: t2.nette,
    aPayerDuPrintemps: t2.aPayer,
    credit: t2.creditAReporter,
    aPayerDeLEte: t3.aPayer,
    verseeDansLAnnee: annee.verseeDansLAnnee,
    dueAuBilan: annee.dueAuBilan,
  };
}

/** La position du laboratoire tirée de la fiche : son régime, le délai des entreprises, l'investissement, son taux. */
export function departDuLaboratoire(f: FicheDuBatiment): PositionDeLaDeclaration {
  return {
    regime: f.declaration.regime === "debits" ? 1 : 0,
    entreprises: f.clienteles.find((g) => g.code === "entreprises")!.delai,
    investissement: f.investissements.length > 0 ? 1 : 0,
    taux: Math.round(f.tauxDeTva * 100),
  };
}

/** Tout ce que le chapitre et son cas demandent de la déclaration de MARTEL & FILS. */
export function declarationDeTva(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = f.tauxDeTva;
  const enc = declarationsDeLAnnee(f);
  const deb = declarationsDeLAnnee(f, { regime: "debits" });
  const regimes = comparerLesRegimes(f);
  const parRang = (y: typeof enc, r: number) => (r === 0 ? y.ouverture : y.trimestres[r - 1]!);
  const ventes = [0, 1, 2, 3, 4].map((r) => ventesDuTrimestre(f, r));
  const declare = parRang(enc, TRIMESTRE_DECLARE);
  const printemps = parRang(enc, TRIMESTRE_DU_CREDIT);
  const ete = parRang(enc, TRIMESTRE_DU_CREDIT + 1);
  const printempsAuxDebits = parRang(deb, TRIMESTRE_DU_CREDIT);
  const investissement = f.investissements.find((x) => x.rang === TRIMESTRE_DU_CREDIT)!;
  // Le curseur de l'investissement : le plus gros que la TVA collectée du printemps couvre encore.
  const investissementSansCredit = Math.floor((printemps.collectee / t - printemps.achatsHT) / 1_000 + 1e-9);
  // Le curseur du délai : le plus long délai des entreprises qui laisse le printemps sans crédit.
  let delaiSansCredit = DELAI_DU_CURSEUR.min;
  for (let j = DELAI_DU_CURSEUR.min; j <= DELAI_DU_CURSEUR.max; j++) if (printempsAuDelai(f, j).nette >= 0) delaiSansCredit = j;
  // Le calcul à rebours.
  const r = TRIMESTRE_A_REBOURS;
  const deductibleARebours = auCentime((r.achatsHT + r.immobilisationHT) * t);
  const collecteeARebours = auCentime(r.aPayer + deductibleARebours);
  const encaissementsARebours = auCentime(collecteeARebours / t);
  const ecartDeLAnnee = regimes.ecartDeLAnnee;
  return {
    f,
    t,
    enc,
    deb,
    regimes,
    ventes,
    declare,
    declareAuxDebits: parRang(deb, TRIMESTRE_DECLARE),
    encaisseDuDeclare: calculDeLEncaisse(f, TRIMESTRE_DECLARE),
    printemps,
    encaisseDuPrintemps: calculDeLEncaisse(f, TRIMESTRE_DU_CREDIT),
    ete,
    encaisseDeLEte: calculDeLEncaisse(f, TRIMESTRE_DU_CREDIT + 1),
    printempsAuxDebits,
    ecartDuPrintemps: auCentime(printemps.nette - printempsAuxDebits.nette),
    investissement,
    investissementSansCredit,
    delaiSansCredit,
    delaiDesEntreprises: f.clienteles.find((g) => g.code === "entreprises")!.delai,
    deductibleARebours,
    collecteeARebours,
    encaissementsARebours,
    ecartDeLAnnee,
    /** La hausse des créances clients de l'année, hors taxes, retrouvée par l'écart des deux régimes. */
    hausseDesCreances: auCentime(-ecartDeLAnnee / t),
    creancesAuDebut: ventes[0]!.creancesHT,
    creancesALaFin: ventes[4]!.creancesHT,
    facturesDeLAnnee: ventes.slice(1).reduce((s, v) => s + v.ventesHT, 0),
    encaissementsDeLAnnee: auCentime(ventes.slice(1).reduce((s, v) => s + v.encaissementsHT!, 0)),
    depart: departDuLaboratoire(f),
  };
}

export type DeclarationDeMartel = ReturnType<typeof declarationDeTva>;

/** Les travaux d'un trimestre et de celui d'avant, clientèle par clientèle, avec les matériaux livrés. */
function tableauDuTrimestre(x: DeclarationDeMartel, rang: number, avecLInvestissement: boolean): TableauDeDonnees {
  const v = x.ventes[rang]!;
  const avant = x.ventes[rang - 1]!;
  const investi = x.f.investissements.filter((i) => i.rang === rang);
  return {
    titre: `Le ${nomDuTrimestre(rang)} de ${x.f.entreprise}`,
    colonnes: ["Délai de paiement", COLONNES_DES_TRIMESTRES[rang - 1]!, COLONNES_DES_TRIMESTRES[rang]!],
    lignes: [
      ...v.clienteles.map((g, i) => ({ libelle: `${g.nom} : travaux facturés (HT)`, valeurs: [jours(g.delai), eur(avant.clienteles[i]!.ventesHT), eur(g.ventesHT)] })),
      { libelle: "Matériaux livrés par le négoce (HT)", valeurs: [jours(x.f.fournisseur.delai), eur(x.f.achatsHT[rang]!), eur(x.f.achatsHT[rang + 1]!)] },
      ...(avecLInvestissement && investi.length > 0
        ? [{ libelle: `Matériel neuf : ${investi[0]!.libelle} (HT)`, valeurs: ["à la livraison", "", eur(investi[0]!.montantHT)] }]
        : []),
      { libelle: "Taux de TVA", valeurs: ["", pct(x.t), pct(x.t)] },
    ],
  };
}

/** L'année de MARTEL & FILS, trimestre par trimestre : facturé, encaissé, achats, et la TVA nette au régime de la fiche. */
function tableauDeLAnnee(x: DeclarationDeMartel): TableauDeDonnees {
  return {
    titre: `L'année de ${x.f.entreprise}, au régime des encaissements`,
    colonnes: [...COLONNES_DES_TRIMESTRES],
    lignes: [
      { libelle: "Travaux facturés (HT)", valeurs: x.ventes.map((v) => eur(v.ventesHT)) },
      { libelle: "Encaissements (HT)", valeurs: x.ventes.map((v) => eur(v.encaissementsHT!)) },
      { libelle: "Matériaux et matériel neuf livrés (HT)", valeurs: [0, 1, 2, 3, 4].map((r) => eur(x.f.achatsHT[r + 1]! + (r === TRIMESTRE_DU_CREDIT ? x.investissement.montantHT : 0))) },
      { libelle: "TVA nette du trimestre", valeurs: [x.enc.ouverture, ...x.enc.trimestres].map((d) => eur(d.nette)) },
    ],
  };
}

export const LA_DECLARATION_DE_TVA: Chapitre = {
  code: "la-declaration-de-tva",
  parcours: "fiscalite",
  palier: 3,
  blocs: [
    "BTS CG P3 · Gestion des obligations fiscales",
    "DCG UE4 · Droit fiscal",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "La déclaration de TVA : collectée, déductible, à payer",
  accroche:
    "Les trimestres de MARTEL & FILS, une entreprise de bâtiment : la TVA collectée sur ce que ses clients ont payé, la TVA déductible sur ses matériaux et son matériel, ce qu'elle doit à l'État, le crédit de TVA du printemps et son imputation, et ce que changerait l'option pour les débits.",
  objectifs: [
    "Dire quand la TVA devient exigible : à la livraison pour des biens, à l'encaissement pour des travaux, sauf option pour les débits",
    "Calculer la TVA collectée, la TVA déductible et la TVA à payer d'un trimestre, et passer l'écriture de la déclaration",
    "Constater un crédit de TVA et l'imputer sur la déclaration suivante",
    "Comparer un trimestre et une année aux deux régimes, et relier leur écart aux créances clients",
    "Retrouver à rebours les encaissements d'un trimestre à partir de sa déclaration",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_TVA, pourquoi: POURQUOI_LA_TVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une déclaration par trimestre",
      notions: ["vat_payable", "payment_terms"],
      tableau: (c) => tableauDuTrimestre(declarationDeTva(c), TRIMESTRE_DECLARE, false),
      texte: (c) => {
        const x = declarationDeTva(c);
        const f = x.f;
        const [commerces, collectivites, entreprises] = f.clienteles;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, une entreprise de bâtiment. Elle fait des travaux pour trois clientèles : ${commerces!.nom.toLowerCase()}, qui paient à la réception des travaux ; ${collectivites!.nom.toLowerCase()}, qui paient à ${collectivites!.delai} jours ; ${entreprises!.nom.toLowerCase()}, à ${entreprises!.delai} jours, le délai maximal entre professionnels. Elle facture la TVA à ses clients et la paie au négoce. Cette TVA n'est pas la sienne : chaque trimestre, elle déclare à l'État la TVA collectée, en retire la TVA déductible, et lui verse la différence.`,
          `Quand la TVA devient-elle due ? C'est l'exigibilité, et elle dépend de ce que l'on vend : pour une vente de biens, à la livraison ; pour des travaux ou des prestations de services, à l'encaissement du prix, sauf si l'entreprise opte pour les débits (la TVA est alors due à la facture). ${f.entreprise} fait des travaux et n'a pas opté : sa TVA collectée se calcule sur ce que ses clients lui ont payé dans le trimestre, hors taxes. Ses achats au négoce, eux, sont des biens : leur TVA se déduit à la livraison, qu'elle ait déjà payé ou non.`,
          `La simulation suppose : un seul taux, ${pct(x.t)}, parce que ses chantiers sont des locaux professionnels ou publics (la rénovation d'un logement serait à 10 % ou à 5,5 %) ; une déclaration par trimestre, versée au trimestre suivant (à sa taille, ${f.entreprise} déclarerait en réalité chaque mois : le trimestre du cours regroupe ses déclarations mensuelles) ; des chantiers finis et facturés dans le trimestre, et des clients qui paient à leur délai ; une TVA déductible sur les seuls matériaux et le matériel neuf (les autres coûts de chantier ne sont pas dans la simulation, et il n'y a pas de sous-traitance) ; un crédit de TVA imputé sur la déclaration suivante.`,
          `Voici le ${nomDuTrimestre(TRIMESTRE_DECLARE)} de N, et le dernier de N − 1 qui le précède : un client qui paie à 30 ou à 60 jours règle dans le trimestre une partie de ses travaux du trimestre, et une partie de ceux du trimestre d'avant.`,
        ];
      },
      repere: () =>
        "Encaissé dans le trimestre (HT) = travaux du trimestre × (90 − délai) ÷ 90 + travaux du trimestre d'avant × délai ÷ 90. TVA collectée = encaissements HT × taux (aux encaissements), ou travaux facturés HT × taux (aux débits). TVA déductible = biens livrés HT × taux. TVA à payer = TVA collectée − TVA déductible ; négative, c'est un crédit de TVA.",
    },
    {
      id: "l-exigibilite",
      objectifs: [0],
      type: "choix",
      titre: "Quand la TVA des travaux est due",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const f = declarationDeTva(c).f;
        return `${f.entreprise} rénove un cabinet médical, qui paiera à la réception des travaux, et les bureaux d'une entreprise, qui paiera à ${f.clienteles.find((g) => g.code === "entreprises")!.delai} jours. Quand la TVA de chacune de ces factures devient-elle due à l'État ?`;
      },
      options: (c) => {
        const f = declarationDeTva(c).f;
        return [
          {
            texte: `À l'encaissement du prix : ${f.entreprise} fait des travaux, sans option pour les débits`,
            juste: true,
            retour: `Oui : des travaux sont des prestations de services, dont la TVA est exigible à l'encaissement. Celle du cabinet est due dès la réception ; celle de l'entreprise, quand elle paiera. Elle se déclare au trimestre de l'encaissement, et se verse au trimestre suivant.`,
          },
          {
            texte: "À la facture, que le client ait payé ou non",
            juste: false,
            retour: `Non : c'est le régime des débits. Pour des travaux, il ne s'applique que si l'entreprise opte pour lui, et ${f.entreprise} ne l'a pas fait.`,
          },
          {
            texte: "À la réception des travaux, comme une livraison de biens",
            juste: false,
            retour: `Non : la livraison fixe l'exigibilité d'une vente de biens, comme les matériaux que ${f.entreprise} achète au négoce. Des travaux sont des prestations de services : leur TVA attend le paiement.`,
          },
          {
            texte: "Au versement à l'État, au trimestre suivant",
            juste: false,
            retour: "Non : c'est l'échéance du paiement de la TVA, pas son exigibilité. La TVA devient due quand le client paie ; elle se déclare pour ce trimestre-là, puis se verse au suivant.",
          },
        ];
      },
    },
    {
      id: "les-encaissements",
      objectifs: [0],
      type: "montants",
      titre: "Ce que les clients ont payé",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const x = declarationDeTva(c);
        const [commerces, collectivites, entreprises] = x.encaisseDuDeclare;
        return `Combien ${x.f.entreprise} a-t-elle encaissé au ${nomDuTrimestre(TRIMESTRE_DECLARE)}, hors taxes ? Les commerces paient comptant : leurs ${eur(commerces!.ventesHT)} du trimestre. Calculez l'encaissé des collectivités (${eur(collectivites!.ventesHT)} × ${90 - collectivites!.delai} ÷ 90 + ${eur(collectivites!.precedentHT)} × ${collectivites!.delai} ÷ 90), celui des entreprises (${eur(entreprises!.ventesHT)} × ${90 - entreprises!.delai} ÷ 90 + ${eur(entreprises!.precedentHT)} × ${entreprises!.delai} ÷ 90), puis le total du trimestre.`;
      },
      champs: (c) => {
        const x = declarationDeTva(c);
        const [commerces, collectivites, entreprises] = x.encaisseDuDeclare;
        return [
          { libelle: "Encaissé des collectivités (HT)", attendu: collectivites!.encaisseHT, calcul: collectivites!.calcul },
          { libelle: "Encaissé des entreprises (HT)", attendu: entreprises!.encaisseHT, calcul: entreprises!.calcul },
          {
            libelle: "Encaissements du premier trimestre (HT)",
            attendu: x.declare.encaissementsHT!,
            calcul: `${eur(commerces!.encaisseHT)} + ${eur(collectivites!.encaisseHT)} + ${eur(entreprises!.encaisseHT)} = ${eur(x.declare.encaissementsHT!)}`,
          },
        ];
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        return [
          `${x.f.entreprise} a facturé ${eur(x.declare.ventesHT)} HT au ${nomDuTrimestre(TRIMESTRE_DECLARE)}, mais encaissé ${eur(x.declare.encaissementsHT!)} HT : les gros chantiers de l'automne, facturés en N − 1, se paient au début de N, quand l'hiver ralentit les nouveaux. Aux encaissements, c'est sur ces ${eur(x.declare.encaissementsHT!)} que la TVA se collecte.`,
        ];
      },
    },
    {
      id: "calcul",
      objectifs: [1],
      type: "montants",
      titre: "Collectée, déductible, à payer",
      notions: ["vat_payable"],
      question: (c) => {
        const x = declarationDeTva(c);
        return `Calculez la TVA collectée sur les ${eur(x.declare.encaissementsHT!)} encaissés, la TVA déductible sur les ${eur(x.declare.achatsHT)} de matériaux livrés, au taux de ${pct(x.t)}, puis la TVA à payer du ${nomDuTrimestre(TRIMESTRE_DECLARE)}.`;
      },
      champs: (c) => {
        const x = declarationDeTva(c);
        const d = x.declare;
        return [
          { libelle: "TVA collectée", attendu: d.collectee, calcul: `${eur(d.encaissementsHT!)} × ${pct(x.t)} = ${eur(d.collectee)}` },
          { libelle: "TVA déductible", attendu: d.deductible, calcul: `${eur(d.achatsHT)} × ${pct(x.t)} = ${eur(d.deductible)}` },
          { libelle: "TVA à payer", attendu: d.aPayer, calcul: `${eur(d.collectee)} − ${eur(d.deductible)} = ${eur(d.aPayer)}` },
        ];
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        const d = x.declare;
        const b = x.declareAuxDebits;
        return [
          `Au ${FINS_DES_TRIMESTRES[TRIMESTRE_DECLARE]}, ${x.f.entreprise} doit ${eur(d.aPayer)} à l'État, qu'elle versera au ${nomDuTrimestre(TRIMESTRE_DECLARE + 1)}. Rien de cela n'est passé par le compte de résultat : les travaux et les matériaux y sont hors taxes.`,
          `Avec l'option pour les débits, la TVA se serait collectée sur les ${eur(b.ventesHT)} facturés : ${eur(b.collectee)}, et ${eur(b.aPayer)} à payer. Le même trimestre ne doit pas la même TVA selon le régime.`,
        ];
      },
    },
    {
      id: "liquidation",
      objectifs: [1],
      type: "ecriture",
      titre: "L'écriture de la déclaration",
      notions: ["vat_payable", "balance_sheet"],
      evenement: (c) => {
        const x = declarationDeTva(c);
        return `Le ${FINS_DES_TRIMESTRES[TRIMESTRE_DECLARE]}, ${x.f.entreprise} arrête la TVA du ${nomDuTrimestre(TRIMESTRE_DECLARE)} : le compte 44571, TVA collectée, porte ${eur(x.declare.collectee)} au crédit ; le compte 44566, TVA déductible sur autres biens et services, ${eur(x.declare.deductible)} au débit. Passez l'écriture qui solde ces deux comptes et constate ce qui est dû à l'État.`;
      },
      piece: (c) => {
        const x = declarationDeTva(c);
        return {
          nature: `Déclaration de TVA du ${nomDuTrimestre(TRIMESTRE_DECLARE)}`,
          de: x.f.entreprise,
          a: "L'administration fiscale",
          date: FINS_DES_TRIMESTRES[TRIMESTRE_DECLARE]!,
          lignes: [
            { libelle: "TVA brute, collectée sur les encaissements", montant: x.declare.collectee },
            { libelle: "TVA déductible, sur les matériaux livrés", montant: x.declare.deductible },
          ],
          totaux: [{ libelle: "TVA nette due", montant: x.declare.aPayer, fort: true }],
          mention: "À verser au trimestre suivant.",
        };
      },
      ecriture: (c) => {
        const x = declarationDeTva(c);
        const d = x.declare;
        return {
          date: FINS_DES_TRIMESTRES[TRIMESTRE_DECLARE]!,
          libelle: `Déclaration de TVA du ${nomDuTrimestre(TRIMESTRE_DECLARE)}`,
          lignes: [
            { role: "la TVA collectée, soldée", compte: "44571", sens: "debit", montant: d.collectee, indice: "la TVA collectée du trimestre" },
            { role: "la TVA déductible, soldée", compte: "44566", sens: "credit", montant: d.deductible, indice: "la TVA déductible du trimestre" },
            { role: "la dette envers l'État", compte: "44551", sens: "credit", montant: d.aPayer, indice: "la différence, que l'entreprise doit à l'État" },
          ],
        };
      },
      indices: () => [
        "La TVA collectée est au crédit du compte 44571 : pour la solder, on la passe au débit. La TVA déductible est au débit du 44566 : on la solde au crédit.",
        "La différence est une dette envers l'État, au crédit d'un compte de la classe 4 : 44551, TVA à décaisser.",
      ],
      explication: (c) => {
        const x = declarationDeTva(c);
        return [
          `Les comptes de TVA collectée et déductible sont soldés : il ne reste que ${eur(x.declare.aPayer)} au crédit du 44551, la dette envers l'État. Elle s'éteindra au ${nomDuTrimestre(TRIMESTRE_DECLARE + 1)}, quand ${x.f.entreprise} paiera : débit 44551, crédit 512.`,
          "Aux encaissements, la TVA d'une facture pas encore payée attend sur un compte d'attente de TVA, et ne passe au 44571 qu'à l'encaissement : c'est pourquoi le 44571 ne porte ici que la TVA des sommes reçues. L'écriture de la déclaration, elle, est la même aux deux régimes.",
        ];
      },
    },
    {
      id: "deductible",
      objectifs: [1],
      type: "choix",
      titre: "Ce que l'entreprise déduit",
      notions: ["vat_payable"],
      question: (c) => {
        const x = declarationDeTva(c);
        return `Au ${nomDuTrimestre(TRIMESTRE_DECLARE)}, ${x.f.entreprise} a payé ses compagnons, son assurance décennale et le loyer de son dépôt, et reçu ${eur(x.declare.achatsHT)} HT de matériaux, qu'elle paiera au négoce à ${x.f.fournisseur.delai} jours. Sur quoi déduit-elle de la TVA ce trimestre ?`;
      },
      options: (c) => {
        const x = declarationDeTva(c);
        return [
          {
            texte: "Sur les matériaux livrés, même pas encore payés au négoce",
            juste: true,
            retour: `Oui : les matériaux sont des biens, leur TVA est exigible chez le négoce à la livraison, et ${x.f.entreprise} la déduit dès la livraison (${eur(x.declare.deductible)}). Les salaires et l'assurance ne portent pas de TVA ; dans la simulation, le loyer du dépôt non plus. Les autres coûts de chantier (location de matériel, évacuation des gravats, carburant) ne sont pas dans la simulation : leur TVA se déduirait aussi.`,
          },
          {
            texte: "Sur les matériaux, mais une fois le négoce payé",
            juste: false,
            retour: "Non : ce serait appliquer à ses achats la règle de ses ventes. La TVA d'un achat se déduit quand elle est exigible chez le fournisseur : pour des biens, à la livraison.",
          },
          {
            texte: "Sur toutes ses dépenses, salaires et assurance compris",
            juste: false,
            retour: "Non : un salaire ne porte pas de TVA, ni une prime d'assurance. Il n'y a rien à en déduire.",
          },
          {
            texte: "Sur aucune : la TVA payée au négoce est une charge du chantier",
            juste: false,
            retour: `Non : la TVA payée sur un achat se récupère, c'est la TVA déductible (${eur(x.declare.deductible)} ce trimestre). Elle n'entre pas au compte de résultat.`,
          },
        ];
      },
    },
    {
      id: "predire-le-credit",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la déclaration du printemps",
      notions: ["vat_payable"],
      question: (c) => {
        const x = declarationDeTva(c);
        return `Au ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)}, ${x.f.entreprise} renouvelle son matériel : ${x.investissement.libelle}, ${eur(x.investissement.montantHT)} HT, livrés et payés au printemps. Ce sont des biens, dont la TVA se déduit à la livraison. Avant de calculer, pariez : sa déclaration du ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)} sera…`;
      },
      options: (c) => {
        const x = declarationDeTva(c);
        const voir = "Faites varier l'investissement à l'étape suivante : le curseur montre où la TVA déductible passe la TVA collectée.";
        return [
          { texte: `Un crédit de TVA : l'État devra de l'argent à ${x.f.entreprise}`, juste: x.printemps.nette < 0, retour: `Bon pari. ${voir}` },
          { texte: "Une TVA à payer plus lourde, car le matériel va avec plus de chantiers", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Une TVA à payer plus légère, mais jamais négative", juste: x.printemps.nette >= 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "jusqu-ou-investir",
      objectifs: [2],
      type: "curseur",
      titre: "Jusqu'où investir sans crédit",
      notions: ["vat_payable"],
      question: (c) => {
        const x = declarationDeTva(c);
        return `Au ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)}, ${x.f.entreprise} collecte ${eur(x.printemps.collectee)} de TVA sur ses encaissements et reçoit ${eur(x.printemps.achatsHT)} HT de matériaux. Faites varier l'investissement du trimestre, de ${INVESTISSEMENT_DU_CURSEUR.min} à ${INVESTISSEMENT_DU_CURSEUR.max} milliers d'euros HT : une droite donne la TVA collectée, l'autre la TVA déductible, matériaux et investissement réunis. Placez le curseur sur le plus gros investissement que la TVA collectée couvre encore, puis validez.`;
      },
      grandeur: () => ({ libelle: "Investissement du printemps", unite: "milliers d'euros (HT)" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: declarationDeTva(c).investissementSansCredit, min: INVESTISSEMENT_DU_CURSEUR.min, max: INVESTISSEMENT_DU_CURSEUR.max }),
      zones: ["TVA à payer", "Crédit de TVA"],
      rates: () => ({
        dessous: "Plus loin, la TVA collectée couvre encore la TVA déductible : cherchez le plus gros investissement.",
        dessus: "À cette position, la TVA déductible dépasse déjà la TVA collectée : le trimestre se déclare en crédit.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, i) => {
        const p = printempsAvecUnInvestissement(declarationDeTva(c).f, i);
        return [
          { libelle: "TVA collectée du trimestre", montant: p.collectee },
          { libelle: "TVA déductible sur les matériaux", montant: p.surLesMateriaux },
          { libelle: "TVA déductible sur l'investissement", montant: p.surLInvestissement },
          { libelle: "TVA nette du trimestre", montant: p.nette, fort: true },
        ];
      },
      droites: (c) => {
        const f = declarationDeTva(c).f;
        return {
          produit: (i) => printempsAvecUnInvestissement(f, i).collectee,
          cout: (i) => printempsAvecUnInvestissement(f, i).deductible,
          libelles: ["TVA collectée sur les encaissements", "TVA déductible, matériaux et investissement"],
        };
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        const p = x.printemps;
        return [
          `La TVA collectée couvre la TVA déductible jusqu'à ${eur(x.investissementSansCredit * 1_000)} HT d'investissement : ${eur(p.achatsHT)} de matériaux et ${eur(x.investissementSansCredit * 1_000)} de matériel font ${eur(p.achatsHT + x.investissementSansCredit * 1_000)}, exactement les encaissements du trimestre. Avec les ${eur(x.investissement.montantHT)} du matériel neuf, la TVA déductible passe la collectée de ${eur(-p.nette)} : le printemps se déclare en crédit.`,
          "Ce crédit n'est ni une perte ni un gain : c'est une TVA facturée par le négoce et le vendeur du matériel, plus forte que la TVA encaissée sur les clients, que l'État doit à l'entreprise. L'étape suivante le fait calculer.",
        ];
      },
    },
    {
      id: "le-credit",
      objectifs: [2],
      type: "montants",
      titre: "Le crédit de TVA du printemps",
      notions: ["vat_payable", "balance_sheet"],
      tableau: (c) => tableauDuTrimestre(declarationDeTva(c), TRIMESTRE_DU_CREDIT, true),
      question: (c) =>
        `Sans formule cette fois. Déclarez le ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)} de ${declarationDeTva(c).f.entreprise} : ses encaissements hors taxes, la TVA collectée, la TVA déductible, puis la TVA nette du trimestre (négative pour un crédit de TVA).`,
      champs: (c) => {
        const x = declarationDeTva(c);
        const p = x.printemps;
        const e = x.encaisseDuPrintemps;
        return [
          {
            libelle: "Encaissements du deuxième trimestre (HT)",
            attendu: p.encaissementsHT!,
            calcul: `${e.map((g) => eur(g.encaisseHT)).join(" + ")} = ${eur(p.encaissementsHT!)}, dont ${e.filter((g) => g.delai > 0).map((g) => `${g.nom.toLowerCase()} : ${g.calcul}`).join(" ; ")}`,
          },
          { libelle: "TVA collectée du deuxième trimestre", attendu: p.collectee, calcul: `${eur(p.encaissementsHT!)} × ${pct(x.t)} = ${eur(p.collectee)}` },
          {
            libelle: "TVA déductible du deuxième trimestre",
            attendu: p.deductible,
            calcul: `(${eur(p.achatsHT)} de matériaux + ${eur(p.immobilisationsHT)} de matériel) × ${pct(x.t)} = ${eur(p.deductible)}`,
          },
          { libelle: "TVA nette du deuxième trimestre", attendu: p.nette, calcul: `${eur(p.collectee)} − ${eur(p.deductible)} = ${eur(p.nette)}` },
        ];
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        const p = x.printemps;
        return [
          `La TVA déductible dépasse la TVA collectée de ${eur(-p.nette)} : c'est un crédit de TVA. Au ${FINS_DES_TRIMESTRES[TRIMESTRE_DU_CREDIT]}, l'État doit ${eur(-p.nette)} à ${x.f.entreprise}, qui ne versera rien au ${nomDuTrimestre(TRIMESTRE_DU_CREDIT + 1)} pour ce trimestre.`,
          `Au bilan, ce n'est plus une dette envers l'État, mais une créance sur lui. Le matériel, lui, entre à l'actif pour ${eur(p.immobilisationsHT)} hors taxes : sa TVA ne fait pas partie de son coût.`,
        ];
      },
    },
    {
      id: "l-imputation",
      objectifs: [2],
      type: "montants",
      titre: "Le crédit imputé à l'été",
      notions: ["vat_payable"],
      tableau: (c) => tableauDuTrimestre(declarationDeTva(c), TRIMESTRE_DU_CREDIT + 1, false),
      question: (c) =>
        `Déclarez maintenant le ${nomDuTrimestre(TRIMESTRE_DU_CREDIT + 1)} : la TVA collectée, la TVA déductible, la TVA nette du trimestre, puis ce que ${declarationDeTva(c).f.entreprise} versera à l'État, une fois le crédit du printemps imputé.`,
      champs: (c) => {
        const x = declarationDeTva(c);
        const e = x.ete;
        return [
          {
            libelle: "TVA collectée du troisième trimestre",
            attendu: e.collectee,
            calcul: `(${x.encaisseDeLEte.map((g) => eur(g.encaisseHT)).join(" + ")}) × ${pct(x.t)} = ${eur(e.encaissementsHT!)} × ${pct(x.t)} = ${eur(e.collectee)}`,
          },
          { libelle: "TVA déductible du troisième trimestre", attendu: e.deductible, calcul: `${eur(e.achatsHT)} × ${pct(x.t)} = ${eur(e.deductible)}` },
          { libelle: "TVA nette du troisième trimestre", attendu: e.nette, calcul: `${eur(e.collectee)} − ${eur(e.deductible)} = ${eur(e.nette)}` },
          { libelle: "TVA à payer, crédit imputé", attendu: e.aPayer, calcul: `${eur(e.nette)} − ${eur(e.creditRecu)} de crédit = ${eur(e.aPayer)}` },
        ];
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        const e = x.ete;
        return [
          `Le crédit du printemps vient en déduction de la TVA nette de l'été : ${x.f.entreprise} verse ${eur(e.aPayer)} au lieu de ${eur(e.nette)}. Le crédit s'est éteint ; il ne reste rien à reporter.`,
        ];
      },
    },
    {
      id: "lire-le-credit",
      objectifs: [2],
      type: "choix",
      titre: "Ce que devient un crédit de TVA",
      notions: ["vat_payable", "balance_sheet"],
      question: (c) => {
        const x = declarationDeTva(c);
        return `Au ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)}, ${x.f.entreprise} a déclaré un crédit de TVA de ${eur(x.printemps.creditAReporter)}. Que devient-il, sans démarche particulière ?`;
      },
      options: (c) => {
        const x = declarationDeTva(c);
        const credit = eur(x.printemps.creditAReporter);
        return [
          {
            texte: "Il s'impute sur la déclaration suivante",
            juste: true,
            retour: `Oui : il vient en déduction de la TVA nette du trimestre suivant (${eur(x.ete.nette)} − ${credit} = ${eur(x.ete.aPayer)}). Un remboursement se demande, sous conditions : par défaut, le crédit s'impute.`,
          },
          {
            texte: "L'État le rembourse d'office au trimestre suivant",
            juste: false,
            retour: `Non : un remboursement se demande, sous conditions. Sans demande, les ${credit} s'imputent sur la déclaration suivante.`,
          },
          {
            texte: "Il est perdu : la TVA payée en trop devient une charge",
            juste: false,
            retour: "Non : la TVA déductible se récupère même quand elle dépasse la TVA collectée. Rien n'entre au compte de résultat.",
          },
          {
            texte: `${x.f.entreprise} le doit à l'État, et le paie au trimestre suivant`,
            juste: false,
            retour: `Non : c'est l'inverse. La TVA déductible l'emporte : l'État doit ${credit} à ${x.f.entreprise}.`,
          },
        ];
      },
    },
    {
      id: "predire-le-delai",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le délai des entreprises",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const x = declarationDeTva(c);
        return `Le crédit du printemps vient de l'investissement, mais pas seulement. Les entreprises paient à ${x.delaiDesEntreprises} jours : leurs gros chantiers du printemps ne sont encaissés qu'en partie au ${FINS_DES_TRIMESTRES[TRIMESTRE_DU_CREDIT]}. Si les entreprises payaient plus vite, le crédit du ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)}…`;
      },
      options: (c) => {
        const x = declarationDeTva(c);
        const voir = "Faites varier le délai des entreprises à l'étape suivante : le curseur montre la TVA collectée qui suit.";
        return [
          { texte: "Fondrait, jusqu'à disparaître : la TVA collectée suit l'argent reçu", juste: x.delaiSansCredit < x.delaiDesEntreprises, retour: `Bon pari. ${voir}` },
          { texte: "Ne bougerait pas : la TVA se collecte sur les factures", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Grandirait : des clients plus rapides font plus de TVA à déduire", juste: x.delaiSansCredit >= x.delaiDesEntreprises, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-delai-qui-fait-le-credit",
      objectifs: [3],
      type: "curseur",
      titre: "Le délai qui fait le crédit",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const x = declarationDeTva(c);
        return `Au régime des encaissements, faites varier le délai de paiement des entreprises, de ${DELAI_DU_CURSEUR.min} à ${DELAI_DU_CURSEUR.max} jours (le maximum que la loi permet de convenir), tout le reste du printemps identique (investissement compris). Une droite donne la TVA collectée du ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)}, l'autre sa TVA déductible, ${eur(x.printemps.deductible)}. Placez le curseur sur le plus long délai où la TVA collectée couvre encore la TVA déductible, puis validez.`;
      },
      grandeur: () => ({ libelle: "Délai des entreprises", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: declarationDeTva(c).delaiSansCredit, min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max }),
      zones: ["TVA à payer", "Crédit de TVA"],
      rates: () => ({
        dessous: "Plus loin, la TVA collectée couvre encore la TVA déductible : cherchez le plus long délai.",
        dessus: "À cette position, les entreprises paient trop tard pour couvrir la TVA déductible : le printemps se déclare en crédit.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, j) => {
        const p = printempsAuDelai(declarationDeTva(c).f, j);
        return [
          { libelle: "Encaissé des entreprises au printemps (HT)", montant: p.encaisseDesEntreprises },
          { libelle: "TVA collectée du printemps", montant: p.collectee },
          { libelle: "TVA déductible du printemps", montant: p.deductible },
          { libelle: "TVA nette du printemps", montant: p.nette, fort: true },
        ];
      },
      droites: (c) => {
        const f = declarationDeTva(c).f;
        return {
          produit: (j) => printempsAuDelai(f, j).collectee,
          cout: (j) => printempsAuDelai(f, j).deductible,
          libelles: ["TVA collectée sur les encaissements", "TVA déductible du printemps"],
        };
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        const limite = printempsAuDelai(x.f, x.delaiSansCredit);
        const reel = printempsAuDelai(x.f, x.delaiDesEntreprises);
        return [
          `Aux encaissements, le délai des clients entre dans la déclaration. À ${x.delaiDesEntreprises} jours, les entreprises ne paient au printemps que ${eur(reel.encaisseDesEntreprises)} HT ; à ${x.delaiSansCredit} jours, elles en paieraient ${eur(limite.encaisseDesEntreprises)}, et la TVA collectée (${eur(limite.collectee)}) couvrirait juste la TVA déductible. Au-delà, le printemps se déclare en crédit.`,
          `Aux débits, le délai n'y changerait rien : la TVA se collecterait sur les ${eur(x.printempsAuxDebits.ventesHT)} facturés, quel que soit le jour du paiement. C'est l'expérience du laboratoire qui suit.`,
        ];
      },
    },
    {
      id: "predire-l-option",
      objectifs: [0, 3],
      type: "choix",
      titre: "Pariez sur l'option pour les débits",
      notions: ["vat_payable"],
      question: (c) => {
        const x = declarationDeTva(c);
        return `Supposez que ${x.f.entreprise} ait opté pour les débits : la TVA de ses travaux serait due à la facture. Au ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)}, elle facture ${eur(x.printemps.ventesHT)} HT pour ${eur(x.printemps.encaissementsHT!)} HT encaissés. Pariez : ce trimestre se déclarerait…`;
      },
      options: (c) => {
        const x = declarationDeTva(c);
        const voir = "Le laboratoire suivant vous laisse choisir le régime : regardez la déclaration changer.";
        return [
          { texte: "Avec une TVA à payer : la collectée suit les travaux facturés", juste: x.printempsAuxDebits.nette >= 0, retour: `Bon pari. ${voir}` },
          { texte: "Avec le même crédit : l'option ne change que la date des factures", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Avec un crédit plus gros : l'option avance la déduction", juste: x.printempsAuxDebits.nette < 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-declaration",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la déclaration",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const x = declarationDeTva(c);
        return `Déclarez le printemps de ${x.f.entreprise} sous toutes ses formes : le régime (les encaissements, le sien, ou les débits, sur option), le délai des entreprises, l'investissement du printemps et le taux de TVA. Le tableau suit la déclaration du ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)}, celle du ${nomDuTrimestre(TRIMESTRE_DU_CREDIT + 1)} qui reçoit son crédit, et l'année. Le graphique fait glisser le délai des entreprises.`;
      },
      leviers: (c) => {
        const x = declarationDeTva(c);
        const d = x.depart;
        return [
          {
            code: "regime",
            libelle: "Régime de la TVA",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: d.regime,
            choix: [
              { valeur: 0, libelle: "Encaissements, son régime" },
              { valeur: 1, libelle: "Débits, sur option" },
            ],
          },
          { code: "entreprises", libelle: "Délai des entreprises", unite: "jours", min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max, pas: 1, depart: d.entreprises },
          {
            code: "investissement",
            libelle: "Investissement du printemps",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: d.investissement,
            choix: [
              { valeur: 0, libelle: "Sans" },
              { valeur: 1, libelle: `Avec, ${eur(x.investissement.montantHT)} HT` },
            ],
          },
          {
            code: "taux",
            libelle: "Taux de TVA",
            unite: "%",
            min: 10,
            max: 20,
            pas: 10,
            depart: d.taux,
            choix: [
              { valeur: 10, libelle: "10 %, la rénovation d'un logement" },
              { valeur: 20, libelle: "20 %, le taux normal" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = declarationDeTva(c);
        const l = laboratoireDeLaDeclaration(x.f, p as unknown as PositionDeLaDeclaration);
        const d = laboratoireDeLaDeclaration(x.f, x.depart);
        return [
          { libelle: "Base de la TVA collectée du printemps (HT)", montant: l.base, reference: d.base },
          { libelle: "TVA collectée du printemps", montant: l.collectee, reference: d.collectee },
          { libelle: "TVA déductible du printemps", montant: l.deductible, reference: d.deductible },
          { libelle: "TVA nette du printemps", montant: l.nette, reference: d.nette },
          { libelle: "Crédit reporté sur l'été", montant: l.credit, reference: d.credit },
          { libelle: "TVA à payer de l'été, crédit imputé", montant: l.aPayerDeLEte, reference: d.aPayerDeLEte },
          { libelle: "TVA versée à l'État dans l'année", montant: l.verseeDansLAnnee, reference: d.verseeDansLAnnee },
          { libelle: "TVA due au 31 décembre", montant: l.dueAuBilan, reference: d.dueAuBilan, fort: true },
        ];
      },
      // Les TVA à payer et le crédit ne sont pas des droites du délai : aux encaissements, elles cassent
      // au délai où le crédit naît (un « ou zéro » de la déclaration). Aux débits, elles ne bougent pas.
      graphique: (c) => {
        const f = declarationDeTva(c).f;
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDeLaDeclaration(f, p as unknown as PositionDeLaDeclaration);
        return {
          levier: "entreprises",
          courbes: [
            { libelle: "TVA à payer du printemps", valeur: (p) => lire(p).aPayerDuPrintemps },
            { libelle: "Crédit reporté sur l'été", valeur: (p) => lire(p).credit },
            { libelle: "TVA à payer de l'été, crédit imputé", valeur: (p) => lire(p).aPayerDeLEte },
          ],
        };
      },
      defi: (c) => {
        const x = declarationDeTva(c);
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDeLaDeclaration(x.f, p as unknown as PositionDeLaDeclaration);
        const taux = Math.round(x.t * 100);
        return {
          consigne: `Gardez l'investissement du printemps et le taux de ${taux} %, et déclarez le ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)} sans crédit de TVA.`,
          atteint: (p) => p.investissement === 1 && p.taux === taux && lire(p).credit === 0,
          indice: (p) => {
            if (p.investissement !== 1) return `Le défi garde l'investissement du printemps : sans lui, plus de crédit, mais ${x.f.entreprise} a bien reçu son matériel.`;
            if (p.taux !== taux) return `Le défi garde le taux de ${taux} % : celui des locaux professionnels et publics de ${x.f.entreprise}.`;
            const l = lire(p);
            return `Le printemps laisse encore un crédit de ${eur(l.credit)} : la TVA collectée (${eur(l.collectee)}) ne couvre pas la TVA déductible (${eur(l.deductible)}). Jouez sur ce qui fait la base de la TVA collectée.`;
          },
          solution: { regime: 1, entreprises: x.depart.entreprises, investissement: 1, taux },
        };
      },
      explication: (c, p) => {
        const x = declarationDeTva(c);
        const l = laboratoireDeLaDeclaration(x.f, p as unknown as PositionDeLaDeclaration);
        const d = laboratoireDeLaDeclaration(x.f, x.depart);
        const debut =
          p.regime === 1
            ? `Aux débits, la TVA du printemps se collecte sur les ${eur(l.base)} facturés : ${eur(l.collectee)}, qui couvrent les ${eur(l.deductible)} de TVA déductible. Plus de crédit, mais ${eur(l.aPayerDuPrintemps)} à verser dès l'été, quand les encaissements ne faisaient rien verser.`
            : `Aux encaissements, il a fallu que les entreprises paient à ${p.entreprises} jours : la TVA collectée suit l'argent reçu, ${eur(l.base)} au printemps, et couvre alors les ${eur(l.deductible)} de TVA déductible.`;
        return [
          debut,
          `Le régime ne change pas la TVA d'une facture : il change le trimestre où elle est due. Sur l'année, à cette position, ${x.f.entreprise} verse ${eur(l.verseeDansLAnnee)} à l'État (${eur(d.verseeDansLAnnee)} au départ) et lui doit ${eur(l.dueAuBilan)} au 31 décembre (${eur(d.dueAuBilan)} au départ).`,
        ];
      },
    },
    {
      id: "aux-debits",
      objectifs: [3],
      type: "montants",
      titre: "Le même trimestre, deux régimes",
      notions: ["vat_payable"],
      question: (c) =>
        `Déclarez le ${nomDuTrimestre(TRIMESTRE_DU_CREDIT)} de ${declarationDeTva(c).f.entreprise} au régime des débits : la TVA collectée, la TVA à payer, puis l'écart de TVA nette entre les deux régimes, encaissements moins débits (négatif si les encaissements déclarent moins).`,
      champs: (c) => {
        const x = declarationDeTva(c);
        const b = x.printempsAuxDebits;
        const p = x.printemps;
        return [
          { libelle: "TVA collectée aux débits", attendu: b.collectee, calcul: `${eur(b.ventesHT)} facturés × ${pct(x.t)} = ${eur(b.collectee)}` },
          { libelle: "TVA à payer aux débits", attendu: b.aPayer, calcul: `${eur(b.collectee)} − ${eur(b.deductible)} = ${eur(b.aPayer)}` },
          {
            libelle: "Écart de TVA nette, encaissements moins débits",
            attendu: x.ecartDuPrintemps,
            calcul: `${eur(p.nette)} − ${eur(b.nette)} = ${eur(x.ecartDuPrintemps)}, soit (${eur(p.encaissementsHT!)} − ${eur(b.ventesHT)}) × ${pct(x.t)}`,
          },
        ];
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        return [
          `La TVA déductible est la même aux deux régimes : ce sont des biens, déduits à la livraison. Seule la TVA collectée change, et l'écart de TVA nette est l'écart entre encaissé et facturé du trimestre, au taux de ${pct(x.t)}. Au printemps, ${x.f.entreprise} facture plus qu'elle n'encaisse : les débits font payer plus tôt.`,
        ];
      },
    },
    {
      id: "echeance",
      objectifs: [1],
      type: "montants",
      titre: "Ce qui se verse dans l'année",
      notions: ["vat_payable", "cash_budget"],
      tableau: (c) => tableauDeLAnnee(declarationDeTva(c)),
      question: (c) =>
        `Une déclaration se verse au trimestre suivant. Combien ${declarationDeTva(c).f.entreprise} a-t-elle versé à l'État pendant l'année N, et combien lui doit-elle au bilan du 31 décembre ?`,
      champs: (c) => {
        const x = declarationDeTva(c);
        const versees = [x.enc.ouverture, ...x.enc.trimestres.slice(0, 3)].map((d) => d.aPayer);
        return [
          {
            libelle: "TVA versée à l'État pendant l'année N",
            attendu: x.enc.verseeDansLAnnee,
            calcul: `la TVA à payer du dernier trimestre de N − 1 et des trois premiers de N, crédit imputé : ${versees.map(eur).join(" + ")} = ${eur(x.enc.verseeDansLAnnee)}`,
          },
          { libelle: "TVA due à l'État au 31 décembre", attendu: x.enc.dueAuBilan, calcul: `la TVA à payer du ${nomDuTrimestre(4)}, versée en N + 1 : ${eur(x.enc.dueAuBilan)}` },
        ];
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        return [
          `Chaque trimestre paie celui d'avant : en janvier, la TVA de l'automne de N − 1 (${eur(x.enc.ouverture.aPayer)}) ; au ${nomDuTrimestre(TRIMESTRE_DU_CREDIT + 1)}, rien pour le printemps, mais le crédit s'impute sur la TVA de l'été. La TVA du ${nomDuTrimestre(4)}, ${eur(x.enc.dueAuBilan)}, reste au passif du bilan du 31 décembre : une dette de l'exercice, versée dans le suivant.`,
        ];
      },
    },
    {
      id: "l-ecart-de-l-annee",
      objectifs: [3],
      type: "montants",
      titre: "L'année aux deux régimes",
      notions: ["vat_payable", "bfr"],
      tableau: (c) => tableauDeLAnnee(declarationDeTva(c)),
      question: (c) =>
        `Expert. Sur l'année N, calculez la TVA nette déclarée par ${declarationDeTva(c).f.entreprise} aux encaissements, puis aux débits, et leur écart (encaissements moins débits, négatif si les encaissements déclarent moins). Retrouvez ensuite, à partir de cet écart seul, de combien ses créances clients hors taxes ont grossi pendant l'année.`,
      champs: (c) => {
        const x = declarationDeTva(c);
        return [
          {
            libelle: "TVA nette de l'année aux encaissements",
            attendu: x.enc.netteDeLAnnee,
            calcul: `${eur(x.encaissementsDeLAnnee)} encaissés × ${pct(x.t)} − ${eur(x.enc.deductibleDeLAnnee)} de TVA déductible = ${eur(x.enc.collecteeDeLAnnee)} − ${eur(x.enc.deductibleDeLAnnee)} = ${eur(x.enc.netteDeLAnnee)}`,
          },
          {
            libelle: "TVA nette de l'année aux débits",
            attendu: x.deb.netteDeLAnnee,
            calcul: `${eur(x.facturesDeLAnnee)} facturés × ${pct(x.t)} − ${eur(x.deb.deductibleDeLAnnee)} = ${eur(x.deb.collecteeDeLAnnee)} − ${eur(x.deb.deductibleDeLAnnee)} = ${eur(x.deb.netteDeLAnnee)}`,
          },
          { libelle: "Écart de l'année, encaissements moins débits", attendu: x.ecartDeLAnnee, calcul: `${eur(x.enc.netteDeLAnnee)} − ${eur(x.deb.netteDeLAnnee)} = ${eur(x.ecartDeLAnnee)}` },
          { libelle: "Hausse des créances clients de l'année (HT)", attendu: x.hausseDesCreances, calcul: `${eur(-x.ecartDeLAnnee)} ÷ ${pct(x.t)} = ${eur(x.hausseDesCreances)}` },
        ];
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        return [
          `Facturé moins encaissé de l'année : ${eur(x.facturesDeLAnnee)} − ${eur(x.encaissementsDeLAnnee)} = ${eur(x.hausseDesCreances)} HT, exactement la hausse des créances clients, de ${eur(x.creancesAuDebut)} au ${FINS_DES_TRIMESTRES[0]} à ${eur(x.creancesALaFin)} au ${FINS_DES_TRIMESTRES[4]}. Les débits font déclarer la TVA de ces créances avant leur encaissement.`,
          `Trimestre par trimestre, l'écart change de signe (${x.regimes.ecartsDeTvaNette.map(eur).join(", ")}) : les débits font payer plus tôt quand l'activité monte, plus tard quand elle retombe. Sur la durée, les deux régimes déclarent la même TVA ; l'option ne la change que de trimestre.`,
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Retrouver les encaissements à rebours",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const x = declarationDeTva(c);
        const r = TRIMESTRE_A_REBOURS;
        return `Expert, à rebours. La déclaration du premier trimestre de N + 1 de ${x.f.entreprise} porte ${eur(r.aPayer)} de TVA à payer, sans crédit à imputer. Ce trimestre-là, elle a reçu ${eur(r.achatsHT)} HT de matériaux et ${r.immobilisation} de ${eur(r.immobilisationHT)} HT, et elle est toujours au régime des encaissements. Retrouvez la TVA déductible, la TVA collectée, puis ce que ses clients lui ont payé dans le trimestre, hors taxes.`;
      },
      champs: (c) => {
        const x = declarationDeTva(c);
        const r = TRIMESTRE_A_REBOURS;
        return [
          { libelle: "TVA déductible du trimestre", attendu: x.deductibleARebours, calcul: `(${eur(r.achatsHT)} + ${eur(r.immobilisationHT)}) × ${pct(x.t)} = ${eur(x.deductibleARebours)}` },
          { libelle: "TVA collectée du trimestre", attendu: x.collecteeARebours, calcul: `${eur(r.aPayer)} + ${eur(x.deductibleARebours)} = ${eur(x.collecteeARebours)}` },
          { libelle: "Encaissements du trimestre (HT)", attendu: x.encaissementsARebours, calcul: `${eur(x.collecteeARebours)} ÷ ${pct(x.t)} = ${eur(x.encaissementsARebours)}` },
        ];
      },
      explication: (c) => {
        const x = declarationDeTva(c);
        return [
          `Aux encaissements, une déclaration de TVA dit l'argent reçu des clients : ${eur(x.encaissementsARebours)} HT, ${eur(auCentime(x.encaissementsARebours * (1 + x.t)))} TTC. Aux débits, le même calcul donnerait les travaux facturés du trimestre, et rien de ce que les clients ont payé.`,
        ];
      },
    },
    {
      id: "l-option-pour-les-debits",
      objectifs: [3],
      type: "choix",
      titre: "Faut-il opter pour les débits",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const f = declarationDeTva(c).f;
        return `Le gérant de ${f.entreprise} propose d'opter pour les débits l'an prochain : « une seule règle, la facture, ce sera plus simple ». Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = declarationDeTva(c);
        return [
          {
            texte: "L'option fait verser plus tôt la TVA des factures pas encore payées : de la trésorerie en moins, pas d'impôt en plus",
            juste: true,
            retour: `Oui. En N, l'option aurait fait déclarer ${eur(-x.ecartDeLAnnee)} de plus, la TVA de créances qui ont grossi, et la TVA due au 31 décembre serait de ${eur(x.deb.dueAuBilan)} au lieu de ${eur(x.enc.dueAuBilan)}. Ce n'est pas un impôt de plus : c'est la même TVA, versée avant d'être reçue. La simplicité se paie en trésorerie.`,
          },
          {
            texte: "L'option ne change rien : la TVA de chaque facture est la même",
            juste: false,
            retour: `Non : la TVA de chaque facture est la même, mais pas le trimestre où elle est due. Au printemps, les débits auraient fait payer ${eur(x.printempsAuxDebits.aPayer)} au lieu d'un crédit de ${eur(x.printemps.creditAReporter)}.`,
          },
          {
            texte: `L'option fait payer plus de TVA : ${eur(-x.ecartDeLAnnee)} de plus chaque année`,
            juste: false,
            retour: `Non : les ${eur(-x.ecartDeLAnnee)} sont la TVA de créances qui ont grossi en N, déclarée avant leur encaissement. Elle sera due de toute façon ; l'année où les créances baissent, l'écart s'inverse.`,
          },
          {
            texte: "L'option évite les crédits de TVA, c'est donc toujours mieux",
            juste: false,
            retour: `Non : elle a effacé le crédit du printemps, mais en faisant verser ${eur(x.printempsAuxDebits.aPayer)} dès l'été. Un crédit s'impute sur la déclaration suivante : il ne coûte que d'attendre un trimestre, quand l'option fait avancer la TVA de toutes les créances.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["vat_payable", "payment_terms"],
      tableau: (c) => {
        const x = declarationDeTva(c);
        return {
          titre: `La TVA à payer de ${x.f.entreprise}, aux deux régimes`,
          colonnes: [...COLONNES_DES_TRIMESTRES],
          lignes: [
            { libelle: "Aux encaissements, son régime", valeurs: [x.enc.ouverture, ...x.enc.trimestres].map((d) => (d.creditAReporter > 0 ? `crédit de ${eur(d.creditAReporter)}` : eur(d.aPayer))) },
            { libelle: "Aux débits, sur option", valeurs: [x.deb.ouverture, ...x.deb.trimestres].map((d) => (d.creditAReporter > 0 ? `crédit de ${eur(d.creditAReporter)}` : eur(d.aPayer))) },
          ],
        };
      },
      texte: (c) => {
        const x = declarationDeTva(c);
        return [
          `La TVA ne touche pas le résultat : elle passe par des comptes de tiers, collectée au crédit du 44571, déductible au débit du 44566, et la différence est une dette envers l'État, ou un crédit quand la TVA déductible l'emporte. ${x.f.entreprise} a déclaré ${eur(x.declare.aPayer)} au ${nomDuTrimestre(TRIMESTRE_DECLARE)}, un crédit de ${eur(x.printemps.creditAReporter)} au printemps, imputé sur l'été (${eur(x.ete.aPayer)} à payer), et doit ${eur(x.enc.dueAuBilan)} au 31 décembre.`,
          `Le moment où la TVA est due, c'est l'exigibilité : la livraison pour des biens, l'encaissement pour des travaux et des services, sauf option pour les débits. Pour des travaux, la TVA collectée suit donc l'argent reçu, et le délai des clients entre dans la déclaration. L'option ne change pas la TVA d'une facture : elle la fait verser plus tôt quand les créances grossissent.`,
          "Au niveau de l'examen, vous savez dire quand une TVA est exigible, calculer la TVA collectée sur des encaissements, la TVA déductible sur des biens et des immobilisations, passer l'écriture de la déclaration, imputer un crédit, comparer deux régimes sur un trimestre et sur une année, et remonter d'une déclaration aux encaissements.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: (c) => {
        const x = declarationDeTva(c);
        return `TVA à payer = TVA collectée − TVA déductible − crédit reçu du trimestre d'avant. Au ${nomDuTrimestre(TRIMESTRE_DU_CREDIT + 1)} : ${eur(x.ete.collectee)} − ${eur(x.ete.deductible)} − ${eur(x.ete.creditRecu)} = ${eur(x.ete.aPayer)}. Aux encaissements, la TVA collectée porte sur les encaissements HT ; aux débits, sur les travaux facturés HT.`;
      },
    },
  ],
};
