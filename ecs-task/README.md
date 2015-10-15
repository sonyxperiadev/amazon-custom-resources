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

The `Custom::EcsTask` can take the following parameters.

* *Image*- The image to use when starting the task
* *Name* - The name of the running task
* *envFiles* - An array of environment files.

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
      "Image": "andersjanmyr/counter",
      "Name": "unstable-andersjanmyr-counter",
      "ParamsEnvFile": "Dingo=elefant\nKatt=hund\n",
      "StackOutputsEnvFile": "Tapir=aardvark\nKatt=cat"
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


