#!/bin/bash

function_arn=$1
stack_name=$2
cat <<EOT
{
  "RequestType": "Create",
  "ServiceToken": "$function_arn",
  "ResponseURL": "https://cloudformation-custom-resource-response-euwest1.s3-eu-west-1.amazonaws.com/arn%3Aaws%3Acloudformation%3Aeu-west-1%3A143044406720%3Astack/Aardvark/35e0e270-e1dd-11e4-81cd-50014118ec7c%7CNetworkInfo%7C8696cac9-d8c4-4f3c-ab93-3c87a6b9bcfa?AWSAccessKeyId=AKIAJ7MCS7PVEUOADEEA&Expires=1428937304&Signature=dpqYnO0oGwp%2FdCl1Sh8VuHSD2Bo%3D",
  "StackId": "arn:aws:cloudformation:eu-west-1:143044406720:stack/Aardvark/35e0e270-e1dd-11e4-81cd-50014118ec7c",
  "RequestId": "8696cac9-d8c4-4f3c-ab93-3c87a6b9bcfa",
  "LogicalResourceId": "NetworkInfo",
  "ResourceType": "Custom::NetworkInfo",
  "ResourceProperties": {
    "ServiceToken": "$function_arn",
    "StackName": "$stack_name"
  }
}
EOT
