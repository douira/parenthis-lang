import { runtimeErrors } from "./errors"
import { Expression } from "./parser"
import { TypeMap, TypeName, convertType, Value } from "./types"

//the function registry is a tree of objects
type FunctionExecutor = (...args: Expression[]) => Value
type RegistryValue = Registry | FunctionExecutor
export type Registry = {
  [K in string]: RegistryValue
}

//merges a registry into the default registry (which is empty)
const registry: Registry = {}
export const register = (
  sourceRegistry: Registry,
  namespace?: string, //if a namespace is given, a nested registry will be created
  targetRegistry = registry
): void => {
  console.log(sourceRegistry, namespace, targetRegistry)
  if (namespace) {
    //make sure nothing is here yet
    if (namespace in targetRegistry) {
      throw runtimeErrors.duplicateNamespace(namespace)
    }

    //create a nested registry
    targetRegistry = targetRegistry[namespace] = {}
  }

  //iterate all props and integrate them into the base registry
  for (const prop in sourceRegistry) {
    //make sure nothing is there yet
    if (prop in targetRegistry) {
      throw runtimeErrors.duplicateRegistration(prop)
    }

    //if it's a function, add it, otherwise recurse
    const value = sourceRegistry[prop]
    if (typeof value === "function") {
      targetRegistry[prop] = value
    } else {
      //recurse by registering with a specified namespace
      register(value, prop, targetRegistry)
    }
  }
}

//add a value function placeholder to prevent duplicate registration
register({
  value: () => null,
})

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

  //iterate the identifier until a function is found
  const identifier = expression.identifier
  let currentTarget: RegistryValue = registry
  for (const segment of identifier) {
    //error if identifier too long
    if (typeof currentTarget === "function") {
      throw runtimeErrors.identifierTooLong(segment, identifier)
    }

    //error if missing segment
    if (!(segment in currentTarget)) {
      throw runtimeErrors.identifierNotRegistered(segment, identifier)
    }

    currentTarget = currentTarget[segment]
  }

  //call the function with the arguments and return the value
  return (currentTarget as FunctionExecutor)(...expression.args)
}

//evaluates an expression and returns it as the given type
export const evalTo = <T extends TypeName>(
  expression: Expression,
  toType: T
): TypeMap[T] => convertType(evalExpression(expression), toType)
