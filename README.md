# Révisions

Application web locale pour réviser tes cours d'école d'ingénieur : fiches de synthèse (Markdown + LaTeX), quiz interactifs, flashcards, exercices corrigés et suivi des points faibles.

Aucun backend : tout tourne dans le navigateur, et les cours sont de simples fichiers `.json` que tu déposes dans un dossier.

## Lancer l'application

```bash
npm install
npm run dev
```

Puis ouvre l'URL affichée dans le terminal (par défaut [http://localhost:5173](http://localhost:5173)).

## Mise en ligne

Chaque envoi (push) sur la branche `main` de GitHub reconstruit et publie automatiquement le site sur GitHub Pages (voir `.github/workflows/deploy.yml`). Pour ajouter un cours en ligne : dépose le `.json` dans `courses/GIM/` ou `courses/GIE/`, fais un commit, puis un push.

## Où déposer tes cours

Chaque cours est un fichier `.json` placé dans le dossier de sa filière : [`courses/GIM/`](courses/GIM/) ou [`courses/GIE/`](courses/GIE/). Chaque sous-dossier de `courses/` devient une filière dans le sélecteur en haut de la barre latérale (il apparaît dès que deux filières contiennent des cours) ; un fichier posé directement dans `courses/` est visible dans toutes les filières. Le nom du fichier sert d'identifiant interne (utilisé pour stocker tes scores et progrès) — évite de le renommer une fois que tu as commencé à réviser dessus.

L'application scanne automatiquement ce dossier au démarrage : ajoute ou modifie un fichier `.json`, le serveur de dev recharge la page tout seul.

### Format d'un fichier de cours

```jsonc
{
  "matiere": "Mathématiques",
  "type": "CM", // ou "TD", "TP"
  "sujet": "Algèbre linéaire — valeurs propres",
  "fiche_synthese": "# Titre\n\nDu **Markdown**, avec du LaTeX inline $E=mc^2$ ou en bloc :\n\n$$\\int_0^1 x\\,dx = \\frac12$$",
  "quiz": [
    {
      "id": "q1",
      "question": "Énoncé de la question ?",
      "options": [
        { "id": "a", "text": "Réponse A" },
        { "id": "b", "text": "Réponse B" }
      ],
      "correct": "a",
      "explanation": "Pourquoi A est la bonne réponse."
    }
  ],
  "flashcards": [
    { "id": "f1", "recto": "Question ou terme", "verso": "Réponse ou définition" }
  ],
  "exercices": [
    {
      "titre": "Titre de l'exercice",
      "difficulte": 2, // 1 à 5
      "enonce": "Énoncé en Markdown/LaTeX",
      "corrige": "Corrigé en Markdown/LaTeX"
    }
  ],
  "suivi": "Notes libres sur ce cours : points à retravailler, rappels, etc."
}
```

Chaque section (`quiz`, `flashcards`, `exercices`) peut être vide (`[]`) si elle ne s'applique pas encore à ce cours.

## Fonctionnalités

- **Fiche** : rendu Markdown avec support LaTeX (`$...$` inline, `$$...$$` en bloc).
- **Quiz** : une question à la fois, feedback immédiat (bonne/mauvaise réponse + explication), score final et liste des questions ratées.
- **Flashcards** : cartes retournables (clic ou espace), navigation, mélange, marquage "à revoir" / "acquise".
- **Exercices** : triés par difficulté croissante, corrigé masqué par défaut.
- **Suivi** : notes libres du cours + agrégation de toutes les questions de quiz ratées au moins une fois, tous cours confondus, groupées par matière, pour repérer tes points faibles récurrents.

## Persistance

Tout est stocké dans le `localStorage` du navigateur (scores de quiz, questions ratées, statut des flashcards) — rien n'est envoyé à un serveur. Vider les données du site dans le navigateur réinitialise ta progression.

## Stack technique

Vite · React · TypeScript · Tailwind CSS v4 · react-markdown + remark-math + rehype-katex (KaTeX) pour le rendu Markdown/LaTeX.
