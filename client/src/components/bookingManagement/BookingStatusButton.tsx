import { useState } from 'react';
import { updateBookingStatus } from '../../services/bookingService';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

type Role = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

interface BookingStatusButtonProps {
  bookingId: string;
  currentStatus: string;
  /** Rol del usuario logueado: define qué acciones se muestran */
  role: Role;
  onStatusUpdate: () => void;
}

type Transition = {
  label: string;
  next: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  variant: 'primary' | 'danger' | 'ghost';
  /** Roles que pueden ejecutar esta transición (espejo de las reglas del backend) */
  roles: Role[];
};

const STAFF: Role[] = ['ADMIN', 'EMPLOYEE'];
const EVERYONE: Role[] = ['ADMIN', 'EMPLOYEE', 'CLIENT'];

const TRANSITIONS: Record<string, Transition[]> = {
  PENDING: [
    { label: 'Confirmar', next: 'CONFIRMED', variant: 'primary', roles: STAFF },
    { label: 'Cancelar',  next: 'CANCELLED', variant: 'danger',  roles: EVERYONE },
  ],
  CONFIRMED: [
    { label: 'Completar', next: 'COMPLETED', variant: 'primary', roles: STAFF },
    { label: 'Cancelar',  next: 'CANCELLED', variant: 'danger',  roles: EVERYONE },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

const SUCCESS_MESSAGE: Record<Transition['next'], string> = {
  CONFIRMED: 'Turno confirmado',
  COMPLETED: 'Turno completado',
  CANCELLED: 'Turno cancelado',
};

const BookingStatusButton = ({ bookingId, currentStatus, role, onStatusUpdate }: BookingStatusButtonProps) => {
  const { toast } = useToast();
  const [loadingNext, setLoadingNext] = useState<string | null>(null);

  const transitions = (TRANSITIONS[currentStatus] ?? []).filter(t => t.roles.includes(role));

  if (transitions.length === 0) return null;

  const handleChange = async (next: Transition['next']) => {
    if (next === 'CANCELLED' && !window.confirm('¿Seguro que querés cancelar este turno?')) return;
    setLoadingNext(next);
    try {
      await updateBookingStatus(bookingId, next);
      toast(SUCCESS_MESSAGE[next], 'success');
      onStatusUpdate();
    } catch (err) {
      // Antes el error se descartaba en silencio y el botón "no hacía nada"
      toast(err instanceof Error ? err.message : 'No se pudo actualizar el turno', 'error');
    } finally {
      setLoadingNext(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {transitions.map(t => (
        <Button
          key={t.next}
          size="sm"
          variant={t.variant}
          loading={loadingNext === t.next}
          disabled={loadingNext !== null}
          onClick={() => void handleChange(t.next)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
};

export default BookingStatusButton;
