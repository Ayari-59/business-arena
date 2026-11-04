import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_DEMARCHE, ficheDe, navetteDe } from "../../chapitres/la-demarche-budgetaire";
import { ACTIONS_DE_PUBLICITE, DEMANDES_DES_CENTRES, MOIS_DU_BANC_DU_CAS, budgetBaseZero, publiciteMaximale } from "../../monde/demarche-budgetaire";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA DÉMARCHE BUDGÉTAIRE » : LA PUBLICITÉ, LIGNE PAR LIGNE (contrôle de
 * gestion, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le semestre de NOVA, le budget de trésorerie
 * du modèle et ses leviers (le banc, la publicité), lus par monde/demarche-budgetaire.ts.
 *
 * HYPOTHÈSE DU CAS (une étape de la navette, pas un fait de l'exercice : dans la fiche, NOVA n'a fait
 * ni publicité ni achat de banc au semestre) : le chef d'atelier tient à recevoir le banc en mai. La
 * direction refuse d'abattre les demandes au hasard ; elle applique le budget base zéro à la publicité :
 * la responsable commerciale justifie chaque action (ACTIONS_DE_PUBLICITE), essentielle ou
 * complémentaire, avec le score du comité. L'élève chiffre le slack de la demande, la limite que la
 * trésorerie permet avec le banc en mai, les actions qui passent, et rend une réponse.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Les chiffres du cas, calculés une fois de la fiche. */
export function publiciteLigneParLigne(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const mois = MOIS_DU_BANC_DU_CAS;
  const limite = publiciteMaximale(f, mois)!;
  const bbz = budgetBaseZero(limite);
  const sansPub = navetteDe(f, mois, 0);
  const auJustifie = navetteDe(f, mois, bbz.justifie);
  const auRetenu = navetteDe(f, mois, bbz.total);
  const auMax = navetteDe(f, mois, limite);
  return {
    f,
    mois,
    nom: f.semestre.mois[mois]!.nom,
    matelas: f.seuilsDAlerte.tresorerie,
    demande: DEMANDES_DES_CENTRES.publicite,
    limite,
    bbz,
    slack: auCentime(DEMANDES_DES_CENTRES.publicite - bbz.justifie),
    sansPub,
    parEuro: auCentime(sansPub.plusBas.tresorerie - navetteDe(f, mois, 1).plusBas.tresorerie),
    auJustifie,
    auRetenu,
    auMax,
  };
}

export const LA_PUBLICITE_LIGNE_PAR_LIGNE: Situation = {
  code: "la-publicite-ligne-par-ligne",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["la-demarche-budgetaire"],
  commanditaire: "Le dirigeant",
  titre: "La publicité, ligne par ligne",
  accroche: "Le banc arrivera en mai, et la responsable commerciale demande sa publicité. Le dirigeant lui fait justifier chaque action : à vous de dire ce qui passe dans la trésorerie.",
  objectifs: [
    "Mesurer le slack d'une demande en la confrontant aux actions justifiées une à une",
    "Trouver la limite que la trésorerie impose à un budget de dépenses",
    "Retenir les actions par priorité, et rendre au dirigeant un arbitrage chiffré",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_DEMARCHE,
    pourquoi: "ce cas reprend le chapitre « La démarche budgétaire », qui se suit sur le semestre de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => {
        const n = publiciteLigneParLigne(c);
        return [
          `« Le banc arrivera en ${n.nom}, le chef d'atelier y tient. La publicité, je ne veux pas l'abattre au hasard : j'ai demandé à la responsable commerciale de justifier chaque action. Dites-moi ce qui passe sans descendre sous les ${eur(n.matelas)} en banque. »`,
          `Pas de cours cette fois. Le comité a noté chaque action complémentaire de 1 à 6 ; une action essentielle passe toujours en premier. Sans publicité, avec le banc en ${n.nom}, la trésorerie la plus basse est celle de fin ${n.nom}, ${eur(n.sansPub.plusBas.tresorerie)}. Chaque euro de publicité mensuelle lui retire ${eur(n.parEuro)}.`,
        ];
      },
      tableau: () => {
        return {
          titre: "Les actions de publicité, justifiées une à une",
          colonnes: ["Par mois, hors taxes", "Nature", "Score du comité"],
          lignes: ACTIONS_DE_PUBLICITE.map((a) => ({ libelle: a.libelle, valeurs: [eur(a.parMois), a.nature === "essentielle" ? "essentielle" : "complémentaire", a.nature === "essentielle" ? "passe d'abord" : `${a.score} sur 6`] })),
        };
      },
      repere: (c) => {
        const n = publiciteLigneParLigne(c);
        return `À rendre : le besoin justifié et le slack de la demande de ${eur(n.demande)}, la plus forte publicité que permet la trésorerie, les actions qui passent, et votre réponse.`;
      },
    },
    {
      id: "le-slack",
      type: "montants",
      titre: "Ce que la demande contenait",
      notions: ["cost_variance"],
      question: (c) => `Calculez le besoin justifié par mois, la somme des actions, puis le slack de la demande de ${eur(publiciteLigneParLigne(c).demande)}, par mois et sur le semestre.`,
      champs: (c) => {
        const n = publiciteLigneParLigne(c);
        const mois = n.f.semestre.mois.length;
        return [
          { libelle: "Besoin justifié, par mois", attendu: n.bbz.justifie, calcul: `${ACTIONS_DE_PUBLICITE.map((a) => eur(a.parMois)).join(" + ")} = ${eur(n.bbz.justifie)}` },
          { libelle: "Slack de la demande, par mois", attendu: n.slack, calcul: `${eur(n.demande)} − ${eur(n.bbz.justifie)} = ${eur(n.slack)}` },
          { libelle: "Slack de la demande, sur le semestre", attendu: auCentime(n.slack * mois), calcul: `${eur(n.slack)} × ${mois} = ${eur(auCentime(n.slack * mois))}` },
        ];
      },
      explication: (c) => {
        const n = publiciteLigneParLigne(c);
        return [`Justifiée ligne par ligne, la demande perd ${eur(n.slack)} par mois : le matelas que la responsable s'était ménagé. Le budget base zéro ne reconduit rien ; chaque euro doit dire à quoi il sert.`];
      },
    },
    {
      id: "la-limite",
      type: "montants",
      titre: "La limite de la trésorerie",
      notions: ["cash_budget"],
      question: (c) => {
        const n = publiciteLigneParLigne(c);
        return `Calculez la plus forte publicité mensuelle, à l'euro inférieur, qui garde la fin de ${n.nom} au-dessus de ${eur(n.matelas)}, puis la trésorerie de fin de ${n.nom} à cette publicité. Le besoin justifié passe-t-il ? Calculez enfin la trésorerie de fin de ${n.nom} avec le besoin justifié.`;
      },
      champs: (c) => {
        const n = publiciteLigneParLigne(c);
        const s = n.sansPub.plusBas.tresorerie;
        return [
          { libelle: "Publicité mensuelle la plus forte", attendu: n.limite, calcul: `(${eur(s)} − ${eur(n.matelas)}) ÷ ${qte(n.parEuro)} = ${qte((s - n.matelas) / n.parEuro)}, soit ${eur(n.limite)} à l'euro inférieur` },
          { libelle: `Trésorerie de fin de ${n.nom} à cette publicité`, attendu: n.auMax.plusBas.tresorerie, calcul: `${eur(s)} − ${qte(n.limite)} × ${eur(n.parEuro)} = ${eur(n.auMax.plusBas.tresorerie)}` },
          {
            libelle: `Trésorerie de fin de ${n.nom} avec le besoin justifié`,
            attendu: n.auJustifie.plusBas.tresorerie,
            calcul: `${eur(s)} − ${eur(n.bbz.justifie)} × ${qte(n.parEuro)} = ${eur(n.auJustifie.plusBas.tresorerie)}, sous le matelas`,
          },
        ];
      },
      explication: (c) => {
        const n = publiciteLigneParLigne(c);
        return [`Même justifiée, la demande ne passe pas avec le banc en ${n.nom} : il manque ${eur(auCentime(n.matelas - n.auJustifie.plusBas.tresorerie))} au matelas. Il faut choisir parmi les actions.`];
      },
    },
    {
      id: "les-actions-retenues",
      type: "montants",
      titre: "Les actions qui passent",
      notions: ["cash_budget"],
      question: (c) => {
        const n = publiciteLigneParLigne(c);
        return `Retenez l'action essentielle, puis les actions complémentaires par score décroissant, tant que le total reste sous ${eur(n.limite)}. Calculez le budget de publicité accordé par mois, ce qui est différé, puis la trésorerie de fin de ${n.nom}.`;
      },
      champs: (c) => {
        const n = publiciteLigneParLigne(c);
        const differe = auCentime(n.bbz.differees.reduce((t, a) => t + a.parMois, 0));
        return [
          { libelle: "Publicité accordée, par mois", attendu: n.bbz.total, calcul: `${n.bbz.retenues.map((a) => eur(a.parMois)).join(" + ")} = ${eur(n.bbz.total)}, sous ${eur(n.limite)}` },
          { libelle: "Publicité différée, par mois", attendu: differe, calcul: `${n.bbz.differees.map((a) => `${a.libelle.toLowerCase()}, ${eur(a.parMois)}`).join(" ; ")}` },
          { libelle: `Trésorerie de fin de ${n.nom}`, attendu: n.auRetenu.plusBas.tresorerie, calcul: `${eur(n.sansPub.plusBas.tresorerie)} − ${eur(n.bbz.total)} × ${qte(n.parEuro)} = ${eur(n.auRetenu.plusBas.tresorerie)}` },
        ];
      },
      explication: (c) => {
        const n = publiciteLigneParLigne(c);
        return [`${majuscule(n.bbz.differees.map((a) => a.libelle.toLowerCase()).join(", "))} attendront le semestre suivant : c'est l'intérêt de distinguer les actions complémentaires, qu'on peut différer sans manquer la mission.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["cash_budget"],
      question: () => "Que proposez-vous au dirigeant pour la publicité du semestre ?",
      options: (c) => {
        const n = publiciteLigneParLigne(c);
        const abattue = auCentime(n.demande * 0.9);
        return [
          {
            texte: `${eur(n.bbz.total)} par mois, le reste différé`,
            juste: true,
            retour: `Oui. ${majuscule(n.bbz.retenues.map((a) => a.libelle.toLowerCase()).join(" et "))} passent, ${n.nom} finit à ${eur(n.auRetenu.plusBas.tresorerie)}, au-dessus du matelas, et le slack de ${eur(n.slack)} a disparu. Ce que vous proposez se justifie ligne par ligne : c'est un arbitrage que la responsable peut accepter.`,
          },
          {
            texte: `${eur(n.bbz.justifie)} par mois : tout ce qui est justifié doit passer`,
            juste: false,
            retour: `Non : justifié ne veut pas dire finançable. À ${eur(n.bbz.justifie)}, ${n.nom} finit à ${eur(n.auJustifie.plusBas.tresorerie)}, sous le matelas.`,
          },
          {
            texte: `${eur(abattue)} par mois : la demande abattue de 10 %, comme les autres`,
            juste: false,
            retour: `Non : l'abattement uniforme garde une part du slack et passe sous le matelas, à ${eur(navetteDe(n.f, n.mois, abattue).plusBas.tresorerie)}. Il récompense ceux qui ont le plus majoré.`,
          },
          {
            texte: "Aucune publicité : le banc passe avant tout",
            juste: false,
            retour: "Non : la trésorerie permet les actions les plus utiles. Tout refuser priverait la gamme de ses annonces sans nécessité.",
          },
        ];
      },
    },
  ],
};
