import type { Ingredient } from '../types';

// Mercadona sections, in the order they appear in the online shop.
export const AISLES = [
  'Fruta y verdura',
  'Carne',
  'Marisco y pescado',
  'Charcutería y quesos',
  'Panadería y pastelería',
  'Huevos, leche y mantequilla',
  'Arroz, legumbres y pasta',
  'Conservas, caldos y cremas',
  'Aceite, especias y salsas',
  'Congelados',
] as const;

const FV = 'Fruta y verdura';
const CA = 'Carne';
const PE = 'Marisco y pescado';
const CH = 'Charcutería y quesos';
const PA = 'Panadería y pastelería';
const HL = 'Huevos, leche y mantequilla';
const AL = 'Arroz, legumbres y pasta';
const CO = 'Conservas, caldos y cremas';
const AC = 'Aceite, especias y salsas';
const CG = 'Congelados';

// Prices are estimates; the weekly Mercadona job replaces them with real ones.
export const INGREDIENTS: Ingredient[] = [
  // Fruta y verdura
  { id: 'patata', name: 'Patatas', aisle: FV, unit: 'g', pack: 2000, price: 2.99, q: ['patata'] },
  { id: 'cebolla', name: 'Cebollas', aisle: FV, unit: 'g', pack: 1000, price: 1.6, q: ['cebolla'] },
  { id: 'ajo', name: 'Ajos', aisle: FV, unit: 'g', pack: 250, price: 1.5, q: ['ajo'] },
  { id: 'tomate', name: 'Tomates', aisle: FV, unit: 'g', pack: 1000, price: 2.5, q: ['tomate'] },
  { id: 'calabacin', name: 'Calabacín', aisle: FV, unit: 'g', pack: 600, price: 1.4, q: ['calabacin'] },
  { id: 'pimiento_rojo', name: 'Pimiento rojo', aisle: FV, unit: 'g', pack: 500, price: 1.9, q: ['pimiento', 'rojo'] },
  { id: 'pimiento_verde', name: 'Pimiento verde', aisle: FV, unit: 'g', pack: 500, price: 1.5, q: ['pimiento', 'verde'], x: ['freir'] },
  { id: 'zanahoria', name: 'Zanahorias', aisle: FV, unit: 'g', pack: 1000, price: 1.1, q: ['zanahoria'] },
  { id: 'lechuga', name: 'Lechuga', aisle: FV, unit: 'ud', pack: 1, price: 1.0, q: ['lechuga'] },
  { id: 'espinacas', name: 'Espinacas frescas', aisle: FV, unit: 'g', pack: 300, price: 1.6, q: ['espinaca'] },
  { id: 'champinon', name: 'Champiñones', aisle: FV, unit: 'g', pack: 250, price: 1.3, q: ['champinon'] },
  { id: 'brocoli', name: 'Brócoli', aisle: FV, unit: 'g', pack: 500, price: 1.8, q: ['brocoli'] },
  { id: 'calabaza', name: 'Calabaza', aisle: FV, unit: 'g', pack: 1000, price: 1.8, q: ['calabaza'] },
  { id: 'puerro', name: 'Puerros', aisle: FV, unit: 'g', pack: 500, price: 1.4, q: ['puerro'] },
  { id: 'aguacate', name: 'Aguacates', aisle: FV, unit: 'ud', pack: 2, price: 2.5, q: ['aguacate'] },
  { id: 'limon', name: 'Limones', aisle: FV, unit: 'ud', pack: 6, price: 1.9, q: ['limon'] },
  { id: 'pepino', name: 'Pepino', aisle: FV, unit: 'ud', pack: 1, price: 0.6, q: ['pepino'] },
  { id: 'berenjena', name: 'Berenjena', aisle: FV, unit: 'g', pack: 500, price: 1.3, q: ['berenjena'] },

  // Carne
  { id: 'pechuga_pollo', name: 'Pechuga de pollo fileteada', aisle: CA, unit: 'g', pack: 500, price: 3.6, q: ['pechuga', 'pollo'], animal: 'carne' },
  { id: 'pollo_troceado', name: 'Pollo troceado', aisle: CA, unit: 'g', pack: 1200, price: 4.9, q: ['pollo', 'troceado'], animal: 'carne' },
  { id: 'carne_picada', name: 'Carne picada mixta', aisle: CA, unit: 'g', pack: 500, price: 3.5, q: ['picada'], animal: 'carne' },
  { id: 'ternera_tiras', name: 'Ternera para saltear', aisle: CA, unit: 'g', pack: 400, price: 4.8, q: ['ternera'], animal: 'carne' },
  { id: 'lomo_cerdo', name: 'Lomo de cerdo en filetes', aisle: CA, unit: 'g', pack: 500, price: 3.5, q: ['lomo', 'cerdo'], animal: 'carne' },
  { id: 'hamburguesa_vacuno', name: 'Burger meat de vacuno', aisle: CA, unit: 'ud', pack: 4, price: 3.6, q: ['burger', 'vacuno'], animal: 'carne' },

  // Pescado
  { id: 'merluza', name: 'Filetes de merluza', aisle: PE, unit: 'g', pack: 500, price: 5.9, q: ['merluza'], x: ['rebozad', 'empanad', 'varita', 'salsa', 'cocid'], animal: 'pescado', allergens: ['pescado'] },
  { id: 'salmon', name: 'Lomos de salmón', aisle: PE, unit: 'g', pack: 250, price: 5.2, q: ['salmon'], x: ['ahumad', 'rodajas', 'salsa', 'tartar'], animal: 'pescado', allergens: ['pescado'] },
  { id: 'bacalao', name: 'Bacalao desalado', aisle: PE, unit: 'g', pack: 400, price: 5.6, q: ['bacalao'], x: ['ahumad', 'salsa', 'rebozad', 'rodajas'], animal: 'pescado', allergens: ['pescado'] },
  { id: 'gambas', name: 'Gambas peladas congeladas', aisle: PE, unit: 'g', pack: 300, price: 4.25, q: ['gamba', 'pelada'], animal: 'pescado', allergens: ['marisco'] },

  // Charcutería y quesos
  { id: 'jamon_serrano', name: 'Jamón serrano lonchas', aisle: CH, unit: 'g', pack: 150, price: 2.5, q: ['jamon', 'serrano'], x: ['taco', 'pieza'], animal: 'carne' },
  { id: 'jamon_cocido', name: 'Jamón cocido lonchas', aisle: CH, unit: 'g', pack: 250, price: 2.2, q: ['jamon', 'cocido'], animal: 'carne' },
  { id: 'pavo_lonchas', name: 'Pechuga de pavo lonchas', aisle: CH, unit: 'g', pack: 250, price: 2.4, q: ['pechuga', 'pavo'], animal: 'carne' },
  { id: 'bacon', name: 'Bacon en taquitos', aisle: CH, unit: 'g', pack: 200, price: 2.0, q: ['bacon'], animal: 'carne' },
  { id: 'queso_lonchas', name: 'Queso en lonchas', aisle: CH, unit: 'g', pack: 300, price: 2.7, q: ['queso', 'lonchas'], animal: 'lacteo', allergens: ['lactosa'] },
  { id: 'mozzarella_rallada', name: 'Mozzarella rallada', aisle: CH, unit: 'g', pack: 200, price: 1.7, q: ['mozzarella', 'rallad'], animal: 'lacteo', allergens: ['lactosa'] },
  { id: 'queso_rallado', name: 'Queso rallado curado', aisle: CH, unit: 'g', pack: 200, price: 2.1, q: ['queso', 'rallado'], animal: 'lacteo', allergens: ['lactosa'] },
  { id: 'hummus', name: 'Hummus', aisle: CH, unit: 'g', pack: 240, price: 1.8, q: ['hummus'] },
  { id: 'tofu', name: 'Tofu', aisle: CH, unit: 'g', pack: 400, price: 2.2, q: ['tofu'], allergens: ['soja'] },

  // Panadería
  { id: 'pan_barra', name: 'Barra de pan', aisle: PA, unit: 'ud', pack: 1, price: 0.55, q: ['barra', 'pan'], allergens: ['gluten'] },
  { id: 'pan_molde', name: 'Pan de molde', aisle: PA, unit: 'g', pack: 460, price: 1.4, q: ['pan', 'molde'], allergens: ['gluten'] },
  { id: 'tortillas_trigo', name: 'Tortillas de trigo', aisle: PA, unit: 'ud', pack: 8, price: 1.4, q: ['tortillas', 'trigo'], allergens: ['gluten'] },
  { id: 'pan_pita', name: 'Pan de pita', aisle: PA, unit: 'ud', pack: 6, price: 1.2, q: ['pita'], allergens: ['gluten'] },
  { id: 'masa_pizza', name: 'Masa de pizza fresca', aisle: PA, unit: 'ud', pack: 1, price: 1.5, q: ['masa', 'pizza'], allergens: ['gluten'] },
  { id: 'masa_quebrada', name: 'Masa quebrada', aisle: PA, unit: 'ud', pack: 1, price: 1.25, q: ['masa', 'quebrada'], allergens: ['gluten', 'lactosa'] },

  // Huevos, leche
  { id: 'huevos', name: 'Huevos', aisle: HL, unit: 'ud', pack: 12, price: 2.7, q: ['huevos'], x: ['codorniz', 'cocidos', 'chocolate'], animal: 'huevo', allergens: ['huevo'] },
  { id: 'leche', name: 'Leche entera', aisle: HL, unit: 'ml', pack: 1000, price: 0.95, q: ['leche', 'entera'], animal: 'lacteo', allergens: ['lactosa'] },
  { id: 'nata', name: 'Nata para cocinar', aisle: HL, unit: 'ml', pack: 200, price: 0.65, q: ['nata', 'cocinar'], animal: 'lacteo', allergens: ['lactosa'] },
  { id: 'mantequilla', name: 'Mantequilla', aisle: HL, unit: 'g', pack: 250, price: 2.6, q: ['mantequilla'], x: ['light'], animal: 'lacteo', allergens: ['lactosa'], staple: true },

  // Arroz, legumbres, pasta
  { id: 'arroz', name: 'Arroz redondo', aisle: AL, unit: 'g', pack: 1000, price: 1.3, q: ['arroz', 'redondo'] },
  { id: 'arroz_largo', name: 'Arroz largo', aisle: AL, unit: 'g', pack: 1000, price: 1.35, q: ['arroz', 'largo'] },
  { id: 'espaguetis', name: 'Espaguetis', aisle: AL, unit: 'g', pack: 500, price: 0.85, q: ['spaghetti'], allergens: ['gluten'] },
  { id: 'macarrones', name: 'Macarrones', aisle: AL, unit: 'g', pack: 500, price: 0.85, q: ['macarron'], allergens: ['gluten'] },
  { id: 'fideos', name: 'Fideos finos', aisle: AL, unit: 'g', pack: 500, price: 0.85, q: ['fideo'], allergens: ['gluten'] },
  { id: 'noodles', name: 'Noodles de trigo', aisle: AL, unit: 'g', pack: 250, price: 1.2, q: ['noodles'], allergens: ['gluten'] },
  { id: 'placas_lasana', name: 'Placas de lasaña', aisle: AL, unit: 'g', pack: 250, price: 1.3, q: ['lasana'], allergens: ['gluten', 'huevo'] },
  { id: 'lentejas_cocidas', name: 'Lentejas cocidas (bote)', aisle: AL, unit: 'g', pack: 400, price: 0.9, q: ['lenteja', 'cocida'] },
  { id: 'garbanzos_cocidos', name: 'Garbanzos cocidos (bote)', aisle: AL, unit: 'g', pack: 400, price: 0.85, q: ['garbanzo', 'cocido'] },
  { id: 'alubias_rojas', name: 'Alubias rojas cocidas (bote)', aisle: AL, unit: 'g', pack: 400, price: 0.85, q: ['alubia', 'roja', 'cocida'] },

  // Conservas, caldos
  { id: 'tomate_frito', name: 'Tomate frito', aisle: CO, unit: 'g', pack: 400, price: 0.8, q: ['tomate', 'frito'] },
  { id: 'tomate_triturado', name: 'Tomate triturado', aisle: CO, unit: 'g', pack: 400, price: 0.7, q: ['tomate', 'triturado'] },
  { id: 'atun', name: 'Atún en aceite (latas)', aisle: CO, unit: 'g', pack: 240, price: 3.3, q: ['atun'], x: ['ventresca', 'escabeche', 'natural', 'ensalada'], animal: 'pescado', allergens: ['pescado'] },
  { id: 'caldo_pollo', name: 'Caldo de pollo', aisle: CO, unit: 'ml', pack: 1000, price: 1.1, q: ['caldo', 'pollo'], animal: 'carne' },
  { id: 'caldo_verduras', name: 'Caldo de verduras', aisle: CO, unit: 'ml', pack: 1000, price: 1.1, q: ['caldo', 'verdura'] },
  { id: 'maiz', name: 'Maíz dulce', aisle: CO, unit: 'g', pack: 420, price: 1.65, q: ['maiz'] },

  // Aceite, especias, salsas (staples)
  { id: 'aceite', name: 'Aceite de oliva', aisle: AC, unit: 'ml', pack: 1000, price: 7.0, q: ['aceite', 'oliva'], staple: true },
  { id: 'sal', name: 'Sal', aisle: AC, unit: 'g', pack: 1000, price: 0.4, q: ['sal$'], staple: true },
  { id: 'pimienta', name: 'Pimienta negra', aisle: AC, unit: 'g', pack: 50, price: 1.2, q: ['pimienta', 'negra'], staple: true },
  { id: 'pimenton', name: 'Pimentón', aisle: AC, unit: 'g', pack: 75, price: 1.0, q: ['pimenton'], staple: true },
  { id: 'oregano', name: 'Orégano', aisle: AC, unit: 'g', pack: 15, price: 0.9, q: ['oregano'], staple: true },
  { id: 'comino', name: 'Comino molido', aisle: AC, unit: 'g', pack: 40, price: 1.0, q: ['comino'], staple: true },
  { id: 'harina', name: 'Harina de trigo', aisle: AC, unit: 'g', pack: 1000, price: 0.8, q: ['harina', 'trigo'], allergens: ['gluten'], staple: true },
  { id: 'soja', name: 'Salsa de soja', aisle: AC, unit: 'ml', pack: 250, price: 1.3, q: ['salsa', 'soja'], allergens: ['soja', 'gluten'], staple: true },
  { id: 'pan_rallado', name: 'Pan rallado', aisle: AC, unit: 'g', pack: 500, price: 0.9, q: ['pan', 'rallado'], allergens: ['gluten'], staple: true },

  // Congelados
  { id: 'guisantes', name: 'Guisantes congelados', aisle: CG, unit: 'g', pack: 1000, price: 1.6, q: ['guisante'] },
  { id: 'verduras_wok', name: 'Verduras para wok congeladas', aisle: CG, unit: 'g', pack: 600, price: 1.8, q: ['wok'] },
];

export const INGREDIENT_BY_ID: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
);
