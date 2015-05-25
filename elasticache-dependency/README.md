# elasticacheDependency

A Custom Resource for Cloud Formation that gets information about elasticache
clusters, including Endpoints.

## Installation

Create a Role with `./create-role.sh`. This creates a new stack with the
appropriate permissions for the function.

Deploy the lambda function with `./deploy-lambda.sh`. Now the function can be
used to get information via a Cloud Formation Custom Resource.

## Cloud Formation Usage

Use the function inside your Cloud Formation template by declaring a custom
resource, `Custom::ElasticacheDependency`.

The `Custom::ImageDependency` refers to a `CacheId` that is sent to the Lambda
function and is used to lookup the elasticache cluster. If no cluster or more
than one is found `FAILED` is returned.


The outputs from the `Custom::ElasticacheDependency` can be referred with `Fn:GetAtt`.

Example: `"Fn::GetAtt": ["Elasticache", "CacheNodeEndpoint0"]`

### Example Output

```
{
  "CacheClusterId": "bod-re-19wlnyebhn54b",
  "ClientDownloadLandingPage": "https://console.aws.amazon.com/elasticache/home#client-download:",
  "CacheNodeType": "cache.t2.micro",
  "Engine": "redis",
  "EngineVersion": "2.8.19",
  "CacheClusterStatus": "available",
  "NumCacheNodes": 1,
  "PreferredAvailabilityZone": "eu-west-1a",
  "CacheClusterCreateTime": "2015-05-11T14:58:37.203Z",
  "PreferredMaintenanceWindow": "mon:00:30-mon:01:30",
  "CacheSubnetGroupName": "body-redis-het6nx6biet1",
  "AutoMinorVersionUpgrade": true,
  "CacheNodeEndpoint0": "bod-re-19wlnyebhn54b.9eo6z1.0001.euw1.cache.amazonaws.com:6379",
  "CacheNodeEndpointAddress0": "bod-re-19wlnyebhn54b.9eo6z1.0001.euw1.cache.amazonaws.com",
  "CacheNodeEndpointPort0": "6379",
  "CacheNodeEndpoints": "bod-re-19wlnyebhn54b.9eo6z1.0001.euw1.cache.amazonaws.com:6379"
}
```


### Extended Example with Stack

```
"Parameters": {
  "CacheId": {
    "Description": "Id of the cache cluster",
    "Type": "String",
    "Default": "default"
  }
},
"Resources": {
  "Cache": {
    "Type": "Custom::ElasticacheDependency",
    "Properties": {
      "ServiceToken": { "Fn::Join": [ "", [
        "arn:aws:lambda:",
        { "Ref": "AWS::Region" },
        ":",
        { "Ref": "AWS::AccountId" },
        ":function:elasticacheDependency"
      ] ] },
      "CacheId": { "Ref": "CacheId" }
    }
  }
  "Outputs": {
    "ImageId": {
      "Value": {
        "Fn::GetAtt": [ "Cache", "EndpointUrl" ]
      },
      "Description": "Endpoint URL"
    }
  }
}
```


