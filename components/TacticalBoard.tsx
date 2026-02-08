
import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Download, Undo2, Users, MousePointer2, Circle, Save, X, Share2, Info, Maximize2, Minimize2, Layout } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Marker {
  id: string;
  x: number;
  y: number;
  label: string;
  color: 'blue' | 'red' | 'yellow';
}

interface TacticalBoardProps {
  t?: any;
}

// Fixed TypeScript inference issue by casting default empty object to any
const TacticalBoard: React.FC<TacticalBoardProps> = ({ t = {} as any }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'full' | 'half'>('full');
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'marker'>('pencil');
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [markerColor, setMarkerColor] = useState<'blue' | 'red' | 'yellow'>('blue');
  const [nextMarkerNum, setNextMarkerNum] = useState(1);

  // Inizializzazione e Ridimensionamento Canvas
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = viewMode === 'full' ? width * 0.5 : width * 0.8;
        drawCourt();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [viewMode]);

  const drawCourt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#1e293b'; 
    ctx.fillRect(0, 0, w, h);

    if (viewMode === 'full') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w / 2, h);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w / 2, 0, w / 2, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.beginPath();
      ctx.moveTo(w / 2, 10);
      ctx.lineTo(w / 2, h - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, h * 0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      drawSide(true, ctx, w, h);
      drawSide(false, ctx, w, h);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, h - 10);
      ctx.lineTo(10, 10);
      ctx.lineTo(w - 10, 10);
      ctx.lineTo(w - 10, h - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, h - 10);
      ctx.lineTo(w - 10, h - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h - 10, w * 0.12, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h - 10, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      drawSideHalf(ctx, w, h);
    }
  };

  const drawSide = (isLeft: boolean, ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const startX = isLeft ? 10 : w - 10;
    const dir = isLeft ? 1 : -1;
    ctx.beginPath();
    ctx.arc(startX, h / 2, h * 0.3, -Math.PI / 2, Math.PI / 2, !isLeft);
    ctx.stroke();
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(startX, h / 2, h * 0.45, -Math.PI / 2, Math.PI / 2, !isLeft);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    const penaltyX = startX + (dir * h * 0.35);
    ctx.moveTo(penaltyX, h / 2 - 10);
    ctx.lineTo(penaltyX, h / 2 + 10);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(isLeft ? 5 : w - 15, h / 2 - (h * 0.15) / 2, 10, h * 0.15);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
  };

  const drawSideHalf = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.beginPath();
    ctx.arc(w / 2, 10, h * 0.4, 0, Math.PI);
    ctx.stroke();
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(w / 2, 10, h * 0.6, 0, Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    const penaltyY = 10 + (h * 0.47);
    ctx.moveTo(w / 2 - 15, penaltyY);
    ctx.lineTo(w / 2 + 15, penaltyY);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(w / 2 - (w * 0.15) / 2, 5, w * 0.15, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
  };

  const saveToHistory = () => {
    if (canvasRef.current) {
      setHistory(prev => [...prev, canvasRef.current!.toDataURL()]);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'marker') {
      addMarker(e);
      return;
    }
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (tool === 'eraser') {
        if (viewMode === 'full') {
          ctx.strokeStyle = pos.x < canvasRef.current!.width / 2 ? '#1e293b' : '#0f172a';
        } else {
          ctx.strokeStyle = '#0f172a';
        }
      } else {
        ctx.strokeStyle = color;
      }
      ctx.lineWidth = tool === 'eraser' ? 30 : 3;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      if (tool === 'eraser') {
        if (viewMode === 'full') {
          ctx.strokeStyle = pos.x < canvasRef.current!.width / 2 ? '#1e293b' : '#0f172a';
        } else {
          ctx.strokeStyle = '#0f172a';
        }
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const getPos = (e: any): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const addMarker = (e: any) => {
    const pos = getPos(e);
    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      x: pos.x,
      y: pos.y,
      label: nextMarkerNum.toString(),
      color: markerColor
    };
    setMarkers([...markers, newMarker]);
    setNextMarkerNum(prev => prev + 1);
  };

  const removeMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
  };

  const clearBoard = () => {
    if (confirm("Clear tactical board?")) {
      drawCourt();
      setMarkers([]);
      setHistory([]);
      setNextMarkerNum(1);
    }
  };

  const downloadBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;
    tCtx.drawImage(canvas, 0, 0);
    markers.forEach(m => {
      tCtx.beginPath();
      tCtx.arc(m.x, m.y, 16, 0, Math.PI * 2);
      tCtx.fillStyle = m.color === 'blue' ? '#3b82f6' : m.color === 'red' ? '#ef4444' : '#f59e0b';
      tCtx.fill();
      tCtx.strokeStyle = '#ffffff';
      tCtx.lineWidth = 2;
      tCtx.stroke();
      tCtx.fillStyle = '#ffffff';
      tCtx.font = 'bold 15px Inter';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      tCtx.fillText(m.label, m.x, m.y);
    });
    const link = document.createElement('a');
    link.download = `Tactical_Board_${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="bg-slate-900 p-3 md:p-4 rounded-3xl border border-slate-700 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl">
           <button 
             onClick={() => setViewMode('full')}
             className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'full' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
           >
             <Maximize2 size={16} /> {t.fullTeam}
           </button>
           <button 
             onClick={() => setViewMode('half')}
             className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'half' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
           >
             <Minimize2 size={16} /> {t.halfTeam}
           </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-2xl">
          <button onClick={() => setTool('pencil')} className={`p-2.5 rounded-xl transition-all ${tool === 'pencil' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><Pencil size={18} /></button>
          <button onClick={() => setTool('marker')} className={`p-2.5 rounded-xl transition-all ${tool === 'marker' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><Users size={18} /></button>
          <button onClick={() => setTool('eraser')} className={`p-2.5 rounded-xl transition-all ${tool === 'eraser' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><Eraser size={18} /></button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={clearBoard} className="p-2.5 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={20} /></button>
          <button onClick={downloadBoard} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all">
             <Download size={16} /> {t.saveSchema}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full rounded-[2.5rem] overflow-hidden border-4 border-slate-800 shadow-2xl touch-none bg-slate-800 transition-all duration-300">
        <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className={`w-full h-auto cursor-crosshair block ${tool === 'marker' ? 'cursor-copy' : ''}`} />
        {markers.map(m => (
          <div key={m.id} style={{ left: m.x, top: m.y }} className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-black text-white text-xs md:text-sm cursor-pointer transition-transform hover:scale-110 group ${m.color === 'blue' ? 'bg-blue-500 shadow-blue-500/30' : m.color === 'red' ? 'bg-red-500 shadow-red-500/30' : 'bg-amber-500 shadow-amber-500/30'}`} onClick={() => removeMarker(m.id)}>
            {m.label}
            <div className="absolute -top-1 -right-1 bg-slate-900 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TacticalBoard;
