
import React, { useState, useEffect, useMemo } from 'react';
import { Match, EventType, Player, Language } from '../types';
import { generateMatchReport } from '../services/geminiService';
import { FileText, Download, Share2, Sparkles, RefreshCw, Trophy, FileDown, Target, Ban, Zap, Users, User, Clock, Shield, UserCog, Star } from 'lucide-react';

interface FinalReportProps {
  match: Match;
  onClose: () => void;
  t?: any;
  language?: Language;
}

const FinalReport: React.FC<FinalReportProps> = ({ match, onClose, t = {}, language = 'it' }) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const report = await generateMatchReport(match, language as Language);
      setAiReport(report);
      setLoading(false);
    };
    fetchReport();
  }, [match, language]);

  const downloadTxt = () => {
    if (!aiReport) return;
    const element = document.createElement("a");
    const file = new Blob([aiReport], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    const fileName = `Referto_${match.homeTeamName.replace(/\s+/g, '_')}_vs_${match.awayTeamName.replace(/\s+/g, '_')}.txt`;
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const stats = useMemo(() => {
    const getCount = (team: 'HOME' | 'AWAY', type: EventType) => 
      match.events.filter(e => e.team === team && e.type === type).length;

    const getSanzioni = (team: 'HOME' | 'AWAY') =>
      match.events.filter(e => e.team === team && [EventType.YELLOW_CARD, EventType.RED_CARD, EventType.TWO_MINUTES, EventType.BLUE_CARD].includes(e.type)).length;

    const getPlayerGoals = (team: 'HOME' | 'AWAY', roster: Player[]) => {
      return roster
        .map(p => ({
          ...p,
          goals: match.events.filter(e => e.team === team && e.playerId === p.id && e.type === EventType.GOAL).length
        }))
        .filter(p => p.goals > 0)
        .sort((a, b) => b.goals - a.goals);
    };

    return {
      home: {
        goals: getCount('HOME', EventType.GOAL),
        misses: getCount('HOME', EventType.MISS),
        lostBalls: getCount('HOME', EventType.LOST_BALL),
        saves: getCount('HOME', EventType.SAVE),
        sanzioni: getSanzioni('HOME'),
        totalShots: getCount('HOME', EventType.GOAL) + getCount('HOME', EventType.MISS),
        playerGoals: getPlayerGoals('HOME', match.homeRoster),
        staff: match.homeStaff
      },
      away: {
        goals: getCount('AWAY', EventType.GOAL),
        misses: getCount('AWAY', EventType.MISS),
        lostBalls: getCount('AWAY', EventType.LOST_BALL),
        saves: getCount('AWAY', EventType.SAVE),
        sanzioni: getSanzioni('AWAY'),
        totalShots: getCount('AWAY', EventType.GOAL) + getCount('AWAY', EventType.MISS),
        playerGoals: getPlayerGoals('AWAY', match.awayRoster),
        staff: match.awayStaff
      }
    };
  }, [match]);

  const renderStatBar = (label: string, homeVal: number, awayVal: number, icon: any) => {
    const total = homeVal + awayVal || 1;
    const homePercent = (homeVal / total) * 100;
    const awayPercent = (awayVal / total) * 100;

    return (
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-1.5"><span className="text-blue-600">{homeVal}</span></div>
          <div className="flex items-center gap-2">{icon} {label}</div>
          <div className="flex items-center gap-1.5"><span className="text-red-600">{awayVal}</span></div>
        </div>
        <div className="flex h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
          <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${homePercent}%` }}></div>
          <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${awayPercent}%` }}></div>
        </div>
      </div>
    );
  };

  const renderScorerChart = (title: string, players: any[], color: 'blue' | 'red') => {
    const maxGoals = Math.max(...players.map(p => p.goals), 1);
    const accentBg = color === 'blue' ? 'bg-blue-600' : 'bg-red-600';
    const lightBg = color === 'blue' ? 'bg-blue-50' : 'bg-red-50';
    const textPrimary = color === 'blue' ? 'text-blue-900' : 'text-red-900';

    return (
      <div className={`${lightBg} p-5 rounded-2xl border ${color === 'blue' ? 'border-blue-100' : 'border-red-100'}`}>
        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${color === 'blue' ? 'text-blue-600' : 'text-red-600'}`}>
          <Trophy size={14} /> {title}
        </h4>
        <div className="space-y-3">
          {players.length === 0 ? (
            <p className="text-[10px] text-slate-400 font-bold uppercase italic text-center py-2">Nessun gol registrato</p>
          ) : (
            players.map((p, idx) => (
              <div key={p.id} className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className={`text-[10px] font-black uppercase truncate ${textPrimary}`}>
                    <span className="text-slate-400 mr-2">#{p.number}</span> {p.lastName}
                  </span>
                  <span className={`text-xs font-black ${textPrimary}`}>{p.goals}</span>
                </div>
                <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
                  <div 
                    className={`${accentBg} h-full rounded-full transition-all duration-1000`} 
                    style={{ width: `${(p.goals / maxGoals) * 100}%`, transitionDelay: `${idx * 100}ms` }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderStaffSection = (title: string, staff: Player[], color: 'blue' | 'red') => {
    const lightBg = color === 'blue' ? 'bg-blue-50/30' : 'bg-red-50/30';
    const accentText = color === 'blue' ? 'text-blue-600' : 'text-red-600';

    return (
      <div className={`${lightBg} p-4 rounded-xl border border-slate-100 mb-4`}>
         <h4 className={`text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${accentText}`}>
           <UserCog size={12} /> Area Tecnica - {title}
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {staff.length === 0 ? (
              <p className="text-[9px] text-slate-300 font-bold uppercase italic">Nessun membro staff registrato</p>
            ) : (
              staff.map(s => (
                <div key={s.id} className="bg-white/50 p-2 rounded-lg border border-slate-50 flex items-center gap-2">
                   <div className={`p-1 rounded bg-white border border-slate-100 ${accentText}`}>
                      {s.role?.toUpperCase().includes("ALLENATORE") ? <Star size={10} fill="currentColor" /> : <Shield size={10} />}
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-0.5 truncate">{s.lastName} {s.firstName}</p>
                      <p className={`text-[7px] font-black uppercase tracking-tighter ${accentText}`}>{s.role}</p>
                   </div>
                </div>
              ))
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="text-center px-4">
        <div className="inline-flex items-center justify-center p-3 md:p-4 bg-blue-100 text-blue-700 rounded-full mb-3 md:mb-4">
          <Trophy size={32} className="md:w-12 md:h-12" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1 uppercase">PARTITA CONCLUSA</h1>
        <div className="flex flex-col md:flex-row items-center justify-center gap-2">
           <p className="text-slate-500 font-medium text-sm">{match.date}</p>
           <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{match.category || 'Serie B'}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200 overflow-hidden mx-2">
        <div className="bg-slate-900 p-6 md:p-8 text-white relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse border border-white/20 shadow-lg">FINAL SCORE</div>
          <div className="flex flex-col md:flex-row justify-between items-center text-center gap-6 mt-4">
            <div className="flex-1 w-full flex flex-col items-center">
              {match.homeLogo && <img src={match.homeLogo} alt="" className="w-16 h-16 md:w-20 md:h-20 object-contain mb-3 bg-white/10 rounded-2xl p-2" />}
              {!match.homeLogo && <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-3"><Shield size={32} className="text-white/20" /></div>}
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-widest text-blue-400 truncate w-full">{match.homeTeamName}</h2>
              <div className="text-6xl md:text-7xl font-black mt-1 text-white">{match.score.home}</div>
            </div>
            <div className="px-6 py-2 bg-white/10 rounded-2xl md:px-10 text-slate-500 font-black text-2xl md:text-4xl">VS</div>
            <div className="flex-1 w-full flex flex-col items-center">
              {match.awayLogo && <img src={match.awayLogo} alt="" className="w-16 h-16 md:w-20 md:h-20 object-contain mb-3 bg-white/10 rounded-2xl p-2" />}
              {!match.awayLogo && <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-3"><Shield size={32} className="text-white/20" /></div>}
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-widest text-red-400 truncate w-full">{match.awayTeamName}</h2>
              <div className="text-6xl md:text-7xl font-black mt-1 text-white">{match.score.away}</div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-6 uppercase tracking-widest">
                <Zap size={16} className="text-amber-500" />
                Performance Team
              </h3>
              
              {renderStatBar("Gol Segnati", stats.home.goals, stats.away.goals, <Trophy size={12}/>)}
              {renderStatBar("Tiri Fuori", stats.home.misses, stats.away.misses, <Target size={12}/>)}
              {renderStatBar("Palle Perse", stats.home.lostBalls, stats.away.lostBalls, <Ban size={12}/>)}
              {renderStatBar("Parate", stats.home.saves, stats.away.saves, <FileText size={12}/>)}
              {renderStatBar("Sanzioni", stats.home.sanzioni, stats.away.sanzioni, <Zap size={12}/>)}

              <div className="grid grid-cols-2 gap-4 mt-8">
                 <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precisione Casa</p>
                    <p className="text-xl font-black text-blue-600">{stats.home.totalShots > 0 ? Math.round((stats.home.goals / stats.home.totalShots) * 100) : 0}%</p>
                 </div>
                 <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precisione Ospiti</p>
                    <p className="text-xl font-black text-red-600">{stats.away.totalShots > 0 ? Math.round((stats.away.goals / stats.away.totalShots) * 100) : 0}%</p>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <Users size={16} className="text-blue-600" />
                Area Tecnica & Marcatori
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Sezione Staff - Novità */}
                <div className="space-y-0">
                  {renderStaffSection(match.homeTeamName, stats.home.staff, 'blue')}
                  {renderStaffSection(match.awayTeamName, stats.away.staff, 'red')}
                </div>
                
                {renderScorerChart(match.homeTeamName, stats.home.playerGoals, 'blue')}
                {renderScorerChart(match.awayTeamName, stats.away.playerGoals, 'red')}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-blue-50/50 p-6 md:p-8 rounded-[2rem] border border-blue-100 relative shadow-inner h-fit lg:sticky lg:top-8">
            <div className="absolute top-6 right-6 text-blue-300">
              <Sparkles size={24} />
            </div>
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><FileText size={20} /></div>
               <h3 className="text-xl font-black text-blue-900 uppercase tracking-tighter">Referto Tecnico AI</h3>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative">
                  <RefreshCw size={40} className="text-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={16} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-blue-600 font-black text-xs uppercase tracking-widest animate-pulse">Gemini sta elaborando l'analisi...</p>
              </div>
            ) : (
              <div className="prose prose-sm text-slate-700 whitespace-pre-line leading-relaxed max-h-[600px] overflow-y-auto pr-3 custom-scrollbar text-sm font-medium">
                {aiReport}
              </div>
            )}
            
            {!loading && (
              <div className="mt-6 pt-6 border-t border-blue-100 space-y-4">
                <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} /> Ultimi Eventi Rilevanti
                </h4>
                <div className="space-y-2">
                  {match.events.filter(e => [EventType.GOAL, EventType.RED_CARD, EventType.TWO_MINUTES, EventType.LOST_BALL].includes(e.type)).slice(-5).map(e => (
                    <div key={e.id} className="text-[11px] p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center shadow-sm">
                      <span className="min-w-0 truncate pr-2">
                        <span className="font-mono font-bold text-blue-600 mr-2">{e.gameTime.split(' - ')[1]}</span> 
                        <span className="font-black text-slate-700 uppercase">{e.playerName}</span>
                      </span>
                      <span className={`font-black text-[9px] px-2 py-0.5 rounded-lg border uppercase whitespace-nowrap ${e.type === EventType.LOST_BALL ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{e.type.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-3">
          <button 
            onClick={() => window.print()}
            className="flex-1 min-w-[150px] bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-6 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
          >
            <Download size={18} /> Scarica PDF
          </button>
          <button 
            onClick={downloadTxt}
            disabled={loading || !aiReport}
            className="flex-1 min-w-[150px] bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-6 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest disabled:opacity-50 shadow-sm active:scale-95"
          >
            <FileDown size={18} /> Scarica TXT
          </button>
          <button className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95">
            <Share2 size={18} /> Condividi
          </button>
          <button 
            onClick={onClose}
            className="flex-1 min-w-[150px] bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black transition-all text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalReport;
