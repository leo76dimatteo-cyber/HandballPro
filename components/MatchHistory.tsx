
import React from 'react';
import { Match } from '../types';
import { storage } from '../services/storageService';
import { Calendar, Trash2, Eye, Lock, Share2, FileJson } from 'lucide-react';

interface MatchHistoryProps {
  matches: Match[];
  onView: (match: Match) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  canDelete?: boolean;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, onView, onDelete, onBack, canDelete = false }) => {
  const handleExport = () => {
    if (matches.length === 0) {
      alert("Nessun match in archivio da esportare.");
      return;
    }
    storage.exportData(matches, 'HPro_ArchivioMatch');
  };

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-8 px-2 md:px-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-12 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-md shrink-0">
              <Calendar className="text-white" size={20} />
            </div>
            Archivio
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Storico cronologico referti</p>
        </div>
        <div className="flex items-center justify-center gap-3">
           <button 
             onClick={handleExport}
             className="bg-white border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 px-5 py-3 rounded-xl font-black flex items-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest"
           >
             <Share2 size={16} /> Esporta Archivio
           </button>
           <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Totale</span>
              <span className="text-xl font-black text-slate-900">{matches.length}</span>
           </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
          <Calendar className="text-slate-100 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-black text-slate-800 mb-1">Archivio Vuoto</h3>
          <p className="text-slate-400 font-medium text-xs px-10">I referti salvati appariranno qui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {matches.map((match) => (
            <div 
              key={match.id}
              className="group bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all overflow-hidden flex flex-col md:flex-row items-stretch active:scale-[0.98]"
            >
              {/* Info Area */}
              <div className="bg-slate-50 md:w-36 p-4 md:p-6 flex flex-row md:flex-col items-center justify-between md:justify-center border-b md:border-b-0 md:border-r border-slate-100 gap-2 shrink-0">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{match.date}</span>
                <span className="text-[9px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-full uppercase tracking-tighter truncate max-w-[80px]">{match.category || 'B'}</span>
              </div>

              {/* Score Area */}
              <div className="flex-1 p-5 md:px-10 flex flex-col justify-center">
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex-1 text-right min-w-0">
                    <h4 className="text-sm md:text-lg font-black text-slate-800 uppercase tracking-tight truncate">{match.homeTeamName}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-4 bg-slate-900 text-white px-3 md:px-5 py-2 rounded-xl md:rounded-2xl shadow-lg shrink-0">
                    <span className="text-xl md:text-3xl font-black font-mono">{match.score.home}</span>
                    <span className="text-slate-600 font-black text-[10px]">VS</span>
                    <span className="text-xl md:text-3xl font-black font-mono">{match.score.away}</span>
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <h4 className="text-sm md:text-lg font-black text-slate-800 uppercase tracking-tight truncate">{match.awayTeamName}</h4>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-slate-50/50 flex items-center justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100">
                <button 
                  onClick={() => onView(match)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Eye size={14} /> Referto
                </button>
                {canDelete ? (
                  <button 
                    onClick={() => onDelete(match.id)}
                    className="p-3 text-slate-300 hover:text-red-500 bg-white border border-slate-100 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <div className="p-3 text-slate-200">
                    <Lock size={16} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchHistory;
