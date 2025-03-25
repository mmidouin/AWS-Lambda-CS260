## Step 1: Creating a Lambda Function

To create an AWS Lambda function, follow these steps:

1. Go to the AWS Management Console.
2. Navigate to **Lambda** under Services.
3. Click **Create function**.
4. Choose **Author from scratch**.
5. Provide a function name (e.g., `MyLambdaFunction`).
6. Choose a runtime (e.g., Node.js, Python, etc.).
7. Click **Create function**.

Your Lambda function is now created! 

To upload the code from this repo **index.mjs**, click on the tab **Code** to use the **Inline Editor**.


## Step 2: Setting up HTTP Endpoints with HTTP Headers

You can configure AWS Lambda to handle HTTP requests through API Gateway.

1. Go to the **API Gateway** console.
2. Click **Create API** and choose **HTTP API**.
3. Define your HTTP API by providing the API name and selecting the region.
4. Under **Routes**, click **Create** and define a route, such as `GET /my-endpoint`.
5. Link the route to your Lambda function.
6. Configure your HTTP headers by adding them in the `Lambda` function code. 
7. Deploy your API, click on **Deploy** (**if you have a stage that is set up**)


## Step 3: Connecting to DynamoDB

To connect your Lambda function to DynamoDB, follow these steps:

### Step 3.1: Set Up DynamoDB Table

1. Navigate to the **DynamoDB** console.
2. Click **Create table** and provide the table name and primary key.
3. Click **Create** to create the table.

### Step 3.2: Set Up IAM Role for Lambda to Access DynamoDB

1. Create or use an existing **IAM Role** for your Lambda function.
2. Ensure the IAM role has the `AmazonDynamoDBFullAccess` policy attached or custom permissions that allow access to your DynamoDB table.
3. Attach the IAM role to your Lambda function.

### Step 3.3: Store DynamoDB Table Information in Lambda

Store your DynamoDB table name and other credentials (if needed) in **Lambda Environment Variables** for easy access during execution:

1. Go to the **Lambda console**.
2. In the **Configuration** tab, under **Environment variables**, add key-value pairs for your DynamoDB table name and other necessary configurations.

Example:

- `DYNAMO_TABLE_NAME`: `your-table-name`
  
Alternatively, use **AWS Secrets Manager** to store any sensitive information.

### Step 3.4: Setting Up DynamoDB Access in Lambda

1. In the Lambda function, use the **AWS SDK** to interact with DynamoDB.

   - **For Node.js**: Make sure the AWS SDK is available (it’s included by default in the Lambda runtime).

   Example Lambda code snippet to insert an item into DynamoDB:

   ```javascript
   const AWS = require('aws-sdk');
   const dynamoDB = new AWS.DynamoDB.DocumentClient();

   exports.handler = async (event) => {
     const params = {
       TableName: process.env.DYNAMO_TABLE_NAME,  // Get table name from env variable
       Item: {
         id: '123',
         name: 'John Doe',
         age: 30
       }
     };

     try {
       await dynamoDB.put(params).promise();
       return {
         statusCode: 200,
         body: JSON.stringify({ message: 'Data inserted successfully' })
       };
     } catch (error) {
       console.error('Error inserting data:', error);
       return {
         statusCode: 500,
         body: JSON.stringify({ message: 'Error inserting data' })
       };
     }
   };
