/**
 * BHARAT NITI — Automated SVG Integration Registry
 *
 * Designed to dynamically register and parse pasted SVGs (National, State, or Constituency levels),
 * extracting path/polygon IDs and automatically connecting them to game state routing, JSON database
 * entities, tooltips, and election simulation.
 */

export interface SVGMapConfig {
  /** Map type: national level, state assembly level, or district level */
  type: 'national' | 'state_assembly' | 'district_assembly';
  
  /** Parent state identifier if it is a state/district map (e.g., "Uttar Pradesh") */
  stateId?: string;
  
  /** Raw SVG string content or component */
  svgRaw: string;
  
  /** Automatic mapping of SVG element ID -> Game Entity ID (e.g., "IN-UP" -> "Uttar Pradesh") */
  idToEntityMap: Record<string, string>;
  
  /** Display configuration for tooltips and labels */
  displayOptions?: {
    showLabels?: boolean;
    defaultZoom?: number;
    strokeWidth?: number;
  };
}

class SVGRegistry {
  private maps: Map<string, SVGMapConfig> = new Map();

  /**
   * Register a new SVG map in the game.
   * This automatically links the map to the routing and simulation system.
   */
  registerMap(key: string, config: SVGMapConfig) {
    this.maps.set(key, config);
    console.log(`[SVG Registry] Successfully registered map: ${key} (${config.type})`);
  }

  /** Retrieve a registered map config */
  getMap(key: string): SVGMapConfig | undefined {
    return this.maps.get(key);
  }

  /** Get map key helper */
  getMapKey(type: 'national' | 'state_assembly' | 'district_assembly', stateId?: string): string {
    return stateId ? `${type}_${stateId.toLowerCase().replace(/\s+/g, '_')}` : type;
  }

  /**
   * AUTOMATIC PARSER: Automatically parses a pasted SVG string,
   * extracts all path/group IDs, and tries to link them to the JSON databases.
   */
  parseAndRegisterSVG(params: {
    svgRaw: string;
    type: 'national' | 'state_assembly' | 'district_assembly';
    stateId?: string;
    // Map of manual overrides if name heuristics fail
    overrides?: Record<string, string>;
  }): SVGMapConfig {
    const { svgRaw, type, stateId, overrides } = params;
    const idToEntityMap: Record<string, string> = { ...overrides };

    // Regex to match path elements with IDs: <path id="IN-UP" ...>
    const pathIdRegex = /<path[^>]*id="([^"]+)"/g;
    let match;
    const ids: string[] = [];

    while ((match = pathIdRegex.exec(svgRaw)) !== null) {
      if (match[1]) {
        ids.push(match[1]);
      }
    }

    // Auto-match IDs to database names based on type
    for (const elementId of ids) {
      if (idToEntityMap[elementId]) continue; // Skip if override exists

      if (type === 'national') {
        // Standard ISO code mapping heuristics
        const mappedState = heuristicallyMapISOToState(elementId);
        if (mappedState) {
          idToEntityMap[elementId] = mappedState;
        }
      } else {
        // Assembly level: match format e.g., "constituency_1" -> Constituency number
        const numberMatch = elementId.match(/(\d+)/);
        if (numberMatch && stateId) {
          // Links path element directly to constituency game ID e.g. "UttarPradesh_LS_1"
          const constNo = parseInt(numberMatch[1], 10);
          idToEntityMap[elementId] = `${stateId.replace(/\s+/g, '')}_LS_${constNo}`;
        }
      }
    }

    const config: SVGMapConfig = {
      type,
      stateId,
      svgRaw,
      idToEntityMap,
      displayOptions: {
        showLabels: true,
        defaultZoom: 1,
        strokeWidth: 0.5
      }
    };

    const key = this.getMapKey(type, stateId);
    this.registerMap(key, config);

    return config;
  }
}

/**
 * Heuristics to auto-map standard SVG path IDs to game state names.
 */
function heuristicallyMapISOToState(isoId: string): string | null {
  const cleanId = isoId.replace('IN-', '').toUpperCase();
  const maps: Record<string, string> = {
    'UP': 'Uttar Pradesh',
    'MH': 'Maharashtra',
    'WB': 'West Bengal',
    'BR': 'Bihar',
    'TN': 'Tamil Nadu',
    'MP': 'Madhya Pradesh',
    'KA': 'Karnataka',
    'GJ': 'Gujarat',
    'RJ': 'Rajasthan',
    'AP': 'Andhra Pradesh',
    'OR': 'Odisha',
    'KL': 'Kerala',
    'TG': 'Telangana',
    'AS': 'Assam',
    'JH': 'Jharkhand',
    'PB': 'Punjab',
    'CG': 'Chhattisgarh',
    'HR': 'Haryana',
    'DL': 'Delhi',
    'JK': 'Jammu & Kashmir',
    'UT': 'Uttarakhand',
    'HP': 'Himachal Pradesh',
    'TR': 'Tripura',
    'ML': 'Meghalaya',
    'MN': 'Manipur',
    'AR': 'Arunachal Pradesh',
    'GA': 'Goa',
    'MZ': 'Mizoram',
    'NL': 'Nagaland',
    'SK': 'Sikkim',
    'PY': 'Puducherry',
    'CH': 'Chandigarh',
    'AN': 'Andaman & Nicobar',
    'LD': 'Lakshadweep',
    'LA': 'Ladakh',
    'DD': 'Dadra & Nagar Haveli and Daman & Diu',
  };
  return maps[cleanId] ?? null;
}

export const svgRegistry = new SVGRegistry();
export default svgRegistry;
