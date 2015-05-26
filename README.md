# Amazon Custom Resources

Amazon Custom Resources contains a number of CloudFormation Custom Resources
backed by Lambda functions. They simplify the usage of CloudFormation by, among
other things, allowing us to use names instead of IDs in our templates. This
simplifies the re-use of templates across Amazon accounts.

## Available Resources

* [elasticache-dependency](elasticache-dependency/README.md) gets information
  about elasticache clusters, including Endpoints.
* [image-dependency](image-dependency/README.md) gets information about an
  AMI by name.
* [route53-dependency](route53-dependency/README.md) gets information about a
  Hosted Zone by name.
* [stack-dependency](stack-dependency/README.md) gets the outputs from another
  stack by name.
* [vpc-dependency](vpc-dependency/README.md) gets information about a VPC by
  name.
* [certificate-dependency](certificate-dependency/README.md) gets information
  about a certificate by name.



