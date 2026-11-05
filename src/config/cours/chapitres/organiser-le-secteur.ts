import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  CALENDRIER_DU_COMMERCIAL,
  CARTE_DU_SECTEUR,
  FREQUENCE_DE_VISITE,
  PROSPECTS_A_VOIR,
  ROUTE,
  VISITE_A_DISTANCE,
  chargeDeVisites,
  classesDuCommercial,
  coutDUneVisite,
  joursDeTerrain,
  tourneesDuSecteur,
  visitesDesComptesC,
} from "../monde/terrain-d-atlas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VALEUR, POURQUOI_LE_CABINET, ficheDe } from "./valeur-d-un-client";

/**
 * CHAPITRE : ORGANISER LE SECTEUR : VISITES, TEMPS ET TOURNÉES (BTS NDRC, bloc 1, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le cabinet ATLAS
 * CONSEIL a une fiche figée (monde/atlas-conseil.ts), et le calendrier, les visites et les tournées de
 * Nadia, la commerciale des entreprises, se calculent par monde/terrain-d-atlas.ts, partie 3.
 *
 * L'objet : le temps d'un commercial est la ressource rare. Ses jours de terrain et ce qu'ils permettent
 * de visites ; la charge de visites de son portefeuille, classe ABC par classe ABC ; ce qui reste pour
 * les prospects que la direction veut lui faire voir ; ce que coûte une visite, et ce qu'en économise
 * vraiment une de moins ; deux tournées comparées sur la carte de son secteur. La décision : moins
 * visiter les comptes C, ou les visiter à distance.
 *
 * Le piège central : le coût d'une visite. Les visites des comptes C coûtent 11 200 € au calcul, 30 % de
 * leur marge ; mais le salaire de la commerciale est payé de toute façon : une visite en moins n'économise
 * que sa route. Ce qu'elle libère, c'est du temps, qui ne vaut que s'il sert à autre chose.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, les-jours-de-terrain, la-charge-de-visites, le-cout-d-une-visite ;
 *   · l'expérience avant la formule : predire-la-distance puis le-laboratoire-du-secteur (la fréquence des
 *     comptes C et la part des visites faites à distance, avec le graphique des visites pour les prospects)
 *     avant les-deux-solutions ;
 *   · autonome : les-deux-solutions, la-tournee ;
 *   · expert : ce-qu-economise-une-visite (le jugement), la-meilleure-tournee, la-decision ; puis la synthèse.
 */

/** Les leviers du laboratoire : la fréquence de visite d'un compte C (par an) et la part de ses visites faites à distance (%). */
export const LEVIERS_DU_SECTEUR = {
  frequenceC: { min: 0, max: 6, pas: 1 },
  distance: { min: 0, max: 100, pas: 25 },
} as const;

/** LA RÉDUCTION ENVISAGÉE, hypothèse du cours : voir les comptes C deux fois par an, sur place, au lieu de quatre. */
export const FREQUENCE_C_REDUITE = 2;

/** Le secteur se lit sur les comptes et les commerciaux du cabinet du cours, ATLAS CONSEIL. */
export const ENTREPRISES_DU_SECTEUR: readonly string[] = ENTREPRISES_DE_LA_VALEUR;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number, d = 1) => `${(Math.round(x * 100 * 10 ** d) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auCentiemeDePct = (x: number) => Math.round(x * 10_000) / 100 + 0;
const heures = (h: number) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
};

/** Le secteur de la commerciale des entreprises : tout ce que le chapitre et son cas demandent. */
export function secteurDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const nadia = f.commerciaux.find((k) => k.code === "entreprises")!;
  const j = joursDeTerrain();
  const k = classesDuCommercial(f, "entreprises");
  const v = chargeDeVisites(f);
  const u = coutDUneVisite(f);
  const vc = visitesDesComptesC(f);
  const reduite = chargeDeVisites(f, "entreprises", { frequenceC: FREQUENCE_C_REDUITE });
  const aDistance = chargeDeVisites(f, "entreprises", { partDesCADistance: 1 });
  const t = tourneesDuSecteur();
  const nom = (code: string) => CARTE_DU_SECTEUR.points.find((p) => p.code === code)!.nom;
  return { f, nadia, j, k, v, u, vc, reduite, aDistance, t, nom, prospects: PROSPECTS_A_VOIR };
}

export type SecteurDuCabinet = ReturnType<typeof secteurDuCabinet>;

/** Le secteur pour une fréquence des comptes C et une part de leurs visites à distance (en %). */
export function laboratoireDuSecteur(x: SecteurDuCabinet, frequenceC: number, distanceEnPct: number) {
  const v = chargeDeVisites(x.f, "entreprises", { frequenceC, partDesCADistance: distanceEnPct / 100 });
  return { suivi: v.suiviEnTemps, charge: v.charge, reste: v.reste, cADistance: v.cADistance, fraisDeRouteEvites: auCentime((x.v.visitesC - v.cSurPlace) * x.u.route) };
}

/** Le portefeuille de la commerciale par classe : le document de départ. */
function tableauDesClasses(x: SecteurDuCabinet): TableauDeDonnees {
  return {
    titre: `Les comptes de ${x.nadia.prenom}, par classe ABC`,
    colonnes: ["Comptes", "Visites par an", "Marge des comptes"],
    lignes: (["A", "B", "C"] as const).map((cl) => ({
      libelle: `Classe ${cl}`,
      valeurs: [qte(x.k[cl].length), qte(FREQUENCE_DE_VISITE[cl]), eur(x.k[cl].reduce((s, c) => s + c.marge, 0))],
    })),
  };
}

/** Les distances du sud du secteur : le document des tournées. */
function tableauDesDistances(x: SecteurDuCabinet): TableauDeDonnees {
  const paires = Object.entries(CARTE_DU_SECTEUR.distances).map(([cle, km]) => {
    const [a, b] = cle.split("-") as [string, string];
    return { libelle: `${x.nom(a)} et ${x.nom(b)}`, valeurs: [`${qte(km)} km`] };
  });
  return { titre: "Les distances du sud du secteur, par la route", colonnes: ["Distance"], lignes: paires };
}

const ordreEcrit = (x: SecteurDuCabinet, ordre: readonly string[]) => ordre.map((c) => x.nom(c)).join(", puis ");

export const ORGANISER_LE_SECTEUR: Chapitre = {
  code: "organiser-le-secteur",
  parcours: "ndrc",
  palier: 4,
  blocs: ["BTS NDRC Bloc 1 · Relation client et négociation-vente"],
  titre: "Organiser le secteur : visites, temps et tournées",
  accroche:
    "Le temps d'un commercial est sa ressource rare. Ses jours de terrain, la charge de visites de ses comptes, ce qui reste pour les prospects, ce que coûte une visite, et la tournée la plus courte.",
  objectifs: [
    "Calculer les jours de terrain et la capacité de visites d'un commercial",
    "Mesurer la charge de visites d'un portefeuille selon la fréquence de chaque classe",
    "Calculer le coût d'une visite et ce qu'économise vraiment une visite en moins",
    "Comparer deux tournées sur une carte de secteur",
    "Choisir entre moins de visites et la visite à distance pour libérer du temps de prospection",
  ],
  libre: false,
  prerequis: ["portefeuille-abc", "le-fichier-et-la-cible"],
  entreprises: { codes: ENTREPRISES_DU_SECTEUR, pourquoi: POURQUOI_LE_CABINET },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le secteur de la commerciale",
      notions: ["customer_portfolio", "capacity"],
      tableau: (c) => tableauDesClasses(secteurDuCabinet(c)),
      texte: (c) => {
        const x = secteurDuCabinet(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}. ${x.nadia.prenom}, la commerciale des entreprises, suit ${qte(x.k.comptes.length)} comptes. Le cabinet fixe la fréquence de ses visites de suivi par la classe ABC du compte : chaque mois pour un A, tous les 2 mois pour un B, chaque trimestre pour un C.`,
          `S'y ajoutent ses rendez-vous d'affaires, ceux du tableau de bord qui mènent aux devis : ${qte(x.v.rendezVousDAffaires)} en N. Pour N + 1, la direction veut qu'elle rencontre aussi ${qte(x.prospects)} PME moyennes du fichier qualifié.`,
          `La simulation suppose qu'un jour de terrain permet ${qte(x.j.visitesParJour)} visites, sur un secteur où l'on roule entre deux clients. Une visite à distance, en visioconférence, prend le quart du temps d'une visite sur place et ne coûte aucun frais de route.`,
        ];
      },
      repere: () => "Capacité de visites = jours de terrain × visites par jour. Charge = comptes × fréquence, classe par classe, plus les rendez-vous d'affaires.",
    },
    {
      id: "les-jours-de-terrain",
      objectifs: [0],
      type: "montants",
      titre: "Les jours de terrain",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const x = secteurDuCabinet(c);
        const k = CALENDRIER_DU_COMMERCIAL;
        return `L'année compte ${qte(k.jours)} jours, dont ${qte(k.weekEnds)} de week-end ; ${x.nadia.prenom} a ${qte(k.congesPayes)} jours de congés payés, et ${qte(k.feriesEnSemaine)} jours fériés tombent en semaine. Des jours ouvrés, elle passe ${qte(k.formation)} jours en formation, ${qte(k.bureau)} au bureau et ${qte(k.salons)} sur les salons. Calculez ses jours ouvrés, ses jours de terrain, puis sa capacité de visites.`;
      },
      champs: (c) => {
        const x = secteurDuCabinet(c);
        const j = x.j;
        return [
          { libelle: "Jours ouvrés", attendu: j.ouvres, calcul: `${qte(j.jours)} − ${qte(j.weekEnds)} − ${qte(j.congesPayes)} − ${qte(j.feriesEnSemaine)} = ${qte(j.ouvres)} jours` },
          { libelle: "Jours de terrain", attendu: j.terrain, calcul: `${qte(j.ouvres)} − ${qte(j.formation)} − ${qte(j.bureau)} − ${qte(j.salons)} = ${qte(j.terrain)} jours` },
          { libelle: "Capacité de visites de l'année", attendu: j.capacite, calcul: `${qte(j.terrain)} × ${qte(j.visitesParJour)} = ${qte(j.capacite)} visites` },
        ];
      },
      explication: (c) => {
        const x = secteurDuCabinet(c);
        return [
          `Sur ${qte(x.j.jours)} jours, ${x.nadia.prenom} n'en passe que ${qte(x.j.terrain)} chez les clients : ${pct(x.j.terrain / x.j.jours, 0)} de l'année. Chaque jour de bureau en plus retire ${qte(x.j.visitesParJour)} visites à sa capacité.`,
        ];
      },
    },
    {
      id: "la-charge-de-visites",
      objectifs: [1],
      type: "montants",
      titre: "La charge de visites",
      notions: ["capacity", "customer_portfolio"],
      tableau: (c) => tableauDesClasses(secteurDuCabinet(c)),
      question: (c) => {
        const x = secteurDuCabinet(c);
        return `Calculez les visites de suivi de l'année, classe par classe, puis la charge totale, avec les ${qte(x.v.rendezVousDAffaires)} rendez-vous d'affaires, et les visites qui restent sur la capacité de ${qte(x.j.capacite)} visites.`;
      },
      champs: (c) => {
        const x = secteurDuCabinet(c);
        const v = x.v;
        return [
          {
            libelle: "Visites de suivi de l'année",
            attendu: v.suivi,
            calcul: `${qte(v.comptesA)} × ${qte(v.frequenceA)} + ${qte(v.comptesB)} × ${qte(v.frequenceB)} + ${qte(v.comptesC)} × ${qte(v.frequenceC)} = ${qte(v.visitesA)} + ${qte(v.visitesB)} + ${qte(v.visitesC)} = ${qte(v.suivi)} visites`,
          },
          { libelle: "Charge de visites", attendu: v.charge, calcul: `${qte(v.suivi)} + ${qte(v.rendezVousDAffaires)} = ${qte(v.charge)} visites` },
          { libelle: "Visites qui restent pour la prospection", attendu: v.reste, calcul: `${qte(v.capacite)} − ${qte(v.charge)} = ${qte(v.reste)} visites` },
        ];
      },
      explication: (c) => {
        const x = secteurDuCabinet(c);
        return [
          `Il reste ${qte(x.v.reste)} visites pour les ${qte(x.prospects)} prospects que veut la direction. Les ${qte(x.v.comptesC)} comptes C prennent à eux seuls ${qte(x.v.visitesC)} visites de suivi, plus que les comptes A (${qte(x.v.visitesA)}).`,
        ];
      },
    },
    {
      id: "le-cout-d-une-visite",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte une visite",
      notions: ["fixed_costs", "productivity"],
      question: (c) => {
        const x = secteurDuCabinet(c);
        return `${x.nadia.prenom} coûte ${eur(x.nadia.salaireCharge)} de salaire chargé et ${eur(x.nadia.frais)} de frais (la voiture, la route, le téléphone) par trimestre. Ses ${qte(x.u.visites)} visites de l'année se font toutes sur place. Calculez son coût annuel, le coût d'une visite, le coût des visites des comptes C, puis leur part dans la marge des comptes C (en %, au centième).`;
      },
      champs: (c) => {
        const x = secteurDuCabinet(c);
        const u = x.u;
        return [
          { libelle: "Coût annuel de la commerciale", attendu: u.coutAnnuel, calcul: `(${eur(x.nadia.salaireCharge)} + ${eur(x.nadia.frais)}) × 4 = ${eur(u.coutAnnuel)}` },
          { libelle: "Coût d'une visite", attendu: u.cout, calcul: `${eur(u.coutAnnuel)} ÷ ${qte(u.visites)} = ${eur(u.cout)}` },
          { libelle: "Coût des visites des comptes C", attendu: x.vc.cout, calcul: `${qte(x.vc.visites)} × ${eur(u.cout)} = ${eur(x.vc.cout)}` },
          { libelle: "Part de la marge des comptes C (%)", attendu: auCentiemeDePct(x.vc.part), tolerance: 0.05, calcul: `${eur(x.vc.cout)} ÷ ${eur(x.vc.marge)} = ${pct(x.vc.part, 2)}` },
        ];
      },
      explication: (c) => {
        const x = secteurDuCabinet(c);
        return [
          `Une visite coûte ${eur(x.u.cout)} : ${eur(x.u.temps)} de temps (le salaire) et ${eur(x.u.route)} de route (les frais). Les visites prennent ${pct(x.vc.part, 0)} de la marge des comptes C.`,
          "Ce coût est une moyenne : il répartit sur les visites un salaire et des frais. Il ne dit pas encore ce qu'une visite en moins ferait gagner.",
        ];
      },
    },
    {
      id: "ce-qu-economise-une-visite",
      objectifs: [2],
      type: "choix",
      titre: "Ce qu'économise une visite en moins",
      notions: ["fixed_costs", "variable_costs"],
      question: (c) => {
        const x = secteurDuCabinet(c);
        return `Le directeur lit le calcul : « Si ${x.nadia.prenom} cessait de visiter les comptes C, nous économiserions ${eur(x.vc.cout)}. » Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = secteurDuCabinet(c);
        return [
          {
            texte: `Non : ${eur(x.vc.fraisDeRoute)} de route, le salaire reste payé`,
            juste: true,
            retour: `Oui : son salaire est payé quelles que soient ses visites. Seuls les frais de route disparaissent, ${eur(x.vc.fraisDeRoute)}. Ce que libèrent ces visites, c'est du temps : ${qte(x.vc.visites)} visites qu'elle peut faire ailleurs.`,
          },
          {
            texte: `Oui : ${qte(x.vc.visites)} visites à ${eur(x.u.cout)}, c'est bien ${eur(x.vc.cout)} de moins`,
            juste: false,
            retour: `Non : le coût d'une visite répartit un salaire qui ne baisse pas. Une visite en moins n'économise que sa route, ${eur(x.u.route)}.`,
          },
          {
            texte: `Oui, et même plus : les comptes C laissent ${eur(x.vc.marge)} qu'on ne servirait plus`,
            juste: false,
            retour: `Non : sans visites, des comptes C partiraient, et leur marge avec eux. Cesser de les voir ne fait rien gagner de ce côté.`,
          },
        ];
      },
    },
    {
      id: "predire-la-distance",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur le temps libéré",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const x = secteurDuCabinet(c);
        return `Avant de calculer, pariez. Pour libérer du temps, ${x.nadia.prenom} peut voir les comptes C ${qte(FREQUENCE_C_REDUITE)} fois par an sur place, ou garder ${qte(FREQUENCE_DE_VISITE.C)} visites par an, mais à distance. Laquelle des deux libère le plus de visites ?`;
      },
      options: () => {
        const voir = "Le laboratoire suivant fait varier la fréquence et la part des visites à distance : lisez ce qui reste pour les prospects.";
        return [
          { texte: "Les visites à distance", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Moins de visites sur place", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Les deux libèrent autant", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-secteur",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du secteur",
      notions: ["capacity", "productivity", "customer_portfolio"],
      question: (c) => {
        const x = secteurDuCabinet(c);
        return `Faites varier la fréquence de visite d'un compte C, de zéro à ${qte(LEVIERS_DU_SECTEUR.frequenceC.max)} par an, et la part de ses visites faites à distance. Les comptes A et B gardent leur fréquence. Le tableau suit la charge de ${x.nadia.prenom} et les visites qui restent pour ses ${qte(x.prospects)} prospects.`;
      },
      leviers: (c) => {
        const x = secteurDuCabinet(c);
        const l = LEVIERS_DU_SECTEUR;
        return [
          { code: "frequenceC", libelle: "Visites par an d'un compte C", unite: "visites", min: l.frequenceC.min, max: l.frequenceC.max, pas: l.frequenceC.pas, depart: x.v.frequenceC },
          { code: "distance", libelle: "Visites des C faites à distance", unite: "%", min: l.distance.min, max: l.distance.max, pas: l.distance.pas, depart: 0 },
        ];
      },
      lecture: (c, p) => {
        const x = secteurDuCabinet(c);
        const l = laboratoireDuSecteur(x, p.frequenceC!, p.distance!);
        const d = laboratoireDuSecteur(x, x.v.frequenceC, 0);
        return [
          { libelle: "Visites de suivi, en temps de visite sur place", montant: l.suivi, reference: d.suivi, unite: "visites" },
          { libelle: "Charge de visites", montant: l.charge, reference: d.charge, unite: "visites" },
          { libelle: "Frais de route évités", montant: l.fraisDeRouteEvites, reference: d.fraisDeRouteEvites, effet: true },
          { libelle: "Visites qui restent pour les prospects", montant: l.reste, reference: d.reste, unite: "visites", fort: true },
        ];
      },
      graphique: (c) => {
        const x = secteurDuCabinet(c);
        return {
          levier: "distance",
          unite: "visites",
          courbes: [
            { libelle: "Visites qui restent pour les prospects", valeur: (p) => laboratoireDuSecteur(x, p.frequenceC!, p.distance!).reste },
            { libelle: "Prospects à voir", valeur: () => x.prospects },
          ],
        };
      },
      defi: (c) => {
        const x = secteurDuCabinet(c);
        return {
          consigne: `Libérez de quoi voir les ${qte(x.prospects)} prospects, sans voir un compte C moins d'une fois par trimestre.`,
          atteint: (p) => p.frequenceC! >= FREQUENCE_DE_VISITE.C && laboratoireDuSecteur(x, p.frequenceC!, p.distance!).reste >= x.prospects - 1e-9,
          indice: (p) => {
            const l = laboratoireDuSecteur(x, p.frequenceC!, p.distance!);
            return p.frequenceC! < FREQUENCE_DE_VISITE.C
              ? "Un compte C doit être vu au moins une fois par trimestre : remontez sa fréquence, et jouez sur la distance."
              : `Il manque encore ${qte(auCentime(x.prospects - l.reste))} visites : faites plus de visites des C à distance.`;
          },
          solution: { frequenceC: FREQUENCE_DE_VISITE.C, distance: 100 },
        };
      },
      explication: (c) => {
        const x = secteurDuCabinet(c);
        return [
          `Toutes les visites des C à distance, ${x.nadia.prenom} garde ses ${qte(x.v.visitesC)} rendez-vous de suivi et retrouve ${qte(x.aDistance.reste)} visites pour les prospects. Voir les C ${qte(FREQUENCE_C_REDUITE)} fois par an sur place n'en laisserait que ${qte(x.reduite.reste)}.`,
          `Une visite à distance garde le contact pour le quart du temps : elle rend ${pct(1 - VISITE_A_DISTANCE.partDuTemps, 0)} du temps d'une visite, et le client ne perd pas son rendez-vous.`,
        ];
      },
    },
    {
      id: "les-deux-solutions",
      objectifs: [4],
      type: "montants",
      titre: "Les deux façons de libérer du temps",
      notions: ["capacity", "productivity"],
      question: () => {
        return `Sans formule cette fois. Calculez les visites libérées si les comptes C sont vus ${qte(FREQUENCE_C_REDUITE)} fois par an sur place, puis les visites qui restent pour les prospects ; faites de même s'ils sont vus ${qte(FREQUENCE_DE_VISITE.C)} fois par an, à distance.`;
      },
      champs: (c) => {
        const x = secteurDuCabinet(c);
        const libereReduite = x.v.charge - x.reduite.charge;
        const libereDistance = x.v.charge - x.aDistance.charge;
        return [
          { libelle: "Visites libérées, moins de visites", attendu: libereReduite, calcul: `${qte(x.v.comptesC)} × (${qte(FREQUENCE_DE_VISITE.C)} − ${qte(FREQUENCE_C_REDUITE)}) = ${qte(libereReduite)} visites` },
          { libelle: "Visites pour les prospects, moins de visites", attendu: x.reduite.reste, calcul: `${qte(x.v.reste)} + ${qte(libereReduite)} = ${qte(x.reduite.reste)} visites` },
          {
            libelle: "Visites libérées, visites à distance",
            attendu: libereDistance,
            calcul: `${qte(x.v.visitesC)} × (1 − ${pct(VISITE_A_DISTANCE.partDuTemps, 0)}) = ${qte(libereDistance)} visites`,
          },
          { libelle: "Visites pour les prospects, visites à distance", attendu: x.aDistance.reste, calcul: `${qte(x.v.reste)} + ${qte(libereDistance)} = ${qte(x.aDistance.reste)} visites` },
        ];
      },
      explication: (c) => {
        const x = secteurDuCabinet(c);
        return [
          `Moins de visites laisse ${qte(x.reduite.reste)} visites, sous les ${qte(x.prospects)} prospects ; les visites à distance en laissent ${qte(x.aDistance.reste)}, assez. Et à distance, les ${qte(x.v.visitesC)} rendez-vous de suivi se font toujours : les comptes C ne se sentent pas lâchés.`,
          `Les frais de route évités sont les mêmes que si on cessait de les voir : ${eur(x.vc.fraisDeRoute)}.`,
        ];
      },
    },
    {
      id: "la-tournee",
      objectifs: [3],
      type: "montants",
      titre: "La tournée du sud du secteur",
      notions: ["productivity", "variable_costs"],
      tableau: (c) => tableauDesDistances(secteurDuCabinet(c)),
      question: (c) => {
        const x = secteurDuCabinet(c);
        const m = x.t.meilleure;
        return `Chaque trimestre, ${x.nadia.prenom} voit dans la même journée ${qte(x.t.agenda.ordre.length)} comptes du sud du secteur. Son agenda les a placés dans l'ordre de leurs rendez-vous : ${ordreEcrit(x, x.t.agenda.ordre)}, en partant du bureau et en y revenant. Calculez les kilomètres de cette tournée, puis ceux de la tournée ${ordreEcrit(x, m.ordre)}. À ${qte(ROUTE.vitesse)} km/h, calculez les heures de route de chacune, puis ce que la plus courte fait économiser de route, à ${eur(ROUTE.coutDuKilometre)} le kilomètre.`;
      },
      champs: (c) => {
        const x = secteurDuCabinet(c);
        const a = x.t.agenda;
        const m = x.t.meilleure;
        return [
          { libelle: "Kilomètres de la tournée de l'agenda", attendu: a.km, calcul: `${a.troncons.map((t) => qte(t.km)).join(" + ")} = ${qte(a.km)} km` },
          { libelle: "Kilomètres de l'autre tournée", attendu: m.km, calcul: `${m.troncons.map((t) => qte(t.km)).join(" + ")} = ${qte(m.km)} km` },
          { libelle: "Heures de route, tournée de l'agenda", attendu: auCentime(a.heuresDeRoute), tolerance: 0.05, calcul: `${qte(a.km)} ÷ ${qte(ROUTE.vitesse)} = ${qte(auCentime(a.heuresDeRoute))} h, soit ${heures(a.heuresDeRoute)}` },
          { libelle: "Heures de route, autre tournée", attendu: auCentime(m.heuresDeRoute), tolerance: 0.05, calcul: `${qte(m.km)} ÷ ${qte(ROUTE.vitesse)} = ${qte(auCentime(m.heuresDeRoute))} h, soit ${heures(m.heuresDeRoute)}` },
          { libelle: "Route économisée par tournée", attendu: x.t.coutEvite, calcul: `(${qte(a.km)} − ${qte(m.km)}) × ${eur(ROUTE.coutDuKilometre)} = ${eur(x.t.coutEvite)}` },
        ];
      },
      explication: (c) => {
        const x = secteurDuCabinet(c);
        return [
          `L'ordre des rendez-vous n'est pas l'ordre de la route : la même journée fait ${qte(x.t.kmEvites)} km de moins, soit ${heures(x.t.agenda.heuresDeRoute - x.t.meilleure.heuresDeRoute)} de volant rendues. Sur les 4 tournées de l'année, cela fait ${eur(x.t.coutEvite * 4)} de route et ${heures((x.t.agenda.heuresDeRoute - x.t.meilleure.heuresDeRoute) * 4)} de temps.`,
          "Un plan de tournée se trace sur la carte avant de fixer les rendez-vous : on propose au client le créneau qui suit la route, pas l'inverse.",
        ];
      },
    },
    {
      id: "la-meilleure-tournee",
      objectifs: [3],
      type: "choix",
      titre: "La tournée à proposer",
      notions: ["productivity"],
      tableau: (c) => tableauDesDistances(secteurDuCabinet(c)),
      question: (c) => {
        const x = secteurDuCabinet(c);
        return `${x.nadia.prenom} reprend son agenda du prochain trimestre. Dans quel ordre doit-elle proposer les rendez-vous, en partant du bureau ?`;
      },
      options: (c) => {
        const x = secteurDuCabinet(c);
        const [plusLongue] = [...x.t.toutes].sort((a, b) => b.km - a.km);
        return [
          { texte: ordreEcrit(x, x.t.meilleure.ordre), juste: true, retour: `Oui : ${qte(x.t.meilleure.km)} km, la tournée la plus courte. L'ordre inverse fait les mêmes kilomètres.` },
          { texte: `${ordreEcrit(x, x.t.agenda.ordre)}, l'ordre de l'agenda`, juste: false, retour: `Non : ${qte(x.t.agenda.km)} km. L'ordre où les clients ont pris rendez-vous ne suit pas la route.` },
          { texte: `${ordreEcrit(x, plusLongue!.ordre)}, le plus loin d'abord`, juste: false, retour: `Non : ${qte(plusLongue!.km)} km. Aller d'abord au plus loin fait revenir sur ses pas.` },
        ];
      },
    },
    {
      id: "la-decision",
      objectifs: [4],
      type: "choix",
      titre: "Libérer du temps pour les prospects",
      notions: ["capacity", "customer_portfolio"],
      question: (c) => {
        const x = secteurDuCabinet(c);
        return `Le directeur demande comment ${x.nadia.prenom} peut voir ses ${qte(x.prospects)} prospects en N + 1. Que lui proposez-vous ?`;
      },
      options: (c) => {
        const x = secteurDuCabinet(c);
        return [
          {
            texte: "Voir les comptes C chaque trimestre, à distance",
            juste: true,
            retour: `Oui : il reste ${qte(x.aDistance.reste)} visites pour les prospects, les comptes C gardent leur rendez-vous trimestriel, et ${eur(x.vc.fraisDeRoute)} de route sont évités.`,
          },
          {
            texte: `Voir les comptes C ${qte(FREQUENCE_C_REDUITE)} fois par an seulement, sur place`,
            juste: false,
            retour: `Non : il ne resterait que ${qte(x.reduite.reste)} visites pour ${qte(x.prospects)} prospects, et les comptes C, déjà les plus à risque, seraient vus moitié moins.`,
          },
          {
            texte: `Ne plus voir les comptes C : leurs visites coûtent ${eur(x.vc.cout)}`,
            juste: false,
            retour: `Non : le salaire ne baisse pas, seule la route est évitée ; et sans suivi, des comptes C partiraient avec leurs ${eur(x.vc.marge)} de marge.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "productivity", "customer_portfolio"],
      tableau: (c) => {
        const x = secteurDuCabinet(c);
        return {
          titre: `Le temps de ${x.nadia.prenom}, selon la façon de suivre les comptes C`,
          colonnes: ["Charge", "Pour les prospects"],
          lignes: [
            { libelle: `En N, ${qte(FREQUENCE_DE_VISITE.C)} visites sur place`, valeurs: [qte(x.v.charge), qte(x.v.reste)] },
            { libelle: `${qte(FREQUENCE_C_REDUITE)} visites sur place`, valeurs: [qte(x.reduite.charge), qte(x.reduite.reste)] },
            { libelle: `${qte(FREQUENCE_DE_VISITE.C)} visites à distance`, valeurs: [qte(x.aDistance.charge), qte(x.aDistance.reste)] },
          ],
        };
      },
      texte: (c) => {
        const x = secteurDuCabinet(c);
        return [
          `Un commercial a ${qte(x.j.terrain)} jours de terrain, pas ${qte(x.j.ouvres)} : sa capacité de visites se compte sur eux. La charge de son portefeuille se mesure classe par classe, et ce qui reste va aux prospects.`,
          `Le coût d'une visite, ${eur(x.u.cout)}, répartit un salaire payé de toute façon : une visite en moins n'économise que sa route. Elle libère du temps, qui ne vaut que s'il sert. La visite à distance garde le client et rend du temps ; une tournée tracée sur la carte rend des kilomètres.`,
          "Au niveau de l'examen, vous savez calculer des jours de terrain et une capacité de visites, la charge d'un portefeuille, le coût d'une visite et ce qu'elle économise vraiment, comparer des tournées, et choisir comment libérer du temps de prospection.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Coût d'une visite = coût annuel du commercial ÷ visites de l'année. Une visite en moins n'économise que ses frais de route : le temps libéré vaut ce qu'on en fait.",
    },
  ],
};
