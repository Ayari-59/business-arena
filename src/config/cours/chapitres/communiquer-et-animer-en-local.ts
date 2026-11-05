import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  AUDIENCE_DES_POSTS,
  CONTACTS_PAR_EURO_DES_POSTS,
  MENTION_DE_L_INFLUENCE,
  SUPPORTS,
  actionDeCommunication,
  budgetDuMois,
  entreesQuiPaient,
  meilleurPlan,
  planDeCommunication,
  postsPour,
  rendementDesEntrees,
  supportsChiffres,
  type CodeDeSupport,
} from "../monde/communication-locale";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import { passantsDeJanvier } from "../monde/vente-et-caisse";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : COMMUNIQUER ET ANIMER EN LOCAL (BTS MCO, bloc 2, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le budget de publicité de la boutique MAILLE & CO
 * (1 500 € par mois, monde/maille-et-co.ts), ses passants de janvier (leur taux de transformation et
 * la marge d'une vente, monde/vente-et-caisse.ts) et cinq supports de communication locale
 * (monde/communication-locale.ts).
 *
 * L'objet : comparer des supports (tracts, SMS géolocalisé, publications sponsorisées, vitrine et
 * publicité sur le lieu de vente, soirée tricot) par leur coût par contact, puis par ce qu'ils font
 * entrer, vendre et laisser, et par leur retour sur investissement ; composer le plan qui laisse le
 * plus dans le budget ; appliquer le cadre légal (le consentement aux SMS, la publicité comparative,
 * la mention des collaborations commerciales). Le piège central : le plus petit coût par contact
 * n'est pas le meilleur support ; et un euro de plus en publications sponsorisées ne rapporte plus
 * rien quand toute l'audience de la zone est touchée.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, les-objectifs, le-cout-par-contact ;
 *   · l'expérience avant la formule : predire-les-tracts puis les-tracts-au-curseur (les entrées qui
 *     paient les tracts) avant le-tableau-des-supports ;
 *   · autonome : le-tableau-des-supports (un tableau à compléter), le-retour-sur-investissement ;
 *   · expert : le-plus-petit-cout, le-laboratoire-du-plan (la vitrine, un levier à choix, et le budget
 *     des publications ; ce qu'il laisse en courbe), la-soiree-tricot, le-sms, la-publicite-comparative,
 *     l-influenceuse, le-plan-retenu ; puis la synthèse.
 */

export const ENTREPRISES_DE_LA_COMMUNICATION: readonly string[] = ["boutique"];

export const POURQUOI_LA_BOUTIQUE =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît le budget de publicité et les passants : la communication locale se joue chez elle, quelle que soit votre entreprise.";

export const CODE_DE_LA_COMMUNICATION = "communiquer-et-animer-en-local";
export const TITRE_DE_LA_COMMUNICATION = "Communiquer et animer en local";

/** Le plan qui ajouterait le SMS : la vitrine, le SMS et 300 € de publications, 1 450 € en tout. */
export const POSTS_AVEC_LE_SMS = 300;

/** Le départ du laboratoire : sans la vitrine, 1 000 € de publications. */
export const DEPART_DU_LABORATOIRE: { vitrine: number; posts: number } = { vitrine: 0, posts: 1_000 };

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

/** Tout ce que le chapitre et son cas demandent. */
export function communicationDeLaBoutique(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const p = passantsDeJanvier(f);
  const supports = supportsChiffres(f);
  const de = (code: CodeDeSupport) => supports.find((s) => s.code === code)!;
  const budget = budgetDuMois(f);
  const meilleur = meilleurPlan(f);
  const tracts = de("tracts");
  return {
    f,
    p,
    supports,
    de,
    budget,
    meilleur,
    entreesQuiPaientLesTracts: entreesQuiPaient(f, tracts.cout),
    margeDUneVente: p.margeDUneVente,
  };
}

/** Le budget des publications qui touche toute l'audience. */
export const budgetQuiSature = () => AUDIENCE_DES_POSTS / CONTACTS_PAR_EURO_DES_POSTS;

/** Les cinq supports : ce qu'ils coûtent, qui ils touchent, combien entrent. */
export function tableauDesSupports(_c: Pick<Cas, "code">): TableauDeDonnees {
  return {
    titre: "Les cinq supports envisagés pour le mois",
    colonnes: ["Coût", "Contacts", "Taux de retour"],
    lignes: SUPPORTS.map((s) => ({ libelle: s.nom, valeurs: [eur(s.cout), qte(s.contacts), pct(s.tauxDeRetour * 100)] })),
  };
}

/** Les supports chiffrés, pour la synthèse. */
function tableauDuRetour(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = communicationDeLaBoutique(c);
  return {
    titre: "Ce que chaque support laisse, une fois payé",
    colonnes: ["Coût par contact", "Ventes", "Laisse", "Retour"],
    lignes: x.supports.map((s) => ({ libelle: s.nom, valeurs: [eur(auCentime(s.coutParContact)), qte(s.ventes), eur(s.laisse), pct(auDixieme(s.retourSurInvestissement * 100))] })),
  };
}

const OBJECTIFS_DE_COMMUNICATION = [
  { code: "cognitif", libelle: "Faire connaître" },
  { code: "affectif", libelle: "Faire aimer" },
  { code: "conatif", libelle: "Faire agir" },
] as const;

const POURQUOI_DE_L_OBJECTIF: Readonly<Record<CodeDeSupport, string>> = {
  tracts: "le tract annonce la boutique à des foyers qui ne la connaissent pas.",
  sms: "le message pousse à venir maintenant, avec une offre et une date.",
  posts: "la publication fait connaître la boutique à 5 km, à qui ne passe pas devant.",
  vitrine: "la vitrine et la signalétique décident le passant à entrer, sur le lieu même.",
  soiree: "la soirée crée un lien avec la boutique et sa communauté, sans rien vendre d'abord.",
};

export const COMMUNIQUER_ET_ANIMER_EN_LOCAL: Chapitre = {
  code: "communiquer-et-animer-en-local",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale"],
  titre: TITRE_DE_LA_COMMUNICATION,
  accroche:
    "Tracts, SMS, publications sponsorisées, vitrine ou soirée tricot : le support le moins cher par contact n'est pas celui qui rapporte le plus. Ce que chacun fait entrer, vendre et laisser, le plan qui tient dans 1 500 €, et ce que la loi permet.",
  objectifs: [
    "Relier chaque support de communication à son objectif et calculer son coût par contact",
    "Chiffrer les entrées, les ventes et la marge qu'une action fait gagner, et son retour sur investissement",
    "Composer le plan de communication qui laisse le plus dans un budget donné",
    "Appliquer la réglementation de la communication commerciale à un plan",
  ],
  libre: false,
  prerequis: ["indicateurs-du-point-de-vente", "promotion-qui-paie"],
  ensuite: ["reimplanter-avant-les-soldes"],
  entreprises: { codes: ENTREPRISES_DE_LA_COMMUNICATION, pourquoi: POURQUOI_LA_BOUTIQUE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Cinq façons de faire venir",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      tableau: tableauDesSupports,
      texte: (c) => {
        const x = communicationDeLaBoutique(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. Elle dépense ${eur(x.budget)} de publicité par mois, et la manager doit choisir où les mettre. Le tableau donne les cinq supports envisagés : ce qu'ils coûtent, combien de personnes ils touchent, et la part de ces contacts qui entre en boutique (le taux de retour).`,
          `Ce que la simulation suppose. Une personne qu'un support fait entrer achète comme un passant de janvier : ${pct(auDixieme(x.p.tauxDeTransformation * 100))} des passants passent en caisse, et une vente laisse ${eur(x.margeDUneVente)} de marge sur coût variable. Les ventes se comptent à l'unité la plus proche.`,
          "La communication se juge comme un achat : ce qu'elle coûte, face à ce qu'elle fait gagner.",
        ];
      },
      repere: () =>
        "Coût par contact = coût du support ÷ contacts touchés. Entrées = contacts × taux de retour. Ventes = entrées × taux de transformation. Ce que l'action laisse = ventes × marge d'une vente − coût.",
    },
    {
      id: "les-objectifs",
      objectifs: [0],
      type: "tri",
      titre: "Ce que chaque support doit obtenir",
      notions: ["customer_acquisition_cost"],
      question: () =>
        "Rangez chaque support selon son objectif principal : faire connaître (la notoriété), faire aimer (l'image, le lien), ou faire agir (venir, acheter maintenant).",
      categories: OBJECTIFS_DE_COMMUNICATION,
      elements: () => SUPPORTS.map((s) => ({ libelle: s.nom, montant: s.cout, categorie: s.objectif, pourquoi: `${OBJECTIFS_DE_COMMUNICATION.find((o) => o.code === s.objectif)!.libelle} : ${POURQUOI_DE_L_OBJECTIF[s.code]}` })),
      relance: "Demandez-vous ce que la personne touchée fait juste après : elle découvre la boutique, elle s'y attache, ou elle y entre.",
      explication: () => [
        "Un support ne se juge pas seulement aux ventes du mois : la soirée tricot travaille l'image et la fidélité, qui paieront plus tard. Mais c'est la seule chose qu'on ne chiffre pas ici : le reste se mesure.",
      ],
    },
    {
      id: "le-cout-par-contact",
      objectifs: [0],
      type: "montants",
      titre: "Le coût par contact",
      notions: ["customer_acquisition_cost"],
      tableau: tableauDesSupports,
      question: () => "Calculez le coût par contact des tracts, des publications sponsorisées et de la vitrine, au centime : le coût du support divisé par les contacts qu'il touche.",
      champs: (c) => {
        const x = communicationDeLaBoutique(c);
        return (["tracts", "posts", "vitrine"] as CodeDeSupport[]).map((code) => {
          const s = x.de(code);
          return { libelle: `Coût par contact · ${s.nom}`, attendu: auCentime(s.coutParContact), calcul: `${eur(s.cout)} ÷ ${qte(s.contacts)} contacts = ${eur(auCentime(s.coutParContact))}` };
        });
      },
      explication: (c) => {
        const x = communicationDeLaBoutique(c);
        return [
          `Les publications sponsorisées touchent une personne pour ${eur(auCentime(x.de("posts").coutParContact))}, ${qte(Math.round(x.de("tracts").coutParContact / x.de("posts").coutParContact))} fois moins cher que les tracts (${eur(auCentime(x.de("tracts").coutParContact))}). Mais un contact n'est pas une entrée : le coût par contact ne dit pas combien de personnes passent la porte.`,
        ];
      },
    },
    {
      id: "predire-les-tracts",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur les tracts",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => {
        const x = communicationDeLaBoutique(c);
        const t = x.de("tracts");
        return `Avant de calculer, pariez. ${qte(t.contacts)} tracts coûtent ${eur(t.cout)}. Une vente laisse ${eur(x.margeDUneVente)}. Pour que les tracts se paient, combien de personnes doivent entrer avec le tract à la main ?`;
      },
      options: (c) => {
        const x = communicationDeLaBoutique(c);
        const t = x.de("tracts");
        const e = x.entreesQuiPaientLesTracts;
        const voir = "Faites entrer les porteurs du tract à l'étape suivante : le curseur montre combien il en faut.";
        return [
          { texte: "Une petite centaine", juste: e >= 80 && e < 120, retour: `Bon pari. ${voir}` },
          { texte: `Une vingtaine : ${eur(t.cout)} ÷ ${eur(x.margeDUneVente)}`, juste: e < 30, retour: `Pari à vérifier. ${voir}` },
          { texte: `Toutes : ${qte(t.contacts)}`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-tracts-au-curseur",
      objectifs: [1],
      type: "curseur",
      titre: "Les entrées qui paient les tracts",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => {
        const x = communicationDeLaBoutique(c);
        return `Faites varier les entrées que les tracts font venir, de 0 à 300. Une droite donne la marge des ventes qu'elles font (à ${pct(auDixieme(x.p.tauxDeTransformation * 100))} de transformation et ${eur(x.margeDUneVente)} par vente), l'autre le coût des tracts (${eur(x.de("tracts").cout)}). Placez le curseur sur le plus petit nombre d'entrées où les tracts se paient, puis validez.`;
      },
      grandeur: () => ({ libelle: "Entrées dues aux tracts", unite: "entrées" }),
      cible: (c) => ({ attendu: communicationDeLaBoutique(c).entreesQuiPaientLesTracts, min: 0, max: 300 }),
      zones: ["Les tracts se paient", "Les tracts coûtent plus"],
      rates: () => ({
        dessous: "À ce nombre d'entrées, les ventes ne laissent pas encore de quoi payer les tracts.",
        dessus: "Les tracts se paient déjà avec moins d'entrées : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les entrées qui suffisent",
      lecture: (c, e) => {
        const x = communicationDeLaBoutique(c);
        const r = rendementDesEntrees(x.f, e);
        return [
          { libelle: "Ventes en plus", montant: r.ventes },
          { libelle: "Marge en plus", montant: r.marge },
          { libelle: "Coût des tracts", montant: x.de("tracts").cout },
          { libelle: "Ce que les tracts laissent", montant: auCentime(r.marge - x.de("tracts").cout), fort: true },
        ];
      },
      droites: (c) => {
        const x = communicationDeLaBoutique(c);
        return { produit: (e) => rendementDesEntrees(x.f, e).marge, cout: () => x.de("tracts").cout, libelles: ["Marge des ventes en plus", "Coût des tracts"] };
      },
      explication: (c) => {
        const x = communicationDeLaBoutique(c);
        const e = x.entreesQuiPaientLesTracts;
        const t = x.de("tracts");
        return [
          `Il faut ${qte(e)} entrées, soit un taux de retour de ${pct(auDixieme((e / t.contacts) * 1000) / 10, 2)} sur ${qte(t.contacts)} tracts. Une entrée n'est pas une vente : il faut ${qte(rendementDesEntrees(x.f, e).ventes)} ventes à ${eur(x.margeDUneVente)} pour payer ${eur(t.cout)}, et il faut ${qte(auDixieme(1 / x.p.tauxDeTransformation))} entrées pour une vente. Le taux annoncé, ${pct(t.tauxDeRetour * 100, 0)}, ne laisse presque rien.`,
        ];
      },
    },
    {
      id: "le-tableau-des-supports",
      objectifs: [1],
      type: "a-completer",
      titre: "Ce que chaque support fait gagner",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: () =>
        "Complétez le tableau pour les autres supports : les entrées (contacts × taux de retour), puis les ventes (entrées × taux de transformation, à l'unité la plus proche). Puis la marge en plus (ventes × marge d'une vente), et ce que l'action laisse une fois payée, négatif si elle coûte plus qu'elle ne rapporte. La ligne des tracts est donnée.",
      grille: (c) => tableauACompleterDesSupports(c),
      explication: (c) => {
        const x = communicationDeLaBoutique(c);
        const v = x.de("vitrine");
        const s = x.de("soiree");
        return [
          `La vitrine laisse le plus, ${eur(v.laisse)}, malgré le coût le plus élevé : ${qte(v.entrees)} entrées, parce qu'elle parle aux ${qte(v.contacts)} passants qui sont déjà devant la porte. La soirée tricot coûte ${eur(-s.laisse)} de plus qu'elle ne rapporte ce mois-ci.`,
        ];
      },
    },
    {
      id: "le-retour-sur-investissement",
      objectifs: [1],
      type: "montants",
      titre: "Le retour sur investissement",
      notions: ["customer_acquisition_cost"],
      question: () =>
        "Sans formule cette fois. Calculez le retour sur investissement de la vitrine, du SMS et des publications sponsorisées, en pourcentage au dixième : ce que l'action laisse une fois payée, rapporté à ce qu'elle coûte.",
      champs: (c) => {
        const x = communicationDeLaBoutique(c);
        return (["vitrine", "sms", "posts"] as CodeDeSupport[]).map((code) => {
          const s = x.de(code);
          const r = auDixieme(s.retourSurInvestissement * 100);
          return { libelle: `Retour sur investissement · ${s.nom} (%)`, attendu: r, tolerance: 0.1, calcul: `${eur(s.laisse)} ÷ ${eur(s.cout)} × 100 = ${pct(r)}` };
        });
      },
      explication: (c) => {
        const x = communicationDeLaBoutique(c);
        return [
          `Chaque euro mis dans la vitrine revient avec ${eur(auCentime(1 + x.de("vitrine").retourSurInvestissement))} ; dans le SMS, ${eur(auCentime(1 + x.de("sms").retourSurInvestissement))}. Le retour sur investissement compare des actions de tailles différentes ; ce que l'action laisse, en euros, dit ce qu'elle apporte au résultat. Les deux servent : l'un pour classer, l'autre pour décider.`,
        ];
      },
    },
    {
      id: "le-plus-petit-cout",
      objectifs: [0, 1],
      type: "choix",
      titre: "Le moins cher par contact",
      notions: ["customer_acquisition_cost"],
      tableau: tableauDuRetour,
      question: (c) => {
        const x = communicationDeLaBoutique(c);
        return `Un collègue veut mettre tout le budget, ${eur(x.budget)}, dans les publications sponsorisées : « c'est le moins cher par contact ». Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = communicationDeLaBoutique(c);
        const tout = postsPour(x.f, x.budget);
        const sature = budgetQuiSature();
        return [
          {
            texte: `Au-delà de ${eur(sature)}, le reste ne touche personne de nouveau`,
            juste: true,
            retour: `Oui. La régie touche ${qte(CONTACTS_PAR_EURO_DES_POSTS)} personnes par euro, jusqu'aux ${qte(AUDIENCE_DES_POSTS)} personnes de la zone ; au-delà, elle montre les mêmes publications aux mêmes personnes. À ${eur(x.budget)}, les publications laisseraient ${eur(tout.laisse)}, moins qu'à ${eur(sature)} (${eur(postsPour(x.f, sature).laisse)}).`,
          },
          {
            texte: "Il a raison : le coût par contact décide",
            juste: false,
            retour: "Non : un contact n'est ni une entrée ni une vente. Le coût par contact compare des supports qui touchent les mêmes gens ; il ne dit pas ce qu'ils rapportent.",
          },
          {
            texte: "Il a tort : les réseaux sociaux ne font pas venir en boutique",
            juste: false,
            retour: `Si : ${pct(x.de("posts").tauxDeRetour * 100)} des personnes touchées entrent, et à ${eur(x.de("posts").cout)}, les publications laissent ${eur(x.de("posts").laisse)}. Elles font venir, jusqu'à un certain budget.`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-du-plan",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire du plan",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => {
        const x = communicationDeLaBoutique(c);
        return `Composez le plan du mois : la vitrine (ou non), et le budget des publications sponsorisées, de 0 à 1 000 €. Le tableau suit ce que le plan coûte, ce qu'il fait entrer et ce qu'il laisse ; le graphique trace ce qu'il laisse selon le budget des publications. Puis relevez le défi, dans le budget de ${eur(x.budget)}.`;
      },
      leviers: () => [
        { code: "vitrine", libelle: "Vitrine et publicité sur le lieu de vente", unite: "", min: 0, max: 1, pas: 1, depart: DEPART_DU_LABORATOIRE.vitrine, choix: [{ valeur: 0, libelle: "Sans la vitrine" }, { valeur: 1, libelle: "Avec la vitrine" }] },
        { code: "posts", libelle: "Budget des publications sponsorisées", unite: "€", min: 0, max: 1_000, pas: 100, depart: DEPART_DU_LABORATOIRE.posts },
      ],
      lecture: (c, p) => {
        const x = communicationDeLaBoutique(c);
        const k = planDeCommunication(x.f, p.vitrine === 1, p.posts!);
        const d = planDeCommunication(x.f, DEPART_DU_LABORATOIRE.vitrine === 1, DEPART_DU_LABORATOIRE.posts);
        const entrees = (q: typeof k) => (q.avecLaVitrine ? q.vitrine.entrees : 0) + q.posts.entrees;
        return [
          { libelle: "Coût du plan", montant: k.cout, reference: d.cout },
          { libelle: "Contacts des publications", montant: k.posts.contacts, reference: d.posts.contacts, unite: "personnes" },
          { libelle: "Entrées en plus", montant: entrees(k), reference: entrees(d), unite: "entrées" },
          { libelle: "Reste du budget", montant: x.budget - k.cout, reference: x.budget - d.cout },
          { libelle: "Ce que le plan laisse", montant: k.laisse, reference: d.laisse, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = communicationDeLaBoutique(c);
        return { levier: "posts", courbes: [{ libelle: "Ce que le plan laisse", valeur: (p) => planDeCommunication(x.f, p.vitrine === 1, Math.round(p.posts! / 100) * 100).laisse }] };
      },
      defi: (c) => {
        const x = communicationDeLaBoutique(c);
        const m = x.meilleur;
        return {
          consigne: `Composez le plan qui laisse le plus, sans dépasser le budget de ${eur(x.budget)}.`,
          atteint: (p) => {
            const k = planDeCommunication(x.f, p.vitrine === 1, p.posts!);
            return k.dansLeBudget && k.laisse >= m.laisse - 1e-9 && k.avecLaVitrine === m.avecLaVitrine && k.budgetDesPosts === m.budgetDesPosts;
          },
          indice: (p) => {
            const k = planDeCommunication(x.f, p.vitrine === 1, p.posts!);
            if (!k.dansLeBudget) return `Ce plan coûte ${eur(k.cout)} : plus que le budget de ${eur(x.budget)}.`;
            if (!k.avecLaVitrine) return `Sans la vitrine, le plan laisse ${eur(k.laisse)} : la vitrine laisse à elle seule ${eur(k.vitrine.laisse)}.`;
            if (k.budgetDesPosts > budgetQuiSature()) return `Au-delà de ${eur(budgetQuiSature())}, les publications ne touchent plus personne de nouveau : chaque euro de plus est perdu.`;
            return `Le plan laisse ${eur(k.laisse)} ; il reste ${eur(x.budget - k.cout)} de budget : un peu plus de publications laisserait plus.`;
          },
          solution: { vitrine: m.avecLaVitrine ? 1 : 0, posts: m.budgetDesPosts },
        };
      },
      montrer: "Montrer le meilleur plan",
      explication: (c) => {
        const x = communicationDeLaBoutique(c);
        const m = x.meilleur;
        return [
          `Le meilleur plan : la vitrine et ${eur(m.budgetDesPosts)} de publications, pour ${eur(m.cout)}. Il laisse ${eur(m.laisse)} et garde ${eur(x.budget - m.cout)} du budget : dépenser ces ${eur(x.budget - m.cout)} en publications ne toucherait personne de plus.`,
          "Un budget ne se dépense pas forcément en entier : on finance d'abord le support qui rapporte le plus par euro, jusqu'à ce qu'il cesse de rapporter, puis le suivant.",
        ];
      },
    },
    {
      id: "la-soiree-tricot",
      objectifs: [1],
      type: "choix",
      titre: "Une animation qui ne se paie pas",
      notions: ["customer_acquisition_cost"],
      question: (c) => {
        const s = communicationDeLaBoutique(c).de("soiree");
        return `La soirée tricot coûte ${eur(s.cout)} et ne laisse que ${eur(s.marge)} de marge le soir même. Faut-il y renoncer ?`;
      },
      options: (c) => {
        const x = communicationDeLaBoutique(c);
        const s = x.de("soiree");
        return [
          {
            texte: "Pas forcément : elle vise la fidélité, à mesurer sur les achats suivants",
            juste: true,
            retour: `Oui. Une animation commerciale (atelier, démonstration, rencontre) crée une communauté autour de la boutique ; ce qu'elle rapporte se lit sur les visites suivantes des participantes, par la carte de fidélité. Il faut ${qte(Math.ceil((s.cout - s.marge) / x.margeDUneVente - 1e-9))} ventes de plus dans le mois suivant pour couvrir les ${eur(-s.laisse)} qui manquent : un objectif qu'on peut suivre.`,
          },
          {
            texte: "Oui : toute action qui coûte plus qu'elle ne rapporte le soir même est à proscrire",
            juste: false,
            retour: "Non : ce critère condamnerait toute action d'image ou de fidélisation. On fixe à l'animation un objectif mesurable, et on la juge sur cet objectif.",
          },
          {
            texte: "Non : les animations rapportent toujours plus qu'elles ne coûtent",
            juste: false,
            retour: `Rien ne le garantit : le soir même, la soirée coûte ${eur(-s.laisse)}. Il faut le mesurer, pas le supposer.`,
          },
        ];
      },
    },
    {
      id: "le-sms",
      objectifs: [3],
      type: "choix",
      titre: "Le SMS au fichier loué",
      notions: ["customer_acquisition_cost"],
      question: (c) => {
        const x = communicationDeLaBoutique(c);
        const s = x.de("sms");
        return `Le SMS géolocalisé laisse ${eur(s.laisse)} pour ${eur(s.cout)}, le meilleur retour après la vitrine. Mais les ${qte(s.contacts)} numéros viennent d'un fichier loué à une agence, dont les personnes n'ont jamais donné leur accord pour recevoir les offres de la boutique. Pouvez-vous l'envoyer ?`;
      },
      options: () => [
        {
          texte: "Non : il faut le consentement préalable de chacun",
          juste: true,
          retour:
            "Oui. La prospection par SMS ou par courriel auprès d'un particulier n'est permise qu'avec son accord donné avant, et chaque message doit offrir un moyen gratuit de refuser les suivants (« STOP SMS »). La boutique peut écrire aux clientes de sa carte de fidélité qui l'ont accepté, pas à un fichier sans consentement.",
        },
        {
          texte: "Oui : le fichier a été payé à l'agence",
          juste: false,
          retour: "Non : acheter ou louer un fichier ne transfère pas le consentement des personnes. Sans leur accord, l'envoi est interdit, quel que soit son prix.",
        },
        {
          texte: "Oui, à condition d'ajouter « STOP SMS » au message",
          juste: false,
          retour: "Non : la mention « STOP SMS » est obligatoire, mais elle ne remplace pas le consentement préalable : elle permet de le retirer.",
        },
      ],
    },
    {
      id: "la-publicite-comparative",
      objectifs: [3],
      type: "choix",
      titre: "Se comparer au concurrent",
      notions: ["customer_acquisition_cost"],
      question: (c) => {
        const x = communicationDeLaBoutique(c);
        return `Pour la vitrine, le vendeur propose une affiche : « Notre pull col rond 100 % laine à ${eur(x.f.gamme[0]!.prixTtc)}, quand ${x.f.concurrent.nom} vend le sien à ${eur(x.f.concurrent.prixTtc)} en acrylique. » Les deux faits sont exacts et vérifiables. Est-ce permis ?`;
      },
      options: () => [
        {
          texte: "Oui : objective, vérifiable, sur des biens comparables",
          juste: true,
          retour:
            "Oui. La publicité comparative est permise si elle n'est pas trompeuse, compare des biens qui répondent au même besoin, et porte sur des caractéristiques essentielles, pertinentes et vérifiables, comme le prix et la composition. Elle ne doit ni dénigrer le concurrent ni créer de confusion avec sa marque.",
        },
        {
          texte: "Non : citer un concurrent est toujours interdit",
          juste: false,
          retour: "Non : le code de la consommation autorise la publicité comparative, à ses conditions. Elle est même un argument utile quand on est plus cher.",
        },
        {
          texte: "Oui, et la boutique peut ajouter que le concurrent vend de la mauvaise qualité",
          juste: false,
          retour: "Non : « mauvaise qualité » est un jugement, pas un fait vérifiable ; c'est du dénigrement. On compare des faits : le prix, la composition.",
        },
      ],
    },
    {
      id: "l-influenceuse",
      objectifs: [3],
      type: "choix",
      titre: "Une créatrice de contenu invitée",
      notions: ["customer_acquisition_cost"],
      question: () =>
        "Une tricoteuse suivie sur les réseaux sociaux propose de filmer la soirée tricot, en échange d'un pull mérinos offert. Que doit montrer sa publication ?",
      options: () => [
        {
          texte: `La mention « ${MENTION_DE_L_INFLUENCE} » ou « Collaboration commerciale »`,
          juste: true,
          retour:
            "Oui. Depuis la loi de 2023 sur l'influence commerciale, une publication faite contre une rémunération ou un avantage en nature (le pull offert) doit le dire clairement. Sans la mention, c'est une pratique commerciale trompeuse, dont la boutique répond aussi.",
        },
        {
          texte: "Rien : un pull offert n'est pas une rémunération en argent",
          juste: false,
          retour: "Non : un avantage en nature compte comme une contrepartie. La mention est obligatoire.",
        },
        {
          texte: "Le prix du pull offert, pour que ses abonnés le sachent",
          juste: false,
          retour: "Non : la loi n'exige pas la valeur du cadeau, mais que le caractère commercial de la publication soit clair.",
        },
      ],
    },
    {
      id: "le-plan-retenu",
      objectifs: [2, 3],
      type: "choix",
      titre: "Quel plan pour le mois ?",
      notions: ["customer_acquisition_cost"],
      tableau: tableauDuRetour,
      question: (c) => `La manager arrête le plan de communication du mois, dans le budget de ${eur(communicationDeLaBoutique(c).budget)}. Lequel retenez-vous ?`,
      options: (c) => {
        const x = communicationDeLaBoutique(c);
        const m = x.meilleur;
        const tracts = x.de("tracts");
        const avecSms = planDeCommunication(x.f, true, POSTS_AVEC_LE_SMS);
        return [
          {
            texte: `La vitrine et ${eur(m.budgetDesPosts)} de publications : ${eur(m.laisse)}`,
            juste: true,
            retour: `Oui : le plan qui laisse le plus dans le budget, et dans la loi. Le SMS au fichier loué ferait mieux sur le papier (${eur(auCentime(avecSms.laisse + x.de("sms").laisse))} avec ${eur(POSTS_AVEC_LE_SMS)} de publications), mais il est interdit sans consentement. La soirée tricot peut s'y ajouter le mois suivant, avec un objectif de fidélité.`,
          },
          {
            texte: `Les tracts et la vitrine : tout le budget, ${eur(tracts.cout + x.de("vitrine").cout)}`,
            juste: false,
            retour: `Ce plan laisse ${eur(auCentime(tracts.laisse + x.de("vitrine").laisse))} : les tracts ne laissent que ${eur(tracts.laisse)}. Dépenser tout le budget n'est pas un objectif.`,
          },
          {
            texte: `La vitrine, le SMS et ${eur(POSTS_AVEC_LE_SMS)} de publications`,
            juste: false,
            retour: "Le meilleur calcul, mais un envoi interdit : les numéros du fichier loué n'ont pas consenti à recevoir les offres de la boutique.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      tableau: tableauDuRetour,
      texte: (c) => {
        const x = communicationDeLaBoutique(c);
        const m = x.meilleur;
        return [
          `Chaque support a un objectif (faire connaître, faire aimer, faire agir) et un coût par contact. Mais il se juge sur ce qu'il fait entrer, vendre et laisser : entrées = contacts × taux de retour, ventes = entrées × transformation, marge = ventes × ${eur(x.margeDUneVente)}. La vitrine, la plus chère, laisse le plus (${eur(x.de("vitrine").laisse)}) ; les tracts, ${eur(x.de("tracts").laisse)}.`,
          `Le plan se compose dans le budget, en finançant d'abord ce qui rapporte le plus par euro, jusqu'à ce qu'il cesse de rapporter : la vitrine et ${eur(m.budgetDesPosts)} de publications laissent ${eur(m.laisse)}. La loi borne le plan : consentement préalable aux SMS, publicité comparative objective et vérifiable, mention des collaborations commerciales.`,
          "Au niveau de l'examen, vous savez relier un support à son objectif, et calculer son coût par contact, ses entrées, ses ventes, sa marge et son retour sur investissement. Vous composez le meilleur plan dans un budget, et appliquez la réglementation de la communication.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût par contact = coût ÷ contacts. Ce que l'action laisse = contacts × taux de retour × transformation × marge d'une vente − coût. Retour sur investissement = ce qu'elle laisse ÷ son coût.",
    },
  ],
};

/** Le tableau à compléter des supports : la ligne des tracts donnée, les autres à saisir. */
export function tableauACompleterDesSupports(c: Pick<Cas, "code">): TableauACompleter {
  const x = communicationDeLaBoutique(c);
  return {
    titre: "Ce que chaque support fait entrer, vendre et laisser",
    colonnes: ["Entrées", "Ventes", "Marge en plus", "Laisse"],
    lignes: x.supports.map((s) => {
      const donnee = s.code === "tracts";
      return {
        libelle: s.nom,
        cellules: [
          { valeur: s.entrees, unite: "entrées", saisir: !donnee, tolerance: 0, calcul: `${qte(s.contacts)} × ${pct(s.tauxDeRetour * 100)} = ${qte(s.entrees)}`, indice: "les contacts × le taux de retour" },
          { valeur: s.ventes, unite: "ventes", saisir: !donnee, tolerance: 0, calcul: `${qte(s.entrees)} × ${pct(auDixieme(x.p.tauxDeTransformation * 100))} = ${qte(s.ventes)}, à l'unité la plus proche`, indice: "les entrées × le taux de transformation des passants, à l'unité la plus proche" },
          { valeur: s.marge, saisir: !donnee, calcul: `${qte(s.ventes)} × ${eur(x.margeDUneVente)} = ${eur(s.marge)}`, indice: "les ventes × la marge d'une vente" },
          { valeur: s.laisse, saisir: !donnee, calcul: `${eur(s.marge)} − ${eur(s.cout)} = ${eur(s.laisse)}`, indice: "la marge en plus moins le coût du support" },
        ],
      };
    }),
  };
}

/** Pour le cas : une action quelconque, chiffrée. */
export const actionChiffree = (c: Pick<Cas, "code">, s: Parameters<typeof actionDeCommunication>[1]) => actionDeCommunication(ficheDe(c), s);
