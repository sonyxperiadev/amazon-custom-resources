# kmsDependency

A Lambda function which implements a Custom Resource for Cloud Formation that
can decrypt a single value

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to do nothing :)  via a Cloud Formation Custom Resource.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::KmsDependency`.

The `Custom::KmsDependency` takes any parameters and returns them as outputs.

### Example Output

```
{
  "DecryptedValue": "secretValue"
}
```

### Extended Example with Stack

```
"Parameters": {
  "EncryptedValue": {
    "Description": "Some encrypted value, must start with kms: or kmsb:",
    "Type": "String",
    "Default": "kms:<some_encrypted_string>"
  }
},
"Resources": {
  "KMS": {
    "Type": "Custom::KmsDependency",
    "Properties": {
      "ServiceToken": { "Fn::Join": [ "", [
        "arn:aws:lambda:",
        { "Ref": "AWS::Region" },
        ":",
        { "Ref": "AWS::AccountId" },
        ":function:kmsDependency"
      ] ] },
      "EncryptedValue": { "Ref": "EncryptedValue" }
    }
  },
  "Outputs": {
    "EncryptedValue": {
      "Value": {
        "Ref": "EncryptedValue"
      },
      "Description": "Only the encrypted value should be output"
    }
  }
}
```
