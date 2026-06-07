# 🥕 Le Garde-Manger

Un planificateur de cuisine élégant qui réunit **trois outils en un**, avec une
liste de courses **calculée automatiquement**.

| Onglet | Ce qu'il fait |
| --- | --- |
| **Calendrier** | Planifiez vos repas sur la semaine (petit-déj / midi / soir), avec ingrédients, portions et notes. Cochez « préparé » quand c'est fait. |
| **Frigo** | Inventaire de vos aliments, classés par catégorie, avec quantités ajustables et alertes de péremption. |
| **Courses** | La liste se génère seule : **ingrédients des repas planifiés − ce qui est déjà dans le frigo + vos ajouts manuels**. Cochez ce que vous achetez, puis rangez-le dans le frigo en un clic. |

## Le principe malin

La liste de courses n'est jamais saisie à la main : elle agrège tous les
ingrédients des repas à venir, en **soustrait le stock du frigo** (ex. *Parmesan :
besoin de 100 g · 80 g au frigo → acheter 20 g*), et ignore les repas déjà
cuisinés. Une fois les courses faites, le bouton **« Ranger dans le frigo »**
remet automatiquement les articles cochés dans votre stock — la boucle est bouclée.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** (design system « carnet de cuisine » : papier crème, accents
  tomate & herbe, typographies *Fraunces* + *Hanken Grotesk*)
- **Framer Motion** (transitions, micro-interactions)
- **date-fns** (gestion des semaines, en français)
- Persistance **localStorage** — aucune base de données, vos données restent dans
  votre navigateur.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
```

Autres commandes :

```bash
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
```

> Le bouton **« Réinitialiser »** en bas de page restaure les données de
> démonstration (repas, frigo, courses).

## Structure

```
src/
├─ App.tsx             # coquille : en-tête, navigation, transitions
├─ store.tsx           # état global + persistance localStorage + données de démo
├─ types.ts            # modèle de données (Meal, FridgeItem, ShoppingItem…)
├─ lib/
│  ├─ date.ts          # helpers de dates (semaines, FR)
│  └─ shopping.ts      # 🧠 cœur : agrégation repas − frigo
├─ components/         # Modal, MealEditor, FridgeEditor, QtyStepper
└─ views/              # CalendarView, FridgeView, ShoppingView
```

## Pistes d'évolution

- Bibliothèque de recettes réutilisables
- Multiplier les quantités selon le nombre de portions
- Backend + comptes pour synchroniser entre appareils
- Export de la liste de courses (PDF / partage)
