import React, { useContext, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from "qrcode";
import {
  Camera,
  Scissors,
  Dumbbell,
  CalendarDays,
  Package,
  Crown,
  Rocket,
  BookOpen,
  Settings2,
  CreditCard,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ChevronRight,
  Check,
  UploadCloud,
  Image as ImageIcon,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  Phone,
  Clock,
  GripVertical,
  Minus,
  ChevronLeft,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  TrendingUp,
  Users,
  Search,
  SlidersHorizontal,
  WalletCards,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Download,
  Mail,
  Loader2,
  Copy,
  Link2,
} from "lucide-react";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const token = () => localStorage.getItem("bk_token") || "";
const api = async (path: string, opts: any = {}) => {
  const r = await fetch(API + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || "Terjadi kesalahan");
  return j;
};
const money = (n: any) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
const onlyDigits = (value: any) => String(value ?? "").replace(/\D/g, "");
const formatRupiahInput = (value: any) => {
  const digits = onlyDigits(value);
  return digits
    ? `Rp ${new Intl.NumberFormat("id-ID").format(Number(digits))}`
    : "";
};
function RupiahInput({ value, onChange, placeholder = "Rp 0" }: any) {
  return (
    <input
      inputMode="numeric"
      value={formatRupiahInput(value)}
      onChange={(e) => onChange(onlyDigits(e.target.value))}
      placeholder={placeholder}
    />
  );
}
function Spinner({ size = 16 }: any) {
  return <Loader2 className="spinner" size={size} aria-label="Memproses" />;
}
const sportDurationOptions = (court: any): number[] => {
  const configured: number[] = Array.isArray(court?.duration_options)
    ? court.duration_options
        .map(Number)
        .filter((n: number) => Number.isFinite(n) && n >= 15 && n <= 1440)
    : [];
  return configured.length
    ? Array.from(new Set<number>(configured)).sort(
        (a: number, b: number) => a - b,
      )
    : [60, 90, 120, 180, 240, 300];
};
const durationLabel = (minutes: number) =>
  minutes % 60 === 0
    ? `${minutes / 60} Jam`
    : `${Math.floor(minutes / 60)} Jam ${minutes % 60} Menit`;
const meta: any = {
  salon: {
    label: "Salon & Barbershop",
    icon: Scissors,
    accent: "#7c3aed",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=82",
    description: "Layanan, stylist, jadwal, dan antrian",
  },
  sports_court: {
    label: "Lapangan Olahraga",
    icon: Dumbbell,
    accent: "#2563eb",
    image:
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=900&q=82",
    description: "Lapangan, durasi, slot waktu, dan harga",
  },
  photo_studio: {
    label: "Studio Foto",
    icon: Camera,
    accent: "#8b5cf6",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=82",
    description: "Paket, add-on, room, dan jadwal",
  },
};
const days = [
  ["monday", "Senin"],
  ["tuesday", "Selasa"],
  ["wednesday", "Rabu"],
  ["thursday", "Kamis"],
  ["friday", "Jumat"],
  ["saturday", "Sabtu"],
  ["sunday", "Minggu"],
];
const defaultPlanCards = [
  {
    id: "trial",
    name: "Free Trial",
    price: "Rp0",
    suffix: "30 hari",
    features: [
      "Semua template bisnis",
      "Halaman booking publik",
      "Kalender & slot booking",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "Rp49.000",
    suffix: "/ bulan",
    features: [
      "Maks. 200 booking / bulan",
      "Custom link booking",
      "Deposit setting",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "Rp99.000",
    suffix: "/ bulan",
    features: ["Booking unlimited", "Semua fitur Pro", "Untuk volume tinggi"],
  },
];
function normalizePlanCards(items: any[]) {
  return (Array.isArray(items) ? items : []).map((p) => ({
    ...p,
    id: p.id,
    name: p.name,
    price: money(p.price),
    suffix: p.id === "trial" ? p.billing_cycle : `/ ${p.billing_cycle}`,
    features: Array.isArray(p.features) ? p.features : [],
  }));
}
function usePlanCatalog() {
  const [plans, setPlans] = useState<any[]>(defaultPlanCards);
  useEffect(() => {
    api("/api/plans")
      .then((result) => setPlans(normalizePlanCards(result.plans)))
      .catch(() => undefined);
  }, []);
  return plans;
}

const DialogContext = React.createContext<any>(null);
function useDialog() {
  return useContext(DialogContext);
}
function AppDialog({ dialog, onClose, onConfirm, busy }: any) {
  if (!dialog) return null;
  const isConfirm = Boolean(dialog.confirm);
  return (
    <div className="dialogBackdrop" role="presentation">
      <div className="appDialog" role="dialog" aria-modal="true">
        <div
          className={"dialogIcon " + (dialog.tone === "danger" ? "danger" : "")}
        >
          {dialog.tone === "danger" ? (
            <Trash2 size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
        </div>
        <h3>{dialog.title || "Informasi"}</h3>
        <p>{dialog.message}</p>
        <div className="dialogActions">
          <button className="btn ghost" disabled={busy} onClick={onClose}>
            {isConfirm ? "Batal" : "Tutup"}
          </button>
          {isConfirm && (
            <button
              className={
                "btn " + (dialog.tone === "danger" ? "dangerBtn" : "primary")
              }
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? (
                <>
                  <Spinner />
                  Memproses…
                </>
              ) : (
                dialog.confirmLabel || "Lanjutkan"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function DialogProvider({ children }: any) {
  const [dialog, setDialog] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const close = () => {
    if (!busy) setDialog(null);
  };
  const confirm = async () => {
    if (busy) return;
    const action = dialog?.onConfirm;
    setBusy(true);
    try {
      if (action) await action();
      setDialog((current: any) => (current === dialog ? null : current));
    } catch (e: any) {
      setDialog({
        title: "Proses gagal",
        message: e.message || "Coba lagi.",
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <DialogContext.Provider
      value={{ showDialog: setDialog, closeDialog: close }}
    >
      {children}
      <AppDialog
        dialog={dialog}
        busy={busy}
        onClose={close}
        onConfirm={confirm}
      />
    </DialogContext.Provider>
  );
}

function route() {
  const p = location.pathname;
  if (p.startsWith("/b/")) return { page: "public", slug: p.split("/")[2] };
  return {
    page: p === "/login" ? "login" : p === "/register" ? "register" : "app",
  };
}
function App() {
  const [r, setR] = useState(route());
  useEffect(() => {
    const f = () => setR(route());
    addEventListener("popstate", f);
    return () => removeEventListener("popstate", f);
  }, []);
  const nav = (p: string) => {
    const selected = new URL(p, location.origin).searchParams.get("plan");
    if (selected && ["pro", "business"].includes(selected)) {
      localStorage.setItem("bk_pending_plan", selected);
    } else if (
      p.split("?")[0] === "/register" ||
      p.split("?")[0] === "/login"
    ) {
      localStorage.removeItem("bk_pending_plan");
    }
    history.pushState({}, "", p);
    setR(route());
  };
  const view =
    r.page === "public" ? (
      <PublicBooking slug={r.slug} />
    ) : r.page === "login" ? (
      <div className="authOverlay">
        <Landing nav={nav} />
        <Auth mode="login" nav={nav} modal />
      </div>
    ) : r.page === "register" ? (
      <div className="authOverlay">
        <Landing nav={nav} />
        <Auth mode="register" nav={nav} modal />
      </div>
    ) : token() ? (
      <OwnerApp />
    ) : (
      <Landing nav={nav} />
    );
  return <DialogProvider>{view}</DialogProvider>;
}

function Landing({ nav }: any) {
  const planCards = usePlanCatalog();
  const planIcons: any = { trial: Package, pro: Crown, business: Rocket };
  return (
    <div className="landing">
      <header className="top container">
        <div className="brand">
          <span className="logoMark">
            <CalendarDays size={18} />
          </span>
          <b className="logo">
            Booking<span>Ku</span>
          </b>
        </div>
        <nav>
          <a href="#template">Template</a>
          <a href="#pricing">Harga</a>
        </nav>
        <div className="topActions">
          <button className="btn ghost" onClick={() => nav("/login")}>
            Masuk
          </button>
          <button className="btn primary" onClick={() => nav("/register")}>
            Coba Gratis
          </button>
        </div>
      </header>
      <main>
        <section className="hero container">
          <div className="heroCopy">
            <span className="eyebrow">
              SISTEM BOOKING & ANTRIAN UNTUK SEMUA BISNIS
            </span>
            <h1>
              Kelola Booking
              <br />
              Lebih Mudah,
              <br />
              <em>Bisnis Lebih Teratur</em>
            </h1>
            <p>
              Buat halaman booking sesuai jenis bisnis Anda. Atur layanan,
              jadwal, pegawai, antrian, dan terima booking online 24/7.
            </p>
            <div className="heroBtns">
              <button
                className="btn primary big"
                onClick={() => nav("/register")}
              >
                Coba Gratis 30 Hari <ChevronRight size={18} />
              </button>
              <a href="#pricing" className="btn ghost big">
                Lihat Harga
              </a>
            </div>
            <div className="heroTrust">
              <span>
                <i>
                  <Check size={15} />
                </i>
                Mudah digunakan
              </span>
              <span>
                <i>
                  <Check size={15} />
                </i>
                Tanpa instal aplikasi
              </span>
              <span>
                <i>
                  <Check size={15} />
                </i>
                Bisa diakses web & mobile
              </span>
            </div>
          </div>
          <div className="heroShowcase">
            <div className="showcasePhoto" />
          </div>
        </section>
        <section id="template" className="section container">
          <div className="sectionHead">
            <span className="eyebrow">3 TEMPLATE AWAL</span>
            <h2>Bukan cuma ganti label.</h2>
            <p>Master data dan halaman booking customer benar-benar menyesuaikan.</p>
          </div>
          <div className="templateGrid">
            {Object.entries(meta).map(([k, m]: any) => {
              const I = m.icon;
              return (
                <article className="card templateCard" key={k}>
                  <div className="templateImage">
                    <img src={m.image} alt={m.label} loading="lazy" />
                    <div
                      className="templateIcon"
                      style={{ color: m.accent, background: m.accent + "18" }}
                    >
                      <I size={18} />
                    </div>
                  </div>
                  <div className="templateCardBody">
                    <h3>{m.label}</h3>
                    <p>{m.description}</p>
                    <span className="templateArrow">
                      Lihat template <ChevronRight size={16} />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <section id="pricing" className="pricing section">
          <div className="container">
            <div className="sectionHead center">
              <span className="eyebrow">HARGA TRANSPARAN</span>
              <h2>Mulai dari trial, upgrade saat sudah siap.</h2>
            </div>
            <div className="priceGrid">
              {planCards.map((p) => (
                <article
                  className={
                    "priceCard " + (p.id === "business" ? "featured" : "")
                  }
                  key={p.id}
                >
                  <div className="pricePlanHeading">
                    <div className="pricePlanIcon">
                      {(() => {
                        const PlanIcon = planIcons[p.id] || Package;
                        return <PlanIcon size={20} />;
                      })()}
                    </div>
                    <h3>{p.name}</h3>
                  </div>
                  <div className="bigPrice">
                    {p.price}
                    <small>{p.suffix}</small>
                  </div>
                  <ul>
                    {p.features.map((f) => (
                      <li key={f}>
                        <Check size={16} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="btn primary full"
                    onClick={() =>
                      nav(
                        p.id === "trial"
                          ? "/register"
                          : "/register?plan=" + p.id,
                      )
                    }
                  >
                    {p.id === "trial" ? "Mulai Trial" : "Pilih " + p.name}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Auth({ mode, nav, modal = false }: any) {
  const planCards = usePlanCatalog();
  const queryPlan = new URLSearchParams(location.search).get("plan") || "";
  const initialPlan = queryPlan || (mode === "register" ? "trial" : "");
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [step, setStep] = useState(mode === "register" ? 1 : 3);
  const [form, setForm] = useState<any>({
    name: "",
    email: "",
    password: "",
    business_name: "",
    business_type: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedPlanName =
    planCards.find((plan) => plan.id === selectedPlan)?.name || "";
  const selectedPlanCopy =
    selectedPlan === "trial"
      ? "Akun langsung aktif dengan Free Trial 30 hari. Tidak perlu pembayaran sekarang."
      : `Setelah akun dibuat, kamu akan melanjutkan ke pembayaran paket ${selectedPlanName} di Sandbox SingaPay.`;
  const submit = async () => {
    try {
      setBusy(true);
      setErr("");
      const j = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("bk_token", j.token);
      if (mode === "register") localStorage.removeItem("bk_pending_plan");
      if (mode === "register" && ["pro", "business"].includes(selectedPlan)) {
        location.href = `/?ref=checkout&checkout=${selectedPlan}`;
      } else location.href = "/";
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };
  return (
    <div className={"authPage " + (modal ? "authModalPage" : "")}>
      {!modal && (
        <button className="authLogo" onClick={() => nav("/")}>
          <b className="logo">
            Booking<span>Ku</span>
          </b>
        </button>
      )}
      <div className="authCard">
        {modal && (
          <button className="authClose" onClick={() => nav("/")} aria-label="Tutup">
            <X size={18} />
          </button>
        )}
        {mode === "register" && step === 1 && (
          <>
            <span className="eyebrow">LANGKAH 1 DARI 3</span>
            <h2>Pilih jenis bisnis</h2>
            <p className="muted">
              BookingKu tidak akan membuat layanan, paket, lapangan, staff, atau
              harga contoh. Semua data setelah daftar berasal dari yang kamu isi
              sendiri.
            </p>
            <div className="businessPick">
              {Object.entries(meta).map(([k, m]: any) => {
                const I = m.icon;
                return (
                  <button
                    className={form.business_type === k ? "selected" : ""}
                    onClick={() => setForm({ ...form, business_type: k })}
                    key={k}
                  >
                    <I />
                    <span>
                      <b>{m.label}</b>
                      <small>
                        {k === "salon"
                          ? "Layanan & stylist"
                          : k === "sports_court"
                            ? "Olahraga & lapangan"
                            : "Paket, studio & galeri"}
                      </small>
                    </span>
                    <Check />
                  </button>
                );
              })}
            </div>
            <button
              className="btn primary full"
              disabled={!form.business_type}
              onClick={() => setStep(2)}
            >
              Lanjut
            </button>
          </>
        )}
        {mode === "register" && step === 2 && (
          <>
            <span className="eyebrow">LANGKAH 2 DARI 3</span>
            <h2>
              {selectedPlan === "trial"
                ? "Mulai 30 hari gratis"
                : `Paket ${selectedPlanName}`}
            </h2>
            <p className="muted">{selectedPlanCopy}</p>
            <div className="authPlans">
              {planCards.map((p) => (
                <button
                  type="button"
                  className={
                    "authPlan " + (selectedPlan === p.id ? "selected" : "")
                  }
                  key={p.id}
                  onClick={() => {
                    setSelectedPlan(p.id);
                    if (["pro", "business"].includes(p.id))
                      localStorage.setItem("bk_pending_plan", p.id);
                    else localStorage.removeItem("bk_pending_plan");
                  }}
                >
                  <div>
                    <b>{p.name}</b>
                    {selectedPlan === p.id && <small>Dipilih</small>}
                  </div>
                  <strong>
                    {p.price}
                    <small>{p.suffix}</small>
                  </strong>
                </button>
              ))}
            </div>
            <div className="row">
              <button className="btn ghost" onClick={() => setStep(1)}>
                Kembali
              </button>
              <button className="btn primary" onClick={() => setStep(3)}>
                Lanjut
              </button>
            </div>
          </>
        )}
        {(mode === "login" || step === 3) && (
          <>
            <span className="eyebrow">
              {mode === "login" ? "SELAMAT DATANG" : "LANGKAH 3 DARI 3"}
            </span>
            <h2>
              {mode === "login" ? "Masuk ke BookingKu" : "Buat akun bisnis"}
            </h2>
            {mode === "register" && (
              <>
                <label>
                  Nama kamu
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  Nama bisnis
                  <input
                    value={form.business_name}
                    onChange={(e) =>
                      setForm({ ...form, business_name: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            {err && <div className="error">{err}</div>}
            <button
              className="btn primary full"
              disabled={busy}
              onClick={submit}
            >
              {busy ? (
                <>
                  <Spinner />
                  Memproses…
                </>
              ) : mode === "login" ? (
                "Masuk"
              ) : selectedPlanName ? (
                `Buat akun & bayar paket ${selectedPlanName}`
              ) : (
                "Aktifkan Trial 30 Hari"
              )}
            </button>
            <p className="authSwitch">
              {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button
                type="button"
                onClick={() => nav(mode === "login" ? "/register" : "/login")}
              >
                {mode === "login" ? "Daftar sekarang" : "Masuk"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function PlatformAdmin() {
  const [plans, setPlans] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = async () => {
    try {
      setError("");
      const result = await api("/api/platform/plans");
      setPlans(result.plans || []);
      setSelected((current: any) => current || result.plans?.[0] || null);
    } catch (e: any) {
      setError(e.message || "Paket tidak dapat dimuat.");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const update = (key: string, value: any) =>
    setSelected((current: any) => ({ ...current, [key]: value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      setSaving(true);
      setError("");
      const result = await api(`/api/platform/plans/${selected.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...selected,
          price: Number(onlyDigits(selected.price)),
          booking_limit:
            selected.booking_limit === "" || selected.booking_limit === null
              ? null
              : Number(selected.booking_limit),
          features: String(selected.featuresText || "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      setPlans((current) =>
        current.map((plan) =>
          plan.id === result.plan.id ? result.plan : plan,
        ),
      );
      setSelected({
        ...result.plan,
        price: String(result.plan.price),
        featuresText: (result.plan.features || []).join("\n"),
      });
    } catch (e: any) {
      setError(e.message || "Paket gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };
  const choose = (plan: any) =>
    setSelected({
      ...plan,
      price: String(plan.price),
      featuresText: (plan.features || []).join("\n"),
    });
  const logout = () => {
    localStorage.removeItem("bk_token");
    location.reload();
  };
  return (
    <div className="platformPage">
      <header className="platformHeader">
        <div>
          <b className="logo">
            Booking<span>Ku</span>
          </b>
          <small>Admin Pusat</small>
        </div>
        <button className="btn ghost small" onClick={logout}>
          <LogOut size={15} /> Keluar
        </button>
      </header>
      <main className="platformContent">
        <div className="pageTitle platformTitleBlock">
          <div>
            <span className="eyebrow">KONTROL PRODUK</span>
            <h1>Paket & hak akses</h1>
            <p>
              Atur harga, batas booking, fitur, dan ketersediaan tanpa mengubah
              script.
            </p>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="platformGrid">
          <section className="panel platformPlanList">
            <div className="panelHeading">
              <div>
                <b>Daftar paket</b>
                <span>Pilih paket yang ingin diatur.</span>
              </div>
            </div>
            {plans.map((plan) => (
              <button
                type="button"
                key={plan.id}
                className={selected?.id === plan.id ? "selected" : ""}
                onClick={() => choose(plan)}
              >
                <span>
                  <b>{plan.name}</b>
                  <small>{plan.id.toUpperCase()}</small>
                </span>
                <strong>{money(plan.price)}</strong>
              </button>
            ))}
          </section>
          {selected && (
            <form className="panel platformEditor" onSubmit={save}>
              <div className="panelHeading">
                <div>
                  <b>Edit paket {selected.name}</b>
                  <span>Tersimpan ke database dan dipakai oleh aplikasi.</span>
                </div>
                <span
                  className={
                    selected.available ? "statusPill active" : "statusPill"
                  }
                >
                  {selected.available ? "Aktif" : "Disembunyikan"}
                </span>
              </div>
              <div className="platformFields">
                <label>
                  Nama paket
                  <input
                    value={selected.name || ""}
                    onChange={(e) => update("name", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Harga
                  <RupiahInput
                    value={selected.price}
                    onChange={(value: string) => update("price", value)}
                  />
                </label>
                <label>
                  Siklus tagihan
                  <input
                    value={selected.billing_cycle || ""}
                    onChange={(e) => update("billing_cycle", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Durasi (hari)
                  <input
                    type="number"
                    min="1"
                    value={selected.duration_days || 30}
                    onChange={(e) =>
                      update("duration_days", Number(e.target.value))
                    }
                  />
                </label>
                <label>
                  Batas booking / bulan
                  <input
                    inputMode="numeric"
                    value={selected.booking_limit ?? ""}
                    placeholder="Kosong = unlimited"
                    onChange={(e) => update("booking_limit", e.target.value)}
                  />
                </label>
                <label className="platformCheckbox">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.available)}
                    onChange={(e) => update("available", e.target.checked)}
                  />{" "}
                  Paket dapat dipilih customer
                </label>
              </div>
              <label>
                Deskripsi
                <textarea
                  rows={3}
                  value={selected.description || ""}
                  onChange={(e) => update("description", e.target.value)}
                />
              </label>
              <label>
                Fitur, satu per baris
                <textarea
                  rows={5}
                  value={
                    selected.featuresText ??
                    (selected.features || []).join("\n")
                  }
                  onChange={(e) => update("featuresText", e.target.value)}
                />
              </label>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner /> Menyimpan…
                  </>
                ) : (
                  <>
                    <Check size={16} /> Simpan aturan paket
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function OwnerApp() {
  const [business, setBusiness] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const [page, setPage] = useState(
    new URLSearchParams(location.search).get("ref") ? "plans" : "dashboard",
  );
  const [drawer, setDrawer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const logout = () => {
    localStorage.removeItem("bk_token");
    location.reload();
  };
  const load = async () => {
    try {
      const m = await api("/api/me");
      if (m.platform_admin) {
        setPlatformAdmin(true);
        return;
      }
      const [c, b] = await Promise.all([
        api("/api/catalog"),
        api("/api/bookings"),
      ]);
      setBusiness(m.business);
      setItems(c.items);
      setBookings(b.bookings);
    } catch {
      localStorage.removeItem("bk_token");
      location.reload();
    }
  };
  useEffect(() => {
    load();
  }, []);
  if (platformAdmin) return <PlatformAdmin />;
  if (!business) return <div className="loading">Memuat BookingKu…</div>;
  const m = meta[business.business_type];
  const navs = [
    ["dashboard", "Dashboard", CalendarDays],
    ["booking", "Booking", BookOpen],
    [
      "master",
      business.business_type === "salon"
        ? "Layanan & Staff"
        : business.business_type === "sports_court"
          ? "Olahraga & Lapangan"
          : "Paket, Studio & Add-on",
      m.icon,
    ],
    ["settings", "Tampilan & Pengaturan", Settings2],
    ["plans", "Paket & Langganan", CreditCard],
  ];
  return (
    <div className={"shell " + (sidebarCollapsed ? "sidebarCollapsed" : "")}>
      <aside className={"sidebar " + (drawer ? "open" : "")}>
        <div className="sideHead">
          <div className="brand">
            <span className="logoMark">
              <CalendarDays size={18} />
            </span>
            <b className="logo">
              Booking<span>Ku</span>
            </b>
          </div>
          <button className="iconBtn mobile" onClick={() => setDrawer(false)}>
            <X />
          </button>
        </div>
        <div className="bizBadge">
          <div style={{ background: m.accent }}>{business.name?.[0]}</div>
          <span>
            <b>{business.name}</b>
            <small>{m.label}</small>
          </span>
          <ChevronDown size={16} />
        </div>
        <nav>
          {navs.map(([id, label, I]: any) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => {
                setPage(id);
                setDrawer(false);
              }}
            >
              <I size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="appTop">
          <button className="iconBtn mobile" onClick={() => setDrawer(true)}>
            <Menu />
          </button>
          <button
            className="iconBtn sidebarToggle"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            title={sidebarCollapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
          >
            {sidebarCollapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
          </button>
          <div className="appTopContext">
            <small>{m.label}</small>
            <b>{business.name}</b>
          </div>
          <div className="appTopActions">
            <a
              className="btn ghost small previewAction"
              href={"/b/" + business.slug}
              target="_blank"
            >
              Preview <ExternalLink size={14} />
            </a>
            <div className={"profileMenu " + (profileOpen ? "open" : "")}>
              <button
                className="profileAction"
                aria-label="Profil akun"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((v) => !v)}
              >
                {business.name?.[0]?.toUpperCase() || "B"}
              </button>
              <button
                className="profileChevron"
                aria-label="Buka menu akun"
                onClick={() => setProfileOpen((v) => !v)}
              >
                <ChevronDown size={15} />
              </button>
              {profileOpen && (
                <div className="profileDropdown">
                  <div className="profileDropdownInfo">
                    <b>{business.name}</b>
                    <small>{m.label}</small>
                  </div>
                  <button className="profileLogout" onClick={logout}>
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {page === "dashboard" && (
          <Dashboard
            business={business}
            items={items}
            bookings={bookings}
            go={setPage}
          />
        )}{" "}
        {page === "booking" && (
          <BookingList bookings={bookings} reload={load} />
        )}{" "}
        {page === "master" && (
          <Master business={business} items={items} reload={load} />
        )}{" "}
        {page === "settings" && <Settings business={business} reload={load} />}{" "}
        {page === "plans" && <Plans business={business} />}
      </main>
    </div>
  );
}

const bookingStatusLabel = (status = "") =>
  (
    ({
      confirmed: "Terkonfirmasi",
      pending_payment: "Menunggu pembayaran",
      pending: "Menunggu",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    }) as any
  )[status] ||
  status ||
  "Belum ada status";
const bookingStatusClass = (status = "") =>
  status === "cancelled"
    ? "cancelled"
    : status === "pending_payment" || status === "pending"
      ? "waiting"
      : status === "completed"
        ? "completed"
        : "confirmed";
const localDateKey = (value: any = new Date()) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
const relativeDayLabel = (value: any, reference = new Date()) => {
  const target = new Date(value);
  const base = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  const day = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const diff = Math.round((day.getTime() - base.getTime()) / 86400000);
  return diff === 0
    ? "Hari ini"
    : diff === 1
      ? "Besok"
      : diff > 1
        ? `H+${diff}`
        : diff === -1
          ? "Kemarin"
          : `${Math.abs(diff)} hari lalu`;
};
function BusinessLinkCard({ business }: any) {
  const [copied, setCopied] = useState(false);
  const publicUrl = new URL(`/b/${business.slug}`, window.location.origin).toString();
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = publicUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <section className="businessLinkCard">
      <div className="businessLinkIcon">
        <Link2 size={19} />
      </div>
      <div className="businessLinkContent">
        <span className="eyebrow">LINK HALAMAN CUSTOMER</span>
        <b>{business.name}</b>
        <span>{publicUrl}</span>
      </div>
      <button className="btn ghost small" onClick={copyLink}>
        <Copy size={15} />
        {copied ? "Tersalin" : "Salin link"}
      </button>
    </section>
  );
}
function Dashboard({ business, items, bookings, go }: any) {
  const primaryKind =
    business.business_type === "salon"
      ? "service"
      : business.business_type === "sports_court"
        ? "resource"
        : "package";
  const primaryCount = items.filter((x: any) => x.kind === primaryKind).length;
  const hoursReady = Object.values(business.opening_hours || {}).some(
    (h: any) => h.open,
  );
  const checklist = [
    {
      ok: !!business.cover_image,
      label: "Upload cover bisnis",
      page: "settings",
    },
    {
      ok:
        business.business_type !== "photo_studio" ||
        (business.gallery || []).length > 0,
      label: "Tambah galeri bisnis",
      page: "settings",
    },
    {
      ok: primaryCount > 0,
      label:
        business.business_type === "photo_studio"
          ? "Buat paket pertama"
          : business.business_type === "sports_court"
            ? "Buat lapangan pertama"
            : "Buat layanan pertama",
      page: "master",
    },
    { ok: hoursReady, label: "Atur jam operasional", page: "settings" },
  ];
  const done = checklist.filter((x) => x.ok).length;
  const now = new Date();
  const todayKey = localDateKey(now);
  const monthKey = todayKey.slice(0, 7);
  const active = bookings.filter((b: any) => b.status !== "cancelled");
  const today = active.filter(
    (b: any) => localDateKey(b.start_at) === todayKey,
  );
  const month = active.filter(
    (b: any) => localDateKey(b.start_at).slice(0, 7) === monthKey,
  );
  const revenue = month.reduce(
    (sum: number, b: any) => sum + Number(b.total_price || 0),
    0,
  );
  const waiting = bookings.filter(
    (b: any) => b.status === "pending_payment" || b.status === "pending",
  ).length;
  const upcoming = active
    .filter((b: any) => {
      const start = new Date(b.start_at);
      return !Number.isNaN(start.getTime()) && start >= now;
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    )
    .slice(0, 5);
  const recentPast = active
    .filter((b: any) => {
      const start = new Date(b.start_at);
      return !Number.isNaN(start.getTime()) && start < now;
    })
    .sort(
      (a: any, b: any) =>
        new Date(b.start_at).getTime() - new Date(a.start_at).getTime(),
    )
    .slice(0, 5);
  const scheduleItems = upcoming.length ? upcoming : recentPast;
  const stats = [
    {
      label: "Booking hari ini",
      value: today.length,
      icon: CalendarDays,
      color: "purple",
      tag: "Hari ini",
      note: "Sesi terjadwal",
    },
    {
      label: "Booking bulan ini",
      value: month.length,
      icon: BookOpen,
      color: "blue",
      tag: "Bulan berjalan",
      note: "Data aktual bisnis",
    },
    {
      label: "Pendapatan bulan ini",
      value: money(revenue),
      icon: WalletCards,
      color: "green",
      tag: "Booking aktif",
      note: "Total pendapatan",
    },
    {
      label: "Menunggu pembayaran",
      value: waiting,
      icon: Clock3,
      color: "orange",
      tag: "Perlu dicek",
      note: "Status pembayaran",
    },
  ];
  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (6 - index),
    );
    const key = localDateKey(day);
    const dayBookings = active.filter(
      (b: any) => localDateKey(b.start_at) === key,
    );
    return {
      key,
      label: day
        .toLocaleDateString("id-ID", { weekday: "short" })
        .replace(".", ""),
      date: day.getDate(),
      count: dayBookings.length,
      revenue: dayBookings.reduce(
        (sum: number, b: any) => sum + Number(b.total_price || 0),
        0,
      ),
    };
  });
  const maxChartCount = Math.max(...chartDays.map((day) => day.count), 1);
  const chartTotal = chartDays.reduce((sum, day) => sum + day.count, 0);
  const statusSummary = [
    {
      label: "Selesai",
      value: active.filter((b: any) => b.status === "completed").length,
      color: "#4c7df0",
    },
    {
      label: "Terkonfirmasi",
      value: active.filter((b: any) => b.status === "confirmed").length,
      color: "#6d4aff",
    },
    {
      label: "Menunggu",
      value: active.filter((b: any) =>
        ["pending_payment", "pending"].includes(b.status),
      ).length,
      color: "#f5ad35",
    },
    {
      label: "Dibatalkan",
      value: bookings.filter((b: any) => b.status === "cancelled").length,
      color: "#ef6262",
    },
  ];
  const statusTotal = statusSummary.reduce((sum, item) => sum + item.value, 0);
  let statusCursor = 0;
  const statusGradient = statusTotal
    ? statusSummary
        .map((item) => {
          const start = statusCursor;
          statusCursor += (item.value / statusTotal) * 100;
          return (
            item.color +
            " " +
            start +
            "% " +
            statusCursor +
            "%"
          );
        })
        .join(", ")
    : "#e9eaf2 0 100%";
  return (
    <div className="content">
      <div className="pageTitle adminTitle">
        <div>
          <span className="eyebrow">DASHBOARD</span>
          <h1>Ringkasan aktivitas bisnis</h1>
          <p>
            Pantau booking, pendapatan, dan kesiapan halaman customer dalam satu
            tampilan.
          </p>
        </div>
      </div>
      <BusinessLinkCard business={business} />
      <div className="adminStats">
        {stats.map((stat: any) => {
          const I = stat.icon;
          return (
          <div className={"adminStat " + stat.color} key={stat.label}>
            <div className="adminStatIcon">
              <I size={19} />
            </div>
            <div className="adminStatBody">
              <small>{stat.label}</small>
              <div className="adminStatValue">
                <b>{stat.value}</b>
                <span className="adminStatTag">{stat.tag}</span>
              </div>
              <span>{stat.note}</span>
            </div>
          </div>
          );
        })}
      </div>
      <section className="panel trendPanel">
        <div className="panelHeading">
          <div>
            <span className="eyebrow">7 HARI TERAKHIR</span>
            <h2>Tren booking harian</h2>
            <p className="muted">
              Booking aktif berdasarkan tanggal sesi customer.
            </p>
          </div>
          <div className="trendTotal">
            <b>{chartTotal}</b>
            <span>booking</span>
          </div>
        </div>
        <div
          className="trendChart"
          aria-label="Grafik booking tujuh hari terakhir"
        >
          {chartDays.map((day) => (
            <div
              className="trendColumn"
              key={day.key}
              title={`${day.count} booking · ${money(day.revenue)}`}
            >
              <b className="trendValue">{day.count || ""}</b>
              <div className="trendTrack">
                <span
                  style={{
                    height: `${Math.max((day.count / maxChartCount) * 100, day.count ? 12 : 4)}%`,
                  }}
                />
              </div>
              <small>{day.label}</small>
              <small>{day.date}</small>
            </div>
          ))}
        </div>
        <div className="trendNote">
          <span>
            <span className="trendDot" />
            Jumlah booking per tanggal
          </span>
          <span>
            Pendapatan 7 hari:{" "}
            <b>{money(chartDays.reduce((sum, day) => sum + day.revenue, 0))}</b>
          </span>
        </div>
      </section>
      <div className="adminGrid">
        <section className="panel recentPanel">
          <div className="panelHeading">
            <div>
              <span className="eyebrow">
                {upcoming.length ? "BOOKING MENDATANG" : "BOOKING TERBARU"}
              </span>
              <h2>
                {upcoming.length ? "Jadwal terdekat" : "Booking terakhir"}
              </h2>
            </div>
            <button className="textAction" onClick={() => go("booking")}>
              Lihat semua <ChevronRight size={15} />
            </button>
          </div>
          {scheduleItems.length === 0 ? (
            <Empty
              title="Belum ada jadwal"
              text="Booking customer yang akan datang akan tampil di sini."
            />
          ) : (
            <div className="recentBookings">
              {scheduleItems.map((b: any) => (
                <div className="recentBooking" key={b._id}>
                  <div className="dateBadge">
                    <b>
                      {new Date(b.start_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                      })}
                    </b>
                    <small>
                      {new Date(b.start_at).toLocaleDateString("id-ID", {
                        month: "short",
                      })}
                    </small>
                  </div>
                  <div className="recentBookingMain">
                    <b>{b.customer_name}</b>
                    <span>
                      {relativeDayLabel(b.start_at)} ·{" "}
                      {b.selection_name || "Booking"} ·{" "}
                      {new Date(b.start_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span className={"status " + bookingStatusClass(b.status)}>
                    {bookingStatusLabel(b.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel statusSummaryPanel">
          <div className="panelHeading">
            <div>
              <span className="eyebrow">RINGKASAN</span>
              <h2>Status booking</h2>
            </div>
          </div>
          <div className="statusSummaryBody">
            <div
              className="statusDonut"
              style={{ background: "conic-gradient(" + statusGradient + ")" }}
            >
              <div>
                <b>{statusTotal}</b>
                <span>Total</span>
              </div>
            </div>
            <div className="statusLegend">
              {statusSummary.map((item) => (
                <div key={item.label}>
                  <span>
                    <i style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <b>{item.value}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="panel setupPanel adminSetup">
          <div>
            <span className="eyebrow">SETUP BISNIS</span>
            <h2>Lengkapi halaman customer</h2>
            <p className="muted">
              Data awal sengaja kosong. Isi hanya yang memang dimiliki bisnismu.
            </p>
          </div>
          <div className="setupProgress">
            <div>
              <b>
                {done}/{checklist.length}
              </b>
              <span>langkah selesai</span>
            </div>
            <div className="progressTrack">
              <span style={{ width: `${(done / checklist.length) * 100}%` }} />
            </div>
            <div className="setupList">
              {checklist.map((x, i) => (
                <button
                  key={i}
                  onClick={() => go(x.page)}
                  className={x.ok ? "done" : ""}
                >
                  <span>{x.ok ? <Check size={16} /> : i + 1}</span>
                  <b>{x.label}</b>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </div>
      </section>
    </div>
  );
}
function BookingList({ bookings, reload }: any) {
  const { showDialog } = useDialog();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const filtered = useMemo(
    () =>
      bookings.filter((b: any) => {
        const haystack =
          `${b.code || ""} ${b.customer_name || ""} ${b.customer_phone || ""} ${b.selection_name || ""}`.toLowerCase();
        const statusMatch =
          status === "all" ||
          (status === "waiting"
            ? ["pending_payment", "pending"].includes(b.status)
            : b.status === status);
        return (
          (!query || haystack.includes(query.toLowerCase())) &&
          statusMatch &&
          (!date || String(b.start_at).slice(0, 10) === date)
        );
      }),
    [bookings, query, status, date],
  );
  const total = bookings.length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = bookings.filter(
    (b: any) => String(b.start_at).slice(0, 10) === todayKey,
  ).length;
  const waiting = bookings.filter(
    (b: any) => b.status === "pending_payment" || b.status === "pending",
  ).length;
  const done = bookings.filter(
    (b: any) => b.status === "completed" || b.status === "confirmed",
  ).length;
  const cancelled = bookings.filter((b: any) => b.status === "cancelled").length;
  const statusTabs = [
    ["all", "Semua", total],
    ["confirmed", "Terkonfirmasi", bookings.filter((b: any) => b.status === "confirmed").length],
    ["waiting", "Menunggu", waiting],
    ["completed", "Selesai", bookings.filter((b: any) => b.status === "completed").length],
    ["cancelled", "Dibatalkan", cancelled],
  ];
  const showDetail = (booking: any) => {
    showDialog({
      title: "Detail booking " + (booking.code || ""),
      message:
        (booking.customer_name || "Customer") +
        " · " +
        (booking.selection_name || "Booking") +
        "\n" +
        new Date(booking.start_at).toLocaleDateString("id-ID", {
          dateStyle: "full",
        }) +
        "\n" +
        new Date(booking.start_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " - " +
        new Date(booking.end_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        "\nTotal: " +
        money(booking.total_price) +
        "\nStatus: " +
        bookingStatusLabel(booking.status),
    });
  };
  const changeStatus = (booking: any, next: string) => {
    const actionLabel =
      next === "confirmed"
        ? "Konfirmasi pembayaran"
        : next === "completed"
          ? "Tandai selesai"
          : "Batalkan booking";
    const message =
      next === "cancelled"
        ? "Booking ini akan dibatalkan dan slotnya bisa dipakai customer lain."
        : next === "completed"
          ? "Booking akan ditandai selesai setelah layanan diberikan."
          : "Pastikan pembayaran customer sudah diterima sebelum mengonfirmasi booking.";
    showDialog({
      title: actionLabel + "?",
      message,
      confirm: true,
      confirmLabel: actionLabel,
      tone: next === "cancelled" ? "danger" : "default",
      onConfirm: async () => {
        try {
          await api("/api/bookings/" + booking._id + "/status", {
            method: "PATCH",
            body: JSON.stringify({ status: next }),
          });
          await reload();
        } catch (e: any) {
          showDialog({
            title: "Status belum berubah",
            message: e.message || "Coba lagi.",
          });
        }
      },
    });
  };
  const actionButtons = (b: any) => {
    if (b.status === "cancelled" || b.status === "completed")
      return (
        <div className="bookingActions">
          <button
            className="rowAction detailAction"
            onClick={() => showDetail(b)}
          >
            Detail
          </button>
        </div>
      );
    return (
      <div className="bookingActions">
        <button
          className="rowAction detailAction"
          onClick={() => showDetail(b)}
        >
          Detail
        </button>
        {(b.status === "pending_payment" || b.status === "pending") && (
          <button
            className="rowAction primaryAction"
            onClick={() => changeStatus(b, "confirmed")}
          >
            Konfirmasi
          </button>
        )}
        {b.status === "confirmed" && (
          <button
            className="rowAction primaryAction"
            onClick={() => changeStatus(b, "completed")}
          >
            Selesai
          </button>
        )}
        <button
          className="rowAction dangerAction"
          onClick={() => changeStatus(b, "cancelled")}
        >
          Batalkan
        </button>
      </div>
    );
  };
  return (
    <div className="content">
      <div className="pageTitle adminTitle">
        <div>
          <span className="eyebrow">BOOKING</span>
          <h1>Kelola booking customer</h1>
          <p>
            Lihat jadwal, status pembayaran, dan detail customer yang masuk dari
            halaman publik.
          </p>
        </div>
      </div>
      <div className="bookingStats">
        <div>
          <small>Total booking</small>
          <b>{total}</b>
        </div>
        <div>
          <small>Hari ini</small>
          <b>{today}</b>
        </div>
        <div>
          <small>Menunggu</small>
          <b>{waiting}</b>
        </div>
        <div>
          <small>Aktif / selesai</small>
          <b>{done}</b>
        </div>
      </div>
      <div className="bookingTabs">
        {statusTabs.map(([id, label, count]: any) => (
          <button
            key={id}
            className={status === id ? "active" : ""}
            onClick={() => setStatus(id)}
          >
            {label} <span>{count}</span>
          </button>
        ))}
      </div>
      <section className="panel bookingPanel">
        <div className="bookingToolbar">
          <div className="searchField">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode, nama, WhatsApp, atau layanan"
            />
          </div>
          <div className="filterField">
            <SlidersHorizontal size={16} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Semua status</option>
              <option value="confirmed">Terkonfirmasi</option>
              <option value="waiting">Menunggu pembayaran</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
          <input
            className="dateField"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {(query || date || status !== "all") && (
            <button
              className="btn ghost small"
              onClick={() => {
                setQuery("");
                setDate("");
                setStatus("all");
              }}
            >
              Reset
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <Empty
            title={
              bookings.length === 0
                ? "Belum ada booking"
                : "Booking tidak ditemukan"
            }
            text={
              bookings.length === 0
                ? "Booking customer akan muncul di sini setelah halaman publik digunakan."
                : "Coba ubah kata kunci atau filter pencarian."
            }
          />
        ) : (
          <>
            <div className="bookingTableHeader">
              <span>Kode</span>
              <span>Nama customer</span>
              <span>Tanggal & waktu</span>
              <span>Layanan</span>
              <span>Total</span>
              <span>Status</span>
              <span>Aksi</span>
            </div>
            <div className="bookingTable richTable">
              {filtered.map((b: any) => (
                <div className="bookingRow" key={b._id}>
                  <div className="bookingCell bookingCodeCell">
                    <b>{b.code}</b>
                  </div>
                  <div className="bookingCell bookingMain">
                    <b>{b.customer_name}</b>
                    <small>{b.customer_phone || "WhatsApp belum diisi"}</small>
                  </div>
                  <div className="bookingCell">
                    <b>
                      {new Date(b.start_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </b>
                    <small>
                      {new Date(b.start_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(b.end_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                  <div className="bookingCell">
                    <b>{b.selection_name || "Booking"}</b>
                    <small>
                      {b.business_type === "photo_studio"
                        ? "Studio Foto"
                        : b.business_type === "sports_court"
                          ? "Lapangan Olahraga"
                          : "Salon / Barbershop"}
                    </small>
                  </div>
                  <div className="bookingCell">
                    <b>{money(b.total_price)}</b>
                    <small>
                      {b.payment_status === "paid"
                        ? "Sudah dibayar"
                        : b.payment_status === "pending"
                          ? "Menunggu pembayaran"
                          : "—"}
                    </small>
                  </div>
                  <div className="bookingStatusCell">
                    <span className={"status " + bookingStatusClass(b.status)}>
                      {bookingStatusLabel(b.status)}
                    </span>
                    <small>
                      {b.payment_method === "QRIS_TEST"
                        ? "Simulasi QRIS"
                        : b.payment_method === "MANUAL_CONFIRMATION"
                          ? "Dikonfirmasi admin"
                          : ""}
                    </small>
                  </div>
                  <div className="bookingActionCell">{actionButtons(b)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
function Empty({ title, text }: any) {
  return (
    <div className="empty">
      <div>
        <Sparkles />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function readImage(
  file: File,
  onDone: (v: string) => void,
  onError?: (message: string) => void,
) {
  if (file.size > 3 * 1024 * 1024) {
    onError?.("Maksimal 3 MB per foto untuk prototype.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onDone(String(reader.result));
  reader.readAsDataURL(file);
}
function FileDrop({ value, onChange, label = "Drop foto di sini" }: any) {
  const { showDialog } = useDialog();
  const fail = (message: string) =>
    showDialog({ title: "Foto belum bisa dipakai", message });
  return (
    <label
      className="drop"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) readImage(f, onChange, fail);
      }}
    >
      {value ? (
        <>
          <img src={value} />
          <span className="changeImg">Ganti foto</span>
        </>
      ) : (
        <>
          <UploadCloud />
          <b>{label}</b>
          <span>Drag & drop atau klik · JPG/PNG/WebP</span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) readImage(f, onChange, fail);
          e.currentTarget.value = "";
        }}
      />
      {value && (
        <button
          type="button"
          className="removeImg"
          onClick={(e) => {
            e.preventDefault();
            onChange("");
          }}
        >
          Hapus
        </button>
      )}
    </label>
  );
}
function GalleryDrop({ value = [], onChange }: any) {
  const { showDialog } = useDialog();
  const [drag, setDrag] = useState<number | null>(null);
  const fail = (message: string) =>
    showDialog({ title: "Foto belum bisa dipakai", message });
  const addFiles = (files: FileList | File[]) =>
    Array.from(files).forEach((f) =>
      readImage(f, (v) => onChange([...(value || []), v]), fail),
    );
  const move = (from: number, to: number) => {
    if (from === to) return;
    const arr = [...value];
    const [x] = arr.splice(from, 1);
    arr.splice(to, 0, x);
    onChange(arr);
  };
  return (
    <div className="galleryEditor">
      <label
        className="galleryDrop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud />
        <b>Drop beberapa foto galeri di sini</b>
        <span>
          Foto ini berbeda dari foto paket. Bisa drag banyak file sekaligus.
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </label>
      {value.length > 0 && (
        <div className="galleryGridEditor">
          {value.map((src: string, i: number) => (
            <div
              className="galleryEditItem"
              key={i}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag !== null) move(drag, i);
                setDrag(null);
              }}
            >
              <img src={src} />
              <span className="drag">
                <GripVertical size={16} />
              </span>
              <label className="galleryReplace">
                Ganti
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      readImage(file, (nextSrc) => {
                        const next = [...value];
                        next[i] = nextSrc;
                        onChange(next);
                      }, fail);
                    }
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <button
                onClick={() =>
                  onChange(value.filter((_: any, j: number) => j !== i))
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const masterTabs: any = {
  salon: [
    ["service", "Layanan"],
    ["staff", "Staff / Stylist"],
  ],
  sports_court: [
    ["sport", "Jenis Olahraga"],
    ["resource", "Lapangan"],
  ],
  photo_studio: [
    ["package", "Paket Foto"],
    ["resource", "Studio / Room"],
    ["addon", "Add-on"],
  ],
};

function Master({ business, items, reload }: any) {
  const { showDialog } = useDialog();
  const tabs = masterTabs[business.business_type];
  const [tab, setTab] = useState(tabs[0][0]);
  const [editing, setEditing] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setTab(tabs[0][0]);
    setEditing(null);
    setFormOpen(false);
  }, [business.business_type]);
  const blank: any = {
    kind: tab,
    name: "",
    description: "",
    image: "",
    duration_min: "",
    price: "",
    price_per_hour: "",
    duration_options: "",
    weekday_price: "",
    weekend_price: "",
    base_people: "",
    sport: "",
    location: "",
    unit_price: "",
    unit_label: "",
    active: true,
  };
  const [form, setForm] = useState<any>(blank);
  useEffect(() => {
    setForm({ ...blank, kind: tab });
    setEditing(null);
    setFormOpen(false);
  }, [tab]);
  const list = items.filter((x: any) => x.kind === tab);
  const startEdit = (item: any) => {
    setEditing(item);
    setFormOpen(true);
    setForm({
      ...item,
      kind: tab,
      duration_options: Array.isArray(item.duration_options)
        ? item.duration_options.join(", ")
        : item.duration_options || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => {
    setEditing(null);
    setForm({ ...blank, kind: tab });
    setFormOpen(false);
  };
  const openCreate = () => {
    setEditing(null);
    setForm({ ...blank, kind: tab });
    setFormOpen(true);
  };
  const save = async () => {
    if (!form.name) {
      showDialog({
        title: "Data belum lengkap",
        message: "Nama wajib diisi. Setelah itu data bisa disimpan.",
      });
      return;
    }
    try {
      setBusy(true);
      const body: any = { ...form };
      delete body._id;
      delete body.business_id;
      delete body.created_at;
      delete body.updated_at;
      [
        "duration_min",
        "price",
        "price_per_hour",
        "weekday_price",
        "weekend_price",
        "base_people",
        "unit_price",
      ].forEach((k) => {
        if (body[k] !== "" && body[k] != null) body[k] = Number(body[k]);
        else delete body[k];
      });
      if (business.business_type === "sports_court" && tab === "resource") {
        const durations = String(body.duration_options || "")
          .split(",")
          .map((v: string) => Number(v.trim()))
          .filter((n: number) => Number.isFinite(n) && n >= 15 && n <= 1440);
        if (durations.length)
          body.duration_options = Array.from(new Set(durations));
        else delete body.duration_options;
      }
      await api(editing ? `/api/catalog/${editing._id}` : "/api/catalog", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      const wasEditing = Boolean(editing);
      cancelEdit();
      await reload();
      showDialog({
        title: wasEditing ? "Perubahan tersimpan" : "Data tersimpan",
        message: wasEditing
          ? "Data berhasil diperbarui."
          : "Data berhasil ditambahkan.",
      });
    } catch (e: any) {
      showDialog({
        title: "Data belum tersimpan",
        message: e.message || "Coba lagi.",
      });
    } finally {
      setBusy(false);
    }
  };
  const del = async (id: string) => {
    showDialog({
      title: "Hapus data?",
      message:
        "Data ini akan dihapus dari bisnis dan tidak tampil lagi di halaman customer.",
      confirm: true,
      confirmLabel: "Hapus",
      tone: "danger",
      onConfirm: async () => {
        await api("/api/catalog/" + id, { method: "DELETE" });
        await reload();
      },
    });
  };
  return (
    <div className="content">
      <div className="pageTitle">
        <div>
          <span className="eyebrow">MASTER DATA</span>
          <h1>{meta[business.business_type].label}</h1>
          <p>
            Kelola data yang tersedia untuk customer di halaman booking.
          </p>
        </div>
        <button className="btn primary" onClick={openCreate}>
          <Plus size={16} />
          Tambah {tabs.find((x: any) => x[0] === tab)?.[1]}
        </button>
      </div>
      <div className="tabs">
        {tabs.map(([id, label]: any) => (
          <button
            className={tab === id ? "active" : ""}
            key={id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {formOpen && (
        <div
          className="masterFormBackdrop"
          onMouseDown={(e) => e.target === e.currentTarget && cancelEdit()}
        >
          <section className="panel formPanel masterFormModal">
            <div className="masterFormHeader">
              <div>
                <span className="eyebrow">{editing ? "EDIT DATA" : "DATA BARU"}</span>
                <h2>
                  {editing ? "Edit" : "Tambah"}{" "}
                  {tabs.find((x: any) => x[0] === tab)?.[1]}
                </h2>
              </div>
              <button className="iconBtn" onClick={cancelEdit} aria-label="Tutup form">
                <X size={18} />
              </button>
            </div>
          <FileDrop
            value={form.image}
            onChange={(v: string) => setForm({ ...form, image: v })}
            label="Drop foto data"
          />
          <label>
            Nama
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Isi nama"
            />
          </label>
          {["service", "package", "resource"].includes(tab) && (
            <label>
              Deskripsi
              <textarea
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Informasi yang akan dibaca customer"
              />
            </label>
          )}
          {tab === "service" && (
            <div className="grid2">
              <label>
                Durasi (menit)
                <input
                  type="number"
                  value={form.duration_min}
                  onChange={(e) =>
                    setForm({ ...form, duration_min: e.target.value })
                  }
                />
              </label>
              <label>
                Harga
                <RupiahInput
                  value={form.price}
                  onChange={(v: string) => setForm({ ...form, price: v })}
                />
              </label>
            </div>
          )}
          {business.business_type === "sports_court" && tab === "resource" && (
            <>
              <label>
                Jenis olahraga
                <input
                  value={form.sport}
                  onChange={(e) => setForm({ ...form, sport: e.target.value })}
                  placeholder="Contoh: Badminton"
                />
              </label>
              <label>
                Harga / jam
                <RupiahInput
                  value={form.price_per_hour}
                  onChange={(v: string) =>
                    setForm({ ...form, price_per_hour: v })
                  }
                />
              </label>
              <label>
                Durasi tersedia (menit)
                <input
                  value={form.duration_options || ""}
                  onChange={(e) =>
                    setForm({ ...form, duration_options: e.target.value })
                  }
                  placeholder="60, 90, 120, 180"
                />
                <small className="muted">
                  Pisahkan dengan koma. Kosongkan untuk pilihan default 1–5 jam.
                </small>
              </label>
            </>
          )}
          {business.business_type === "photo_studio" && tab === "package" && (
            <>
              <div className="grid2">
                <label>
                  Durasi (menit)
                  <input
                    type="number"
                    value={form.duration_min}
                    onChange={(e) =>
                      setForm({ ...form, duration_min: e.target.value })
                    }
                  />
                </label>
                <label>
                  Kapasitas paket
                  <input
                    type="number"
                    value={form.base_people}
                    onChange={(e) =>
                      setForm({ ...form, base_people: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="grid2">
                <label>
                  Harga weekday
                  <RupiahInput
                    value={form.weekday_price}
                    onChange={(v: string) =>
                      setForm({ ...form, weekday_price: v })
                    }
                  />
                </label>
                <label>
                  Harga weekend
                  <RupiahInput
                    value={form.weekend_price}
                    onChange={(v: string) =>
                      setForm({ ...form, weekend_price: v })
                    }
                  />
                </label>
              </div>
            </>
          )}
          {business.business_type === "photo_studio" && tab === "resource" && (
            <label>
              Lokasi / label room
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Contoh: Lantai 2 / Cabang Dago"
              />
            </label>
          )}
          {business.business_type === "photo_studio" && tab === "addon" && (
            <div className="grid2">
              <label>
                Harga per unit
                <RupiahInput
                  value={form.unit_price}
                  onChange={(v: string) => setForm({ ...form, unit_price: v })}
                />
              </label>
              <label>
                Satuan
                <input
                  value={form.unit_label}
                  onChange={(e) =>
                    setForm({ ...form, unit_label: e.target.value })
                  }
                  placeholder="orang / lembar / item"
                />
              </label>
            </div>
          )}
          <div className="inlineFormActions">
            {editing && (
              <button
                className="btn ghost"
                type="button"
                onClick={cancelEdit}
                disabled={busy}
              >
                Batal
              </button>
            )}
            <button className="btn primary full" onClick={save} disabled={busy}>
              {busy ? (
                <>
                  <Spinner />
                  Menyimpan…
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {editing ? "Simpan perubahan" : "Simpan"}
                </>
              )}
            </button>
          </div>
          </section>
        </div>
      )}
      <section className="panel masterDataPanel">
          <div className="panelHeading masterDataHeading">
            <div>
              <span className="eyebrow">DATA TERSIMPAN</span>
              <h2>{tabs.find((x: any) => x[0] === tab)?.[1]}</h2>
              <p className="muted">
                {list.length ? `${list.length} data tersedia` : "Belum ada data yang dibuat"}
              </p>
            </div>
          </div>
          {list.length === 0 ? (
            <Empty
              title="Masih kosong"
              text="Tambahkan data pertama agar customer bisa mulai melakukan booking."
            />
          ) : (
            <div className="itemList masterItemGrid">
              {list.map((x: any) => (
                <div className="itemRow masterItemCard" key={x._id}>
                  {x.image ? (
                    <img src={x.image} />
                  ) : (
                    <div className="thumb">
                      <ImageIcon />
                    </div>
                  )}
                  <div className="masterItemInfo">
                    <b>{x.name}</b>
                    <small>
                      {tab === "package"
                        ? `${money(x.weekday_price)} weekday · ${money(x.weekend_price)} weekend`
                        : tab === "resource" &&
                            business.business_type === "sports_court"
                          ? `${money(x.price_per_hour)} / jam · ${Array.isArray(x.duration_options) && x.duration_options.length ? x.duration_options.map((d: number) => durationLabel(d)).join(", ") : "1–5 jam"}`
                          : tab === "service"
                            ? `${x.duration_min || "-"} menit · ${money(x.price)}`
                            : tab === "addon"
                              ? `${money(x.unit_price)} / ${x.unit_label || "unit"}`
                              : x.location || x.sport || ""}
                    </small>
                    <span className="itemActive"><i /> Aktif</span>
                  </div>
                  <div className="itemActions">
                    <button
                      className="iconBtn"
                      title="Edit"
                      onClick={() => startEdit(x)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="iconBtn danger"
                      title="Hapus"
                      onClick={() => del(x._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}

function qrisMerchantInfo(raw: string) {
  try {
    const normalized = String(raw || "")
      .replace(/[\r\n\t]/g, "")
      .trim();
    if (!normalized) return null;
    const fields: any[] = [];
    let i = 0;
    while (i < normalized.length) {
      const id = normalized.slice(i, i + 2);
      const len = Number.parseInt(normalized.slice(i + 2, i + 4), 10);
      if (!id || Number.isNaN(len) || i + 4 + len > normalized.length)
        throw new Error("invalid");
      fields.push({ id, value: normalized.slice(i + 4, i + 4 + len) });
      i += 4 + len;
    }
    const get = (id: string) =>
      fields.find((f: any) => f.id === id)?.value || "";
    const account = fields.find((f: any) => {
      const n = Number.parseInt(f.id, 10);
      return n >= 26 && n <= 51;
    });
    let issuer = "";
    if (account) {
      let j = 0;
      while (j < account.value.length) {
        const id = account.value.slice(j, j + 2);
        const len = Number.parseInt(account.value.slice(j + 2, j + 4), 10);
        if (Number.isNaN(len) || j + 4 + len > account.value.length) break;
        if (id === "00") issuer = account.value.slice(j + 4, j + 4 + len);
        j += 4 + len;
      }
    }
    const merchant = get("59"),
      city = get("60");
    if (!merchant && !city && !issuer) return null;
    return {
      merchant,
      city,
      postalCode: get("61"),
      issuer,
      category: get("52"),
      currency: get("53") === "360" ? "IDR (Rupiah)" : get("53"),
      method: get("01") === "12" ? "Dynamic" : "Static",
    };
  } catch {
    return null;
  }
}
function Settings({ business, reload }: any) {
  const { showDialog } = useDialog();
  const [f, setF] = useState<any>(JSON.parse(JSON.stringify(business)));
  const [busy, setBusy] = useState(false);
  useEffect(() => setF(JSON.parse(JSON.stringify(business))), [business]);
  const setHour = (day: string, key: string, val: any) =>
    setF({
      ...f,
      opening_hours: {
        ...f.opening_hours,
        [day]: {
          ...(f.opening_hours?.[day] || {
            open: false,
            start: "09:00",
            end: "17:00",
          }),
          [key]: val,
        },
      },
    });
  const save = async () => {
    try {
      setBusy(true);
      await api("/api/business", {
        method: "PATCH",
        body: JSON.stringify({
          name: f.name,
          address: f.address,
          phone: f.phone,
          description: f.description,
          cover_image: f.cover_image,
          gallery: f.gallery || [],
          opening_hours: f.opening_hours,
          deposit_percent: Number(f.deposit_percent || 0),
          qris_string: f.qris_string || "",
        }),
      });
      await reload();
      showDialog({
        title: "Pengaturan tersimpan",
        message: "Perubahan profil, jam operasional, dan QRIS sudah disimpan.",
      });
    } catch (e: any) {
      showDialog({
        title: "Pengaturan gagal disimpan",
        message: e.message || "Periksa kembali data yang diisi.",
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="content">
      <div className="pageTitle">
        <div>
          <span className="eyebrow">TAMPILAN & PENGATURAN</span>
          <h1>Bangun halaman booking customer</h1>
          <p>
            Cover, galeri, profil, jam buka, dan pembayaran QRIS diatur dari
            sini.
          </p>
        </div>
      </div>
      <div className="settingsStack">
        <section className="panel formPanel">
          <div className="sectionLabel">
            <div>
              <h3>Cover / Hero</h3>
              <p>Foto besar paling atas halaman booking.</p>
            </div>
          </div>
          <FileDrop
            value={f.cover_image}
            onChange={(v: string) => setF({ ...f, cover_image: v })}
            label="Drop foto cover bisnis"
          />
        </section>
        {business.business_type === "photo_studio" && (
          <section className="panel">
            <div className="sectionLabel">
              <div>
                <h3>Galeri Studio</h3>
                <p>
                  Ini galeri bisnis, terpisah dari foto paket dan foto
                  studio/room. Urutan bisa diubah dengan drag.
                </p>
              </div>
            </div>
            <GalleryDrop
              value={f.gallery || []}
              onChange={(v: any) => setF({ ...f, gallery: v })}
            />
          </section>
        )}
        <section className="panel formPanel">
          <div className="sectionLabel">
            <div>
              <h3>QRIS pembayaran</h3>
              <p>
                Tempel QRIS string static merchant. Saat checkout, nominal akan
                dibuat menjadi QRIS dynamic.
              </p>
            </div>
          </div>
          <label>
            QRIS string
            <textarea
              value={f.qris_string || ""}
              onChange={(e) => setF({ ...f, qris_string: e.target.value })}
              placeholder="Tempel QRIS string dari merchant di sini"
            />
          </label>
          {(() => {
            const info =
              qrisMerchantInfo(f.qris_string || "") || business.qris_info;
            return info?.merchant || info?.issuer ? (
              <div className="qrisMerchantCard">
                <div className="qrisMerchantTitle">
                  <CheckCircle2 size={17} />
                  <b>Identitas QRIS terbaca</b>
                </div>
                <div className="qrisMerchantGrid">
                  <span>
                    Merchant<b>{info.merchant || "—"}</b>
                  </span>
                  <span>
                    Kota<b>{info.city || "—"}</b>
                  </span>
                  <span>
                    Penerbit<b>{info.issuer || "QRIS"}</b>
                  </span>
                  <span>
                    Metode<b>{info.method || "Static"}</b>
                  </span>
                </div>
              </div>
            ) : f.qris_string ? (
              <div className="qrisMerchantCard invalid">
                <div className="qrisMerchantTitle">
                  <AlertCircle size={17} />
                  <b>Identitas merchant belum terbaca</b>
                </div>
                <span>
                  Pastikan yang ditempel adalah QRIS string lengkap dari
                  merchant, termasuk bagian CRC.
                </span>
              </div>
            ) : null;
          })()}
          <p className="muted">
            QRIS akan tampil ke customer setelah memilih jadwal dan
            mengonfirmasi booking. Untuk sementara tersedia tombol Test Bayar.
          </p>
        </section>
        <div className="split settingsSplit">
          <section className="panel formPanel">
            <h3>Profil publik</h3>
            <label>
              Nama bisnis
              <input
                value={f.name || ""}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </label>
            <label>
              Deskripsi
              <textarea
                value={f.description || ""}
                onChange={(e) => setF({ ...f, description: e.target.value })}
              />
            </label>
            <div className="grid2">
              <label>
                Telepon / WhatsApp
                <input
                  value={f.phone || ""}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                />
              </label>
              <label>
                Deposit (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={f.deposit_percent || 0}
                  onChange={(e) =>
                    setF({ ...f, deposit_percent: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Alamat
              <textarea
                value={f.address || ""}
                onChange={(e) => setF({ ...f, address: e.target.value })}
              />
            </label>
          </section>
          <section className="panel">
            <h3>Jam operasional</h3>
            <p className="muted">
              Akun baru dimulai dengan semua hari tutup agar tidak ada jam
              palsu. Aktifkan sesuai jam bisnis sebenarnya.
            </p>
            <div className="hours">
              {days.map(([key, label]) => {
                const h = f.opening_hours?.[key] || {
                  open: false,
                  start: "09:00",
                  end: "17:00",
                };
                return (
                  <div
                    className={"hourRow " + (!h.open ? "closed" : "")}
                    key={key}
                  >
                    <div className="dayToggle">
                      <button
                        className={"switch " + (h.open ? "on" : "")}
                        onClick={() => setHour(key, "open", !h.open)}
                      >
                        <span />
                      </button>
                      <b>{label}</b>
                    </div>
                    {h.open ? (
                      <div className="timeRange">
                        <input
                          type="time"
                          value={h.start}
                          onChange={(e) =>
                            setHour(key, "start", e.target.value)
                          }
                        />
                        <span>sampai</span>
                        <input
                          type="time"
                          value={h.end}
                          onChange={(e) => setHour(key, "end", e.target.value)}
                        />
                      </div>
                    ) : (
                      <span className="closedText">Tutup</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
      <button className="btn primary saveFloat" onClick={save} disabled={busy}>
        {busy ? (
          <>
            <Spinner />
            Menyimpan…
          </>
        ) : (
          "Simpan Pengaturan"
        )}
      </button>
    </div>
  );
}
function Plans({ business }: any) {
  const fallbackPlans = usePlanCatalog();
  const [billing, setBilling] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = async () => {
    try {
      setErr("");
      const j = await api("/api/billing");
      setBilling(j);
      return j;
    } catch (e: any) {
      setErr(e.message);
    }
  };
  useEffect(() => {
    (async () => {
      const loaded = await load();
      const params = new URLSearchParams(location.search);
      const ref = params.get("ref");
      const requested = params.get("checkout");
      const isPaymentReturn = Boolean(ref && ref !== "checkout");
      if (isPaymentReturn) {
        try {
          let s: any = null;
          for (let attempt = 0; attempt < 5; attempt++) {
            s = await api(
              `/api/billing/status/${encodeURIComponent(ref as string)}`,
            );
            if (
              ["paid", "expired", "failed", "cancelled"].includes(s.status) ||
              attempt === 4
            )
              break;
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
          if (s.status === "paid") {
            window.location.replace("/");
            return;
          }
          setNotice(
            s.status === "expired"
              ? "Link pembayaran sudah kedaluwarsa."
              : s.status === "failed" || s.status === "cancelled"
                ? "Pembayaran tidak berhasil. Silakan buat checkout baru."
                : `Pembayaran sedang diproses (${s.status}).`,
          );
          await load();
        } catch (e: any) {
          setErr(e.message);
        }
      }
      if (
        !isPaymentReturn &&
        ["pro", "business"].includes(requested || "") &&
        loaded?.payment?.enabled &&
        loaded?.payment?.configured
      )
        await checkout(requested as string);
    })();
  }, []);
  const checkout = async (planId: string) => {
    try {
      setBusy(planId);
      setErr("");
      const j = await api("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      });
      window.location.href = j.checkout_url;
    } catch (e: any) {
      setErr(e.message);
      setBusy("");
    }
  };
  const refresh = async () => {
    try {
      setRefreshBusy(true);
      await load();
    } finally {
      setRefreshBusy(false);
    }
  };
  const end = billing?.subscription?.ends_at
    ? new Date(billing.subscription.ends_at)
    : business.subscription?.ends_at
      ? new Date(business.subscription.ends_at)
      : null;
  const activePlan =
    billing?.subscription?.plan || business.subscription?.plan || "trial";
  const canPay = Boolean(
    billing?.payment?.enabled && billing?.payment?.configured,
  );
  const planCards = billing?.plans?.length
    ? normalizePlanCards(billing.plans)
    : fallbackPlans;
  const activePlanInfo = planCards.find((plan) => plan.id === activePlan);
  const planVisual: any = {
    trial: {
      icon: Package,
      description: "Coba semua fitur dasar BookingKu",
    },
    pro: {
      icon: Crown,
      description: "Untuk bisnis yang sedang berkembang",
    },
    business: {
      icon: Rocket,
      description: "Solusi lengkap untuk bisnis skala besar",
    },
  };
  return (
    <div className="content">
      <div className="pageTitle">
        <div>
          <span className="eyebrow">PAKET & LANGGANAN</span>
          <h1>Paket BookingKu</h1>
          <p>
            Paket aktif: <b>{activePlanInfo?.name || activePlan}</b>
            {end ? ` sampai ${end.toLocaleDateString("id-ID")}` : ""}.
          </p>
        </div>
      </div>
      {notice && (
        <div className="panel">
          <b>{notice}</b>
        </div>
      )}
      {err && <div className="error">{err}</div>}
      {billing && !canPay && (
        <p className="muted">
          Pembayaran belum aktif. Isi credential SingaPay di `api/.env` dan
          gunakan `PAYMENT_MODE=sandbox` untuk pengujian.
        </p>
      )}
      <section className="activePlanBanner">
        <div className={"activePlanIcon " + activePlan}>
          {(() => {
            const ActiveIcon = planVisual[activePlan]?.icon || Sparkles;
            return <ActiveIcon size={22} />;
          })()}
        </div>
        <div>
          <small>Paket aktif</small>
          <b>{activePlanInfo?.name || activePlan}</b>
          <span>
            {end
              ? "Berlaku sampai " + end.toLocaleDateString("id-ID")
              : "Paket trial sedang berjalan"}
          </span>
        </div>
      </section>
      <div className="priceGrid appPricing">
        {planCards.map((p) => (
          <article
            className={"priceCard " + (p.id === "business" ? "featured" : "")}
            key={p.id}
          >
            <div className="planCardHeading">
              <div className={"planCardIcon " + p.id}>
                {(() => {
                  const PlanIcon = planVisual[p.id]?.icon || Sparkles;
                  return <PlanIcon size={20} />;
                })()}
              </div>
              <div>
                <h3>{p.name}</h3>
                <p>
                  {planVisual[p.id]?.description ||
                    "Paket booking untuk bisnis Anda"}
                </p>
              </div>
              {p.id === activePlan ? (
                <span className="planBadge current">Paket saat ini</span>
              ) : p.id === "business" ? (
                <span className="planBadge">Recommended</span>
              ) : null}
            </div>
            <div className="bigPrice">
              {p.price}
              <small>{p.suffix}</small>
            </div>
            <ul>
              {p.features.map((f) => (
                <li key={f}>
                  <Check size={16} />
                  {f}
                </li>
              ))}
            </ul>
            {p.id === activePlan ? (
              <span className="currentPlan">Paket saat ini</span>
            ) : p.id === "trial" ? (
              <span className="muted">Tidak dipilih otomatis</span>
            ) : (
              <button
                className="btn primary full"
                onClick={() => checkout(p.id)}
                disabled={!!busy || !canPay || p.available === false}
              >
                {busy === p.id ? (
                  <>
                    <Spinner />
                    Menyiapkan pembayaran…
                  </>
                ) : canPay && p.available !== false ? (
                  "Beli paket ini"
                ) : p.available === false ? (
                  "Belum tersedia"
                ) : (
                  "Sandbox belum aktif"
                )}
              </button>
            )}
          </article>
        ))}
      </div>
      {billing?.pending && (
        <section className="panel" style={{ marginTop: 20 }}>
          <b>Pembayaran sedang diproses</b>
          <p className="muted">
            Referensi: {billing.pending.payment_ref}. Setelah pembayaran sandbox
            selesai, status paket akan diperbarui otomatis.
          </p>
          <button
            className="btn ghost"
            onClick={refresh}
            disabled={refreshBusy}
          >
            {refreshBusy ? (
              <>
                <Spinner />
                Memperbarui…
              </>
            ) : (
              "Perbarui status"
            )}
          </button>
        </section>
      )}
    </div>
  );
}

function useAvailability(
  slug: string,
  date: string,
  duration: number,
  resourceId?: string,
  staffId?: string,
) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!date || !duration) return;
    const qs = new URLSearchParams({ date, duration: String(duration) });
    if (resourceId) qs.set("resource_id", resourceId);
    if (staffId) qs.set("staff_id", staffId);
    setLoading(true);
    api(`/api/public/${slug}/availability?${qs}`)
      .then((x) => setSlots(x.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [slug, date, duration, resourceId, staffId]);
  return { slots, loading };
}
function PublicBooking({ slug }: any) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api("/api/public/" + slug)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [slug]);
  if (err) return <div className="loading">{err}</div>;
  if (!data) return <div className="loading">Memuat halaman booking…</div>;
  if (data.business.business_type === "photo_studio")
    return <StudioPublic data={data} slug={slug} />;
  if (data.business.business_type === "sports_court")
    return <SportsPublic data={data} slug={slug} />;
  return <SalonPublic data={data} slug={slug} />;
}
function PublicShell({ business, children }: any) {
  return (
    <div className="publicSite">
      <header className="publicTop">
        <b className="publicBrand">{business.name}</b>
        <nav>
          <a href="#booking">Booking</a>
          {business.gallery?.length > 0 && <a href="#gallery">Galeri</a>}
          <a href="#info">Info</a>
        </nav>
        <span className="powered">Powered by BookingKu</span>
      </header>
      {children}
      <footer>
        <div className="footerInner">
          <div className="footerBrand">
            <b>{business.name}</b>
            <span>Booking online yang praktis dan transparan.</span>
          </div>
          <span className="footerPowered">Powered by BookingKu</span>
          <a href="#booking" className="footerLink">
            Kembali ke booking ↑
          </a>
        </div>
      </footer>
    </div>
  );
}
function Hero({ business, badge, cta = "Lihat Paket" }: any) {
  return (
    <section
      className={"customerHero " + (!business.cover_image ? "noImage" : "")}
      style={
        business.cover_image
          ? {
              backgroundImage: `linear-gradient(90deg,rgba(9,12,20,.72),rgba(9,12,20,.22)),url(${business.cover_image})`,
            }
          : {}
      }
    >
      <div className="customerHeroContent">
        <span>{badge}</span>
        <h1>{business.name}</h1>
        <p>
          {business.description ||
            "Booking langsung dari halaman ini tanpa chat bolak-balik."}
        </p>
        <div className="heroMeta">
          {business.address && (
            <small>
              <MapPin size={15} />
              {business.address}
            </small>
          )}
          {business.phone && (
            <small>
              <Phone size={15} />
              {business.phone}
            </small>
          )}
        </div>
        <a href="#booking" className="btn lightBtn">
          {cta} <ChevronDown size={17} />
        </a>
      </div>
    </section>
  );
}
function GallerySection({ gallery }: any) {
  if (!gallery?.length) return null;
  return (
    <section id="gallery" className="customerSection">
      <div className="customerHead">
        <span>GALERI</span>
        <h2>Lihat suasana tempatnya</h2>
      </div>
      <div className={"galleryMosaic count" + Math.min(gallery.length, 5)}>
        {gallery.slice(0, 8).map((g: string, i: number) => (
          <img key={i} src={g} />
        ))}
      </div>
    </section>
  );
}
async function downloadBookingReceipt(booking: any, business: any) {
  const response = await fetch(
    `${API}/api/public/${business.slug}/book/${booking._id}/receipt`,
  );
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "PDF bukti booking tidak dapat dibuat.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${booking.code || "booking"}-bukti-booking.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function BookingDone({ booking, business, emailStatus = "" }: any) {
  const date = new Date(booking.start_at);
  const end = new Date(booking.end_at);
  const startNewBooking = () =>
    window.location.assign(`/b/${business.slug}?new=${Date.now()}#booking`);
  return (
    <PublicShell business={business}>
      <section className="donePage">
        <div className="doneCard">
          <div className="doneIcon">
            <Check />
          </div>
          <span className="doneEyebrow">BOOKING BERHASIL</span>
          <h1>Booking kamu sudah dikonfirmasi</h1>
          <p className="doneLead">
            Pembayaran simulasi berhasil. Simpan bukti booking ini untuk
            referensi.
          </p>
          {emailStatus === "sent" && (
            <div className="successNotice">
              <Mail size={17} /> Bukti booking juga dikirim ke{" "}
              <b>{booking.customer_email}</b>.
            </div>
          )}
          {emailStatus === "not_configured" && (
            <div className="infoNotice">
              <Mail size={17} /> Email booking sudah dicatat. Bukti PDF tetap
              bisa kamu unduh di bawah.
            </div>
          )}
          {emailStatus === "failed" && (
            <div className="warningNotice">
              <Mail size={17} /> Email belum berhasil dikirim. Bukti PDF tetap
              bisa kamu unduh di bawah.
            </div>
          )}
          <div className="doneCode">
            <small>KODE BOOKING</small>
            <b>{booking.code}</b>
          </div>
          <div className="doneDetails">
            <div>
              <span>Customer</span>
              <b>{booking.customer_name}</b>
            </div>
            <div>
              <span>Layanan</span>
              <b>{booking.selection_name || "Booking"}</b>
            </div>
            <div>
              <span>Jadwal</span>
              <b>
                {date.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </b>
              <small>
                {date.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {end.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>
            <div>
              <span>Total dibayar</span>
              <b>{money(booking.total_price)}</b>
            </div>
          </div>
          <div className="paidBadge">
            <CheckCircle2 size={17} /> Lunas · QRIS simulasi
          </div>
          <AsyncActionButton
            onAction={() => downloadBookingReceipt(booking, business)}
          >
            <Download size={17} />
            Download bukti booking
          </AsyncActionButton>
          <button
            type="button"
            className="doneBack doneBackButton"
            onClick={startNewBooking}
          >
            Buat booking baru
          </button>
        </div>
      </section>
    </PublicShell>
  );
}
function QrisPayment({ result, business, slug, onPaid }: any) {
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(result.payment.qris_data, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then(setQr)
      .catch(() => setErr("QRIS tidak dapat dibuat."));
  }, [result.payment.qris_data]);
  const testPay = async () => {
    try {
      setBusy(true);
      setErr("");
      const j = await api(
        `/api/public/${slug}/book/${result.booking._id}/test-pay`,
        {
          method: "POST",
          body: JSON.stringify({ payment_token: result.payment.payment_token }),
        },
      );
      onPaid(j.booking, j.email_status);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <PublicShell business={business}>
      <section className="customerSection qrisCheckout">
        <div className="qrisCard">
          <span className="miniLabel">PEMBAYARAN QRIS</span>
          <h2>Scan QR untuk menyelesaikan booking</h2>
          <p>
            Nominal yang harus dibayar: <b>{money(result.payment.amount)}</b>
          </p>
          {qr ? (
            <img className="qrisImage" src={qr} alt="QRIS pembayaran" />
          ) : (
            <div className="qrisLoading">Menyiapkan QRIS…</div>
          )}
          <p className="muted">
            Ini adalah QRIS dynamic dengan nominal booking kamu.
          </p>
          {err && <div className="error">{err}</div>}
          <button
            className="btn primary full"
            onClick={testPay}
            disabled={busy}
          >
            {busy ? (
              <>
                <Spinner />
                Memproses…
              </>
            ) : (
              "Test Bayar (Simulasi Berhasil)"
            )}
          </button>
          <small className="muted">
            Mode sementara: tombol ini langsung menandai pembayaran sebagai
            berhasil.
          </small>
        </div>
      </section>
    </PublicShell>
  );
}

function StudioPublic({ data, slug }: any) {
  const { showDialog } = useDialog();
  const { business, items } = data;
  const packages = items.filter((x: any) => x.kind === "package");
  const addons = items.filter((x: any) => x.kind === "addon");
  const rooms = items.filter((x: any) => x.kind === "resource");
  const [selected, setSelected] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<any>(null);
  const [counts, setCounts] = useState<any>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState("");
  const [payment, setPayment] = useState<any>(null);
  const duration = Number(selected?.duration_min || 30);
  const { slots, loading } = useAvailability(slug, date, duration, room?._id);
  const weekend = [0, 6].includes(new Date(date + "T12:00:00").getDay());
  const base = Number(
    weekend ? selected?.weekend_price : selected?.weekday_price || 0,
  );
  const addonTotal = addons.reduce(
    (s: any, a: any) =>
      s + Number(counts[a._id] || 0) * Number(a.unit_price || 0),
    0,
  );
  const total = base + addonTotal;
  const book = async () => {
    if (!selected || !slot || !name || !phone || !email)
      return showDialog({
        title: "Data booking belum lengkap",
        message:
          "Lengkapi paket, jadwal, nama, WhatsApp, dan email sebelum melanjutkan.",
      });
    const body: any = {
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      start_at: slot.start_at,
      end_at: slot.end_at,
      total_price: total,
      selection_name: selected.name,
      addons: addons
        .map((a: any) => ({
          name: a.name,
          qty: Number(counts[a._id] || 0),
          unit_price: a.unit_price,
        }))
        .filter((a: any) => a.qty > 0),
    };
    if (room) body.resource_id = room._id;
    const j = await api(`/api/public/${slug}/book`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (j.payment) setPayment(j);
    else {
      setEmailStatus(j.email_status || "");
      setDone(j.booking);
    }
  };
  if (done)
    return (
      <BookingDone
        booking={done}
        business={business}
        emailStatus={emailStatus}
      />
    );
  if (payment)
    return (
      <QrisPayment
        result={payment}
        business={business}
        slug={slug}
        onPaid={(booking: any, status: string) => {
          setEmailStatus(status || "");
          setDone(booking);
        }}
      />
    );
  return (
    <PublicShell business={business}>
      <Hero
        business={business}
        badge="SELF PHOTO STUDIO · ONLINE BOOKING"
        cta="Cek Paket & Harga"
      />
      <GallerySection gallery={business.gallery} />
      <section className="customerSection perks">
        <div>
          <b>Private Session</b>
          <span>Lebih nyaman untuk foto bebas gaya</span>
        </div>
        <div>
          <b>Harga transparan</b>
          <span>Weekday & weekend terlihat jelas</span>
        </div>
        <div>
          <b>Booking realtime</b>
          <span>Pilih slot tanpa menunggu admin</span>
        </div>
      </section>
      <section id="booking" className="customerSection">
        <div className="customerHead">
          <span>PAKET & HARGA</span>
          <h2>Pilih paket yang sesuai dengan sesi kamu</h2>
          <p>Foto paket di bawah berbeda dengan galeri studio di atas.</p>
        </div>
        {packages.length === 0 ? (
          <PublicEmpty text="Paket belum tersedia. Owner belum menambahkan paket studio." />
        ) : (
          <div className="packageGrid">
            {packages.map((p: any) => (
              <button
                className={
                  "packageCard " + (selected?._id === p._id ? "selected" : "")
                }
                key={p._id}
                onClick={() => {
                  setSelected(p);
                  setSlot(null);
                }}
              >
                {p.image ? (
                  <img src={p.image} />
                ) : (
                  <div className="photoPlaceholder">
                    <Camera />
                  </div>
                )}
                <div className="packageBody">
                  <span>
                    {p.duration_min || "-"} MENIT · {p.base_people || "-"} ORANG
                  </span>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="dualPrice">
                    <div>
                      <small>Weekday</small>
                      <b>{money(p.weekday_price)}</b>
                    </div>
                    <div>
                      <small>Weekend</small>
                      <b>{money(p.weekend_price)}</b>
                    </div>
                  </div>
                  <strong>
                    {selected?._id === p._id ? "Dipilih" : "Pilih Paket"}{" "}
                    <ChevronRight size={17} />
                  </strong>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      {selected && addons.length > 0 && (
        <section className="customerSection soft">
          <div className="customerHead">
            <span>ADD-ON</span>
            <h2>Tambahkan yang kamu butuhkan</h2>
          </div>
          <div className="addonList">
            {addons.map((a: any) => (
              <div className="addonRow" key={a._id}>
                <div>
                  <b>{a.name}</b>
                  <span>
                    {money(a.unit_price)} / {a.unit_label || "unit"}
                  </span>
                </div>
                <div className="stepper">
                  <button
                    onClick={() =>
                      setCounts({
                        ...counts,
                        [a._id]: Math.max(0, Number(counts[a._id] || 0) - 1),
                      })
                    }
                  >
                    <Minus />
                  </button>
                  <b>{counts[a._id] || 0}</b>
                  <button
                    onClick={() =>
                      setCounts({
                        ...counts,
                        [a._id]: Number(counts[a._id] || 0) + 1,
                      })
                    }
                  >
                    <Plus />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {selected && rooms.length > 0 && (
        <section className="customerSection">
          <div className="customerHead">
            <span>STUDIO</span>
            <h2>Pilih studio / room</h2>
          </div>
          <div className="roomGrid">
            {rooms.map((r: any) => (
              <button
                className={room?._id === r._id ? "selected" : ""}
                onClick={() => {
                  setRoom(r);
                  setSlot(null);
                }}
                key={r._id}
              >
                {r.image ? (
                  <img src={r.image} />
                ) : (
                  <div className="roomPh">
                    <Camera />
                  </div>
                )}
                <div>
                  <h3>{r.name}</h3>
                  <span>{r.location || r.description || ""}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
      {selected && (
        <section className="customerSection soft">
          <div className="customerHead">
            <span>JADWAL</span>
            <h2>Pilih tanggal & jam</h2>
            <p>
              Harga paket untuk tanggal ini:{" "}
              <b>{weekend ? "Weekend" : "Weekday"}</b>.
            </p>
          </div>
          <div className="schedulePro">
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot(null);
              }}
            />
            <div className="slotGrid">
              {loading ? (
                <span>Memuat slot…</span>
              ) : slots.length ? (
                slots.map((s: any) => (
                  <button
                    className={slot?.time === s.time ? "active" : ""}
                    onClick={() => setSlot(s)}
                    key={s.time}
                  >
                    {s.time}
                  </button>
                ))
              ) : (
                <span>Tidak ada slot tersedia.</span>
              )}
            </div>
          </div>
        </section>
      )}
      {selected && slot && (
        <section className="customerSection checkoutSection">
          <div className="customerFormCard">
            <span className="miniLabel">DATA CUSTOMER</span>
            <h2>Terakhir, isi kontakmu</h2>
            <label>
              Nama
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
              />
            </label>
            <label>
              WhatsApp
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </label>
            <label>
              Email konfirmasi
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />
            </label>
          </div>
          <aside className="stickySummary">
            <span>RINGKASAN SESI</span>
            <h3>{selected.name}</h3>
            {room && <p>{room.name}</p>}
            <p>
              {new Date(date + "T12:00:00").toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {slot.time}
            </p>
            {addons
              .filter((a: any) => counts[a._id] > 0)
              .map((a: any) => (
                <div className="sumLine" key={a._id}>
                  <span>
                    {a.name} × {counts[a._id]}
                  </span>
                  <b>{money(Number(a.unit_price) * Number(counts[a._id]))}</b>
                </div>
              ))}
            <div className="sumTotal">
              <span>Total estimasi</span>
              <b>{money(total)}</b>
            </div>
            <AsyncActionButton onAction={book}>
              Konfirmasi Booking
            </AsyncActionButton>
          </aside>
        </section>
      )}
      <InfoSection business={business} />
    </PublicShell>
  );
}

function SalonPublic({ data, slug }: any) {
  const { showDialog } = useDialog();
  const { business, items } = data;
  const services = items.filter((x: any) => x.kind === "service");
  const staff = items.filter((x: any) => x.kind === "staff");
  const [service, setService] = useState<any>(null);
  const [stylist, setStylist] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState("");
  const [payment, setPayment] = useState<any>(null);
  const { slots } = useAvailability(
    slug,
    date,
    Number(service?.duration_min || 60),
    undefined,
    stylist?._id,
  );
  const book = async () => {
    if (!service || !slot || !name || !phone || !email)
      return showDialog({
        title: "Data booking belum lengkap",
        message:
          "Pilih layanan, jadwal, nama, WhatsApp, dan email sebelum melanjutkan.",
      });
    const body: any = {
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      start_at: slot.start_at,
      end_at: slot.end_at,
      total_price: Number(service.price || 0),
      selection_name: service.name,
    };
    if (stylist) body.staff_id = stylist._id;
    const j = await api(`/api/public/${slug}/book`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (j.payment) setPayment(j);
    else {
      setEmailStatus(j.email_status || "");
      setDone(j.booking);
    }
  };
  if (done)
    return (
      <BookingDone
        booking={done}
        business={business}
        emailStatus={emailStatus}
      />
    );
  if (payment)
    return (
      <QrisPayment
        result={payment}
        business={business}
        slug={slug}
        onPaid={(booking: any, status: string) => {
          setEmailStatus(status || "");
          setDone(booking);
        }}
      />
    );
  return (
    <PublicShell business={business}>
      <Hero
        business={business}
        badge="SALON / BARBERSHOP · BOOK ONLINE"
        cta="Pilih Layanan"
      />
      <section id="booking" className="customerSection">
        <div className="customerHead">
          <span>LAYANAN</span>
          <h2>Pilih treatment yang kamu butuhkan</h2>
        </div>
        {services.length === 0 ? (
          <PublicEmpty text="Layanan belum tersedia." />
        ) : (
          <div className="serviceGrid">
            {services.map((s: any) => (
              <button
                className={service?._id === s._id ? "selected" : ""}
                onClick={() => {
                  setService(s);
                  setSlot(null);
                }}
                key={s._id}
              >
                {s.image ? (
                  <img src={s.image} />
                ) : (
                  <div className="servicePh">
                    <Scissors />
                  </div>
                )}
                <div>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <span>
                    <Clock size={14} />
                    {s.duration_min || "-"} menit
                  </span>
                  <b>{money(s.price)}</b>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      {service && staff.length > 0 && (
        <section className="customerSection soft">
          <div className="customerHead">
            <span>STYLIST</span>
            <h2>Pilih staff favoritmu</h2>
            <p>Boleh dikosongkan jika ingin staff mana saja.</p>
          </div>
          <div className="staffGrid">
            <button
              className={!stylist ? "selected" : ""}
              onClick={() => {
                setStylist(null);
                setSlot(null);
              }}
            >
              <div className="avatarAny">Any</div>
              <b>Siapa saja</b>
            </button>
            {staff.map((s: any) => (
              <button
                className={stylist?._id === s._id ? "selected" : ""}
                onClick={() => {
                  setStylist(s);
                  setSlot(null);
                }}
                key={s._id}
              >
                {s.image ? (
                  <img src={s.image} />
                ) : (
                  <div className="avatarAny">{s.name?.[0]}</div>
                )}
                <b>{s.name}</b>
              </button>
            ))}
          </div>
        </section>
      )}
      {service && (
        <ScheduleAndContact
          date={date}
          setDate={setDate}
          slots={slots}
          slot={slot}
          setSlot={setSlot}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          summary={
            <>
              <h3>{service.name}</h3>
              {stylist && <p>Dengan {stylist.name}</p>}
              <b>{money(service.price)}</b>
            </>
          }
          onBook={book}
        />
      )}
      <InfoSection business={business} />
    </PublicShell>
  );
}

function SportsPublic({ data, slug }: any) {
  const { showDialog } = useDialog();
  const { business, items } = data;
  const sports = items.filter((x: any) => x.kind === "sport");
  const courts = items.filter((x: any) => x.kind === "resource");
  const [sport, setSport] = useState("");
  const [court, setCourt] = useState<any>(null);
  const [duration, setDuration] = useState(60);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState("");
  const [payment, setPayment] = useState<any>(null);
  const filtered = courts.filter(
    (c: any) => !sport || !c.sport || c.sport === sport,
  );
  const durationOptions = sportDurationOptions(court);
  const { slots } = useAvailability(slug, date, duration, court?._id);
  const total = Number(court?.price_per_hour || 0) * (duration / 60);
  const book = async () => {
    if (!court || !slot || !name || !phone || !email)
      return showDialog({
        title: "Data booking belum lengkap",
        message:
          "Pilih lapangan, jadwal, nama, WhatsApp, dan email sebelum melanjutkan.",
      });
    const j = await api(`/api/public/${slug}/book`, {
      method: "POST",
      body: JSON.stringify({
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        start_at: slot.start_at,
        end_at: slot.end_at,
        total_price: total,
        selection_name: court.name,
        resource_id: court._id,
      }),
    });
    if (j.payment) setPayment(j);
    else {
      setEmailStatus(j.email_status || "");
      setDone(j.booking);
    }
  };
  if (done)
    return (
      <BookingDone
        booking={done}
        business={business}
        emailStatus={emailStatus}
      />
    );
  if (payment)
    return (
      <QrisPayment
        result={payment}
        business={business}
        slug={slug}
        onPaid={(booking: any, status: string) => {
          setEmailStatus(status || "");
          setDone(booking);
        }}
      />
    );
  return (
    <PublicShell business={business}>
      <Hero
        business={business}
        badge="SPORTS VENUE · BOOK YOUR COURT"
        cta="Cari Lapangan"
      />
      <section id="booking" className="customerSection">
        <div className="customerHead">
          <span>BOOKING LAPANGAN</span>
          <h2>Cari lapangan yang tersedia</h2>
        </div>
        {sports.length > 0 && (
          <div className="sportChips">
            {sports.map((s: any) => (
              <button
                className={sport === s.name ? "active" : ""}
                onClick={() => {
                  setSport(s.name);
                  setCourt(null);
                  setSlot(null);
                }}
                key={s._id}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
        {courts.length === 0 ? (
          <PublicEmpty text="Lapangan belum tersedia." />
        ) : (
          <div className="courtGrid">
            {filtered.map((c: any) => (
              <button
                className={court?._id === c._id ? "selected" : ""}
                onClick={() => {
                  setCourt(c);
                  setDuration(sportDurationOptions(c)[0]);
                  setSlot(null);
                }}
                key={c._id}
              >
                {c.image ? (
                  <img src={c.image} />
                ) : (
                  <div className="courtPh">
                    <Dumbbell />
                  </div>
                )}
                <div>
                  <span>{c.sport || "Lapangan"}</span>
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <b>{money(c.price_per_hour)} / jam</b>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      {court && (
        <section className="customerSection soft">
          <div className="customerHead">
            <span>DURASI</span>
            <h2>Mau main berapa lama?</h2>
            <p>Pilih durasi yang disediakan untuk lapangan ini.</p>
          </div>
          <div className="durationPick">
            {durationOptions.map((d: number) => (
              <button
                className={duration === d ? "active" : ""}
                onClick={() => {
                  setDuration(d);
                  setSlot(null);
                }}
                key={d}
              >
                {durationLabel(d)}
              </button>
            ))}
          </div>
        </section>
      )}
      {court && (
        <ScheduleAndContact
          date={date}
          setDate={setDate}
          slots={slots}
          slot={slot}
          setSlot={setSlot}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          summary={
            <>
              <h3>{court.name}</h3>
              <p>{durationLabel(duration)}</p>
              <b>{money(total)}</b>
            </>
          }
          onBook={book}
        />
      )}
      <InfoSection business={business} />
    </PublicShell>
  );
}

function AsyncActionButton({
  onAction,
  children,
  className = "btn primary full",
  ...props
}: any) {
  const { showDialog } = useDialog();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    try {
      setBusy(true);
      await onAction();
    } catch (e: any) {
      showDialog({ title: "Proses gagal", message: e.message || "Coba lagi." });
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      {...props}
      className={className}
      disabled={busy || props.disabled}
      onClick={run}
    >
      {busy ? (
        <>
          <Spinner />
          Memproses…
        </>
      ) : (
        children
      )}
    </button>
  );
}
function ScheduleAndContact({
  date,
  setDate,
  slots,
  slot,
  setSlot,
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  summary,
  onBook,
}: any) {
  return (
    <>
      <section className="customerSection">
        <div className="customerHead">
          <span>JADWAL</span>
          <h2>Pilih tanggal & jam</h2>
        </div>
        <div className="schedulePro">
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setDate(e.target.value);
              setSlot(null);
            }}
          />
          <div className="slotGrid">
            {slots.length ? (
              slots.map((s: any) => (
                <button
                  className={slot?.time === s.time ? "active" : ""}
                  onClick={() => setSlot(s)}
                  key={s.time}
                >
                  {s.time}
                </button>
              ))
            ) : (
              <span>Tidak ada slot tersedia.</span>
            )}
          </div>
        </div>
      </section>
      {slot && (
        <section className="customerSection checkoutSection">
          <div className="customerFormCard">
            <span className="miniLabel">DATA CUSTOMER</span>
            <h2>Konfirmasi booking</h2>
            <label>
              Nama
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              WhatsApp
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label>
              Email konfirmasi
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />
            </label>
          </div>
          <aside className="stickySummary">
            <span>RINGKASAN</span>
            {summary}
            <p>
              {new Date(date + "T12:00:00").toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {slot.time}
            </p>
            <AsyncActionButton onAction={onBook}>
              Konfirmasi Booking
            </AsyncActionButton>
          </aside>
        </section>
      )}
    </>
  );
}
function InfoSection({ business }: any) {
  const typeLabel = meta[business.business_type]?.label || "Bisnis";
  return (
    <section id="info" className="customerSection infoSection">
      <div className="infoIntro">
        <span className="miniLabel">INFORMASI {typeLabel.toUpperCase()}</span>
        <h2>Semua yang perlu kamu tahu sebelum booking.</h2>
        <p>
          {business.description ||
            "Pilih layanan, tentukan waktu, lalu datang sesuai jadwal. Semua detail booking tersedia dalam satu halaman."}
        </p>
        <div className="infoPromise">
          <span>01</span>
          <div>
            <b>Booking lebih jelas</b>
            <small>
              Harga, jadwal, lokasi, dan kontak tersedia sebelum kamu
              konfirmasi.
            </small>
          </div>
        </div>
      </div>
      <div className="infoCard">
        <div className="infoCardTitle">
          <div className="infoCardIcon">
            <MapPin size={19} />
          </div>
          <div>
            <span>LOKASI & KONTAK</span>
            <b>{business.name}</b>
          </div>
        </div>
        <div className="infoContactList">
          {business.address && (
            <div>
              <MapPin size={18} />
              <span>{business.address}</span>
            </div>
          )}
          {business.phone && (
            <div>
              <Phone size={18} />
              <span>{business.phone}</span>
            </div>
          )}
        </div>
        <div className="openHours">
          <div className="hoursTitle">
            <span>JAM OPERASIONAL</span>
            <b>Setiap minggu</b>
          </div>
          <div className="hoursGrid">
            {days.map(([k, l]) => {
              const h = business.opening_hours?.[k];
              return (
                <div key={k}>
                  <span>{l}</span>
                  <b>{h?.open ? `${h.start} – ${h.end}` : "Tutup"}</b>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
function PublicEmpty({ text }: any) {
  return (
    <div className="publicEmpty">
      <ImageIcon />
      <h3>Belum ada data</h3>
      <p>{text}</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
