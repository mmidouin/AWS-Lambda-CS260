## Step 1: Creating a Lambda Function
To create an AWS Lambda function, follow these steps:
1. Go to the AWS Management Console.
2. Navigate to **Lambda** under Services.
3. Click **Create function**.
4. Choose **Author from scratch**.
5. Provide a function name (e.g., `TodoTasksLambda`).
6. Choose **Node.js** as the runtime.
7. Click **Create function**.

Your Lambda function is now created! To upload the code, click on the **Code** tab to use the **Inline Editor**.

## Step 2: Setting up HTTP Endpoints with HTTP Headers
Configure AWS Lambda to handle HTTP requests through API Gateway:
1. Go to the **API Gateway** console.
2. Click **Create API** and choose **HTTP API**.
3. Define your HTTP API by providing the API name and selecting the region.
4. Under **Routes**, click **Create** and define routes like:
   - `GET /tasks`
   - `POST /tasks`
   - `PUT /tasks/{taskId}`
   - `DELETE /tasks/{taskId}`
5. Link each route to your Lambda function.
6. Configure HTTP headers in the Lambda function code.
7. Deploy your API by clicking **Deploy**.

## Step 3: Connecting to DynamoDB
### Step 3.1: Set Up DynamoDB Table
1. Navigate to the **DynamoDB** console.
2. Click **Create table**.
3. Set the following table details:
   - **Table name**: `ToDoTasks`
   - **Partition key**: `taskId` (String)
   - **Sort key**: (Optional) Leave blank if not needed
4. Click **Create** to create the table.

### Step 3.2: Set Up IAM Role for Lambda to Access DynamoDB
1. Create or use an existing **IAM Role** for your Lambda function.
2. Attach the `AmazonDynamoDBFullAccess` policy or create a custom policy with specific DynamoDB permissions.
3. Attach the IAM role to your Lambda function.

### Step 3.3: Store DynamoDB Table Information in Lambda
Store your DynamoDB table name in **Lambda Environment Variables**:
1. Go to the **Lambda console**.
2. In the **Configuration** tab, under **Environment variables**, add:
   - **Key**: `DYNAMO_TABLE_NAME`
   - **Value**: `ToDoTasks`

## Step 3.4: Setting Up DynamoDB Access in Lambda
Use the AWS SDK to interact with DynamoDB. Here's an example Lambda function:

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

### Table Structure for ToDoTasks
- `taskId` (String): Timestamp of task creation, used as a unique identifier
- `task` (String): Description of the task
- `completed` (Boolean): Task completion status
- `createdAt` (String): Timestamp of task creation (same as taskId)
