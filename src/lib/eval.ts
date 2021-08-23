import { Expression } from "./parser"
import { TypeMap, TypeName, convertType, Value } from "./types"

//a function definition includes

//the function registry is a tree of maps
type Registry = Map<string, Registry | FunctionDef>

//registers an object of

//evaluates an expression by looking up the identifier and running the function
export const evalExpression = (expression: Expression): Value => {
  //check if string expression, return right away
  if (typeof expression === "string") {
    return expression
  }

  //check if is value element, return value right away
  if ("value" in expression) {
    return expression.value
  }


}

//evaluates an expression and returns it as the given type
export const evalTo = <T extends TypeName>(
  expression: Expression,
  toType: T
): TypeMap[T] => convertType(evalExpression(expression), toType)
