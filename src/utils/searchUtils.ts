// src/utils/searchUtils.ts
export interface SearchResult {
  docId: string;
  notebookId: string;
  titleMatch: boolean;
  contentMatches: Array<{ lineIndex: number; content: string; highlighted: string }>;
  tagMatches: string[];
  score: number;
}

export const performFullTextSearch = (
  searchText: string, 
  notebooks: any[], 
  options: { caseSensitive?: boolean; fuzzy?: boolean } = {}
): SearchResult[] => {
  if (!searchText.trim()) return [];

  const { caseSensitive = false } = options;
  const searchTerm = caseSensitive ? searchText : searchText.toLowerCase();
  const results: SearchResult[] = [];

  notebooks.forEach(notebook => {
    notebook.docs.forEach((doc: any) => {
      let score = 0;
      const contentMatches: Array<{ lineIndex: number; content: string; highlighted: string }> = [];
      const tagMatches: string[] = [];

      // Search in title
      const title = caseSensitive ? doc.title : doc.title.toLowerCase();
      if (title.includes(searchTerm)) {
        score += 100; // Title matches are more important
      }

      // Search in content
      const content = caseSensitive ? doc.content : doc.content.toLowerCase();
      if (content) {
        const lines = content.split('\n');
        lines.forEach((line: string, index: number) => {
          if (line.includes(searchTerm)) {
            // Calculate relevance based on term frequency in this line
            const termCount = (line.match(new RegExp(searchTerm, 'g')) || []).length;
            score += termCount * 10;

            // Create highlighted content
            const highlightPattern = new RegExp(`(${searchTerm})`, caseSensitive ? 'g' : 'gi');
            const highlighted = caseSensitive 
              ? line 
              : line.replace(highlightPattern, '<mark>$1</mark>');

            contentMatches.push({
              lineIndex: index,
              content: line.length > 100 ? line.substring(0, 100) + '...' : line,
              highlighted
            });
          }
        });
      }

      // Search in tags
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach((tag: string) => {
          const tagText = caseSensitive ? tag : tag.toLowerCase();
          if (tagText.includes(searchTerm)) {
            score += 50; // Tag matches are important
            tagMatches.push(tag);
          }
        });
      }

      if (score > 0) {
        results.push({
          docId: doc.id,
          notebookId: notebook.id,
          titleMatch: title.includes(searchTerm),
          contentMatches,
          tagMatches,
          score
        });
      }
    });
  });

  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score);
};