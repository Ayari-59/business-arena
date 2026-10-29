import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { ENDETTEMENT_MAXIMAL } from "../financement";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, bilanDuLycee, compteDuLycee, exerciceDe } from "../monde/comptes-du-lycee";
import type { Chapitre } from "../types";
import { rentabilite } from "./rentabilite";

/**
 * CHAPITRE : FINANCER L'ENTREPRISE (Bac STMG, gestion et finance, palier 1).
 *
 * Pour acheter un nouvel équipement, l'entreprise a trois sources : ce que son activité dégage
 * (l'autofinancement, mesuré par la capacité d'autofinancement), un emprunt, ou un apport de ses
 * associés. Le chapitre calcule la capacité d'autofinancement de l'année, voit si elle suffit,
 * chiffre ce que coûterait un emprunt et ce qu'il ferait à l'endettement, choisit, puis fait
 * l'expérience : un curseur sur le prix de l'équipement (jusqu'où l'autofinancement suffit-il ?) et
 * un laboratoire du financement (le prix et la source : financer au moins 150 000 € sans faire appel
 * aux associés, dans la règle de prudence des banques).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le premier exercice de NOVA (monde/comptes-du-lycee.ts) ;
 * l'équipement est une deuxième ligne du modèle de la première (la fiche de l'exercice), le taux
 * celui de son emprunt. Le seuil d'endettement raisonnable est posé et justifié dans
 * `financement.ts`. HYPOTHÈSE : la capacité d'autofinancement de l'année est l'argent que l'activité
 * met à disposition pour investir ; un emprunt nouveau se compte en entier la première année.
 */

/** Les bornes du curseur du prix de l'équipement, en euros. */
export const PRIX_DU_CURSEUR = { min: 0, max: 200_000 } as const;

/** Les leviers du laboratoire : le prix de l'équipement, et sa source de financement. */
export const LEVIERS_DU_FINANCEMENT = { prix: { min: 20_000, max: 200_000, pas: 10_000 } } as const;

/** Le défi du laboratoire : un équipement d'au moins 150 000 €, sans apport des associés. */
export const PRIX_DU_DEFI = 150_000;

export type Financement = "autofinancement" | "emprunt" | "apport";

/** Les sources de financement, dans l'ordre du levier à choix du laboratoire. */
export const SOURCES: readonly Financement[] = ["autofinancement", "emprunt", "apport"];

/** La solution que montre la correction : 150 000 €, empruntés. */
export const SOLUTION_DU_FINANCEMENT = { prix: PRIX_DU_DEFI, source: SOURCES.indexOf("emprunt") } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** L'équipement à financer, ce que l'entreprise dégage, et ce que coûterait de l'emprunter. */
export function financer(c: Pick<Cas, "code">) {
  const f = exerciceDe(c.code);
  const k = compteDuLycee(f);
  const b = bilanDuLycee(f);
  const montant = f.equipement.ht;
  const caf = k.caf;
  const emprunts = b.poste("emprunt");
  const endettementApres = auCentieme((emprunts + montant) / b.capitauxPropres);
  const choix: Financement = caf >= montant ? "autofinancement" : endettementApres <= ENDETTEMENT_MAXIMAL ? "emprunt" : "apport";
  return {
    f,
    entreprise: f.entreprise,
    equipement: f.equipement.designation,
    montant,
    resultatNet: k.resultatNet,
    dotation: k.dotations,
    caf,
    capitauxPropres: b.capitauxPropres,
    emprunts,
    taux: f.pret.tauxAnnuel,
    tauxDeLEmprunt: auDixieme(f.pret.tauxAnnuel * 100),
    interets: auCentime(montant * f.pret.tauxAnnuel),
    endettementAvant: auCentieme(emprunts / b.capitauxPropres),
    endettementApres,
    maximal: ENDETTEMENT_MAXIMAL,
    // La rentabilité de l'activité, celle du chapitre « La rentabilité » : un emprunt n'enrichit
    // les associés que si l'activité rapporte plus que l'emprunt ne coûte.
    economique: rentabilite(c).economique,
    choix,
  };
}

export type Financer = ReturnType<typeof financer>;

/** Le prix le plus haut que la capacité d'autofinancement de l'année paie seule. */
export const prixAutofinance = (k: Financer) => Math.floor(k.caf + 1e-9);

/** Une position du laboratoire : le prix, et la source (0 autofinancement, 1 emprunt, 2 apport). */
export function financementDuLaboratoire(k: Financer, p: Readonly<Record<string, number>>) {
  const source = SOURCES[p.source!]!;
  const prix = p.prix!;
  const autofinance = source === "autofinancement" ? Math.min(prix, k.caf) : 0;
  const emprunte = source === "emprunt" ? prix : 0;
  const apporte = source === "apport" ? prix : 0;
  const capitauxPropres = auCentime(k.capitauxPropres + apporte);
  return {
    source,
    prix,
    autofinance: auCentime(autofinance),
    emprunte,
    apporte,
    manque: source === "autofinancement" ? auCentime(Math.max(0, prix - k.caf)) : 0,
    interets: auCentime(emprunte * k.taux),
    endettement: auCentieme((k.emprunts + emprunte) / capitauxPropres),
  };
}

export const FINANCER_L_ENTREPRISE: Chapitre = {
  code: "financer-l-entreprise",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 4 · Temps et risque",
    "STMG Thème 3 · Accompagner la prise de décision",
    "BUT GACO · Entreprendre dans un contexte de reprise ou de création d'organisation",
  ],
  titre: "Financer l'entreprise : autofinancement ou emprunt",
  accroche:
    "Un nouvel équipement à payer : avec ce que l'activité dégage, avec l'argent de la banque, ou avec celui des associés ? Ce que chaque solution coûte, et ce qu'elle change.",
  objectifs: [
    "Calculer la capacité d'autofinancement",
    "Dire si l'entreprise peut s'autofinancer",
    "Chiffrer le coût d'un emprunt et son effet sur l'endettement",
    "Choisir un mode de financement selon le montant à financer",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le financement se décide ici sur le premier exercice de NOVA dans la simulation du cours, son compte de résultat et son bilan ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois façons de payer",
      notions: ["frng"],
      texte: (c) => {
        const k = financer(c);
        return [
          `${k.entreprise} veut une deuxième ligne de montage, du même modèle que la première : « ${k.equipement} », ${eur(k.montant)} hors taxes. Trois sources peuvent la payer.`,
          "L'autofinancement : l'argent que l'activité a dégagé dans l'année et que l'entreprise garde. L'emprunt : l'argent de la banque, à rembourser avec des intérêts. L'apport : de l'argent nouveau mis par les associés, qui deviennent plus engagés dans l'entreprise.",
        ];
      },
      repere: () => "Capacité d'autofinancement = résultat net + dotations (des charges qui ne font sortir aucun argent).",
    },
    {
      id: "caf",
      type: "montants",
      titre: "La capacité d'autofinancement",
      notions: ["frng", "income_statement"],
      question: (c) => {
        const k = financer(c);
        return `Le résultat net ${dE(k.entreprise)} est de ${eur(k.resultatNet)}. Ses dotations (l'usure de la ligne, la dépréciation de la créance de Sonora et la provision pour litige) ont coûté ${eur(k.dotation)}, des charges qui ne font sortir aucun argent. Calculez sa capacité d'autofinancement.`;
      },
      champs: (c) => {
        const k = financer(c);
        return [{ libelle: "Capacité d'autofinancement", attendu: k.caf, calcul: `${eur(k.resultatNet)} + ${eur(k.dotation)} = ${eur(k.caf)}`, tolerance: 1 }];
      },
      explication: (c) => {
        const k = financer(c);
        return [
          k.caf >= 0
            ? `Sur l'année, l'activité ${dE(k.entreprise)} a dégagé ${eur(k.caf)} : c'est l'argent dont elle dispose pour investir, rembourser son emprunt ou renforcer sa trésorerie.`
            : `La capacité d'autofinancement est négative : ${eur(k.caf)}. Même sans compter les dotations, l'activité a consommé de l'argent au lieu d'en dégager.`,
        ];
      },
    },
    {
      id: "suffit",
      type: "choix",
      titre: "L'autofinancement suffit-il ?",
      notions: ["frng"],
      question: (c) => {
        const k = financer(c);
        return `La ligne coûte ${eur(k.montant)} ; la capacité d'autofinancement de l'année est de ${eur(k.caf)}. ${k.entreprise} peut-elle la payer avec ce que son activité dégage ?`;
      },
      options: (c) => {
        const k = financer(c);
        const oui = k.caf >= k.montant;
        return [
          {
            texte: "Oui : sa capacité d'autofinancement couvre le prix",
            juste: oui,
            retour: oui
              ? `Oui : ${eur(k.caf)} pour ${eur(k.montant)}. L'entreprise peut s'autofinancer : elle n'a pas à s'endetter davantage, et ne paie pas d'intérêts de plus.`
              : `Non : ${eur(k.caf)} ne suffisent pas pour ${eur(k.montant)}.`,
          },
          {
            texte: "Non : il lui faut une autre source",
            juste: !oui,
            retour: !oui
              ? `Oui : ${k.caf > 0 ? `${eur(k.caf)} ne couvrent pas les ${eur(k.montant)} de la ligne` : "l'activité n'a rien dégagé cette année"}. Il faut emprunter, ou demander un apport aux associés.`
              : `Non : ${eur(k.caf)}, c'est plus que les ${eur(k.montant)} de la ligne.`,
          },
          {
            texte: "Oui, s'il lui reste des capitaux propres",
            juste: false,
            retour: `Non : les capitaux propres (${eur(k.capitauxPropres)}) ne sont pas de l'argent disponible ; ils disent qui a financé ce que l'entreprise possède déjà. Ce qu'elle peut dépenser vient de ce que l'activité dégage : la capacité d'autofinancement.`,
          },
        ];
      },
    },
    {
      id: "emprunt",
      type: "montants",
      titre: "Ce que coûterait un emprunt",
      notions: ["frng", "balance_sheet"],
      question: (c) => {
        const k = financer(c);
        return `Si ${k.entreprise} empruntait les ${eur(k.montant)} au taux de ${pct(k.tauxDeLEmprunt)} par an, combien paierait-elle d'intérêts la première année ? Son emprunt est aujourd'hui de ${eur(k.emprunts)} pour ${eur(k.capitauxPropres)} de capitaux propres : calculez le rapport emprunts ÷ capitaux propres avant et après ce nouvel emprunt, au centième.`;
      },
      champs: (c) => {
        const k = financer(c);
        return [
          { libelle: "Intérêts de la première année", attendu: k.interets, calcul: `${eur(k.montant)} × ${pct(k.tauxDeLEmprunt)} = ${eur(k.interets)}` },
          { libelle: "Endettement avant", attendu: k.endettementAvant, calcul: `${eur(k.emprunts)} ÷ ${eur(k.capitauxPropres)} = ${qte(k.endettementAvant)}`, tolerance: 0.01 },
          { libelle: "Endettement après", attendu: k.endettementApres, calcul: `(${eur(k.emprunts)} + ${eur(k.montant)}) ÷ ${eur(k.capitauxPropres)} = ${qte(k.endettementApres)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const k = financer(c);
        return [
          `L'emprunt coûterait ${eur(k.interets)} d'intérêts la première année, un peu moins ensuite à mesure qu'il se rembourse. Il porterait l'endettement à ${qte(k.endettementApres)} : ${k.endettementApres <= k.maximal ? "les emprunts resteraient au plus égaux aux capitaux propres, ce que les banques jugent raisonnable." : "les emprunts dépasseraient les capitaux propres, et une banque demanderait d'abord un apport des associés."}`,
        ];
      },
    },
    {
      id: "choisir",
      type: "choix",
      titre: "Choisir le financement",
      notions: ["frng", "balance_sheet"],
      question: (c) => `Au vu de ces chiffres, comment ${financer(c).entreprise} devrait-elle financer sa deuxième ligne ?`,
      options: (c) => {
        const k = financer(c);
        const options: { code: Financement; texte: string; oui: string }[] = [
          {
            code: "autofinancement",
            texte: "Par autofinancement",
            oui: `Oui : sa capacité d'autofinancement (${eur(k.caf)}) couvre les ${eur(k.montant)}. Elle garde son indépendance et ne paie aucun intérêt ; elle pourra emprunter plus tard, pour un projet plus gros.`,
          },
          {
            code: "emprunt",
            texte: "Par un emprunt",
            oui: `Oui : son activité ne dégage pas assez pour payer seule (${eur(k.caf)}), mais son endettement resterait raisonnable (${qte(k.endettementApres)}). L'emprunt coûte ${eur(k.interets)} d'intérêts la première année, et laisse aux associés tout le capital.${k.economique <= k.tauxDeLEmprunt ? ` Reste que son activité rapporte ${pct(k.economique)} de ce qu'elle mobilise, ${k.economique > 0 ? "moins que les" : "face aux"} ${pct(k.tauxDeLEmprunt)} de l'emprunt : l'équipement n'enrichira les associés que s'il rend l'activité plus rentable.` : ""}`,
          },
          {
            code: "apport",
            texte: "Par un apport des associés",
            oui: `Oui : l'activité ne dégage pas assez (${eur(k.caf)}), et un emprunt porterait l'endettement à ${qte(k.endettementApres)}, au-delà de la règle de prudence des banques. Un apport renforce les capitaux propres, et rendra un emprunt possible plus tard.`,
          },
        ];
        return options.map((o) => ({
          texte: o.texte,
          juste: o.code === k.choix,
          retour:
            o.code === k.choix
              ? o.oui
              : o.code === "autofinancement"
                ? `Non : sa capacité d'autofinancement (${eur(k.caf)}) ne couvre pas les ${eur(k.montant)}.`
                : o.code === "emprunt"
                  ? k.choix === "autofinancement"
                    ? `Pas nécessaire : l'activité dégage assez pour payer sans s'endetter ni payer d'intérêts.`
                    : `Non : l'endettement passerait à ${qte(k.endettementApres)}, au-delà de ce qu'une banque juge raisonnable.`
                  : `Pas nécessaire : ${k.choix === "autofinancement" ? "l'activité dégage assez pour payer seule" : "un emprunt reste raisonnable"}, sans demander d'argent nouveau aux associés.`,
        }));
      },
    },
    {
      id: "jusqu-ou-s-autofinancer",
      type: "curseur",
      titre: "Jusqu'où s'autofinancer",
      notions: ["frng"],
      question: (c) => {
        const k = financer(c);
        return `Et pour un équipement plus cher ? Faites varier son prix : une droite donne la capacité d'autofinancement de l'année, ${eur(k.caf)}, l'autre le prix. Placez le curseur sur le prix le plus haut que ${k.entreprise} peut payer avec ce que son activité a dégagé, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix de l'équipement", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: prixAutofinance(financer(c)), min: PRIX_DU_CURSEUR.min, max: PRIX_DU_CURSEUR.max }),
      zones: ["L'autofinancement suffit", "Il faut une autre source"],
      rates: () => ({
        dessous: "À ce prix, l'autofinancement suffit encore : l'équipement pourrait coûter plus.",
        dessus: "À ce prix, la capacité d'autofinancement ne suffit plus : cherchez plus bas.",
      }),
      montrer: "Montrer le prix",
      lecture: (c, prix) => {
        const k = financer(c);
        return [
          { libelle: "Capacité d'autofinancement", montant: k.caf },
          { libelle: "Prix de l'équipement", montant: prix },
          { libelle: "Ce qu'il reste après l'achat", montant: auCentime(k.caf - prix), fort: true },
        ];
      },
      droites: (c) => {
        const k = financer(c);
        return { produit: () => k.caf, cout: (prix) => prix, libelles: ["Capacité d'autofinancement", "Prix de l'équipement"] };
      },
      explication: (c) => {
        const k = financer(c);
        return [
          `Jusqu'à ${eur(prixAutofinance(k))}, ${k.entreprise} peut payer seule, sans dette ni apport. La deuxième ligne, ${eur(k.montant)}, en est loin : il lui resterait ${eur(auCentime(k.caf - k.montant))} pour rembourser son emprunt ou renforcer sa trésorerie.`,
          "Au-delà, il faut une autre source : un emprunt, si l'endettement le permet, ou un apport des associés. Le laboratoire suivant les compare.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-financement",
      type: "simulation",
      titre: "Le laboratoire du financement",
      notions: ["frng", "balance_sheet"],
      question: (c) => {
        const k = financer(c);
        return `Faites varier le prix de l'équipement et choisissez sa source. Le tableau dit ce que l'autofinancement ne couvre pas, les intérêts de la première année et l'endettement qui en résulte (la règle des banques : un emprunt au plus égal aux capitaux propres, ${eur(k.capitauxPropres)}). Relevez le défi.`;
      },
      leviers: (c) => {
        const k = financer(c);
        return [
          { code: "prix", libelle: "Prix de l'équipement, hors taxes", unite: "€", ...LEVIERS_DU_FINANCEMENT.prix, depart: k.montant },
          {
            code: "source",
            libelle: "Source de financement",
            unite: "",
            min: 0,
            max: SOURCES.length - 1,
            pas: 1,
            depart: SOURCES.indexOf("autofinancement"),
            choix: [
              { valeur: SOURCES.indexOf("autofinancement"), libelle: "autofinancement" },
              { valeur: SOURCES.indexOf("emprunt"), libelle: "emprunt" },
              { valeur: SOURCES.indexOf("apport"), libelle: "apport des associés" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const k = financer(c);
        const x = financementDuLaboratoire(k, p);
        return [
          { libelle: "Payé par l'autofinancement", montant: x.autofinance },
          { libelle: "Emprunté", montant: x.emprunte },
          { libelle: "Apporté par les associés", montant: x.apporte },
          { libelle: "Ce que l'autofinancement ne couvre pas", montant: x.manque, fort: true },
          { libelle: "Intérêts de la première année", montant: x.interets },
          { libelle: "Emprunts ÷ capitaux propres", montant: x.endettement, unite: "", reference: k.endettementAvant },
        ];
      },
      defi: (c) => {
        const k = financer(c);
        const reussi = (p: Readonly<Record<string, number>>) => {
          const x = financementDuLaboratoire(k, p);
          return x.prix >= PRIX_DU_DEFI && x.source !== "apport" && x.manque === 0 && x.endettement <= ENDETTEMENT_MAXIMAL;
        };
        return {
          consigne: `Financez un équipement d'au moins ${eur(PRIX_DU_DEFI)} sans demander d'argent aux associés, et sans dépasser la règle des banques.`,
          atteint: reussi,
          indice: (p) => {
            const x = financementDuLaboratoire(k, p);
            if (x.prix < PRIX_DU_DEFI) return `L'équipement coûte ${eur(x.prix)} : le défi en demande au moins ${eur(PRIX_DU_DEFI)}.`;
            if (x.source === "apport") return "Le défi interdit l'apport des associés : cherchez une autre source.";
            if (x.manque > 0) return `L'autofinancement ne couvre pas ${eur(x.manque)} du prix : il faut une autre source.`;
            return `L'endettement passerait à ${qte(x.endettement)}, au-delà de la règle des banques : l'équipement est trop cher pour être emprunté en entier.`;
          },
          solution: SOLUTION_DU_FINANCEMENT,
        };
      },
      explication: (c, p) => {
        const k = financer(c);
        const x = financementDuLaboratoire(k, p);
        const plafond = Math.floor(ENDETTEMENT_MAXIMAL * k.capitauxPropres - k.emprunts + 1e-9);
        return [
          `Défi relevé : ${eur(x.prix)} empruntés, ${eur(x.interets)} d'intérêts la première année, et un endettement de ${qte(x.endettement)}, dans la règle des banques.`,
          `L'autofinancement s'arrête à ${eur(k.caf)} ; l'emprunt va plus loin, jusqu'à ${eur(plafond)}, mais il coûte des intérêts et rend l'entreprise plus dépendante de sa banque. Au-delà, seul un apport des associés permet d'investir, et il renforce les capitaux propres au lieu de les charger.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["frng"],
      texte: (c) => {
        const k = financer(c);
        const mot = { autofinancement: "par autofinancement", emprunt: "par un emprunt", apport: "par un apport des associés" }[k.choix];
        return [
          `${k.entreprise} dégage ${eur(k.caf)} de capacité d'autofinancement dans l'année ; pour une deuxième ligne de ${eur(k.montant)}, elle la financerait ${mot}.`,
          "Le choix d'un financement dépend de ce que l'activité dégage, de ce que coûte l'argent emprunté, et de l'équilibre entre ce que les associés apportent et ce que l'entreprise doit. Une entreprise trop endettée perd sa liberté ; une entreprise qui n'emprunte jamais grandit moins vite. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.",
        ];
      },
      repere: () => "Autofinancement si la capacité d'autofinancement suffit ; emprunt si l'endettement reste raisonnable ; sinon, apport des associés.",
    },
  ],
};
