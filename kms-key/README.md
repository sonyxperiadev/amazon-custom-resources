# kmsKey

A Lambda function which implements a Custom Resource for Cloud Formation that
creates/disables a KMS key

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. 

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::KmsKey`.

The `Custom::KmsKey` refers to a `Description` that the description of the KMS key.

The outputs from the `Custom::StackDependency` can be referred with `Fn:GetAtt`.

Example: `"Fn::GetAtt": ["MyMasterKey", "KeyId"]`
