 * SUL stands for Simple Unified Language
 * I declare this as Version 2.
 *
 * ----INTRODUCTION----
 * This project is a continuation of an earlier implementation of SUL in Processing.
 * This version will differ more or less slightly from the original.
 * (Not that anyone will compare...)
 * Effectively this will be a improved superset (subset?) of the original.
 * I created this language with this very simple and special syntax, because I liked the idea of
 * an extremly uniform though still powerfull syntax with a quite compact parser.
 * Even though making anything bigger can produce quite long and convoluted code,
 * you code almost directly in the syntax tree that's created in most other languages behind the scenes.
 *
 *
 * ----SYNTAX----
 * Programs are an element containing others or a string literal.
 * Usually a "block" is used as the topmost element to be able to execute several statements
 * An Element: (where argX is an element too or a string literal)
 * Elements can have none, a set number or an unlimited amount of arguments
 *      (name, arg1, arg2, ..., argN)
 * A String literal:
 *      "any characters"
 *  OR  'any characters'
 *  OR  "any characters' and so on...
 * ' and " are treated equally, although using ' makes it easier to write SUL code inside a JS string.
 * Comments are similar to those in JS:
 *      <code>//this is a comment until the end of the line
 *      <code>/*this comment can be several lines*/
/**
 * Comments inside of string literals are also removed if they're valid.
 * Multi-line comments can be inserted anywhere, even in function identifiers.
 * Single line comments depend on linebreaks and will remove anything until a linebreak is detected.
 * Not closing multi-line comments has fatal effects, because all code is removed until it's closed.
 * Because whitespace (after processing of single line comments) outside of string literals is completely ignored, you can use it whereever you want.
 * There is currently no practical way to escape characters in strings.
 * Therefore you will have to programmaticaly concatenate strings if they should form a valid comment token.
 *
 * ----TYPES----
 * An adaptive dynamic type system is used. Functions can have none, a set or variable return type.
 * Any type can be (implicitly or not) cast into any other type, however some conversions are unhelpful or placeholderly.
 * Attempting to use a value where none is present will give an null value.
 * Type checking and type errors aren't normally used, because all types can be converted into each other.
 * Regular equality will convert the second value into the type of the first one and compare then.
 * When checking for strict equality type errors can happen though.
 * If the parent element doesn't use the return value of an argument nothing special will happen.
 * Some special elements execute/evaluate their arguments without using their values.
 * The available types are:
 * NULL
 * a nonexistant value
 * NUM
 * a JS-compliant number
 * STRING
 * any length series of characters
 * BLOCK
 * any number of statements that will be executed in order
 * FUNC
 * at the moment the almost same as BLOCK, both are allowed to use parameters.
 * However it (func) isn't executed as soon as it's created (as it is with block).
 * It's executed when called with "do"
 * BOOL
 * a boolean value that is either true or false
 * ARRAY
 * any length 0-indexed ordered collection of values that can be any of the above
 *
 * ----VARIABLES----
 * All variables are stored (for now globally) with a unique name and their original value and type.
 * Creating variables with names starting with a number or some other special characters may have undesired effects depending on the JS engine.
 *
 * ----PACKAGES----
 * SUL is modular, which means that you can have a look at the existing function packages and add your own packages or package groups in the same way using
 * package.addPackage(pkg);
 * see description of a package in Package.prototype.addPackage
 * All package names must be unique, even when they're in different sub-packages, because they're all put in one array.
 * For now, all packages will be in the main "sul" one.
 * sul.lang includes a lot of things such as math, control, variables, interaction, casting helpers and more,
 * Anything less essnetial than those will be in sul.<name>
 *
 * ----IMPORTANT NOTES----
 * Only evaluates what is necessary, only left hand side of || if it is true and similar for &&, and only the number of arguments needed with the types needed
 * Everything is parsed first without ANY checking for sense (except of formal syntax like function names, parentheses...).
 * THEN evauluted when needed, a single code element can be evauluated several times when in a loop.
 * Order of calling is not always guaranteed! i.e. Arguments for a function may not be called in the order they are given.
 * Function names are part of the syntax, because they can't be created from inside the code and are (mostly) fixed for the whole program.
 * Functions tagged with 'OK' in the sul packages are tested and most likely to work, though maybe not exactly as expected... ;-P
 *
 * ----QUIRKS----
 * These two programs execute very differently because of casting back and forth:
 * (block, (setVar, 'x', (block, (println, (execAmount)))), (println, 'foo'), (do, (getVar, 'x')))
 * (block, (setVar, 'x', (block, '(println, (execAmount))')), (println, 'foo'), (do, (getVar, 'x')))
