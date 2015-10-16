#!/bin/bash

function_arn=$1
image=$2
cat <<EOT
{
  "RequestType": "Create",
  "ServiceToken": "$function_arn",
  "ResponseURL": "https://cloudformation-custom-resource-response-euwest1.s3-eu-west-1.amazonaws.com/arn%3Aaws%3Acloudformation%3Aeu-west-1%3A143044406720%3Astack/Aardvark/35e0e270-e1dd-11e4-81cd-50014118ec7c%7CNetworkInfo%7C8696cac9-d8c4-4f3c-ab93-3c87a6b9bcfa?AWSAccessKeyId=AKIAJ7MCS7PVEUOADEEA&Expires=1428937304&Signature=dpqYnO0oGwp%2FdCl1Sh8VuHSD2Bo%3D",
  "StackId": "arn:aws:cloudformation:eu-west-1:143044406720:stack/direct-call/22b48750-f4b2-11e4-b550-5067141f4d5d",
  "RequestId": "afd8d7c5-9376-4013-8b3b-307517b8719e",
  "LogicalResourceId": "EcsTask",
  "ResourceType": "Custom::EcsTask",
  "ResourceProperties": {
    "ServiceToken": "$function_arn",
    "containerDefinitions": [
      {
        "envFiles": [
          "Dingo=elefant\nKatt=hund\n",
          "Tapir=aardvark\nKatt=cat"
        ],
        "environment": [
          {
            "name": "STATSD_HOST",
            "value": "dockerhost"
          }
        ],
        "essential": true,
        "extraHosts": [{
          "hostname": "dockerhost",
          "ipAddress": "172.14.42.1"
        }],
        "image": "andersjanmyr/counter",
        "logConfiguration": {
          "logDriver": "json-file",
          "options": {
            "max-size": "128m",
            "max-file": "8"
          }
        },
        "memory": 512,
        "name": "unstable-andersjanmyr-counter",
        "portMappings": [
          {
            "containerPort": 80,
            "hostPort": 0
          }
        ]
      }
    ]
  }
}
EOT
