import { describe, it, expect } from 'vitest';

const VALID_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['MATCHED', 'CANCELLED'],
  MATCHED: ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['STARTED', 'CANCELLED'],
  STARTED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

describe('State Machine Transitions (PRD Section 7.1)', () => {
  it('allows valid forward progression', () => {
    expect(canTransition('REQUESTED', 'MATCHED')).toBe(true);
    expect(canTransition('MATCHED', 'DRIVER_ARRIVED')).toBe(true);
    expect(canTransition('DRIVER_ARRIVED', 'STARTED')).toBe(true);
    expect(canTransition('STARTED', 'COMPLETED')).toBe(true);
  });

  it('allows cancellation before trip start', () => {
    expect(canTransition('REQUESTED', 'CANCELLED')).toBe(true);
    expect(canTransition('MATCHED', 'CANCELLED')).toBe(true);
    expect(canTransition('DRIVER_ARRIVED', 'CANCELLED')).toBe(true);
  });

  it('prohibits cancellation after trip start', () => {
    expect(canTransition('STARTED', 'CANCELLED')).toBe(false);
  });

  it('prohibits transitions from terminal states', () => {
    expect(canTransition('COMPLETED', 'STARTED')).toBe(false);
    expect(canTransition('CANCELLED', 'REQUESTED')).toBe(false);
  });
});
