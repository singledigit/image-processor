# image-processor
This application will detect faces in photographs and store that information in a DynamoDB table.

## Configuration for Use
This app does not require any configuration. Simply install using the (Serverless Application Repository)[https://aws.amazon.com/serverless/serverlessrepo/]

## Project Structure
```bash
.
├── README.md                   <-- This instructions file
├── package.json                <-- NodeJS Dependencies
├── process-service             <-- Source code for a lambda function
│   ├── app.js                  <-- Lambda function code
│   └── tests                   <-- Unit tests
│       └── unit
│           └── test_handler.js
└── template.yaml               <-- SAM template
```