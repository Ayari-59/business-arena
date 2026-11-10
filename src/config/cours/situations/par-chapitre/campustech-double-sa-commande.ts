import { eur, nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_BFR_NORMATIF } from "../../chapitres/le-bfr-d-exploitation-normatif";
import { COMMANDE_DOUBLEE, SECTEUR, bfrNormatif } from "../../monde/bfr-normatif";
import { DELAI_CONVENU_DE_CAMPUSTECH, PRIX_DE_L_ENCEINTE } from "../../monde/nova-gestion";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE BFR D'EXPLOITATION NORMATIF » : CAMPUSTECH DOUBLE SA COMMANDE
 * (comptabilité générale, palier 4 ; DCG UE6 2.2).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : l'année type de NOVA et ses délais
 * (monde/bfr-normatif.ts).
 *
 * HYPOTHÈSE DU CAS (COMMANDE_DOUBLEE) : CampusTech commanderait 640 enceintes par mois au lieu de 320,
 * payées comme aujourd'hui, à 80 jours ; les particuliers ne changent pas ; la paie non plus (la ligne
 * absorbe le volume : moins de 7 000 enceintes par trimestre). Ce n'est pas une croissance à structure
 * constante : la part de CampusTech dans le chiffre d'affaires grandit, son coefficient de structure
 * aussi. L'élève refait seul le coefficient et les jours de CampusTech, le besoin normatif en jours et
 * en euros, puis le besoin si CampusTech payait à 60 jours, et rend sa réponse.
 */

/** Un nombre au centième (deux décimales s'il n'est pas entier), ou à `d` chiffres quand on les demande. */
const qte = (n: number, d = 2) => (d === 2 ? nombreAuCentieme(n) : (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−"));
const coef = (n: number) => (n + 0).toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const jours = (n: number) => `${qte(n)} jour${Math.abs(n) >= 2 ? "s" : ""}`;

/** Les chiffres du cas : le besoin d'aujourd'hui, la commande doublée, et la commande doublée payée à l'heure. */
export function commandeDoublee(_c: Pick<Cas, "code">) {
  const avant = bfrNormatif();
  const apres = bfrNormatif({}, COMMANDE_DOUBLEE);
  const aLHeure = bfrNormatif({ campustech: DELAI_CONVENU_DE_CAMPUSTECH }, COMMANDE_DOUBLEE);
  return { avant, apres, aLHeure, supplement: Math.round((apres.bfre - avant.bfre) * 100) / 100, epargne: Math.round((apres.bfre - aLHeure.bfre) * 100) / 100 };
}

export const CAMPUSTECH_DOUBLE_SA_COMMANDE: Situation = {
  code: "campustech-double-sa-commande",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-bfr-d-exploitation-normatif"],
  commanditaire: "Le dirigeant",
  titre: "CampusTech double sa commande",
  accroche: "CampusTech veut 640 enceintes par mois au lieu de 320, toujours payées en retard, à 80 jours. Combien d'argent l'exploitation va-t-elle immobiliser, et à quelle condition accepter ?",
  objectifs: [
    "Recalculer un coefficient de structure quand la structure des ventes change",
    "Déterminer le BFRE normatif en jours et en euros d'une année nouvelle",
    "Chiffrer l'effet d'un délai client et rendre une réponse argumentée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BFR_NORMATIF,
    pourquoi: "ce cas reprend le chapitre « Le BFR d'exploitation normatif », qui se joue sur l'année type de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: (c) => {
        const n = commandeDoublee(c);
        return [
          `« CampusTech veut doubler sa commande : ${qte(COMMANDE_DOUBLEE.campustech / 12, 0)} enceintes par mois à ${eur(PRIX_DE_L_ENCEINTE)}, payées comme d'habitude, en retard, à ${jours(n.avant.delais.campustech)}. C'est ${eur(n.apres.caHt - n.avant.caHt)} de chiffre d'affaires de plus. Combien d'argent cela va-t-il immobiliser ? Et si j'exigeais enfin les ${DELAI_CONVENU_DE_CAMPUSTECH} jours du contrat ? »`,
          `Pas de cours cette fois. Le stock, le fournisseur et la TVA gardent leurs coefficients, qui dépendent du prix et du coût d'une enceinte ; la paie, ${eur(n.avant.partFixe)} de part fixe, ne change pas.`,
        ];
      },
      tableau: (c) => {
        const n = commandeDoublee(c);
        const p = (code: Parameters<typeof n.apres.poste>[0]) => n.apres.poste(code);
        return {
          titre: "L'année avec la commande doublée",
          colonnes: ["Montant ou jours"],
          lignes: [
            { libelle: "Chiffre d'affaires HT", valeurs: [eur(n.apres.caHt)] },
            { libelle: "Ventes TTC à CampusTech", valeurs: [eur(n.apres.campustechTtc)] },
            { libelle: "Stock, en jours de CA HT", valeurs: [jours(p("stock").jours)] },
            { libelle: "TVA déductible, en jours de CA HT", valeurs: [jours(p("tva-deductible").jours)] },
            { libelle: "Fournisseur, en jours de CA HT", valeurs: [jours(p("fournisseur").jours)] },
            { libelle: "TVA collectée, en jours de CA HT", valeurs: [jours(p("tva-collectee").jours)] },
            { libelle: "Repère du secteur, BFRE en jours de CA HT", valeurs: [jours(SECTEUR.bfre)] },
          ],
        };
      },
      repere: () => "À rendre : le coefficient et les jours de CampusTech, le BFRE normatif en jours et en euros, le besoin si CampusTech payait au délai convenu, et votre réponse.",
    },
    {
      id: "le-poste-campustech",
      type: "montants",
      titre: "Le poste CampusTech",
      notions: ["bfr", "payment_terms"],
      question: () => "Calculez le nouveau coefficient de structure de CampusTech, au dix-millième, puis ses jours de chiffre d'affaires, au centième.",
      champs: (c) => {
        const n = commandeDoublee(c);
        const k = n.apres.poste("campustech");
        return [
          { libelle: "Coefficient de CampusTech", nature: "coefficient", attendu: k.coefficient, calcul: `${eur(k.flux)} ÷ ${eur(n.apres.caHt)} = ${coef(k.coefficient)}`, tolerance: 0.0001 },
          { libelle: "CampusTech, en jours de CA HT", nature: "grandeur", attendu: k.jours, calcul: `${jours(k.delai)} × ${coef(k.coefficient)} = ${jours(k.jours)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const n = commandeDoublee(c);
        return [`Le coefficient passe de ${coef(n.avant.poste("campustech").coefficient)} à ${coef(n.apres.poste("campustech").coefficient)} : CampusTech pèse plus dans un chiffre d'affaires qui n'a pas doublé. Le même délai coûte presque deux fois plus de jours.`];
      },
    },
    {
      id: "le-besoin",
      type: "montants",
      titre: "Le besoin normatif de la nouvelle année",
      notions: ["bfr"],
      question: () => "Calculez la part variable du besoin en jours, puis le BFRE normatif en euros, part fixe déduite, et en jours de chiffre d'affaires hors taxes.",
      champs: (c) => {
        const n = commandeDoublee(c);
        const x = n.apres;
        return [
          {
            libelle: "Part variable, en jours de CA HT",
            nature: "grandeur",
            attendu: x.joursVariables,
            calcul: `${qte(x.poste("stock").jours)} + ${qte(x.poste("campustech").jours)} + ${qte(x.poste("tva-deductible").jours)} − ${qte(x.poste("fournisseur").jours)} − ${qte(x.poste("tva-collectee").jours)} = ${jours(x.joursVariables)}`,
            tolerance: 0.01,
          },
          { libelle: "BFRE normatif, en euros", attendu: x.bfre, calcul: `${qte(x.joursVariables)} × ${eur(x.caHt)} ÷ 360 − ${eur(x.partFixe)} = ${eur(x.bfre)}` },
          { libelle: "BFRE normatif, en jours de CA HT", nature: "grandeur", attendu: x.bfreEnJours, calcul: `${eur(x.bfre)} ÷ ${eur(x.caHt)} × 360 = ${jours(x.bfreEnJours)}` },
        ];
      },
      explication: (c) => {
        const n = commandeDoublee(c);
        return [`Le besoin passe de ${eur(n.avant.bfre)} à ${eur(n.apres.bfre)} : ${eur(n.supplement)} de plus à financer, pour ${qte(((n.apres.caHt - n.avant.caHt) / n.avant.caHt) * 100, 1)} % de chiffre d'affaires en plus. Le besoin est multiplié par ${qte(n.apres.bfre / n.avant.bfre, 1)} : c'est la structure des ventes qui a changé, pas seulement leur volume.`];
      },
    },
    {
      id: "a-l-heure",
      type: "montants",
      titre: "Si CampusTech payait à l'heure",
      notions: ["bfr", "payment_terms"],
      question: () => `Même commande, mais CampusTech paie au délai convenu, ${DELAI_CONVENU_DE_CAMPUSTECH} jours. Calculez le nouveau BFRE normatif en euros, puis ce que le retard de CampusTech coûte en besoin.`,
      champs: (c) => {
        const n = commandeDoublee(c);
        const y = n.aLHeure;
        return [
          { libelle: `BFRE normatif, CampusTech à ${DELAI_CONVENU_DE_CAMPUSTECH} jours`, attendu: y.bfre, calcul: `${qte(y.joursVariables)} jours × ${eur(y.caHt)} ÷ 360 − ${eur(y.partFixe)} = ${eur(y.bfre)}` },
          { libelle: "Besoin dû au retard", attendu: n.epargne, calcul: `${eur(n.apres.bfre)} − ${eur(y.bfre)} = ${eur(n.epargne)}` },
        ];
      },
      explication: (c) => {
        const n = commandeDoublee(c);
        return [`Les ${jours(n.avant.delais.campustech - DELAI_CONVENU_DE_CAMPUSTECH)} de retard de CampusTech immobiliseraient ${eur(n.epargne)} : plus que tout le besoin de NOVA aujourd'hui, ${eur(n.avant.bfre)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["bfr", "payment_terms"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: (c) => {
        const n = commandeDoublee(c);
        return [
          {
            texte: `Accepter, en exigeant les ${DELAI_CONVENU_DE_CAMPUSTECH} jours du contrat`,
            juste: true,
            retour: `Oui. La commande est rentable, mais à ${jours(n.avant.delais.campustech)} elle immobilise ${eur(n.supplement)} de plus. Payée à l'heure, le besoin tombe à ${eur(n.aLHeure.bfre)}, encore sous le repère du secteur : le doublement se négocie avec le respect du contrat, et des pénalités de retard si besoin.`,
          },
          {
            texte: `Accepter tel quel : ${jours(n.apres.bfreEnJours)} de besoin, c'est encore sous le secteur`,
            juste: false,
            retour: `Sous le secteur, oui, mais ${eur(n.supplement)} de plus à financer, et un retard qui n'est pas dans le contrat : autant le faire cesser au moment où CampusTech demande quelque chose.`,
          },
          {
            texte: "Refuser : un client qui paie en retard ne mérite pas plus de volume",
            juste: false,
            retour: "CampusTech est solvable : son retard se négocie, il ne fait pas perdre la créance. Refuser, c'est renoncer à une marge pour un problème de délai.",
          },
        ];
      },
    },
  ],
};
