/* ============================================================================
 * rules.js — Human-readable rules + machine-readable LLM spec for Pokelike v2.
 *
 * Two audiences:
 *   • Humans  → openRulesModal() renders a formatted, readable guide.
 *   • Robots  → window.POKELIKE_RULES (and <script id="pokelike-llm-spec">)
 *               expose a compact JSON spec describing the rules AND how to
 *               drive the game through the DOM, so an LLM can play it.
 * ==========================================================================*/

const POKELIKE_RULES = {
  game: "Pokelike v2",
  fork_of: "https://pokelike.xyz/",
  summary:
    "A client-side Pokémon roguelike. Pick a generation and a mode, choose a starter, " +
    "then climb a branching node map across several maps. Each map ends in a Gym Leader; " +
    "the final map ends in the Elite Four + Champion. Win battles, level up, catch Pokémon, " +
    "and become Champion. Lose all your Pokémon and the run is over (Nuzlocke is permadeath).",

  objective:
    "Beat all 8 Gym Leaders across the maps, then defeat the Elite Four and the Champion on the final map.",

  generations: {
    "1": "Gen I (Kanto) — Pokémon #1-151. 8 Kanto Gym Leaders, then the Kanto Elite Four + Champion.",
    "2": "Gen II (Johto) — Pokémon #1-251. 8 Johto Gym Leaders, then the Johto Elite Four + Lance.",
    both:
      "Gen I+II — Pokémon #1-251 catchable. Each map's Gym is RANDOM between that slot's Gen I " +
      "and Gen II leader. The final league is 4 random Elite Four members + 1 random Champion. " +
      "You may choose any of the 6 starters (both gens). Boss levels are normalized to a per-map " +
      "target so difficulty stays consistent.",
  },

  modes: {
    normal: "Normal Mode — fainted Pokémon are revived after each battle. Turn-based interactive battles.",
    nuzlocke:
      "Nuzlocke — hardcore. Any Pokémon that faints in battle is lost permanently (exception: rival/Silver " +
      "battles don't permanently faint your team if you win). Trade nodes are available.",
    battle_tower: "Battle Tower — endless auto-battle gauntlet for score; separate from the main run.",
  },

  map: {
    structure:
      "A branching map of node layers. You move downward, choosing one reachable node per step. " +
      "There are ~11 content layers per map plus a guaranteed Gym Leader (BOSS) at the end.",
    node_types: {
      START: "Your entry point.",
      BATTLE: "Wild Pokémon battle. +1 level on win.",
      TRAINER: "Trainer battle. +2 levels on win.",
      BOSS: "Gym Leader (or, on the last map, the Elite Four + Champion). +3 levels on win.",
      CATCH: "Catch a wild Pokémon to add to your team/box.",
      ITEM: "Pick up an item.",
      QUESTION: "Random event.",
      POKECENTER: "Fully heal your team (one in the middle and one near the end are guaranteed).",
      LEGENDARY: "Legendary Pokémon encounter.",
      MOVE_TUTOR: "Teach/upgrade moves.",
      TRADE: "Swap a Pokémon for one 3 levels higher.",
      SILVER: "Rival (Silver) battle — Gen II only.",
    },
  },

  combat: {
    style: "Turn-based, 1v1 on screen (your active Pokémon vs the enemy's). Up to 6 Pokémon per side.",
    moves:
      "Each Pokémon has 1 attacking move per type it can use (move buttons). Damage uses type " +
      "effectiveness. Move power tiers can be upgraded via TMs/move tutor.",
    switching:
      "You may switch your active Pokémon; switching uses your turn and the enemy gets a free hit.",
    turn_order: "Faster Pokémon acts first; held items can modify stats/priority.",
    auto: "An Auto button lets the AI play your turns.",
    xp_rewards: { wild: 1, trainer: 2, gym: 3 },
    xp_note:
      "The whole alive team shares XP. A dynamic per-map level cap prevents over-leveling so bosses stay a threat.",
  },

  bosses: {
    team_size: "Gym Leaders and Elite Four/Champion members field the maximum 6 Pokémon.",
    typing:
      "A leader's extra Pokémon respect the leader's type (e.g. a Water leader gets Water Pokémon). " +
      "The Champion (mixed type) gets a varied strong team.",
    levels:
      "The canonical roster keeps the strongest 'ace'; filler Pokémon sit just below it. In Gen I+II, " +
      "the chosen leader's levels are normalized to a per-map target for consistent difficulty.",
  },

  items: "Held items and consumables modify stats, healing, XP (e.g. Lucky Egg), and more.",

  losing:
    "If your whole team faints you get a Game Over. In Normal you can retry the current map (fresh layout). " +
    "In Nuzlocke, losses are permanent.",

  dom_interaction: {
    note:
      "Selectors for driving the game programmatically. Buttons are clicked with .click(); read state " +
      "from the DOM. The current screen is the visible element with class 'screen'.",
    title_screen: {
      generation_toggle: '#gen-toggle .gen-btn[data-gen="1" | "2" | "both"]  (click to select generation)',
      new_run: "#btn-new-run  (Normal Mode)",
      nuzlocke: "#btn-hard-run  (Nuzlocke)",
      battle_tower: "#btn-endless-run  (Battle Tower)",
      continue_run: "#btn-continue-run  (visible only if a saved run exists)",
      rules: 'open this spec UI: openRulesModal()',
    },
    starter_select: {
      container: "#starter-choices",
      choices: ".starter-card / starter option elements inside #starter-choices (click one)",
    },
    map_screen: {
      container: "#map-screen",
      nodes:
        "Map nodes are SVG <g> groups inside the map SVG; each reachable node has a click handler. " +
        "Hover/label info comes from #map-node-tooltip. Click a reachable node group to advance.",
      badges: "#badge-count shows gym progress.",
    },
    battle: {
      player_side: "#player-side .battle-pokemon (your Pokémon; active one has class .active-pokemon)",
      enemy_side: "#enemy-side .battle-pokemon (enemy team; 6 for bosses)",
      hp_text: ".hp-text inside each .battle-pokemon shows 'current/max' HP",
      move_buttons: '#battle-move-buttons .move-btn[data-mi="N"]  (click to attack with move index N)',
      switch_button: "#btn-battle-switch  (open party selector to switch)",
      auto_button: "#btn-battle-auto  (let AI play your turn)",
      party_selector: '.party-entry[data-pi="N"]  (click to switch to party member N; disabled ones are fainted)',
      continue_button: "#btn-continue-battle  (advance past battle result screens)",
    },
    endgame: {
      game_over_retry: "#btn-retry",
      win_play_again: "#btn-play-again",
    },
    how_to_play_a_battle:
      "1) Read enemy HP via #enemy-side .active-pokemon .hp-text. " +
      "2) Choose a move: click a #battle-move-buttons .move-btn (prefer super-effective types). " +
      "3) To switch, click #btn-battle-switch then a .party-entry[data-pi]. " +
      "4) Repeat until a side faints; click #btn-continue-battle to proceed. " +
      "5) You may click #btn-battle-auto to auto-resolve your turns.",
  },
};

/* Expose globally + inject into the machine-readable <script> tag so an LLM can
 * find the spec without clicking anything. */
(function exposeLLMSpec() {
  try {
    window.POKELIKE_RULES = POKELIKE_RULES;
    const el = document.getElementById('pokelike-llm-spec');
    if (el) el.textContent = JSON.stringify(POKELIKE_RULES, null, 2);
  } catch (e) { /* no-op */ }
})();

/* ---------- Human-readable rendering ---------- */

function _rulesHumanHTML() {
  const r = POKELIKE_RULES;
  const li = (s) => `<li>${s}</li>`;
  const section = (title, inner) =>
    `<div class="rules-sec"><h3>${title}</h3>${inner}</div>`;

  const modes = Object.values(r.modes).map(li).join('');
  const gens = Object.entries(r.generations)
    .map(([k, v]) => li(`<b>${k === 'both' ? 'I+II' : 'Gen ' + k}</b> — ${v}`)).join('');
  const nodes = Object.entries(r.map.node_types)
    .map(([k, v]) => li(`<b>${k}</b> — ${v}`)).join('');
  const combat = [
    r.combat.style, r.combat.moves, r.combat.switching, r.combat.turn_order, r.combat.auto,
    `XP: wild +${r.combat.xp_rewards.wild}, trainer +${r.combat.xp_rewards.trainer}, gym +${r.combat.xp_rewards.gym}. ${r.combat.xp_note}`,
  ].map(li).join('');
  const bosses = Object.values(r.bosses).map(li).join('');

  return (
    `<p class="rules-lead">${r.summary}</p>` +
    section('🎯 Objective', `<p>${r.objective}</p>`) +
    section('🌍 Generations', `<ul>${gens}</ul>`) +
    section('🎮 Modes', `<ul>${modes}</ul>`) +
    section('🗺️ The map', `<p>${r.map.structure}</p><ul>${nodes}</ul>`) +
    section('⚔️ Combat', `<ul>${combat}</ul>`) +
    section('🏆 Gyms, Elite Four & Champion', `<ul>${bosses}</ul>`) +
    section('🎒 Items', `<p>${r.items}</p>`) +
    section('💀 Losing', `<p>${r.losing}</p>`) +
    `<p class="rules-foot">Fork de <a href="${r.fork_of}" target="_blank" rel="noopener">pokelike.xyz</a>.</p>`
  );
}

function _rulesRobotHTML() {
  const json = JSON.stringify(POKELIKE_RULES, null, 2)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return (
    `<p class="rules-lead">Spec llegible per màquina. També disponible com a ` +
    `<code>window.POKELIKE_RULES</code> i a ` +
    `<code>&lt;script type="application/json" id="pokelike-llm-spec"&gt;</code>. ` +
    `Inclou les regles i una guia d'interacció per DOM per jugar de forma programàtica.</p>` +
    `<pre class="rules-spec" tabindex="0">${json}</pre>`
  );
}

function setRulesView(view) {
  const body = document.getElementById('rules-modal-body');
  const tabH = document.getElementById('rules-tab-human');
  const tabR = document.getElementById('rules-tab-robot');
  if (!body) return;
  const robot = view === 'robot';
  body.innerHTML = robot ? _rulesRobotHTML() : _rulesHumanHTML();
  if (tabH) tabH.classList.toggle('rules-tab--active', !robot);
  if (tabR) tabR.classList.toggle('rules-tab--active', robot);
}

function openRulesModal() {
  const m = document.getElementById('rules-modal');
  if (!m) return;
  setRulesView('human');
  m.style.display = 'flex';
}

function closeRulesModal() {
  const m = document.getElementById('rules-modal');
  if (m) m.style.display = 'none';
}
