import { describe, expect, it } from "vitest";
import { COURRIERS } from "@/config/courriers/registre";

/**
 * LE RECOMMANDÉ DOIT RESTER RARE, ET DIRE CE QU'IL ENGAGE.
 *
 * Constaté après coup : sur 213 courriers écrits, 103 partaient en recommandé.
 * Un sur deux. Or un recommandé n'alerte que parce qu'il est rare — le modèle
 * le disait dès le premier jour (« tout traiter en recommandé banaliserait
 * justement ce qui doit alerter ») et nous l'avions fait quand même. Une panne
 * de passerelle de paiement, une fin de maintenance logicielle ou une bonne
 * nouvelle de la banque ne s'envoient pas avec accusé de réception.
 *
 * La règle, une fois écrite, se vérifie toute seule :
 *
 *   1. UN RECOMMANDÉ DIT CE QU'IL ENGAGE. Son texte porte au moins une forme
 *      juridique de la liste ci-dessous : un délai qui court, une somme
 *      exigible, un acte notifié, un contrat conclu ou rompu. Un courrier qui
 *      n'en porte aucune n'engage rien : soit il faut préciser son texte, soit
 *      il part en pli simple. Écrire « Nous révisons vos conditions » sans dire
 *      dans quel sens, c'est l'échec de ce test.
 *
 *   2. LE RECOMMANDÉ RESTE MINORITAIRE. Un plafond en proportion, parce que
 *      la règle 1 se contourne par le vocabulaire : il suffirait de glisser
 *      « préavis » partout. Le plafond, lui, ne se contourne pas.
 *
 * Ce test ne juge pas les textes, il juge l'accord entre le texte et le canal.
 */

/** Les formes qui font qu'une lettre engage. Des actes, pas des tournures. */
const MARQUEURS_D_ENGAGEMENT = [
  // Le délai qui court, la somme exigible
  "mise en demeure", "mettons en demeure", "met en demeure", "exigible",
  "sous huitaine", "sous quarante-huit heures", "dix jours", "trente jours",
  "sans delai", "contre-visite", "delais de recours",
  // L'acte de l'autorité
  "proces-verbal", "arrete", "sanction", "amende", "immobilisation",
  "interdiction", "inaptitude",
  // Le contrat qui se noue ou se rompt
  "commande ferme", "confirmons la commande", "nous vous attribuons",
  "preavis", "demission", "ne renouvellerons pas", "resiliation",
  // La modification unilatérale à la charge du destinataire
  "conformement a l'article", "conformement a nos conditions",
  "releve", "releves", "relevons", "majore", "durcies", "reduite",
  // La mise en cause
  "suspend", "responsabilite civile", "declarer leur sinistre", "avant la parution",
];

/** Les accents ne doivent pas décider si une lettre engage. */
function sansAccent(texte: string): string {
  return texte.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function engage(texte: string): boolean {
  const t = sansAccent(texte);
  return MARQUEURS_D_ENGAGEMENT.some((m) => t.includes(m));
}

describe("le pli dit l'enjeu", () => {
  const recommandes = COURRIERS.filter((c) => c.pli === "recommande");

  it("chaque recommandé énonce ce qu'il engage", () => {
    const muets = recommandes
      .filter((c) => !engage(`${c.objet} ${c.corps}`))
      .map((c) => `${c.code} — « ${c.objet} »`);
    expect(
      muets,
      "Ces recommandés n'engagent rien de lisible. Précisez le texte (le délai, " +
        "l'acte, la somme) ou passez-les en pli simple :\n" + muets.join("\n"),
    ).toEqual([]);
  });

  it("le recommandé reste minoritaire", () => {
    // Le seuil n'est pas un idéal, c'est un plafond : au-delà, le pli cesse
    // d'être un signal. Un quart du courrier, c'est déjà beaucoup pour des
    // lettres qui engagent.
    const part = recommandes.length / COURRIERS.length;
    expect(part, `${recommandes.length} recommandés sur ${COURRIERS.length}`).toBeLessThan(0.25);
  });

  it("rien de ce qui engage ne part par courriel", () => {
    // La règle inverse de la première, et c'est la leçon du canal : un
    // courriel n'a ni accusé de réception ni date certaine. Une mise en
    // demeure, un procès-verbal ou une sanction envoyés par message ne
    // vaudraient rien — les écrire ainsi enseignerait le contraire du vrai.
    const ENGAGEMENTS_FORTS = [
      "mise en demeure", "mettons en demeure", "met en demeure",
      "proces-verbal", "sanction", "amende", "demission", "resiliation",
    ];
    const fautifs = COURRIERS.filter(
      (c) =>
        c.pli === "email" &&
        ENGAGEMENTS_FORTS.some((m) => sansAccent(`${c.objet} ${c.corps}`).includes(m)),
    ).map((c) => `${c.code} — « ${c.objet} »`);
    expect(
      fautifs,
      "Ces courriels engagent : ils doivent partir en recommandé.\n" + fautifs.join("\n"),
    ).toEqual([]);
  });

  it("aucun canal n'avale le courrier", () => {
    /*
     * LA RÈGLE QUI TIENT LES TROIS AUTRES. Le corpus a connu deux
     * aplatissements en sens inverse : d'abord un courrier sur deux en
     * recommandé, puis, une fois celui-ci corrigé, quatre sur cinq en pli
     * simple. Dans les deux cas le canal cessait d'informer, faute de
     * contraste — et c'est le canal qui dit si la chose engage.
     *
     * Le plafond ne prétend pas dire la bonne répartition, seulement empêcher
     * qu'un canal redevienne le fourre-tout des autres.
     */
    const parCanal = new Map<string, number>();
    for (const c of COURRIERS) parCanal.set(c.pli, (parCanal.get(c.pli) ?? 0) + 1);
    const trop = [...parCanal.entries()]
      .filter(([, n]) => n / COURRIERS.length > 0.7)
      .map(([pli, n]) => `${pli} : ${n} / ${COURRIERS.length}`);
    expect(trop, "un canal a avalé le courrier :\n" + trop.join("\n")).toEqual([]);
  });

  it("les quatre canaux servent tous", () => {
    // Un canal qu'aucun courrier n'emprunte est un canal mort : il coûte du
    // code et du dessin sans rien enseigner.
    for (const pli of ["recommande", "simple", "interne", "email"]) {
      expect(
        COURRIERS.some((c) => c.pli === pli),
        `aucun courrier ne part en « ${pli} »`,
      ).toBe(true);
    }
  });

  it("aucun courrier interne ne part en recommandé", () => {
    // Une note de service ne s'envoie pas avec accusé de réception à sa propre
    // maison. Les démissions, elles, sont écrites comme des lettres externes.
    const fautifs = COURRIERS.filter(
      (c) => c.pli === "recommande" && c.expediteur.startsWith("Note interne"),
    ).map((c) => c.code);
    expect(fautifs).toEqual([]);
  });
});
