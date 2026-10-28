import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { prudenceDeNova } from "../../chapitres/depreciations-et-provisions";
import { ENTREPRISES_DE_LA_CLOTURE, dateDe } from "../../chapitres/la-cloture";
import type { DateDuCours } from "../../monde/amortissement";
import { ajustementDeDepreciation, perteSurCreance } from "../../monde/cloture";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DÉPRÉCIATIONS ET PROVISIONS » : LA CRÉANCE QUI SE DÉGRADE (comptabilité
 * générale, palier 4).
 *
 * La créance de Sonora, en redressement judiciaire, a été dépréciée au 31 décembre N de la perte que le
 * mandataire laissait craindre. Les comptes de N sont arrêtés ; fin mars N+1, NOVA arrête une situation
 * intermédiaire pour sa banque, et le mandataire revoit la perte à la hausse. Le directeur financier
 * demande ce que cela coûte de plus, ce que vaudra la créance, et s'il faut revenir sur les comptes de
 * N. L'élève ajuste la dépréciation (le complément à doter et son écriture), lit la créance au bilan,
 * cherche au curseur ce que le liquidateur devra verser pour que la dépréciation suffise, puis croise
 * les deux estimations avec le dénouement de juin, celui du chapitre : le complément n'a fait
 * qu'avancer une charge que la reprise rend. La réponse demande un jugement : on dote le complément,
 * sans corriger l'exercice clos.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : la créance,
 * sa TVA, la première dépréciation et le dénouement de juin sont ceux de `prudenceDeNova` ; la
 * situation de mars et la nouvelle estimation sont des hypothèses du cas.
 */

/** LA DATE OÙ LES COMPTES DE N ONT ÉTÉ ARRÊTÉS, hypothèse du cas : le 28 février N+1. */
export const ARRETE_DES_COMPTES_DE_N: DateDuCours = { jour: 28, mois: 2, exercice: 1 };

/** LA SITUATION INTERMÉDIAIRE, hypothèse du cas : NOVA arrête ses comptes au 31 mars N+1 pour sa banque. */
export const DATE_DE_LA_SITUATION: DateDuCours = { jour: 31, mois: 3, exercice: 1 };

/**
 * LA PERTE QUE LE MANDATAIRE LAISSE CRAINDRE FIN MARS, hypothèse du cas : 70 % de la créance hors
 * taxes. Le plan de redressement n'a pas été adopté ; un créancier sans garantie, payé après les
 * salariés, l'État et les banques, n'espère plus qu'une petite part.
 */
export const TAUX_DE_PERTE_REVU = 0.7;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Les chiffres de la réponse, calculés une fois de la prudence du chapitre. */
export function creanceQuiSeDegrade(c: Pick<Cas, "code">) {
  const y = prudenceDeNova(c);
  const d = y.d;
  const necessaire = auCentime(d.ht * TAUX_DE_PERTE_REVU);
  const complement = ajustementDeDepreciation(d.depreciation, necessaire).dotation;
  // Le dénouement de juin, celui du chapitre, face à la dépréciation portée à 70 %.
  const juin = perteSurCreance(y.creance.ttc, y.verse, y.f.tauxDeTva, necessaire);
  return {
    y,
    d,
    necessaire,
    complement,
    valeurNette: auCentime(y.creance.ttc - necessaire),
    // La plus petite part versée, en %, pour que la dépréciation portée à 70 % couvre la perte hors taxes.
    partQuiSuffit: Math.ceil((d.ht - necessaire) / y.unPoint - 1e-9),
    juin,
    effetDuDenouement: auCentime(juin.reprise - juin.perteHt),
    chargeNetteDeN1: auCentime(complement + juin.perteHt - juin.reprise),
    // Les erreurs classiques : doter toute la perte, en oubliant ce qui est déjà déprécié, ou calculer le complément TVA comprise.
    toutLaPerte: necessaire,
    surLeTtc: auCentime(y.creance.ttc * (TAUX_DE_PERTE_REVU - y.taux)),
  };
}

export const LA_CREANCE_QUI_SE_DEGRADE: Situation = {
  code: "la-creance-qui-se-degrade",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["depreciations-et-provisions"],
  commanditaire: "Le directeur financier",
  titre: "La créance qui se dégrade",
  accroche:
    "Fin mars, le mandataire de Sonora revoit la perte à la hausse. Le directeur financier veut savoir ce que cela coûte de plus, ce que vaut encore la créance, et s'il faut revenir sur les comptes de l'exercice clos.",
  objectifs: [
    "Ajuster une dépréciation déjà constatée à une estimation nouvelle, sur le hors taxes",
    "Enregistrer le complément de dépréciation et lire la valeur nette de la créance",
    "Croiser deux estimations avec le dénouement réel, et mesurer ce que chaque exercice porte",
    "Dire si une estimation nouvelle corrige l'exercice clos",
    "Rédiger une réponse chiffrée et argumentée au directeur financier",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CLOTURE,
    pourquoi: "ce cas reprend « Dépréciations et provisions », qui se joue sur la créance de Sonora, client de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur financier",
      texte: (c) => {
        const r = creanceQuiSeDegrade(c);
        const y = r.y;
        return [
          `« Nos comptes de N ont été arrêtés le ${dateDe(ARRETE_DES_COMPTES_DE_N)}, avec une dépréciation de ${pct(y.taux)} sur la créance de ${y.f.sonora.nom}. Pour la situation du ${dateDe(DATE_DE_LA_SITUATION)} que demande la banque, le mandataire laisse maintenant craindre une perte de ${pct(TAUX_DE_PERTE_REVU)}. Combien cela coûte-t-il de plus, que vaudra la créance, et faut-il revenir sur les comptes de N ? »`,
          "Pas de cours cette fois : vous avez le dossier de la créance, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = creanceQuiSeDegrade(c);
        const y = r.y;
        return {
          titre: `La créance de ${y.f.sonora.nom} · ${y.f.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Créance douteuse au compte 416, TVA comprise", valeurs: [eur(y.creance.ttc)] },
            { libelle: "TVA de la vente", valeurs: [pct(y.f.tauxDeTva)] },
            { libelle: "Perte probable estimée au 31 décembre N", valeurs: [pct(y.taux)] },
            { libelle: "Dépréciation constatée au compte 491", valeurs: [eur(r.d.depreciation)] },
            { libelle: `Perte probable estimée au ${dateDe(DATE_DE_LA_SITUATION)}`, valeurs: [pct(TAUX_DE_PERTE_REVU)] },
            { libelle: "Comptes de N arrêtés le", valeurs: [dateDe(ARRETE_DES_COMPTES_DE_N)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la dépréciation qu'il faut aujourd'hui et le complément à doter, son écriture, la valeur nette de la créance, ce que le liquidateur devra verser pour que la dépréciation suffise, ce que N+1 portera au dénouement de juin, et votre réponse.",
    },
    {
      id: "depreciation-necessaire",
      type: "montants",
      titre: "La dépréciation qu'il faut",
      notions: ["payment_terms"],
      question: () => "Calculez la créance hors taxes, la dépréciation qu'appelle la nouvelle estimation, puis ce qu'il faut doter en plus de ce qui est déjà constaté.",
      champs: (c) => {
        const r = creanceQuiSeDegrade(c);
        const y = r.y;
        return [
          { libelle: "Créance hors taxes", attendu: r.d.ht, calcul: `${eur(y.creance.ttc)} ÷ ${qte(1 + y.f.tauxDeTva)} = ${eur(r.d.ht)}` },
          { libelle: "Dépréciation nécessaire", attendu: r.necessaire, calcul: `${eur(r.d.ht)} × ${pct(TAUX_DE_PERTE_REVU)} = ${eur(r.necessaire)}` },
          { libelle: "Complément à doter", attendu: r.complement, calcul: `${eur(r.necessaire)} − ${eur(r.d.depreciation)} déjà constatés = ${eur(r.complement)}` },
        ];
      },
      explication: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          `La dépréciation suit l'estimation : elle doit valoir ${eur(r.necessaire)}. Le compte 491 en porte déjà ${eur(r.d.depreciation)} ; il ne manque que ${eur(r.complement)}. Hors taxes toujours : si la perte se confirme, l'État rendra à ${r.y.f.entreprise} la TVA de la part perdue.`,
        ];
      },
    },
    {
      id: "complement",
      type: "ecriture",
      titre: "Le complément, au journal",
      notions: ["payment_terms", "income_statement"],
      evenement: (c) => `Au ${dateDe(DATE_DE_LA_SITUATION)}, passez le complément de dépréciation de la créance de ${creanceQuiSeDegrade(c).y.f.sonora.nom}.`,
      ecriture: (c) => {
        const r = creanceQuiSeDegrade(c);
        return {
          date: dateDe(DATE_DE_LA_SITUATION),
          libelle: `Complément de dépréciation, ${r.y.f.sonora.nom}`,
          lignes: [
            { role: "la charge de la période, la dotation aux dépréciations", compte: "6817", acceptes: ["681"], sens: "debit", montant: r.complement, indice: "le complément à doter" },
            { role: "la dépréciation de la créance, augmentée", compte: "491", sens: "credit", montant: r.complement, indice: "le complément à doter" },
          ],
        };
      },
      indices: () => [
        "La même écriture qu'une première dépréciation : une dotation au débit, le compte de dépréciation des clients au crédit.",
        "Le montant : pas toute la dépréciation nécessaire, seulement ce qui manque au compte 491. Au débit, les dotations aux dépréciations des actifs circulants (6817).",
      ],
      explication: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          `N+1 porte ${eur(r.complement)} de charges : la part de la perte que l'estimation de décembre n'avait pas vue. Pas un euro ne sort de la banque, et la créance garde sa valeur d'origine au compte 416.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "au-bilan",
      type: "montants",
      titre: "La créance au bilan",
      notions: ["payment_terms"],
      question: () => "Après le complément, combien le compte 491 porte-t-il en tout ? Et pour quelle valeur nette la créance figure-t-elle dans la situation de mars ?",
      champs: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          { libelle: "Dépréciation cumulée au compte 491", attendu: r.necessaire, calcul: `${eur(r.d.depreciation)} + ${eur(r.complement)} = ${eur(r.necessaire)}` },
          { libelle: "Valeur nette de la créance", attendu: r.valeurNette, calcul: `${eur(r.y.creance.ttc)} − ${eur(r.necessaire)} = ${eur(r.valeurNette)}` },
        ];
      },
      explication: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [`La créance ne compte plus que pour ${eur(r.valeurNette)} : ce qu'on espère encore recevoir, et la TVA que l'État rendra sur la part perdue.`];
      },
    },
    {
      id: "ce-que-doit-verser-le-liquidateur",
      type: "curseur",
      titre: "Ce que le liquidateur devra verser",
      notions: ["payment_terms"],
      question: (c) => {
        const r = creanceQuiSeDegrade(c);
        return `Faites varier la part de la créance que versera le liquidateur, en %. Une droite donne la dépréciation cumulée, ${eur(r.necessaire)}, l'autre la perte hors taxes qu'il restera. Placez le curseur sur la plus petite part versée où la dépréciation couvre la perte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Part versée par le liquidateur", unite: "%" }),
      cible: (c) => ({ attendu: creanceQuiSeDegrade(c).partQuiSuffit, min: 0, max: 100 }),
      zones: ["La dépréciation couvre la perte", "Il faudra doter encore"],
      rates: () => ({
        dessous: "À cette part versée, la perte dépasse encore la dépréciation cumulée.",
        dessus: "Avec moins, la dépréciation couvre encore la perte : cherchez la plus petite part.",
      }),
      montrer: "Montrer la part",
      lecture: (c, e) => {
        const r = creanceQuiSeDegrade(c);
        const perte = auCentime(r.d.ht - r.y.unPoint * e);
        return [
          { libelle: "Perte hors taxes", montant: perte },
          { libelle: "Dépréciation cumulée", montant: r.necessaire },
          { libelle: "Reste à constater en charge", montant: auCentime(perte - r.necessaire), fort: true },
        ];
      },
      droites: (c) => {
        const r = creanceQuiSeDegrade(c);
        return {
          produit: () => r.necessaire,
          cout: (e) => r.d.ht - r.y.unPoint * e,
          libelles: ["Dépréciation cumulée", "Perte hors taxes"],
        };
      },
      explication: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          `Dès que le liquidateur verse ${qte(r.partQuiSuffit)} % de la créance, la dépréciation portée à ${pct(TAUX_DE_PERTE_REVU)} couvre la perte ; au-delà, une partie de la dépréciation se reprendra en produit. Le complément n'est donc un coût définitif que si la perte finale atteint l'estimation de mars.`,
        ];
      },
    },
    {
      id: "le-denouement-de-juin",
      type: "montants",
      titre: "Le dénouement de juin",
      notions: ["payment_terms", "income_statement"],
      question: (c) => {
        const r = creanceQuiSeDegrade(c);
        return `Le ${dateDe(r.y.f.suites.sonora.date)}, le liquidateur verse finalement ${pct(r.y.f.suites.sonora.partEncaissee)} de la créance, ${eur(r.y.verse)}. Avec la dépréciation portée à ${eur(r.necessaire)}, calculez la perte hors taxes, l'effet du dénouement sur le résultat (la reprise moins la perte ; positif s'il l'augmente), puis la charge nette que la créance aura coûtée à N+1, complément de mars compris.`;
      },
      champs: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          { libelle: "Perte hors taxes", attendu: r.juin.perteHt, calcul: `(${eur(r.y.creance.ttc)} − ${eur(r.y.verse)}) ÷ ${qte(1 + r.y.f.tauxDeTva)} = ${eur(r.juin.perteHt)}` },
          { libelle: "Effet du dénouement de juin", attendu: r.effetDuDenouement, calcul: `${eur(r.juin.reprise)} de reprise − ${eur(r.juin.perteHt)} de perte = ${eur(r.effetDuDenouement)}` },
          {
            libelle: "Charge nette de N+1 sur la créance",
            attendu: r.chargeNetteDeN1,
            calcul: `${eur(r.complement)} en mars + ${eur(r.juin.perteHt)} − ${eur(r.juin.reprise)} en juin = ${eur(r.chargeNetteDeN1)}`,
          },
        ];
      },
      explication: (c) => {
        const r = creanceQuiSeDegrade(c);
        return [
          `N+1 porte au bout du compte ${eur(r.chargeNetteDeN1)} : exactement ce qu'il aurait porté sans le complément de mars. Le complément a avancé une charge, la reprise de juin l'a rendue. Ce que la créance coûte à ${r.y.f.entreprise} reste la perte hors taxes, ${eur(r.juin.perteHt)}, répartie entre N et N+1.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Quelle phrase envoyez-vous au directeur financier ?",
      options: (c) => {
        const r = creanceQuiSeDegrade(c);
        const y = r.y;
        return [
          {
            texte: `Doter ${eur(r.complement)} en mars, sans revenir sur les comptes de N`,
            juste: true,
            retour: `Oui : ${eur(r.d.ht)} hors taxes × ${pct(TAUX_DE_PERTE_REVU)} = ${eur(r.necessaire)} de dépréciation, dont ${eur(r.d.depreciation)} déjà constatés ; la créance vaut ${eur(r.valeurNette)} net. Les comptes de N, arrêtés le ${dateDe(ARRETE_DES_COMPTES_DE_N)}, disaient ce qu'on savait alors : une estimation nouvelle passe dans la période où on l'apprend.`,
          },
          {
            texte: `Corriger les comptes de N : leur dépréciation de ${eur(r.d.depreciation)} était fausse`,
            juste: false,
            retour: `Non : au 31 décembre, ${pct(y.taux)} était la meilleure estimation, et les comptes ont été arrêtés avec elle. Ce n'est pas une erreur, c'est un changement d'estimation : il se passe en N+1, par un complément de ${eur(r.complement)}.`,
          },
          {
            texte: `Doter ${eur(r.toutLaPerte)} en mars : toute la perte probable`,
            juste: false,
            retour: `Non : ${eur(r.d.depreciation)} de cette perte ont déjà été passés au 31 décembre. Les doter une seconde fois compterait la même perte deux fois ; on ne dote que ce qui manque, ${eur(r.complement)}.`,
          },
          {
            texte: `Doter ${eur(r.surLeTtc)} en mars : la perte en plus, TVA comprise`,
            juste: false,
            retour: `Non : la dépréciation se calcule hors taxes. La TVA de la part perdue, l'État la rendra ; ce n'est pas une perte pour l'entreprise. Le complément est de ${eur(r.complement)}.`,
          },
        ];
      },
    },
  ],
};
