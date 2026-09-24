/** Random-forest inference over exported trees. scikit-learn casts inputs to float32 before comparing them with
 * the (float64) thresholds, so we do the same with Math.fround. */
export function predictTree(x, tree) {
  let node = 0;
  while (tree.left[node] !== -1) {
    node = Math.fround(x[tree.feature[node]]) <= tree.threshold[node] ? tree.left[node] : tree.right[node];
  }
  return tree.p1[node];
}

export function predictForest(x, model) {
  let sum = 0;
  for (const tree of model.trees) sum += predictTree(x, tree);
  return sum / model.trees.length;
}
