import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_TVA, POURQUOI_LA_TVA, eur, ficheDe, jours, pct } from "../../chapitres/la-declaration-de-tva";
import { DELAI_DE_LA_COMMANDE_PUBLIQUE, DELAI_MAXIMAL_CONVENU, type CodeDeClienteleDuBatiment } from "../../monde/delais-et-tva";
import { declarationDuTrimestre, delaiEnPlus, delaiLegalDe, ventesDuTrimestre } from "../../monde/delais";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA TVA ET LA TRÉSORERIE » : LA TVA AVANCÉE POUR LE CLIENT (fiscalité,
 * palier 3).
 *
 * Les trois clientèles de MARTEL & FILS demandent chacune un mois de plus pour payer. La gérante veut
 * savoir laquelle elle peut accepter sans sortir de la loi, ce que ce délai coûterait à sa trésorerie
 * au 31 décembre, accordé dès janvier, et quelle part de cette somme serait de la TVA avancée à l'État
 * pour ses clients. L'élève écarte les deux clientèles dont le délai deviendrait illégal (90 jours
 * entre professionnels, 60 jours pour une collectivité), chiffre la créance en plus, HT et TTC, puis
 * croise les deux régimes : au régime réel (les encaissements), MARTEL & FILS ne finance que le hors
 * taxes et n'avance aucune TVA ; avec l'option pour les débits, elle avancerait la TVA de la créance.
 * Il recalcule enfin ce que la TVA laisse en trésorerie au 31 décembre, aux deux régimes.
 *
 * Le jugement : la bonne réponse change avec la correction du défaut 2 de l'audit. « Dont 7 000 € de
 * TVA avancée » n'est vrai qu'avec l'option pour les débits ; « ce délai ne coûte rien » reste faux,
 * car le hors taxes est financé.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `delaiEnPlus` sur la fiche de MARTEL & FILS. Le délai s'applique à tous les
 * trimestres de la fiche, comme un flux régulier.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : l'année rejouée avec le délai allongé, sa « trésorerie perdue »
 * (où se mêlaient la créance et des intérêts du moteur), le choix de « la clientèle qui pèse le plus »,
 * et la prémisse fausse « l'entreprise a opté pour les débits » ; le transport.
 */

/** Les jours de délai que les clientèles demandent en plus : 30, un mois de plus pour payer. */
export const JOURS_DEMANDES = 30;

/** La clientèle qui peut payer plus tard sans sortir de la loi : la seule qui paie aujourd'hui comptant. */
export const CLIENTELE_DU_CAS: CodeDeClienteleDuBatiment = "commerces";

const auCentime = (x: number) => Math.round(x * 100) / 100;

/** Le délai en plus, aux deux régimes, et ce que chaque clientèle deviendrait au regard de la loi. */
export function tvaAvanceePourLeClient(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = f.tauxDeTva;
  const enc = delaiEnPlus(f, CLIENTELE_DU_CAS, JOURS_DEMANDES);
  const deb = delaiEnPlus(f, CLIENTELE_DU_CAS, JOURS_DEMANDES, { regime: "debits" });
  const clienteles = f.clienteles.map((g) => {
    const x = delaiEnPlus(f, g.code, JOURS_DEMANDES);
    return {
      code: g.code,
      nom: g.nom,
      delai: g.delai,
      nouveauDelai: x.nouveauDelai,
      delaiLegal: delaiLegalDe(g.code),
      illegal: x.depasseLeDelaiLegal,
      ventesDeLEteHT: g.ventesHT[3 + 1]!,
      ventesT4HT: x.ventesT4HT,
      ventesDeLAnneeHT: x.ventesDeLAnneeHT,
    };
  });
  const permises = clienteles.filter((g) => !g.illegal);
  const avec = { delais: { [CLIENTELE_DU_CAS]: enc.nouveauDelai } };
  const automne = declarationDuTrimestre(f, 4);
  const automneAvecLeDelai = declarationDuTrimestre(f, 4, avec);
  return {
    f,
    t,
    enc,
    deb,
    clienteles,
    permises,
    clientele: clienteles.find((g) => g.code === CLIENTELE_DU_CAS)!,
    automne,
    automneAvecLeDelai,
    encaisseDeLaClienteleAvecLeDelai: ventesDuTrimestre(f, 4, avec).clienteles.find((g) => g.code === CLIENTELE_DU_CAS)!.encaisseHT!,
    /** Ce que la TVA laissée au 31 décembre perd, aux deux régimes. */
    baisseAuxEncaissements: auCentime(enc.effetSans - enc.effetAvec),
    baisseAuxDebits: auCentime(deb.effetSans - deb.effetAvec),
  };
}

export type TvaAvanceePourLeClient = ReturnType<typeof tvaAvanceePourLeClient>;

export const LA_TVA_AVANCEE_POUR_LE_CLIENT: Situation = {
  code: "la-tva-avancee-pour-le-client",
  parcours: "fiscalite",
  palier: 3,
  blocs: [],
  reprend: ["la-tva-et-la-tresorerie"],
  commanditaire: "La gérante",
  titre: "La TVA avancée pour le client",
  accroche:
    "Les clients de MARTEL & FILS veulent payer un mois plus tard. Lequel peut l'obtenir sans sortir de la loi, ce que le délai coûterait à la trésorerie de fin d'année, et la part de TVA que l'entreprise avancerait, ou non, à la place de ses clients.",
  objectifs: [
    "Dire quel délai de paiement la loi permet, entre professionnels et avec une collectivité",
    "Calculer la créance que crée un délai plus long, hors taxes et toutes taxes comprises, et la TVA qu'elle contient",
    "Dire ce que l'entreprise finance, et ce qu'elle avance de TVA, selon le régime d'exigibilité",
    "Recalculer ce que la TVA laisse en trésorerie, et répondre à la gérante, chiffres à l'appui",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_TVA, pourquoi: POURQUOI_LA_TVA },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Un mois de plus pour payer",
      tableau: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return {
          titre: `Les clientèles de ${k.f.entreprise}`,
          colonnes: ["Délai aujourd'hui", "Délai demandé", "Travaux du 4e trimestre (HT)", "Travaux de l'année N (HT)"],
          lignes: k.clienteles.map((g) => ({ libelle: g.nom, valeurs: [jours(g.delai), jours(g.nouveauDelai), eur(g.ventesT4HT), eur(g.ventesDeLAnneeHT)] })),
        };
      },
      texte: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return [
          `« Nos trois clientèles nous demandent chacune ${JOURS_DEMANDES} jours de plus pour payer. Laquelle pouvons-nous suivre sans sortir de la loi ? Si nous l'avions acceptée dès janvier, combien de trésorerie ce délai nous ferait-il financer au 31 décembre, une fois la TVA réglée à l'État ? Et dans cette somme, combien de TVA aurions-nous versée à l'État sans l'avoir encore reçue de ces clients ? »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre. ${k.f.entreprise} fait des travaux, au régime des encaissements ; le gérant parle d'opter pour les débits. Le découvert coûte ${pct(k.f.tauxDuDecouvert)} l'an ; les intérêts se comptent sur 360 jours. La loi : entre professionnels, au plus ${DELAI_MAXIMAL_CONVENU.joursDeLaFacture} jours de la facture ; avec une collectivité, ${DELAI_DE_LA_COMMANDE_PUBLIQUE} jours.`,
        ];
      },
      repere: () =>
        "À rendre : la clientèle que la loi permet de suivre, la créance en plus au 31 décembre et la TVA qu'elle contient, ce que l'entreprise financerait et ce que cela coûterait aux deux régimes, ce que la TVA laisserait en trésorerie, et votre réponse.",
    },
    {
      id: "la-clientele",
      type: "choix",
      titre: "Le délai que la loi permet",
      notions: ["payment_terms"],
      question: () => `Laquelle des trois clientèles peut obtenir ${JOURS_DEMANDES} jours de plus sans sortir du délai que la loi permet ?`,
      options: (c) => {
        const k = tvaAvanceePourLeClient(c);
        const [commerces, collectivites, entreprises] = k.clienteles;
        return [
          {
            texte: `${commerces!.nom}, qui passeraient de comptant à ${commerces!.nouveauDelai} jours`,
            juste: !commerces!.illegal && collectivites!.illegal && entreprises!.illegal,
            retour: `Oui : ${commerces!.nouveauDelai} jours restent sous le plafond de ${commerces!.delaiLegal} jours entre professionnels. Les deux autres demandes sortiraient de la loi.`,
          },
          {
            texte: `${entreprises!.nom}, qui pèsent le plus au quatrième trimestre`,
            juste: false,
            retour: `Non : elles paient déjà à ${entreprises!.delai} jours, le maximum entre professionnels. ${entreprises!.nouveauDelai} jours ne peuvent pas se convenir.`,
          },
          {
            texte: `${collectivites!.nom}, qui passeraient à ${collectivites!.nouveauDelai} jours comme les entreprises`,
            juste: false,
            retour: `Non : le délai de paiement d'une collectivité est de ${collectivites!.delaiLegal} jours. Le porter à ${collectivites!.nouveauDelai} jours ne se négocie pas.`,
          },
        ];
      },
    },
    {
      id: "la-creance-en-plus",
      type: "montants",
      titre: "La créance en plus au 31 décembre",
      notions: ["payment_terms", "vat_payable"],
      question: (c) =>
        `Les ${tvaAvanceePourLeClient(c).clientele.nom.toLowerCase()} paient à ${JOURS_DEMANDES} jours dès janvier. Au 31 décembre, de combien les créances clients grossiraient-elles, hors taxes puis toutes taxes comprises, et quelle TVA cette créance en plus contient-elle ?`,
      champs: (c) => {
        const k = tvaAvanceePourLeClient(c);
        const e = k.enc;
        return [
          { libelle: "Créance en plus au 31 décembre (HT)", attendu: e.creanceEnPlusHT, calcul: `${eur(e.ventesT4HT)} × ${JOURS_DEMANDES} ÷ 90 = ${eur(e.creanceEnPlusHT)}` },
          { libelle: "Créance en plus au 31 décembre (TTC)", attendu: e.creanceEnPlusTTC, calcul: `${eur(e.creanceEnPlusHT)} × ${(1 + k.t).toLocaleString("fr-FR")} = ${eur(e.creanceEnPlusTTC)}` },
          { libelle: "TVA contenue dans cette créance", attendu: e.tvaEnPlus, calcul: `${eur(e.creanceEnPlusHT)} × ${pct(k.t)} = ${eur(e.tvaEnPlus)}` },
        ];
      },
      explication: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return [
          `Au 31 décembre, les ${k.clientele.nom.toLowerCase()} devraient encore le dernier mois de leurs travaux de l'automne : ${eur(k.enc.creanceEnPlusTTC)} TTC, dont ${eur(k.enc.tvaEnPlus)} de TVA. Reste à savoir si cette TVA est déjà due à l'État.`,
        ];
      },
    },
    {
      id: "ce-qu-elle-finance",
      type: "montants",
      titre: "Ce que le délai fait financer",
      notions: ["payment_terms", "receivables_financing", "vat_payable"],
      question: () =>
        "Une fois la TVA réglée à l'État, que l'entreprise finance-t-elle en plus au 31 décembre, et que coûte ce délai sur l'année, au découvert ? Répondez au régime réel, les encaissements, puis avec l'option pour les débits.",
      champs: (c) => {
        const k = tvaAvanceePourLeClient(c);
        const e = k.enc;
        const d = k.deb;
        const ttc = auCentime(e.ventesDeLAnneeHT * (1 + k.t));
        return [
          { libelle: "Financé en plus, au régime réel", attendu: e.financeEnPlus, calcul: `la créance hors taxes : la TVA de ces factures n'est pas encore due, ${eur(e.financeEnPlus)}` },
          {
            libelle: "Coût du délai sur l'année, au régime réel",
            attendu: e.coutDeLAnnee,
            calcul: `${eur(e.ventesDeLAnneeHT)} de travaux de l'année (HT) × ${pct(k.f.tauxDuDecouvert)} × ${JOURS_DEMANDES} ÷ 360 = ${eur(e.coutDeLAnnee)}`,
          },
          { libelle: "Financé en plus, avec l'option", attendu: d.financeEnPlus, calcul: `la créance toutes taxes comprises : sa TVA est déjà déclarée, ${eur(d.financeEnPlus)}` },
          { libelle: "Coût du délai sur l'année, avec l'option", attendu: d.coutDeLAnnee, calcul: `${eur(ttc)} (TTC) × ${pct(k.f.tauxDuDecouvert)} × ${JOURS_DEMANDES} ÷ 360 = ${eur(d.coutDeLAnnee)}` },
        ];
      },
      explication: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return [
          `Au régime réel, ${k.f.entreprise} n'avance aucune TVA : elle attend ${eur(k.enc.financeEnPlus)} hors taxes, et la TVA attend avec. Avec l'option, elle avancerait en plus ${eur(k.deb.tvaAvanceeEnPlus)} de TVA déjà déclarée : ${eur(k.deb.financeEnPlus)} à financer, et ${eur(auCentime(k.deb.coutDeLAnnee - k.enc.coutDeLAnnee))} d'intérêts de plus sur l'année.`,
        ];
      },
    },
    {
      id: "la-tva-laissee",
      type: "montants",
      titre: "Ce que la TVA laisse au 31 décembre",
      notions: ["vat_payable", "net_treasury"],
      question: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return `Sans le délai, la TVA laisse ${eur(k.enc.effetSans)} dans la trésorerie de ${k.f.entreprise} au 31 décembre au régime réel, et en laisserait ${eur(k.deb.effetSans)} avec l'option. Avec le délai, recalculez la TVA collectée du quatrième trimestre au régime réel, puis ce que la TVA laisserait en trésorerie au 31 décembre, aux deux régimes.`;
      },
      champs: (c) => {
        const k = tvaAvanceePourLeClient(c);
        const a = k.automneAvecLeDelai;
        const e = k.enc;
        const d = k.deb;
        return [
          {
            libelle: "TVA collectée du quatrième trimestre, avec le délai",
            attendu: a.collectee,
            calcul: `les ${k.clientele.nom.toLowerCase()} paient ${eur(e.ventesT4HT)} × ${90 - e.nouveauDelai} ÷ 90 + ${eur(k.clientele.ventesDeLEteHT)} × ${e.nouveauDelai} ÷ 90 = ${eur(k.encaisseDeLaClienteleAvecLeDelai)} au lieu de ${eur(e.ventesT4HT)} ; ${eur(a.encaissementsHT!)} encaissés au total × ${pct(k.t)} = ${eur(a.collectee)}, au lieu de ${eur(k.automne.collectee)}`,
          },
          {
            libelle: "Ce que la TVA laisse au 31 décembre, au régime réel",
            attendu: e.effetAvec,
            calcul: `${eur(e.effetSans)} − (${eur(k.automne.collectee)} − ${eur(a.collectee)}) = ${eur(e.effetAvec)}`,
          },
          { libelle: "Ce que la TVA laisse au 31 décembre, avec l'option", attendu: d.effetAvec, calcul: `${eur(d.effetSans)} − ${eur(d.tvaAvanceeEnPlus)} de TVA avancée en plus = ${eur(d.effetAvec)}` },
        ];
      },
      explication: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return [
          `Au régime réel, la TVA laissée ne baisse que de ${eur(k.baisseAuxEncaissements)} : la TVA de la créance en plus n'est pas due. Seule baisse la TVA collectée de l'automne, parce que les ${k.clientele.nom.toLowerCase()} y paient ${eur(auCentime(k.enc.ventesT4HT - k.encaisseDeLaClienteleAvecLeDelai))} HT de moins (une part de leurs travaux de l'été, moins gros, au lieu de ceux de l'automne). Avec l'option, elle baisserait de toute la TVA de la créance, ${eur(k.baisseAuxDebits)} : ${k.f.entreprise} la verserait à l'État sans l'avoir reçue.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      notions: ["payment_terms", "vat_payable"],
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const k = tvaAvanceePourLeClient(c);
        const e = k.enc;
        const d = k.deb;
        return [
          {
            texte: `Ce délai coûte ${eur(e.financeEnPlus)} de trésorerie, hors taxes : la TVA de ces factures n'est due qu'à leur encaissement`,
            juste: true,
            retour: `Oui : au régime des encaissements, ${k.f.entreprise} n'avance aucune TVA pour ses clients. Elle finance ${eur(e.financeEnPlus)} hors taxes au 31 décembre, ${eur(e.coutDeLAnnee)} d'intérêts sur l'année au découvert. Avec l'option pour les débits, ce serait ${eur(d.financeEnPlus)}, dont ${eur(d.tvaAvanceeEnPlus)} de TVA avancée : un argument contre l'option.`,
          },
          {
            texte: `Ce délai coûte ${eur(d.financeEnPlus)} de trésorerie, dont ${eur(d.tvaAvanceeEnPlus)} de TVA avancée pour les clients`,
            juste: false,
            retour: `Non : ce serait vrai avec l'option pour les débits. Au régime réel de ${k.f.entreprise}, la TVA de ces factures n'est due qu'à leur encaissement : elle ne finance que ${eur(e.financeEnPlus)} hors taxes.`,
          },
          {
            texte: "Ce délai ne coûte rien : la TVA n'est due qu'une fois le client payé, et le client finit par payer",
            juste: false,
            retour: `Non : la TVA attend, mais le hors taxes aussi. ${k.f.entreprise} finance ${eur(e.financeEnPlus)} de plus au 31 décembre, ${eur(e.coutDeLAnnee)} d'intérêts sur l'année.`,
          },
          {
            texte: `Accordons plutôt ${JOURS_DEMANDES} jours de plus aux entreprises, qui pèsent le plus : le délai rapporterait plus de chantiers`,
            juste: false,
            retour: `Non : les entreprises paient déjà à ${DELAI_MAXIMAL_CONVENU.joursDeLaFacture} jours, le plafond entre professionnels. ${k.clienteles.find((g) => g.code === "entreprises")!.nouveauDelai} jours sortiraient de la loi.`,
          },
        ];
      },
    },
  ],
};
