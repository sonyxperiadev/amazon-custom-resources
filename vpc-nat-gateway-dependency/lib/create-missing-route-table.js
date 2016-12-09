'use strict';

const R = require('ramda');
const createRouteTable = require('./ec2').createRouteTable;

const createRouteTableIfMissing = vpcId => ec2Response => {
    if (ec2Response.RouteTables.length < 1) {
        return createRouteTable(vpcId).then(R.prop('RouteTable'));
    } else if (ec2Response.RouteTables.length === 1) {
        return Promise.resolve(ec2Response.RouteTables[0]);
    } else {
        return Promise.reject('too many route tables');
    }
};

module.exports = createRouteTableIfMissing;