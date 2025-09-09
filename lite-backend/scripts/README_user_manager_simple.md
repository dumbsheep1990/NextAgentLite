# 用户管理脚本使用说明（简化版）

## 概述
`user_manager_simple.py` 是一个命令行工具，用于生成用户管理的MCP命令。该脚本不直接操作数据库，而是生成相应的MCP命令，您可以在Claude Code中使用这些命令进行用户管理。

## 使用方法

### 1. 查看当前用户配置
```bash
python scripts/user_manager_simple.py show
```

### 2. 获取查看用户列表的MCP命令
```bash
python scripts/user_manager_simple.py list
```

### 3. 获取常用MCP命令参考
```bash
python scripts/user_manager_simple.py mcp
```

### 4. 生成添加用户的MCP命令
```bash
python scripts/user_manager_simple.py add <用户名> <密码> <角色> <显示名称> [--email <邮箱>]
```

示例:
```bash
python scripts/user_manager_simple.py add newuser password123 researcher "新研究员" --email newuser@example.com
```

### 5. 生成更新用户的MCP命令
```bash
python scripts/user_manager_simple.py update <用户名> [--full_name <显示名称>] [--email <邮箱>] [--role <角色>]
```

示例:
```bash
python scripts/user_manager_simple.py update researcher1 --full_name "高级研究员"
```

### 6. 生成删除用户的MCP命令
```bash
python scripts/user_manager_simple.py delete <用户名>
```

### 7. 生成重置密码的MCP命令
```bash
python scripts/user_manager_simple.py reset-password <用户名> <新密码>
```

### 8. 生成切换用户状态的MCP命令
```bash
python scripts/user_manager_simple.py toggle-status <用户名>
```

## 工作流程

1. 运行相应的命令生成MCP指令
2. 复制生成的MCP命令
3. 在Claude Code中使用MCP工具执行命令
4. 查看执行结果

## 示例操作流程

### 添加新用户
1. 生成命令：
   ```bash
   python scripts/user_manager_simple.py add newuser secret123 researcher "新研究员"
   ```

2. 使用生成的MCP命令：
   ```
   mcp__postgres-db__execute_postgres: 
   INSERT INTO users (username, email, hashed_password, full_name, is_active, is_superuser, role, password_hash, created_at) 
   VALUES ('newuser', 'newuser@geopolymer.com', 'secret123', '新研究员', true, false, 'researcher', 'secret123', '2025-08-10 12:57:11');
   ```

3. 验证添加结果：
   ```
   mcp__postgres-db__query_postgres: SELECT * FROM users WHERE username = 'newuser';
   ```

## 当前用户配置

| 用户名      | 密码          | 角色       | 显示名称     |
|------------|---------------|-----------|-------------|
| admin      | matscience2025| admin     | 系统管理员   |
| researcher1| research123   | researcher| 研究员1     |
| researcher2| research123   | researcher| 研究员2     |
| researcher3| research123   | researcher| 研究员3     |

## 环境变量配置

用户配置已迁移到环境变量，位于 `.env.local` 文件中：

```env
DEFAULT_USERS=admin:matscience2025:admin:系统管理员,researcher1:research123:researcher:研究员1,researcher2:research123:researcher:研究员2,researcher3:research123:researcher:研究员3
```

## 注意事项

1. **权限管理**: 该脚本仅生成命令，不直接执行数据库操作
2. **命令验证**: 请在执行MCP命令前仔细检查生成的SQL语句
3. **备份建议**: 在进行用户删除等危险操作前，建议备份数据库
4. **密码安全**: 当前密码以明文存储，生产环境应考虑加密存储

## 优势

- **安全**: 不直接连接数据库，避免连接问题
- **灵活**: 可以在任何支持MCP的环境中使用生成的命令
- **可审计**: 所有操作都是可见的MCP命令，便于审核
- **无依赖**: 不需要复杂的数据库驱动程序