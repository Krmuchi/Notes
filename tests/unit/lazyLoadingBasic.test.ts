import { describe, it, expect } from 'vitest';

describe('懒加载功能基础测试', () => {
  it('应该能够导入懒加载组件', async () => {
    const LazyImage = await import('../src/components/LazyImage');
    expect(LazyImage).toBeDefined();
    expect(LazyImage.LazyImage).toBeDefined();
    expect(LazyImage.default).toBeDefined();
  });

  it('应该能够导入分页加载组件', async () => {
    const PaginatedContent = await import('../src/components/PaginatedContent');
    expect(PaginatedContent).toBeDefined();
    expect(PaginatedContent.PaginatedContent).toBeDefined();
    expect(PaginatedContent.default).toBeDefined();
  });

  it('应该能够导入虚拟滚动组件', async () => {
    const VirtualScroll = await import('../src/components/VirtualScroll');
    expect(VirtualScroll).toBeDefined();
    expect(VirtualScroll.VirtualScroll).toBeDefined();
  });

  it('应该能够导入懒加载工具函数', async () => {
    const lazyLoadUtils = await import('../src/utils/lazyLoadUtils');
    expect(lazyLoadUtils).toBeDefined();
    expect(lazyLoadUtils.createLazyComponent).toBeDefined();
    expect(lazyLoadUtils.withLazyLoad).toBeDefined();
  });

  it('应该能够导入示例组件', async () => {
    const LazyLoadingExamples = await import('../src/components/LazyLoadingExamples');
    expect(LazyLoadingExamples).toBeDefined();
    expect(LazyLoadingExamples.LazyLoadingExamples).toBeDefined();
    expect(LazyLoadingExamples.default).toBeDefined();
  });
});