// src/utils/advancedSearchUtils.ts

export interface SearchResult {
  docId: string;
  notebookId: string;
  titleMatch: boolean;
  contentMatches: Array<{ lineIndex: number; content: string; highlighted: string; offset: number }>;
  tagMatches: string[];
  score: number;
  snippet: string;
}

// 为中文分词准备的基础函数
const tokenizeChinese = (text: string): string[] => {
  // 简单的中文分词，将中文字符单独分开，保留英文单词
  const tokens: string[] = [];
  let currentToken = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // 检查是否为中文字符
    if (/[\u4e00-\u9fff]/.test(char)) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(char);
    } 
    // 检查是否为英文字母或数字
    else if (/[a-zA-Z0-9]/.test(char)) {
      currentToken += char;
    }
    // 其他字符（空格、标点等）作为分隔符
    else {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
    }
  }
  
  if (currentToken) {
    tokens.push(currentToken);
  }
  
  return tokens.filter(token => token.trim() !== '');
};

export const performAdvancedFullTextSearch = (
  searchText: string, 
  notebooks: any[], 
  options: { 
    caseSensitive?: boolean; 
    fuzzy?: boolean;
    includeSnippets?: boolean;
    snippetLength?: number;
  } = {}
): SearchResult[] => {
  if (!searchText.trim()) return [];

  const { 
    caseSensitive = false, 
    fuzzy = false,
    includeSnippets = true,
    snippetLength = 100
  } = options;
  
  const searchTerms = fuzzy 
    ? tokenizeChinese(caseSensitive ? searchText : searchText.toLowerCase())
    : [caseSensitive ? searchText : searchText.toLowerCase()];
    
  const results: SearchResult[] = [];

  notebooks.forEach(notebook => {
    notebook.docs.forEach((doc: any) => {
      let score = 0;
      let allContentMatches: Array<{ lineIndex: number; content: string; highlighted: string; offset: number }> = [];
      const tagMatches: string[] = [];
      let titleMatch = false;

      // 搜索标题
      const title = caseSensitive ? doc.title : doc.title.toLowerCase();
      searchTerms.forEach(term => {
        if (title.includes(term)) {
          score += 100; // 标题匹配权重更高
          titleMatch = true;
        }
      });

      // 搜索内容
      const content = caseSensitive ? doc.content : doc.content.toLowerCase();
      if (content) {
        const lines = content.split('\n');
        lines.forEach((line: string, index: number) => {
          let lineScore = 0;
          const matches: Array<{ lineIndex: number; content: string; highlighted: string; offset: number }> = [];
          
          searchTerms.forEach(term => {
            let searchStart = 0;
            let matchIndex;
            
            while ((matchIndex = line.indexOf(term, searchStart)) !== -1) {
              // 计算相关度分数
              lineScore += term.length * 10;
              
              // 创建高亮内容
              const highlightPattern = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, caseSensitive ? 'g' : 'gi');
              const highlighted = caseSensitive 
                ? line 
                : line.replace(highlightPattern, '<mark>$1</mark>');
                
              matches.push({
                lineIndex: index,
                content: line.length > snippetLength ? line.substring(0, snippetLength) + '...' : line,
                highlighted,
                offset: matchIndex
              });
              
              searchStart = matchIndex + term.length;
            }
          });
          
          if (lineScore > 0) {
            score += lineScore;
            allContentMatches = [...allContentMatches, ...matches];
          }
        });
      }

      // 搜索标签
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach((tag: string) => {
          const tagText = caseSensitive ? tag : tag.toLowerCase();
          searchTerms.forEach(term => {
            if (tagText.includes(term)) {
              score += 50; // 标签匹配权重较高
              if (!tagMatches.includes(tag)) {
                tagMatches.push(tag);
              }
            }
          });
        });
      }

      if (score > 0) {
        const snippet = includeSnippets && allContentMatches.length > 0
          ? allContentMatches[0].content
          : '';

        results.push({
          docId: doc.id,
          notebookId: notebook.id,
          titleMatch,
          contentMatches: allContentMatches,
          tagMatches,
          score,
          snippet
        });
      }
    });
  });

  // 按分数排序（最高分优先）
  return results.sort((a, b) => b.score - a.score);
};

// 搜索建议功能
export const getSuggestions = (
  searchText: string,
  notebooks: any[],
  maxSuggestions: number = 5
): string[] => {
  if (!searchText.trim()) return [];
  
  const suggestions: string[] = [];
  const lowerSearchText = searchText.toLowerCase();
  
  // 在文档标题中查找相似的标题
  notebooks.forEach(notebook => {
    notebook.docs.forEach((doc: any) => {
      if (doc.title.toLowerCase().includes(lowerSearchText) && 
          !suggestions.includes(doc.title) && 
          doc.title.toLowerCase() !== lowerSearchText) {
        suggestions.push(doc.title);
      }
      
      // 在标签中查找相似的标签
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(lowerSearchText) && 
              !suggestions.includes(tag)) {
            suggestions.push(tag);
          }
        });
      }
    });
  });
  
  return suggestions.slice(0, maxSuggestions);
};

// 高亮搜索结果
export const highlightText = (text: string, searchTerm: string, caseSensitive: boolean = false): string => {
  if (!searchTerm) return text;
  
  const flags = caseSensitive ? 'g' : 'gi';
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, flags);
  
  return text.replace(regex, '<mark>$1</mark>');
};

// 获取搜索结果摘要
export const getSearchResultSnippet = (content: string, searchTerm: string, length: number = 100): string => {
  if (!searchTerm) return content.substring(0, length) + (content.length > length ? '...' : '');
  
  const lowerContent = content.toLowerCase();
  const lowerSearchTerm = searchTerm.toLowerCase();
  const index = lowerContent.indexOf(lowerSearchTerm);
  
  if (index === -1) {
    // 如果找不到精确匹配，尝试模糊匹配
    return content.substring(0, length) + (content.length > length ? '...' : '');
  }
  
  const start = Math.max(0, index - Math.floor(length / 2));
  const end = Math.min(content.length, start + length);
  
  let snippet = content.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet += '...';
  
  return snippet;
};