'use strict';

const immutable = require('object-path-immutable');

const updateState = require('./helpers').updateState;
const createNATGateway = require('./ec2').createNATGateway;
const createEIP = require('./ec2').createEIP;
const describeNatGateways = require('./ec2').describeNatGateways;

const createNATGatewayIfMissing = igwSubnetId => ec2Response => {
    if (ec2Response.NatGateways.length < 1) {
        return createEIP()
            .then(createNATGateway(igwSubnetId))
            .then(createdNATGatewayResponse => createdNATGatewayResponse.NatGateway);
    } else {
        return Promise.resolve(ec2Response.NatGateways[0]);
    }
};

const findNATGateway = state => {
    return describeNatGateways({
        Filter: [
            {
                Name: 'subnet-id',
                Values: [ state.properties.IGWSubnet.SubnetId ]
            },
            {
                Name: 'state',
                Values: ['available', 'pending']
            }
        ]
    })
        .then(createNATGatewayIfMissing(state.properties.IGWSubnet.SubnetId))
        .then(updateState(state, 'properties.natGateway'))
        .catch(state.callback)
};

module.exports = findNATGateway;