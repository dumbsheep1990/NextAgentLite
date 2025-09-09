# 用户管理脚本使用说明

## 概述
`user_manager.py` 是一个命令行工具，用于管理系统用户。支持添加、删除、更新、查看用户以及重置密码等操作。

## 使用方法

### 1. 查看所有用户
```bash
python scripts/user_manager.py list
```

### 2. 添加新用户
```bash
python scripts/user_manager.py add <用户名> <密码> <角色> <显示名称> [--email <邮箱>]
```

示例:
```bash
python scripts/user_manager.py add newuser password123 researcher "新研究员" --email newuser@example.com
```

支持的角色:
- `admin`: 管理员
- `researcher`: 研究员  
- `student`: 学生

### 3. 更新用户信息
```bash
python scripts/user_manager.py update <用户名> [--full_name <显示名称>] [--email <邮箱>] [--role <角色>]
```

示例:
```bash
python scripts/user_manager.py update researcher1 --full_name "高级研究员" --email senior@example.com
```

### 4. 删除用户
```bash
python scripts/user_manager.py delete <用户名>
```

示例:
```bash
python scripts/user_manager.py delete olduser
```

### 5. 重置用户密码
```bash
python scripts/user_manager.py reset-password <用户名> <新密码>
```

示例:
```bash
python scripts/user_manager.py reset-password researcher1 newpassword123
```

### 6. 切换用户状态 (启用/禁用)
```bash
python scripts/user_manager.py toggle-status <用户名>
```

示例:
```bash
python scripts/user_manager.py toggle-status researcher1
```

## 当前用户配置

根据最新配置，系统默认包含以下用户:

| 用户名 | 密码 | 角色 | 显示名称 |
|--------|------|------|----------|
| admin | matscience2025 | admin | 系统管理员 |
| researcher1 | research123 | researcher | 研究员1 |
| researcher2 | research123 | researcher | 研究员2 |
| researcher3 | research123 | researcher | 研究员3 |

## 注意事项

1. **安全性**: 当前密码以明文存储，生产环境应实施适当的密码加密机制
2. **管理员权限**: 删除管理员用户时会有确认提示
3. **数据库依赖**: 脚本需要数据库连接正常工作
4. **角色权限**: 不同角色用户在系统中具有不同的访问权限

## 环境配置

用户配置现已迁移到环境变量中，可通过修改 `.env.local` 文件中的 `DEFAULT_USERS` 配置来调整默认用户:

```env
DEFAULT_USERS=admin:matscience2025:admin:系统管理员,researcher1:research123:researcher:研究员1,researcher2:research123:researcher:研究员2,researcher3:research123:researcher:研究员3
```

格式: `username:password:role:displayName`，多个用户用逗号分隔。