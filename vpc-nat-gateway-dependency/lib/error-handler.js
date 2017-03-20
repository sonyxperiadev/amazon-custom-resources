'use strict';

const errorHandler = (fn, resolve, reject) => err => {
    // Poll for status change every 1 second.
    if (err.code === 'InvalidNatGatewayID.NotFound') {
        setTimeout(() => fn(resolve, reject), 1000);
    // Reject with error
    } else {
        reject(err);
    }
};

module.exports = errorHandler;