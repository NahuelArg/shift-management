import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { createBooking } from '../services/bookingService';
import BookingForm from '../components/bookingManagement/BookingForm';
import StatusBadge, { bookingStatusVariant } from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

interface CalendarBooking {
  id: string;
  date: string;
  endTime: string;
  status: string;
  finalPrice: number;
  service: { name: string; durationMin: number } | null;
  business: { name: string } | null;
  employee?: { id: string; name: string } | null;
  user: { name: string } | null;
}

type ViewMode = 'week' | 'day';

const HOURS    = Array.from({ length: 14 }, (_, i) => i + 8); // 08–21
const CELL_H   = 56; // px per hour
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_S    = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DAY_L    = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// Employee color palette using design system tokens
const PALETTE = [
  { chip: 'bg-success-light border-success text-success-text',  av: 'bg-success-light text-success',  dot: 'bg-success'  },
  { chip: 'bg-info-light border-info text-info-text',           av: 'bg-info-light text-info',         dot: 'bg-info'     },
  { chip: 'bg-primary-light border-primary text-primary',       av: 'bg-primary-light text-primary',   dot: 'bg-primary'  },
  { chip: 'bg-warning-light border-warning text-warning-text',  av: 'bg-warning-light text-warning',   dot: 'bg-warning'  },
  { chip: 'bg-danger-light border-danger text-danger-text',     av: 'bg-danger-light text-danger',     dot: 'bg-danger'   },
];

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const msm = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

const getWeekDays = (base: Date): Date[] => {
  const mon = new Date(base);
  const diff = mon.getDay() === 0 ? -6 : 1 - mon.getDay();
  mon.setDate(mon.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
};

// ── Mini calendar ────────────────────────────────────────────────────────────
const MiniCalendar: React.FC<{ selected: Date; onSelect: (d: Date) => void }> = ({ selected, onSelect }) => {
  const [month, setMonth] = useState(() =>
    new Date(selected.getFullYear(), selected.getMonth(), 1)
  );
  const today = new Date();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDow    = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const blanks      = firstDow === 0 ? 6 : firstDow - 1;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-3 text-content-3 transition-colors"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <span className="text-sm font-semibold text-content">
          {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
        </span>
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-3 text-content-3 transition-colors"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 text-center mb-1">
        {['L','M','M','J','V','S','D'].map((d, i) => (
          <div key={i} className="text-xs text-content-3 font-medium py-0.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center gap-y-0.5">
        {Array(blanks).fill(null).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const d      = new Date(month.getFullYear(), month.getMonth(), day);
          const isTod  = isSameDay(d, today);
          const isSel  = isSameDay(d, selected);
          return (
            <button
              key={day}
              onClick={() => onSelect(d)}
              className={`h-7 w-7 mx-auto rounded-full text-xs flex items-center justify-center transition-colors font-medium
                ${isSel  ? 'bg-primary text-content-inverse' :
                  isTod  ? 'bg-primary-light text-primary' :
                           'hover:bg-surface-3 text-content-2'}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const Calendar: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();

  const [bookings,      setBookings]      = useState<CalendarBooking[]>([]);
  const [employees,     setEmployees]     = useState<{ id: string; name: string }[]>([]);
  const [businessId,    setBusinessId]    = useState<string>('');
  const [loading,       setLoading]       = useState(true);
  const [viewMode,      setViewMode]      = useState<ViewMode>('day');
  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [filterEmpId,   setFilterEmpId]   = useState<string | null>(null);
  const [selectedBkg,   setSelectedBkg]   = useState<CalendarBooking | null>(null);
  const [showNewBkg,    setShowNewBkg]    = useState(false);

  // Fetch business + employees for this admin
  useEffect(() => {
    if (!token) return;
    apiClient.get('/admin/me').then(res => {
      const biz = res.data.businesses?.[0];
      if (!biz) return;
      setBusinessId(biz.id);
      apiClient.get('/admin/employees', { params: { businessId: biz.id, page: 1, limit: 200 } })
        .then(r => {
          const list = (r.data.employees ?? r.data.data ?? r.data) as { id: string; name: string }[];
          setEmployees(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    }).catch(() => {});
  }, [token]);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/bookings');
      setBookings(res.data);
    } catch {
      toast('No se pudieron cargar los turnos', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Stable color index map for fetched employees
  const colorMap = useMemo(() => {
    const m = new Map<string, number>();
    employees.forEach((emp, i) => m.set(emp.id, i % PALETTE.length));
    return m;
  }, [employees]);

  const pal = (empId?: string | null) => PALETTE[colorMap.get(empId ?? '') ?? 0];

  // Stats
  const todayStr  = new Date().toISOString().slice(0, 10);
  const todayBkgs = useMemo(() =>
    bookings
      .filter(b => new Date(b.date).toISOString().slice(0, 10) === todayStr)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [bookings]
  );
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;

  // Set of this business's employee IDs for fast lookup
  const bizEmpIds = useMemo(() => new Set(employees.map(e => e.id)), [employees]);

  // Per-employee booking count (only bookings assigned to a business employee)
  const empCount = useMemo(() => {
    const m = new Map<string, number>();
    bookings.forEach(b => {
      if (b.employee?.id && bizEmpIds.has(b.employee.id))
        m.set(b.employee.id, (m.get(b.employee.id) ?? 0) + 1);
    });
    return m;
  }, [bookings, bizEmpIds]);

  // Filtered bookings — only employees from this business, then optionally by selected employee
  const visibleBkgs = useMemo(() => {
    const base = bizEmpIds.size > 0
      ? bookings.filter(b => !b.employee?.id || bizEmpIds.has(b.employee.id))
      : bookings;
    return filterEmpId ? base.filter(b => b.employee?.id === filterEmpId) : base;
  }, [bookings, bizEmpIds, filterEmpId]);

  const bkgsForDay = useCallback((day: Date) => {
    const iso = day.toISOString().slice(0, 10);
    return visibleBkgs.filter(b => new Date(b.date).toISOString().slice(0, 10) === iso);
  }, [visibleBkgs]);

  // Day view: unique employees with bookings on currentDate
  const dayColEmps = useMemo(() => {
    const iso  = currentDate.toISOString().slice(0, 10);
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    visibleBkgs
      .filter(b => new Date(b.date).toISOString().slice(0, 10) === iso && b.employee?.id)
      .forEach(b => {
        if (!seen.has(b.employee!.id)) {
          seen.add(b.employee!.id);
          list.push({ id: b.employee!.id, name: b.employee!.name });
        }
      });
    return list;
  }, [visibleBkgs, currentDate]);

  // Navigation
  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else                     d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const weekDays = getWeekDays(currentDate);

  // Chip positioning
  const chipStyle = (b: CalendarBooking): React.CSSProperties => {
    const start    = msm(b.date);
    const end      = msm(b.endTime);
    const dayStart = 8 * 60;
    const total    = HOURS.length * 60;
    return {
      top:    `${((start - dayStart) / total) * 100}%`,
      height: `max(${((end - start) / total) * 100}%, 2.5rem)`,
      left: '2px', right: '2px',
    };
  };

  const headerLabel = () => {
    if (viewMode === 'week') {
      const s = weekDays[0], e = weekDays[6];
      return `${s.getDate()} – ${e.getDate()} ${MONTH_NAMES[e.getMonth()]} ${e.getFullYear()}`;
    }
    const d = currentDate;
    return `${DAY_L[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
  };

  // Hour label helper
  const hLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <div className="flex gap-4 h-full min-h-0">

      {/* ── Left panel ─────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-surface rounded-xl shadow-card border border-border flex flex-col overflow-y-auto">
        {/* Mini calendar */}
        <MiniCalendar
          selected={currentDate}
          onSelect={d => { setCurrentDate(d); setViewMode('day'); }}
        />

        {/* Today's bookings */}
        <div className="border-t border-border p-4">
          <p className="text-xs font-bold text-content-3 uppercase tracking-wider mb-3">
            Hoy — {todayBkgs.length} turnos
          </p>
          {todayBkgs.length === 0 ? (
            <p className="text-xs text-content-3">Sin turnos hoy</p>
          ) : (
            <div className="space-y-1">
              {todayBkgs.map(b => {
                const p = pal(b.employee?.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBkg(b)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                  >
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${p.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-content truncate">
                        {b.user?.name ?? 'Walk-in'}
                      </p>
                      <p className="text-xs text-content-3">
                        {new Date(b.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Employee filter */}
        <div className="border-t border-border p-4 flex-1">
          <p className="text-xs font-bold text-content-3 uppercase tracking-wider mb-3">Empleados</p>
          <div className="space-y-0.5">
            <button
              onClick={() => setFilterEmpId(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                ${filterEmpId === null ? 'bg-primary text-content-inverse' : 'hover:bg-surface-2 text-content-2'}`}
            >
              Todos
            </button>
            {employees.map(emp => {
              const p = pal(emp.id);
              return (
                <button
                  key={emp.id}
                  onClick={() => setFilterEmpId(filterEmpId === emp.id ? null : emp.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors
                    ${filterEmpId === emp.id ? 'bg-surface-3' : 'hover:bg-surface-2'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${p.av}`}>
                    {initials(emp.name)}
                  </div>
                  <span className="flex-1 text-left font-medium text-content truncate">{emp.name}</span>
                  <span className="text-content-3">{empCount.get(emp.id) ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col bg-surface rounded-xl shadow-card border border-border overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-content">{headerLabel()}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(-1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:bg-surface-3 text-content-3 transition-colors"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <button
                onClick={() => navigate(1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:bg-surface-3 text-content-3 transition-colors"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden text-xs">
              {(['week', 'day'] as ViewMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 font-medium transition-colors
                    ${viewMode === m ? 'bg-primary text-content-inverse' : 'bg-surface text-content-2 hover:bg-surface-3'}`}
                >
                  {m === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-content-3 bg-surface-2 px-2.5 py-1 rounded-full border border-border">
              {bookings.length} Total
            </span>
            <span className="text-xs font-medium text-primary bg-primary-light px-2.5 py-1 rounded-full">
              {todayBkgs.length} Hoy
            </span>
            <span className="text-xs font-medium text-warning-text bg-warning-light px-2.5 py-1 rounded-full">
              {pendingCount} Pendientes
            </span>
            <Button size="sm" onClick={() => setShowNewBkg(true)}>
              + Nuevo turno
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-content-3 text-sm">Cargando turnos…</div>
          ) : viewMode === 'day' ? (

            /* ── DAY VIEW: columns = employees ── */
            <div className="flex flex-col h-full overflow-hidden">
              {dayColEmps.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-content-3 text-sm">
                  Sin turnos para este día
                </div>
              ) : (
                <>
                  {/* Employee headers */}
                  <div
                    className="grid shrink-0 border-b border-border"
                    style={{ gridTemplateColumns: `4rem repeat(${dayColEmps.length}, 1fr)` }}
                  >
                    <div className="h-16 border-r border-border" />
                    {dayColEmps.map(emp => {
                      const p = pal(emp.id);
                      const cnt = bkgsForDay(currentDate).filter(b => b.employee?.id === emp.id).length;
                      return (
                        <div key={emp.id} className="h-16 flex flex-col items-center justify-center border-r border-border last:border-r-0 gap-0.5">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${p.av}`}>
                            {initials(emp.name)}
                          </div>
                          <p className="text-xs font-semibold text-content">{emp.name}</p>
                          <p className="text-xs text-content-3">{cnt} {cnt === 1 ? 'turno' : 'turnos'}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Scrollable grid body */}
                  <div className="flex-1 overflow-y-auto">
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `4rem repeat(${dayColEmps.length}, 1fr)`,
                        height: `${CELL_H * HOURS.length}px`,
                      }}
                    >
                      {/* Hour labels */}
                      <div className="border-r border-border relative">
                        {HOURS.map(h => (
                          <div
                            key={h}
                            className="absolute w-full flex items-start justify-center"
                            style={{ top: `${(h - 8) * CELL_H}px`, height: `${CELL_H}px` }}
                          >
                            <span className="text-xs text-content-3 mt-1">{hLabel(h)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Employee columns */}
                      {dayColEmps.map(emp => {
                        const p = pal(emp.id);
                        const colBkgs = bkgsForDay(currentDate)
                          .filter(b => b.employee?.id === emp.id && b.service && b.date && b.endTime);
                        return (
                          <div key={emp.id} className="relative border-r border-border last:border-r-0">
                            {HOURS.map(h => (
                              <div
                                key={h}
                                className="absolute w-full border-b border-border/40"
                                style={{ top: `${(h - 8) * CELL_H}px`, height: `${CELL_H}px` }}
                              />
                            ))}
                            {colBkgs.map(b => (
                              <button
                                key={b.id}
                                className={`absolute rounded-md border text-xs font-medium text-left px-1.5 py-1 overflow-hidden hover:opacity-80 transition-opacity ${p.chip}`}
                                style={chipStyle(b)}
                                onClick={() => setSelectedBkg(b)}
                              >
                                <div className="truncate font-semibold">
                                  {new Date(b.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                  {' '}{b.service?.name}
                                </div>
                                <div className="truncate opacity-75">{b.user?.name ?? 'Walk-in'}</div>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

          ) : (

            /* ── WEEK VIEW: columns = days ── */
            <div className="flex flex-col h-full overflow-hidden">
              <div
                className="grid shrink-0 border-b border-border"
                style={{ gridTemplateColumns: '4rem repeat(7, 1fr)' }}
              >
                <div className="h-12 border-r border-border" />
                {weekDays.map(day => (
                  <button
                    key={day.toISOString()}
                    onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                    className={`h-12 flex flex-col items-center justify-center border-r border-border last:border-r-0 text-xs
                      ${isSameDay(day, new Date()) ? 'bg-primary-light' : 'hover:bg-surface-2'} transition-colors`}
                  >
                    <span className="text-content-3 uppercase tracking-wider">{DAY_S[day.getDay()]}</span>
                    <span className={`font-bold text-sm ${isSameDay(day, new Date()) ? 'text-primary' : 'text-content'}`}>
                      {day.getDate()}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                <div
                  className="grid"
                  style={{ gridTemplateColumns: '4rem repeat(7, 1fr)', height: `${CELL_H * HOURS.length}px` }}
                >
                  <div className="border-r border-border relative">
                    {HOURS.map(h => (
                      <div
                        key={h}
                        className="absolute w-full flex items-start justify-center"
                        style={{ top: `${(h - 8) * CELL_H}px`, height: `${CELL_H}px` }}
                      >
                        <span className="text-xs text-content-3 mt-1">{hLabel(h)}</span>
                      </div>
                    ))}
                  </div>
                  {weekDays.map(day => {
                    const dayB = bkgsForDay(day).filter(b => b.service && b.date && b.endTime);
                    return (
                      <div key={day.toISOString()} className="relative border-r border-border last:border-r-0">
                        {HOURS.map(h => (
                          <div
                            key={h}
                            className="absolute w-full border-b border-border/40"
                            style={{ top: `${(h - 8) * CELL_H}px`, height: `${CELL_H}px` }}
                          />
                        ))}
                        {dayB.map(b => {
                          const p = pal(b.employee?.id);
                          return (
                            <button
                              key={b.id}
                              className={`absolute rounded-md border text-xs font-medium text-left px-1.5 py-1 overflow-hidden hover:opacity-80 transition-opacity ${p.chip}`}
                              style={chipStyle(b)}
                              onClick={() => setSelectedBkg(b)}
                            >
                              <div className="truncate font-semibold">{b.service?.name ?? '—'}</div>
                              <div className="truncate opacity-75">{b.user?.name ?? '—'}</div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Booking detail modal ──────────────────────────────────── */}
      <Modal open={!!selectedBkg} onClose={() => setSelectedBkg(null)} title="Detalle del turno" size="sm">
        {selectedBkg && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-content">{selectedBkg.service?.name ?? '—'}</h3>
                <p className="text-sm text-content-3">{selectedBkg.business?.name ?? '—'}</p>
              </div>
              <StatusBadge label={selectedBkg.status} variant={bookingStatusVariant(selectedBkg.status)} />
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-content-3">Cliente</dt>
                <dd className="font-medium text-content">{selectedBkg.user?.name ?? '—'}</dd>
              </div>
              {selectedBkg.employee && (
                <div className="flex justify-between">
                  <dt className="text-content-3">Empleado</dt>
                  <dd className="font-medium text-content">{selectedBkg.employee.name}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-content-3">Inicio</dt>
                <dd className="font-medium text-content">
                  {new Date(selectedBkg.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-content-3">Fin</dt>
                <dd className="font-medium text-content">
                  {new Date(selectedBkg.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
              {selectedBkg.service && (
                <div className="flex justify-between">
                  <dt className="text-content-3">Duración</dt>
                  <dd className="font-medium text-content">{selectedBkg.service.durationMin} min</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-content-3">Precio</dt>
                <dd className="font-bold text-content">${selectedBkg.finalPrice?.toLocaleString('es-AR') ?? '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>

      {/* ── New booking modal ─────────────────────────────────────── */}
      <Modal open={showNewBkg} onClose={() => setShowNewBkg(false)} title="Nuevo turno">
        <BookingForm
          role="ADMIN"
          businessId={businessId || undefined}
          onSubmit={async data => {
            try {
              await createBooking(data);
              toast('Turno creado', 'success');
              setShowNewBkg(false);
              fetchBookings();
            } catch (err: any) {
              toast(err.message || 'Error al crear el turno', 'error');
              throw err;
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default Calendar;
