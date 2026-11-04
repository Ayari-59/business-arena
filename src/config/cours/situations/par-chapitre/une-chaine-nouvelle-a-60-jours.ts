import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_FINANCEMENT } from "../../chapitres/financer-et-placer-la-tresorerie";
import { JOURS_DE_LA_BANQUE } from "../../monde/equilibre-de-tresorerie";
import { CHAINE_ONDES, CONDITIONS_DE_L_AFFACTURAGE, CONDITIONS_DU_DAILLY, affacturage, dailly, factureDeLaChaine, garantieSurSonora } from "../../monde/financer-et-placer";
import { PRIX_DE_L_ENCEINTE } from "../../monde/nova-gestion";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FINANCER ET PLACER LA TRÉSORERIE » : UNE CHAÎNE NOUVELLE, À 60 JOURS
 * (comptabilité générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : NOVA en N+1, la banque et le factor de
 * monde/financer-et-placer.ts.
 *
 * HYPOTHÈSE DU CAS (CHAINE_ONDES) : une chaîne de magasins de hi-fi commande chaque mois 600 enceintes,
 * avec la remise de 5 %, payées à 60 jours, le plafond légal ; elle refuse les lettres de change, ce qui ferme
 * l'escompte. L'élève chiffre seul la cession Dailly et l'affacturage d'une facture, puis tranche : la
 * différence de coût paie la garantie et le recouvrement, que l'expérience de Sonora rend précieux.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres du cas. */
export function chaineQuiPaieTard(_c: Pick<Cas, "code">) {
  const facture = factureDeLaChaine();
  const d = dailly(facture.ttc, CHAINE_ONDES.jours);
  const a = affacturage(facture.ttc, CHAINE_ONDES.jours);
  return { facture, d, a, ecart: auCentime(a.cout - d.cout), sonora: garantieSurSonora() };
}

export const UNE_CHAINE_NOUVELLE_A_60_JOURS: Situation = {
  code: "une-chaine-nouvelle-a-60-jours",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["financer-et-placer-la-tresorerie"],
  commanditaire: "Le dirigeant",
  titre: "Une chaîne nouvelle, à 60 jours",
  accroche: "Une chaîne de magasins de hi-fi, nouvelle cliente, paie à 60 jours et refuse les lettres de change. Céder ses factures à la banque, ou à un factor ?",
  objectifs: [
    "Calculer le coût et le net d'une cession Dailly",
    "Calculer l'avance, les commissions et le versement d'un affacturage",
    "Comparer deux financements de créances sur leur coût et sur ce qu'ils couvrent, et rendre une réponse",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_FINANCEMENT,
    pourquoi: "ce cas reprend le chapitre « Financer et placer la trésorerie », qui se joue sur NOVA en N+1 dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: (c) => {
        const n = chaineQuiPaieTard(c);
        return [
          `« La chaîne ${CHAINE_ONDES.nom} nous commande ${CHAINE_ONDES.enceintes} enceintes par mois, à ${eur(PRIX_DE_L_ENCEINTE)} moins ${pct(CHAINE_ONDES.remise)} de remise : ${eur(n.facture.ttc)} TTC par facture. Elle paie à ${CHAINE_ONDES.jours} jours et refuse les lettres de change. Je veux l'argent dès la facture : la banque en Dailly, ou un factor ? Après Sonora, je me méfie des chaînes nouvelles. »`,
          "Pas de cours cette fois : vous avez les conditions de la banque et du factor du chapitre.",
        ];
      },
      tableau: () => ({
        titre: "Les conditions",
        colonnes: ["Conditions"],
        lignes: [
          { libelle: "Cession Dailly", valeurs: [`${pct(CONDITIONS_DU_DAILLY.tauxAnnuel)} l'an jusqu'à l'échéance, ${eur(CONDITIONS_DU_DAILLY.fraisParBordereau)} par bordereau, NOVA garante du paiement`] },
          {
            libelle: "Affacturage avec garantie",
            valeurs: [`${pct(CONDITIONS_DE_L_AFFACTURAGE.commission)} du TTC, retenue de ${pct(CONDITIONS_DE_L_AFFACTURAGE.retenueDeGarantie)}, ${pct(CONDITIONS_DE_L_AFFACTURAGE.tauxDeFinancement)} l'an sur l'avance ; le factor recouvre et garantit l'impayé`],
          },
        ],
      }),
      repere: () => "À rendre : le coût et le net du Dailly, l'avance, le coût et le versement de l'affacturage, et votre réponse.",
    },
    {
      id: "le-dailly",
      type: "montants",
      titre: "La cession Dailly",
      notions: ["receivables_financing"],
      question: (c) => {
        const n = chaineQuiPaieTard(c);
        return `NOVA cède une facture de ${eur(n.facture.ttc)} TTC le jour de son émission, à ${CHAINE_ONDES.jours} jours de l'échéance. Calculez les intérêts, le coût total et le net reçu.`;
      },
      champs: (c) => {
        const n = chaineQuiPaieTard(c);
        const d = n.d;
        return [
          { libelle: "Intérêts du Dailly", attendu: d.interets, calcul: `${eur(d.nominal)} × ${pct(CONDITIONS_DU_DAILLY.tauxAnnuel)} × ${d.jours} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(d.interets)}` },
          { libelle: "Coût du Dailly", attendu: d.cout, calcul: `${eur(d.interets)} + ${eur(d.frais)} = ${eur(d.cout)}` },
          { libelle: "Net reçu", attendu: d.net, calcul: `${eur(d.nominal)} − ${eur(d.cout)} = ${eur(d.net)}` },
        ];
      },
      explication: () => ["Le Dailly avance toute la facture, mais NOVA reste garante : si la chaîne ne paie pas, la banque reprend l'argent à NOVA."],
    },
    {
      id: "l-affacturage",
      type: "montants",
      titre: "L'affacturage",
      notions: ["receivables_financing", "payment_terms"],
      question: () => "Le factor prend la même facture le jour de son émission. Calculez l'avance, retenue ôtée, le coût total des deux commissions, puis ce que le factor verse à NOVA.",
      champs: (c) => {
        const n = chaineQuiPaieTard(c);
        const a = n.a;
        return [
          { libelle: "Avance", attendu: a.avance, calcul: `${eur(a.ttc)} − ${eur(a.retenue)} de retenue = ${eur(a.avance)}` },
          {
            libelle: "Coût de l'affacturage",
            attendu: a.cout,
            calcul: `${eur(a.avance)} × ${pct(CONDITIONS_DE_L_AFFACTURAGE.tauxDeFinancement)} × ${a.jours} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(a.financement)}, plus ${eur(a.commission)} de commission d'affacturage = ${eur(a.cout)}`,
          },
          { libelle: "Versé par le factor", attendu: a.verse, calcul: `${eur(a.avance)} − ${eur(a.cout)} = ${eur(a.verse)}` },
        ];
      },
      explication: (c) => {
        const n = chaineQuiPaieTard(c);
        return [`L'affacturage coûte ${eur(n.ecart)} de plus que le Dailly sur une facture, et verse moins tout de suite : la retenue, ${eur(n.a.retenue)}, ne revient qu'au paiement de la chaîne.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["receivables_financing"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: (c) => {
        const n = chaineQuiPaieTard(c);
        return [
          {
            texte: `L'affacturage : ${eur(n.ecart)} de plus pour la garantie`,
            juste: true,
            retour: `Oui. Pour ${eur(n.ecart)} de plus par facture, le factor recouvre et garantit l'impayé d'un client nouveau. Sur Sonora, la garantie aurait épargné ${eur(n.sonora.perteHt)} de perte. Une fois la chaîne connue et sûre, le Dailly, moins cher, pourra prendre le relais.`,
          },
          {
            texte: `Le Dailly : il coûte ${eur(n.d.cout)} et verse ${eur(n.d.net)}, plus que l'affacturage`,
            juste: false,
            retour: `C'est le moins cher, mais il laisse le risque à NOVA. Une seule facture impayée effacerait des années d'écart de ${eur(n.ecart)}.`,
          },
          {
            texte: "L'escompte : c'est le moins cher des trois financements de créances",
            juste: false,
            retour: "Non : l'escompte demande une lettre de change acceptée, et la chaîne la refuse.",
          },
          {
            texte: "Refuser la commande : un client qui refuse les lettres de change paiera mal",
            juste: false,
            retour: "Non : beaucoup de chaînes refusent les lettres de change par principe, sans être de mauvais payeurs. Le risque se couvre, par la garantie d'un factor ; il ne se juge pas sur ce seul refus.",
          },
        ];
      },
    },
  ],
};
