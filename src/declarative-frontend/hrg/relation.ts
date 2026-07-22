/**
 * HRG Relation + HrgNode.
 *
 * A relation is a graph (a flat `list` or a `tree`) over items. Each item that
 * participates in a relation gets one {@link HrgNode} in that relation holding
 * the relation-specific topology (next/prev/parent/daughters). The node wraps a
 * SHARED item — the same Item object can have nodes in several relations.
 *
 * Citations: Taylor, Black & Caley 2001 (relations as lists/trees over a shared
 * item pool); Festival Utterance structure (Word/Syllable/Segment lists +
 * SylStructure tree). See design/beauty-synthesis/11-sota-frontend-architecture.md §2c.
 */
import type { Item } from "./item";
import type {
  RelationKind,
  RelationStamper,
  RelationWrite,
  RelationWriteInput,
} from "./types";

/** Relation-specific topology for one item in one relation. */
export class HrgNode {
  next: HrgNode | null = null;
  prev: HrgNode | null = null;
  parent: HrgNode | null = null;
  readonly daughters: HrgNode[] = [];

  constructor(
    readonly item: Item,
    readonly relation: Relation,
    readonly write: RelationWrite,
  ) {}

  /** First node in this node's sibling chain (follow prev to the head). */
  firstSibling(): HrgNode {
    let node: HrgNode = this;
    while (node.prev) node = node.prev;
    return node;
  }

  /** Last node in this node's sibling chain (follow next to the tail). */
  lastSibling(): HrgNode {
    let node: HrgNode = this;
    while (node.next) node = node.next;
    return node;
  }
}

export class Relation {
  /** itemId -> node, for fast membership / relation-switch. */
  readonly nodesById = new Map<string, HrgNode>();
  /** List head/tail (also tracks tree root chain head/tail). */
  head: HrgNode | null = null;
  tail: HrgNode | null = null;
  private readonly writeHistory: RelationWrite[] = [];
  private readonly latestWriteByItemId = new Map<string, RelationWrite>();

  constructor(
    readonly name: string,
    readonly kind: RelationKind,
    private readonly allowedItemTypes: ReadonlySet<string>,
    private readonly stamper: RelationStamper,
  ) {}

  itemTypes(): readonly string[] {
    return Object.freeze([...this.allowedItemTypes]);
  }

  _validateAttach(item: Item): void {
    if (!this.allowedItemTypes.has(item.type)) {
      throw new Error(
        `E_HRG_RELATION_ITEM_TYPE: relation '${this.name}' does not allow item type '${item.type}'`,
      );
    }
    if (this.nodesById.has(item.id)) {
      throw new Error(
        `E_HRG_DUPLICATE_NODE: item '${item.id}' is already in relation '${this.name}'`,
      );
    }
  }

  private attach(item: Item, write: RelationWrite): HrgNode {
    const node = new HrgNode(item, this, write);
    item.nodes.set(this.name, node);
    this.nodesById.set(item.id, node);
    return node;
  }

  private linkAfter(prev: HrgNode | null, node: HrgNode): void {
    if (prev) {
      node.prev = prev;
      prev.next = node;
    }
  }

  /** Append an item to a flat list relation. */
  append(item: Item, input: RelationWriteInput): HrgNode {
    if (this.kind !== "list") {
      throw new Error(`E_HRG_RELATION_KIND: append requires a 'list' relation, '${this.name}' is '${this.kind}'`);
    }
    this._validateAttach(item);
    const previous = this.tail?.item ?? null;
    const write = this.stamper(this, "append", item, null, previous, input);
    const node = this.attach(item, write);
    this.linkAfter(this.tail, node);
    if (!this.head) this.head = node;
    this.tail = node;
    return node;
  }

  /** Insert an item immediately after an existing node in a flat list relation. */
  insertAfter(previous: HrgNode, item: Item, input: RelationWriteInput): HrgNode {
    if (this.kind !== "list") {
      throw new Error(`E_HRG_RELATION_KIND: insertAfter requires a 'list' relation, '${this.name}' is '${this.kind}'`);
    }
    if (previous.relation !== this) {
      throw new Error(`E_HRG_PREVIOUS_RELATION: previous node is not in relation '${this.name}'`);
    }
    this._validateAttach(item);
    const write = this.stamper(this, "insert_after", item, null, previous.item, input);
    const node = this.attach(item, write);
    const next = previous.next;
    previous.next = node;
    node.prev = previous;
    node.next = next;
    if (next) next.prev = node;
    else this.tail = node;
    return node;
  }

  /** Add a top-level (root) item to a tree relation. */
  addRoot(item: Item, input: RelationWriteInput): HrgNode {
    if (this.kind !== "tree") {
      throw new Error(`E_HRG_RELATION_KIND: addRoot requires a 'tree' relation, '${this.name}' is '${this.kind}'`);
    }
    this._validateAttach(item);
    // In a tree relation only addRoot mutates head/tail (addDaughter never
    // touches them and append/insertAfter throw), so `tail` is always the last
    // root of the root chain.
    const previous = this.tail?.item ?? null;
    const write = this.stamper(this, "add_root", item, null, previous, input);
    const node = this.attach(item, write);
    this.linkAfter(this.tail, node);
    if (!this.head) this.head = node;
    this.tail = node;
    return node;
  }

  /** Add `item` as the last daughter of `parent` in a tree relation. */
  addDaughter(parent: HrgNode, item: Item, input: RelationWriteInput): HrgNode {
    if (this.kind !== "tree") {
      throw new Error(`E_HRG_RELATION_KIND: addDaughter requires a 'tree' relation, '${this.name}' is '${this.kind}'`);
    }
    if (parent.relation !== this) {
      throw new Error(`E_HRG_PARENT_RELATION: parent node is not in relation '${this.name}'`);
    }
    this._validateAttach(item);
    const previous = parent.daughters[parent.daughters.length - 1]?.item ?? null;
    const write = this.stamper(this, "add_daughter", item, parent.item, previous, input);
    const node = this.attach(item, write);
    node.parent = parent;
    this.linkAfter(parent.daughters[parent.daughters.length - 1] ?? null, node);
    parent.daughters.push(node);
    return node;
  }

  /** The node for `item` in this relation, or undefined. */
  node(item: Item): HrgNode | undefined {
    return this.nodesById.get(item.id);
  }

  /** Nodes of a list relation in order (head -> tail). */
  listNodes(): HrgNode[] {
    const out: HrgNode[] = [];
    for (let node = this.head; node; node = node.next) {
      // For a tree, head->next walks the root chain only; listNodes is meant
      // for flat list relations. Guard against accidental tree misuse.
      if (node.relation !== this) break;
      out.push(node);
      if (this.kind === "tree" && node === this.tail) break;
    }
    return out;
  }

  /** Items of a list relation in order. */
  listItems(): Item[] {
    return this.listNodes().map((node) => node.item);
  }

  /** Append-only membership/topology history in commit order. */
  writes(): readonly RelationWrite[] {
    return Object.freeze([...this.writeHistory]);
  }

  latestWrite(item: Item): RelationWrite | undefined {
    return this.latestWriteByItemId.get(item.id);
  }

  /** Internal: record a stamped relation write. */
  _pushWrite(write: RelationWrite): void {
    this.writeHistory.push(write);
    this.latestWriteByItemId.set(write.itemId, write);
  }
}
