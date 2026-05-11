@echo off
chcp 65001 >nul
echo 🧪 运行懒加载功能测试
echo ==========================

echo.
echo 📋 运行基础测试...
call npm run test:unit -- tests/unit/lazyLoadingBasic.test.ts

echo.
echo 📋 运行图片懒加载测试...
call npm run test:unit -- tests/unit/lazyImage.test.tsx

echo.
echo 📋 运行性能测试...
call npm run test:unit -- tests/unit/lazyLoadingPerformance.test.tsx

echo.
echo 📋 运行集成测试...
call npm run test:unit -- tests/unit/lazyLoadingIntegration.test.tsx

echo.
echo ✅ 所有测试完成！
pause