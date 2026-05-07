import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import StatusBadge, { bookingStatusVariant } from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

interface CalendarBooking {
  id: string;
  date: string;
  endTime: string;
  status: string;
  finalPrice: number;
  service: { name: string; durationMin: number };
  business: { name: string };
  employee?: { name: string } | null;
  user: { name: string };
}

type ViewMode = 'week' | 'day';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 - 21:00

const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

const getWeekDays = (base: Date): Date[] => {
  const monday = new Date(base);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const minutesSinceMidnight = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_LONG  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-success-light border-success text-success-text',
  PENDING:   'bg-warning-light border-warning text-warning-text',
  CANCELLED: 'bg-danger-light  border-danger  text-danger-text',
  COMPLETED: 'bg-info-light    border-info    text-info-text',
};

const Calendar: React.FC = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);

  const weekDays = getWeekDays(currentDate);
  const viewDays = viewMode === 'week' ? weekDays : [currentDate];

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const start = viewDays[0].toISOString().slice(0, 10);
      const end   = viewDays[viewDays.length - 1].toISOString().slice(0, 10);
      const res   = await apiClient.get(`/bookings/my-bookings?from=${start}&to=${end}`);
      setBookings(res.data);
    } catch {
      setError('No se pudieron cargar los turnos');
    } finally {
      setLoading(false);
    }
  }, [token, currentDate, viewMode]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else                     d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const bookingsForDay = (day: Date) => {
    const iso = day.toISOString().slice(0, 10);
    return bookings.filter(b => new Date(b.date).toISOString().slice(0, 10) === iso);
  };

  const chipStyle = (b: CalendarBooking): React.CSSProperties => {
    const start     = minutesSinceMidnight(b.date);
    const end       = minutesSinceMidnight(b.endTime);
    const dayStart  = 8 * 60;
    const topPct    = ((start - dayStart) / (14 * 60)) * 100;
    const heightPct = ((end - start) / (14 * 60)) * 100;
    return {
      top:    `${topPct}%`,
      height: `max(${heightPct}%, 2.5rem)`,
      left: '2px', right: '2px',
    };
  };

  const headerLabel = () => {
    if (viewMode === 'week') {
      const start = weekDays[0];
      const end   = weekDays[6];
      return `${start.getDate()} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${DAY_NAMES_LONG[currentDate.getDay()]} ${currentDate.getDate()} de ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return d.toDateString() === t.toDateString();
  };

  const CELL_HEIGHT = 56; // px per hour

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-surface-3 transition-colors text-content-2"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-content min-w-52 text-center">{headerLabel()}</span>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-surface-3 transition-colors text-content-2"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoy
          </Button>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {(['week', 'day'] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-4 py-1.5 font-medium transition-colors ${
                viewMode === m ? 'bg-primary text-content-inverse' : 'bg-surface text-content-2 hover:bg-surface-3'
              }`}
            >
              {m === 'week' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-danger-light border border-danger/30 text-danger-text px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Calendar grid */}
      <div className="flex-1 bg-surface rounded-xl shadow-card border border-border overflow-hidden flex flex-col min-h-0">
        {/* Day headers */}
        <div className={`grid border-b border-border ${viewMode === 'week' ? 'grid-cols-[4rem_repeat(7,1fr)]' : 'grid-cols-[4rem_1fr]'}`}>
          <div className="h-12 border-r border-border" />
          {viewDays.map(day => (
            <div
              key={day.toISOString()}
              className={`h-12 flex flex-col items-center justify-center border-r border-border last:border-r-0 text-xs
                ${isToday(day) ? 'bg-primary-light' : ''}`}
            >
              <span className="text-content-3 uppercase tracking-wider">
                {DAY_NAMES_SHORT[day.getDay()]}
              </span>
              <span className={`font-bold text-sm ${isToday(day) ? 'text-primary' : 'text-content'}`}>
                {day.getDate()}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable grid body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-content-3 text-sm">
              Cargando turnos...
            </div>
          ) : (
            <div
              className={`grid ${viewMode === 'week' ? 'grid-cols-[4rem_repeat(7,1fr)]' : 'grid-cols-[4rem_1fr]'}`}
              style={{ height: `${CELL_HEIGHT * HOURS.length}px` }}
            >
              {/* Hour labels */}
              <div className="border-r border-border relative">
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full flex items-start justify-center"
                    style={{ top: `${(h - 8) * CELL_HEIGHT}px`, height: `${CELL_HEIGHT}px` }}
                  >
                    <span className="text-xs text-content-3 mt-1">{formatHour(h)}</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {viewDays.map(day => {
                const dayBookings = bookingsForDay(day);
                return (
                  <div key={day.toISOString()} className="relative border-r border-border last:border-r-0">
                    {/* Hour grid lines */}
                    {HOURS.map(h => (
                      <div
                        key={h}
                        className="absolute w-full border-b border-border/50"
                        style={{ top: `${(h - 8) * CELL_HEIGHT}px`, height: `${CELL_HEIGHT}px` }}
                      />
                    ))}
                    {/* Booking chips */}
                    {dayBookings.map(b => (
                      <button
                        key={b.id}
                        className={`absolute rounded-md border text-xs font-medium text-left px-1.5 py-1 overflow-hidden transition-opacity hover:opacity-80 ${statusColors[b.status] ?? 'bg-surface-3 text-content'}`}
                        style={chipStyle(b)}
                        onClick={() => setSelectedBooking(b)}
                      >
                        <div className="truncate font-semibold">{b.service.name}</div>
                        <div className="truncate opacity-75">{b.user.name}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Detalle del turno"
        size="sm"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-content">{selectedBooking.service.name}</h3>
                <p className="text-sm text-content-3">{selectedBooking.business.name}</p>
              </div>
              <StatusBadge
                label={selectedBooking.status}
                variant={bookingStatusVariant(selectedBooking.status)}
              />
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-content-3">Cliente</dt>
                <dd className="font-medium text-content">{selectedBooking.user.name}</dd>
              </div>
              {selectedBooking.employee && (
                <div className="flex justify-between">
                  <dt className="text-content-3">Empleado</dt>
                  <dd className="font-medium text-content">{selectedBooking.employee.name}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-content-3">Inicio</dt>
                <dd className="font-medium text-content">
                  {new Date(selectedBooking.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-content-3">Fin</dt>
                <dd className="font-medium text-content">
                  {new Date(selectedBooking.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-content-3">Duración</dt>
                <dd className="font-medium text-content">{selectedBooking.service.durationMin} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-content-3">Precio</dt>
                <dd className="font-bold text-content">${selectedBooking.finalPrice.toLocaleString('es-AR')}</dd>
              </div>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Calendar;
