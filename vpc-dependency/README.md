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

The `Custom::VpcDependency` refers to a `VpcName` that is sent to the Lambda
function and is used to lookup a VPC. If no VPC or more than one is found
`FAILED` is returned.

It is also possible to send a filter parameter `OnlyDefaultSubnets` to limit
the returned subnets to the ones which are default in their availability zones.
This can be used to only get one subnet per zone.

The outputs from the `Custom::VpcDependency` can be referred with `Fn:GetAtt`.

Available values are: `VpcId`, `CidrBlock`, `SubnetIds`, `SubnetId0`, `SubnetId1`,...

Example: `"Fn::GetAtt": ["Vpc", "VpcId"]`


### Example Output

```
{
  VpcId: 'vpc-061bfc6c',
  State: 'available',
  CidrBlock: '172.31.0.0/16',
  DhcpOptionsId: 'dopt-1d1bfc77',
  InstanceTenancy: 'default',
  IsDefault: true,
  SubnetId0: 'subnet-07110265',
  SubnetId1: 'subnet-041bfc6e',
  SubnetId2: 'subnet-a68eb3d2',
  SubnetIds: 'subnet-07110265,subnet-041bfc6e,subnet-a68eb3d2'
}
```


### Extended Example with Stack

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
      "VpcName": { "Ref": "VpcName" },
      "OnlyDefaultSubnets": "true"
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


