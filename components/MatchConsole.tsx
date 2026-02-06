
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Match, Player, EventType, MatchEvent } from '../types';
import { Play, Pause, RotateCcw, Award, AlertTriangle, XCircle, ShieldCheck, Pencil, Check, X, Settings2, Coffee, Plus, Minus, Zap, UserCog, Ban, Undo2, Trash2, Clock, RefreshCw, Target, Shield, ChevronUp, ChevronDown, BarChart3, TrendingUp } from 'lucide-react';

interface MatchConsoleProps {
  match: Match;
  onUpdate: (updatedMatch: Match) => void;
  onFinish: () => void;
  t: any;
}

const MatchConsole: React.FC<MatchConsoleProps> = ({ match, onUpdate, onFinish, t }) => {
  const matchRef = useRef(match);
  
  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  const [seconds, setSeconds] = useState(match.currentTime || 0);
  const [currentPeriod, setCurrentPeriod] = useState(match.currentPeriod || 1);
  const [isActive, setIsActive] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{person: Player, team: 'HOME' | 'AWAY', isStaff: boolean} | null>(null);
  
  const [isTimeoutActive, setIsTimeoutActive] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);
  const [timeoutTeam, setTimeoutTeam] = useState<'HOME' | 'AWAY' | null>(null);

  const [periodDurations, setPeriodDurations] = useState<{ [key: number]: number }>({
    1: 1800, 2: 1800, 3: 600, 4: 600
  });
  
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MatchEvent | null>(null);
  const [editMins, setEditMins] = useState('');
  const [editSecs, setEditSecs] = useState('');
  const [timeIsUp, setTimeIsUp] = useState(false);

  const targetSeconds = periodDurations[currentPeriod];

  // Calcola le statistiche per la persona selezionata
  const selectedStats = useMemo(() => {
    if (!selectedPerson) return null;
    const pEvents = match.events.filter(e => e.playerId === selectedPerson.person.id);
    const goals = pEvents.filter(e => e.type === EventType.GOAL).length;
    const misses = pEvents.filter(e => e.type === EventType.MISS).length;
    const totalShots = goals + misses;
    
    return {
      goals,
      saves: pEvents.filter(e => e.type === EventType.SAVE).length,
      misses,
      lostBalls: pEvents.filter(e => e.type === EventType.LOST_BALL).length,
      twoMins: pEvents.filter(e => e.type === EventType.TWO_MINUTES).length,
      yellow: pEvents.filter(e => e.type === EventType.YELLOW_CARD).length,
      red: pEvents.filter(e => e.type === EventType.RED_CARD).length,
      blue: pEvents.filter(e => e.type === EventType.BLUE_CARD).length,
      efficiency: totalShots > 0 ? Math.round((goals / totalShots) * 100) : 0,
      totalShots
    };
  }, [selectedPerson, match.events]);

  // Calcola il punteggio basato sugli eventi
  const calculateCurrentScore = (events: MatchEvent[]) => {
    return {
      home: events.filter(e => e.team === 'HOME' && e.type === EventType.GOAL).length,
      away: events.filter(e => e.team === 'AWAY' && e.type === EventType.GOAL).length
    };
  };

  const syncTimeWithParent = (newSeconds: number, newPeriod: number) => {
    const current = matchRef.current;
    onUpdate({
      ...current,
      currentTime: newSeconds,
      currentPeriod: newPeriod,
    });
  };

  // Timer del Match
  useEffect(() => {
    let interval: any = null;
    if (isActive && !isTimeoutActive) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          if (next >= targetSeconds) {
            setIsActive(false);
            setTimeIsUp(true);
            syncTimeWithParent(targetSeconds, currentPeriod);
            return targetSeconds;
          }
          if (next % 10 === 0) {
            syncTimeWithParent(next, currentPeriod);
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, isTimeoutActive, targetSeconds, currentPeriod]);

  // Timer del Time-out
  useEffect(() => {
    let interval: any = null;
    if (isTimeoutActive) {
      interval = setInterval(() => {
        setTimeoutSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimeoutActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimeoutActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Correzione manuale del punteggio (senza eventi)
  const manualScoreAdjustment = (team: 'HOME' | 'AWAY', delta: number) => {
    const currentMatch = matchRef.current;
    const newScore = { ...currentMatch.score };
    if (team === 'HOME') {
      newScore.home = Math.max(0, newScore.home + delta);
    } else {
      newScore.away = Math.max(0, newScore.away + delta);
    }
    onUpdate({ ...currentMatch, score: newScore });
  };

  const handleStartTimeout = (team: 'HOME' | 'AWAY') => {
    if (isTimeoutActive) return;
    setIsActive(false);
    setIsTimeoutActive(true);
    setTimeoutSeconds(60);
    setTimeoutTeam(team);
    
    const newEvent: MatchEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type: EventType.TIMEOUT,
      playerId: 'T-' + team,
      playerName: `TIME-OUT ${team === 'HOME' ? match.homeTeamName : match.awayTeamName}`,
      team,
      isStaff: true,
      timestamp: Date.now(),
      gameTime: `${currentPeriod}°T - ${formatTime(seconds)}`
    };

    const currentMatch = matchRef.current;
    onUpdate({
      ...currentMatch,
      events: [...currentMatch.events, newEvent],
      currentTime: seconds,
      currentPeriod: currentPeriod
    });
  };

  const handleEditTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    setEditMins(mins.toString());
    setEditSecs(secs.toString().padStart(2, '0'));
    setIsEditingTime(true);
    setIsActive(false);
  };

  const saveEditedTime = () => {
    const m = parseInt(editMins) || 0;
    const s = parseInt(editSecs) || 0;
    const total = (m * 60) + Math.min(s, 59);
    const finalVal = Math.min(total, targetSeconds);
    setSeconds(finalVal);
    syncTimeWithParent(finalVal, currentPeriod);
    setIsEditingTime(false);
  };

  const addEvent = (type: EventType) => {
    if (!selectedPerson) return;
    const { person, team, isStaff } = selectedPerson;
    const playerName = isStaff ? `${person.lastName} (${person.role})` : `${person.lastName} ${person.firstName}`;

    const newEvent: MatchEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      playerId: person.id,
      playerName,
      team,
      isStaff,
      timestamp: Date.now(),
      gameTime: `${currentPeriod}°T - ${formatTime(seconds)}`
    };

    const currentMatch = matchRef.current;
    const newEvents = [...currentMatch.events, newEvent];
    const newScore = calculateCurrentScore(newEvents);
    
    onUpdate({
      ...currentMatch,
      events: newEvents,
      score: newScore,
      currentTime: seconds,
      currentPeriod: currentPeriod
    });
  };

  const deleteEvent = (eventId: string) => {
    const currentMatch = matchRef.current;
    if (!window.confirm(t.confirmDeleteEvent || "Eliminare questa azione?")) return;
    
    const newEvents = currentMatch.events.filter(e => e.id !== eventId);
    onUpdate({
      ...currentMatch,
      events: newEvents,
      score: calculateCurrentScore(newEvents)
    });
  };

  const handleEditEvent = (event: MatchEvent) => {
    setEditingEvent(event);
  };

  const saveEditedEvent = (updatedEvent: MatchEvent) => {
    const currentMatch = matchRef.current;
    const newEvents = currentMatch.events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    onUpdate({
      ...currentMatch,
      events: newEvents,
      score: calculateCurrentScore(newEvents)
    });
    setEditingEvent(null);
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case EventType.GOAL: return <Award size={14} className="text-emerald-500" />;
      case EventType.YELLOW_CARD: return <div className="w-2.5 h-3.5 bg-yellow-400 border border-slate-900 rounded-sm"></div>;
      case EventType.RED_CARD: return <div className="w-2.5 h-3.5 bg-red-600 border border-slate-900 rounded-sm"></div>;
      case EventType.BLUE_CARD: return <div className="w-2.5 h-3.5 bg-blue-700 border border-slate-900 rounded-sm"></div>;
      case EventType.TWO_MINUTES: return <AlertTriangle size={14} className="text-amber-500" />;
      case EventType.SAVE: return <ShieldCheck size={14} className="text-blue-500" />;
      case EventType.TIMEOUT: return <Coffee size={14} className="text-slate-400" />;
      case EventType.MISS: return <XCircle size={14} className="text-orange-500" />;
      case EventType.LOST_BALL: return <Ban size={14} className="text-slate-500" />;
      default: return null;
    }
  };

  const renderPersonGrid = (roster: Player[], staff: Player[], team: 'HOME' | 'AWAY') => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
        {roster.map(player => (
          <button
            key={player.id}
            onClick={() => setSelectedPerson({ person: player, team, isStaff: false })}
            className={`py-3 px-1 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 min-h-[64px] ${
              selectedPerson?.person.id === player.id && !selectedPerson.isStaff
                ? 'border-blue-600 bg-blue-50 shadow-sm' 
                : 'border-slate-100 hover:border-blue-200 bg-white shadow-sm'
            }`}
          >
            <span className="text-lg md:text-xl font-black text-slate-800 leading-none">#{player.number}</span>
            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase truncate w-full text-center tracking-tighter">
              {player.lastName.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
      {staff.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t.staff}</label>
          <div className="grid grid-cols-2 gap-2">
            {staff.map(member => (
              <button
                key={member.id}
                onClick={() => setSelectedPerson({ person: member, team, isStaff: true })}
                className={`py-2 px-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  selectedPerson?.person.id === member.id && selectedPerson.isStaff
                    ? 'border-amber-600 bg-amber-50 shadow-sm' 
                    : 'border-slate-100 hover:border-amber-200 bg-slate-50 shadow-sm'
                }`}
              >
                <div className={`p-1.5 rounded bg-white border ${selectedPerson?.person.id === member.id ? 'border-amber-200 text-amber-600' : 'border-slate-200 text-slate-400'}`}>
                  <UserCog size={12} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[9px] font-black text-slate-800 uppercase leading-none truncate">{member.lastName}</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">{member.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-1 md:px-4">
      {/* Scoreboard */}
      <div className={`rounded-2xl md:rounded-3xl p-3 md:p-8 shadow-lg relative overflow-hidden transition-all duration-500 ${timeIsUp ? 'bg-red-600 scale-[0.98]' : 'bg-slate-900'} text-white`}>
        {isTimeoutActive && (
          <div className="absolute inset-0 bg-blue-600/95 flex flex-col items-center justify-center z-[50] animate-in fade-in zoom-in-95 duration-300">
            <Coffee size={48} className="text-white mb-2 animate-bounce" />
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest text-center px-4">
              TIME-OUT {timeoutTeam === 'HOME' ? match.homeTeamName : match.awayTeamName}
            </h2>
            <div className="text-6xl font-mono font-black mt-4">{timeoutSeconds}s</div>
            <button onClick={() => setIsTimeoutActive(false)} className="mt-6 px-8 py-2 bg-white text-blue-600 rounded-xl font-black uppercase tracking-widest text-xs">Riprendi</button>
          </div>
        )}
        <div className={`absolute top-0 left-0 w-full h-1 ${timeIsUp ? 'bg-white animate-pulse' : 'bg-blue-500'}`}></div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-8 relative z-10">
          {/* HOME TEAM */}
          <div className="flex justify-between items-center w-full md:w-auto md:flex-col md:flex-1 md:order-1">
            <div className="flex flex-col items-start md:items-center gap-1">
              <div className="flex items-center gap-2">
                {match.homeLogo && <img src={match.homeLogo} alt="" className="w-8 h-8 md:w-12 md:h-12 object-contain bg-white/10 rounded-lg p-1" />}
                <h2 className="text-sm md:text-2xl font-black uppercase tracking-tight text-blue-400 truncate max-w-[120px] md:max-w-none">{match.homeTeamName}</h2>
              </div>
              <button onClick={() => handleStartTimeout('HOME')} className="flex items-center gap-1 px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/40 transition-all"><Coffee size={10} className="md:w-3 md:h-3" /> {t.timeout}</button>
            </div>
            
            <div className="flex flex-col items-center">
              <button onClick={() => manualScoreAdjustment('HOME', 1)} className="p-1 text-blue-400/50 hover:text-blue-400 transition-colors"><ChevronUp size={24} /></button>
              <div className="text-4xl md:text-7xl font-black">{match.score.home}</div>
              <button onClick={() => manualScoreAdjustment('HOME', -1)} className="p-1 text-blue-400/50 hover:text-blue-400 transition-colors"><ChevronDown size={24} /></button>
            </div>
          </div>

          {/* TIMER CENTRAL */}
          <div className="text-center flex flex-col items-center order-first md:order-2 px-3 py-2 md:py-4 bg-slate-800/80 rounded-xl md:rounded-2xl border border-slate-700 shadow-inner w-full md:min-w-[320px] backdrop-blur-md">
            <div className="flex items-center justify-between w-full mb-1">
               <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-[8px] md:text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">{currentPeriod}° T</span>
                  {!isEditingTime && <button onClick={handleEditTime} className="p-1 hover:text-white"><Pencil size={12} /></button>}
               </div>
               <button onClick={() => setIsEditingSettings(!isEditingSettings)} className={`p-1 ${isEditingSettings ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}><Settings2 size={16} /></button>
            </div>
            
            {!isEditingSettings && !isEditingTime && (
              <>
                <div className="flex items-center gap-4 md:gap-6">
                   <button onClick={() => { setSeconds(Math.max(0, seconds - 1)); syncTimeWithParent(Math.max(0, seconds - 1), currentPeriod); }} className="p-1.5 md:p-2 text-slate-500 hover:text-white bg-white/5 rounded-lg text-[9px] font-bold border border-white/5 transition-all">-1s</button>
                   <button onClick={handleEditTime} className={`text-4xl md:text-6xl font-mono font-black tracking-tighter ${timeIsUp ? 'text-white' : 'text-blue-100'}`}>{formatTime(seconds)}</button>
                   <button onClick={() => { setSeconds(Math.min(targetSeconds, seconds + 1)); syncTimeWithParent(Math.min(targetSeconds, seconds + 1), currentPeriod); }} className="p-1.5 md:p-2 text-slate-500 hover:text-white bg-white/5 rounded-lg text-[9px] font-bold border border-white/5 transition-all">+1s</button>
                </div>
                <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-4 w-full">
                  <button onClick={() => { setIsActive(!isActive); setTimeIsUp(false); }} className={`flex items-center justify-center gap-2 flex-1 py-2.5 md:py-3.5 rounded-xl font-black transition-all shadow-lg text-[10px] md:text-sm tracking-widest ${isActive ? 'bg-red-500 shadow-red-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
                    {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    {isActive ? 'STOP' : 'START'}
                  </button>
                  <button onClick={() => { if(confirm(t.confirmResetTimer)) setSeconds(0); }} className="p-2.5 text-slate-400 hover:text-white bg-slate-700/50 rounded-xl"><RotateCcw size={16} /></button>
                </div>
              </>
            )}
            
            {isEditingTime && (
              <div className="flex flex-col items-center gap-2 py-1 w-full animate-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <input type="number" className="w-14 bg-slate-700 rounded-lg text-2xl font-mono font-bold text-center text-blue-100 p-2 border-none" value={editMins} onChange={e => setEditMins(e.target.value)} />
                  <span className="text-xl font-bold">:</span>
                  <input type="number" className="w-14 bg-slate-700 rounded-lg text-2xl font-mono font-bold text-center text-blue-100 p-2 border-none" value={editSecs} onChange={e => setEditSecs(e.target.value)} />
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <button onClick={saveEditedTime} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-[10px] font-black uppercase">OK</button>
                  <button onClick={() => setIsEditingTime(false)} className="flex-1 bg-slate-600 text-white py-2 rounded-xl text-[10px] font-black uppercase">ANNULLA</button>
                </div>
              </div>
            )}

            {isEditingSettings && (
               <div className="w-full space-y-3 mt-4 animate-in fade-in">
                  <div className="grid grid-cols-4 gap-1">
                    {[1,2,3,4].map(p => (
                      <button key={p} onClick={() => { setCurrentPeriod(p); setSeconds(0); setIsEditingSettings(false); syncTimeWithParent(0, p); }} className={`py-1 rounded text-[10px] font-black ${currentPeriod === p ? 'bg-blue-600' : 'bg-slate-700 text-slate-400'}`}>{p}°T</button>
                    ))}
                  </div>
                  <button onClick={() => setIsEditingSettings(false)} className="w-full py-2 bg-slate-700 text-white text-[10px] font-black rounded uppercase">CHIUDI</button>
               </div>
            )}
          </div>

          {/* AWAY TEAM */}
          <div className="flex justify-between items-center w-full md:w-auto md:flex-col md:flex-1 md:order-3">
            <div className="flex flex-col items-center">
              <button onClick={() => manualScoreAdjustment('AWAY', 1)} className="p-1 text-red-400/50 hover:text-red-400 transition-colors"><ChevronUp size={24} /></button>
              <div className="text-4xl md:text-7xl font-black">{match.score.away}</div>
              <button onClick={() => manualScoreAdjustment('AWAY', -1)} className="p-1 text-red-400/50 hover:text-red-400 transition-colors"><ChevronDown size={24} /></button>
            </div>

            <div className="flex flex-col items-end md:items-center gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-2xl font-black uppercase tracking-tight text-red-400 truncate max-w-[120px] md:max-w-none">{match.awayTeamName}</h2>
                {match.awayLogo && <img src={match.awayLogo} alt="" className="w-8 h-8 md:w-12 md:h-12 object-contain bg-white/10 rounded-lg p-1" />}
              </div>
              <button onClick={() => handleStartTimeout('AWAY')} className="flex items-center gap-1 px-2 py-0.5 bg-red-600/20 border border-red-500/30 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600/40 transition-all"><Coffee size={10} className="md:w-3 md:h-3" /> {t.timeout}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Roster HOME */}
        <div className="lg:col-span-3 bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-slate-100 max-h-[400px] md:max-h-[600px] overflow-y-auto custom-scrollbar">
          <h3 className="font-black text-[9px] text-blue-600 mb-3 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div> {match.homeTeamName}
          </h3>
          {renderPersonGrid(match.homeRoster, match.homeStaff, 'HOME')}
        </div>

        {/* Central Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className={`bg-white p-4 md:p-6 rounded-2xl shadow-xl border-2 transition-all md:sticky md:top-[80px] z-30 ${selectedPerson ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100 opacity-90'}`}>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm md:text-base leading-none mb-1 truncate">
                    {selectedPerson ? (
                      selectedPerson.isStaff 
                        ? `${selectedPerson.person.lastName} ${selectedPerson.person.firstName}` 
                        : `[#${selectedPerson.person.number}] ${selectedPerson.person.lastName} ${selectedPerson.person.firstName}`
                    ) : 'Nessuna selezione'}
                  </h3>
                  {selectedPerson && (
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      {selectedPerson.isStaff ? selectedPerson.person.role : 'Atleta in campo'}
                    </p>
                  )}
                </div>
                {selectedPerson && (
                  <button onClick={() => setSelectedPerson(null)} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* STATS SUMMARY (SOLO SE QUALCUNO È SELEZIONATO) */}
              {selectedPerson && selectedStats && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-300">
                  {!selectedPerson.isStaff && (
                    <div className="flex items-center gap-1.5 bg-blue-600 text-white px-2 py-1.5 rounded-lg shadow-sm" title="Efficienza al tiro">
                      <TrendingUp size={12} className="text-white" />
                      <span className="text-xs font-black">{selectedStats.efficiency}%</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100" title="Gol segnati">
                    <Award size={12} className="text-blue-600" />
                    <span className="text-xs font-black text-blue-700">{selectedStats.goals}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100" title="Parate effettuate">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span className="text-xs font-black text-emerald-700">{selectedStats.saves}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1.5 rounded-lg border border-orange-100" title="Tiri fuori">
                    <Target size={12} className="text-orange-600" />
                    <span className="text-xs font-black text-orange-700">{selectedStats.misses}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200" title="Palle perse">
                    <Ban size={12} className="text-slate-600" />
                    <span className="text-xs font-black text-slate-700">{selectedStats.lostBalls}</span>
                  </div>
                  
                  {/* Sanzioni Disciplinari */}
                  {(selectedStats.twoMins > 0 || selectedStats.yellow > 0 || selectedStats.red > 0 || selectedStats.blue > 0) && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      {selectedStats.twoMins > 0 && (
                        <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-black text-[10px] border border-amber-200" title="2 Minuti ricevuti">
                          {selectedStats.twoMins}x 2'
                        </div>
                      )}
                      <div className="flex gap-1">
                        {selectedStats.yellow > 0 && <div className="w-3 h-4 bg-yellow-400 border border-slate-900 rounded-sm shadow-sm" title="Ammonizioni"></div>}
                        {selectedStats.red > 0 && <div className="w-3 h-4 bg-red-600 border border-slate-900 rounded-sm shadow-sm" title="Espulsioni"></div>}
                        {selectedStats.blue > 0 && <div className="w-3 h-4 bg-blue-700 border border-slate-900 rounded-sm shadow-sm" title="Cartellini Blu"></div>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 gap-2">
              <button disabled={!selectedPerson || selectedPerson.isStaff} onClick={() => addEvent(EventType.GOAL)} className="flex flex-col items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all disabled:opacity-20 active:scale-95">
                <Award size={20} /><span className="font-black mt-1 text-[9px] uppercase">{t.goal}</span>
              </button>
              <button disabled={!selectedPerson || selectedPerson.isStaff} onClick={() => addEvent(EventType.SAVE)} className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 transition-all disabled:opacity-20 active:scale-95">
                <ShieldCheck size={20} /><span className="font-black mt-1 text-[9px] uppercase">{t.save}</span>
              </button>
              <button disabled={!selectedPerson || selectedPerson.isStaff} onClick={() => addEvent(EventType.MISS)} className="flex flex-col items-center justify-center p-3 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 transition-all disabled:opacity-20 active:scale-95">
                <Target size={20} /><span className="font-black mt-1 text-[9px] uppercase">{t.miss}</span>
              </button>
              <button disabled={!selectedPerson || selectedPerson.isStaff} onClick={() => addEvent(EventType.LOST_BALL)} className="flex flex-col items-center justify-center p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-100 transition-all disabled:opacity-20 active:scale-95">
                <Ban size={20} /><span className="font-black mt-1 text-[9px] uppercase">{t.lostBall}</span>
              </button>
              <button disabled={!selectedPerson} onClick={() => addEvent(EventType.TWO_MINUTES)} className="flex flex-col items-center justify-center p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md transition-all disabled:opacity-20 active:scale-95">
                <AlertTriangle size={20} /><span className="font-black mt-1 text-[9px] uppercase">{t.twoMinutes}</span>
              </button>
              <button disabled={!selectedPerson} onClick={() => addEvent(EventType.YELLOW_CARD)} className="flex flex-col items-center justify-center p-3 bg-yellow-400 text-slate-900 rounded-xl transition-all disabled:opacity-20 active:scale-95">
                <div className="w-3 h-5 bg-yellow-400 border-2 border-slate-800 rounded-sm"></div><span className="font-black mt-1 text-[9px] uppercase">{t.yellowCard}</span>
              </button>
              <button disabled={!selectedPerson} onClick={() => addEvent(EventType.RED_CARD)} className="flex flex-col items-center justify-center p-3 bg-red-600 text-white rounded-xl transition-all disabled:opacity-20 active:scale-95">
                <div className="w-3 h-5 bg-red-600 border-2 border-white rounded-sm"></div><span className="font-black mt-1 text-[9px] uppercase">{t.redCard}</span>
              </button>
              <button disabled={!selectedPerson} onClick={() => addEvent(EventType.BLUE_CARD)} className="flex flex-col items-center justify-center p-3 bg-blue-800 text-white rounded-xl transition-all disabled:opacity-20 active:scale-95">
                <div className="w-3 h-5 bg-blue-600 border-2 border-white rounded-sm"></div><span className="font-black mt-1 text-[9px] uppercase">{t.blueCard}</span>
              </button>
            </div>
            
            <button onClick={onFinish} className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] active:scale-95">
              {t.finish}
            </button>
          </div>

          {/* Modal Modifica Evento */}
          {editingEvent && (
             <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase tracking-widest text-xs">Modifica Evento</h3>
                    <button onClick={() => setEditingEvent(null)} className="text-slate-400"><X size={20} /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tipo Azione</label>
                      <select 
                        className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm"
                        value={editingEvent.type}
                        onChange={e => setEditingEvent({...editingEvent, type: e.target.value as EventType})}
                      >
                        {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <button 
                      onClick={() => saveEditedEvent(editingEvent)}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px]"
                    >
                      Salva Modifiche
                    </button>
                  </div>
                </div>
             </div>
          )}

          {/* Cronaca Live Feed */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-[9px] flex items-center gap-2"><Clock size={12} /> Cronaca Live</h3>
              <span className="text-[9px] font-black text-slate-300 uppercase">{match.events.length} Azioni</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {[...match.events].reverse().map((event) => (
                <div key={event.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${event.team === 'HOME' ? 'bg-blue-50/30 border-blue-100' : 'bg-red-50/30 border-red-100'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-slate-500 font-bold text-[8px] shrink-0 w-8">{event.gameTime.split(' - ')[1]}</span>
                    <div className="shrink-0">{getEventIcon(event.type)}</div>
                    <div className="min-w-0 flex flex-col">
                      <span className={`text-[10px] font-black uppercase truncate ${event.team === 'HOME' ? 'text-blue-900' : 'text-red-900'}`}>{event.playerName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditEvent(event)} className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"><Pencil size={12} /></button>
                    <button onClick={() => deleteEvent(event.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Roster AWAY */}
        <div className="lg:col-span-3 bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-slate-100 max-h-[400px] md:max-h-[600px] overflow-y-auto custom-scrollbar">
          <h3 className="font-black text-[9px] text-red-600 mb-3 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> {match.awayTeamName}
          </h3>
          {renderPersonGrid(match.awayRoster, match.awayStaff, 'AWAY')}
        </div>
      </div>
    </div>
  );
};

export default MatchConsole;
