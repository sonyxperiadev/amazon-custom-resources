# snsSubscription

A Lambda function which implements a Custom Resource for Cloud Formation that
creates a SNS subscription to an already existing SNS topic. This is useful if you create the 
[AWS::SNS::Topic](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sns-topic.html)
and subscriptions in different cloudformation stacks, ie using `stackDependency`.

For example if you want to achieve the following:
 
* One service _producer_ is reading from Kinesis and publishing some events to a SNS topic.
* Another service _consumer_ wants to consume these events.
* Each service is deployed using its own cloudformation stack.
* The _producer_ should not be aware of the consumers.

Solution:

* Create the `AWS::SNS::Topic` in the _producer_ stack 
* Use a `Custom::stackDependency` and `Custom::SnsSubscription` in the _consumer_ stack

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