
import React, { useState } from 'react';
import { Player } from '../types';
import { UserPlus, Trash2, Download, Hash, Search } from 'lucide-react';

interface RosterSetupProps {
  teamName: string;
  roster: Player[];
  onUpdate: (roster: Player[]) => void;
  accentColor?: 'blue' | 'red';
  onImportRegistry?: () => void;
  hasRegistry?: boolean;
  registryPlayers?: Player[];
}

const RosterSetup: React.FC<RosterSetupProps> = ({ 
  teamName, 
  roster, 
  onUpdate, 
  accentColor = 'blue',
  onImportRegistry,
  hasRegistry = false,
  registryPlayers = []
}) => {
  const [newNumber, setNewNumber] = useState('');

  const isBlue = accentColor === 'blue';
  const isOpponent = accentColor === 'red';

  const addPlayer = () => {
    let finalNumber = newNumber.trim();

    if (isOpponent && !finalNumber) {
      let nextNum = 1;
      const existingNumbers = roster.map(p => parseInt(p.number, 10)).filter(n => !isNaN(n));
      while (existingNumbers.includes(nextNum)) {
        nextNum++;
      }
      finalNumber = nextNum.toString();
    }

    if (!finalNumber) return;

    if (!/^\d+$/.test(finalNumber)) {
      alert("Inserisci un numero valido.");
      return;
    }

    if (roster.find(p => p.number === finalNumber)) {
      alert("Numero già in uso.");
      return;
    }

    let firstName = "";
    let lastName = "";

    if (isBlue) {
      const registered = registryPlayers.find(rp => rp.number === finalNumber);
      if (registered) {
        firstName = registered.firstName;
        lastName = registered.lastName;
      } else {
        firstName = "Atleta";
        lastName = `#${finalNumber}`;
      }
    } else {
      firstName = "";
      lastName = "Avversario";
    }

    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      firstName,
      lastName,
      number: finalNumber
    };

    onUpdate([...roster, newPlayer]);
    setNewNumber('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addPlayer();
  };

  const removePlayer = (id: string) => {
    onUpdate(roster.filter(p => p.id !== id));
  };

  const borderColor = isBlue ? 'border-blue-100' : 'border-red-100';
  const ringColor = isBlue ? 'focus:ring-blue-500' : 'focus:ring-red-500';
  const btnColor = isBlue ? 'bg-blue-600 active:bg-blue-700' : 'bg-red-600 active:bg-red-700';
  const iconColor = isBlue ? 'text-blue-400' : 'text-red-400';

  return (
    <div className={`rounded-3xl shadow-sm border ${borderColor} bg-white overflow-hidden transition-all flex flex-col min-h-[400px]`}>
      <div className={`${isBlue ? 'bg-blue-600' : 'bg-red-600'} px-5 py-4 flex items-center justify-between`}>
        <h3 className="text-sm md:text-base font-black text-white flex items-center gap-2 uppercase tracking-tight truncate pr-2">
          {teamName}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {isBlue && hasRegistry && onImportRegistry && (
            <button 
              onClick={onImportRegistry}
              className="text-[8px] font-black bg-white/20 px-2 py-1 rounded-lg text-white flex items-center gap-1 border border-white/10"
            >
              <Download size={10} /> CARICA ROSA
            </button>
          )}
          <span className="text-[9px] font-black text-white bg-black/20 px-2 py-1 rounded-lg border border-white/10 uppercase">
            {roster.length}
          </span>
        </div>
      </div>
      
      <div className="p-4 md:p-5 flex-1 flex flex-col">
        {/* Entry Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${iconColor}`}>
                <Hash size={18} />
              </div>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={isBlue ? "N° Maglia" : "N° maglia"}
                className={`w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 ${ringColor} outline-none text-center transition-all text-xl font-black placeholder:font-normal placeholder:text-slate-300`}
                value={newNumber}
                onKeyDown={handleKeyDown}
                onChange={(e) => setNewNumber(e.target.value)}
              />
            </div>
            <button
              onClick={addPlayer}
              className={`w-14 h-14 ${btnColor} text-white flex items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 shrink-0`}
            >
              <UserPlus size={24} />
            </button>
          </div>
          {isBlue && hasRegistry && (
            <p className="text-[9px] font-black text-blue-400 mt-2 text-center uppercase tracking-widest flex items-center justify-center gap-1">
              <Search size={10} /> Recupero automatico dall'anagrafica
            </p>
          )}
        </div>

        {/* List */}
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
          {roster.length === 0 ? (
            <div className="text-center py-10 md:py-16 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Lista convocati vuota</p>
            </div>
          ) : (
            [...roster].reverse().map(player => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50 transition-all animate-in slide-in-from-left-2">
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`flex items-center justify-center w-10 h-10 ${isBlue ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'} rounded-xl font-black text-lg border ${isBlue ? 'border-blue-100' : 'border-red-100'} shrink-0`}>
                    {player.number}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-slate-800 uppercase tracking-tighter text-sm leading-tight truncate">
                      {player.lastName}
                    </span>
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest truncate">
                      {player.firstName || (isOpponent ? "Atleta Avversario" : "")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-slate-300 hover:text-red-500 p-2.5 rounded-xl transition-all shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RosterSetup;
