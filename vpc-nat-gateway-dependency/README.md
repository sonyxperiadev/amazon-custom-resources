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

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to get VPCs via a Cloud Formation Custom Resource.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::VpcNatGatewayDependency`.