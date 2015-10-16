# ecsTask

A Lambda function which manages a task in an ECS cluster.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to deploy docker tasks to an ECS cluster.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::EcsTask`.

The `Custom::EcsTask` takes the same parameters [AWS::ECS::TaskDefinition](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ecs-taskdefinition.html)

But, it also takes an `envFiles` property in the `containerDefinitions`
section.

It also auto generates an available port for
`containerDefinitions[].portMappings.hostPort` if this property is set to 0.


### Example Output

```
{
  Family: 'unstable-andersjanmyr-counter',
  Revison: 16,
  TaskDefinitionArn: 'arn:aws:ecs:eu-west-1:445573518738:task-definition/ecscompose-lifelog-deploy:16',
  HostPort: '39055'
}
```


### Extended Example with Stack

```
"Resources": {
  "Task": {
    "Type": "Custom::EcsTask",
    "Properties": {
      "ServiceToken": { "Fn::Join": [ "", [
        "arn:aws:lambda:",
        { "Ref": "AWS::Region" },
        ":",
        { "Ref": "AWS::AccountId" },
        ":function:ecsTask"
      ] ] },
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
              "hostPort": 0 // auto generate an available port.
            }
          ]
        }
      ]
    }
  }
  "Outputs": {
    "TaskDefinitionArn": {
      "Value": {
        "Fn::GetAtt": [ "Task", "TaskDefinitionArn" ]
      }
    }
    "HostPort": {
      "Value": {
        "Fn::GetAtt": [ "Task", "HostPort" ]
      }
    }
  }
}
```


