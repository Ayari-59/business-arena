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
let servis: { ou: string; code: string; seuleNova: boolean; texte: string }[] | undefined;
function textesChezNova() {
  return (servis ??= servirLesTextesDeNova());
}

function servirLesTextesDeNova() {
  const nova = casDeLEntreprise("nova");
  const sortie: { ou: string; code: string; seuleNova: boolean; texte: string }[] = [];
  for (const ch of [...CHAPITRES, ...SITUATIONS]) {
    if (COURS_SUR_LES_FORMES.has(ch.code)) continue;
    const ou = ch.entreprises?.codes ?? ENTREPRISES_DU_COURS;
    if (!ou.includes("nova")) continue;
    const seuleNova = ou.length === 1;
    const emettre = (chemin: string, texte: string) => sortie.push({ ou: `${ch.code} ${chemin}`, code: ch.code, seuleNova, texte });
    emettre("titre", ch.titre);
    emettre("accroche", ch.accroche ?? "");
    for (const [i, o] of ch.objectifs.entries()) emettre(`objectifs[${i}]`, o);
    const commanditaire = (ch as { commanditaire?: unknown }).commanditaire;
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
