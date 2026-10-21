/**
 * A frontend's parsed letter-to-sound document and its declaring resource path.
 * The frontend resource owner supplies this to pronunciation and normalization.
 */

export interface LtsContext {
  path: string;
  document: unknown;
}
