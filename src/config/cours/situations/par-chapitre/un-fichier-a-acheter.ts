import { arrondi2 as auCentime, eur, nombreAuCentieme, pct as enPoints } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_FICHIER, TAUX_DE_RENDEZ_VOUS_QUALIFIE, fichierDuCabinet } from "../../chapitres/le-fichier-et-la-cible";
import { aRebours } from "../../monde/terrain-d-atlas";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE FICHIER : QUALIFIER, SEGMENTER, CIBLER » : UN FICHIER À ACHETER ?
 * (BTS NDRC, palier 4).
 *
 * La direction relève l'objectif de conquête : 12 comptes neufs en N + 1 au lieu de 8. Hugo qualifie déjà
 * ses contacts (20 % acceptent un rendez-vous), mais ses 480 PME moyennes utilisables n'y suffisent plus.
 * Un loueur de fichiers propose 1 000 lignes de PME moyennes de la région. L'élève refait seul le chemin du
 * chapitre : la qualité du fichier proposé (doublons avec le fichier du cabinet, lignes incomplètes, hors
 * cible), le calcul à rebours des contacts qu'il faut, ce que rapportent les lignes qui manquent face à ce
 * qu'elles coûtent, la règle du RGPD au premier appel, puis la réponse.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : ses taux et ses valeurs sont ceux de
 * `fichierDuCabinet`, sur la fiche du cabinet. Il ne lit du cas que son code.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les lignes, les devis, les rendez-vous et les contacts sont des
 * quantités, les devis arrondis à l'unité au-dessus ; les comptes attendus, une grandeur au centième ;
 * la part et la valeur, à un centième près (à 5 centièmes et à 2 € près, avant).
 */

/** L'OBJECTIF RELEVÉ, hypothèse du cas : 12 comptes neufs de PME moyennes en N + 1. */
export const OBJECTIF_RELEVE = 12;

/**
 * L'OFFRE DU LOUEUR DE FICHIERS, hypothèse du cas : 1 000 lignes de PME moyennes et d'ETI de la région,
 * 1,20 € la ligne, livrées avec leurs consentements. Au dédoublonnage, 150 sont déjà dans le fichier du
 * cabinet ; 170 des autres sont incomplètes ; 80 ont en fait moins de 50 salariés.
 */
export const OFFRE_DU_LOUEUR = { lignes: 1_000, prixDeLaLigne: 1.2, dejaDansLeFichier: 150, incompletes: 170, horsCible: 80 } as const;

const qte = nombreAuCentieme;
const pct = (t: number) => enPoints(t * 100);

/** Le fichier proposé, l'objectif relevé et le bilan de l'achat. */
export function achatDuFichier(c: Pick<Cas, "code">) {
  const x = fichierDuCabinet(c);
  const o = OFFRE_DU_LOUEUR;
  const utilisables = o.lignes - o.dejaDansLeFichier - o.incompletes - o.horsCible;
  const prix = auCentime(o.lignes * o.prixDeLaLigne);
  const r = aRebours({ comptes: OBJECTIF_RELEVE, tauxDeRendezVous: TAUX_DE_RENDEZ_VOUS_QUALIFIE });
  const comptesParContact = TAUX_DE_RENDEZ_VOUS_QUALIFIE * x.t.devisParRendezVous * x.t.tauxDeSignature;
  const lignesAppelees = Math.min(utilisables, r.manquants);
  const comptes = auCentime(lignesAppelees * comptesParContact);
  const valeur = auCentime(comptes * x.valeurNeuveMoyenne.valeurVie);
  const appels = auCentime(lignesAppelees * x.coutDUnContact);
  const cout = auCentime(prix + appels);
  return {
    x,
    o,
    utilisables,
    partUtilisable: utilisables / o.lignes,
    prix,
    coutParLigneUtilisable: auCentime(prix / utilisables),
    r,
    couvre: utilisables >= r.manquants,
    comptesParContact,
    lignesAppelees,
    comptes,
    valeur,
    appels,
    cout,
    gain: auCentime(valeur - cout),
  };
}

/** L'offre du loueur : le document du cas. */
function tableauDeLOffre(c: Pick<Cas, "code">): TableauDeDonnees {
  const a = achatDuFichier(c);
  return {
    titre: "L'offre du loueur de fichiers",
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Lignes de PME moyennes et d'ETI", valeurs: [qte(a.o.lignes)] },
      { libelle: "Prix de la ligne", valeurs: [eur(a.o.prixDeLaLigne)] },
      { libelle: "Lignes déjà dans le fichier du cabinet", valeurs: [qte(a.o.dejaDansLeFichier)] },
      { libelle: "Lignes incomplètes", valeurs: [qte(a.o.incompletes)] },
      { libelle: "Entreprises de moins de 50 salariés", valeurs: [qte(a.o.horsCible)] },
    ],
  };
}

export const UN_FICHIER_A_ACHETER: Situation = {
  code: "un-fichier-a-acheter",
  parcours: "ndrc",
  palier: 4,
  blocs: [],
  reprend: ["le-fichier-et-la-cible"],
  commanditaire: "Le commercial de la conquête",
  titre: "Un fichier à acheter ?",
  accroche:
    "L'objectif monte à 12 comptes neufs, et le fichier n'y suffit plus. Qualifier l'offre d'un loueur de fichiers, compter à rebours les contacts qu'il faut, chiffrer ce que rapportent les lignes achetées, puis répondre.",
  objectifs: [
    "Qualifier un fichier acheté : doublons, complétude et cible",
    "Retrouver à rebours les contacts qu'il faut pour un objectif de comptes",
    "Chiffrer ce que rapportent des contacts face à ce qu'ils coûtent",
    "Appliquer la règle du RGPD au premier contact d'un prospect",
    "Rédiger une réponse chiffrée au commercial",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_FICHIER,
    pourquoi: "ce cas reprend le chapitre « Le fichier : qualifier, segmenter, cibler », qui lit le fichier et le marché d'ATLAS CONSEIL, le cabinet de la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de Hugo",
      tableau: tableauDeLOffre,
      texte: (c) => {
        const a = achatDuFichier(c);
        return [
          `« La direction me demande ${qte(OBJECTIF_RELEVE)} comptes neufs de PME moyennes l'an prochain. Je qualifie mes contacts, ${pct(TAUX_DE_RENDEZ_VOUS_QUALIFIE)} acceptent un rendez-vous, mais je n'ai que ${qte(a.x.utilisables)} PME moyennes utilisables. Un loueur me propose ${qte(a.o.lignes)} lignes à ${eur(a.o.prixDeLaLigne)}. Faut-il les acheter ? »`,
          `Pas de cours cette fois : vous avez l'offre, les taux de N (${pct(a.x.t.devisParRendezVous)} de devis par rendez-vous, ${pct(a.x.t.tauxDeSignature)} de devis signés), un contact appelé à ${eur(a.x.coutDUnContact)} et un compte neuf à ${eur(a.x.valeurNeuveMoyenne.valeurVie)} de valeur vie. La méthode est celle du chapitre.`,
        ];
      },
      repere: () => "À rendre : les lignes utilisables de l'offre, les contacts qu'il faut, ce que rapportent les lignes achetées, la règle du premier appel, et votre réponse.",
    },
    {
      id: "les-lignes-utiles",
      type: "montants",
      titre: "Ce que vaut l'offre",
      notions: ["segmentation"],
      question: () => "Calculez les lignes utilisables de l'offre, sa part utilisable (en %), le prix de l'offre, puis le prix d'une ligne utilisable.",
      champs: (c) => {
        const a = achatDuFichier(c);
        return [
          { libelle: "Lignes utilisables de l'offre", nature: "quantite", attendu: a.utilisables, calcul: `${qte(a.o.lignes)} − ${qte(a.o.dejaDansLeFichier)} − ${qte(a.o.incompletes)} − ${qte(a.o.horsCible)} = ${qte(a.utilisables)}` },
          { libelle: "Part utilisable de l'offre (%)", attendu: auCentime(a.partUtilisable * 100), calcul: `${qte(a.utilisables)} ÷ ${qte(a.o.lignes)} = ${pct(a.partUtilisable)}` },
          { libelle: "Prix de l'offre", attendu: a.prix, calcul: `${qte(a.o.lignes)} × ${eur(a.o.prixDeLaLigne)} = ${eur(a.prix)}` },
          { libelle: "Prix d'une ligne utilisable", attendu: a.coutParLigneUtilisable, calcul: `${eur(a.prix)} ÷ ${qte(a.utilisables)} = ${eur(a.coutParLigneUtilisable)}` },
        ];
      },
      explication: (c) => {
        const a = achatDuFichier(c);
        return [`Comme le fichier du cabinet, l'offre ne sert qu'à ${pct(a.partUtilisable)} : une ligne utilisable coûte ${eur(a.coutParLigneUtilisable)}, pas ${eur(a.o.prixDeLaLigne)}.`];
      },
    },
    {
      id: "les-contacts-qu-il-faut",
      type: "montants",
      titre: "Les contacts qu'il faut",
      notions: ["conversion_rate", "segmentation"],
      question: (c) => {
        const a = achatDuFichier(c);
        return `Pour ${qte(OBJECTIF_RELEVE)} comptes, à ${pct(TAUX_DE_RENDEZ_VOUS_QUALIFIE)} de rendez-vous, calculez les devis, les rendez-vous et les contacts qu'il faut (chaque marche à l'unité supérieure), puis les contacts qui manquent aux ${qte(a.x.utilisables)} du fichier.`;
      },
      champs: (c) => {
        const r = achatDuFichier(c).r;
        return [
          { libelle: "Devis à remettre", nature: "quantite", attendu: r.devis, calcul: `${qte(r.comptes)} ÷ ${pct(r.tauxDeSignature)} = ${qte(auCentime(r.comptes / r.tauxDeSignature))}, soit ${qte(r.devis)} devis à l'unité au-dessus` },
          { libelle: "Rendez-vous à obtenir", nature: "quantite", attendu: r.rendezVous, calcul: `${qte(r.devis)} ÷ ${pct(r.devisParRendezVous)} = ${qte(r.rendezVous)} rendez-vous` },
          { libelle: "Contacts à appeler", nature: "quantite", attendu: r.contacts, calcul: `${qte(r.rendezVous)} ÷ ${pct(r.tauxDeRendezVous)} = ${qte(r.contacts)} contacts` },
          { libelle: "Contacts qui manquent", nature: "quantite", attendu: r.manquants, calcul: `${qte(r.contacts)} − ${qte(r.utilisables)} = ${qte(r.manquants)}` },
        ];
      },
      explication: (c) => {
        const a = achatDuFichier(c);
        return [`Il manque ${qte(a.r.manquants)} contacts ; l'offre en apporte ${qte(a.utilisables)} utilisables : elle ${a.couvre ? "couvre" : "ne couvre pas"} le manque.`];
      },
    },
    {
      id: "ce-que-rapporte-l-achat",
      type: "montants",
      titre: "Ce que rapportent les lignes achetées",
      notions: ["customer_lifetime_value", "conversion_rate", "customer_acquisition_cost"],
      question: (c) => {
        const a = achatDuFichier(c);
        return `Hugo n'appelle que les ${qte(a.lignesAppelees)} lignes achetées qu'il lui faut, qualifiées comme les autres. Calculez les comptes attendus de ces lignes (au centième), leur valeur vie, le coût de l'achat et des appels, puis le gain de l'achat (négatif pour une perte).`;
      },
      champs: (c) => {
        const a = achatDuFichier(c);
        const t = a.x.t;
        return [
          {
            libelle: "Comptes attendus des lignes achetées",
            nature: "grandeur",
            attendu: a.comptes,
            calcul: `${qte(a.lignesAppelees)} × ${pct(TAUX_DE_RENDEZ_VOUS_QUALIFIE)} × ${pct(t.devisParRendezVous)} × ${pct(t.tauxDeSignature)} = ${qte(a.comptes)} comptes`,
          },
          { libelle: "Valeur vie de ces comptes", attendu: a.valeur, calcul: `${qte(a.comptes)} × ${eur(a.x.valeurNeuveMoyenne.valeurVie)} = ${eur(a.valeur)}` },
          { libelle: "Coût de l'achat et des appels", attendu: a.cout, calcul: `${eur(a.prix)} + ${qte(a.lignesAppelees)} × ${eur(a.x.coutDUnContact)} = ${eur(a.prix)} + ${eur(a.appels)} = ${eur(a.cout)}` },
          { libelle: "Gain de l'achat", attendu: a.gain, calcul: `${eur(a.valeur)} − ${eur(a.cout)} = ${eur(a.gain)}` },
        ];
      },
      explication: (c) => {
        const a = achatDuFichier(c);
        return [`Le prix du fichier pèse peu : ${eur(a.prix)}, quand les appels coûtent ${eur(a.appels)}. Ce qui fait payer l'achat, c'est la valeur vie des comptes qu'il amène, ${eur(a.valeur)}.`];
      },
    },
    {
      id: "le-premier-appel",
      type: "choix",
      titre: "Le premier appel à un contact acheté",
      notions: ["segmentation"],
      question: () => "Hugo appelle pour la première fois un contact du fichier loué. Que doit-il lui dire, selon le RGPD ?",
      options: () => [
        { texte: "D'où vient son contact, et qu'il peut s'y opposer", juste: true, retour: "Oui : des données qui n'ont pas été recueillies auprès de la personne lui sont présentées, au plus tard au premier contact, avec leur source et son droit d'opposition." },
        { texte: "Rien : le loueur a déjà recueilli les consentements", juste: false, retour: "Non : le cabinet devient responsable des données qu'il utilise ; il doit informer le prospect lui-même, au premier contact." },
        { texte: "Il doit d'abord lui écrire pour obtenir son accord", juste: false, retour: "Non : entre professionnels, un appel sur un sujet lié à son métier est permis, sans accord préalable ; le prospect doit seulement pouvoir s'y opposer." },
      ],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à Hugo",
      question: () => "Quelle phrase envoyez-vous à Hugo ?",
      options: (c) => {
        const a = achatDuFichier(c);
        return [
          {
            texte: `L'acheter : ${qte(a.lignesAppelees)} lignes qualifiées valent ${eur(a.gain)} de gain`,
            juste: true,
            retour: `Oui : l'offre apporte ${qte(a.utilisables)} lignes utilisables pour ${qte(a.r.manquants)} qui manquent. Les ${qte(a.lignesAppelees)} appelées donnent ${qte(a.comptes)} comptes attendus, ${eur(a.valeur)} de valeur vie pour ${eur(a.cout)}. Dédoublonnez-la avant de l'appeler, et dites à chaque prospect d'où vient son contact.`,
          },
          {
            texte: `Ne pas l'acheter : ${pct(1 - a.partUtilisable)} de ses lignes ne servent pas`,
            juste: false,
            retour: `Non : une ligne utilisable revient à ${eur(a.coutParLigneUtilisable)}, quand un compte gagné vaut ${eur(a.x.valeurNeuveMoyenne.valeurVie)}. La qualité de l'offre se paie dans son prix, pas dans la décision.`,
          },
          {
            texte: `Ne pas l'acheter : les ${qte(a.x.utilisables)} contacts du fichier suffisent si on les qualifie`,
            juste: false,
            retour: `Non : qualifiés, ils suffisaient à ${qte(a.x.objectif)} comptes. Pour ${qte(OBJECTIF_RELEVE)}, il faut ${qte(a.r.contacts)} contacts : il en manque ${qte(a.r.manquants)}.`,
          },
          {
            texte: `L'acheter et appeler ses ${qte(a.o.lignes)} lignes, pour aller plus vite`,
            juste: false,
            retour: `Non : ${qte(a.o.lignes - a.utilisables)} lignes sont déjà dans le fichier, incomplètes ou hors cible. Les appeler coûte ${eur(a.x.coutDUnContact)} l'appel, sans espoir de compte.`,
          },
        ];
      },
    },
  ],
};
