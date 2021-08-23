import { parseErrors } from "./errors"
import { Value } from "./types"

//every program is an expression, see EBNF grammar of parenthis
export type Expression = Element | string

export type Element =
  //function call element has a name and a list of arguments (that may be empty)
  | {
      //list of the function's identifier segments (namespace path)
      identifier: string[]

      //list of argument expressions
      args: Expression[]
  }
  
  //value elements are special because they have another prop
  | {
      identifier: ["value"]
      args: []

      //optional return value for the special "value" element that's involved in type conversion
      value: Value
    }
type Identifier = Element["identifier"]

//list of individual regexes for the different tokens
const tokenMatchers = {
  singleQuotedString: /'.*?(?<!\\)'/,
  doubleQuotedString: /".*?(?<!\\)"/,
  lineComment: /\/\/[^\n]*\n/,
  blockComment: /\/\*.*?\*\//,
  whitespace: /\s+/,
  openParen: /\(/,
  closeParen: /\)/,
  comma: /,/,
  identifier: /[a-z0-9.]+/,
}
type TokenMatchType = keyof typeof tokenMatchers
type TokenType = TokenMatchType | "invalid" | "endOfFile"
type Token<Type = TokenType> = {
  type: Type
  match: string
}

//generate the regex that matches tokens
const tokenMatchersArr = Object.entries(tokenMatchers)
const tokenRegex = new RegExp(
  tokenMatchersArr.map(([, regex]) => `(${regex.source})`).join("|") +
    //add catch-all for non-matched chars
    "|.",
  "gsi"
)

//parses a code string into an expression AST
export const parse = (str: string): Expression => {
  //split into lines for error reporting
  const lines = str.split("\n")

  //parse tokens from the string
  const tokens = Array.from(str.matchAll(tokenRegex)).map<Token>(match => {
    //find which group matched
    const matchIndex = match.findIndex((group, index) => index && group)
    return {
      //invalid token if none matched
      type:
        matchIndex === -1
          ? "invalid"
          : (tokenMatchersArr[matchIndex - 1][0] as TokenMatchType),
      match: match[0],
    }
  })

  //add an end-of-file token to ensure there's only one root expression
  tokens.push({
    type: "endOfFile",
    match: "",
  })

  //keep track of the current line and line column position
  //the first line and char are counted as 1
  let line = 1
  let col = 1

  let pieceIndex = 0

  let nextToken: Token | undefined = tokens[0]
  const getToken = (type: TokenType) => {
    if (!nextToken) {
      return
    }

    if (nextToken.type === type) {
      const foundToken = nextToken

      //update line and col state with this token's content
      const newlines = foundToken.match.match(/\n/g)?.length
      if (newlines != null && newlines > 0) {
        line += newlines

        //reset col if there was a new line
        col = 1
      }

      //move col by the number of chars in the last line (or only line)
      col += (/.*$/.exec(foundToken.match)?.[0] || "").length

      //get the next token for the next call
      nextToken = tokens[++pieceIndex]
      return foundToken
    } else {
      return
    }
  }

  //throws an error when the given value is undefined
  const expectValue = <Type>(expected: string, value: Type | undefined) => {
    if (value == null) {
      throw parseErrors.expectedButFound(
        lines,
        line,
        col,
        `${expected}`,
        `token ${nextToken?.type}`
      )
    }

    return value
  }

  const getIdentifier = (): Identifier | undefined => {
    const match = getToken("identifier")?.match
    if (!match) {
      return
    }

    //validate identifier structure
    if (!/^[a-z0-9]+(?:\.[a-z0-9]+)*$/i.test(match)) {
      throw parseErrors.invalidIdentifier(lines, line, col, match)
    }

    //parse identifier segments
    return match.split(".")
  }

  const getElement = (): Element | undefined => {
    if (!getToken("openParen")) {
      return
    }

    const identifier = expectValue("identifier", getIdentifier())

    //construct an element with the parsed identifier and init an args array
    const element: Element = {
      identifier,
      args: [],
    }

    //collect argument expressions
    while (getToken("comma")) {
      element.args.push(expectValue("expression", getExpression()))
    }

    expectValue("closeParen", getToken("closeParen"))

    return element
  }

  const getString = (): string | undefined => {
    const match = (
      getToken("singleQuotedString") || getToken("doubleQuotedString")
    )?.match
    if (match == null) {
      return
    }

    //parse string by removing quotes
    return match.slice(1, -1)
  }

  const getBetween = () => {
    while (
      getToken("whitespace") ||
      getToken("blockComment") ||
      getToken("lineComment")
    ) {
      //repeat until falsy returned
    }
  }

  const getExpression = () => {
    getBetween()
    const expression = getElement() || getString()
    getBetween()
    return expression
  }

  //expect an expression
  const rootExpression = expectValue("expression", getExpression())

  //expect there to be no more tokens except for the eof token
  expectValue("endOfFile", getToken("endOfFile"))

  return rootExpression
}
