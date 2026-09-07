import React from 'react';
import { Star as StarIcon, Trash2 as Trash2Icon } from 'lucide-react';
import { TeamMember, PerformanceNoteType } from '../../../types';

// ─── Star rating ──────────────────────────────────────────────────────────────

export const StarRating: React.FC<{
  rating: number;
  onSetRating?: (rating: number) => void;
}> = ({ rating, onSetRating }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={onSetRating ? () => onSetRating(star) : undefined}
        disabled={!onSetRating}
        aria-label={`Set rating to ${star}`}
        className={`p-0.5 transition-transform ${onSetRating ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
      >
        <StarIcon
          className={`w-6 h-6 transition-colors ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-brand-border'
          }`}
        />
      </button>
    ))}
  </div>
);

// ─── Note type badge ──────────────────────────────────────────────────────────

export const getNoteTypeClass = (type: PerformanceNoteType) => {
  switch (type) {
    case PerformanceNoteType.PRAISE:
      return 'bg-green-500/15 text-green-400 border-green-500/30';
    case PerformanceNoteType.CONCERN:
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    case PerformanceNoteType.LATE_DEADLINE:
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case PerformanceNoteType.GENERAL:
    default:
      return 'bg-brand-bg text-brand-text-secondary border-brand-border';
  }
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PerformanceTabProps {
  member: TeamMember;
  onSetRating: (rating: number) => void;
  newNote: string;
  setNewNote: (note: string) => void;
  newNoteType: PerformanceNoteType;
  setNewNoteType: (type: PerformanceNoteType) => void;
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
  member,
  onSetRating,
  newNote,
  setNewNote,
  newNoteType,
  setNewNoteType,
  onAddNote,
  onDeleteNote,
}) => (
  <div className="space-y-5">
    {/* Rating card */}
    <div className="bg-brand-bg border border-brand-border rounded-2xl p-4">
      <p className="text-xs font-black uppercase tracking-widest text-brand-text-secondary mb-3">
        Rating Kinerja Keseluruhan
      </p>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <StarRating rating={member.rating} onSetRating={onSetRating} />
        <span className="text-2xl font-black text-brand-text-primary">
          {member.rating.toFixed(1)}
          <span className="text-sm font-medium text-brand-text-secondary"> / 5</span>
        </span>
      </div>
      <p className="text-xs text-brand-text-secondary mt-2">
        Klik bintang untuk mengubah rating.
      </p>
    </div>

    {/* Add note form */}
    <div className="bg-brand-bg border border-brand-border rounded-2xl p-4 space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-brand-text-secondary">
        Tambah Catatan Baru
      </p>
      <textarea
        id="newPerformanceNote"
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        rows={3}
        placeholder="Tulis catatan kinerja..."
        className="w-full px-3 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-surface text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/60 transition-all resize-none"
      />
      <div className="flex items-center gap-2">
        <select
          value={newNoteType}
          onChange={(e) => setNewNoteType(e.target.value as PerformanceNoteType)}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-brand-border bg-brand-surface text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all"
        >
          {Object.values(PerformanceNoteType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button
          onClick={onAddNote}
          disabled={!newNote.trim()}
          className="button-primary px-4 py-2 text-sm disabled:opacity-40"
        >
          Tambah
        </button>
      </div>
    </div>

    {/* Notes history */}
    <div className="space-y-2">
      <p className="text-xs font-black uppercase tracking-widest text-brand-text-secondary px-1">
        Riwayat Catatan ({member.performanceNotes.length})
      </p>

      {member.performanceNotes.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <svg className="w-10 h-10 text-brand-text-secondary/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-brand-text-secondary">Belum ada catatan kinerja.</p>
        </div>
      ) : (
        [...member.performanceNotes]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((note) => (
            <div
              key={note.id}
              className="flex justify-between items-start gap-3 p-3.5 bg-brand-bg border border-brand-border rounded-xl hover:border-brand-border/80 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border ${getNoteTypeClass(note.type)}`}
                  >
                    {note.type}
                  </span>
                  <span className="text-xs text-brand-text-secondary">
                    {new Date(note.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-brand-text-primary leading-relaxed">{note.note}</p>
              </div>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="shrink-0 p-1.5 rounded-lg text-brand-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all"
                aria-label="Hapus catatan"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </div>
          ))
      )}
    </div>
  </div>
);

export default PerformanceTab;
