import { evalExpression } from "../lib/eval"
import { Expression } from "../lib/parser"
import { Value } from "../lib/types"

//defines functions that deal with types and conversions
const registry = {
  /**
   * The block function is used for basic sequential evaluation.
   * @param ...args Expressions to be evaluated in order
   * @returns The result of the last evaluated expression. Null if no arguments given.
   */
  block: (...args: Expression[]): Value => {
    let result = null
    args.forEach(item => {
      result = evalExpression(item)
    })
    return result
  },
}
export default registry
