import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { accord } from "../accords";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE PROJET D'ENTREPRISE, DE L'IDÉE AUX MOYENS DE DÉMARRER (Seconde, option
 * management et gestion, palier 1).
 *
 * Ce qu'il faut pour lancer l'activité, et qui le paie. Le chapitre lit ce que l'entreprise a
 * réuni le jour où la partie commence : ses équipements et ses autres biens durables, son stock,
 * l'argent que ses clients lui doivent encore, sa trésorerie (les besoins) ; les apports des
 * associés, l'emprunt, le délai que laissent les fournisseurs (les ressources). L'élève range
 * chaque ligne, vérifie que les deux totaux sont égaux, dit qui paie quoi, puis mesure combien
 * de jours la trésorerie de départ paie les charges fixes sans aucune vente.
 *
 * Il ne passe aucune écriture : c'est la logique du projet (que faut-il, combien, qui paie), au
 * niveau de la seconde. « De la création au premier bilan » fait passer les écritures.
 *
 * Tous les chiffres viennent de l'arène : le bilan d'ouverture de l'entreprise (`depart.finance`,
 * celui que `anneeJouee` part du scénario), la valeur de son parc d'équipements (`fleet`),
 * l'échéancier de son emprunt (`loans`), les charges fixes d'un trimestre et sa durée en jours
 * (`fixedCostsPerRound`, `roundDays`), la trésorerie à la fin du premier trimestre joué. Aucune
 * hypothèse n'est ajoutée.
 */

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const somme = (xs: readonly number[]) => auCentime(xs.reduce((t, x) => t + x, 0));

/** Les trimestres d'une année. */
const TRIMESTRES_PAR_AN = 4;

export type Cote = "besoin" | "ressource";

export interface LigneDuProjet {
  code: string;
  libelle: string;
  montant: number;
  cote: Cote;
  /** Pourquoi elle se range de ce côté : se lit après le tri. */
  pourquoi: string;
}

/** Ce que l'entreprise a réuni pour démarrer : ses besoins, ses ressources, et ce qu'ils disent. */
export function moyensDeDepart(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const { partie, depart } = anneeJouee(c.code);
  const f = depart.finance;
  const types = new Map((s.equipment?.types ?? []).map((t) => [t.code, t]));
  // Le parc d'équipements, type par type (un type peut compter plusieurs lots).
  const parParType = new Map<string, { nom: string; nombre: number; valeur: number }>();
  for (const lot of depart.fleet ?? []) {
    const deja = parParType.get(lot.typeCode) ?? { nom: types.get(lot.typeCode)?.name ?? lot.typeCode, nombre: 0, valeur: 0 };
    parParType.set(lot.typeCode, { ...deja, nombre: deja.nombre + lot.count, valeur: deja.valeur + lot.bookValue });
  }
  const parc = [...parParType.values()];
  const equipements = somme(parc.map((p) => p.valeur));
  const autresBiens = auCentime(f.fixedAssetsNet - equipements);

  const lignes: LigneDuProjet[] = [
    {
      code: "equipements",
      libelle: "Équipements de l'activité",
      montant: equipements,
      cote: "besoin",
      pourquoi: "Il faut de quoi travailler : c'est un besoin, que l'entreprise garde plusieurs années.",
    },
    {
      code: "apports",
      libelle: "Apports des associés",
      montant: f.equity,
      cote: "ressource",
      pourquoi: "L'argent que les associés mettent dans le projet : une ressource, qu'ils ne reprennent pas comme on rembourse un prêt.",
    },
    {
      code: "autres-biens",
      libelle: "Autres biens durables (locaux, aménagements, matériel)",
      montant: autresBiens,
      cote: "besoin",
      pourquoi: "Ce que l'entreprise garde pour longtemps, en plus de ses équipements : un besoin.",
    },
    {
      code: "emprunt",
      libelle: "Emprunt bancaire",
      montant: f.financialDebt,
      cote: "ressource",
      pourquoi: "L'argent prêté par la banque : une ressource, qu'il faudra rembourser.",
    },
  ];
  if (f.inventoryValue > 0)
    lignes.push({
      code: "stock",
      libelle: "Stock de départ",
      montant: f.inventoryValue,
      cote: "besoin",
      pourquoi: "Ce qu'il faut avoir en réserve pour vendre dès le premier jour : un besoin.",
    });
  lignes.push({
    code: "tresorerie",
    libelle: "Trésorerie de départ",
    montant: f.cash,
    cote: "besoin",
    pourquoi: "L'argent sur le compte sert à payer les premières dépenses : c'est un besoin du projet, pas d'où vient l'argent.",
  });
  if (f.payables > 0)
    lignes.push({
      code: "fournisseurs",
      libelle: "Ce que l'entreprise doit encore à ses fournisseurs",
      montant: f.payables,
      cote: "ressource",
      pourquoi: "Le fournisseur livre et se fait payer plus tard : en attendant, c'est comme s'il prêtait cette somme. Une ressource.",
    });
  if (f.receivables > 0)
    lignes.push({
      code: "clients",
      libelle: "Ce que les clients doivent encore",
      montant: f.receivables,
      cote: "besoin",
      pourquoi: "Des ventes pas encore payées : l'entreprise attend cet argent, il faut le financer en attendant. Un besoin.",
    });

  const besoins = lignes.filter((l) => l.cote === "besoin");
  const ressources = lignes.filter((l) => l.cote === "ressource");
  const totalDesBesoins = somme(besoins.map((l) => l.montant));
  const totalDesRessources = somme(ressources.map((l) => l.montant));
  const pret = depart.loans![0]!;
  const chargesFixes = s.fixedCostsPerRound;
  const joursParTrimestre = s.roundDays;
  const chargesParJour = auCentime(chargesFixes / joursParTrimestre);
  const joursCouverts = Math.floor(f.cash / chargesParJour + 1e-9);
  const fin = partie.rounds[0]!.results["joueur"]!.balanceSheet;
  return {
    parc,
    lignes,
    besoins,
    ressources,
    equipements,
    autresBiens,
    stock: f.inventoryValue,
    clients: f.receivables,
    tresorerie: f.cash,
    apports: f.equity,
    emprunt: f.financialDebt,
    fournisseurs: f.payables,
    totalDesBesoins,
    totalDesRessources,
    partDesAssocies: auDixieme((f.equity / totalDesRessources) * 100),
    partDeLaBanque: auDixieme((f.financialDebt / totalDesRessources) * 100),
    partDesFournisseurs: auDixieme((f.payables / totalDesRessources) * 100),
    remboursementParTrimestre: pret.perRound,
    trimestresPourRembourser: Math.round(pret.remaining / pret.perRound),
    tauxDeLEmprunt: s.finance.loanAnnualRate,
    chargesFixes,
    joursParTrimestre,
    chargesParJour,
    joursCouverts,
    tientUnTrimestre: joursCouverts >= joursParTrimestre,
    tresorerieFinDuPremierTrimestre: Math.round(fin.cash - fin.overdraft),
  };
}

const additionne = (lignes: readonly LigneDuProjet[]) => lignes.map((l) => eur(l.montant)).join(" + ");

export const LE_PROJET_D_ENTREPRISE: Chapitre = {
  code: "le-projet-d-entreprise",
  parcours: "seconde-mg",
  palier: 1,
  blocs: ["2de MG · S'engager et entreprendre, de l'intention à la création"],
  titre: "Le projet d'entreprise : de l'idée aux moyens de démarrer",
  accroche:
    "Avant de vendre quoi que ce soit, il faut réunir des moyens : des équipements, parfois un stock, de l'argent sur le compte. Ce qu'il faut pour démarrer, combien, et qui le paie.",
  objectifs: [
    "Distinguer les besoins d'un projet et ses ressources",
    "Vérifier qu'un projet est équilibré : les ressources couvrent les besoins",
    "Dire qui finance le projet : les associés, la banque, les fournisseurs",
    "Mesurer combien de temps la trésorerie de départ tient sans aucune vente",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une idée, et de quoi la lancer",
      notions: ["balance_sheet"],
      texte: (c) => {
        const m = moyensDeDepart(c);
        const parc = m.parc.map((p) => `${p.nom} : ${qte(p.nombre)}`).join(" ; ");
        return [
          `Pour lancer son activité, ${c.entreprise} a dû réunir des moyens avant de vendre ${accord(c, "un")} ${accord(c, "premier")} ${c.unite}.`,
          "Une entreprise qui démarre a des besoins : des équipements pour travailler, parfois un stock à vendre, de l'argent sur son compte pour payer les premières dépenses. Ces besoins se paient avec des ressources : l'argent apporté par les associés, celui que prête la banque, et parfois le délai que laissent les fournisseurs.",
          `Voici les moyens réunis par ${c.entreprise} le jour où la partie commence. Ses équipements (${parc}) ont déjà servi : on les compte à ce qu'ils valent aujourd'hui.`,
        ];
      },
      tableau: (c) => {
        const m = moyensDeDepart(c);
        return {
          titre: `Les moyens réunis par ${c.entreprise} pour démarrer`,
          colonnes: ["Montant"],
          lignes: m.lignes.map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] })),
        };
      },
      repere: () => "Les besoins, c'est ce qu'il faut pour démarrer. Les ressources, c'est d'où vient l'argent qui les paie.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Besoin ou ressource",
      notions: ["balance_sheet"],
      question: () =>
        "Rangez chaque ligne : est-ce un besoin de l'entreprise (ce qu'elle a et qui lui sert), ou une ressource (d'où vient l'argent qui le paie) ?",
      categories: [
        { code: "besoin", libelle: "Un besoin" },
        { code: "ressource", libelle: "Une ressource" },
      ],
      elements: (c) =>
        moyensDeDepart(c).lignes.map((l) => ({ libelle: l.libelle, montant: l.montant, categorie: l.cote, pourquoi: l.pourquoi })),
      explication: () => [
        "Les besoins disent à quoi sert l'argent ; les ressources disent qui l'a fourni. La trésorerie se range parmi les besoins : avoir de l'argent sur son compte est un moyen de démarrer, qu'il a fallu financer comme le reste.",
      ],
    },
    {
      id: "equilibre",
      type: "montants",
      titre: "Les deux totaux",
      notions: ["balance_sheet"],
      question: (c) => `Calculez le total des besoins ${dE(c.entreprise)}, puis le total de ses ressources.`,
      champs: (c) => {
        const m = moyensDeDepart(c);
        return [
          { libelle: "Total des besoins", attendu: m.totalDesBesoins, calcul: `${additionne(m.besoins)} = ${eur(m.totalDesBesoins)}`, tolerance: 1 },
          { libelle: "Total des ressources", attendu: m.totalDesRessources, calcul: `${additionne(m.ressources)} = ${eur(m.totalDesRessources)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const m = moyensDeDepart(c);
        return [
          `Les deux totaux sont égaux : ${eur(m.totalDesBesoins)}. Chaque euro dont ${c.entreprise} a besoin vient de quelque part. Un projet est équilibré quand ses ressources couvrent tous ses besoins : il manquerait sinon de l'argent pour démarrer.`,
        ];
      },
    },
    {
      id: "qui-paie",
      type: "montants",
      titre: "Qui paie quoi",
      notions: ["balance_sheet", "loan_schedule"],
      question: (c) => {
        const m = moyensDeDepart(c);
        return `Calculez la part des ressources apportée par les associés, puis celle prêtée par la banque, en pourcentage au dixième. ${c.entreprise} rembourse ${eur(m.remboursementParTrimestre)} de son emprunt chaque trimestre : calculez en combien de trimestres il sera remboursé.`;
      },
      champs: (c) => {
        const m = moyensDeDepart(c);
        return [
          { libelle: "Part apportée par les associés (%)", attendu: m.partDesAssocies, calcul: `${eur(m.apports)} ÷ ${eur(m.totalDesRessources)} × 100 = ${pct(m.partDesAssocies)}`, tolerance: 0.1 },
          { libelle: "Part prêtée par la banque (%)", attendu: m.partDeLaBanque, calcul: `${eur(m.emprunt)} ÷ ${eur(m.totalDesRessources)} × 100 = ${pct(m.partDeLaBanque)}`, tolerance: 0.1 },
          { libelle: "Trimestres pour rembourser l'emprunt", attendu: m.trimestresPourRembourser, calcul: `${eur(m.emprunt)} ÷ ${eur(m.remboursementParTrimestre)} = ${qte(m.trimestresPourRembourser)}` },
        ];
      },
      explication: (c) => {
        const m = moyensDeDepart(c);
        const ans = (m.trimestresPourRembourser / TRIMESTRES_PAR_AN).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
        return [
          m.partDesAssocies >= m.partDeLaBanque
            ? `Les associés apportent ${pct(m.partDesAssocies)} des ressources, plus que la banque : ce sont eux qui portent d'abord le projet.`
            : `La banque prête ${pct(m.partDeLaBanque)} des ressources, plus que ce qu'apportent les associés : le projet dépend beaucoup de son prêteur.`,
          ...(m.fournisseurs > 0 ? [`Le reste, ${pct(m.partDesFournisseurs)}, c'est le délai que laissent les fournisseurs.`] : []),
          `L'emprunt se rembourse en ${qte(m.trimestresPourRembourser)} trimestres, soit ${ans} ans, et la banque demande en plus des intérêts : ${pct(auDixieme(m.tauxDeLEmprunt * 100))} par an. Les apports, eux, ne se remboursent pas : les associés espèrent en retour une part des bénéfices.`,
        ];
      },
    },
    {
      id: "tresorerie",
      type: "montants",
      titre: "Combien de temps tient la trésorerie",
      notions: ["net_treasury", "fixed_costs"],
      question: (c) => {
        const m = moyensDeDepart(c);
        return `Le loyer, les salaires de l'équipe et les frais de structure ${dE(c.entreprise)} coûtent ${eur(m.chargesFixes)} par trimestre, que l'entreprise vende ou non : ce sont ses charges fixes. Un trimestre compte ${qte(m.joursParTrimestre)} jours. Calculez les charges fixes d'une journée (au centime), puis le nombre de jours que la trésorerie de départ peut payer sans aucune vente (arrondi au jour inférieur).`;
      },
      champs: (c) => {
        const m = moyensDeDepart(c);
        return [
          { libelle: "Charges fixes d'une journée", attendu: m.chargesParJour, calcul: `${eur(m.chargesFixes)} ÷ ${qte(m.joursParTrimestre)} = ${eur(m.chargesParJour)}` },
          { libelle: "Jours payés par la trésorerie de départ", attendu: m.joursCouverts, calcul: `${eur(m.tresorerie)} ÷ ${eur(m.chargesParJour)} = ${qte(m.joursCouverts)} jours`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const m = moyensDeDepart(c);
        return [
          `Sans aucune vente, la trésorerie de départ ${dE(c.entreprise)} paierait ${qte(m.joursCouverts)} jours de charges fixes, sans compter les achats.`,
        ];
      },
    },
    {
      id: "lecture-de-la-tresorerie",
      type: "choix",
      titre: "Ce que dit la trésorerie de départ",
      notions: ["net_treasury"],
      question: (c) => {
        const m = moyensDeDepart(c);
        return `La trésorerie de départ ${dE(c.entreprise)} paie ${qte(m.joursCouverts)} jours de charges fixes, pour un trimestre de ${qte(m.joursParTrimestre)} jours. Que faut-il en conclure ?`;
      },
      options: (c) => {
        const m = moyensDeDepart(c);
        const fin =
          m.tresorerieFinDuPremierTrimestre >= 0
            ? `Dans l'arène, la trésorerie ${dE(c.entreprise)} est de ${eur(m.tresorerieFinDuPremierTrimestre)} à la fin du premier trimestre : les ventes ont pris le relais.`
            : `Dans l'arène, ${c.entreprise} finit le premier trimestre à découvert, de ${eur(-m.tresorerieFinDuPremierTrimestre)}.`;
        return [
          {
            texte: "Les ventes doivent rentrer vite : seule, la trésorerie ne tient pas un trimestre",
            juste: !m.tientUnTrimestre,
            retour: !m.tientUnTrimestre
              ? `Oui : ${qte(m.joursCouverts)} jours sur ${qte(m.joursParTrimestre)}. Ce sont les ventes du trimestre qui paient la suite. ${fin}`
              : `Non : elle paie ${qte(m.joursCouverts)} jours, plus qu'un trimestre de ${qte(m.joursParTrimestre)} jours.`,
          },
          {
            texte: "La trésorerie de départ paie tout un trimestre, même sans aucune vente",
            juste: m.tientUnTrimestre,
            retour: m.tientUnTrimestre
              ? `Oui : ${qte(m.joursCouverts)} jours, plus qu'un trimestre. L'entreprise a le temps de trouver ses premiers clients. ${fin}`
              : `Non : elle n'en paie que ${qte(m.joursCouverts)} jours sur ${qte(m.joursParTrimestre)}.`,
          },
          {
            texte: "La trésorerie ne compte pas : les équipements sont déjà là",
            juste: false,
            retour:
              "Non : les équipements ne paient ni le loyer ni les salaires. Sans argent sur son compte, l'entreprise ne peut pas payer ses premières dépenses, même avec un bon outil.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["balance_sheet", "net_treasury"],
      texte: (c) => {
        const m = moyensDeDepart(c);
        return [
          `Pour démarrer, ${c.entreprise} a réuni ${eur(m.totalDesBesoins)} : des équipements et d'autres biens durables, ${m.stock > 0 ? "un stock, " : ""}et ${eur(m.tresorerie)} de trésorerie. Les associés en ont apporté ${pct(m.partDesAssocies)}, la banque en a prêté ${pct(m.partDeLaBanque)}.`,
          "Un projet d'entreprise se prépare en deux colonnes : ce qu'il faut (les besoins) et qui le paie (les ressources). Les deux totaux sont égaux. Et il faut garder assez de trésorerie pour tenir jusqu'à ce que les ventes rapportent.",
        ];
      },
      repere: () => "Total des besoins = total des ressources. Part des associés = apports ÷ total des ressources × 100.",
    },
  ],
};
