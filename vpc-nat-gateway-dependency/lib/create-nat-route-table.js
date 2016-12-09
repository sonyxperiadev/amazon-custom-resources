'use strict';

const R = require('ramda');
const immutable = require('object-path-immutable');

const helpers = require('./helpers');
const describeFilter = helpers.describeFilter;
const updateState = helpers.updateState;
const createMissingAssociations = require('./create-missing-associations');
const createMissingRoutes = require('./create-missing-routes');
const createMissingRouteTable = require('./create-missing-route-table');
const findMatchingRouteGatewayId = require('./gateway-id-matcher');
const describeRouteTables = require('./ec2').describeRouteTables;

const setMissingNatRoutes = state => {
    const checkMatchingRouteGatewayId = findMatchingRouteGatewayId(state.properties.natRouteTable.Routes, state.properties.natGateway.NatGatewayId);
    if(checkMatchingRouteGatewayId && checkMatchingRouteGatewayId.length > 0) {
        return Promise.resolve(state);
    } else {
        return createMissingRoutes('0.0.0.0/0', state.properties.natRouteTable.RouteTableId, 'NatGatewayId', state.properties.natGateway.NatGatewayId)
            .then(() => {
                return state;
            });
    }
};

const findNATRouteTable = state => {
    const filter = describeFilter('Filters', 'association.subnet-id', state.properties.NATSubnets.map(R.prop('SubnetId')));
    return describeRouteTables(filter)
        .then(createMissingRouteTable(state.properties.VpcId))
        .then(updateState(state, 'properties.natRouteTable'))
        .then(setMissingNatRoutes)
        .then(createMissingAssociations(state.properties.NATSubnets.map(R.prop('SubnetId')), 'natRouteTable'))
        .then(() => {
            return state;
        })
        .catch(state.callback);
};

module.exports = findNATRouteTable;