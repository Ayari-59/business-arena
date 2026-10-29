import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  BAISSE_DE_PRIX_DU_COMMERCIAL,
  COUPE_DU_FINANCIER,
  ENTREPRISES_DE_LA_DIRECTION,
  FACONS,
  LEVIERS_DES_FACONS,
  anneeDecidee,
  prixQuiSertLePlusFort,
  type Facon,
} from "../monde/direction-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DÉCIDER ENSEMBLE, CHACUN SON ÉCRAN, UNE SEULE DÉCISION (Bac STMG, management,
 * palier 1).
 *
 * L'intelligence collective dans l'équipe de direction de NOVA. Le commercial regarde le marché (les
 * ventes, les prix), le financier regarde les dépenses ; l'atelier sait ce que la ligne peut monter.
 * Le chapitre chiffre l'année N + 1 décidée de trois façons : par le commercial seul, qui baisse le
 * prix ; par le financier seul, qui coupe l'entretien et la prévention ; par l'équipe, qui garde le
 * plan. Il compare les ventes, les clients refusés et le résultat des choix, puis cherche le plus bas
 * prix qui sert Noël (le curseur, une information de l'atelier) et la décision qui ne refuse aucun
 * client (le laboratoire : il faut croiser le prix et les budgets).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : la demande de N + 1, la droite de demande
 * du premier trimestre, la ligne, l'équipe, l'entretien et la qualité sont ceux de nova-capacite.ts,
 * capacite.ts et mercatique-de-nova.ts, lus par monde/direction-de-nova.ts. Les deux rôles et ce que
 * chacun déciderait seul sont des hypothèses du cours, nommées là-bas.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait trois fois l'année de l'arène dans les neuf entreprises ; il
 * chiffre maintenant l'année N + 1 de NOVA : l'équipe fait 461 774 € de résultat des choix, le
 * commercial seul 338 641,20 €, le financier seul 453 301,93 €.
 */

export { BAISSE_DE_PRIX_DU_COMMERCIAL, COUPE_DU_FINANCIER };
/** La mission de l'arène fait aussi monter la publicité du commercial de moitié (jouez.ts) ; NOVA, elle, n'en fait pas. */
export const HAUSSE_DE_PUBLICITE_DU_COMMERCIAL = 0.5;

export const ENTREPRISES_DE_LA_DECISION = ENTREPRISES_DE_LA_DIRECTION;
export { FACONS, type Facon };

const NOM: Record<Facon, string> = { commercial: "le commercial seul", financier: "le financier seul", equipe: "l'équipe" };
const Nom = (f: Facon) => NOM[f].charAt(0).toUpperCase() + NOM[f].slice(1);

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pourcent = (x: number) => `${Math.round(x * 100)} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les trois années, et les écarts de chaque rôle face à l'équipe (le cas du partage les reprend). */
export function troisFacons(_c?: Cas) {
  const b = Object.fromEntries(FACONS.map((f) => [f, anneeDecidee(LEVIERS_DES_FACONS[f])])) as Record<Facon, ReturnType<typeof anneeDecidee>>;
  const meilleur = FACONS.reduce((a, f) => (b[f].resultat > b[a].resultat ? f : a));
  return {
    b,
    meilleur,
    commercial: {
      ecartDeVentes: b.commercial.production - b.equipe.production,
      ecartDeRefusees: b.commercial.refusees - b.equipe.refusees,
      ecartDeResultat: auCentime(b.commercial.resultat - b.equipe.resultat),
    },
    financier: {
      economies: auCentime(b.equipe.entretien + b.equipe.prevention - b.financier.entretien - b.financier.prevention),
      ecartDeVentes: b.financier.production - b.equipe.production,
      ecartDeResultat: auCentime(b.financier.resultat - b.equipe.resultat),
    },
  };
}

function tableauDesDecisions(): TableauDeDonnees {
  const k = troisFacons();
  return {
    titre: "Ce que chaque façon de décider pose pour l'année N + 1",
    colonnes: FACONS.map(Nom),
    lignes: [
      { libelle: "Prix d'une enceinte", valeurs: FACONS.map((f) => eur(k.b[f].prix)) },
      { libelle: "Entretien de la ligne dans l'année", valeurs: FACONS.map((f) => eur(k.b[f].entretien)) },
      { libelle: "Prévention de la qualité dans l'année", valeurs: FACONS.map((f) => eur(k.b[f].prevention)) },
    ],
  };
}

function tableauDesTrois(c: Cas): TableauDeDonnees {
  const k = troisFacons(c);
  const ligne = (libelle: string, v: (x: (typeof k.b)[Facon]) => string) => ({ libelle, valeurs: FACONS.map((f) => v(k.b[f])) });
  return {
    titre: `L'année N + 1 ${dE(c.entreprise)}, décidée de trois façons`,
    colonnes: FACONS.map(Nom),
    lignes: [
      ligne(`Ventes (${c.unites})`, (x) => qte(x.production)),
      ligne(`Clients refusés (${c.unites})`, (x) => qte(x.refusees)),
      ligne("Marge sur coût variable", (x) => eur(x.marge)),
      ligne("Entretien", (x) => eur(x.entretien)),
      ligne("Coûts de la qualité", (x) => eur(x.qualite)),
      ligne("Marge des ventes perdues par les défauts", (x) => eur(x.margeDesDefauts)),
      ligne("Résultat des choix", (x) => eur(x.resultat)),
    ],
  };
}

export const DECIDER_ENSEMBLE: Chapitre = {
  code: "decider-ensemble",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Numérique et intelligence collective"],
  titre: "Décider ensemble : chacun son écran, une seule décision",
  accroche:
    "Le commercial regarde le marché, le financier les dépenses, l'atelier ce que la ligne peut monter. Chacun seul déciderait autrement : ce que donne chaque façon de décider l'année qui vient.",
  objectifs: [
    "Relier chaque rôle d'une équipe à l'information qu'il regarde",
    "Chiffrer ce que donne une décision prise d'un seul point de vue",
    "Comparer plusieurs façons de décider sur plusieurs critères",
    "Expliquer ce que l'équipe gagne à croiser ses informations",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_DECISION,
    pourquoi: "ce chapitre décide l'année N + 1 de NOVA, dont le cours tient la demande, le prix, la ligne, l'entretien et la qualité.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Chacun son écran",
      notions: ["dashboard", "price_elasticity"],
      tableau: () => tableauDesDecisions(),
      texte: (c) => [
        `Dans l'équipe qui dirige ${c.entreprise}, chacun a ses écrans. Le commercial regarde le marché : ce qui s'est vendu, les prix, les clients qu'on pourrait gagner. Le financier regarde les dépenses : ce qui sort de la caisse, et ce qu'on pourrait économiser. L'atelier sait ce que la ligne peut monter, trimestre après trimestre.`,
        `Seul, chacun déciderait avec ce qu'il voit. Le commercial baisserait le prix de ${pourcent(BAISSE_DE_PRIX_DU_COMMERCIAL)} pour vendre plus. Le financier diviserait par ${Math.round(1 / COUPE_DU_FINANCIER)} l'entretien de la ligne et la prévention de la qualité. L'équipe, elle, croise les écrans avant de prendre une seule décision : elle garde le plan de N + 1.`,
        "On compare les trois années sur ce que les choix changent : la marge sur coût variable des enceintes vendues, moins l'entretien, moins les coûts de la qualité, moins la marge des ventes que les défauts font perdre. Le loyer, le personnel et l'usure de la ligne ne bougent pas.",
      ],
      repere: () => "Une décision prise d'un seul point de vue voit ce que montre un écran, et ignore ce que montrent les autres.",
    },
    {
      id: "commercial",
      type: "montants",
      titre: "Le commercial seul",
      notions: ["price_elasticity", "capacity"],
      tableau: (c) => tableauDesTrois(c),
      question: () => "Comparez l'année décidée par le commercial seul à celle de l'équipe : calculez l'écart de ventes, l'écart de clients refusés et l'écart de résultat des choix (commercial seul moins équipe).",
      champs: (c) => {
        const k = troisFacons(c);
        return [
          { libelle: `Écart de ventes (${c.unites})`, attendu: k.commercial.ecartDeVentes, calcul: `${qte(k.b.commercial.production)} − ${qte(k.b.equipe.production)} = ${qte(k.commercial.ecartDeVentes)}`, tolerance: 0 },
          { libelle: `Écart de clients refusés (${c.unites})`, attendu: k.commercial.ecartDeRefusees, calcul: `${qte(k.b.commercial.refusees)} − ${qte(k.b.equipe.refusees)} = ${qte(k.commercial.ecartDeRefusees)}`, tolerance: 0 },
          { libelle: "Écart de résultat des choix", attendu: k.commercial.ecartDeResultat, calcul: `${eur(k.b.commercial.resultat)} − ${eur(k.b.equipe.resultat)} = ${eur(k.commercial.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = troisFacons(c);
        return [
          `Le prix plus bas attire ${qte(k.b.commercial.demande - k.b.equipe.demande)} ${c.unites} de demande en plus, mais la ligne n'en monte que ${qte(k.commercial.ecartDeVentes)} de plus : chaque trimestre, elle tourne à plein, et ${qte(k.b.commercial.refusees)} clients repartent sans être servis.`,
          `Et chaque enceinte vendue laisse ${eur(k.b.commercial.margeUnitaire)} au lieu de ${eur(k.b.equipe.margeUnitaire)} : le résultat des choix baisse de ${eur(-k.commercial.ecartDeResultat)}. Le commercial ne voyait pas l'écran de l'atelier.`,
        ];
      },
    },
    {
      id: "financier",
      type: "montants",
      titre: "Le financier seul",
      notions: ["fixed_costs", "capacity"],
      question: () => "Comparez l'année décidée par le financier seul à celle de l'équipe : calculez les dépenses économisées (entretien et prévention), l'écart de ventes et l'écart de résultat des choix (financier seul moins équipe).",
      champs: (c) => {
        const k = troisFacons(c);
        const e = k.b.equipe;
        const f = k.b.financier;
        return [
          { libelle: "Dépenses économisées", attendu: k.financier.economies, calcul: `(${eur(e.entretien)} + ${eur(e.prevention)}) − (${eur(f.entretien)} + ${eur(f.prevention)}) = ${eur(k.financier.economies)}`, tolerance: 1 },
          { libelle: `Écart de ventes (${c.unites})`, attendu: k.financier.ecartDeVentes, calcul: `${qte(f.production)} − ${qte(e.production)} = ${qte(k.financier.ecartDeVentes)}`, tolerance: 0 },
          { libelle: "Écart de résultat des choix", attendu: k.financier.ecartDeResultat, calcul: `${eur(f.resultat)} − ${eur(e.resultat)} = ${eur(k.financier.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = troisFacons(c);
        const f = k.b.financier;
        return [
          `Le financier économise ${eur(k.financier.economies)}, mais la ligne moins entretenue s'use : à la fin de l'année, elle ne tourne plus qu'à ${pourcent(f.disponibiliteFinale)} de ses capacités, et ${qte(-k.financier.ecartDeVentes)} ${c.unites} de moins sortent. Moins de prévention laisse passer plus de défauts, qui reviennent sous garantie et font fuir des clients.`,
          `Au bout du compte, le résultat des choix baisse de ${eur(-k.financier.ecartDeResultat)} : l'économie se voit tout de suite dans la caisse, ce qu'elle coûte se lit sur les écrans de l'atelier et de la qualité.`,
        ];
      },
    },
    {
      id: "meilleur-resultat",
      type: "choix",
      titre: "Quelle façon de décider ?",
      notions: ["dashboard"],
      question: () => "Laquelle des trois façons de décider fait le meilleur résultat des choix sur l'année N + 1 ?",
      options: (c) => {
        const k = troisFacons(c);
        return FACONS.map((f) => ({
          texte: Nom(f),
          juste: f === k.meilleur,
          retour:
            f === k.meilleur
              ? `Oui : ${eur(k.b[f].resultat)}, ${f === "equipe" ? `contre ${eur(k.b.commercial.resultat)} pour le commercial seul et ${eur(k.b.financier.resultat)} pour le financier seul. Chaque rôle seul voyait un écran ; l'équipe en voit trois.` : "le meilleur des trois."}`
              : `Non : ${NOM[f]} fait ${eur(k.b[f].resultat)}, ${NOM[k.meilleur]} ${eur(k.b[k.meilleur].resultat)}.`,
        }));
      },
    },
    {
      id: "le-prix-qui-sert-noel",
      type: "curseur",
      titre: "Le prix qui sert Noël",
      notions: ["price_elasticity", "capacity"],
      sens: "plus-petite",
      question: (c) => {
        const p = prixQuiSertLePlusFort();
        return `L'écran de l'atelier dit autre chose que celui du commercial : au ${p.trimestre}e trimestre, ${qte(p.demandeAuPlan)} ${c.unites} sont demandées pour ${qte(p.capacite)} que la ligne peut monter. Faites varier le prix d'une enceinte : une droite donne la capacité de la ligne, l'autre la demande du trimestre à ce prix. Placez le curseur sur le plus bas prix, à l'euro, auquel la ligne sert tous les clients de Noël.`;
      },
      grandeur: () => ({ libelle: "Prix d'une enceinte", unite: "€" }),
      cible: () => ({ attendu: prixQuiSertLePlusFort().prix, min: 50, max: 70 }),
      zones: ["La ligne sert tous les clients", "Des clients repartent sans être servis"],
      rates: () => ({ dessous: "À ce prix, la demande de Noël dépasse ce que la ligne peut monter.", dessus: "La ligne sert tous les clients, mais aussi à un prix plus bas : cherchez le plus bas." }),
      montrer: "Montrer le prix",
      lecture: (_c, prix) => {
        const a = anneeDecidee({ prix });
        const t = prixQuiSertLePlusFort().trimestre;
        return [
          { libelle: "Demande de Noël", montant: a.trimestres[t - 1]!.demande, fort: true },
          { libelle: "Capacité de la ligne", montant: a.trimestres[t - 1]!.capaciteOutil },
          { libelle: "Résultat des choix de l'année", montant: a.resultat },
        ];
      },
      droites: () => {
        const p = prixQuiSertLePlusFort();
        return { produit: () => p.capacite, cout: (prix) => anneeDecidee({ prix }).trimestres[p.trimestre - 1]!.demande, libelles: ["Capacité de la ligne", "Demande de Noël"] };
      },
      explication: (c) => {
        const p = prixQuiSertLePlusFort();
        const a = anneeDecidee({ prix: p.prix });
        const plan = anneeDecidee();
        return [
          `À ${eur(p.prix)}, la demande de Noël tombe à ${qte(a.trimestres[p.trimestre - 1]!.demande)} ${c.unites} : la ligne sert tout le monde. À ${eur(p.prix - 1)}, elle dépasserait encore les ${qte(p.capacite)} ${c.unites} de la ligne.`,
          `Le prix qui sert tous les clients est plus haut que celui du plan, pas plus bas : à ${eur(p.prix)}, le résultat des choix serait de ${eur(a.resultat)}, contre ${eur(plan.resultat)} au plan. C'est l'écran de l'atelier qui le montre, pas celui du commercial.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-equipe",
      type: "simulation",
      titre: "Croiser les écrans",
      notions: ["dashboard", "capacity"],
      question: (c) =>
        `Le commercial fixe le prix, le financier les budgets d'entretien et de prévention. Choisissez l'un et l'autre, et regardez les clients refusés et le résultat des choix de l'année N + 1 ${dE(c.entreprise)}.`,
      leviers: () => {
        const plus = prixQuiSertLePlusFort().prix;
        const prix = [LEVIERS_DES_FACONS.commercial.prix, LEVIERS_DES_FACONS.equipe.prix, plus];
        return [
          { code: "prix", libelle: "Prix d'une enceinte", unite: "€", min: Math.min(...prix), max: Math.max(...prix), pas: 0.1, depart: LEVIERS_DES_FACONS.commercial.prix, choix: prix.map((p) => ({ valeur: p, libelle: eur(p) })) },
          {
            code: "budgets",
            libelle: "Entretien et prévention",
            unite: "",
            min: COUPE_DU_FINANCIER,
            max: 1,
            pas: COUPE_DU_FINANCIER,
            depart: COUPE_DU_FINANCIER,
            choix: [
              { valeur: COUPE_DU_FINANCIER, libelle: `Divisés par ${Math.round(1 / COUPE_DU_FINANCIER)}` },
              { valeur: 1, libelle: "Ceux du plan" },
            ],
          },
        ];
      },
      lecture: (_c, p) => {
        const a = anneeDecidee({ prix: p.prix!, budgets: p.budgets! });
        const plan = anneeDecidee();
        return [
          { libelle: "Ventes de l'année", montant: a.production, unite: "enceintes", reference: plan.production },
          { libelle: "Clients refusés", montant: a.refusees, unite: "enceintes", reference: plan.refusees, fort: true },
          { libelle: "Résultat des choix", montant: a.resultat, reference: plan.resultat },
        ];
      },
      defi: () => ({
        consigne: "Trouvez le prix et les budgets qui ne refusent aucun client de l'année.",
        atteint: (p) => anneeDecidee({ prix: p.prix!, budgets: p.budgets! }).refusees === 0,
        indice: (p) => {
          const a = anneeDecidee({ prix: p.prix!, budgets: p.budgets! });
          return p.budgets! < 1 && p.prix! >= prixQuiSertLePlusFort().prix
            ? `Le prix sert Noël, mais la ligne mal entretenue s'use : ${qte(a.refusees)} enceintes sont encore refusées.`
            : `${qte(a.refusees)} enceintes sont refusées : la demande dépasse ce que la ligne peut monter.`;
        },
        solution: { prix: prixQuiSertLePlusFort().prix, budgets: 1 },
      }),
      explication: (c, p) => {
        const a = anneeDecidee({ prix: p.prix!, budgets: p.budgets! });
        const coupe = anneeDecidee({ prix: p.prix!, budgets: COUPE_DU_FINANCIER });
        return [
          `Défi relevé : à ${eur(p.prix!)}, avec l'entretien et la prévention du plan, ${c.entreprise} sert tous ses clients, et le résultat des choix est de ${eur(a.resultat)}. Avec les budgets coupés, la ligne usée en refuserait encore ${qte(coupe.refusees)}.`,
          "Ni le commercial ni le financier ne trouvaient seuls cette décision : il fallait le prix du premier, les budgets du second, et ce que l'atelier sait de la ligne.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const k = troisFacons(c);
        return [
          `Chez ${c.entreprise}, l'année N + 1 décidée par l'équipe fait ${eur(k.b.equipe.resultat)} de résultat des choix ; le commercial seul en ferait ${eur(k.b.commercial.resultat)}, le financier seul ${eur(k.b.financier.resultat)}.`,
          "Décider ensemble, ce n'est pas faire une moyenne des avis : c'est croiser ce que chacun voit, le marché, les dépenses, l'atelier, avant de prendre une seule décision. Dans l'arène, l'équipe qui dirige une entreprise a ces écrans sous les yeux à chaque tour.",
        ];
      },
      repere: () => "Résultat des choix = marge sur coût variable − entretien − coûts de la qualité − marge des ventes perdues par les défauts.",
    },
  ],
};
