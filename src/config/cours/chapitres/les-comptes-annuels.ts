import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import {
  DEPOT_AU_GREFFE,
  METHODES_DU_LABORATOIRE,
  MODES_DU_LABORATOIRE,
  MOIS_DE_LA_SITUATION,
  MOIS_POUR_APPROUVER,
  OPTIONS_DE_LA_FICHE,
  REGLEMENT_DE_PRESENTATION,
  SEUILS_A_DEPASSER,
  SEUILS_DES_MICRO_ENTREPRISES,
  SEUILS_DES_PETITES_ENTREPRISES,
  annexe,
  comptesAnnuels,
  optionsComptables,
  optionsDuMoindreImpot,
  situationIntermediaire,
  tailleDeNova,
} from "../monde/comptes-annuels";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES COMPTES ANNUELS, PRÉSENTATION, ANNEXE ET SITUATION INTERMÉDIAIRE (BTS CG P2,
 * 2.1.2, 2.4.1, 2.4.2 et 2.4.3 ; comptabilité générale, palier 4).
 *
 * Les comptes de NOVA pour l'exercice N sont arrêtés : le chapitre les présente. L'élève range le
 * compte de résultat et le bilan selon le modèle du système de base, situe NOVA face aux seuils du
 * système abrégé, remplit les tableaux de l'annexe (immobilisations, amortissements, provisions et
 * dépréciations, échéances des créances et des dettes), classe les informations de l'annexe, mesure
 * au laboratoire ce que changent deux options comptables (le mode d'amortissement, la méthode de
 * stock) et conseille le président ; puis il établit une situation au 30 juin N par la méthode de
 * l'abonnement, dit comment les comptes se déposent et se télédéclarent, et choisit la note de
 * synthèse aux associés.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, le-compte-de-resultat, le-bilan (les montants dans la question) ;
 *   · l'expérience avant la formule : predire-l-option puis le-laboratoire-des-options, avant
 *     le-conseil ; la-situation-intermediaire et l-abonnement avant le-semestre-n-est-pas-la-moitie ;
 *   · autonome et expert : le-tableau-des-immobilisations, l-etat-des-echeances, les-informations-
 *     de-l-annexe, la-note-aux-associes ; puis la synthèse.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, sur l'exercice N de NOVA sans en changer un chiffre :
 * monde/comptes-annuels.ts lit la clôture figée (monde/cloture.ts) et le contrat de prêt.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

const donnee = (valeur: number | null, texte?: string): CelluleACompleter => ({ valeur, ...(texte ? { texte } : {}) });
const aSaisir = (valeur: number, calcul: string, indice?: string): CelluleACompleter => ({ valeur, saisir: true, calcul, ...(indice ? { indice } : {}) });

/** Les entreprises du chapitre : NOVA seule, dont l'exercice N est figé. */
export const ENTREPRISES_DES_COMPTES_ANNUELS: readonly string[] = ["nova"];

/** Le compte de résultat de N, en liste, selon le modèle du système de base. */
export function grilleDuCompteDeResultat(): TableauACompleter {
  const r = comptesAnnuels().resultat;
  return {
    titre: "Compte de résultat de l'exercice N, en liste",
    colonnes: ["Montant"],
    lignes: [
      /* 0 */ { libelle: "Production vendue", cellules: [donnee(r.ventes)] },
      /* 1 */ { libelle: "Achats de matières premières", cellules: [donnee(r.achats)] },
      /* 2 */ { libelle: "Variation des stocks de matières", cellules: [aSaisir(r.variationDeStock, `aucun stock à l'ouverture, ${eur(-r.variationDeStock)} à la clôture : ${eur(r.variationDeStock)}`, "stock initial moins stock final")] },
      /* 3 */ { libelle: "Autres achats et charges externes", cellules: [aSaisir(r.chargesExternes, `emballage, transport et énergie, loyer, assurance : ${eur(r.chargesExternes)}`, "les comptes 606, 613 et 616")] },
      /* 4 */ { libelle: "Salaires et traitements", cellules: [donnee(r.salaires)] },
      /* 5 */ { libelle: "Charges sociales", cellules: [donnee(r.chargesSociales)] },
      /* 6 */ { libelle: "Dotations aux amortissements", cellules: [donnee(r.amortissements)] },
      /* 7 */ { libelle: "Dotations aux dépréciations de l'actif circulant", cellules: [donnee(r.depreciations)] },
      /* 8 */ { libelle: "Dotations aux provisions", cellules: [donnee(r.provisions)] },
      /* 9 */ { libelle: "Charges d'exploitation", fort: true, totalDe: { plus: [1, 2, 3, 4, 5, 6, 7, 8] }, cellules: [aSaisir(r.chargesDExploitation, `la somme des 8 lignes de charges : ${eur(r.chargesDExploitation)}`)] },
      /* 10 */ { libelle: "Résultat d'exploitation", fort: true, totalDe: { plus: [0], moins: [9] }, cellules: [aSaisir(r.resultatDExploitation, `${eur(r.ventes)} − ${eur(r.chargesDExploitation)} = ${eur(r.resultatDExploitation)}`)] },
      /* 11 */ { libelle: "Produits financiers", cellules: [donnee(r.produitsFinanciers)] },
      /* 12 */ { libelle: "Charges financières", cellules: [aSaisir(r.chargesFinancieres, `intérêts de l'emprunt et escompte accordé : ${eur(r.chargesFinancieres)}`, "les comptes 661 et 665")] },
      /* 13 */ { libelle: "Résultat courant avant impôts", fort: true, totalDe: { plus: [10, 11], moins: [12] }, cellules: [aSaisir(r.resultatCourant, `${eur(r.resultatDExploitation)} + ${eur(r.produitsFinanciers)} − ${eur(r.chargesFinancieres)} = ${eur(r.resultatCourant)}`)] },
      /* 14 */ { libelle: "Impôt sur les bénéfices", cellules: [donnee(r.impot)] },
      /* 15 */ { libelle: "Résultat de l'exercice", fort: true, totalDe: { plus: [13], moins: [14] }, cellules: [aSaisir(r.resultatNet, `${eur(r.resultatCourant)} − ${eur(r.impot)} = ${eur(r.resultatNet)}`)] },
    ],
  };
}

/** Le bilan de N, selon le modèle du système de base : brut, amortissements et dépréciations, net. */
export function grilleDuBilan(): TableauACompleter {
  const b = comptesAnnuels().bilan;
  const a = b.actif;
  const p = b.passif;
  return {
    titre: "Bilan au 31 décembre N, avant répartition",
    colonnes: ["Montant net"],
    lignes: [
      /* 0 */ { libelle: "Immobilisations corporelles", cellules: [aSaisir(a.immobilisations.net, `${eur(a.immobilisations.brut)} − ${eur(a.immobilisations.amortissements)} = ${eur(a.immobilisations.net)}`, "le brut moins les amortissements")] },
      /* 1 */ { libelle: "Stocks de matières", cellules: [donnee(a.stocks.net)] },
      /* 2 */ { libelle: "Clients et comptes rattachés", cellules: [aSaisir(a.clients.net, `${eur(a.clients.brut)} − ${eur(a.clients.depreciation)} = ${eur(a.clients.net)}`, "le brut moins la dépréciation")] },
      /* 3 */ { libelle: "Autres créances", cellules: [donnee(a.autresCreances)] },
      /* 4 */ { libelle: "Valeurs mobilières de placement", cellules: [donnee(a.valeursMobilieresDePlacement)] },
      /* 5 */ { libelle: "Disponibilités", cellules: [donnee(a.disponibilites)] },
      /* 6 */ { libelle: "Charges constatées d'avance", cellules: [donnee(a.chargesConstateesDAvance)] },
      /* 7 */ { libelle: "Total de l'actif", fort: true, totalDe: { plus: [0, 1, 2, 3, 4, 5, 6] }, cellules: [aSaisir(b.totalActif, `la somme des montants nets : ${eur(b.totalActif)}`)] },
      /* 8 */ { libelle: "Capital", cellules: [donnee(p.capitauxPropres.capital)] },
      /* 9 */ { libelle: "Résultat de l'exercice", cellules: [donnee(p.capitauxPropres.resultat)] },
      /* 10 */ { libelle: "Provisions pour risques", cellules: [donnee(p.provisions)] },
      /* 11 */ { libelle: "Emprunts et dettes financières", cellules: [aSaisir(p.emprunts, `le capital restant dû et les intérêts courus : ${eur(p.emprunts)}`, "le 164 et le 1688")] },
      /* 12 */ { libelle: "Fournisseurs et comptes rattachés", cellules: [donnee(p.fournisseurs)] },
      /* 13 */ { libelle: "Dettes fiscales et sociales", cellules: [donnee(p.dettesFiscalesEtSociales)] },
      /* 14 */ { libelle: "Produits constatés d'avance", cellules: [donnee(p.produitsConstatesDAvance)] },
      /* 15 */ { libelle: "Total du passif", fort: true, totalDe: { plus: [8, 9, 10, 11, 12, 13, 14] }, cellules: [aSaisir(b.totalPassif, `il retombe sur l'actif : ${eur(b.totalPassif)}`)] },
    ],
  };
}

/** Le tableau des immobilisations, des amortissements, des provisions et des dépréciations de l'annexe. */
export function grilleDesImmobilisations(): TableauACompleter {
  const x = annexe();
  const ligne = (libelle: string, v: { debut: number; fin: number } & ({ augmentations: number } | { dotations: number }), indice: string, saisir: boolean): { libelle: string; cellules: CelluleACompleter[] } => {
    const aug = "augmentations" in v ? v.augmentations : v.dotations;
    return {
      libelle,
      cellules: [
        donnee(v.debut),
        saisir ? aSaisir(aug, `${eur(aug)}, passés en N`, indice) : donnee(aug),
        donnee(null),
        aSaisir(v.fin, `${eur(v.debut)} + ${eur(aug)} = ${eur(v.fin)}`),
      ],
    };
  };
  return {
    titre: "Annexe : immobilisations, amortissements, provisions et dépréciations",
    colonnes: ["Début", "Augmentations", "Diminutions", "Fin"],
    colonneDeTotal: 3,
    lignes: [
      ligne("Matériel industriel, en brut", x.immobilisations, "le prix hors taxes de la ligne", true),
      ligne("Amortissements du matériel", x.amortissements, "la dotation de l'exercice", true),
      ligne("Provision pour litige", x.provisionPourLitige, "la dotation de la clôture", true),
      ligne("Dépréciation des créances", x.depreciationDesCreances, "la dotation sur Sonora", false),
    ],
  };
}

/** L'état des échéances des créances et des dettes de l'annexe. */
export function grilleDesEcheances(): TableauACompleter {
  const x = annexe();
  const ligne = (l: { libelle: string; unAn: number; plusDUnAn: number }, saisir: boolean, calcul?: string): { libelle: string; cellules: CelluleACompleter[] } => ({
    libelle: l.libelle,
    cellules: [
      saisir ? aSaisir(l.unAn, calcul ?? eur(l.unAn), "ce qui sera payé ou encaissé avant le 31 décembre N + 1") : donnee(l.unAn),
      saisir ? aSaisir(l.plusDUnAn, `${eur(l.plusDUnAn)} : le reste du capital`, "ce qui reste dû après N + 1") : donnee(l.plusDUnAn),
      aSaisir(l.unAn + l.plusDUnAn, `${eur(l.unAn)} + ${eur(l.plusDUnAn)} = ${eur(l.unAn + l.plusDUnAn)}`),
    ],
  });
  const [emprunt, ...autresDettes] = x.dettes;
  return {
    titre: "Annexe : état des créances et des dettes",
    colonnes: ["À un an au plus", "À plus d'un an", "Total"],
    colonneDeTotal: 2,
    lignes: [
      ...x.creances.map((l) => ligne(l, false)),
      ligne(emprunt!, true, `${qte(x.echeancesDeN1)} échéances de capital en N + 1, ${eur(x.capitalAUnAn)}, et les intérêts courus, ${eur(x.interetsCourus)} : ${eur(x.empruntAUnAn)}`),
      ...autresDettes.map((l) => ligne(l, false)),
    ],
  };
}

const libelleDuMode = (v: number) => MODES_DU_LABORATOIRE.find((x) => x.valeur === v)!.libelle.toLowerCase();
const libelleDeLaMethode = (v: number) => METHODES_DU_LABORATOIRE.find((x) => x.valeur === v)!.libelle.toLowerCase();

export const LES_COMPTES_ANNUELS: Chapitre = {
  code: "les-comptes-annuels",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P2 · Contrôle et production de l'information financière"],
  titre: "Les comptes annuels : présentation, annexe et situation intermédiaire",
  accroche:
    "Le bilan et le compte de résultat de NOVA rangés selon les modèles, l'annexe et ses tableaux, une option comptable à conseiller, et une situation au 30 juin par la méthode de l'abonnement.",
  objectifs: [
    "Présenter le compte de résultat et le bilan selon le modèle du système de base",
    "Situer une entreprise face aux seuils du système abrégé et dire ce qu'elle doit publier",
    "Remplir les tableaux de l'annexe : immobilisations, amortissements, provisions, échéances",
    "Mesurer l'effet d'une option comptable et conseiller le dirigeant",
    "Établir une situation intermédiaire par la méthode de l'abonnement et la présenter",
  ],
  libre: false,
  prerequis: ["la-cloture", "regularisations-de-fin-d-exercice"],
  ensuite: ["le-tableau-de-financement", "les-capitaux-propres"],
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_ANNUELS,
    pourquoi: "ce chapitre présente les comptes de l'exercice N de NOVA, ceux du chapitre « La clôture ».",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois documents, un seul ensemble",
      notions: ["income_statement", "balance_sheet"],
      texte: (c) => {
        const r = comptesAnnuels().resultat;
        return [
          `L'exercice N de ${c.entreprise} est clos et inventorié : ${eur(r.resultatNet)} de bénéfice. Les comptes annuels sont trois documents qui forment un tout : le bilan, le compte de résultat et l'annexe, qui explique et complète les deux autres. Ensemble, ils doivent donner une image fidèle du patrimoine, de la situation financière et du résultat.`,
          `Le président les arrête ; l'assemblée générale des associés les approuve dans les ${MOIS_POUR_APPROUVER} mois de la clôture ; ils sont ensuite déposés au greffe et transmis à l'administration fiscale. Les associés, la banque, les fournisseurs et l'État les liront, chacun pour sa décision.`,
          `Veille : le règlement ANC n° ${REGLEMENT_DE_PRESENTATION.numero}, pour les exercices ouverts depuis le ${REGLEMENT_DE_PRESENTATION.exercicesOuvertsDepuis}, modernise ces modèles. Le chapitre suit ceux du plan comptable que le référentiel du BTS enseigne, et signale ce qui change.`,
        ];
      },
      repere: () => "Comptes annuels = bilan + compte de résultat + annexe. Ils sont arrêtés par le dirigeant, approuvés par les associés, déposés et télétransmis.",
    },
    {
      id: "le-compte-de-resultat",
      objectifs: [0],
      type: "a-completer",
      titre: "Le compte de résultat, en liste",
      notions: ["income_statement"],
      question: () =>
        "Complétez le compte de résultat de N, présenté en liste selon le modèle du système de base. Les produits et les charges d'exploitation donnent le résultat d'exploitation ; le financier s'y ajoute pour le résultat courant ; l'impôt en est retranché. Il n'y a aucune opération exceptionnelle.",
      grille: grilleDuCompteDeResultat,
      explication: () => {
        const r = comptesAnnuels().resultat;
        return [
          `Les stocks se lisent en variation : ${eur(r.variationDeStock)}, un stock qui monte diminue les charges. Le résultat d'exploitation, ${eur(r.resultatDExploitation)}, porte l'essentiel ; le financier, ${eur(r.resultatFinancier)}, presque rien.`,
          "Présenté en tableau, le même compte mettrait les charges à gauche et les produits à droite : la liste fait lire les résultats intermédiaires, en cascade.",
        ];
      },
    },
    {
      id: "le-bilan",
      objectifs: [0],
      type: "a-completer",
      titre: "Le bilan, avant répartition",
      notions: ["balance_sheet"],
      question: () =>
        "Complétez le bilan du 31 décembre N. Le modèle montre à l'actif le brut, les amortissements et dépréciations, puis le net : seule la colonne du net est demandée ici. Au passif, le résultat est encore à affecter : c'est un bilan avant répartition.",
      grille: grilleDuBilan,
      explication: () => {
        const b = comptesAnnuels().bilan;
        return [`Les deux totaux font ${eur(b.totalActif)}. Le modèle complet garde aussi la colonne de l'exercice précédent ; pour un premier exercice, elle est vide.`];
      },
    },
    {
      id: "les-trois-systemes",
      type: "lecture",
      titre: "Abrégé, de base, développé",
      notions: ["income_statement", "balance_sheet"],
      texte: () => [
        "Le plan comptable propose trois présentations. Le système de base, celui que vous venez de remplir, vaut pour la plupart des entreprises. Le système abrégé, réservé aux petites entreprises, regroupe les postes en quelques lignes et allège l'annexe. Le système développé ajoute des informations : le détail des postes, les soldes intermédiaires de gestion, la capacité d'autofinancement et le tableau des emplois et des ressources.",
        "Ce tableau, le tableau de financement, est celui du chapitre « Le tableau de financement » : il fait partie de l'annexe dans le système développé.",
      ],
      tableau: () => {
        const sig = comptesAnnuels().sig;
        return {
          titre: "Ce que le système développé ajouterait pour NOVA",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Valeur ajoutée", valeurs: [eur(sig.valeurAjoutee)] },
            { libelle: "Excédent brut d'exploitation", valeurs: [eur(sig.excedentBrutDExploitation)] },
          ],
        };
      },
      repere: () => "Abrégé : les petites entreprises. De base : le cas général. Développé : le détail, les soldes intermédiaires et le tableau des emplois et des ressources.",
    },
    {
      id: "quel-systeme-pour-nova",
      objectifs: [1],
      type: "choix",
      titre: "NOVA face aux seuils",
      notions: ["balance_sheet"],
      tableau: () => {
        const t = tailleDeNova();
        const m = SEUILS_DES_MICRO_ENTREPRISES;
        const p = SEUILS_DES_PETITES_ENTREPRISES;
        return {
          titre: "NOVA et les seuils, à la clôture de N",
          colonnes: ["NOVA", "Micro", "Petite"],
          lignes: [
            { libelle: "Total du bilan", valeurs: [eur(t.bilan), eur(m.bilan), eur(p.bilan)] },
            { libelle: "Chiffre d'affaires net", valeurs: [eur(t.chiffreDAffaires), eur(m.chiffreDAffaires), eur(p.chiffreDAffaires)] },
            { libelle: "Effectif moyen", valeurs: [qte(t.effectif), qte(m.effectif), qte(p.effectif)] },
          ],
        };
      },
      question: () =>
        `Une entreprise relève d'une catégorie tant qu'elle ne dépasse pas ${SEUILS_A_DEPASSER} des 3 seuils. Une petite entreprise peut présenter ses comptes en système abrégé ; une micro-entreprise peut en outre se passer d'annexe et garder ses comptes confidentiels. Que peut faire NOVA ?`,
      options: () => {
        const t = tailleDeNova();
        const juste = t.micro ? "micro" : t.petite ? "petite" : "aucune";
        return [
          { texte: "Se dispenser d'annexe et demander la confidentialité", juste: juste === "micro", retour: t.micro ? `Oui : NOVA ne dépasse qu'un seuil sur trois (le chiffre d'affaires), elle reste une micro-entreprise. C'est une faculté : la banque qui lui a prêté voudra sans doute l'annexe, et NOVA peut la présenter quand même.` : "Non : NOVA dépasse au moins deux seuils des micro-entreprises." },
          { texte: "Présenter des comptes abrégés, mais avec une annexe", juste: juste === "petite", retour: t.petite && !t.micro ? "Oui : NOVA est une petite entreprise, sans être une micro-entreprise." : "Elle le peut, mais elle peut faire plus simple encore : elle ne dépasse qu'un seuil des micro-entreprises." },
          { texte: "Rien de tout cela : le système développé est obligatoire", juste: juste === "aucune", retour: "Non : le système développé n'est jamais imposé à une entreprise de cette taille ; c'est une présentation plus riche, au choix." },
        ];
      },
    },
    {
      id: "le-tableau-des-immobilisations",
      objectifs: [2],
      type: "a-completer",
      titre: "L'annexe : immobilisations et provisions",
      notions: ["depreciation"],
      question: () =>
        "L'annexe suit chaque immobilisation, chaque amortissement et chaque provision de l'ouverture à la clôture. Complétez le tableau : NOVA est née en N, rien n'existait au début de l'exercice, et rien n'est sorti.",
      grille: grilleDesImmobilisations,
      explication: () => {
        const x = annexe();
        return [`Le lecteur retrouve le brut de la ligne, ${eur(x.immobilisations.fin)}, et son amortissement cumulé, ${eur(x.amortissements.fin)} : il en déduit son âge et ce qu'il reste à amortir. L'an prochain, la colonne du début reprendra la fin de N, et une reprise de provision s'inscrira en diminution.`];
      },
    },
    {
      id: "l-etat-des-echeances",
      objectifs: [2],
      type: "a-completer",
      titre: "L'annexe : les échéances",
      notions: ["loan_schedule", "net_treasury"],
      question: () => {
        const x = annexe();
        return `L'état des échéances classe chaque créance et chaque dette selon qu'elle se dénoue dans l'année ou plus tard. Toutes les créances et les dettes d'exploitation de NOVA tombent en N + 1. L'emprunt, lui, se partage : ${qte(x.echeancesDeN1)} échéances de capital en N + 1, plus les intérêts courus, et le reste après. Complétez le tableau.`;
      },
      grille: grilleDesEcheances,
      explication: () => {
        const x = annexe();
        return [`Sur ${eur(x.empruntAUnAn + x.empruntAPlusDUnAn)} d'emprunt au bilan, ${eur(x.empruntAUnAn)} sortiront en N + 1 : le banquier le rapproche de la trésorerie. C'est cette information que le bilan seul ne donne pas.`];
      },
    },
    {
      id: "les-informations-de-l-annexe",
      objectifs: [2],
      type: "tri",
      titre: "Ce que dit l'annexe",
      notions: ["depreciation", "balance_sheet"],
      question: () => "Rangez chaque information de l'annexe de NOVA : une règle ou une méthode comptable, un complément chiffré sur un poste du bilan ou du compte de résultat, ou un engagement qui n'est pas au bilan.",
      categories: [
        { code: "regle", libelle: "Règle ou méthode" },
        { code: "complement", libelle: "Complément chiffré" },
        { code: "engagement", libelle: "Engagement hors bilan" },
      ],
      elements: () => {
        const x = annexe();
        return [
          { libelle: "La ligne de montage s'amortit en linéaire sur 6 ans", montant: 0, categorie: "regle", pourquoi: "c'est un choix de méthode : il se dit, et il se garde d'une année à l'autre" },
          { libelle: "Les composants en stock sont évalués au coût moyen de la période", montant: 0, categorie: "regle", pourquoi: "une méthode d'évaluation des stocks, à justifier si elle change" },
          { libelle: "Les créances douteuses sont dépréciées selon le risque estimé, client par client", montant: 0, categorie: "regle", pourquoi: "une règle d'évaluation des créances" },
          { libelle: `La part de l'emprunt à plus d'un an, ${eur(x.empruntAPlusDUnAn)}`, montant: 0, categorie: "complement", pourquoi: "elle détaille un poste du bilan, par échéance" },
          { libelle: `La provision pour litige dotée en N, ${eur(x.provisionPourLitige.fin)}`, montant: 0, categorie: "complement", pourquoi: "elle détaille le mouvement d'une provision" },
          { libelle: "Les loyers du bail encore à payer jusqu'à son terme", montant: 0, categorie: "engagement", pourquoi: "NOVA s'est engagée à les payer, mais ils ne sont pas encore dus : aucune dette au bilan" },
        ];
      },
      relance: "Demandez-vous si l'information dit comment on a compté, ce que contient un poste, ou ce qui pourrait coûter sans être au bilan.",
      explication: () => [
        "L'annexe n'invente rien : elle dit les méthodes, détaille les postes et révèle les engagements. Le référentiel du BTS en retient les tableaux chiffrés, dont le tableau des emplois et des ressources.",
      ],
    },
    {
      id: "predire-l-option",
      objectifs: [3],
      type: "choix",
      titre: "Une option qui change le résultat",
      notions: ["depreciation", "stock"],
      question: () => {
        const f = optionsComptables(OPTIONS_DE_LA_FICHE.mode, OPTIONS_DE_LA_FICHE.methode);
        return `NOVA a choisi le ${libelleDuMode(OPTIONS_DE_LA_FICHE.mode)} pour sa ligne et le ${libelleDeLaMethode(OPTIONS_DE_LA_FICHE.methode)} pour ses composants : ${eur(f.impot)} d'impôt. Si elle avait choisi l'amortissement dégressif, que serait son impôt de N ?`;
      },
      options: () => [
        { texte: "Plus faible", juste: true, retour: "Oui : le dégressif charge davantage les premières années. Le résultat baisse, et l'impôt avec ; il remontera les années suivantes, quand les dotations seront plus faibles." },
        { texte: "Le même : la ligne coûte le même prix", juste: false, retour: "Non : le prix est le même sur toute la durée, mais sa répartition entre les années change, et donc le résultat de chacune." },
        { texte: "Plus fort, puisque l'actif vaut moins", juste: false, retour: "Non : une dotation plus forte est une charge de plus, qui diminue le bénéfice imposable." },
      ],
    },
    {
      id: "le-laboratoire-des-options",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des options comptables",
      notions: ["depreciation", "stock", "weighted_average_cost"],
      question: () => "Choisissez le mode d'amortissement de la ligne et la méthode d'évaluation des composants en stock. Regardez la dotation, le stock final, le résultat, l'impôt et les capitaux propres de N.",
      leviers: () => [
        {
          code: "mode",
          libelle: "Amortissement de la ligne",
          unite: "",
          min: MODES_DU_LABORATOIRE[0].valeur,
          max: MODES_DU_LABORATOIRE[MODES_DU_LABORATOIRE.length - 1]!.valeur,
          pas: 1,
          depart: OPTIONS_DE_LA_FICHE.mode,
          choix: MODES_DU_LABORATOIRE.map((x) => ({ valeur: x.valeur, libelle: x.libelle })),
        },
        {
          code: "methode",
          libelle: "Évaluation du stock",
          unite: "",
          min: METHODES_DU_LABORATOIRE[0].valeur,
          max: METHODES_DU_LABORATOIRE[METHODES_DU_LABORATOIRE.length - 1]!.valeur,
          pas: 1,
          depart: METHODES_DU_LABORATOIRE[METHODES_DU_LABORATOIRE.length - 1]!.valeur,
          choix: METHODES_DU_LABORATOIRE.map((x) => ({ valeur: x.valeur, libelle: x.libelle })),
        },
      ],
      lecture: (_c, p) => {
        const x = optionsComptables(p.mode!, p.methode!);
        const f = optionsComptables(OPTIONS_DE_LA_FICHE.mode, OPTIONS_DE_LA_FICHE.methode);
        return [
          { libelle: "Dotation aux amortissements", montant: x.dotation, reference: f.dotation },
          { libelle: "Stock final de composants", montant: x.stock, reference: f.stock },
          { libelle: "Résultat avant impôt", montant: x.resultatAvantImpot, reference: f.resultatAvantImpot },
          { libelle: "Impôt sur les sociétés", montant: x.impot, reference: f.impot, fort: true },
          { libelle: "Capitaux propres", montant: x.capitauxPropres, reference: f.capitauxPropres },
        ];
      },
      defi: () => {
        const s = optionsDuMoindreImpot()[0]!;
        return {
          consigne: "Trouvez la combinaison qui fait payer à NOVA le moins d'impôt sur l'exercice N.",
          atteint: (p) => optionsDuMoindreImpot().some((x) => x.mode === p.mode && x.methode === p.methode),
          indice: (p) => {
            const x = optionsComptables(p.mode!, p.methode!);
            return `${eur(x.impot)} d'impôt. Quel mode charge le plus la première année ? Avec des prix qui montent en décembre, quelle méthode donne le stock le plus bas ?`;
          },
          solution: { mode: s.mode, methode: s.methode },
        };
      },
      explication: (_c, p) => {
        const x = optionsComptables(p.mode!, p.methode!);
        const f = optionsComptables(OPTIONS_DE_LA_FICHE.mode, OPTIONS_DE_LA_FICHE.methode);
        return [
          `Défi relevé : en ${libelleDuMode(p.mode!)} et au ${libelleDeLaMethode(p.methode!)}, NOVA paierait ${eur(x.impot)}, ${eur(f.impot - x.impot)} de moins que ses choix. Le dégressif avance la charge ; le coût moyen de la période donne ici le stock le plus bas, les composants de décembre ayant coûté plus cher.`,
          `Mais le résultat présenté baisse aussi, de ${eur(f.resultatNet - x.resultatNet)} : moins d'impôt aujourd'hui, un bénéfice moins flatteur pour la banque et les associés, et plus d'impôt plus tard. L'option se choisit au regard de ce que veut le dirigeant.`,
        ];
      },
    },
    {
      id: "le-conseil",
      objectifs: [3],
      type: "choix",
      titre: "Le conseil au président",
      notions: ["depreciation"],
      question: () => {
        const s = optionsDuMoindreImpot()[0]!;
        return `Le président veut passer en ${libelleDuMode(s.mode)} dès l'an prochain, puis revenir au linéaire quand les dotations baisseront. Que lui conseillez-vous ?`;
      },
      options: () => [
        { texte: "Choisir une fois, puis s'y tenir", juste: true, retour: "Oui : la permanence des méthodes interdit d'en changer au gré du résultat. Un changement doit être justifié par une meilleure information, et l'annexe doit le dire et en chiffrer l'effet." },
        { texte: "Changer chaque année, selon le résultat qu'il veut montrer", juste: false, retour: "Non : ce serait un résultat piloté par la méthode. Les comptes de deux années ne se compareraient plus, et l'image fidèle serait perdue." },
        { texte: "Changer sans rien dire, puisque l'impôt baisse", juste: false, retour: "Non : tout changement de méthode se justifie et s'explique dans l'annexe, avec son incidence sur le résultat et les capitaux propres." },
      ],
    },
    {
      id: "la-situation-intermediaire",
      type: "lecture",
      titre: "Une situation au 30 juin",
      notions: ["income_statement", "depreciation"],
      texte: (c) => {
        const s = situationIntermediaire(MOIS_DE_LA_SITUATION);
        return [
          `En juillet N, la banque demande à ${c.entreprise} une situation intermédiaire : son résultat des ${MOIS_DE_LA_SITUATION} premiers mois. Une situation se bâtit comme des comptes annuels, mais sans tout l'inventaire. Les ventes, les achats, le loyer et la paie se lisent au journal, mois par mois. Les composants achetés chaque mois sont consommés dans le mois : le stock est nul au 30 juin.`,
          `Ce qui n'est connu que pour l'année entière se prend par douzièmes : c'est la méthode de l'abonnement. La dotation de l'année, ${eur(s.dotationAnnuelle)}, les intérêts de l'emprunt, ${eur(s.interetsAnnuels)}, et ceux du compte à terme, ${eur(s.placementAnnuel)}, sont connus dès janvier par le plan d'amortissement et les contrats. Chaque mois en reçoit un douzième, sans attendre la clôture.`,
        ];
      },
      tableau: () => {
        const s = situationIntermediaire(MOIS_DE_LA_SITUATION);
        return {
          titre: "Les flux des 6 premiers mois, au journal",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Ventes", valeurs: [eur(s.ventes)] },
            { libelle: "Achats de composants", valeurs: [eur(s.achats)] },
            { libelle: "Autres achats et charges externes", valeurs: [eur(s.chargesExternes)] },
            { libelle: "Salaires", valeurs: [eur(s.salaires)] },
            { libelle: "Charges sociales", valeurs: [eur(s.chargesSociales)] },
          ],
        };
      },
      repere: () => "Abonnement : une charge ou un produit annuel, connu ou estimé, réparti par douzièmes. Montant d'une période = montant annuel × mois de la période ÷ 12.",
    },
    {
      id: "l-abonnement",
      objectifs: [4],
      type: "montants",
      titre: "Les douzièmes du semestre",
      notions: ["depreciation", "loan_schedule"],
      question: () => `Par la méthode de l'abonnement, calculez la dotation aux amortissements, les intérêts de l'emprunt et les intérêts du compte à terme des ${MOIS_DE_LA_SITUATION} premiers mois.`,
      champs: () => {
        const s = situationIntermediaire(MOIS_DE_LA_SITUATION);
        const f = (a: number, x: number) => `${eur(a)} × ${MOIS_DE_LA_SITUATION} ÷ 12 = ${eur(x)}`;
        return [
          { libelle: "Dotation aux amortissements", attendu: s.dotation, calcul: f(s.dotationAnnuelle, s.dotation) },
          { libelle: "Intérêts de l'emprunt", attendu: s.interets, calcul: f(s.interetsAnnuels, s.interets) },
          { libelle: "Intérêts du compte à terme", attendu: s.placement, calcul: f(s.placementAnnuel, s.placement) },
        ];
      },
      explication: () => [
        "La méthode lisse les charges qui tombent d'un coup ou se calculent à la clôture. Une prime d'assurance annuelle payée d'avance se répartirait de même : chaque mois en porterait le douzième, quel que soit le jour du paiement.",
      ],
    },
    {
      id: "le-resultat-du-semestre",
      objectifs: [4],
      type: "montants",
      titre: "Le résultat du semestre",
      notions: ["income_statement"],
      question: () => "Avec les flux du journal et les douzièmes, calculez le résultat d'exploitation, le résultat financier, puis le résultat avant impôt du semestre.",
      champs: () => {
        const s = situationIntermediaire(MOIS_DE_LA_SITUATION);
        return [
          {
            libelle: "Résultat d'exploitation",
            attendu: s.resultatDExploitation,
            calcul: `${eur(s.ventes)} − ${eur(s.achats)} − ${eur(s.chargesExternes)} − ${eur(s.salaires)} − ${eur(s.chargesSociales)} − ${eur(s.dotation)} = ${eur(s.resultatDExploitation)}`,
          },
          { libelle: "Résultat financier", attendu: s.resultatFinancier, calcul: `${eur(s.placement)} − ${eur(s.interets)} = ${eur(s.resultatFinancier)}` },
          { libelle: "Résultat avant impôt", attendu: s.resultatAvantImpot, calcul: `${eur(s.resultatDExploitation)} + ${eur(s.resultatFinancier)} = ${eur(s.resultatAvantImpot)}` },
        ];
      },
      explication: () => {
        const s = situationIntermediaire(MOIS_DE_LA_SITUATION);
        return [`${eur(s.resultatAvantImpot)} avant impôt au 30 juin. La banque y lit que l'activité est déjà bénéficiaire ; elle sait aussi qu'une situation n'a pas été inventoriée comme une clôture.`];
      },
    },
    {
      id: "le-semestre-n-est-pas-la-moitie",
      objectifs: [4],
      type: "choix",
      titre: "Le semestre fait-il la moitié de l'année ?",
      notions: ["income_statement"],
      question: () => {
        const s = situationIntermediaire(MOIS_DE_LA_SITUATION);
        return `Le résultat avant impôt de l'année entière sera de ${eur(s.resultatAvantImpotAnnuel)}, dont la moitié ferait ${eur(s.auProrata)}. Le semestre en donne ${eur(s.resultatAvantImpot)}. Pourquoi l'écart ?`;
      },
      options: () => [
        { texte: "L'activité n'est pas régulière", juste: true, retour: "Oui : les ventes montent vers Noël, Sonora arrive en septembre, et la clôture ajoute ce qu'aucun douzième ne prévoyait, la dépréciation de Sonora et la provision pour litige. Une situation se lit avec la saison de l'entreprise." },
        { texte: "La méthode de l'abonnement est fausse : il fallait attendre la clôture", juste: false, retour: "Non : les douzièmes répartissent bien les charges annuelles connues. Ce sont les ventes et les risques de la fin d'année que le semestre ne contient pas." },
        { texte: "Une erreur de calcul : un semestre fait toujours la moitié de l'année", juste: false, retour: "Non : un résultat n'est pas une charge fixe. Il suit les ventes, qui varient d'un mois à l'autre." },
      ],
    },
    {
      id: "le-depot-et-la-teledeclaration",
      objectifs: [1],
      type: "choix",
      titre: "Déposer et télédéclarer",
      notions: ["balance_sheet"],
      question: () => "Une fois les comptes approuvés, que doit faire NOVA ?",
      options: () => [
        {
          // À VÉRIFIER : les délais de dépôt au greffe (L. 232-21 et L. 232-23 du Code de commerce) et la liasse en EDI.
          texte: "Les déposer au greffe, et télétransmettre sa liasse fiscale",
          juste: true,
          retour: `Oui : les comptes se déposent au greffe du tribunal de commerce dans le mois qui suit l'approbation (${DEPOT_AU_GREFFE.delaiElectroniqueEnMois} mois par voie électronique). La liasse fiscale, qui reprend le bilan, le compte de résultat et les tableaux de l'annexe, se télétransmet à l'administration en format EDI, souvent depuis le PGI ou par l'expert-comptable.`,
        },
        { texte: "Les envoyer par courrier à chaque associé, et à la banque si elle le demande", juste: false, retour: "Non : les associés reçoivent les comptes avant l'assemblée, mais la publicité légale passe par le greffe, et l'administration fiscale reçoit la liasse par voie électronique." },
        { texte: "Les garder au siège : une SAS n'a rien à publier", juste: false, retour: "Non : toute société commerciale dépose ses comptes ; seule une demande de confidentialité, permise aux plus petites, en limite la publicité." },
      ],
    },
    {
      id: "la-note-aux-associes",
      objectifs: [4],
      type: "choix",
      titre: "La note de synthèse aux associés",
      notions: ["income_statement", "balance_sheet", "net_treasury"],
      question: (c) => {
        const k = comptesAnnuels();
        return `Le président vous demande la phrase d'ouverture de la note qui accompagnera les comptes de ${c.entreprise} à l'assemblée. Ventes : ${eur(k.resultat.ventes)} ; résultat : ${eur(k.resultat.resultatNet)} ; capitaux propres : ${eur(k.bilan.passif.capitauxPropres.total)}. Laquelle retenez-vous ?`;
      },
      options: () => {
        const k = comptesAnnuels();
        const marge = k.resultat.resultatNet / k.resultat.ventes;
        const autonomie = k.bilan.passif.capitauxPropres.total / k.bilan.totalPassif;
        return [
          { texte: `Bénéfice de ${pct(marge)} des ventes, fonds propres à ${pct(autonomie)} du bilan`, juste: true, retour: "Oui : une note de synthèse donne deux ou trois chiffres qui disent l'essentiel, la rentabilité et la solidité, puis renvoie aux comptes pour le détail. Elle annonce aussi les risques : Sonora, le litige." },
          { texte: "Un bénéfice record pour une première année, et des comptes sans aucun risque", juste: false, retour: "Non : la note doit être fidèle aux comptes. Sonora est dépréciée et un litige est provisionné : les taire tromperait les associés." },
          { texte: "La liste complète des comptes de la balance, du 101 au 764, avec leurs soldes", juste: false, retour: "Non : ce serait les comptes eux-mêmes, pas une synthèse. Les associés attendent ce qui compte pour leur décision." },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement", "balance_sheet"],
      texte: () => {
        const k = comptesAnnuels();
        const s = situationIntermediaire(MOIS_DE_LA_SITUATION);
        return [
          `Les comptes de N : un bilan de ${eur(k.bilan.totalActif)}, un compte de résultat qui finit sur ${eur(k.resultat.resultatNet)}, et une annexe qui dit les méthodes, détaille les immobilisations, les provisions et les échéances, et révèle les engagements. Une option comptable change le résultat de l'année, pas celui de toute la durée ; elle se choisit une fois et s'explique.`,
          `La situation au 30 juin, ${eur(s.resultatAvantImpot)} avant impôt, prend les charges annuelles par douzièmes. Elle se présente comme les comptes annuels, et se lit avec la saison.`,
          "Dans l'arène, l'écran du bilan et celui du compte de résultat sont vos comptes annuels de chaque tour : à quoi ressemblerait l'annexe qui les expliquerait à votre banquier ?",
        ];
      },
      repere: () => "Système de base : le cas général ; abrégé : les petites entreprises ; développé : plus de détail. L'annexe : règles et méthodes, tableaux chiffrés, engagements. Abonnement : montant annuel × mois ÷ 12.",
    },
  ],
};

export type ComptesAnnuelsDuCas = ReturnType<typeof comptesAnnuels>;
export const comptesDuCas = (_c: Pick<Cas, "code">) => comptesAnnuels();
