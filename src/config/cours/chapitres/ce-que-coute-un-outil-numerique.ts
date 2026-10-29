import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { accordPluriel } from "../accords";
import { type Cas } from "../cas";
import {
  ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS,
  ADOPTIONS_ESSAYEES,
  ADOPTION_DE_LA_PREMIERE_ANNEE,
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FICHE_DE_CAPACITE,
  FORMATION_PAR_UTILISATEUR,
  MISE_EN_PLACE,
  MOIS_PAR_AN,
  PART_DES_VENTES_RETROUVEES,
  adoptionQuiPaieLAbonnement,
  adoptionQuiRembourseDansLAnnee,
  outilNumerique as outilDuMonde,
} from "../monde/gestion-et-information";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : CE QUE COÛTE ET RAPPORTE UN OUTIL NUMÉRIQUE (Bac STMG, systèmes d'information de
 * gestion, palier 1).
 *
 * Le gérant de NOVA hésite à s'abonner à un logiciel de gestion commerciale en ligne : les commandes
 * et la demande de chaque clientèle, suivies par toute l'équipe au même endroit, au jour le jour.
 * L'élève calcule ce que l'outil coûte la première année (l'abonnement de chaque utilisateur, la
 * mise en place, la formation), ce qu'il peut rapporter chaque année, son délai de récupération,
 * puis la condition pour qu'il rapporte : que l'équipe s'en serve. Un curseur (le taux d'adoption qui
 * paie l'abonnement) et un laboratoire (le taux d'adoption qui rembourse l'outil dans l'année).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule. Ce qui vient du monde : l'équipe (les
 * quatre opérateurs de la paie, les utilisateurs), et les ventes que fait manquer aujourd'hui un
 * trimestre de retard dans les chiffres (l'équipe en retard du chapitre « Une information qui circule
 * à temps », 2 162 enceintes dans l'année N), à 21 € de marge chacune. Tout le reste est une
 * hypothèse du cas, nommée et commentée dans monde/gestion-et-information.ts : l'abonnement, la mise
 * en place, la formation, la part des ventes que l'outil fait retrouver, l'adoption de la première
 * année.
 *
 * Ce n'est ni « Immobilisations et amortissements », ni « Croître en investissant » : ici, une
 * dépense de système d'information, faite surtout d'un abonnement, dont le gain dépend de l'usage.
 *
 * CE QUI A CHANGÉ. Le chapitre chiffrait le gain sur les ventes manquées de l'arène, dans huit
 * entreprises. Chez NOVA, l'outil coûte maintenant 5 620 € la première année et rapporte 13 629 €
 * par an si toute l'équipe s'en sert.
 */

export { ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS, ADOPTION_DE_LA_PREMIERE_ANNEE, FORMATION_PAR_UTILISATEUR, MISE_EN_PLACE, MOIS_PAR_AN, PART_DES_VENTES_RETROUVEES };

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_L_OUTIL = ENTREPRISES_DE_LA_GESTION_DE_BASE;

export const POURQUOI_L_OUTIL =
  "ce chapitre chiffre le gain de l'outil sur les ventes que NOVA manque faute de voir ses commandes à temps, que le cours sait compter.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const mois = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} mois`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = ReturnType<typeof outilDuMonde>["verdict"];

/** Ce que l'outil coûte et rapporte chez NOVA, à l'adoption de la première année. */
export const outilNumerique = (_c?: Cas, adoption = ADOPTION_DE_LA_PREMIERE_ANNEE) => outilDuMonde(FICHE_DE_CAPACITE, adoption);

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
  entreprises: { codes: ENTREPRISES_DE_L_OUTIL, pourquoi: POURQUOI_L_OUTIL },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un logiciel pour voir les commandes à temps",
      notions: ["capacity", "contribution_margin"],
      texte: (c) => {
        const o = outilNumerique(c);
        return [
          `Le gérant ${dE(c.entreprise)} hésite à s'abonner à un logiciel de gestion commerciale en ligne : les commandes de chaque clientèle, suivies par toute l'équipe au même endroit, au lieu d'un tableur consolidé une fois par trimestre. L'offre compte trois dépenses : un abonnement pour chacun des ${qte(o.utilisateurs)} salariés, une mise en place et une formation, payées une fois.`,
          `Aujourd'hui, les chiffres des ventes arrivent à ceux qui fixent la production avec un trimestre de retard. Dans l'année N, ce retard a laissé repartir ${qte(o.ventesManquees)} ${c.unites} ${accordPluriel(c, "demandé")} sans être ${accordPluriel(c, "servi")}.`,
          `Ce que l'outil ferait gagner est une hypothèse du cas : si toute l'équipe s'en sert, il fait retrouver ${PART} % de ces ventes manquées, et chacune rapporte sa marge sur coût variable, ${eur(o.marge)}.`,
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
            { libelle: `Ventes manquées à cause du retard, dans l'année (${c.unites})`, valeurs: [qte(o.ventesManquees)] },
            { libelle: "Marge sur coût variable d'une enceinte", valeurs: [eur(o.marge)] },
            { libelle: "Part de ces ventes que l'outil fait retrouver (hypothèse)", valeurs: [`${PART} %`] },
          ],
        };
      },
      repere: () => "Coût de la première année = abonnement de l'année + mise en place + formation. Délai de récupération = dépenses de départ ÷ gain net de l'année × 12, en mois.",
    },
    {
      id: "cout",
      objectifs: [0],
      type: "montants",
      titre: "Ce que l'outil coûte la première année",
      notions: ["fixed_costs"],
      question: () => `Calculez l'abonnement de l'année pour toute l'équipe (${MOIS_PAR_AN} mois), la formation de tous les utilisateurs, puis le coût total de la première année, mise en place comprise.`,
      champs: (c) => {
        const o = outilNumerique(c);
        return [
          { libelle: "Abonnement de l'année", attendu: o.abonnement, calcul: `${qte(o.utilisateurs)} × ${eur(ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS)} × ${MOIS_PAR_AN} = ${eur(o.abonnement)}` },
          { libelle: "Formation des utilisateurs", attendu: o.formation, calcul: `${qte(o.utilisateurs)} × ${eur(FORMATION_PAR_UTILISATEUR)} = ${eur(o.formation)}` },
          { libelle: "Coût total de la première année", attendu: o.coutPremiereAnnee, calcul: `${eur(o.abonnement)} + ${eur(MISE_EN_PLACE)} + ${eur(o.formation)} = ${eur(o.coutPremiereAnnee)}` },
        ];
      },
      explication: (c) => {
        const o = outilNumerique(c);
        return [`La mise en place et la formation, ${eur(o.depart)}, ne se paient qu'une fois : ce sont les dépenses de départ. L'abonnement, ${eur(o.abonnement)}, revient chaque année, tant que l'outil sert.`];
      },
    },
    {
      id: "gain",
      objectifs: [1],
      type: "montants",
      titre: "Ce que l'outil peut rapporter",
      notions: ["contribution_margin", "capacity"],
      question: (c) => `Si toute l'équipe s'en sert, l'outil fait retrouver ${PART} % des ventes manquées. Calculez ces ventes retrouvées sur l'année, à l'unité (en ${c.unites}), puis le gain annuel qu'elles rapportent.`,
      champs: (c) => {
        const o = outilNumerique(c);
        return [
          { libelle: `Ventes retrouvées sur l'année (${c.unites})`, attendu: o.ventesRetrouvees, calcul: `${qte(o.ventesManquees)} × ${PART} % = ${qte(o.ventesRetrouvees)}`, tolerance: 1 },
          { libelle: "Gain annuel", attendu: o.gain, calcul: `${qte(o.ventesRetrouvees)} × ${eur(o.marge)} = ${eur(o.gain)}`, tolerance: 21 },
        ];
      },
      explication: (c) => {
        const o = outilNumerique(c);
        return [
          `${eur(o.gain)} par an, c'est la marge des ventes que ${c.entreprise} retrouverait en voyant ses commandes à temps. Le calcul repose sur une hypothèse, la part des ventes retrouvées : avec une autre part, le gain change dans la même proportion.`,
          "L'outil fait aussi gagner du temps (moins de saisies en double, moins de recherches). Le cas ne le compte pas : ce temps ne rapporte que s'il sert à vendre plus ou évite une embauche.",
        ];
      },
    },
    {
      id: "delai",
      objectifs: [2],
      type: "montants",
      titre: "Le délai de récupération",
      notions: ["irr_payback"],
      question: () => "Le gain net de l'année est le gain annuel moins l'abonnement. Calculez-le, puis le délai de récupération : le nombre de mois de gain net qu'il faut pour rembourser les dépenses de départ (mise en place et formation), au dixième.",
      champs: (c) => {
        const o = outilNumerique(c);
        return [
          { libelle: "Gain net de l'année", attendu: o.gainNet, calcul: `${eur(o.gain)} − ${eur(o.abonnement)} = ${eur(o.gainNet)}`, tolerance: 1 },
          { libelle: "Délai de récupération (mois)", attendu: o.delai, calcul: `${eur(o.depart)} ÷ ${eur(o.gainNet)} × ${MOIS_PAR_AN} = ${mois(o.delai)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const o = outilNumerique(c);
        return [o.delai <= MOIS_PAR_AN ? `Si toute l'équipe s'en sert, l'outil se rembourse en ${mois(o.delai)}, dans la première année.` : `Si toute l'équipe s'en sert, l'outil se rembourse en ${mois(o.delai)}, plus d'un an.`];
      },
    },
    {
      id: "adoption",
      objectifs: [3],
      type: "montants",
      titre: "Si l'équipe ne s'en sert pas",
      notions: ["irr_payback", "productivity"],
      question: () => `Le gain suit la part de l'équipe qui se sert vraiment de l'outil ; l'abonnement, lui, se paie pour tous. Calculez le taux d'adoption sous lequel le gain ne couvre plus l'abonnement (abonnement ÷ gain annuel × 100, au dixième), puis le gain et le gain net de l'année si ${A} % de l'équipe s'en sert.`,
      champs: (c) => {
        const o = outilNumerique(c);
        return [
          { libelle: "Taux d'adoption minimal (%)", attendu: o.seuilDAdoption, calcul: `${eur(o.abonnement)} ÷ ${eur(o.gain)} × 100 = ${pct(o.seuilDAdoption)}`, tolerance: 0.1 },
          { libelle: `Gain de l'année à ${A} % d'adoption`, attendu: o.gainAdopte, calcul: `${eur(o.gain)} × ${A} % = ${eur(o.gainAdopte)}`, tolerance: 1 },
          { libelle: `Gain net de l'année à ${A} % d'adoption`, attendu: o.gainNetAdopte, calcul: `${eur(o.gainAdopte)} − ${eur(o.abonnement)} = ${eur(o.gainNetAdopte)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const o = outilNumerique(c);
        return [`Sous ${pct(o.seuilDAdoption)} d'adoption, ${c.entreprise} paierait l'abonnement sans le regagner. Un outil numérique ne rapporte que si ses utilisateurs s'en servent : la formation et l'accompagnement font partie de l'investissement.`];
      },
    },
    {
      id: "verdict",
      objectifs: [4],
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
          { texte: "L'outil se rembourse dans la première année", juste: o.verdict === "rembourse-dans-l-annee", retour: o.verdict === "rembourse-dans-l-annee" ? `Oui : à ${A} % d'adoption, le gain net se monte à ${eur(o.gainNetAdopte)} par an, et les dépenses de départ sont remboursées en ${mois(o.delaiAdopte!)}.` : `Non : la première année, le gain (${eur(o.gainAdopte)}) reste sous son coût (${eur(o.coutPremiereAnnee)}).` },
          { texte: "Il se rembourse, mais en plus d'un an", juste: o.verdict === "rembourse-en-plus-d-un-an", retour: o.verdict === "rembourse-en-plus-d-un-an" ? `Oui : à ${A} % d'adoption, il faut ${mois(o.delaiAdopte!)} pour rembourser les ${eur(o.depart)} de départ.` : `Non : le gain de la première année (${eur(o.gainAdopte)}) couvre déjà son coût (${eur(o.coutPremiereAnnee)}).` },
          { texte: "Il ne couvre même pas son abonnement", juste: o.verdict === "ne-couvre-pas-l-abonnement", retour: o.verdict === "ne-couvre-pas-l-abonnement" ? `Oui : à ${A} %, le gain reste sous l'abonnement.` : `Non : à ${A} % d'adoption, le gain (${eur(o.gainAdopte)}) dépasse l'abonnement (${eur(o.abonnement)}).` },
        ];
      },
    },
    {
      id: "l-adoption-qui-paie",
      objectifs: [3],
      type: "curseur",
      titre: "L'adoption qui paie l'abonnement",
      notions: ["irr_payback", "productivity"],
      question: (c) => {
        const o = outilNumerique(c);
        return `Faites varier la part de l'équipe qui se sert de l'outil, en pour cent : une droite donne le gain de l'année, l'autre l'abonnement, ${eur(o.abonnement)}, qui se paie quoi qu'il arrive. Placez le curseur sur le plus petit taux d'adoption, en pour cent entier, où le gain paie l'abonnement.`;
      },
      grandeur: () => ({ libelle: "Part de l'équipe qui se sert de l'outil", unite: "%" }),
      cible: () => ({ attendu: adoptionQuiPaieLAbonnement(FICHE_DE_CAPACITE), min: 0, max: 100 }),
      zones: ["Le gain paie l'abonnement", "L'abonnement coûte plus que l'outil ne rapporte"],
      rates: () => ({ dessous: "Avec si peu d'utilisateurs, le gain ne paie pas l'abonnement.", dessus: "Le gain paie l'abonnement, mais un taux plus bas suffirait : cherchez le plus petit." }),
      montrer: "Montrer le taux",
      lecture: (c, a) => {
        const o = outilNumerique(c, a / 100);
        return [
          { libelle: "Gain de l'année", montant: o.gainAdopte, fort: true },
          { libelle: "Abonnement de l'année", montant: o.abonnement },
          { libelle: "Gain net de l'année", montant: o.gainNetAdopte },
        ];
      },
      droites: (c) => ({ produit: (a) => outilNumerique(c, a / 100).gainAdopte, cout: () => outilNumerique(c).abonnement, libelles: ["Gain de l'année", "Abonnement"] }),
      explication: (c) => {
        const a = adoptionQuiPaieLAbonnement(FICHE_DE_CAPACITE);
        const o = outilNumerique(c, a / 100);
        return [
          `À ${qte(a)} %, le gain, ${eur(o.gainAdopte)}, paie l'abonnement, ${eur(o.abonnement)}.`,
          "Ce taux ne rembourse pas encore la mise en place et la formation : il dit seulement à partir de quand l'outil cesse de coûter.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-adoption",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de l'adoption",
      notions: ["irr_payback", "productivity"],
      question: () => "Faites varier la part de l'équipe qui se sert de l'outil la première année, et comparez son gain à tout ce qu'il coûte cette année-là : l'abonnement, la mise en place, la formation.",
      leviers: () => [{ code: "adoption", libelle: "Part de l'équipe qui se sert de l'outil", unite: "%", ...ADOPTIONS_ESSAYEES, depart: 0 }],
      lecture: (c, p) => {
        const o = outilNumerique(c, p.adoption! / 100);
        return [
          { libelle: "Gain de la première année", montant: o.gainAdopte },
          { libelle: "Coût de la première année", montant: o.coutPremiereAnnee },
          { libelle: "Solde de la première année", montant: o.soldePremiereAnneeAdopte, fort: true },
        ];
      },
      defi: (c) => {
        const juste = adoptionQuiRembourseDansLAnnee(FICHE_DE_CAPACITE);
        return {
          consigne: "Trouvez le plus petit taux d'adoption, de 10 en 10 points, qui rembourse l'outil dans la première année.",
          atteint: (p) => p.adoption === juste,
          indice: (p) => {
            const o = outilNumerique(c, p.adoption! / 100);
            return o.soldePremiereAnneeAdopte < 0 ? `À ${qte(p.adoption!)} %, la première année coûte ${eur(-o.soldePremiereAnneeAdopte)} de plus qu'elle ne rapporte.` : `À ${qte(p.adoption!)} %, la première année rapporte ${eur(o.soldePremiereAnneeAdopte)} de plus qu'elle ne coûte : un taux plus bas suffirait-il ?`;
          },
          solution: { adoption: juste },
        };
      },
      explication: (c, p) => {
        const o = outilNumerique(c, p.adoption! / 100);
        return [
          `Défi relevé : à ${qte(p.adoption!)} % d'adoption, le gain de la première année, ${eur(o.gainAdopte)}, couvre tout son coût, ${eur(o.coutPremiereAnnee)}. La première année réelle, à ${A} %, fait mieux : ${eur(outilNumerique(c).soldePremiereAnneeAdopte)} de solde.`,
          `Il suffit que ${qte(p.adoption!)} % de l'équipe s'en serve pour rembourser l'outil en un an : la formation n'est pas une dépense de plus, c'est ce qui fait venir le gain.`,
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
          "Un outil numérique se juge comme un investissement : ce qu'il coûte au départ, ce qu'il coûte chaque année, ce qu'il rapporte chaque année. Son gain est presque toujours une hypothèse, qu'il faut chiffrer sur ses propres données. Dans l'arène, vos tableaux de fin de tour sont un outil : lisez-les chaque tour.",
        ];
      },
      repere: () => "Gain net = gain annuel − abonnement ; délai de récupération = dépenses de départ ÷ gain net × 12 ; taux d'adoption minimal = abonnement ÷ gain annuel.",
    },
  ],
};
