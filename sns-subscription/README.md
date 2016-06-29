# snsSubscription

A Lambda function which implements a Custom Resource for Cloud Formation that
creates an SNS subscription.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. 

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::SnsSubscription`. It takes the same parameters as the 
[SNS.subscribe function](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html#subscribe-property):

* TopicArn
* Protocol
* Endpoint

The only output is the `SubscriptionArn` which can be referred with `Fn:GetAtt`, 
like this `"Fn::GetAtt": ["MySubscription", "SubscriptionArn"]`.

See `test-stack.template` for example usage.