import { useState, type FormEvent } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { AdditionalPassenger } from '@/api';

type AdditionalPassengersModalProps = {
  seatNumbers: string[];
  loading: boolean;
  error: string;
  onConfirm: (passengers: AdditionalPassenger[]) => void;
  onClose: () => void;
};

type PassengerDraft = { name: string; age: string };

function isCompleteDraft(draft: PassengerDraft): boolean {
  const age = Number(draft.age);
  return draft.name.trim().length >= 2 && /^\d{1,3}$/.test(draft.age) && age >= 1 && age <= 120;
}

export default function AdditionalPassengersModal({ seatNumbers, loading, error, onConfirm, onClose }: AdditionalPassengersModalProps) {
  const [drafts, setDrafts] = useState<PassengerDraft[]>(() => seatNumbers.map(() => ({ name: '', age: '' })));
  const complete = drafts.every(isCompleteDraft);

  function updateDraft(index: number, field: keyof PassengerDraft, value: string) {
    setDrafts((current) => current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, [field]: value } : draft)));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!complete || loading) return;
    onConfirm(drafts.map((draft) => ({ name: draft.name.trim(), age: Number(draft.age) })));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="confirmation-modal passenger-modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <p className="eyebrow">Passenger details</p>
        <h2>Who is travelling?</h2>
        <p>Add the name and age of each passenger for the extra seats you selected.</p>
        {seatNumbers.map((seat, index) => (
          <div className="passenger-row" key={seat}>
            <span className="passenger-seat">Seat {seat.replace('C', '')}</span>
            <label><span>Full name</span><input value={drafts[index].name} onChange={(event) => updateDraft(index, 'name', event.target.value)} placeholder="Passenger name" required /></label>
            <label><span>Age</span><input value={drafts[index].age} onChange={(event) => updateDraft(index, 'age', event.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Age" inputMode="numeric" required /></label>
          </div>
        ))}
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="modal-button passenger-submit" disabled={!complete || loading}>{loading ? 'Booking…' : 'Confirm and book'} <ArrowRight size={16} /></button>
      </form>
    </div>
  );
}
