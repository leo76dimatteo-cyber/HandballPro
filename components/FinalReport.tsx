
import React, { useState, useEffect } from 'react';
import { Match, EventType } from '../types';
import { generateMatchReport } from '../services/geminiService';
import { FileText, Download, Share2, Sparkles, RefreshCw, Trophy, FileDown } from 'lucide-react';

interface FinalReportProps {
  match: Match;
  onClose: () => void;
}

const FinalReport: React.FC<FinalReportProps> = ({ match, onClose }) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const report = await generateMatchReport(match);
      setAiReport(report);
      setLoading(false);
    };
    fetchReport();
  }, [match]);

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

  const stats = {
    homeGoals: match.score.home,
    awayGoals: match.score.away,
    homeCards: match.events.filter(e => e.team === 'HOME' && [EventType.YELLOW_CARD, EventType.RED_CARD, EventType.TWO_MINUTES].includes(e.type)).length,
    awayCards: match.events.filter(e => e.team === 'AWAY' && [EventType.YELLOW_CARD, EventType.RED_CARD, EventType.TWO_MINUTES].includes(e.type)).length,
    homeSaves: match.events.filter(e => e.team === 'HOME' && e.type === EventType.SAVE).length,
    awaySaves: match.events.filter(e => e.team === 'AWAY' && e.type === EventType.SAVE).length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="text-center px-4">
        <div className="inline-flex items-center justify-center p-3 md:p-4 bg-blue-100 text-blue-700 rounded-full mb-3 md:mb-4">
          <Trophy size={32} className="md:w-12 md:h-12" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">PARTITA CONCLUSA</h1>
        <div className="flex flex-col md:flex-row items-center justify-center gap-2">
           <p className="text-slate-500 font-medium text-sm">{match.date}</p>
           <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{match.category || 'Serie B'}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200 overflow-hidden mx-2">
        {/* Mobile-Friendly Scoreboard Header */}
        <div className="bg-slate-900 p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center text-center gap-6">
            <div className="flex-1 w-full">
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-widest text-blue-400 truncate">{match.homeTeamName}</h2>
              <div className="text-5xl md:text-6xl font-black mt-1">{match.score.home}</div>
            </div>
            <div className="px-4 py-1 bg-white/10 rounded-full md:px-10 text-slate-500 font-black text-xl md:text-4xl">VS</div>
            <div className="flex-1 w-full">
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-widest text-red-400 truncate">{match.awayTeamName}</h2>
              <div className="text-5xl md:text-6xl font-black mt-1">{match.score.away}</div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b pb-2 uppercase tracking-tighter">
              <FileText size={18} className="text-blue-600" />
              Statistiche
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Sanzioni</span>
                <div className="flex items-center gap-4 font-black text-lg">
                  <span className="text-blue-600">{stats.homeCards}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-red-600">{stats.awayCards}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Parate</span>
                <div className="flex items-center gap-4 font-black text-lg">
                  <span className="text-blue-600">{stats.homeSaves}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-red-600">{stats.awaySaves}</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="font-black text-slate-400 mb-4 text-[10px] uppercase tracking-widest">Eventi Principali</h4>
              <div className="space-y-2">
                {match.events.filter(e => [EventType.GOAL, EventType.RED_CARD, EventType.TWO_MINUTES].includes(e.type)).slice(-6).map(e => (
                  <div key={e.id} className="text-[11px] p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                    <span className="min-w-0 truncate pr-2">
                      <span className="font-mono font-bold text-blue-600 mr-2">{e.gameTime.split(' - ')[1]}</span> 
                      <span className="font-black text-slate-700 uppercase">{e.playerName.split(' ')[0]}</span>
                    </span>
                    <span className="font-black text-[9px] text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-200 uppercase whitespace-nowrap">{e.type.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-5 md:p-6 rounded-2xl border border-blue-100 relative">
            <div className="absolute top-4 right-4 text-blue-300">
              <input type="hidden" /> {/* Placeholder for layout consistency */}
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-black text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-tighter">
              Referto AI
            </h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <RefreshCw size={28} className="text-blue-400 animate-spin" />
                <p className="text-blue-600 font-black text-xs uppercase tracking-widest">Gemini sta scrivendo...</p>
              </div>
            ) : (
              <div className="prose prose-sm text-slate-700 whitespace-pre-line leading-relaxed h-[300px] md:h-[400px] overflow-y-auto pr-2 custom-scrollbar text-sm font-medium">
                {aiReport}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => window.print()}
            className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-4 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <Download size={16} /> Scarica PDF
          </button>
          <button 
            onClick={downloadTxt}
            disabled={loading || !aiReport}
            className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-4 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            <FileDown size={16} /> Scarica TXT
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100">
            <Share2 size={16} /> Condividi
          </button>
          <button 
            onClick={onClose}
            className="bg-slate-900 text-white px-4 py-3 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalReport;
