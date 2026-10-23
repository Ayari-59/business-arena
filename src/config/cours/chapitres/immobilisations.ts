import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import type { Cas } from "../cas";
import { dateDuCours as date, moisEtJour } from "../dates";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : IMMOBILISATIONS ET AMORTISSEMENTS (comptabilité générale, palier 3).
 *
 * L'équipement acheté le 6 janvier dans le chapitre pilote, suivi sur toute sa vie. Sa
 * durée d'utilisation est celle de la simulation (la durée d'amortissement du catalogue
 * d'équipements) ; l'amortissement est linéaire, au prorata du temps d'utilisation la
 * première année, en année commerciale (360 jours, mois de 30 jours) comme on le compte
 * en cours de comptabilité. L'élève bâtit le plan d'amortissement, passe la dotation du
 * 31 décembre, comprend qu'elle ne sort pas d'argent, prolonge le plan jusqu'à la
 * dernière année, puis calcule ce que donne une revente en cours de route.
 *
 * La revente se fait au prix que l'arène en donnerait : une fraction de la valeur nette
 * comptable, celle du catalogue. Elle donne donc toujours une moins-value. Le chapitre en
 * calcule le résultat sans en passer les écritures, qui relèvent d'un palier suivant.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** L'année commerciale du prorata : douze mois de trente jours. */
const ANNEE_COMMERCIALE = 360;
const JOURS_PAR_MOIS = 30;
const MOIS_PAR_AN = 12;
/** La revente : le 30 juin de la troisième année d'utilisation. */
const ANNEE_DE_REVENTE = 3;
const JOUR_DE_REVENTE = 181;
const FIN_D_ANNEE = 365;
const ORDINAUX = ["première", "deuxième", "troisième", "quatrième", "cinquième"];
const annee = (k: number) => `${ORDINAUX[k - 1]} année`;

const auCent = (x: number) => Math.round(x / 100) * 100;

/** Le compte d'amortissement d'une immobilisation : 28 suivi de son numéro sans le 2. */
export const compteDAmortissement = (compte: string) => `28${compte.slice(1)}`;

/** Le plan d'amortissement de l'équipement, et sa revente. */
export function planDAmortissement(c: Cas) {
  const i = c.immobilisation;
  const duree = c.gestion.dureeAmortissementMois / MOIS_PAR_AN;
  const taux = 1 / duree;
  const annuite = auCentime(i.ht * taux);
  const { mois, jour } = moisEtJour(i.date);
  // Le jour de la mise en service compte : du 6 au 30 janvier, 25 jours.
  const joursPremiereAnnee = JOURS_PAR_MOIS - jour + 1 + (MOIS_PAR_AN - 1 - mois) * JOURS_PAR_MOIS;
  const premiere = auCentime((annuite * joursPremiereAnnee) / ANNEE_COMMERCIALE);
  const derniere = auCentime(i.ht - premiere - annuite * (duree - 1));
  const vncAnnee = (k: number) => auCentime(i.ht - premiere - annuite * (k - 1));
  const revente = moisEtJour(JOUR_DE_REVENTE);
  const joursRevente = revente.mois * JOURS_PAR_MOIS + Math.min(revente.jour, JOURS_PAR_MOIS);
  const dotationRevente = auCentime((annuite * joursRevente) / ANNEE_COMMERCIALE);
  const cumulRevente = auCentime(premiere + annuite * (ANNEE_DE_REVENTE - 2) + dotationRevente);
  const vncRevente = auCentime(i.ht - cumulRevente);
  const prixRevente = auCent(vncRevente * i.ratioDeRevente);
  return {
    base: i.ht,
    duree,
    taux,
    annuite,
    joursPremiereAnnee,
    premiere,
    vncFinAnnee1: vncAnnee(1),
    vncFinAnnee2: vncAnnee(2),
    derniere,
    derniereAnnee: duree + 1,
    joursRevente,
    dotationRevente,
    cumulRevente,
    vncRevente,
    prixRevente,
    resultatRevente: auCentime(prixRevente - vncRevente),
    compteAmortissement: compteDAmortissement(i.compte),
  };
}

export const IMMOBILISATIONS: Chapitre = {
  code: "immobilisations",
  parcours: "comptabilite-generale",
  palier: 3,
  titre: "Immobilisations et amortissements",
  accroche:
    "L'équipement de l'entreprise, de son achat à sa revente : ce qu'il coûte chaque année, ce que vaut ce qui en reste, et pourquoi l'amortissement ne sort pas d'argent.",
  objectifs: [
    "Distinguer ce qui entre dans le coût d'une immobilisation et ce qui est une charge",
    "Bâtir un plan d'amortissement linéaire, avec le prorata de la première année",
    "Enregistrer la dotation aux amortissements",
    "Lire la valeur nette comptable au bilan",
    "Calculer le résultat d'une revente : la valeur nette comptable face au prix",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un équipement qui s'use",
      notions: ["depreciation"],
      texte: (c) => {
        const p = planDAmortissement(c);
        return [
          `Le ${date(c.immobilisation.date)}, ${c.entreprise} achète son équipement : ${c.immobilisation.designation}, ${eur(p.base)} hors taxes. Dans l'arène, il sert ${qte(p.duree)} ans avant d'être usé.`,
          "Le premier chapitre l'a mis à l'actif sans toucher au résultat. Mais l'entreprise le consomme peu à peu : chaque année, une part de sa valeur devient une charge, la dotation aux amortissements. C'est ainsi que son prix se répartit sur les années où il sert.",
          `Ici, l'amortissement est linéaire : la même charge chaque année pleine. La première année, il commence le jour de la mise en service, le ${date(c.immobilisation.date)} : on n'en compte qu'une partie, au prorata du temps, en mois de ${qte(JOURS_PAR_MOIS)} jours.`,
        ];
      },
      repere: () =>
        "Amortir, c'est répartir le coût d'un équipement sur sa durée d'utilisation. La dotation est une charge, mais elle ne fait sortir aucun argent : l'équipement a été payé à l'achat.",
    },
    {
      id: "acquisition",
      type: "ecriture",
      titre: "L'achat de l'équipement",
      notions: ["depreciation"],
      evenement: (c) =>
        `Le ${date(c.immobilisation.date)}, ${c.entreprise} reçoit son équipement (${c.immobilisation.designation}) et règle la facture par virement : ${eur(c.immobilisation.ht)} hors taxes, ${eur(c.immobilisation.tva)} de TVA.`,
      ecriture: (c) => ({
        date: date(c.immobilisation.date),
        libelle: `Achat : ${c.immobilisation.designation}`,
        lignes: [
          { role: "l'équipement, au prix hors taxes", compte: c.immobilisation.compte, acceptes: c.immobilisation.acceptes, sens: "debit", montant: c.immobilisation.ht, indice: "le montant hors taxes de la facture" },
          { role: "la TVA déductible", compte: "44562", acceptes: ["44566"], sens: "debit", montant: c.immobilisation.tva, indice: "le montant de TVA de la facture" },
          { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.immobilisation.ttc, indice: "le montant réglé, taxes comprises" },
        ],
      }),
      indices: (c) => [
        `Un équipement qui servira plusieurs années : une immobilisation, classe 2. Cherchez le compte qui correspond à « ${c.immobilisation.designation} ».`,
        "La TVA sur une immobilisation se déduit : TVA déductible sur immobilisations. La banque paie le total.",
      ],
      explication: (c) => [
        `L'équipement entre à l'actif pour ${eur(c.immobilisation.ht)} : c'est sa valeur brute, celle sur laquelle il s'amortira.`,
      ],
      vue: "immobilisation",
    },
    {
      id: "frais-accessoires",
      type: "choix",
      titre: "La livraison et l'installation",
      notions: ["depreciation"],
      question: () => "Le fournisseur facture aussi, à part, la livraison et l'installation de l'équipement. Où vont ces frais ?",
      options: () => [
        {
          texte: "Dans le coût de l'équipement : ils s'amortissent avec lui.",
          juste: true,
          retour:
            "C'est la règle : le coût d'une immobilisation comprend son prix et les frais nécessaires pour la mettre en état de servir (transport, installation, montage). Ils entrent à l'actif et s'amortissent avec elle.",
        },
        {
          texte: "En charges de l'année : ce sont des services, pas un équipement.",
          juste: false,
          retour:
            "Sans livraison ni installation, l'équipement ne servirait pas : ces frais font partie de ce qu'il coûte. Ils s'ajoutent à sa valeur à l'actif.",
        },
        {
          texte: "Nulle part : le fournisseur aurait dû les inclure dans son prix.",
          juste: false,
          retour: "Ils sont facturés, l'entreprise les paie : ils s'enregistrent, et avec l'équipement, puisqu'ils servent à le mettre en service.",
        },
      ],
    },
    {
      id: "plan",
      type: "montants",
      titre: "Le plan d'amortissement",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `Base amortissable : ${eur(p.base)}. Durée d'utilisation : ${qte(p.duree)} ans, amortissement linéaire. Mise en service le ${date(c.immobilisation.date)}. Calculez la première année du plan, en comptant les mois pour ${qte(JOURS_PAR_MOIS)} jours et l'année pour ${qte(ANNEE_COMMERCIALE)}.`;
      },
      champs: (c) => {
        const p = planDAmortissement(c);
        const { jour } = moisEtJour(c.immobilisation.date);
        return [
          { libelle: "Taux d'amortissement, en %", attendu: auCentime(p.taux * 100), calcul: `100 % ÷ ${qte(p.duree)} ans = ${pct(p.taux)}` },
          { libelle: "Annuité d'une année pleine", attendu: p.annuite, calcul: `${eur(p.base)} × ${pct(p.taux)} = ${eur(p.annuite)}` },
          {
            libelle: "Jours d'utilisation la première année",
            attendu: p.joursPremiereAnnee,
            calcul: `du ${jour} au ${JOURS_PAR_MOIS} janvier, ${qte(JOURS_PAR_MOIS - jour + 1)} jours, puis ${qte(MOIS_PAR_AN - 1)} mois de ${qte(JOURS_PAR_MOIS)} jours : ${qte(p.joursPremiereAnnee)} jours`,
          },
          {
            libelle: "Dotation de la première année",
            attendu: p.premiere,
            calcul: `${eur(p.annuite)} × ${qte(p.joursPremiereAnnee)} ÷ ${qte(ANNEE_COMMERCIALE)} = ${eur(p.premiere)}`,
          },
          { libelle: "Valeur nette comptable au 31 décembre", attendu: p.vncFinAnnee1, calcul: `${eur(p.base)} − ${eur(p.premiere)} = ${eur(p.vncFinAnnee1)}` },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `L'équipement n'a servi que ${qte(p.joursPremiereAnnee)} jours sur ${qte(ANNEE_COMMERCIALE)} : la première dotation, ${eur(p.premiere)}, est un peu moins qu'une annuité pleine. Ce qui manque sera pris la dernière année.`,
          `Au 31 décembre, l'équipement vaut ${eur(p.vncFinAnnee1)} dans les comptes : sa valeur nette comptable, la valeur brute moins les amortissements.`,
        ];
      },
    },
    {
      id: "dotation",
      type: "ecriture",
      titre: "La dotation du 31 décembre",
      notions: ["depreciation"],
      evenement: (c) => {
        const p = planDAmortissement(c);
        return `Le 31 décembre, le comptable de ${c.entreprise} enregistre l'amortissement de l'année : ${eur(p.premiere)}.`;
      },
      ecriture: (c) => {
        const p = planDAmortissement(c);
        const compte = c.immobilisation.compte;
        return {
          date: date(FIN_D_ANNEE),
          libelle: "Dotation aux amortissements de l'année",
          lignes: [
            { role: "la charge de l'année, la dotation", compte: "6811", acceptes: ["681"], sens: "debit", montant: p.premiere, indice: "la dotation de la première année" },
            {
              role: "l'amortissement de l'équipement",
              compte: p.compteAmortissement,
              acceptes: [`28${compte.slice(1, 3)}`, "281"],
              sens: "credit",
              montant: p.premiere,
              indice: "la dotation de la première année",
            },
          ],
        };
      },
      indices: (c) => [
        "Au débit, une charge : les dotations aux amortissements, classe 6.",
        `Au crédit, pas le compte de l'équipement : on garde sa valeur d'achat intacte, et l'on cumule l'usure à part, dans un compte d'amortissement. Son numéro : 28, puis celui de l'équipement sans le 2 (${c.immobilisation.compte}).`,
      ],
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `Le compte ${c.immobilisation.compte} garde ${eur(p.base)}, ce que l'équipement a coûté. Le compte ${p.compteAmortissement} (${intituleDe(p.compteAmortissement)}) porte l'usure cumulée : au bilan, il vient en moins, et l'équipement apparaît pour sa valeur nette, ${eur(p.vncFinAnnee1)}.`,
        ];
      },
      vue: "immobilisation",
    },
    {
      id: "tresorerie",
      type: "choix",
      titre: "Une charge sans argent",
      notions: ["depreciation", "net_treasury"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `La dotation de ${eur(p.premiere)} fait baisser le résultat de l'année. Fait-elle aussi baisser la banque ?`;
      },
      options: (c) => [
        {
          texte: "Oui, de la même somme : une charge se paie.",
          juste: false,
          retour: `Pas celle-ci. Personne n'est payé le 31 décembre : l'équipement l'a été le ${date(c.immobilisation.date)}, en une fois.`,
        },
        {
          texte: "Non : l'argent est sorti à l'achat. La dotation répartit ce coût sur les années, sans nouveau paiement.",
          juste: true,
          retour:
            "C'est cela. Une dotation est une charge calculée, pas décaissée. C'est pourquoi une entreprise peut afficher une perte et garder de la trésorerie, et pourquoi l'analyse financière rajoute les dotations au résultat pour mesurer ce que l'activité dégage vraiment.",
        },
        {
          texte: "Non, mais elle la fera baisser à la fin de la durée d'utilisation, quand il faudra remplacer l'équipement.",
          juste: false,
          retour: "Remplacer l'équipement sera un nouvel achat, une nouvelle immobilisation. La dotation, elle, ne sort jamais d'argent.",
        },
      ],
      vue: "resultat",
    },
    {
      id: "annees-suivantes",
      type: "montants",
      titre: "La suite du plan",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `Prolongez le plan d'amortissement. La deuxième année est une année pleine. L'équipement aura servi ${qte(p.duree)} ans quand il sera entièrement amorti : la dernière dotation reprend ce que la première n'a pas pris.`;
      },
      champs: (c) => {
        const p = planDAmortissement(c);
        return [
          { libelle: "Dotation de la deuxième année", attendu: p.annuite, calcul: `une annuité pleine : ${eur(p.annuite)}` },
          {
            libelle: "Valeur nette comptable à la fin de la deuxième année",
            attendu: p.vncFinAnnee2,
            calcul: `${eur(p.base)} − ${eur(p.premiere)} − ${eur(p.annuite)} = ${eur(p.vncFinAnnee2)}`,
          },
          {
            libelle: "Numéro de la dernière année d'amortissement",
            attendu: p.derniereAnnee,
            calcul: `une première année partielle, ${qte(p.duree - 1)} années pleines, puis une dernière année : la ${qte(p.derniereAnnee)}e`,
          },
          {
            libelle: "Dotation de la dernière année",
            attendu: p.derniere,
            calcul: `${eur(p.base)} − ${eur(p.premiere)} − ${qte(p.duree - 1)} × ${eur(p.annuite)} = ${eur(p.derniere)}`,
          },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `Le plan s'étale sur ${qte(p.derniereAnnee)} exercices pour ${qte(p.duree)} ans d'utilisation : la première et la dernière année se partagent une annuité. Au bout du compte, les dotations font exactement ${eur(p.base)}, et la valeur nette comptable tombe à zéro.`,
        ];
      },
    },
    {
      id: "revente",
      type: "montants",
      titre: "Et si on le revendait ?",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        return `${c.entreprise} revend son équipement le ${date(JOUR_DE_REVENTE)} de la ${annee(ANNEE_DE_REVENTE)}, pour ${eur(p.prixRevente)}. Avant de le sortir des comptes, on l'amortit jusqu'au jour de la revente. Calculez ce que la revente fait perdre.`;
      },
      champs: (c) => {
        const p = planDAmortissement(c);
        return [
          {
            libelle: `Dotation de la ${annee(ANNEE_DE_REVENTE)}, jusqu'au ${date(JOUR_DE_REVENTE)}`,
            attendu: p.dotationRevente,
            calcul: `${eur(p.annuite)} × ${qte(p.joursRevente)} ÷ ${qte(ANNEE_COMMERCIALE)} = ${eur(p.dotationRevente)}`,
          },
          {
            libelle: `Amortissements cumulés au ${date(JOUR_DE_REVENTE)}`,
            attendu: p.cumulRevente,
            calcul: `${eur(p.premiere)} + ${qte(ANNEE_DE_REVENTE - 2)} × ${eur(p.annuite)} + ${eur(p.dotationRevente)} = ${eur(p.cumulRevente)}`,
          },
          { libelle: `Valeur nette comptable au ${date(JOUR_DE_REVENTE)}`, attendu: p.vncRevente, calcul: `${eur(p.base)} − ${eur(p.cumulRevente)} = ${eur(p.vncRevente)}` },
          {
            libelle: "Moins-value de la revente",
            attendu: -p.resultatRevente,
            calcul: `${eur(p.vncRevente)} − ${eur(p.prixRevente)} = ${eur(-p.resultatRevente)} de perte`,
          },
        ];
      },
      explication: (c) => {
        const p = planDAmortissement(c);
        return [
          `L'équipement valait ${eur(p.vncRevente)} dans les comptes ; l'acheteur n'en donne que ${eur(p.prixRevente)}. La revente coûte ${eur(-p.resultatRevente)} : une moins-value. Dans l'arène aussi, un équipement d'occasion se revend en dessous de sa valeur nette.`,
          "Une moins-value dit que l'amortissement a été moins rapide que la perte de valeur réelle. Elle n'est pas une erreur : l'amortissement répartit un coût, il ne prédit pas un prix de marché.",
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["depreciation"],
      texte: (c) => {
        const p = planDAmortissement(c);
        return [
          `Vous avez suivi l'équipement de ${c.entreprise} sur toute sa vie : son coût, un plan d'amortissement de ${qte(p.derniereAnnee)} exercices, la dotation du 31 décembre, et ce que donnerait sa revente.`,
          "Dans le compte de résultat, l'équipement coûte chaque année sa dotation ; au bilan, il vaut sa valeur nette comptable ; dans la banque, il n'a coûté qu'une fois, le jour de l'achat.",
        ];
      },
      repere: () =>
        "Valeur brute au compte 2, usure cumulée au compte 28, dotation de l'année au 6811 : la valeur nette comptable, c'est la valeur brute moins les amortissements.",
    },
  ],
};
