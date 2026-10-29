import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { clienteleDuSeuil, coutVariable, grille, prixPsychologique as lirePrix, prixRemise, remiseLaPlusForte } from "../monde/economie-et-marketing";
import { POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import type { Chapitre } from "../types";
import { SEGMENTATIONS } from "./segmenter-et-cibler";

/**
 * CHAPITRE : LE PRIX PSYCHOLOGIQUE (Bac STMG, mercatique, palier 1).
 *
 * Le client ne juge pas un prix en euros, mais par rapport à ce qu'il trouve normal, à ce qui lui
 * paraît trop bon marché pour être sérieux, et à des seuils ronds qu'il ne veut pas franchir. Le
 * chapitre lit ces repères pour chaque clientèle de NOVA, situe son prix, puis mesure ce que coûtent
 * 20 centimes de part et d'autre d'un seuil psychologique. Puis l'expérience : un curseur (la
 * promotion la plus forte que la clientèle croit encore) et un laboratoire (le prix, au dixième
 * d'euro, qui laisse le plus de marge sur la clientèle du seuil).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/mercatique-de-nova.ts) : les repères de prix de
 * l'enquête (méfiance, prix jugé normal, seuil rond), les droites des trois clientèles, le prix de
 * 59 € et le coût variable de 38 €. HYPOTHÈSE DU CHAPITRE : passé 60 €, les familles demandent 15 %
 * de moins que leur droite ne le dit (SAUT_AU_SEUIL).
 *
 * CE QUI A CHANGÉ. Le chapitre lisait les repères du moteur de l'arène chez cinq entreprises ; il se
 * joue chez NOVA seule, sur les repères de la fiche.
 */

/** Les bornes du curseur (la remise, en %) et du laboratoire (le prix, au dixième d'euro). */
const REMISE_DU_CURSEUR = { min: 0, max: 50 } as const;
const PRIX_DU_LABORATOIRE = { min: 58, max: 61, pas: 0.1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const pct2 = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const f = (c: Cas) => mercatiqueDe(c);

/** Les repères de prix de chaque clientèle, et le seuil que le chapitre étudie. */
export const prixPsychologique = (c: Cas) => lirePrix(f(c));

/** Le prix du laboratoire qui laisse la plus grande marge sur la clientèle du seuil. */
export const prixDuLaboratoire = (c: Cas) =>
  grille(PRIX_DU_LABORATOIRE.min, PRIX_DU_LABORATOIRE.max, PRIX_DU_LABORATOIRE.pas)
    .map((p) => clienteleDuSeuil(f(c), p))
    .reduce((a, b) => (b.marge > a.marge ? b : a));

/** « 20 centimes » : l'écart entre les deux prix de part et d'autre du seuil. */
const centimes = (p: ReturnType<typeof prixPsychologique>) => `${Math.round((p.dessus - p.sous) * 100)} centimes`;

export const PRIX_PSYCHOLOGIQUE: Chapitre = {
  code: "prix-psychologique",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 1 · La définition de l'offre", "BUT TC · Conduire les actions marketing", "BUT GACO · Concevoir la démarche marketing"],
  titre: "Le prix psychologique",
  accroche:
    "Le client ne juge pas un prix en euros : il le compare à ce qu'il trouve normal, et refuse de franchir certains seuils. Ce que valent quelques centimes au bon endroit.",
  objectifs: [
    "Lire les repères de prix d'une clientèle : prix jugé normal, prix trop bas, seuil psychologique",
    "Situer le prix de l'entreprise face au prix jugé normal",
    "Mesurer l'effet d'un seuil psychologique sur la demande",
    "Expliquer les prix qui finissent en ,90",
  ],
  libre: false,
  entreprises: { codes: SEGMENTATIONS, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que le client trouve normal",
      notions: ["psych_price"],
      texte: (c) => {
        const p = prixPsychologique(c);
        return [
          "Pour connaître le prix qu'un client accepte, le mercaticien lui pose deux questions : en dessous de quel prix douteriez-vous de la qualité ? Au-dessus de quel prix renonceriez-vous ? Entre les deux se trouve le prix qu'il juge normal.",
          `${c.entreprise} a fait l'enquête auprès de ses trois clientèles. Elle vend à ${eur(p.prix)} : le tableau dit comment chaque clientèle le reçoit.`,
        ];
      },
      tableau: (c) => {
        const p = prixPsychologique(c);
        return {
          titre: "Les repères de prix de chaque clientèle",
          colonnes: p.clienteles.map((k) => k.nom),
          lignes: [
            { libelle: "Méfiance en dessous de", valeurs: p.clienteles.map((k) => eur(k.tropBas)) },
            { libelle: "Prix jugé normal", valeurs: p.clienteles.map((k) => eur(k.normal)) },
            { libelle: "Seuil psychologique", valeurs: p.clienteles.map((k) => (k.seuil === null ? "aucun" : eur(k.seuil))) },
          ],
        };
      },
      repere: () => "Prix psychologique : celui que le client juge acceptable, entre le prix qui le fait douter de la qualité et celui qui le fait renoncer.",
    },
    {
      id: "ecart",
      type: "montants",
      titre: "Le prix face au prix jugé normal",
      notions: ["psych_price"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `${c.entreprise} vend à ${eur(p.prix)}. La clientèle « ${p.etudie.nom} » juge normal un prix de ${eur(p.etudie.normal)}. Calculez l'écart du prix de l'entreprise au prix jugé normal, en pourcentage au dixième (positif s'il est plus cher), puis ce qui sépare le prix de l'entreprise du seuil psychologique de ${eur(p.seuil)}.`;
      },
      champs: (c) => {
        const p = prixPsychologique(c);
        const ecart = Math.round((p.seuil - p.prix) * 100) / 100;
        return [
          { libelle: "Écart au prix jugé normal (%)", attendu: p.etudie.ecart, calcul: `(${eur(p.prix)} ÷ ${eur(p.etudie.normal)} − 1) × 100 = ${pct(p.etudie.ecart)}`, tolerance: 0.1 },
          { libelle: "Écart au seuil psychologique (€)", attendu: ecart, calcul: `${eur(p.seuil)} − ${eur(p.prix)} = ${eur(ecart)}` },
        ];
      },
      explication: (c) => {
        const p = prixPsychologique(c);
        return [
          p.prix < p.seuil
            ? `Le prix ${dE(c.entreprise)} reste sous le seuil de ${eur(p.seuil)} : il pourrait monter de ${eur(Math.round((p.seuil - p.prix) * 100) / 100)} avant de l'atteindre.`
            : `Le prix ${dE(c.entreprise)} est déjà au seuil de ${eur(p.seuil)} : cette clientèle le perçoit comme passé de l'autre côté.`,
        ];
      },
    },
    {
      id: "avantageux",
      type: "choix",
      titre: "La clientèle qui trouve le prix avantageux",
      notions: ["psych_price", "segmentation"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `Au même prix de ${eur(p.prix)}, pour quelle clientèle ${c.entreprise} paraît-elle la plus avantageuse, comparée au prix que cette clientèle juge normal ?`;
      },
      options: (c) => {
        const p = prixPsychologique(c);
        return p.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === p.avantageux.code,
          retour:
            k.code === p.avantageux.code
              ? `Oui : elle juge normal ${eur(k.normal)}, et ${c.entreprise} vend à ${eur(p.prix)}, ${pct(Math.abs(k.ecart))} moins cher. Le même prix n'est pas reçu de la même façon par toutes les clientèles.`
              : `Non : elle juge normal ${eur(k.normal)}, et le prix de l'entreprise est ${k.ecart === 0 ? "exactement à ce niveau" : `${pct(Math.abs(k.ecart))} ${k.ecart < 0 ? "en dessous" : "au-dessus"}`}.`,
        }));
      },
    },
    {
      id: "seuil",
      type: "montants",
      titre: "Quelques centimes de part et d'autre du seuil",
      notions: ["psych_price", "price_elasticity"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `Un test en ligne l'a montré : la clientèle « ${p.etudie.nom} » demande ${qte(p.demandeSous)} ${c.unites} par trimestre à ${eur(p.sous)}, mais ${qte(p.demandeDessus)} à ${eur(p.dessus)}, soit ${pct(p.perte)} de moins. Calculez la hausse de prix, en pourcentage au centième, puis le rapport entre la demande perdue et la hausse de prix, à l'unité.`;
      },
      champs: (c) => {
        const p = prixPsychologique(c);
        return [
          { libelle: "Hausse de prix (%)", attendu: p.hausse, calcul: `(${eur(p.dessus)} ÷ ${eur(p.sous)} − 1) × 100 = ${pct2(p.hausse)}`, tolerance: 0.01 },
          { libelle: "Demande perdue ÷ hausse de prix", attendu: p.rapport, calcul: `${qte(p.perte)} ÷ ${qte(p.hausse)} = ${qte(p.rapport)}`, tolerance: Math.max(1, Math.round(p.rapport * 0.1)) },
        ];
      },
      explication: (c) => {
        const p = prixPsychologique(c);
        return [
          `Loin du seuil, chaque point de prix en plus coûte environ ${qte(p.elasticite)} points de demande à cette clientèle. Au seuil de ${eur(p.seuil)}, une hausse de ${pct2(p.hausse)} en coûte ${pct(p.perte)} : ${qte(p.rapport)} fois plus que la hausse elle-même. Le client ne voit pas ${centimes(p)} : il voit un prix qui passe la barre.`,
        ];
      },
    },
    {
      id: "virgule-quatre-vingt-dix",
      type: "choix",
      titre: "Pourquoi tant de prix finissent en ,90",
      notions: ["psych_price"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `${c.entreprise} hésite entre ${eur(p.sous)} et ${eur(p.dessus)}. Que lui conseiller ?`;
      },
      options: (c) => {
        const p = prixPsychologique(c);
        return [
          {
            texte: `${eur(p.sous)} : rester sous le seuil psychologique`,
            juste: true,
            retour: `Oui : ${eur(p.sous)} garde la clientèle sous la barre de ${eur(p.seuil)}. ${centimes(p)} de moins sur chaque vente, mais ${pct(p.perte)} de demande gardée : c'est pourquoi tant de prix finissent en ,90 ou en ,99.`,
          },
          {
            texte: `${eur(p.dessus)} : ${centimes(p)} de plus sur chaque vente`,
            juste: false,
            retour: `Non : ${centimes(p)} de plus par vente, mais ${pct(p.perte)} de la demande perdue. Sur cent ventes, l'entreprise gagnerait ${eur((p.dessus - p.sous) * 100)}, mais perdrait environ ${qte(Math.round(p.perte))} ventes.`,
          },
          {
            texte: "C'est pareil : quelques centimes ne changent rien",
            juste: false,
            retour: `Non : pour un client, ${eur(p.sous)} et ${eur(p.dessus)} ne sont pas du même côté de la barre de ${eur(p.seuil)}. Le test le chiffre : ${pct(p.perte)} de demande en moins.`,
          },
        ];
      },
    },
    {
      id: "la-promotion-croyable",
      type: "curseur",
      titre: "La promotion que le client croit encore",
      notions: ["psych_price", "price_elasticity"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `${c.entreprise} prépare une promotion sur son enceinte à ${eur(p.prix)}. Sous ${eur(p.etudie.tropBas)}, la clientèle « ${p.etudie.nom} » doute de la qualité. Faites varier la remise, en pourcentage : une droite donne le prix remisé, l'autre le prix de méfiance. Placez le curseur sur la remise la plus forte qui garde le prix remisé au niveau du prix de méfiance ou au-dessus, puis validez.`;
      },
      grandeur: () => ({ libelle: "Remise", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: remiseLaPlusForte(f(c)), ...REMISE_DU_CURSEUR }),
      zones: ["La promotion reste crédible", "Le prix fait douter de la qualité"],
      rates: () => ({
        dessous: "La promotion reste crédible, mais une remise plus forte le serait encore : cherchez la plus forte.",
        dessus: "À ce prix, la clientèle doute de la qualité : la promotion fait fuir au lieu d'attirer.",
      }),
      montrer: "Montrer la remise",
      lecture: (c, q) => [
        { libelle: "Prix remisé", montant: prixRemise(f(c), q), fort: true },
        { libelle: "Prix de méfiance", montant: prixPsychologique(c).etudie.tropBas },
        { libelle: "Marge d'une enceinte remisée", montant: prixRemise(f(c), q) - coutVariable(f(c)) },
      ],
      droites: (c) => ({ produit: (q) => prixRemise(f(c), q), cout: () => prixPsychologique(c).etudie.tropBas, libelles: ["Prix remisé", "Prix de méfiance"] }),
      explication: (c) => {
        const r = remiseLaPlusForte(f(c));
        const p = prixPsychologique(c);
        return [
          `À ${r} % de remise, l'enceinte passe à ${eur(prixRemise(f(c), r))}, encore au-dessus des ${eur(p.etudie.tropBas)} de méfiance. À ${r + 1} %, elle tomberait à ${eur(prixRemise(f(c), r + 1))} : la clientèle se demanderait ce qui cloche.`,
          "Un prix trop bas inquiète autant qu'un prix trop haut fait fuir : une promotion se cale entre les deux.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-seuil",
      type: "simulation",
      titre: "Le laboratoire du seuil",
      notions: ["psych_price", "contribution_margin"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `Faites varier le prix, au dixième d'euro, autour du seuil de ${eur(p.seuil)}. Le tableau donne la demande de la clientèle « ${p.etudie.nom} » et la marge qu'elle laisse (le prix moins ${eur(coutVariable(f(c)))} de coût variable, fois les ventes). Relevez le défi.`;
      },
      leviers: (c) => [{ code: "prix", libelle: "Prix de l'enceinte", unite: "€", ...PRIX_DU_LABORATOIRE, depart: prixPsychologique(c).prix }],
      lecture: (c, p) => {
        const x = clienteleDuSeuil(f(c), p.prix!);
        const d = clienteleDuSeuil(f(c), prixPsychologique(c).prix);
        return [
          { libelle: "Demande de la clientèle", montant: x.demande, unite: c.unites, reference: d.demande },
          { libelle: "Marge sur une enceinte", montant: p.prix! - coutVariable(f(c)), reference: d.prix - coutVariable(f(c)) },
          { libelle: "Marge de la clientèle", montant: x.marge, reference: d.marge, fort: true },
        ];
      },
      graphique: (c) => ({ levier: "prix", courbes: [{ libelle: "Marge de la clientèle", valeur: (p) => clienteleDuSeuil(f(c), p.prix!).marge }] }),
      defi: (c) => {
        const juste = prixDuLaboratoire(c);
        return {
          consigne: `Trouvez le prix qui laisse la plus grande marge sur la clientèle « ${prixPsychologique(c).etudie.nom} ».`,
          atteint: (p) => Math.abs(p.prix! - juste.prix) < 1e-9,
          indice: (p) => {
            const x = clienteleDuSeuil(f(c), p.prix!);
            return p.prix! >= prixPsychologique(c).seuil
              ? `À ${eur(x.prix)}, le prix a passé la barre : la marge tombe à ${eur(x.marge)}.`
              : `À ${eur(x.prix)}, la marge est de ${eur(x.marge)} : un prix un peu plus haut, sans passer la barre, en laisserait plus.`;
          },
          solution: { prix: juste.prix },
        };
      },
      explication: (c, p) => {
        const x = clienteleDuSeuil(f(c), p.prix!);
        const s = prixPsychologique(c);
        return [
          `Défi relevé : à ${eur(x.prix)}, juste sous la barre de ${eur(s.seuil)}, la clientèle laisse ${eur(x.marge)} de marge. Passé la barre, chaque vente rapporte un peu plus, mais la demande saute de ${pct(s.perte)}.`,
          "Le meilleur prix est souvent juste sous un seuil rond : c'est le prix psychologique.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["psych_price"],
      texte: (c) => {
        const p = prixPsychologique(c);
        return [
          `Un prix se juge par rapport à des repères : le prix normal de chaque clientèle, celui qui la fait douter, et les seuils ronds. Chez ${c.entreprise}, franchir le seuil de ${eur(p.seuil)} pour ${centimes(p)} coûterait ${pct(p.perte)} de la demande de la clientèle « ${p.etudie.nom} ».`,
          "Fixer un prix, c'est donc tenir compte du coût (pour ne pas perdre d'argent), de la concurrence (pour rester dans la course) et de la psychologie du client (pour rester dans ce qu'il accepte). Dans l'arène, essayez un prix juste au-dessus d'un prix rond, et regardez la demande.",
        ];
      },
      repere: () => "Un prix psychologique se place sous un seuil rond (9,90 € plutôt que 10 €) et dans la zone que la clientèle juge acceptable.",
    },
  ],
};
