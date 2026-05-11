import { useState, useEffect } from "react";
import type { Tag } from "../types";

interface TagEditModalProps {
  onClose: () => void;
  tag?: Tag;
  onCreate?: (name: string, color: string, icon: string, parentId: string | null) => void;
  onUpdate?: (updates: Partial<Tag>) => void;
  availableTags: Tag[];
}

const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const defaultIcons = ['📌', '⭐', '🔖', '🏷️', '📎', '📁', '📂', '🗂️', '📊', '📈', '💡', '🎯', '🎨', '🎭', '🌱'];

export default function TagEditModal({ 
  onClose, 
  tag, 
  onCreate, 
  onUpdate,
  availableTags 
}: TagEditModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultColors[0]);
  const [icon, setIcon] = useState('🏷️');
  const [parentId, setParentId] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
      setIcon(tag.icon);
      setParentId(tag.parentId);
      setDescription(tag.description || '');
    } else {
      setName('');
      setColor(defaultColors[0]);
      setIcon('🏷️');
      setParentId(null);
      setDescription('');
    }
  }, [tag]);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('请输入标签名称');
      return;
    }

    if (tag && onUpdate) {
      onUpdate({ name: name.trim(), color, icon, parentId, description: description.trim() || undefined });
    } else if (onCreate) {
      onCreate(name.trim(), color, icon, parentId);
    }
    
    onClose();
  };

  const parentTags = availableTags.filter(t => t.id !== tag?.id);

  return (
    <div className="tag-modal-overlay" onClick={onClose}>
      <div className="tag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tag-modal-header">
          <h4 className="tag-modal-title">{tag ? '编辑标签' : '新建标签'}</h4>
          <button className="tag-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="tag-modal-body">
          {/* 标签名称 */}
          <div className="tag-form-group">
            <label className="tag-form-label">标签名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入标签名称"
              className="tag-form-input"
            />
          </div>

          {/* 颜色选择 */}
          <div className="tag-form-group">
            <label className="tag-form-label">标签颜色</label>
            <div className="tag-color-options">
              {defaultColors.map((c) => (
                <button
                  key={c}
                  className={`tag-color-option ${color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* 图标选择 */}
          <div className="tag-form-group">
            <label className="tag-form-label">标签图标</label>
            <div className="tag-icon-options">
              {defaultIcons.map((i) => (
                <button
                  key={i}
                  className={`tag-icon-option ${icon === i ? 'active' : ''}`}
                  onClick={() => setIcon(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* 父标签选择 */}
          <div className="tag-form-group">
            <label className="tag-form-label">父标签（可选）</label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="tag-form-select"
            >
              <option value="">无（作为根标签）</option>
              {parentTags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 描述 */}
          <div className="tag-form-group">
            <label className="tag-form-label">描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加标签描述..."
              className="tag-form-textarea"
              rows={3}
            />
          </div>
        </div>

        <div className="tag-modal-footer">
          <button className="tag-modal-btn cancel" onClick={onClose}>
            取消
          </button>
          <button className="tag-modal-btn confirm" onClick={handleSubmit}>
            {tag ? '保存修改' : '创建标签'}
          </button>
        </div>
      </div>
    </div>
  );
}