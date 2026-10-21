/**
 * PARAMETER SCOPES
 *
 * A parameter scope is a named overlay on the runtime parameters of a rule
 * engine run: a partial record, laid over `parameters` path by path. An Item
 * is in a scope when its feature PARAMETER_SCOPE_FEATURE holds the scope's
 * name; an Item without the feature is in no scope and sees the parameters
 * as they are.
 *
 * When a rule evaluates on an Item, `params` in its expressions is the
 * parameters as that Item's scope gives them: the Item the rule is matched
 * on, not an Item a navigation function visits on the way. The engine reads
 * the feature through the rule's transaction, so the rule's decision depends
 * on the decision that wrote the feature, as on any feature it reads. The
 * one who writes the feature (whoever makes the scopes) says why in that
 * decision.
 *
 * An Item a rule creates is in the scope of the Item it is created for. A
 * frame program's unit has the parameters of its first Item, and a tail unit
 * those of the unit after it. `params_of(item)` gives the parameters of
 * another Item's scope.
 *
 * With no scope declared nothing here is read or written.
 *
 * engineering choice: scoping by a feature on Items, so that the scope's
 * provenance is the feature's and no second dependency mechanism is needed.
 */

import type { Item } from "./item";
import type { HrgTransaction } from "./transaction";

export const PARAMETER_SCOPE_FEATURE = "param_scope";

/** Put a created Item in the scope of the Item it is created for. */
export function inheritParameterScope(
  transaction: HrgTransaction,
  created: Item,
  source: Item,
): void {
  if (!source.has(PARAMETER_SCOPE_FEATURE)) return;
  const name = transaction.read(source, PARAMETER_SCOPE_FEATURE);
  if (name !== undefined) transaction.set(created, PARAMETER_SCOPE_FEATURE, name);
}
