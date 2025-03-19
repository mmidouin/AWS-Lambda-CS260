import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocument.from(new DynamoDB());

/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('HTTP Method:', event.httpMethod);
    console.log('Event structure keys:', Object.keys(event));
    let body;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const tableName = process.env.TABLE_NAME || "ToDoTasks"; // Use environment variable for flexibility
        const httpMethod = event.requestContext?.http?.method || event.httpMethod;
        switch (httpMethod) {
            case 'GET': // Fetch tasks
            console.log("Query Parameters:", JSON.stringify(event.queryStringParameters, null, 2));
                if (event.queryStringParameters?.taskId) {
                    // Fetch a specific task
                    const { Item } = await dynamo.get({
                        TableName: tableName,
                        Key: { taskId: event.queryStringParameters.taskId }
                    });
                    body = Item || { message: "Task not found" };
                } else {
                    // Fetch all tasks
                    const { Items } = await dynamo.scan({ TableName: tableName });
                    body = Items;
                }
                break;

            case 'POST': // Create a new task
                const newTask = JSON.parse(event.body);
                await dynamo.put({
                    TableName: tableName,
                    Item: {
                        taskId: newTask.taskId,
                        task: newTask.task,
                        completed: newTask.completed
                    }
                });
                body = { message: "Task created successfully" };
                break;

            case 'PUT': // Update an existing task
                const updatedTask = JSON.parse(event.body);
                await dynamo.update({
                    TableName: tableName,
                    Key: { taskId: updatedTask.taskId },
                    UpdateExpression: "SET task = :task, completed = :completed",
                    ExpressionAttributeValues: {
                        ":task": updatedTask.task,
                        ":completed": updatedTask.completed
                    }
                });
                body = { message: "Task updated successfully" };
                break;

            case 'DELETE': // Delete a task
                const deleteTask = JSON.parse(event.body);
                await dynamo.delete({
                    TableName: tableName,
                    Key: { taskId: deleteTask.taskId }
                });
                body = { message: "Task deleted successfully" };
                break;

            default:
                throw new Error(`Unsupported HTTP method: ${httpMethod}`);
        }
    } catch (err) {
        statusCode = 400;
        body = { error: err.message };
    }

    return {
        statusCode,
        body: JSON.stringify(body), // You need to stringify the body
        headers,
    };
};
