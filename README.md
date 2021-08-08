# (parenthis)

The **(parenthis)** esoteric programming language consists of a very uniform syntax. It was created by me (douira). This project is the interpreter for it.

I've written about it (under the previous name SUL, rename pending) on the Esolang wiki [here](https://esolangs.org/wiki/SUL).

### Version history

- **SUL v1**: Earlier implementation in Processing
- **SUL v2**: Basic implementation in JavaScript in [this KhanAcademy project](https://www.khanacademy.org/computer-programming/sul-v2-an-esoteric-programming-language/4555641989431296). See code in `old.js`.
- **parenthis v3**: (WIP) Better implementation in TypeScript without processing.js

# Language

## Formal Grammar in EBNF

```ebnf
(* a parenthis program consists of a single expression *)
expression = element | string ;

(* elements are an identifier and then any number of expressions *)
element = "(" , identifier , { "," , expression } , ")" ;

(* consists of any number of segments separated by periods *)
identifier = identifier segment , { "." , identifier segment } ;

(* use lowerCamelCase for function names *)
identifier segment = { a to z | A to Z | 0 to 9 } ; 

(* not listing all possible chars here, regex equivalent: /(:?[^"\]|\\"|\\\\)*/ *)
escaped string = { any character except '"' and " \ " | "\\" | '\"' } ;

(* only double quotes are allowed, for now *)
string = '"' , escaped string , '"' ;
```

## Comments

Comments are similar to those in JavaScript:
```
code//this is a comment until the end of the line
code/*this comment can be several lines*/
```

Comments inside of string literals are also removed if they're valid.
- Multi-line comments can be inserted anywhere, even in function identifiers.
- Single line comments depend on line breaks and will remove anything until a line break `\n` is detected.

Not closing multi-line comments has fatal effects, because all code is removed until it's closed. 
Because whitespace (after processing of single line comments) outside of string literals is completely ignored, you can use it wherever you want.

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

- `NULL`  
  a nonexistent value
- `NUM`  
  a JS-compliant number
- `STRING`  
  any length series of characters
- `BLOCK`  
  any number of statements that will be executed in order
- `FUNC`  
  at the moment the almost same as BLOCK, both are allowed to read and write parameters.
  However it (func) isn't executed as soon as it's created (as it is with block).
  It's executed when called with the `do` element.
- `BOOL`  
  a boolean value that is either true or false
- `ARRAY`  
  is an arbitrarily long 0-indexed ordered collection of values that can be any of the above.

I have some ideas for a static type checking system but those aren't implemented.

## Scoping

By default all variables are declared using `setVar` and `getVar` which set variables in the first reachable scope. By default this will be the global scope. The function `createScope` creates a new scope which blocks calls to higher scopes using `setVar` and `getVar`. If the global variants `setVarGlobal` and `getVarGlobal` or are used the global boolean is set on `setVar` and `getVar` the global scope can be accessed again. Effectively, `scope` or anything similar creates a new variable map to use. The global variants skip checking or writing to any lower scope. Passing parameters to a function using `do` creates a new scope with numbered variables for each of the passed parameters. Writing to variables in a function call will use the function scope if not configured otherwise using global accessors.

## Namespacing
The built-in functions are in this default namespace `parenthis` which can be omitted. All others can either be merged upon import and used without prefixing their namespace or used with their namespace like this for example: `foo.bar.functionName` or `baz.otherFunction`. Using a namespace as a function is an error but a namespace can contain any mix of functions and nested namespaces. Namespaces are imported using `import` (see docs).

## Other Notes
Only evaluates what is necessary, only left-hand side of `or` if it is true and similar for `and`, and only the number of arguments needed with the types needed.

Everything is parsed first without any checking for sense (except for formal syntax like function names, parentheses...).
Then evaluated when needed, a single code element can be evaluated several times when in a loop.
Order of calling is not always guaranteed! i.e. Arguments for a function may not be called in the order they are given.
Function names are part of the syntax, because they can't be created from inside the code and are (mostly) fixed for the whole program.

# Examples

Here are some examples and the results they give.

Hello World

```
(println, 'Hello World!')
```

A multitude of mathematical operations can be performed on numbers. Most of these are identical to those in JavaScripts's `Math.`

```
(add, "9", "5") => 14
(sub, "20", "15") => 5
(mult, "0.5", "8") => 4
(incr, "3") => 4
(decr, "100", "foo") => 99 //note that passing the second argument "foo" has no effect
```

Control flow

```
(block,
  (setVar, 'x', '0'),
  (countedLoop,
    '10',
    (block,
      (incrVar, 'x'),
      (println,
        (strConcat,
          'iteration Nr. ',
          (getVar, 'x')
        )
      )
    )
  )
)
```

There are some interesting things:

```
(block,
  (thrice,
    (incrVar, 'x')
  ),
  (println,
    (getVar, 'x')
  )
)
```

```
(switchArray,
  'A',
  (array,
    'B',
    'A',
    'blah'
  ),
  (array,
    (func,
      (println, 'case B')
    ),
    (func,
      (println, 'A chosen')
    ),
    (func,
      (println, 'oh noes! a blah')
    )
  )
)
```

Use of date and time:

```
(forever,
  (varDump,
    (unixTimeMillis)
  )
)
```

The contents of `block` are immediately evaluated and the last returned value is returned by the whole block. In the first case the number of accessible functions (currently 213) is printed first, because the function expected by `do` doesn't print anything. The variable `x` is stored with the number value 213.
`(block, (setVar, 'x', (block, (println, (execAmount)))), (println, 'foo'), (do, (getVar, 'x'))) => 213, foo`.
In this case `(println, (execAmount))` is treated as a string and not evaluated. Only when do is called with the string given in the first block it's cast into a `func` type and then executed, which causes the number to be printed after `foo`.
`(block, (setVar, 'x', (block, '(println, (execAmount))')), (println, 'foo'), (do, (getVar, 'x'))) => foo, 213`

# Known Bugs

There are no escape sequences for strings and commas in strings are not parsed correctly at the moment. I'm preparing a GitHub project (you are here) with an improved implementation and a more usable JavaScript API.
