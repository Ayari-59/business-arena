import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { CROITRE_EN_INVESTISSANT, ENTREPRISES_DE_LA_CROISSANCE, croissance, tableauDesMachines } from "../../chapitres/croitre-en-investissant";
import { machineEnPlus } from "../../monde/capacite";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CROÎTRE EN INVESTISSANT » : VOIR PLUS GRAND (stratégie et management,
 * palier 3).
 *
 * Le chapitre a jugé un cinquième poste manuel. La direction veut voir plus grand : la ligne
 * automatisée du catalogue (60 000 €, 3 500 enceintes d'outil en plus par trimestre, pour le même
 * opérateur). L'élève refait seul les calculs du chapitre sur la ligne : ce qu'elle vend, ce qu'elle
 * coûte, sa VAN sur la demande prévue. Puis il croise les deux machines : un curseur sur les ventes
 * que la ligne doit faire de plus que le poste pour le rattraper, et un calcul à rebours qui en tire
 * la hausse de la demande où la ligne passe devant (18,9 %). La réponse demande un jugement : une
 * VAN « moins mauvaise » n'est pas une bonne VAN, et voir plus grand ne paie que si la demande suit.
 *
 * LE « 952 = 952 » DE L'AUDIT. Le cas d'avant rejouait l'arène : la petite machine y faisait vendre
 * 952 enceintes de plus, la grande encore exactement 952 de plus. Ce n'était pas une coïncidence, et
 * le modèle du cours le montre net : sur la demande prévue, la ligne vend exactement autant que le
 * poste (1 200), parce que c'est la demande qui borne aux trimestres 2 et 4 avec l'une comme avec
 * l'autre. La capacité en plus de la ligne ne trouve pas de clients. Le cas le fait calculer.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `croissance` et de `machineEnPlus`.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (x: number, d = 2) => `${(x * 100).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** À l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);
const facteurEcrit = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Les bornes du curseur des ventes que la ligne fait de plus que le poste, en enceintes par an. */
export const VENTES_EN_PLUS_DU_CURSEUR = { min: 0, max: 1_500 } as const;

export type Verdict = "la-grande" | "le-poste" | "aucune";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Les deux machines face à face, et ce que la ligne doit faire de plus pour passer devant. */
export function voirPlusGrand(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Pick<Cas, "code">) {
  const x = croissance(c);
  const f = x.f;
  const m = x.m;
  const petite = x.poste;
  const grande = machineEnPlus(f, "ligne-automatisee");
  const F = grande.facteurDActualisation;
  // Ce que la ligne coûte de plus que le poste, à demande égale : l'opérateur est le même.
  const investissementEnPlus = auCentime(grande.investissement - petite.investissement);
  const salairesEnPlus = auCentime(grande.salaires - petite.salaires);
  const entretienEnPlus = auCentime(grande.entretien - petite.entretien);
  const amortissementEnPlus = auCentime(grande.amortissement - petite.amortissement);
  /** Le flux de chaque année que la ligne fait gagner de plus que le poste, pour q ventes de plus. */
  const fluxEnPlus = (q: number) => auCentime((q * m - salairesEnPlus - entretienEnPlus - amortissementEnPlus) * (1 - x.impot) + amortissementEnPlus);
  const vanEnPlus = (q: number) => auCentime(-investissementEnPlus + fluxEnPlus(q) * F);
  // Le calcul à rebours : le flux en plus qui égalise les VAN, puis les ventes en plus qu'il demande.
  const fluxQuiEgalise = auCentime(investissementEnPlus / F);
  const resultatQuiEgalise = auCentime((fluxQuiEgalise - amortissementEnPlus) / (1 - x.impot));
  const ventesQuiEgalisent = plafond((resultatQuiEgalise + salairesEnPlus + entretienEnPlus + amortissementEnPlus) / m);
  // La hausse où la ligne passe devant, au ‰, dans le modèle.
  let devant: number | null = null;
  for (let pm = 0; pm <= 1000 && devant === null; pm++) {
    const h = pm / 1000;
    if (machineEnPlus(f, "ligne-automatisee", { hausseDeLaDemande: h }).van > machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: h }).van) devant = h;
  }
  // À cette hausse, la ligne ne vend plus que le poste qu'aux trimestres où l'outil du poste borne :
  // ses ventes en plus sont la demande haussée au-delà de cet outil, d'où la hausse à rebours.
  const aDevant = machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: devant ?? 0 });
  const bornes = aDevant.trimestres.filter((t) => t.goulotAvec === "outil");
  const demandeBornee = somme(bornes.map((t) => x.sans.trimestres[t.trimestre - 1]!.demande));
  const hausseARebours = demandeBornee > 0 ? auCentime(((ventesQuiEgalisent + bornes.length * petite.capaciteOutil) / demandeBornee - 1) * 100) : 0;
  const vanParHausse = f.investissement.haussesDeLaDemande.map((h) => ({
    hausse: h,
    petite: machineEnPlus(f, "poste-manuel", { hausseDeLaDemande: h }).van,
    grande: machineEnPlus(f, "ligne-automatisee", { hausseDeLaDemande: h }).van,
  }));
  const plusHaute = vanParHausse.at(-1)!;
  const verdict: Verdict = grande.van > 0 && grande.van > petite.van ? "la-grande" : petite.van > 0 ? "le-poste" : "aucune";
  return {
    x,
    f,
    petite,
    grande,
    F,
    investissementEnPlus,
    salairesEnPlus,
    entretienEnPlus,
    amortissementEnPlus,
    fluxEnPlus,
    vanEnPlus,
    fluxQuiEgalise,
    resultatQuiEgalise,
    ventesQuiEgalisent,
    devant,
    bornes,
    demandeBornee,
    hausseARebours,
    vanParHausse,
    plusHaute,
    ecartDeVan: auCentime(grande.van - petite.van),
    verdict,
  };
}

/** Les VAN des deux machines aux hausses de la demande de la fiche. */
function tableauDesVan(c: Pick<Cas, "code">): TableauDeDonnees {
  const v = voirPlusGrand(c);
  return {
    titre: `La VAN des deux machines, avec leur opérateur, selon la demande gardée ${qte(v.petite.machine.dureeEnAnnees)} ans`,
    colonnes: [v.petite.machine.nom, v.grande.machine.nom],
    lignes: v.vanParHausse.map((l) => ({
      libelle: l.hausse === 0 ? "Demande prévue de N + 1" : `Demande de N + 1 haussée de ${pct(l.hausse, 1)}`,
      valeurs: [eur(l.petite), eur(l.grande)],
    })),
  };
}

export const VOIR_PLUS_GRAND: Situation = {
  code: "voir-plus-grand",
  parcours: "strategie",
  palier: 3,
  blocs: [],
  reprend: [CROITRE_EN_INVESTISSANT.code],
  commanditaire: "La direction",
  titre: "Voir plus grand",
  accroche:
    "La direction veut croître franchement : la ligne automatisée du catalogue, plutôt que le poste manuel. Ce qu'elle vend et ce qu'elle coûte sur la demande prévue, puis la demande à partir de laquelle elle vaut mieux que le poste.",
  objectifs: [
    "Trouver ce qu'une machine plus grande fait vendre, et dire ce qui borne la production",
    "Calculer les charges de l'année, l'investissement et la VAN d'une machine",
    "Croiser deux machines : les ventes en plus qui égalisent leurs VAN, et la demande où la plus grande passe devant",
    "Répondre à la direction, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CROISSANCE,
    pourquoi: "ce cas reprend le chapitre « Croître en investissant », qui se calcule sur l'atelier de NOVA et son catalogue de machines.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la direction",
      tableau: (c) => tableauDesMachines(c, ["poste-manuel", "ligne-automatisee"]),
      texte: (c) => {
        const v = voirPlusGrand(c);
        const f = v.f;
        const p = v.petite.machine;
        const g = v.grande.machine;
        return [
          `« Vous avez jugé ${minuscule(p.nom)}. Si ${f.entreprise} doit croître, faisons-le franchement : achetons plutôt ${minuscule(g.nom)}, ${eur(g.prix)}, qui ajoute ${qte(g.capaciteEnPlus)} ${f.unites} d'outil par trimestre au lieu de ${qte(p.capaciteEnPlus)}, pour le même opérateur. Dites-moi ce qu'elle vend, ce qu'elle coûte, et si elle vaut mieux que le poste. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre. La simulation est la même : l'année N + 1 prévue (${qte(v.x.sans.demande)} ${f.unites} demandées), la machine achetée le 1er janvier et payée par un emprunt du même montant à ${pct(f.investissement.tauxDeLEmprunt)}, jugée sur sa durée à ${pct(f.investissement.tauxDActualisation)}, avec un impôt de ${pct(f.investissement.tauxDImpot)} et le recrutement de l'opérateur (${eur(f.personnel.coutDUnRecrutement)}) compté au départ.`,
        ];
      },
      repere: () =>
        "À rendre : ce que la ligne vend et coûte sur la demande prévue, les ventes qu'elle doit faire de plus que le poste pour le rattraper, la demande où elle passe devant, et votre réponse.",
    },
    {
      id: "ce-que-vend-la-ligne",
      type: "montants",
      titre: "Ce que vend la ligne",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const v = voirPlusGrand(c);
        return `Sur la demande prévue de N + 1, avec la ligne et son opérateur : quelle capacité d'outil par trimestre, quelle capacité d'équipe, combien de ventes gagnées sur l'année, et combien de plus que le poste (qui en gagne ${qte(v.petite.ventesGagnees)}) ?`;
      },
      champs: (c) => {
        const v = voirPlusGrand(c);
        const f = v.f;
        const g = v.grande;
        const equipe = v.x.sans.trimestres[0]!.capaciteEquipe;
        const gains = g.trimestres.filter((t) => t.ventesGagnees !== 0);
        return [
          { libelle: "Capacité de l'outil avec la ligne", attendu: g.capaciteOutil, calcul: `${qte(f.ligne.capaciteParTrimestre)} + ${qte(g.machine.capaciteEnPlus)} = ${qte(g.capaciteOutil)}`, tolerance: 0 },
          {
            libelle: "Capacité de l'équipe avec son opérateur",
            attendu: g.capaciteEquipe,
            calcul: `${qte(f.operateurs.heuresParMois)} heures ÷ ${qte(g.machine.heuresParEnceinte)} × 3 mois = ${qte(g.equipeEnPlus)} ; ${qte(equipe)} + ${qte(g.equipeEnPlus)} = ${qte(g.capaciteEquipe)}`,
            tolerance: 0,
          },
          {
            libelle: "Ventes gagnées sur l'année",
            attendu: g.ventesGagnees,
            calcul: `${gains.map((t) => `(${qte(t.ventesAvec)} − ${qte(t.ventesSans)}) au T${t.trimestre}`).join(" + ")} = ${qte(g.ventesGagnees)} : la demande borne`,
            tolerance: 0,
          },
          {
            libelle: "Ventes de plus que le poste",
            attendu: g.ventesGagnees - v.petite.ventesGagnees,
            calcul: `${qte(g.ventesGagnees)} − ${qte(v.petite.ventesGagnees)} = ${qte(g.ventesGagnees - v.petite.ventesGagnees)}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const v = voirPlusGrand(c);
        const memes = v.grande.ventesGagnees === v.petite.ventesGagnees;
        return [
          memes
            ? `La ligne vend exactement autant que le poste, ${qte(v.grande.ventesGagnees)} ${v.f.unites} de plus : avec l'une comme avec l'autre, c'est la demande qui borne aux trimestres ${v.x.goulots.map((t) => t.trimestre).join(" et ")}. Les ${qte(v.grande.capaciteOutil - v.petite.capaciteOutil)} ${v.f.unites} d'outil que la ligne ajoute de plus que le poste ne trouvent pas de clients.`
            : `La ligne vend ${qte(v.grande.ventesGagnees - v.petite.ventesGagnees)} ${v.f.unites} de plus que le poste.`,
          "Deux machines de tailles différentes qui font vendre exactement autant, ce n'est pas une coïncidence : c'est le signe que la capacité n'est plus ce qui manque. Une machine plus grande ne vend pas plus qu'une petite quand la demande est servie toute.",
        ];
      },
    },
    {
      id: "ce-que-coute-la-ligne",
      type: "montants",
      titre: "Ce que coûte la ligne",
      notions: ["depreciation", "discounting", "irr_payback"],
      question: () =>
        "Calculez, pour la ligne et son opérateur : l'investissement du départ, les charges de la première année, les ventes gagnées qu'il faudrait pour que l'année n'y perde rien, et la VAN sur la demande prévue.",
      champs: (c) => {
        const v = voirPlusGrand(c);
        const g = v.grande;
        const x = v.x;
        return [
          { libelle: "Investissement du départ", attendu: g.investissement, calcul: `${eur(g.machine.prix)} + ${eur(g.recrutements)} de recrutement = ${eur(g.investissement)}` },
          {
            libelle: "Charges de la première année",
            attendu: g.charges,
            calcul: `${eur(g.machine.prix)} ÷ ${qte(g.machine.dureeEnAnnees)} = ${eur(g.amortissement)} d'amortissement ; ${eur(g.machine.prix)} × ${pct(v.f.investissement.tauxDeLEmprunt)} = ${eur(g.interets)} d'intérêts ; ${eur(g.amortissement)} + ${eur(g.interets)} + ${eur(g.salaires)} + ${eur(g.entretien)} = ${eur(g.charges)}`,
          },
          {
            libelle: "Ventes gagnées qui rendent l'année nulle",
            attendu: g.ventesNecessaires,
            calcul: `${eur(g.charges)} ÷ ${eur(x.m)} = ${qte(auCentime(g.charges / x.m))}, soit ${qte(g.ventesNecessaires)}`,
            tolerance: 0,
          },
          {
            libelle: "VAN de la ligne sur la demande prévue",
            attendu: g.van,
            calcul: `Flux : (${eur(g.margeGagnee)} − ${eur(g.salaires)} − ${eur(g.entretien)} − ${eur(g.amortissement)}) × ${qte(1 - x.impot)} + ${eur(g.amortissement)} = ${eur(g.fluxAnnuel)} ; VAN : −${eur(g.investissement)} + ${entre(g.fluxAnnuel)} × ${facteurEcrit(g.facteurDActualisation)} = ${eur(g.van)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const v = voirPlusGrand(c);
        return [
          `La ligne coûte plus et, sur la demande prévue, ne vend pas plus : sa VAN, ${eur(v.grande.van)}, est sous celle du poste (${eur(v.petite.van)}) de ${eur(-v.ecartDeVan)}. Il lui faudrait ${qte(v.grande.ventesNecessaires)} ventes gagnées pour que l'année n'y perde rien, quand la demande n'en refuse que ${qte(v.x.sans.refusees)}.`,
          "Reste à savoir si une demande plus haute la ferait passer devant, et à partir de quand.",
        ];
      },
    },
    {
      id: "le-rattrapage-au-curseur",
      type: "curseur",
      titre: "Ce que la ligne doit vendre de plus",
      notions: ["discounting", "capacity"],
      question: (c) => {
        const v = voirPlusGrand(c);
        return `La ligne et le poste ont le même opérateur. La ligne coûte ${eur(v.investissementEnPlus)} de plus au départ, ${eur(v.entretienEnPlus)} d'entretien et ${eur(v.amortissementEnPlus)} d'amortissement de plus par an. Faites varier les ventes qu'elle fait gagner chaque année de plus que le poste : placez le curseur sur le plus petit nombre où ses flux actualisés en plus couvrent son investissement en plus, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Ventes de plus que le poste, par an", unite: voirPlusGrand(c).f.unites }),
      cible: (c) => ({ attendu: voirPlusGrand(c).ventesQuiEgalisent, min: VENTES_EN_PLUS_DU_CURSEUR.min, max: VENTES_EN_PLUS_DU_CURSEUR.max }),
      zones: ["La ligne passe devant", "Le poste reste devant"],
      rates: () => ({
        dessous: "À cette position, les flux en plus de la ligne ne couvrent pas ce qu'elle coûte de plus : le poste reste devant.",
        dessus: "Moins de ventes en plus suffisent déjà : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le rattrapage",
      lecture: (c, q) => {
        const v = voirPlusGrand(c);
        return [
          { libelle: "Flux de chaque année en plus", montant: v.fluxEnPlus(q) },
          { libelle: "Flux actualisés en plus", montant: auCentime(v.fluxEnPlus(q) * v.F) },
          { libelle: "Investissement en plus", montant: v.investissementEnPlus },
          { libelle: "VAN de la ligne moins celle du poste", montant: v.vanEnPlus(q), fort: true },
        ];
      },
      droites: (c) => {
        const v = voirPlusGrand(c);
        return {
          produit: (q) => v.fluxEnPlus(q) * v.F,
          cout: () => v.investissementEnPlus,
          libelles: ["Flux actualisés en plus de la ligne", "Investissement en plus de la ligne"],
        };
      },
      explication: (c) => {
        const v = voirPlusGrand(c);
        return [
          `La ligne doit faire vendre ${qte(v.ventesQuiEgalisent)} ${v.f.unites} de plus que le poste chaque année, pendant ${qte(v.grande.machine.dureeEnAnnees)} ans, pour rattraper ce qu'elle coûte de plus. Sur la demande prévue, elle n'en vend pas une de plus. Reste à trouver quelle demande les lui donnerait.`,
        ];
      },
    },
    {
      id: "la-demande-ou-la-ligne-passe-devant",
      type: "montants",
      titre: "La demande où la ligne passe devant",
      notions: ["discounting", "capacity", "breakeven"],
      tableau: tableauDesVan,
      question: (c) => {
        const v = voirPlusGrand(c);
        return `Sans curseur cette fois. Retrouvez le flux de chaque année en plus qui égalise les deux VAN (au facteur de ${facteurEcrit(v.F)}), les ventes de plus que le poste qu'il demande, puis la hausse de la demande où la ligne passe devant (en %). La ligne ne vend plus que le poste qu'aux trimestres où l'outil du poste, ${qte(v.petite.capaciteOutil)} ${v.f.unites}, devient le goulot.`;
      },
      champs: (c) => {
        const v = voirPlusGrand(c);
        const k = v.bornes.length;
        return [
          { libelle: "Flux de chaque année en plus qui égalise les VAN", attendu: v.fluxQuiEgalise, calcul: `${eur(v.investissementEnPlus)} ÷ ${facteurEcrit(v.F)} = ${eur(v.fluxQuiEgalise)}`, tolerance: 0.5 },
          {
            libelle: "Ventes de plus que le poste qui égalisent les VAN",
            attendu: v.ventesQuiEgalisent,
            calcul: `(${eur(v.fluxQuiEgalise)} − ${eur(v.amortissementEnPlus)}) ÷ ${qte(1 - v.x.impot)} = ${eur(v.resultatQuiEgalise)} ; (${eur(v.resultatQuiEgalise)} + ${eur(v.entretienEnPlus)} + ${eur(v.amortissementEnPlus)}) ÷ ${eur(v.x.m)} = ${qte(auCentime((v.resultatQuiEgalise + v.salairesEnPlus + v.entretienEnPlus + v.amortissementEnPlus) / v.x.m))}, soit ${qte(v.ventesQuiEgalisent)}`,
            tolerance: 0,
          },
          {
            libelle: "Hausse de la demande où la ligne passe devant (%)",
            attendu: v.hausseARebours,
            calcul: `Aux T${v.bornes.map((t) => t.trimestre).join(" et T")}, la ligne vend la demande au-delà des ${qte(v.petite.capaciteOutil)} du poste : (${qte(v.ventesQuiEgalisent)} + ${k} × ${qte(v.petite.capaciteOutil)}) ÷ (${v.bornes.map((t) => qte(v.x.sans.trimestres[t.trimestre - 1]!.demande)).join(" + ")}) = ${(1 + v.hausseARebours / 100).toLocaleString("fr-FR", { maximumFractionDigits: 4 })}, soit ${qte(v.hausseARebours)} % de demande en plus`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const v = voirPlusGrand(c);
        return [
          `En dessous de ${qte(v.hausseARebours)} % de demande en plus, la ligne ne fait que coûter plus que le poste ; au-delà, l'outil du poste borne aux T${v.bornes.map((t) => t.trimestre).join(" et T")}, et la ligne vend ce qu'il refuse. À ${pct(v.plusHaute.hausse, 1)}, sa VAN vaut ${eur(v.plusHaute.grande)}, contre ${eur(v.plusHaute.petite)} pour le poste.`,
          "Le rebours demande de savoir d'où viennent les ventes : ce n'est pas la capacité de la ligne qui compte, c'est la demande qui dépasse celle du poste.",
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["discounting", "capacity"],
      question: () => "Quelle réponse rendez-vous à la direction ?",
      options: (c) => {
        const v = voirPlusGrand(c);
        const f = v.f;
        const p = v.petite;
        const g = v.grande;
        const chiffres = `Sur la demande prévue, VAN ${eur(p.van)} pour le poste, ${eur(g.van)} pour la ligne ; la ligne ne passe devant qu'à ${pct(v.devant ?? 0, 1)} de demande en plus.`;
        return [
          {
            texte: `Aucune des deux sur la demande prévue ; la ligne ne passe devant qu'à ${pct(v.devant ?? 0, 1)} de demande en plus`,
            juste: v.verdict === "aucune",
            retour:
              v.verdict === "aucune"
                ? `Oui. ${chiffres} Les deux VAN sont négatives : ni l'une ni l'autre ne crée de valeur tant que la demande ne monte pas, et la ligne demande un pari bien plus gros que le poste. Voir plus grand ne paie que si la demande suit.`
                : `Non. ${chiffres}`,
          },
          {
            texte: `Prenons la ligne : elle ajoute ${qte(g.machine.capaciteEnPlus)} ${f.unites} d'outil par trimestre, contre ${qte(p.machine.capaciteEnPlus)} pour le poste, pour le même opérateur`,
            juste: false,
            retour: `Non : c'est juger une capacité, pas des ventes. Sur la demande prévue, la ligne vend ${qte(g.ventesGagnees)} ${f.unites} de plus, exactement autant que le poste : la capacité en plus ne trouve pas de clients. ${chiffres}`,
          },
          {
            texte: `Prenons la ligne : à ${pct(v.plusHaute.hausse, 1)} de demande en plus, sa VAN dépasse celle du poste de ${eur(auCentime(v.plusHaute.grande - v.plusHaute.petite))}`,
            juste: v.verdict === "la-grande",
            retour:
              v.verdict === "la-grande"
                ? `Oui. ${chiffres}`
                : `Non : c'est vrai à ${pct(v.plusHaute.hausse, 1)}, mais c'est un pari, pas la prévision. Sur la demande prévue, la ligne vaut ${eur(-v.ecartDeVan)} de moins que le poste ; il faudrait croire à ${pct(v.devant ?? 0, 1)} de demande en plus, gardée ${qte(g.machine.dureeEnAnnees)} ans.`,
          },
          {
            texte: `Prenons le poste : sa VAN vaut ${eur(p.van)}, ${eur(Math.abs(v.ecartDeVan))} de mieux que la ligne`,
            juste: v.verdict === "le-poste",
            retour:
              v.verdict === "le-poste"
                ? `Oui. ${chiffres}`
                : `Non : moins mauvaise n'est pas bonne. Une VAN de ${eur(p.van)} détruit de la valeur : le poste et son opérateur ne se paient qu'à ${pct(v.x.hausseNulle ?? 0, 1)} de demande en plus.`,
          },
        ];
      },
    },
  ],
};
