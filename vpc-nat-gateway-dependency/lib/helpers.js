'use strict';

const immutable = require('object-path-immutable');

const describeFilter = (key, Name, Values) => immutable({}).set(key, [{Name, Values}]).value();
const updateState = (state, propertyPath) => value =>  immutable.set(state, propertyPath, value);

exports.describeFilter = describeFilter;
exports.updateState = updateState;