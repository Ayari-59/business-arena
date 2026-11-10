import { eur } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { informationComptable } from "../../chapitres/le-systeme-d-information-comptable";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
import { totauxDeLaBalance } from "../../monde/systeme-d-information-comptable";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE SYSTÈME D'INFORMATION COMPTABLE » : LA BALANCE QUI NE TOMBE PAS
 * JUSTE (Bac STMG, gestion et finance, palier 1).
 *
 * Pour un rendez-vous à la banque, un stagiaire a recopié à la main, dans un tableur, la balance
 * avant inventaire de NOVA. Les totaux ne tombent pas juste. L'élève refait seul les calculs du
 * chapitre (les totaux de la balance, le solde du compte des clients au grand livre), trouve la
 * ligne fausse et rend sa réponse : la balance juste, et la façon d'éviter l'erreur.
 *
 * Le cas est neuf par sa question : le chapitre vérifie qu'une balance juste s'équilibre ; le cas
 * part d'une balance fausse et remonte au grand livre pour trouver l'erreur. La balance, le compte
 * des clients et leurs totaux sont ceux du chapitre (`informationComptable`).
 */

/** Le compte que le stagiaire a mal recopié : celui des clients. */
export const COMPTE_MAL_RECOPIE = "411";

/**
 * L'ERREUR DE RECOPIE (HYPOTHÈSE DU CAS) : le deuxième et le troisième chiffre du solde du compte
 * des clients inversés (101 598 € recopiés 110 598 €), l'erreur la plus courante d'une saisie à la main.
 */
export const inverserDeuxChiffres = (x: number) => Number(String(Math.trunc(x)).replace(/^(\d)(\d)(\d)/, "$1$3$2")) + auCentime(x - Math.trunc(x));

const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La balance recopiée, ses totaux, l'écart, et ce que dit le grand livre. */
export function balanceRecopiee(c: Pick<Cas, "code">) {
  const k = informationComptable(c);
  const juste = k.balance.find((l) => l.compte === COMPTE_MAL_RECOPIE)!;
  const recopie = inverserDeuxChiffres(juste.debit);
  const balance = k.balance.map((l) => (l.compte === COMPTE_MAL_RECOPIE ? { ...l, debit: recopie } : l));
  const totaux = totauxDeLaBalance(balance);
  return { ...k, juste: juste.debit, recopie, balanceFausse: balance, totauxFaux: totaux, ecart: totaux.ecart };
}

function tableauDeLaBalanceRecopiee(b: ReturnType<typeof balanceRecopiee>): TableauDeDonnees {
  return {
    titre: "La balance recopiée par le stagiaire",
    colonnes: ["Débit", "Crédit"],
    lignes: b.balanceFausse.map((l) => ({ libelle: `${l.compte} ${l.intitule}`, valeurs: [l.debit ? eur(l.debit) : "", l.credit ? eur(l.credit) : ""] })),
  };
}

export const LA_BALANCE_QUI_NE_TOMBE_PAS_JUSTE: Situation = {
  code: "la-balance-qui-ne-tombe-pas-juste",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["le-systeme-d-information-comptable"],
  commanditaire: "La direction",
  titre: "La balance qui ne tombe pas juste",
  accroche:
    "Un stagiaire a recopié la balance à la main pour la banque, et les totaux ne tombent pas juste. Trouvez la ligne fausse avant le rendez-vous.",
  objectifs: [
    "Calculer les totaux d'une balance et leur écart",
    "Calculer le solde d'un compte au grand livre",
    "Trouver la ligne fausse et rétablir la balance",
    "Rédiger une réponse à la direction",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend la balance avant inventaire de NOVA, celle du chapitre, dans la simulation du cours ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: (c) => tableauDeLaBalanceRecopiee(balanceRecopiee(c)),
      texte: (c) => {
        const b = balanceRecopiee(c);
        return [
          `« Pour le rendez-vous à la banque, notre stagiaire a recopié dans un tableur la balance ${dE(b.entreprise)} au 31 décembre. Les totaux ne tombent pas juste. Trouvez l'erreur, et dites-nous comment l'éviter la prochaine fois. »`,
          "Pas de cours cette fois : vous avez la balance recopiée, et le grand livre du compte des clients. Les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : les totaux de la balance recopiée et leur écart, le solde du compte des clients au grand livre, la ligne fausse, le total juste, et votre réponse.",
    },
    {
      id: "les-totaux",
      type: "montants",
      titre: "Les totaux de la balance recopiée",
      notions: ["balance_sheet"],
      question: () => "Calculez le total des soldes débiteurs et celui des soldes créditeurs de la balance recopiée, puis leur écart (débits moins crédits).",
      champs: (c) => {
        const b = balanceRecopiee(c);
        return [
          { libelle: "Total des soldes débiteurs", attendu: b.totauxFaux.debit, calcul: `${b.balanceFausse.filter((l) => l.debit).map((l) => eur(l.debit)).join(" + ")} = ${eur(b.totauxFaux.debit)}` },
          { libelle: "Total des soldes créditeurs", attendu: b.totauxFaux.credit, calcul: `${b.balanceFausse.filter((l) => l.credit).map((l) => eur(l.credit)).join(" + ")} = ${eur(b.totauxFaux.credit)}` },
          { libelle: "Écart", attendu: b.ecart, calcul: `${eur(b.totauxFaux.debit)} − ${eur(b.totauxFaux.credit)} = ${eur(b.ecart)}` },
        ];
      },
      explication: (c) => {
        const b = balanceRecopiee(c);
        return [`${b.ecart > 0 ? "Les débits dépassent les crédits" : "Les crédits dépassent les débits"} de ${eur(Math.abs(b.ecart))} : une ligne au moins a été mal recopiée.`];
      },
    },
    {
      id: "le-grand-livre",
      type: "montants",
      titre: "Le compte des clients au grand livre",
      notions: ["payment_terms"],
      tableau: (c) => {
        const g = balanceRecopiee(c).clients;
        return {
          titre: "Le compte 411 Clients au grand livre, de janvier à décembre",
          colonnes: ["Total"],
          lignes: [
            { libelle: "Total du débit (les factures)", valeurs: [eur(g.debit)] },
            { libelle: "Total du crédit (les règlements)", valeurs: [eur(g.credit)] },
          ],
        };
      },
      question: () => "Le stagiaire a commencé par la plus grosse ligne de l'actif après la banque. Calculez le solde du compte des clients au grand livre.",
      champs: (c) => {
        const g = balanceRecopiee(c).clients;
        return [{ libelle: "Solde du compte 411 au grand livre", attendu: g.solde, calcul: `${eur(g.debit)} − ${eur(g.credit)} = ${eur(g.solde)}` }];
      },
      explication: (c) => {
        const b = balanceRecopiee(c);
        return [`Le grand livre dit ${eur(b.clients.solde)} ; la balance recopiée dit ${eur(b.recopie)}. L'écart entre les deux est celui des totaux.`];
      },
    },
    {
      id: "la-ligne-fausse",
      type: "choix",
      titre: "La ligne fausse",
      question: () => "Qu'en concluez-vous ?",
      options: (c) => {
        const b = balanceRecopiee(c);
        return [
          {
            texte: `La ligne ${COMPTE_MAL_RECOPIE} : deux chiffres inversés`,
            juste: true,
            retour: `Oui : ${eur(b.juste)} est devenu ${eur(b.recopie)}. L'écart, ${eur(b.ecart)}, est exactement celui des totaux : c'est la seule erreur.`,
          },
          {
            texte: "Le grand livre est faux : c'est lui qu'il faut corriger",
            juste: false,
            retour: "Non : le grand livre vient directement du journal. C'est la recopie à la main qui a introduit l'erreur.",
          },
          {
            texte: `Il manque une ligne de ${eur(b.ecart)} au crédit de la balance`,
            juste: false,
            retour: `Non : aucune ligne ne manque. Le compte des clients a ${eur(b.ecart)} de trop au débit.`,
          },
        ];
      },
    },
    {
      id: "le-total-juste",
      type: "montants",
      titre: "La balance rétablie",
      notions: ["balance_sheet"],
      question: () => "La ligne 411 corrigée, calculez le total juste des soldes débiteurs.",
      champs: (c) => {
        const b = balanceRecopiee(c);
        return [{ libelle: "Total juste des soldes débiteurs", attendu: b.totaux.debit, calcul: `${eur(b.totauxFaux.debit)} − ${eur(b.ecart)} = ${eur(b.totaux.debit)}` }];
      },
      explication: (c) => {
        const b = balanceRecopiee(c);
        return [`${eur(b.totaux.debit)} au débit comme au crédit : la balance est rétablie.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle réponse envoyez-vous à la direction ?",
      options: (c) => {
        const b = balanceRecopiee(c);
        return [
          {
            texte: `Le compte clients est de ${eur(b.juste)} ; éditons la balance depuis le logiciel`,
            juste: true,
            retour: `Oui : la balance corrigée tombe juste à ${eur(b.totaux.debit)}. Éditée par le logiciel ou le PGI à partir des écritures, elle ne se recopie plus : l'erreur ne peut plus se produire.`,
          },
          {
            texte: `Retirons ${eur(b.ecart)} d'une autre ligne au débit pour équilibrer la balance avant le rendez-vous`,
            juste: false,
            retour: "Non : ce serait cacher l'erreur sous une autre. Une balance s'équilibre en corrigeant la ligne fausse, pas en forçant un total.",
          },
          {
            texte: "La balance ne tombe jamais juste au centime : la banque comprendra très bien l'écart",
            juste: false,
            retour: "Non : la partie double garantit une balance juste au centime. Un écart signale toujours une erreur.",
          },
          {
            texte: `Le compte clients est de ${eur(b.recopie)} ; c'est le grand livre qu'il faut corriger`,
            juste: false,
            retour: `Non : le grand livre dit ${eur(b.juste)}, et c'est lui qui vient des écritures. La ligne recopiée est fausse.`,
          },
        ];
      },
    },
  ],
};
