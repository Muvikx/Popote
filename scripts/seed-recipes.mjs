/**
 * Seeds the dish library with ~100 student-friendly recipes that only need a
 * frying pan or a saucepan (no oven). Merges into the shared app_data row,
 * keeping any existing meals / fridge / shopping.
 *
 *   node --env-file=.env scripts/seed-recipes.mjs
 */
import { createClient } from '@libsql/client'
import { randomUUID } from 'node:crypto'

// [name, qty, unit]   units: pièce g kg mL L c.à.c c.à.s pincée tranche botte
const R = [
  // — Pâtes —
  ["Pâtes au beurre et parmesan", 2, "Le réconfort express : pâtes égouttées, beurre, parmesan.", [["Pâtes",200,"g"],["Beurre",30,"g"],["Parmesan",40,"g"]]],
  ["Carbonara express", 2, "Hors du feu, mélanger œufs + parmesan aux pâtes chaudes et lardons.", [["Pâtes",200,"g"],["Lardons",150,"g"],["Œufs",2,"pièce"],["Parmesan",50,"g"]]],
  ["Pâtes au pesto", 2, "Égoutter, mélanger le pesto, ajouter quelques tomates cerises.", [["Pâtes",200,"g"],["Pesto",3,"c.à.s"],["Tomates cerises",150,"g"]]],
  ["Pâtes sauce tomate basilic", 2, "Mijoter la sauce tomate avec ail et basilic, napper les pâtes.", [["Pâtes",200,"g"],["Sauce tomate",400,"g"],["Ail",1,"pièce"],["Basilic",1,"botte"]]],
  ["Pâtes thon-tomate", 2, "Faire revenir thon + tomate concassée, mélanger aux pâtes.", [["Pâtes",200,"g"],["Thon en boîte",1,"pièce"],["Sauce tomate",300,"g"],["Oignon",1,"pièce"]]],
  ["Pâtes aglio e olio", 2, "Ail doré dans l'huile d'olive + piment, verser sur les pâtes.", [["Spaghetti",200,"g"],["Ail",3,"pièce"],["Huile d'olive",4,"c.à.s"],["Piment",1,"pincée"]]],
  ["Pâtes chèvre et miel", 2, "Faire fondre le chèvre avec un filet de miel sur les pâtes.", [["Pâtes",200,"g"],["Fromage de chèvre",100,"g"],["Miel",1,"c.à.s"]]],
  ["One-pot pâtes tomate-mozza", 2, "Tout cuire dans une casserole : pâtes, tomate, eau, mozza à la fin.", [["Pâtes",200,"g"],["Sauce tomate",300,"g"],["Mozzarella",1,"pièce"],["Oignon",1,"pièce"]]],
  ["Pâtes crème et champignons", 2, "Champignons poêlés + crème, mélanger aux pâtes.", [["Pâtes",200,"g"],["Champignons",200,"g"],["Crème fraîche",150,"mL"],["Ail",1,"pièce"]]],
  ["Mac & cheese à la casserole", 2, "Sauce béchamel au fromage, mélanger aux coquillettes.", [["Coquillettes",200,"g"],["Lait",250,"mL"],["Beurre",20,"g"],["Farine",20,"g"],["Fromage râpé",100,"g"]]],
  ["Pâtes courgette-citron", 2, "Courgette poêlée, zeste de citron, parmesan.", [["Pâtes",200,"g"],["Courgette",1,"pièce"],["Citron",1,"pièce"],["Parmesan",40,"g"]]],
  ["Pâtes saumon fumé crème", 2, "Crème tiédie + saumon fumé en lanières sur les pâtes.", [["Pâtes",200,"g"],["Saumon fumé",100,"g"],["Crème fraîche",150,"mL"],["Aneth",1,"pincée"]]],
  ["Spaghetti bolognaise rapide", 2, "Bœuf haché doré + sauce tomate mijotée.", [["Spaghetti",200,"g"],["Bœuf haché",250,"g"],["Sauce tomate",400,"g"],["Oignon",1,"pièce"]]],
  ["Pâtes lardons crème", 2, "Lardons rissolés + crème, poivre.", [["Pâtes",200,"g"],["Lardons",150,"g"],["Crème fraîche",150,"mL"]]],
  ["Pâtes épinards ricotta", 2, "Épinards fondus à la poêle + ricotta crémeuse.", [["Pâtes",200,"g"],["Épinards",150,"g"],["Ricotta",125,"g"],["Ail",1,"pièce"]]],
  // — Riz & semoule —
  ["Riz cantonais", 2, "Riz sauté avec omelette, petits pois, jambon, sauce soja.", [["Riz",200,"g"],["Œufs",2,"pièce"],["Petits pois",100,"g"],["Jambon",2,"tranche"],["Sauce soja",2,"c.à.s"]]],
  ["Riz thon et maïs", 2, "Mélange rapide riz + thon + maïs + mayo ou sauce soja.", [["Riz",200,"g"],["Thon en boîte",1,"pièce"],["Maïs",150,"g"],["Mayonnaise",2,"c.à.s"]]],
  ["Risotto express", 2, "Riz nacré, bouillon louche par louche, parmesan en fin.", [["Riz arborio",200,"g"],["Bouillon de légumes",750,"mL"],["Oignon",1,"pièce"],["Parmesan",50,"g"]]],
  ["Riz sauté aux légumes", 2, "Wok de légumes + riz + sauce soja.", [["Riz",200,"g"],["Carotte",1,"pièce"],["Poivron",1,"pièce"],["Sauce soja",2,"c.à.s"]]],
  ["Riz curry pois chiches", 2, "Pois chiches mijotés au curry, servis sur le riz.", [["Riz",200,"g"],["Pois chiches",240,"g"],["Curry",1,"c.à.s"],["Lait de coco",200,"mL"]]],
  ["Semoule aux légumes", 2, "Semoule gonflée, légumes poêlés, épices.", [["Semoule",200,"g"],["Courgette",1,"pièce"],["Carotte",1,"pièce"],["Pois chiches",150,"g"]]],
  ["Riz au lait", 4, "Riz cuit doucement dans le lait sucré et la vanille.", [["Riz rond",150,"g"],["Lait",750,"mL"],["Sucre",80,"g"],["Vanille",1,"c.à.c"]]],
  ["Riz sauté œuf petits pois", 2, "Riz, œuf brouillé, petits pois, sauce soja.", [["Riz",200,"g"],["Œufs",2,"pièce"],["Petits pois",100,"g"],["Sauce soja",2,"c.à.s"]]],
  ["Riz coco curry", 2, "Riz mijoté dans le lait de coco et le curry.", [["Riz",200,"g"],["Lait de coco",200,"mL"],["Curry",1,"c.à.c"],["Oignon",1,"pièce"]]],
  ["Taboulé express", 2, "Semoule réhydratée, tomate, concombre, citron, menthe.", [["Semoule",150,"g"],["Tomate",2,"pièce"],["Concombre",1,"pièce"],["Citron",1,"pièce"],["Menthe",1,"botte"]]],
  // — Œufs —
  ["Omelette nature", 1, "Œufs battus, cuisson douce à la poêle.", [["Œufs",3,"pièce"],["Beurre",10,"g"]]],
  ["Omelette au fromage", 1, "Omelette garnie de fromage râpé.", [["Œufs",3,"pièce"],["Fromage râpé",50,"g"],["Beurre",10,"g"]]],
  ["Omelette aux champignons", 1, "Champignons poêlés repliés dans l'omelette.", [["Œufs",3,"pièce"],["Champignons",100,"g"],["Persil",1,"pincée"]]],
  ["Œufs brouillés", 1, "Œufs remués sur feu doux avec un peu de beurre.", [["Œufs",3,"pièce"],["Beurre",15,"g"]]],
  ["Œufs au plat", 1, "Œufs cuits à la poêle, jaune coulant.", [["Œufs",2,"pièce"],["Huile d'olive",1,"c.à.s"]]],
  ["Shakshuka", 2, "Œufs pochés dans une sauce tomate épicée au poivron.", [["Œufs",4,"pièce"],["Sauce tomate",400,"g"],["Poivron",1,"pièce"],["Oignon",1,"pièce"],["Cumin",1,"c.à.c"]]],
  ["Frittata pommes de terre", 2, "Omelette épaisse aux pommes de terre, cuite à la poêle couverte.", [["Œufs",4,"pièce"],["Pomme de terre",2,"pièce"],["Oignon",1,"pièce"]]],
  ["Tortilla espagnole", 2, "Pommes de terre fondantes liées aux œufs.", [["Œufs",4,"pièce"],["Pomme de terre",3,"pièce"],["Oignon",1,"pièce"],["Huile d'olive",4,"c.à.s"]]],
  ["Œufs brouillés ciboulette", 1, "Œufs brouillés crémeux à la ciboulette.", [["Œufs",3,"pièce"],["Crème fraîche",2,"c.à.s"],["Ciboulette",1,"botte"]]],
  ["Œuf poché sur toast", 1, "Œuf poché dans l'eau frémissante vinaigrée.", [["Œufs",2,"pièce"],["Pain",2,"tranche"],["Vinaigre",1,"c.à.s"]]],
  // — Poêlées & woks —
  ["Poêlée de légumes du soleil", 2, "Courgette, poivron, tomate mijotés à l'huile d'olive.", [["Courgette",1,"pièce"],["Poivron",1,"pièce"],["Tomate",2,"pièce"],["Oignon",1,"pièce"]]],
  ["Wok de poulet aux légumes", 2, "Poulet saisi + légumes croquants + sauce soja.", [["Filet de poulet",250,"g"],["Carotte",1,"pièce"],["Poivron",1,"pièce"],["Sauce soja",3,"c.à.s"]]],
  ["Wok de bœuf aux oignons", 2, "Émincé de bœuf sauté avec oignons et sauce soja.", [["Bœuf",250,"g"],["Oignon",2,"pièce"],["Sauce soja",3,"c.à.s"],["Gingembre",1,"c.à.c"]]],
  ["Poêlée pommes de terre lardons", 2, "Pommes de terre rissolées avec lardons et oignon.", [["Pomme de terre",4,"pièce"],["Lardons",150,"g"],["Oignon",1,"pièce"]]],
  ["Gnocchis poêlés", 2, "Gnocchis dorés à la poêle, beurre et parmesan.", [["Gnocchis",400,"g"],["Beurre",20,"g"],["Parmesan",40,"g"]]],
  ["Poulet sauté au curry", 2, "Poulet + oignon + curry + crème ou coco.", [["Filet de poulet",250,"g"],["Oignon",1,"pièce"],["Curry",1,"c.à.s"],["Crème fraîche",150,"mL"]]],
  ["Émincé de poulet champignons", 2, "Poulet et champignons à la crème.", [["Filet de poulet",250,"g"],["Champignons",200,"g"],["Crème fraîche",150,"mL"]]],
  ["Poêlée chou et saucisses", 2, "Chou émincé fondu avec saucisses.", [["Chou",0.5,"pièce"],["Saucisse",2,"pièce"],["Oignon",1,"pièce"]]],
  ["Légumes sautés sauce soja", 2, "Mélange de légumes croquants au wok.", [["Brocoli",200,"g"],["Carotte",1,"pièce"],["Poivron",1,"pièce"],["Sauce soja",3,"c.à.s"]]],
  ["Haricots verts à l'ail", 2, "Haricots verts sautés à l'ail et l'huile d'olive.", [["Haricots verts",300,"g"],["Ail",2,"pièce"],["Huile d'olive",2,"c.à.s"]]],
  ["Nouilles sautées", 2, "Nouilles + légumes + sauce soja au wok.", [["Nouilles",200,"g"],["Carotte",1,"pièce"],["Chou",150,"g"],["Sauce soja",3,"c.à.s"]]],
  ["Pad thaï express", 2, "Nouilles de riz, œuf, sauce, cacahuètes.", [["Nouilles de riz",200,"g"],["Œufs",2,"pièce"],["Cacahuètes",40,"g"],["Sauce soja",3,"c.à.s"],["Citron",1,"pièce"]]],
  ["Yakisoba", 2, "Nouilles sautées au chou et sauce sucrée-salée.", [["Nouilles",200,"g"],["Chou",150,"g"],["Carotte",1,"pièce"],["Sauce soja",3,"c.à.s"]]],
  ["Bœuf sauté brocoli", 2, "Bœuf saisi + brocoli + sauce soja-gingembre.", [["Bœuf",250,"g"],["Brocoli",250,"g"],["Sauce soja",3,"c.à.s"],["Gingembre",1,"c.à.c"]]],
  ["Crevettes ail persil", 2, "Crevettes sautées à l'ail et au persil.", [["Crevettes",200,"g"],["Ail",2,"pièce"],["Persil",1,"botte"],["Beurre",20,"g"]]],
  // — Légumineuses & boîtes —
  ["Curry de pois chiches", 3, "Pois chiches mijotés tomate-coco-curry.", [["Pois chiches",400,"g"],["Lait de coco",400,"mL"],["Curry",1,"c.à.s"],["Oignon",1,"pièce"]]],
  ["Chili sin carne", 3, "Haricots rouges, tomate, maïs, épices.", [["Haricots rouges",400,"g"],["Sauce tomate",400,"g"],["Maïs",150,"g"],["Cumin",1,"c.à.c"],["Oignon",1,"pièce"]]],
  ["Dahl de lentilles corail", 3, "Lentilles corail fondantes au lait de coco et curcuma.", [["Lentilles corail",200,"g"],["Lait de coco",400,"mL"],["Curcuma",1,"c.à.c"],["Oignon",1,"pièce"]]],
  ["Soupe de lentilles", 3, "Lentilles mijotées avec carotte et oignon.", [["Lentilles",200,"g"],["Carotte",2,"pièce"],["Oignon",1,"pièce"],["Bouillon de légumes",1,"L"]]],
  ["Pois chiches épicés poêlés", 2, "Pois chiches sautés au paprika et cumin.", [["Pois chiches",240,"g"],["Paprika",1,"c.à.c"],["Cumin",1,"c.à.c"],["Huile d'olive",2,"c.à.s"]]],
  ["Haricots blancs sauce tomate", 2, "Haricots blancs mijotés à la tomate et l'ail.", [["Haricots blancs",400,"g"],["Sauce tomate",300,"g"],["Ail",1,"pièce"]]],
  ["Salade de pois chiches", 2, "Sans cuisson : pois chiches, tomate, oignon, citron.", [["Pois chiches",240,"g"],["Tomate",1,"pièce"],["Oignon rouge",0.5,"pièce"],["Citron",1,"pièce"]]],
  ["Lentilles aux légumes", 3, "Lentilles + carottes + oignon mijotés.", [["Lentilles",200,"g"],["Carotte",2,"pièce"],["Oignon",1,"pièce"],["Bouillon de légumes",750,"mL"]]],
  ["Houmous express", 4, "Pois chiches mixés tahini-citron-ail.", [["Pois chiches",240,"g"],["Tahini",2,"c.à.s"],["Citron",1,"pièce"],["Ail",1,"pièce"]]],
  ["Soupe de pois cassés", 3, "Pois cassés mijotés longuement, mixés.", [["Pois cassés",250,"g"],["Carotte",1,"pièce"],["Oignon",1,"pièce"],["Bouillon de légumes",1,"L"]]],
  // — Soupes & veloutés —
  ["Soupe de courgettes", 3, "Courgettes mijotées puis mixées avec une vache qui rit.", [["Courgette",3,"pièce"],["Oignon",1,"pièce"],["Bouillon de légumes",750,"mL"],["Fromage fondu",2,"pièce"]]],
  ["Soupe de tomates", 3, "Tomates mijotées au basilic, mixées.", [["Tomate",6,"pièce"],["Oignon",1,"pièce"],["Basilic",1,"botte"],["Bouillon de légumes",500,"mL"]]],
  ["Velouté de potiron", 3, "Potiron fondant mixé, touche de crème.", [["Potiron",600,"g"],["Oignon",1,"pièce"],["Crème fraîche",100,"mL"],["Bouillon de légumes",750,"mL"]]],
  ["Velouté de carottes", 3, "Carottes mijotées au cumin, mixées.", [["Carotte",6,"pièce"],["Oignon",1,"pièce"],["Cumin",1,"c.à.c"],["Bouillon de légumes",750,"mL"]]],
  ["Soupe poireaux pommes de terre", 3, "Le classique mixé ou non.", [["Poireau",2,"pièce"],["Pomme de terre",3,"pièce"],["Bouillon de légumes",1,"L"]]],
  ["Minestrone express", 3, "Légumes en dés + pâtes + haricots en bouillon.", [["Carotte",1,"pièce"],["Courgette",1,"pièce"],["Haricots blancs",200,"g"],["Pâtes",80,"g"],["Bouillon de légumes",1,"L"]]],
  ["Soupe miso express", 2, "Bouillon, pâte miso, tofu et oignon vert.", [["Pâte miso",2,"c.à.s"],["Tofu",100,"g"],["Oignon vert",2,"pièce"],["Eau",750,"mL"]]],
  ["Soupe à l'oignon", 2, "Oignons caramélisés, bouillon, pain et fromage.", [["Oignon",4,"pièce"],["Bouillon de bœuf",750,"mL"],["Pain",2,"tranche"],["Fromage râpé",60,"g"]]],
  ["Bouillon ramen express", 2, "Bouillon parfumé, nouilles, œuf mollet.", [["Nouilles",150,"g"],["Bouillon de légumes",750,"mL"],["Œufs",2,"pièce"],["Sauce soja",2,"c.à.s"],["Oignon vert",2,"pièce"]]],
  ["Soupe de champignons", 3, "Champignons mijotés à la crème, mixés.", [["Champignons",400,"g"],["Oignon",1,"pièce"],["Crème fraîche",100,"mL"],["Bouillon de légumes",600,"mL"]]],
  // — Pommes de terre —
  ["Purée maison", 2, "Pommes de terre écrasées au lait et beurre.", [["Pomme de terre",4,"pièce"],["Lait",100,"mL"],["Beurre",30,"g"]]],
  ["Pommes de terre sautées", 2, "Pommes de terre rissolées à la poêle, persil.", [["Pomme de terre",4,"pièce"],["Huile d'olive",3,"c.à.s"],["Persil",1,"botte"]]],
  ["Pommes de terre oignons", 2, "Poêlée rustique pommes de terre et oignons.", [["Pomme de terre",4,"pièce"],["Oignon",2,"pièce"],["Huile d'olive",3,"c.à.s"]]],
  ["Pommes de terre paprika", 2, "Rissolées au paprika fumé.", [["Pomme de terre",4,"pièce"],["Paprika",1,"c.à.c"],["Huile d'olive",3,"c.à.s"]]],
  ["Écrasé à l'huile d'olive", 2, "Pommes de terre écrasées grossièrement, huile d'olive et ail.", [["Pomme de terre",4,"pièce"],["Huile d'olive",3,"c.à.s"],["Ail",1,"pièce"]]],
  // — Poêle sucrée/salée rapide —
  ["Croque-monsieur à la poêle", 1, "Pain, jambon, fromage, doré à la poêle.", [["Pain de mie",2,"tranche"],["Jambon",1,"tranche"],["Fromage râpé",50,"g"],["Beurre",10,"g"]]],
  ["Quesadilla au fromage", 1, "Tortilla pliée garnie de fromage, dorée à sec.", [["Tortilla",2,"pièce"],["Fromage râpé",80,"g"],["Maïs",50,"g"]]],
  ["Wrap poulet crudités", 1, "Réchauffé à la poêle, garni de poulet et crudités.", [["Tortilla",1,"pièce"],["Filet de poulet",100,"g"],["Salade",2,"pièce"],["Tomate",1,"pièce"]]],
  ["Pancakes", 2, "Pâte simple cuite à la poêle, à empiler.", [["Farine",150,"g"],["Lait",200,"mL"],["Œufs",1,"pièce"],["Sucre",2,"c.à.s"],["Levure",1,"c.à.c"]]],
  ["Crêpes", 4, "Pâte fluide reposée, cuite à la poêle.", [["Farine",250,"g"],["Lait",500,"mL"],["Œufs",3,"pièce"],["Beurre",30,"g"]]],
  ["Pain perdu", 2, "Pain trempé œuf-lait-sucre, doré au beurre.", [["Pain",4,"tranche"],["Œufs",2,"pièce"],["Lait",200,"mL"],["Sucre",2,"c.à.s"]]],
  ["Galette de flocons d'avoine", 1, "Flocons + œuf + banane, à la poêle.", [["Flocons d'avoine",60,"g"],["Œufs",1,"pièce"],["Banane",1,"pièce"]]],
  ["Blinis express", 2, "Petites crêpes épaisses à la poêle.", [["Farine",125,"g"],["Lait",150,"mL"],["Œufs",1,"pièce"],["Levure",1,"c.à.c"]]],
  // — Viandes & poissons à la poêle —
  ["Steak haché et oignons", 1, "Steak poêlé, oignons fondus.", [["Steak haché",1,"pièce"],["Oignon",1,"pièce"],["Huile d'olive",1,"c.à.s"]]],
  ["Escalope de poulet poêlée", 1, "Escalope dorée, sel et poivre.", [["Escalope de poulet",1,"pièce"],["Huile d'olive",1,"c.à.s"]]],
  ["Poisson poêlé au citron", 1, "Filet de poisson saisi, jus de citron.", [["Filet de poisson",1,"tranche"],["Citron",1,"pièce"],["Beurre",15,"g"]]],
  ["Saucisses-lentilles", 2, "Saucisses dorées sur lit de lentilles mijotées.", [["Saucisse",2,"pièce"],["Lentilles",200,"g"],["Carotte",1,"pièce"],["Oignon",1,"pièce"]]],
  ["Boulettes sauce tomate", 2, "Boulettes de viande mijotées dans la sauce tomate.", [["Bœuf haché",250,"g"],["Sauce tomate",400,"g"],["Oignon",1,"pièce"],["Chapelure",30,"g"]]],
  ["Dinde à la moutarde", 2, "Émincé de dinde, crème et moutarde.", [["Escalope de dinde",250,"g"],["Crème fraîche",150,"mL"],["Moutarde",1,"c.à.s"]]],
  ["Saumon poêlé", 1, "Pavé de saumon saisi côté peau.", [["Pavé de saumon",1,"tranche"],["Huile d'olive",1,"c.à.s"],["Citron",1,"pièce"]]],
  ["Cordon bleu poêlé", 1, "Cordon bleu doré à la poêle.", [["Cordon bleu",1,"pièce"],["Huile d'olive",1,"c.à.s"]]],
  ["Merguez-semoule", 2, "Merguez poêlées, semoule et légumes.", [["Merguez",4,"pièce"],["Semoule",150,"g"],["Courgette",1,"pièce"]]],
  ["Poulet teriyaki", 2, "Poulet glacé à la sauce soja-miel.", [["Filet de poulet",250,"g"],["Sauce soja",3,"c.à.s"],["Miel",1,"c.à.s"],["Gingembre",1,"c.à.c"]]],
  // — Veggie & divers —
  ["Falafels poêlés", 2, "Galettes de pois chiches mixés, dorées à la poêle.", [["Pois chiches",240,"g"],["Ail",1,"pièce"],["Cumin",1,"c.à.c"],["Persil",1,"botte"]]],
  ["Tofu sauté sauce soja", 2, "Tofu doré laqué à la sauce soja.", [["Tofu",200,"g"],["Sauce soja",3,"c.à.s"],["Oignon vert",2,"pièce"]]],
  ["Curry de légumes coco", 3, "Légumes mijotés au lait de coco et curry.", [["Courgette",1,"pièce"],["Carotte",2,"pièce"],["Lait de coco",400,"mL"],["Curry",1,"c.à.s"]]],
  ["Champignons à l'ail", 2, "Champignons sautés ail-persil.", [["Champignons",300,"g"],["Ail",2,"pièce"],["Persil",1,"botte"],["Beurre",20,"g"]]],
  ["Ratatouille express", 3, "Tous les légumes du soleil mijotés à la poêle.", [["Aubergine",1,"pièce"],["Courgette",1,"pièce"],["Poivron",1,"pièce"],["Tomate",3,"pièce"],["Oignon",1,"pièce"]]],
  ["Couscous végétarien", 3, "Semoule + légumes mijotés + pois chiches.", [["Semoule",200,"g"],["Carotte",2,"pièce"],["Courgette",1,"pièce"],["Pois chiches",240,"g"]]],
  ["Poêlée de chou-fleur", 2, "Chou-fleur sauté au curcuma.", [["Chou-fleur",0.5,"pièce"],["Curcuma",1,"c.à.c"],["Huile d'olive",2,"c.à.s"]]],
  ["Banane poêlée caramélisée", 2, "Bananes dorées au beurre et sucre.", [["Banane",2,"pièce"],["Beurre",20,"g"],["Sucre",2,"c.à.s"]]],
  ["Compote de pommes", 4, "Pommes mijotées en casserole, cannelle.", [["Pomme",4,"pièce"],["Sucre",2,"c.à.s"],["Cannelle",1,"pincée"]]],
  ["Porridge", 1, "Flocons d'avoine cuits dans le lait, fruits.", [["Flocons d'avoine",60,"g"],["Lait",250,"mL"],["Banane",1,"pièce"],["Miel",1,"c.à.s"]]],
  ["Semoule au lait", 2, "Semoule cuite dans le lait sucré.", [["Semoule",80,"g"],["Lait",500,"mL"],["Sucre",40,"g"],["Vanille",1,"c.à.c"]]],
  ["Œufs cocotte poêle", 2, "Œufs cuits dans la crème à couvert.", [["Œufs",4,"pièce"],["Crème fraîche",100,"mL"],["Fromage râpé",40,"g"]]],
  ["Poêlée de gnocchis tomate", 2, "Gnocchis poêlés nappés de sauce tomate.", [["Gnocchis",400,"g"],["Sauce tomate",300,"g"],["Mozzarella",1,"pièce"]]],
  ["Riz sauté kimchi", 2, "Riz sauté relevé au kimchi et œuf.", [["Riz",200,"g"],["Kimchi",100,"g"],["Œufs",1,"pièce"],["Sauce soja",1,"c.à.s"]]],
  ["Poêlée mexicaine", 2, "Riz, haricots rouges, maïs, épices.", [["Riz",150,"g"],["Haricots rouges",200,"g"],["Maïs",150,"g"],["Cumin",1,"c.à.c"]]],
  ["Soupe nouilles poulet", 2, "Bouillon, nouilles, poulet effiloché, légumes.", [["Nouilles",150,"g"],["Filet de poulet",150,"g"],["Carotte",1,"pièce"],["Bouillon de légumes",750,"mL"]]],
]

const dishes = R.map(([title, servings, notes, ings]) => ({
  id: randomUUID(),
  title,
  servings,
  notes,
  ingredients: ings.map(([name, qty, unit]) => ({ id: randomUUID(), name, qty, unit })),
}))

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

await db.execute(
  `CREATE TABLE IF NOT EXISTS app_data (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER)`,
)
const existing = await db.execute({ sql: 'SELECT data FROM app_data WHERE id = ?', args: ['shared'] })
let state = { meals: [], fridge: [], dishes: [], manualShopping: [], checkedAuto: [] }
if (existing.rows.length) {
  try {
    state = { ...state, ...JSON.parse(String(existing.rows[0].data)) }
  } catch {
    /* keep defaults */
  }
}
state.dishes = dishes // replace the library with the curated recipes

await db.execute({
  sql: `INSERT INTO app_data (id, data, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  args: ['shared', JSON.stringify(state), Date.now()],
})

console.log(`✓ ${dishes.length} recettes ajoutées à la bibliothèque (poêle / casserole).`)
