// 搜索相关的类型定义
export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'tag' | 'title' | 'content' | 'history';
  tagId?: string;
  docId?: string;
}

export interface SearchFilter {
  dateRange?: { start: string; end: string };
  type?: 'all' | 'document' | 'notebook';
  author?: string;
  tags?: string[];
}

export interface SearchResult {
  type: 'doc' | 'notebook';
  id: string;
  notebookId?: string;
  title: string;
  content?: string;
  tags: string[];
  updatedAt: string;
  highlights?: { field: string; text: string }[];
}

// 标签相关的类型定义
export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId: string | null;
  children?: Tag[];
  description?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagStats {
  totalCount: number;
  usedCount: number;
  unusedCount: number;
  topTags: { tag: Tag; count: number }[];
  tagDistribution: { category: string; count: number }[];
}

// 分享相关的类型定义
export interface ShareLink {
  id: string;
  docId: string;
  notebookId: string;
  url: string;
  permission: 'view' | 'comment' | 'edit' | 'manage';
  password: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdBy?: string;
  accessCount: number;
  lastAccessedAt: string | null;
}

export interface ShareSettings {
  enabled: boolean;
  defaultPermission: 'view' | 'comment' | 'edit' | 'manage';
  allowPassword: boolean;
  allowExpiration: boolean;
}

// 版本历史类型定义
export interface DocVersion {
  id: string;
  docId: string;
  notebookId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  versionTag?: string;
  comment?: string;
  type: 'auto' | 'manual' | 'published';
}

// 更新现有的类型定义
export interface NoteDoc {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  updatedAt: string;
  shareLinks?: ShareLink[];
  shareSettings?: ShareSettings;
  versions?: DocVersion[];
}

export interface TrashDoc extends NoteDoc {
  notebookId: string;
  notebookTitle: string;
  originalParentId: string | null;
}

export interface Notebook {
  id: string;
  title: string;
  docs: NoteDoc[];
}

export interface AppStore {
  notebooks: Notebook[];
  trash: TrashDoc[];
  tags: Tag[];
  searchHistory: SearchHistory[];
}

declare global {
  interface Window {
    notesApi: {
      load: () => Promise<AppStore>;
      save: (payload: AppStore) => Promise<AppStore>;
      exportDoc: (payload: { title: string; content: string }) => Promise<boolean>;
      exportNotebook: (payload: { title: string; docs: NoteDoc[] }) => Promise<boolean>;
      exportNotebookZip: (payload: { title: string; docs: NoteDoc[] }) => Promise<boolean>;
      saveImage: (payload: { name: string; data: string }) => Promise<string>;
    };
  }
}