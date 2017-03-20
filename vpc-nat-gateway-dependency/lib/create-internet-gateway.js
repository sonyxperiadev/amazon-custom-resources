'use strict';

const immutable = require('object-path-immutable');

const helpers = require('./helpers');
const describeFilter = helpers.describeFilter;
const updateState = helpers.updateState;
const describeInternetGateways = require('./ec2').describeInternetGateways;
const createInternetGateway = require('./ec2').createInternetGateway;

const createInternetGatewayIfMissing = vpcId => ec2Response => {
    if (ec2Response.InternetGateways.length < 1) {
        return createInternetGateway({})
            .then(createdIGWResponse => createdIGWResponse.InternetGateway);
    } else {
        return Promise.resolve(ec2Response.InternetGateways[0]);
    }
};

const findInternetGateway = state => {
    const filter = describeFilter('Filters', 'attachment.vpc-id', [state.properties.VpcId]);
    return describeInternetGateways(filter)
        .then(createInternetGatewayIfMissing(state.properties.vpcId))
        .then(updateState(state, 'properties.internetGateway'))
        .catch(state.callback);
};

module.exports = findInternetGateway;