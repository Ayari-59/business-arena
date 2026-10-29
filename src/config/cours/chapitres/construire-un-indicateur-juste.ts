import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { type Cas } from "../cas";
import {
  ECART_ALIGNE,
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FICHE_DU_MARCHE,
  PRIX_ESSAYES,
  indicateurDuPrix as indicateurDuMonde,
  positionDe,
  prixLePlusHautAligne,
  ventesDAurisPourLaMoyenneSimple,
  type Position,
} from "../monde/gestion-et-information";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CONSTRUIRE UN INDICATEUR JUSTE (Bac STMG, systèmes d'information de gestion,
 * palier 1).
 *
 * Un indicateur se définit avant de se calculer : sa formule, son unité, sa période, sa source.
 * L'exemple est le prix moyen du marché sur l'année (NOVA et ses deux concurrents), et le piège
 * classique de la moyenne de ratios face au ratio des sommes : la moyenne simple des prix des
 * enseignes donne à chacune le même poids, qu'elle vende peu ou beaucoup ; le prix moyen pondéré par
 * les ventes (chiffre d'affaires total ÷ ventes totales) dit ce que les clients du marché ont payé en
 * moyenne. L'élève calcule les deux, dit lequel répond à la question, puis l'indice de prix de NOVA
 * avec chacun, et ce que l'indicateur faux ferait décider. Un curseur (les ventes d'Auris qui
 * feraient rejoindre la moyenne simple) et un laboratoire (le prix le plus haut où NOVA reste
 * alignée).
 *
 * L'ARÈNE EN DONNE UN EXEMPLE. Le benchmark concurrentiel de l'arène affiche une « Moyenne du
 * marché » qui est la moyenne simple des prix moyens des entreprises (services/game-view.service.ts,
 * `buildBenchmark`). Le chapitre le cite, à sa dernière étape, sans rien y changer.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule, sur le marché à trois (marche-a-trois.ts
 * et attractivite.ts) : NOVA à 59 €, SoundBox à 51 €, Auris à 79 €, et les ventes de l'année type.
 * La règle de lecture ECART_ALIGNE est dans monde/gestion-et-information.ts.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait l'année de l'arène, dans huit entreprises. Chez NOVA, la
 * moyenne simple vaut maintenant 63 € et le prix pondéré 59,31 € : l'indice simple, 94, la croit
 * moins chère que le marché ; l'indice pondéré, 99, la dit au prix du marché.
 */

export { ECART_ALIGNE, positionDe, type Position };
export type ErreurDeDecision = "monter" | "baisser" | "rester" | "aucune";

export const POURQUOI_L_INDICATEUR =
  "ce chapitre compare NOVA à SoundBox et Auris, les enseignes avec qui elle partage son marché, sur l'année que le cours tient.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const aE = (nom: string) => `à ${nom}`;

const NOMS_DES_POSITIONS: Record<Position, string> = {
  dessous: "moins chère que le marché",
  aligne: "au prix du marché",
  dessus: "plus chère que le marché",
};

/** Les enseignes du marché sur l'année, et les deux façons de calculer le prix moyen du marché. */
export function indicateurDuPrix(_c?: Cas, prixDeNova?: number, ventesDAuris?: number) {
  const k = indicateurDuMonde(FICHE_DU_MARCHE, prixDeNova, ventesDAuris);
  const erreur: ErreurDeDecision =
    k.positionSimple === k.positionPonderee ? "aucune" : k.positionSimple === "dessous" ? "monter" : k.positionSimple === "dessus" ? "baisser" : "rester";
  return {
    ...k,
    entreprise: k.nova,
    ecart: auCentime(k.moyenneSimple - k.prixPondere),
    erreur,
    moinsChere: [...k.enseignes].sort((a, b) => a.prix - b.prix)[0]!,
  };
}

export function tableDesEnseignes(c: Cas): TableauDeDonnees {
  const k = indicateurDuPrix(c);
  return {
    titre: "L'année, enseigne par enseigne",
    colonnes: k.enseignes.map((e) => e.nom),
    lignes: [
      { libelle: `Ventes de l'année (${c.unites})`, valeurs: k.enseignes.map((e) => qte(e.ventes)) },
      { libelle: "Chiffre d'affaires de l'année", valeurs: k.enseignes.map((e) => eur(e.chiffreDAffaires)) },
      { libelle: "Prix moyen (chiffre d'affaires ÷ ventes)", valeurs: k.enseignes.map((e) => eur(e.prix)) },
    ],
  };
}

/** Ce que la moyenne simple fait croire, par rapport au prix moyen pondéré. */
function ceQueCroitLEntreprise(c: Cas) {
  const k = indicateurDuPrix(c);
  if (k.positionSimple === k.positionPonderee) {
    return `Avec la moyenne simple comme avec le prix pondéré, ${c.entreprise} est ${NOMS_DES_POSITIONS[k.positionPonderee]} (indices ${qte(k.indiceSimple)} et ${qte(k.indicePondere)}).`;
  }
  return `Avec la moyenne simple, ${c.entreprise} se croit ${NOMS_DES_POSITIONS[k.positionSimple]} (indice ${qte(k.indiceSimple)}) ; avec le prix pondéré, elle est ${NOMS_DES_POSITIONS[k.positionPonderee]} (indice ${qte(k.indicePondere)}).`;
}

export const CONSTRUIRE_UN_INDICATEUR_JUSTE: Chapitre = {
  code: "construire-un-indicateur-juste",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 3 · Information, action et décision"],
  titre: "Construire un indicateur juste",
  accroche:
    "Un indicateur a une formule, une unité, une période et une source. Le prix moyen du marché, calculé de deux façons sur les chiffres de l'année : la moyenne des prix des enseignes, ou le chiffre d'affaires total divisé par les ventes totales. L'une des deux trompe, et fait prendre une mauvaise décision.",
  objectifs: [
    "Définir un indicateur : sa formule, son unité, sa période, sa source",
    "Calculer une moyenne simple et une moyenne pondérée",
    "Dire pourquoi la moyenne de ratios n'est pas le ratio des sommes",
    "Mesurer ce qu'un indicateur faux ferait décider",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_L_INDICATEUR },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un indicateur à construire",
      notions: ["dashboard", "revenue"],
      tableau: tableDesEnseignes,
      texte: (c) => {
        const k = indicateurDuPrix(c);
        const [a, b] = k.enseignes.slice(1);
        return [
          `La direction ${dE(c.entreprise)} veut savoir si elle vend plus cher ou moins cher que le marché, face à ses concurrents, ${a!.nom} et ${b!.nom}. Il lui faut un indicateur : le prix moyen du marché, auquel comparer son propre prix.`,
          "Un indicateur est un chiffre calculé toujours de la même façon, pour être suivi et comparé. Avant tout calcul, on le définit : sa formule (ce qu'on divise par quoi), son unité (en quoi il se compte), sa période (sur quel temps) et sa source (d'où viennent les données). Une définition floue donne un chiffre que chacun calcule à sa façon.",
        ];
      },
      repere: () => "Un indicateur = une formule, une unité, une période, une source. Sans elles, deux personnes calculent deux chiffres différents sous le même nom.",
    },
    {
      id: "la-fiche",
      objectifs: [0],
      type: "choix",
      titre: "La fiche de l'indicateur",
      notions: ["dashboard"],
      question: () => "Quelle fiche définit complètement le prix moyen du marché ?",
      // La bonne réponse est la même dans toutes les entreprises : la question porte sur la définition.
      options: (c) => [
        {
          texte: `Le chiffre d'affaires des enseignes divisé par leurs ventes, en euros par ${c.unite}, sur l'année, d'après la table des ventes`,
          juste: true,
          retour: "Oui : la formule, l'unité, la période et la source y sont. Deux personnes qui suivent cette fiche trouvent le même chiffre.",
        },
        {
          texte: "Le prix auquel les enseignes du marché vendent en général, tel que chacun le voit dans leurs vitrines, leurs catalogues et leurs publicités",
          juste: false,
          retour: "Non : pas de formule (quelles enseignes, quel calcul ?), pas d'unité, pas de période. Chacun en tirerait un chiffre différent.",
        },
        {
          texte: "Le chiffre d'affaires de toutes les enseignes réunies sur l'année, en euros, d'après les comptes de chaque enseigne",
          juste: false,
          retour: "Non : la période et la source y sont, mais la formule mesure la taille du marché en euros, pas un prix. Un prix se compte en euros par unité vendue.",
        },
      ],
    },
    {
      id: "deux-calculs",
      objectifs: [1],
      type: "montants",
      titre: "Deux calculs du prix moyen",
      notions: ["revenue", "demand_market_share"],
      tableau: tableDesEnseignes,
      question: () =>
        "Calculez le prix moyen du marché de deux façons, au centime : la moyenne simple des prix des enseignes (leur somme divisée par le nombre d'enseignes), puis le prix moyen pondéré par les ventes (le chiffre d'affaires total divisé par les ventes totales).",
      champs: (c) => {
        const k = indicateurDuPrix(c);
        return [
          {
            libelle: "Moyenne simple des prix",
            attendu: k.moyenneSimple,
            calcul: `(${k.enseignes.map((e) => eur(e.prix)).join(" + ")}) ÷ ${qte(k.enseignes.length)} = ${eur(k.sommeDesPrix)} ÷ ${qte(k.enseignes.length)} = ${eur(k.moyenneSimple)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Prix moyen pondéré par les ventes",
            attendu: k.prixPondere,
            calcul: `${eur(k.chiffreTotal)} ÷ ${qte(k.ventesTotales)} = ${eur(k.prixPondere)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const k = indicateurDuPrix(c);
        const sens = k.ecart > 0 ? "plus haute" : k.ecart < 0 ? "plus basse" : "égale";
        const pourquoi =
          k.ecart === 0
            ? "Les deux calculs tombent ici sur le même chiffre : c'est un hasard des ventes, pas une règle."
            : k.plusVendue === k.moinsChere && k.ecart > 0
              ? `${k.plusVendue.nom}, l'enseigne la moins chère, est aussi celle qui vend le plus (${qte(k.plusVendue.ventes)} ${c.unites}) : le prix pondéré penche vers son prix ; la moyenne simple ne lui donne pas plus de poids qu'aux autres.`
              : `${k.plusVendue.nom} vend le plus (${qte(k.plusVendue.ventes)} ${c.unites}) : le prix pondéré penche vers son prix ; la moyenne simple ne lui donne pas plus de poids qu'aux autres.`;
        return [`La moyenne simple est ${sens} que le prix pondéré, de ${eur(Math.abs(k.ecart))}. ${pourquoi}`];
      },
    },
    {
      id: "lequel-est-juste",
      objectifs: [2],
      type: "choix",
      titre: "Lequel est juste ?",
      notions: ["revenue"],
      question: (c) => {
        const k = indicateurDuPrix(c);
        return `La direction veut connaître le prix moyen payé par les clients du marché, en euros par ${c.unite}. Lequel des deux chiffres lui répond : ${eur(k.moyenneSimple)} ou ${eur(k.prixPondere)} ?`;
      },
      // La bonne réponse est la même dans toutes les entreprises : le ratio des sommes.
      options: (c) => {
        const k = indicateurDuPrix(c);
        const p = k.plusVendue;
        return [
          {
            texte: "Le prix pondéré : chaque vente du marché y compte une fois",
            juste: true,
            retour: `Oui : ${eur(k.chiffreTotal)} payés pour ${qte(k.ventesTotales)} ${c.unites}, soit ${eur(k.prixPondere)} en moyenne. Une moyenne de prix doit peser chaque prix par les ventes qu'il a faites : c'est le ratio des sommes, pas la moyenne des ratios.`,
          },
          {
            texte: "La moyenne simple : chaque enseigne du marché y compte une fois",
            juste: false,
            retour: `Non : elle donne autant de poids à une enseigne qui vend peu qu'${aE(p.nom)}, qui vend ${qte(p.ventes)} ${c.unites}. Elle dit le prix d'une enseigne prise au hasard, pas ce qu'un client paie en moyenne.`,
          },
          {
            texte: "Les deux se valent : ce sont deux moyennes des mêmes prix",
            juste: false,
            retour: `Non : ${eur(k.moyenneSimple)} et ${eur(k.prixPondere)}, ${eur(Math.abs(k.ecart))} d'écart. Les deux ne répondent pas à la même question, et une seule répond à celle de la direction.`,
          },
        ];
      },
    },
    {
      id: "deux-indices",
      objectifs: [1],
      type: "montants",
      titre: "L'indice de prix, de deux façons",
      notions: ["price_elasticity", "dashboard"],
      question: (c) => {
        const k = indicateurDuPrix(c);
        return `L'indice de prix compare le prix de l'entreprise à celui du marché : prix de l'entreprise ÷ prix du marché × 100. Calculez-le à l'unité pour ${c.entreprise} (prix moyen : ${eur(k.entreprise.prix)}), avec la moyenne simple, puis avec le prix pondéré.`;
      },
      champs: (c) => {
        const k = indicateurDuPrix(c);
        return [
          {
            libelle: "Indice de prix, avec la moyenne simple",
            attendu: k.indiceSimple,
            calcul: `${eur(k.entreprise.prix)} ÷ ${eur(k.moyenneSimple)} × 100 = ${qte(k.indiceSimple)}`,
            tolerance: 1,
          },
          {
            libelle: "Indice de prix, avec le prix pondéré",
            attendu: k.indicePondere,
            calcul: `${eur(k.entreprise.prix)} ÷ ${eur(k.prixPondere)} × 100 = ${qte(k.indicePondere)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => [
        `${ceQueCroitLEntreprise(c)} Selon la règle du cours, un indice entre ${100 - ECART_ALIGNE} et ${100 + ECART_ALIGNE} est au prix du marché.`,
      ],
    },
    {
      id: "ce-que-l-erreur-ferait-decider",
      objectifs: [3],
      type: "choix",
      titre: "Ce que l'erreur ferait décider",
      notions: ["price_elasticity", "demand_market_share"],
      question: (c) => `${ceQueCroitLEntreprise(c)} Si la direction se fiait à la moyenne simple, que déciderait-elle ?`,
      options: (c) => {
        const k = indicateurDuPrix(c);
        const vrai = `Le prix que paient les clients du marché est ${eur(k.prixPondere)} ; ${c.entreprise} vend à ${eur(k.entreprise.prix)}, indice ${qte(k.indicePondere)}.`;
        const non = `Non. ${vrai}`;
        return [
          {
            texte: "Monter son prix à tort : elle se croirait moins chère que le marché",
            juste: k.erreur === "monter",
            retour:
              k.erreur === "monter"
                ? `Oui. ${vrai} Elle ne vend pas sous le marché : en montant son prix, elle passerait au-dessus de ce que paient les clients, et risquerait de perdre des ventes qu'elle croyait garder.`
                : non,
          },
          {
            texte: "Baisser son prix à tort : elle se croirait plus chère que le marché",
            juste: k.erreur === "baisser",
            retour:
              k.erreur === "baisser"
                ? `Oui. ${vrai} Elle n'est pas au-dessus du marché : en baissant son prix, elle perdrait de la marge sur chaque vente sans raison.`
                : non,
          },
          {
            texte: "Garder son prix à tort : elle se croirait au prix du marché",
            juste: k.erreur === "rester",
            retour:
              k.erreur === "rester"
                ? `Oui. ${vrai} Elle n'est pas au prix du marché : l'indicateur faux lui cacherait un écart qu'il faudrait corriger.`
                : non,
          },
          {
            texte: "La même chose : les deux indices la placent dans la même zone",
            juste: k.erreur === "aucune",
            retour:
              k.erreur === "aucune"
                ? `Oui. ${vrai} Ici, l'erreur ne change pas la décision : les deux indices tombent dans la même zone. Mais l'indicateur reste faux, et il tromperait le jour où les ventes se répartiraient autrement.`
                : non,
          },
        ];
      },
    },
    {
      id: "le-poids-des-ventes",
      objectifs: [2],
      type: "curseur",
      titre: "Le poids des ventes",
      notions: ["revenue", "demand_market_share"],
      question: (c) => {
        const k = indicateurDuPrix(c);
        const auris = k.enseignes.find((e) => e.code === "auris")!;
        return `La moyenne simple ne bouge pas quand les ventes changent : elle reste à ${eur(k.moyenneSimple)}. Le prix pondéré, lui, suit les ventes. Faites varier les ventes ${dE(auris.nom)}, l'enseigne la plus chère, les deux autres gardées : une droite donne le chiffre d'affaires du marché, l'autre ce qu'il vaudrait si chaque ${c.unite} était payée la moyenne simple. Placez le curseur sur les plus petites ventes ${dE(auris.nom)} pour lesquelles le prix pondéré rejoint la moyenne simple.`;
      },
      grandeur: () => ({ libelle: "Ventes d'Auris dans l'année", unite: "enceintes" }),
      cible: () => ({ attendu: ventesDAurisPourLaMoyenneSimple(FICHE_DU_MARCHE), min: 10_000, max: 40_000 }),
      zones: ["Le prix pondéré atteint la moyenne simple", "Le prix pondéré reste sous la moyenne simple"],
      rates: () => ({ dessous: "Avec ces ventes, le prix pondéré reste sous la moyenne simple : l'enseigne chère ne pèse pas encore assez.", dessus: "Le prix pondéré a rejoint la moyenne simple, mais moins de ventes suffisaient : cherchez le plus petit nombre." }),
      montrer: "Montrer les ventes",
      lecture: (_c, q) => {
        const k = indicateurDuPrix(undefined, undefined, q);
        return [
          { libelle: "Chiffre d'affaires du marché", montant: k.chiffreTotal },
          { libelle: "Ventes payées à la moyenne simple", montant: auCentime(k.ventesTotales * k.moyenneSimple) },
          { libelle: "Prix moyen pondéré", montant: k.prixPondere, fort: true },
          { libelle: "Moyenne simple des prix", montant: k.moyenneSimple },
        ];
      },
      droites: () => ({
        produit: (q) => indicateurDuPrix(undefined, undefined, q).chiffreTotal,
        cout: (q) => {
          const k = indicateurDuPrix(undefined, undefined, q);
          return k.ventesTotales * k.moyenneSimple;
        },
        libelles: ["Chiffre d'affaires du marché", "Ventes payées à la moyenne simple"],
      }),
      explication: (c) => {
        const q = ventesDAurisPourLaMoyenneSimple(FICHE_DU_MARCHE);
        const k = indicateurDuPrix(c);
        const auris = k.enseignes.find((e) => e.code === "auris")!;
        return [
          `Il faudrait qu'${auris.nom} vende ${qte(q)} ${c.unites}, au lieu de ${qte(auris.ventes)}, pour que le prix pondéré monte à la moyenne simple, ${eur(k.moyenneSimple)}.`,
          "La moyenne simple ne dit donc ce que paient les clients que dans un cas : quand chaque enseigne pèse dans les ventes ce qu'il faut pour cela. Le prix pondéré, lui, se calcule toujours de la même façon : un total divisé par un total.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-indice",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire de l'indice",
      notions: ["price_elasticity", "dashboard"],
      question: (c) =>
        `Et si ${c.entreprise} changeait son prix ? Les clients se partagent alors autrement entre les enseignes, et le prix pondéré du marché bouge avec eux. Faites varier le prix ${dE(c.entreprise)}, et regardez ses deux indices.`,
      leviers: () => [{ code: "prix", libelle: "Prix de NOVA, hors taxes", unite: "€", ...PRIX_ESSAYES, depart: FICHE_DU_MARCHE.enseignes[0]!.offre.prix }],
      lecture: (_c, p) => {
        const k = indicateurDuPrix(undefined, p.prix!);
        const d = indicateurDuPrix();
        return [
          { libelle: "Ventes de NOVA", montant: k.nova.ventes, unite: "enceintes", reference: d.nova.ventes },
          { libelle: "Prix moyen pondéré du marché", montant: k.prixPondere, reference: d.prixPondere },
          { libelle: "Indice avec la moyenne simple", montant: k.indiceSimple, unite: "points", reference: d.indiceSimple },
          { libelle: "Indice avec le prix pondéré", montant: k.indicePondere, unite: "points", reference: d.indicePondere, fort: true },
        ];
      },
      defi: () => {
        const juste = prixLePlusHautAligne(FICHE_DU_MARCHE);
        return {
          consigne: `Trouvez le prix le plus haut, à l'euro, où NOVA reste au prix du marché selon le prix pondéré (un indice d'au plus ${qte(100 + ECART_ALIGNE)}).`,
          atteint: (p) => p.prix === juste,
          indice: (p) => {
            const k = indicateurDuPrix(undefined, p.prix!);
            return k.positionPonderee === "aligne"
              ? `À ${eur(p.prix!)}, l'indice pondéré est de ${qte(k.indicePondere)} : NOVA est encore au prix du marché. Un prix plus haut l'y laisserait-il ?`
              : `À ${eur(p.prix!)}, l'indice pondéré est de ${qte(k.indicePondere)} : NOVA n'est plus au prix du marché.`;
          },
          solution: { prix: juste },
        };
      },
      explication: (c, p) => {
        const k = indicateurDuPrix(c, p.prix!);
        return [
          `Défi relevé : à ${eur(p.prix!)}, l'indice pondéré est de ${qte(k.indicePondere)}. Avec la moyenne simple, ${c.entreprise} se croirait à l'indice ${qte(k.indiceSimple)} : ${NOMS_DES_POSITIONS[k.positionSimple]}.`,
          "Les deux indices ne disent pas la même chose, et seul le pondéré mesure ce que paient les clients. Un indicateur juste se calcule toujours avec la même formule : sinon, il change de sens quand les ventes bougent.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const k = indicateurDuPrix(c);
        return [
          `Chez ${c.entreprise}, le prix moyen du marché vaut ${eur(k.prixPondere)} pondéré par les ventes, et ${eur(k.moyenneSimple)} en moyenne simple des prix. ${ceQueCroitLEntreprise(c)}`,
          "La moyenne de ratios n'est pas le ratio des sommes. Un prix moyen, un taux moyen, une part moyenne se calculent en divisant un total par un total : chaque élément pèse alors ce qu'il représente. La moyenne simple des ratios donne le même poids au petit et au gros, et ne répond qu'à une autre question.",
          "Le benchmark concurrentiel de l'arène affiche une « Moyenne du marché » : c'est la moyenne simple des prix moyens des entreprises, et son indice de compétitivité-prix se calcule sur elle. Elle dit le prix d'une enseigne typique, pas ce que paie un client moyen. Avant de lire un indicateur, on lit sa fiche.",
        ];
      },
      repere: () => "Prix moyen du marché = chiffre d'affaires total ÷ ventes totales. Une moyenne de ratios se pondère : on divise la somme des numérateurs par la somme des dénominateurs.",
    },
  ],
};
