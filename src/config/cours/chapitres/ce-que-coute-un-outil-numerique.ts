import type { CompanyRoundResult } from "../../../engine/types";
import { soldUnits } from "../../../engine/simulation/runGame";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { accordPluriel } from "../accords";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : CE QUE COÛTE ET RAPPORTE UN OUTIL NUMÉRIQUE (Bac STMG, systèmes d'information de
 * gestion, palier 1).
 *
 * Le gérant hésite à s'abonner à un logiciel de gestion commerciale en ligne : les commandes, les
 * stocks et la demande de chaque clientèle, suivis par toute l'équipe au même endroit. L'élève
 * calcule ce que l'outil coûte la première année (l'abonnement de chaque utilisateur, la mise en
 * place, la formation), ce qu'il peut rapporter chaque année, son délai de récupération, puis la
 * condition pour qu'il rapporte : que l'équipe s'en serve. Le chapitre finit sur la première année
 * telle qu'elle se passe souvent, quand une partie de l'équipe garde ses habitudes.
 *
 * L'ARÈNE NE SIMULE PAS DE LOGICIEL. Le chapitre le dit à l'élève : le gain de l'outil est une
 * hypothèse du cas, chiffrée sur les données de l'arène. Ce qui vient de l'arène, c'est l'effectif
 * (les utilisateurs), les ventes manquées de l'année du cours (`anneeJouee` : des clients repartis
 * sans être servis), la part de ces ventes manquées alors que l'entreprise avait encore de quoi
 * produire (sa capacité, la plus petite de celle de l'outil et de celle de l'équipe, moins sa
 * production du trimestre : c'est la production prévue qui était trop basse), et la marge sur coût
 * variable moyenne d'une unité vendue dans l'année (la marge de l'arène divisée par ses ventes).
 * Tout le reste est une constante du cours, nommée et commentée ci-dessous.
 *
 * Ce n'est ni « Immobilisations et amortissements » (le plan d'amortissement d'un équipement), ni
 * « Croître en investissant » (une machine de plus, sa capacité, son financement) : ici, une
 * dépense de système d'information, faite surtout d'un abonnement, dont le gain dépend de l'usage.
 *
 * VOLT FITNESS N'EN EST PAS : un adhérent manqué l'est pour tous les trimestres où il serait resté
 * abonné, et la marge d'une vente ne dit pas ce qu'il aurait rapporté.
 */

/**
 * L'abonnement au logiciel, par utilisateur et par mois, hors taxes : une hypothèse du cas, dans
 * l'ordre de grandeur des logiciels de gestion commerciale en ligne pour les petites entreprises.
 */
export const ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS = 40;

/** La mise en place, payée une fois : le paramétrage et la reprise des données (clients, articles, commandes en cours). Hypothèse du cas. */
export const MISE_EN_PLACE = 2_500;

/** La formation des utilisateurs, payée une fois : une journée par le prestataire, pour chaque utilisateur. Hypothèse du cas. */
export const FORMATION_PAR_UTILISATEUR = 300;

/**
 * LE GAIN DE L'OUTIL, hypothèse du cas : quand toute l'équipe s'en sert, il fait retrouver 30 % des
 * ventes manquées alors que l'entreprise avait de quoi produire, parce que la demande se voit à
 * temps pour ajuster la production. Dans l'année du cours, l'entreprise produit déjà pour la
 * demande du trimestre passé : ce qui lui échappe encore, avec de quoi produire, c'est la demande
 * qui change dans le trimestre même, celle que des commandes suivies au jour le jour font voir. Le
 * reste de ces ventes manquées tient à ce qu'aucun outil ne prévoit.
 *
 * (Le cours en comptait 5 % quand la gestion de l'élève laissait partir bien plus de clients : sur
 * l'année d'un bon gestionnaire, qui en manque peu, 5 % ne couvraient l'abonnement nulle part.)
 */
export const PART_DES_VENTES_RETROUVEES = 0.3;

/**
 * L'ADOPTION DE LA PREMIÈRE ANNÉE, hypothèse du cas : 60 % de l'équipe se sert vraiment de l'outil,
 * les autres gardent le tableur et le carnet. Le gain suit cette part ; l'abonnement, lui, se paie
 * pour chaque utilisateur inscrit.
 */
export const ADOPTION_DE_LA_PREMIERE_ANNEE = 0.6;

/** Les mois d'une année d'abonnement. */
export const MOIS_PAR_AN = 12;

/** Les entreprises du chapitre : toutes, sauf celle dont un client manqué est un abonné perdu pour plusieurs trimestres. */
export const ENTREPRISES_DE_L_OUTIL: readonly string[] = ENTREPRISES_DU_COURS.filter((code) => !scenarioByCode(code).scenario.subscription);

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const mois = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} mois`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

/** Les clients repartis sans être servis, dans un trimestre. */
const manquees = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0);
/** Ce que l'entreprise pouvait encore produire dans le trimestre : sa capacité (outil ou équipe, la plus petite) moins sa production. */
const capaciteLibre = (r: CompanyRoundResult) =>
  Math.max(0, Math.min(r.production.machineCapacity, r.production.laborCapacity ?? Infinity) - r.production.produced);

export type Verdict = "rembourse-dans-l-annee" | "rembourse-en-plus-d-un-an" | "ne-couvre-pas-l-abonnement";

/** Ce que l'outil coûte et rapporte, chez une entreprise : l'offre, les chiffres de l'arène, et les calculs. */
export function outilNumerique(c: Cas) {
  const annee = anneeJouee(c.code).partie.rounds.map((t) => t.results["joueur"]!);
  const ventesManquees = Math.round(annee.reduce((t, r) => t + manquees(r), 0));
  // Des clients repartis, à concurrence de ce que l'entreprise pouvait encore produire ce trimestre-là.
  const manqueesAvecDeLaPlace = Math.round(annee.reduce((t, r) => t + Math.min(manquees(r), capaciteLibre(r)), 0));
  const marge = auCentime(annee.reduce((t, r) => t + r.incomeStatement.grossMargin, 0) / annee.reduce((t, r) => t + soldUnits(r), 0));
  const utilisateurs = c.personnel.effectif;
  const abonnement = utilisateurs * ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS * MOIS_PAR_AN;
  const formation = utilisateurs * FORMATION_PAR_UTILISATEUR;
  const depart = MISE_EN_PLACE + formation;
  const coutPremiereAnnee = abonnement + depart;
  const ventesRetrouvees = Math.round(manqueesAvecDeLaPlace * PART_DES_VENTES_RETROUVEES);
  const gain = auCentime(ventesRetrouvees * marge);
  const gainNet = auCentime(gain - abonnement);
  const delai = auDixieme((depart / gainNet) * MOIS_PAR_AN);
  const seuilDAdoption = auDixieme((abonnement / gain) * 100);
  const gainAdopte = auCentime(gain * ADOPTION_DE_LA_PREMIERE_ANNEE);
  const gainNetAdopte = auCentime(gainAdopte - abonnement);
  const delaiAdopte = gainNetAdopte > 0 ? auDixieme((depart / gainNetAdopte) * MOIS_PAR_AN) : null;
  const verdict: Verdict =
    gainNetAdopte <= 0 ? "ne-couvre-pas-l-abonnement" : gainAdopte >= coutPremiereAnnee ? "rembourse-dans-l-annee" : "rembourse-en-plus-d-un-an";
  return {
    utilisateurs,
    ventesManquees,
    manqueesAvecDeLaPlace,
    marge,
    abonnement,
    formation,
    depart,
    coutPremiereAnnee,
    ventesRetrouvees,
    gain,
    gainNet,
    delai,
    seuilDAdoption,
    adoption: Math.round(ADOPTION_DE_LA_PREMIERE_ANNEE * 100),
    gainAdopte,
    gainNetAdopte,
    delaiAdopte,
    soldePremiereAnneeAdopte: auCentime(gainAdopte - coutPremiereAnnee),
    verdict,
  };
}

const A = Math.round(ADOPTION_DE_LA_PREMIERE_ANNEE * 100);
const PART = Math.round(PART_DES_VENTES_RETROUVEES * 100);

export const CE_QUE_COUTE_UN_OUTIL_NUMERIQUE: Chapitre = {
  code: "ce-que-coute-un-outil-numerique",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 1 · Organisation et numérisation", "STMG Thème 2 · Management du système d'information et performance"],
  titre: "Ce que coûte et rapporte un outil numérique",
  accroche:
    "Un logiciel de gestion commerciale en ligne : un abonnement par utilisateur, une mise en place, une formation. Ce qu'il coûte la première année, ce qu'il peut rapporter, le temps qu'il met à se rembourser, et ce qui le fait rapporter : que l'équipe s'en serve.",
  objectifs: [
    "Calculer le coût d'un outil numérique la première année",
    "Chiffrer le gain annuel d'un outil sur les données de l'entreprise",
    "Calculer un délai de récupération",
    "Calculer le taux d'adoption sous lequel l'outil ne rapporte pas",
    "Juger un outil sur sa première année réelle",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_OUTIL,
    pourquoi:
      "ce chapitre chiffre le gain de l'outil à la marge des ventes qu'il fait retrouver, et chez VOLT FITNESS un client manqué est un abonné perdu pour plusieurs trimestres, que la marge d'une vente ne mesure pas.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un logiciel pour ne plus manquer de ventes",
      notions: ["capacity", "contribution_margin"],
      texte: (c) => {
        const o = outilNumerique(c);
        return [
          `Le gérant ${dE(c.entreprise)} hésite à s'abonner à un logiciel de gestion commerciale en ligne : les commandes, les stocks et la demande de chaque clientèle, suivis par toute l'équipe au même endroit, au lieu d'un tableur et de carnets. L'offre compte trois dépenses : un abonnement pour chacun des ${qte(o.utilisateurs)} salariés, une mise en place et une formation, payées une fois.`,
          `Dans l'année du cours, ${qte(o.ventesManquees)} ${c.unites} ont été ${accordPluriel(c, "demandé")} sans être ${accordPluriel(c, "servi")}. ${o.manqueesAvecDeLaPlace === o.ventesManquees ? `Chaque fois, ${c.entreprise} avait encore de quoi produire` : `Pour ${qte(o.manqueesAvecDeLaPlace)} de ces ${c.unites}, ${c.entreprise} avait encore de quoi produire`} : c'est la production prévue qui était trop basse, faute de voir la demande à temps.`,
          `L'arène ne simule pas de logiciel. Ce que l'outil ferait gagner est une hypothèse du cas, chiffrée sur les données de l'arène : si toute l'équipe s'en sert, il fait retrouver ${PART} % de ces ventes manquées, et chacune rapporte la marge sur coût variable moyenne d'une unité vendue dans l'année.`,
        ];
      },
      tableau: (c) => {
        const o = outilNumerique(c);
        return {
          titre: `L'offre et les chiffres ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Abonnement par utilisateur et par mois", valeurs: [eur(ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS)] },
            { libelle: "Mise en place, payée une fois", valeurs: [eur(MISE_EN_PLACE)] },
            { libelle: "Formation par utilisateur, payée une fois", valeurs: [eur(FORMATION_PAR_UTILISATEUR)] },
            { libelle: "Utilisateurs (l'effectif)", valeurs: [qte(o.utilisateurs)] },
            { libelle: `Ventes manquées alors que l'entreprise pouvait produire (${c.unites})`, valeurs: [qte(o.manqueesAvecDeLaPlace)] },
            { libelle: "Marge sur coût variable moyenne d'une unité vendue", valeurs: [eur(o.marge)] },
            { libelle: "Part de ces ventes que l'outil fait retrouver (hypothèse)", valeurs: [`${PART} %`] },
          ],
        };
      },
      repere: () =>
        "Coût de la première année = abonnement de l'année + mise en place + formation. Délai de récupération = dépenses de départ ÷ gain net de l'année × 12, en mois.",
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que l'outil coûte la première année",
      notions: ["fixed_costs"],
      question: () =>
        `Calculez l'abonnement de l'année pour toute l'équipe (${MOIS_PAR_AN} mois), la formation de tous les utilisateurs, puis le coût total de la première année, mise en place comprise.`,
      champs: (c) => {
        const o = outilNumerique(c);
        return [
          {
            libelle: "Abonnement de l'année",
            attendu: o.abonnement,
            calcul: `${qte(o.utilisateurs)} × ${eur(ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS)} × ${MOIS_PAR_AN} = ${eur(o.abonnement)}`,
          },
          { libelle: "Formation des utilisateurs", attendu: o.formation, calcul: `${qte(o.utilisateurs)} × ${eur(FORMATION_PAR_UTILISATEUR)} = ${eur(o.formation)}` },
          {
            libelle: "Coût total de la première année",
            attendu: o.coutPremiereAnnee,
            calcul: `${eur(o.abonnement)} + ${eur(MISE_EN_PLACE)} + ${eur(o.formation)} = ${eur(o.coutPremiereAnnee)}`,
          },
        ];
      },
      explication: (c) => {
        const o = outilNumerique(c);
        return [
          `La mise en place et la formation, ${eur(o.depart)}, ne se paient qu'une fois : ce sont les dépenses de départ. L'abonnement, ${eur(o.abonnement)}, revient chaque année, tant que l'outil sert. Dans la durée, c'est la dépense qui revient tous les ans qui pèse.`,
        ];
      },
    },
    {
      id: "gain",
      type: "montants",
      titre: "Ce que l'outil peut rapporter",
      notions: ["contribution_margin", "capacity"],
      question: (c) =>
        `Si toute l'équipe s'en sert, l'outil fait retrouver ${PART} % des ventes manquées alors que l'entreprise pouvait produire. Calculez ces ventes retrouvées sur l'année, à l'unité (en ${c.unites}), puis le gain annuel qu'elles rapportent.`,
      champs: (c) => {
        const o = outilNumerique(c);
        return [
          {
            libelle: `Ventes retrouvées sur l'année (${c.unites})`,
            attendu: o.ventesRetrouvees,
            calcul: `${qte(o.manqueesAvecDeLaPlace)} × ${PART} % = ${qte(o.ventesRetrouvees)}`,
            tolerance: 1,
          },
          { libelle: "Gain annuel", attendu: o.gain, calcul: `${qte(o.ventesRetrouvees)} × ${eur(o.marge)} = ${eur(o.gain)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const o = outilNumerique(c);
        return [
          `${eur(o.gain)} par an, c'est la marge des ventes perdues par ${c.entreprise}, faute de voir la demande à temps. Le calcul repose sur une hypothèse, la part des ventes retrouvées : avec une autre part, le gain change dans la même proportion.`,
          "L'outil fait aussi gagner du temps (moins de saisies en double, moins de recherches). Le cas ne le compte pas : ce temps ne rapporte que s'il sert à vendre plus ou évite une embauche.",
        ];
      },
    },
    {
      id: "delai",
      type: "montants",
      titre: "Le délai de récupération",
      notions: ["irr_payback"],
      question: () =>
        `Le gain net de l'année est le gain annuel moins l'abonnement. Calculez-le, puis le délai de récupération : le nombre de mois de gain net qu'il faut pour rembourser les dépenses de départ (mise en place et formation), au dixième.`,
      champs: (c) => {
        const o = outilNumerique(c);
        return [
          { libelle: "Gain net de l'année", attendu: o.gainNet, calcul: `${eur(o.gain)} − ${eur(o.abonnement)} = ${eur(o.gainNet)}`, tolerance: 1 },
          {
            libelle: "Délai de récupération (mois)",
            attendu: o.delai,
            calcul: `${eur(o.depart)} ÷ ${eur(o.gainNet)} × ${MOIS_PAR_AN} = ${mois(o.delai)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const o = outilNumerique(c);
        return [
          o.delai <= MOIS_PAR_AN
            ? `Si toute l'équipe s'en sert, l'outil se rembourse en ${mois(o.delai)}, dans la première année : son gain couvre l'abonnement et les dépenses de départ.`
            : `Si toute l'équipe s'en sert, l'outil se rembourse en ${mois(o.delai)}, plus d'un an : son gain net, ${eur(o.gainNet)}, est petit face aux dépenses de départ.`,
        ];
      },
    },
    {
      id: "adoption",
      type: "montants",
      titre: "Si l'équipe ne s'en sert pas",
      notions: ["irr_payback", "productivity"],
      question: () =>
        `Le gain suit la part de l'équipe qui se sert vraiment de l'outil ; l'abonnement, lui, se paie pour tous. Calculez le taux d'adoption sous lequel le gain ne couvre plus l'abonnement (abonnement ÷ gain annuel × 100, au dixième), puis le gain et le gain net de l'année si ${A} % de l'équipe s'en sert.`,
      champs: (c) => {
        const o = outilNumerique(c);
        return [
          { libelle: "Taux d'adoption minimal (%)", attendu: o.seuilDAdoption, calcul: `${eur(o.abonnement)} ÷ ${eur(o.gain)} × 100 = ${pct(o.seuilDAdoption)}`, tolerance: 0.1 },
          { libelle: `Gain de l'année à ${A} % d'adoption`, attendu: o.gainAdopte, calcul: `${eur(o.gain)} × ${A} % = ${eur(o.gainAdopte)}`, tolerance: 1 },
          {
            libelle: `Gain net de l'année à ${A} % d'adoption`,
            attendu: o.gainNetAdopte,
            calcul: `${eur(o.gainAdopte)} − ${eur(o.abonnement)} = ${eur(o.gainNetAdopte)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const o = outilNumerique(c);
        return [
          `Sous ${pct(o.seuilDAdoption)} d'adoption, ${c.entreprise} paierait l'abonnement sans le regagner. Un outil numérique ne rapporte que si ses utilisateurs s'en servent : la formation et l'accompagnement font partie de l'investissement.`,
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "L'outil rapporte-t-il ?",
      notions: ["irr_payback"],
      question: (c) => {
        const o = outilNumerique(c);
        return `La première année, ${A} % de l'équipe ${dE(c.entreprise)} se sert de l'outil. Son gain est alors de ${eur(o.gainAdopte)}, pour un coût de ${eur(o.coutPremiereAnnee)} la première année. Que dire au gérant ?`;
      },
      options: (c) => {
        const o = outilNumerique(c);
        return [
          {
            texte: "L'outil se rembourse dans la première année",
            juste: o.verdict === "rembourse-dans-l-annee",
            retour:
              o.verdict === "rembourse-dans-l-annee"
                ? `Oui : à ${A} % d'adoption, le gain net se monte à ${eur(o.gainNetAdopte)} par an, et les dépenses de départ sont remboursées en ${mois(o.delaiAdopte!)}. L'outil rapporte même avec une partie de l'équipe qui s'en passe.`
                : `Non : la première année, le gain (${eur(o.gainAdopte)}) reste sous le coût de la première année (${eur(o.coutPremiereAnnee)}).`,
          },
          {
            texte: "Il se rembourse, mais en plus d'un an",
            juste: o.verdict === "rembourse-en-plus-d-un-an",
            retour:
              o.verdict === "rembourse-en-plus-d-un-an"
                ? `Oui : à ${A} % d'adoption, le gain net n'est que de ${eur(o.gainNetAdopte)} par an, et il faut ${mois(o.delaiAdopte!)} pour rembourser les ${eur(o.depart)} de départ. Faire adopter l'outil par toute l'équipe ramènerait ce délai à ${mois(o.delai)}.`
                : o.verdict === "rembourse-dans-l-annee"
                  ? `Non : le gain de la première année (${eur(o.gainAdopte)}) couvre déjà son coût (${eur(o.coutPremiereAnnee)}).`
                  : `Non : à ${A} % d'adoption, le gain ne couvre même pas l'abonnement, et l'outil ne se rembourse jamais.`,
          },
          {
            texte: "Il ne couvre même pas son abonnement",
            juste: o.verdict === "ne-couvre-pas-l-abonnement",
            retour:
              o.verdict === "ne-couvre-pas-l-abonnement"
                ? `Oui : à ${A} %, sous le taux minimal de ${pct(o.seuilDAdoption)}, le gain (${eur(o.gainAdopte)}) reste sous l'abonnement (${eur(o.abonnement)}) : chaque année coûte ${eur(-o.gainNetAdopte)}. L'outil ne rapporte que si presque toute l'équipe s'en sert.`
                : `Non : à ${A} % d'adoption, le gain (${eur(o.gainAdopte)}) dépasse l'abonnement (${eur(o.abonnement)}).`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["irr_payback"],
      texte: (c) => {
        const o = outilNumerique(c);
        return [
          `Chez ${c.entreprise}, l'outil coûte ${eur(o.coutPremiereAnnee)} la première année, puis ${eur(o.abonnement)} par an. Si toute l'équipe s'en sert, il rapporte ${eur(o.gain)} par an et se rembourse en ${mois(o.delai)} ; il cesse de rapporter sous ${pct(o.seuilDAdoption)} d'adoption. À ${A} %, le solde de la première année est de ${eur(o.soldePremiereAnneeAdopte)}.`,
          "Un outil numérique se juge comme un investissement : ce qu'il coûte au départ, ce qu'il coûte chaque année, ce qu'il rapporte chaque année. Son gain est presque toujours une hypothèse, qu'il faut chiffrer sur ses propres données ; et il ne vient que si les utilisateurs s'en servent.",
        ];
      },
      repere: () => "Gain net = gain annuel − abonnement ; délai de récupération = dépenses de départ ÷ gain net × 12 ; taux d'adoption minimal = abonnement ÷ gain annuel.",
    },
  ],
};
