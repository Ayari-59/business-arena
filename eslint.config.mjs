import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * Configuration ESLint (flat config, Next 16 — `next lint` a été retiré, on
 * appelle l'ESLint CLI directement). On part des règles Next « core-web-vitals »
 * (Next + React + React Hooks, avec les règles Web Vitals en erreur) et des
 * règles TypeScript de `typescript-eslint`. Les variables/imports inutilisés
 * sont déjà couverts par `noUnusedLocals`/`noUnusedParameters` de tsconfig ; on
 * garde la règle ESLint alignée (préfixe `_` toléré) pour les fichiers non typés.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Le nouveau plugin react-hooks de Next 16 (encore en RC) ajoute trois
      // règles très strictes qui, ici, se déclenchent sur du code intentionnel
      // et correct — voire sur des faux positifs :
      //  - set-state-in-effect : nos effets de MONTAGE / de synchronisation
      //    (fermer le menu au changement de route, hydrater le thème depuis le
      //    DOM, restaurer un brouillon localStorage) sont des usages légitimes ;
      //  - refs : la règle prend le `formRef`/`guardError` renvoyés par notre
      //    hook `useGuardedAction` pour un accès à `.current` en rendu, alors que
      //    `ref={hook.formRef}` est le passage de ref standard et que
      //    `guardError` est un état ;
      //  - immutability : elle signale une mutation du DOM faite dans un
      //    gestionnaire d'événement (et non en rendu), ce qui est correct.
      // On les garde en AVERTISSEMENT : visibles, sans bloquer, à durcir quand le
      // plugin sera stable et le code éventuellement adapté.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**", // rapports de couverture générés (test:coverage)
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);
