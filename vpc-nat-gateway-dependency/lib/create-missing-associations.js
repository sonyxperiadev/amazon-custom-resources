'use strict';
const R = require('ramda');
const createAssociations = require('./ec2').createAssociations;

const createMissingAssociations = (suppliedSubnetIds, suppliedRouteTable) => state => {
    const routeTableAssociations = state.properties[suppliedRouteTable].Associations;
    const routeTableAssociationsIds = routeTableAssociations.map(R.prop('SubnetId'));
    const subnetIdIntersection = R.intersection(routeTableAssociationsIds, suppliedSubnetIds);

    if (R.equals(subnetIdIntersection.sort(), suppliedSubnetIds.sort())) {
        return Promise.resolve(state);
    } else {
        const associationsToBeCreated = R.difference(suppliedSubnetIds.sort(), subnetIdIntersection.sort());
        return Promise.all(createAssociations(state.properties[suppliedRouteTable].RouteTableId)(associationsToBeCreated))
            .then(() => {
                return state;
            });
    }
};

module.exports = createMissingAssociations;