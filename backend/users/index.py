import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для управления пользователями и их балансами"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action', 'list')
            
            if action == 'list':
                cur.execute("""
                    SELECT id, username, email, balance, user_code, level, completed_tasks, is_blocked
                    FROM users
                    WHERE is_admin = FALSE
                    ORDER BY balance DESC
                """)
                users = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': [dict(u) for u in users]}, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'get_by_code':
                code = params.get('code')
                cur.execute("""
                    SELECT id, username, user_code
                    FROM users
                    WHERE user_code = %s AND is_blocked = FALSE
                """, (code,))
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': dict(user)}),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'block':
                user_id = body.get('user_id')
                is_blocked = body.get('is_blocked', True)
                
                cur.execute("""
                    UPDATE users
                    SET is_blocked = %s
                    WHERE id = %s
                    RETURNING id, username, is_blocked
                """, (is_blocked, user_id))
                
                user = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': dict(user)}),
                    'isBase64Encoded': False
                }
            
            elif action == 'add_balance':
                user_id = body.get('user_id')
                amount = body.get('amount')
                admin_id = body.get('admin_id')
                
                cur.execute("""
                    UPDATE users
                    SET balance = balance + %s
                    WHERE id = %s
                    RETURNING id, username, balance
                """, (amount, user_id))
                
                user = cur.fetchone()
                
                cur.execute("""
                    INSERT INTO transactions (user_id, type, amount, description)
                    VALUES (%s, 'admin', %s, 'Начисление администратором')
                """, (user_id, amount))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': dict(user)}),
                    'isBase64Encoded': False
                }
            
            elif action == 'reset_all':
                cur.execute("""
                    UPDATE users
                    SET balance = 0
                    WHERE is_admin = FALSE
                """)
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
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
