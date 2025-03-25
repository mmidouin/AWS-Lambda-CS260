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
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const tableName = process.env.DYNAMO_TABLE_NAME;

  try {
    // Creating taskId from the current timestamp
    const taskId = new Date().toISOString();

    const params = {
      TableName: tableName,
      Item: {
        taskId: taskId,  // Using timestamp as taskId
        task: 'Finish slides',
        completed: false,
        createdAt: taskId  // Same timestamp for createdAt
      }
    };

    await dynamoDB.put(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Task added successfully', taskId: taskId })
    };
  } catch (error) {
    console.error('Error processing task:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error processing task' })
    };
  }
};
```

### Table Structure for ToDoTasks
- `taskId` (String): Timestamp of task creation, used as a unique identifier
- `task` (String): Description of the task
- `completed` (Boolean): Task completion status
- `createdAt` (String): Timestamp of task creation (same as taskId)
