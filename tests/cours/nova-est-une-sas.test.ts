import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "@/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";

/**
 * NOVA EST UNE SAS (décision D1 du chantier « BTS CG P1 et P2 en entier », novembre 2026).
 *
 * Son dirigeant est son président, son capital est fait d'actions, ses associés sont des
 * actionnaires, et l'assemblée générale approuve les comptes. Le vocabulaire de la SARL (gérant,
 * gérante, gérance, parts sociales) ne la désigne donc jamais. La garde sert chaque chapitre et
 * chaque cas pratique qui se joue chez NOVA, comme l'élève le lit (`servirLeChapitre`, avec l'accroche,
 * le commanditaire et la raison du choix des entreprises), et n'y tolère aucun de ces mots.
 *
 * LE PRÉSIDENT, AU MASCULIN (décision du propriétaire, novembre 2026). Les textes de NOVA disaient
 * tantôt « le président », tantôt « la présidente » : le dirigeant de NOVA est « le président »,
 * partout. La même lecture n'y tolère donc pas non plus le mot « présidente ». ATLAS CONSEIL garde sa
 * présidente : elle n'est pas lue ici. Un
 * chapitre qui se joue aussi ailleurs dit « le dirigeant » ou « la dirigeante » : ce qui vaut pour
 * toutes les entreprises ne peut pas être faux pour NOVA. Les autres entreprises gardent leur
 * vocabulaire (MAILLE & CO a une gérante) : elles ne sont pas relues ici.
 */

const VOCABULAIRE_DE_LA_SARL = /(?<!\p{L})(gérant(e|s|es)?|gérance|cogérant(e|s|es)?|parts?\s+sociales?|SARL|EURL)(?!\p{L})/iu;

/** Le dirigeant de NOVA est « le président » : le féminin ne le désigne jamais. */
const LA_PRESIDENTE = /(?<!\p{L})présidentes?(?!\p{L})/iu;

/**
 * NI « LA DIRIGEANTE », NI « LA DIRECTRICE GÉNÉRALE », NI « LE DIRECTEUR GÉNÉRAL » (audit du 10 novembre
 * 2026, contenu P1-3). La garde ne cherchait que « présidente » : « la dirigeante de NOVA », « la
 * directrice générale » et « le directeur général » passaient, et l'élève qui suit NOVA d'un chapitre à
 * l'autre lisait trois dirigeants. Dans un texte qui ne se joue que chez NOVA, son dirigeant est « le
 * président ». Un texte qui se joue aussi ailleurs garde « le dirigeant » ou « la dirigeante » (voir
 * plus haut), mais ne nomme jamais « la dirigeante de NOVA ». Ne désignent pas NOVA : « la directrice
 * générale des services » d'une collectivité, et le cas général, « la dirigeante d'une petite
 * entreprise » (`securiser-les-processus`, une option fausse qui parle de toute entreprise).
 */
const UN_AUTRE_DIRIGEANT =
  /(?<!\p{L})(dirigeantes?|directrices?\s+générales?|directeurs?\s+généra(l|ux))(?!\s+des\s+services)(?!\s+d['’]une\s)(?!\p{L})/iu;
const LA_DIRIGEANTE_DE_NOVA = /(?<!\p{L})dirigeantes?\s+de\s+NOVA(?!\p{L})/iu;

/**
 * NI « LA DIRECTRICE » SEULE (chantier « petits points de novembre », 11 novembre 2026). Le cas
 * « aller-dans-l-espace-libre », joué chez NOVA seule, faisait poser sa question par « la directrice » :
 * l'élève y lisait un quatrième dirigeant. La garde lit donc chaque « directrice » de ce qui se lit chez
 * NOVA, et n'en laisse passer que deux sortes.
 *
 * 1. La directrice QUALIFIÉE, dont la fonction n'est pas la direction de NOVA : le qualificatif qui la
 *    suit est dans la liste ci-dessous, explicite. « Directrice générale » n'y est pas (c'est la garde
 *    précédente), « directrice générale des services », celle d'une collectivité, y est.
 * 2. « La directrice » seule qui REPREND la directrice qualifiée que le cas a pour commanditaire :
 *    « La directrice financière » pose la question, « Répondre à la directrice » lui répond. Un cas
 *    dont le commanditaire est « La directrice » seule, ou un autre que l'une d'elles, n'a personne à
 *    reprendre.
 *
 * Toute autre « directrice » désigne le dirigeant : chez NOVA seule, c'est « le président » ; dans un
 * texte qui se joue aussi ailleurs, « le dirigeant » ou « la dirigeante ».
 */
const QUALIFICATIFS_TOLERES = [
  "financière",
  "commerciale",
  "d'agence",
  "de l'usine",
  "des ressources humaines",
  "générale des services",
] as const;

const UNE_DIRECTRICE = /(?<!\p{L})directrices?(?!\p{L})/giu;

/** Le qualificatif toléré qui suit une « directrice » (`suite` : le texte juste après le mot), s'il y en a un. */
function qualificatifTolere(suite: string): string | undefined {
  const s = suite.replace(/’/g, "'").toLowerCase();
  return QUALIFICATIFS_TOLERES.find((q) => s.startsWith(" " + q) && !/^\p{L}/u.test(s.slice(q.length + 1)));
}

/** Le texte nomme-t-il une directrice qualifiée, que « la directrice » seule peut ensuite reprendre ? */
function nommeUneDirectriceQualifiee(texte: string): boolean {
  return [...texte.matchAll(UNE_DIRECTRICE)].some((m) => qualificatifTolere(texte.slice(m.index + m[0].length)) !== undefined);
}

/**
 * Les « directrice » d'un texte que la garde refuse, chacune avec ce qui la suit. `reprise` : le
 * commanditaire du cas est une directrice qualifiée, que « la directrice » seule reprend.
 */
function directricesRefusees(texte: string, reprise: boolean): string[] {
  const refusees: string[] = [];
  for (const m of texte.matchAll(UNE_DIRECTRICE)) {
    const suite = texte.slice(m.index + m[0].length);
    if (qualificatifTolere(suite)) continue;
    if (reprise && !/^\s+générales?(?!\p{L})/iu.test(suite)) continue;
    refusees.push(texte.slice(m.index, m.index + m[0].length + 24));
  }
  return refusees;
}

/**
 * LISTE D'ATTENTE : vide depuis la fusion du lot 4 des deux décimales, qui a corrigé
 * « chacun-son-levier » et « des-clients-repartis-sans-etre-servis ». Une entrée n'y est tolérée que
 * tant qu'elle a encore une faute : la garde ci-dessous l'exige.
 */
const EN_ATTENTE_D_UN_AUTRE_LOT = new Set<string>([]);

/**
 * Les deux textes qui enseignent les formes juridiques elles-mêmes (la SARL, l'EURL, leur gérant et
 * leurs parts sociales) : ils nomment ce vocabulaire pour le comparer à la SAS, ils ne l'appliquent
 * pas à NOVA. Leur propre garde (tests/cours/le-cadre-de-la-comptabilite.test.ts) vérifie la forme de
 * chaque entreprise.
 */
const COURS_SUR_LES_FORMES = new Set(["le-cadre-de-la-comptabilite", "creer-l-atelier-de-reparation"]);

/** Les clés de code : pas du texte lu (les mêmes que la garde de la langue du cours servi). */
const CODES = new Set(["code", "id", "type", "compte", "levier", "vue", "categorie", "cle", "unite_code", "montrer"]);

function parcourir(x: unknown, chemin: string, emettre: (chemin: string, t: string) => void): void {
  if (typeof x === "string") return emettre(chemin, x);
  if (Array.isArray(x)) return x.forEach((v, i) => parcourir(v, `${chemin}[${i}]`, emettre));
  if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!CODES.has(k)) parcourir(v, chemin ? `${chemin}.${k}` : k, emettre);
}

/** Ce que l'élève lit de chaque chapitre et de chaque cas joué chez NOVA, servi une seule fois pour les gardes. */
type TexteServi = { ou: string; code: string; seuleNova: boolean; repriseDUneDirectrice: boolean; texte: string };
let servis: TexteServi[] | undefined;
function textesChezNova() {
  return (servis ??= servirLesTextesDeNova());
}

function servirLesTextesDeNova() {
  const nova = casDeLEntreprise("nova");
  const sortie: TexteServi[] = [];
  for (const ch of [...CHAPITRES, ...SITUATIONS]) {
    if (COURS_SUR_LES_FORMES.has(ch.code)) continue;
    const ou = ch.entreprises?.codes ?? ENTREPRISES_DU_COURS;
    if (!ou.includes("nova")) continue;
    const seuleNova = ou.length === 1;
    const commanditaire = (ch as { commanditaire?: unknown }).commanditaire;
    const sesMots: string[] = [];
    if (commanditaire) parcourir(commanditaire, "", (_, t) => sesMots.push(t));
    const repriseDUneDirectrice = sesMots.some(nommeUneDirectriceQualifiee);
    const emettre = (chemin: string, texte: string) =>
      sortie.push({ ou: `${ch.code} ${chemin}`, code: ch.code, seuleNova, repriseDUneDirectrice, texte });
    emettre("titre", ch.titre);
    emettre("accroche", ch.accroche ?? "");
    for (const [i, o] of ch.objectifs.entries()) emettre(`objectifs[${i}]`, o);
    if (commanditaire) parcourir(commanditaire, "commanditaire", emettre);
    if (ch.entreprises?.pourquoi) emettre("entreprises.pourquoi", ch.entreprises.pourquoi);
    const { etapes, ...reste } = servirLeChapitre(ch, nova);
    parcourir(reste, "", emettre);
    etapes.forEach((e, i) => parcourir(e, `e${i + 1}:${e.id}`, emettre));
  }
  return sortie;
}

describe("NOVA est une SAS : aucun mot de la SARL dans ce qui se lit chez elle", () => {
  it("chaque chapitre et chaque cas joué chez NOVA dit président ou dirigeant, jamais gérant", () => {
    const textes = textesChezNova();
    expect(textes.length).toBeGreaterThan(5_000);
    const fautes = textes.filter((t) => VOCABULAIRE_DE_LA_SARL.test(t.texte)).map((t) => `${t.ou} : ${t.texte.match(VOCABULAIRE_DE_LA_SARL)![0]}`);
    expect(fautes).toEqual([]);
  }, 240_000);

  it("la garde voit bien le mot qu'elle interdit", () => {
    expect(VOCABULAIRE_DE_LA_SARL.test("Votre réponse au gérant")).toBe(true);
    expect(VOCABULAIRE_DE_LA_SARL.test("La gérante veut savoir")).toBe(true);
    expect(VOCABULAIRE_DE_LA_SARL.test("150 parts sociales")).toBe(true);
    expect(VOCABULAIRE_DE_LA_SARL.test("La présidente veut savoir")).toBe(false);
    expect(VOCABULAIRE_DE_LA_SARL.test("si-la-gerante-se-payait")).toBe(false);
  });});

describe("NOVA a un président : jamais « la présidente » dans ce qui se lit chez elle", () => {
  it("chaque chapitre et chaque cas joué chez NOVA dit le président, au masculin", () => {
    const textes = textesChezNova();
    expect(textes.length).toBeGreaterThan(5_000);
    const fautes = textes.filter((t) => LA_PRESIDENTE.test(t.texte)).map((t) => `${t.ou} : ${t.texte.match(LA_PRESIDENTE)![0]}`);
    expect(fautes).toEqual([]);
  }, 240_000);

  it("la garde voit bien le mot qu'elle interdit", () => {
    expect(LA_PRESIDENTE.test("Votre réponse à la présidente")).toBe(true);
    expect(LA_PRESIDENTE.test("Si la présidente se payait")).toBe(true);
    expect(LA_PRESIDENTE.test("SI LA PRÉSIDENTE SE PAYAIT")).toBe(true);
    expect(LA_PRESIDENTE.test("Votre réponse au président")).toBe(false);
    expect(LA_PRESIDENTE.test("le-cumul-de-la-presidente")).toBe(false);
  });
});

describe("NOVA a un président : ni « dirigeante », ni « directrice générale », ni « directeur général »", () => {
  const fautif = (t: { seuleNova: boolean; texte: string }) =>
    (t.seuleNova && UN_AUTRE_DIRIGEANT.test(t.texte)) || LA_DIRIGEANTE_DE_NOVA.test(t.texte);

  it("chaque chapitre et chaque cas joué chez NOVA seule dit le président ; aucun texte ne dit « la dirigeante de NOVA »", () => {
    const textes = textesChezNova();
    expect(textes.length).toBeGreaterThan(5_000);
    const fautes = textes
      .filter((t) => !EN_ATTENTE_D_UN_AUTRE_LOT.has(t.code) && fautif(t))
      .map((t) => `${t.ou} : ${(t.texte.match(LA_DIRIGEANTE_DE_NOVA) ?? t.texte.match(UN_AUTRE_DIRIGEANT))![0]}`);
    expect(fautes).toEqual([]);
  }, 240_000);

  it("la liste d'attente ne garde que des cas qui ont encore une faute (sinon, la retirer)", () => {
    const textes = textesChezNova();
    for (const code of EN_ATTENTE_D_UN_AUTRE_LOT) {
      const siens = textes.filter((t) => t.code === code);
      expect(siens.length, code).toBeGreaterThan(0);
      expect(siens.some((t) => fautif(t) || /(?<!\p{L})directrices?(?!\p{L})/iu.test(t.texte)), code).toBe(true);
    }
  }, 240_000);

  it("la garde voit bien les mots qu'elle interdit", () => {
    expect(UN_AUTRE_DIRIGEANT.test("La dirigeante veut monter son prix")).toBe(true);
    expect(UN_AUTRE_DIRIGEANT.test("Répondre à la directrice générale")).toBe(true);
    expect(UN_AUTRE_DIRIGEANT.test("Le directeur général veut garder la ligne")).toBe(true);
    expect(UN_AUTRE_DIRIGEANT.test("LA DIRECTRICE GÉNÉRALE")).toBe(true);
    expect(UN_AUTRE_DIRIGEANT.test("la directrice générale des services")).toBe(false);
    expect(UN_AUTRE_DIRIGEANT.test("la dirigeante d'une petite entreprise")).toBe(false);
    expect(UN_AUTRE_DIRIGEANT.test("Le dirigeant veut savoir")).toBe(false);
    expect(UN_AUTRE_DIRIGEANT.test("Le président veut savoir")).toBe(false);
    expect(LA_DIRIGEANTE_DE_NOVA.test("La dirigeante de NOVA choisit le fournisseur")).toBe(true);
    expect(LA_DIRIGEANTE_DE_NOVA.test("La dirigeante de MAILLE & CO")).toBe(false);
  });
});

describe("NOVA a un président : jamais « la directrice » seule pour le désigner", () => {
  it("chaque « directrice » lue chez NOVA est qualifiée, ou reprend la directrice qualifiée qui commande le cas", () => {
    const textes = textesChezNova();
    expect(textes.length).toBeGreaterThan(5_000);
    const fautes = textes.flatMap((t) =>
      directricesRefusees(t.texte, t.repriseDUneDirectrice).map(
        (d) => `${t.ou} : « ${d}… » (${t.seuleNova ? "chez NOVA seule, « le président »" : "joué aussi ailleurs, « le dirigeant » ou « la dirigeante »"})`,
      ),
    );
    expect(fautes).toEqual([]);
  }, 240_000);

  it("la garde voit « la directrice » seule, sous toutes ses formes", () => {
    expect(directricesRefusees("La directrice veut savoir si l'entreprise gagnerait à y aller", false)).toEqual(["directrice veut savoir si l'entrep"]);
    expect(directricesRefusees("Répondre à la directrice, chiffre à l'appui", false)).toHaveLength(1);
    expect(directricesRefusees("Quelle phrase envoyez-vous à la directrice ?", false)).toHaveLength(1);
    expect(directricesRefusees("LA DIRECTRICE", false)).toHaveLength(1);
    expect(directricesRefusees("Les directrices en parlent", false)).toHaveLength(1);
    // Un qualificatif qui n'est pas dans la liste ne suffit pas : la directrice générale dirige NOVA.
    expect(directricesRefusees("Répondre à la directrice générale", false)).toHaveLength(1);
    expect(directricesRefusees("Répondre à la directrice générale", true)).toHaveLength(1);
    expect(directricesRefusees("La directrice de NOVA", false)).toHaveLength(1);
    // « financièrement » n'est pas « financière » : le qualificatif finit sur une limite de mot.
    expect(directricesRefusees("La directrice financièrement prudente", false)).toHaveLength(1);
    // Une directrice qualifiée et une directrice seule, sans commanditaire à reprendre : la seconde est vue.
    expect(directricesRefusees("La directrice financière écrit à la directrice", false)).toEqual(["directrice"]);
  });

  it("la garde laisse passer chaque qualificatif de la liste, et la reprise du commanditaire", () => {
    for (const q of QUALIFICATIFS_TOLERES) expect(directricesRefusees(`La demande de la directrice ${q}.`, false), q).toEqual([]);
    expect(directricesRefusees("La directrice d’agence répond", false)).toEqual([]);
    expect(directricesRefusees("LA DIRECTRICE FINANCIÈRE", false)).toEqual([]);
    expect(directricesRefusees("sous l'autorité de la directrice générale des services", false)).toEqual([]);
    expect(directricesRefusees("La directrice de l'usine répond", false)).toEqual([]);
    // Le cas « La directrice financière » : « Répondre à la directrice » la reprend.
    expect(directricesRefusees("Répondre à la directrice, chiffre à l'appui", true)).toEqual([]);
    expect(nommeUneDirectriceQualifiee("La directrice financière")).toBe(true);
    expect(nommeUneDirectriceQualifiee("La directrice")).toBe(false);
    expect(nommeUneDirectriceQualifiee("Le président")).toBe(false);
    expect(directricesRefusees("Votre réponse au président", false)).toEqual([]);
    expect(directricesRefusees("La direction veut savoir", false)).toEqual([]);
  });
});
