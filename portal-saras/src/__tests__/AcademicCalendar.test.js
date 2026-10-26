import { describe, it, expect } from 'vitest';
import { calculateAcademicWeek } from '../utils/academicCalendar';

describe('Academic Calendar Week Calculation (1-16 Cycle)', () => {
  it('correctly calculates Week 1 for Semester Gasal start (Mon 31 Aug 2026)', () => {
    const res = calculateAcademicWeek(new Date(2026, 7, 31));
    expect(res.week).toBe(1);
    expect(res.semester).toBe('Gasal');
    expect(res.semesterStart).toBe('2026-08-31');
  });

  it('correctly calculates Week 8 for Sun 25 Oct 2026', () => {
    const res = calculateAcademicWeek(new Date(2026, 9, 25));
    expect(res.week).toBe(8);
    expect(res.semester).toBe('Gasal');
  });

  it('correctly calculates Week 9 for Mon 26 Oct 2026', () => {
    const res = calculateAcademicWeek(new Date(2026, 9, 26));
    expect(res.week).toBe(9);
    expect(res.semester).toBe('Gasal');
  });

  it('clamps to Week 16 when past 16 weeks', () => {
    // 20 weeks after Aug 31 -> around mid January
    const res = calculateAcademicWeek(new Date(2027, 0, 20));
    expect(res.week).toBe(16);
    expect(res.isCapped).toBe(true);
  });

  it('clamps to Week 1 when before semester start', () => {
    const res = calculateAcademicWeek(new Date(2026, 7, 10)); // Aug 10, 2026
    expect(res.week).toBe(1);
  });

  it('handles Semester Genap starting in February', () => {
    // 2027-02-01 is first Monday of Feb 2027
    const feb1 = new Date(2027, 1, 1);
    const res = calculateAcademicWeek(feb1);
    expect(res.week).toBe(1);
    expect(res.semester).toBe('Genap');
  });
});
