import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../../scenarios/registry";
import type { Cas } from "../../cas";
import {
  ENTREPRISES_DE_LA_SAISON,
  HAUSSE_EN_HAUTE_SAISON,
  anneeAuPrix,
  lireLAnnee,
  saisonDuMarche,
} from "../../chapitres/le-prix-selon-la-saison";
import { anneeDeReference } from "../../gestion-de-la-pme";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « REMPLIR L'HÔTEL : LE PRIX SELON LA SAISON » : PLUS CHER AU PLUS
 * FORT DE LA SAISON ? (BTS MHR, palier 3).
 *
 * Le propriétaire de l'hôtel veut monter la nuitée au seul trimestre où la demande du marché est
 * la plus forte, et la laisser au prix unique le reste de l'année. L'élève refait seul les calculs
 * du chapitre : le coefficient saisonnier de ce trimestre, son taux d'occupation et son revenu par
 * chambre disponible aux deux prix, puis l'écart de résultat net de l'année, et rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre jouait le prix sur toute l'année, saison par
 * saison ; ici, un seul trimestre change, celui que le calendrier désigne. L'écart de prix est
 * celui du chapitre (`HAUSSE_EN_HAUTE_SAISON`) ; l'année est celle du cours, rejouée par l'arène
 * avec ce seul trimestre plus cher (`anneeAuPrix`). La défaillance se tranche avant l'écart de
 * résultat : une année qui ne finit pas ne se compare pas par sa somme.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);

export type Verdict = "monter" | "garder" | "defaillance";

/** Le trimestre le plus fort, l'année au prix unique, et l'année avec ce seul trimestre plus cher. */
export function plusCherAuPlusFort(c: Cas) {
  const m = saisonDuMarche(c);
  const k = m.plusHaut;
  const unique = lireLAnnee(anneeDeReference(c.code));
  const releve = lireLAnnee(anneeAuPrix(c, "plus-cher-au-plus-fort-de-la-saison", (t) => (t === k ? 1 + HAUSSE_EN_HAUTE_SAISON : 1)));
  const avant = unique.trimestres[k - 1]!;
  const apres = releve.trimestres[k - 1]!;
  const ecart = releve.resultat - unique.resultat;
  const verdict: Verdict = releve.defaillance !== null ? "defaillance" : ecart > 0 ? "monter" : "garder";
  return {
    m,
    k,
    unique,
    releve,
    avant,
    apres,
    occupationAvant: auDixieme((avant.vendues / avant.offertes) * 100),
    occupationApres: auDixieme((apres.vendues / apres.offertes) * 100),
    revparAvant: auCentime(avant.chiffreDAffaires / avant.offertes),
    revparApres: auCentime(apres.chiffreDAffaires / apres.offertes),
    refuses: Math.max(0, avant.demande - avant.enVente),
    ecart,
    verdict,
  };
}

function tableauDuMarche(c: Cas): TableauDeDonnees {
  const m = saisonDuMarche(c);
  return {
    titre: "La demande du marché, tous hôtels réunis, en nuitées",
    colonnes: m.numeros.map((n) => `${rang(n)} trimestre`),
    lignes: [
      ...m.clienteles.map((g) => ({ libelle: g.nom, valeurs: g.parTrimestre.map(qte) })),
      { libelle: "Toute la demande du marché", valeurs: m.totaux.map(qte) },
    ],
  };
}

function tableauDuTrimestre(c: Cas): TableauDeDonnees {
  const x = plusCherAuPlusFort(c);
  const v = scenarioByCode(c.code).vocabulary;
  const ligne = (libelle: string, f: (t: typeof x.avant) => string) => ({ libelle, valeurs: [f(x.avant), f(x.apres)] });
  return {
    titre: `Le ${rang(x.k)} trimestre ${/^[aeiouyéèêAEIOUYÉÈ]/.test(c.entreprise) ? `d'${c.entreprise}` : `de ${c.entreprise}`}, aux deux prix`,
    colonnes: ["Prix unique", "Prix relevé"],
    lignes: [
      ligne(v.priceLabel, (t) => eur(t.prix)),
      ligne(`Demande adressée à ${c.entreprise}`, (t) => qte(t.demande)),
      ligne(v.productionPlanLabel, (t) => qte(t.enVente)),
      ligne("Nuitées vendues", (t) => qte(t.vendues)),
      ligne("Nuitées offertes", (t) => qte(t.offertes)),
      ligne("Chiffre d'affaires", (t) => eur(t.chiffreDAffaires)),
    ],
  };
}

function tableauDesResultats(c: Cas): TableauDeDonnees {
  const x = plusCherAuPlusFort(c);
  return {
    titre: "Le résultat net de chaque trimestre, aux deux prix",
    colonnes: x.unique.trimestres.map((t) => `${rang(t.numero)} trimestre`),
    lignes: [
      { libelle: "Prix unique toute l'année", valeurs: x.unique.trimestres.map((t) => eur(t.resultat)) },
      { libelle: `Prix relevé au ${rang(x.k)} trimestre`, valeurs: x.releve.trimestres.map((t) => eur(t.resultat)) },
    ],
  };
}

export const PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON: Situation = {
  code: "plus-cher-au-plus-fort-de-la-saison",
  parcours: "mhr",
  palier: 3,
  blocs: [],
  reprend: ["le-prix-selon-la-saison"],
  commanditaire: "Le propriétaire de l'hôtel",
  titre: "Plus cher au plus fort de la saison ?",
  accroche:
    "Le propriétaire veut monter la nuitée au seul trimestre où la demande est la plus forte. Est-ce bien la plus forte saison, que deviennent le remplissage et le revenu par chambre, et l'année y gagne-t-elle ?",
  objectifs: [
    "Calculer un coefficient saisonnier",
    "Calculer le taux d'occupation et le revenu par chambre disponible d'un trimestre, à deux prix",
    "Comparer le résultat net de deux années rejouées",
    "Répondre au propriétaire, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_SAISON,
    pourquoi:
      "ce cas reprend le chapitre « Remplir l'hôtel : le prix selon la saison », qui suit le remplissage des chambres d'un hôtel.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du propriétaire",
      tableau: tableauDuMarche,
      texte: (c) => {
        const x = plusCherAuPlusFort(c);
        const constat =
          x.refuses > 0
            ? `nous avons dû refuser ${qte(x.refuses)} nuitées faute de chambres en vente`
            : "nous avons vendu ce que nous avions mis en vente";
        return [
          `« Au ${rang(x.k)} trimestre, ${constat}. Je veux y monter la nuitée de ${pct(Math.round(HAUSSE_EN_HAUTE_SAISON * 100))}, de ${eur(x.avant.prix)} à ${eur(x.apres.prix)}, et seulement à ce trimestre. Dites-moi si c'est bien notre plus forte saison, ce que deviennent le taux d'occupation et le revenu par chambre de ce trimestre, et si l'année y gagne. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. L'arène a rejoué l'année avec ce seul trimestre plus cher. Le reste, chaque gestion le décide comme dans l'année du cours, concurrents compris, sur ses ventes du trimestre d'avant.",
        ];
      },
      repere: () => "À rendre : le coefficient saisonnier du trimestre, son taux d'occupation et son revenu par chambre aux deux prix, l'écart de résultat de l'année, et votre réponse.",
    },
    {
      id: "la-saison",
      type: "montants",
      titre: "La plus forte saison",
      notions: ["seasonality"],
      question: (c) => {
        const x = plusCherAuPlusFort(c);
        return `À partir de la dernière ligne du tableau, calculez la demande moyenne d'un trimestre, puis le coefficient saisonnier du ${rang(x.k)} trimestre, au centième.`;
      },
      champs: (c) => {
        const x = plusCherAuPlusFort(c);
        return [
          {
            libelle: "Demande moyenne d'un trimestre",
            attendu: x.m.moyenne,
            calcul: `(${x.m.totaux.map(qte).join(" + ")}) ÷ ${qte(x.m.n)} = ${qte(x.m.moyenne)}`,
            tolerance: 1,
          },
          {
            libelle: `Coefficient du ${rang(x.k)} trimestre`,
            attendu: x.m.coefficients[x.k - 1]!,
            calcul: `${qte(x.m.totaux[x.k - 1]!)} ÷ ${qte(x.m.moyenne)} = ${qte(x.m.coefficients[x.k - 1]!)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = plusCherAuPlusFort(c);
        return [`Le coefficient le plus haut de l'année est bien celui du ${rang(x.k)} trimestre : ${qte(x.m.coefficients[x.k - 1]!)}.`];
      },
    },
    {
      id: "le-trimestre",
      type: "montants",
      titre: "Le trimestre aux deux prix",
      notions: ["occupancy_revpar"],
      tableau: tableauDuTrimestre,
      question: (c) => {
        const x = plusCherAuPlusFort(c);
        return `Calculez le taux d'occupation du ${rang(x.k)} trimestre (nuitées vendues ÷ nuitées offertes × 100, au dixième) et son revenu par chambre disponible (chiffre d'affaires ÷ nuitées offertes, au centime), au prix unique puis au prix relevé.`;
      },
      champs: (c) => {
        const x = plusCherAuPlusFort(c);
        return [
          {
            libelle: "Taux d'occupation au prix unique (%)",
            attendu: x.occupationAvant,
            calcul: `${qte(x.avant.vendues)} ÷ ${qte(x.avant.offertes)} × 100 = ${pct(x.occupationAvant)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Taux d'occupation au prix relevé (%)",
            attendu: x.occupationApres,
            calcul: `${qte(x.apres.vendues)} ÷ ${qte(x.apres.offertes)} × 100 = ${pct(x.occupationApres)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Revenu par chambre disponible au prix unique",
            attendu: x.revparAvant,
            calcul: `${eur(x.avant.chiffreDAffaires)} ÷ ${qte(x.avant.offertes)} = ${eur(x.revparAvant)}`,
          },
          {
            libelle: "Revenu par chambre disponible au prix relevé",
            attendu: x.revparApres,
            calcul: `${eur(x.apres.chiffreDAffaires)} ÷ ${qte(x.apres.offertes)} = ${eur(x.revparApres)}`,
          },
        ];
      },
      explication: (c) => {
        const x = plusCherAuPlusFort(c);
        return [
          x.occupationApres === x.occupationAvant
            ? `Le taux d'occupation ne bouge pas : la demande, ${qte(x.apres.demande)} nuitées au prix relevé, dépasse encore les ${qte(x.apres.enVente)} nuitées mises en vente. Le revenu par chambre disponible passe de ${eur(x.revparAvant)} à ${eur(x.revparApres)}.`
            : `Le taux d'occupation passe de ${pct(x.occupationAvant)} à ${pct(x.occupationApres)}, et le revenu par chambre disponible de ${eur(x.revparAvant)} à ${eur(x.revparApres)}.`,
        ];
      },
    },
    {
      id: "l-annee",
      type: "montants",
      titre: "Ce que l'année y gagne",
      notions: ["occupancy_revpar", "income_statement"],
      tableau: tableauDesResultats,
      question: (c) => {
        const x = plusCherAuPlusFort(c);
        return `Calculez l'écart de résultat net de l'année, prix relevé au ${rang(x.k)} trimestre moins prix unique.`;
      },
      champs: (c) => {
        const x = plusCherAuPlusFort(c);
        return [
          {
            libelle: "Écart de résultat net de l'année, prix relevé moins prix unique",
            attendu: x.ecart,
            calcul: `${eur(x.releve.resultat)} − ${retranche(x.unique.resultat)} = ${eur(x.ecart)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const x = plusCherAuPlusFort(c);
        return [
          x.releve.defaillance !== null
            ? `Avec ce trimestre plus cher, ${c.entreprise} tombe en défaillance au ${rang(x.releve.defaillance)} trimestre : l'année ne se compare plus par sa somme.`
            : `Le résultat net de l'année ${x.ecart >= 0 ? `monte de ${eur(x.ecart)}` : `baisse de ${eur(-x.ecart)}`}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au propriétaire",
      notions: ["occupancy_revpar"],
      question: () => "Quelle réponse rendez-vous au propriétaire ?",
      options: (c) => {
        const x = plusCherAuPlusFort(c);
        const chiffres = `Au ${rang(x.k)} trimestre, le revenu par chambre disponible passe de ${eur(x.revparAvant)} à ${eur(x.revparApres)} ; sur l'année, le résultat net ${x.ecart >= 0 ? `monte de ${eur(x.ecart)}` : `baisse de ${eur(-x.ecart)}`}.`;
        return [
          {
            texte: `Montez-la au ${rang(x.k)} trimestre : l'année y gagne`,
            juste: x.verdict === "monter",
            retour:
              x.verdict === "monter"
                ? `Oui. ${chiffres} ${
                    x.apres.vendues >= x.avant.vendues
                      ? `Des clients repartaient faute de chambres en vente : au prix relevé, la demande reste au-dessus des nuitées en vente, si bien que l'hôtel vend autant, et chaque nuitée rapporte ${eur(auCentime(x.apres.prix - x.avant.prix))} de plus.`
                      : "La hausse a rapporté plus qu'elle n'a fait partir de clients."
                  }`
                : `Non. ${chiffres}`,
          },
          {
            texte: "Gardez le prix unique : la hausse fait perdre plus de clients qu'elle ne rapporte",
            juste: x.verdict === "garder",
            retour: x.verdict === "garder" ? `Oui. ${chiffres}` : `Non. ${chiffres}`,
          },
          {
            texte: "Gardez le prix unique : l'hôtel ne finirait pas l'année",
            juste: x.verdict === "defaillance",
            retour:
              x.verdict === "defaillance"
                ? `Oui : ${c.entreprise} tomberait en défaillance au ${rang(x.releve.defaillance!)} trimestre.`
                : `Non : ${c.entreprise} finit l'année, sans défaillance. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
