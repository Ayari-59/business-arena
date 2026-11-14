"use client";

import { useEffect, useState } from "react";
import { bouton } from "@/components/bouton";
import { BoutonCopierLeCode } from "@/components/bouton-copier-le-code";
import { useParcours } from "@/components/parcours-mobile";
import { formaterCodeDeReprise } from "@/config/reprise";

/**
 * EN ATTENDANT LA CLÔTURE (séance d'essai, P1-3, P1-4 et P2-10).
 *
 * Après « Valider », l'écran gardait le récapitulatif et un bouton plein « Mettre à jour
 * mes décisions validées » : rien à faire en attendant, sinon refaire. Et le coéquipier
 * qui ouvrait l'arène ne voyait pas que c'était fait. Cette carte se pose en tête du
 * récapitulatif d'une équipe qui a validé : qui a validé et quand, ce que vaut un nouvel
 * envoi, puis ce qu'on peut faire d'utile d'ici la clôture : une situation pas encore
 * rendue, la lecture du marché, la question du tour. Une seule action pleine : la
 * première de la liste.
 *
 * Au premier tour, elle montre aussi, une fois, le code de reprise du joueur : il ne
 * vivait que dans le menu, et personne ne le notait avant d'en avoir besoin.
 */
export function EnAttenteDeLaCloture({
  gameId,
  mention,
  situationsARendre,
  codeDeReprise,
}: {
  gameId: string;
  /** « Validé par Lina à 15:54 » (`mentionDeValidation`). */
  mention: string;
  /** Les situations du tour pas encore rendues. */
  situationsARendre: number;
  /** Le code du joueur, au premier tour seulement ; `null` sinon. */
  codeDeReprise: string | null;
}) {
  const parcours = useParcours();
  const cles = parcours?.clesDuParcours ?? [];
  const actions = [
    situationsARendre > 0 && cles.includes("analyse")
      ? {
          cle: "analyse",
          libelle:
            situationsARendre > 1
              ? `Analyser les ${situationsARendre} situations restantes`
              : "Analyser la situation restante",
        }
      : null,
    cles.includes("chiffres") ? { cle: "chiffres", libelle: "Relire le marché" } : null,
    cles.includes("arbitrage") ? { cle: "arbitrage", libelle: "Relire la question du tour" } : null,
  ].filter((a): a is { cle: string; libelle: string } => a !== null);

  return (
    <section aria-label="En attendant la clôture" data-en-attente-de-la-cloture="" className="panneau-info space-y-3 p-3">
      <div>
        <p className="text-sm font-semibold text-slate-50">
          <span aria-hidden className="text-emerald-400">
            ✓
          </span>{" "}
          {mention}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">
          Les décisions de l&apos;équipe sont rendues. Un nouvel envoi, d&apos;ici la clôture,
          les remplacerait.
        </p>
      </div>
      {actions.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-slate-100">En attendant la clôture</p>
          <div className="mt-2 flex flex-col gap-2">
            {actions.map((a, i) => (
              <button
                key={a.cle}
                type="button"
                onClick={() => parcours?.allerALaCarteDuParcours(a.cle)}
                className={`${bouton({ variante: i === 0 ? "principal" : "secondaire", taille: "m" })} min-h-11 w-full`}
              >
                {a.libelle}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {codeDeReprise ? <CodeDeRepriseUneFois gameId={gameId} code={codeDeReprise} /> : null}
    </section>
  );
}

const CLE_VU = (gameId: string) => `code-de-reprise-vu-${gameId}`;

/** Le code de reprise, montré tant que le joueur n'a pas dit « C'est noté ». */
function CodeDeRepriseUneFois({ gameId, code }: { gameId: string; code: string }) {
  const [montre, setMontre] = useState(false);
  useEffect(() => {
    let vu = false;
    try {
      vu = window.localStorage.getItem(CLE_VU(gameId)) === "1";
    } catch {
      vu = false;
    }
    // Lu après le montage : le serveur ne connaît pas le stockage de l'appareil.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMontre(!vu);
  }, [gameId]);
  if (!montre) return null;
  const noter = () => {
    try {
      window.localStorage.setItem(CLE_VU(gameId), "1");
    } catch {
      // Sans stockage, le code reviendra : mieux vaut le revoir que le perdre.
    }
    setMontre(false);
  };
  return (
    <div data-code-de-reprise-une-fois="" className="border-t border-white/10 pt-3">
      <p className="text-sm font-semibold text-slate-100">Votre code de reprise</p>
      <p className="mt-1 whitespace-nowrap font-mono text-xl tracking-etiquette text-slate-50">
        {formaterCodeDeReprise(code)}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-300">
        Notez-le : il vous rend votre équipe depuis n&apos;importe quel appareil. Gardez-le pour
        vous. Il reste dans le menu « … ».
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <BoutonCopierLeCode code={formaterCodeDeReprise(code)} />
        <button type="button" onClick={noter} className={`${bouton({ variante: "lien", taille: "m" })}`}>
          C&apos;est noté
        </button>
      </div>
    </div>
  );
}
