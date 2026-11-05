import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { BOUTIQUES_DU_COURS, type CodeDeReference, type FicheDeLaBoutique } from "../monde/maille-et-co";
import {
  EQUIPE_DU_MATIN,
  HEURE_DE_DEBUT,
  LINEAIRE_MINIMAL,
  REFERENCE_QUI_CEDE,
  TACHES,
  heureDOuverture,
  heureDe,
  marchandisage,
  ordreEnLigne,
  planningDeGantt,
  reimplanter,
  renfortDuLundi,
  reseauAvecLaDuree,
  reseauPert,
} from "../monde/reimplantation";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : RÉIMPLANTER AVANT LES SOLDES (BTS MCO, bloc 2 pour le marchandisage et bloc 4 pour
 * l'ordonnancement des tâches, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la gamme de janvier de la boutique MAILLE & CO, ses marges
 * et ses stocks (monde/maille-et-co.ts, monde/boutique.ts), son linéaire, sa vitrine en ligne et les
 * tâches de la réimplantation (monde/reimplantation.ts). Son équipe est celle de la fiche.
 *
 * L'objet, en deux temps. LE MARCHANDISAGE : la part du linéaire de chaque référence face à sa part du
 * chiffre d'affaires et de la marge (indice de sensibilité, indice de rentabilité), la marge par mètre,
 * puis la réimplantation : donner au col rond les mètres que le bonnet n'utilise pas, sans les donner
 * au cardigan, en rupture, qui ne vendrait pas un pull de plus. L'ordre d'affichage en ligne suit la
 * marge par visite. L'ORDONNANCEMENT : la réimplantation se fait le lundi avant l'ouverture ; les
 * tâches, leurs antériorités et leurs durées donnent le réseau PERT, le chemin critique, les marges ;
 * le planning de Gantt dit si trois personnes tiennent avant 10 h.
 *
 * Le piège central : la référence la plus surexposée n'est pas toujours celle qui doit céder le plus, et
 * le linéaire gagné ne rapporte qu'à une référence qui a le stock pour vendre plus ; côté planning, une
 * tâche qui a de la marge peut tout de même retarder la fin quand l'équipe est trop petite.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, la-marge-par-metre, les-indices (la question nomme les chiffres) ;
 *   · l'expérience avant la formule : predire-le-lineaire puis le-laboratoire-du-lineaire ;
 *     predire-la-vitrine puis la-vitrine-au-curseur (la durée de la vitrine qui ne retarde rien) avant
 *     les-marges ;
 *   · autonome : les-principes, l-ordre-en-ligne, le-reseau (un tableau à compléter), les-marges ;
 *   · expert : le-chemin-critique, l-equipe-limitee, le-renfort, la-decision ; puis la synthèse.
 */

export const ENTREPRISES_DE_LA_REIMPLANTATION: readonly string[] = ["boutique"];

export const POURQUOI_LA_BOUTIQUE =
  "la simulation du cours suit un seul point de vente d'un chapitre à l'autre, la boutique MAILLE & CO, dont elle connaît le linéaire, les marges, les stocks et l'équipe : la réimplantation se joue chez elle, quelle que soit votre entreprise.";

export const CODE_DE_LA_REIMPLANTATION = "reimplanter-avant-les-soldes";
export const TITRE_DE_LA_REIMPLANTATION = "Réimplanter avant les soldes";

/** Le défi du laboratoire : au moins 1 500 € de marge en plus, en prenant le moins de linéaire au bonnet. */
export const GAIN_VISE = 1_500;

/** Le départ du laboratoire : un mètre donné au cardigan. */
export const DEPART_DU_LABORATOIRE: { receveuse: CodeDeReference; metres: number } = { receveuse: "cardigan", metres: 1 };

/** Les références qui peuvent recevoir les mètres du bonnet, dans l'ordre de la gamme. */
const RECEVEUSES: readonly CodeDeReference[] = ["col-rond", "cardigan", "merinos", "echarpe"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const ind = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mn = (n: number) => `${qte(n)} min`;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const nomCourt = (nom: string) => nom.replace(/^Pull /, "").toLowerCase();
const leNom = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `l'${nom}` : `le ${nom}`);
const auNom = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `à l'${nom}` : `au ${nom}`);

const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

export const rangDeLaReceveuse = (code: CodeDeReference) => RECEVEUSES.indexOf(code) + 1;
export const receveuseDuRang = (rang: number): CodeDeReference => RECEVEUSES[rang - 1]!;

/** Le plus petit nombre de mètres (par demi-mètre) qui, donné à une référence, fait gagner au moins le gain visé ; null s'il n'y en a pas. */
export function metresQuiSuffisent(f: FicheDeLaBoutique, receveuse: CodeDeReference, gain = GAIN_VISE) {
  const cede = marchandisage(f).references.find((r) => r.code === REFERENCE_QUI_CEDE)!;
  for (let m = 0; m <= cede.lineaire - LINEAIRE_MINIMAL + 1e-9; m += 0.5) if (reimplanter(f, receveuse, m).effet >= gain) return m;
  return null;
}

/** Tout ce que le chapitre et son cas demandent. */
export function reimplantationDeLaBoutique(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = marchandisage(f);
  const ligne = (code: CodeDeReference) => m.references.find((r) => r.code === code)!;
  const pert = reseauPert();
  const gantt3 = planningDeGantt(EQUIPE_DU_MATIN.length);
  const gantt4 = planningDeGantt(EQUIPE_DU_MATIN.length + 1);
  const vitrine = pert.lignes.find((l) => l.code === "H")!;
  const maxCede = ligne(REFERENCE_QUI_CEDE).lineaire - LINEAIRE_MINIMAL;
  const solution = RECEVEUSES.map((r) => ({ r, m: metresQuiSuffisent(f, r) })).find((x) => x.m !== null)!;
  return {
    f,
    m,
    ligne,
    bonnet: ligne(REFERENCE_QUI_CEDE),
    colRond: ligne("col-rond"),
    maxCede,
    solution: { receveuse: solution.r, metres: solution.m! },
    enLigne: ordreEnLigne(f),
    pert,
    gantt3,
    gantt4,
    vitrine,
    dureeMaxDeLaVitrine: vitrine.duree + vitrine.margeTotale,
    ouverture: heureDOuverture(f),
    minutesAvantLOuverture: (heureDOuverture(f) - HEURE_DE_DEBUT) * 60,
    renfort: renfortDuLundi(f),
  };
}

/** Le linéaire du mois, référence par référence. */
export function tableauDuLineaire(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = reimplantationDeLaBoutique(c);
  return {
    titre: `Le linéaire de ${x.f.entreprise} et ce qu'il fait, en ${x.f.moisDeReference}`,
    colonnes: ["Linéaire", "Chiffre d'affaires", "Marge", "Stock du mois"],
    lignes: x.m.references.map((r) => {
      const ref = x.f.gamme.find((g) => g.code === r.code)!;
      return { libelle: r.nom, valeurs: [`${qte(r.lineaire)} m`, eur(r.chiffreDAffaires), eur(r.marge), `${qte(ref.stockInitial + ref.livraisons.reduce((t, l) => t + l.quantite, 0))} pour ${qte(ref.demandeDuMois)} demandés`] };
    }),
  };
}

/** Les tâches de la réimplantation. */
export function tableauDesTaches(_c: Pick<Cas, "code">): TableauDeDonnees {
  return {
    titre: "Les tâches de la réimplantation",
    colonnes: ["Tâche", "Durée", "Après", "Personnes"],
    lignes: TACHES.map((t) => ({ libelle: t.code, valeurs: [t.libelle, mn(t.duree), t.apres.length ? t.apres.join(", ") : "aucune", qte(t.personnes)] })),
  };
}

/** Le réseau, à compléter : les dates de début au plus tôt et au plus tard, la marge totale. */
export function grilleDuReseau(c: Pick<Cas, "code">): TableauACompleter {
  const x = reimplantationDeLaBoutique(c);
  return {
    titre: "Le réseau PERT de la réimplantation, en minutes depuis 7 h",
    colonnes: ["Début au plus tôt", "Début au plus tard", "Marge totale"],
    tolerance: 0,
    lignes: x.pert.lignes.map((l) => {
      const donnee = l.code === "A";
      const succ = TACHES.filter((t) => t.apres.includes(l.code)).map((t) => t.code);
      return {
        libelle: `${l.code} · ${l.libelle}`,
        cellules: [
          { valeur: l.debutAuPlusTot, unite: "min", saisir: !donnee, calcul: l.apres.length ? `la plus tardive des fins au plus tôt ${l.apres.length > 1 ? "des tâches" : "de la tâche"} ${l.apres.join(", ")} = ${mn(l.debutAuPlusTot)}` : "aucune tâche avant : 0 min", indice: "la plus grande des fins au plus tôt des tâches qui la précèdent" },
          { valeur: l.debutAuPlusTard, unite: "min", saisir: !donnee, calcul: `${succ.length ? `le plus tôt des débuts au plus tard ${succ.length > 1 ? "des tâches" : "de la tâche"} ${succ.join(", ")}` : `la fin du projet, ${mn(x.pert.fin)}`}, moins ${mn(l.duree)} = ${mn(l.debutAuPlusTard)}`, indice: "le plus petit des débuts au plus tard des tâches qui la suivent, moins sa durée" },
          { valeur: l.margeTotale, unite: "min", saisir: !donnee, calcul: `${mn(l.debutAuPlusTard)} − ${mn(l.debutAuPlusTot)} = ${mn(l.margeTotale)}`, indice: "le début au plus tard moins le début au plus tôt" },
        ],
      };
    }),
  };
}

/** Le planning de Gantt à trois et à quatre personnes, pour la synthèse et l'équipe limitée. */
function tableauDuGantt(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = reimplantationDeLaBoutique(c);
  const de = (g: typeof x.gantt3, code: string) => g.lignes.find((l) => l.code === code)!;
  return {
    titre: "Le planning de Gantt : début et fin de chaque tâche",
    colonnes: [`À ${qte(x.gantt3.personnes)} personnes`, `À ${qte(x.gantt4.personnes)} personnes`],
    lignes: TACHES.map((t) => ({
      libelle: `${t.code} · ${t.libelle}`,
      valeurs: [x.gantt3, x.gantt4].map((g) => `${heureDe(de(g, t.code).debut)} à ${heureDe(de(g, t.code).fin)}`),
    })),
  };
}

export const REIMPLANTER_AVANT_LES_SOLDES: Chapitre = {
  code: "reimplanter-avant-les-soldes",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale", "BTS MCO Bloc 4 · Manager l'équipe commerciale"],
  titre: TITRE_DE_LA_REIMPLANTATION,
  accroche:
    "Le bonnet occupe un cinquième du linéaire pour moins de 5 % de la marge. À qui donner ses mètres, et à qui surtout pas ? Puis la réimplantation elle-même, le lundi avant l'ouverture : le réseau des tâches, le chemin critique, et l'équipe qu'il faut pour ouvrir à l'heure.",
  objectifs: [
    "Mesurer la performance du linéaire : part du linéaire, indices de sensibilité et de rentabilité, marge par mètre",
    "Réallouer le linéaire en tenant compte du stock de chaque référence, et ordonner une vitrine en ligne",
    "Construire le réseau PERT d'un projet : dates au plus tôt et au plus tard, marges, chemin critique",
    "Ordonnancer les tâches avec une équipe limitée et affecter les vendeurs",
  ],
  libre: false,
  prerequis: ["assortiment", "equipe-et-planning"],
  ensuite: ["promotion-qui-paie"],
  entreprises: { codes: ENTREPRISES_DE_LA_REIMPLANTATION, pourquoi: POURQUOI_LA_BOUTIQUE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un linéaire, cinq références",
      notions: ["sales_per_sqm", "assortment"],
      tableau: tableauDuLineaire,
      texte: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. Les soldes approchent et la manager veut réimplanter la boutique. Le tableau donne, pour chaque référence, son linéaire développé (la longueur d'étagère qui la présente, ${qte(x.m.lineaireTotal)} m en tout), son chiffre d'affaires et sa marge sur coût variable de ${x.f.moisDeReference}, et ce qu'elle avait à vendre.`,
          `Ce que la simulation suppose. 10 % de linéaire en plus font demander 3 % d'articles en plus (l'élasticité au linéaire, une droite, à l'unité inférieure). Une référence ne vend jamais plus que son stock du mois : le cardigan, à ${qte(x.f.gamme.find((g) => g.code === "cardigan")!.demandeDuMois)} demandés pour ${qte(x.f.gamme.find((g) => g.code === "cardigan")!.ventesDuMois)} en stock, est en rupture. Le bonnet garde au moins ${qte(LINEAIRE_MINIMAL)} m pour rester visible.`,
          "Le linéaire est la ressource rare d'un point de vente, comme la surface : chaque mètre doit payer sa place.",
        ];
      },
      repere: () => "Marge par mètre = marge de la référence ÷ son linéaire. Indice de sensibilité = part du chiffre d'affaires ÷ part du linéaire ; indice de rentabilité = part de la marge ÷ part du linéaire.",
    },
    {
      id: "la-marge-par-metre",
      objectifs: [0],
      type: "montants",
      titre: "La marge par mètre de linéaire",
      notions: ["sales_per_sqm"],
      tableau: tableauDuLineaire,
      question: () => "Calculez la marge par mètre de linéaire de chaque référence, au centime : sa marge du mois divisée par son linéaire.",
      champs: (c) =>
        reimplantationDeLaBoutique(c).m.references.map((r) => ({ libelle: `Marge par mètre · ${r.nom}`, attendu: r.margeParMetre, calcul: `${eur(r.marge)} ÷ ${qte(r.lineaire)} m = ${eur(r.margeParMetre)}` })),
      explication: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          `Un mètre de la boutique laisse en moyenne ${eur(x.m.margeParMetre)}. Le cardigan en laisse ${eur(x.ligne("cardigan").margeParMetre)}, le col rond ${eur(x.colRond.margeParMetre)}, le bonnet ${eur(x.bonnet.margeParMetre)} : un mètre de bonnet rapporte ${qte(Math.round(x.colRond.margeParMetre / x.bonnet.margeParMetre * 10) / 10)} fois moins qu'un mètre de col rond.`,
        ];
      },
    },
    {
      id: "les-indices",
      objectifs: [0],
      type: "montants",
      titre: "Les indices du bonnet et du col rond",
      notions: ["sales_per_sqm", "assortment"],
      tableau: tableauDuLineaire,
      question: () =>
        "Pour le bonnet puis le col rond, calculez l'indice de sensibilité (part du chiffre d'affaires ÷ part du linéaire) et l'indice de rentabilité (part de la marge ÷ part du linéaire), au centième.",
      champs: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [x.bonnet, x.colRond].flatMap((r) => [
          {
            libelle: `Indice de sensibilité · ${r.nom}`,
            attendu: auCentieme(r.indiceDeSensibilite),
            tolerance: 0.01,
            calcul: `(${eur(r.chiffreDAffaires)} ÷ ${eur(x.m.chiffreDAffaires)}) ÷ (${qte(r.lineaire)} m ÷ ${qte(x.m.lineaireTotal)} m) = ${pct(auDixieme(r.partDuChiffreDAffaires * 100))} ÷ ${pct(auDixieme(r.partDuLineaire * 100))} = ${ind(auCentieme(r.indiceDeSensibilite))}`,
          },
          {
            libelle: `Indice de rentabilité · ${r.nom}`,
            attendu: auCentieme(r.indiceDeRentabilite),
            tolerance: 0.01,
            calcul: `(${eur(r.marge)} ÷ ${eur(x.m.marge)}) ÷ (${qte(r.lineaire)} m ÷ ${qte(x.m.lineaireTotal)} m) = ${pct(auDixieme(r.partDeLaMarge * 100))} ÷ ${pct(auDixieme(r.partDuLineaire * 100))} = ${ind(auCentieme(r.indiceDeRentabilite))}`,
          },
        ]);
      },
      explication: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          `Un indice sous 1 dit qu'une référence occupe plus de linéaire qu'elle ne pèse : le bonnet, à ${ind(auCentieme(x.bonnet.indiceDeRentabilite))}, est surexposé ; le col rond, à ${ind(auCentieme(x.colRond.indiceDeRentabilite))}, sous-exposé. L'indice de rentabilité compte plus que celui de sensibilité : c'est la marge, pas le chiffre, qui paie le mètre.`,
        ];
      },
    },
    {
      id: "predire-le-lineaire",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le linéaire",
      notions: ["sales_per_sqm", "stock"],
      question: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const card = x.ligne("cardigan");
        return `Avant de calculer, pariez. La manager prend des mètres au bonnet. Le cardigan a la plus forte marge par mètre (${eur(card.margeParMetre)}). Lui donner ces mètres serait…`;
      },
      options: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const voir = "Faites l'essai dans le laboratoire : il suit les ventes de chaque référence.";
        const gainCardigan = reimplanter(x.f, "cardigan", 1).effet;
        return [
          { texte: "Une perte : en rupture, il ne vend pas plus", juste: gainCardigan < 0, retour: `Bon pari. ${voir}` },
          { texte: "Le meilleur choix : la meilleure marge par mètre", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Neutre : le linéaire ne change pas les ventes", juste: gainCardigan === 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-lineaire",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire du linéaire",
      notions: ["sales_per_sqm", "stock", "capacity"],
      question: () => {
        return `Choisissez la référence qui reçoit les mètres du bonnet, et combien de mètres lui donner (le bonnet en garde au moins ${qte(LINEAIRE_MINIMAL)} m). Le tableau suit les ventes de chacune, ce que le bonnet perd, ce que la référence gagne et l'effet sur la marge du mois ; le graphique trace ce gain selon les mètres donnés. Puis relevez le défi.`;
      },
      leviers: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          { code: "receveuse", libelle: "Référence qui reçoit les mètres", unite: "", min: 1, max: RECEVEUSES.length, pas: 1, depart: rangDeLaReceveuse(DEPART_DU_LABORATOIRE.receveuse), choix: RECEVEUSES.map((r) => ({ valeur: rangDeLaReceveuse(r), libelle: x.ligne(r).nom })) },
          { code: "metres", libelle: "Mètres pris au bonnet", unite: "m", min: 0, max: x.maxCede, pas: 0.5, depart: DEPART_DU_LABORATOIRE.metres },
        ];
      },
      lecture: (c, p) => {
        const x = reimplantationDeLaBoutique(c);
        const r = reimplanter(x.f, receveuseDuRang(p.receveuse!), p.metres!);
        const d = reimplanter(x.f, DEPART_DU_LABORATOIRE.receveuse, DEPART_DU_LABORATOIRE.metres);
        return [
          { libelle: "Bonnets demandés et vendus", montant: r.apresCede.ventes, reference: d.apresCede.ventes, unite: "articles" },
          { libelle: "Demande de la référence qui reçoit", montant: r.apresRecoit.demande, reference: d.apresRecoit.demande, unite: "articles" },
          { libelle: "Ventes de la référence qui reçoit", montant: r.apresRecoit.ventes, reference: d.apresRecoit.ventes, unite: "articles" },
          { libelle: "Marge perdue sur le bonnet", montant: r.margePerdue, reference: d.margePerdue },
          { libelle: "Marge gagnée sur la référence", montant: r.margeGagnee, reference: d.margeGagnee },
          { libelle: "Effet sur la marge du mois", montant: r.effet, reference: d.effet, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return { levier: "metres", courbes: [{ libelle: "Effet sur la marge du mois", valeur: (p) => reimplanter(x.f, receveuseDuRang(p.receveuse!), Math.round(p.metres! * 2) / 2).effet }] };
      },
      defi: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const effet = (rang: number, m: number) => reimplanter(x.f, receveuseDuRang(rang), m).effet;
        return {
          consigne: `Gagnez au moins ${eur(GAIN_VISE)} de marge dans le mois, en prenant le moins de linéaire possible au bonnet.`,
          atteint: (p) => effet(p.receveuse!, p.metres!) >= GAIN_VISE && (p.metres! === 0 || effet(p.receveuse!, p.metres! - 0.5) < GAIN_VISE),
          indice: (p) => {
            const code = receveuseDuRang(p.receveuse!);
            const r = reimplanter(x.f, code, p.metres!);
            if (r.apresRecoit.enRupture && r.ventesGagnees === 0) return `${leNom(nomCourt(r.receveuse.nom)).replace(/^./, (l) => l.toUpperCase())} est déjà en rupture : ses ${qte(r.apresRecoit.stock)} articles sont tous vendus, un mètre de plus ne vend rien.`;
            if (metresQuiSuffisent(x.f, code) === null) return `Même avec ${qte(x.maxCede)} m, donner le linéaire ${auNom(nomCourt(r.receveuse.nom))} ne fait pas gagner ${eur(GAIN_VISE)} : sa demande monte trop peu. Cherchez la référence qui vend le plus.`;
            if (r.effet < GAIN_VISE) return `Avec ${qte(p.metres!)} m, le gain n'est que de ${eur(r.effet)} : donnez un peu plus de linéaire.`;
            return `Le gain dépasse ${eur(GAIN_VISE)}, mais un demi-mètre de moins suffisait : prenez le moins possible au bonnet.`;
          },
          solution: { receveuse: rangDeLaReceveuse(x.solution.receveuse), metres: x.solution.metres },
        };
      },
      montrer: "Montrer la réimplantation",
      explication: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const r = reimplanter(x.f, x.solution.receveuse, x.solution.metres);
        return [
          `${qte(x.solution.metres)} m pris au bonnet et donnés ${auNom(nomCourt(r.receveuse.nom))} : ${qte(r.ventesGagnees)} ventes de plus à ${eur(r.receveuse.margeUnitaire)}, ${qte(r.ventesPerdues)} bonnets de moins à ${eur(r.cede.margeUnitaire)} ; la marge du mois gagne ${eur(r.effet)}. Le cardigan ne gagne rien, faute de stock ; le mérinos et l'écharpe gagnent trop peu de ventes.`,
          "Le linéaire se donne à la référence qui transforme un mètre en ventes : forte demande, bonne marge, et le stock pour la servir. Une réimplantation se prépare avec le réassort.",
        ];
      },
    },
    {
      id: "les-principes",
      objectifs: [1],
      type: "choix",
      titre: "Où placer le col rond ?",
      notions: ["sales_per_sqm", "assortment"],
      question: () =>
        "Le col rond, qui vend le plus, va recevoir plus de linéaire. La manager hésite sur sa place : à l'entrée, près de la caisse, ou au fond de la boutique. Que conseille le marchandisage ?",
      options: () => [
        {
          texte: "Au fond : il fait traverser la boutique",
          juste: true,
          retour:
            "Oui. Le produit d'appel, que les clients viennent chercher, se place loin de l'entrée pour les faire circuler devant les autres références ; l'entrée et les abords de la caisse (zones chaudes) reçoivent les achats d'impulsion, comme les écharpes. En hauteur, le niveau des yeux et des mains vend le plus : on y met ce qui marge le plus, le mérinos.",
        },
        {
          texte: "À l'entrée : ce qui se vend le plus doit se trouver tout de suite",
          juste: false,
          retour: "Les clients le trouveraient tout de suite, et repartiraient aussitôt : le produit d'appel à l'entrée raccourcit le parcours et fait perdre les achats d'impulsion.",
        },
        {
          texte: "Peu importe : c'est le linéaire qui fait vendre, pas la place",
          juste: false,
          retour: "Non : à linéaire égal, une zone chaude vend plus qu'une zone froide, et le niveau des yeux plus que le sol. La place fait partie du marchandisage.",
        },
      ],
    },
    {
      id: "l-ordre-en-ligne",
      objectifs: [1],
      type: "montants",
      titre: "L'ordre d'affichage en ligne",
      notions: ["conversion_rate", "contribution_margin"],
      question: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const de = (code: CodeDeReference) => x.enLigne.find((l) => l.code === code)!;
        return `La vitrine en ligne de la boutique montre les cinq références l'une sous l'autre ; la première est la plus vue. Une visite de la fiche du mérinos finit en réservation ${pct(de("merinos").conversion * 100)} des fois, celle du bonnet ${pct(de("bonnet").conversion * 100)}. Calculez la marge qu'une visite rapporte pour le mérinos et pour le bonnet (taux de conversion × marge d'un article), au centime.`;
      },
      champs: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return (["merinos", "bonnet"] as CodeDeReference[]).map((code) => {
          const l = x.enLigne.find((y) => y.code === code)!;
          return { libelle: `Marge par visite · ${l.nom}`, attendu: l.margeParVisite, calcul: `${pct(l.conversion * 100)} × ${eur(l.margeUnitaire)} = ${eur(l.margeParVisite)}` };
        });
      },
      explication: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          `Rangées par marge par visite, les références s'affichent ainsi : ${x.enLigne.map((l) => `${nomCourt(l.nom)} (${eur(l.margeParVisite)})`).join(", ")}. Le bonnet convertit le mieux mais rapporte le moins par visite ; le mérinos convertit le moins mais rapporte le plus. L'e-marchandisage range comme le marchandisage : par ce que la place rapporte, à condition que le stock suive.`,
        ];
      },
    },
    {
      id: "les-taches",
      type: "lecture",
      titre: "Réimplanter en une matinée",
      notions: ["capacity", "productivity"],
      tableau: tableauDesTaches,
      texte: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          `La réimplantation se fait le lundi avant les soldes, de ${HEURE_DE_DEBUT} h à l'ouverture, ${x.ouverture} h : ${mn(x.minutesAvantLOuverture)}. Le tableau donne les tâches, leur durée, celles qui doivent être finies avant, et le nombre de personnes qu'elles occupent en même temps.`,
          "Pour savoir si l'équipe tient, on construit le réseau des tâches (la méthode PERT). On calcule la date de début au plus tôt de chaque tâche, en partant du début ; puis la date de début au plus tard, en remontant de la fin ; la marge est l'écart entre les deux. Les tâches sans marge forment le chemin critique : le moindre retard de l'une d'elles retarde l'ouverture.",
        ];
      },
      repere: () =>
        "Début au plus tôt = la plus grande des fins au plus tôt des tâches qui précèdent. Début au plus tard = le plus petit des débuts au plus tard des tâches qui suivent, moins la durée. Marge totale = début au plus tard − début au plus tôt.",
    },
    {
      id: "le-reseau",
      objectifs: [2],
      type: "a-completer",
      titre: "Le réseau des tâches",
      notions: ["capacity", "productivity"],
      tableau: tableauDesTaches,
      question: () =>
        "Complétez le réseau, en minutes depuis 7 h. D'abord la date de début au plus tôt de chaque tâche, de haut en bas ; puis la date de début au plus tard, en remontant depuis la fin du projet ; puis la marge totale. La ligne de la tâche A est donnée.",
      grille: grilleDuReseau,
      explication: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          `Le projet dure ${mn(x.pert.fin)} : fini à ${heureDe(x.pert.fin)}, avant l'ouverture de ${x.ouverture} h. Les tâches ${x.pert.critique.join(", ")} n'ont aucune marge : elles forment le chemin critique.`,
        ];
      },
    },
    {
      id: "predire-la-vitrine",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la vitrine",
      notions: ["capacity"],
      question: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return `Avant de calculer, pariez. La vitrine (tâche H) est prévue en ${mn(x.vitrine.duree)}. La vendeuse qui la fait voudrait plus de temps. Jusqu'où peut-elle durer sans retarder la fin de la réimplantation ?`;
      },
      options: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const voir = "Faites durer la vitrine à l'étape suivante : le curseur montre où la fin recule.";
        return [
          { texte: "Bien plus : elle n'est pas sur le chemin critique", juste: x.vitrine.margeTotale >= x.vitrine.duree, retour: `Bon pari. ${voir}` },
          { texte: "Pas une minute de plus : toute tâche retarde la fin", juste: x.vitrine.margeTotale === 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Quelques minutes seulement : la réimplantation est serrée", juste: x.vitrine.margeTotale > 0 && x.vitrine.margeTotale < x.vitrine.duree, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-vitrine-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "La vitrine qui ne retarde rien",
      notions: ["capacity"],
      question: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return `Faites varier la durée de la vitrine, de ${mn(x.vitrine.duree)} à 150 min. Une droite donne la fin du projet sans retard (${heureDe(x.pert.fin)}, soit ${mn(x.pert.fin)}), l'autre la fin du projet avec cette durée. Placez le curseur sur la plus longue durée qui ne retarde pas la fin, puis validez.`;
      },
      grandeur: () => ({ libelle: "Durée de la vitrine", unite: "min" }),
      cible: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return { attendu: x.dureeMaxDeLaVitrine, min: x.vitrine.duree, max: 150 };
      },
      sens: "plus-grande",
      zones: ["La fin ne bouge pas", "L'ouverture recule"],
      rates: () => ({
        dessous: "La vitrine peut durer plus longtemps sans rien retarder : cherchez la plus longue durée.",
        dessus: "À cette durée, la vitrine finit après le reste et retarde le contrôle final.",
      }),
      montrer: "Montrer la plus longue durée",
      lecture: (c, d) => {
        const x = reimplantationDeLaBoutique(c);
        const r = reseauAvecLaDuree("H", d);
        return [
          { libelle: "Fin du projet, en minutes", montant: r.fin },
          { libelle: "Fin prévue, en minutes", montant: x.pert.fin },
          { libelle: "Retard, en minutes", montant: r.fin - x.pert.fin, fort: true },
        ];
      },
      droites: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return { produit: () => x.pert.fin, cout: (d) => reseauAvecLaDuree("H", Math.round(d)).fin, libelles: ["Fin prévue", "Fin avec cette durée"] };
      },
      explication: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          `La vitrine peut durer jusqu'à ${mn(x.dureeMaxDeLaVitrine)} : ses ${mn(x.vitrine.duree)} prévues, plus sa marge totale de ${mn(x.vitrine.margeTotale)}. Elle commence au plus tôt à ${mn(x.vitrine.debutAuPlusTot)} (après les étiquettes) et doit finir avant le contrôle final, qui commence au plus tard à ${mn(x.pert.lignes.find((l) => l.code === "I")!.debutAuPlusTard)}. Une minute de plus, et c'est elle qui retarde l'ouverture.`,
        ];
      },
    },
    {
      id: "les-marges",
      objectifs: [2],
      type: "montants",
      titre: "Marge totale et marge libre",
      notions: ["capacity"],
      tableau: tableauDesTaches,
      question: () =>
        "Sans formule cette fois. Calculez la marge libre du nettoyage (C), des étiquettes (E) et de la signalétique (G) : le temps dont la tâche peut glisser sans retarder le début au plus tôt d'aucune tâche qui la suit.",
      champs: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return (["C", "E", "G"] as const).map((code) => {
          const l = x.pert.lignes.find((y) => y.code === code)!;
          const succ = x.pert.lignes.filter((y) => y.apres.includes(code));
          const debutSuivant = succ.length ? Math.min(...succ.map((y) => y.debutAuPlusTot)) : x.pert.fin;
          return { libelle: `Marge libre · ${code}`, attendu: l.margeLibre, calcul: `${mn(debutSuivant)} (début au plus tôt ${succ.length ? `${succ.length > 1 ? "des tâches" : "de la tâche"} ${succ.map((y) => y.code).join(", ")}` : "de la fin"}) − ${mn(l.finAuPlusTot)} (sa fin au plus tôt) = ${mn(l.margeLibre)}` };
        });
      },
      explication: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const e = x.pert.lignes.find((l) => l.code === "E")!;
        return [
          `Les étiquettes ont ${mn(e.margeTotale)} de marge totale, mais aucune marge libre : la vitrine attend qu'elles soient finies. Les retarder ne retarde pas l'ouverture, mais décale la vitrine, qui consomme alors sa propre marge. La marge totale se partage entre les tâches d'un même chemin ; la marge libre appartient à la tâche seule.`,
        ];
      },
    },
    {
      id: "le-chemin-critique",
      objectifs: [2],
      type: "choix",
      titre: "Gagner du temps",
      notions: ["capacity", "productivity"],
      question: () => "La manager veut finir plus tôt. Sur quelle tâche gagner un quart d'heure raccourcit-il la réimplantation ?",
      options: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const b = x.pert.lignes.find((l) => l.code === "B")!;
        const e = x.pert.lignes.find((l) => l.code === "E")!;
        return [
          { texte: "Sur le rayonnage (B), qui est sur le chemin critique", juste: b.margeTotale === 0, retour: `Oui. Le chemin critique, ${x.pert.critique.join(", ")}, fixe la durée du projet ; gagner sur l'une de ses tâches avance la fin, tant qu'un autre chemin ne devient pas critique à son tour.` },
          { texte: "Sur les étiquettes (E) : c'est la tâche la plus longue", juste: false, retour: `Non : les étiquettes ont ${mn(e.margeTotale)} de marge ; les raccourcir ne change pas la fin. La plus longue tâche n'est pas forcément critique.` },
          { texte: "Sur n'importe laquelle : chaque minute gagnée avance la fin", juste: false, retour: "Non : seules les tâches du chemin critique fixent la fin. Gagner du temps ailleurs ne fait qu'agrandir une marge." },
        ];
      },
    },
    {
      id: "l-equipe-limitee",
      objectifs: [3],
      type: "montants",
      titre: "Le planning avec trois personnes",
      notions: ["capacity", "productivity"],
      tableau: tableauDuGantt,
      question: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return `Le réseau suppose qu'on a toujours assez de monde. Le lundi matin, la boutique a ${qte(EQUIPE_DU_MATIN.length)} personnes : la remise en rayon (F) en occupe ${qte(TACHES.find((t) => t.code === "F")!.personnes)} à elle seule. Le tableau donne le planning de Gantt quand chaque tâche démarre dès qu'il y a assez de monde, la moins libre d'abord. Lisez-y la fin de la réimplantation à ${qte(EQUIPE_DU_MATIN.length)} puis à ${qte(EQUIPE_DU_MATIN.length + 1)} personnes, en minutes depuis 7 h, et la marge qui reste avant l'ouverture à ${qte(EQUIPE_DU_MATIN.length)} personnes (${mn(x.minutesAvantLOuverture)} disponibles).`;
      },
      champs: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          { libelle: `Fin à ${qte(x.gantt3.personnes)} personnes (min)`, attendu: x.gantt3.fin, calcul: `${heureDe(x.gantt3.fin)}, soit ${mn(x.gantt3.fin)} : la signalétique (G) attend la fin de la remise en rayon, faute de quatrième personne` },
          { libelle: `Fin à ${qte(x.gantt4.personnes)} personnes (min)`, attendu: x.gantt4.fin, calcul: `${heureDe(x.gantt4.fin)}, soit ${mn(x.gantt4.fin)} : la durée du chemin critique` },
          { libelle: `Marge avant l'ouverture à ${qte(x.gantt3.personnes)} personnes (min)`, attendu: x.minutesAvantLOuverture - x.gantt3.fin, calcul: `${mn(x.minutesAvantLOuverture)} − ${mn(x.gantt3.fin)} = ${mn(x.minutesAvantLOuverture - x.gantt3.fin)}` },
        ];
      },
      explication: (c) => {
        const x = reimplantationDeLaBoutique(c);
        return [
          `À ${qte(x.gantt3.personnes)}, la réimplantation finit à ${heureDe(x.gantt3.fin)}, l'heure même de l'ouverture : aucune marge, le moindre retard ouvre la boutique en retard. La signalétique, qui avait ${mn(x.pert.lignes.find((l) => l.code === "G")!.margeTotale)} de marge sur le réseau, devient critique faute de monde. À ${qte(x.gantt4.personnes)}, on retrouve ${heureDe(x.gantt4.fin)} : ${mn(x.minutesAvantLOuverture - x.gantt4.fin)} d'avance.`,
        ];
      },
    },
    {
      id: "le-renfort",
      objectifs: [3],
      type: "choix",
      titre: "Qui vient en renfort ?",
      notions: ["productivity", "payroll"],
      question: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const s = x.renfort.salarie;
        return `La ${s.poste.toLowerCase()} travaille d'habitude le lundi après-midi. Elle pourrait venir de 7 h à ${heureDe(x.gantt4.fin)} à la place de ${x.renfort.creneaux[0]!.heure} h à ${heureDe(x.gantt4.fin, x.renfort.creneaux[0]!.heure)}. Le lundi, de ${x.renfort.creneaux[0]!.heure} h à ${x.renfort.creneaux.at(-1)!.heure + 1} h, le planning met ${qte(x.renfort.creneaux[0]!.presence)} vendeurs pour au plus ${qte(Math.max(...x.renfort.creneaux.map((k) => k.entrees)))} entrées par heure. Que décidez-vous ?`;
      },
      options: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const s = x.renfort.salarie;
        return [
          {
            texte: "Avancer ses heures du lundi, sans créneau sous le besoin",
            juste: x.renfort.toujoursCouvert,
            retour: `Oui. L'affluence du lundi après-midi ne demande que ${qte(x.renfort.creneaux[0]!.besoin)} vendeurs, le minimum de la boutique : déplacer ses heures ne coûte rien et ne laisse aucun créneau sous le besoin. Des heures en plus auraient coûté ${eur(Math.round(s.tauxHoraireCharge * 100) / 100)} chacune, au taux chargé de son contrat.`,
          },
          {
            texte: "Garder trois personnes : la réimplantation finit à l'heure",
            juste: false,
            retour: `À l'heure, mais sans aucune marge : un rayonnage qui résiste, et la boutique ouvre en retard le premier jour des soldes. Le renfort coûte moins que ce risque.`,
          },
          {
            texte: "Faire venir toute l'équipe : plus on est, plus on va vite",
            juste: false,
            retour: `Non : au-delà de ${qte(x.gantt4.personnes)} personnes, la fin ne bouge plus, elle est fixée par le chemin critique (${mn(x.pert.fin)}). Les heures en plus seraient payées pour attendre.`,
          },
        ];
      },
    },
    {
      id: "la-decision",
      objectifs: [1, 3],
      type: "choix",
      titre: "Le plan de réimplantation",
      notions: ["sales_per_sqm", "capacity"],
      question: () => "La manager présente son plan à la dirigeante. Lequel défendez-vous ?",
      options: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const r = reimplanter(x.f, x.solution.receveuse, x.solution.metres);
        return [
          {
            texte: `${qte(x.solution.metres)} m du bonnet au col rond, à ${qte(x.gantt4.personnes)} personnes dès 7 h`,
            juste: true,
            retour: `Oui : ${eur(r.effet)} de marge en plus par mois, et une réimplantation finie à ${heureDe(x.gantt4.fin)}, avec ${mn(x.minutesAvantLOuverture - x.gantt4.fin)} de marge avant l'ouverture. Prévoir le réassort du col rond : sa demande passe à ${qte(r.apresRecoit.demande)} pulls.`,
          },
          {
            texte: "Les mètres du bonnet au cardigan, la meilleure marge par mètre",
            juste: false,
            retour: `Non : le cardigan est en rupture ; un mètre de plus ne vend pas un pull de plus, et le bonnet perd ses ventes. Effet : ${eur(reimplanter(x.f, "cardigan", x.solution.metres).effet)}.`,
          },
          {
            texte: `Le même linéaire, mais à ${qte(x.gantt3.personnes)} personnes, pour ne pas toucher au planning`,
            juste: false,
            retour: `Le linéaire est bon, mais à ${qte(x.gantt3.personnes)} personnes la réimplantation finit à ${heureDe(x.gantt3.fin)}, sans marge. Déplacer les heures du lundi ne coûte rien.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["sales_per_sqm", "capacity", "productivity"],
      tableau: tableauDuGantt,
      texte: (c) => {
        const x = reimplantationDeLaBoutique(c);
        const r = reimplanter(x.f, x.solution.receveuse, x.solution.metres);
        return [
          `Le linéaire se mesure à ce qu'il rapporte : marge par mètre (${eur(x.bonnet.margeParMetre)} pour le bonnet, ${eur(x.colRond.margeParMetre)} pour le col rond), indices de sensibilité et de rentabilité (sous 1, la référence est surexposée). On le réalloue à la référence qui transforme un mètre en ventes et qui a le stock pour les servir : ${qte(x.solution.metres)} m au col rond font gagner ${eur(r.effet)} par mois ; au cardigan, en rupture, rien. En ligne, on range les références par marge par visite.`,
          `Un projet s'ordonnance par son réseau : dates au plus tôt et au plus tard, marges totale et libre, chemin critique (${x.pert.critique.join(", ")}, ${mn(x.pert.fin)}). Avec une équipe limitée, le planning de Gantt peut allonger le projet : à ${qte(x.gantt3.personnes)} personnes, ${heureDe(x.gantt3.fin)} ; à ${qte(x.gantt4.personnes)}, ${heureDe(x.gantt4.fin)}.`,
          "Au niveau de l'examen, vous savez mesurer la performance d'un linéaire, réimplanter en tenant compte des stocks, ordonner une vitrine en ligne, construire un réseau PERT et en lire le chemin critique et les marges, et affecter une équipe limitée.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Marge par mètre = marge ÷ linéaire. Indice de rentabilité = part de la marge ÷ part du linéaire. Marge totale = début au plus tard − début au plus tôt ; marge libre = début au plus tôt du suivant − fin au plus tôt de la tâche.",
    },
  ],
};
