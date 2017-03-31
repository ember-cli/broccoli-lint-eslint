const chai = require('chai');
const sinonChai = require('sinon-chai');
const asPromised = require('chai-as-promised');

chai.use(sinonChai);
chai.use(asPromised);

module.exports = chai;
