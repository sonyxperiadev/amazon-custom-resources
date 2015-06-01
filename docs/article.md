# Extending Cloudformation with Lambda-Backed Custom Resources

At Sony Mobile in Lund we are using CloudFormation extensively. Bringing up a
full stack with everything included takes quite a while. ElastiCache,
SecurityGroups, IAM resources, LoadBalancers, etc. take a long time to start.

To simplify configuration and to speed things up we make heavy use of
Lambda-backed Custom Resources. We use them for depending on other stacks,
getting info about VPC, Route53, certificates and Images. We also have a
resource for getting ElastiCache endpoints for our Redis services since
CloudFormation does not provide it.

The code in this article is based on the code from [Amazon Lambda-backed Custom Resources](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources-lambda.html)

## The Custom Resource Invocation

When CloudFormation invokes a Custom Resource it send a request that looks like
this:

```js
{
  "RequestType": "Create",
  "ServiceToken": "arn:aws:lambda:...:function:route53Dependency",
  "ResponseURL": "https://cloudformation-custom-resource...",
  "StackId": "arn:aws:cloudformation:eu-west-1:...",
  "RequestId": "afd8d7c5-9376-4013-8b3b-307517b8719e",
  "LogicalResourceId": "Route53",
  "ResourceType": "Custom::Route53Dependency",
  "ResourceProperties": {
    "ServiceToken": "arn:aws:lambda:...:function:route53Dependency",
    "DomainName": "example.com"
  }
}
```

The dots, (...), are random digits and account numbers and will be different
per request and account. The interesting parts of this request are:

* `RequestType` - can have the values `Create`, `Update` and `Delete`.
* `ResponseURL` - the URL to `PUT` the response to.
* `ResourceProperties` - the properties sent by the configuration in the
  CloudFormation resource declaration. You can ignore the `ServiceToken`, it is
  used internally by CloudFormation to find your function. `DomainName` is
  interesting since it contains the name of the domain we want to lookup.

## The Custom Resource Declaration

The Custom Resource Declaration corresponding to the above invocation looks
like this:

```js
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
}
```

The interesting parts here are:

* `Route53` - the name of the resource inside the template.
* `Type` - The `Custom::` part of the type identifies this as a Custom
  Resource, the rest, Route53Dependency, is documentation.
* `ServiceToken` - identifies the function with the current region, account and
  the name `route53Dependency`. This function name corresponds to the name of
  the function used when creating the function with `aws lambda
  create-function --function-name route53Dependency`
* `DomainName` - is a custom parameter which I will read from the event and use
  to lookup the domain in Route53.


## The Lambda Custom Resource Function

A Custom Resource Lambda can be split into three major parts.

* The handler handles the event and invokes the domain specific function.
* The domain specific function call the AWS function and get the requested
  information.
* The response` is sent back to CloudFormation by PUTing to the
  provided `ResponseURL`

The handler and response code is the same for all our Custom Resources.


### The handler

```js
// The handler
route53Dependency.handler = function(event, context) {
  console.log(JSON.stringify(event, null, '  '));

  if (event.RequestType == 'Delete') {
    return sendResponse(event, context, "SUCCESS");
  }

  route53Dependency(event.ResourceProperties, function(err, result) {
    var status = err ? 'FAILED' : 'SUCCESS';
    return sendResponse(event, context, status, result, err);
  });
};
```

The handler starts by logging the event, nice to have for debugging. It ignores
`Delete`-events since our resources are not creating anything, only looking
things up. It then invokes the domain function with `event.ResourceProperties`,
checks the result and uses `sendResponse` to send the reply.

Lambda functions have to be invoked as properties, in my case `handler`, and I
usually set the handler as a property on the domain function. This is just my
preference, it is not required.


### The Domain Function

```js
// The domain function
function route53Dependency(properties, callback) {
  if (!properties.DomainName)
    callback("Domain name not specified");

  var aws = require("aws-sdk");
  var route53 = new aws.Route53();

  console.log('route53Dependency', properties);
  route53.listHostedZones({}, function(err, data) {
    console.log('listHostedZones', err, data);
    if (err)
      return callback(err);

    var zones = data.HostedZones;
    var matching = zones.filter(function(zone) {
      return zone.Name == properties.DomainName + '.';
    });
    if (matching.length != 1)
      return callback('Exactly one matching zone is allowed ' + zones);
    var match = matching[0];
    delete match.Config;
    delete match.CallerReference;
    match.Id = match.Id.split('/')[2];
    match.Name = match.Name.substring(0, match.Name.length-1);
    return callback(null, match);
  });
}
```

The domain function starts out with checking for required properties and calls
the callback with an error in case they are not valid or available.

I require the SDK and invoke `listHostedZones`, check that exactly one domain
matches and return the object after cleaning it up. Custom Resources only
supports returning string values and if you try to return objects such as
`Config` above. In my case I don't care about this value and I just delete it.

### The Response

To send the response back to CloudFormation we PUT some JSON to the
`ResponseURL` provided in the request. The response looks like this:

```js
{
  "StackId": "arn:aws:cloudformation:eu-west-1:...",
  "RequestId": 'e4d1ab88-1b2c-402f-b083-1966f5806064',
  "LogicalResourceId": 'Route53',
  "PhysicalResourceId": '2015/05/28/00395b017f72444791fb12b988f4aeab',
  "Status": 'SUCCESS',
  "Reason": ' Details in CloudWatch Log: 2015/05/28/...',
  "Data":  {
    "Id": 'ZEHTTI1S7FAPK',
    "Name": 'backend.lifelog-dev.sonymobile.com',
    "ResourceRecordSetCount": "22"
  }
}
```

The relevant parts of the response are the last three:

* Status - signals `SUCCESS` of `FAILED`.
* Reason - information about the request, such as where to find the log or the
  error if one occurred.
* Data - is the data provided by our domain function.

We don't have to care about the rest of the parameters since we can just echo
back the parameters which were passed to us in the request.

```js
// sendResponse
function sendResponse(event, context, status, data, err) {
  var reason = err ? err.message : '';
  var responseBody = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logStreamName,
    Status: status,
    Reason: reason + " See details in CloudWatch Log: " + context.logStreamName,
    Data: data
  };

  console.log("RESPONSE:\n", responseBody);
  var json = JSON.stringify(responseBody);

  var https = require("https");
  var url = require("url");

  var parsedUrl = url.parse(event.ResponseURL);
  var options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": json.length
    }
  };

  var request = https.request(options, function(response) {
    console.log("STATUS: " + response.statusCode);
    console.log("HEADERS: " + JSON.stringify(response.headers));
    context.done(null, data);
  });

  request.on("error", function(error) {
    console.log("sendResponse Error:\n", error);
    context.done(error);
  });

  request.on("end", function() {
    console.log("end");
  });
  request.write(json);
  request.end();
}
```

We start out by creating the response object by using the values from the
request and our values for `status`, `data` and `err`.

We parse the `ResponseURL` and send the request with `https.request` back to
CloudFormation.


### Using the Properties in CloudFormation

To use the properties in a CloudFormation template, we use the built-in
`Fn::GetAtt` function.

```js
// Example Usage
"Outputs": {
  "Route53Id": {
    "Value": {
      "Fn::GetAtt": [ "Route53", "Id" ]
    },
    "Description": "Route53 Id"
  },
  "Route53Name": {
    "Value": {
      "Fn::GetAtt": [ "Route53", "Name" ]
    },
    "Description": "Route53 Name"
  },
  "Route53Count": {
    "Value": {
      "Fn::GetAtt": [ "Route53", "ResourceRecordSetCount" ]
    },
    "Description": "Route53 Count"
  }
}
```

## Available Custom Resources

We have implemented the following Custom Resources.

### Elasticache Dependency

When CloudFormation creates a Redis-backed Elasticache Cluster it does not
provide the endpoints to the stack. This forces us to write logic in the client
to look up the endpoints or to look them up manually and provide them as
configuration. `elasticacheDependency` gets information about elasticache
clusters including endpoints.

### Image Dependency

`imageDependency` looks up information about an AMI by name. It is much easier to
read an image name instead of an AMI ID.

### Route53 Dependency

`route53Dependency` looks up information about hosted zone by domain name.
Again, nicer to have that a cryptic zone id.

### VPC Dependency

`vpcDependency` looks up information about a VPC by name including ID and subnet
information.

### Certificate Dependency

`certificateDependency` looks up a certificate by name.

### Stack Dependency

`stackDependency` looks up the outputs from another stack by name. It provides
the outputs as variables to the resources and also includes an extra property
called `Environment`.

The `Environment` property contains all the outputs from the stack formatted as
a Unix `env-file`, `(Property1=Value\nProperty2=Value\n)`. This can be used to
provide the parameters to the instance by saving them to an environment file
and, if you use Docker, to provide them to the container with `docker run
--env-file`


## Usage

All our custom resources are Open Sourced and can be accessed at the [Sony
Experia Dev Github account](https://github.com/sonyxperiadev/amazon-custom-resources).

The following script are available for each resource:

* `create-role.sh` - creates the necessary roles for using the Lambda.
* `deploy-lambda.sh` - creates or updates the Lambda as needed.
* `invoke-lambda.sh` - invokes the lambda from the command line.
* `invoke-test-stack.sh` - creates or deletes a test-stack showing how to use
  the function with CloudFormation.


Enjoy!
