
import React, { useState, useEffect, useRef } from 'react';
import { Match, Player, EventType, MatchEvent } from '../types';
import { Play, Pause, RotateCcw, Award, AlertTriangle, XCircle, ShieldCheck, Pencil, Check, X, Settings2, Coffee, Plus, Minus, Zap, UserCog, Ban } from 'lucide-react';

interface MatchConsoleProps {
  match: Match;
  onUpdate: (updatedMatch: Match) => void;
  onFinish: () => void;
}

const MatchConsole: React.FC<MatchConsoleProps> = ({ match, onUpdate, onFinish }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{person: Player, team: 'HOME' | 'AWAY', isStaff: boolean} | null>(null);
  
  const [isTimeoutActive, setIsTimeoutActive] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);
  const [timeoutTeam, setTimeoutTeam] = useState<'HOME' | 'AWAY' | null>(null);
  const timeoutStartRef = useRef<number>(0);

  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [periodDurations, setPeriodDurations] = useState<{ [key: number]: number }>({
    1: 1800, 2: 1800, 3: 600, 4: 600
  });
  
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editMins, setEditMins] = useState('');
  const [editSecs, setEditSecs] = useState('');
  const [timeIsUp, setTimeIsUp] = useState(false);

  const targetSeconds = periodDurations[currentPeriod];

  useEffect(() => {
    let interval: any = null;
    if (isActive && !isTimeoutActive) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          if (next >= targetSeconds) {
            setIsActive(false);
            setTimeIsUp(true);
            return targetSeconds;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, isTimeoutActive, targetSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isTimeoutActive) {
      interval = setInterval(() => {
        setTimeoutSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimeoutActive]);

  useEffect(() => {
    if (timeIsUp) {
      const timer = setTimeout(() => setTimeIsUp(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [timeIsUp]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    setEditMins(mins.toString());
    setEditSecs(secs.toString().padStart(2, '0'));
    setIsEditingTime(true);
    setIsActive(false);
  };

  const adjustCurrentEditTime = (deltaSeconds: number) => {
    const currentMins = parseInt(editMins) || 0;
    const currentSecs = parseInt(editSecs) || 0;
    const currentTotal = (currentMins * 60) + currentSecs;
    const newVal = Math.max(0, Math.min(currentTotal + deltaSeconds, targetSeconds));
    setEditMins(Math.floor(newVal / 60).toString());
    setEditSecs((newVal % 60).toString().padStart(2, '0'));
  };

  const saveEditedTime = () => {
    const m = parseInt(editMins) || 0;
    const s = parseInt(editSecs) || 0;
    const total = (m * 60) + Math.min(s, 59);
    setSeconds(Math.min(total, targetSeconds));
    setIsEditingTime(false);
  };

  const handlePresetDuration = (mins: number) => {
    setPeriodDurations({ ...periodDurations, [currentPeriod]: mins * 60 });
    setSeconds(0);
    setIsActive(false);
  };

  const handleStartTimeout = (team: 'HOME' | 'AWAY') => {
    setIsActive(false);
    setTimeoutTeam(team);
    setTimeoutSeconds(60);
    setIsTimeoutActive(true);
    timeoutStartRef.current = Date.now();
  };

  const handleEndTimeout = () => {
    const durationUsed = Math.round((Date.now() - timeoutStartRef.current) / 1000);
    const newEvent: MatchEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type: EventType.TIMEOUT,
      playerId: 'SYSTEM',
      playerName: timeoutTeam === 'HOME' ? match.homeTeamName : match.awayTeamName,
      team: timeoutTeam!,
      timestamp: Date.now(),
      gameTime: `${currentPeriod}°T - ${formatTime(seconds)}`,
      duration: durationUsed
    };
    onUpdate({ ...match, events: [...match.events, newEvent] });
    setIsTimeoutActive(false);
    setTimeoutTeam(null);
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

    const newScore = { ...match.score };
    if (type === EventType.GOAL) {
      if (team === 'HOME') newScore.home += 1;
      else newScore.away += 1;
    }

    onUpdate({
      ...match,
      events: [...match.events, newEvent],
      score: newScore
    });

    setSelectedPerson(null);
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
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Area Tecnica / Staff</label>
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
    <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-1">
      {/* Timeout Overlay (Invariato) */}
      {isTimeoutActive && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-amber-500 font-black text-2xl uppercase tracking-[0.2em] animate-pulse">Time-out</h2>
              <h3 className="text-white text-4xl md:text-5xl font-black uppercase tracking-tight">
                {timeoutTeam === 'HOME' ? match.homeTeamName : match.awayTeamName}
              </h3>
            </div>
            <div className="relative inline-flex items-center justify-center">
              <div className={`text-9xl font-mono font-black tabular-nums transition-colors ${timeoutSeconds <= 10 ? 'text-red-500 scale-110' : 'text-blue-100'}`}>
                {timeoutSeconds}
              </div>
              <svg className="absolute w-[280px] h-[280px] -rotate-90">
                <circle cx="140" cy="140" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <circle cx="140" cy="140" r="130" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={816} strokeDashoffset={816 - (816 * timeoutSeconds) / 60} className={`${timeoutSeconds <= 10 ? 'text-red-500' : 'text-blue-600'} transition-all duration-1000 ease-linear`} strokeLinecap="round" />
              </svg>
            </div>
            <div className="pt-8">
              <button onClick={handleEndTimeout} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest">
                <Play size={24} fill="currentColor" /> Riprendi Gioco
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoreboard (Invariato) */}
      <div className={`rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg relative overflow-hidden transition-all duration-500 ${timeIsUp ? 'bg-red-600 scale-[0.98]' : 'bg-slate-900'} text-white`}>
        <div className={`absolute top-0 left-0 w-full h-1 ${timeIsUp ? 'bg-white animate-pulse' : 'bg-blue-500'}`}></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8 relative z-10">
          <div className="text-center flex-1 order-2 md:order-1 w-full md:w-auto flex flex-row md:flex-col items-center justify-around md:justify-center">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight text-blue-400 truncate max-w-[120px] md:max-w-none">{match.homeTeamName}</h2>
              <button onClick={() => handleStartTimeout('HOME')} className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/40 transition-all active:scale-95"><Coffee size={12} /> Time-out</button>
            </div>
            <div className="text-5xl md:text-7xl font-black">{match.score.home}</div>
          </div>

          <div className="text-center flex flex-col items-center order-1 md:order-2 px-4 py-3 md:py-4 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-inner w-full md:min-w-[340px] backdrop-blur-md">
            <div className="flex items-center justify-between w-full mb-1">
               <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">{currentPeriod}° T</span>
                  {!isEditingTime && <button onClick={handleEditTime} className="p-1 hover:text-white transition-colors"><Pencil size={12} /></button>}
               </div>
               <button onClick={() => setIsEditingSettings(!isEditingSettings)} className={`p-1 transition-colors ${isEditingSettings ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}><Settings2 size={16} /></button>
            </div>
            
            {isEditingSettings ? (
              <div className="w-full space-y-4 animate-in zoom-in-95 duration-200">
                <div className="grid grid-cols-4 gap-1">
                  {[1,2,3,4].map(p => (
                    <button key={p} onClick={() => { setCurrentPeriod(p); setSeconds(0); setIsActive(false); }} className={`py-1 rounded text-[9px] font-black border ${currentPeriod === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>{p}°T</button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[30, 25, 20, 15, 10, 5].map(mins => (
                    <button key={mins} onClick={() => handlePresetDuration(mins)} className={`py-1.5 rounded-lg border text-[10px] font-black transition-all active:scale-95 ${periodDurations[currentPeriod] === mins * 60 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}>{mins}'</button>
                  ))}
                </div>
                <button onClick={() => setIsEditingSettings(false)} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-black rounded uppercase tracking-widest transition-colors border border-slate-600">CHIUDI</button>
              </div>
            ) : isEditingTime ? (
              <div className="flex flex-col items-center gap-3 py-1 animate-in slide-in-from-top-1 w-full">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => adjustCurrentEditTime(60)} className="p-1 hover:text-blue-400 transition-colors"><Plus size={14}/></button>
                    <input type="number" className="w-14 bg-slate-700 border-none rounded-lg text-2xl font-mono font-bold text-center text-blue-100 p-1" value={editMins} onChange={(e) => setEditMins(e.target.value)} />
                    <button onClick={() => adjustCurrentEditTime(-60)} className="p-1 hover:text-blue-400 transition-colors"><Minus size={14}/></button>
                  </div>
                  <span className="text-xl font-bold">:</span>
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => adjustCurrentEditTime(1)} className="p-1 hover:text-blue-400 transition-colors"><Plus size={14}/></button>
                    <input type="number" className="w-14 bg-slate-700 border-none rounded-lg text-2xl font-mono font-bold text-center text-blue-100 p-1" value={editSecs} onChange={(e) => setEditSecs(e.target.value)} />
                    <button onClick={() => adjustCurrentEditTime(-1)} className="p-1 hover:text-blue-400 transition-colors"><Minus size={14}/></button>
                  </div>
                </div>
                <div className="flex gap-2 w-full">
                  <button onClick={saveEditedTime} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"><Check size={14} /> Salva</button>
                  <button onClick={() => setIsEditingTime(false)} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"><X size={14} /> Esci</button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={handleEditTime} className={`text-5xl md:text-6xl font-mono font-black tracking-tighter transition-colors hover:text-blue-400 cursor-pointer ${timeIsUp ? 'text-white' : 'text-blue-100'}`}>{formatTime(seconds)}</button>
                <div className="flex items-center gap-2 md:gap-4 mt-3 md:mt-4 w-full justify-center">
                  <button onClick={() => { setIsActive(!isActive); setTimeIsUp(false); }} className={`flex items-center justify-center gap-2 flex-1 py-3 md:py-3.5 rounded-xl font-black transition-all shadow-lg text-[11px] md:text-sm tracking-widest ${isActive ? 'bg-red-500 shadow-red-500/20 active:scale-95' : 'bg-emerald-500 shadow-emerald-500/20 active:scale-105'}`}>{isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}{isActive ? 'STOP' : 'START'}</button>
                  <button onClick={() => { if(confirm('Azzerare?')) setSeconds(0); }} className="p-3 text-slate-400 hover:text-white bg-slate-700/50 rounded-xl transition-all active:rotate-180"><RotateCcw size={18} /></button>
                </div>
              </>
            )}
          </div>

          <div className="text-center flex-1 order-3 w-full md:w-auto flex flex-row md:flex-col items-center justify-around md:justify-center">
             <div className="text-5xl md:text-7xl font-black">{match.score.away}</div>
             <div className="flex flex-col items-center gap-2">
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight text-red-400 truncate max-w-[120px] md:max-w-none">{match.awayTeamName}</h2>
              <button onClick={() => handleStartTimeout('AWAY')} className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600/40 transition-all active:scale-95"><Coffee size={12} /> Time-out</button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto max-h-[500px] custom-scrollbar">
          <h3 className="font-black text-[10px] text-blue-600 mb-3 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div> {match.homeTeamName}
          </h3>
          {renderPersonGrid(match.homeRoster, match.homeStaff, 'HOME')}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className={`bg-white p-5 rounded-2xl shadow-lg border-2 transition-all sticky top-[80px] z-20 ${selectedPerson ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100 opacity-80'}`}>
            <h3 className="text-center font-black text-slate-500 mb-4 uppercase tracking-widest text-[10px] truncate">
              {selectedPerson ? `${selectedPerson.person.lastName} ${selectedPerson.isStaff ? `(${selectedPerson.person.role})` : ''}` : 'Seleziona Persona'}
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button disabled={!selectedPerson || selectedPerson.isStaff} onClick={() => addEvent(EventType.GOAL)} className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md transition-all disabled:opacity-20 active:scale-95">
                <Award size={24} /><span className="font-black mt-1 text-[10px]">GOL</span>
              </button>
              <button disabled={!selectedPerson} onClick={() => addEvent(EventType.TWO_MINUTES)} className="flex flex-col items-center justify-center p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-md transition-all disabled:opacity-20 active:scale-95">
                <AlertTriangle size={24} /><span className="font-black mt-1 text-[10px]">2 MINUTI</span>
              </button>
              <button disabled={!selectedPerson} onClick={() => addEvent(EventType.YELLOW_CARD)} className="flex flex-col items-center justify-center p-3 bg-yellow-400 text-slate-900 rounded-2xl shadow-sm transition-all disabled:opacity-20 active:scale-95">
                <div className="w-4 h-6 bg-yellow-400 border-2 border-slate-800 rounded-sm"></div><span className="font-black mt-1 text-[10px]">GIALLO</span>
              </button>
              <button disabled={!selectedPerson} onClick={() => addEvent(EventType.RED_CARD)} className="flex flex-col items-center justify-center p-3 bg-red-600 text-white rounded-2xl shadow-sm transition-all disabled:opacity-20 active:scale-95">
                <div className="w-4 h-6 bg-red-600 border-2 border-white rounded-sm"></div><span className="font-black mt-1 text-[10px]">ROSSO</span>
              </button>
              <button disabled={!selectedPerson} onClick={() => addEvent(EventType.BLUE_CARD)} className="flex flex-col items-center justify-center p-3 bg-blue-800 text-white rounded-2xl shadow-sm transition-all disabled:opacity-20 active:scale-95">
                <div className="w-4 h-6 bg-blue-600 border-2 border-white rounded-sm"></div><span className="font-black mt-1 text-[10px]">BLU</span>
              </button>
              <button disabled={!selectedPerson || selectedPerson.isStaff} onClick={() => addEvent(EventType.SAVE)} className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-700 rounded-2xl transition-all disabled:opacity-20 active:scale-95 border border-emerald-100">
                <ShieldCheck size={20} /><span className="font-black mt-1 text-[10px]">PARATA</span>
              </button>
            </div>
            {selectedPerson?.isStaff && (
              <p className="mt-3 text-[8px] font-black text-amber-600 bg-amber-50 p-2 rounded text-center uppercase">Lo staff non può segnare gol o parate</p>
            )}
          </div>

          <button onClick={onFinish} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95">
            TERMINA E GENERA REFERTO AI
          </button>
        </div>

        <div className="lg:col-span-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto max-h-[500px] custom-scrollbar">
          <h3 className="font-black text-[10px] text-red-600 mb-3 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> {match.awayTeamName}
          </h3>
          {renderPersonGrid(match.awayRoster, match.awayStaff, 'AWAY')}
        </div>
      </div>

      {/* Log (Invariato) */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-400 mb-4 uppercase tracking-widest text-[10px]">Eventi Recenti</h3>
        <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
          {[...match.events].reverse().slice(0, 15).map((event) => (
            <div key={event.id} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-xl border border-slate-100/50">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded text-[9px]">{event.gameTime.split(' - ')[1]}</span>
                <span className={`text-[11px] font-black truncate max-w-[120px] ${event.team === 'HOME' ? 'text-blue-700' : 'text-red-700'}`}>
                  {event.playerName}
                </span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${event.type === EventType.BLUE_CARD ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                  {event.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchConsole;
