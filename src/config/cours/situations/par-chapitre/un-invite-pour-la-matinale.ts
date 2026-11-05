import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_EVENEMENT, evenementDuCabinet } from "../../chapitres/l-evenement-commercial";
import { MATINALES, matinales } from "../../monde/terrain-d-atlas";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'ÉVÉNEMENT COMMERCIAL : BUDGET, BILAN ET SUIVI DES CONTACTS » : UN INVITÉ
 * POUR LA MATINALE ? (BTS NDRC, palier 3).
 *
 * Le cabinet a choisi les matinales. Pour la première, le directeur voudrait faire venir un intervenant
 * connu, une dirigeante qui a écrit sur le management à distance : 2 500 € de cachet et de déplacement.
 * L'organisateur pense qu'il ferait venir 45 prospects au lieu de 30. L'élève refait seul le chemin du
 * chapitre : le budget de la matinale et son coût par prospect, les prospects en plus qui paient
 * l'intervenant (au curseur), le bilan attendu, puis la réponse.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : ses taux et la valeur d'un compte sont
 * ceux de `evenementDuCabinet` et de `matinales`, sur la fiche du cabinet. Il ne lit du cas que son code.
 */

/** L'INTERVENANT, hypothèse du cas : 2 500 € de cachet et de déplacement, et 45 prospects présents attendus au lieu de 30. */
export const INTERVENANT = { cout: 2_500, prospectsPresents: 45 } as const;

/** Les bornes du curseur des prospects présents. */
export const PROSPECTS_DU_CURSEUR = { min: 30, max: 60 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number, d = 1) => `${(Math.round(x * 100 * 10 ** d) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Une matinale, sans et avec l'intervenant. */
export function matinaleAvecUnInvite(c: Pick<Cas, "code">) {
  const x = evenementDuCabinet(c);
  const sans = matinales(x.f, { nombre: 1 });
  const avec = matinales(x.f, { nombre: 1, prospectsPresents: INTERVENANT.prospectsPresents, coutEnPlus: INTERVENANT.cout });
  const valeurParProspect = auCentime(sans.comptesParProspect * x.s.valeurDUnCompte);
  const prospectsQuiPaient = Math.ceil(INTERVENANT.cout / valeurParProspect - 1e-9);
  return { x, sans, avec, valeurParProspect, prospectsQuiPaient, gainEnPlus: auCentime(avec.gain - sans.gain) };
}

/** Le budget d'une matinale, avec l'intervenant : le document du cas. */
function tableauDuBudget(): TableauDeDonnees {
  const k = MATINALES.coutDUneMatinale;
  return {
    titre: "Le budget d'une matinale, avec l'intervenant",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Traiteur", montant: k.traiteur },
      { libelle: "Supports et cadeaux", montant: k.supports },
      { libelle: "Invitations et relances", montant: k.invitations },
      { libelle: "Temps des consultants et des commerciaux", montant: k.temps },
      { libelle: "Intervenant : cachet et déplacement", montant: INTERVENANT.cout },
    ].map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] })),
  };
}

export const UN_INVITE_POUR_LA_MATINALE: Situation = {
  code: "un-invite-pour-la-matinale",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["l-evenement-commercial"],
  commanditaire: "Le directeur",
  titre: "Un invité pour la matinale ?",
  accroche:
    "Un intervenant connu ferait venir plus de prospects à la première matinale, pour 2 500 € de plus. Chiffrer le budget, les prospects qui le paient, le bilan attendu, puis répondre.",
  objectifs: [
    "Établir le budget d'un événement et son coût par contact",
    "Calculer les contacts en plus qui paient une dépense en plus",
    "Dresser le bilan attendu d'un événement en comptes et en gain",
    "Rédiger une réponse chiffrée au directeur",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_EVENEMENT,
    pourquoi: "ce cas reprend le chapitre « L'événement commercial : budget, bilan et suivi des contacts », qui juge les événements d'ATLAS CONSEIL, le cabinet de la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur",
      tableau: tableauDuBudget,
      texte: (c) => {
        const r = matinaleAvecUnInvite(c);
        return [
          `« Pour la première matinale, je voudrais un intervenant connu : ${eur(INTERVENANT.cout)} de cachet et de déplacement. L'organisateur pense qu'il ferait venir ${qte(INTERVENANT.prospectsPresents)} prospects au lieu de ${qte(r.sans.presents)}. Est-ce que ça vaut le coup ? »`,
          `Pas de cours cette fois : la méthode est celle du chapitre. Vous avez le budget, les taux des matinales (un prospect sur ${qte(1 / MATINALES.tauxDeRendezVous)} accepte un rendez-vous, un rendez-vous sur ${qte(1 / MATINALES.devisParRendezVous)} mène à un devis, ${pct(MATINALES.tauxDeSignature, 0)} des devis sont signés).`,
          `La valeur vie d'un compte est de ${eur(r.x.s.valeurDUnCompte)}.`,
        ];
      },
      repere: () => "À rendre : le budget et le coût par prospect, les prospects en plus qui paient l'intervenant, le bilan attendu, et votre réponse.",
    },
    {
      id: "le-budget",
      type: "montants",
      titre: "Le budget de la matinale",
      notions: ["fixed_costs", "customer_acquisition_cost"],
      question: () => "Calculez le coût de la matinale avec l'intervenant, son coût par prospect présent, puis le coût par prospect présent sans l'intervenant.",
      champs: (c) => {
        const r = matinaleAvecUnInvite(c);
        return [
          { libelle: "Coût de la matinale avec l'intervenant", attendu: r.avec.cout, calcul: `${eur(r.sans.cout)} + ${eur(INTERVENANT.cout)} = ${eur(r.avec.cout)}` },
          { libelle: "Coût par prospect, avec l'intervenant", attendu: r.avec.coutParContact, calcul: `${eur(r.avec.cout)} ÷ ${qte(r.avec.contacts)} = ${eur(r.avec.coutParContact)}` },
          { libelle: "Coût par prospect, sans l'intervenant", attendu: r.sans.coutParContact, calcul: `${eur(r.sans.cout)} ÷ ${qte(r.sans.contacts)} = ${eur(r.sans.coutParContact)}` },
        ];
      },
      explication: (c) => {
        const r = matinaleAvecUnInvite(c);
        return [`L'intervenant fait monter le budget de ${pct(INTERVENANT.cout / r.sans.cout, 0)}, mais le coût par prospect baisse, de ${eur(r.sans.coutParContact)} à ${eur(r.avec.coutParContact)} : si l'organisateur a raison, il amène plus qu'il ne coûte.`];
      },
    },
    {
      id: "les-prospects-qui-paient",
      type: "curseur",
      titre: "Les prospects qui paient l'intervenant",
      notions: ["breakeven", "customer_lifetime_value"],
      question: (c) => {
        const r = matinaleAvecUnInvite(c);
        return `Faites varier les prospects présents, de ${qte(PROSPECTS_DU_CURSEUR.min)} à ${qte(PROSPECTS_DU_CURSEUR.max)}. Une droite donne la valeur vie des comptes qu'amènent les prospects en plus des ${qte(r.sans.presents)} attendus sans l'intervenant ; l'autre, son coût. Placez le curseur sur le plus petit nombre de prospects présents qui paie l'intervenant, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prospects présents", unite: "prospects" }),
      cible: (c) => ({ attendu: matinaleAvecUnInvite(c).sans.presents + matinaleAvecUnInvite(c).prospectsQuiPaient, min: PROSPECTS_DU_CURSEUR.min, max: PROSPECTS_DU_CURSEUR.max }),
      zones: ["L'intervenant est payé", "L'intervenant n'est pas payé"],
      rates: () => ({
        dessous: "À cette position, les prospects en plus n'amènent pas encore la valeur de son cachet.",
        dessus: "Moins de prospects suffiraient : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les prospects",
      lecture: (c, n) => {
        const r = matinaleAvecUnInvite(c);
        const valeur = auCentime((n - r.sans.presents) * r.valeurParProspect);
        return [
          { libelle: "Valeur vie des comptes des prospects en plus", montant: valeur },
          { libelle: "Coût de l'intervenant", montant: INTERVENANT.cout },
          { libelle: "Valeur moins coût de l'intervenant", montant: auCentime(valeur - INTERVENANT.cout), fort: true },
        ];
      },
      droites: (c) => {
        const r = matinaleAvecUnInvite(c);
        return { produit: (n) => (n - r.sans.presents) * r.valeurParProspect, cout: () => INTERVENANT.cout, libelles: ["Valeur vie des comptes des prospects en plus", "Coût de l'intervenant"] };
      },
      explication: (c) => {
        const r = matinaleAvecUnInvite(c);
        return [
          `Un prospect présent vaut ${eur(r.valeurParProspect)} : ${pct(r.sans.comptesParProspect, 2)} de chance de devenir un compte, à ${eur(r.x.s.valeurDUnCompte)} l'un. Il suffit de ${qte(r.prospectsQuiPaient)} prospects en plus pour payer l'intervenant ; l'organisateur en promet ${qte(INTERVENANT.prospectsPresents - r.sans.presents)}.`,
        ];
      },
    },
    {
      id: "le-bilan-attendu",
      type: "montants",
      titre: "Le bilan attendu",
      notions: ["customer_acquisition_cost", "customer_lifetime_value", "conversion_rate"],
      question: (c) => {
        const r = matinaleAvecUnInvite(c);
        return `Avec ${qte(INTERVENANT.prospectsPresents)} prospects présents, calculez les comptes attendus (au centième), le coût par compte, le gain à la valeur vie d'un compte, puis ce qu'elle gagne de plus que sans l'intervenant, avec ${qte(r.sans.presents)} prospects (négatif pour une perte).`;
      },
      champs: (c) => {
        const r = matinaleAvecUnInvite(c);
        const a = r.avec;
        return [
          {
            libelle: "Comptes attendus avec l'intervenant",
            attendu: auCentime(a.comptes),
            tolerance: 0.05,
            calcul: `${qte(a.contacts)} × ${pct(MATINALES.tauxDeRendezVous, 0)} ÷ ${qte(1 / MATINALES.devisParRendezVous)} × ${pct(MATINALES.tauxDeSignature, 0)} = ${qte(auCentime(a.comptes))} comptes`,
          },
          { libelle: "Coût par compte avec l'intervenant", attendu: a.coutParCompte, tolerance: 1, calcul: `${eur(a.cout)} ÷ ${qte(a.comptes)} = ${eur(a.coutParCompte)}` },
          { libelle: "Gain de la matinale avec l'intervenant", attendu: a.gain, tolerance: 1, calcul: `${qte(a.comptes)} × ${eur(r.x.s.valeurDUnCompte)} − ${eur(a.cout)} = ${eur(a.gain)}` },
          { libelle: "Gain en plus grâce à l'intervenant", attendu: r.gainEnPlus, tolerance: 1, calcul: `${eur(a.gain)} − ${eur(r.sans.gain)} = ${eur(r.gainEnPlus)}` },
        ];
      },
      explication: (c) => {
        const r = matinaleAvecUnInvite(c);
        return [`Avec l'intervenant, la matinale gagnerait ${eur(r.avec.gain)}, ${eur(r.gainEnPlus)} de plus que sans lui. Le compte y coûte ${eur(r.avec.coutParCompte)}, contre ${eur(r.sans.coutParCompte)} sans lui.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur",
      question: () => "Quelle phrase envoyez-vous au directeur ?",
      options: (c) => {
        const r = matinaleAvecUnInvite(c);
        return [
          {
            texte: `L'inviter : ${qte(r.prospectsQuiPaient)} prospects de plus suffisent à le payer`,
            juste: true,
            retour: `Oui : chaque prospect présent vaut ${eur(r.valeurParProspect)}, et l'organisateur en promet ${qte(INTERVENANT.prospectsPresents - r.sans.presents)} de plus. Le gain attendu monte de ${eur(r.gainEnPlus)}. Comptez les présents le jour même : le bilan dira si la promesse a tenu.`,
          },
          {
            texte: `Ne pas l'inviter : le budget de la matinale monte de ${pct(INTERVENANT.cout / r.sans.cout, 0)}`,
            juste: false,
            retour: `Non : un budget se juge sur ce qu'il amène. Par prospect présent, la matinale coûte moins avec lui (${eur(r.avec.coutParContact)}) que sans lui (${eur(r.sans.coutParContact)}).`,
          },
          {
            texte: `Ne pas l'inviter : sur la marge d'une année, ses ${qte(r.prospectsQuiPaient)} prospects ne le paient pas`,
            juste: false,
            retour: `Non : un compte gagné reste client plusieurs années ; c'est sa valeur vie, ${eur(r.x.s.valeurDUnCompte)}, qui se compare au cachet.`,
          },
        ];
      },
    },
  ],
};
