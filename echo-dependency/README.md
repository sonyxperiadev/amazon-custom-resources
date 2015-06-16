# echoDependency

A Lambda function which implements a Custom Resource for Cloud Formation that
echoes back the parameters it is given

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to do nothing :)  via a Cloud Formation Custom Resource.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::EchoDependency`.

The `Custom::EchoDependency` takes any parameters and returns them as outputs.

### Example Output

```
{
  "ModifiedDate": "2015-05-20-1433"
}
```

### Extended Example with Stack

```
"Parameters": {
  "ModifiedDate": {
    "Description": "Date used to force stack update",
    "Type": "String",
    "Default": "never"
  }
},
"Resources": {
  "Echo": {
    "Type": "Custom::EchoDependency",
    "Properties": {
      "ServiceToken": { "Fn::Join": [ "", [
        "arn:aws:lambda:",
        { "Ref": "AWS::Region" },
        ":",
        { "Ref": "AWS::AccountId" },
        ":function:echoDependency"
      ] ] },
      "ModifiedDate": { "Ref": "ModifiedDate" }
    }
  },
  "Outputs": {
    "EchoModifiedDate": {
      "Value": {
        "Fn::GetAtt": [ "Echo", "ModifiedDate" ]
      },
      "Description": "Echo ModifiedDate"
    }
  }
}
```


