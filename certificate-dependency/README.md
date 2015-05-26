# certificateDependency

A Lambda function which implements a Custom Resource for Cloud Formation that
gets an Certificate by name.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to get certificates via a Cloud Formation Custom Resource.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::CertificateDependency`.

The `Custom::CertificateDependency` refers to a `CertificateName` that is sent to the Lambda
function and is used to lookup the Certificate. If no Certificate or more than one is found
`FAILED` is returned.


The outputs from the `Custom::CertificateDependency` can be referred with `Fn:GetAtt`.

Available values are: `ServerCertificateId`, `Arn`, ...

Example: `"Fn::GetAtt": ["Certificate", "Arn"]`

### Example Output

```
{
  Path: '/',
  ServerCertificateName: 'star_lifelog-dev_sonymobile_com_201505',
  ServerCertificateId: 'ASCAIUV2FVDY52FWRIGM6',
  Arn: 'arn:aws:iam::445573518738:server-certificate/star_lifelog-dev_sonymobile_com_201505',
  UploadDate: Wed May 20 2015 12:02:14 GMT+0000 (UTC),
  Expiration: Thu May 12 2016 12:00:00 GMT+0000 (UTC)
}

```

### Extended Example with Stack

```
"Parameters": {
  "CertificateName": {
    "Description": "Name of the Certificate",
    "Type": "String",
    "Default": "default"
  }
},
"Resources": {
  "Certificate": {
    "Type": "Custom::CertificateDependency",
    "Properties": {
      "ServiceToken": { "Fn::Join": [ "", [
        "arn:aws:lambda:",
        { "Ref": "AWS::Region" },
        ":",
        { "Ref": "AWS::AccountId" },
        ":function:certificateDependency"
      ] ] },
      "CertificateName": { "Ref": "CertificateName" }
    }
  }
  "Outputs": {
    "CertificateId": {
      "Value": {
        "Fn::GetAtt": [ "Certificate", "ServerCertificateId" ]
      },
      "Description": "Certificate Id"
    },
    "CertificateArn": {
      "Value": {
        "Fn::GetAtt": [ "Certificate", "Arn" ]
      },
      "Description": "Certificate Arn"
    }
  }
}
```


