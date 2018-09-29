/**
 * Uses eslint (private) api to see if eslint config includes a `overrides` flag.
 *
 * inputNode type is a bit tricky here. We are expecting three different cases:
 * if it's string, we will use it as a directory and let eslint do the work.
 *
 * if it's a source node, use the `sourceDirectory` property.
 *
 * if it's a transform node, recursively call same function with all of its
 * inputNodes. if any of the input directories contain `overrides` eslint
 * config, return true
 *
 * While it's not ideal we iterate through all the `inputNodes` of a transform node,
 * the input size should be very small.
 */
const nodeIncludesOverrides = (inputNode, eslintCli) => {
  if (typeof inputNode === 'string') {
    return eslintCli.config
      .getConfigHierarchy(inputNode)
      .some(node => node.overrides);
  }

  const nodeInfo = inputNode.__broccoliGetInfo__();
  const nodeType = nodeInfo.nodeType;
  const sourceDirectory = nodeInfo.sourceDirectory;
  if (nodeType === 'transform') {
    const nodesIncludesOverrides = inputNode._inputNodes.map(node =>
      nodeIncludesOverrides(node, eslintCli)
    );
    return nodesIncludesOverrides.some(Boolean);
  }

  return nodeIncludesOverrides(sourceDirectory, eslintCli);
};

module.exports = nodeIncludesOverrides;
