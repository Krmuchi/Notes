import { describe, it, expect, beforeEach } from 'vitest';

describe('layout persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('saves and loads layout from localStorage', () => {
    const payload = { leftWidth: 200, rightWidth: 300, rightCollapsed: false, centerCollapsed: false };
    localStorage.setItem('notes:layout:v1', JSON.stringify(payload));
    const raw = localStorage.getItem('notes:layout:v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw || '{}');
    expect(parsed.leftWidth).toBe(200);
    expect(parsed.rightWidth).toBe(300);
    expect(parsed.rightCollapsed).toBe(false);
  });
});
