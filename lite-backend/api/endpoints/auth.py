"""
认证相关API端点
提供用户登录验证和用户管理功能
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import io
import random
import string
import hashlib
import time
from PIL import Image, ImageDraw, ImageFont
from core.logger import logger
from db.database import DatabaseManager
import bcrypt

router = APIRouter()

class User(BaseModel):
    username: str
    password: str
    role: str
    displayName: str

class PublicUser(BaseModel):
    id: int
    username: str
    role: str
    displayName: str

class DatabaseUser(BaseModel):
    id: int
    username: str
    email: str
    hashed_password: str
    full_name: str
    role: str
    is_active: bool

class AuthResponse(BaseModel):
    users: List[User]

class LoginRequest(BaseModel):
    username: str
    password: str
    captcha_code: str
    captcha_id: str

class LoginResponse(BaseModel):
    success: bool
    user: Optional[PublicUser] = None
    message: str = ""
    token: Optional[str] = None

class CaptchaResponse(BaseModel):
    captcha_id: str
    success: bool = True
    message: str = ""

# 验证码存储（生产环境应使用Redis或数据库）
captcha_store: Dict[str, Dict[str, Any]] = {}

def load_users_from_env() -> List[User]:
    """从环境变量加载用户配置"""
    users_config = os.getenv('DEFAULT_USERS', '')
    users = []
    
    if not users_config:
        # 如果环境变量为空，使用默认配置
        logger.warning("环境变量 DEFAULT_USERS 未设置，使用默认用户配置")
        users = [
            User(
                username="admin",
                password="matscience2025",
                role="admin",
                displayName="系统管理员"
            ),
            User(
                username="researcher1",
                password="research123",
                role="researcher", 
                displayName="研究员1"
            ),
            User(
                username="researcher2",
                password="research123",
                role="researcher", 
                displayName="研究员2"
            ),
            User(
                username="researcher3",
                password="research123",
                role="researcher", 
                displayName="研究员3"
            )
        ]
    else:
        # 解析环境变量配置 (格式: username:password:role:displayName)
        try:
            for user_config in users_config.split(','):
                parts = user_config.strip().split(':')
                if len(parts) == 4:
                    username, password, role, display_name = parts
                    users.append(User(
                        username=username,
                        password=password,
                        role=role,
                        displayName=display_name
                    ))
                else:
                    logger.error(f"用户配置格式错误: {user_config}")
        except Exception as e:
            logger.error(f"解析用户配置失败: {e}")
            # 出错时使用默认配置
            users = [
                User(
                    username="admin",
                    password="matscience2025", 
                    role="admin",
                    displayName="系统管理员"
                )
            ]
    
    logger.info(f"已加载 {len(users)} 个用户配置")
    return users

# 从环境变量加载用户配置
DEFAULT_USERS = load_users_from_env()

class CaptchaGenerator:
    """验证码生成器"""
    
    @staticmethod
    def generate_math_captcha() -> tuple[str, str]:
        """生成数学运算验证码"""
        num1 = random.randint(1, 9)
        num2 = random.randint(1, 9)
        operators = ['+', '-', '*']
        op = random.choice(operators)
        
        if op == '+':
            answer = num1 + num2
        elif op == '-':
            # 确保结果为正数
            if num1 < num2:
                num1, num2 = num2, num1
            answer = num1 - num2
        else:  # '*'
            answer = num1 * num2
            
        question = f"{num1} {op} {num2} = ?"
        return question, str(answer)
    
    @staticmethod
    def generate_text_captcha(length: int = 4) -> str:
        """生成随机字母数字验证码"""
        characters = string.ascii_uppercase + string.digits
        # 排除容易混淆的字符
        characters = characters.replace('0', '').replace('O', '').replace('I', '').replace('1', '')
        return ''.join(random.choice(characters) for _ in range(length))
    
    @staticmethod
    def create_captcha_image(text: str, width: int = 120, height: int = 40) -> io.BytesIO:
        """创建验证码图片"""
        # 创建图片
        image = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(image)
        
        # 添加噪声点
        for _ in range(20):
            x = random.randint(0, width)
            y = random.randint(0, height)
            draw.point((x, y), fill='gray')
        
        # 添加噪声线
        for _ in range(3):
            x1, y1 = random.randint(0, width), random.randint(0, height)
            x2, y2 = random.randint(0, width), random.randint(0, height)
            draw.line([(x1, y1), (x2, y2)], fill='lightgray', width=1)
        
        # 绘制文本
        try:
            # 尝试使用系统字体
            font_size = 16
            font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        # 计算文本位置
        text_width = draw.textlength(text, font=font)
        text_height = font_size
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        # 绘制带干扰的文本
        colors = ['black', 'darkblue', 'darkred', 'darkgreen']
        for i, char in enumerate(text):
            char_x = x + i * (text_width // len(text))
            char_y = y + random.randint(-3, 3)  # 添加垂直偏移
            color = random.choice(colors)
            draw.text((char_x, char_y), char, fill=color, font=font)
        
        # 保存到字节流
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        return img_buffer
    
    @staticmethod
    def generate_captcha_id() -> str:
        """生成验证码ID"""
        timestamp = str(int(time.time()))
        random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        return hashlib.md5(f"{timestamp}_{random_str}".encode()).hexdigest()

def cleanup_expired_captcha():
    """清理过期的验证码"""
    current_time = time.time()
    expired_keys = [
        key for key, value in captcha_store.items()
        if current_time - value.get('created_at', 0) > 300  # 5分钟过期
    ]
    for key in expired_keys:
        del captcha_store[key]

async def get_users_from_database() -> List[DatabaseUser]:
    """从数据库获取用户配置"""
    try:
        db = DatabaseManager()
        
        async with db.get_async_session() as session:
            from sqlalchemy import text
            query = text("""
            SELECT id, username, email, hashed_password, full_name, role, is_active 
            FROM users 
            WHERE is_active = true
            ORDER BY id
            """)
            
            result = await session.execute(query)
            rows = result.fetchall()
            
            users = []
            for row in rows:
                users.append(DatabaseUser(
                    id=row.id,
                    username=row.username,
                    email=row.email,
                    hashed_password=row.hashed_password,
                    full_name=row.full_name,
                    role=row.role,
                    is_active=row.is_active
                ))
            
            logger.info(f"从数据库获取到 {len(users)} 个用户")
            return users
        
    except Exception as e:
        logger.error(f"从数据库获取用户失败: {e}")
        return []

async def get_user_by_username(username: str) -> Optional[DatabaseUser]:
    """通过用户名获取用户信息"""
    try:
        db = DatabaseManager()
        
        async with db.get_async_session() as session:
            from sqlalchemy import text
            query = text("""
            SELECT id, username, email, hashed_password, full_name, role, is_active 
            FROM users 
            WHERE username = :username AND is_active = true
            """)
            
            result = await session.execute(query, {"username": username})
            row = result.fetchone()
            
            if row:
                return DatabaseUser(
                    id=row.id,
                    username=row.username,
                    email=row.email,
                    hashed_password=row.hashed_password,
                    full_name=row.full_name,
                    role=row.role,
                    is_active=row.is_active
                )
            
            return None
        
    except Exception as e:
        logger.error(f"通过用户名获取用户失败: {e}")
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        # 检查是否是bcrypt哈希
        if hashed_password.startswith('$2b$'):
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        elif len(hashed_password) == 32 and all(c in '0123456789abcdef' for c in hashed_password.lower()):
            # MD5哈希验证 (32字符十六进制)
            md5_hash = hashlib.md5(plain_password.encode('utf-8')).hexdigest()
            return md5_hash == hashed_password.lower()
        else:
            # 明文比较（开发环境）
            return plain_password == hashed_password
    except Exception as e:
        logger.error(f"密码验证失败: {e}")
        return False

def get_users_config() -> List[User]:
    """获取用户配置，支持环境变量覆盖（保持兼容性）"""
    try:
        # 可以从环境变量或配置文件读取用户配置
        # 这里暂时使用硬编码的默认用户
        return DEFAULT_USERS
    except Exception as e:
        logger.error(f"获取用户配置失败: {e}")
        return DEFAULT_USERS

@router.get("/captcha/generate")
async def generate_captcha():
    """
    生成验证码
    返回验证码ID和图片
    """
    try:
        # 清理过期验证码
        cleanup_expired_captcha()
        
        # 生成验证码ID
        captcha_id = CaptchaGenerator.generate_captcha_id()
        
        # 随机选择验证码类型
        captcha_type = random.choice(['math', 'text'])
        
        if captcha_type == 'math':
            question, answer = CaptchaGenerator.generate_math_captcha()
            display_text = question
            question_text = question
        else:
            answer = CaptchaGenerator.generate_text_captcha()
            display_text = answer
            question_text = display_text
        
        # 存储验证码信息
        captcha_store[captcha_id] = {
            'answer': answer.lower().strip(),
            'type': captcha_type,
            'display_text': display_text,
            'question': question_text,  # 保存完整问题
            'created_at': time.time(),
            'attempts': 0
        }
        
        logger.info(f"生成验证码: {captcha_id}, 类型: {captcha_type}")
        
        return CaptchaResponse(captcha_id=captcha_id)
        
    except Exception as e:
        logger.error(f"生成验证码失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"生成验证码失败: {str(e)}"
        )

@router.get("/captcha/image/{captcha_id}")
async def get_captcha_image(captcha_id: str):
    """
    获取验证码图片
    """
    try:
        if captcha_id not in captcha_store:
            raise HTTPException(status_code=404, detail="验证码不存在或已过期")
        
        captcha_info = captcha_store[captcha_id]
        
        # 使用存储的显示文本
        display_text = captcha_info['display_text']
        
        # 创建图片
        img_buffer = CaptchaGenerator.create_captcha_image(display_text)
        
        return StreamingResponse(
            io.BytesIO(img_buffer.getvalue()),
            media_type="image/png",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取验证码图片失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"获取验证码图片失败: {str(e)}"
        )

def verify_captcha(captcha_id: str, user_input: str) -> bool:
    """验证验证码"""
    if captcha_id not in captcha_store:
        return False
    
    captcha_info = captcha_store[captcha_id]
    
    # 检查是否过期
    if time.time() - captcha_info['created_at'] > 300:  # 5分钟过期
        del captcha_store[captcha_id]
        return False
    
    # 检查尝试次数
    if captcha_info['attempts'] >= 3:
        del captcha_store[captcha_id]
        return False
    
    # 增加尝试次数
    captcha_info['attempts'] += 1
    
    # 验证答案
    correct_answer = captcha_info['answer'].lower().strip()
    user_answer = user_input.lower().strip()
    
    is_correct = correct_answer == user_answer
    
    if is_correct:
        # 验证成功，删除验证码
        del captcha_store[captcha_id]
    
    return is_correct

@router.get("/auth-credentials")
async def get_auth_credentials():
    """
    获取认证凭据配置 - 从数据库获取
    前端用于初始化认证系统
    """
    try:
        db_users = await get_users_from_database()
        
        # 转换为前端期望的格式
        users = [
            User(
                username=user.username,
                password="",  # 不返回密码
                role=user.role,
                displayName=user.full_name
            )
            for user in db_users
        ]
        
        logger.info(f"从数据库返回认证配置，用户数量: {len(users)}")
        
        return AuthResponse(users=users)
        
    except Exception as e:
        logger.error(f"获取认证配置失败: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"获取认证配置失败: {str(e)}"
        )

@router.post("/login")
async def login(request: LoginRequest):
    """
    用户登录验证（包含验证码验证） - 从数据库验证用户
    """
    try:
        # 首先验证验证码
        if not verify_captcha(request.captcha_id, request.captcha_code):
            logger.warning(f"验证码验证失败: {request.username}, captcha_id: {request.captcha_id}")
            return LoginResponse(
                success=False,
                message="验证码错误或已过期，请重新获取"
            )
        
        # 从数据库获取用户信息
        db_user = await get_user_by_username(request.username)
        
        if not db_user:
            logger.warning(f"登录失败，用户不存在: {request.username}")
            return LoginResponse(
                success=False,
                message="用户名或密码错误"
            )
        
        # 验证密码
        if not verify_password(request.password, db_user.hashed_password):
            logger.warning(f"登录失败，密码错误: {request.username}")
            return LoginResponse(
                success=False,
                message="用户名或密码错误"
            )
        
        # 登录成功，返回用户信息（包含数据库ID）
        public_user = PublicUser(
            id=db_user.id,
            username=db_user.username,
            role=db_user.role,
            displayName=db_user.full_name
        )
        
        logger.info(f"用户登录成功: {db_user.full_name} ({db_user.role}) [ID: {db_user.id}]")
        
        # 颁发 JWT Token（供前端与内嵌的 Unla Web 使用）
        try:
            from utils.jwt_utils import create_access_token
            token = create_access_token({
                "sub": str(db_user.id),
                "user_id": db_user.id,
                "username": db_user.username,
                "role": db_user.role,
                "name": db_user.full_name,
            })
        except Exception:
            token = None

        return LoginResponse(
            success=True,
            user=public_user,
            message=f"登录成功，欢迎 {db_user.full_name}！",
            token=token
        )
            
    except Exception as e:
        logger.error(f"登录验证过程出错: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"登录验证失败: {str(e)}"
        )

@router.get("/users")
async def get_users():
    """
    获取所有用户列表（不包含密码） - 从数据库获取
    """
    try:
        db_users = await get_users_from_database()
        
        public_users = [
            PublicUser(
                id=user.id,
                username=user.username,
                role=user.role,
                displayName=user.full_name
            )
            for user in db_users
        ]
        
        logger.info(f"从数据库返回用户列表，用户数量: {len(public_users)}")
        
        return {"users": public_users}
        
    except Exception as e:
        logger.error(f"获取用户列表失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"获取用户列表失败: {str(e)}"
        )

@router.get("/current-user")
async def get_current_user(req: Request):
    """
    获取当前用户信息（需要实现真正的session管理）
    这里返回示例数据
    """
    try:
        # 从 Authorization: Bearer <token> 解析用户
        auth = req.headers.get("Authorization") or ""
        token = None
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
        if not token:
            return {"success": False, "message": "请先登录"}

        from utils.jwt_utils import decode_access_token
        claims = decode_access_token(token)
        if not claims:
            return {"success": False, "message": "令牌无效或已过期"}

        return {
            "success": True,
            "user": {
                "id": claims.get("sub"),
                "username": claims.get("username"),
                "role": claims.get("role"),
                "displayName": claims.get("name"),
            }
        }
        
    except Exception as e:
        logger.error(f"获取当前用户失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"获取当前用户失败: {str(e)}"
        )
