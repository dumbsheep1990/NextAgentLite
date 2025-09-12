#!/usr/bin/env python3
"""
ElasticSearch 迁移管理器
管理ElasticSearch的版本控制和迁移
"""

import json
import hashlib
from typing import Dict, List, Optional, Callable
from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError, RequestError

from .init_elasticsearch import ElasticSearchInitializer


class ESMigrationManager:
    """ElasticSearch迁移管理器"""
    
    def __init__(self, es_config: Dict = None):
        """初始化迁移管理器"""
        self.initializer = ElasticSearchInitializer(es_config)
        self.es = self.initializer.es
        self.migrations = {}
        self._register_migrations()
    
    def _register_migrations(self):
        """注册所有迁移"""
        self.migrations = {
            "1.0.0": {
                "description": "初始化ElasticSearch索引",
                "up": self._migration_1_0_0_up,
                "down": self._migration_1_0_0_down
            },
            # 后续版本迁移在此添加
        }
    
    def get_current_version(self) -> str:
        """获取当前迁移版本"""
        return self.initializer.check_version()
    
    def get_pending_migrations(self) -> List[str]:
        """获取待执行的迁移版本"""
        current_version = self.get_current_version()
        pending = []
        
        for version in sorted(self.migrations.keys()):
            if self._compare_version(version, current_version) > 0:
                pending.append(version)
        
        return pending
    
    def _compare_version(self, v1: str, v2: str) -> int:
        """比较版本号 (v1 > v2 返回1, v1 < v2 返回-1, v1 == v2 返回0)"""
        def normalize(v):
            return [int(x) for x in v.split('.')]
        
        v1_parts = normalize(v1)
        v2_parts = normalize(v2)
        
        # 补齐长度
        max_len = max(len(v1_parts), len(v2_parts))
        v1_parts.extend([0] * (max_len - len(v1_parts)))
        v2_parts.extend([0] * (max_len - len(v2_parts)))
        
        for i in range(max_len):
            if v1_parts[i] > v2_parts[i]:
                return 1
            elif v1_parts[i] < v2_parts[i]:
                return -1
        
        return 0
    
    def run_migration(self, target_version: str) -> bool:
        """运行迁移到指定版本"""
        current_version = self.get_current_version()
        
        if target_version == current_version:
            print(f"✓ 已是目标版本 {target_version}")
            return True
        
        if target_version not in self.migrations:
            print(f"✗ 未找到版本 {target_version} 的迁移")
            return False
        
        try:
            migration = self.migrations[target_version]
            print(f"🔄 执行迁移: {target_version} - {migration['description']}")
            
            # 执行迁移
            success = migration["up"]()
            
            if success:
                # 更新版本
                self.initializer.update_version(target_version)
                print(f"✓ 迁移完成: {target_version}")
                return True
            else:
                print(f"✗ 迁移失败: {target_version}")
                return False
                
        except Exception as e:
            print(f"✗ 迁移异常 {target_version}: {e}")
            return False
    
    def run_all_pending_migrations(self) -> bool:
        """运行所有待执行的迁移"""
        pending = self.get_pending_migrations()
        
        if not pending:
            print("✓ 没有待执行的迁移")
            return True
        
        print(f"📋 待执行迁移: {pending}")
        
        for version in pending:
            if not self.run_migration(version):
                print(f"✗ 迁移中断于版本: {version}")
                return False
        
        print("🎉 所有迁移执行完成")
        return True
    
    def check_and_migrate(self) -> bool:
        """检查并自动执行迁移（系统启动时调用）"""
        try:
            # 检查ES连接
            if not self.es.ping():
                return False
            
            # 获取当前版本和待迁移版本
            current_version = self.get_current_version()
            latest_version = max(self.migrations.keys(), key=lambda x: self._compare_version(x, "0.0.0"))
            
            if current_version == latest_version:
                return True
            
            # 执行迁移
            return self.run_all_pending_migrations()
            
        except Exception as e:
            print(f"✗ 迁移检查失败: {e}")
            return False
    
    def rollback_migration(self, target_version: str) -> bool:
        """回滚到指定版本"""
        current_version = self.get_current_version()
        
        if self._compare_version(target_version, current_version) >= 0:
            print(f"✗ 目标版本 {target_version} 不能高于或等于当前版本 {current_version}")
            return False
        
        # 找到需要回滚的版本（从当前版本往下）
        versions_to_rollback = []
        for version in sorted(self.migrations.keys(), reverse=True):
            if self._compare_version(version, target_version) > 0 and self._compare_version(version, current_version) <= 0:
                versions_to_rollback.append(version)
        
        print(f"回滚版本: {versions_to_rollback}")
        
        try:
            for version in versions_to_rollback:
                migration = self.migrations[version]
                print(f"回滚版本: {version}")
                
                if "down" in migration and migration["down"]:
                    success = migration["down"]()
                    if not success:
                        print(f"✗ 回滚失败: {version}")
                        return False
                else:
                    print(f"版本 {version} 没有回滚方法")
            
            # 更新版本
            self.initializer.update_version(target_version)
            print(f"✓ 回滚完成到版本: {target_version}")
            return True
            
        except Exception as e:
            print(f"✗ 回滚异常: {e}")
            return False
    
    def get_migration_status(self) -> Dict:
        """获取迁移状态信息"""
        current_version = self.get_current_version()
        pending = self.get_pending_migrations()
        
        return {
            "current_version": current_version,
            "latest_version": max(self.migrations.keys(), key=lambda x: self._compare_version(x, "0.0.0")),
            "pending_migrations": pending,
            "total_migrations": len(self.migrations),
            "is_up_to_date": len(pending) == 0
        }
    
    def validate_indices(self) -> Dict[str, bool]:
        """验证所有索引的健康状态"""
        indices_status = {}
        
        expected_indices = [
            "document_chunks",
            "papers", 
            "documents",
            "retrieval_cache",
            "media"
        ]
        
        for index in expected_indices:
            try:
                exists = self.es.indices.exists(index=index)
                if exists:
                    # 检查索引健康状态
                    health = self.es.cluster.health(index=index)
                    indices_status[index] = health["status"] in ["green", "yellow"]
                else:
                    indices_status[index] = False
            except Exception:
                indices_status[index] = False
        
        return indices_status
    
    def repair_indices(self) -> bool:
        """修复损坏的索引"""
        print("🔧 开始修复索引...")
        
        indices_status = self.validate_indices()
        damaged_indices = [idx for idx, status in indices_status.items() if not status]
        
        if not damaged_indices:
            print("✓ 所有索引状态正常")
            return True
        
        print(f"发现损坏索引: {damaged_indices}")
        
        # 重新运行最新版本的迁移进行修复
        latest_version = max(self.migrations.keys(), key=lambda x: self._compare_version(x, "0.0.0"))
        
        try:
            migration = self.migrations[latest_version]
            print(f"重新执行迁移修复: {latest_version}")
            
            success = migration["up"]()
            if success:
                print("✓ 索引修复完成")
                return True
            else:
                print("✗ 索引修复失败")
                return False
                
        except Exception as e:
            print(f"✗ 索引修复异常: {e}")
            return False
    
    # ==================== 具体迁移方法 ====================
    
    def _migration_1_0_0_up(self) -> bool:
        """1.0.0版本迁移"""
        print("执行1.0.0版本迁移...")
        return self.initializer.run_initialization()
    
    def _migration_1_0_0_down(self) -> bool:
        """1.0.0版本回滚"""
        print("回滚1.0.0版本...")
        
        try:
            # 删除所有业务索引
            indices_to_delete = [
                "document_chunks",
                "papers",
                "documents", 
                "retrieval_cache",
                "media"
            ]
            
            for index in indices_to_delete:
                if self.es.indices.exists(index=index):
                    self.es.indices.delete(index=index)
                    print(f"✓ 删除索引: {index}")
            
            # 删除迁移记录索引
            if self.es.indices.exists(index=".mat_migrations"):
                self.es.indices.delete(index=".mat_migrations")
                print("✓ 删除迁移记录")
            
            print("✓ 1.0.0版本回滚完成")
            return True
            
        except Exception as e:
            print(f"✗ 1.0.0版本回滚失败: {e}")
            return False


def main():
    """主函数，用于独立运行迁移管理"""
    import sys
    
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python es_migration_manager.py status    # 查看迁移状态")
        print("  python es_migration_manager.py migrate   # 执行待处理迁移")
        print("  python es_migration_manager.py rollback <version>  # 回滚到指定版本")
        print("  python es_migration_manager.py repair    # 修复损坏索引")
        print("  python es_migration_manager.py validate  # 验证索引状态")
        return
    
    command = sys.argv[1]
    manager = ESMigrationManager()
    
    try:
        if command == "status":
            status = manager.get_migration_status()
            print(json.dumps(status, indent=2, ensure_ascii=False))
        
        elif command == "migrate":
            success = manager.run_all_pending_migrations()
            sys.exit(0 if success else 1)
        
        elif command == "rollback":
            if len(sys.argv) < 3:
                print("✗ 请指定回滚目标版本")
                sys.exit(1)
            target_version = sys.argv[2]
            success = manager.rollback_migration(target_version)
            sys.exit(0 if success else 1)
        
        elif command == "repair":
            success = manager.repair_indices()
            sys.exit(0 if success else 1)
        
        elif command == "validate":
            status = manager.validate_indices()
            print(json.dumps(status, indent=2, ensure_ascii=False))
            all_healthy = all(status.values())
            sys.exit(0 if all_healthy else 1)
        
        else:
            print(f"✗ 未知命令: {command}")
            sys.exit(1)
            
    except Exception as e:
        print(f"执行失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 