/** Exact path-dependent TreeSHAP (Lundberg et al. 2018, Algorithm 2), as shap.TreeExplainer computes it for a
 * scikit-learn random forest: node weights are the exported `cover` (weighted_n_node_samples) and the forest's SHAP
 * values are the mean of its trees'. Inputs are cast to float32 before comparison, as in forest.js. Values are on
 * the forest's probability scale, before recalibration. */

function extend(path, depth, zero, one, feature) {
  path[depth] = { f: feature, z: zero, o: one, w: depth === 0 ? 1 : 0 };
  for (let i = depth - 1; i >= 0; i -= 1) {
    path[i + 1].w += (one * path[i].w * (i + 1)) / (depth + 1);
    path[i].w = (zero * path[i].w * (depth - i)) / (depth + 1);
  }
}

function unwind(path, depth, index) {
  const { o: one, z: zero } = path[index];
  let next = path[depth].w;
  for (let i = depth - 1; i >= 0; i -= 1) {
    if (one !== 0) {
      const tmp = path[i].w;
      path[i].w = (next * (depth + 1)) / ((i + 1) * one);
      next = tmp - (path[i].w * zero * (depth - i)) / (depth + 1);
    } else {
      path[i].w = (path[i].w * (depth + 1)) / (zero * (depth - i));
    }
  }
  for (let i = index; i < depth; i += 1) {
    path[i].f = path[i + 1].f;
    path[i].z = path[i + 1].z;
    path[i].o = path[i + 1].o;
  }
}

function unwoundSum(path, depth, index) {
  const { o: one, z: zero } = path[index];
  let next = path[depth].w;
  let total = 0;
  if (one !== 0) {
    for (let i = depth - 1; i >= 0; i -= 1) {
      const tmp = next / ((i + 1) * one);
      total += tmp;
      next = path[i].w - tmp * zero * (depth - i);
    }
  } else {
    for (let i = depth - 1; i >= 0; i -= 1) total += path[i].w / (zero * (depth - i));
  }
  return total * (depth + 1);
}

function recurse(tree, x, phi, node, parentPath, depth, zero, one, feature) {
  const path = parentPath.slice(0, depth).map((e) => ({ ...e }));
  extend(path, depth, zero, one, feature);
  if (tree.left[node] === -1) {
    for (let i = 1; i <= depth; i += 1) {
      const el = path[i];
      phi[el.f] += unwoundSum(path, depth, i) * (el.o - el.z) * tree.p1[node];
    }
    return;
  }
  const split = tree.feature[node];
  const goLeft = Math.fround(x[split]) <= tree.threshold[node];
  const hot = goLeft ? tree.left[node] : tree.right[node];
  const cold = goLeft ? tree.right[node] : tree.left[node];
  const w = tree.cover[node];
  let inZero = 1;
  let inOne = 1;
  let d = depth;
  let k = 0;
  while (k <= d && path[k].f !== split) k += 1;
  if (k <= d) {
    inZero = path[k].z;
    inOne = path[k].o;
    unwind(path, d, k);
    d -= 1;
  }
  recurse(tree, x, phi, hot, path, d + 1, (tree.cover[hot] / w) * inZero, inOne, split);
  recurse(tree, x, phi, cold, path, d + 1, (tree.cover[cold] / w) * inZero, 0, split);
}

/** SHAP value of every model feature for one preprocessed input vector. */
export function treeShap(x, model) {
  const phi = new Float64Array(model.feature_names.length);
  for (const tree of model.trees) recurse(tree, x, phi, 0, [], 0, 1, 1, -1);
  return phi.map((v) => v / model.trees.length);
}

/** The forest's expected output over its training data: the cover-weighted mean leaf value, averaged over trees. */
export function expectedValue(model) {
  let sum = 0;
  for (const t of model.trees) {
    let tree = 0;
    t.left.forEach((l, i) => {
      if (l === -1) tree += t.cover[i] * t.p1[i];
    });
    sum += tree / t.cover[0];
  }
  return sum / model.trees.length;
}
