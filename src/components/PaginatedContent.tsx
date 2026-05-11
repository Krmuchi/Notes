import React, { useState, useEffect, useRef, useCallback } from 'react';

interface PaginatedContentProps {
  content: string;
  pageSize?: number;
  className?: string;
  style?: React.CSSProperties;
  renderContent?: (content: string) => React.ReactNode;
  onLoadMore?: (currentPage: number) => void;
}

export const PaginatedContent: React.FC<PaginatedContentProps> = ({
  content,
  pageSize = 1000,
  className,
  style,
  renderContent,
  onLoadMore,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedContent, setDisplayedContent] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(content.length / pageSize);

  const loadMoreContent = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const endIndex = nextPage * pageSize;
      const newContent = content.slice(0, endIndex);
      
      setDisplayedContent(newContent);
      setCurrentPage(nextPage);
      setHasMore(endIndex < content.length);
      setIsLoading(false);
      
      onLoadMore?.(nextPage);
    }, 100);
  }, [currentPage, content, pageSize, isLoading, hasMore, onLoadMore]);

  useEffect(() => {
    const initialContent = content.slice(0, pageSize);
    setDisplayedContent(initialContent);
    setHasMore(content.length > pageSize);
    setCurrentPage(1);
  }, [content, pageSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreContent();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoading, loadMoreContent]);

  const handleLoadMore = () => {
    loadMoreContent();
  };

  const renderedContent = renderContent ? renderContent(displayedContent) : displayedContent;

  return (
    <div className={className} style={style}>
      {renderedContent}
      
      {hasMore && (
        <div ref={sentinelRef} style={{ padding: '20px', textAlign: 'center' }}>
          {isLoading ? (
            <div style={{ color: '#999', fontSize: '14px' }}>
              加载中...
            </div>
          ) : (
            <button
              onClick={handleLoadMore}
              style={{
                padding: '8px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                background: '#fff',
                color: '#333',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              加载更多 ({currentPage}/{totalPages})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PaginatedContent;