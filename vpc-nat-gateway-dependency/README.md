# Vpc NAT Gateway Dependency
## INFO

A Lambda function which implements a Custom Resource for Cloud Formation that enables Internet access for a Lambda inside a VPC.
 It will create the following:
 * NAT Gateway
 * Internet Gateway
 * Route Tables for NAT Subnets and Internet Gateway Subnet
 * Routes connecting NAT Gateway and NAT Route Table
 * Routes connecting Internet Gateway and Internet Gateway Route Table
 * Associations between Routes and Route Tables

Updating or Deleting this Custom Resource will not trigger removal of the created Vpc Resources (mentioned above).

This means that you need to verify eventual Vpc Resources that was created by this Custom Resource and manually remove them if no longer needed.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to get VPCs via a Cloud Formation Custom Resource.

## Cloud Formation Usage

### Requirements

 * `VpcId`: Id of the Vpc in which the Lambda that needs internet access exists. The VpcId must be supplied to the 
 CloudFormation template.
 * `NATSubnets`: The NAT Subnets to be used by this resource needs to be manually created and supplied to the 
 CloudFormation template.
 * `IGWSubnet`: The Internet Gateway Subnet that will be used by the NATGateway that this resource will create.

You can provide multiple NATSubnets but only one Internet Gateway Subnet and VpcId.


### Usage example
*Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::VpcNatGatewayDependency`.*

In this example we have already supplied `SubnetToNAT1aId`, `SubnetToNAT1aCidr`, `SubnetToNAT1bId`, 
`SubnetToNAT1bCidr`, `IGWSubnetId`, `IGWSubnetCidr` and `Vpc` in our template and are just referring to them .



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