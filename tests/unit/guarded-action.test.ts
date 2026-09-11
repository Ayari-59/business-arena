import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MESSAGE_SERVEUR_MUET,
  avecDelai,
  copierSaisie,
  garder,
  rejouerSaisie,
  type Echec,
} from "@/components/guarded-action";

/**
 * LE GARDE-FOU CLIENT : UNE ACTION QUI NE RÉPOND PAS DEVIENT UN MESSAGE.
 *
 * Constaté en production : un POST d'action serveur reçoit parfois un 503 au
 * edge, sans rien dans les journaux de fonction. Le formulaire se vidait sans
 * un mot. Ici, la partie pure du garde-fou : ce qui se passe quand l'action
 * rejette, quand elle tarde, quand elle réussit, et comment la saisie revient.
 */

type Etat = { error: string | null; n?: number };

function saisie(champs: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) {
    for (const x of Array.isArray(v) ? v : [v]) fd.append(k, x);
  }
  return fd;
}

describe("garder : les trois issues d'une action", () => {
  let echecs: Echec[];
  let succes: number;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    echecs = [];
    succes = 0;
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  const options = (label: string, timeoutMs?: number) => ({
    label,
    timeoutMs,
    onEchec: (e: Echec) => echecs.push(e),
    onSucces: () => succes++,
  });

  it("(a) l'action rejette : état précédent rendu, saisie conservée, console avertie", async () => {
    const action = async (): Promise<Etat> => {
      throw new Error("503 Service Unavailable");
    };
    const prev: Etat = { error: null, n: 1 };
    const fd = saisie({ name: "Championnat QA", groupSize: "4" });
    const resultat = await garder(action, options("création de concours"))(prev, fd);
    expect(resultat).toBe(prev);
    expect(echecs).toHaveLength(1);
    expect(echecs[0]!.label).toBe("création de concours");
    expect(echecs[0]!.raison).toContain("503");
    expect(echecs[0]!.saisie.get("name")).toBe("Championnat QA");
    expect(echecs[0]!.saisie.get("groupSize")).toBe("4");
    expect(warn).toHaveBeenCalledWith("[action-failed]", "création de concours", expect.stringContaining("503"));
    expect(succes).toBe(0);
  });

  it("(b) l'action ne répond pas dans le délai : même issue, raison « aucune réponse »", async () => {
    const jamais = () => new Promise<Etat>(() => undefined);
    const prev: Etat = { error: null };
    const fd = saisie({ eventCode: "raw_material_spike", teamId: "" });
    const resultat = await garder(jamais, options("tirage de carte", 30))(prev, fd);
    expect(resultat).toBe(prev);
    expect(echecs).toHaveLength(1);
    expect(echecs[0]!.raison).toContain("aucune réponse");
    expect(echecs[0]!.saisie.get("eventCode")).toBe("raw_material_spike");
  });

  it("(c) l'action réussit : son résultat est rendu tel quel, aucun échec signalé", async () => {
    const action = async (): Promise<Etat> => ({ error: "Il faut au moins 2 équipes inscrites" });
    const resultat = await garder(action, options("concours"))({ error: null }, saisie({}));
    // Une erreur métier renvoyée par l'action reste une réponse : elle passe.
    expect(resultat).toEqual({ error: "Il faut au moins 2 équipes inscrites" });
    expect(echecs).toHaveLength(0);
    expect(succes).toBe(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("une action qui redirige ne renvoie rien : l'état précédent est gardé", async () => {
    const action = async (): Promise<void> => undefined;
    const prev: Etat = { error: null, n: 7 };
    const resultat = await garder<Etat>(action, options("connexion"))(prev, saisie({}));
    expect(resultat).toBe(prev);
    expect(succes).toBe(1);
  });

  it("aucun nouvel essai automatique : l'action n'est appelée qu'une fois", async () => {
    const action = vi.fn(async (): Promise<Etat> => {
      throw new Error("réseau");
    });
    await garder(action, options("décisions"))({ error: null }, saisie({ price: "79" }));
    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe("avecDelai et copierSaisie", () => {
  it("laisse passer une promesse rapide et coupe une promesse lente", async () => {
    await expect(avecDelai(Promise.resolve(42), 50)).resolves.toBe(42);
    await expect(avecDelai(new Promise(() => undefined), 20)).rejects.toThrow("aucune réponse");
  });

  it("la copie de la saisie est indépendante de l'original", () => {
    const original = saisie({ options: ["a", "b"], freeText: "x" });
    const copie = copierSaisie(original);
    original.delete("freeText");
    expect(copie.get("freeText")).toBe("x");
    expect(copie.getAll("options")).toEqual(["a", "b"]);
  });
});

describe("rejouerSaisie : la saisie revient dans les champs", () => {
  interface FauxChamp {
    type: string;
    value: string;
    checked?: boolean;
  }
  function formulaire(champs: Record<string, FauxChamp | FauxChamp[]>) {
    return {
      elements: {
        namedItem(name: string) {
          const c = champs[name];
          if (!c) return null;
          return Array.isArray(c) ? Object.assign([...c], { length: c.length }) : c;
        },
      },
      champs,
    };
  }

  it("texte et listes : la dernière valeur envoyée ; cases et radios : cochées si envoyées", () => {
    const form = formulaire({
      name: { type: "text", value: "" },
      groupSize: { type: "select-one", value: "3" },
      options: [
        { type: "checkbox", value: "a", checked: false },
        { type: "checkbox", value: "b", checked: false },
        { type: "checkbox", value: "c", checked: true },
      ],
      quiz_q1: [
        { type: "radio", value: "m1", checked: true },
        { type: "radio", value: "m2", checked: false },
      ],
      mode: { type: "hidden", value: "model" },
    });
    rejouerSaisie(
      form,
      saisie({ name: "Championnat QA", groupSize: "5", options: ["a", "b"], quiz_q1: "m2", mode: "full" }),
    );
    expect(form.champs.name).toMatchObject({ value: "Championnat QA" });
    expect(form.champs.groupSize).toMatchObject({ value: "5" });
    const options = form.champs.options as FauxChamp[];
    expect(options.map((o) => o.checked)).toEqual([true, true, false]);
    const radios = form.champs.quiz_q1 as FauxChamp[];
    expect(radios.map((r) => r.checked)).toEqual([false, true]);
    // Un champ caché porte une valeur du composant, pas de la personne : intact.
    expect(form.champs.mode).toMatchObject({ value: "model" });
  });

  it("un champ absent du formulaire est ignoré sans erreur", () => {
    const form = formulaire({ name: { type: "text", value: "" } });
    expect(() => rejouerSaisie(form, saisie({ inconnu: "x", name: "ok" }))).not.toThrow();
    expect(form.champs.name).toMatchObject({ value: "ok" });
  });

  it("le message servi à la personne dit que la saisie est conservée", () => {
    expect(MESSAGE_SERVEUR_MUET).toContain("Vos saisies sont conservées");
  });
});
