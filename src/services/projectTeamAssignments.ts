import supabase from '../lib/supabaseClient';
import { AssignedTeamMember } from '../types';

const TABLE = 'project_team_assignments';

function toRow(projectId: string, a: AssignedTeamMember) {
  return {
    ...(a.id ? { id: a.id } : {}),
    project_id: projectId,
    member_id: a.memberId,
    member_name: a.name,
    member_role: a.role,
    fee: a.fee ?? 0,
    sub_job: a.subJob ?? null,
  } as any;
}

function fromRow(row: any): AssignedTeamMember {
  return {
    id: row.id,
    memberId: row.member_id,
    name: row.member_name,
    role: row.member_role,
    fee: Number(row.fee || 0),
    subJob: row.sub_job || undefined,
  };
}

export async function listAssignmentsByProject(projectId: string): Promise<AssignedTeamMember[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return (data || []).map(fromRow);
}

/**
 * Updates team assignments for a project using an atomic diffing strategy:
 * - Prevents duplicate assignments for the same member + role
 * - Matches existing records by ID or role slot to perform UPDATE instead of INSERT
 * - Only inserts brand new assignments
 * - Only deletes removed assignments without replacements
 */
export async function upsertAssignmentsForProject(projectId: string, assignments: AssignedTeamMember[]): Promise<AssignedTeamMember[]> {
  // 1. Fetch existing assignments
  const { data: existingRows, error: fetchErr } = await supabase
    .from(TABLE)
    .select('*')
    .eq('project_id', projectId);
  if (fetchErr) {
    console.error('[projectTeamAssignments] Fetch error:', fetchErr);
    throw fetchErr;
  }
  const existing = (existingRows || []).map(fromRow);

  // 2. Deduplicate incoming assignments by memberId + role
  const seenKeys = new Set<string>();
  const uniqueIncoming: AssignedTeamMember[] = [];
  for (const a of (assignments || [])) {
    if (!a.memberId) continue;
    const key = `${a.memberId}::${(a.role || '').trim().toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueIncoming.push(a);
    }
  }

  // 3. Diffing: Match incoming items to existing records
  const matchedExistingIds = new Set<string>();
  const toUpdate: Array<{ id: string; memberId: string; name: string; role: string; fee: number; subJob?: string }> = [];
  const toInsert: Array<{ memberId: string; name: string; role: string; fee: number; subJob?: string }> = [];

  // Track unmatched existing rows
  const remainingExisting = [...existing];

  // Pass 1: Match by exact assignment ID
  const unmatchedIncomingPass1: AssignedTeamMember[] = [];
  for (const inc of uniqueIncoming) {
    if (inc.id) {
      const idx = remainingExisting.findIndex(e => e.id === inc.id);
      if (idx !== -1) {
        const found = remainingExisting.splice(idx, 1)[0];
        matchedExistingIds.add(found.id!);
        toUpdate.push({
          id: found.id!,
          memberId: inc.memberId,
          name: inc.name,
          role: inc.role,
          fee: inc.fee ?? 0,
          subJob: inc.subJob,
        });
        continue;
      }
    }
    unmatchedIncomingPass1.push(inc);
  }

  // Pass 2: Match by memberId (same person already had an assignment row on this project)
  const unmatchedIncomingPass2: AssignedTeamMember[] = [];
  for (const inc of unmatchedIncomingPass1) {
    const idx = remainingExisting.findIndex(e => e.memberId === inc.memberId);
    if (idx !== -1) {
      const found = remainingExisting.splice(idx, 1)[0];
      matchedExistingIds.add(found.id!);
      toUpdate.push({
        id: found.id!,
        memberId: inc.memberId,
        name: inc.name,
        role: inc.role,
        fee: inc.fee ?? 0,
        subJob: inc.subJob,
      });
      continue;
    }
    unmatchedIncomingPass2.push(inc);
  }

  // Pass 3: Match by vacated role slot (e.g., Andi replaced by Budi in 'Fotografer' role)
  // This satisfies: "EDIT = LOAD EXISTING DATA -> MODIFY EXISTING RECORD -> UPDATE EXISTING RECORD"
  for (const inc of unmatchedIncomingPass2) {
    const normRole = (inc.role || '').trim().toLowerCase();
    const idx = remainingExisting.findIndex(e => (e.role || '').trim().toLowerCase() === normRole);
    if (idx !== -1) {
      const found = remainingExisting.splice(idx, 1)[0];
      matchedExistingIds.add(found.id!);
      toUpdate.push({
        id: found.id!,
        memberId: inc.memberId,
        name: inc.name,
        role: inc.role,
        fee: inc.fee ?? 0,
        subJob: inc.subJob,
      });
    } else {
      // Completely new assignment slot
      toInsert.push({
        memberId: inc.memberId,
        name: inc.name,
        role: inc.role,
        fee: inc.fee ?? 0,
        subJob: inc.subJob,
      });
    }
  }

  // Pass 4: Execute updates on existing records
  for (const item of toUpdate) {
    const { error: updErr } = await supabase
      .from(TABLE)
      .update({
        member_id: item.memberId,
        member_name: item.name,
        member_role: item.role,
        fee: item.fee,
        sub_job: item.subJob ?? null,
      })
      .eq('id', item.id);
    if (updErr) {
      console.error('[projectTeamAssignments] Update error:', updErr);
      throw updErr;
    }
  }

  // Pass 5: Execute inserts for new records
  if (toInsert.length > 0) {
    const insertPayload = toInsert.map(item => ({
      project_id: projectId,
      member_id: item.memberId,
      member_name: item.name,
      member_role: item.role,
      fee: item.fee,
      sub_job: item.subJob ?? null,
    }));
    const { error: insErr } = await supabase
      .from(TABLE)
      .insert(insertPayload);
    if (insErr) {
      console.error('[projectTeamAssignments] Insert error:', insErr);
      throw insErr;
    }
  }

  // Pass 6: Delete only records that were truly removed
  const toDeleteIds = remainingExisting.map(e => e.id).filter(Boolean) as string[];
  if (toDeleteIds.length > 0) {
    const { error: delErr } = await supabase
      .from(TABLE)
      .delete()
      .in('id', toDeleteIds);
    if (delErr) {
      console.error('[projectTeamAssignments] Delete error:', delErr);
      throw delErr;
    }
  }

  // Return fresh state from DB
  return await listAssignmentsByProject(projectId);
}

export async function deleteAssignmentsByProject(projectId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('project_id', projectId);
  if (error) throw error;
}
