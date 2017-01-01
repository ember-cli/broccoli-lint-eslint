module.exports = function (context) {
  return {
    CallExpression: function callExpression(node) {
      if (node.callee.name === 'customRuleRunner') {
        context.report({ node: node, message: 'testing custom rules.' });
      }
    }
  };
};
