'use strict';
const immutable = require('object-path-immutable');

const createRoute = require('./ec2').createRoute;

const createMissingRoutes = (destinationCidrBlock, routeTableId, gatewayIdKey, gatewayIdVal) => {
    const newRoute = immutable({})
        .set('DestinationCidrBlock', destinationCidrBlock)
        .set('RouteTableId', routeTableId)
        .set(gatewayIdKey, gatewayIdVal).value();
    return new Promise((resolve, reject) => createRoute(newRoute)(resolve, reject, 0));
};

module.exports = createMissingRoutes;