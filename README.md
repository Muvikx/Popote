# 🥕 Popote

Un planificateur de cuisine élégant qui réunit **quatre outils en un**, avec une
liste de courses **calculée automatiquement**. Privé, protégé par mot de passe,
données synchronisées entre vos appareils. **Installable comme une app (PWA)** et
pensé pour le mobile.

| Onglet | Ce qu'il fait |
| --- | --- |
| **Calendrier** | Planifiez vos repas (petit-déj / midi / soir). **Glissez-déposez** un repas d'un jour à l'autre. Cochez « préparé » quand c'est fait. |
| **Plats** | Bibliothèque de plats réutilisables. Lors de l'ajout d'un repas, le champ nom **recherche vos plats** et remplit les ingrédients automatiquement. |
| **Frigo** | Inventaire de vos aliments, classés par catégorie, quantités ajustables et alertes de péremption. |
| **Courses** | La liste se génère seule : **ingrédients des repas planifiés − ce qui est déjà dans le frigo + vos ajouts manuels**. Cochez ce que vous achetez, puis rangez-le dans le frigo en un clic. |

## Le principe malin

La liste de courses n'est jamais saisie à la main : elle agrège les ingrédients
des repas à venir, en **soustrait le stock du frigo** (ex. *Parmesan : besoin de
100 g · 80 g au frigo → acheter 20 g*), et ignore les repas déjà cuisinés. Le
bouton **« Ranger dans le frigo »** remet ensuite les articles cochés dans votre
stock.

## Stack

- **Front** : Vite + React + TypeScript + Tailwind CSS + Framer Motion + date-fns
- **API** : fonctions serverless (`/api`) — `login`, `logout`, `state`
- **Base** : **SQLite via [Turso](https://turso.tech) (libSQL)** — `@libsql/client`
- **Auth** : e-mail / mot de passe, mots de passe hachés (scrypt), session par
  cookie JWT signé (`jose`). Données **partagées** entre les comptes.
- **Hébergement** : Vercel

```
React (navigateur) ──► /api (serverless) ──► Turso (SQLite)
```

En **dev local**, le même client `@libsql/client` peut taper un simple fichier
`local.db` (mettez `TURSO_DATABASE_URL=file:local.db`).

## Variables d'environnement

Copiez `.env.example` vers `.env` puis renseignez :

| Variable | Rôle |
| --- | --- |
| `AUTH_SECRET` | Clé de signature des sessions (longue chaîne aléatoire). `openssl rand -base64 32` |
| `TURSO_DATABASE_URL` | `libsql://…` (prod) ou `file:local.db` (dev) |
| `TURSO_AUTH_TOKEN` | Jeton Turso (prod uniquement) |
| `USER1_EMAIL` / `USER1_PASSWORD` | 1er compte (jusqu'à `USER4_*`) |
| `USER2_EMAIL` / `USER2_PASSWORD` | 2e compte |

> ⚠️ `.env` et `local.db` sont **gitignorés** — aucun secret n'est commité.

## Démarrer en local

```bash
npm install
cp .env.example .env      # puis éditez les valeurs
npm run db:setup          # crée le schéma + les comptes
npm run dev               # http://localhost:5173 (web + API)
```

`npm run dev` lance **deux** processus (Vite + serveur d'API local sur le port
8787, vers lequel Vite proxie `/api`).

| Commande | Effet |
| --- | --- |
| `npm run dev` | Front + API en local |
| `npm run db:setup` | (Ré)applique le schéma et (ré)crée les comptes définis dans `.env` |
| `npm run db:recipes` | Charge ~100 recettes étudiantes (poêle/casserole) dans la bibliothèque |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build |

## Déploiement (Vercel + Turso)

1. **Turso** — créez la base et récupérez ses identifiants :
   ```bash
   turso db create popote
   turso db show popote --url        # → TURSO_DATABASE_URL
   turso db tokens create popote     # → TURSO_AUTH_TOKEN
   ```
2. **Vercel** — importez ce dépôt GitHub (preset *Vite* auto-détecté) et ajoutez
   les variables d'environnement : `AUTH_SECRET`, `TURSO_DATABASE_URL`,
   `TURSO_AUTH_TOKEN`.
3. **Comptes** — une seule fois, avec un `.env` pointant sur Turso :
   ```bash
   npm run db:setup
   ```
   (crée le schéma et vos comptes dans la base cloud).
4. Chaque `git push` sur `main` redéploie automatiquement.

## Structure

```
api/                 # fonctions serverless Vercel (login, logout, state)
server/              # cœur partagé : db (libsql), auth, handlers, serveur de dev
scripts/setup-db.ts  # création schéma + comptes
src/
├─ App.tsx           # coquille : auth, navigation, transitions
├─ store.tsx         # état global, chargement/sauvegarde API, cache local
├─ lib/
│  ├─ shopping.ts    # 🧠 cœur : agrégation repas − frigo
│  ├─ api.ts         # appels /api
│  └─ date.ts        # helpers de dates (FR)
├─ components/       # Modal, MealEditor, FridgeEditor, QtyStepper, LoginScreen
└─ views/            # CalendarView, FridgeView, ShoppingView
```

## Pistes d'évolution

- Bibliothèque de recettes réutilisables
- Multiplier les quantités selon le nombre de portions
- Export de la liste de courses (PDF / partage)
