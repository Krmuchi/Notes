// src/components/SearchResultsPanel.tsx
import React from 'react';
import type { SearchResult } from '../utils/advancedSearchUtils';
import { useNotesStore } from '../store/notesStore';

interface SearchResultsPanelProps {
  searchResults: SearchResult[];
  searchText: string;
  onClose: () => void;
  onItemClick: (docId: string, notebookId: string) => void;
}

const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({ 
  searchResults, 
  searchText, 
  onClose, 
  onItemClick 
}) => {
  const { notebooks } = useNotesStore();
  
  if (!searchText.trim()) {
    return null;
  }
  
  return (
    <div className="search-results-panel">
      <div className="search-results-header">
        <h3>搜索结果</h3>
        <button className="btn-ghost" onClick={onClose}>关闭</button>
      </div>
      {searchResults.length === 0 ? (
        <div className="search-results-empty">没有找到匹配的结果</div>
      ) : (
        <div className="search-results-list">
          {searchResults.map(result => {
            const notebook = notebooks.find(nb => nb.id === result.notebookId);
            const doc = notebook?.docs.find(d => d.id === result.docId);
            
            return (
              <div 
                key={`${result.notebookId}-${result.docId}`} 
                className="search-result-item"
                onClick={() => onItemClick(result.docId, result.notebookId)}
              >
                <div className="search-result-title">
                  <span className="search-result-doc-title">{doc?.title || '未知文档'}</span>
                  <span className="search-result-notebook-title">{notebook?.title || '未知知识库'}</span>
                </div>
                <div className="search-result-snippet" 
                     dangerouslySetInnerHTML={{__html: result.snippet}} />
                <div className="search-result-meta">
                  <span className="search-result-score">相关度: {result.score}</span>
                  <span className="search-result-matches">匹配项: {result.contentMatches.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPanel;