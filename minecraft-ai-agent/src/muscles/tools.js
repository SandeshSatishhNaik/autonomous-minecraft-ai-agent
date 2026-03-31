// Muscles Module: Tools - Simplified Working Version
// Phase 3: The Muscles - Core action functions

let bot = null;
let Vec3 = null;

// Pathfinder safety flag
let pathfinderBusy = false;

function init(botInstance) {
  bot = botInstance;
  try {
    Vec3 = require('prismarine-vector');
  } catch (e) {
    console.log('[MUSCLES] prismarine-vector not available, using fallback');
  }
  console.log('[MUSCLES] ✓ Tools initialized');
}

// Helper: Validate position
function isValidPosition(pos) {
  if (!pos) return false;
  if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) return false;
  if (!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.z)) return false;
  return true;
}

// Helper: Check if pathfinder is busy
function isPathfinderBusy() {
  return pathfinderBusy;
}

// ============================================
// PHASE 1.1: TOOL REQUIREMENT MATRIX
// ============================================

// 1.1.1 Core matrix - Block name -> Required tool type
// Format: 'block_name': 'required_tool'
// Tools: 'pickaxe', 'axe', 'shovel', 'sword', 'shears', 'any' (hand OK)
const TOOL_REQUIREMENT_MATRIX = {
  // ===== STONE BLOCKS (Pickaxe required) =====
  // Basic stone
  'stone': 'pickaxe',
  'cobblestone': 'pickaxe',
  'granite': 'pickaxe',
  'diorite': 'pickaxe',
  'andesite': 'pickaxe',
  'deepslate': 'pickaxe',
  'tuff': 'pickaxe',
  'polished_granite': 'pickaxe',
  'polished_diorite': 'pickaxe',
  'polished_andesite': 'pickaxe',
  
  // Stone bricks
  'stone_bricks': 'pickaxe',
  'cracked_stone_bricks': 'pickaxe',
  'mossy_stone_bricks': 'pickaxe',
  'chiseled_stone_bricks': 'pickaxe',
  
  // Ores - Coal
  'coal_ore': 'pickaxe',
  'deepslate_coal_ore': 'pickaxe',
  
  // Ores - Iron
  'iron_ore': 'pickaxe',
  'deepslate_iron_ore': 'pickaxe',
  
  // Ores - Gold
  'gold_ore': 'pickaxe',
  'deepslate_gold_ore': 'pickaxe',
  'nether_gold_ore': 'pickaxe',
  
  // Ores - Copper
  'copper_ore': 'pickaxe',
  'deepslate_copper_ore': 'pickaxe',
  
  // Ores - Redstone
  'redstone_ore': 'pickaxe',
  'deepslate_redstone_ore': 'pickaxe',
  
  // Ores - Lapis
  'lapis_ore': 'pickaxe',
  'deepslate_lapis_ore': 'pickaxe',
  
  // Ores - Diamond & Emerald
  'diamond_ore': 'pickaxe',
  'deepslate_diamond_ore': 'pickaxe',
  'emerald_ore': 'pickaxe',
  'deepslate_emerald_ore': 'pickaxe',
  
  // Nether blocks
  'nether_quartz_ore': 'pickaxe',
  'ancient_debris': 'pickaxe',
  'netherite_block': 'pickaxe',
  
  // Special blocks
  'obsidian': 'pickaxe',
  'bedrock': 'pickaxe',
  'end_stone': 'pickaxe',
  'end_portal_frame': 'pickaxe',
  'enchanting_table': 'pickaxe',
  'ender_chest': 'pickaxe',
  'spawner': 'pickaxe',
  'respawn_anchor': 'pickaxe',
  
  // Brick blocks
  'bricks': 'pickaxe',
  'brick_slab': 'pickaxe',
  'brick_stairs': 'pickaxe',
  'brick_wall': 'pickaxe',
  
  // Concrete (powder becomes solid)
  'white_concrete': 'pickaxe',
  'orange_concrete': 'pickaxe',
  'magenta_concrete': 'pickaxe',
  'light_blue_concrete': 'pickaxe',
  'yellow_concrete': 'pickaxe',
  'lime_concrete': 'pickaxe',
  'pink_concrete': 'pickaxe',
  'gray_concrete': 'pickaxe',
  'light_gray_concrete': 'pickaxe',
  'cyan_concrete': 'pickaxe',
  'purple_concrete': 'pickaxe',
  'blue_concrete': 'pickaxe',
  'brown_concrete': 'pickaxe',
  'green_concrete': 'pickaxe',
  'red_concrete': 'pickaxe',
  'black_concrete': 'pickaxe',
  
  // Terracotta
  'terracotta': 'pickaxe',
  'white_terracotta': 'pickaxe',
  'orange_terracotta': 'pickaxe',
  'magenta_terracotta': 'pickaxe',
  'light_blue_terracotta': 'pickaxe',
  'yellow_terracotta': 'pickaxe',
  'lime_terracotta': 'pickaxe',
  'pink_terracotta': 'pickaxe',
  'gray_terracotta': 'pickaxe',
  'light_gray_terracotta': 'pickaxe',
  'cyan_terracotta': 'pickaxe',
  'purple_terracotta': 'pickaxe',
  'blue_terracotta': 'pickaxe',
  'brown_terracotta': 'pickaxe',
  'green_terracotta': 'pickaxe',
  'red_terracotta': 'pickaxe',
  'black_terracotta': 'pickaxe',
  
  // Glazed terracotta
  'white_glazed_terracotta': 'pickaxe',
  'orange_glazed_terracotta': 'pickaxe',
  'magenta_glazed_terracotta': 'pickaxe',
  'light_blue_glazed_terracotta': 'pickaxe',
  'yellow_glazed_terracotta': 'pickaxe',
  'lime_glazed_terracotta': 'pickaxe',
  'pink_glazed_terracotta': 'pickaxe',
  'gray_glazed_terracotta': 'pickaxe',
  'light_gray_glazed_terracotta': 'pickaxe',
  'cyan_glazed_terracotta': 'pickaxe',
  'purple_glazed_terracotta': 'pickaxe',
  'blue_glazed_terracotta': 'pickaxe',
  'brown_glazed_terracotta': 'pickaxe',
  'green_glazed_terracotta': 'pickaxe',
  'red_glazed_terracotta': 'pickaxe',
  'black_glazed_terracotta': 'pickaxe',

  // ===== WOOD BLOCKS (Axe required) =====
  // Oak
  'oak_log': 'axe',
  'oak_wood': 'axe',
  'stripped_oak_log': 'axe',
  'stripped_oak_wood': 'axe',
  'oak_planks': 'axe',
  'oak_slab': 'axe',
  'oak_stairs': 'axe',
  'oak_door': 'axe',
  'oak_trapdoor': 'axe',
  'oak_fence': 'axe',
  'oak_fence_gate': 'axe',
  'oak_pressure_plate': 'axe',
  'oak_button': 'axe',
  'sign': 'axe',
  
  // Birch
  'birch_log': 'axe',
  'birch_wood': 'axe',
  'stripped_birch_log': 'axe',
  'stripped_birch_wood': 'axe',
  'birch_planks': 'axe',
  'birch_slab': 'axe',
  'birch_stairs': 'axe',
  'birch_door': 'axe',
  'birch_trapdoor': 'axe',
  'birch_fence': 'axe',
  'birch_fence_gate': 'axe',
  'birch_pressure_plate': 'axe',
  'birch_button': 'axe',
  
  // Spruce
  'spruce_log': 'axe',
  'spruce_wood': 'axe',
  'stripped_spruce_log': 'axe',
  'stripped_spruce_wood': 'axe',
  'spruce_planks': 'axe',
  'spruce_slab': 'axe',
  'spruce_stairs': 'axe',
  'spruce_door': 'axe',
  'spruce_trapdoor': 'axe',
  'spruce_fence': 'axe',
  'spruce_fence_gate': 'axe',
  'spruce_pressure_plate': 'axe',
  'spruce_button': 'axe',
  
  // Jungle
  'jungle_log': 'axe',
  'jungle_wood': 'axe',
  'stripped_jungle_log': 'axe',
  'stripped_jungle_wood': 'axe',
  'jungle_planks': 'axe',
  'jungle_slab': 'axe',
  'jungle_stairs': 'axe',
  'jungle_door': 'axe',
  'jungle_trapdoor': 'axe',
  'jungle_fence': 'axe',
  'jungle_fence_gate': 'axe',
  'jungle_pressure_plate': 'axe',
  'jungle_button': 'axe',
  
  // Acacia
  'acacia_log': 'axe',
  'acacia_wood': 'axe',
  'stripped_acacia_log': 'axe',
  'stripped_acacia_wood': 'axe',
  'acacia_planks': 'axe',
  'acacia_slab': 'axe',
  'acacia_stairs': 'axe',
  'acacia_door': 'axe',
  'acacia_trapdoor': 'axe',
  'acacia_fence': 'axe',
  'acacia_fence_gate': 'axe',
  'acacia_pressure_plate': 'axe',
  'acacia_button': 'axe',
  
  // Dark Oak
  'dark_oak_log': 'axe',
  'dark_oak_wood': 'axe',
  'stripped_dark_oak_log': 'axe',
  'stripped_dark_oak_wood': 'axe',
  'dark_oak_planks': 'axe',
  'dark_oak_slab': 'axe',
  'dark_oak_stairs': 'axe',
  'dark_oak_door': 'axe',
  'dark_oak_trapdoor': 'axe',
  'dark_oak_fence': 'axe',
  'dark_oak_fence_gate': 'axe',
  'dark_oak_pressure_plate': 'axe',
  'dark_oak_button': 'axe',
  
  // Mangrove
  'mangrove_log': 'axe',
  'mangrove_wood': 'axe',
  'stripped_mangrove_log': 'axe',
  'stripped_mangrove_wood': 'axe',
  'mangrove_planks': 'axe',
  'mangrove_slab': 'axe',
  'mangrove_stairs': 'axe',
  'mangrove_door': 'axe',
  'mangrove_trapdoor': 'axe',
  'mangrove_fence': 'axe',
  'mangrove_fence_gate': 'axe',
  'mangrove_pressure_plate': 'axe',
  'mangrove_button': 'axe',
  
  // Cherry
  'cherry_log': 'axe',
  'cherry_wood': 'axe',
  'stripped_cherry_log': 'axe',
  'stripped_cherry_wood': 'axe',
  'cherry_planks': 'axe',
  'cherry_slab': 'axe',
  'cherry_stairs': 'axe',
  'cherry_door': 'axe',
  'cherry_trapdoor': 'axe',
  'cherry_fence': 'axe',
  'cherry_fence_gate': 'axe',
  'cherry_pressure_plate': 'axe',
  'cherry_button': 'axe',
  
  // Crimson
  'crimson_stem': 'axe',
  'crimson_hyphae': 'axe',
  'stripped_crimson_stem': 'axe',
  'stripped_crimson_hyphae': 'axe',
  'crimson_planks': 'axe',
  'crimson_slab': 'axe',
  'crimson_stairs': 'axe',
  'crimson_door': 'axe',
  'crimson_trapdoor': 'axe',
  'crimson_fence': 'axe',
  'crimson_fence_gate': 'axe',
  'crimson_pressure_plate': 'axe',
  'crimson_button': 'axe',
  
  // Warped
  'warped_stem': 'axe',
  'warped_hyphae': 'axe',
  'stripped_warped_stem': 'axe',
  'stripped_warped_hyphae': 'axe',
  'warped_planks': 'axe',
  'warped_slab': 'axe',
  'warped_stairs': 'axe',
  'warped_door': 'axe',
  'warped_trapdoor': 'axe',
  'warped_fence': 'axe',
  'warped_fence_gate': 'axe',
  'warped_pressure_plate': 'axe',
  'warped_button': 'axe',
  
  // Other wood-based
  'bookshelf': 'axe',
  'lectern': 'axe',
  'composter': 'axe',
  'cartography_table': 'axe',
  'fletching_table': 'axe',
  'loom': 'axe',
  'barrel': 'axe',
  'bee_nest': 'axe',
  'honey_block': 'axe',
  'slime_block': 'axe',
  'campfire': 'axe',
  'soul_campfire': 'axe',
  
  // Pumpkin family
  'pumpkin': 'axe',
  'carved_pumpkin': 'axe',
  'jack_o_lantern': 'axe',
  'melon': 'axe',

  // ===== DIRT/SAND BLOCKS (Shovel required) =====
  'dirt': 'shovel',
  'grass_block': 'shovel',
  'podzol': 'shovel',
  'rooted_dirt': 'shovel',
  'mud': 'shovel',
  'sand': 'shovel',
  'red_sand': 'shovel',
  'gravel': 'shovel',
  'clay': 'shovel',
  'soul_sand': 'shovel',
  'soul_soil': 'shovel',
  'mud_slab': 'shovel',

  // ===== WOOL (Shears required) =====
  'white_wool': 'shears',
  'orange_wool': 'shears',
  'magenta_wool': 'shears',
  'light_blue_wool': 'shears',
  'yellow_wool': 'shears',
  'lime_wool': 'shears',
  'pink_wool': 'shears',
  'gray_wool': 'shears',
  'light_gray_wool': 'shears',
  'cyan_wool': 'shears',
  'purple_wool': 'shears',
  'blue_wool': 'shears',
  'brown_wool': 'shears',
  'green_wool': 'shears',
  'red_wool': 'shears',
  'black_wool': 'shears',

  // ===== LEAVES (Any/Shears) =====
  'oak_leaves': 'any',
  'birch_leaves': 'any',
  'spruce_leaves': 'any',
  'jungle_leaves': 'any',
  'acacia_leaves': 'any',
  'dark_oak_leaves': 'any',
  'mangrove_leaves': 'any',
  'cherry_leaves': 'any',
  'azalea_leaves': 'any',
  'flowering_azalea_leaves': 'any',
  'cave_vines': 'any',
  'cave_vines_plant': 'any',
  'vine': 'any',
  
  // ===== SPECIAL =====
  'cobweb': 'sword',  // Sword fastest for cobwebs
  'glow_lichen': 'any',
  'scaffolding': 'any',
  'spore_blossom': 'any',
  'hanging_roots': 'any',
  'big_dripleaf': 'any',
  'big_dripleaf_stem': 'any',
  'small_dripleaf': 'any',
  'cave_vines_plant': 'any',
  'moss_block': 'any',
};

// 1.1.2 Tool efficiency by material (speed multiplier)
const TOOL_EFFICIENCY = {
  // Hand
  'hand': 1,
  
  // Wooden tools
  'wooden_pickaxe': 2,
  'wooden_axe': 2,
  'wooden_shovel': 2,
  'wooden_sword': 2,
  'wooden_hoe': 2,
  
  // Stone tools
  'stone_pickaxe': 4,
  'stone_axe': 4,
  'stone_shovel': 4,
  'stone_sword': 4,
  'stone_hoe': 4,
  
  // Iron tools
  'iron_pickaxe': 6,
  'iron_axe': 6,
  'iron_shovel': 6,
  'iron_sword': 6,
  'iron_hoe': 6,
  
  // Diamond tools
  'diamond_pickaxe': 8,
  'diamond_axe': 8,
  'diamond_shovel': 8,
  'diamond_sword': 8,
  'diamond_hoe': 8,
  
  // Netherite tools
  'netherite_pickaxe': 9,
  'netherite_axe': 9,
  'netherite_shovel': 9,
  'netherite_sword': 9,
  'netherite_hoe': 9,
  
  // Gold tools (fastest but low durability)
  'gold_pickaxe': 12,
  'gold_axe': 12,
  'gold_shovel': 12,
  'gold_sword': 12,
  'gold_hoe': 12,
  
  // Special
  'shears': 5,
};

// ============================================
// PHASE 1.8: BLOCK HARDNESS DATABASE
// ============================================

// 1.8.1 Block hardness values (in seconds with optimal tool)
// Used to calculate mining time: Hardness ÷ Efficiency × 250ms
const BLOCK_HARDNESS = {
  // ===== STONE BLOCKS (Pickaxe required) =====
  'stone': 1.5,
  'cobblestone': 2.0,
  'granite': 1.5,
  'diorite': 1.5,
  'andesite': 1.5,
  'deepslate': 3.0,
  'tuff': 1.5,
  'polished_granite': 1.5,
  'polished_diorite': 1.5,
  'polished_andesite': 1.5,
  'stone_bricks': 1.5,
  'cracked_stone_bricks': 1.5,
  'mossy_stone_bricks': 1.5,
  'chiseled_stone_bricks': 1.5,

  // ===== ORES (Pickaxe required) =====
  // Coal
  'coal_ore': 1.5,
  'deepslate_coal_ore': 3.0,
  // Iron
  'iron_ore': 1.5,
  'deepslate_iron_ore': 3.0,
  // Gold
  'gold_ore': 1.5,
  'deepslate_gold_ore': 3.0,
  'nether_gold_ore': 1.5,
  // Copper
  'copper_ore': 1.5,
  'deepslate_copper_ore': 3.0,
  // Lapis
  'lapis_ore': 1.5,
  'deepslate_lapis_ore': 3.0,
  // Redstone
  'redstone_ore': 1.5,
  'deepslate_redstone_ore': 3.0,
  // Diamond
  'diamond_ore': 1.5,
  'deepslate_diamond_ore': 3.0,
  // Emerald
  'emerald_ore': 1.5,
  'deepslate_emerald_ore': 3.0,

  // ===== NETHER BLOCKS (Pickaxe required) =====
  'nether_quartz_ore': 1.5,
  'ancient_debris': 4.5,
  'obsidian': 4.5,
  'netherite_block': 4.5,
  'netherrack': 0.5,
  'soul_sand': 0.5,
  'soul_soil': 0.5,
  'glowstone': 0.3,

  // ===== SPECIAL BLOCKS =====
  'bedrock': -1, // Unbreakable
  'end_stone': 3.0,
  'end_portal_frame': 3.0,
  'ender_chest': 3.0,
  'enchanting_table': 3.0,
  'respawn_anchor': 3.0,
  'spawner': -1, // Special - needs silk touch
  'water': 0, // Instant
  'lava': 0, // Instant
  
  // ===== WOOD BLOCKS (Axe required) =====
  'oak_log': 2.0,
  'birch_log': 2.0,
  'spruce_log': 2.0,
  'jungle_log': 2.0,
  'acacia_log': 2.0,
  'dark_oak_log': 2.0,
  'mangrove_log': 2.0,
  'cherry_log': 2.0,
  'crimson_stem': 2.0,
  'warped_stem': 2.0,
  'oak_wood': 2.0,
  'birch_wood': 2.0,
  'spruce_wood': 2.0,
  'jungle_wood': 2.0,
  'acacia_wood': 2.0,
  'dark_oak_wood': 2.0,
  'mangrove_wood': 2.0,
  'cherry_wood': 2.0,
  'crimson_hyphae': 2.0,
  'warped_hyphae': 2.0,
  'stripped_oak_log': 2.0,
  'stripped_birch_log': 2.0,
  'stripped_spruce_log': 2.0,
  'stripped_jungle_log': 2.0,
  'stripped_acacia_log': 2.0,
  'stripped_dark_oak_log': 2.0,
  'stripped_mangrove_log': 2.0,
  'stripped_cherry_log': 2.0,
  'stripped_crimson_stem': 2.0,
  'stripped_warped_stem': 2.0,
  'stripped_oak_wood': 2.0,
  'stripped_birch_wood': 2.0,
  'stripped_spruce_wood': 2.0,
  'stripped_jungle_wood': 2.0,
  'stripped_acacia_wood': 2.0,
  'stripped_dark_oak_wood': 2.0,
  'stripped_mangrove_wood': 2.0,
  'stripped_cherry_wood': 2.0,
  'stripped_crimson_hyphae': 2.0,
  'stripped_warped_hyphae': 2.0,
  
  // Wood products
  'oak_planks': 2.0,
  'birch_planks': 2.0,
  'spruce_planks': 2.0,
  'jungle_planks': 2.0,
  'acacia_planks': 2.0,
  'dark_oak_planks': 2.0,
  'mangrove_planks': 2.0,
  'cherry_planks': 2.0,
  'crimson_planks': 2.0,
  'warped_planks': 2.0,
  'bookshelf': 1.5,
  'cartography_table': 2.5,
  'fletching_table': 2.5,
  'loom': 2.5,
  'barrel': 2.5,
  'bee_nest': 0.5,
  'honey_block': 0.5,
  'slime_block': 0.5,
  'campfire': 2.0,
  'soul_campfire': 2.0,
  'pumpkin': 1.0,
  'carved_pumpkin': 1.0,
  'jack_o_lantern': 1.0,
  'melon': 1.0,

  // ===== DIRT BLOCKS (Shovel required) =====
  'dirt': 0.5,
  'grass_block': 0.5,
  'podzol': 0.5,
  'rooted_dirt': 0.5,
  'mud': 0.5,
  'mud_slab': 0.5,
  'sand': 0.5,
  'red_sand': 0.5,
  'gravel': 0.6,
  'clay': 0.6,

  // ===== LEAVES (Any - shears for silk) =====
  'oak_leaves': 0.2,
  'birch_leaves': 0.2,
  'spruce_leaves': 0.2,
  'jungle_leaves': 0.2,
  'acacia_leaves': 0.2,
  'dark_oak_leaves': 0.2,
  'mangrove_leaves': 0.2,
  'cherry_leaves': 0.2,
  'azalea_leaves': 0.2,
  'flowering_azalea_leaves': 0.2,
  'vine': 0.2,
  'cave_vines': 0.2,
  'cave_vines_plant': 0.2,
  'moss_block': 0.2,

  // ===== WOOL (Shears required) =====
  'white_wool': 0.5,
  'orange_wool': 0.5,
  'magenta_wool': 0.5,
  'light_blue_wool': 0.5,
  'yellow_wool': 0.5,
  'lime_wool': 0.5,
  'pink_wool': 0.5,
  'gray_wool': 0.5,
  'light_gray_wool': 0.5,
  'cyan_wool': 0.5,
  'purple_wool': 0.5,
  'blue_wool': 0.5,
  'brown_wool': 0.5,
  'green_wool': 0.5,
  'red_wool': 0.5,
  'black_wool': 0.5,

  // ===== SPECIAL =====
  'cobweb': 0.4,
  'scaffolding': 0.5,
  'glow_lichen': 0.2,
  'spore_blossom': 0.2,
  'big_dripleaf': 0.2,
  'big_dripleaf_stem': 0.2,
  'small_dripleaf': 0.2,
  'hanging_roots': 0.2,

  // ===== CONCRETE =====
  'white_concrete': 1.8,
  'orange_concrete': 1.8,
  'magenta_concrete': 1.8,
  'light_blue_concrete': 1.8,
  'yellow_concrete': 1.8,
  'lime_concrete': 1.8,
  'pink_concrete': 1.8,
  'gray_concrete': 1.8,
  'light_gray_concrete': 1.8,
  'cyan_concrete': 1.8,
  'purple_concrete': 1.8,
  'blue_concrete': 1.8,
  'brown_concrete': 1.8,
  'green_concrete': 1.8,
  'red_concrete': 1.8,
  'black_concrete': 1.8,

  // ===== TERRACOTTA =====
  'terracotta': 1.8,
  'white_terracotta': 1.8,
  'orange_terracotta': 1.8,
  'magenta_terracotta': 1.8,
  'light_blue_terracotta': 1.8,
  'yellow_terracotta': 1.8,
  'lime_terracotta': 1.8,
  'pink_terracotta': 1.8,
  'gray_terracotta': 1.8,
  'light_gray_terracotta': 1.8,
  'cyan_terracotta': 1.8,
  'purple_terracotta': 1.8,
  'blue_terracotta': 1.8,
  'brown_terracotta': 1.8,
  'green_terracotta': 1.8,
  'red_terracotta': 1.8,
  'black_terracotta': 1.8,

  // ===== GLAZED TERRACOTTA =====
  'white_glazed_terracotta': 1.4,
  'orange_glazed_terracotta': 1.4,
  'magenta_glazed_terracotta': 1.4,
  'light_blue_glazed_terracotta': 1.4,
  'yellow_glazed_terracotta': 1.4,
  'lime_glazed_terracotta': 1.4,
  'pink_glazed_terracotta': 1.4,
  'gray_glazed_terracotta': 1.4,
  'light_gray_glazed_terracotta': 1.4,
  'cyan_glazed_terracotta': 1.4,
  'purple_glazed_terracotta': 1.4,
  'blue_glazed_terracotta': 1.4,
  'brown_glazed_terracotta': 1.4,
  'green_glazed_terracotta': 1.4,
  'red_glazed_terracotta': 1.4,
  'black_glazed_terracotta': 1.4,

  // ===== BRICK BLOCKS =====
  'bricks': 2.0,
  'brick_slab': 2.0,
  'brick_stairs': 2.0,
  'brick_wall': 2.0,

  // ===== OTHER =====
  'glass': 0.3,
  'glass_pane': 0.3,
  'ice': 0.5,
  'packed_ice': 0.5,
  'snow_block': 0.5,
  'snow': 0.5,
};

// 1.8.2 Get mining time for a block
function getMiningTime(blockName, toolName) {
  // Get block hardness (default to 1.0 if unknown)
  const hardness = BLOCK_HARDNESS[blockName] !== undefined ? BLOCK_HARDNESS[blockName] : 1.0;
  
  // Special case: unbreakable
  if (hardness < 0) {
    return -1;
  }
  
  // Special case: instant break (water, lava)
  if (hardness === 0) {
    return 0;
  }
  
  // Get tool efficiency
  let efficiency = getToolEfficiency(toolName);
  
  // Check if tool is correct for this block
  const requiredTool = getRequiredTool(blockName);
  if (requiredTool !== 'any' && requiredTool !== 'sword') {
    // Check if tool matches required type
    if (!toolName || !toolName.includes(requiredTool)) {
      // Wrong tool - use 1/5th speed (0.2x)
      efficiency = 0.2;
    }
  }
  
  // Calculate time in milliseconds
  // Formula: (hardness / efficiency) * 250ms
  // This accounts for: hardness / efficiency = ticks, each tick = 50ms, but we use 250ms base for swing time
  const miningTimeMs = (hardness / efficiency) * 250;
  
  // Minimum 50ms to prevent instant returns
  return Math.max(Math.round(miningTimeMs), 50);
}

// 1.8.3 Format mining time for display
function formatMiningTime(ms) {
  if (ms < 0) return 'Unbreakable';
  if (ms === 0) return 'Instant';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// 1.1.3 Get required tool for a block
function getRequiredTool(blockName) {
  if (!blockName) return 'any';
  
  // Check exact match first
  if (TOOL_REQUIREMENT_MATRIX[blockName]) {
    return TOOL_REQUIREMENT_MATRIX[blockName];
  }
  
  // Check partial match for blocks with suffixes
  // e.g., "oak_log" matches "log" suffix
  const suffixes = ['_log', '_wood', '_planks', '_leaves', '_stairs', '_slab', 
                    '_door', '_fence', '_button', '_pressure_plate', 
                    '_terracotta', '_concrete'];
  
  for (const suffix of suffixes) {
    if (blockName.endsWith(suffix)) {
      const baseName = blockName.slice(0, -suffix.length);
      // Try prefix + suffix combinations
      const variants = [
        baseName + suffix,
        'stripped_' + baseName + suffix.slice(1),
      ];
      for (const variant of variants) {
        if (TOOL_REQUIREMENT_MATRIX[variant]) {
          return TOOL_REQUIREMENT_MATRIX[variant];
        }
      }
    }
  }
  
  // Default - can mine with anything
  return 'any';
}

// 1.1.4 Get tool efficiency multiplier
function getToolEfficiency(toolName) {
  if (!toolName) return TOOL_EFFICIENCY.hand;
  return TOOL_EFFICIENCY[toolName] || 1;
}

// 1.1.5 Find best tool of required type from inventory
async function findBestTool(toolType) {
  if (!bot || !bot.inventory) {
    return null;
  }
  
  const inventoryItems = bot.inventory.items();
  
  // Map tool type to item name patterns
  const toolPatterns = {
    'pickaxe': ['pickaxe'],
    'axe': ['axe'],
    'shovel': ['shovel'],
    'sword': ['sword'],
    'shears': ['shears'],
    'hoe': ['hoe']
  };
  
  const patterns = toolPatterns[toolType] || [];
  
  // Filter items matching the tool type
  const validTools = inventoryItems.filter(item => {
    if (!item || !item.name) return false;
    return patterns.some(pattern => item.name.includes(pattern));
  });
  
  if (validTools.length === 0) {
    return null;
  }
  
  // Sort by efficiency (best first) and check durability
  validTools.sort((a, b) => {
    const effA = getToolEfficiency(a.name);
    const effB = getToolEfficiency(b.name);
    
    // First sort by efficiency
    if (effA !== effB) return effB - effA;
    
    // Then by durability (higher is better)
    const durA = a.durability ? (a.maxDurability - a.durability) : 0;
    const durB = b.durability ? (b.maxDurability - b.durability) : 0;
    return durB - durA;
  });
  
  return validTools[0];
}

// 1.1.6 Equip best tool for block mining
async function equipBestToolForBlock(blockName) {
  const requiredTool = getRequiredTool(blockName);
  
  // If 'any', no specific tool needed
  if (requiredTool === 'any') {
    console.log(`[TOOL] Block ${blockName} can be mined with any tool or hand`);
    return null;
  }
  
  // Find best tool of required type
  const bestTool = await findBestTool(requiredTool);
  
  if (!bestTool) {
    console.log(`[TOOL] No ${requiredTool} found! Will try hand.`);
    return null;
  }
  
  // Check if already equipped
  const currentlyEquipped = bot.inventory.selectedItem;
  if (currentlyEquipped && currentlyEquipped.name === bestTool.name) {
    console.log(`[TOOL] Already holding: ${bestTool.name}`);
    return bestTool;
  }
  
  // Equip the tool
  try {
    await bot.equip(bestTool, 'hand');
    console.log(`[TOOL] ✓ Equipped: ${bestTool.name} (efficiency: ${getToolEfficiency(bestTool.name)}x)`);
    return bestTool;
  } catch (error) {
    console.log(`[TOOL] Failed to equip ${bestTool.name}: ${error.message}`);
    return null;
  }
}

console.log('[TOOL] ✓ Phase 1.1: Tool Requirement Matrix loaded');

// ============================================
// MOVEMENT
// ============================================

async function walkTo(x, y, z) {
  if (!bot || !bot.entity) {
    return { success: false, error: 'No bot' };
  }
  
  // Validate coordinates
  if (x === null || y === null || z === null || isNaN(x) || isNaN(y) || isNaN(z)) {
    console.log('[WALK] Invalid coordinates, returning error');
    return { success: false, error: 'Invalid coordinates' };
  }
  
  // Check if pathfinder is busy
  if (pathfinderBusy) {
    console.log('[WALK] Pathfinder busy, skipping...');
    return { success: false, error: 'Pathfinder busy' };
  }
  
  const currentPos = bot.entity.position;
  console.log(`[WALK] Going to ${x}, ${y}, ${z}`);
  
  try {
    // Stop any existing pathfinder goal first
    if (bot.pathfinder) {
      bot.pathfinder.stop();
    }
    
    pathfinderBusy = true;
    
    if (bot.pathfinder) {
      const { GoalNear } = require('mineflayer-pathfinder').goals;
      const goal = new GoalNear(x, y, z, 1);
      await bot.pathfinder.goto(goal);
    }
    
    pathfinderBusy = false;
    return { success: true, action: 'walkTo' };
  } catch (error) {
    pathfinderBusy = false;
    console.log(`[WALK] Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function explore(distance = 15) {
  if (!bot || !bot.entity || !bot.entity.position) {
    console.log('[EXPLORE] No valid position, waiting...');
    return await simpleExplore();
  }
  
  const pos = bot.entity.position;
  
  // Validate position using helper
  if (!isValidPosition(pos)) {
    console.log('[EXPLORE] Invalid position, using simple movement...');
    return await simpleExplore();
  }
  
  const angle = Math.random() * Math.PI * 2;
  const targetX = Math.floor(pos.x + Math.cos(angle) * distance);
  const targetZ = Math.floor(pos.z + Math.sin(angle) * distance);
  
  console.log(`[EXPLORE] Going random: ${targetX}, ${pos.y}, ${targetZ}`);
  
  return await walkTo(targetX, pos.y, targetZ);
}

// Simple fallback exploration without pathfinder
async function simpleExplore() {
  console.log('[EXPLORE] Using simple movement');
  const directions = ['forward', 'back', 'left', 'right'];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  bot.setControlState(direction, true);
  await new Promise(r => setTimeout(r, 1000));
  bot.setControlState(direction, false);
  return { success: true, action: 'simpleExplore' };
}

// ============================================
// MINING
// ============================================

const RESOURCE_PRIORITY = ['oak_log', 'cobblestone', 'dirt', 'coal_ore', 'stone'];

async function mineBlock(blockName = 'cobblestone', quantity = 1) {
  if (!bot) return { success: false, error: 'No bot' };
  
  console.log(`[MINE] Mining: ${blockName}`);
  
  // PHASE 1.1: Equip best tool before mining
  const equippedTool = await equipBestToolForBlock(blockName);
  const toolName = equippedTool ? equippedTool.name : 'hand';
  
  // PHASE 1.8: Calculate expected mining time
  const miningTime = getMiningTime(blockName, toolName);
  const timeDisplay = formatMiningTime(miningTime);
  
  if (miningTime < 0) {
    console.log(`[MINE] Cannot break ${blockName} - unbreakable!`);
    return { success: false, error: 'Block is unbreakable' };
  }
  
  console.log(`[MINE] Tool: ${toolName} | Expected time: ${timeDisplay}`);
  
  // Find block
  const pos = bot.entity.position;
  const range = 5;
  let targetBlock = null;
  
  for (let bx = pos.x - range; bx <= pos.x + range && !targetBlock; bx++) {
    for (let by = pos.y - range; by <= pos.y + range && !targetBlock; by++) {
      for (let bz = pos.z - range; bz <= pos.z + range && !targetBlock; bz++) {
        try {
          const blockPos = { x: bx, y: by, z: bz };
          const block = bot.blockAt(blockPos);
          if (block && (block.name === blockName || block.name.includes(blockName))) {
            targetBlock = block;
          }
        } catch (e) {}
      }
    }
  }
  
  if (!targetBlock) {
    // Try any resource
    for (const resource of RESOURCE_PRIORITY) {
      for (let bx = pos.x - range; bx <= pos.x + range && !targetBlock; bx++) {
        for (let by = pos.y - range; by <= pos.y + range && !targetBlock; by++) {
          for (let bz = pos.z - range; bz <= pos.z + range && !targetBlock; bz++) {
            try {
              const blockPos = { x: bx, y: by, z: bz };
          const block = bot.blockAt(blockPos);
              if (block && block.name === resource) {
                targetBlock = block;
                blockName = resource;
              }
            } catch (e) {}
          }
        }
      }
    }
  }
  
  if (!targetBlock) {
    console.log('[MINE] No blocks found');
    return { success: false, error: 'No blocks nearby' };
  }
  
  try {
    // PHASE 1.8: Wait for calculated mining time before digging
    if (miningTime > 0 && miningTime < 5000) {
      // For non-instant blocks, wait for expected mining time
      // This makes the bot "feel" like it's actually mining
      const waitPromise = new Promise(resolve => setTimeout(resolve, miningTime));
      const digPromise = bot.dig(targetBlock);
      
      // Wait for either the dig to complete or the expected time
      await Promise.race([digPromise, waitPromise]);
    } else {
      // Instant break or very long time - just dig immediately
      await bot.dig(targetBlock);
    }
    
    console.log(`[MINE] ✓ Mined ${blockName} (time: ${timeDisplay})`);
    return { success: true, action: 'mineBlock', target: blockName };
  } catch (error) {
    console.log(`[MINE] Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================
// EQUIPPING
// ============================================

async function equipItem(itemName, slot = 'hand') {
  if (!bot) return { success: false, error: 'No bot' };
  
  try {
    const inventory = bot.inventory.items();
    const item = inventory.find(i => i.name.includes(itemName));
    
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    
    await bot.equip(item, slot);
    return { success: true, action: 'equipItem', item: item.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// EATING
// ============================================

async function eat(foodName = null) {
  if (!bot) return { success: false, error: 'No bot' };
  
  const foodLevel = bot.food;
  if (foodLevel >= 18) {
    return { success: false, error: 'Not hungry' };
  }
  
  const foods = ['bread', 'apple', 'cooked_beef', 'cooked_porkchop', 'carrot', 'cookie'];
  
  try {
    const inventory = bot.inventory.items();
    let foodItem = null;
    
    if (foodName) {
      foodItem = inventory.find(i => i.name.includes(foodName));
    } else {
      for (const food of foods) {
        foodItem = inventory.find(i => i.name.includes(food));
        if (foodItem) break;
      }
    }
    
    if (!foodItem) {
      return { success: false, error: 'No food' };
    }
    
    await bot.equip(foodItem, 'hand');
    await bot.consume();
    
    return { success: true, action: 'eat', item: foodItem.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function autoEat() {
  if (!bot) return { success: false };
  
  if (bot.food < 14 || (bot.health < 12 && bot.food < 18)) {
    return await eat();
  }
  return { success: false };
}

// ============================================
// ATTACKING
// ============================================

async function attack(targetName = null, duration = 2000) {
  if (!bot) return { success: false, error: 'No bot' };
  
  try {
    // Find target
    let target = null;
    
    if (targetName) {
      target = Object.values(bot.entities).find(e => 
        e.name === targetName || e.username === targetName
      );
    } else {
      // Find nearest hostile
      const hostiles = Object.values(bot.entities).filter(e => 
        ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'].includes(e.name)
      );
      
      if (hostiles.length === 0) {
        return { success: false, error: 'No hostiles' };
      }
      
      const pos = bot.entity.position;
      target = hostiles.reduce((nearest, e) => {
        if (!nearest) return e;
        const dist = Math.sqrt(Math.pow(e.position.x - pos.x, 2) + Math.pow(e.position.z - pos.z, 2));
        const nearestDist = Math.sqrt(Math.pow(nearest.position.x - pos.x, 2) + Math.pow(nearest.position.z - pos.z, 2));
        return dist < nearestDist ? e : nearest;
      }, null);
    }
    
    if (!target) {
      return { success: false, error: 'Target not found' };
    }
    
    await bot.attack(target);
    return { success: true, action: 'attack', target: target.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// UTILITIES
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  init,
  walkTo,
  explore,
  mineBlock,
  equipItem,
  eat,
  autoEat,
  attack,
  isValidPosition,
  isPathfinderBusy,
  // Phase 1.1 - Tool System
  getRequiredTool,
  getToolEfficiency,
  findBestTool,
  equipBestToolForBlock,
  // Phase 1.8 - Mining Time System
  BLOCK_HARDNESS,
  getMiningTime,
  formatMiningTime
};