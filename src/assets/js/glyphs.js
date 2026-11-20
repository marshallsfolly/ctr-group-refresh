// Trade glyphs drawn like marks on a print: welding symbols, sections, centerlines.
// 32 x 32 grid, stroked with currentColor so they take the text color.

const G = {
  // AWS fillet weld symbol: arrow, reference line, triangle on the arrow side, tail.
  welder: `<path d="M9 19H27M9 19 4 10M4 10l.4 3.6M4 10l3.2 1.6M14 19v6l6-6M27 19l3-3M27 19l3 3"/>`,
  // T-joint in section with fillets.
  shipfitter: `<path d="M3 24h26v4H3zM14 5h4v19h-4zM14 24l-3-3M18 24l3-3"/><path d="M2 16h3M27 16h3" stroke-dasharray="1 2"/>`,
  // Flange face: bolt circle and bore.
  pipefitter: `<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="5"/><circle cx="16" cy="6.5" r="1.4"/><circle cx="16" cy="25.5" r="1.4"/><circle cx="6.5" cy="16" r="1.4"/><circle cx="25.5" cy="16" r="1.4"/>`,
  // Shaft centerline with bearing.
  "outside-machinist": `<path d="M2 16h4M9 16h3M15 16h2M20 16h3M26 16h4"/><path d="M8 9h16v14H8z"/><path d="M12 9v14M20 9v14"/>`,
  // Diameter symbol over a center mark.
  "inside-machinist": `<circle cx="16" cy="16" r="10"/><path d="M6 26 26 6M16 2v6M16 24v6M2 16h6M24 16h6"/>`,
  // Ground symbol.
  electrician: `<path d="M16 3v13M6 16h20M10 21h12M13.5 26h5"/><path d="M12 8l4-5 4 5" />`,
  // Radar sweep.
  "electronics-tech": `<path d="M16 28V16L26 6"/><path d="M6 16a10 10 0 0 1 10-10M10 16a6 6 0 0 1 6-6M3 28h26"/>`,
  // Coating build-up in section with a DFT gauge.
  painter: `<path d="M3 24h26M3 20h26M3 16h26"/><path d="M6 24 10 20M12 24l4-4M18 24l4-4M24 24l4-4"/><path d="M16 4v8M13 9l3 3 3-3"/>`,
  // Hull section on keel blocks.
  shipwright: `<path d="M5 6c0 11 5 15 11 15s11-4 11-15"/><path d="M16 21v3M10 24h12v4H10z"/><path d="M2 12h28" stroke-dasharray="2 2"/>`,
  // Tube and clamp bay with brace.
  scaffold: `<path d="M6 3v26M26 3v26M6 10h20M6 20h20M6 29h20M6 20 26 10"/>`,
  // Shackle and pin.
  rigger: `<path d="M9 14V9a7 7 0 0 1 14 0v5"/><path d="M6 14h20M9 14v4M23 14v4"/><path d="M16 18v11M12 25l4 4 4-4"/>`,
  // Crane hook.
  "crane-operator": `<path d="M16 3v9"/><path d="M12 12h8v4h-8z"/><path d="M16 16v4a5 5 0 1 1-5 5"/><path d="M11 25h3"/>`,
  // Pressure vessel with rivet seam.
  boilermaker: `<path d="M8 10a8 6 0 0 1 16 0v12a8 6 0 0 1-16 0z"/><path d="M8 16h16"/><circle cx="11" cy="13" r=".8"/><circle cx="16" cy="13" r=".8"/><circle cx="21" cy="13" r=".8"/>`,
  // Brake bend with bend line.
  "sheet-metal": `<path d="M3 26h16l10-10"/><path d="M3 22h14l8-8"/><path d="M19 26l-2-4" stroke-dasharray="1.5 1.5"/>`,
  // Lagged pipe in section.
  insulator: `<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="6"/><path d="M8 8l3 3M21 21l3 3M8 24l3-3M21 11l3-3"/>`,
  // Loupe with crosshair.
  inspector: `<circle cx="13" cy="13" r="9"/><path d="M20 20l9 9M13 7v12M7 13h12"/>`,
  // Fire triangle.
  "fire-watch": `<path d="M16 4 29 27H3z"/><path d="M16 12c3 3 3 6 0 9-3-3-3-6 0-9z"/>`,
  // Cutting torch tip and kerf.
  burner: `<path d="M4 6l12 12M7 3l12 12M16 18l3-3"/><path d="M19 19l2 2"/><path d="M3 28h11M17 28h12" /><path d="M21 23c2 1 3 3 2 5"/>`,
  // Framing square with ticks.
  joiner: `<path d="M6 3v23h23"/><path d="M10 3v19h19"/><path d="M6 8h2M6 13h2M6 18h2M14 26v-2M19 26v-2M24 26v-2"/>`,
  // Hard hat.
  laborer: `<path d="M6 21a10 10 0 0 1 20 0"/><path d="M3 21h26v3H3z"/><path d="M16 11v-3M12 12l-1-3M20 12l1-3"/>`,
  // Wrench.
  maintenance: `<path d="M20 4a6 6 0 0 0-5 9L4 24l4 4 11-11a6 6 0 0 0 9-5l-4 2-3-1-1-3z"/>`,
  // Gantt bars.
  planner: `<path d="M4 3v26M4 29h25"/><path d="M7 7h9v4H7zM12 14h11v4H12zM18 21h9v4h-9z"/>`,
  // Pallet with a crate.
  warehouse: `<path d="M8 6h16v14H8zM8 13h16M16 6v14"/><path d="M3 20h26v3H3zM5 23v4M16 23v4M27 23v4"/>`,
  // Set square and compass point.
  engineer: `<path d="M4 28V6l22 22z"/><path d="M9 23v-6l6 6z"/><path d="M24 3l4 8M24 3l-3 7"/>`,
};

export function glyph(key, size = 32, label = "") {
  const body = G[key] ?? G.laborer;
  const aria = label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`;
  return `<svg class="glyph" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" ${aria}>${body}</svg>`;
}

/** The Plimsoll load-line mark: a ring, a bar through it, and the deck line above. */
export function plimsoll(size = 28) {
  return `<svg class="plimsoll" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M4 4h24"/><circle cx="16" cy="18" r="10"/><path d="M2 18h28"/></svg>`;
}

export const GLYPH_KEYS = Object.keys(G);
