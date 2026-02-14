declare module "jmespath" {
  interface JmespathModule {
    search(data: unknown, expression: string): unknown;
  }

  const jmespath: JmespathModule;
  export default jmespath;
}

declare module "toposort" {
  type ToposortEdge = [string, string];

  function toposort(edges: ToposortEdge[]): string[];
  export default toposort;
}
