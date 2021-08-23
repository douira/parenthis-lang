# (parenthis)

The **(parenthis)** esoteric programming language consists of a very uniform syntax. It was created by me (douira). This project is the interpreter for it.

I've written about it (under the previous name SUL, rename pending) on the Esolang wiki [here](https://esolangs.org/wiki/SUL).

### Version history

- **SUL v1**: Earlier implementation in Processing
- **SUL v2**: Basic implementation in JavaScript in [this KhanAcademy project](https://www.khanacademy.org/computer-programming/sul-v2-an-esoteric-programming-language/4555641989431296). See files in the folder `old`.
- **parenthis v3**: (WIP) Better implementation in TypeScript without processing.js

# Language

See more docs in the (WIP) [wiki](https://github.com/douira/parenthis-lang/wiki/Language-and-API-Documentation).

## Formal Grammar in EBNF

```ebnf
(* a parenthis program consists of a single expression *)
expression = between , ( element | string ) , between ;

(* elements are an identifier and then any number of expressions *)
element = "(" , identifier , { "," , expression } , ")";

(* consists of any number of segments separated by periods *)
identifier = between , identifier segment ,
  { "." , identifier segment } , between ;

(* use lowerCamelCase for function names *)
identifier segment = { a to z | A to Z | 0 to 9 } ;

(* double or single quotes, not listing all possible chars here. \\ is escaped to \, \\" to \\ + (end of string) and \\\" to \".
regex equivalent for double quoted: /'(.*?)(?<!\\)'/gs *)
string =
    ( '"' , { any character except '"' | '\"' }, '"' )
  | ( "'" , { any character except "'" | "\'" }, "'" ) ;

between = { any whitespace character | comment } ;
```

Theoretically the commas separating expressions could be omitted but for sake of simplicity they're required. Replacing them with whitespace or no whitespace when not ambiguous makes parsing more complicated.

## Comments

Comments are similar to those in JavaScript:

```js
code//this is a comment until the end of the line
code/*this comment can be
several
lines*/
```

## Types

A dynamic type system is used. Functions can have none, a set or variable return type.
Any type can be (implicitly or explicitly) cast into any other type.
Attempting to use a value where none is present will give an null value.

Type checking and type errors aren't normally used, because all types can be converted into each other.
Regular equality will convert the second value into the type of the first one and compare then.
When checking for strict equality type errors can happen though.

If the parent element doesn't use the return value of an argument nothing special will happen.
Some special elements execute/evaluate their arguments without using their values.
The available types are:

(TODO)

I have some ideas for a static type checking system but those aren't implemented.

## Scoping

By default all variables are declared using `setVar` and `getVar` which set variables in the first reachable scope. By default this will be the global scope. The function `createScope` creates a new scope which blocks calls to higher scopes using `setVar` and `getVar`. If the global variants `setVarGlobal` and `getVarGlobal` or are used the global boolean is set on `setVar` and `getVar` the global scope can be accessed again. Effectively, `scope` or anything similar creates a new variable map to use. The global variants skip checking or writing to any lower scope. Passing parameters to a function using `do` creates a new scope with numbered variables for each of the passed parameters. Writing to variables in a function call will use the function scope if not configured otherwise using global accessors.

(TODO: scoping and variables in general not implemented in evaluation yet)

## Namespacing

The built-in functions are in this default namespace `parenthis` which can be omitted. All others can either be merged upon import and used without prefixing their namespace or used with their namespace like this for example: `foo.bar.functionName` or `baz.otherFunction`. Using a namespace as a function is an error but a namespace can contain any mix of functions and nested namespaces. Namespaces are imported using `import` (see docs).

## Other Notes

Only evaluates what is necessary, only left-hand side of `or` if it is true and similar for `and`, and only the number of arguments needed with the types needed.

Everything is parsed first without any checking for sense (except for formal syntax like function names, parentheses...).
Then evaluated when needed, a single code element can be evaluated several times when in a loop.
Order of calling is not always guaranteed! i.e. Arguments for a function may not be called in the order they are given.
Function names are part of the syntax, because they can't be created from inside the code and are (mostly) fixed for the whole program.

The suggested file extension for parenthis programs is `.par`.
