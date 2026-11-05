import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_SITE } from "../../chapitres/le-site-qui-vend";
import { contenusDuCabinet } from "../../chapitres/contenus-communaute-et-e-reputation";
import { CONVERSION_ET_NOTE, avisACinqEtoilesPour, conversionALaNote, noteDesAvis } from "../../monde/site-d-atlas";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CONTENUS, COMMUNAUTÉ ET E-RÉPUTATION » : L'AVIS À UNE ÉTOILE (BTS NDRC,
 * palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les avis, la conversion du site et la marge d'une commande sont
 * ceux de la boutique en ligne d'ATLAS CONSEIL (monde/site-d-atlas.ts), lus par `contenusDuCabinet`, le
 * modèle du chapitre.
 *
 * Au début du trimestre suivant, un participant dont la session a été annulée laisse un avis à une
 * étoile. La responsable des sessions propose d'offrir un code de remise à d'anciens participants
 * contents, en échange d'un avis à 5 étoiles. L'élève refait seul le chemin du chapitre : la note
 * et la conversion après l'avis, et la marge perdue ; au curseur, les avis à 5 étoiles qu'il
 * faudrait (à rebours) ; puis ce que donnerait une demande d'avis faite à chaque participant, sans
 * contrepartie, face au coût des codes ; et la phrase qu'il rend.
 *
 * LE JUGEMENT : l'avis fait perdre un dixième de note et 2 077,44 € de marge par trimestre ; acheter
 * des avis positifs est une pratique commerciale trompeuse et coûte 2 100 € ; demander un avis à chaque
 * participant ramène la note à 4,5 sans rien coûter.
 */

/** L'avis du cas : un seul avis à une étoile. */
export const AVIS_DU_CAS = [{ note: 1, avis: 1 }] as const;

/**
 * LA DEMANDE D'AVIS À CHAQUE PARTICIPANT (hypothèse du cours) : un courriel automatique le lendemain de
 * la session, à chacun des participants du trimestre (autant que de places vendues au premier, 180).
 * 3 sur 10 répondent, et leurs avis font 4,6 en moyenne : sollicités tous, sans tri, les participants
 * contents répondent comme les autres.
 */
export const DEMANDE_D_AVIS = { tauxDeReponse: 0.3, noteMoyenne: 4.6 } as const;

/** LA PROPOSITION DE LA RESPONSABLE (hypothèse du cours) : 30 anciens participants contents, un code de 20 % sur leur prochaine place. */
export const CODES_DE_REMISE = { participants: 30, remise: 0.2 } as const;

/** Les bornes du curseur des avis à 5 étoiles. */
export const AVIS_DU_CURSEUR_DU_CAS = { min: 0, max: 20 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number, d = 2) => `${(Math.round(x * 100 * 10 ** d) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const note = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/** La note et la conversion après l'avis, les avis à 5 étoiles qu'il faudrait, la demande d'avis et les codes. */
export function avisAUneEtoile(c: Pick<Cas, "code">) {
  const x = contenusDuCabinet(c);
  const avant = noteDesAvis();
  const apres = noteDesAvis([...AVIS_DU_CAS]);
  const conversion = conversionALaNote(apres.affichee);
  const aCinq = avisACinqEtoilesPour(CONVERSION_ET_NOTE.noteDeReference, [...AVIS_DU_CAS]);
  const participants = x.t.m.places;
  const avisDemandes = participants * DEMANDE_D_AVIS.tauxDeReponse;
  const avecLaDemande = noteDesAvis([...AVIS_DU_CAS, { note: DEMANDE_D_AVIS.noteMoyenne, avis: avisDemandes }]);
  const coutDesCodes = auCentime(CODES_DE_REMISE.participants * CODES_DE_REMISE.remise * x.t.m.prixHt);
  return { x, avant, apres, conversion, aCinq, participants, avisDemandes, avecLaDemande, coutDesCodes };
}

export const L_AVIS_A_UNE_ETOILE: Situation = {
  code: "l-avis-a-une-etoile",
  parcours: "ndrc",
  palier: 4,
  blocs: [],
  reprend: ["contenus-communaute-et-e-reputation"],
  commanditaire: "La responsable des sessions",
  titre: "L'avis à une étoile",
  accroche:
    "Un participant mécontent laisse un avis à une étoile. La responsable des sessions veut offrir des remises contre des avis à 5 étoiles. Ce que l'avis coûte au site, et la bonne façon de remonter la note.",
  objectifs: [
    "Calculer la note moyenne après un avis négatif, et son effet sur la conversion et la marge",
    "Retrouver à rebours les avis à 5 étoiles qu'il faudrait pour revenir à la note",
    "Chiffrer une demande d'avis à chaque participant face à des remises contre des avis",
    "Rédiger une réponse chiffrée, dans le respect du droit de la consommation",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SITE,
    pourquoi: "ce cas suit les avis de la boutique en ligne d'un cabinet de formation : il se joue chez ATLAS CONSEIL, le cabinet du chapitre, sur le premier trimestre de son site.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la responsable des sessions",
      texte: (c) => {
        const r = avisAUneEtoile(c);
        return [
          `« Un participant dont la session a été annulée la veille nous a mis 1 étoile, et la note est tombée à ${note(r.apres.affichee)}. J'ai une idée : offrir à ${qte(CODES_DE_REMISE.participants)} anciens participants contents un code de ${pct(CODES_DE_REMISE.remise, 0)} sur leur prochaine place, s'ils publient un avis à 5 étoiles. Dites-moi ce que l'avis nous coûte, et si mon idée tient. »`,
          "Pas de cours cette fois : vous avez les avis, la conversion du site et la marge d'une commande. À vous d'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = avisAUneEtoile(c);
        return {
          titre: `Les avis et le site · ${r.x.f.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Avis avant l'avis négatif", valeurs: [qte(r.avant.avis)] },
            { libelle: "Points de ces avis", valeurs: [qte(r.avant.points)] },
            { libelle: "Note affichée avant", valeurs: [note(r.avant.affichee)] },
            { libelle: "Conversion du site à cette note", valeurs: [pct(r.x.t.conversion)] },
            { libelle: "Conversion perdue par dixième de note", valeurs: [pct(CONVERSION_ET_NOTE.parDixieme)] },
            { libelle: "Visites d'un trimestre", valeurs: [qte(r.x.t.visites)] },
            { libelle: "Marge d'une commande", valeurs: [eur(r.x.t.m.marge)] },
            { libelle: "Participants d'un trimestre", valeurs: [qte(r.participants)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la note et la conversion après l'avis, la marge perdue par trimestre, les avis à 5 étoiles qu'il faudrait, ce que donnerait une demande d'avis à chacun face au coût des codes, et votre réponse.",
    },
    {
      id: "ce-que-coute-l-avis",
      type: "montants",
      titre: "Ce que coûte l'avis",
      notions: ["brand_capital", "conversion_rate"],
      question: () =>
        "Calculez la note moyenne après l'avis à 1 étoile (au centième), la note affichée (au dixième), la conversion du site à cette note (en %). Puis la marge que l'avis fait perdre sur un trimestre (commandes en moins × marge ; négative s'il fait perdre).",
      champs: (c) => {
        const r = avisAUneEtoile(c);
        const k = r.conversion;
        return [
          { libelle: "Note moyenne après l'avis", attendu: auCentime(r.apres.moyenne), tolerance: 0.01, calcul: `(${qte(r.avant.points)} + 1) ÷ (${qte(r.avant.avis)} + 1) = ${note(auCentime(r.apres.moyenne))}` },
          { libelle: "Note affichée", attendu: r.apres.affichee, tolerance: 0.01, calcul: `${note(auCentime(r.apres.moyenne))} arrondi au dixième = ${note(r.apres.affichee)}` },
          { libelle: "Conversion à cette note (%)", attendu: auCentime(k.conversion * 100), tolerance: 0.01, calcul: `${pct(r.x.t.conversion)} − ${qte(-k.dixiemes)} × ${pct(CONVERSION_ET_NOTE.parDixieme)} = ${pct(k.conversion)}` },
          { libelle: "Marge perdue par trimestre", attendu: k.margeEnPlus, calcul: `${qte(r.x.t.visites)} × (${pct(k.conversion)} − ${pct(r.x.t.conversion)}) × ${eur(r.x.t.m.marge)} = ${eur(k.margeEnPlus)}` },
        ];
      },
      explication: (c) => {
        const r = avisAUneEtoile(c);
        return [
          `Un seul avis fait perdre un dixième de note affichée, et ${eur(-r.conversion.margeEnPlus)} de marge par trimestre tant qu'il pèse : la note se lit sur toutes les sources du site à la fois. La responsable a raison de vouloir agir ; reste à savoir comment.`,
        ];
      },
    },
    {
      id: "les-avis-qu-il-faut",
      type: "curseur",
      titre: "Les avis à 5 étoiles qu'il faudrait",
      notions: ["brand_capital"],
      question: (c) => {
        const r = avisAUneEtoile(c);
        return `La fiche compte ${qte(r.apres.avis)} avis et ${qte(r.apres.points)} points. Faites varier les avis à 5 étoiles qui s'ajoutent, de ${qte(AVIS_DU_CURSEUR_DU_CAS.min)} à ${qte(AVIS_DU_CURSEUR_DU_CAS.max)}. Placez le curseur sur le plus petit nombre qui ramène la moyenne à ${note(CONVERSION_ET_NOTE.noteDeReference)}, puis validez.`;
      },
      grandeur: () => ({ libelle: "Avis à 5 étoiles en plus", unite: "avis" }),
      cible: (c) => ({ attendu: avisAUneEtoile(c).aCinq, min: AVIS_DU_CURSEUR_DU_CAS.min, max: AVIS_DU_CURSEUR_DU_CAS.max }),
      zones: ["La note est revenue", "La note reste en dessous"],
      rates: () => ({
        dessous: "À cette position, la moyenne reste sous la note visée.",
        dessus: "Moins d'avis suffiraient : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les avis",
      lecture: (c, k) => {
        const r = avisAUneEtoile(c);
        const vise = CONVERSION_ET_NOTE.noteDeReference;
        return [
          { libelle: "Points de la fiche", montant: r.apres.points + 5 * k },
          { libelle: "Points qu'il faut pour la note visée", montant: auCentime(vise * (r.apres.avis + k)) },
          { libelle: "Points en plus ou en moins", montant: auCentime(r.apres.points + 5 * k - vise * (r.apres.avis + k)), fort: true },
        ];
      },
      droites: (c) => {
        const r = avisAUneEtoile(c);
        const vise = CONVERSION_ET_NOTE.noteDeReference;
        return {
          produit: (k) => r.apres.points + 5 * k,
          cout: (k) => vise * (r.apres.avis + k),
          libelles: ["Points de la fiche", "Points qu'il faut pour la note visée"],
        };
      },
      explication: (c) => {
        const r = avisAUneEtoile(c);
        return [
          `Il faut ${qte(r.aCinq)} avis à 5 étoiles pour effacer un seul avis à 1 étoile : la responsable vise juste en nombre, avec ses ${qte(CODES_DE_REMISE.participants)} codes. La question est ailleurs : ce que ces avis coûtent, et ce qu'ils valent devant la loi.`,
        ];
      },
    },
    {
      id: "deux-facons",
      type: "montants",
      titre: "Demander un avis à chacun, ou l'acheter",
      notions: ["brand_capital", "customer_acquisition_cost"],
      question: (c) => {
        const r = avisAUneEtoile(c);
        return `Au lieu des codes, le cabinet peut demander un avis, sans contrepartie, à chacun des ${qte(r.participants)} participants du trimestre : ${pct(DEMANDE_D_AVIS.tauxDeReponse, 0)} répondent, avec une note moyenne de ${note(DEMANDE_D_AVIS.noteMoyenne)}. Calculez les avis que la demande amène, la note moyenne de la fiche ensuite (au centième), puis ce que coûteraient les codes de la responsable (${qte(CODES_DE_REMISE.participants)} codes de ${pct(CODES_DE_REMISE.remise, 0)} sur une place à ${eur(r.x.t.m.prixHt)}).`;
      },
      champs: (c) => {
        const r = avisAUneEtoile(c);
        return [
          { libelle: "Avis amenés par la demande", attendu: r.avisDemandes, calcul: `${qte(r.participants)} × ${pct(DEMANDE_D_AVIS.tauxDeReponse, 0)} = ${qte(r.avisDemandes)}` },
          {
            libelle: "Note moyenne après la demande",
            attendu: auCentime(r.avecLaDemande.moyenne),
            tolerance: 0.01,
            calcul: `(${qte(r.apres.points)} + ${qte(r.avisDemandes)} × ${note(DEMANDE_D_AVIS.noteMoyenne)}) ÷ (${qte(r.apres.avis)} + ${qte(r.avisDemandes)}) = ${qte(auCentime(r.avecLaDemande.points))} ÷ ${qte(r.avecLaDemande.avis)} = ${note(auCentime(r.avecLaDemande.moyenne))}`,
          },
          { libelle: "Coût des codes de remise", attendu: r.coutDesCodes, calcul: `${qte(CODES_DE_REMISE.participants)} × ${pct(CODES_DE_REMISE.remise, 0)} × ${eur(r.x.t.m.prixHt)} = ${eur(r.coutDesCodes)}` },
        ];
      },
      explication: (c) => {
        const r = avisAUneEtoile(c);
        return [
          `Demander un avis à chacun ramène la note à ${note(r.avecLaDemande.affichee)} et ne coûte qu'un courriel automatique ; les codes coûteraient ${eur(r.coutDesCodes)}. Surtout, payer un avis à 5 étoiles est une pratique commerciale trompeuse : les avis doivent refléter l'expérience de tous, et le site doit dire comment il les collecte.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable des sessions",
      question: () => "Quelle phrase envoyez-vous à la responsable des sessions ?",
      options: (c) => {
        const r = avisAUneEtoile(c);
        return [
          {
            texte: "Répondre à l'avis, et demander un avis à chacun, sans contrepartie",
            juste: true,
            retour: `Oui : l'avis coûte ${eur(-r.conversion.margeEnPlus)} de marge par trimestre ; une demande faite à chacun amène ${qte(r.avisDemandes)} avis et ramène la note à ${note(r.avecLaDemande.affichee)}, sans rien payer ni rien enfreindre.`,
          },
          {
            texte: `Offrir les codes : ${qte(r.aCinq)} avis à 5 étoiles suffisent à revenir à la note`,
            juste: false,
            retour: `Non : le calcul est juste, mais payer un avis positif est une pratique commerciale trompeuse, et coûterait ${eur(r.coutDesCodes)}. Un avis acheté qui se découvre abîme la note plus que l'avis négatif.`,
          },
          {
            texte: "Ne rien faire : un seul avis ne pèse rien parmi les autres",
            juste: false,
            retour: `Non : il fait perdre un dixième de note affichée, et ${eur(-r.conversion.margeEnPlus)} de marge par trimestre. Sur une petite fiche, chaque avis pèse.`,
          },
          {
            texte: "Demander au moteur de recherche de retirer l'avis, qui nuit au cabinet",
            juste: false,
            retour: "Non : un avis sincère ne se retire pas parce qu'il déplaît. Mieux vaut y répondre : la réponse se lit, elle aussi.",
          },
        ];
      },
    },
  ],
};
