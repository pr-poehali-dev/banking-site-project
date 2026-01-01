import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from decimal import Decimal

def handler(event: dict, context) -> dict:
    """API для регистрации и авторизации пользователей MegaCoin"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                username = body.get('username', '').strip()
                email = body.get('email', '').strip()
                email_password = body.get('emailPassword', '')
                password = body.get('password', '')
                
                forbidden = ['admin', 'administrator', 'root', 'moderator']
                if any(word in username.lower() for word in forbidden):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Это имя пользователя запрещено'}),
                        'isBase64Encoded': False
                    }
                
                if len(password) < 4:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пароль должен содержать минимум 4 символа'}),
                        'isBase64Encoded': False
                    }
                
                import random
                user_code = ''.join([str(random.randint(0, 9)) for _ in range(20)])
                
                cur.execute("""
                    INSERT INTO users (username, email, email_password, password_hash, user_code)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, username, email, balance, user_code, level, completed_tasks, is_blocked
                """, (username, email, email_password, password, user_code))
                
                user = cur.fetchone()
                conn.commit()
                
                user_dict = dict(user)
                user_dict['balance'] = float(user_dict['balance'])
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': user_dict}),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                username = body.get('username', '').strip()
                password = body.get('password', '')
                
                if username == 'admin' and password == 'stepan12':
                    cur.execute("SELECT * FROM users WHERE username = 'admin' AND is_admin = TRUE")
                    admin = cur.fetchone()
                    
                    if admin:
                        admin_dict = dict(admin)
                        admin_dict['balance'] = float(admin_dict['balance'])
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'user': admin_dict, 'isAdmin': True}),
                            'isBase64Encoded': False
                        }
                
                cur.execute("""
                    SELECT id, username, email, balance, user_code, level, completed_tasks, is_blocked, is_admin
                    FROM users
                    WHERE username = %s AND password_hash = %s
                """, (username, password))
                
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный логин или пароль'}),
                        'isBase64Encoded': False
                    }
                
                if user['is_blocked']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь заблокирован'}),
                        'isBase64Encoded': False
                    }
                
                user_dict = dict(user)
                user_dict['balance'] = float(user_dict['balance'])
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': user_dict, 'isAdmin': user['is_admin']}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()