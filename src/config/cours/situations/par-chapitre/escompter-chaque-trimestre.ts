import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_CLIENT_QUI_PAIE_TARD, clientQuiPaieTard } from "../../chapitres/le-client-qui-paie-tard";
import { auCentime } from "../../monde/amortissement";
import { JOURS_DE_L_ANNEE_BANCAIRE, JOURS_DU_TRIMESTRE } from "../../monde/delais-et-tva";
import { coutDuDecouvert, escompterChaqueTrimestre } from "../../monde/delais";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE CLIENT QUI PAIE TARD » : ESCOMPTER CHAQUE TRIMESTRE (BTS GPME,
 * palier 2).
 *
 * La banque propose au dirigeant de NOVA d'escompter toutes les factures de CampusTech, chaque mois,
 * jusqu'à leur échéance convenue : « vous n'aurez plus de découvert ». Il demande ce que cela
 * coûterait sur l'année, ce que cela éviterait, et s'il faut signer.
 *
 * L'élève chiffre l'escompte de l'année (12 factures, dans le plafond de la banque), le découvert
 * qu'il éviterait (les besoins de trésorerie de N + 1, posés par la fiche), puis croise les deux
 * trimestre par trimestre : un curseur montre au quatrième trimestre jusqu'où le découvert coûte
 * moins que l'escompte des factures qui couvrent le besoin, et le calcul à rebours donne ce seuil
 * au deuxième. La réponse demande un jugement : ni tout, ni rien, mais l'escompte là où le
 * découvert dure.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de monde/delais.ts (`escompterChaqueTrimestre`). Les besoins de trésorerie de
 * N + 1 sont une hypothèse de la fiche, pas un budget calculé. Le cas se joue au réel : CampusTech paie
 * à l'échéance, à 60 jours (le retard de 20 jours n'est que l'hypothèse de son chapitre), et l'escompte
 * jusqu'à l'échéance couvre toute l'attente.
 */

const eur = (x: number) => montantEcrit(auCentime(x)).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const ordinal = (n: number) => (n === 1 ? "1er" : `${n}e`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Ce que le dirigeant doit faire : signer pour chaque trimestre, escompter au cas par cas, ou ne rien escompter. */
export type Verdict = "chaque-trimestre" | "au-cas-par-cas" | "jamais";

/** Le trimestre où le découvert dure le plus longtemps : celui du curseur. */
export const TRIMESTRE_DU_CURSEUR = 4;

/** Le trimestre du calcul à rebours : un découvert plus court. */
export const TRIMESTRE_A_REBOURS = 2;

/** L'escompte de chaque trimestre face au découvert qu'il évite, et l'escompte au cas par cas. */
export function escompteChaqueTrimestre(c: Pick<Cas, "code">) {
  const k = clientQuiPaieTard(c);
  const f = k.f;
  const x = escompterChaqueTrimestre(f);
  const taux = f.banque.tauxDuDecouvert;
  const t = (n: number) => x.trimestres[n - 1]!;
  const curseur = t(TRIMESTRE_DU_CURSEUR);
  const parJour = (n: number) => (t(n).besoin * taux) / JOURS_DE_L_ANNEE_BANCAIRE;
  // Les jours de découvert d'un trimestre qui coûtent autant que l'escompte des factures qui couvrent son besoin.
  const joursQuiValentLEscompte = (n: number) => (parJour(n) > 0 ? t(n).escompteDuBesoin / parJour(n) : 0);
  const joursOuLeDecouvertCouteMoins = Math.floor(joursQuiValentLEscompte(TRIMESTRE_DU_CURSEUR) + 1e-9);
  const verdict: Verdict = x.escompteDeLAnnee <= x.decouvertEvite ? "chaque-trimestre" : x.auMieux < x.decouvertEvite ? "au-cas-par-cas" : "jamais";
  return {
    k,
    f,
    x,
    taux,
    t,
    curseur,
    joursOuLeDecouvertCouteMoins,
    joursARebours: auCentime(joursQuiValentLEscompte(TRIMESTRE_A_REBOURS)),
    economie: auCentime(x.escompteDeLAnnee - x.auMieux),
    verdict,
  };
}

export const ESCOMPTER_CHAQUE_TRIMESTRE: Situation = {
  code: "escompter-chaque-trimestre",
  parcours: "gpme",
  palier: 2,
  blocs: [],
  reprend: ["le-client-qui-paie-tard"],
  commanditaire: "Le dirigeant",
  titre: "Escompter chaque trimestre",
  accroche:
    "La banque propose d'escompter toutes les factures du client professionnel, chaque mois : plus de découvert, promet-elle. Ce que cela coûte sur l'année, ce que cela évite, et s'il faut signer.",
  objectifs: [
    "Calculer le coût d'un escompte sur l'année, dans le plafond de la banque",
    "Calculer le découvert qu'un escompte évite, trimestre par trimestre",
    "Croiser l'escompte et le découvert selon la durée du besoin",
    "Répondre au dirigeant, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CLIENT_QUI_PAIE_TARD,
    pourquoi: "ce cas reprend le chapitre « Le client qui paie tard », qui se joue chez NOVA, dans la simulation du cours, avec son client CampusTech et sa banque.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la banque",
      texte: (c) => {
        const e = escompteChaqueTrimestre(c);
        const k = e.k;
        return [
          `« La banque nous propose d'escompter chaque facture de ${k.ct.nom}, dès qu'elle part, jusqu'à son échéance convenue de ${k.ct.delaiConvenu} jours, à ${pct(k.b.escompte.taux)} l'an, sauf bonne fin. Elle accepte ${eur(k.b.escompte.plafondTTC)} d'effets escomptés à la fois. Elle dit que nous n'aurons plus de découvert. Combien cela coûterait-il sur l'année, qu'est-ce que cela nous éviterait, et faut-il signer ? »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre. Les besoins de trésorerie de l'année sont ceux du tableau, avant toute mobilisation : la simulation les pose, sans détailler le budget qui les donne. Le découvert coûte ${pct(e.taux)} l'an. ${k.ct.nom} paie à l'échéance, à ${k.ct.delaiReel} jours : l'escompte couvre toute l'attente de chaque facture, sans retard à financer.`,
        ];
      },
      tableau: (c) => {
        const e = escompteChaqueTrimestre(c);
        const k = e.k;
        return {
          titre: `La trésorerie ${dE(k.f.entreprise)} en N + 1, trimestre par trimestre`,
          colonnes: e.x.trimestres.map((t) => `${ordinal(t.trimestre)} trimestre`),
          lignes: [
            { libelle: "Découvert moyen, les jours où le compte est débiteur", valeurs: e.x.trimestres.map((t) => eur(t.besoin)) },
            { libelle: "Jours où le compte est débiteur", valeurs: e.x.trimestres.map((t) => qte(t.joursDeDecouvert)) },
            { libelle: `Factures de ${k.ct.nom} émises (TTC)`, valeurs: e.x.trimestres.map(() => `${qte(JOURS_DU_TRIMESTRE / 30)} × ${eur(k.fct.ttc)}`) },
          ],
        };
      },
      repere: () => "À rendre : le coût de l'escompte sur l'année, le découvert qu'il éviterait, ce qu'il vaut trimestre par trimestre, et votre réponse.",
    },
    {
      id: "ce-que-coute-l-escompte",
      type: "montants",
      titre: "Ce que coûterait l'escompte",
      notions: ["receivables_financing"],
      question: (c) => {
        const k = escompteChaqueTrimestre(c).k;
        return `Combien coûte l'escompte d'une facture de ${k.ct.nom}, jusqu'à son échéance ? Combien la banque aurait-elle d'effets escomptés au plus fort, toutes taxes comprises, et cela tient-il dans son plafond ? Combien coûterait l'escompte de toutes les factures de l'année ?`;
      },
      champs: (c) => {
        const e = escompteChaqueTrimestre(c);
        const k = e.k;
        const parAn = e.x.trimestres.length * (JOURS_DU_TRIMESTRE / 30);
        return [
          { libelle: "Escompte d'une facture", attendu: e.x.parFacture, calcul: `${eur(k.fct.ttc)} × ${pct(k.b.escompte.taux)} × ${k.ct.delaiConvenu} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(e.x.parFacture)}` },
          {
            libelle: "Effets escomptés au plus fort (TTC)",
            attendu: e.x.encoursEscompte,
            calcul: `à ${k.ct.delaiConvenu} jours, ${qte(e.x.encoursEscompte / k.fct.ttc)} factures attendent leur échéance à la fois : ${qte(e.x.encoursEscompte / k.fct.ttc)} × ${eur(k.fct.ttc)} = ${eur(e.x.encoursEscompte)}, ${e.x.dansLePlafond ? "sous" : "au-delà de"} ${eur(k.b.escompte.plafondTTC)}`,
          },
          { libelle: "Escompte de l'année", attendu: e.x.escompteDeLAnnee, calcul: `${qte(parAn)} × ${eur(e.x.parFacture)} = ${eur(e.x.escompteDeLAnnee)}` },
        ];
      },
      explication: (c) => {
        const e = escompteChaqueTrimestre(c);
        return [
          `La banque escompterait ${eur(e.x.escompteDeLAnnee)} d'intérêts sur l'année, dans son plafond : ${eur(e.x.encoursEscompte)} d'effets escomptés au plus fort. Chaque facture paie ses ${e.k.ct.delaiConvenu} jours d'escompte, que le compte de ${e.f.entreprise} en ait besoin ou non.`,
        ];
      },
    },
    {
      id: "le-decouvert-evite",
      type: "montants",
      titre: "Le découvert que l'escompte éviterait",
      notions: ["receivables_financing", "net_treasury"],
      question: () => {
        return `Combien coûterait le découvert de l'année sans escompte, au ${ordinal(TRIMESTRE_A_REBOURS)} trimestre puis au ${ordinal(TRIMESTRE_DU_CURSEUR)} ? De combien l'escompte de chaque facture coûterait-il plus, ou moins, que le découvert qu'il évite ? Positif s'il coûte plus.`;
      },
      champs: (c) => {
        const e = escompteChaqueTrimestre(c);
        const ligne = (n: number) => {
          const t = e.t(n);
          return {
            libelle: `Découvert du ${ordinal(n)} trimestre`,
            attendu: t.decouvert,
            calcul: `${eur(t.besoin)} × ${pct(e.taux)} × ${t.joursDeDecouvert} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(t.decouvert)}`,
          };
        };
        return [
          ligne(TRIMESTRE_A_REBOURS),
          ligne(TRIMESTRE_DU_CURSEUR),
          {
            libelle: "Surcoût de l'escompte de chaque facture",
            attendu: e.x.surcout,
            calcul: `${eur(e.x.escompteDeLAnnee)} − ${eur(e.x.decouvertEvite)} = ${eur(e.x.surcout)}`,
          },
        ];
      },
      explication: (c) => {
        const e = escompteChaqueTrimestre(c);
        return [
          `Le découvert de toute l'année ne coûte que ${eur(e.x.decouvertEvite)}. Escompter chaque facture coûterait ${eur(e.x.surcout)} de plus : on paierait l'escompte aux trimestres où le compte est créditeur, pour un argent dont ${e.f.entreprise} n'a pas besoin.`,
        ];
      },
    },
    {
      id: "le-quatrieme-trimestre",
      type: "curseur",
      titre: "Le trimestre où le découvert dure",
      notions: ["receivables_financing"],
      question: (c) => {
        const e = escompteChaqueTrimestre(c);
        const t = e.curseur;
        return `Au ${ordinal(TRIMESTRE_DU_CURSEUR)} trimestre, le compte est à découvert de ${eur(t.besoin)} en moyenne. Pour le couvrir, il faut escompter ${qte(t.facturesNecessaires)} factures (${eur(t.escompteDuBesoin)}). Faites varier les jours où le compte est débiteur, de 0 à ${JOURS_DU_TRIMESTRE} : une droite donne le coût de cet escompte, l'autre celui du découvert. Placez le curseur sur le plus grand nombre de jours où le découvert coûte encore moins, puis validez.`;
      },
      grandeur: () => ({ libelle: "Jours où le compte est débiteur", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: escompteChaqueTrimestre(c).joursOuLeDecouvertCouteMoins, min: 0, max: JOURS_DU_TRIMESTRE }),
      zones: ["Le découvert coûte moins", "L'escompte coûte moins"],
      rates: () => ({
        dessous: "Le découvert coûte encore moins un peu plus loin : cherchez le plus grand nombre de jours.",
        dessus: "À ce nombre de jours, le découvert coûte déjà plus que l'escompte.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, j) => {
        const e = escompteChaqueTrimestre(c);
        const decouvert = coutDuDecouvert(e.curseur.besoin, e.taux, j);
        return [
          { libelle: "Escompte des factures qui couvrent le besoin", montant: e.curseur.escompteDuBesoin },
          { libelle: "Découvert de ces jours", montant: decouvert },
          { libelle: "Ce que l'escompte coûte de plus", montant: auCentime(e.curseur.escompteDuBesoin - decouvert), fort: true },
        ];
      },
      droites: (c) => {
        const e = escompteChaqueTrimestre(c);
        return {
          produit: () => e.curseur.escompteDuBesoin,
          cout: (j) => (e.curseur.besoin * e.taux * j) / JOURS_DE_L_ANNEE_BANCAIRE,
          libelles: ["Escompte des factures qui couvrent le besoin", "Découvert de ces jours"],
        };
      },
      explication: (c) => {
        const e = escompteChaqueTrimestre(c);
        const t = e.curseur;
        return [
          `Jusqu'à ${e.joursOuLeDecouvertCouteMoins} jours, le découvert coûte moins que l'escompte de ${qte(t.facturesNecessaires)} factures ; le ${ordinal(TRIMESTRE_DU_CURSEUR)} trimestre en compte ${t.joursDeDecouvert} : l'escompte gagne, ${eur(t.escompteDuBesoin)} contre ${eur(t.decouvert)}.`,
          `Le seuil n'est pas les ${e.k.joursQuiValentLEscompte} jours du chapitre : on escompte des factures entières, ${eur(t.facturesNecessaires * e.k.fct.ttc)} pour un besoin de ${eur(t.besoin)}, et l'escompte de ce qui dépasse le besoin se paie aussi.`,
        ];
      },
    },
    {
      id: "au-mieux",
      type: "montants",
      titre: "L'escompte là où il vaut",
      notions: ["receivables_financing", "net_treasury"],
      question: (c) => {
        const e = escompteChaqueTrimestre(c);
        return `Au ${ordinal(TRIMESTRE_A_REBOURS)} trimestre, il faudrait aussi ${qte(e.t(TRIMESTRE_A_REBOURS).facturesNecessaires)} factures pour couvrir le besoin. Combien de jours de découvert ce trimestre-là coûteraient-ils autant que leur escompte (au dixième) ? Dites alors ce que coûte ce trimestre au mieux, puis l'année au mieux, en choisissant pour chaque trimestre le moins cher de l'escompte et du découvert.`;
      },
      champs: (c) => {
        const e = escompteChaqueTrimestre(c);
        const t = e.t(TRIMESTRE_A_REBOURS);
        const auMieux = (n: number) => (e.t(n).mieux === "escompte" ? e.t(n).escompteDuBesoin : e.t(n).decouvert);
        return [
          {
            libelle: `Jours de découvert qui valent l'escompte, au ${ordinal(TRIMESTRE_A_REBOURS)} trimestre`,
            attendu: e.joursARebours,
            calcul: `${eur(t.escompteDuBesoin)} ÷ (${eur(t.besoin)} × ${pct(e.taux)} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE}) = ${qte(e.joursARebours)} jours`,
            tolerance: 0.1,
          },
          {
            libelle: `Coût du ${ordinal(TRIMESTRE_A_REBOURS)} trimestre, au mieux`,
            attendu: auMieux(TRIMESTRE_A_REBOURS),
            calcul: `${t.joursDeDecouvert} jours, sous les ${qte(e.joursARebours)} : ${t.mieux === "escompte" ? "l'escompte" : "le découvert"}, ${eur(auMieux(TRIMESTRE_A_REBOURS))}`,
          },
          {
            libelle: "Coût de l'année, au mieux",
            attendu: e.x.auMieux,
            calcul: `${e.x.trimestres
              .filter((x) => x.mieux !== "rien")
              .map((x) => eur(x.mieux === "escompte" ? x.escompteDuBesoin : x.decouvert))
              .join(" + ")} = ${eur(e.x.auMieux)}`,
          },
        ];
      },
      explication: (c) => {
        const e = escompteChaqueTrimestre(c);
        return [
          `Au mieux, l'année coûte ${eur(e.x.auMieux)} : le découvert au ${ordinal(TRIMESTRE_A_REBOURS)} trimestre, court, et l'escompte au ${ordinal(TRIMESTRE_DU_CURSEUR)}, où le découvert dure. C'est ${eur(e.economie)} de moins que l'escompte de chaque facture, et ${eur(auCentime(e.x.decouvertEvite - e.x.auMieux))} de moins que le découvert seul.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["receivables_financing"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: (c) => {
        const e = escompteChaqueTrimestre(c);
        const x = e.x;
        const chiffres = `Escompter chaque facture coûte ${eur(x.escompteDeLAnnee)} ; le découvert de l'année, ${eur(x.decouvertEvite)} ; au mieux, ${eur(x.auMieux)}.`;
        return [
          {
            texte: `Escompter au ${ordinal(TRIMESTRE_DU_CURSEUR)} trimestre seulement, pas chaque trimestre`,
            juste: e.verdict === "au-cas-par-cas",
            retour:
              e.verdict === "au-cas-par-cas"
                ? `Oui. ${chiffres} L'escompte ne vaut que là où le découvert dure : au-delà de ${e.joursOuLeDecouvertCouteMoins} jours au ${ordinal(TRIMESTRE_DU_CURSEUR)} trimestre. Signer pour toute l'année, c'est payer ${eur(e.economie)} de plus pour de l'argent dont ${e.f.entreprise} n'a pas toujours besoin.`
                : `Non. ${chiffres}`,
          },
          {
            texte: `Signer : l'escompte à ${pct(e.k.b.escompte.taux)} coûte moins que le découvert à ${pct(e.taux)}`,
            juste: false,
            retour: `Non : c'est comparer des taux sans leurs jours. L'escompte paie ses ${e.k.ct.delaiConvenu} jours sur chaque facture, le découvert seulement les jours où le compte est débiteur. ${chiffres}`,
          },
          {
            texte: `Ne rien escompter : le découvert de l'année ne coûte que ${eur(x.decouvertEvite)}`,
            juste: e.verdict === "jamais",
            retour: e.verdict === "jamais" ? `Oui. ${chiffres}` : `Non : c'est oublier le ${ordinal(TRIMESTRE_DU_CURSEUR)} trimestre, où le découvert dure ${e.curseur.joursDeDecouvert} jours et coûte plus que l'escompte. ${chiffres}`,
          },
          {
            texte: "Signer : plus de découvert, et l'argent des clients rentre plus tôt",
            juste: e.verdict === "chaque-trimestre",
            retour: e.verdict === "chaque-trimestre" ? `Oui. ${chiffres}` : `Non : l'escompte ne crée pas d'argent, il l'avance contre un coût. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
