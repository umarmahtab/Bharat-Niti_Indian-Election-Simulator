/**
 * BHARAT NITI — Polls Panel with Recharts
 */

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useGameStore } from '../../store/gameStore';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PollsPanel() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const latestPoll = gameState.latestPoll;
  const polls = gameState.polls;

  // Build trend data for top 5 parties by popularity
  const topParties = Object.values(gameState.parties)
    .sort((a, b) => (b.currentPopularity ?? b.startingPopularity) - (a.currentPopularity ?? a.startingPopularity))
    .slice(0, 5);

  const trendData = polls.map(poll => {
    const point: Record<string, number | string> = { turn: `T${poll.turn}` };
    for (const party of topParties) {
      point[party.abbreviation] = poll.national.byParty[party.id]?.voteShare ?? 0;
    }
    return point;
  });

  // Latest seat projection
  const seatData = latestPoll
    ? Object.entries(latestPoll.national.byParty)
        .map(([pid, data]) => ({
          name: gameState.parties[pid]?.abbreviation ?? pid,
          seats: data.projectedSeats,
          fill: gameState.parties[pid]?.colour ?? '#888',
        }))
        .sort((a, b) => b.seats - a.seats)
        .slice(0, 8)
    : [];

  // Vote share pie
  const voteShareData = latestPoll
    ? Object.entries(latestPoll.national.byParty)
        .map(([pid, data]) => ({
          name: gameState.parties[pid]?.abbreviation ?? pid,
          value: parseFloat(data.voteShare.toFixed(1)),
          colour: gameState.parties[pid]?.colour ?? '#888',
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-card p-3 border border-white/10 text-xs">
        <p className="font-semibold text-text-primary mb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-text-muted">{p.dataKey}:</span>
            <span className="font-medium" style={{ color: p.color }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-2xl text-text-primary">Opinion Polls</h2>
        <p className="text-text-muted text-sm">Tracking voter sentiment across the nation</p>
      </div>

      {!latestPoll && (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-text-muted">First poll will appear after Turn 3</p>
        </div>
      )}

      {latestPoll && (
        <>
          {/* Poll header */}
          <div className={`glass-card p-4 border flex items-center justify-between transition-all ${latestPoll.isExitPoll ? 'border-saffron/40 bg-saffron/[0.03] shadow-[0_0_15px_rgba(249,115,22,0.06)]' : 'border-white/5'}`}>
            <div>
              <div className="text-xs text-text-muted flex items-center gap-1.5">
                {latestPoll.isExitPoll && <span className="px-1.5 py-0.5 rounded bg-saffron text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">Exit Poll</span>}
                <span>Latest Survey</span>
              </div>
              <div className="font-semibold text-text-primary text-base mt-0.5">{latestPoll.pollsterName}</div>
              <div className="text-xs text-text-muted mt-0.5">Turn {latestPoll.turn} • Confidence: {latestPoll.national.confidence}%</div>
              <div className="text-xs text-text-muted mt-0.5">
                MoE: ±{latestPoll.national.margin}% {latestPoll.national.undecided !== undefined && latestPoll.national.undecided > 0 && `• Undecided: ${latestPoll.national.undecided.toFixed(1)}%`}
              </div>
              {latestPoll.national.sampleSize && (
                <div className="text-[10px] text-text-dim mt-0.5">Sample Size: {latestPoll.national.sampleSize.toLocaleString('en-IN')} respondents</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Projected Winner</div>
              <div className="font-bold text-lg" style={{ color: gameState.parties[latestPoll.national.winner ?? '']?.colour ?? '#fff' }}>
                {gameState.parties[latestPoll.national.winner ?? '']?.abbreviation ?? 'Hung'}
              </div>
              <div className="text-xs mt-1 flex items-center justify-end gap-1 text-text-muted">
                Trend:
                {latestPoll.national.trend === 'up' && <TrendingUp className="w-3 h-3 text-india-green" />}
                {latestPoll.national.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
                <span className="uppercase">{latestPoll.national.trend ?? 'flat'}</span>
              </div>
            </div>
          </div>

          {/* Seat projection bar chart */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Seat Projection</h3>
            <div className="relative">
              {/* Majority line annotation */}
              <div className="absolute right-0 top-0 bottom-0 flex items-center text-xs text-saffron/60 pointer-events-none" style={{ left: '50%' }}>
                <div className="h-full w-px bg-saffron/30" />
                <span className="ml-1">Majority</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={seatData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fill: '#8892B0', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#B0BAD0', fontSize: 11 }} width={55} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="seats" radius={[0, 4, 4, 0]}>
                  {seatData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Vote share trend */}
          {trendData.length > 1 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Vote Share Trend</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trendData}>
                  <XAxis dataKey="turn" tick={{ fill: '#8892B0', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8892B0', fontSize: 10 }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  {topParties.map(party => (
                    <Line
                      key={party.id}
                      type="monotone"
                      dataKey={party.abbreviation}
                      stroke={party.colour}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Vote share pie */}
          {voteShareData.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Vote Share Distribution</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={140}>
                  <PieChart>
                    <Pie data={voteShareData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {voteShareData.map((entry, i) => (
                        <Cell key={i} fill={entry.colour} fillOpacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {voteShareData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.colour }} />
                        <span className="text-xs text-text-secondary">{d.name}</span>
                      </div>
                      <span className="text-xs font-semibold tabular" style={{ color: d.colour }}>{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
