import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { LE_DEPART_D_UN_SALARIE, departDUnOperateur } from "../../chapitres/le-depart-d-un-salarie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE DÉPART D'UN SALARIÉ ET SON REMPLACEMENT » : RECRUTER DÈS
 * L'ANNONCE DU DÉPART (BTS GPME, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : l'atelier de NOVA en N + 1, mois par mois
 * (monde/nova-capacite.ts, monde/capacite.ts). Le 1er mars, un opérateur annonce qu'il part le 31.
 * La gérante pensait lancer le recrutement à son départ, le 1er avril ; son adjoint veut le lancer
 * le jour même. L'élève compare les deux dates (l'équipe du trimestre 2, les ventes perdues, le coût
 * du départ), puis cherche à rebours la demande du trimestre 2 à partir de laquelle recruter dès
 * l'annonce rapporte : un remplaçant plus tôt coûte un mois de salaire de plus, et ne le rend que
 * si l'équipe devient le goulot. Le croisement : sur la demande de N, plus faible, la règle tient
 * encore.
 *
 * Ce qui a changé depuis l'arène : le cas comparait deux trimestres de recrutement dans l'année
 * rejouée par le moteur (le remplaçant arrivait au trimestre suivant) ; il compare deux mois sur la
 * simulation du cours, et chez NOVA seule.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;
const nomDuMois = (m: number) => MOIS[m - 1]!;

export type Verdict = "recruter-des-l-annonce" | "attendre-le-depart";

/** Les deux dates de recrutement, et la demande du trimestre 2 à partir de laquelle recruter dès l'annonce rapporte. */
export function recruterDesLAnnonce(c: Pick<Cas, "code">) {
  const x = departDUnOperateur(c);
  const k = x.trimestre - 1;
  const tard = x.auDepart;
  const tot = x.desLAnnonce;
  const equipeTard = tard.equipe.trimestres[k]!;
  const equipeTot = tot.equipe.trimestres[k]!;
  const gain = auCentime(tard.coutDuDepart - tot.coutDuDepart);
  // Recruter dès l'annonce fait payer les mois de salaire que le poste vide aurait économisés.
  const salaireEnPlus = auCentime(tard.salairesNonVerses - tot.salairesNonVerses);
  // Tant que la demande du trimestre reste sous l'équipe d'un recrutement tardif, rien ne se perd ;
  // au-delà, chaque enceinte demandée de plus est une vente que seul le recrutement dès l'annonce sauve.
  const ventesASauver = Math.ceil(salaireEnPlus / x.marge - 1e-9);
  const demandeQuiFaitPencher = equipeTard + ventesASauver;
  const surN = { tard: x.surN, tot: x.surNDesLAnnonce, gain: auCentime(x.surN.coutDuDepart - x.surNDesLAnnonce.coutDuDepart) };
  const verdict: Verdict = gain > 0 ? "recruter-des-l-annonce" : "attendre-le-depart";
  return { x, k, tard, tot, equipeTard, equipeTot, gain, salaireEnPlus, ventesASauver, demandeQuiFaitPencher, surN, verdict };
}

export const RECRUTER_DES_L_ANNONCE_DU_DEPART: Situation = {
  code: "recruter-des-l-annonce-du-depart",
  parcours: "gpme",
  palier: 3,
  blocs: [],
  reprend: [LE_DEPART_D_UN_SALARIE.code],
  commanditaire: "La gérante",
  titre: "Recruter dès l'annonce du départ",
  accroche:
    "Un opérateur annonce qu'il part à la fin du mois. Lancer le recrutement tout de suite coûte un mois de salaire de plus ; attendre son départ laisse l'équipe devenir le goulot. Ce que chaque date coûte, et la demande à partir de laquelle il faut se presser.",
  objectifs: [
    "Dérouler l'équipe d'un trimestre mois par mois selon la date du recrutement",
    "Calculer le coût complet d'un départ à chaque date de recrutement",
    "Retrouver à rebours la demande à partir de laquelle recruter tôt rapporte",
    "Répondre à la gérante, chiffre à l'appui",
  ],
  libre: false,
  entreprises: LE_DEPART_D_UN_SALARIE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la gérante",
      texte: (c) => {
        const r = recruterDesLAnnonce(c);
        const f = r.x.f;
        return [
          `« Un opérateur m'annonce aujourd'hui, 1er ${nomDuMois(r.x.annonce)}, qu'il part le 31. Je pensais lancer le recrutement à son départ, le 1er ${nomDuMois(r.x.fiche.debutDuRecrutement!)}, comme d'habitude. Mon adjoint veut le lancer dès aujourd'hui ; mais un remplaçant qui arrive plus tôt, c'est un mois de salaire de plus. Que gagne-t-on à recruter dès aujourd'hui, et à partir de quelle demande cela vaut-il la peine de se presser ? »`,
          `Pas de cours cette fois : l'atelier de ${f.entreprise} est celui du chapitre, sur l'année N + 1 prévue. Un recrutement prend ${qte(f.personnel.delaiDeRecrutementEnMois)} mois et coûte ${eur(f.personnel.coutDUnRecrutement)} ; le remplaçant arrive au premier jour d'un mois et monte à ${qte(f.personnel.integration.productivite * 100)} % son premier mois, pour un salaire entier.`,
        ];
      },
      tableau: (c) => {
        const r = recruterDesLAnnonce(c);
        const x = r.x;
        const f = x.f;
        return {
          titre: `L'atelier de ${f.entreprise} au trimestre ${x.trimestre} de N + 1`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Opérateurs avant le départ", valeurs: [qte(x.operateurs)] },
            { libelle: "Enceintes montées par un opérateur, par mois", valeurs: [qte(x.parMois)] },
            { libelle: "Coût mensuel d'un opérateur, cotisations comprises", valeurs: [eur(x.coutMensuel)] },
            { libelle: "Délai d'un recrutement, du lancement à l'arrivée", valeurs: [`${qte(f.personnel.delaiDeRecrutementEnMois)} mois`] },
            { libelle: "Coût d'un recrutement", valeurs: [eur(f.personnel.coutDUnRecrutement)] },
            { libelle: `Demande du trimestre ${x.trimestre}`, valeurs: [`${qte(x.demandeDuTrimestre)} ${f.unites}`] },
            { libelle: "Capacité de la ligne, par trimestre", valeurs: [`${qte(x.outilDuTrimestre)} ${f.unites}`] },
            { libelle: `Demande du trimestre ${x.trimestre} de N, l'année témoin`, valeurs: [`${qte(x.demandeDuTrimestreEnN)} ${f.unites}`] },
            { libelle: "Marge sur coût variable d'une enceinte", valeurs: [eur(x.marge)] },
          ],
        };
      },
      repere: () => "À rendre : l'équipe et les ventes perdues à chaque date, le coût du départ à chaque date, la demande qui fait pencher, et votre réponse.",
    },
    {
      id: "les-deux-dates",
      type: "montants",
      titre: "L'équipe à chaque date",
      notions: ["capacity", "staff_turnover"],
      question: (c) => {
        const r = recruterDesLAnnonce(c);
        return `Pour chaque date de lancement du recrutement, le 1er ${nomDuMois(r.x.fiche.debutDuRecrutement!)} ou dès l'annonce, calculez la capacité de l'équipe au trimestre ${r.x.trimestre}, puis les ventes que le départ fait perdre face au plan.`;
      },
      champs: (c) => {
        const r = recruterDesLAnnonce(c);
        const x = r.x;
        const mois = (d: typeof r.tard) => d.equipe.mois.slice(r.k * 3, r.k * 3 + 3).map((m) => qte(m.capacite)).join(" + ");
        return [
          { libelle: "Équipe du trimestre, lancé au départ", attendu: r.equipeTard, calcul: `${mois(r.tard)} = ${qte(r.equipeTard)} (arrivée le 1er ${nomDuMois(r.tard.arrivee!)})` },
          { libelle: "Équipe du trimestre, lancé dès l'annonce", attendu: r.equipeTot, calcul: `${mois(r.tot)} = ${qte(r.equipeTot)} (arrivée le 1er ${nomDuMois(r.tot.arrivee!)})` },
          { libelle: "Ventes perdues, lancé au départ", attendu: r.tard.ventesPerdues, calcul: `${qte(x.ventesDuPlan)} au plan − ${qte(r.equipeTard)} = ${qte(r.tard.ventesPerdues)}` },
          { libelle: "Ventes perdues, lancé dès l'annonce", attendu: r.tot.ventesPerdues, calcul: `${qte(x.ventesDuPlan)} au plan − ${qte(r.equipeTot)} = ${qte(r.tot.ventesPerdues)}` },
        ];
      },
      explication: (c) => {
        const r = recruterDesLAnnonce(c);
        return [
          `Lancé dès l'annonce, le recrutement fait arriver le remplaçant ${qte(r.x.f.personnel.delaiDeRecrutementEnMois)} mois plus tard, le 1er ${nomDuMois(r.tot.arrivee!)} : ${nomDuMois(r.x.fiche.dernierMois + 1)} reste vide. Mais l'équipe gagne ${qte(r.equipeTot - r.equipeTard)} ${r.x.f.unites} sur le trimestre, autant de ventes sauvées : ce trimestre, c'est elle qui borne la production.`,
        ];
      },
    },
    {
      id: "le-cout-a-chaque-date",
      type: "montants",
      titre: "Le coût du départ à chaque date",
      notions: ["staff_turnover", "payroll", "contribution_margin"],
      question: () => "Calculez le coût complet du départ à chaque date de lancement du recrutement, puis ce que le recrutement dès l'annonce fait gagner.",
      champs: (c) => {
        const r = recruterDesLAnnonce(c);
        const x = r.x;
        const calcul = (d: typeof r.tard) => `${qte(d.ventesPerdues)} × ${eur(x.marge)} + ${eur(d.recrutement)} − ${qte(d.moisVacants)} × ${eur(x.coutMensuel)} = ${eur(d.coutDuDepart)}`;
        return [
          { libelle: "Coût du départ, lancé au départ", attendu: r.tard.coutDuDepart, calcul: calcul(r.tard) },
          { libelle: "Coût du départ, lancé dès l'annonce", attendu: r.tot.coutDuDepart, calcul: calcul(r.tot) },
          { libelle: "Gain du recrutement dès l'annonce", attendu: r.gain, calcul: `${eur(r.tard.coutDuDepart)} − ${eur(r.tot.coutDuDepart)} = ${eur(r.gain)}` },
        ];
      },
      explication: (c) => {
        const r = recruterDesLAnnonce(c);
        return [
          `Recruter dès l'annonce coûte le même recrutement et ${eur(r.salaireEnPlus)} de salaire de plus ; il sauve ${qte(r.tard.ventesPerdues - r.tot.ventesPerdues)} ventes, ${eur(auCentime((r.tard.ventesPerdues - r.tot.ventesPerdues) * r.x.marge))} de marge. Le départ coûte ${eur(r.gain)} de moins. Reste à savoir si cela tient quand la demande est moins forte.`,
        ];
      },
    },
    {
      id: "la-demande-qui-fait-pencher",
      type: "curseur",
      titre: "La demande qui fait pencher",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const r = recruterDesLAnnonce(c);
        return `Faites varier la demande du trimestre ${r.x.trimestre}, de ${qte(r.equipeTard)} (l'équipe d'un recrutement lancé au départ) à ${qte(r.equipeTot)} (celle d'un recrutement dès l'annonce). Une droite donne la marge que le recrutement dès l'annonce sauve, l'autre le salaire qu'il fait payer de plus. Placez le curseur sur la plus petite demande où recruter dès l'annonce rapporte, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Demande du trimestre ${recruterDesLAnnonce(c).x.trimestre}`, unite: recruterDesLAnnonce(c).x.f.unites }),
      cible: (c) => {
        const r = recruterDesLAnnonce(c);
        return { attendu: r.demandeQuiFaitPencher, min: r.equipeTard, max: r.equipeTot };
      },
      zones: ["Recruter dès l'annonce rapporte", "Attendre le départ coûte moins"],
      rates: () => ({
        dessous: "À cette demande, la marge sauvée ne paie pas encore le mois de salaire en plus.",
        dessus: "Plus bas, recruter dès l'annonce rapporte encore : cherchez la plus petite demande.",
      }),
      montrer: "Montrer la demande qui fait pencher",
      lecture: (c, d) => {
        const r = recruterDesLAnnonce(c);
        const sauvee = auCentime((d - r.equipeTard) * r.x.marge);
        return [
          { libelle: "Marge sauvée par le recrutement dès l'annonce", montant: sauvee },
          { libelle: "Salaire payé de plus", montant: r.salaireEnPlus },
          { libelle: "Gain du recrutement dès l'annonce", montant: auCentime(sauvee - r.salaireEnPlus), fort: true },
        ];
      },
      droites: (c) => {
        const r = recruterDesLAnnonce(c);
        return { produit: (d) => (d - r.equipeTard) * r.x.marge, cout: () => r.salaireEnPlus, libelles: ["Marge sauvée", "Salaire payé de plus"] };
      },
      explication: (c) => {
        const r = recruterDesLAnnonce(c);
        return [
          `Recruter dès l'annonce rapporte dès que la demande du trimestre dépasse ${qte(r.demandeQuiFaitPencher - 1)} ${r.x.f.unites} : il faut ${qte(r.ventesASauver)} ventes sauvées, à ${eur(r.x.marge)}, pour payer ${eur(r.salaireEnPlus)} de salaire. Sous ${qte(r.equipeTard)}, l'équipe d'un recrutement tardif suffit, et le mois de salaire en plus ne rend rien.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "La règle, à rebours",
      notions: ["contribution_margin", "staff_turnover"],
      question: (c) => {
        const r = recruterDesLAnnonce(c);
        return `Retrouvez par le calcul ce que le curseur a montré : les ventes que le recrutement dès l'annonce doit sauver pour payer le salaire de plus (à l'enceinte supérieure), la demande du trimestre ${r.x.trimestre} à partir de laquelle il rapporte, puis ce qu'il aurait fait gagner sur la demande de N.`;
      },
      champs: (c) => {
        const r = recruterDesLAnnonce(c);
        const x = r.x;
        return [
          {
            libelle: "Ventes à sauver pour payer le salaire de plus",
            attendu: r.ventesASauver,
            calcul: `${eur(r.salaireEnPlus)} ÷ ${eur(x.marge)} = ${qte(auCentime(r.salaireEnPlus / x.marge))}, soit ${qte(r.ventesASauver)}`,
          },
          {
            libelle: "Demande à partir de laquelle recruter dès l'annonce rapporte",
            attendu: r.demandeQuiFaitPencher,
            calcul: `${qte(r.equipeTard)} + ${qte(r.ventesASauver)} = ${qte(r.demandeQuiFaitPencher)}`,
          },
          {
            libelle: "Gain du recrutement dès l'annonce, demande de N",
            attendu: r.surN.gain,
            calcul: `(${qte(x.demandeDuTrimestreEnN)} − ${qte(r.equipeTard)}) × ${eur(x.marge)} − ${eur(r.salaireEnPlus)} = ${eur(r.surN.gain)}`,
          },
        ];
      },
      explication: (c) => {
        const r = recruterDesLAnnonce(c);
        const x = r.x;
        return [
          `Avec ${qte(x.demandeDuTrimestre)} ${x.f.unites} demandées (la ligne en sert ${qte(x.outilDuTrimestre)}), ${x.f.entreprise} est loin au-dessus de ${qte(r.demandeQuiFaitPencher)} : recruter dès l'annonce rapporte ${eur(r.gain)}. Même sur la demande de N, ${qte(x.demandeDuTrimestreEnN)} au trimestre ${x.trimestre}, il rapporte encore ${eur(r.surN.gain)}. La règle ne dépend pas du goût de la gérante : elle dépend de la demande, face à l'équipe qui reste.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const r = recruterDesLAnnonce(c);
        const tot = r.verdict === "recruter-des-l-annonce";
        const sauvees = r.tard.ventesPerdues - r.tot.ventesPerdues;
        return [
          {
            texte: `Lançons-le dès aujourd'hui : un mois de salaire en plus sauve ${qte(sauvees)} ventes`,
            juste: tot,
            retour: tot
              ? `Oui : ${eur(r.salaireEnPlus)} de salaire de plus pour ${eur(auCentime(sauvees * r.x.marge))} de marge sauvée ; le départ coûte ${eur(r.gain)} de moins. Il suffirait d'une demande de ${qte(r.demandeQuiFaitPencher)} ${r.x.f.unites} au trimestre pour que ce soit vrai ; ${r.x.f.entreprise} en attend ${qte(r.x.demandeDuTrimestre)}.`
              : `Non : ici, la marge sauvée ne paie pas le salaire de plus.`,
          },
          {
            texte: "Attendons son départ : un remplaçant plus tôt, c'est un salaire de plus à payer",
            juste: !tot,
            retour: !tot
              ? "Oui : ici, la marge sauvée ne paie pas le salaire de plus."
              : `Non : le salaire de plus (${eur(r.salaireEnPlus)}) est bien réel, mais il sauve ${eur(auCentime(sauvees * r.x.marge))} de marge. En attendant, le départ coûterait ${eur(r.gain)} de plus.`,
          },
          {
            texte: "Lançons-le dès aujourd'hui : le remplaçant sera là le jour de son départ",
            juste: false,
            retour: `Non : le recrutement prend ${qte(r.x.f.personnel.delaiDeRecrutementEnMois)} mois. Lancé le 1er ${nomDuMois(r.x.annonce)}, le remplaçant arrive le 1er ${nomDuMois(r.tot.arrivee!)} : ${nomDuMois(r.x.fiche.dernierMois + 1)} reste vide, et ${qte(r.tot.ventesPerdues)} ventes se perdent encore.`,
          },
          {
            texte: `Inutile de se presser : au trimestre ${r.x.trimestre}, c'est l'outil qui limite les ventes`,
            juste: false,
            retour: `Non : c'était vrai au plan. Avec un opérateur de moins, l'équipe tombe à ${qte(r.equipeTard)} ${r.x.f.unites}, sous les ${qte(r.x.outilDuTrimestre)} de la ligne : elle devient le goulot.`,
          },
        ];
      },
    },
  ],
};
