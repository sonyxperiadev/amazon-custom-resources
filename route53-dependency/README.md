# route53Dependency

A Lambda function which implements a Custom Resource for Cloud Formation that
gets hosted zones by name from Route53.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to get hosted zones via a Cloud Formation Custom Resource.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::Route53Dependency`.

The `Custom::Route53Dependency` refers to a `DomainName` that is sent to the
Lambda function and is used to lookup a hosted zone. If
no zone or more than one is found `FAILED` is returned.

The outputs from the `Custom::Route53Dependency` can be referred with `Fn:GetAtt`.

Example: `"Fn::GetAtt": ["Route53", "Id"]`

### Extended Example

```
"Parameters": {
  "DomainName": {
    "Description": "Domain name for DNS",
    "Type": "String",
    "Default": "lifelog-dev.sonymobile.com"
  }
},
"Resources": {
  "Route53": {
    "Type": "Custom::Route53Dependency",
    "Properties": {
      "ServiceToken": { "Fn::Join": [ "", [
        "arn:aws:lambda:",
        { "Ref": "AWS::Region" },
        ":",
        { "Ref": "AWS::AccountId" },
        ":function:route53Dependency"
      ] ] },
      "DomainName": { "Ref": "DomainName" }
    }
  }
  "Outputs": {
    "Route53Id": {
      "Value": {
        "Fn::GetAtt": [ "Route53", "Id" ]
      },
      "Description": "Route53 Id"
    }
  }
}
```


