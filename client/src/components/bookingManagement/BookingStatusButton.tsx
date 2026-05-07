import { useState } from 'react';
import { updateBookingStatus } from '../../services/bookingService';
import Button from '../ui/Button';

interface BookingStatusButtonProps {
  bookingId: string;
  currentStatus: string;
  onStatusUpdate: () => void;
}

type Transition = { label: string; next: string; variant: 'primary' | 'danger' | 'ghost' };

const TRANSITIONS: Record<string, Transition[]> = {
  PENDING: [
    { label: 'Confirmar',  next: 'CONFIRMED', variant: 'primary' },
    { label: 'Cancelar',   next: 'CANCELLED', variant: 'danger'  },
  ],
  CONFIRMED: [
    { label: 'Completar',  next: 'COMPLETED', variant: 'primary' },
    { label: 'Cancelar',   next: 'CANCELLED', variant: 'danger'  },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

const BookingStatusButton = ({ bookingId, currentStatus, onStatusUpdate }: BookingStatusButtonProps) => {
  const [loadingNext, setLoadingNext] = useState<string | null>(null);

  const transitions = TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) return null;

  const handleChange = async (next: string) => {
    setLoadingNext(next);
    try {
      await updateBookingStatus(bookingId, next);
      onStatusUpdate();
    } catch {
      // error is handled by caller's toast or console
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
          onClick={() => handleChange(t.next)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
};

export default BookingStatusButton;
