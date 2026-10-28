import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ficheDe } from "../../chapitres/couts-ou-differenciation";
import { LIRE_LA_STRATEGIE_DES_CONCURRENTS, NOMS_DES_STRATEGIES_LUES, dE, strategiesDesConcurrents } from "../../chapitres/lire-la-strategie-des-concurrents";
import { allerDansLEspaceLibre, anneeAvec, gammeDe } from "../../monde/attractivite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LIRE LA STRATÉGIE DE SES CONCURRENTS » : ALLER DANS L'ESPACE LIBRE
 * (Stratégie et management, palier 2).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le marché à trois enseignes
 * (monde/marche-a-trois.ts) et son modèle (monde/attractivite.ts, `allerDansLEspaceLibre`), chez NOVA.
 *
 * Le chapitre se termine sur une question qu'il laisse ouverte : une place libre sur la carte, une
 * offre y paierait-elle ses coûts ? La directrice la pose. La place se lit sur les deux indices :
 * elle a un prix (69 €, le milieu de NOVA et d'Auris) et une qualité (1,17). L'élève compare deux
 * façons d'y aller, chacune tenue toute l'année : par le seul prix (la gamme et les budgets
 * d'aujourd'hui, l'ancienne lecture de la carte), ou en y amenant la qualité (la gamme la moins
 * chère qui l'atteint, la gamme soignée, aux budgets d'aujourd'hui). Il croise l'écart entre les deux
 * (le volume que la qualité retient, le coût de la gamme), retrouve au curseur les ventes qu'il faut
 * à la place pour égaler aujourd'hui, et répond. La bonne réponse n'est pas « y aller » ou « rester »
 * seulement : y aller en y amenant la qualité ; le distracteur chiffré est « y placer son prix ».
 */

/** Les bornes du curseur : les ventes de l'année à la place, avec la gamme soignée. */
export const VENTES_DU_CURSEUR_DE_LA_PLACE = { min: 12_000, max: 22_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number) => `${qte(Math.round(x * 10_000) / 100)} %`;
const dec = (x: number, n = 2) => x.toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const signe = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));

export type ReponseALaDirectrice = "avec-la-qualite" | "prix-seul" | "rester";

/** La place libre de la carte, et l'année jouée pour y aller, par le seul prix ou avec la qualité. */
export function espaceLibre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const k = strategiesDesConcurrents(c);
  const x = allerDansLEspaceLibre(f);
  const seul = x.prixSeul;
  const avec = x.avecLaQualite!;
  const gamme = gammeDe(f, x.gamme ?? "soignee");
  const tSeul = seul.trimestres[0]!;
  const tAvec = avec.trimestres[0]!;
  // Les attractivités des concurrents réunies : elles ne bougent pas avec NOVA.
  const desConcurrents = tSeul.attractivite / tSeul.part - tSeul.attractivite;
  // Le croisement : les ventes que la qualité retient, à la marge de la gamme soignée ; le coût de la
  // gamme, sur les ventes du prix seul ; et les budgets (les mêmes ici).
  const effetDuVolume = auCentime((avec.ventes - seul.ventes) * avec.margeUnitaire);
  const effetDeLaGamme = auCentime((avec.margeUnitaire - seul.margeUnitaire) * seul.ventes);
  const effetDesBudgets = auCentime(seul.charges - avec.charges);
  const ecartEntreLesDeux = auCentime(avec.resultat - seul.resultat);
  // Les ventes qu'il faut à la place, à la marge de la gamme soignée, pour égaler aujourd'hui ; et au prix seul.
  const ventesPourEgaler = Math.ceil((x.aujourdhui.resultat + avec.charges) / avec.margeUnitaire - 1e-9);
  const ventesPourEgalerAuPrixSeul = Math.ceil((x.aujourdhui.resultat + seul.charges) / seul.margeUnitaire - 1e-9);
  const ecartSeul = x.ecartPrixSeul;
  const ecartAvec = x.ecartAvecLaQualite ?? -Infinity;
  const reponse: ReponseALaDirectrice = ecartAvec > 0 && ecartAvec >= ecartSeul ? "avec-la-qualite" : ecartSeul > 0 ? "prix-seul" : "rester";
  return {
    f,
    k,
    x,
    place: x.place,
    aujourdhui: x.aujourdhui,
    seul,
    avec,
    gamme,
    attractiviteSeul: tSeul.attractivite,
    attractiviteAvec: tAvec.attractivite,
    attractivitesDesConcurrents: desConcurrents,
    partSeul: Math.round(tSeul.part * 10_000) / 100,
    partAvec: Math.round(tAvec.part * 10_000) / 100,
    variation: auDixieme(x.variationDuPrix * 100),
    indiceDeLaPlace: x.indiceDePrixDeLaPlace,
    lectureSeul: k.carteAuPrixSeul.nova,
    lectureAvec: k.carteALaPlace.nova,
    ecartSeul,
    ecartAvec: x.ecartAvecLaQualite!,
    effetDuVolume,
    effetDeLaGamme,
    effetDesBudgets,
    ecartEntreLesDeux,
    ventesPourEgaler,
    ventesPourEgalerAuPrixSeul,
    differenciationDuChapitre: anneeAvec(f, "differenciation").nova,
    reponse,
  };
}

export const ALLER_DANS_L_ESPACE_LIBRE: Situation = {
  code: "aller-dans-l-espace-libre",
  parcours: "strategie",
  palier: 2,
  blocs: [],
  reprend: [LIRE_LA_STRATEGIE_DES_CONCURRENTS.code],
  commanditaire: "La directrice",
  titre: "Aller dans l'espace libre",
  accroche:
    "La carte du marché montre une place que personne ne tient. La directrice veut savoir si l'entreprise gagnerait à y aller, et comment : en y plaçant son prix, ou en y amenant la qualité que la place demande.",
  objectifs: [
    "Repérer la place libre, son prix et sa qualité",
    "Refaire l'année de deux façons d'y aller : par le seul prix, ou avec la qualité",
    "Décomposer l'écart entre les deux en effet du volume et du coût de la gamme",
    "Répondre à la directrice, chiffre à l'appui",
  ],
  libre: false,
  entreprises: LIRE_LA_STRATEGIE_DES_CONCURRENTS.entreprises!,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice",
      tableau: (c) => {
        const k = espaceLibre(c).k;
        return {
          titre: "La carte du marché aujourd'hui, enseigne par enseigne",
          colonnes: k.enseignes.map((y) => y.nom),
          lignes: [
            { libelle: "Prix de vente", valeurs: k.enseignes.map((y) => eur(y.offre.prix)) },
            { libelle: "Qualité perçue", valeurs: k.enseignes.map((y) => dec(y.qualite)) },
            { libelle: "Indice de prix", valeurs: k.enseignes.map((y) => qte(y.indicePrix)) },
            { libelle: "Indice de qualité", valeurs: k.enseignes.map((y) => qte(y.indiceQualite)) },
            { libelle: "Part de marché", valeurs: k.enseignes.map((y) => pct(y.part)) },
            { libelle: "Résultat de l'année", valeurs: k.enseignes.map((y) => eur(y.resultat)) },
          ],
        };
      },
      texte: (c) => {
        const e = espaceLibre(c);
        const { f, k, place } = e;
        const g = f.gammes.map((x) => `${x.nom} (${eur(x.composants + x.autres)} par enceinte, ${dec(x.qualiteDeConception)} de qualité)`);
        return [
          `« Votre carte du marché montre un espace libre, entre ${place.entre.bas.nom} et ${place.entre.haut.nom}. Si ${f.entreprise} y était allée dès le premier trimestre, l'année aurait-elle été meilleure ? Je veux le savoir avant d'y engager quoi que ce soit, et savoir ce qu'il faudrait changer. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, dans la même simulation. Le marché reste de ${qte(f.marche.parTrimestre)} ${f.unites} par trimestre, partagé selon l'attractivité, (${qte(f.attractivite.prixDeReference)} ÷ prix) puissance ${f.attractivite.elasticiteAuPrix} × qualité perçue puissance ${f.attractivite.elasticiteALaQualite}. ${k.soundbox.nom} et ${k.auris.nom} ne changent rien : leurs attractivités réunies valent ${dec(e.attractivitesDesConcurrents, 4)} chaque trimestre. Le prix moyen du marché est de ${eur(k.carte.prixMoyen)}.`,
          `${f.entreprise} peut monter ${g.join(", ")}, au budget qualité d'aujourd'hui (${eur(e.aujourdhui.offre.budgetQualite)} par trimestre). Ses charges de l'année restent de ${eur(e.aujourdhui.charges)}.`,
        ];
      },
      repere: () =>
        "À rendre : le prix et la qualité de la place, ce que l'année y donne par le seul prix et avec la qualité, d'où vient l'écart entre les deux, et votre réponse.",
    },
    {
      id: "la-place",
      type: "montants",
      titre: "La place libre",
      notions: ["segmentation", "price_elasticity"],
      question: (c) => {
        const e = espaceLibre(c);
        return `Donnez le prix de la place (la moyenne des prix des deux voisines), ce qu'il change au prix ${dE(e.f.entreprise)}, en pourcentage au dixième, l'indice de prix qu'il donnerait au prix moyen d'aujourd'hui, et la qualité de la place (la moyenne de leurs qualités perçues).`;
      },
      champs: (c) => {
        const e = espaceLibre(c);
        const p = e.place;
        return [
          { libelle: "Prix de la place", attendu: p.prix, calcul: `(${eur(p.entre.bas.prix)} + ${eur(p.entre.haut.prix)}) ÷ 2 = ${eur(p.prix)}` },
          { libelle: "Variation du prix (%)", attendu: e.variation, calcul: `(${eur(p.prix)} ÷ ${eur(e.aujourdhui.offre.prix)} − 1) × 100 = ${qte(e.variation)} %`, tolerance: 0.1 },
          { libelle: "Indice de prix de la place", attendu: e.indiceDeLaPlace, calcul: `${eur(p.prix)} ÷ ${eur(e.k.carte.prixMoyen)} × 100 = ${qte(e.indiceDeLaPlace)}`, tolerance: 1 },
          { libelle: "Qualité de la place", attendu: p.qualite, calcul: `(${dec(p.entre.bas.qualite)} + ${dec(p.entre.haut.qualite)}) ÷ 2 = ${dec(p.qualite)}` },
        ];
      },
      explication: (c) => {
        const e = espaceLibre(c);
        return [
          `La place est à ${eur(e.place.prix)} et ${dec(e.place.qualite)} de qualité perçue. ${e.f.entreprise} peut y mettre son prix d'un trait de plume ; sa qualité, ${dec(e.aujourdhui.qualite)} aujourd'hui, demande une autre gamme : la moins chère qui y suffit est ${e.gamme.nom} (${dec(e.gamme.qualiteDeConception)}).`,
        ];
      },
    },
    {
      id: "par-le-seul-prix",
      type: "montants",
      titre: "Y aller par le seul prix",
      notions: ["demand_market_share", "price_elasticity", "income_statement"],
      question: (c) => {
        const e = espaceLibre(c);
        return `Première façon : ${e.f.entreprise} vend à ${eur(e.place.prix)} toute l'année, avec la gamme et les budgets d'aujourd'hui. Donnez sa part du marché de chaque trimestre (au centième de pour cent), ses ventes de l'année, son résultat, et son écart avec aujourd'hui (${eur(e.aujourdhui.resultat)}). Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const e = espaceLibre(c);
        const s = e.seul;
        const a = dec(e.attractiviteSeul, 4);
        return [
          {
            libelle: "Part de marché par le seul prix, chaque trimestre (%)",
            attendu: e.partSeul,
            calcul: `(${qte(e.f.attractivite.prixDeReference)} ÷ ${qte(e.place.prix)}) puissance ${e.f.attractivite.elasticiteAuPrix} × ${dec(s.qualite)} au carré = ${a} ; ${a} ÷ (${a} + ${dec(e.attractivitesDesConcurrents, 4)}) × 100 = ${qte(e.partSeul)} %`,
          },
          {
            libelle: "Ventes de l'année par le seul prix",
            attendu: s.ventes,
            calcul: `${qte(e.partSeul)} % × ${qte(e.f.marche.parTrimestre)} = ${qte(s.trimestres[0]!.ventes)} par trimestre, × ${e.f.marche.trimestres} = ${qte(s.ventes)}`,
            tolerance: 0,
          },
          { libelle: "Résultat par le seul prix", attendu: s.resultat, calcul: `${qte(s.ventes)} × (${eur(s.offre.prix)} − ${eur(s.coutVariable)}) − ${eur(s.charges)} = ${eur(s.resultat)}`, tolerance: 1 },
          { libelle: "Écart avec aujourd'hui, par le seul prix", attendu: e.ecartSeul, calcul: `${eur(s.resultat)} − ${entre(e.aujourdhui.resultat)} = ${eur(e.ecartSeul)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const e = espaceLibre(c);
        const l = e.lectureSeul;
        return [
          `Par le seul prix, ${e.f.entreprise} vend ${qte(e.seul.ventes)} ${e.f.unites}, contre ${qte(e.aujourdhui.ventes)} aujourd'hui : chaque enceinte laisse ${eur(e.seul.margeUnitaire)} au lieu de ${eur(e.aujourdhui.margeUnitaire)}, mais les clients partent. Sur la carte, elle serait à ${qte(l.indicePrix)} en prix et ${qte(l.indiceQualite)} en qualité, ${NOMS_DES_STRATEGIES_LUES[l.lecture]} : une enceinte chère, pas une enceinte différenciée.`,
        ];
      },
    },
    {
      id: "avec-la-qualite",
      type: "montants",
      titre: "Y aller avec la qualité",
      notions: ["demand_market_share", "full_unit_cost", "income_statement"],
      question: (c) => {
        const e = espaceLibre(c);
        return `Seconde façon : ${e.f.entreprise} vend à ${eur(e.place.prix)} toute l'année, avec la gamme la moins chère qui la porte à la qualité de la place, et les budgets d'aujourd'hui. Donnez sa part du marché de chaque trimestre (au centième de pour cent), ses ventes de l'année, son résultat, et son écart avec aujourd'hui. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const e = espaceLibre(c);
        const v = e.avec;
        const a = dec(e.attractiviteAvec, 4);
        return [
          {
            libelle: "Part de marché avec la qualité, chaque trimestre (%)",
            attendu: e.partAvec,
            calcul: `${e.gamme.nom.charAt(0).toUpperCase()}${e.gamme.nom.slice(1)} : (${qte(e.f.attractivite.prixDeReference)} ÷ ${qte(e.place.prix)}) puissance ${e.f.attractivite.elasticiteAuPrix} × ${dec(v.qualite)} au carré = ${a} ; ${a} ÷ (${a} + ${dec(e.attractivitesDesConcurrents, 4)}) × 100 = ${qte(e.partAvec)} %`,
          },
          {
            libelle: "Ventes de l'année avec la qualité",
            attendu: v.ventes,
            calcul: `${qte(e.partAvec)} % × ${qte(e.f.marche.parTrimestre)} = ${qte(v.trimestres[0]!.ventes)} par trimestre, × ${e.f.marche.trimestres} = ${qte(v.ventes)}`,
            tolerance: 0,
          },
          { libelle: "Résultat avec la qualité", attendu: v.resultat, calcul: `${qte(v.ventes)} × (${eur(v.offre.prix)} − ${eur(v.coutVariable)}) − ${eur(v.charges)} = ${eur(v.resultat)}`, tolerance: 1 },
          { libelle: "Écart avec aujourd'hui, avec la qualité", attendu: e.ecartAvec, calcul: `${eur(v.resultat)} − ${entre(e.aujourdhui.resultat)} = ${eur(e.ecartAvec)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const e = espaceLibre(c);
        const l = e.lectureAvec;
        return [
          `Avec ${e.gamme.nom}, ${e.f.entreprise} garde ${qte(e.avec.ventes)} ventes, ${pct(e.avec.part)} du marché, et chaque enceinte lui laisse ${eur(e.avec.margeUnitaire)} : ${eur(e.avec.resultat)} sur l'année, pour un coût complet de ${eur(e.avec.coutComplet)} l'enceinte. Sur la carte de cette année-là, elle est à ${qte(l.indicePrix)} et ${qte(l.indiceQualite)} : ${NOMS_DES_STRATEGIES_LUES[l.lecture]}.`,
        ];
      },
    },
    {
      id: "le-croisement",
      type: "montants",
      titre: "D'où vient l'écart entre les deux",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const e = espaceLibre(c);
        return `Au même prix, la gamme soignée fait ${eur(e.ecartEntreLesDeux)} de plus que le seul prix. Décomposez cet écart : les ventes que la qualité retient, valorisées à la marge de la gamme soignée ; puis le coût de la gamme, sur les ventes du seul prix. Vérifiez qu'ils refont l'écart entre les deux. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const e = espaceLibre(c);
        return [
          {
            libelle: "Effet des ventes retenues par la qualité",
            attendu: e.effetDuVolume,
            calcul: `(${qte(e.avec.ventes)} − ${qte(e.seul.ventes)}) × ${eur(e.avec.margeUnitaire)} = ${eur(e.effetDuVolume)}`,
            tolerance: 1,
          },
          {
            libelle: "Effet du coût de la gamme",
            attendu: e.effetDeLaGamme,
            calcul: `(${eur(e.avec.margeUnitaire)} − ${eur(e.seul.margeUnitaire)}) × ${qte(e.seul.ventes)} = ${eur(e.effetDeLaGamme)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart entre les deux façons d'y aller",
            attendu: e.ecartEntreLesDeux,
            calcul: `${eur(e.effetDuVolume)} + ${entre(e.effetDeLaGamme)}${e.effetDesBudgets !== 0 ? ` + ${entre(e.effetDesBudgets)}` : ""} = ${eur(e.ecartEntreLesDeux)}, soit ${eur(e.avec.resultat)} − ${entre(e.seul.resultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const e = espaceLibre(c);
        return [
          `La gamme soignée coûte ${eur(-e.effetDeLaGamme)} sur les ventes du seul prix, mais elle retient ${qte(e.avec.ventes - e.seul.ventes)} clients qui en rapportent ${eur(e.effetDuVolume)}. À ce prix, la qualité n'est pas une dépense : c'est ce qui fait acheter.`,
        ];
      },
    },
    {
      id: "les-ventes-au-curseur",
      type: "curseur",
      titre: "Ce que la place doit vendre",
      notions: ["breakeven", "contribution_margin"],
      question: (c) => {
        const e = espaceLibre(c);
        return `La directrice demande la marge de sécurité. Faites varier les ventes de l'année à la place, avec ${e.gamme.nom} (${eur(e.avec.margeUnitaire)} par enceinte, ${eur(e.avec.charges)} de charges). Placez le curseur sur le plus petit nombre de ventes où le résultat égale celui d'aujourd'hui (${eur(e.aujourdhui.resultat)}), puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Ventes de l'année à la place", unite: ficheDe(c).unites }),
      cible: (c) => {
        const e = espaceLibre(c);
        return { attendu: e.ventesPourEgaler, min: VENTES_DU_CURSEUR_DE_LA_PLACE.min, max: VENTES_DU_CURSEUR_DE_LA_PLACE.max };
      },
      zones: ["La place paie mieux qu'aujourd'hui", "La place paie moins qu'aujourd'hui"],
      rates: () => ({
        dessous: "À cette position, la place rapporte encore moins qu'aujourd'hui.",
        dessus: "Plus bas, la place rapporte encore autant qu'aujourd'hui : cherchez le plus petit nombre de ventes.",
      }),
      montrer: "Montrer le point d'égalité",
      lecture: (c, q) => {
        const e = espaceLibre(c);
        const r = auCentime(e.avec.margeUnitaire * q - e.avec.charges);
        return [
          { libelle: "Marge sur coût variable", montant: auCentime(e.avec.margeUnitaire * q) },
          { libelle: "Charges fixes et budgets de l'année", montant: e.avec.charges },
          { libelle: "Résultat à la place", montant: r },
          { libelle: "Écart avec aujourd'hui", montant: auCentime(r - e.aujourdhui.resultat), fort: true },
        ];
      },
      droites: (c) => {
        const e = espaceLibre(c);
        return { produit: (q) => e.avec.margeUnitaire * q - e.avec.charges, cout: () => e.aujourdhui.resultat, libelles: ["Résultat à la place", "Résultat d'aujourd'hui"] };
      },
      explication: (c) => {
        const e = espaceLibre(c);
        return [
          `Il faut ${qte(e.ventesPourEgaler)} ventes à la place pour égaler aujourd'hui ; la gamme soignée en fait ${qte(e.avec.ventes)}, soit ${qte(e.avec.ventes - e.ventesPourEgaler)} de marge. Par le seul prix, à ${eur(e.seul.margeUnitaire)} l'enceinte, il en faudrait ${qte(e.ventesPourEgalerAuPrixSeul)}, et il n'en vient que ${qte(e.seul.ventes)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      notions: ["segmentation"],
      question: () => "Quelle phrase envoyez-vous à la directrice ?",
      options: (c) => {
        const e = espaceLibre(c);
        const chiffres = `${eur(e.avec.resultat)} avec la qualité, ${eur(e.seul.resultat)} par le seul prix, ${eur(e.aujourdhui.resultat)} aujourd'hui`;
        const d = e.differenciationDuChapitre;
        return [
          {
            texte: "Y aller, en y amenant la qualité",
            juste: e.reponse === "avec-la-qualite",
            retour:
              e.reponse === "avec-la-qualite"
                ? [
                    `Oui : ${chiffres}, soit ${signe(e.ecartAvec)}. La place a un prix et une qualité : on ne l'atteint qu'avec les deux.`,
                    ...(d.resultat < e.avec.resultat ? [`Elle fait même mieux que la différenciation du chapitre « Domination par les coûts ou différenciation » (${eur(d.resultat)}), dont les budgets en plus ne se paient pas.`] : []),
                    "Reste à la tenir : la simulation fait jouer des concurrents qui ne réagissent pas, un vrai concurrent pourrait la viser aussi.",
                  ].join(" ")
                : `Non : ${chiffres}.`,
          },
          {
            texte: "Y placer son prix, sans rien changer d'autre",
            juste: e.reponse === "prix-seul",
            retour: e.reponse === "prix-seul" ? `Oui : ${chiffres}.` : `Non : ${chiffres}. Un prix plus haut que rien ne justifie fait partir les clients : ${signe(e.ecartSeul)} sur l'année.`,
          },
          {
            texte: "Rester où elle est : la place ne paie pas",
            juste: e.reponse === "rester",
            retour: e.reponse === "rester" ? `Oui : ${chiffres}.` : `Non : ${chiffres}. La place paie, mais pas par le seul prix : c'est la conclusion qu'on tire en ne lisant la carte que sur un axe.`,
          },
          {
            texte: "Impossible à dire sans y passer une année entière",
            juste: false,
            retour: `Non : la simulation du cours a joué les deux années, ${chiffres}. Une décision se prépare avec les chiffres qu'on peut avoir.`,
          },
        ];
      },
    },
  ],
};
