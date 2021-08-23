import { runtimeErrors } from "./errors"
import { evalTo } from "./eval"
import { Element, Expression } from "./parser"

export type Value =
  | null
  | number
  | boolean
  | string
  | Value[]
  | Map<Value, Value>
  | Set<Value>
  | symbol
  | Element

export interface TypeMap {
  //the universal null type, there is no "undefined"
  null: null

  //a regular JS number (not bigint), NaN and +/- Infinity are ok
  number: number

  //a regular boolean
  boolean: boolean

  //a JS-style string
  string: string

  //an array of any length of values
  array: Value[]

  //a map of values mapping to other values, any value is ok as a key (like in JS)
  map: Map<Value, Value>

  //a set of values, any value is ok (and treated like in JS)
  set: Set<Value>

  //symbols like in JS provide an identity like an empty object
  symbol: symbol

  //an element is an non-string expression that can be evaluated (or not),
  //this used to be block but now applies to all unevaluated non-string expressions.
  //an element can evaluate its arguments but doesn't have to
  element: Element
}
export type TypeName = keyof TypeMap

//detects types of given values and returns the name in the type map
export const detectType = (value: Value): TypeName => {
  switch (typeof value) {
    case "object":
      if (value == null) {
        return "null"
      } else if (Array.isArray(value)) {
        return "array"
      } else if (value instanceof Map) {
        return "map"
      } else if (value instanceof Set) {
        return "set"
      } else if (Array.isArray(value.identifier) && Array.isArray(value.args)) {
        return "element"
      }

      //other type of object, something is broken
      throw runtimeErrors.invalidObject(Object.keys(value))
    case "number":
    case "boolean":
    case "string":
    case "symbol":
      return typeof value as "number" | "boolean" | "string" | "symbol"
    default:
      throw runtimeErrors.invalidType(typeof value)
  }
}

//constructs an element object with an identifier array and an argument array
export const makeElement = (
  identifier: string | string[],
  args?: Expression[]
): Element => ({
  identifier: typeof identifier === "string" ? [identifier] : identifier,
  args: args ?? [],
})

//makes a special value element that just returns a given value when called
const makeValueElement = (value: Value): Element => ({
  identifier: ["value"],
  args: [],
  value,
})

//makes a map that has one key with the same value
const idMap = <T>(value: T) => {
  const map = new Map()
  map.set(value, value)
  return map
}

//makes a set that just has one value
const idSet = <T>(value: T) => {
  const set = new Set<T>()
  set.add(value)
  return set
}

//converts a given value into a specific type
export const convertType = <T extends TypeName>(
  value: Value,
  toType: T
): TypeMap[T] => {
  const valueType = detectType(value)
  if (valueType === toType) {
    return value as TypeMap[T]
  }
  if (toType === "null") {
    return null as TypeMap[T]
  }

  //convert to the required type
  //@ts-expect-error we know these match because typeConversions is constructed like this
  //and the same type or null is handled beforehand
  return (typeConversions[valueType][toType] as (value) => TypeMap[T])(value)
}

//converts any type into any other type (other than itself and null)
const typeConversions: {
  [FromType in TypeName]: {
    [ToType in Exclude<TypeName, FromType | "null">]: (
      from: TypeMap[FromType]
    ) => TypeMap[ToType]
  }
} = {
  null: {
    number: () => 0,
    boolean: () => false,
    string: () => "",
    array: () => [],
    map: () => new Map(),
    set: () => new Set(),
    symbol: () => Symbol.for(typeConversions.null.string(null)),
    element: () => makeValueElement(null),
  },
  number: {
    boolean: number => number !== 0,
    string: number => number.toString(),
    array: number => [number],
    map: number => idMap(number),
    set: number => idSet(number),
    symbol: number => Symbol.for(typeConversions.number.string(number)),
    element: number => makeValueElement(number),
  },
  boolean: {
    number: boolean => (boolean ? 1 : 0),
    string: boolean => (boolean ? "true" : "false"),
    array: boolean => [boolean],
    map: boolean => idMap(boolean),
    set: boolean => idSet(boolean),
    symbol: boolean => Symbol.for(typeConversions.boolean.string(boolean)),
    element: boolean => makeValueElement(boolean),
  },
  string: {
    number: string => parseFloat(string),
    boolean: string => string.length > 0,
    array: string => [string],
    map: string => idMap(string),
    set: string => idSet(string),
    symbol: string => Symbol.for(string),
    element: string => makeValueElement(string),
  },
  array: {
    number: array => array.length,
    boolean: array => array.length > 0,
    string: array => array.join(""),
    map: array => idMap(array),
    set: array => idSet(array),
    symbol: array => Symbol.for(typeConversions.array.string(array)),
    element: array => makeValueElement(array),
  },
  map: {
    number: map => map.size,
    boolean: map => map.size > 0,
    string: map =>
      Array.from(map.entries())
        .map(
          ([key, value]) =>
            `${convertType(key, "string")}: ${convertType(value, "string")}`
        )
        .join("\n"),
    array: map => Array.from(map.entries()),
    set: map => new Set(map.entries()),
    symbol: map => Symbol.for(typeConversions.map.string(map)),
    element: map => makeValueElement(map),
  },
  set: {
    number: set => set.size,
    boolean: set => set.size > 0,
    string: set =>
      Array.from(set.values())
        .map(value => convertType(value, "string"))
        .join(","),
    array: set => Array.from(set.values()),
    map: set => {
      const map = new Map()
      for (const value of set) {
        map.set(value, value)
      }
      return map
    },
    symbol: set => Symbol.for(typeConversions.set.string(set)),
    element: set => makeValueElement(set),
  },
  symbol: {
    number: () => 1,
    boolean: () => true,
    string: () => "symbol",
    array: symbol => [symbol],
    map: symbol => idMap(symbol),
    set: symbol => idSet(symbol),
    element: symbol => makeValueElement(symbol),
  },
  element: {
    number: element => evalTo(element, "number"),
    boolean: element => evalTo(element, "boolean"),
    string: element => evalTo(element, "string"),
    array: element => evalTo(element, "array"),
    map: element => evalTo(element, "map"),
    set: element => evalTo(element, "set"),
    symbol: element => evalTo(element, "symbol"),
  },
}
