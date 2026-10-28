import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { DEVIS_DU_FOURNISSEUR, PRIX_DE_L_OCCASION, TAUX_D_IMPOT, anneeDuPlan, planDAmortissement } from "../../chapitres/immobilisations";
import { dateDuCours as date, moisEtJour } from "../../dates";
import { auCentime, cession, JOURS_DE_L_ANNEE, JOURS_DU_MOIS, planDAmortissement as planDuMonde, type DateDuCours, type Immobilisation } from "../../monde/amortissement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « IMMOBILISATIONS ET AMORTISSEMENTS » : UN SECOND ÉQUIPEMENT
 * (comptabilité générale, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : l'équipement est celui du cas figé de l'entreprise
 * (monde/cas-des-entreprises.ts), acheté sur le devis du chapitre (DEVIS_DU_FOURNISSEUR), et ses plans
 * se calculent par le modèle du cours (monde/amortissement.ts). Il se joue dans les neuf entreprises.
 *
 * La direction achète un second équipement, identique au premier, installé à la mi-avril. Son
 * comptable propose de l'amortir en dégressif « pour payer moins d'impôt ». L'élève chiffre le coût
 * d'entrée (le devis mêle frais à immobiliser et charges), passe l'achat, bâtit la première année des
 * deux plans (des jours en linéaire, des mois en dégressif), puis croise les deux modes sur trois
 * exercices, jusqu'à la reprise que le fournisseur propose : dotations et résultat de cession réunis
 * font le même total. La réponse demande un jugement : le dégressif décale l'impôt, il ne l'économise
 * pas, et le plan comptable suit l'usure.
 *
 * LES TROIS TEMPS : le cas est autonome (le livrable et les documents, sans l'ordre des calculs) ;
 * expert par le curseur du prix de reprise et le croisement des deux plans sur trois exercices.
 */

/** Le jour de la mise en service : le 16 avril (le jour 106 de l'année), une date en cours de mois. */
export const JOUR_DE_MISE_EN_SERVICE = 106;

/** La reprise que propose le fournisseur : le 31 décembre de la 3e année, à 40 % du prix catalogue (le prix de l'occasion du chapitre). */
export const DATE_DE_REPRISE: DateDuCours = { jour: 31, mois: 12, exercice: 2 };

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const coef = (k: number) => k.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const DE_LA_REPRISE = `31 décembre de la ${anneeDuPlan(DATE_DE_REPRISE.exercice ?? 0)}`;
/** « 3 exercices » : ceux de la mise en service à la reprise. */
const EXERCICES = `${(DATE_DE_REPRISE.exercice ?? 0) + 1} exercices`;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Les chiffres de la réponse, calculés une fois du cas. */
export function secondEquipement(c: Cas) {
  const p = planDAmortissement(c);
  const i = c.immobilisation;
  const { mois, jour } = moisEtJour(JOUR_DE_MISE_EN_SERVICE);
  const cout = p.coutDAcquisition;
  const tva = auCentime(cout * i.tauxTva);
  const immo: Immobilisation = { valeurBrute: cout, miseEnService: { jour, mois: mois + 1 }, dureeAns: p.duree };
  const lineaire = planDuMonde(immo, "lineaire");
  const degressif = planDuMonde(immo, "degressif");
  const dotationLineaire = lineaire[0]!.dotation;
  const dotationDegressive = degressif[0]!.dotation;
  const ecart = auCentime(dotationDegressive - dotationLineaire);

  // La reprise au 31 décembre de la 3e année, dans chaque mode.
  const prixDeReprise = auCentime(p.devis.prix * PRIX_DE_L_OCCASION);
  const repriseLineaire = cession(immo, "lineaire", DATE_DE_REPRISE, prixDeReprise);
  const repriseDegressive = cession(immo, "degressif", DATE_DE_REPRISE, prixDeReprise);

  return {
    designation: i.designation,
    compte: i.compte,
    acceptes: i.acceptes,
    tauxTva: i.tauxTva,
    devis: p.devis,
    prixNet: p.prixNet,
    cout,
    charges: p.chargesDuDevis,
    tva,
    ttc: auCentime(cout + tva),
    duree: p.duree,
    coefficient: p.coefficient,
    tauxDegressif: p.tauxDegressif,
    annuite: auCentime(cout / p.duree),
    jours: lineaire[0]!.prorata,
    moisDegressifs: degressif[0]!.prorata,
    dotationLineaire,
    dotationDegressive,
    vncLineaire: lineaire[0]!.valeurNette,
    vncDegressive: degressif[0]!.valeurNette,
    ecart,
    impotDecale: auCentime(ecart * TAUX_D_IMPOT),
    prixDeReprise,
    dotationsLineaires: repriseLineaire.cumul,
    vncRepriseLineaire: repriseLineaire.valeurNette,
    resultatLineaire: repriseLineaire.resultat,
    dotationsDegressives: repriseDegressive.cumul,
    vncRepriseDegressive: repriseDegressive.valeurNette,
    resultatDegressif: repriseDegressive.resultat,
    /** Dotations et résultat de cession réunis sur trois exercices : le même total dans les deux modes. */
    chargesNettes: auCentime(repriseLineaire.cumul - repriseLineaire.resultat),
    // L'erreur classique : passer la livraison et l'installation en charges, et n'amortir que le prix net.
    installationEnCharges: auCentime(p.devis.livraison + p.devis.installation + (p.prixNet / p.duree) * (lineaire[0]!.prorata / JOURS_DE_L_ANNEE)),
    /** Ce que le dégressif ajoute au résultat de cession : la valeur nette en moins à la reprise. */
    resultatEnPlus: auCentime(repriseDegressive.resultat - repriseLineaire.resultat),
    jourDeMiseEnService: jour,
    moisDeMiseEnService: mois + 1,
    exercicesPleins: DATE_DE_REPRISE.exercice ?? 0,
  };
}

export const UN_SECOND_EQUIPEMENT: Situation = {
  code: "un-second-equipement",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["immobilisations"],
  commanditaire: "La direction",
  titre: "Un second équipement en avril",
  accroche:
    "La direction achète un second équipement, installé à la mi-avril. Son comptable propose de l'amortir en dégressif pour payer moins d'impôt. Avant de signer, elle veut votre avis chiffré.",
  objectifs: [
    "Séparer, dans un devis, le coût d'acquisition d'une immobilisation et les charges de l'exercice",
    "Enregistrer l'achat d'une immobilisation",
    "Calculer la première dotation en linéaire, au prorata des jours, et en dégressif, au prorata des mois",
    "Croiser les deux modes jusqu'à une cession, et juger ce que le dégressif change à l'impôt",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = secondEquipement(c);
        return [
          `« Nous achetons un second équipement, identique au premier (${r.designation}), sur le devis du fournisseur. Il sera livré et installé le ${date(JOUR_DE_MISE_EN_SERVICE)}, et nous paierons l'équipement installé par virement le jour même ; la formation et l'entretien seront facturés à part. Notre comptable propose de l'amortir en dégressif pour payer moins d'impôt. Le fournisseur propose aussi une reprise le ${DE_LA_REPRISE}, si nous voulons alors un équipement plus grand. Que coûtera-t-il au résultat de cette année, dans un mode et dans l'autre, et que me conseillez-vous ? »`,
          "Pas de cours cette fois : vous avez le devis et les conditions, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = secondEquipement(c);
        const d = r.devis;
        return {
          titre: `Le devis et les conditions · ${c.entreprise}`,
          colonnes: ["Hors taxes"],
          lignes: [
            { libelle: `${r.designation}, prix catalogue`, valeurs: [eur(d.prix)] },
            { libelle: `Remise de ${pct(DEVIS_DU_FOURNISSEUR.remise)} sur le prix`, valeurs: [eur(-d.remise)] },
            { libelle: "Livraison", valeurs: [eur(d.livraison)] },
            { libelle: "Installation et essais de mise en route", valeurs: [eur(d.installation)] },
            { libelle: "Formation de l'équipe", valeurs: [eur(d.formation)] },
            { libelle: "Contrat d'entretien de la première année", valeurs: [eur(d.entretien)] },
            { libelle: "TVA", valeurs: [pct(r.tauxTva)] },
            { libelle: "Mise en service", valeurs: [date(JOUR_DE_MISE_EN_SERVICE)] },
            { libelle: "Durée d'utilisation", valeurs: [`${qte(r.duree)} ans`] },
            { libelle: "Coefficient fiscal du dégressif", valeurs: [coef(r.coefficient)] },
            { libelle: `Reprise proposée le ${DE_LA_REPRISE}`, valeurs: [eur(r.prixDeReprise)] },
            { libelle: "Taux de l'impôt sur les sociétés, au-delà du taux réduit", valeurs: [pct(TAUX_D_IMPOT)] },
          ],
        };
      },
      repere: () =>
        `À rendre : le coût d'entrée de l'équipement et l'écriture d'achat, la première dotation dans chaque mode, ce que donnerait la reprise dans chaque mode, et votre conseil. Le temps se compte comme au chapitre : des mois de ${JOURS_DU_MOIS} jours, une année de ${JOURS_DE_L_ANNEE} jours, le jour de la mise en service compté ; en dégressif, des mois entiers, du 1er du mois de la mise en service.`,
    },
    {
      id: "cout-d-entree",
      type: "montants",
      titre: "Le coût de l'équipement",
      notions: ["depreciation"],
      question: () => "Que vaudra l'équipement à l'actif, et que coûtera le reste du devis au résultat de l'année ? Chiffrez aussi la TVA de la facture de l'équipement installé.",
      champs: (c) => {
        const r = secondEquipement(c);
        const d = r.devis;
        return [
          { libelle: "Prix net, après la remise", attendu: r.prixNet, calcul: `${eur(d.prix)} − ${eur(d.remise)} = ${eur(r.prixNet)}` },
          { libelle: "Coût d'acquisition, hors taxes", attendu: r.cout, calcul: `${eur(r.prixNet)} + ${eur(d.livraison)} + ${eur(d.installation)} = ${eur(r.cout)}` },
          { libelle: "Charges de l'exercice", attendu: r.charges, calcul: `${eur(d.formation)} de formation + ${eur(d.entretien)} d'entretien = ${eur(r.charges)}` },
          { libelle: "TVA de l'équipement installé", attendu: r.tva, calcul: `${eur(r.cout)} × ${pct(r.tauxTva)} = ${eur(r.tva)}` },
        ];
      },
      explication: (c) => {
        const r = secondEquipement(c);
        return [
          `L'équipement entre à l'actif pour ${eur(r.cout)}, livraison et installation comprises, remise déduite : c'est sur ce montant qu'il s'amortira, quel que soit le mode. La formation et l'entretien, ${eur(r.charges)}, sont des charges de l'année.`,
        ];
      },
    },
    {
      id: "achat",
      type: "ecriture",
      titre: "L'achat, au journal",
      notions: ["depreciation"],
      evenement: (c) => {
        const r = secondEquipement(c);
        return `Le ${date(JOUR_DE_MISE_EN_SERVICE)}, ${c.entreprise} reçoit son second équipement (${r.designation}), installé, et règle la facture par virement : ${eur(r.cout)} hors taxes, livraison et installation comprises, remise déduite, et ${eur(r.tva)} de TVA.`;
      },
      ecriture: (c) => {
        const r = secondEquipement(c);
        return {
          date: date(JOUR_DE_MISE_EN_SERVICE),
          libelle: `Achat : ${r.designation}, installé`,
          lignes: [
            { role: "l'équipement, à son coût d'acquisition", compte: r.compte, acceptes: r.acceptes, sens: "debit", montant: r.cout, indice: "le prix net et les frais de mise en service, hors taxes" },
            { role: "la TVA déductible", compte: "44562", acceptes: ["44566"], sens: "debit", montant: r.tva, indice: "la TVA de la facture" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: r.ttc, indice: "le montant réglé, taxes comprises" },
          ],
        };
      },
      indices: (c) => [
        `Un équipement qui servira plusieurs années : une immobilisation, classe 2, au compte qui correspond à « ${c.immobilisation.designation} ».`,
        "La livraison et l'installation ne vont pas en charges : elles entrent dans le coût de l'équipement, sur la même ligne. La TVA se déduit, sur immobilisations ; la banque paie le total.",
      ],
      explication: (c) => {
        const r = secondEquipement(c);
        return [`Le compte ${r.compte} reçoit ${eur(r.cout)} : la valeur brute du second équipement. Le résultat de l'année n'a pas encore bougé.`];
      },
      vue: "immobilisation",
    },
    {
      id: "les-deux-plans",
      type: "montants",
      titre: "La première année, dans les deux modes",
      notions: ["depreciation"],
      question: () =>
        "Chiffrez la première année de l'équipement dans chaque mode : en linéaire, ses jours d'utilisation et sa dotation ; en dégressif, ses mois et sa dotation. Puis l'impôt que le dégressif ferait payer en moins cette année.",
      champs: (c) => {
        const r = secondEquipement(c);
        return [
          { libelle: "Jours d'utilisation, en linéaire", attendu: r.jours, calcul: `du ${r.jourDeMiseEnService} au ${JOURS_DU_MOIS} ${MOIS[r.moisDeMiseEnService - 1]}, ${qte(JOURS_DU_MOIS - r.jourDeMiseEnService + 1)} jours, puis ${qte(12 - r.moisDeMiseEnService)} mois de ${JOURS_DU_MOIS} jours : ${qte(r.jours)} jours`,
          },
          { libelle: "Dotation linéaire de l'année", attendu: r.dotationLineaire, calcul: `${eur(r.cout)} ÷ ${qte(r.duree)} × ${qte(r.jours)} ÷ ${JOURS_DE_L_ANNEE} = ${eur(r.dotationLineaire)}` },
          { libelle: "Mois comptés, en dégressif", attendu: r.moisDegressifs, calcul: `${MOIS[r.moisDeMiseEnService - 1]} à décembre, le mois de la mise en service compris : ${qte(r.moisDegressifs)} mois` },
          {
            libelle: "Dotation dégressive de l'année",
            attendu: r.dotationDegressive,
            calcul: `${eur(r.cout)} × ${coef(r.coefficient)} ÷ ${qte(r.duree)} × ${qte(r.moisDegressifs)} ÷ 12 = ${eur(r.dotationDegressive)}`,
          },
          {
            libelle: "Impôt en moins cette année, en dégressif",
            attendu: r.impotDecale,
            calcul: `(${eur(r.dotationDegressive)} − ${eur(r.dotationLineaire)}) × ${pct(TAUX_D_IMPOT)} = ${eur(r.ecart)} × ${pct(TAUX_D_IMPOT)} = ${eur(r.impotDecale)}`,
          },
        ];
      },
      explication: (c) => {
        const r = secondEquipement(c);
        return [
          `Cette année, le dégressif charge ${eur(r.ecart)} de plus que le linéaire : l'équipement vaudrait ${eur(r.vncDegressive)} au bilan au lieu de ${eur(r.vncLineaire)}, et l'impôt baisserait de ${eur(r.impotDecale)}. Reste à voir ce que deviennent ces chiffres les années suivantes.`,
        ];
      },
    },
    {
      id: "le-prix-de-reprise",
      type: "curseur",
      titre: "Le prix de reprise au curseur",
      notions: ["depreciation"],
      question: (c) => {
        const r = secondEquipement(c);
        return `Faites varier le prix de reprise, de 0 à ${eur(r.cout)}. Une droite donne le prix, l'autre la valeur nette de l'équipement en linéaire le ${DE_LA_REPRISE}. Placez le curseur sur le plus petit prix qui ne fait pas de moins-value en linéaire, puis validez, et regardez ce que la lecture dit du dégressif.`;
      },
      grandeur: () => ({ libelle: "Prix de reprise, hors taxes", unite: "€" }),
      cible: (c) => {
        const r = secondEquipement(c);
        return { attendu: Math.ceil(r.vncRepriseLineaire - 1e-9), min: 0, max: r.cout };
      },
      zones: ["Plus-value en linéaire", "Moins-value en linéaire"],
      rates: () => ({
        dessous: "À ce prix, la reprise fait une moins-value en linéaire : l'équipement vaut encore plus dans les comptes.",
        dessus: "Ce prix couvre la valeur nette en linéaire, mais un prix plus bas la couvre aussi : cherchez le plus petit.",
      }),
      montrer: "Montrer la frontière",
      lecture: (c, prix) => {
        const r = secondEquipement(c);
        return [
          { libelle: "Valeur nette en linéaire", montant: r.vncRepriseLineaire },
          { libelle: "Valeur nette en dégressif", montant: r.vncRepriseDegressive },
          { libelle: "Résultat de cession en linéaire", montant: auCentime(prix - r.vncRepriseLineaire) },
          { libelle: "Résultat de cession en dégressif", montant: auCentime(prix - r.vncRepriseDegressive) },
          { libelle: `Charges des ${EXERCICES}, dans l'un ou l'autre mode`, montant: auCentime(r.cout - prix), fort: true },
        ];
      },
      droites: (c) => {
        const r = secondEquipement(c);
        return { produit: (x) => x, cout: () => r.vncRepriseLineaire, libelles: ["Prix de reprise", "Valeur nette en linéaire"] };
      },
      explication: (c) => {
        const r = secondEquipement(c);
        return [
          `En linéaire, la reprise ne fait pas de moins-value à partir de ${eur(r.vncRepriseLineaire)} ; en dégressif, dès ${eur(r.vncRepriseDegressive)}. Au prix proposé, ${eur(r.prixDeReprise)}, le même équipement fait ${eur(r.resultatLineaire)} de résultat de cession dans un mode et ${eur(r.resultatDegressif)} dans l'autre.`,
          `Mais la dernière ligne ne dépend que du prix : sur les ${EXERCICES}, les dotations, moins le résultat de cession, font le même total dans les deux modes. Le dégressif déplace des charges entre les années ; il n'en retire aucune.`,
        ];
      },
    },
    {
      id: "sur-trois-exercices",
      type: "montants",
      titre: "Les deux modes jusqu'à la reprise",
      notions: ["depreciation", "income_statement"],
      question: (c) => {
        const r = secondEquipement(c);
        return `Le fournisseur reprend l'équipement le ${DE_LA_REPRISE} pour ${eur(r.prixDeReprise)}. Dans chaque mode, chiffrez les dotations des ${EXERCICES} et le résultat de cession (négatif pour une moins-value), puis les charges nettes des ${EXERCICES}, dotations moins résultat de cession.`;
      },
      champs: (c) => {
        const r = secondEquipement(c);
        return [
          { libelle: `Dotations des ${EXERCICES}, en linéaire`, attendu: r.dotationsLineaires, calcul: `${eur(r.dotationLineaire)} + ${qte(r.exercicesPleins)} × ${eur(r.annuite)} = ${eur(r.dotationsLineaires)}` },
          { libelle: "Résultat de cession, en linéaire", attendu: r.resultatLineaire, calcul: `${eur(r.prixDeReprise)} − (${eur(r.cout)} − ${eur(r.dotationsLineaires)}) = ${eur(r.resultatLineaire)}` },
          { libelle: `Dotations des ${EXERCICES}, en dégressif`, attendu: r.dotationsDegressives, calcul: `${eur(r.cout)} − ${eur(r.vncRepriseDegressive)} de valeur nette restante = ${eur(r.dotationsDegressives)}` },
          { libelle: "Résultat de cession, en dégressif", attendu: r.resultatDegressif, calcul: `${eur(r.prixDeReprise)} − ${eur(r.vncRepriseDegressive)} = ${eur(r.resultatDegressif)}` },
          {
            libelle: `Charges nettes des ${EXERCICES}, dans l'un ou l'autre mode`,
            attendu: r.chargesNettes,
            calcul: `${eur(r.dotationsLineaires)} − (${eur(r.resultatLineaire)}) = ${eur(r.dotationsDegressives)} − (${eur(r.resultatDegressif)}) = ${eur(r.cout)} − ${eur(r.prixDeReprise)} = ${eur(r.chargesNettes)}`,
          },
        ];
      },
      explication: (c) => {
        const r = secondEquipement(c);
        return [
          `Les deux modes se rejoignent : ${eur(r.chargesNettes)} de charges nettes sur ${EXERCICES}, le coût moins le prix de reprise. Ce que le dégressif charge en plus au début, il le rend en dotations plus faibles ensuite, ou en résultat de cession meilleur. L'impôt suit : ${eur(r.impotDecale)} en moins la première année, autant en plus plus tard.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre conseil à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = secondEquipement(c);
        return [
          {
            texte: `Le dégressif décale ${eur(r.impotDecale)} d'impôt sans en économiser : le plan suit l'usure`,
            juste: true,
            retour: `Oui. Cette année, ${eur(r.dotationLineaire)} en linéaire ou ${eur(r.dotationDegressive)} en dégressif ; sur ${EXERCICES}, ${eur(r.chargesNettes)} dans les deux cas. Le dégressif n'est qu'un gain de trésorerie d'un an ou deux. Le plan comptable suit l'usure : régulière, elle demande le linéaire, comme pour le premier équipement, et le supplément fiscal peut se passer en amortissement dérogatoire.`,
          },
          {
            texte: `Prenez le dégressif : ${eur(r.impotDecale)} d'impôt économisés dès cette année, et sans moins-value à la reprise`,
            juste: false,
            retour: `Non : l'impôt n'est pas économisé, il est décalé. Les dotations plus faibles des années suivantes, ou un résultat de cession meilleur, le rattrapent : ${eur(r.chargesNettes)} de charges nettes dans les deux modes.`,
          },
          {
            texte: `Gardez le linéaire : en dégressif, la reprise ferait ${eur(r.resultatEnPlus)} de résultat de cession en plus, imposé`,
            juste: false,
            retour: `Non : ce résultat de cession meilleur ne fait que rendre les dotations plus fortes des premières années. Sur ${EXERCICES}, le total imposable est le même dans les deux modes.`,
          },
          {
            texte: `Gardez le linéaire, et passez la livraison et l'installation en charges : ${eur(r.installationEnCharges)} de charges cette année`,
            juste: false,
            retour: `Non : la livraison et l'installation mettent l'équipement en état de servir. Elles entrent dans son coût, ${eur(r.cout)}, et s'amortissent avec lui.`,
          },
        ];
      },
    },
  ],
};
