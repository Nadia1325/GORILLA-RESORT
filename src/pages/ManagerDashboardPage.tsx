import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { api } from "../api";
import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DashboardSidebar, DashboardSection, SidebarCounts } from "@/components/manager/dashboard-sidebar";
import { DateRangeFilter } from "@/components/manager/date-range-filter";
import { getPeriodBounds, isWithin, type CustomRange, type DateRangeKey } from "@/lib/date-range";
import { OverviewSection } from "@/components/manager/sections/overview-section";
import { BookingsSection } from "@/components/manager/sections/bookings-section";
import { MessagesSection } from "@/components/manager/sections/messages-section";
import { SubscribersSection } from "@/components/manager/sections/subscribers-section";
import { EmailActivitySection } from "@/components/manager/sections/email-activity-section";
import { AuditSection } from "@/components/manager/sections/audit-section";
import { ExportSection } from "@/components/manager/sections/export-section";

type Booking = Record<string, any>;

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [section, setSection] = useState<DashboardSection>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeKey>("month");
  const [customRange, setCustomRange] = useState<CustomRange>({ start: "", end: "" });

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
    e.preventDefault(); setLoginError(""); setLoginBusy(true);
    try { await api.managerLogin(email, password); setPassword(""); setLoggedIn(true); setData(await api.managerDashboard()); }
    catch (err) { setLoginError(err instanceof Error ? err.message : "Login failed."); }
    finally { setLoginBusy(false); }
  };

  const logout = async () => {
    setLogoutBusy(true);
    try { await api.managerLogout(); setLoggedIn(false); setData(null); }
    finally { setLogoutBusy(false); }
  };

  const deleteMessage = async (item: any) => {
    if (!window.confirm(`Delete message from ${item.name}?`)) return;
    setDeleteBusyId(item.id);
    try { await api.deleteMessage(item.id); setData(await api.managerDashboard()); }
    catch (err) { alert(err instanceof Error ? err.message : "Could not delete message."); }
    finally { setDeleteBusyId(""); }
  };

  const deleteSubscriber = async (item: any) => {
    if (!window.confirm(`Delete subscriber ${item.email}?`)) return;
    setDeleteBusyId(item.id);
    try { await api.deleteSubscriber(item.id); setData(await api.managerDashboard()); }
    catch (err) { alert(err instanceof Error ? err.message : "Could not delete subscriber."); }
    finally { setDeleteBusyId(""); }
  };

  const deleteBooking = async (booking: Booking) => {
    if (!window.confirm(`Delete booking ${booking.id}? This will release the dates.`)) return;
    setAction(booking.id);
    try { await api.deleteBooking(booking.id); setData(await api.managerDashboard()); }
    catch (err) { alert(err instanceof Error ? err.message : "Could not delete booking."); }
    finally { setAction(""); }
  };

  const sendReset = async (e: FormEvent) => {
    e.preventDefault(); setForgotStatus(""); setForgotBusy(true);
    try { const r = await api.forgotPassword(forgotEmail); setForgotStatus(r.message); }
    catch (err) { setForgotStatus(err instanceof Error ? err.message : "Could not request reset."); }
    finally { setForgotBusy(false); }
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-sand-50 text-center dark:bg-tide-950"><p>Loading manager dashboard…</p></main>;

  if (!loggedIn) return (
    <main className="min-h-screen bg-sand-50 px-4 py-16 dark:bg-tide-950 sm:px-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="text-sm font-semibold text-tide-700 dark:text-gold-300">← Back to resort</Link>
          <ThemeToggle
            theme={theme}
            onToggle={toggleTheme}
            className="border-tide-700/20 text-tide-700 hover:border-tide-700 dark:border-sand-100/25 dark:text-sand-100 dark:hover:border-sand-100"
          />
        </div>
        <div className="card-surface mt-8 rounded-3xl p-7 shadow-card sm:p-10">
          <span className="eyebrow">Private manager area</span>
          <h1 className="mt-3 font-display text-4xl text-tide-900 dark:text-sand-50">Resort control room</h1>
          <p className="mt-3 text-sm text-ink/60 dark:text-sand-100/60">Secure access to bookings, guest messages, subscribers, email activity and the full website audit trail.</p>
          <form onSubmit={login} className="mt-7 space-y-4">
            <Input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Manager email" autoComplete="username" />
            <div className="relative">
              <Input required type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="pr-12" autoComplete="current-password" />
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
            <Button className="w-full" type="submit" loading={loginBusy}>Sign in securely</Button>
            {loginError && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{loginError}</p>}
          </form>
          <button onClick={()=>setForgot(v=>!v)} className="mt-5 text-sm font-semibold text-tide-700 underline dark:text-gold-300">Forgot password?</button>
          {forgot && <form onSubmit={sendReset} className="mt-4 space-y-3 rounded-2xl bg-sand-100 p-4 dark:bg-tide-900"><p className="text-xs text-ink/60 dark:text-sand-100/60">Enter the manager email and a reset link will be sent there.</p><Input required type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="Manager email"/><Button variant="outline" className="w-full" type="submit" loading={forgotBusy}>Send reset link</Button>{forgotStatus&&<p className="text-xs">{forgotStatus}</p>}</form>}
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

  const counts: SidebarCounts = { pendingBookings: pending, messages: messages.length };

  const periodBounds = getPeriodBounds(dateRange, new Date(), customRange);
  const filterByPeriod = <T extends Record<string, any>>(list: T[], field: string): T[] =>
    periodBounds ? list.filter((item) => isWithin(item[field], periodBounds.start, periodBounds.end)) : list;

  const DATE_FILTERED_SECTIONS: DashboardSection[] = ["overview", "bookings", "messages", "subscribers"];

  const sectionTitles: Record<DashboardSection, string> = {
    overview: "Overview",
    bookings: "Bookings",
    messages: "Messages",
    subscribers: "Subscribers",
    emails: "Email activity",
    audit: "Audit trail",
    export: "Export",
  };

  const renderSection = () => {
    switch (section) {
      case "overview":
        return <OverviewSection bookings={bookings} rooms={data?.rooms || []} dateRange={dateRange} customRange={customRange} />;
      case "bookings":
        return <BookingsSection bookings={filterByPeriod(bookings, "createdAt")} actionId={action} onDelete={deleteBooking} />;
      case "messages":
        return <MessagesSection messages={filterByPeriod(messages, "createdAt")} busyId={deleteBusyId} onDelete={deleteMessage} />;
      case "subscribers":
        return <SubscribersSection subscribers={filterByPeriod(subscribers, "subscribedAt")} busyId={deleteBusyId} onDelete={deleteSubscriber} />;
      case "emails":
        return <EmailActivitySection emails={emails} />;
      case "audit":
        return <AuditSection audit={audit} />;
      case "export":
        return (
          <ExportSection
            exportPeriod={exportPeriod}
            setExportPeriod={setExportPeriod}
            exportDate={exportDate}
            setExportDate={setExportDate}
            exportMonth={exportMonth}
            setExportMonth={setExportMonth}
            exportYear={exportYear}
            setExportYear={setExportYear}
            exportBusy={exportBusy}
            exportError={exportError}
            getSelectedWeekRange={getSelectedWeekRange}
            onDownload={downloadActivities}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/10 lg:block">
          <DashboardSidebar
            active={section}
            onNavigate={setSection}
            counts={counts}
            managerEmail={data?.managerEmail}
            onLogout={logout} logoutBusy={logoutBusy}
            onViewWebsite={() => navigate("/")}
          />
        </aside>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <DashboardSidebar
              active={section}
              onNavigate={(s) => { setSection(s); setMobileNavOpen(false); }}
              counts={counts}
              managerEmail={data?.managerEmail}
              onLogout={logout} logoutBusy={logoutBusy}
              onViewWebsite={() => navigate("/")}
            />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/10 bg-background/90 px-4 py-4 backdrop-blur sm:px-6 lg:hidden">
            <Button variant="outline" size="icon" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </Button>
            <p className="flex-1 font-display text-lg text-tide-900 dark:text-sand-50">{sectionTitles[section]}</p>
            {DATE_FILTERED_SECTIONS.includes(section) && <DateRangeFilter value={dateRange} onChange={setDateRange} customRange={customRange} onCustomRangeChange={setCustomRange} />}
            <ThemeToggle
              theme={theme}
              onToggle={toggleTheme}
              className="border-tide-700/20 text-tide-700 hover:border-tide-700 dark:border-sand-100/25 dark:text-sand-100 dark:hover:border-sand-100"
            />
          </header>

          <div className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            <div className="hidden items-end justify-between gap-4 lg:flex">
              <div>
                <span className="eyebrow">Private manager dashboard</span>
                <h1 className="mt-2 font-display text-4xl text-tide-900 dark:text-sand-50">{sectionTitles[section]}</h1>
                <p className="mt-2 text-sm text-ink/60 dark:text-sand-100/60">
                  Signed in as {data?.managerEmail || "manager"}. Every important website action is logged.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {DATE_FILTERED_SECTIONS.includes(section) && <DateRangeFilter value={dateRange} onChange={setDateRange} customRange={customRange} onCustomRangeChange={setCustomRange} />}
                <ThemeToggle
                  theme={theme}
                  onToggle={toggleTheme}
                  className="border-tide-700/20 text-tide-700 hover:border-tide-700 dark:border-sand-100/25 dark:text-sand-100 dark:hover:border-sand-100"
                />
              </div>
            </div>

            <div className="mt-6 lg:mt-8">{renderSection()}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
