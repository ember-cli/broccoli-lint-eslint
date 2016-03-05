module.exports = function noAlerts(context) {
  return {
    CallExpression: function callExpression(node) {
      if (node.callee.name === 'alert') {
        context.report(node, 'testing custom rules.');
      }
    }
  };
};
