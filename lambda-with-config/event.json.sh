#!/bin/bash

function_arn=$1
stack_name=$2
request_type=${request_type:-"Create"}
response_url=$(node bin/create-signed-url.js)
cat <<EOT
{
  "RequestType": "$request_type",
  "ServiceToken": "$function_arn",
  "ResponseURL": "$response_url",
  "StackId": "arn:aws:cloudformation:eu-west-1:143044406720:stack/Aardvark/35e0e270-e1dd-11e4-81cd-50014118ec7c",
  "RequestId": "8696cac9-d8c4-4f3c-ab93-3c87a6b9bcfa",
  "LogicalResourceId": "MyFunction",
  "PhysicalResourceId": "$physical_resource_id",
  "ResourceType": "Custom::LambdaWithConfig",
  "ResourceProperties": {
    "ServiceToken": "$function_arn",
    "Code" : {
      "S3Region": "eu-west-1",
      "S3Bucket": "ll-debug",
      "S3Key": "package.tgz#lambdaWithConfig.zip"
    },
    "Description" : "",
    "Handler" : "lambda.handler",
    "FunctionName": "debug-lambda",
    "MemorySize" : 128,
    "Role" : "arn:aws:iam::445573518738:role/lambda-with-config-support-Role-1VKH6ROZF21FT",
    "Runtime" : "nodejs",
    "Timeout" : 10,

    "Config": {
      "foo": "bar"
    }
  }
}
EOT
