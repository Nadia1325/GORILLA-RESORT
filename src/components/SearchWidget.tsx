import { FormEvent, ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";

interface SearchState { room: string; checkIn: string; checkOut: string; guests: string; }
const roomOptions = ["Any available room","Room I · MUHABURA","Room II · GAHINGA","Room III · SABYINYO","Room IV · BISOKE","Room V · KARISIMBI"];

function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function SearchWidget() {
  const navigate = useNavigate();
  const today = todayInputValue();
  const [state, setState] = useState<SearchState>({ room: roomOptions[0], checkIn: "", checkOut: "", guests: "2 adults" });
  const update = <K extends keyof SearchState>(key: K, value: SearchState[K]) => setState(prev => ({ ...prev, [key]: value }));
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("room", state.room); if (state.checkIn) params.set("checkIn", state.checkIn); if (state.checkOut) params.set("checkOut", state.checkOut); params.set("guests", state.guests);
    navigate(`/rooms?${params.toString()}`);
  };
  return <form onSubmit={handleSubmit} className="relative z-20 mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 rounded-3xl border border-sand-100 bg-sand-50/95 p-4 shadow-float backdrop-blur-md dark:border-sand-50/10 dark:bg-tide-900/90 sm:grid-cols-2 sm:p-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end lg:gap-3 lg:p-6">
    <Field label="Room"><select value={state.room} onChange={e=>update("room",e.target.value)} className="w-full bg-transparent text-sm font-semibold text-ink outline-none dark:text-sand-50 dark:[color-scheme:dark]">{roomOptions.map(r=><option key={r}>{r}</option>)}</select></Field>
    <Field label="Check in"><input type="date" min={today} value={state.checkIn} onChange={e=>update("checkIn",e.target.value)} className="w-full bg-transparent text-sm font-semibold text-ink outline-none dark:text-sand-50 dark:[color-scheme:dark]" /></Field>
    <Field label="Check out"><input type="date" min={state.checkIn || today} value={state.checkOut} onChange={e=>update("checkOut",e.target.value)} className="w-full bg-transparent text-sm font-semibold text-ink outline-none dark:text-sand-50 dark:[color-scheme:dark]" /></Field>
    <Field label="Guests"><select value={state.guests} onChange={e=>update("guests",e.target.value)} className="w-full bg-transparent text-sm font-semibold text-ink outline-none dark:text-sand-50 dark:[color-scheme:dark]"><option>2 adults</option><option>2 adults, 1 child</option><option>3–4 adults</option><option>Just me</option></select></Field>
    <button type="submit" className="btn-primary w-full lg:w-auto"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>Check availability</button>
  </form>;
}
function Field({label,children}:{label:string;children:ReactNode}){return <label className="flex flex-col gap-1 border-b border-tide-700/10 pb-2 dark:border-sand-50/10 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-3"><span className="text-[11px] font-semibold uppercase tracking-widest2 text-ink/40 dark:text-sand-100/45">{label}</span>{children}</label>}
