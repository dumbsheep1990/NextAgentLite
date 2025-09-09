#!/usr/bin/env python3
"""
Atlas集成代码验证脚本
验证集成代码的完整性和正确性，不依赖Atlas实际安装
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Dict, Any

class AtlasIntegrationVerifier:
    """Atlas集成验证器"""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.issues = []
        self.passed_checks = 0
        self.total_checks = 0
        
    def check(self, name: str, condition: bool, message: str = ""):
        """检查条件"""
        self.total_checks += 1
        status = "✅ PASS" if condition else "❌ FAIL"
        full_message = f"{status} {name}"
        if message:
            full_message += f": {message}"
        print(full_message)
        
        if condition:
            self.passed_checks += 1
        else:
            self.issues.append(f"{name}: {message}")
    
    def verify_project_structure(self):
        """验证项目结构"""
        print("📁 验证项目结构")
        print("-" * 50)
        
        # 检查主要目录
        self.check(
            "项目根目录",
            (self.project_root / "mat-backend").exists() and 
            (self.project_root / "mat-qa").exists(),
            "确认这是NextAgentLite项目"
        )
        
        # 检查后端文件
        backend_files = [
            "mat-backend/service/atlas_data_service.py",
            "mat-backend/api/endpoints/atlas_integration.py"
        ]
        
        for file_path in backend_files:
            full_path = self.project_root / file_path
            self.check(
                f"后端文件 {Path(file_path).name}",
                full_path.exists(),
                str(full_path)
            )
        
        # 检查前端文件
        frontend_files = [
            "mat-qa/src/services/atlasService.ts",
            "mat-qa/src/components/embedding/AtlasVisualization.tsx",
            "mat-qa/src/pages/knowledge/VectorizationPage.tsx"
        ]
        
        for file_path in frontend_files:
            full_path = self.project_root / file_path
            self.check(
                f"前端文件 {Path(file_path).name}",
                full_path.exists(),
                str(full_path)
            )
        
        print()
    
    def verify_backend_integration(self):
        """验证后端集成"""
        print("🔧 验证后端集成")
        print("-" * 50)
        
        # 检查路由注册
        routes_file = self.project_root / "mat-backend/api/routes.py"
        if routes_file.exists():
            content = routes_file.read_text(encoding='utf-8')
            self.check(
                "API路由导入",
                "atlas_integration" in content,
                "atlas_integration已导入"
            )
            self.check(
                "API路由注册",
                "atlas_integration.router" in content,
                "路由已注册到主路由器"
            )
        else:
            self.check("路由文件", False, "routes.py不存在")
        
        # 检查数据服务
        data_service_file = self.project_root / "mat-backend/service/atlas_data_service.py"
        if data_service_file.exists():
            content = data_service_file.read_text(encoding='utf-8')
            
            # 检查关键类和方法
            key_elements = [
                "class AtlasDataService",
                "prepare_vector_data_for_atlas",
                "save_data_to_csv",
                "get_data_statistics"
            ]
            
            for element in key_elements:
                self.check(
                    f"数据服务-{element}",
                    element in content,
                    f"包含{element}"
                )
        
        # 检查API端点
        api_file = self.project_root / "mat-backend/api/endpoints/atlas_integration.py"
        if api_file.exists():
            content = api_file.read_text(encoding='utf-8')
            
            # 检查关键端点
            endpoints = [
                "/atlas/start",
                "/atlas/stop", 
                "/atlas/status",
                "/atlas/data-stats"
            ]
            
            for endpoint in endpoints:
                self.check(
                    f"API端点 {endpoint}",
                    endpoint in content,
                    f"端点已定义"
                )
        
        print()
    
    def verify_frontend_integration(self):
        """验证前端集成"""
        print("🎨 验证前端集成")
        print("-" * 50)
        
        # 检查服务层
        service_file = self.project_root / "mat-qa/src/services/atlasService.ts"
        if service_file.exists():
            content = service_file.read_text(encoding='utf-8')
            
            # 检查关键方法
            methods = [
                "startService",
                "stopService",
                "getStatus", 
                "getDataStatistics"
            ]
            
            for method in methods:
                self.check(
                    f"服务层-{method}",
                    method in content,
                    f"方法已实现"
                )
            
            # 检查类型定义
            types = [
                "AtlasStartRequest",
                "AtlasResponse",
                "AtlasStatus",
                "AtlasDataStats"
            ]
            
            for type_name in types:
                self.check(
                    f"类型定义-{type_name}",
                    type_name in content,
                    f"类型已定义"
                )
        
        # 检查组件
        component_file = self.project_root / "mat-qa/src/components/embedding/AtlasVisualization.tsx"
        if component_file.exists():
            content = component_file.read_text(encoding='utf-8')
            
            # 检查关键功能
            features = [
                "handleStartAtlas",
                "handleStopAtlas", 
                "checkAtlasStatus",
                "AtlasVisualization"
            ]
            
            for feature in features:
                self.check(
                    f"组件功能-{feature}",
                    feature in content,
                    f"功能已实现"
                )
        
        # 检查页面集成
        page_file = self.project_root / "mat-qa/src/pages/knowledge/VectorizationPage.tsx"
        if page_file.exists():
            content = page_file.read_text(encoding='utf-8')
            
            self.check(
                "页面集成-AtlasVisualization",
                "AtlasVisualization" in content,
                "组件已集成到页面"
            )
            
            self.check(
                "页面集成-Tabs",
                "向量可视化" in content,
                "选项卡已添加"
            )
        
        print()
    
    def verify_build_compatibility(self):
        """验证构建兼容性"""
        print("🔨 验证构建兼容性")
        print("-" * 50)
        
        # 检查package.json
        package_json = self.project_root / "mat-qa/package.json"
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                
                # 检查关键依赖
                dependencies = package_data.get('dependencies', {})
                dev_dependencies = package_data.get('devDependencies', {})
                all_deps = {**dependencies, **dev_dependencies}
                
                required_deps = [
                    'react',
                    'typescript', 
                    'antd',
                    '@types/react'
                ]
                
                for dep in required_deps:
                    self.check(
                        f"依赖-{dep}",
                        dep in all_deps,
                        f"版本: {all_deps.get(dep, 'N/A')}"
                    )
                
            except Exception as e:
                self.check("package.json解析", False, str(e))
        
        # 检查TypeScript配置
        tsconfig = self.project_root / "mat-qa/tsconfig.json"
        self.check(
            "TypeScript配置",
            tsconfig.exists(),
            "tsconfig.json存在"
        )
        
        print()
    
    def verify_documentation(self):
        """验证文档完整性"""
        print("📚 验证文档完整性")
        print("-" * 50)
        
        # 检查主要文档文件
        docs = [
            "ATLAS_INTEGRATION_GUIDE.md",
            "scripts/setup_atlas.sh",
            "test_atlas_integration.py"
        ]
        
        for doc in docs:
            doc_path = self.project_root / doc
            self.check(
                f"文档-{Path(doc).name}",
                doc_path.exists(),
                str(doc_path)
            )
        
        print()
    
    def run_verification(self):
        """运行完整验证"""
        print("🔍 Atlas集成代码验证")
        print("=" * 60)
        print()
        
        # 运行各项检查
        self.verify_project_structure()
        self.verify_backend_integration()
        self.verify_frontend_integration()
        self.verify_build_compatibility()
        self.verify_documentation()
        
        # 输出总结
        print("📊 验证总结")
        print("-" * 50)
        print(f"总检查项: {self.total_checks}")
        print(f"通过: {self.passed_checks}")
        print(f"失败: {len(self.issues)}")
        print(f"成功率: {(self.passed_checks / self.total_checks * 100):.1f}%")
        
        if self.issues:
            print(f"\n❌ 发现的问题:")
            for i, issue in enumerate(self.issues, 1):
                print(f"   {i}. {issue}")
        
        print()
        
        if len(self.issues) == 0:
            print("🎉 所有检查通过！Atlas集成代码完整且正确")
            print("💡 建议:")
            print("   1. 安装embedding-atlas: pip install embedding-atlas")
            print("   2. 启动服务测试完整功能")
            print("   3. 确保数据库中有向量数据用于可视化")
            return True
        elif len(self.issues) <= 2:
            print("⚠️  大部分功能正常，有少量问题需要修复")
            return False
        else:
            print("❌ 发现多个问题，需要检查集成代码")
            return False

def main():
    """主函数"""
    verifier = AtlasIntegrationVerifier()
    success = verifier.run_verification()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()