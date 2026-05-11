import type { AppStore } from '../types';

const DRAFT_KEY = 'notes-autosave-draft';
const DRAFT_META_KEY = 'notes-autosave-meta';
const MAX_DRAFTS = 5;

interface DraftMeta {
  id: string;
  timestamp: string;
  docTitle: string;
}

interface DraftEntry {
  meta: DraftMeta;
  data: AppStore;
}

export function saveDraft(data: AppStore, activeDocTitle?: string): void {
  try {
    const meta: DraftMeta = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString(),
      docTitle: activeDocTitle || '',
    };

    // Save current draft
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ meta, data }));

    // Rotate old drafts, keep last MAX_DRAFTS
    const history = getDraftHistory();
    history.push(meta);
    if (history.length > MAX_DRAFTS) {
      history.splice(0, history.length - MAX_DRAFTS);
    }
    localStorage.setItem(DRAFT_META_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save draft to localStorage:', e);
  }
}

export function loadLatestDraft(): DraftEntry | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftEntry;
  } catch (e) {
    console.error('Failed to load draft from localStorage:', e);
    return null;
  }
}

export function getDraftHistory(): DraftMeta[] {
  try {
    const raw = localStorage.getItem(DRAFT_META_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DraftMeta[];
  } catch {
    return [];
  }
}

export function clearDrafts(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_META_KEY);
  } catch {
    // noop
  }
}

/**
 * Check if a local draft is newer than a given timestamp.
 * Returns true if there's a local draft that was saved after `compareTime`.
 */
export function hasNewerDraft(compareTime?: string): boolean {
  const draft = loadLatestDraft();
  if (!draft) return false;
  if (!compareTime) return true;
  return new Date(draft.meta.timestamp) > new Date(compareTime);
}

/**
 * Detect differences between draft and current store.
 * Returns keys that differ at the top level.
 */
export function detectConflicts(draft: AppStore, current: AppStore): string[] {
  const conflicts: string[] = [];
  const draftStr = JSON.stringify(draft.notebooks);
  const currentStr = JSON.stringify(current.notebooks);
  if (draftStr !== currentStr) conflicts.push('notebooks');
  if (JSON.stringify(draft.trash) !== JSON.stringify(current.trash)) conflicts.push('trash');
  if (JSON.stringify(draft.tags) !== JSON.stringify(current.tags)) conflicts.push('tags');
  return conflicts;
}
