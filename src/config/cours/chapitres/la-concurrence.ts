import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  laConcurrence as concurrence,
  novaAuPrix,
  prixDeNova,
  meilleurPrixDeLAnnee,
  prixLePlusHautRentable,
  type PlaceDuPlusVendeur,
  type Vendeur,
} from "../monde/economie-et-marketing";
import { grille } from "../monde/economie-et-marketing";
import { POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_MARCHE } from "./l-offre-et-la-demande";

/**
 * CHAPITRE : LA CONCURRENCE, PLUSIEURS VENDEURS POUR LES MÊMES CLIENTS (Seconde, sciences
 * économiques et sociales, palier 1).
 *
 * Le regard de l'économiste de seconde sur un marché : plusieurs vendeurs offrent le même bien aux
 * mêmes clients, et chaque client compare leurs prix et leur qualité. Le chapitre lit les trois
 * enseignes du marché à trois (NOVA, SoundBox, Auris) sur l'année type : leurs ventes, leurs prix,
 * leur qualité et leurs parts du marché ; puis NOVA monte son prix de 10 %, et l'élève voit où partent
 * les clients, ce que chaque concurrent y gagne, et si la hausse a payé. Puis l'expérience : un
 * curseur (jusqu'où NOVA peut-elle monter son prix et couvrir ses charges ?) et un laboratoire (quel
 * prix, face aux concurrents, lui laisse le plus grand bénéfice ?).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : l'année type du marché à trois (monde/marche-a-trois.ts,
 * monde/attractivite.ts), 70 000 enceintes achetées dans l'année, que les trois enseignes se
 * partagent selon leur prix, leur qualité et leur image. Les concurrents ne réagissent pas aux
 * décisions de NOVA : leurs offres sont celles de la fiche. Seule hypothèse du chapitre : la hausse
 * de 10 % (l'écart de prix de la fiche).
 *
 * CE QUI A CHANGÉ. L'arène rejouait l'année du cours chez cinq entreprises ; le chapitre se joue chez
 * NOVA seule, sur le marché à trois : 23 608 enceintes vendues à 59 €, 17 872 à 64,90 €.
 */

/** La hausse du prix que le chapitre essaie : 10 %, une hausse que le client remarque. */
export const HAUSSE_DU_PRIX = 0.1;

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_LA_CONCURRENCE = ENTREPRISES_DU_MARCHE;

/** Les bornes du curseur et du laboratoire : le prix, à l'euro. */
const PRIX_DU_CURSEUR = { min: 59, max: 80 } as const;
const PRIX_DU_LABORATOIRE = { min: 50, max: 70, pas: 1 } as const;

/** Le départ du laboratoire : NOVA à 65 €, la hausse du chapitre arrondie à l'euro. */
const PRIX_DE_DEPART_DU_LABORATOIRE = 65;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const ecart = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const qualiteEcrite = (q: number) => q.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const ventesEcrites = (n: number) => (Math.abs(n) === 1 ? `${qte(n)} vente` : `${qte(n)} ventes`);

export type { PlaceDuPlusVendeur, Vendeur };

const f = (c: Cas) => mercatiqueDe(c);

/** L'année type, puis NOVA à son prix monté : ce que le chapitre lit et calcule. */
export const laConcurrence = (c: Cas, hausse = HAUSSE_DU_PRIX) => concurrence(f(c), hausse);

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const k = laConcurrence(c);
  return {
    titre: "L'année type du marché, vendeur par vendeur",
    colonnes: k.avant.map((v) => v.nom),
    lignes: [
      { libelle: `Ventes de l'année (${c.unites})`, valeurs: k.avant.map((v) => qte(v.ventes)) },
      { libelle: "Chiffre d'affaires de l'année", valeurs: k.avant.map((v) => eur(v.chiffreDAffaires)) },
      { libelle: "Prix", valeurs: k.avant.map((v) => eur(v.prix)) },
      { libelle: "Qualité perçue", valeurs: k.avant.map((v) => qualiteEcrite(v.qualite)) },
    ],
  };
}

function tableauDeLaHausse(c: Cas): TableauDeDonnees {
  const k = laConcurrence(c);
  const [a, b] = k.concurrents;
  const [e2, a2, b2] = k.apres as [Vendeur, Vendeur, Vendeur];
  return {
    titre: `L'année type, ${c.entreprise} ${pct(k.hausse * 100)} plus cher`,
    colonnes: ["Prix d'aujourd'hui", `Prix monté de ${pct(k.hausse * 100)}`],
    lignes: [
      { libelle: `Prix ${dE(c.entreprise)}`, valeurs: [eur(k.prix.avant), eur(k.prix.apres)] },
      { libelle: `Ventes ${dE(c.entreprise)}`, valeurs: [qte(k.entreprise.ventes), qte(e2.ventes)] },
      { libelle: `Ventes ${dE(a.nom)}`, valeurs: [qte(a.ventes), qte(a2.ventes)] },
      { libelle: `Ventes ${dE(b.nom)}`, valeurs: [qte(b.ventes), qte(b2.ventes)] },
    ],
  };
}

function tableauDuBenefice(c: Cas): TableauDeDonnees {
  const k = laConcurrence(c);
  const e2 = k.apres[0]!;
  return {
    titre: `L'année ${dE(c.entreprise)}, à chaque prix`,
    colonnes: ["Prix d'aujourd'hui", `Prix monté de ${pct(k.hausse * 100)}`],
    lignes: [
      { libelle: "Prix", valeurs: [eur(k.prix.avant), eur(k.prix.apres)] },
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.entreprise.ventes), qte(e2.ventes)] },
      { libelle: "Chiffre d'affaires", valeurs: [eur(k.entreprise.chiffreDAffaires), eur(e2.chiffreDAffaires)] },
      { libelle: "Bénéfice de l'année", valeurs: [eur(k.entreprise.benefice), eur(e2.benefice)] },
    ],
  };
}

export const LA_CONCURRENCE: Chapitre = {
  code: "la-concurrence",
  parcours: "seconde-ses",
  palier: 1,
  blocs: ["2de SES · Comment se forment les prix sur un marché ?"],
  titre: "La concurrence : plusieurs vendeurs pour les mêmes clients",
  accroche:
    "Trois entreprises vendent le même bien aux mêmes clients. Qui vend le plus, à quel prix ? Et si l'une monte son prix, où partent ses clients ?",
  objectifs: [
    "Calculer la part de marché de chaque vendeur",
    "Relier le prix, la qualité et les ventes de chaque vendeur",
    "Dire où partent les clients quand un vendeur monte son prix",
    "Expliquer pourquoi la concurrence tire les prix vers le bas",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_CONCURRENCE, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois vendeurs, un même marché",
      notions: ["demand_market_share"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const k = laConcurrence(c);
        const [a, b] = k.concurrents;
        return [
          `Sur le marché des enceintes de milieu de gamme, trois vendeurs offrent le même bien aux mêmes clients : ${c.entreprise}, ${a.nom} et ${b.nom}. C'est un marché concurrentiel : chaque client peut acheter chez l'un ou chez l'autre.`,
          `Dans une année type, les clients de ce marché achètent ${qte(k.marche)} ${c.unites} aux trois vendeurs. Pour choisir son vendeur, chaque client compare deux choses surtout : le prix, et la qualité qu'il reconnaît à l'enceinte (1 pour la NOVA One d'aujourd'hui).`,
        ];
      },
      repere: () => "Part de marché d'un vendeur = ses ventes ÷ les ventes de tous les vendeurs du marché × 100.",
    },
    {
      id: "parts",
      type: "montants",
      titre: "La part de marché de chacun",
      notions: ["demand_market_share"],
      question: () => "Calculez les ventes du marché (les ventes des trois vendeurs réunies), puis la part de marché de chaque vendeur, en pourcentage au dixième.",
      champs: (c) => {
        const k = laConcurrence(c);
        const somme = k.avant.map((v) => qte(v.ventes)).join(" + ");
        return [
          { libelle: "Ventes du marché", attendu: k.ventesDuMarche, calcul: `${somme} = ${qte(k.ventesDuMarche)}` },
          ...k.avant.map((v, i) => ({
            libelle: `Part de marché ${dE(v.nom)} (%)`,
            attendu: k.parts[i]!,
            calcul: `${qte(v.ventes)} ÷ ${qte(k.ventesDuMarche)} × 100 = ${pct(k.parts[i]!)}`,
            tolerance: 0.1,
          })),
        ];
      },
      explication: (c) => {
        const k = laConcurrence(c);
        return [
          `${k.plusVendeur.nom} prend la plus grande part du marché, ${pct(k.parts[k.avant.indexOf(k.plusVendeur)]!)}. ${k.plusVendeur.code === "nova" ? `C'est ${c.entreprise} : elle vend plus que chacun de ses concurrents.` : `${c.entreprise} en prend ${pct(k.parts[0]!)}.`}`,
          "Les trois parts font 100 % : ce qu'un vendeur prend, les autres ne l'ont pas. C'est cela, la concurrence : les vendeurs se disputent les mêmes clients.",
        ];
      },
    },
    {
      id: "prix-et-ventes",
      type: "choix",
      titre: "Le prix, la qualité et les ventes",
      notions: ["demand_market_share", "price_elasticity"],
      tableau: tableauDeLAnnee,
      question: () => "Rangez les trois vendeurs du moins cher au plus cher. Lequel vend le plus ?",
      options: (c) => {
        const k = laConcurrence(c);
        const [bas, milieu, haut] = k.parPrix as [Vendeur, Vendeur, Vendeur];
        const meilleur = k.avant.reduce((g, x) => (x.qualite > g.qualite ? x : g));
        const qualite =
          meilleur === haut
            ? `${haut.nom}, le plus cher, est aussi celui que les clients jugent le meilleur (${qualiteEcrite(haut.qualite)}) : il garde des clients malgré son prix.`
            : `${meilleur.nom} est celui que les clients jugent le meilleur (${qualiteEcrite(meilleur.qualite)}).`;
        const fait = `${bas.nom} vend à ${eur(bas.prix)}, ${milieu.nom} à ${eur(milieu.prix)}, ${haut.nom} à ${eur(haut.prix)} ; ${k.plusVendeur.nom} vend le plus, ${qte(k.plusVendeur.ventes)} ${c.unites}.`;
        const options: { place: PlaceDuPlusVendeur; texte: string; oui: string }[] = [
          { place: "moins-cher", texte: "Le moins cher des trois", oui: `Oui : ${fait} Le client va d'abord au prix le plus bas, même pour une qualité un peu moindre. ${qualite}` },
          { place: "milieu", texte: "Celui dont le prix est entre les deux autres", oui: `Oui : ${fait} Le prix ne fait pas tout : la qualité compte aussi. ${qualite}` },
          { place: "plus-cher", texte: "Le plus cher des trois", oui: `Oui : ${fait} Ses clients paient sa qualité. ${qualite}` },
        ];
        return options.map((o) => ({ texte: o.texte, juste: o.place === k.place, retour: o.place === k.place ? o.oui : `Non : ${fait}` }));
      },
    },
    {
      id: "hausse",
      type: "montants",
      titre: "Si l'entreprise monte son prix",
      notions: ["price_elasticity", "demand_market_share"],
      tableau: tableauDeLaHausse,
      question: (c) => {
        const k = laConcurrence(c);
        return `${c.entreprise} affiche ${eur(k.prix.apres)} au lieu de ${eur(k.prix.avant)}, toute l'année. Ses concurrents ne changent rien. D'après le tableau, calculez les ventes perdues par ${c.entreprise}, celles que gagne chacun de ses concurrents, puis la nouvelle part de marché ${dE(c.entreprise)}, en pourcentage au dixième.`;
      },
      champs: (c) => {
        const k = laConcurrence(c);
        const [a, b] = k.concurrents;
        const [e2, a2, b2] = k.apres as [Vendeur, Vendeur, Vendeur];
        return [
          { libelle: `Ventes perdues par ${c.entreprise}`, attendu: k.perdues, calcul: `${qte(k.entreprise.ventes)} − ${qte(e2.ventes)} = ${qte(k.perdues)}` },
          { libelle: `Ventes gagnées par ${a.nom}`, attendu: k.gagneesA, calcul: `${qte(a2.ventes)} − ${qte(a.ventes)} = ${qte(k.gagneesA)}` },
          { libelle: `Ventes gagnées par ${b.nom}`, attendu: k.gagneesB, calcul: `${qte(b2.ventes)} − ${qte(b.ventes)} = ${qte(k.gagneesB)}` },
          {
            libelle: `Nouvelle part de marché ${dE(c.entreprise)} (%)`,
            attendu: k.partsApres[0]!,
            calcul: `${qte(e2.ventes)} ÷ (${k.apres.map((v) => qte(v.ventes)).join(" + ")}) × 100 = ${pct(k.partsApres[0]!)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = laConcurrence(c);
        return [`${c.entreprise} perd ${ventesEcrites(k.perdues)}, et sa part de marché passe de ${pct(k.parts[0]!)} à ${pct(k.partsApres[0]!)}. Quand un vendeur monte son prix, des clients vont voir ailleurs.`];
      },
    },
    {
      id: "ou-vont-les-clients",
      type: "choix",
      titre: "Où partent les clients",
      notions: ["demand_market_share", "capacity"],
      tableau: tableauDeLaHausse,
      question: (c) => `Au prix monté, ${c.entreprise} fait ${ventesEcrites(laConcurrence(c).perdues)} de moins. Où ces clients sont-ils surtout partis ?`,
      options: (c) => {
        const k = laConcurrence(c);
        const [a, b] = k.concurrents;
        const faits = `${a.nom} gagne ${ventesEcrites(k.gagneesA)}, ${b.nom} ${ventesEcrites(k.gagneesB)}.`;
        return [
          { texte: `Chez ${a.nom}`, juste: k.ouVontLesClients === "premier", retour: k.ouVontLesClients === "premier" ? `Oui : ${faits} Les clients qui regardent le prix vont au moins cher.` : `Non : ${faits}` },
          { texte: `Chez ${b.nom}`, juste: k.ouVontLesClients === "second", retour: k.ouVontLesClients === "second" ? `Oui : ${faits}` : `Non : ${faits}` },
          {
            texte: "Nulle part : ils n'achètent chez personne",
            juste: k.ouVontLesClients === "personne",
            retour: k.ouVontLesClients === "personne" ? `Oui : ${faits} Un concurrent ne gagne que les clients qu'il peut servir.` : `Non : ${faits} Les concurrents avaient de quoi les servir : les clients ont changé de vendeur.`,
          },
        ];
      },
    },
    {
      id: "benefice",
      type: "choix",
      titre: "La hausse a-t-elle payé ?",
      notions: ["income_statement", "price_elasticity"],
      tableau: tableauDuBenefice,
      question: (c) => `Avec son prix monté, ${c.entreprise} vend moins, mais plus cher. Qu'en dit son bénéfice de l'année ?`,
      options: (c) => {
        const k = laConcurrence(c);
        const e2 = k.apres[0]!;
        const faits = `le bénéfice passe de ${eur(k.entreprise.benefice)} à ${eur(e2.benefice)} (${ecart(k.ecartDeBenefice)}), avec ${ventesEcrites(k.perdues)} de moins.`;
        return [
          {
            texte: "Il augmente : chaque vente rapporte plus, et cela compense les clients perdus",
            juste: k.verdict === "gagne-plus",
            retour: k.verdict === "gagne-plus" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
          {
            texte: "Il baisse : les clients perdus coûtent plus que la hausse ne rapporte",
            juste: k.verdict === "gagne-moins",
            retour: k.verdict === "gagne-moins" ? `Oui : ${faits} Face à des concurrents, un prix plus haut fait fuir trop de clients pour être rentable.` : `Non : ${faits}`,
          },
        ];
      },
    },
    {
      id: "la-concurrence-tire-les-prix",
      type: "choix",
      titre: "Ce que la concurrence fait au prix",
      notions: ["price_elasticity", "demand_market_share"],
      question: (c) => `Sur ce marché, qu'est-ce qui empêche ${c.entreprise} de monter son prix autant qu'elle le voudrait ?`,
      options: (c) => {
        const k = laConcurrence(c);
        const [a, b] = k.concurrents;
        return [
          {
            texte: "Ses clients peuvent acheter chez un concurrent",
            juste: true,
            retour: `Oui : à ${pct(k.hausse * 100)} de plus, ${c.entreprise} perd ${ventesEcrites(k.perdues)} et ${qte(Math.abs(k.points))} points de part de marché : ses clients se tournent vers ${a.nom} et ${b.nom}. C'est la concurrence qui retient son prix.`,
          },
          {
            texte: "La loi fixe le prix de chaque produit",
            juste: false,
            retour: `Non : sur ce marché, chaque vendeur fixe librement son prix ; les trois vendeurs n'ont d'ailleurs pas le même. Ce qui le retient, ce sont les clients qui peuvent partir chez ${a.nom} ou ${b.nom}.`,
          },
          {
            texte: "Ses clients achètent toujours autant, quel que soit le prix",
            juste: false,
            retour: `Non : au prix monté, ${c.entreprise} fait ${ventesEcrites(k.perdues)} de moins. Si les clients achetaient toujours autant, rien ne l'empêcherait de monter son prix.`,
          },
        ];
      },
    },
    {
      id: "jusqu-ou-monter",
      type: "curseur",
      titre: "Jusqu'où monter le prix",
      notions: ["price_elasticity", "fixed_costs"],
      question: (c) => {
        const n = novaAuPrix(f(c), prixDeNova(f(c)));
        return `Faites varier le prix ${dE(c.entreprise)}, à l'euro, ses concurrents gardant le leur. Une droite donne la marge de ses ventes de l'année (le prix moins le coût variable, fois les ventes), l'autre ses charges, ${eur(n.charges)}. Placez le curseur sur le prix le plus haut auquel la marge couvre encore les charges, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix de l'enceinte", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: prixLePlusHautRentable(f(c)), ...PRIX_DU_CURSEUR }),
      zones: ["La marge couvre les charges", "La marge ne couvre plus les charges"],
      rates: () => ({
        dessous: "À ce prix, la marge couvre les charges, mais un prix plus haut le ferait encore : cherchez le plus haut.",
        dessus: "À ce prix, les clients partis chez les concurrents sont trop nombreux : la marge ne couvre plus les charges.",
      }),
      montrer: "Montrer le prix",
      lecture: (c, q) => {
        const n = novaAuPrix(f(c), q);
        return [
          { libelle: "Ventes de l'année", montant: n.ventes },
          { libelle: "Marge des ventes", montant: n.marge },
          { libelle: "Charges de l'année", montant: n.charges },
          { libelle: "Bénéfice", montant: n.benefice, fort: true },
        ];
      },
      droites: (c) => ({ produit: (q) => novaAuPrix(f(c), q).marge, cout: (q) => novaAuPrix(f(c), q).charges, libelles: ["Marge des ventes", "Charges de l'année"] }),
      explication: (c) => {
        const p = prixLePlusHautRentable(f(c));
        const a = novaAuPrix(f(c), p);
        const b = novaAuPrix(f(c), p + 1);
        return [
          `À ${eur(p)}, ${c.entreprise} ne vend plus que ${qte(a.ventes)} ${c.unites}, et son bénéfice tombe à ${eur(a.benefice)}. À ${eur(p + 1)}, elle n'en vend que ${qte(b.ventes)} : ${eur(b.benefice)}.`,
          "Seule sur son marché, une entreprise pourrait monter son prix bien plus haut : ses clients n'auraient pas où aller. Face à des concurrents, chaque euro de plus lui fait perdre des clients.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-prix",
      type: "simulation",
      titre: "Le laboratoire du prix face aux concurrents",
      notions: ["demand_market_share", "price_elasticity"],
      question: (c) =>
        `${c.entreprise} se demande quel prix lui rapporte le plus, face à SoundBox et Auris qui gardent le leur. Faites varier son prix, à l'euro, en partant de ${eur(PRIX_DE_DEPART_DU_LABORATOIRE)} : les ventes des trois vendeurs répondent, et sa ligne ne monte pas plus de ${qte(f(c).marche.enseignes[0]!.capacite * 4)} ${c.unites} dans l'année. Relevez le défi.`,
      leviers: () => [{ code: "prix", libelle: "Prix de l'enceinte", unite: "€", ...PRIX_DU_LABORATOIRE, depart: PRIX_DE_DEPART_DU_LABORATOIRE }],
      lecture: (c, p) => {
        const n = novaAuPrix(f(c), p.prix!);
        const d = novaAuPrix(f(c), PRIX_DE_DEPART_DU_LABORATOIRE);
        return [
          { libelle: `Ventes ${dE(c.entreprise)}`, montant: n.ventes, unite: c.unites, reference: d.ventes },
          { libelle: "Ventes de SoundBox", montant: n.soundbox, unite: c.unites, reference: d.soundbox },
          { libelle: "Ventes d'Auris", montant: n.auris, unite: c.unites, reference: d.auris },
          { libelle: `Bénéfice ${dE(c.entreprise)}`, montant: n.benefice, reference: d.benefice, fort: true },
        ];
      },
      graphique: (c) => ({ levier: "prix", courbes: [{ libelle: `Bénéfice ${dE(c.entreprise)}`, valeur: (p) => novaAuPrix(f(c), p.prix!).benefice }] }),
      defi: (c) => {
        const juste = meilleurPrixDeLAnnee(f(c), grille(PRIX_DU_LABORATOIRE.min, PRIX_DU_LABORATOIRE.max, PRIX_DU_LABORATOIRE.pas)).prix;
        return {
          consigne: `Trouvez le prix, à l'euro, qui donne à ${c.entreprise} le plus grand bénéfice de l'année.`,
          atteint: (p) => p.prix === juste,
          indice: (p) => {
            const n = novaAuPrix(f(c), p.prix!);
            return novaAuPrix(f(c), p.prix! - 1).benefice > n.benefice
              ? `À ${eur(p.prix!)}, le bénéfice est de ${eur(n.benefice)} : un euro de moins en laisserait davantage, les clients revenant des concurrents.`
              : `À ${eur(p.prix!)}, le bénéfice est de ${eur(n.benefice)} : un euro de plus en laisserait-il davantage ?`;
          },
          solution: { prix: juste },
        };
      },
      explication: (c, p) => {
        const n = novaAuPrix(f(c), p.prix!);
        const d = novaAuPrix(f(c), PRIX_DE_DEPART_DU_LABORATOIRE);
        return [
          `Défi relevé : à ${eur(p.prix!)}, ${c.entreprise} vend ${qte(n.ventes)} ${c.unites} et gagne ${eur(n.benefice)}, contre ${eur(d.benefice)} à ${eur(PRIX_DE_DEPART_DU_LABORATOIRE)}. Plus cher, ses clients partent chez SoundBox et Auris ; moins cher, chaque enceinte rapporte trop peu.`,
          "La concurrence tire les prix vers le bas : le meilleur prix d'un vendeur dépend de celui des autres.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "price_elasticity"],
      texte: (c) => {
        const k = laConcurrence(c);
        return [
          `Sur ce marché, trois vendeurs se partagent les mêmes clients : ${k.avant.map((v, i) => `${v.nom} ${pct(k.parts[i]!)}`).join(", ")} des ventes de l'année. ${k.plusVendeur.nom} vend le plus ; chaque client compare les prix et la qualité.`,
          `Quand ${c.entreprise} monte son prix de ${pct(k.hausse * 100)}, elle perd ${ventesEcrites(k.perdues)}, et son bénéfice ${k.verdict === "gagne-plus" ? "monte" : "baisse"} de ${eur(Math.abs(k.ecartDeBenefice))}. Ses concurrents prennent les clients qu'elle laisse.`,
          "Sur un marché concurrentiel, aucun vendeur ne fixe seul le prix : s'il est plus cher que les autres sans être meilleur, ses clients s'en vont. C'est pourquoi la concurrence tire les prix vers le bas, au profit des acheteurs. Dans l'arène, le benchmark du marché du tour donne la part de chaque entreprise.",
        ];
      },
      repere: () => "Part de marché = ventes du vendeur ÷ ventes du marché × 100. Plus il y a de vendeurs capables de servir les clients, moins chacun peut monter son prix.",
    },
  ],
};
