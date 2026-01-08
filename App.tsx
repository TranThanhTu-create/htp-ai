
import React, { useState, useCallback } from 'react';
import { HouseType, DesignStyle, DesignSuggestion, DesignFormData } from './types';
import { generateArchitecturalDesigns, editDesign, analyzeFengShui } from './services/geminiService';

// --- Thành phần hỗ trợ ---

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
    <div className="bg-[#0f172a] rounded-[2.5rem] p-12 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,242,255,0.15)] border border-[#00f2ff]/20">
      <div className="relative w-24 h-24 mx-auto mb-10">
        <div className="absolute inset-0 rounded-full border-4 border-[#00f2ff]/10 border-t-[#00f2ff] animate-spin shadow-[0_0_15px_rgba(0,242,255,0.4)]"></div>
        <div className="absolute inset-3 bg-[#020617] rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-[#00f2ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>
      <h3 className="text-3xl font-black text-white mb-4 tracking-tight neon-text-glow">HTP AI thiết kế</h3>
      <p className="text-slate-400 text-sm leading-relaxed font-medium mb-6">{message}</p>
      <div className="text-[10px] text-[#00f2ff] font-black uppercase tracking-[0.3em] opacity-80 animate-pulse-glow">Hệ thống xử lý lượng tử</div>
    </div>
  </div>
);

const Header: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <header className="bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
      <div className="flex items-center gap-4 cursor-pointer group" onClick={onReset}>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white tracking-tighter leading-none">
            HTP <span className="text-[#00f2ff] neon-text-glow">AI</span>
          </span>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">KIẾN TRÚC & XÂY DỰNG</span>
        </div>
      </div>
      <nav className="hidden md:flex gap-10 items-center">
        <a href="https://sdarchi.com.vn/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#00f2ff] font-bold transition-all uppercase text-xs tracking-widest">Công trình</a>
        <button onClick={onReset} className="text-slate-400 hover:text-white font-bold transition-all uppercase text-xs tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Bắt đầu lại
        </button>
        <a href="tel:0333357076" className="bg-white/5 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#00f2ff] hover:text-black transition-all border border-white/10">Liên hệ</a>
      </nav>
    </div>
  </header>
);

const App: React.FC = () => {
  const initialFormData: DesignFormData = {
    houseType: HouseType.Townhouse,
    style: DesignStyle.Modern,
    budget: '2.5',
    image: null,
    landWidth: '5',
    landLength: '20',
    floors: '2',
    frontYardLength: '3',
    birthDate: '',
  };

  const [formData, setFormData] = useState<DesignFormData>(initialFormData);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [fengShuiResult, setFengShuiResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<DesignSuggestion | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const ZALO_LINK = "https://zalo.me/g/exlpxk125";

  const handleReset = useCallback(() => {
    if (suggestions.length > 0 || formData.image) {
      if (!window.confirm("Bắt đầu lại thiết kế mới?")) return;
    }
    setFormData(initialFormData);
    setSuggestions([]);
    setFengShuiResult('');
    setSelectedDesign(null);
    setEditPrompt('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [suggestions.length, formData.image]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!formData.image) return alert("Vui lòng tải ảnh khu đất!");
    if (!formData.birthDate) return alert("Vui lòng chọn ngày sinh để AI xem ngày khởi công!");

    setIsLoading(true);
    setLoadingMessage("HTP AI đang xem phong thủy 2026 và thiết kế...");
    
    try {
      const [designsResult, fengShuiText] = await Promise.all([
        generateArchitecturalDesigns(
          formData.image, formData.houseType, formData.style, formData.budget,
          formData.landWidth, formData.landLength, formData.floors, formData.frontYardLength, 3
        ),
        analyzeFengShui(formData.birthDate)
      ]);

      const mappedSuggestions: DesignSuggestion[] = designsResult.map((res, index) => ({
        id: `design-${Date.now()}-${index}`,
        imageUrl: res.imageUrl,
        title: `Phương án ${index + 1}: ${formData.houseType} ${formData.floors} tầng`,
        description: res.description,
        estimatedCost: `${formData.budget} Tỷ VNĐ`
      }));

      setSuggestions(mappedSuggestions);
      setFengShuiResult(fengShuiText);
      setSelectedDesign(null);
      
      setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (error) {
      alert("Hệ thống bận, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDesign = async () => {
    if (!selectedDesign || !editPrompt.trim()) return;
    setIsEditing(true);
    setLoadingMessage(`Đang tinh chỉnh kiến trúc...`);
    try {
      const updatedUrl = await editDesign(selectedDesign.imageUrl, editPrompt);
      if (updatedUrl) {
        const updated = { ...selectedDesign, imageUrl: updatedUrl };
        setSelectedDesign(updated);
        setSuggestions(prev => prev.map(s => s.id === selectedDesign.id ? updated : s));
        setEditPrompt('');
      }
    } catch (error) {
      alert("Lỗi chỉnh sửa!");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617]">
      <Header onReset={handleReset} />

      <main className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
        <section className="text-center mb-16 relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.05)_0%,_transparent_70%)]"></div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tight">
            Kiến Tạo <span className="text-[#00f2ff] neon-text-glow italic">Tương Lai</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Tải ảnh đất trống, nhập ngày sinh. HTP AI thiết kế 3D và xem ngày khởi công từ năm 2026.
          </p>
        </section>

        <section className="grid lg:grid-cols-2 gap-12 mb-24 items-stretch">
          <div className="bg-[#0f172a] p-10 rounded-[3rem] shadow-2xl border border-white/5 flex flex-col justify-between">
            <div className="space-y-8">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-4 text-white">
                <span className="bg-[#00f2ff] text-black w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-[0_0_15px_rgba(0,242,255,0.3)]">1</span>
                Thông tin & Phong thủy
              </h2>
              
              <div className="relative group">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="land-upload" />
                <label htmlFor="land-upload" className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${formData.image ? 'border-[#00f2ff] bg-[#00f2ff]/5' : 'border-white/10 bg-black/20 hover:border-[#00f2ff]/50'}`}>
                  {formData.image ? <img src={formData.image} className="h-full w-full object-cover rounded-[2.5rem]" alt="Land" /> : <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Tải ảnh đất trống</p>}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.2em] ml-2">Ngày sinh (Xem phong thủy 2026+)</label>
                  <input
                    type="date"
                    className="w-full px-6 py-4 bg-[#020617] border border-white/10 rounded-2xl font-bold text-white transition-all shadow-inner [color-scheme:dark] focus:border-[#00f2ff]/50 outline-none"
                    value={formData.birthDate}
                    onChange={(e) => setFormData(p => ({ ...p, birthDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.2em] ml-2">Loại hình</label>
                  <select className="w-full px-6 py-4 bg-[#020617] border border-white/10 rounded-2xl font-bold text-white appearance-none focus:border-[#00f2ff]/50 outline-none" value={formData.houseType} onChange={(e) => setFormData(p => ({ ...p, houseType: e.target.value as HouseType }))}>
                    {Object.values(HouseType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.2em] ml-2">Ngang x Dài (m)</label>
                  <div className="flex gap-2">
                    <input type="number" step="0.1" className="w-1/2 px-4 py-4 bg-[#020617] border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-[#00f2ff]/50" value={formData.landWidth} onChange={(e) => setFormData(p => ({ ...p, landWidth: e.target.value }))} placeholder="5" />
                    <input type="number" step="0.1" className="w-1/2 px-4 py-4 bg-[#020617] border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-[#00f2ff]/50" value={formData.landLength} onChange={(e) => setFormData(p => ({ ...p, landLength: e.target.value }))} placeholder="20" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.2em] ml-2">Số tầng & Sân (m)</label>
                  <div className="flex gap-2">
                    <input type="number" className="w-1/2 px-4 py-4 bg-[#020617] border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-[#00f2ff]/50" value={formData.floors} onChange={(e) => setFormData(p => ({ ...p, floors: e.target.value }))} />
                    <input type="number" className="w-1/2 px-4 py-4 bg-[#020617] border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-[#00f2ff]/50" value={formData.frontYardLength} onChange={(e) => setFormData(p => ({ ...p, frontYardLength: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-[#020617] p-6 rounded-[2rem] border border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.2em]">Ngân sách: {formData.budget} Tỷ</label>
                </div>
                <input type="range" min="0.5" max="10.0" step="0.1" value={formData.budget} onChange={(e) => setFormData(p => ({ ...p, budget: e.target.value }))} className="w-full accent-[#00f2ff]" />
              </div>
            </div>

            <button onClick={handleGenerate} disabled={isLoading} className="mt-10 w-full bg-[#00f2ff] hover:bg-[#67e8f9] text-black font-black py-6 rounded-[2rem] transition-all shadow-[0_0_30px_rgba(0,242,255,0.2)] flex items-center justify-center gap-4 text-xl uppercase tracking-widest">
              {isLoading ? 'Đang phân tích...' : 'KHỞI TẠO KIẾN TRÚC & PHONG THỦY 2026'}
            </button>
          </div>

          <div className="bg-[#0f172a] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border border-white/5 flex flex-col justify-center">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00f2ff]/10 rounded-full blur-[80px]"></div>
             <h3 className="text-4xl font-black mb-6 leading-tight">Lộ Trình <br/><span className="text-[#00f2ff]">Phong Thủy 2026.</span></h3>
             <p className="text-slate-400 mb-8 text-lg font-medium leading-relaxed">HTP AI sẽ dựa trên ngày sinh để tính toán năm 2026 (Bính Ngọ) có phải là thời điểm vàng để khởi công ngôi nhà {formData.floors} tầng của bạn hay không.</p>
             <div className="grid gap-6">
                <div className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-[#00f2ff]/20 transition-colors">
                   <div className="text-2xl">🐎</div>
                   <div><h4 className="font-black text-[#00f2ff]">Đại Cát 2026</h4><p className="text-xs opacity-50">Tầm nhìn phong thủy dài hạn cho sự hưng thịnh.</p></div>
                </div>
                <div className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-[#00f2ff]/20 transition-colors">
                   <div className="text-2xl">🏗️</div>
                   <div><h4 className="font-black text-[#00f2ff]">Bản Vẽ 9:16</h4><p className="text-xs opacity-50">Nhìn rõ trọn vẹn mặt tiền ngôi nhà từ đỉnh mái.</p></div>
                </div>
             </div>
          </div>
        </section>

        {/* Kết quả Phong Thủy */}
        {fengShuiResult && (
          <section className="mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="bg-gradient-to-br from-[#0f172a] to-[#020617] rounded-[3rem] p-10 border border-[#00f2ff]/20 shadow-[0_0_50px_rgba(0,242,255,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-6xl opacity-5">☸️</div>
              <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-4">
                <span className="text-2xl text-[#00f2ff]">✦</span> 
                CẨM NANG PHONG THỦY KHỞI CÔNG (TỪ 2026)
              </h2>
              <div className="prose prose-invert max-w-none">
                 <div className="whitespace-pre-wrap text-slate-300 text-lg leading-relaxed font-medium bg-black/40 p-8 rounded-[2rem] border border-white/5">
                   {fengShuiResult}
                 </div>
              </div>
            </div>
          </section>
        )}

        {/* Kết quả Thiết kế */}
        {suggestions.length > 0 && (
          <section id="results-section" className="scroll-mt-24 mb-32 animate-in fade-in slide-in-from-bottom-20 duration-1000">
            <h2 className="text-5xl font-black text-white mb-10 tracking-tight text-center">Bản vẽ kiến trúc toàn cảnh</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {suggestions.map((s) => (
                <div key={s.id} className={`bg-[#0f172a] rounded-[3rem] overflow-hidden shadow-2xl border-4 transition-all duration-700 cursor-pointer ${selectedDesign?.id === s.id ? 'border-[#00f2ff] scale-[1.05]' : 'border-white/5 hover:border-[#00f2ff]/30'}`} onClick={() => setSelectedDesign(s)}>
                  <div className="aspect-[9/16] relative overflow-hidden bg-black">
                    <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                       <div className="bg-[#00f2ff] text-black px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">{s.estimatedCost}</div>
                    </div>
                  </div>
                  <div className="p-10 text-center">
                    <h3 className="text-2xl font-black text-white mb-4">{s.title}</h3>
                    <button className={`w-full font-black py-4 rounded-[1.25rem] transition-all border ${selectedDesign?.id === s.id ? 'bg-[#00f2ff] text-black border-[#00f2ff]' : 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20'}`}>
                      {selectedDesign?.id === s.id ? 'ĐANG CHỌN' : 'XEM CHI TIẾT'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedDesign && (
          <section className="mb-32">
            <div className="bg-[#0f172a] rounded-[4rem] p-4 shadow-2xl border border-white/5">
               <div className="grid lg:grid-cols-5 items-stretch">
                  <div className="lg:col-span-3 p-10">
                    <div className="relative rounded-[3rem] overflow-hidden aspect-[9/16] md:aspect-video shadow-2xl bg-black">
                       <img src={selectedDesign.imageUrl} alt="Detail" className="w-full h-full object-cover" />
                       {isEditing && <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur flex items-center justify-center font-black text-2xl text-[#00f2ff] neon-text-glow">Đang tinh chỉnh...</div>}
                    </div>
                  </div>
                  <div className="lg:col-span-2 p-12 flex flex-col justify-center border-l border-white/5">
                    <h3 className="text-3xl font-black text-white mb-4">Tùy biến bản vẽ</h3>
                    <textarea className="w-full px-8 py-6 bg-black/40 border-2 border-white/5 rounded-[2.5rem] focus:border-[#00f2ff] h-40 resize-none text-white font-bold outline-none mb-6 transition-colors" placeholder="Ví dụ: Đổi màu sơn, thêm đèn ban công..." value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)}></textarea>
                    <div className="flex flex-col gap-4">
                       <button onClick={handleEditDesign} disabled={isEditing || !editPrompt.trim()} className="w-full bg-[#00f2ff] text-black font-black py-6 rounded-[2rem] hover:bg-[#67e8f9] disabled:opacity-20 transition-all text-xl uppercase tracking-widest shadow-lg">CẬP NHẬT THIẾT KẾ</button>
                       <button onClick={() => window.open(ZALO_LINK, '_blank')} className="w-full bg-[#0068FF] text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform">NHẬN BẢN VẼ CHI TIẾT QUA ZALO</button>
                    </div>
                  </div>
               </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-[#020617] border-t border-white/5 py-16 text-center">
        <span className="text-3xl font-black text-white">HTP <span className="text-[#00f2ff] neon-text-glow">AI</span></span>
        <p className="text-slate-600 text-xs mt-4 uppercase tracking-[0.4em]">Kiến trúc & Phong thủy số 2026</p>
      </footer>

      {isLoading && <LoadingOverlay message={loadingMessage} />}
    </div>
  );
};

export default App;