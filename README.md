# Creating a Lambda Function for Todo Tasks Application

## Overview
This guide will walk you through creating an AWS Lambda function for a Todo Tasks application, with a focus on setup and DynamoDB integration.

## Step 1: Creating a Lambda Function

1. **Open AWS Lambda Console**
   * Navigate to https://console.aws.amazon.com/lambda/
   * Click **Create function**

2. **Configure Function Basics**
   * Choose **Create function**
   * Select **Author from scratch**
   * Provide a **Function name** (e.g., `TodoTasksFunction`)
   * Select **Node.js** as the runtime
   * Click **Create function**

## Step 2: Setting Up HTTP Endpoints with API Gateway
1. Go to the **API Gateway** console
2. Click **Create API** and choose **HTTP API**
3. Define your HTTP API by providing the API name and selecting the region
4. Create routes for your Todo Tasks application:
   - `GET /tasks`
   - `POST /tasks`
   - `PUT /tasks/{taskId}`
   - `DELETE /tasks/{taskId}`
5. Link each route to your Lambda function
6. **Deployment Clarification**:
   * When you first create an API Gateway, a default stage named `$default` is automatically created and deployed
   * If you want a named stage (like `prod` or `dev`), you'll need to manually click **Deploy** and create a new stage
   * For most initial setups, the default stage is sufficient for testing

## Step 3: Configuring CORS (Cross-Origin Resource Sharing)
1. In the API Gateway Console, select your HTTP API
2. Go to the **CORS** section
3. Configure CORS settings:
   * **Access-Control-Allow-Origin**: 
     - For development: Use `*` to allow all origins
     - For production: Specify exact origin(s), e.g., `https://yourdomain.com`
   * **Access-Control-Allow-Headers**: 
     - Minimum recommended: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
   * **Access-Control-Allow-Methods**: 
     - Select the HTTP methods you've defined: 
       * `GET`
       * `POST`
       * `PUT`
       * `DELETE`
       * `OPTIONS`
4. Update the Lambda function to include CORS headers in the response:

```javascript
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Or your specific domain
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
};
```

## Step 4: Connecting to DynamoDB

### 4.1 Create DynamoDB Table
1. Navigate to the **DynamoDB** console
2. Click **Create table**
3. Set the following table details:
   - **Table name**: `ToDoTasks`
   - **Partition key**: `taskId` (String)
   - **Sort key**: (Optional) Leave blank if not needed
4. Click **Create** to create the table

### 4.2 Configure Lambda Environment Variables
1. Go to the **Lambda console**
2. In the **Configuration** tab, under **Environment variables**, add:
   - **Key**: `TABLE_NAME`
   - **Value**: `ToDoTasks`

## Step 5: Lambda Function Code

Use the provided Lambda function code to handle DynamoDB operations:

```javascript
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
```

## CORS Best Practices
* In development, `*` can be used for all origins
* In production, always specify exact allowed origins
* Be as restrictive as possible with allowed origins
* Include only necessary headers and methods
* Consider using environment variables for origin domains to make configuration easier

## Troubleshooting CORS
* If requests are blocked, check:
  - CORS settings in API Gateway
  - Lambda function response headers
  - Browser console for specific CORS error messages

## DynamoDB Table Structure
- `taskId` (String): Unique identifier for the task
- `task` (String): Description of the task
- `completed` (Boolean): Task completion status
- `createdAt` (String): Timestamp of task creation

## Tips for Success
* Verify the function's basic configuration after creation
* Test each API endpoint thoroughly
* Ensure your Lambda function has the necessary permissions to interact with DynamoDB
* Monitor CloudWatch logs for any potential issues
