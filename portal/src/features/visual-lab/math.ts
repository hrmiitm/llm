/** Row-token convention; standard MHA with dk = dv = d / heads. */
export function softmax(values: number[]) {
  const max = Math.max(...values);
  const exp = values.map(v => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(v => v / sum);
}
export function positional(position: number, dimension: number) {
  return Array.from({ length: dimension }, (_, j) => {
    const angle = position / 10000 ** (2 * Math.floor(j / 2) / dimension);
    return j % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
  });
}
export interface Config {
  d: number; heads: number; ff: number; layers: number; source: number; vocab: number; context: number;
  architecture: 'seq2seq' | 'encoder' | 'gpt'; attentionBias: boolean; ffnBias: boolean;
  outputBias: boolean; learnedPosition: boolean; tied: boolean;
}
export function parameterCounts(c: Config) {
  const mha = 4 * c.d ** 2 + (c.attentionBias ? 4 * c.d : 0);
  const ffn = 2 * c.d * c.ff + (c.ffnBias ? c.ff + c.d : 0);
  const norm = 2 * c.d;
  const encoder = mha + ffn + 2 * norm;
  const decoder = 2 * mha + ffn + 3 * norm;
  const stack = c.layers * (c.architecture === 'seq2seq' ? encoder + decoder : encoder);
  const token = c.d * (c.architecture === 'seq2seq' ? c.source + c.vocab : c.vocab);
  const position = c.learnedPosition ? c.context * c.d * (c.architecture === 'seq2seq' ? 2 : 1) : 0;
  const output = (c.tied ? 0 : c.d * c.vocab) + (c.outputBias ? c.vocab : 0);
  return { mha, ffn, norm, encoder, decoder, stack, token, position, output, total: stack + token + position + output };
}
export const ga2Config: Config = { d: 64, heads: 4, ff: 256, layers: 2, source: 1000, vocab: 1500, context: 128, architecture: 'seq2seq', attentionBias: false, ffnBias: false, outputBias: false, learnedPosition: false, tied: false };
export const toyTokens = ['learn', 'easy', 'math'];
export const toyX = [[1, 0], [0, 1], [1, 1]];
export function attentionExample(causal: boolean, scaled: boolean) {
  const scores = toyX.map(q => toyX.map(k => q[0] * k[0] + q[1] * k[1]));
  const logits = scores.map((row, i) => row.map((v, j) => causal && j > i ? -Infinity : v / (scaled ? Math.sqrt(2) : 1)));
  const weights = logits.map(softmax);
  const values = toyX.map(([a, b]) => [b, a]);
  const output = weights.map(row => [0, 1].map(k => row.reduce((sum, a, j) => sum + a * values[j][k], 0)));
  return { scores, logits, weights, values, output };
}
