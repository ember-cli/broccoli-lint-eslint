/* eslint-disable no-invalid-this, newline-after-var */

global.chai = require('chai');
global.expect = chai.expect;
const sinon = require('sinon');

const sinonChai = require('sinon-chai');
chai.use(sinonChai);

beforeEach(function beforeEachAndEvery() {
  this.sinon = sinon.sandbox.create();
});

afterEach(function afterEachAndEvery() {
  this.sinon.restore();
});
