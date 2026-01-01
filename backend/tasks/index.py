import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для управления заданиями и их модерации"""
    
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
                    SELECT id, title, description, reward, difficulty, is_published, created_at
                    FROM tasks
                    WHERE is_published = TRUE
                    ORDER BY created_at DESC
                """)
                tasks = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'tasks': [dict(t) for t in tasks]}, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_list':
                cur.execute("""
                    SELECT id, title, description, reward, difficulty, is_published, created_at
                    FROM tasks
                    ORDER BY created_at DESC
                """)
                tasks = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'tasks': [dict(t) for t in tasks]}, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create':
                title = body.get('title')
                description = body.get('description')
                reward = body.get('reward')
                difficulty = body.get('difficulty', 'medium')
                created_by = body.get('created_by')
                
                cur.execute("""
                    INSERT INTO tasks (title, description, reward, difficulty, created_by, is_published)
                    VALUES (%s, %s, %s, %s, %s, FALSE)
                    RETURNING id, title, description, reward, difficulty, is_published, created_at
                """, (title, description, reward, difficulty, created_by))
                
                task = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'task': dict(task)}, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'submit':
                task_id = body.get('task_id')
                user_id = body.get('user_id')
                screenshot_url = body.get('screenshot_url')
                link_url = body.get('link_url')
                
                cur.execute("""
                    INSERT INTO task_submissions (task_id, user_id, screenshot_url, link_url, status)
                    VALUES (%s, %s, %s, %s, 'pending')
                    RETURNING id, task_id, user_id, screenshot_url, link_url, status, submitted_at
                """, (task_id, user_id, screenshot_url, link_url))
                
                submission = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'submission': dict(submission)}, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'publish':
                task_id = body.get('task_id')
                
                cur.execute("""
                    UPDATE tasks
                    SET is_published = TRUE, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, title, is_published
                """, (task_id,))
                
                task = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'task': dict(task)}, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'approve':
                submission_id = body.get('submission_id')
                admin_id = body.get('admin_id')
                
                cur.execute("""
                    SELECT ts.id, ts.task_id, ts.user_id, t.reward
                    FROM task_submissions ts
                    JOIN tasks t ON ts.task_id = t.id
                    WHERE ts.id = %s AND ts.status = 'pending'
                """, (submission_id,))
                
                submission = cur.fetchone()
                
                if not submission:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Submission not found'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE task_submissions
                    SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = %s
                    WHERE id = %s
                """, (admin_id, submission_id))
                
                cur.execute("""
                    UPDATE users
                    SET balance = balance + %s, completed_tasks = completed_tasks + 1,
                        level = FLOOR((completed_tasks + 1) / 5) + 1
                    WHERE id = %s
                    RETURNING balance, level, completed_tasks
                """, (submission['reward'], submission['user_id']))
                
                user = cur.fetchone()
                
                cur.execute("""
                    INSERT INTO transactions (user_id, type, amount, task_submission_id, description)
                    VALUES (%s, 'task', %s, %s, 'Награда за выполнение задания')
                """, (submission['user_id'], submission['reward'], submission_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'user': dict(user)}, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'reject':
                submission_id = body.get('submission_id')
                admin_id = body.get('admin_id')
                comment = body.get('comment', '')
                
                cur.execute("""
                    UPDATE task_submissions
                    SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, 
                        reviewed_by = %s, admin_comment = %s
                    WHERE id = %s
                """, (admin_id, comment, submission_id))
                
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
