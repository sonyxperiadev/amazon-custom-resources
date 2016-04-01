# lambdaWithConfig

A Lambda function which implements a Custom Resource for CloudFormation that
deploys lambdas together with config files and also has support for running in a VPC.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`.

## Usage

The interface for `lambdaWithConfig` is the same as [AWS::Lambda::Function](
http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html)
with a few exceptions:

* `Config` specifies a config object to inject into the Code ZIP file. This
  can be compromised of literal values and CloudFormation Refs as you would
  expect. The config object will be added as `config.json` in the root of the
  ZIP file.
* `Code.S3Region` is available to support fetching Code ZIP files from buckets
  in other regions.
  
* `VpcConfig` is used to configure your lambda to run in a VPC by specifing an array of 
  `SecurityGroupIds` and `SubnetIds`. The example below uses stack and vpc dependency to
  find the correct values.

### Example

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Parameters": {
    "EnvironmentName": {
        "Type": "String",
        "Default": "development",
        "AllowedValues": [
            "development",
            "production"
        ]
    },
    "ServiceVersion": {
      "Description": "Version of the service",
      "Type": "String"
    }
  },
  "Resources": {
    "MyLambda": {
      "Type": "Custom::LambdaWithConfig",
      "Properties": {
        "ServiceToken": { "Fn::Join": [ "", [
          "arn:aws:lambda:",
          { "Ref": "AWS::Region" },
          ":",
          { "Ref": "AWS::AccountId" },
          ":function:lambdaWithConfig"
        ] ] },
        "Code": {
          "S3Bucket": "my-build-packages",
          "S3Key":
          { "Fn::Join": [ "", [
            "myservice-",
            { "Ref": "ServiceVersion" },
            ".tgz#lambdas/createCard.zip"
          ]]}
        },
        "Handler": "lambda.handler",
        "FunctionName": { "Fn::Join": [ "", [
          { "Ref": "EnvironmentName" },
          "-myservice-mylambda"
        ]]},
        "MemorySize": 128,
        "Role" : {
          "Fn::GetAtt" : ["LambdaExecutionRole", "Arn"]
        },
        "Runtime" : "nodejs",
        "Timeout" : 30,
        "Config": {
          "EnvironmentName": { "Ref": "EnvironmentName" }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Fn::GetAtt": [
                "InfrastructureSupportStack", "InternalHTTPClientSecurityGroupId"]
            }
          ],
          "SubnetIds": {
            "Fn::GetAtt": [
              "Vpc", "Subnets"]
          }
        }
      }
    },
    "LambdaExecutionRole": {
        "Type": "AWS::IAM::Role",
        "Properties": {
            "AssumeRolePolicyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
        }
    },
    "LambdaExecutionPolicy": {
        "Type": "AWS::IAM::Policy",
        "Properties": {
            "PolicyName": "LambdaExecutionPolicy",
            "PolicyDocument": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                            "Action": [],
                        "Resource": "*"
                    }
                ]
            },
            "Roles": [
                {
                    "Ref": "LambdaExecutionRole"
                }
            ]
        }
    }
  },
  "Outputs": {
    "MyLambda": {
      "Fn::GetAtt": ["MyLambda", "FunctionName"]
    }
  }
}
```
