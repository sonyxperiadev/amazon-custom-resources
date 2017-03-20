'use strict';

const R = require('ramda');

const describeFilter = require('./helpers').describeFilter;
const describeSubnets = require('./ec2').describeSubnets;

const extractEC2SubnetsIds = ec2Response => ec2Response.Subnets.map(R.prop('SubnetId'));
const sort = list => list.sort();

const propertiesOk = properties => {
    if (!properties.NATSubnets) {
        return {status: false, msg: 'NAT Subnets not specified'};
    } else if (!properties.IGWSubnet) {
        return {status: false, msg: 'InternetGateway Subnet not specified'};
    } else {
        return {status: true, msg: 'Ok'};
    }
};

const validateSubnets = suppliedSubnetIds => subnetsIntersection => {
    if(R.equals(subnetsIntersection, suppliedSubnetIds)) {
        return Promise.resolve(subnetsIntersection);
    } else {
        return Promise.reject('Subnets: ' + JSON.stringify(R.difference(suppliedSubnetIds, subnetsIntersection)) +
            ' needs to be created in your aws console');
    }
};

const findSubnets = state => {
    const validatedProperties = propertiesOk(state.properties);
    if(!validatedProperties.status) {
        return state.callback(validatedProperties.msg);
    }

    var suppliedSubnetIds = R.concat(
        state.properties.NATSubnets.map(R.prop('SubnetId')),
        [ state.properties.IGWSubnet.SubnetId ]
    );
    const filter = describeFilter('Filters','subnet-id', suppliedSubnetIds);
    return describeSubnets(filter)
        .then(extractEC2SubnetsIds)
        .then(sort)
        .then(R.intersection(suppliedSubnetIds.sort()))
        .then(validateSubnets(suppliedSubnetIds.sort()))
        .then(() => {
            return state;
        })
        .catch(err => {
            console.log(err);
            return state.callback;
        });
};

module.exports = findSubnets;