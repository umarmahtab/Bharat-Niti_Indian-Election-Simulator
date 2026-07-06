/**
 * BHARAT NITI — Interactive India SVG Map (v4)
 * Clickable constituency regions with dynamic party colouring.
 */

import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import mapSvgRaw from '../../assets/indiamap.svg?raw';

// Map game State IDs to SVG data-state slugs
const STATE_ID_TO_SLUG: Record<string, string> = {
  'Jammu & Kashmir': 'jammu-and-kashmir',
  'Dadra & Nagar Haveli and Daman & Diu': 'dadra-and-nagar-haveli-and-daman-and-diu', // fallback
  'Andaman & Nicobar': 'andaman-and-nicobar-islands',
  'Delhi': 'nct-of-delhi', // common alternative
};

function getSlugFromStateId(stateId: string): string {
  if (STATE_ID_TO_SLUG[stateId]) return STATE_ID_TO_SLUG[stateId];
  return stateId.toLowerCase().replace(/ & /g, '-and-').replace(/ /g, '-');
}

// And reverse mapping
const SLUG_TO_STATE_ID: Record<string, string> = {};
const gameStates = [
  'Uttar Pradesh', 'Bihar', 'Rajasthan', 'Madhya Pradesh', 'Haryana',
  'Himachal Pradesh', 'Uttarakhand', 'Punjab', 'Maharashtra', 'Gujarat',
  'Goa', 'Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana',
  'West Bengal', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Assam', 'Meghalaya',
  'Tripura', 'Manipur', 'Mizoram', 'Nagaland', 'Arunachal Pradesh', 'Sikkim',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman & Nicobar', 'Lakshadweep', 'Dadra & Nagar Haveli and Daman & Diu'
];
for (const s of gameStates) {
  SLUG_TO_STATE_ID[getSlugFromStateId(s)] = s;
}
// Add alternative slugs just in case
SLUG_TO_STATE_ID['delhi'] = 'Delhi';
SLUG_TO_STATE_ID['orissa'] = 'Odisha';
SLUG_TO_STATE_ID['daman-and-diu'] = 'Dadra & Nagar Haveli and Daman & Diu';
SLUG_TO_STATE_ID['dadra-and-nagar-haveli'] = 'Dadra & Nagar Haveli and Daman & Diu';
SLUG_TO_STATE_ID['andaman-and-nicobar'] = 'Andaman & Nicobar';

interface MapTooltip {
  x: number;
  y: number;
  stateId: string;
  stateName: string;
  constituencyName?: string;
  rulingParty: string;
  rulingPartyColour: string;
  playerPop: number;
  seats: number;
  topIssue: string;
  winnerPartyAbbr?: string;
  winnerSeats?: number;
  winnerVoteShare?: number;
  isResultsPhase?: boolean;
}

export default function IndiaMap() {
  const { gameState, selectState } = useGameStore();
  const [tooltip, setTooltip] = useState<MapTooltip | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomTimeoutRef = useRef<number | null>(null);

  function animateZoomToState(container: HTMLDivElement, slug: string, durationMs = 900): boolean {
    const svgElement = container.querySelector('svg');
    const pathElements = container.querySelectorAll(`path[data-state="${slug}"]`);
    if (!svgElement || pathElements.length === 0) return false;

    // Calculate bounding box for all paths in this state
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pathElements.forEach(p => {
      const bbox = (p as SVGGraphicsElement).getBBox();
      if (bbox.x < minX) minX = bbox.x;
      if (bbox.y < minY) minY = bbox.y;
      if (bbox.x + bbox.width > maxX) maxX = bbox.x + bbox.width;
      if (bbox.y + bbox.height > maxY) maxY = bbox.y + bbox.height;
    });

    const padding = 20;
    const vx = minX - padding;
    const vy = minY - padding;
    const vw = (maxX - minX) + padding * 2;
    const vh = (maxY - minY) + padding * 2;

    svgElement.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);

    const allPaths = container.querySelectorAll('path.pc-link');
    allPaths.forEach(p => {
      if (p.getAttribute('data-state') !== slug) {
        (p as SVGElement).style.opacity = '0.08';
        (p as SVGElement).style.transition = `opacity ${durationMs}ms`;
      } else {
        (p as SVGElement).style.opacity = '1';
        (p as SVGElement).style.stroke = 'rgba(255,255,255,0.8)';
        (p as SVGElement).style.strokeWidth = '0.8';
      }
    });

    return true;
  }

  // Build CSS that colours every constituency
  const injectedCss = useMemo(() => {
    if (!gameState) return '';
    const lines: string[] = [
      /* Base style for all paths */
      `#india-map-root path.pc-link { transition: fill 0.25s, opacity 0.25s; cursor: pointer; stroke: rgba(255,255,255,0.1); stroke-width: 0.2; }`,
      `#india-map-root path.pc-link:hover { opacity: 1 !important; stroke: rgba(255,255,255,0.8) !important; stroke-width: 0.8 !important; filter: brightness(1.3); }`,
      `#india-map-root title { display: none; }`, // Hide native SVG tooltips
    ];

    for (const stateId of gameStates) {
      const stateData = gameState.states[stateId];
      if (!stateData) continue;
      
      const slug = getSlugFromStateId(stateId);
      const isSelected = gameState.selectedStateId === stateId;
      
      // In Results Phase, we colour by individual constituency winner
      if (gameState.phase === 'results' && gameState.electionResult?.byState?.[stateId]) {
        const stateResult = gameState.electionResult.byState[stateId];
        
        // Default to state winner for missing constituencies
        const stateWinnerPartyId = stateResult.swingParty || Object.entries(stateResult.seatsByParty).sort((a,b)=>b[1]-a[1])[0]?.[0];
        const stateWinnerParty = stateWinnerPartyId ? gameState.parties[stateWinnerPartyId] : null;
        const stateColour = stateWinnerParty?.colour ?? '#1e3a5f';
        
        // Base colour for state
        lines.push(
          `#india-map-root path.pc-link[data-state="${slug}"] {` +
          `  fill: ${stateColour};` +
          `  opacity: 0.85;` +
          `}`
        );

        // However, if we track per-constituency, we would iterate stateResult.constituencyWinners here
        // Assuming we don't have constituency-level data in stateResult yet, it will use the state winner colour.
      } 
      // In Campaign Phase, we colour by state ruling party / popularity
      else {
        const rulingPartyId = stateData.rulingPartyId;
        const party = rulingPartyId ? gameState.parties[rulingPartyId] : null;
        const colour = party?.colour ?? '#1e3a5f';
        const opacity = 0.5 + ((stateData.popularityByParty?.[gameState.playerPartyId] ?? 0) / 100) * 0.3;

        if (isSelected) {
          lines.push(
            `#india-map-root path.pc-link[data-state="${slug}"] {` +
            `  fill: ${colour};` +
            `  opacity: 1;` +
            `  stroke: #ffffff !important;` +
            `  stroke-width: 0.8 !important;` +
            `  filter: drop-shadow(0 0 4px ${colour}60);` +
            `}`
          );
        } else {
          lines.push(
            `#india-map-root path.pc-link[data-state="${slug}"] {` +
            `  fill: ${colour};` +
            `  opacity: ${opacity.toFixed(2)};` +
            `}`
          );
        }
      }
    }

    return lines.join('\n');
  }, [gameState?.states, gameState?.selectedStateId, gameState?.parties, gameState?.playerPartyId, gameState?.phase, gameState?.electionResult]);

  // Attach mouse and click handlers to SVG paths after render
  useEffect(() => {
    const container = containerRef.current;
    const currentGameState = gameState;
    if (!container || !currentGameState) return;

    function handleMouseMove(e: Event) {
      if (!currentGameState || !container) return;
      const me = e as MouseEvent;
      const target = me.target as Element;
      
      if (target.tagName.toLowerCase() === 'path' && target.classList.contains('pc-link')) {
        const slug = target.getAttribute('data-state');
        const constituencyName = target.getAttribute('data-name');
        
        if (slug) {
          const stateId = SLUG_TO_STATE_ID[slug];
          if (stateId && currentGameState.states[stateId]) {
            const stateData = currentGameState.states[stateId];
            const rect = container.getBoundingClientRect();
            
            if (currentGameState.phase === 'results' && currentGameState.electionResult?.byState?.[stateId]) {
              const stateResult = currentGameState.electionResult.byState[stateId];
              const sortedSeats = Object.entries(stateResult.seatsByParty).sort((a,b)=>b[1]-a[1]);
              const winnerPartyId = sortedSeats[0]?.[0] ?? 'Unknown';
              const winnerParty = currentGameState.parties[winnerPartyId];
              const winnerSeats = sortedSeats[0]?.[1] ?? 0;

              const voteSharePercent = currentGameState.electionResult.byParty[winnerPartyId]?.voteShare ?? 0;

              setTooltip({
                x: me.clientX - rect.left,
                y: me.clientY - rect.top,
                stateId,
                stateName: stateData.name,
                constituencyName: constituencyName || undefined,
                rulingParty: winnerParty?.abbreviation ?? 'Unknown',
                rulingPartyColour: winnerParty?.colour ?? '#888',
                playerPop: 0,
                seats: stateData.lokSabhaSeats,
                topIssue: '',
                winnerPartyAbbr: winnerParty?.abbreviation ?? 'Unknown',
                winnerSeats,
                winnerVoteShare: voteSharePercent,
                isResultsPhase: true
              });
            } else {
              const party = currentGameState.parties[stateData.rulingPartyId];
              const playerPop = stateData.popularityByParty?.[currentGameState.playerPartyId] ?? 0;
              
              setTooltip({
                x: me.clientX - rect.left,
                y: me.clientY - rect.top,
                stateId,
                stateName: stateData.name,
                constituencyName: constituencyName || undefined,
                rulingParty: party?.abbreviation ?? 'Unknown',
                rulingPartyColour: party?.colour ?? '#888',
                playerPop,
                seats: stateData.lokSabhaSeats,
                topIssue: stateData.primaryIssues?.[0] ?? 'development',
                isResultsPhase: false
              });
            }
            return;
          }
        }
      }
      setTooltip(null);
    }

    function handleMouseLeave() {
      setTooltip(null);
    }

    function handleClick(e: Event) {
      if (!currentGameState) return;
      const target = e.target as Element;
      
      if (target.tagName.toLowerCase() === 'path' && target.classList.contains('pc-link')) {
        const slug = target.getAttribute('data-state');
        if (slug) {
          const stateId = SLUG_TO_STATE_ID[slug];
          if (stateId) {
            setTooltip(null);

            if (
              currentGameState.mode === 'state_assembly' &&
              currentGameState.targetState &&
              stateId !== currentGameState.targetState
            ) {
              return;
            }

            if (currentGameState.mode === 'state_assembly') {
              const didAnimate = container ? animateZoomToState(container, slug, 850) : false;
              if (didAnimate) {
                if (zoomTimeoutRef.current) {
                  window.clearTimeout(zoomTimeoutRef.current);
                }
                zoomTimeoutRef.current = window.setTimeout(() => {
                  selectState(stateId);
                }, 620);
                return;
              }
            }

            selectState(stateId);
          }
        }
      }
    }

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('click', handleClick);
      if (zoomTimeoutRef.current) {
        window.clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, [gameState, selectState, injectedCss]);

  // Zoom to target state in state_assembly mode
  useEffect(() => {
    if (!gameState || gameState.mode !== 'state_assembly' || !gameState.targetState) return;
    
    const container = containerRef.current;
    if (!container) return;

    const slug = getSlugFromStateId(gameState.targetState);
    if (!slug) return;

    animateZoomToState(container, slug, 1300);
  }, [gameState?.mode, gameState?.targetState]);

  if (!gameState) return null;

  // Process raw SVG string to add IDs and ensure full width/height
  const processedSvg = mapSvgRaw
    .replace('<svg', '<svg id="india-map-root"')
    .replace(/width="[^"]*"/, 'width="100%"')
    .replace(/height="[^"]*"/, 'height="100%"');

  return (
    <div className="relative w-full h-full">
      <style>{injectedCss}</style>

      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ userSelect: 'none' }}
        dangerouslySetInnerHTML={{ __html: processedSvg }}
      />

      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="map-tooltip"
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute z-50"
            style={{
              left: Math.min(tooltip.x + 16, window.innerWidth - 220),
              top: Math.max(tooltip.y - 20, 10),
            }}
          >
            <div
              className="rounded-2xl p-3.5 min-w-[180px] shadow-2xl border"
              style={{
                background: 'rgba(10,16,36,0.96)',
                backdropFilter: 'blur(16px)',
                borderColor: tooltip.rulingPartyColour + '40',
              }}
            >
              <div className="flex flex-col mb-2.5">
                {tooltip.constituencyName && (
                  <span className="font-bold text-sm text-saffron leading-tight">
                    {tooltip.constituencyName}
                  </span>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tooltip.rulingPartyColour }}
                  />
                  <span className="font-semibold text-xs text-white/80 leading-tight">
                    {tooltip.stateName}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {tooltip.isResultsPhase ? (
                  <>
                    <Row label="State Winner" value={tooltip.winnerPartyAbbr ?? 'Unknown'} colour={tooltip.rulingPartyColour} />
                    <Row label="State Seats Won" value={`${tooltip.winnerSeats}/${tooltip.seats}`} />
                    <Row label="State Vote Share" value={`${(tooltip.winnerVoteShare ?? 0).toFixed(1)}%`} />
                  </>
                ) : (
                  <>
                    <Row label="Ruling Party" value={tooltip.rulingParty} colour={tooltip.rulingPartyColour} />
                    <Row label="Total LS Seats" value={String(tooltip.seats)} />
                    <Row
                      label="Your Poll"
                      value={`${tooltip.playerPop.toFixed(1)}%`}
                      colour={tooltip.playerPop > 40 ? '#10B981' : tooltip.playerPop > 25 ? '#F4C430' : '#EF4444'}
                    />
                    <Row label="Top Issue" value={tooltip.topIssue.replace(/_/g, ' ')} />
                  </>
                )}
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/[0.07] text-[10px] text-white/40">
                {tooltip.isResultsPhase ? 'Click to view state results' : 'Click to open state detail'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Legend for parties */}
      <div
        className="absolute bottom-3 left-3 rounded-xl p-2.5 space-y-1.5"
        style={{ background: 'rgba(10,16,36,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-2">
          {gameState.phase === 'results' ? 'State Winner' : 'Ruling Party'}
        </div>
        {gameState.phase === 'results' ? (
          Object.values(gameState.parties)
            .filter(p => Object.values(gameState.electionResult?.byState ?? {}).some(
              sr => (sr.swingParty || Object.entries(sr.seatsByParty).sort((a,b)=>b[1]-a[1])[0]?.[0]) === p.id
            ))
            .slice(0, 8)
            .map(party => (
              <div key={party.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: party.colour }} />
                <span className="text-[10px] text-white/60">{party.abbreviation}</span>
              </div>
            ))
        ) : (
          Object.values(gameState.parties)
            .filter(p => Object.values(gameState.states).some(s => s.rulingPartyId === p.id))
            .slice(0, 8)
            .map(party => (
              <div key={party.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: party.colour }} />
                <span className="text-[10px] text-white/60">{party.abbreviation}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

function Row({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[11px] text-white/45 flex-shrink-0">{label}</span>
      <span className="text-[11px] font-bold truncate" style={{ color: colour ?? 'rgba(255,255,255,0.85)' }}>
        {value}
      </span>
    </div>
  );
}
