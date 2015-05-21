# imageDependency

A Lambda function which implements a Custom Resource for Cloud Formation that
gets an Image (AMI) by name.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to get Images via a Cloud Formation Custom Resource.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::ImageDependency`.

The `Custom::ImageDependency` refers to a `ImageName` that is sent to the Lambda
function and is used to lookup the Image. If no Image or more than one is found
`FAILED` is returned.


The outputs from the `Custom::ImageDependency` can be referred with `Fn:GetAtt`.

Available values are: `ImageId`, `CreationDate`, ...

Example: `"Fn::GetAtt": ["Image", "ImageId"]`

### Extended Example

```
"Parameters": {
  "ImageName": {
    "Description": "Name of the Image",
    "Type": "String",
    "Default": "default"
  }
},
"Resources": {
  "Image": {
    "Type": "Custom::ImageDependency",
    "Properties": {
      "ServiceToken": { "Fn::Join": [ "", [
        "arn:aws:lambda:",
        { "Ref": "AWS::Region" },
        ":",
        { "Ref": "AWS::AccountId" },
        ":function:imageDependency"
      ] ] },
      "ImageName": { "Ref": "ImageName" }
    }
  }
  "Outputs": {
    "ImageId": {
      "Value": {
        "Fn::GetAtt": [ "Image", "ImageId" ]
      },
      "Description": "Image Id"
    }
  }
}
```


