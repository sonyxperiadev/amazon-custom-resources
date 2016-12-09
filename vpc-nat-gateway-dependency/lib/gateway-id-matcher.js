'use strict';
const R = require('ramda');

const findMatchingRouteGatewayId = (routes, natGatewayId) => routes
    .filter(R.prop('NatGatewayId'))
    .map(R.prop('NatGatewayId'))
    .filter(gatewayId => (gatewayId === natGatewayId));

module.exports = findMatchingRouteGatewayId;