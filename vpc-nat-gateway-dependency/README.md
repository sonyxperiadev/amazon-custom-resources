# Vpc NAT Gateway Dependency
## INFO
This is currently a work in progress and is not completed yet.

A Lambda function which implements a Custom Resource for Cloud Formation that enables Internet access for a Lambda inside a VPC.
 It will create the following:
 * NAT Gateway
 * Internet Gateway
 * Route Tables for NAT Subnets and Internet Gateway Subnet
 * Routes connecting NAT Gateway and NAT Route Table
 * Routes connecting Internet Gateway and Internet Gateway Route Table
 * Associations between Routes and Route Tables

Updating or Deleting this Custom Resource will not trigger remoaval of the created Vpc Resources (mentioned above).

This means that you need to verify eventual Vpc Resources that was created by this Custom Resource and manually remove them if no longer needed.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to get VPCs via a Cloud Formation Custom Resource.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::VpcNatGatewayDependency`.

Example:
```

"VpcNATGatewayDependency": {
      "Type": "Custom::VpcNATGatewayDependency",
      "Properties": {
        "ServiceToken": {
          "Fn::Join": [
            "",
            [
              "arn:aws:lambda:",
              {
                "Ref": "AWS::Region"
              },
              ":",
              {
                "Ref": "AWS::AccountId"
              },
              ":function:vpcNATGatewayDependency"
            ]
          ]
        },
        "VpcId": {"Fn::GetAtt": ["Vpc", "VpcId"]},
        "NATSubnets": [
          {
            "SubnetId": {"Ref": "SubnetToNAT1aId"},
            "CidrBlock": {"Ref": "SubnetToNAT1aCidr"}
          },
          {
            "SubnetId": {"Ref": "SubnetToNAT1bId"},
            "CidrBlock": {"Ref": "SubnetToNAT1bCidr"}
          }
        ],
        "IGWSubnet": {
          "SubnetId": {"Ref": "IGWSubnetId"},
          "CidrBlock": {"Ref": "IGWSubnetCidr"}
        }
      }
    }

```

You can provide multiple NATSubnets but only one Internet Gateway Subnet and VpcId.
