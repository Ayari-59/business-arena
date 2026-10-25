import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { familyOf } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { gammeDuMois, type GammeDuMois, type ReferenceDuMois } from "../gamme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : COÛT PAR PRODUIT (contrôle de gestion, palier 3).
 *
 * Le coût complet d'une entreprise qui vend plusieurs références : la gamme qu'elle joue
 * dans l'arène à partir d'un niveau, sur un mois simulé par le moteur (`gamme.ts`). L'élève
 * calcule le coût direct de chaque référence, répartit les charges communes au prorata des
 * heures de travail (celles de la fiche de chaque référence), en tire le coût complet et le
 * résultat de chacune. Puis il bute sur la question qui fait le chapitre : faut-il abandonner
 * la référence la moins rentable ? La réponse se lit dans sa marge sur coûts spécifiques,
 * pas dans son résultat en coût complet.
 *
 * Six entreprises jouent une gamme ; les trois autres renvoient à l'une d'elles.
 */

const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

/** Le chapitre ne s'ouvre que dans les entreprises qui jouent une gamme dans l'arène. */
export function gammeDe(c: Cas): GammeDuMois {
  const g = gammeDuMois(c.code);
  if (!g) throw new Error(`${c.entreprise} ne joue pas de gamme dans l'arène`);
  return g;
}

/** Les coûts du mois, référence par référence. */
export function coutsParProduit(c: Cas) {
  const g = gammeDe(c);
  const communes = auCentime(g.communes.structure + g.communes.entretien + g.communes.usure);
  const lignes = g.references.map((r) => {
    const variables = auCentime(r.quantite * r.coutVariableUnitaire);
    const direct = auCentime(variables + r.publicite + r.qualite);
    const heures = auCentime(r.quantite * r.heuresParUnite);
    return { ...r, variables, direct, heures };
  });
  const heures = auCentime(lignes.reduce((s, l) => s + l.heures, 0));
  // Le coût de l'heure, arrondi au centime : celui que l'élève calcule, puis emploie.
  const coutDeLHeure = auCentime(communes / heures);
  const parReference = lignes.map((l) => {
    const imputees = auCentime(l.heures * coutDeLHeure);
    const coutComplet = auCentime(l.direct + imputees);
    const resultat = auCentime(l.chiffreDAffaires - coutComplet);
    // Ce que la référence rapporte une fois payées ses propres charges : ce que l'abandon ferait perdre.
    const margeSpecifique = auCentime(l.chiffreDAffaires - l.direct);
    return { ...l, imputees, coutComplet, resultat, margeSpecifique };
  });
  const resultat = auCentime(parReference.reduce((s, l) => s + l.resultat, 0));
  const imputees = auCentime(parReference.reduce((s, l) => s + l.imputees, 0));
  const faible = [...parReference].sort((a, b) => a.resultat - b.resultat)[0]!;
  return {
    gamme: g,
    communes,
    heures,
    coutDeLHeure,
    parReference,
    imputees,
    resultat,
    faible,
    // Sans la référence la plus faible : ses charges propres partent, les charges communes restent.
    resultatSansLaFaible: auCentime(resultat - faible.margeSpecifique),
  };
}

const listeDes = (refs: readonly ReferenceDuMois[], f: (r: ReferenceDuMois) => string) => refs.map(f).join(" ; ");

export const COUT_PAR_PRODUIT: Chapitre = {
  code: "cout-par-produit",
  parcours: "controle-de-gestion",
  palier: 3,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Coût par produit",
  accroche:
    "Une entreprise qui vend plusieurs références : ce que coûte chacune, ce qu'elle rapporte, et pourquoi la moins rentable ne se supprime pas toujours.",
  objectifs: [
    "Calculer le coût direct de chaque produit",
    "Répartir les charges communes selon une unité d'œuvre",
    "Calculer le coût complet et le résultat de chaque produit",
    "Juger l'abandon d'un produit par sa marge sur coûts spécifiques",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_COURS.filter((code) => familyOf(code)),
    pourquoi: "Ce chapitre se joue sur une gamme : cette entreprise ne vend qu'une seule référence dans l'arène.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une gamme, plusieurs coûts",
      notions: ["full_unit_cost"],
      texte: (c) => {
        const g = gammeDe(c);
        return [
          `À partir du niveau ${g.niveau} de l'arène, ${c.entreprise} ne vend plus une seule référence mais ${g.libelle}. Voici son premier mois en gamme, simulé par l'arène : ${listeDes(g.references, (r) => `${r.nom}, ${qte(r.quantite)} vendus à ${eur(r.prix)}`)}.`,
          "Le dirigeant veut savoir ce que chaque référence lui rapporte. Certaines charges se rattachent à une référence sans calcul : ce qu'elle consomme, sa publicité, son budget qualité. Les autres servent à toute la gamme, le local, l'équipe, l'entretien, l'usure de l'équipement : il faut les répartir.",
        ];
      },
      repere: () =>
        "Coût direct de la référence, plus sa part des charges communes, égale son coût complet. Le chiffre d'affaires moins le coût complet donne son résultat.",
    },
    {
      id: "couts-directs",
      type: "montants",
      titre: "Le coût direct de chaque référence",
      notions: ["full_unit_cost", "variable_costs"],
      question: (c) => {
        const g = gammeDe(c);
        return `Pour chaque référence, le coût direct du mois réunit son coût variable (quantité × coût unitaire), sa publicité et son budget qualité. ${listeDes(g.references, (r) => `${r.nom} : ${qte(r.quantite)} × ${eur(r.coutVariableUnitaire)}, publicité ${eur(r.publicite)}, qualité ${eur(r.qualite)}`)}.`;
      },
      champs: (c) =>
        coutsParProduit(c).parReference.map((l) => ({
          libelle: `Coût direct : ${l.nom}`,
          attendu: l.direct,
          calcul: `${qte(l.quantite)} × ${eur(l.coutVariableUnitaire)} + ${eur(l.publicite)} + ${eur(l.qualite)} = ${eur(l.direct)}`,
          tolerance: 0.05,
        })),
      explication: () => [
        "La publicité et le budget qualité ne varient pas avec les ventes du mois : ce sont des charges fixes. Mais chacune ne sert qu'une référence. Charges directes, et pourtant fixes : on les appelle des charges spécifiques.",
      ],
    },
    {
      id: "heures",
      type: "montants",
      titre: "L'unité d'œuvre : l'heure de travail",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutsParProduit(c);
        const g = k.gamme;
        return `Les charges communes du mois font ${eur(k.communes)} : structure ${eur(g.communes.structure)}, entretien ${eur(g.communes.entretien)}, usure de l'équipement ${eur(g.communes.usure)}. On les répartit au prorata des heures de travail que demande chaque référence. ${listeDes(g.references, (r) => `${r.nom} : ${qte(r.heuresParUnite)} h par unité`)}. Calculez les heures de chaque référence, puis le coût d'une heure.`;
      },
      champs: (c) => {
        const k = coutsParProduit(c);
        return [
          ...k.parReference.map((l) => ({
            libelle: `Heures : ${l.nom}`,
            attendu: l.heures,
            calcul: `${qte(l.quantite)} × ${qte(l.heuresParUnite)} h = ${qte(l.heures)} h`,
            tolerance: 0.05,
          })),
          {
            libelle: "Coût d'une heure",
            attendu: k.coutDeLHeure,
            calcul: `${eur(k.communes)} ÷ ${qte(k.heures)} h = ${eur(k.coutDeLHeure)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        return [
          `Chaque heure de travail porte ${eur(k.coutDeLHeure)} de charges communes. Une référence qui demande beaucoup de travail en reçoit beaucoup, même si elle se vend peu cher.`,
        ];
      },
    },
    {
      id: "couts-complets",
      type: "montants",
      titre: "Le coût complet de chaque référence",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Ajoutez au coût direct de chaque référence ses heures × ${eur(k.coutDeLHeure)}. Quel est son coût complet ?`;
      },
      champs: (c) =>
        coutsParProduit(c).parReference.map((l) => ({
          libelle: `Coût complet : ${l.nom}`,
          attendu: l.coutComplet,
          calcul: `${eur(l.direct)} + ${qte(l.heures)} h × ${eur(coutsParProduit(c).coutDeLHeure)} = ${eur(l.coutComplet)}`,
          tolerance: 0.05,
        })),
      explication: (c) => {
        const k = coutsParProduit(c);
        return [
          `Les charges communes imputées font ${eur(k.imputees)}, pour ${eur(k.communes)} à répartir : l'écart de quelques centimes vient du coût de l'heure, arrondi.`,
        ];
      },
    },
    {
      id: "resultats",
      type: "montants",
      titre: "Le résultat de chaque référence",
      notions: ["full_unit_cost"],
      question: (c) => {
        const g = gammeDe(c);
        return `Le chiffre d'affaires de chaque référence : ${listeDes(g.references, (r) => `${r.nom} ${eur(r.chiffreDAffaires)}`)}. Calculez le résultat de chacune (négatif pour une perte), puis celui de la gamme.`;
      },
      champs: (c) => {
        const k = coutsParProduit(c);
        return [
          ...k.parReference.map((l) => ({
            libelle: `Résultat : ${l.nom}`,
            attendu: l.resultat,
            calcul: `${eur(l.chiffreDAffaires)} − ${eur(l.coutComplet)} = ${eur(l.resultat)}`,
            tolerance: 0.05,
          })),
          {
            libelle: "Résultat de la gamme",
            attendu: k.resultat,
            calcul: `${k.parReference.map((l) => eur(l.resultat)).join(" + ")} = ${eur(k.resultat)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        const f = k.faible;
        return [
          f.resultat < 0
            ? `${f.nom} perd ${eur(-f.resultat)} en coût complet. La tentation est grande de l'arrêter.`
            : `${f.nom} est la référence la moins rentable : ${eur(f.resultat)} seulement en coût complet. La tentation est grande de l'arrêter pour se concentrer sur les autres.`,
        ];
      },
    },
    {
      id: "abandon",
      type: "choix",
      titre: "Faut-il abandonner la moins rentable ?",
      notions: ["full_unit_cost", "contribution_margin", "fixed_costs"],
      question: (c) => {
        const f = coutsParProduit(c).faible;
        return `${c.entreprise} arrête ${f.nom}. Ses charges propres disparaissent avec elle : coût variable, publicité, qualité. Les charges communes, elles, restent : le local, l'équipe, l'équipement. Que devient le résultat de la gamme ?`;
      },
      options: (c) => {
        const k = coutsParProduit(c);
        const f = k.faible;
        const baisse = f.margeSpecifique > 0;
        return [
          {
            texte: `Il ${baisse ? "baisse" : "monte"} de ${eur(Math.abs(f.margeSpecifique))} : ce que la référence rapporte, une fois payées ses seules charges propres.`,
            juste: true,
            retour: baisse
              ? `C'est cela. ${f.nom} paie ses charges propres et laisse ${eur(f.margeSpecifique)} pour les charges communes. Sans elle, ces charges retombent sur les autres références, et le résultat passe à ${eur(k.resultatSansLaFaible)}.`
              : `C'est cela. ${f.nom} ne couvre même pas ses charges propres : l'arrêter fait gagner ${eur(-f.margeSpecifique)}.`,
          },
          {
            texte: `Il ${f.resultat < 0 ? "monte" : "baisse"} de ${eur(Math.abs(f.resultat))} : le résultat de la référence en coût complet.`,
            juste: false,
            retour: `Ce serait vrai si ses ${eur(f.imputees)} de charges communes partaient avec elle. Elles restent : le local et l'équipe sont toujours là.`,
          },
          {
            texte: "Il ne change pas : la référence pèse peu dans la gamme.",
            juste: false,
            retour: `Elle pèse ${eur(f.chiffreDAffaires)} de chiffre d'affaires et ${eur(f.direct)} de charges propres : son départ change le résultat de la différence.`,
          },
        ];
      },
    },
    {
      id: "marge-specifique",
      type: "montants",
      titre: "La marge sur coûts spécifiques",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => {
        const f = coutsParProduit(c).faible;
        return `Calculez la marge sur coûts spécifiques de ${f.nom} (son chiffre d'affaires moins son coût direct), puis le résultat de la gamme sans elle.`;
      },
      champs: (c) => {
        const k = coutsParProduit(c);
        const f = k.faible;
        return [
          {
            libelle: `Marge sur coûts spécifiques : ${f.nom}`,
            attendu: f.margeSpecifique,
            calcul: `${eur(f.chiffreDAffaires)} − ${eur(f.direct)} = ${eur(f.margeSpecifique)}`,
            tolerance: 0.05,
          },
          {
            libelle: `Résultat de la gamme sans ${f.nom}`,
            attendu: k.resultatSansLaFaible,
            calcul: `${eur(k.resultat)} − ${eur(f.margeSpecifique)} = ${eur(k.resultatSansLaFaible)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const f = coutsParProduit(c).faible;
        return [
          f.margeSpecifique > 0
            ? `Tant que sa marge sur coûts spécifiques est positive, une référence aide à payer les charges communes, même quand son coût complet dit qu'elle perd. ${f.nom} se garde, ou se retravaille : son prix, sa publicité, ses heures.`
            : `Une marge sur coûts spécifiques négative dit qu'une référence coûte plus qu'elle ne rapporte, avant même les charges communes : ${f.nom} se retravaille ou s'arrête.`,
        ];
      },
    },
    {
      id: "la-cle",
      type: "choix",
      titre: "Une autre clé",
      notions: ["full_unit_cost"],
      question: () =>
        "Si l'on répartissait les charges communes au chiffre d'affaires plutôt qu'aux heures, qu'est-ce qui changerait ?",
      options: () => [
        {
          texte: "Le résultat de chaque référence, mais pas celui de la gamme.",
          juste: true,
          retour:
            "C'est cela. La clé déplace les charges communes d'une référence à l'autre ; elle ne les fait ni grossir ni disparaître. Le coût complet d'un produit dépend d'un choix de répartition ; sa marge sur coûts spécifiques, non.",
        },
        {
          texte: "Le résultat de la gamme, qui serait plus juste.",
          juste: false,
          retour: "Les charges communes restent les mêmes, quelle que soit la façon de les partager : le résultat de la gamme ne bouge pas.",
        },
        {
          texte: "Rien : le coût complet ne dépend pas de la clé.",
          juste: false,
          retour: "Il en dépend : une référence qui demande peu d'heures mais se vend cher recevrait plus de charges au chiffre d'affaires qu'aux heures.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["full_unit_cost", "contribution_margin"],
      texte: (c) => {
        const k = coutsParProduit(c);
        return [
          `Vous avez calculé le coût complet et le résultat de chaque référence de ${c.entreprise}, pour un résultat de gamme de ${eur(k.resultat)} en un mois.`,
          "Le coût complet dit ce que coûte un produit, une fois les charges communes partagées : il sert à fixer un prix et à comparer. Pour décider d'arrêter un produit, on regarde ce qui partirait avec lui : sa marge sur coûts spécifiques.",
        ];
      },
      repere: () =>
        "Coût direct, plus charges communes au prorata de l'unité d'œuvre, égale le coût complet. Pour abandonner un produit : sa marge sur coûts spécifiques, jamais son seul résultat en coût complet.",
    },
  ],
};
