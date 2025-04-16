import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table_name = os.getenv('TABLE_NAME', 'ToDoTasks')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    print("Received event:", json.dumps(event, indent=2))
    
    status_code = 200
    headers = {
        'Content-Type': 'application/json',
    }
    
    try:
        http_method = event.get('requestContext', {}).get('http', {}).get('method', event.get('httpMethod'))
        if http_method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            print("Query Parameters:", json.dumps(query_params, indent=2))

            task_id = query_params.get('taskId')
            if task_id:
                response = table.get_item(Key={'taskId': task_id})
                body = response.get('Item', {'message': 'Task not found'})
            else:
                response = table.scan()
                body = response.get('Items', [])

        elif http_method == 'POST':
            new_task = json.loads(event.get('body', '{}'))
            table.put_item(Item={
                'taskId': new_task['taskId'],
                'task': new_task['task'],
                'completed': new_task['completed']
            })
            body = {'message': 'Task created successfully'}

        elif http_method == 'PUT':
            updated_task = json.loads(event.get('body', '{}'))
            table.update_item(
                Key={'taskId': updated_task['taskId']},
                UpdateExpression='SET #t = :task, #c = :completed',
                ExpressionAttributeNames={
                    '#t': 'task',
                    '#c': 'completed'
                },
                ExpressionAttributeValues={
                    ':task': updated_task['task'],
                    ':completed': updated_task['completed']
                }
            )
            body = {'message': 'Task updated successfully'}

        elif http_method == 'DELETE':
            delete_payload = json.loads(event.get('body', '{}'))
            table.delete_item(Key={'taskId': delete_payload['taskId']})
            body = {'message': 'Task deleted successfully'}

        else:
            status_code = 400
            body = {'message': f'Unsupported method: {http_method}'}

    except Exception as e:
        print("Error:", str(e))
        status_code = 500
        body = {'message': 'Internal server error', 'error': str(e)}

    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body)
    }
