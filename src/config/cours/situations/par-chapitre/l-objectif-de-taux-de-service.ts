import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_TABLEAU_COMMERCIAL, tableauDuCabinet } from "../../chapitres/tableau-de-bord-commercial";
import type { Cas } from "../../cas";
import { coutVariableDUneJournee } from "../../monde/relation-client";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TABLEAU DE BORD COMMERCIAL » : L'OBJECTIF DE TAUX DE SERVICE
 * (BTS NDRC, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le cabinet ATLAS CONSEIL (monde/atlas-conseil.ts) et son modèle
 * (monde/relation-client.ts), lus par le chapitre (`tableauDuCabinet`). Il tient chez un cabinet : le
 * taux de service y est la part des journées demandées que les consultants ont pu faire.
 *
 * La direction veut fixer pour l'an prochain un objectif : servir au moins 90 % de la demande, à
 * chaque trimestre. Sur l'année, le cabinet en sert déjà 96 % ; mais au dernier trimestre, le carnet
 * est plein, et des clients ont été refusés. L'élève refait seul le chemin du chapitre : le taux de
 * service de l'année et du trimestre plein, les journées que l'objectif demande (à rebours, sur la
 * demande), ce qu'elles valent en marge sur coût variable, ce que coûterait le consultant qui
 * permettrait de les faire, combien de journées il lui faudrait servir pour payer son coût (un
 * curseur), et sa réponse : un jugement, pas une lecture.
 *
 * Ce qui a changé en passant sur le monde du cours : la demande adressée et les ventes de l'arène
 * deviennent les journées demandées et vendues du cabinet ; la marge moyenne d'une vente devient la
 * marge sur coût variable d'une journée refusée ; la question des moyens devient celle d'un consultant
 * de plus, que la capacité impose.
 *
 * HYPOTHÈSES DU CAS : une journée refusée est une demande de dernière minute, payée au prix catalogue
 * (la fiche, `prixDesJourneesDeplacees`) ; un consultant se recrute pour l'année, à son coût de la fiche,
 * et ne fait que ses jours facturables d'un trimestre dans chaque trimestre.
 */

/**
 * Le taux de service visé : 90 % de la demande, à chaque trimestre. C'est l'objectif courant d'un
 * prestataire d'entreprises, qui sait qu'il ne servira jamais toute la demande (pointes, délais
 * impossibles), mais qu'un client sur dix éconduit est déjà beaucoup.
 */
export const TAUX_DE_SERVICE_VISE = 0.9;

/** Les bornes du curseur des journées qu'un consultant de plus servirait dans l'année. */
export const JOURNEES_DU_CURSEUR = { min: 0, max: 120 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
/** Arrondi à l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);

/** L'année du cabinet, le trimestre plein, et ce que vaut l'objectif. */
export function objectifDeService(c: Pick<Cas, "code">) {
  const x = tableauDuCabinet(c);
  const f = x.f;
  const trimestres = x.journees;
  // Le trimestre le moins bien servi : celui où l'objectif mord.
  const plein = trimestres.reduce((a, b) => (b.tauxDeService < a.tauxDeService ? b : a));
  // Les journées à vendre pour servir 90 % de la demande : à l'unité supérieure, une de moins manquerait l'objectif.
  const journeesVisees = plafond(plein.demandees * TAUX_DE_SERVICE_VISE);
  const auDelaDeLaCapacite = Math.max(0, journeesVisees - plein.capacite);
  const margeDUneJournee = auCentime(f.prixDesJourneesDeplacees - coutVariableDUneJournee(f));
  const coutDUnConsultant = f.consultants.coutAnnuel;
  const joursDUnConsultant = f.consultants.joursFacturablesParTrimestre;
  // Un consultant de plus ne sert que les journées refusées : au trimestre plein, au plus ses jours du trimestre.
  const serviesParUnConsultant = Math.min(plein.refusees, joursDUnConsultant);
  const journeesPourPayerUnConsultant = plafond(coutDUnConsultant / margeDUneJournee);
  const margeDeLObjectif = auCentime(auDelaDeLaCapacite * margeDUneJournee);
  const margeDuConsultant = auCentime(serviesParUnConsultant * margeDUneJournee);
  return {
    x,
    f,
    trimestres,
    plein,
    vise: TAUX_DE_SERVICE_VISE * 100,
    demandees: x.demandees,
    vendues: x.vendues,
    serviceDeLAnnee: auDixieme(x.serviceDeLAnnee * 100),
    serviceDuPlein: auDixieme(plein.tauxDeService * 100),
    journeesVisees,
    auDelaDeLaCapacite,
    occupationVisee: auDixieme((journeesVisees / plein.capacite) * 100),
    margeDUneJournee,
    margeDeLObjectif,
    coutDUnConsultant,
    joursDUnConsultant,
    serviesParUnConsultant,
    margeDuConsultant,
    journeesPourPayerUnConsultant,
    ecartDuConsultant: auCentime(margeDuConsultant - coutDUnConsultant),
    recruter: margeDuConsultant >= coutDUnConsultant,
    // Les erreurs classiques : le chiffre d'affaires des journées refusées pris pour une marge ; la moyenne de l'année.
    chiffreDAffairesRefuse: auCentime(plein.refusees * f.prixDesJourneesDeplacees),
  };
}

export const L_OBJECTIF_DE_TAUX_DE_SERVICE: Situation = {
  code: "l-objectif-de-taux-de-service",
  parcours: "ndrc",
  palier: 4,
  blocs: [],
  reprend: ["tableau-de-bord-commercial"],
  commanditaire: "La direction",
  titre: "L'objectif de taux de service",
  accroche:
    "La direction veut servir l'an prochain au moins 90 % de la demande, à chaque trimestre. Avant de recruter, elle demande ce que cet objectif demande, et ce qu'il vaut.",
  objectifs: [
    "Calculer le taux de service d'une année et d'un trimestre",
    "Traduire à rebours un objectif de taux de service en journées à vendre, face à la capacité",
    "Chiffrer ce que valent ces journées en marge, face au coût d'un consultant de plus",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_COMMERCIAL,
    pourquoi:
      "ce cas suit le tableau de bord du cabinet ATLAS CONSEIL, dont les consultants ne peuvent faire qu'un nombre de journées fixé par trimestre : le taux de service y dit les clients refusés faute de consultant.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = objectifDeService(c);
        return [
          `« Pour l'an prochain, je veux un objectif clair : servir au moins ${pct(r.vise)} de la demande, à chaque trimestre. Cette année, nous avons refusé des clients. À demande égale, que demande cet objectif, et que vaut-il ? Faut-il recruter un consultant pour le tenir ? »`,
          `Une journée refusée est une demande de dernière minute, payée au prix catalogue (${eur(r.f.prixCatalogue)}) ; elle coûte ${eur(coutVariableDUneJournee(r.f))} de frais et de supports. Un consultant coûte ${eur(r.coutDUnConsultant)} par an et fait ${qte(r.joursDUnConsultant)} journées par trimestre ; il se recrute pour l'année.`,
          "Pas de cours cette fois : vous avez le tableau de bord de l'année, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = objectifDeService(c);
        return {
          titre: `Les journées de l'année · ${r.f.entreprise}`,
          colonnes: r.trimestres.map((q) => `T${q.trimestre}`),
          lignes: [
            { libelle: "Journées demandées", valeurs: r.trimestres.map((q) => qte(q.demandees)) },
            { libelle: "Journées vendues", valeurs: r.trimestres.map((q) => qte(q.vendues)) },
            { libelle: "Capacité des consultants, en journées", valeurs: r.trimestres.map((q) => qte(q.capacite)) },
            { libelle: "Jours libres", valeurs: r.trimestres.map((q) => qte(q.libres)) },
          ],
        };
      },
      repere: () =>
        "À rendre : le taux de service de l'année et du trimestre le moins servi, les journées que demande l'objectif face à la capacité, ce qu'elles valent face au coût d'un consultant, et votre réponse.",
    },
    {
      id: "le-service",
      type: "montants",
      titre: "Le taux de service",
      notions: ["dashboard", "capacity"],
      question: () =>
        "Calculez le taux de service de l'année, puis celui du trimestre le moins servi, en pourcentage au dixième, et les journées refusées ce trimestre-là.",
      champs: (c) => {
        const r = objectifDeService(c);
        const q = r.plein;
        return [
          {
            libelle: "Taux de service de l'année (%)",
            attendu: r.serviceDeLAnnee,
            tolerance: 0.1,
            calcul: `(${r.trimestres.map((t) => qte(t.vendues)).join(" + ")}) ÷ (${r.trimestres.map((t) => qte(t.demandees)).join(" + ")}) × 100 = ${qte(r.vendues)} ÷ ${qte(r.demandees)} × 100 = ${pct(r.serviceDeLAnnee)}`,
          },
          { libelle: `Taux de service du T${q.trimestre} (%)`, attendu: r.serviceDuPlein, tolerance: 0.1, calcul: `${qte(q.vendues)} ÷ ${qte(q.demandees)} × 100 = ${pct(r.serviceDuPlein)}` },
          { libelle: `Journées refusées au T${q.trimestre}`, attendu: q.refusees, calcul: `${qte(q.demandees)} − ${qte(q.vendues)} = ${qte(q.refusees)}` },
        ];
      },
      explication: (c) => {
        const r = objectifDeService(c);
        return [
          `Sur l'année, le cabinet sert ${pct(r.serviceDeLAnnee)} de la demande : l'objectif paraît tenu. Mais il porte sur chaque trimestre, et au T${r.plein.trimestre} le carnet est plein : ${pct(r.serviceDuPlein)} seulement. La moyenne de l'année cache le trimestre où l'objectif mord.`,
        ];
      },
    },
    {
      id: "l-objectif",
      type: "montants",
      titre: "Ce que demande l'objectif",
      notions: ["dashboard", "capacity"],
      question: (c) => {
        const r = objectifDeService(c);
        return `À demande égale, combien de journées faut-il vendre au T${r.plein.trimestre} pour servir ${pct(r.vise)} de la demande (à l'unité supérieure) ? Combien dépassent la capacité des consultants, et quel taux d'occupation cela demanderait-il, au dixième ?`;
      },
      champs: (c) => {
        const r = objectifDeService(c);
        const q = r.plein;
        return [
          { libelle: "Journées à vendre", attendu: r.journeesVisees, calcul: `${qte(q.demandees)} × ${pct(r.vise)} = ${qte(auCentime(q.demandees * TAUX_DE_SERVICE_VISE))}${auCentime(q.demandees * TAUX_DE_SERVICE_VISE) === r.journeesVisees ? "" : `, soit ${qte(r.journeesVisees)} à l'unité supérieure`}` },
          { libelle: "Journées au-delà de la capacité", attendu: r.auDelaDeLaCapacite, calcul: `${qte(r.journeesVisees)} − ${qte(q.capacite)} = ${qte(r.auDelaDeLaCapacite)}` },
          { libelle: "Taux d'occupation demandé (%)", attendu: r.occupationVisee, tolerance: 0.1, calcul: `${qte(r.journeesVisees)} ÷ ${qte(q.capacite)} × 100 = ${pct(r.occupationVisee)}` },
        ];
      },
      explication: (c) => {
        const r = objectifDeService(c);
        return [
          `L'objectif se calcule sur la demande : ${pct(r.vise)} des ${qte(r.plein.demandees)} journées demandées, ${qte(r.journeesVisees)}. Les consultants n'en font que ${qte(r.plein.capacite)} : il en manque ${qte(r.auDelaDeLaCapacite)}, un taux d'occupation de ${pct(r.occupationVisee)}. Aucun effort commercial ne tient cet objectif : c'est la capacité qui le borne.`,
        ];
      },
    },
    {
      id: "la-valeur",
      type: "montants",
      titre: "Ce que vaut l'objectif",
      notions: ["contribution_margin", "capacity"],
      question: () =>
        "Calculez la marge sur coût variable d'une journée refusée, la marge des journées qui manquent pour tenir l'objectif, puis la marge que ferait un consultant de plus en servant les journées refusées qu'il pourrait faire, et ce qu'il rapporterait, son coût de l'année payé. Une perte se donne en négatif.",
      champs: (c) => {
        const r = objectifDeService(c);
        return [
          { libelle: "Marge sur coût variable d'une journée refusée", attendu: r.margeDUneJournee, calcul: `${eur(r.f.prixDesJourneesDeplacees)} − ${eur(coutVariableDUneJournee(r.f))} = ${eur(r.margeDUneJournee)}` },
          { libelle: "Marge des journées qui manquent pour l'objectif", attendu: r.margeDeLObjectif, calcul: `${qte(r.auDelaDeLaCapacite)} × ${eur(r.margeDUneJournee)} = ${eur(r.margeDeLObjectif)}` },
          {
            libelle: "Marge des journées refusées qu'un consultant de plus servirait",
            attendu: r.margeDuConsultant,
            calcul: `le plus petit de ${qte(r.plein.refusees)} journées refusées et ${qte(r.joursDUnConsultant)} jours du trimestre, ${qte(r.serviesParUnConsultant)} × ${eur(r.margeDUneJournee)} = ${eur(r.margeDuConsultant)}`,
          },
          {
            libelle: "Ce que rapporterait un consultant de plus, son coût payé",
            attendu: r.ecartDuConsultant,
            calcul: `${eur(r.margeDuConsultant)} − ${eur(r.coutDUnConsultant)} de salaire et de cotisations sur l'année = ${eur(r.ecartDuConsultant)}`,
          },
        ];
      },
      explication: (c) => {
        const r = objectifDeService(c);
        const libres = r.trimestres.filter((q) => q.libres > 0).map((q) => `${qte(q.libres)} au T${q.trimestre}`);
        return [
          `L'objectif vaut ${eur(r.margeDeLObjectif)} de marge. Même en servant ${qte(r.serviesParUnConsultant)} journées refusées, un consultant de plus ne ferait que ${eur(r.margeDuConsultant)}, pour ${eur(r.coutDUnConsultant)} de coût. Aux autres trimestres, le cabinet a déjà des jours libres (${libres.join(", ")}) : ses journées n'y serviraient à personne.`,
        ];
      },
    },
    {
      id: "le-consultant-au-curseur",
      type: "curseur",
      titre: "Ce qu'un consultant devrait servir",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const r = objectifDeService(c);
        return `Faites varier les journées refusées qu'un consultant de plus servirait dans l'année, de ${qte(JOURNEES_DU_CURSEUR.min)} à ${qte(JOURNEES_DU_CURSEUR.max)}, à ${eur(r.margeDUneJournee)} de marge chacune. Placez le curseur sur le plus petit nombre de journées qui paie son coût (${eur(r.coutDUnConsultant)}), puis validez.`;
      },
      grandeur: () => ({ libelle: "Journées refusées servies dans l'année", unite: "journées" }),
      cible: (c) => ({ attendu: objectifDeService(c).journeesPourPayerUnConsultant, min: JOURNEES_DU_CURSEUR.min, max: JOURNEES_DU_CURSEUR.max }),
      zones: ["Le consultant paie son coût", "Le consultant coûte plus qu'il ne rapporte"],
      rates: () => ({
        dessous: "À ce nombre de journées, la marge ne paie pas encore le consultant.",
        dessus: "Moins de journées paieraient encore le consultant : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les journées nécessaires",
      lecture: (c, j) => {
        const r = objectifDeService(c);
        const marge = auCentime(j * r.margeDUneJournee);
        return [
          { libelle: "Marge des journées servies", montant: marge },
          { libelle: "Coût du consultant", montant: r.coutDUnConsultant },
          { libelle: "Ce que le consultant rapporte", montant: auCentime(marge - r.coutDUnConsultant), fort: true },
        ];
      },
      droites: (c) => {
        const r = objectifDeService(c);
        return { produit: (j) => j * r.margeDUneJournee, cout: () => r.coutDUnConsultant, libelles: ["Marge des journées servies", "Coût du consultant"] };
      },
      explication: (c) => {
        const r = objectifDeService(c);
        return [
          `Il faudrait que le consultant serve ${qte(r.journeesPourPayerUnConsultant)} journées refusées dans l'année. Au T${r.plein.trimestre}, ${qte(r.plein.refusees)} seulement ont été refusées, et il n'en ferait que ${qte(r.joursDUnConsultant)} ; aux autres trimestres, aucune. À demande égale, il ne se paie pas : il lui manque ${eur(-r.ecartDuConsultant)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["dashboard", "capacity"],
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = objectifDeService(c);
        return [
          {
            texte: r.recruter
              ? `Recruter : un consultant rapporte ${eur(r.margeDuConsultant)} pour ${eur(r.coutDUnConsultant)}`
              : `Ne pas recruter : ${eur(r.coutDUnConsultant)} pour ${eur(r.margeDeLObjectif)} de marge`,
            juste: true,
            retour: r.recruter
              ? `Oui : il rapporte ${eur(r.ecartDuConsultant)} de plus qu'il ne coûte.`
              : `Oui : l'objectif demande ${qte(r.journeesVisees)} journées au T${r.plein.trimestre}, ${qte(r.auDelaDeLaCapacite)} de plus que la capacité ; elles valent ${eur(r.margeDeLObjectif)} de marge, et le consultant qui les ferait coûte ${eur(r.coutDUnConsultant)}. Même en servant ${qte(r.serviesParUnConsultant)} journées refusées, il ne ferait que ${eur(r.margeDuConsultant)}. À demande égale, ${pct(r.vise)} à chaque trimestre n'est pas un bon objectif : mieux vaut suivre le taux de service de l'année (${pct(r.serviceDeLAnnee)}) et proposer aux clients du trimestre plein des dates aux trimestres creux.`,
          },
          {
            texte: `Recruter : ${qte(r.plein.refusees)} journées refusées, c'est ${eur(r.chiffreDAffairesRefuse)} de chiffre d'affaires perdu`,
            juste: false,
            retour: `Non : ${eur(r.chiffreDAffairesRefuse)}, c'est du chiffre d'affaires, pas de la marge, et un consultant n'en ferait que ${qte(r.joursDUnConsultant)}. Sa marge, ${eur(r.margeDuConsultant)}, ne paie pas ses ${eur(r.coutDUnConsultant)}.`,
          },
          {
            texte: `Recruter : il servirait ${qte(r.serviesParUnConsultant)} journées refusées, ${eur(r.margeDuConsultant)} de marge`,
            juste: false,
            retour: `Non : c'est oublier son coût. ${eur(r.margeDuConsultant)} de marge pour ${eur(r.coutDUnConsultant)} de salaire : il coûterait ${eur(-r.ecartDuConsultant)} de plus qu'il ne rapporte.`,
          },
          {
            texte: `Rien à faire : sur l'année, le cabinet sert déjà ${pct(r.serviceDeLAnnee)} de la demande`,
            juste: false,
            retour: `Non : l'objectif porte sur chaque trimestre. Au T${r.plein.trimestre}, le cabinet n'en sert que ${pct(r.serviceDuPlein)} ; la moyenne de l'année cache le trimestre plein. La direction doit savoir que l'objectif ne se tient pas sans un consultant, et qu'un consultant ne se paie pas.`,
          },
        ];
      },
    },
  ],
};
