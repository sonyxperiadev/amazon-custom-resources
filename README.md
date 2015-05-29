# Amazon Custom Resources

Amazon Custom Resources contains a number of CloudFormation Custom Resources
backed by Lambda functions. They simplify the usage of CloudFormation by, among
other things, allowing us to use names instead of IDs in our templates. This
simplifies the re-use of templates across Amazon accounts.

## Available Resources

### Elasticache Dependency

When CloudFormation creates a Redis-backed Elasticache Cluster it does not
provide the endpoints to the stack. This forces us to write logic in the client
to look up the endpoints or to look them up manually and provide them as
configuration. [elasticache-dependency](elasticache-dependency/README.md) gets
information about elasticache clusters including endpoints.

### Image Dependency

[image-dependency](image-dependency/README.md) looks up information about an
AMI by name. It is much easier to read an image name instead of an AMI ID.

### Route53 Dependency

[route53-dependency](route53-dependency/README.md) looks up information about
hosted zone by domin name.  Again, nicer to have that a cryptic zone id.

### VPC Dependency

[vpc-dependency](vpc-dependency/README.md)looks up information about a
VPC by name including ID and subnet information.

### Certificate Dependency

[certificate-dependency](certificate-dependency/README.md) looks up a
certificate by name.

### Stack Dependency

[stack-dependency](stack-dependency/README.md) looks up the outputs from
another stack by name. It provides the outputs as variables to the resources
and also includes an extra property called `Environment`.

The `Environment` property contains all the ouputs from the stack formatted as
a Unix `env-file`, `(Property1=Value\nProperty2=Value\n)`. This can be used to
provide the parameters to the instance by saving them to an environment file
and, if you use Docker, to provide them to the container with `docker run
--env-file`


## Installation

```
git clone repo
./deploy-all.sh
```
