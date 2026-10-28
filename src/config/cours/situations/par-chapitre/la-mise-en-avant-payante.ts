import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_PARTENAIRES, partenairesDuCabinet } from "../../chapitres/commissions-des-partenaires";
import type { Cas } from "../../cas";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES COMMISSIONS DES CANAUX PARTENAIRES » : LA MISE EN AVANT PAYANTE
 * (BTS NDRC, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le cabinet ATLAS CONSEIL (monde/atlas-conseil.ts) et son modèle
 * (monde/relation-client.ts), lus par le chapitre (`partenairesDuCabinet`). Hypothèse du cas : le
 * cabinet a décidé de passer aussi par la plateforme de mise en relation l'an prochain. Son offre de
 * base est celle de la fiche (20 % de chaque mission, 40 % des comptes revenus en direct après la
 * première année) et lui amènerait 5 comptes par an. La plateforme propose sa mise en avant : le
 * cabinet en tête de ses recherches, 6 comptes par an, mais 25 % de commission, sur tous les comptes.
 *
 * L'élève refait seul le chemin du chapitre, à valeur vie égale : la première année des deux offres,
 * puis la vie des comptes, le calcul à rebours des comptes qu'il faudrait pour payer la hausse (sur la
 * vie, et sur la première année seule : les deux lectures se croisent et ne disent pas la même chose),
 * la commission la plus haute que la mise en avant peut prendre (un curseur), et sa réponse.
 *
 * Le jugement : la directrice commerciale a fait le compte sur la première année, et elle y perd ;
 * sur la vie des comptes, la mise en avant rapporte. Il faut le dire, chiffres à l'appui.
 *
 * Ce qui a changé en passant sur le monde du cours : la place de marché de PIXEL & CO, ses commandes
 * et sa marge du trimestre deviennent la plateforme d'un cabinet, ses comptes et leur valeur vie.
 */

/** La commission de la mise en avant (hypothèse du cas) : 25 % de chaque mission, au lieu de 20 %. */
export const COMMISSION_PROPOSEE = 0.25;

/**
 * LES COMPTES QUE LA PLATEFORME AMÈNERAIT CHAQUE ANNÉE (hypothèse du cas) : 5 avec l'offre de base,
 * 6 avec la mise en avant. Ce sont des comptes attendus, la promesse de la plateforme, que le cas ne
 * discute pas : il calcule ce qu'elle devrait valoir pour payer la hausse.
 */
export const COMPTES_DE_L_OFFRE_DE_BASE = 5;
export const COMPTES_PROMIS = 6;

/** Les bornes du curseur de la commission de la mise en avant, en %. */
export const COMMISSION_DU_CURSEUR_DU_CAS = { min: 20, max: 40 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Les deux offres de la plateforme, sur la première année et sur la vie des comptes. */
export function miseEnAvant(c: Pick<Cas, "code">) {
  const x = partenairesDuCabinet(c);
  const ca = x.m.chiffreDAffaires;
  const base = x.plateforme.commission;
  const enDirect = x.plateforme.partQuiRevientEnDirect;
  // Une offre : sa commission, les comptes qu'elle amène, ce qu'elle coûte et laisse par compte et en tout.
  const offre = (commission: number, comptes: number) => {
    const premiere = auCentime(ca * commission);
    const suivante = auCentime(premiere * (1 - enDirect));
    const surLaVie = auCentime(premiere + suivante * x.anneesSuivantes);
    const netParCompte = auCentime(x.v.valeurVie - surLaVie);
    const margePremiereAnnee = auCentime(comptes * (x.m.marge - premiere));
    return { commission, comptes, premiere, suivante, surLaVie, netParCompte, margePremiereAnnee, valeur: auCentime(comptes * netParCompte) };
  };
  const b = offre(base, COMPTES_DE_L_OFFRE_DE_BASE);
  const m = offre(COMMISSION_PROPOSEE, COMPTES_PROMIS);
  // Le calcul à rebours : les comptes qu'il faudrait, à la nouvelle commission, pour garder ce que l'offre de base laisse.
  const comptesNecessaires = b.valeur / m.netParCompte;
  const comptesNecessairesALaPremiereAnnee = b.margePremiereAnnee / (x.m.marge - m.premiere);
  // Le curseur : la plus haute commission (en %) où les comptes promis laissent encore la valeur de l'offre de base.
  const plafond = Math.floor((((x.v.valeurVie - b.valeur / COMPTES_PROMIS) / (ca * x.facteur)) * 100) + 1e-9);
  const ecart = auCentime(m.valeur - b.valeur);
  return {
    x,
    b,
    m,
    hausse: auDixieme((COMMISSION_PROPOSEE - base) * 100),
    promesse: auDixieme((COMPTES_PROMIS / COMPTES_DE_L_OFFRE_DE_BASE - 1) * 100),
    comptesNecessaires: auCentime(comptesNecessaires),
    hausseNecessaire: auCentime((comptesNecessaires / COMPTES_DE_L_OFFRE_DE_BASE - 1) * 100),
    hausseNecessaireALaPremiereAnnee: auDixieme((comptesNecessairesALaPremiereAnnee / COMPTES_DE_L_OFFRE_DE_BASE - 1) * 100),
    ecart,
    ecartALaPremiereAnnee: auCentime(m.margePremiereAnnee - b.margePremiereAnnee),
    plafond,
    signer: ecart > 0,
    // Les erreurs classiques : ne compter que le compte en plus, en oubliant la hausse payée par les autres.
    valeurDuCompteEnPlus: m.netParCompte,
    hausseSurLesAutres: auCentime(COMPTES_DE_L_OFFRE_DE_BASE * (b.netParCompte - m.netParCompte)),
  };
}

export const LA_MISE_EN_AVANT_PAYANTE: Situation = {
  code: "la-mise-en-avant-payante",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["commissions-des-partenaires"],
  commanditaire: "La directrice commerciale",
  titre: "La mise en avant payante",
  accroche:
    "La plateforme promet un compte de plus par an contre une commission plus forte. La directrice commerciale a fait le compte sur la première année : faut-il signer ?",
  objectifs: [
    "Comparer deux offres d'un partenaire sur la première année et sur la vie des comptes",
    "Retrouver à rebours les comptes qui paieraient une hausse de commission",
    "Trouver la commission la plus haute qu'une offre peut prendre",
    "Rédiger une réponse chiffrée à la directrice commerciale",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_PARTENAIRES,
    pourquoi:
      "ce cas se joue au cabinet ATLAS CONSEIL, qui gagne ses comptes d'entreprise un à un, par sa propre prospection ou par des partenaires payés à la commission : c'est là qu'une commission se pèse sur toute la vie d'un compte.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la directrice commerciale",
      texte: (c) => {
        const r = miseEnAvant(c);
        return [
          `« L'an prochain, nous passerons aussi par la plateforme de mise en relation. Son offre de base nous amènerait ${qte(r.b.comptes)} comptes par an, à ${pct(r.b.commission * 100)} de chaque mission. Elle nous propose sa mise en avant : notre cabinet en tête de ses recherches, ${qte(r.m.comptes)} comptes par an, mais ${pct(r.m.commission * 100)} de commission, sur tous les comptes. J'ai fait le compte sur la première année : nous y perdrions. Faut-il signer ? »`,
          `Les comptes de la plateforme sont des comptes moyens du cabinet : la fiche donne leur chiffre d'affaires et leur marge, l'attrition de ${pct(r.x.n.attrition * 100)} vaut pour toute leur vie, et ${pct(r.x.plateforme.partQuiRevientEnDirect * 100)} d'entre eux reviennent signer en direct après la première année, dans les deux offres. Les comptes promis sont des comptes attendus.`,
          "Pas de cours cette fois : la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = miseEnAvant(c);
        return {
          titre: `Les deux offres de la plateforme · ${r.x.f.entreprise}`,
          colonnes: ["Offre de base", "Mise en avant"],
          lignes: [
            { libelle: "Commission, en part de chaque mission", valeurs: [pct(r.b.commission * 100), pct(r.m.commission * 100)] },
            { libelle: "Comptes attendus par an", valeurs: [qte(r.b.comptes), qte(r.m.comptes)] },
            { libelle: "Comptes revenus en direct après la première année", valeurs: [pct(r.x.plateforme.partQuiRevientEnDirect * 100), pct(r.x.plateforme.partQuiRevientEnDirect * 100)] },
            { libelle: "Chiffre d'affaires d'un compte, par an", valeurs: [eur(r.x.m.chiffreDAffaires), eur(r.x.m.chiffreDAffaires)] },
            { libelle: "Marge d'un compte, par an", valeurs: [eur(r.x.m.marge), eur(r.x.m.marge)] },
            { libelle: "Comptes perdus chaque année (attrition)", valeurs: [pct(r.x.n.attrition * 100), pct(r.x.n.attrition * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge de la première année et la valeur vie nette des comptes, dans les deux offres, les comptes qu'il faudrait pour payer la hausse, la commission la plus haute que la mise en avant peut prendre, et votre réponse.",
    },
    {
      id: "la-premiere-annee",
      type: "montants",
      titre: "Le compte de la première année",
      notions: ["distribution_commission", "contribution_margin"],
      question: () =>
        "Refaites le compte de la directrice. Calculez la commission de la première année sur un compte, dans l'offre de base puis avec la mise en avant, et la marge que laissent, la première année, les comptes de chaque offre une fois la commission payée.",
      champs: (c) => {
        const r = miseEnAvant(c);
        const ca = r.x.m.chiffreDAffaires;
        return [
          { libelle: "Commission de la première année, offre de base", attendu: r.b.premiere, calcul: `${eur(ca)} × ${pct(r.b.commission * 100)} = ${eur(r.b.premiere)}` },
          { libelle: "Commission de la première année, mise en avant", attendu: r.m.premiere, calcul: `${eur(ca)} × ${pct(r.m.commission * 100)} = ${eur(r.m.premiere)}` },
          {
            libelle: "Marge de la première année, offre de base",
            attendu: r.b.margePremiereAnnee,
            calcul: `${qte(r.b.comptes)} × (${eur(r.x.m.marge)} − ${eur(r.b.premiere)}) = ${eur(r.b.margePremiereAnnee)}`,
          },
          {
            libelle: "Marge de la première année, mise en avant",
            attendu: r.m.margePremiereAnnee,
            calcul: `${qte(r.m.comptes)} × (${eur(r.x.m.marge)} − ${eur(r.m.premiere)}) = ${eur(r.m.margePremiereAnnee)}`,
          },
        ];
      },
      explication: (c) => {
        const r = miseEnAvant(c);
        return [
          r.ecartALaPremiereAnnee < 0
            ? `La directrice a raison sur la première année : la mise en avant laisse ${eur(-r.ecartALaPremiereAnnee)} de moins. La hausse de ${qte(r.hausse)} points se paie sur tous les comptes, pas seulement sur celui qu'elle amène en plus.`
            : `Sur la première année, la mise en avant laisse déjà ${eur(r.ecartALaPremiereAnnee)} de plus.`,
          "Mais un compte ne vit pas un an : la comparaison se fait sur sa vie.",
        ];
      },
    },
    {
      id: "sur-la-vie",
      type: "montants",
      titre: "Les deux offres sur la vie des comptes",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: () =>
        "À la valeur vie simple, calculez les commissions de la mise en avant sur toute la vie d'un compte, la valeur vie nette d'un compte dans chaque offre, puis la valeur vie nette des comptes d'une année, dans chaque offre.",
      champs: (c) => {
        const r = miseEnAvant(c);
        const x = r.x;
        return [
          {
            libelle: "Commissions sur la vie d'un compte, mise en avant",
            attendu: r.m.surLaVie,
            calcul: `${eur(r.m.premiere)} + ${eur(r.m.premiere)} × (1 − ${pct(x.plateforme.partQuiRevientEnDirect * 100)}) × (1 − ${pct(x.n.attrition * 100)}) ÷ ${pct(x.n.attrition * 100)} = ${eur(r.m.premiere)} + ${eur(r.m.suivante)} × ${qte(x.anneesSuivantes)} = ${eur(r.m.surLaVie)}`,
          },
          { libelle: "Valeur vie nette d'un compte, offre de base", attendu: r.b.netParCompte, calcul: `${eur(x.v.valeurVie)} − (${eur(r.b.premiere)} + ${eur(r.b.suivante)} × ${qte(x.anneesSuivantes)}) = ${eur(r.b.netParCompte)}` },
          { libelle: "Valeur vie nette d'un compte, mise en avant", attendu: r.m.netParCompte, calcul: `${eur(x.v.valeurVie)} − ${eur(r.m.surLaVie)} = ${eur(r.m.netParCompte)}` },
          { libelle: "Valeur vie nette des comptes d'une année, offre de base", attendu: r.b.valeur, calcul: `${qte(r.b.comptes)} × ${eur(r.b.netParCompte)} = ${eur(r.b.valeur)}` },
          { libelle: "Valeur vie nette des comptes d'une année, mise en avant", attendu: r.m.valeur, calcul: `${qte(r.m.comptes)} × ${eur(r.m.netParCompte)} = ${eur(r.m.valeur)}` },
        ];
      },
      explication: (c) => {
        const r = miseEnAvant(c);
        return [
          r.signer
            ? `Sur la vie des comptes, la mise en avant laisse ${eur(r.ecart)} de plus : le compte en plus vaut ${eur(r.valeurDuCompteEnPlus)}, et la hausse coûte ${eur(r.hausseSurLesAutres)} sur les ${qte(r.b.comptes)} autres.`
            : `Sur la vie des comptes, la mise en avant laisse ${eur(-r.ecart)} de moins : le compte en plus vaut ${eur(r.valeurDuCompteEnPlus)}, et la hausse coûte ${eur(r.hausseSurLesAutres)} sur les ${qte(r.b.comptes)} autres.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Les comptes qui paieraient la hausse",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: () =>
        "Combien de comptes attendus par an faudrait-il à la mise en avant pour laisser autant que l'offre de base sur la vie des comptes (au centième) ? Quelle hausse des comptes cela représente-t-il, au centième ? Et quelle hausse faudrait-il si l'on ne regardait que la première année, au dixième ?",
      champs: (c) => {
        const r = miseEnAvant(c);
        return [
          { libelle: "Comptes nécessaires, sur la vie", attendu: r.comptesNecessaires, tolerance: 0.01, calcul: `${eur(r.b.valeur)} ÷ ${eur(r.m.netParCompte)} = ${qte(r.comptesNecessaires)} comptes attendus` },
          {
            libelle: "Hausse nécessaire des comptes, sur la vie (%)",
            attendu: r.hausseNecessaire,
            tolerance: 0.1,
            calcul: `(${qte(r.comptesNecessaires)} ÷ ${qte(r.b.comptes)} − 1) × 100 = ${pct(r.hausseNecessaire)}`,
          },
          {
            libelle: "Hausse nécessaire, sur la première année seule (%)",
            attendu: r.hausseNecessaireALaPremiereAnnee,
            tolerance: 0.1,
            calcul: `(${eur(r.b.margePremiereAnnee)} ÷ (${eur(r.x.m.marge)} − ${eur(r.m.premiere)}) ÷ ${qte(r.b.comptes)} − 1) × 100 = ${pct(r.hausseNecessaireALaPremiereAnnee)}`,
          },
        ];
      },
      explication: (c) => {
        const r = miseEnAvant(c);
        return [
          `La plateforme promet ${pct(r.promesse)} de comptes en plus. Sur la vie des comptes, il en faudrait ${pct(r.hausseNecessaire)} ; sur la première année seule, ${pct(r.hausseNecessaireALaPremiereAnnee)}. Les deux lectures se croisent : la promesse passe la barre de la vie, pas celle de la première année.`,
          "La première année exagère le coût d'une hausse : elle pèse sur une marge que la commission entame déjà, et elle ignore les comptes qui reviennent en direct.",
        ];
      },
    },
    {
      id: "jusqu-ou",
      type: "curseur",
      titre: "Jusqu'où la commission de la mise en avant",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: (c) => {
        const r = miseEnAvant(c);
        return `La plateforme pourrait demander plus. Faites varier la commission de la mise en avant, de ${pct(COMMISSION_DU_CURSEUR_DU_CAS.min)} à ${pct(COMMISSION_DU_CURSEUR_DU_CAS.max)}, ses ${qte(r.m.comptes)} comptes restant promis. Placez le curseur sur la plus haute commission, au pourcentage entier, où ses comptes laissent encore, sur leur vie, autant que l'offre de base (${eur(r.b.valeur)}), puis validez.`;
      },
      grandeur: () => ({ libelle: "Commission de la mise en avant", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: miseEnAvant(c).plafond, min: COMMISSION_DU_CURSEUR_DU_CAS.min, max: COMMISSION_DU_CURSEUR_DU_CAS.max }),
      zones: ["La mise en avant laisse plus", "L'offre de base laisse plus"],
      rates: () => ({
        dessous: "Plus haut, la mise en avant laisse encore autant que l'offre de base : cherchez la commission la plus haute.",
        dessus: "À cette commission, les comptes promis laissent moins que ceux de l'offre de base.",
      }),
      montrer: "Montrer la commission la plus haute",
      lecture: (c, t) => {
        const r = miseEnAvant(c);
        const x = r.x;
        const vie = auCentime(((x.m.chiffreDAffaires * t) / 100) * x.facteur);
        const valeur = auCentime(r.m.comptes * (x.v.valeurVie - vie));
        return [
          { libelle: "Commissions sur la vie d'un compte", montant: vie },
          { libelle: "Valeur vie nette des comptes promis", montant: valeur },
          { libelle: "Valeur vie nette des comptes de l'offre de base", montant: r.b.valeur },
          { libelle: "Écart en faveur de la mise en avant", montant: auCentime(valeur - r.b.valeur), fort: true },
        ];
      },
      droites: (c) => {
        const r = miseEnAvant(c);
        const x = r.x;
        return {
          produit: (t) => r.m.comptes * (x.v.valeurVie - ((x.m.chiffreDAffaires * t) / 100) * x.facteur),
          cout: () => r.b.valeur,
          libelles: ["Valeur vie nette des comptes de la mise en avant", "Valeur vie nette des comptes de l'offre de base"],
        };
      },
      explication: (c) => {
        const r = miseEnAvant(c);
        return [
          `Avec ${qte(r.m.comptes)} comptes promis, la mise en avant reste meilleure jusqu'à ${pct(r.plafond)} de commission ; elle en demande ${pct(r.m.commission * 100)}. C'est la marge de négociation du cabinet, si la promesse est tenue.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice commerciale",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: () => "Quelle phrase envoyez-vous à la directrice commerciale ?",
      options: (c) => {
        const r = miseEnAvant(c);
        const sens = r.signer ? "de plus" : "de moins";
        return [
          {
            texte: r.signer ? `Signer : sur la vie, la mise en avant laisse ${eur(r.ecart)} de plus` : `Refuser : sur la vie, la mise en avant laisse ${eur(-r.ecart)} de moins`,
            juste: true,
            retour: `Oui : sur la vie des comptes, ${qte(r.m.comptes)} comptes à ${eur(r.m.netParCompte)} laissent ${eur(r.m.valeur)}, contre ${eur(r.b.valeur)} pour ${qte(r.b.comptes)} comptes à ${eur(r.b.netParCompte)}, soit ${eur(Math.abs(r.ecart))} ${sens}. Il suffirait de ${qte(r.comptesNecessaires)} comptes attendus ; la plateforme en promet ${qte(r.m.comptes)}. Le compte de la première année trompe : il ignore les années où les comptes, revenus en direct ou non, rapportent encore.`,
          },
          {
            texte: `Refuser : la première année, la mise en avant laisse ${eur(Math.abs(r.ecartALaPremiereAnnee))} ${r.ecartALaPremiereAnnee < 0 ? "de moins" : "de plus"}`,
            juste: false,
            retour: `Non : c'est juger une commission qui revient chaque année sur sa seule première année. Sur la vie des comptes, la mise en avant laisse ${eur(r.m.valeur)} contre ${eur(r.b.valeur)}.`,
          },
          {
            texte: `Signer : un compte de plus, c'est ${eur(r.valeurDuCompteEnPlus)} de valeur vie en plus`,
            juste: false,
            retour: `Non, pas ce chiffre : c'est la valeur du compte en plus, mais la hausse de commission se paie aussi sur les ${qte(r.b.comptes)} autres, ${eur(r.hausseSurLesAutres)} sur leur vie. Tout compté, l'écart est de ${eur(r.ecart)}.`,
          },
          {
            texte: `Refuser : à ${pct(r.m.commission * 100)}, un compte de la plateforme vaut moins qu'un compte gagné en propre`,
            juste: false,
            retour: `Non : c'est vrai (${eur(r.m.netParCompte)} contre ${eur(r.x.v.enPropre)}), mais ce n'est pas la question. Les comptes de la plateforme viennent en plus de la conquête du cabinet ; entre ses deux offres, c'est la mise en avant qui laisse le plus.`,
          },
        ];
      },
    },
  ],
};
