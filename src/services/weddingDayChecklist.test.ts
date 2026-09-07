import { describe, it, expect } from 'vitest';
import { normalizeChecklist } from './weddingDayChecklist';

describe('weddingDayChecklist service', () => {
  describe('normalizeChecklist', () => {
    it('should correctly map all fields from database row to WeddingDayChecklist object', () => {
      const dbRow = {
        id: '1',
        project_id: 'proj-123',
        category: 'Persiapan',
        item_name: 'Cek perlengkapan makeup',
        is_completed: false,
        assigned_to: 'user-456',
        notes: 'Important notes',
        created_at: '2023-10-27T10:00:00Z',
        updated_at: '2023-10-27T11:00:00Z',
      };

      const result = normalizeChecklist(dbRow);

      expect(result).toEqual({
        id: '1',
        projectId: 'proj-123',
        category: 'Persiapan',
        itemName: 'Cek perlengkapan makeup',
        isCompleted: false,
        assignedTo: 'user-456',
        notes: 'Important notes',
        createdAt: '2023-10-27T10:00:00Z',
        updatedAt: '2023-10-27T11:00:00Z',
      });
    });

    it('should map null or missing optional fields to undefined', () => {
      const dbRow = {
        id: '2',
        project_id: 'proj-456',
        category: 'Mempelai Pria',
        item_name: 'Foto detail aksesoris',
        is_completed: true,
        assigned_to: null,
        notes: '',
        created_at: '2023-10-28T09:00:00Z',
        updated_at: '2023-10-28T09:30:00Z',
      };

      const result = normalizeChecklist(dbRow);

      expect(result.assignedTo).toBeUndefined();
      // Empty string for notes should also result in undefined because of `row.notes || undefined`
      expect(result.notes).toBeUndefined();
    });

    it('should handle missing optional fields in the row object', () => {
      const dbRow = {
        id: '3',
        project_id: 'proj-789',
        category: 'Catering',
        item_name: 'Cek menu utama',
        is_completed: false,
        created_at: '2023-10-29T08:00:00Z',
        updated_at: '2023-10-29T08:00:00Z',
      };

      const result = normalizeChecklist(dbRow);

      expect(result.assignedTo).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });
});
