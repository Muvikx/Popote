/**
 * Clears ALL app data and replaces the dish library with the user's own list.
 * Quantities default to 1 pièce per ingredient (editable in-app).
 *
 *   node --env-file=.env scripts/seed-dishes.mjs
 */
import { createClient } from '@libsql/client'
import { randomUUID } from 'node:crypto'

// [title, [ingredients...]]
const D = [
  ["Riz au thon", ["Riz", "Thon", "Olives", "Sauce tomate"]],
  ["Soupe", ["Soupe légumes du soleil", "Croûtons"]],
  ["Tomates à la Poêle", ["Tomates", "Assésonement", "Féculent"]],
  ["Carottes Haricot", ["Carottes", "Harricot vert", "Citron", "Oignon", "Féculent"]],
  ["Purée Saucisse", ["Purée", "saucisses", "Merguez", "Gruyère"]],
  ["Wrap Salade", ["Wraps", "Iceberg", "Tomates", "Mozarella", "Maïs", "Jambon", "Sauces"]],
  ["Soupe de pâtes", ["Alphabet", "Bouillon", "Beurre", "Gruyère", "Sel"]],
  ["Poêlé de maïs", ["Maïs", "Knaki", "Tomates", "Echalotte", "Paprika"]],
  ["Escalope milanaise", ["Escalope milanaise", "Carottes crue", "Citron", "Féculent"]],
  ["Lentilles au curry", ["Lentilles", "Curry", "Oignon", "Chorizo"]],
  ["Raclette", ["Frommage", "Jambon", "Rosette", "Cornichon", "Tomates cerises"]],
  ["Pates Bolognaise", ["Pates", "Sauce tomate", "Viande hachée", "Oignon", "Gruyère"]],
  ["Croque monsieur", ["Pain de mie", "Jambon", "Gruyère", "Beurre", "Lait (ou Béchamel)"]],
  ["Pates carbonara", ["Pâtes", "Lardons", "Œufs", "Crème fraîche", "Gruyère"]],
  ["Pâtes poulet chorizo", ["Pâtes", "Blanc de poulet", "Chorizo", "Crème fraîche", "Oignon", "Ail", "Paprika"]],
  ["Bavette au roquefort", ["Bavette", "Pomme de terre", "Harricots verts", "Crème fraiche", "roquefort"]],
  ["Steak pomme rissolé", ["Steak", "Pomme de terre rissolé", "sauce"]],
  ["Poêlée de pommes de terre & saucisse fumée", ["Saucisse fumée", "Pomme de terre", "Oignon", "Echalotte"]],
  ["Bœuf caramélisé aux oignons & riz", ["Riz", "Boeuf", "Oignon", "Sauce soja", "Miel"]],
  ["Salade de pate / Riz", ["Pates / Riz", "Tomates", "Fromage"]],
  ["Nuggets purée harricots", ["Purée", "Nuggets", "Harricots verts"]],
  ["Crepes", ["Crepes", "jambon", "frommage", "sucre", "nutella", "oeuf", "lait", "farine", "huile de tournesol"]],
]

const dishes = D.map(([title, ings]) => ({
  id: randomUUID(),
  title,
  servings: 2,
  ingredients: ings.map((name) => ({ id: randomUUID(), name, qty: 1, unit: 'pièce' })),
}))

const state = { meals: [], fridge: [], dishes, manualShopping: [], checkedAuto: [] }

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})
await db.execute(
  `CREATE TABLE IF NOT EXISTS app_data (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER)`,
)
await db.execute({
  sql: `INSERT INTO app_data (id, data, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  args: ['shared', JSON.stringify(state), Date.now()],
})

console.log(`✓ Données réinitialisées. ${dishes.length} plats chargés, meals/frigo/courses vidés.`)
