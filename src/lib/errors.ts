//object of all the errors that can be constructed, these functions produce the error messages
const errorMessageBuilders = {
  expectedButFound: (expected: string, found: string) =>
    `Expected ${expected} but found ${found}`,
  invalidIdentifier: (found: string) => `Identifier ${found} is invalid`
}
type ErrorMessageBuilders = typeof errorMessageBuilders
type ErrorType = keyof ErrorMessageBuilders

export class ParenthisError extends Error {
  type: ErrorType
  line: number
  col: number

  constructor(
    message: string,
    type: ErrorType,
    lines: string[],
    line: number,
    col: number
  ) {
    super(
      `input:${line}:${col}: ${message}\n${
        line > 1 ? `${lines[line - 2]}\n` : ""
      }${lines[line - 1]}\n${" ".repeat(col - 1)}^`
    )
    this.type = type
    this.line = line
    this.col = col
  }
}

export const errors = {} as {
  [K in ErrorType]: (
    ...args: [
      lines: string[],
      line: number,
      col: number,
      ...builderArgs: Parameters<ErrorMessageBuilders[K]>
    ]
  ) => ParenthisError
}

//wrap the error message builders in functions that actually create error instances
for (const errorType in errorMessageBuilders) {
  const _errorType = errorType as ErrorType
  const messageBuilder = errorMessageBuilders[_errorType]
  errors[_errorType] = (lines, line, col, ...args) =>
    //@ts-expect-error we know these match since the wrapper is correctly constructed
    new ParenthisError(messageBuilder(...args), _errorType, lines, line, col)
}
