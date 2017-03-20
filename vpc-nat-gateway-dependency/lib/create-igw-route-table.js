'use strict';

const immutable = require('object-path-immutable');

const helpers = require('./helpers');
const describeFilter = helpers.describeFilter;
const updateState = helpers.updateState;
const createMissingAssociations = require('./create-missing-associations');
const createMissingRoutes = require('./create-missing-routes');
const createRouteTableIfMissing = require('./create-missing-route-table');
const findMatchingRouteGatewayId = require('./gateway-id-matcher');
const describeRouteTables = require('./ec2').describeRouteTables;

const setMissingIGWRoutes = state => {
    const checkMatchingRouteGatewayId = findMatchingRouteGatewayId(state.properties.igwRouteTable.Routes, state.properties.internetGateway.InternetGatewayId);
    if(checkMatchingRouteGatewayId && checkMatchingRouteGatewayId.length > 0) {
        return Promise.resolve(state);
    } else {
        return createMissingRoutes('0.0.0.0/0', state.properties.igwRouteTable.RouteTableId, 'GatewayId', state.properties.internetGateway.InternetGatewayId)
            .then(() => {
                return state;
            });
    }
};

const findIGWRouteTable = state => {
    const filter = describeFilter('Filters', 'association.subnet-id', [state.properties.IGWSubnet.SubnetId]);
    return describeRouteTables(filter)
        .then(createRouteTableIfMissing(state.properties.VpcId))
        .then(updateState(state, 'properties.igwRouteTable'))
        .then(setMissingIGWRoutes)
        .then(createMissingAssociations([state.properties.IGWSubnet.SubnetId], 'igwRouteTable'))
        .catch(state.callback)
};

module.exports = findIGWRouteTable;