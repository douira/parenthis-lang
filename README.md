# The SUL Language

SUL is an esoteric programming language, this project is the interpreter for it.

I've written about SUL on the Esolang wiki [here](https://esolangs.org/wiki/SUL). This is an adaptation of that documentation.

## Introduction

The **SUL (simple unified language)** programming language consists of a very uniform syntax while still offering a good amount of features. It was created by me (douira).

The project is a continuation of an earlier implementation of SUL in Processing and will differ more or less slightly from the original.
The current version is V2, which is still occasionally being developed and expanded. It may even change enough make parts of this page wrong (unlikely though). An older version V1 exists but is not publicly available (and never will be, because it was badly programmed).
I created this language with this very simple and special syntax, because I liked the idea of an extremely uniform though still powerful syntax with a quite compact parser.
Even though programming anything bigger can produce quite long and convoluted code, you code in an almost direct representation the syntax tree that's created in most other languages behind the scenes.

## Language

### Syntax

Programs are an element containing others or a string literal. Usually a <code>block</code> is used as the topmost element in order to be able to execute several statements. There are two *things* (three if you count comments):
- An Element: (where argX is an element or a string literal too)
Elements can have none, a set number or an unlimited amount of arguments
(name, arg1, arg2, ..., argN)
- A string literal:
"any characters"
OR 'any characters'
OR "any characters' and so on...
' and " are treated equally, although using ' makes it easier to write SUL code inside a JS string.
- Comments are similar to those in JS:
code//this is a comment until the end of the line
code/_this comment can be several lines_/

Comments inside of string literals are also removed if they're valid.
- Multi-line comments can be inserted anywhere, even in function identifiers.
- Single line comments depend on line breaks and will remove anything until a line break is detected.

Not closing multi-line comments has fatal effects, because all code is removed until it's closed. 
Because whitespace (after processing of single line comments) outside of string literals is completely ignored, you can use it wherever you want.

There is currently no practical way to escape characters in strings. Therefore you will have to programmatically concatenate strings if they should form a valid comment token.

### Types

An adaptive dynamic type system is used. Functions can have none, a set or variable return type.
Any type can be (implicitly or not) cast into any other type, however some conversions are unhelpful or placeholderly.
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
  at the moment the almost same as BLOCK, both are allowed to use parameters.
  However it (func) isn't executed as soon as it's created (as it is with block).
  It's executed when called with the `do` element.
- `BOOL`  
  a boolean value that is either true or false
- `ARRAY`  
  is an arbitrarily long 0-indexed ordered collection of values that can be any of the above.

### Variables
All variables are stored (for now globally) with a unique name and their original value and type.
Creating variables with names starting with a number or some other special characters may have undesired effects depending on the JS engine.

### Packages
SUL is modular, which means that you can have a look at the existing function packages and add your own packages or package groups in the same way using <code>package.addPackage(pkg);</code>
see description of a package in <code>Package.prototype.addPackage</code>

All package names must be unique, even when they're in different sub-packages, because they're all put in one array.
For now, all packages will be in the main <code>sul</code> one.
<code>sul.lang</code> includes a lot of things such as math, control, variables, interaction, casting helpers and more,
Anything less essential than those will be in <code>sul.NAME</code>

### Other Notes
Only evaluates what is necessary, only left-hand side of <code>or</code> if it is true and similar for <code>and</code>, and only the number of arguments needed with the types needed.

Everything is parsed first without ''any'' checking for sense (except for formal syntax like function names, parentheses...).
''Then'' evaluated when needed, a single code element can be evaluated several times when in a loop.
Order of calling is not always guaranteed! i.e. Arguments for a function may not be called in the order they are given.
Function names are part of the syntax, because they can't be created from inside the code and are (mostly) fixed for the whole program.

Functions tagged with <code>OK</code> in the sul packages are tested and most likely to work, though maybe not exactly as expected... ;-P

### Implementation

Currently the most up-to-date interpreter of SUL is written in JavaScript and resides in this KhanAcademy project: [https://www.khanacademy.org/computer-programming/sul-v2-an-esoteric-programming-language/4555641989431296] Hopefully I'll get around to putting this somewhere better sometime.

### Examples

Here are some examples and the results they give.

Hello World

```
(println, 'Hello World!')
```

A multitude of mathematical operations can be performed on numbers. Most of these are identical to those in JavaScripts's <code>Math.</code>

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

There are lots of unusual things:

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

The contents of <code>block</code> are immediately evaluated and the last returned value is returned by the whole block. In the first case the number of accessible functions (currently 213) is printed first, because the function expected by <code>do</code> doesn't print anything. The variable <code>x</code> is stored with the number value 213.
(block, (setVar, 'x', (block, (println, (execAmount)))), (println, 'foo'), (do, (getVar, 'x'))) => 213, foo
In this case <code>(println, (execAmount))</code> is treated as a string and not evaluated. Only when do is called with the string given in the first block it's cast into a <code>func</code> type and then executed, which causes the number to be printed after "foo".
(block, (setVar, 'x', (block, '(println, (execAmount))')), (println, 'foo'), (do, (getVar, 'x'))) => foo, 213

### Known Bugs

There are no escape sequences for strings and commas in strings are not parsed correctly at the moment. I'm preparing a GitHub project (you are here) with an improved implementation and a more usable JavaScript API.
