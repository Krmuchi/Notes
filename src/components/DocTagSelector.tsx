import { useState, useEffect } from "react";
import { useNotesStore } from "../store/notesStore";

interface DocTagSelectorProps {
  notebookId: string;
  docId: string;
  currentTags: string[];
  docContent: string;
  onTagsChange?: () => void;
}

export default function DocTagSelector({ 
  notebookId, 
  docId, 
  currentTags, 
  docContent,
  onTagsChange 
}: DocTagSelectorProps) {
  const { 
    tags, 
    addTagToDoc, 
    removeTagFromDoc, 
    createTag,
    getRecommendedTags 
  } = useNotesStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const recommendedTags = getRecommendedTags(docContent, 5);

  const currentTagObjects = tags.filter(tag => currentTags.includes(tag.id));

  const filteredTags = tags.filter(tag => 
    !currentTags.includes(tag.id) && 
    tag.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddTag = (tagId: string) => {
    addTagToDoc(notebookId, docId, tagId);
    setSearchText('');
    onTagsChange?.();
  };

  const handleRemoveTag = (tagId: string) => {
    removeTagFromDoc(notebookId, docId, tagId);
    onTagsChange?.();
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const icons = ['📌', '⭐', '🔖', '🏷️', '📎'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    
    createTag(newTagName.trim(), color, icon, null);
    setNewTagName('');
    setShowCreateInput(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.doc-tag-selector')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="doc-tag-selector" onClick={(e) => e.stopPropagation()}>
      {/* 已选标签 */}
      <div className="doc-tags-selected">
        {currentTagObjects.length === 0 ? (
          <span className="doc-tags-empty" onClick={() => setShowDropdown(true)}>
            添加标签...
          </span>
        ) : (
          currentTagObjects.map(tag => (
            <span 
              key={tag.id} 
              className="doc-tag-item"
              style={{ borderColor: tag.color }}
            >
              <span className="doc-tag-icon">{tag.icon}</span>
              <span className="doc-tag-name">{tag.name}</span>
              <button 
                className="doc-tag-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag.id);
                }}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* 下拉选择器 */}
      {showDropdown && (
        <div className="doc-tag-dropdown">
          {/* 搜索框 */}
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索标签..."
            className="doc-tag-search"
            autoFocus
          />

          {/* 推荐标签 */}
          {recommendedTags.length > 0 && searchText === '' && (
            <div className="doc-tag-section">
              <span className="doc-tag-section-title">💡 推荐标签</span>
              <div className="doc-tag-options">
                {recommendedTags.map(tag => (
                  <button
                    key={tag.id}
                    className="doc-tag-option"
                    onClick={() => handleAddTag(tag.id)}
                  >
                    <span className="doc-tag-option-icon">{tag.icon}</span>
                    <span className="doc-tag-option-name">{tag.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 可选标签 */}
          {filteredTags.length > 0 && (
            <div className="doc-tag-section">
              <span className="doc-tag-section-title">📋 所有标签</span>
              <div className="doc-tag-options">
                {filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    className="doc-tag-option"
                    onClick={() => handleAddTag(tag.id)}
                  >
                    <span 
                      className="doc-tag-option-color" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="doc-tag-option-icon">{tag.icon}</span>
                    <span className="doc-tag-option-name">{tag.name}</span>
                    <span className="doc-tag-option-count">{tag.usageCount}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 创建新标签 */}
          {showCreateInput ? (
            <div className="doc-tag-create">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入新标签名称"
                className="doc-tag-create-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag();
                  if (e.key === 'Escape') setShowCreateInput(false);
                }}
              />
              <button 
                className="doc-tag-create-btn"
                onClick={handleCreateTag}
              >
                创建
              </button>
            </div>
          ) : (
            <button 
              className="doc-tag-create-trigger"
              onClick={() => setShowCreateInput(true)}
            >
              + 新建标签
            </button>
          )}
        </div>
      )}

      {/* 添加标签按钮 */}
      {currentTagObjects.length > 0 && (
        <button 
          className="doc-tag-add-btn"
          onClick={() => setShowDropdown(true)}
        >
          +
        </button>
      )}
    </div>
  );
}