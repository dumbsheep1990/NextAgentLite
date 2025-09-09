#!/usr/bin/env python3
"""
简化版用户管理脚本
直接使用MCP工具进行数据库操作
"""
import argparse
import sys
from datetime import datetime

def list_users():
    """列出所有用户"""
    print("\n=== 用户列表 ===")
    print("请使用以下MCP命令查看用户列表:")
    print("mcp__postgres-db__query_postgres: SELECT id, username, email, full_name, role, is_active FROM users ORDER BY id;")
    print()

def add_user_instructions(username, password, role, full_name, email=None):
    """显示添加用户的MCP命令"""
    if not email:
        email = f"{username}@geopolymer.com"
    
    is_superuser = 'true' if role == 'admin' else 'false'
    created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"\n=== 添加用户: {username} ===")
    print("请使用以下MCP命令添加用户:")
    print(f"""mcp__postgres-db__execute_postgres: 
INSERT INTO users (username, email, hashed_password, full_name, is_active, is_superuser, role, password_hash, created_at) 
VALUES ('{username}', '{email}', '{password}', '{full_name}', true, {is_superuser}, '{role}', '{password}', '{created_at}');""")
    print()

def update_user_instructions(username, **kwargs):
    """显示更新用户的MCP命令"""
    updates = []
    
    if 'full_name' in kwargs and kwargs['full_name']:
        updates.append(f"full_name = '{kwargs['full_name']}'")
    if 'email' in kwargs and kwargs['email']:
        updates.append(f"email = '{kwargs['email']}'")
    if 'role' in kwargs and kwargs['role']:
        updates.append(f"role = '{kwargs['role']}'")
        is_superuser = 'true' if kwargs['role'] == 'admin' else 'false'
        updates.append(f"is_superuser = {is_superuser}")
    
    updates.append(f"updated_at = '{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}'")
    
    update_clause = ', '.join(updates)
    
    print(f"\n=== 更新用户: {username} ===")
    print("请使用以下MCP命令更新用户:")
    print(f"mcp__postgres-db__execute_postgres: UPDATE users SET {update_clause} WHERE username = '{username}';")
    print()

def delete_user_instructions(username):
    """显示删除用户的MCP命令"""
    print(f"\n=== 删除用户: {username} ===")
    print("⚠️  警告：删除用户是不可逆操作！")
    print("请使用以下MCP命令删除用户:")
    print(f"mcp__postgres-db__execute_postgres: DELETE FROM users WHERE username = '{username}';")
    print()

def reset_password_instructions(username, new_password):
    """显示重置密码的MCP命令"""
    updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"\n=== 重置密码: {username} ===")
    print("请使用以下MCP命令重置密码:")
    print(f"""mcp__postgres-db__execute_postgres: 
UPDATE users SET hashed_password = '{new_password}', password_hash = '{new_password}', updated_at = '{updated_at}' 
WHERE username = '{username}';""")
    print()

def toggle_status_instructions(username):
    """显示切换用户状态的MCP命令"""
    updated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"\n=== 切换用户状态: {username} ===")
    print("请先查询当前状态，然后使用相应的MCP命令:")
    print(f"1. 查询当前状态: mcp__postgres-db__query_postgres: SELECT username, is_active FROM users WHERE username = '{username}';")
    print(f"2. 如果当前是活跃状态，禁用用户:")
    print(f"   mcp__postgres-db__execute_postgres: UPDATE users SET is_active = false, updated_at = '{updated_at}' WHERE username = '{username}';")
    print(f"3. 如果当前是禁用状态，启用用户:")
    print(f"   mcp__postgres-db__execute_postgres: UPDATE users SET is_active = true, updated_at = '{updated_at}' WHERE username = '{username}';")
    print()

def show_current_users():
    """显示当前用户配置信息"""
    print("\n=== 当前系统用户配置 ===")
    print("根据最新配置，系统包含以下默认用户:")
    print()
    print("| 用户名      | 密码          | 角色       | 显示名称     |")
    print("|------------|---------------|-----------|-------------|")
    print("| admin      | matscience2025| admin     | 系统管理员   |")
    print("| researcher1| research123   | researcher| 研究员1     |")
    print("| researcher2| research123   | researcher| 研究员2     |")
    print("| researcher3| research123   | researcher| 研究员3     |")
    print()
    print("注意：学生账户已被移除")
    print()

def show_mcp_commands():
    """显示常用的MCP命令"""
    print("\n=== 常用MCP命令参考 ===")
    print()
    print("1. 查看所有用户:")
    print("   mcp__postgres-db__query_postgres:")
    print("   SELECT id, username, email, full_name, role, is_active, created_at FROM users ORDER BY id;")
    print()
    print("2. 查看用户详细信息:")
    print("   mcp__postgres-db__query_postgres:")
    print("   SELECT * FROM users WHERE username = 'admin';")
    print()
    print("3. 统计用户数量:")
    print("   mcp__postgres-db__query_postgres:")
    print("   SELECT role, COUNT(*) as count FROM users GROUP BY role;")
    print()
    print("4. 查看活跃用户:")
    print("   mcp__postgres-db__query_postgres:")
    print("   SELECT username, role, full_name FROM users WHERE is_active = true;")
    print()

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='用户管理脚本（MCP版本）')
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # 列出用户
    subparsers.add_parser('list', help='显示查看用户的MCP命令')
    
    # 显示当前用户配置
    subparsers.add_parser('show', help='显示当前用户配置')
    
    # MCP命令参考
    subparsers.add_parser('mcp', help='显示常用MCP命令参考')
    
    # 添加用户
    add_parser = subparsers.add_parser('add', help='显示添加新用户的MCP命令')
    add_parser.add_argument('username', help='用户名')
    add_parser.add_argument('password', help='密码')
    add_parser.add_argument('role', choices=['admin', 'researcher', 'student'], help='角色')
    add_parser.add_argument('full_name', help='显示名称')
    add_parser.add_argument('--email', help='邮箱地址')
    
    # 更新用户
    update_parser = subparsers.add_parser('update', help='显示更新用户的MCP命令')
    update_parser.add_argument('username', help='用户名')
    update_parser.add_argument('--full_name', help='显示名称')
    update_parser.add_argument('--email', help='邮箱地址')
    update_parser.add_argument('--role', choices=['admin', 'researcher', 'student'], help='角色')
    
    # 删除用户
    delete_parser = subparsers.add_parser('delete', help='显示删除用户的MCP命令')
    delete_parser.add_argument('username', help='用户名')
    
    # 重置密码
    reset_parser = subparsers.add_parser('reset-password', help='显示重置密码的MCP命令')
    reset_parser.add_argument('username', help='用户名')
    reset_parser.add_argument('password', help='新密码')
    
    # 切换用户状态
    toggle_parser = subparsers.add_parser('toggle-status', help='显示切换用户状态的MCP命令')
    toggle_parser.add_argument('username', help='用户名')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == 'list':
            list_users()
        
        elif args.command == 'show':
            show_current_users()
        
        elif args.command == 'mcp':
            show_mcp_commands()
        
        elif args.command == 'add':
            add_user_instructions(
                username=args.username,
                password=args.password,
                role=args.role,
                full_name=args.full_name,
                email=args.email
            )
        
        elif args.command == 'update':
            update_data = {}
            if args.full_name:
                update_data['full_name'] = args.full_name
            if args.email:
                update_data['email'] = args.email
            if args.role:
                update_data['role'] = args.role
            
            update_user_instructions(args.username, **update_data)
        
        elif args.command == 'delete':
            delete_user_instructions(args.username)
        
        elif args.command == 'reset-password':
            reset_password_instructions(args.username, args.password)
        
        elif args.command == 'toggle-status':
            toggle_status_instructions(args.username)
    
    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    main()