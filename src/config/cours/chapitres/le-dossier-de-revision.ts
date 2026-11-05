import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import {
  BATTERIES_DE_L_ANCIEN_MODELE,
  COMPTE_D_ATTENTE,
  ESTIMATIONS_DU_DOSSIER,
  FORFAIT_SOCIAL_DE_NOVA,
  MAJORATION_CONTESTEE,
  PARTICIPATION_DE_N_PLUS_1,
  REGLE_DU_DIXIEME,
  SEUIL_DU_FORFAIT_SOCIAL,
  TAUX_DU_FORFAIT_SOCIAL,
  batteries,
  congesPayes,
  dossierDeRevision,
  garantie,
  type EstimationsDeLaRevision,
} from "../monde/dossier-de-revision";
import { EXERCICE_N1_DE_NOVA, TAUX_NORMAL } from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE DOSSIER DE RÉVISION, CONTRÔLER L'INVENTAIRE CYCLE PAR CYCLE (comptabilité générale,
 * palier 4 ; BTS CG P2 2.3.5, et les manques de 2.3.1 et 2.3.3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la clôture du second exercice de NOVA, N+1, calculée dans
 * monde/dossier-de-revision.ts. UNE SEULE NOVA : le résultat qui sort du dossier est celui que lit
 * « L'impôt sur les sociétés », 118 460 € avant impôt ; la balance provisoire en porte plus, et chaque
 * travail de révision l'en rapproche.
 *
 * L'objet : la révision des comptes, cycle par cycle (trésorerie, ventes et clients, achats et stocks,
 * personnel, État), sa feuille de travail, et les travaux que le cours n'avait pas encore faits : le
 * compte d'attente à solder, la dette de congés payés et ses cotisations, la participation (montant
 * donné) et le forfait social, une provision pour amende, une dépréciation de stock vraiment passée, la
 * provision pour garantie. Il ne refait ni les dépréciations de créances ni les provisions pour litige
 * (« Dépréciations et provisions »), ni l'inventaire des stocks (« Les stocks »), ni les amortissements
 * et les régularisations (« La clôture », « Régularisations de fin d'exercice ») : il les relit.
 *
 * LES TEMPS DU CHAPITRE :
 *   · guidé : intro, le-role-de-la-revision, les-cycles, le-compte-d-attente, l-acompte-identifie,
 *     les-frais-bancaires (le montant et le compte sont dans la question ou l'indice) ;
 *   · l'expérience avant la formule : predire-le-resultat avant les travaux ; puis le laboratoire des
 *     estimations (la part des retours à venir, le prix du recycleur ; le défi : une baisse d'impôt, et
 *     ce qu'elle cache) ;
 *   · autonome : les-conges-payes, conges-au-journal, la-participation, la-provision-pour-amende,
 *     les-batteries, la-garantie et leurs écritures ;
 *   · expert : le-forfait-social (une variante chiffrée), la-majoration-contestee (pourquoi 1514, et la
 *     réintégration), le-dossier-mis-a-jour (le tableau qui ramène le résultat provisoire au résultat
 *     révisé) ; et la synthèse.
 *
 * MATIÈRE : le cours du propriétaire sur les travaux d'inventaire (« Présentation des travaux
 * d'inventaire » : l'inventaire obligatoire tous les douze mois, le livre d'inventaire, l'ordre des
 * travaux de la balance avant inventaire aux documents de synthèse), adapté à NOVA.
 */

/** Le dossier de révision se tient sur l'exercice de NOVA, dans la simulation du cours. */
export const ENTREPRISES_DU_DOSSIER: readonly string[] = ["nova"];

/** Les leviers du laboratoire : la part des retours à venir (en %), le prix de reprise d'une batterie (en euros). */
export const LEVIERS_DU_DOSSIER = {
  part: { min: 0, max: 100, pas: 10 },
  prix: { min: 0, max: 6, pas: 0.3 },
} as const;

/** Le défi du laboratoire : faire baisser l'impôt de N+1 d'au moins cette somme. */
export const BAISSE_D_IMPOT_DU_DEFI = 1_000;

/** La solution que montre la correction : 80 % des retours encore à venir, le recycleur au prix du dossier. */
export const SOLUTION_DU_DOSSIER = { part: 80, prix: BATTERIES_DE_L_ANCIEN_MODELE.prixDeReprise } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

const donnee = (valeur: number | null): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, indice?: string): CelluleACompleter => ({ valeur, saisir: true, calcul, ...(indice ? { indice } : {}) });

/** Tout ce que le chapitre lit du dossier de révision de NOVA. */
export function revisionDuChapitre(_c: Pick<Cas, "code">) {
  const d = dossierDeRevision();
  const cp = congesPayes();
  const b = batteries();
  const g = garantie();
  const a = COMPTE_D_ATTENTE;
  return {
    entreprise: "NOVA",
    d,
    cp,
    b,
    g,
    a,
    exercice: EXERCICE_N1_DE_NOVA.exercice,
    resultatDuChapitreDeLImpot: EXERCICE_N1_DE_NOVA.resultatComptable,
    participation: PARTICIPATION_DE_N_PLUS_1,
    amende: MAJORATION_CONTESTEE,
    forfaitSocialVariante: auCentime(PARTICIPATION_DE_N_PLUS_1 * TAUX_DU_FORFAIT_SOCIAL),
    impotEconomiseParLaParticipation: auCentime(PARTICIPATION_DE_N_PLUS_1 * TAUX_NORMAL),
  };
}

export type RevisionDuChapitre = ReturnType<typeof revisionDuChapitre>;

/** Une position du laboratoire, en estimations du dossier. */
export const estimationsDe = (p: Readonly<Record<string, number>>): EstimationsDeLaRevision => ({ partDesRetoursAVenir: p.part! / 100, prixDeReprise: p.prix! });

/** Le départ du laboratoire : les estimations du dossier. */
export const departDuDossier = () => ({ part: Math.round(ESTIMATIONS_DU_DOSSIER.partDesRetoursAVenir * 100), prix: ESTIMATIONS_DU_DOSSIER.prixDeReprise });

/** Le laboratoire : le dossier à une position des leviers. */
export const laboratoireDuDossier = (p: Readonly<Record<string, number>>) => dossierDeRevision(estimationsDe(p));

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** La feuille de travail : les comptes à contrôler, cycle par cycle, avant la révision. */
export function feuilleDeTravail(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = revisionDuChapitre(c);
  return {
    titre: `La feuille de travail de la révision, ${x.entreprise}, 31 décembre ${x.exercice}`,
    colonnes: ["Avant révision", "Contrôle"],
    lignes: [
      { libelle: "Trésorerie : 471, compte d'attente", valeurs: [`${eur(x.d.soldeDuCompteDAttente)} créditeur`, "identifier, solder"] },
      { libelle: "Achats et stocks : batteries de l'ancien modèle", valeurs: [eur(x.b.cout), "valeur actuelle"] },
      { libelle: "Personnel : 4282, dettes de congés payés", valeurs: ["aucun solde", "congés acquis depuis le 1er juin"] },
      { libelle: "Personnel : 4284, participation", valeurs: ["aucun solde", "accord signé dans l'année"] },
      { libelle: "État : 1514, provision pour amendes", valeurs: ["aucun solde", "majoration contestée"] },
      { libelle: "Ventes : 1512, provision pour garanties", valeurs: ["aucun solde", "retours sous garantie à venir"] },
      { libelle: "Résultat avant impôt, provisoire", valeurs: [eur(x.d.resultatProvisoire), "à réviser"] },
    ],
  };
}

/** Le tableau des chiffres de l'équipe et de la qualité : ce qu'il faut pour les congés et la garantie. */
export function chiffresDuPersonnelEtDeLaQualite(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = revisionDuChapitre(c);
  return {
    titre: `${x.entreprise}, les chiffres de ${x.exercice} utiles à la révision`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Brut de juin à décembre, toute l'équipe", valeurs: [eur(x.cp.brutDeLaPeriode)] },
      { libelle: "Congés de la période déjà pris au 31 décembre", valeurs: [eur(0)] },
      { libelle: "Cotisations patronales du cours", valeurs: [pct(x.cp.tauxPatronal)] },
      { libelle: "Enceintes produites et vendues", valeurs: [qte(x.g.volume)] },
      { libelle: "Taux de défaut", valeurs: [pct(x.g.tauxDeDefaut)] },
      { libelle: "Défauts trouvés au contrôle final", valeurs: [pct(x.g.tauxDeDetection)] },
      { libelle: "Coût d'un retour sous garantie", valeurs: [eur(x.g.coutDUnRetour)] },
    ],
  };
}

/** LE DOSSIER MIS À JOUR, à compléter : du résultat provisoire au résultat révisé. */
export function grilleDuDossier(c: Pick<Cas, "code">): TableauACompleter {
  const x = revisionDuChapitre(c);
  const t = x.d.travaux;
  return {
    titre: `Du résultat provisoire au résultat révisé, ${x.exercice}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Résultat avant impôt, provisoire", cellules: [donnee(x.d.resultatProvisoire)] },
      { libelle: "Frais bancaires sortis du compte d'attente", cellules: [aSaisir(t.frais, `les frais du 31 décembre : ${eur(t.frais)}`, "le débit du compte d'attente")] },
      { libelle: "Congés payés et leurs cotisations", cellules: [aSaisir(t.conges, `${eur(x.cp.dette)} + ${eur(x.cp.charges)} = ${eur(t.conges)}`, "la dette et ses cotisations patronales")] },
      { libelle: "Participation des salariés", cellules: [aSaisir(t.participation, `le montant donné : ${eur(t.participation)}`)] },
      { libelle: "Provision pour amende", cellules: [aSaisir(t.amende, `la majoration contestée : ${eur(t.amende)}`)] },
      { libelle: "Dépréciation des batteries", cellules: [aSaisir(t.batteries, `${eur(x.b.cout)} − ${eur(x.b.valeurActuelle)} = ${eur(t.batteries)}`)] },
      { libelle: "Provision pour garantie", cellules: [aSaisir(t.garantie, `${qte(x.g.retoursAVenir)} retours × ${eur(x.g.coutDUnRetour)} = ${eur(t.garantie)}`)] },
      {
        libelle: "Charges de la révision",
        fort: true,
        totalDe: { plus: [1, 2, 3, 4, 5, 6] },
        cellules: [aSaisir(x.d.charges, `${eur(t.frais)} + ${eur(t.conges)} + ${eur(t.participation)} + ${eur(t.amende)} + ${eur(t.batteries)} + ${eur(t.garantie)} = ${eur(x.d.charges)}`)],
      },
      {
        libelle: "Résultat avant impôt, révisé",
        fort: true,
        totalDe: { plus: [0], moins: [7] },
        cellules: [aSaisir(x.d.resultatRevise, `${eur(x.d.resultatProvisoire)} − ${eur(x.d.charges)} = ${eur(x.d.resultatRevise)}`)],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const LE_DOSSIER_DE_REVISION: Chapitre = {
  code: "le-dossier-de-revision",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P2 · Contrôle et production de l'information financière"],
  titre: "Le dossier de révision : contrôler l'inventaire, cycle par cycle",
  accroche:
    "À la clôture de N+1, la balance de NOVA donne un résultat provisoire. Le réviseur reprend chaque cycle, justifie chaque solde, solde le compte d'attente et passe ce qui manque : les congés payés, la participation, une amende contestée, des batteries qui ne valent plus rien, la garantie.",
  objectifs: [
    "Organiser la révision cycle par cycle et tenir la feuille de travail du dossier",
    "Apurer un compte d'attente en rendant chaque ligne à son compte",
    "Constater la dette de congés payés et ses cotisations, et la participation des salariés au montant donné",
    "Constituer une provision pour amende et une provision pour garantie, et passer une dépréciation de stock",
    "Mesurer ce que la révision change au résultat et à l'impôt, et défendre une estimation",
  ],
  libre: false,
  prerequis: ["depreciations-et-provisions", "les-stocks", "la-cloture"],
  ensuite: ["l-impot-sur-les-societes"],
  entreprises: {
    codes: ENTREPRISES_DU_DOSSIER,
    pourquoi: "la révision se fait sur la clôture du second exercice de NOVA, dans la simulation du cours : le résultat qui en sort est celui que lit le chapitre de l'impôt.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Réviser avant d'arrêter les comptes",
      notions: ["income_statement", "balance_sheet"],
      tableau: feuilleDeTravail,
      texte: (c) => {
        const x = revisionDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}, au 31 décembre ${x.exercice}. Les amortissements, les régularisations et le dénouement des risques de N sont passés. La balance donne un résultat avant impôt provisoire de ${eur(x.d.resultatProvisoire)}.`,
          "Avant d'arrêter les comptes, le collaborateur du cabinet révise. La loi impose un inventaire au moins une fois par exercice : chaque solde du bilan doit être justifié par une pièce, un décompte ou un calcul.",
          "La révision se fait cycle par cycle : la trésorerie, les ventes et les clients, les achats et les stocks, le personnel, l'État. Pour chaque cycle, une feuille de travail dit ce qui a été contrôlé, avec quelle pièce, et l'écriture qui en sort.",
          "Ce que les chapitres précédents ont déjà fait, le dossier le relit sans le refaire : les créances douteuses et le litige, l'inventaire des stocks, les charges et produits constatés d'avance. Restent les points ouverts de la feuille.",
        ];
      },
      repere: () =>
        "Le dossier de révision rassemble, cycle par cycle, la feuille de travail, les pièces qui justifient chaque solde et les écritures de révision. C'est lui qu'on ouvre devant l'expert-comptable, le commissaire aux comptes ou un contrôleur.",
    },
    {
      id: "le-role-de-la-revision",
      objectifs: [0],
      type: "choix",
      titre: "À quoi sert le dossier",
      notions: ["balance_sheet"],
      question: () => "Le vérificateur des impôts, l'an prochain, demandera d'où vient le solde d'un compte. À quoi sert, ce jour-là, le dossier de révision ?",
      options: (c) => [
        {
          texte: "À montrer la pièce et le calcul derrière chaque solde",
          juste: true,
          retour:
            "C'est cela. Le dossier relie chaque solde du bilan à ce qui le prouve : un relevé, un décompte, une estimation datée et motivée. Il se tient pendant la clôture, pas le jour du contrôle.",
        },
        {
          texte: "À rien de plus que le grand livre, qui contient déjà toutes les écritures de l'exercice",
          juste: false,
          retour: `Le grand livre dit ce qui a été passé, pas pourquoi. Une provision de ${eur(revisionDuChapitre(c).g.provision)} s'y lit ; l'estimation qui la fonde, seul le dossier la garde.`,
        },
        {
          texte: "À calculer l'impôt sur les sociétés, une fois toutes les écritures passées et validées",
          juste: false,
          retour: "L'impôt se calcule sur le résultat révisé, après. Le dossier sert d'abord à justifier les comptes, quel que soit l'impôt.",
        },
      ],
    },
    {
      id: "les-cycles",
      objectifs: [0],
      type: "tri",
      titre: "Chaque point ouvert dans son cycle",
      notions: ["balance_sheet", "payroll", "stock"],
      tableau: feuilleDeTravail,
      question: () =>
        "Rangez chaque point ouvert de la feuille de travail dans le cycle qui le contrôle. Un cycle suit un flux de l'entreprise de bout en bout : la pièce qui le déclenche, le compte de tiers, la trésorerie.",
      relance: "Demandez-vous quel flux a fait naître le solde : une vente, un achat, la paie, la banque, ou une obligation envers l'État.",
      categories: [
        { code: "tresorerie", libelle: "Trésorerie" },
        { code: "ventes", libelle: "Ventes et clients" },
        { code: "achats", libelle: "Achats et stocks" },
        { code: "personnel", libelle: "Personnel" },
        { code: "etat", libelle: "État" },
      ],
      elements: (c) => {
        const x = revisionDuChapitre(c);
        return [
          { libelle: "Le prélèvement de la banque sans pièce", montant: x.a.frais.montant, categorie: "tresorerie", pourquoi: "Un mouvement du relevé bancaire : il se justifie par l'avis de la banque." },
          { libelle: "Le virement reçu du comité social", montant: x.a.acompte.montant, categorie: "ventes", pourquoi: "De l'argent versé par un client sur une commande : le cycle des ventes." },
          { libelle: "Les retours sous garantie encore à venir", montant: x.d.travaux.garantie, categorie: "ventes", pourquoi: "La garantie naît de la vente : elle se révise avec les ventes et les clients." },
          { libelle: "Les batteries de l'ancien modèle", montant: x.b.cout, categorie: "achats", pourquoi: "Un stock de matières achetées : le cycle des achats et des stocks." },
          { libelle: "Les congés acquis et non pris", montant: x.cp.total, categorie: "personnel", pourquoi: "Une dette envers les salariés et les organismes sociaux." },
          { libelle: "La participation de l'exercice", montant: x.participation, categorie: "personnel", pourquoi: "Elle revient aux salariés : le cycle du personnel." },
          { libelle: "La majoration de TVA contestée", montant: x.amende, categorie: "etat", pourquoi: "Une pénalité fiscale : le cycle de l'État, avec la TVA et l'impôt." },
        ];
      },
      explication: (c) => {
        const x = revisionDuChapitre(c);
        return [
          `Ranger par cycle, c'est contrôler un flux entier au lieu d'un compte isolé. Le virement de ${eur(x.a.acompte.montant)} est arrivé en banque, mais c'est le cycle des ventes qui dit ce qu'il est.`,
        ];
      },
    },
    {
      id: "predire-le-resultat",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur le résultat révisé",
      notions: ["income_statement"],
      question: (c) => {
        const x = revisionDuChapitre(c);
        return `Avant de passer les travaux, pariez. Le résultat avant impôt provisoire est de ${eur(x.d.resultatProvisoire)}. Une fois les six points traités, il sera…`;
      },
      options: () => {
        const voir = "Le tableau du dossier, en fin de chapitre, le chiffrera.";
        return [
          { texte: "Plus bas, de beaucoup", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le même : réviser, c'est vérifier", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus haut : des produits oubliés", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-compte-d-attente",
      objectifs: [1],
      type: "choix",
      titre: "Le compte d'attente",
      notions: ["balance_sheet", "payment_terms"],
      question: (c) => {
        const x = revisionDuChapitre(c);
        return `Le compte 471 porte deux écritures : ${eur(x.a.acompte.montant)} reçus par virement le ${x.a.acompte.date}, au libellé illisible, et ${eur(x.a.frais.montant)} prélevés par la banque le ${x.a.frais.date}, sans pièce. Que devient ce compte à la clôture ?`;
      },
      options: () => [
        {
          texte: "Il est soldé : chaque ligne rejoint son vrai compte",
          juste: true,
          retour:
            "Oui. Un compte d'attente est un parking pendant l'exercice, pour ne pas bloquer la saisie. À la clôture, il ne figure pas au bilan : chaque ligne est identifiée, puis passée au compte qui lui revient.",
        },
        {
          texte: "Il reste au bilan, avec les autres créances et dettes diverses de l'entreprise",
          juste: false,
          retour: "Non : un solde dont on ne sait pas ce qu'il est n'a pas sa place dans des comptes qui doivent donner une image fidèle. Le réviseur cherche la pièce.",
        },
        {
          texte: "On le solde par un produit exceptionnel, faute de mieux",
          juste: false,
          retour: "Ce serait inventer un produit. Chaque écriture a une cause : le relevé et l'avis de la banque, l'ordre de virement du client.",
        },
      ],
    },
    {
      id: "l-acompte-identifie",
      objectifs: [1],
      type: "ecriture",
      titre: "Le virement identifié",
      notions: ["payment_terms"],
      evenement: (c) => {
        const x = revisionDuChapitre(c);
        return `Le virement de ${eur(x.a.acompte.montant)} est identifié : un acompte versé par ${x.a.acompte.de}, sur une commande de ${x.a.acompte.enceintes} enceintes livrables en janvier. Sortez-le du compte d'attente.`;
      },
      ecriture: (c) => {
        const x = revisionDuChapitre(c);
        return {
          date: `31 décembre ${x.exercice}`,
          libelle: "Acompte du comité social, sorti du compte d'attente",
          lignes: [
            { role: "le compte d'attente qui se solde", compte: "471", sens: "debit", montant: x.a.acompte.montant, indice: "le virement reçu" },
            { role: "l'acompte reçu du client", compte: "4191", acceptes: ["419"], sens: "credit", montant: x.a.acompte.montant, indice: "le virement reçu" },
          ],
        };
      },
      indices: () => [
        "Les enceintes ne sont pas livrées : ce n'est pas encore une vente.",
        "Au débit, le compte d'attente qui se solde (471) ; au crédit, les clients, avances et acomptes reçus sur commandes (4191).",
      ],
      explication: (c) => {
        const x = revisionDuChapitre(c);
        return [
          `L'acompte est une dette envers le client tant que NOVA n'a pas livré. Pour une livraison de biens, la TVA naît à la livraison : aucune TVA sur ces ${eur(x.a.acompte.montant)}. La facture de janvier imputera l'acompte.`,
        ];
      },
    },
    {
      id: "les-frais-bancaires",
      objectifs: [1],
      type: "ecriture",
      titre: "Les frais de la banque",
      notions: ["income_statement"],
      evenement: (c) => {
        const x = revisionDuChapitre(c);
        return `L'avis de la banque est retrouvé : les ${eur(x.a.frais.montant)} du ${x.a.frais.date} sont des frais de tenue de compte et de virement du semestre, exonérés de TVA. Soldez le compte d'attente.`;
      },
      ecriture: (c) => {
        const x = revisionDuChapitre(c);
        return {
          date: `31 décembre ${x.exercice}`,
          libelle: "Frais bancaires, sortis du compte d'attente",
          lignes: [
            { role: "les frais bancaires", compte: "627", acceptes: ["62"], sens: "debit", montant: x.a.frais.montant, indice: "le prélèvement de la banque" },
            { role: "le compte d'attente qui se solde", compte: "471", sens: "credit", montant: x.a.frais.montant, indice: "le prélèvement de la banque" },
          ],
        };
      },
      indices: () => [
        "Une charge, pour un service rendu par la banque.",
        "Au débit, les services bancaires et assimilés (627) ; au crédit, le compte d'attente (471).",
      ],
      explication: (c) => {
        const x = revisionDuChapitre(c);
        return [
          `Le compte 471 est soldé : ${eur(x.a.acompte.montant)} au débit, ${eur(x.a.frais.montant)} au crédit, et le solde créditeur de ${eur(x.d.soldeDuCompteDAttente)} a disparu. Le résultat perd ${eur(x.a.frais.montant)} : seuls les frais étaient une charge.`,
        ];
      },
    },
    {
      id: "les-conges-payes",
      objectifs: [2],
      type: "montants",
      titre: "Les congés acquis et non pris",
      notions: ["payroll"],
      tableau: chiffresDuPersonnelEtDeLaQualite,
      question: () =>
        "La période de référence des congés court du 1er juin au 31 mai. Au 31 décembre, ce qui a été acquis depuis le 1er juin et pas encore pris est une dette. Calculez-la par la règle du dixième, puis ses cotisations patronales.",
      champs: (c) => {
        const x = revisionDuChapitre(c);
        return [
          { libelle: "Dette de congés payés", attendu: x.cp.dette, calcul: `${eur(x.cp.brutDeLaPeriode)} × ${pct(REGLE_DU_DIXIEME)} − ${eur(0)} déjà pris = ${eur(x.cp.dette)}` },
          { libelle: "Cotisations patronales sur la dette", attendu: x.cp.charges, calcul: `${eur(x.cp.dette)} × ${pct(x.cp.tauxPatronal)} = ${eur(x.cp.charges)}` },
          { libelle: "Charge totale de l'exercice", attendu: x.cp.total, calcul: `${eur(x.cp.dette)} + ${eur(x.cp.charges)} = ${eur(x.cp.total)}` },
        ];
      },
      explication: (c) => {
        const x = revisionDuChapitre(c);
        return [
          `Les ${qte(x.cp.effectif)} salariés de décembre ont travaillé en ${x.exercice} pour des congés qu'ils prendront en N+2 : la charge appartient à ${x.exercice}, c'est l'indépendance des exercices. Les cotisations suivront l'indemnité quand elle sera payée : elles se constatent avec elle.`,
          "Le dixième n'est qu'une des deux façons de compter : l'indemnité versée sera la plus favorable au salarié, du dixième ou du maintien de salaire. Le cours prend le dixième, comme la plupart des dossiers.",
        ];
      },
    },
    {
      id: "conges-au-journal",
      objectifs: [2],
      type: "ecriture",
      titre: "Les congés payés, au journal",
      notions: ["payroll"],
      evenement: () => "Passez la dette de congés payés et ses cotisations patronales.",
      ecriture: (c) => {
        const x = revisionDuChapitre(c);
        return {
          date: `31 décembre ${x.exercice}`,
          libelle: "Dette de congés payés et cotisations",
          lignes: [
            { role: "la charge de congés payés", compte: "6412", acceptes: ["641"], sens: "debit", montant: x.cp.dette, indice: "le dixième du brut de la période" },
            { role: "les cotisations patronales sur les congés", compte: "645", sens: "debit", montant: x.cp.charges, indice: "les cotisations sur la dette" },
            { role: "la dette de congés envers les salariés", compte: "4282", acceptes: ["428"], sens: "credit", montant: x.cp.dette, indice: "le dixième du brut de la période" },
            { role: "les charges sociales à payer", compte: "4382", acceptes: ["438", "4386"], sens: "credit", montant: x.cp.charges, indice: "les cotisations sur la dette" },
          ],
        };
      },
      indices: () => [
        "Deux charges de personnel, et deux dettes à payer, l'une aux salariés, l'autre aux organismes sociaux.",
        "Au débit, les congés payés (6412) et les charges sociales (645) ; au crédit, les dettes provisionnées pour congés à payer (4282) et les charges sociales sur congés à payer (4382).",
      ],
      explication: (c) => {
        const x = revisionDuChapitre(c);
        return [
          `Le résultat perd ${eur(x.cp.total)}. Au 1er janvier, l'écriture s'extourne, comme une charge à payer : l'indemnité payée en N+2 retombera alors en charges sans être comptée deux fois.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "la-participation",
      objectifs: [2],
      type: "ecriture",
      titre: "La participation des salariés",
      notions: ["payroll", "income_statement"],
      evenement: (c) => {
        const x = revisionDuChapitre(c);
        return `Le président a signé cette année un accord de participation volontaire. Le cabinet a calculé la réserve spéciale de l'exercice : ${eur(x.participation)}, que les salariés recevront en N+2. Passez-la.`;
      },
      ecriture: (c) => {
        const x = revisionDuChapitre(c);
        return {
          date: `31 décembre ${x.exercice}`,
          libelle: "Participation des salariés de l'exercice",
          lignes: [
            { role: "la participation, charge de l'exercice", compte: "691", sens: "debit", montant: x.participation, indice: "le montant donné par le cabinet" },
            { role: "la dette envers les salariés", compte: "4284", acceptes: ["428"], sens: "credit", montant: x.participation, indice: "le montant donné par le cabinet" },
          ],
        };
      },
      indices: () => [
        "La participation a son propre compte de charges, sous le résultat courant, avant l'impôt.",
        "Au débit, la participation des salariés aux résultats (691) ; au crédit, les dettes provisionnées pour participation des salariés (4284).",
      ],
      explication: (c) => {
        const x = revisionDuChapitre(c);
        return [
          `Le référentiel donne le montant : le calcul de la réserve spéciale n'est pas à faire. La participation se déduit du résultat fiscal : au taux marginal de ${pct(TAUX_NORMAL)}, elle économise ${eur(x.impotEconomiseParLaParticipation)} d'impôt à NOVA.`,
        ];
      },
    },
    {
      id: "le-forfait-social",
      objectifs: [2],
      type: "choix",
      titre: "Le forfait social",
      notions: ["payroll"],
      question: (c) => {
        const x = revisionDuChapitre(c);
        return `Sur une participation, l'employeur doit parfois un forfait social, au taux de ${pct(TAUX_DU_FORFAIT_SOCIAL)}. NOVA compte ${qte(x.cp.effectif)} salariés. Que passe le réviseur ?`;
      },
      options: (c) => {
        const x = revisionDuChapitre(c);
        return [
          {
            texte: `Rien : sous ${qte(SEUIL_DU_FORFAIT_SOCIAL)} salariés, NOVA en est exonérée`,
            juste: true,
            retour: `Oui. Sous ${qte(SEUIL_DU_FORFAIT_SOCIAL)} salariés, la participation échappe au forfait social : il vaut ${eur(FORFAIT_SOCIAL_DE_NOVA)} chez NOVA. Une entreprise de ${qte(SEUIL_DU_FORFAIT_SOCIAL)} salariés ou plus passerait ${eur(x.forfaitSocialVariante)} au débit d'une charge sociale (645), au crédit d'une dette envers l'URSSAF.`,
          },
          {
            texte: `${eur(x.forfaitSocialVariante)} retenus sur la participation que chaque salarié recevra`,
            juste: false,
            retour: "Non : le forfait social est une contribution de l'employeur, jamais retenue sur ce que touche le salarié.",
          },
          {
            texte: `${eur(x.forfaitSocialVariante)} de charges sociales, dues sur toute participation, quelle que soit la taille de l'entreprise`,
            juste: false,
            retour: `Non : la loi en exonère la participation des entreprises de moins de ${qte(SEUIL_DU_FORFAIT_SOCIAL)} salariés. Elle s'appliquerait à une entreprise plus grande.`,
          },
        ];
      },
    },
    {
      id: "la-majoration-contestee",
      objectifs: [3],
      type: "choix",
      titre: "La majoration contestée",
      notions: ["income_statement", "vat_payable"],
      question: (c) => {
        const x = revisionDuChapitre(c);
        return `La déclaration de TVA de mars a valu à NOVA une majoration de ${eur(x.amende)}. NOVA la conteste, mais l'accusé de réception du portail n'a pas été archivé ; l'expert-comptable juge probable qu'elle soit maintenue. Que constate le réviseur ?`;
      },
      options: (c) => {
        const x = revisionDuChapitre(c);
        return [
          {
            texte: `Une provision pour amende de ${eur(x.amende)}, réintégrée`,
            juste: true,
            retour: `Oui. Une sortie probable, d'un montant estimable : une provision pour amendes et pénalités (1514). Une pénalité ne se déduit pas, même provisionnée : le chapitre de l'impôt réintègre ces ${eur(x.amende)}.`,
          },
          {
            texte: "Rien tant que l'administration n'a pas répondu à la réclamation déposée par NOVA",
            juste: false,
            retour: "La prudence compte la perte probable dès qu'on la connaît. Attendre la réponse, c'est présenter un résultat trop beau.",
          },
          {
            texte: `Une provision pour impôts de ${eur(x.amende)}, déductible comme l'impôt qu'elle accompagne`,
            juste: false,
            retour: "La provision pour impôts (155) vise un impôt probable, pas une sanction. Et une pénalité ne se déduit jamais du résultat fiscal.",
          },
        ];
      },
    },
    {
      id: "la-provision-pour-amende",
      objectifs: [3],
      type: "ecriture",
      titre: "La provision pour amende, au journal",
      notions: ["income_statement"],
      evenement: (c) => `Constituez la provision pour la majoration contestée, ${eur(revisionDuChapitre(c).amende)}.`,
      ecriture: (c) => {
        const x = revisionDuChapitre(c);
        return {
          date: `31 décembre ${x.exercice}`,
          libelle: "Provision pour la majoration de TVA contestée",
          lignes: [
            { role: "la dotation aux provisions exceptionnelles", compte: "6875", acceptes: ["687"], sens: "debit", montant: x.amende, indice: "la majoration notifiée" },
            { role: "la provision pour amendes et pénalités", compte: "1514", acceptes: ["151"], sens: "credit", montant: x.amende, indice: "la majoration notifiée" },
          ],
        };
      },
      indices: () => [
        "Une pénalité est une charge exceptionnelle : sa dotation l'est aussi.",
        "Au débit, les dotations aux provisions exceptionnelles (6875) ; au crédit, les provisions pour amendes et pénalités (1514).",
      ],
      explication: () => [
        "Si l'administration maintient la majoration, NOVA la paiera et reprendra la provision : la charge restera de ce montant. Si elle l'annule, la reprise rendra la provision au résultat. Archiver l'accusé de réception aurait évité tout cela.",
      ],
    },
    {
      id: "les-batteries",
      objectifs: [3],
      type: "montants",
      titre: "Des batteries qui ne serviront plus",
      notions: ["stock", "depreciation"],
      question: (c) => {
        const x = revisionDuChapitre(c);
        return `Après l'incendie de N, NOVA a changé de batterie. Il reste ${qte(x.b.quantite)} batteries de l'ancien modèle, achetées ${eur(x.b.coutUnitaire)} pièce ; un recycleur les reprend à ${eur(x.b.prixDeReprise)}. Calculez leur coût au stock, leur valeur actuelle et la dépréciation.`;
      },
      champs: (c) => {
        const x = revisionDuChapitre(c);
        return [
          { libelle: "Coût au stock", attendu: x.b.cout, calcul: `${qte(x.b.quantite)} × ${eur(x.b.coutUnitaire)} = ${eur(x.b.cout)}` },
          { libelle: "Valeur actuelle", attendu: x.b.valeurActuelle, calcul: `${qte(x.b.quantite)} × ${eur(x.b.prixDeReprise)} = ${eur(x.b.valeurActuelle)}` },
          { libelle: "Dépréciation", attendu: x.b.depreciation, calcul: `${eur(x.b.cout)} − ${eur(x.b.valeurActuelle)} = ${eur(x.b.depreciation)}` },
        ];
      },
      explication: () => [
        "Au chapitre des provisions, les composants de N gardaient leur coût : les enceintes qui les utilisaient se vendaient au-dessus de leur coût. Ici, les batteries ne seront plus montées : seule compte ce qu'on en tirera, le prix du recycleur.",
      ],
    },
    {
      id: "la-depreciation-du-stock",
      objectifs: [3],
      type: "ecriture",
      titre: "La dépréciation du stock, au journal",
      notions: ["stock", "depreciation"],
      evenement: () => "Passez la dépréciation des batteries de l'ancien modèle.",
      ecriture: (c) => {
        const x = revisionDuChapitre(c);
        return {
          date: `31 décembre ${x.exercice}`,
          libelle: "Dépréciation des batteries de l'ancien modèle",
          lignes: [
            { role: "la dotation aux dépréciations des actifs circulants", compte: "6817", acceptes: ["681"], sens: "debit", montant: x.b.depreciation, indice: "le coût moins la valeur actuelle" },
            { role: "la dépréciation du stock de matières", compte: "391", acceptes: ["39"], sens: "credit", montant: x.b.depreciation, indice: "le coût moins la valeur actuelle" },
          ],
        };
      },
      indices: () => [
        "Comme pour une créance douteuse : une dotation, et un compte qui se soustrait de l'actif.",
        "Au débit, les dotations aux dépréciations des actifs circulants (6817) ; au crédit, les dépréciations des stocks de matières premières (391).",
      ],
      explication: (c) => {
        const x = revisionDuChapitre(c);
        return [`Au bilan, le stock garde son coût, ${eur(x.b.cout)}, et la dépréciation s'en soustrait : ${eur(x.b.valeurActuelle)} net. Quand les batteries partiront chez le recycleur, la dépréciation sera reprise.`];
      },
      vue: "bilan",
    },
    {
      id: "la-garantie",
      objectifs: [3],
      type: "montants",
      titre: "Les retours sous garantie à venir",
      notions: ["income_statement"],
      tableau: chiffresDuPersonnelEtDeLaQualite,
      question: (c) => {
        const x = revisionDuChapitre(c);
        return `Chaque enceinte est garantie un an. Les défauts que le contrôle final ne trouve pas partent chez le client et reviennent sous garantie. Au 31 décembre, ${pct(x.g.part)} de ces retours sont encore à venir. Calculez les défauts livrés de l'année, les retours à venir et la provision.`;
      },
      champs: (c) => {
        const x = revisionDuChapitre(c);
        return [
          {
            libelle: "Défauts livrés aux clients dans l'année",
            attendu: x.g.defautsLivres,
            calcul: `${qte(x.g.volume)} × ${pct(x.g.tauxDeDefaut)} × (1 − ${pct(x.g.tauxDeDetection)}) = ${qte(x.g.defautsLivres)}`,
          },
          { libelle: "Retours encore à venir", attendu: x.g.retoursAVenir, calcul: `${qte(x.g.defautsLivres)} × ${pct(x.g.part)} = ${qte(x.g.retoursAVenir)}` },
          { libelle: "Provision pour garantie", attendu: x.g.provision, calcul: `${qte(x.g.retoursAVenir)} × ${eur(x.g.coutDUnRetour)} = ${eur(x.g.provision)}` },
        ];
      },
      explication: (c) => {
        const x = revisionDuChapitre(c);
        return [
          `La garantie est une obligation née de la vente de ${x.exercice} ; son coût viendra en N+2. La provision le rattache à l'exercice des ventes. Les retours déjà revenus sont dans les charges de l'année : la provision ne vise que ceux à venir.`,
        ];
      },
    },
    {
      id: "la-provision-pour-garantie",
      objectifs: [3],
      type: "ecriture",
      titre: "La provision pour garantie, au journal",
      notions: ["income_statement"],
      evenement: (c) => `Constituez la provision pour garantie, ${eur(revisionDuChapitre(c).g.provision)}.`,
      ecriture: (c) => {
        const x = revisionDuChapitre(c);
        return {
          date: `31 décembre ${x.exercice}`,
          libelle: "Provision pour garanties données aux clients",
          lignes: [
            { role: "la dotation aux provisions d'exploitation", compte: "6815", acceptes: ["681"], sens: "debit", montant: x.g.provision, indice: "les retours à venir, à leur coût" },
            { role: "la provision pour garanties données aux clients", compte: "1512", acceptes: ["151"], sens: "credit", montant: x.g.provision, indice: "les retours à venir, à leur coût" },
          ],
        };
      },
      indices: () => [
        "Une charge d'exploitation probable : une dotation aux provisions d'exploitation.",
        "Au débit, les dotations aux provisions d'exploitation (6815) ; au crédit, les provisions pour garanties données aux clients (1512).",
      ],
      explication: () => [
        "L'an prochain, le réviseur reprendra cette provision et en constituera une nouvelle, sur les ventes de N+2 : à chaque clôture, la provision suit les retours encore à venir.",
      ],
      vue: "resultat",
    },
    {
      id: "le-laboratoire-des-estimations",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire des estimations",
      notions: ["income_statement", "depreciation"],
      question: () =>
        "Deux travaux reposent sur une estimation : la part des retours encore à venir, et le prix que le recycleur paiera les batteries. Faites-les varier. Le tableau suit le résultat révisé et l'impôt de N+1 ; le graphique, les deux selon la part des retours.",
      leviers: () => {
        const d = departDuDossier();
        const L = LEVIERS_DU_DOSSIER;
        return [
          { code: "part", libelle: "Part des retours encore à venir", unite: "%", ...L.part, depart: d.part },
          { code: "prix", libelle: "Prix de reprise d'une batterie", unite: "€", ...L.prix, depart: d.prix },
        ];
      },
      lecture: (_c, p) => {
        const l = laboratoireDuDossier(p);
        const d = laboratoireDuDossier(departDuDossier());
        return [
          { libelle: "Provision pour garantie", montant: l.travaux.garantie, reference: d.travaux.garantie },
          { libelle: "Dépréciation des batteries", montant: l.travaux.batteries, reference: d.travaux.batteries },
          { libelle: "Résultat avant impôt révisé", montant: l.resultatRevise, reference: d.resultatRevise },
          { libelle: "Impôt sur les sociétés de N+1", montant: l.impot, reference: d.impot },
          { libelle: "Résultat net", montant: l.resultatNet, reference: d.resultatNet, fort: true },
          { libelle: "Effet sur l'impôt", montant: auCentime(l.impot - d.impot), reference: 0, effet: true },
        ];
      },
      graphique: () => ({
        levier: "part",
        courbes: [
          { libelle: "Résultat avant impôt révisé", valeur: (p) => laboratoireDuDossier(p).resultatRevise },
          { libelle: "Impôt de N+1", valeur: (p) => laboratoireDuDossier(p).impot },
        ],
      }),
      defi: () => {
        const depart = laboratoireDuDossier(departDuDossier());
        return {
          consigne: `Le président aimerait payer au moins ${eur(BAISSE_D_IMPOT_DU_DEFI)} d'impôt de moins que les ${eur(depart.impot)} du dossier. Trouvez des estimations qui y arrivent.`,
          atteint: (p) => depart.impot - laboratoireDuDossier(p).impot >= BAISSE_D_IMPOT_DU_DEFI,
          indice: (p) => {
            const l = laboratoireDuDossier(p);
            return `L'impôt baisse de ${eur(auCentime(depart.impot - l.impot))}. Chaque euro de charge en plus n'en économise que ${pct(TAUX_NORMAL)} : il faut ${eur(BAISSE_D_IMPOT_DU_DEFI / TAUX_NORMAL)} de charges en plus.`;
          },
          solution: SOLUTION_DU_DOSSIER,
        };
      },
      explication: (_c, p) => {
        const l = laboratoireDuDossier(p);
        const d = laboratoireDuDossier(departDuDossier());
        return [
          `L'impôt a baissé de ${eur(auCentime(d.impot - l.impot))} pour ${eur(auCentime(l.charges - d.charges))} de charges en plus : ${pct(TAUX_NORMAL)}, le taux marginal. Mais ce n'est qu'un décalage : la provision trop forte sera reprise en N+2, et l'impôt avec elle.`,
          "Et surtout, une estimation ne se choisit pas pour l'impôt : elle se justifie par les retours constatés et l'offre du recycleur, pièces au dossier. Gonfler la provision sans raison, c'est fausser l'image fidèle, et un vérificateur la réintégrera.",
        ];
      },
    },
    {
      id: "le-dossier-mis-a-jour",
      objectifs: [4],
      type: "a-completer",
      titre: "Le dossier mis à jour",
      notions: ["income_statement"],
      tableau: feuilleDeTravail,
      question: () =>
        "Mettez à jour la synthèse du dossier : chaque travail de révision, la charge qu'il ajoute, puis le résultat avant impôt révisé. L'acompte reclassé ne change rien au résultat : il n'a pas de ligne.",
      grille: grilleDuDossier,
      explication: (c) => {
        const x = revisionDuChapitre(c);
        return [
          `Le résultat révisé, ${eur(x.d.resultatRevise)}, est celui que le chapitre de l'impôt sur les sociétés reprend pour ${x.exercice}. L'impôt se calcule dessus : ${eur(x.d.resultatFiscal)} de résultat fiscal, ${eur(x.d.impot)} d'impôt.`,
          `La révision a retiré ${eur(x.d.charges)} au résultat provisoire. Sans elle, NOVA aurait présenté un bénéfice trop beau et payé trop d'impôt cette année.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Synthèse",
      texte: (c) => {
        const x = revisionDuChapitre(c);
        return [
          "La révision justifie chaque solde, cycle par cycle, avant que les comptes soient arrêtés. Sa feuille de travail dit ce qui a été contrôlé, avec quelle pièce, et quelle écriture en est sortie.",
          `Le compte d'attente se solde : l'acompte de ${eur(x.a.acompte.montant)} va au 4191, les frais de ${eur(x.a.frais.montant)} au 627. Les congés acquis et non pris sont une dette, avec leurs cotisations : ${eur(x.cp.total)}. La participation, au montant donné, se passe au 691.`,
          `Une amende probable se provisionne et se réintègre. Un stock qui ne sert plus se déprécie à sa valeur actuelle. La garantie se provisionne sur les retours à venir. Le résultat révisé, ${eur(x.d.resultatRevise)}, est celui que lit l'impôt.`,
          "Le chapitre de l'impôt sur les sociétés calcule ensuite l'impôt de N+1 sur ce résultat, ses acomptes et son solde.",
        ];
      },
      repere: () =>
        "Comptes du chapitre : 471 compte d'attente, 4191 acomptes reçus, 6412 et 4282 congés payés, 645 et 4382 cotisations, 691 et 4284 participation, 6875 et 1514 amendes, 6817 et 391 dépréciation des matières, 6815 et 1512 garanties.",
    },
  ],
};
