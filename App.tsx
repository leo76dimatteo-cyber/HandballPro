
import React, { useState, useEffect } from 'react';
import { Match, Player, TeamProfile, UserRole, ScheduledMatch, UserProfile } from './types';
import { storage } from './services/storageService';
import RosterSetup from './components/RosterSetup';
import MatchConsole from './components/MatchConsole';
import FinalReport from './components/FinalReport';
import TeamRegistry from './components/TeamRegistry';
import MatchHistory from './components/MatchHistory';
import CalendarManager from './components/CalendarManager';
import Settings from './components/Settings';
import { Trophy, Plus, ClipboardList, ArrowLeft, Settings2, UserCircle, Home, LayoutGrid, Database, Activity, X, History as HistoryIcon, Layers, UserCheck, ShieldAlert, Eye, Calendar as CalendarIcon, UserCog, UserPlus, Check, Star, Settings as SettingsIcon, MapPin, Info } from 'lucide-react';

type AppState = 'HOME' | 'SETUP' | 'LIVE' | 'REPORT' | 'REGISTRY' | 'HISTORY' | 'CALENDAR' | 'SETTINGS';

const SUGGESTED_CATEGORIES = [
  "Serie A Gold", "Serie A Silver", "Serie A1 F", "Serie A2", "Serie B", 
  "Under 20", "Under 17", "Under 15", "Under 13", "Amichevole"
];

const STAFF_ROLES = [
  "1° Allenatore", 
  "2° Allenatore", 
  "Ufficiale A", 
  "Ufficiale B", 
  "Ufficiale C", 
  "Ufficiale D", 
  "Medico", 
  "Fisioterapista"
];

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('HOME');
  
  // States from Storage Service
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => storage.getUser());
  const [pastMatches, setPastMatches] = useState<Match[]>(() => storage.getMatches());
  const [calendarMatches, setCalendarMatches] = useState<ScheduledMatch[]>(() => storage.getCalendar());
  const [myTeamProfile, setMyTeamProfile] = useState<TeamProfile>(() => storage.getRegistry());

  // Local Temp States
  const [match, setMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState(myTeamProfile.teamName || 'CASA');
  const [awayTeam, setAwayTeam] = useState('TRASFERTA');
  const [matchCategory, setMatchCategory] = useState(myTeamProfile.category || 'Serie B');
  const [homeRoster, setHomeRoster] = useState<Player[]>([]);
  const [awayRoster, setAwayRoster] = useState<Player[]>([]);
  const [homeStaff, setHomeStaff] = useState<Player[]>([]);
  const [awayStaff, setAwayStaff] = useState<Player[]>([]);

  // Staff Form state
  const [showStaffForm, setShowStaffForm] = useState<'HOME' | 'AWAY' | null>(null);
  const [tempStaff, setTempStaff] = useState({ firstName: '', lastName: '', role: '1° Allenatore' });

  // Sync Registry when it changes
  useEffect(() => {
    storage.setRegistry(myTeamProfile);
    if (!homeTeam || homeTeam === 'CASA') setHomeTeam(myTeamProfile.teamName || 'CASA');
    if (!matchCategory) setMatchCategory(myTeamProfile.category || 'Serie B');
  }, [myTeamProfile]);

  // Sync Calendar
  useEffect(() => {
    storage.setCalendar(calendarMatches);
  }, [calendarMatches]);

  const startMatch = () => {
    if (currentUser.role === UserRole.GUEST) return;
    
    // Validation
    if (!homeTeam.trim() || homeTeam === 'CASA' || !awayTeam.trim() || awayTeam === 'TRASFERTA') {
      alert("Inserisci i nomi corretti per le squadre.");
      return;
    }

    if (homeRoster.length === 0 || awayRoster.length === 0) {
      alert("Aggiungi almeno un giocatore per squadra.");
      return;
    }

    const newMatch: Match = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
      category: matchCategory,
      homeTeamName: homeTeam,
      awayTeamName: awayTeam,
      homeRoster,
      awayRoster,
      homeStaff,
      awayStaff,
      events: [],
      isFinished: false,
      score: { home: 0, away: 0 }
    };
    setMatch(newMatch);
    setView('LIVE');
  };

  const finalizeMatch = () => {
    if (match) {
      const finishedMatch = { ...match, isFinished: true };
      storage.saveMatch(finishedMatch);
      setPastMatches(storage.getMatches());
      setMatch(finishedMatch);
      setView('REPORT');
    }
  };

  const navigateTo = (newView: AppState) => {
    if ((newView === 'REGISTRY' || newView === 'CALENDAR') && currentUser.role === UserRole.GUEST) {
      alert("Permesso negato. Modalità Ospite."); return;
    }
    setView(newView);
    window.scrollTo(0, 0);
  };

  const handleAddStaff = (team: 'HOME' | 'AWAY') => {
    if (!tempStaff.lastName.trim()) {
      alert("Inserire almeno il cognome");
      return;
    }
    const newMember: Player = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: tempStaff.firstName.trim(),
      lastName: tempStaff.lastName.trim(),
      number: "S",
      role: tempStaff.role
    };
    if (team === 'HOME') setHomeStaff([...homeStaff, newMember]);
    else setAwayStaff([...awayStaff, newMember]);
    setTempStaff({ firstName: '', lastName: '', role: '1° Allenatore' });
    setShowStaffForm(null);
  };

  const handleImportRegistry = () => {
    setHomeRoster([...myTeamProfile.players]);
    const importedStaff: Player[] = [];
    if (myTeamProfile.coachName) {
      importedStaff.push({ id: 'c1', firstName: '', lastName: myTeamProfile.coachName, number: 'S', role: '1° Allenatore' });
    }
    if (myTeamProfile.assistantCoachName) {
      importedStaff.push({ id: 'c2', firstName: '', lastName: myTeamProfile.assistantCoachName, number: 'S', role: '2° Allenatore' });
    }
    setHomeStaff(importedStaff);
  };

  const renderStaffSection = (staff: Player[], team: 'HOME' | 'AWAY', color: string) => {
    const isBlue = color === 'blue';
    const isAddingThisTeam = showStaffForm === team;
    return (
      <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200 mt-4 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <UserCog size={14} className={isBlue ? 'text-blue-500' : 'text-red-500'} /> Area Tecnica
          </label>
          <button 
            onClick={() => isAddingThisTeam ? setShowStaffForm(null) : setShowStaffForm(team)} 
            className={`text-[8px] font-black px-3 py-1.5 rounded-lg border text-white transition-all active:scale-95 flex items-center gap-1.5 ${isAddingThisTeam ? 'bg-slate-500 border-slate-400' : (isBlue ? 'bg-blue-600 border-blue-500' : 'bg-red-600 border-red-500')}`}
          >
            {isAddingThisTeam ? <X size={10} /> : <Plus size={10} />}
            {isAddingThisTeam ? 'ANNULLA' : 'AGGIUNGI'}
          </button>
        </div>
        {isAddingThisTeam && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-2">
                <input type="text" placeholder="Nome" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" value={tempStaff.firstName} onChange={(e) => setTempStaff({...tempStaff, firstName: e.target.value})} />
                <input type="text" placeholder="Cognome" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" value={tempStaff.lastName} onChange={(e) => setTempStaff({...tempStaff, lastName: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <select className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" value={tempStaff.role} onChange={(e) => setTempStaff({...tempStaff, role: e.target.value})}>
                  {STAFF_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <button onClick={() => handleAddStaff(team)} className="px-4 bg-emerald-500 text-white rounded-lg active:scale-95"><Check size={18} strokeWidth={3} /></button>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {staff.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-xl bg-white/50"><p className="text-[9px] text-slate-300 font-black uppercase italic">Nessun dirigente</p></div>
          ) : (
            staff.map(s => {
              const isCoach = s.role?.includes("Allenatore");
              return (
                <div key={s.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${isBlue ? (isCoach ? 'bg-blue-600 text-white border-blue-700' : 'bg-blue-50 text-blue-600 border-blue-100') : (isCoach ? 'bg-red-600 text-white border-red-700' : 'bg-red-50 text-red-600 border-red-100')}`}>
                      {isCoach ? <Star size={14} fill="currentColor" /> : <UserCircle size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-800 uppercase truncate leading-none mb-1">{s.firstName} {s.lastName}</p>
                      <p className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded inline-block ${isCoach ? (isBlue ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700') : (isBlue ? 'bg-blue-50 text-blue-400' : 'bg-red-50 text-red-400')}`}>{s.role}</p>
                    </div>
                  </div>
                  <button onClick={() => team === 'HOME' ? setHomeStaff(homeStaff.filter(x => x.id !== s.id)) : setAwayStaff(awayStaff.filter(x => x.id !== s.id))} className="text-slate-300 hover:text-red-500 p-2"><X size={14} /></button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-600 p-5 rounded-[2.5rem] shadow-2xl shadow-blue-200 rotate-6 transition-transform hover:rotate-0">
          <Trophy size={64} className="text-white" />
        </div>
      </div>
      <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4">Handball<span className="text-blue-600">Pro</span></h1>
      <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed mb-12">La piattaforma definitiva per la gestione tecnica e i referti ufficiali.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <button onClick={() => navigateTo('SETUP')} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 hover:border-blue-500 transition-all text-left group">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform"><Plus size={24} /></div>
          <h3 className="text-lg font-black text-slate-900">Nuova Partita</h3>
          <p className="text-slate-500 text-xs font-medium">Gestione live e sanzioni panchina.</p>
        </button>
        <button onClick={() => navigateTo('CALENDAR')} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 hover:border-blue-400 transition-all text-left group">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform"><CalendarIcon size={24} /></div>
          <h3 className="text-lg font-black text-slate-900">Calendario</h3>
          <p className="text-slate-500 text-xs font-medium">Pianifica i turni di campionato.</p>
        </button>
        <button onClick={() => navigateTo('HISTORY')} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 hover:border-emerald-500 transition-all text-left group">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform"><HistoryIcon size={24} /></div>
          <h3 className="text-lg font-black text-slate-900">Archivio</h3>
          <p className="text-slate-500 text-xs font-medium">Referti e statistiche salvate.</p>
        </button>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="max-w-7xl mx-auto py-6 md:py-12 px-4 md:px-6 animate-in fade-in">
      {/* Upper Navigation / Back */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">Configurazione Match</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Rosa e Staff Tecnico</p>
        </div>
        <button onClick={() => navigateTo('HOME')} className="flex items-center gap-2 px-6 py-3 text-slate-400 font-black hover:text-slate-900 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-widest text-[10px] transition-all active:scale-95">
          <ArrowLeft size={16} /> Indietro
        </button>
      </div>

      {/* Manual Team Info Input Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-10 transition-all">
        <div className="flex items-center gap-2 mb-6">
          <Info size={18} className="text-blue-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Informazioni Gara</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category Selector with Manual Entry */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <Layers size={12} /> Categoria
            </label>
            <input 
              list="setup-categories"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:font-normal placeholder:text-slate-300"
              value={matchCategory}
              onChange={e => setMatchCategory(e.target.value)}
              placeholder="Inserisci o seleziona categoria"
            />
            <datalist id="setup-categories">
              {SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Home Team Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <MapPin size={12} /> Squadra Casa
            </label>
            <input 
              type="text"
              className="w-full px-5 py-4 bg-slate-50 border border-blue-100 rounded-2xl font-black text-slate-900 uppercase tracking-tight focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
              value={homeTeam === 'CASA' ? '' : homeTeam}
              onChange={e => setHomeTeam(e.target.value.toUpperCase())}
              placeholder="ES: HC MILANO"
            />
          </div>

          {/* Away Team Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <MapPin size={12} /> Squadra Trasferta
            </label>
            <input 
              type="text"
              className="w-full px-5 py-4 bg-slate-50 border border-red-100 rounded-2xl font-black text-slate-900 uppercase tracking-tight focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
              value={awayTeam === 'TRASFERTA' ? '' : awayTeam}
              onChange={e => setAwayTeam(e.target.value.toUpperCase())}
              placeholder="ES: AVVERSARI"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Home Team Section */}
        <div className="flex flex-col h-full">
          <RosterSetup 
            teamName={homeTeam || 'CASA'} 
            roster={homeRoster} 
            onUpdate={setHomeRoster} 
            accentColor="blue" 
            hasRegistry={myTeamProfile.players.length > 0} 
            onImportRegistry={handleImportRegistry} 
            registryPlayers={myTeamProfile.players}
          />
          {renderStaffSection(homeStaff, 'HOME', 'blue')}
        </div>

        {/* Away Team Section */}
        <div className="flex flex-col h-full">
          <RosterSetup 
            teamName={awayTeam || 'TRASFERTA'} 
            roster={awayRoster} 
            onUpdate={setAwayRoster} 
            accentColor="red" 
          />
          {renderStaffSection(awayStaff, 'AWAY', 'red')}
        </div>
      </div>

      <div className="flex justify-center pb-20 md:pb-0">
        <button onClick={startMatch} className="group relative bg-slate-900 text-white px-20 py-8 rounded-[3rem] font-black text-2xl md:text-3xl shadow-xl transition-all active:scale-95 flex items-center gap-8 overflow-hidden hover:bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="relative z-10 uppercase tracking-tight">Fischio d'Inizio</span>
          <Trophy size={40} className="text-blue-400 relative z-10 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-12">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('HOME')}>
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg group-hover:rotate-12 transition-all"><Trophy size={22} className="text-white" /></div>
          <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900">Handball<span className="text-blue-600">Pro</span></span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden lg:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black uppercase text-slate-400 leading-none">{currentUser.role}</span>
            <span className="text-[11px] font-black text-slate-900">{currentUser.lastName} {currentUser.firstName[0]}.</span>
          </div>
          <button onClick={() => navigateTo('HOME')} className={`p-3 rounded-xl transition-all ${view === 'HOME' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`} title="Home"><Home size={20} /></button>
          <button onClick={() => navigateTo('HISTORY')} className={`p-3 rounded-xl transition-all ${view === 'HISTORY' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`} title="Archivio"><HistoryIcon size={20} /></button>
          <button onClick={() => navigateTo('SETTINGS')} className={`p-3 rounded-xl transition-all ${view === 'SETTINGS' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`} title="Impostazioni"><SettingsIcon size={20} /></button>
        </div>
      </nav>

      <main className="container mx-auto">
        {view === 'HOME' && renderHome()}
        {view === 'SETTINGS' && <Settings user={currentUser} onUpdateUser={setCurrentUser} onBack={() => setView('HOME')} />}
        {view === 'REGISTRY' && <div className="p-4"><TeamRegistry profile={myTeamProfile} onSave={setMyTeamProfile} isAdmin={currentUser.role === UserRole.ADMIN} /></div>}
        {view === 'HISTORY' && <div className="p-4"><MatchHistory matches={pastMatches} onView={(m) => {setMatch(m); setView('REPORT');}} onDelete={(id) => { storage.deleteMatch(id); setPastMatches(storage.getMatches()); }} onBack={() => setView('HOME')} canDelete={currentUser.role === UserRole.ADMIN} /></div>}
        {view === 'SETUP' && renderSetup()}
        {view === 'LIVE' && match && <div className="p-4"><MatchConsole match={match} onUpdate={setMatch} onFinish={finalizeMatch} /></div>}
        {view === 'REPORT' && match && <div className="p-4"><FinalReport match={match} onClose={() => setView('HOME')} /></div>}
        {view === 'CALENDAR' && <div className="p-4"><CalendarManager matches={calendarMatches} onAdd={(m) => setCalendarMatches([...calendarMatches, m])} onDelete={(id) => setCalendarMatches(calendarMatches.filter(x => x.id !== id))} onStart={(sm) => { setHomeTeam(sm.homeTeam); setAwayTeam(sm.awayTeam); setMatchCategory(sm.category); setView('SETUP'); }} onBack={() => setView('HOME')} canEdit={currentUser.role === UserRole.ADMIN} suggestedCategories={SUGGESTED_CATEGORIES} /></div>}
      </main>
    </div>
  );
};

export default App;
