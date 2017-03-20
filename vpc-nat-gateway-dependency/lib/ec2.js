'use strict';

const aws = require("aws-sdk");
const ec2 = new aws.EC2({region: "eu-west-1"});

const errorHandler = require('./error-handler');

const describeRouteTables = filter => ec2.describeRouteTables(filter).promise();
const describeNatGateways = filter => ec2.describeNatGateways(filter).promise();
const describeInternetGateways = filter => ec2.describeInternetGateways(filter).promise();
const createInternetGateway = params => ec2.createInternetGateway(params).promise();
const describeSubnets = filter => ec2.describeSubnets(filter).promise();
const createEIP = () => ec2.allocateAddress({Domain: 'vpc'}).promise();
const createRouteTable = vpcId => ec2.createRouteTable({VpcId: vpcId}).promise();

const createNATGateway = igwSubnetId =>
    eip => ec2.createNatGateway( { AllocationId: eip.AllocationId, SubnetId: igwSubnetId } ).promise();

const createAssociations = routeTableId =>
    subnetIds =>
        subnetIds.map(subnetId => ec2.associateRouteTable({RouteTableId: routeTableId, SubnetId: subnetId}).promise());

const createRoute = newRoute => (resolve, reject) => ec2.createRoute(newRoute).promise()
    .then(resolve)
    .catch(errorHandler(createRoute(newRoute), resolve, reject));

exports.createAssociations = createAssociations;
exports.createRoute = createRoute;
exports.createRouteTable = createRouteTable;
exports.createNATGateway = createNATGateway;
exports.createEIP = createEIP;
exports.describeRouteTables = describeRouteTables;
exports.describeNatGateways = describeNatGateways;
exports.describeInternetGateways = describeInternetGateways;
exports.createInternetGateway = createInternetGateway;
exports.describeSubnets = describeSubnets;