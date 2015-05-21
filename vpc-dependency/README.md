# vpcDependency

A Lambda function which implements a Custom Resource for Cloud Formation that
gets VPCs and subnets by name.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to get VPCs via a Cloud Formation Custom Resource.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::VpcDependency`.

The `Custom::VpcDependency` refers to a `VpcName` that is sent to the
Lambda function and is used to lookup a VPC. If
no VPC or more than one is found `FAILED` is returned.

The outputs from the `Custom::VpcDependency` can be referred with `Fn:GetAtt`.

Available values are: `VpcId`, `CidrBlock`, `SubnetIds`, `SubnetId0`, `SubnetId1`,...

Example: `"Fn::GetAtt": ["Vpc", "VpcId"]`

### Extended Example

```
"Parameters": {
  "VpcName": {
    "Description": "Name of VPC",
    "Type": "String",
    "Default": "default"
  }
},
"Resources": {
  "Vpc": {
    "Type": "Custom::VpcDependency",
    "Properties": {
      "ServiceToken": { "Fn::Join": [ "", [
        "arn:aws:lambda:",
        { "Ref": "AWS::Region" },
        ":",
        { "Ref": "AWS::AccountId" },
        ":function:vpcDependency"
      ] ] },
      "DomainName": { "Ref": "VpcName" }
    }
  }
  "Outputs": {
    "VpcId": {
      "Value": {
        "Fn::GetAtt": [ "Vpc", "VpcId" ]
      },
      "Description": "Vpc Id"
    },
    "SubnetIds": {
      "Value": {
        "Fn::GetAtt": [ "Vpc", "SubnetIds" ]
      },
      "Description": "Comma-separated subnet ids"
    }

  }
}
```


