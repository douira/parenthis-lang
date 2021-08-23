//object of all the parse errors that can be constructed,
//these functions produce the error messages
const parseErrorBuilders = {
  expectedButFound: (expected: string, found: string) =>
    `Expected ${expected} but found ${found}`,
  invalidIdentifier: (found: string) => `Identifier ${found} is invalid`,
}
type parseErrorBuilders = typeof parseErrorBuilders
type ParseErrorType = keyof parseErrorBuilders

//runtime errors
const runtimeErrorBuilders = {
  invalidType: (found: string) =>
    `Received invalid value type ${found}. Some function is returning a bad value.`,
  invalidObject: (keys: string[]) =>
    `Received invalid object type with keys ${keys.join(",")} that isn't a block or func.`
}
type runtimeErrorBuilders = typeof runtimeErrorBuilders
type RuntimeErrorType = keyof runtimeErrorBuilders

type ParenthisErrorType = ParseErrorType | RuntimeErrorType

class ParenthisError extends Error {
  type: ParenthisErrorType

  constructor(message: string, type: ParenthisErrorType) {
    super(message)
    this.type = type
  }
}

export class ParseError extends ParenthisError {
  type: ParseErrorType
  line: number
  col: number

  constructor(
    message: string,
    type: ParseErrorType,
    lines: string[],
    line: number,
    col: number
  ) {
    super(
      `input:${line}:${col}: ${message}\n${
        line > 1 ? `${lines[line - 2]}\n` : ""
      }${lines[line - 1]}\n${" ".repeat(col - 1)}^`,
      type
    )
    this.type = type
    this.line = line
    this.col = col
  }
}

export class RuntimeError extends ParenthisError {
  type: RuntimeErrorType

  constructor(message: string, type: RuntimeErrorType) {
    super(message, type)
    this.type = type
  }
}

export const parseErrors = {} as {
  [K in ParseErrorType]: (
    ...args: [
      lines: string[],
      line: number,
      col: number,
      ...builderArgs: Parameters<parseErrorBuilders[K]>
    ]
  ) => ParseError
}

//wrap the error message builders in functions that actually create error instances
for (const errorType in parseErrorBuilders) {
  const _errorType = errorType as ParseErrorType
  const messageBuilder = parseErrorBuilders[_errorType]
  parseErrors[_errorType] = (lines, line, col, ...args) =>
    //@ts-expect-error we know these match since the wrapper is correctly constructed
    new ParenthisError(messageBuilder(...args), _errorType, lines, line, col)
}

export const runtimeErrors = {} as {
  [K in RuntimeErrorType]: (...args: Parameters<runtimeErrorBuilders[K]>) => RuntimeError
}
