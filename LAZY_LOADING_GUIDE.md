# 懒加载功能使用指南

本项目实现了完整的懒加载功能，包括图片懒加载、长文档分页加载、组件按需加载和路由懒加载。

## 功能概述

### 1. 图片懒加载 (LazyImage)

自动延迟加载图片，直到图片进入视口才加载，提升页面加载性能。

**使用示例：**

```tsx
import { LazyImage } from './components/LazyImage';

function MyComponent() {
  return (
    <LazyImage
      src="https://example.com/image.jpg"
      alt="示例图片"
      className="my-image"
      style={{ width: '100%', height: 'auto' }}
      threshold={0.1}
      onLoad={() => console.log('图片加载完成')}
      onError={() => console.log('图片加载失败')}
    />
  );
}
```

**参数说明：**
- `src`: 图片地址
- `alt`: 图片描述（可选）
- `className`: CSS类名（可选）
- `style`: 内联样式（可选）
- `placeholder`: 占位图（可选，默认为加载中提示）
- `threshold`: 触发加载的阈值，0-1之间（可选，默认0.1）
- `onLoad`: 加载完成回调（可选）
- `onError`: 加载失败回调（可选）

### 2. 长文档分页加载 (PaginatedContent)

对长文档进行分页加载，避免一次性加载大量内容导致性能问题。

**使用示例：**

```tsx
import { PaginatedContent } from './components/PaginatedContent';

function DocumentViewer({ content }) {
  return (
    <PaginatedContent
      content={content}
      pageSize={1000}
      className="document-content"
      onLoadMore={(page) => console.log('加载第', page, '页')}
      renderContent={(text) => (
        <div dangerouslySetInnerHTML={{ __html: text }} />
      )}
    />
  );
}
```

**参数说明：**
- `content`: 文档内容
- `pageSize`: 每页字符数（可选，默认1000）
- `className`: CSS类名（可选）
- `style`: 内联样式（可选）
- `renderContent`: 自定义渲染函数（可选）
- `onLoadMore`: 加载更多回调（可选）

### 3. 虚拟滚动 (VirtualScroll)

用于渲染大量列表项的高性能组件，只渲染可见区域的元素。

**使用示例：**

```tsx
import { VirtualScroll } from './components/VirtualScroll';

interface Item {
  id: string;
  name: string;
}

function LargeList({ items }: { items: Item[] }) {
  return (
    <VirtualScroll
      items={items}
      itemHeight={50}
      containerHeight={600}
      renderItem={(item, index) => (
        <div key={item.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
          {index + 1}. {item.name}
        </div>
      )}
      overscan={3}
      onEndReached={() => console.log('滚动到底部')}
      endReachedThreshold={200}
    />
  );
}
```

**参数说明：**
- `items`: 数据项数组
- `itemHeight`: 每项高度（像素）
- `containerHeight`: 容器高度（像素）
- `renderItem`: 渲染函数
- `overscan`: 预渲染项数（可选，默认3）
- `className`: CSS类名（可选）
- `style`: 内联样式（可选）
- `onEndReached`: 滚动到底部回调（可选）
- `endReachedThreshold`: 触发底部回调的距离（可选，默认200）

### 4. 组件按需加载

使用 `createLazyComponent` 工具函数创建懒加载组件。

**使用示例：**

```tsx
import { createLazyComponent } from './utils/lazyLoadUtils';

// 创建懒加载组件
const LazySharePanel = createLazyComponent(
  () => import('./components/SharePanel'),
  {
    fallback: <div>加载中...</div>,
    delay: 0,
  }
);

function MyComponent() {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div>
      <button onClick={() => setShowPanel(true)}>打开面板</button>
      {showPanel && <LazySharePanel onClose={() => setShowPanel(false)} />}
    </div>
  );
}
```

**参数说明：**
- `importFn`: 动态导入函数
- `options.fallback`: 加载时的占位内容（可选）
- `options.delay`: 延迟加载时间（毫秒，可选）

### 5. 路由懒加载

主应用组件已配置为懒加载，在 `src/main.tsx` 中：

```tsx
const App = React.lazy(() => import('./App.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={<div>加载中...</div>}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </StrictMode>,
)
```

## 构建优化

项目已配置 Vite 构建优化，在 `vite.config.ts` 中：

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'zustand': ['zustand'],
        'marked': ['marked'],
        'dompurify': ['dompurify'],
        'jszip': ['jszip'],
      },
    },
  },
  chunkSizeWarningLimit: 1000,
}
```

这将自动将依赖项分割成独立的代码块，实现更好的缓存策略和加载性能。

## 性能优化建议

1. **图片优化**
   - 使用适当的图片格式（WebP优先）
   - 压缩图片大小
   - 提供多种分辨率的图片

2. **内容优化**
   - 合理设置分页大小
   - 使用虚拟滚动处理长列表
   - 避免不必要的重新渲染

3. **代码分割**
   - 按路由分割代码
   - 按功能模块分割代码
   - 使用动态导入

4. **预加载策略**
   - 对关键资源使用预加载
   - 对可能需要的资源使用预获取
   - 合理使用缓存策略

## 浏览器兼容性

- IntersectionObserver API（图片懒加载和分页加载）
- ES6+ 语法支持
- 现代浏览器（Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+）

## 注意事项

1. 图片懒加载依赖于 IntersectionObserver API，在不支持的浏览器中会回退到立即加载
2. 分页加载适合纯文本内容，对于包含复杂结构的内容需要自定义 `renderContent` 函数
3. 虚拟滚动需要固定高度的列表项，如果项高度不固定，需要调整实现
4. 懒加载组件在首次使用时会有轻微延迟，建议提供良好的加载反馈

## 性能监控

可以通过浏览器开发者工具的 Performance 和 Network 面板监控懒加载效果：

1. 查看资源加载时间线
2. 检查内存使用情况
3. 分析渲染性能
4. 验证代码分割效果