import { create } from 'zustand';
import type { AppStore, NoteDoc, Notebook, ShareLink, Tag, TagStats, SearchHistory, SearchSuggestion, SearchFilter, SearchResult, DocVersion } from '../types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface NotesStore extends AppStore {
  // Actions
  loadNotes: () => Promise<void>;
  saveNotes: () => Promise<void>;
  updateStore: (store: AppStore) => void;

  // Auto-save state
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  setSaveStatus: (status: SaveStatus) => void;
  
  // Notebook actions
  createNotebook: (title: string) => void;
  updateNotebookTitle: (id: string, title: string) => void;
  deleteNotebook: (id: string) => void;
  
  // Document actions
  createDoc: (notebookId: string, parentId: string | null, docData?: Partial<NoteDoc>) => void;
  updateDoc: (notebookId: string, docId: string, updates: Partial<NoteDoc>) => void;
  deleteDoc: (notebookId: string, docId: string) => void;
  moveDocToTrash: (notebookId: string, docId: string) => void;
  
  // Version history actions
  saveVersion: (notebookId: string, docId: string, type: 'auto' | 'manual' | 'published') => void;
  getDocVersions: (notebookId: string, docId: string) => DocVersion[] | undefined;
  restoreVersion: (notebookId: string, docId: string, versionId: string) => void;
  
  // Favorite actions
  toggleFavorite: (notebookId: string, docId: string) => void;
  
  // Trash actions
  restoreFromTrash: (docId: string) => void;
  deleteFromTrash: (docId: string) => void;
  clearTrash: () => void;
  
  // Share actions
  generateShareLink: (notebookId: string, docId: string, permission: 'view' | 'comment' | 'edit' | 'manage', password: string, expiresAt: string | null) => void;
  deleteShareLink: (notebookId: string, docId: string, linkId: string) => void;
  
  // Tag actions
  createTag: (name: string, color?: string, icon?: string, parentId?: string | null) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  addTagToDoc: (notebookId: string, docId: string, tagId: string) => void;
  removeTagFromDoc: (notebookId: string, docId: string, tagId: string) => void;
  updateTagUsageCounts: () => void;
  getTagStats: () => TagStats;
  getRecommendedTags: (docContent: string, limit?: number) => Tag[];
  batchUpdateTags: (tagIds: string[], updates: Partial<Tag>) => void;
  getTagsWithHierarchy: () => Tag[];
  
  // Search actions
  search: (query: string, filters?: SearchFilter) => SearchResult[];
  getSearchSuggestions: (query: string) => SearchSuggestion[];
  addSearchHistory: (query: string, resultCount: number) => void;
  clearSearchHistory: () => void;
  removeSearchHistoryItem: (id: string) => void;
  
  // Active states
  activeNotebookId: string;
  activeDocId: string;
  setActiveNotebookId: (id: string) => void;
  setActiveDocId: (id: string) => void;
  
  // Search
  searchText: string;
  setSearchText: (text: string) => void;
}

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const generateShareUrl = (docId: string, linkId: string) => {
  return `${window.location.origin}/share/${docId}/${linkId}`;
};

const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];


export const useNotesStore = create<NotesStore>((set, get) => ({
  notebooks: [],
  trash: [],
  tags: [],
  searchHistory: [],
  activeNotebookId: '',
  activeDocId: '',
  searchText: '',
  saveStatus: 'idle' as SaveStatus,
  lastSavedAt: null,
  setSaveStatus: (status) => set({ saveStatus: status }),

  loadNotes: async () => {
    try {
      const loaded = await window.notesApi.load();
      const normalized: AppStore = {
        notebooks: loaded.notebooks.map((notebook) => ({
          ...notebook,
          docs: notebook.docs.map((doc) => ({
            ...doc,
            parentId: doc.parentId ?? null,
            tags: doc.tags ?? [],
            favorite: doc.favorite ?? false,
            pinned: doc.pinned ?? false,
            shareLinks: doc.shareLinks ?? [],
            shareSettings: doc.shareSettings ?? {
              enabled: false,
              defaultPermission: 'view',
              allowPassword: true,
              allowExpiration: true,
            },
          })),
        })),
        trash: (loaded.trash ?? []).map((doc) => ({
          ...doc,
          parentId: doc.parentId ?? null,
          tags: doc.tags ?? [],
          favorite: doc.favorite ?? false,
          pinned: doc.pinned ?? false,
          notebookId: doc.notebookId ?? "",
          notebookTitle: doc.notebookTitle ?? "未归类知识库",
          originalParentId: doc.originalParentId ?? doc.parentId ?? null,
        })),
        tags: (loaded.tags ?? []).map(tag => ({
          ...tag,
          parentId: tag.parentId ?? null,
          usageCount: tag.usageCount ?? 0,
        })),
        searchHistory: loaded.searchHistory ?? [],
      };
      
      const now = new Date().toISOString();
      set({ ...normalized, lastSavedAt: now, saveStatus: 'saved' });

      if (normalized.notebooks.length > 0) {
        const firstNotebook = normalized.notebooks[0];
        set({ activeNotebookId: firstNotebook.id });
        
        if (firstNotebook.docs.length > 0) {
          set({ activeDocId: firstNotebook.docs[0].id });
        }
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  },

  saveNotes: async () => {
    const { notebooks, trash, tags } = get();
    set({ saveStatus: 'saving' });
    try {
      await window.notesApi.save({ notebooks, trash, tags, searchHistory: get().searchHistory });
      set({ saveStatus: 'saved', lastSavedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to save notes:', error);
      set({ saveStatus: 'error' });
    }
  },

  updateStore: (store) => set({ ...store }),

  createNotebook: (title) => {
    const { notebooks } = get();
    const newNotebook: Notebook = { 
      id: newId(), 
      title: title || "新建知识库", 
      docs: [] 
    };
    
    const updatedNotebooks = [...notebooks, newNotebook];
    set({ 
      notebooks: updatedNotebooks,
      activeNotebookId: newNotebook.id
    });
  },

  updateNotebookTitle: (id, title) => {
    const { notebooks } = get();
    const updatedNotebooks = notebooks.map(nb => 
      nb.id === id ? { ...nb, title } : nb
    );
    set({ notebooks: updatedNotebooks });
  },

  deleteNotebook: (id) => {
    const { notebooks, activeNotebookId } = get();
    const target = notebooks.find(nb => nb.id === id);
    
    if (!target) return;
    
    const docsToTrash = target.docs.map(doc => ({
      ...doc,
      parentId: null,
      originalParentId: doc.parentId ?? null,
      updatedAt: new Date().toISOString(),
      notebookId: target.id,
      notebookTitle: target.title,
    }));
    
    const updatedNotebooks = notebooks.filter(nb => nb.id !== id);
    const updatedTrash = [...get().trash, ...docsToTrash];
    
    set({ 
      notebooks: updatedNotebooks, 
      trash: updatedTrash,
      ...(activeNotebookId === id ? { 
        activeNotebookId: updatedNotebooks[0]?.id || '',
        activeDocId: ''
      } : {})
    });
  },

  createDoc: (notebookId, parentId, docData = {}) => {
    const { notebooks } = get();
    const newDoc: NoteDoc = {
      id: newId(),
      title: docData.title || "未命名文档",
      content: docData.content || "",
      parentId: parentId || null,
      tags: docData.tags || [],
      favorite: docData.favorite || false,
      pinned: docData.pinned || false,
      updatedAt: new Date().toISOString(),
      shareLinks: [],
      shareSettings: {
        enabled: false,
        defaultPermission: 'view',
        allowPassword: true,
        allowExpiration: true,
      },
      ...docData
    };

    const updatedNotebooks = notebooks.map(nb => 
      nb.id === notebookId 
        ? { ...nb, docs: [...nb.docs, newDoc] } 
        : nb
    );
    
    set({ 
      notebooks: updatedNotebooks,
      activeNotebookId: notebookId,
      activeDocId: newDoc.id
    });
  },

  updateDoc: (notebookId, docId, updates) => {
    const { notebooks } = get();
    const notebook = notebooks.find(nb => nb.id === notebookId);
    const doc = notebook?.docs.find(d => d.id === docId);
    
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      
      return {
        ...nb,
        docs: nb.docs.map(d => 
          d.id === docId 
            ? { ...d, ...updates, updatedAt: new Date().toISOString() } 
            : d
        )
      };
    });
    
    set({ notebooks: updatedNotebooks });
    
    if (doc) {
      const newVersion: DocVersion = {
        id: newId(),
        docId: doc.id,
        notebookId: notebookId,
        title: doc.title,
        content: doc.content,
        tags: doc.tags,
        createdAt: new Date().toISOString(),
        updatedAt: doc.updatedAt,
        type: 'auto',
      };
      
      const withVersion = updatedNotebooks.map(nb => {
        if (nb.id !== notebookId) return nb;
        return {
          ...nb,
          docs: nb.docs.map(d => {
            if (d.id !== docId) return d;
            const versions = d.versions || [];
            return {
              ...d,
              versions: [newVersion, ...versions].slice(0, 50),
            };
          }),
        };
      });
      
      set({ notebooks: withVersion });
    }
  },

  saveVersion: (notebookId, docId, type) => {
    const { notebooks } = get();
    const notebook = notebooks.find(nb => nb.id === notebookId);
    const doc = notebook?.docs.find(d => d.id === docId);
    
    if (!doc) return;
    
    const newVersion: DocVersion = {
      id: newId(),
      docId: doc.id,
      notebookId: notebookId,
      title: doc.title,
      content: doc.content,
      tags: doc.tags,
      createdAt: new Date().toISOString(),
      updatedAt: doc.updatedAt,
      type,
    };
    
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      
      return {
        ...nb,
        docs: nb.docs.map(d => {
          if (d.id !== docId) return d;
          const versions = d.versions || [];
          return {
            ...d,
            versions: [newVersion, ...versions].slice(0, 50),
          };
        }),
      };
    });
    
    set({ notebooks: updatedNotebooks });
  },

  getDocVersions: (notebookId, docId) => {
    const { notebooks } = get();
    const notebook = notebooks.find(nb => nb.id === notebookId);
    const doc = notebook?.docs.find(d => d.id === docId);
    return doc?.versions;
  },

  restoreVersion: (notebookId, docId, versionId) => {
    const { notebooks } = get();
    const notebook = notebooks.find(nb => nb.id === notebookId);
    const doc = notebook?.docs.find(d => d.id === docId);
    const version = doc?.versions?.find(v => v.id === versionId);
    
    if (!version) return;
    
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      
      return {
        ...nb,
        docs: nb.docs.map(d => {
          if (d.id !== docId) return d;
          return {
            ...d,
            title: version.title,
            content: version.content,
            tags: version.tags,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    });
    
    set({ notebooks: updatedNotebooks });
  },

  toggleFavorite: (notebookId, docId) => {
    const { notebooks } = get();
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      
      return {
        ...nb,
        docs: nb.docs.map(doc => 
          doc.id === docId 
            ? { ...doc, favorite: !doc.favorite, updatedAt: new Date().toISOString() } 
            : doc
        )
      };
    });
    
    set({ notebooks: updatedNotebooks });
  },

  deleteDoc: (notebookId, docId) => {
    const { notebooks, activeDocId } = get();
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      
      return {
        ...nb,
        docs: nb.docs.filter(doc => doc.id !== docId)
      };
    });
    
    set({ 
      notebooks: updatedNotebooks,
      ...(activeDocId === docId ? { activeDocId: '' } : {})
    });
  },

  moveDocToTrash: (notebookId, docId) => {
    const { notebooks, trash } = get();
    const notebook = notebooks.find(nb => nb.id === notebookId);
    const doc = notebook?.docs.find(d => d.id === docId);
    
    if (!doc) return;
    
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      
      return {
        ...nb,
        docs: nb.docs
          .filter(d => d.id !== docId)
          .map(d => d.parentId === docId ? { ...d, parentId: doc.parentId } : d)
      };
    });
    
    const updatedTrash = [...trash, {
      ...doc,
      updatedAt: new Date().toISOString(),
      parentId: null,
      originalParentId: doc.parentId ?? null,
      notebookId: notebookId,
      notebookTitle: notebook!.title,
    }];
    
    set({ 
      notebooks: updatedNotebooks, 
      trash: updatedTrash,
      ...(get().activeDocId === docId ? { activeDocId: '' } : {})
    });
  },

  restoreFromTrash: (docId) => {
    const { trash, notebooks, activeNotebookId } = get();
    const target = trash.find(item => item.id === docId);
    
    if (!target) return;
    
    const restoredDoc: NoteDoc = {
      id: target.id,
      title: target.title,
      content: target.content,
      parentId: target.originalParentId,
      tags: target.tags,
      favorite: target.favorite,
      updatedAt: target.updatedAt,
      pinned: false,
      shareLinks: [],
      shareSettings: {
        enabled: false,
        defaultPermission: 'view',
        allowPassword: true,
        allowExpiration: true,
      },
    };
    
    const targetNotebookId = target.notebookId || activeNotebookId;
    if (!targetNotebookId) return;
    
    const updatedNotebooks = notebooks.map(nb =>
      nb.id === targetNotebookId
        ? { ...nb, docs: [...nb.docs, restoredDoc] }
        : nb
    );
    
    const updatedTrash = trash.filter(item => item.id !== docId);
    
    set({
      notebooks: updatedNotebooks,
      trash: updatedTrash,
      activeNotebookId: targetNotebookId,
      activeDocId: target.id
    });
  },

  deleteFromTrash: (docId) => {
    const { trash } = get();
    const updatedTrash = trash.filter(item => item.id !== docId);
    set({ trash: updatedTrash });
  },

  clearTrash: () => {
    set({ trash: [] });
  },

  generateShareLink: (notebookId, docId, permission, password, expiresAt) => {
    const { notebooks } = get();
    const linkId = newId();
    const newLink: ShareLink = {
      id: linkId,
      docId,
      notebookId,
      url: generateShareUrl(docId, linkId),
      permission,
      password: password || null,
      expiresAt,
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessedAt: null,
    };

    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      
      return {
        ...nb,
        docs: nb.docs.map(doc =>
          doc.id === docId
            ? {
                ...doc,
                shareLinks: [...(doc.shareLinks || []), newLink],
                shareSettings: {
                  ...doc.shareSettings,
                  enabled: true,
                } as NoteDoc['shareSettings'],
              }
            : doc
        ),
      };
    });
    
    set({ notebooks: updatedNotebooks });
  },

  deleteShareLink: (notebookId, docId, linkId) => {
    const { notebooks } = get();
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      
      return {
        ...nb,
        docs: nb.docs.map(doc => {
          if (doc.id !== docId) return doc;
          
          const updatedLinks = (doc.shareLinks || []).filter(link => link.id !== linkId);
          return {
            ...doc,
            shareLinks: updatedLinks,
            shareSettings: {
              ...doc.shareSettings,
              enabled: updatedLinks.length > 0,
            } as NoteDoc['shareSettings'],
          };
        }),
      };
    });
    
    set({ notebooks: updatedNotebooks });
  },

  setActiveNotebookId: (id) => set({ activeNotebookId: id }),
  setActiveDocId: (id) => set({ activeDocId: id }),
  setSearchText: (text) => set({ searchText: text }),

  // Tag actions
  createTag: (name, color = defaultColors[0], icon = '🏷️', parentId = null) => {
    const { tags } = get();
    const newTag: Tag = {
      id: newId(),
      name,
      color,
      icon,
      parentId,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ tags: [...tags, newTag] });
  },

  updateTag: (id, updates) => {
    const { tags } = get();
    const updatedTags = tags.map(tag =>
      tag.id === id ? { ...tag, ...updates, updatedAt: new Date().toISOString() } : tag
    );
    set({ tags: updatedTags });
  },

  deleteTag: (id) => {
    const { tags, notebooks } = get();
    const updatedTags = tags.filter(tag => tag.id !== id);
    
    const updatedNotebooks = notebooks.map(nb => ({
      ...nb,
      docs: nb.docs.map(doc => ({
        ...doc,
        tags: doc.tags.filter(tagId => tagId !== id),
      })),
    }));
    
    set({ tags: updatedTags, notebooks: updatedNotebooks });
  },

  addTagToDoc: (notebookId, docId, tagId) => {
    const { notebooks, tags } = get();
    
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      return {
        ...nb,
        docs: nb.docs.map(doc => {
          if (doc.id !== docId) return doc;
          if (doc.tags.includes(tagId)) return doc;
          return { ...doc, tags: [...doc.tags, tagId] };
        }),
      };
    });
    
    const updatedTags = tags.map(tag =>
      tag.id === tagId ? { ...tag, usageCount: tag.usageCount + 1 } : tag
    );
    
    set({ notebooks: updatedNotebooks, tags: updatedTags });
  },

  removeTagFromDoc: (notebookId, docId, tagId) => {
    const { notebooks, tags } = get();
    
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id !== notebookId) return nb;
      return {
        ...nb,
        docs: nb.docs.map(doc => {
          if (doc.id !== docId) return doc;
          return { ...doc, tags: doc.tags.filter(id => id !== tagId) };
        }),
      };
    });
    
    const updatedTags = tags.map(tag =>
      tag.id === tagId ? { ...tag, usageCount: Math.max(0, tag.usageCount - 1) } : tag
    );
    
    set({ notebooks: updatedNotebooks, tags: updatedTags });
  },

  updateTagUsageCounts: () => {
    const { notebooks, tags } = get();
    
    const usageMap: Record<string, number> = {};
    tags.forEach(tag => {
      usageMap[tag.id] = 0;
    });
    
    notebooks.forEach(nb => {
      nb.docs.forEach(doc => {
        doc.tags.forEach(tagId => {
          if (usageMap[tagId] !== undefined) {
            usageMap[tagId]++;
          }
        });
      });
    });
    
    const updatedTags = tags.map(tag => ({
      ...tag,
      usageCount: usageMap[tag.id] || 0,
    }));
    
    set({ tags: updatedTags });
  },

  getTagStats: () => {
    const { notebooks, tags } = get();
    
    const usageMap: Record<string, number> = {};
    notebooks.forEach(nb => {
      nb.docs.forEach(doc => {
        doc.tags.forEach(tagId => {
          usageMap[tagId] = (usageMap[tagId] || 0) + 1;
        });
      });
    });
    
    const usedCount = tags.filter(tag => usageMap[tag.id] > 0).length;
    const unusedCount = tags.filter(tag => usageMap[tag.id] === 0).length;
    
    const topTags = tags
      .map(tag => ({ tag, count: usageMap[tag.id] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const tagDistribution = [
      { category: '高频标签', count: tags.filter(t => usageMap[t.id] >= 10).length },
      { category: '中频标签', count: tags.filter(t => usageMap[t.id] > 2 && usageMap[t.id] < 10).length },
      { category: '低频标签', count: tags.filter(t => usageMap[t.id] > 0 && usageMap[t.id] <= 2).length },
      { category: '未使用', count: unusedCount },
    ];
    
    return {
      totalCount: tags.length,
      usedCount,
      unusedCount,
      topTags,
      tagDistribution,
    };
  },

  getRecommendedTags: (docContent, limit = 5) => {
    const { tags } = get();
    
    const contentWords = docContent.toLowerCase().split(/\s+/);
    
    const scoreMap: Record<string, number> = {};
    tags.forEach(tag => {
      const tagWords = tag.name.toLowerCase().split(/\s+/);
      let score = 0;
      tagWords.forEach(word => {
        if (contentWords.includes(word)) {
          score += 1;
        }
      });
      if (tag.description) {
        const descWords = tag.description.toLowerCase().split(/\s+/);
        descWords.forEach(word => {
          if (contentWords.includes(word)) {
            score += 0.5;
          }
        });
      }
      if (score > 0) {
        scoreMap[tag.id] = score;
      }
    });
    
    return tags
      .filter(tag => scoreMap[tag.id] !== undefined)
      .sort((a, b) => (scoreMap[b.id] || 0) - (scoreMap[a.id] || 0))
      .slice(0, limit);
  },

  batchUpdateTags: (tagIds, updates) => {
    const { tags } = get();
    const updatedTags = tags.map(tag =>
      tagIds.includes(tag.id) ? { ...tag, ...updates, updatedAt: new Date().toISOString() } : tag
    );
    set({ tags: updatedTags });
  },

  getTagsWithHierarchy: () => {
    const { tags } = get();
    
    const tagMap = new Map(tags.map(tag => [tag.id, { ...tag, children: [] as Tag[] }]));
    const rootTags: Tag[] = [];
    
    tags.forEach(tag => {
      const mappedTag = tagMap.get(tag.id)!;
      if (tag.parentId && tagMap.has(tag.parentId)) {
        tagMap.get(tag.parentId)!.children = tagMap.get(tag.parentId)!.children || [];
        tagMap.get(tag.parentId)!.children!.push(mappedTag);
      } else {
        rootTags.push(mappedTag);
      }
    });
    
    return rootTags;
  },

  // Search actions
  search: (query, filters) => {
    const { notebooks, tags } = get();
    const results: SearchResult[] = [];

    const parseQuery = (q: string) => {
      const terms: { term: string; isNot: boolean; isExact: boolean }[] = [];
      const parts = q.split(/\s+/);
      
      parts.forEach(part => {
        let isNot = false;
        let isExact = false;
        let term = part;
        
        if (term.startsWith('-')) {
          isNot = true;
          term = term.slice(1);
        }
        
        if (term.startsWith('"') && term.endsWith('"')) {
          isExact = true;
          term = term.slice(1, -1);
        }
        
        terms.push({ term: term.toLowerCase(), isNot, isExact });
      });
      
      return terms;
    };

    const terms = parseQuery(query);

    const matchesQuery = (text: string | undefined): boolean => {
      if (!text) return false;
      const lowerText = text.toLowerCase();
      
      return terms.every(({ term, isNot, isExact }) => {
        const found = isExact 
          ? lowerText.includes(term) 
          : term.split('').every(char => lowerText.includes(char));
        
        return isNot ? !found : found;
      });
    };

    const matchesTagFilter = (docTags: string[]) => {
      if (!filters?.tags || filters.tags.length === 0) return true;
      return filters.tags.some(tagId => docTags.includes(tagId));
    };

    const matchesDateFilter = (updatedAt: string) => {
      if (!filters?.dateRange) return true;
      const docDate = new Date(updatedAt);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      return docDate >= startDate && docDate <= endDate;
    };

    notebooks.forEach(notebook => {
      if (filters?.type === 'all' || filters?.type === 'notebook') {
        if (matchesQuery(notebook.title)) {
          results.push({
            type: 'notebook',
            id: notebook.id,
            title: notebook.title,
            tags: [],
            updatedAt: notebook.docs[0]?.updatedAt || new Date().toISOString(),
          });
        }
      }

      if (filters?.type === 'all' || filters?.type === 'document') {
        notebook.docs.forEach(doc => {
          const tagNames = doc.tags.map(tagId => tags.find(t => t.id === tagId)?.name || '').join(' ');
          const fullText = `${doc.title} ${doc.content || ''} ${tagNames}`;
          
          if (matchesQuery(fullText) && matchesTagFilter(doc.tags) && matchesDateFilter(doc.updatedAt)) {
            const highlights: { field: string; text: string }[] = [];
            
            if (doc.title && terms.some(t => doc.title.toLowerCase().includes(t.term))) {
              highlights.push({ field: 'title', text: doc.title });
            }
            if (doc.content) {
              terms.forEach(t => {
                const idx = doc.content.toLowerCase().indexOf(t.term);
                if (idx !== -1) {
                  const start = Math.max(0, idx - 20);
                  const end = Math.min(doc.content.length, idx + t.term.length + 20);
                  highlights.push({ 
                    field: 'content', 
                    text: doc.content.slice(start, end) 
                  });
                }
              });
            }

            results.push({
              type: 'doc',
              id: doc.id,
              notebookId: notebook.id,
              title: doc.title,
              content: doc.content,
              tags: doc.tags,
              updatedAt: doc.updatedAt,
              highlights: highlights.slice(0, 3),
            });
          }
        });
      }
    });

    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getSearchSuggestions: (query) => {
    const { notebooks, tags, searchHistory } = get();
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    tags.forEach(tag => {
      if (tag.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          text: tag.name,
          type: 'tag',
          tagId: tag.id,
        });
      }
    });

    notebooks.forEach(notebook => {
      notebook.docs.forEach(doc => {
        if (doc.title.toLowerCase().includes(lowerQuery)) {
          suggestions.push({
            text: doc.title,
            type: 'title',
            docId: doc.id,
          });
        }
      });
    });

    searchHistory.forEach(history => {
      if (history.query.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          text: history.query,
          type: 'history',
        });
      }
    });

    return suggestions.slice(0, 8);
  },

  addSearchHistory: (query, resultCount) => {
    const { searchHistory } = get();
    const existing = searchHistory.find(h => h.query === query);
    
    let updatedHistory: SearchHistory[];
    if (existing) {
      updatedHistory = searchHistory.map(h =>
        h.query === query 
          ? { ...h, timestamp: new Date().toISOString(), resultCount }
          : h
      );
    } else {
      const newHistory: SearchHistory = {
        id: newId(),
        query,
        timestamp: new Date().toISOString(),
        resultCount,
      };
      updatedHistory = [newHistory, ...searchHistory].slice(0, 20);
    }
    
    set({ searchHistory: updatedHistory });
  },

  clearSearchHistory: () => {
    set({ searchHistory: [] });
  },

  removeSearchHistoryItem: (id) => {
    const { searchHistory } = get();
    set({ searchHistory: searchHistory.filter(h => h.id !== id) });
  },
}));