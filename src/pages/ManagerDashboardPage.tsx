import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";

type Booking = Record<string, any>;

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState("");
  const [exportPeriod, setExportPeriod] = useState<"weekly" | "monthly" | "yearly" | "date">("weekly");
  const [exportDate, setExportDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [exportYear, setExportYear] = useState(() => String(new Date().getFullYear()));
  const [exportBusy, setExportBusy] = useState("");
  const [exportError, setExportError] = useState("");

  const getSelectedWeekRange = () => {
    const selected = new Date(`${exportDate}T00:00:00`);
    if (Number.isNaN(selected.getTime())) return "";
    const day = selected.getDay();
    const monday = new Date(selected);
    monday.setDate(selected.getDate() + (day === 0 ? -6 : 1 - day));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const format = (value: Date) =>
      value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${format(monday)} – ${format(sunday)}`;
  };

  const downloadActivities = async (
    period: "weekly" | "monthly" | "yearly" | "date",
    format: "xlsx" | "pdf"
  ) => {
    const busyKey = `${period}-${format}`;
    setExportBusy(busyKey);
    setExportError("");
    try {
      const query = new URLSearchParams({ period, format });
      if (period === "weekly" || period === "date") query.set("date", exportDate);
      if (period === "monthly") {
        query.set("month", exportMonth);
        query.set("date", `${exportMonth}-01`);
      }
      if (period === "yearly") {
        query.set("year", exportYear);
        query.set("date", `${exportYear}-01-01`);
      }
      const blob = await api.exportActivities(query.toString());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gorilla-resort-${period}-${period === "monthly" ? exportMonth : period === "yearly" ? exportYear : exportDate}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Could not export activities.");
    } finally {
      setExportBusy("");
    }
  };

  const load = async () => {
    try {
      await api.managerMe();
      setLoggedIn(true);
      setData(await api.managerDashboard());
    } catch {
      setLoggedIn(false);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const login = async (e: FormEvent) => {
    e.preventDefault(); setLoginError("");
    try { await api.managerLogin(email, password); setPassword(""); setLoggedIn(true); setData(await api.managerDashboard()); }
    catch (err) { setLoginError(err instanceof Error ? err.message : "Login failed."); }
  };

  const logout = async () => { await api.managerLogout(); setLoggedIn(false); setData(null); };

  const deleteMessage = async (item: any) => {
    if (!window.confirm(`Delete message from ${item.name}?`)) return;
    try { await api.deleteMessage(item.id); setData(await api.managerDashboard()); } catch (err) { alert(err instanceof Error ? err.message : "Could not delete message."); }
  };

  const deleteSubscriber = async (item: any) => {
    if (!window.confirm(`Delete subscriber ${item.email}?`)) return;
    try { await api.deleteSubscriber(item.id); setData(await api.managerDashboard()); } catch (err) { alert(err instanceof Error ? err.message : "Could not delete subscriber."); }
  };

  const deleteBooking = async (booking: Booking) => {
    if (!window.confirm(`Delete booking ${booking.id}? This will release the dates.`)) return;
    setAction(booking.id);
    try { await api.deleteBooking(booking.id); setData(await api.managerDashboard()); }
    catch (err) { alert(err instanceof Error ? err.message : "Could not delete booking."); }
    finally { setAction(""); }
  };

  const sendReset = async (e: FormEvent) => {
    e.preventDefault(); setForgotStatus("");
    try { const r = await api.forgotPassword(forgotEmail); setForgotStatus(r.message); }
    catch (err) { setForgotStatus(err instanceof Error ? err.message : "Could not request reset."); }
  };

  if (loading) return <main className="min-h-screen bg-sand-50 pt-32 text-center dark:bg-tide-950"><p>Loading manager dashboard…</p></main>;

  if (!loggedIn) return (
    <main className="min-h-screen bg-sand-50 px-4 pb-20 pt-28 dark:bg-tide-950 sm:px-6">
      <div className="mx-auto max-w-md">
        <Link to="/" className="text-sm font-semibold text-tide-700 dark:text-gold-300">← Back to resort</Link>
        <div className="card-surface mt-8 rounded-3xl p-7 shadow-card sm:p-10">
          <span className="eyebrow">Private manager area</span>
          <h1 className="mt-3 font-display text-4xl text-tide-900 dark:text-sand-50">Resort control room</h1>
          <p className="mt-3 text-sm text-ink/60 dark:text-sand-100/60">Secure access to bookings, guest messages, subscribers, email activity and the full website audit trail.</p>
          <form onSubmit={login} className="mt-7 space-y-4">
            <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Manager email" className="w-full rounded-xl border p-3 dark:bg-tide-950" autoComplete="username" />
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border p-3 pr-12 dark:bg-tide-950" autoComplete="current-password" />
              <button
                type="button"
                onClick={()=>setShowPassword(v=>!v)}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center text-tide-700/60 transition hover:text-tide-900 dark:text-sand-100/60 dark:hover:text-sand-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 8.5 5 8.5 5a15.5 15.5 0 0 1-3.02 3.42M6.61 6.62C4.62 8.08 3.5 10 3.5 10S7 15 12 15c.73 0 1.43-.1 2.09-.27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
                  </svg>
                )}
              </button>
            </div>
            <button className="btn-primary w-full" type="submit">Sign in securely</button>
            {loginError && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{loginError}</p>}
          </form>
          <button onClick={()=>setForgot(v=>!v)} className="mt-5 text-sm font-semibold text-tide-700 underline dark:text-gold-300">Forgot password?</button>
          {forgot && <form onSubmit={sendReset} className="mt-4 space-y-3 rounded-2xl bg-sand-100 p-4 dark:bg-tide-900"><p className="text-xs text-ink/60 dark:text-sand-100/60">Enter the manager email and a reset link will be sent there.</p><input required type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="Manager email" className="w-full rounded-xl border p-3 dark:bg-tide-950"/><button className="btn-outline w-full" type="submit">Send reset link</button>{forgotStatus&&<p className="text-xs">{forgotStatus}</p>}</form>}
        </div>
      </div>
    </main>
  );

  const bookings: Booking[] = data?.bookings || [];
  const messages: any[] = data?.messages || [];
  const subscribers: any[] = data?.subscribers || [];
  const audit: any[] = [...(data?.audit || [])].reverse();
  const emails: any[] = [...(data?.emails || [])].reverse();
  const pending = bookings.filter(b=>b.status === "pending").length;
  const confirmed = bookings.filter(b=>b.status === "confirmed" || b.status === "approved").length;
  const rejected = bookings.filter(b=>b.status === "rejected").length;
  const value = bookings.filter(b=>b.status === "confirmed" || b.status === "approved").reduce((sum,b)=>sum+Number(b.totalPrice||0),0);

  return (
    <main className="min-h-screen bg-sand-50 px-4 pb-20 pt-28 dark:bg-tide-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><span className="eyebrow">Private manager dashboard</span><h1 className="mt-2 font-display text-4xl text-tide-900 dark:text-sand-50 sm:text-5xl">Resort control room</h1><p className="mt-2 text-sm text-ink/60 dark:text-sand-100/60">Signed in as {data?.managerEmail || "manager"}. Every important website action is logged.</p></div>
          <div className="flex gap-3"><Link to="/" className="btn-outline">View website</Link><button onClick={logout} className="btn-primary">Sign out</button></div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[[pending,"Pending requests"],[confirmed,"Confirmed bookings"],[rejected,"Rejected"],[`$${value.toLocaleString()}`,"Confirmed value"]].map(([n,l])=><div key={String(l)} className="card-surface rounded-2xl p-5 shadow-card"><p className="text-3xl font-semibold text-tide-900 dark:text-sand-50">{n}</p><p className="mt-1 text-xs uppercase tracking-widest2 opacity-50">{l}</p></div>)}
        </div>

        <section className="mt-8 card-surface rounded-3xl p-5 shadow-card sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><span className="eyebrow">Inventory & pricing</span><h2 className="mt-1 font-display text-2xl text-tide-900 dark:text-sand-50">Room rates</h2></div><p className="text-xs opacity-60">VIP Room I: $350/night · All other rooms: $200/night</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{(data?.rooms||[]).map((r:any)=><div key={r.room} className="rounded-2xl bg-sand-100 p-4 dark:bg-tide-900"><p className="text-xs uppercase tracking-widest2 opacity-50">{r.tier}</p><p className="mt-1 font-semibold">{r.room}</p><p className="mt-2 text-lg font-semibold">${r.nightlyPrice}<span className="text-xs font-normal opacity-50"> / night</span></p></div>)}</div>
        </section>

        <section className="mt-8 card-surface rounded-3xl p-5 shadow-card sm:p-7">
          <div><span className="eyebrow">Booking management</span><h2 className="mt-1 font-display text-2xl text-tide-900 dark:text-sand-50">All booking requests</h2><p className="mt-1 text-sm opacity-60">Rejecting releases the dates. Deleting also releases the dates and leaves an audit record.</p></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b border-tide-700/10 text-xs uppercase tracking-widest2 opacity-50"><th className="p-3">Guest</th><th className="p-3">Room</th><th className="p-3">Stay</th><th className="p-3">Status</th><th className="p-3">Value</th><th className="p-3">Action</th></tr></thead><tbody>{bookings.length ? bookings.slice().reverse().map(b=><tr key={b.id} className="border-b border-tide-700/5"><td className="p-3"><b>{b.name}</b><br/><span className="text-xs opacity-50">{b.email}</span></td><td className="p-3">{b.room}<br/><span className="text-xs opacity-50">{b.tier||"Standard"}</span></td><td className="p-3">{b.checkIn}<br/>→ {b.checkOut}</td><td className="p-3"><span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold dark:bg-tide-900">{b.status}</span></td><td className="p-3">${Number(b.totalPrice||0).toLocaleString()}</td><td className="p-3">{b.status!=="rejected" && <button disabled={action===b.id} onClick={()=>deleteBooking(b)} className="rounded-full border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-300">{action===b.id?"Deleting…":"Delete & release"}</button>}</td></tr>):<tr><td className="p-4" colSpan={6}>No bookings yet.</td></tr>}</tbody></table></div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="card-surface rounded-3xl p-5 shadow-card sm:p-7"><span className="eyebrow">Guest communication</span><h2 className="mt-1 font-display text-2xl text-tide-900 dark:text-sand-50">Messages & comments</h2><div className="mt-4 max-h-96 space-y-3 overflow-auto">{messages.length?messages.slice().reverse().map(m=><article key={m.id} className="rounded-2xl bg-sand-100 p-4 dark:bg-tide-900"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{m.name} <span className="text-xs font-normal opacity-50">{m.email}</span></p><button onClick={()=>deleteMessage(m)} className="text-xs font-semibold text-red-700 dark:text-red-300">Delete</button></div><p className="mt-2 text-sm whitespace-pre-wrap">{m.message}</p><p className="mt-2 text-[11px] opacity-40">{new Date(m.createdAt).toLocaleString()}</p></article>):<p className="text-sm opacity-60">No messages.</p>}</div></section>
          <section className="card-surface rounded-3xl p-5 shadow-card sm:p-7"><span className="eyebrow">Audience</span><h2 className="mt-1 font-display text-2xl text-tide-900 dark:text-sand-50">Subscribers</h2><div className="mt-4 max-h-96 space-y-2 overflow-auto">{subscribers.length?subscribers.slice().reverse().map(s=><div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-sand-100 p-3 text-sm dark:bg-tide-900"><div><b>{s.email}</b><span className="ml-2 text-xs opacity-40">{new Date(s.subscribedAt).toLocaleString()}</span></div><button onClick={()=>deleteSubscriber(s)} className="text-xs font-semibold text-red-700 dark:text-red-300">Delete</button></div>):<p className="text-sm opacity-60">No subscribers.</p>}</div></section>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="card-surface rounded-3xl p-5 shadow-card sm:p-7"><span className="eyebrow">Email activity</span><h2 className="mt-1 font-display text-2xl text-tide-900 dark:text-sand-50">Website-generated Gmail activity</h2><p className="mt-1 text-xs opacity-50">This shows emails sent by the website. It does not read private Gmail inbox contents.</p><div className="mt-4 max-h-80 space-y-2 overflow-auto">{emails.length?emails.map(e=><div key={e.id} className="rounded-xl bg-sand-100 p-3 dark:bg-tide-900"><p className="font-semibold text-sm">{e.subject}</p><p className="text-xs opacity-60">To: {(e.to||[]).join(", ")}</p><p className="text-[11px] opacity-40">{new Date(e.at).toLocaleString()}</p></div>):<p className="text-sm opacity-60">No email activity logged yet.</p>}</div></section>
          <section className="card-surface rounded-3xl p-5 shadow-card sm:p-7"><span className="eyebrow">Audit trail</span><h2 className="mt-1 font-display text-2xl text-tide-900 dark:text-sand-50">Website updates & actions</h2><div className="mt-4 max-h-80 space-y-2 overflow-auto">{audit.length?audit.map(a=><div key={a.id} className="rounded-xl bg-sand-100 p-3 dark:bg-tide-900"><p className="font-semibold text-sm">{a.action.replaceAll("_"," ")}</p><p className="text-xs opacity-60">{JSON.stringify(a.details)}</p><p className="text-[11px] opacity-40">{new Date(a.at).toLocaleString()}</p></div>):<p className="text-sm opacity-60">No audit activity yet.</p>}</div></section>
        </div>

        <section className="mt-8 card-surface rounded-3xl p-5 shadow-card sm:p-7">
          <div className="flex flex-col gap-5">
            <div>
              <span className="eyebrow">Export & records</span>
              <h2 className="mt-1 font-display text-2xl text-tide-900 dark:text-sand-50">Export resort activities</h2>
              <p className="mt-1 max-w-3xl text-sm opacity-60">
                Choose Weekly, Monthly, Yearly, or Selected date. The report period controls exactly which activities are included.
                Export the same report as a professional Excel workbook or PDF without changing the rest of the manager dashboard.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest2 opacity-60">Report period</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([
                    ["weekly", "Weekly"],
                    ["monthly", "Monthly"],
                    ["yearly", "Yearly"],
                    ["date", "Selected date"],
                  ] as const).map(([period, label]) => (
                    <button key={period} type="button" onClick={() => setExportPeriod(period)} className={exportPeriod === period ? "btn-primary w-full" : "btn-outline w-full"}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-w-[220px]">
                {exportPeriod === "monthly" ? (
                  <label className="text-xs font-semibold uppercase tracking-widest2 opacity-60">
                    Choose month
                    <input type="month" value={exportMonth} onChange={e => setExportMonth(e.target.value)} className="mt-2 block w-full rounded-xl border border-tide-700/15 bg-white px-3 py-2 text-sm font-normal tracking-normal text-ink outline-none dark:bg-tide-950 dark:text-sand-50" />
                  </label>
                ) : exportPeriod === "yearly" ? (
                  <label className="text-xs font-semibold uppercase tracking-widest2 opacity-60">
                    Choose year
                    <input type="number" min="2000" max="2100" value={exportYear} onChange={e => setExportYear(e.target.value)} className="mt-2 block w-full rounded-xl border border-tide-700/15 bg-white px-3 py-2 text-sm font-normal tracking-normal text-ink outline-none dark:bg-tide-950 dark:text-sand-50" />
                  </label>
                ) : (
                  <label className="text-xs font-semibold uppercase tracking-widest2 opacity-60">
                    {exportPeriod === "weekly" ? "Choose a date in the week" : "Choose date"}
                    <input type="date" value={exportDate} onChange={e => setExportDate(e.target.value)} className="mt-2 block w-full rounded-xl border border-tide-700/15 bg-white px-3 py-2 text-sm font-normal tracking-normal text-ink outline-none dark:bg-tide-950 dark:text-sand-50" />
                  </label>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-tide-700/10 bg-sand-50/70 p-4 dark:bg-tide-950/40">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-tide-900 dark:text-sand-50">
                    {exportPeriod === "weekly" ? "Weekly report" : exportPeriod === "monthly" ? "Monthly report" : exportPeriod === "yearly" ? "Yearly report" : "Selected-date report"}
                  </p>
                  <p className="mt-1 text-xs opacity-60">
                    {exportPeriod === "weekly"
                      ? `Week: ${getSelectedWeekRange()} — all activities from Monday through Sunday.`
                      : exportPeriod === "monthly"
                        ? `Month: ${new Date(`${exportMonth}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })} — all activities in this calendar month.`
                        : exportPeriod === "yearly"
                          ? `Year: ${exportYear} — all activities from January through December.`
                          : `Date: ${exportDate} — only actions recorded on this calendar date.`}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" disabled={Boolean(exportBusy)} onClick={() => downloadActivities(exportPeriod, "xlsx")} className="btn-primary min-w-[160px]">
                    {exportBusy === `${exportPeriod}-xlsx` ? "Preparing Excel…" : "Export Excel (.xlsx)"}
                  </button>
                  <button type="button" disabled={Boolean(exportBusy)} onClick={() => downloadActivities(exportPeriod, "pdf")} className="btn-outline min-w-[160px]">
                    {exportBusy === `${exportPeriod}-pdf` ? "Preparing PDF…" : "Export PDF (.pdf)"}
                  </button>
                </div>
              </div>
            </div>

            {exportError && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{exportError}</p>}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-tide-900 p-6 text-sand-50 shadow-card sm:p-8"><span className="eyebrow !text-gold-300">Automatic reporting</span><h2 className="mt-2 font-display text-2xl">Weekly report to the manager</h2><p className="mt-2 max-w-2xl text-sm text-sand-100/70">The server automatically emails a weekly activity report every Monday at 8:00 AM Rwanda time with requests, confirmations, rejections, messages, subscribers, email activity and confirmed booking value.</p></section>
      </div>
    </main>
  );
}
