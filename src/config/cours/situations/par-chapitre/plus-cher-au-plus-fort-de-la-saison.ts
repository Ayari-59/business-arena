import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import {
  ENTREPRISES_DE_LA_SAISON,
  HAUSSE_EN_HAUTE_SAISON,
  anneeAuPrix,
  ficheDe,
  saisonDuMarche,
} from "../../chapitres/le-prix-selon-la-saison";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « REMPLIR L'HÔTEL : LE PRIX SELON LA SAISON » : PLUS CHER AU PLUS
 * FORT DE LA SAISON ? (BTS MHR, palier 3).
 *
 * Le propriétaire de l'hôtel veut monter la nuitée au seul trimestre où la demande est la plus
 * forte, et la laisser au prix unique le reste de l'année. L'élève refait seul les calculs du
 * chapitre : le coefficient saisonnier de ce trimestre, son taux d'occupation et son revenu par
 * chambre disponible aux deux prix, puis l'écart de résultat de l'année, et rend sa réponse.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde), pas dans
 * l'arène. L'écart de prix est celui du chapitre (`HAUSSE_EN_HAUTE_SAISON`).
 *
 * LE CURSEUR ET LE CROISEMENT (demande du propriétaire, octobre 2026 : un cas aussi exigeant que son
 * chapitre) : au curseur, les nuitées que le trimestre relevé doit vendre pour garder son revenu par
 * chambre disponible ; puis, à rebours, ce que la hausse peut perdre en gardant ce revenu, ce qu'elle
 * peut perdre en gardant le résultat, et ce qu'elle perd. Pour une hausse, le résultat tolère plus de
 * nuitées perdues que le revenu par chambre : chaque nuitée perdue n'emporte que sa marge.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "monter" | "garder";

/** Le trimestre le plus fort, l'année au prix unique, et l'année avec ce seul trimestre plus cher. */
export function plusCherAuPlusFort(c: Pick<Cas, "code">) {
  const m = saisonDuMarche(c);
  const k = m.plusHaut;
  const unique = anneeAuPrix(c, () => 1);
  const releve = anneeAuPrix(c, (t) => (t === k ? 1 + HAUSSE_EN_HAUTE_SAISON : 1));
  const avant = unique.trimestres[k - 1]!;
  const apres = releve.trimestres[k - 1]!;
  const ecart = auCentime(releve.resultat - unique.resultat);
  const verdict: Verdict = ecart > 0 ? "monter" : "garder";
  // À rebours : les nuitées que le trimestre relevé doit vendre pour garder son revenu par chambre
  // disponible, puis sa marge sur coûts variables, et ce que la hausse peut donc perdre de l'un et de l'autre.
  const f = ficheDe(c);
  const pourLeRevpar = Math.ceil(avant.chiffreDAffaires / apres.prix - 1e-9);
  const margeAvant = auCentime((avant.prix - f.coutVariableParNuitee) * avant.vendues);
  const margeParNuitee = auCentime(apres.prix - f.coutVariableParNuitee);
  const pourLaMarge = Math.ceil(margeAvant / margeParNuitee - 1e-9);
  return {
    f,
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
    refuses: avant.refusees,
    ecart,
    verdict,
    pourLeRevpar,
    margeAvant,
    margeParNuitee,
    pourLaMarge,
    perdablesPourLeRevpar: avant.vendues - pourLeRevpar,
    perdablesPourLaMarge: avant.vendues - pourLaMarge,
    perdues: avant.vendues - apres.vendues,
    /** Les bornes du curseur : du millier sous le seuil de la marge aux nuitées offertes. */
    curseur: { min: Math.floor(pourLaMarge / 1000) * 1000, max: avant.offertes },
  };
}

function tableauDuMarche(c: Cas): TableauDeDonnees {
  const m = saisonDuMarche(c);
  const f = ficheDe(c);
  return {
    titre: `La demande adressée à ${f.entreprise} au prix de ${eur(f.prixDeLAnnee)}, en nuitées`,
    colonnes: m.numeros.map((n) => `${rang(n)} trimestre`),
    lignes: [
      ...m.clienteles.map((g) => ({ libelle: g.nom, valeurs: g.parTrimestre.map(qte) })),
      { libelle: "Toute la demande", valeurs: m.totaux.map(qte) },
    ],
  };
}

function tableauDuTrimestre(c: Cas): TableauDeDonnees {
  const x = plusCherAuPlusFort(c);
  const ligne = (libelle: string, f: (t: typeof x.avant) => string) => ({ libelle, valeurs: [f(x.avant), f(x.apres)] });
  return {
    titre: `Le ${rang(x.k)} trimestre ${dE(x.f.entreprise)}, aux deux prix`,
    colonnes: ["Prix unique", "Prix relevé"],
    lignes: [
      ligne("Prix de la nuitée", (t) => eur(t.prix)),
      ligne(`Demande adressée à ${x.f.entreprise}`, (t) => qte(t.demande)),
      ligne("Nuitées offertes", (t) => qte(t.offertes)),
      ligne("Nuitées vendues", (t) => qte(t.vendues)),
      ligne("Chiffre d'affaires", (t) => eur(t.chiffreDAffaires)),
    ],
  };
}

function tableauDesResultats(c: Cas): TableauDeDonnees {
  const x = plusCherAuPlusFort(c);
  return {
    titre: "Le résultat de chaque trimestre, aux deux prix",
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
    "Remonter aux nuitées qu'une hausse peut perdre, en gardant le revenu par chambre ou la marge",
    "Comparer le résultat de deux années rejouées",
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
            ? `nous avons dû refuser ${qte(x.refuses)} nuitées : l'hôtel était complet`
            : `il nous est resté ${qte(x.avant.vides)} chambres vides sur les ${qte(x.avant.offertes)} nuitées offertes, mais c'est notre plus forte saison`;
        return [
          `« Au ${rang(x.k)} trimestre, ${constat}. Je veux y monter la nuitée de ${pct(Math.round(HAUSSE_EN_HAUTE_SAISON * 100))}, de ${eur(x.avant.prix)} à ${eur(x.apres.prix)}, et seulement à ce trimestre. Dites-moi si c'est bien notre plus forte saison, ce que deviennent le taux d'occupation et le revenu par chambre de ce trimestre, et si l'année y gagne. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. La simulation du cours a rejoué l'année avec ce seul trimestre plus cher ; les autres trimestres gardent le prix unique.",
        ];
      },
      repere: () =>
        "À rendre : le coefficient saisonnier du trimestre, son taux d'occupation et son revenu par chambre aux deux prix, les nuitées que la hausse peut perdre et celles qu'elle perd, l'écart de résultat de l'année, et votre réponse.",
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
            ? `Le taux d'occupation ne bouge pas : la demande, ${qte(x.apres.demande)} nuitées au prix relevé, dépasse encore les ${qte(x.apres.offertes)} nuitées offertes. Le revenu par chambre disponible passe de ${eur(x.revparAvant)} à ${eur(x.revparApres)}.`
            : `Le taux d'occupation passe de ${pct(x.occupationAvant)} à ${pct(x.occupationApres)}, et le revenu par chambre disponible de ${eur(x.revparAvant)} à ${eur(x.revparApres)}.`,
        ];
      },
    },
    {
      id: "le-revpar-au-curseur",
      type: "curseur",
      titre: "Ce que la hausse peut perdre",
      notions: ["occupancy_revpar", "price_elasticity"],
      question: (c) => {
        const x = plusCherAuPlusFort(c);
        return `Faites varier les nuitées vendues au ${rang(x.k)} trimestre, au prix relevé de ${eur(x.apres.prix)}. Une droite donne le revenu par chambre disponible du trimestre à ce prix, l'autre celui du prix unique, ${eur(x.revparAvant)}. Placez le curseur sur le moins de nuitées qui garde ce revenu, puis validez.`;
      },
      grandeur: (c) => {
        const x = plusCherAuPlusFort(c);
        return { libelle: `Nuitées vendues à ${eur(x.apres.prix)}`, unite: "nuitées" };
      },
      cible: (c) => {
        const x = plusCherAuPlusFort(c);
        return { attendu: x.pourLeRevpar, min: x.curseur.min, max: x.curseur.max };
      },
      zones: ["Le revenu par chambre monte", "Le revenu par chambre baisse"],
      rates: () => ({
        dessous: "Avec si peu de nuitées, le revenu par chambre disponible baisse au prix relevé.",
        dessus: "Moins de nuitées garderaient encore ce revenu : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre de nuitées",
      lecture: (c, n) => {
        const x = plusCherAuPlusFort(c);
        const revpar = auCentime((x.apres.prix * n) / x.apres.offertes);
        return [
          { libelle: `Revenu par chambre disponible à ${eur(x.apres.prix)}`, montant: revpar },
          { libelle: `Revenu par chambre disponible à ${eur(x.avant.prix)}`, montant: x.revparAvant },
          { libelle: `Marge sur coûts variables à ${eur(x.apres.prix)}`, montant: auCentime(x.margeParNuitee * n) },
          { libelle: `Marge sur coûts variables à ${eur(x.avant.prix)}`, montant: x.margeAvant },
          { libelle: "Écart de revenu par chambre disponible", montant: auCentime(revpar - x.revparAvant), fort: true },
        ];
      },
      droites: (c) => {
        const x = plusCherAuPlusFort(c);
        return {
          produit: (n) => (x.apres.prix * n) / x.apres.offertes,
          cout: () => x.avant.chiffreDAffaires / x.avant.offertes,
          libelles: [`Revenu par chambre à ${eur(x.apres.prix)}`, "Revenu par chambre au prix unique"],
        };
      },
      explication: (c) => {
        const x = plusCherAuPlusFort(c);
        return [
          `Il faut vendre ${qte(x.pourLeRevpar)} nuitées à ${eur(x.apres.prix)} pour garder le revenu par chambre du prix unique. Regardez la marge dans le tableau : elle se garde avec moins de nuitées encore.`,
        ];
      },
    },
    {
      id: "deux-seuils",
      type: "montants",
      titre: "Deux seuils, à rebours",
      notions: ["occupancy_revpar", "contribution_margin"],
      question: (c) => {
        const x = plusCherAuPlusFort(c);
        return `Au ${rang(x.k)} trimestre, au prix relevé, combien de nuitées la hausse peut-elle perdre en gardant le revenu par chambre disponible du prix unique ? Et en gardant sa marge sur coûts variables (chaque nuitée occupée coûte ${eur(x.f.coutVariableParNuitee)}) ? Puis combien en perd-elle dans la simulation ?`;
      },
      champs: (c) => {
        const x = plusCherAuPlusFort(c);
        return [
          {
            libelle: "Nuitées que la hausse peut perdre, revenu par chambre gardé",
            attendu: x.perdablesPourLeRevpar,
            calcul: `${qte(x.avant.vendues)} − ${eur(x.avant.chiffreDAffaires)} ÷ ${eur(x.apres.prix)} = ${qte(x.avant.vendues)} − ${qte(x.pourLeRevpar)} = ${qte(x.perdablesPourLeRevpar)}`,
            tolerance: 1,
          },
          {
            libelle: "Nuitées que la hausse peut perdre, marge gardée",
            attendu: x.perdablesPourLaMarge,
            calcul: `${qte(x.avant.vendues)} − ${eur(x.margeAvant)} ÷ (${eur(x.apres.prix)} − ${eur(x.f.coutVariableParNuitee)}) = ${qte(x.avant.vendues)} − ${qte(x.pourLaMarge)} = ${qte(x.perdablesPourLaMarge)}`,
            tolerance: 1,
          },
          {
            libelle: "Nuitées que la hausse fait perdre",
            attendu: x.perdues,
            calcul: `${qte(x.avant.vendues)} − ${qte(x.apres.vendues)} = ${qte(x.perdues)}`,
          },
        ];
      },
      explication: (c) => {
        const x = plusCherAuPlusFort(c);
        return [
          `La hausse pouvait perdre ${qte(x.perdablesPourLeRevpar)} nuitées en gardant le revenu par chambre, ${qte(x.perdablesPourLaMarge)} en gardant la marge : une nuitée perdue n'emporte que sa marge, puisque son coût de ${eur(x.f.coutVariableParNuitee)} part avec elle. Elle en perd ${qte(x.perdues)} : ${x.perdues <= x.perdablesPourLeRevpar ? "les deux seuils tiennent" : x.perdues <= x.perdablesPourLaMarge ? "le revenu par chambre baisse, mais la marge tient" : "aucun des deux seuils ne tient"}.`,
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
        return `Calculez l'écart de résultat de l'année, prix relevé au ${rang(x.k)} trimestre moins prix unique.`;
      },
      champs: (c) => {
        const x = plusCherAuPlusFort(c);
        return [
          {
            libelle: "Écart de résultat de l'année, prix relevé moins prix unique",
            attendu: x.ecart,
            calcul: `${eur(x.releve.resultat)} − ${retranche(x.unique.resultat)} = ${eur(x.ecart)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const x = plusCherAuPlusFort(c);
        return [`Le résultat de l'année ${x.ecart >= 0 ? `monte de ${eur(x.ecart)}` : `baisse de ${eur(-x.ecart)}`}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au propriétaire",
      notions: ["occupancy_revpar"],
      question: () => "Quelle réponse rendez-vous au propriétaire ?",
      // Monter et garder ont la même longueur : la bonne réponse ne se devine pas.
      options: (c) => {
        const x = plusCherAuPlusFort(c);
        const chiffres = `Au ${rang(x.k)} trimestre, le revenu par chambre disponible passe de ${eur(x.revparAvant)} à ${eur(x.revparApres)} ; sur l'année, le résultat ${x.ecart >= 0 ? `monte de ${eur(x.ecart)}` : `baisse de ${eur(-x.ecart)}`}.`;
        return [
          {
            texte: `Montez-la au ${rang(x.k)} trimestre : la hausse rapporte plus qu'elle ne coûte`,
            juste: x.verdict === "monter",
            retour:
              x.verdict === "monter"
                ? `Oui. ${chiffres} ${
                    x.apres.vendues >= x.avant.vendues
                      ? `L'hôtel était complet : au prix relevé, la demande reste au-dessus des nuitées offertes, si bien qu'il vend autant, et chaque nuitée rapporte ${eur(auCentime(x.apres.prix - x.avant.prix))} de plus.`
                      : `L'hôtel refusait ${qte(x.refuses)} nuitées : la hausse fait partir ${qte(x.perdues)} clients quand elle pouvait en perdre ${qte(x.perdablesPourLaMarge)}, et chaque nuitée gardée rapporte ${eur(auCentime(x.apres.prix - x.avant.prix))} de plus.`
                  }`
                : `Non. ${chiffres}`,
          },
          {
            texte: "Gardez le prix unique : la hausse coûterait plus qu'elle ne rapporte",
            juste: x.verdict === "garder",
            retour: x.verdict === "garder" ? `Oui. ${chiffres}` : `Non. ${chiffres}`,
          },
          {
            texte: "Baissez-la plutôt : un hôtel plein se remplit par le prix",
            juste: false,
            retour: `Non : au ${rang(x.k)} trimestre, ${x.refuses > 0 ? `l'hôtel refusait déjà ${qte(x.refuses)} nuitées ; une baisse vendrait les mêmes nuitées moins cher` : "la plus forte saison n'a pas besoin d'une baisse pour se remplir"}. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
