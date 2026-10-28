import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredNeighborhoodGroups,
  saveStoredNeighborhoodGroups,
  claimNeighborhoodTask,
  completeNeighborhoodTask,
  approveNeighborhoodTask,
  postNeighborhoodTask,
  INITIAL_GROUPS,
  GROUPS_STORAGE_KEY,
} from '../engine/friends';

describe('Nabolagsgrupper & Oppgaver (Korskirkeallmenningen)', () => {
  beforeEach(() => {
    // Tilbakestill til initiell tilstand
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(GROUPS_STORAGE_KEY);
    }
    saveStoredNeighborhoodGroups(INITIAL_GROUPS);
  });

  it('1. Korskirkeallmenningen nabolag er tilgjengelig med oppgaver og beboere', () => {
    const groups = getStoredNeighborhoodGroups();
    const korskirken = groups.find(g => g.id === 'grp-korskirken');

    expect(korskirken).toBeDefined();
    expect(korskirken?.name).toBe('Korskirkeallmenningen Nabolag');
    expect(korskirken?.area).toContain('Korskirkeallmenningen');
    expect(korskirken?.memberCount).toBeGreaterThanOrEqual(40);
    expect(korskirken?.tasks.length).toBeGreaterThanOrEqual(3);
  });

  it('2. Et barn kan ta et åpent nabolagsoppdrag', () => {
    const groups = getStoredNeighborhoodGroups();
    const korskirken = groups.find(g => g.id === 'grp-korskirken')!;
    const openTask = korskirken.tasks.find(t => t.status === 'open')!;

    const claimed = claimNeighborhoodTask('grp-korskirken', openTask.id, 'Oliver (9 år)');
    expect(claimed).toBe(true);

    const updatedGroups = getStoredNeighborhoodGroups();
    const updatedTask = updatedGroups
      .find(g => g.id === 'grp-korskirken')!
      .tasks.find(t => t.id === openTask.id)!;

    expect(updatedTask.status).toBe('claimed');
    expect(updatedTask.assignedChildName).toBe('Oliver (9 år)');
  });

  it('3. Barnet kan markere oppgaven som fullført', () => {
    const groups = getStoredNeighborhoodGroups();
    const korskirken = groups.find(g => g.id === 'grp-korskirken')!;
    const claimedTask = korskirken.tasks.find(t => t.status === 'claimed')!;

    const completed = completeNeighborhoodTask('grp-korskirken', claimedTask.id);
    expect(completed).toBe(true);

    const updatedGroups = getStoredNeighborhoodGroups();
    const updatedTask = updatedGroups
      .find(g => g.id === 'grp-korskirken')!
      .tasks.find(t => t.id === claimedTask.id)!;

    expect(updatedTask.status).toBe('completed');
  });

  it('4. Naboen som lyste ut oppdraget kan godkjenne og overføre Luks-poengene', () => {
    // Først claim og complete en oppgave
    const groups = getStoredNeighborhoodGroups();
    const korskirken = groups.find(g => g.id === 'grp-korskirken')!;
    const task = korskirken.tasks[0];
    claimNeighborhoodTask('grp-korskirken', task.id, 'Oliver');
    completeNeighborhoodTask('grp-korskirken', task.id);

    // Nå godkjenn
    const res = approveNeighborhoodTask('grp-korskirken', task.id);
    expect(res.success).toBe(true);
    expect(res.points).toBe(task.rewardPoints);

    const updatedGroups = getStoredNeighborhoodGroups();
    const updatedTask = updatedGroups
      .find(g => g.id === 'grp-korskirken')!
      .tasks.find(t => t.id === task.id)!;

    expect(updatedTask.status).toBe('approved');
  });

  it('5. Naboer kan lyse ut nye oppdrag i nabolagsgruppen', () => {
    const newTask = postNeighborhoodTask('grp-korskirken', {
      title: 'Plukke epler i hagen',
      description: 'Plukke ned to kasser med epler før frosten kommer.',
      rewardPoints: 200,
      posterName: 'Solveig',
      posterAddress: 'Korskirkeallmenningen 14',
    });

    expect(newTask.id).toBeDefined();
    expect(newTask.status).toBe('open');

    const groups = getStoredNeighborhoodGroups();
    const korskirken = groups.find(g => g.id === 'grp-korskirken')!;
    expect(korskirken.tasks.some(t => t.id === newTask.id)).toBe(true);
  });
});
