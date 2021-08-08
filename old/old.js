//See the original docs in OLD-DOCS.md

//OPTIONAL INPUT
let runArgs = [] //array of strings for program argument input (can be accessed from inside the program)

//PUT CODE HERE
let programCode =
  "(block, (setVar, 'x', (block, '(println, (execAmount))')), (println, 'foo'), (do, (getVar, 'x')))" //"(ifElseIfElse, (false), (println, 'foo'), (false), (println, 'bar'), (println, 'baz'))"; //"(for, (setVar, 'x', '3'), (less, (getVar, 'x'), '6'), (incrVar, 'x'), (println, 'g'))"; //"(block, (until, (less, (getVar, 'x'), '6'), (incrVar, 'x')), (println, (getVar, 'x')))"; //"(block,(varDump,(fullCodeLength, 'execExists', (execAmount))))"; //"(switchArray,'A',(array,'B','A','blah'),(array,(func,(println, 'case B')),(func,(println, 'A chosen')),(func,(println, 'oh noes! a blah'))))"; //"(block,(thrice,(incrVar, 'x')),(println,(getVar, 'x')))"; //(block,(setVar, 'x', '0'),(countedLoop,'10',(block,(incrVar, 'x'),(println, (strConcat, 'iteration Nr. ',(getVar, 'x'))))))";

//data
let packages //later filled with all function elements of the SUL language
let variables //stores variables referenced by a variable name key, manager object
let keys = [] //currently pressed keys
let keyPressAmount = 0 //counts amount of keys pressed
let stop = false //if true then program will stop
let programTimer = 0 //times program execution time, normally 0 in fast processed programs
let canvasLog = "" //if enabled, messages will be printed to this and then put on the canvas
//settings/constants
let minLength = 10 //minimum length requirement for all programs
let maxDepth = 30 //maximum parse depth of program elements (function recursion depth depends on JS engine...)
let verboseLogging = true //if true additional (base program) messages will be printed to console
let printEval = false //if true a message will be printed for each function call, can cause console lag or even crash things if too much activity in program
let printParse = true //if true a message for each parsing step will be printed, normally doesn't cause much strain unless given file is huge
let printPkg = false //prints all exec functions with their package paths
let printPkgNameClashes = true //will print a warning if an existing exec function was overwritten
let printOnCanvas = true //if set to true messages will be printed on the canvas as text
let printInConsole = false //set to true to enable printign of messages in processing console
let printToDebug = false //enable to print messages to browser console too
let printSize = 8.5 //size of text logged onto canvas
let textOffset = 10 //offset for text from border of canvas

//names of
let msgLevelIndicators = [
  "INFO",
  "WARNING",
  "ERROR",
  "DEBUG",
  "VERBOSE_LOGGING",
  "SUL_ERROR",
  "SUL_PRINT",
  "SUL_INFO",
  "SUL_WARN",
  "UNKNOWN"
]

//constant names for types of values
let types = {
  NULL: 0,
  NUM: 1,
  STRING: 2,
  BLOCK: 3,
  FUNC: 4,
  BOOL: 5,
  ARRAY: 6
}

//--functions--
//replaces the char of a string at a specific index
let replaceIndex = function(str, index, character) {
  return str.substr(0, index) + character + str.substr(index + character.length)
}
//shim Date.now if not given
if (!Date.now) {
  Date.now = function() {
    return new Date().getTime()
  }
}
//pads double digit time with 0s
let padTimeNum = function(num, oes) {
  //use deafult of 2 0s
  if (typeof oes === "undefined") {
    oes = 2
  }

  //use nf to pad with 0s, -1 for no digits on right side
  return nf(num, oes, -1)
}
//returns the current time stamp nicely formatted
let timeStamp = function() {
  //return the time with added 0s
  return (
    padTimeNum(hour()) +
    ":" +
    padTimeNum(minute()) +
    ":" +
    padTimeNum(second()) +
    "." +
    padTimeNum(Date.now() % 1000, 3)
  ) //millis in current second
}
//returns a precise unix time time stamp
let preciseTimeStamp = function() {
  //get current date for timestamp
  let d = new Date()

  //return time stamp with millis and unix time
  return d.getTime() / 1000 + "" + millis()
}
var handleSulError //hoist declaration
//message function for printing system messages
let msg = function(level, input) {
  //add time and level indicator
  input = "[" + timeStamp() + "]" + msgLevelIndicators[level] + ":" + input

  //print it (if verbose then only if anabled)
  if ((level !== 4 || verboseLogging) && (level !== 6 || input.length > 0)) {
    //print in processing console
    if (printInConsole) {
      println(input)
    }

    //print to debug
    if (printToDebug) {
      debug(input)
    }

    //print on canvas
    if (printOnCanvas) {
      canvasLog += input + "\n"
    }
  }

  //is sul error
  if (level === 5) {
    handleSulError(input)
  }
}
//handle what happens when a sul error is produced
var handleSulError = function(message) {
  stop = true
  msg(1, "Exiting program because of a SUL error...")
}
//removes comments and checks for length (This could be improved using RegEx)
let processRaw = function(str) {
  msg(0, "Removing comments...")

  //remove single, until end of line comments
  str = join(
    programCode.split("\n").map(function(line) {
      //get comment position
      let commentPosition = line.indexOf("//")

      //return without comment
      return commentPosition === -1 ? line : line.substring(0, commentPosition)
    }),
    ""
  )

  //remove multi-line comments
  let inComment = false
  str = str
    .split("") //split into char array
    .filter(function(char, index, strArray) {
      //filter char comments
      //not at end of string and at start of comment
      if (index < strArray.length - 1 && char + strArray[index + 1] === "/*") {
        //if already in comment, warn
        if (inComment) {
          msg(
            8,
            "Starting multi-line comment in side another one at char '" +
              char +
              "' #" +
              char +
              "."
          )
        }

        //set to in commnet
        inComment = true
      }

      //end of comment, look behind to prevent parts of comment from persisting, not at beginning
      if (index >= 2 && strArray[index - 2] + strArray[index - 1] === "*/") {
        //if already in comment, warn
        if (!inComment) {
          msg(
            8,
            "Ending multi-line comment without starting one at char '" +
              char +
              "' #" +
              index +
              "."
          )
        }

        //set state to out of comment
        inComment = false
      }

      //return comment state to include or reject chars
      return !inComment
    })
    .join("") //make string again
    .trim() //remove unnecessary whitespace

  //check length, \\s is the whitespace character
  if (str.length < minLength) {
    msg(
      1,
      "The program is too short to be considered legal. (below " +
        minLength +
        " characters) Replacing program with (_template)."
    )
    str = "(_template)"
  }

  return str
}
//returns an array filled with the given value
let filledArray = function(value, amount) {
  //new array to return
  let arr = []

  //convert to 32bit unsigned int
  amount = amount >>> 0

  //until full
  while (arr.length < amount) {
    //add value again
    arr.push(value)
  }

  //return filled array
  return arr
}
//function that returns null (for casting into null type, for whatever reason)
let toNull = function() {
  return null
}
//calculates the gcd of two numbers (should be converted to int first)
var gcd = function(a, b) {
  return b ? gcd(b, a % b) : a
}
//calculates the lcm of two numbers (should be converted to int first)
let lcm = function(a, b) {
  return Math.abs(a * b) / gcd(a, b)
}
//checks if the first char of a given string is a double or single quotes
let firstIsQuote = function(str) {
  //allows for " and ' mixed
  return str[0] === '"' || str[0] === "'"
}
//adds a char to the lastelement of an array
let addArgChar = function(array, char) {
  //add string to last index
  if (array && array.length > 0) {
    array[array.length - 1] += char
  }
  return array
}

//--classes--
//class that manages packages of execution functions
let Packages = function() {
  //array of all functions that can be used in elements
  this.elementFunctions = {}

  //counts number of elements added
  this.amount = 0
}
//adds a package of execution functions to the available functions
Packages.prototype.addPackage = function(pkg, prefix) {
  //a package is of the format:
  /*
    {
        functionName1: function() {
            <place function body here>
            can access this.val.set<typeName> methods to return a value
            parameter value objects are in this.params
            get values from numbered arguments with this.argVal(types.TYPE)
            check further metods of Element and where else for more low level operations
            such as setting variables and direct executions and so on.
        },
        functionName2: function() {
        ...
        
        You can group packages by putting them into an any hierarchy og objects.
        Any functions will be imported.
        Objects will be recursively checked in the same manner.
        Properties starting with "_" will be ignored.
    }
    */
  //set prefix empty if not given
  if (printPkg && typeof prefix === "undefined") {
    prefix = "sul"
  }

  //for all properties
  for (let propName in pkg) {
    //if not starting with _
    if (propName[0] !== "_") {
      //get property to import
      let importProp = pkg[propName]

      //is a group by checking if it's a function
      if (typeof importProp === "function") {
        //print warning on overwriting is enabled
        if (
          printPkgNameClashes &&
          this.elementFunctions.hasOwnProperty(propName)
        ) {
          msg(8, "Duplicate at " + prefix + "." + propName)
        }

        //overriding is a feature
        //new packages can override functionality of older ones
        this.elementFunctions[propName] = pkg[propName]

        //increment counter
        this.amount++

        //print if enabled
        if (printPkg) {
          msg(7, prefix + "." + propName)
        }
      } else {
        //not function
        //process inner package (or package group)
        this.addPackage(pkg[propName], prefix + "." + propName)
      }
    }
  }
}
//removes an exec function
Packages.prototype.removeExec = function(name) {
  //delete reference
  delete this.elementFunctions[name]

  this.amount--
}
//returns a exec function with the given name
Packages.prototype.getExecFunction = function(name) {
  //if it exists
  if (this.elementFunctions.hasOwnProperty(name)) {
    //return corresponding function
    return this.elementFunctions[name]
  } else {
    //doesn't exist, return null to signal error
    return null
  }
}

//I think we need to define this here so the definition of Value is satisfied?
let Element

//Value class represents a value that can be passed around
let Value = function(fromFunctionTemp) {
  //value of this object, can be converted if possible
  this.value = undefined

  //type of value held
  this.type = types.NULL

  //name of function this value came from
  this.fromFunction =
    typeof fromFunctionTemp === "undefined" ? "UNKNOWN" : fromFunctionTemp
}
//type conversion, supply arrays of functions that take the raw value and convert to the type that array is for
Value.typeConverters = [
  //to types:
  //0: to NULL
  filledArray(function() {
    return null
  }, types.length), //always returns null
  //1: to NUM
  [
    //from:
    function() {
      return 0
    }, //NULL
    function(num) {
      return num
    }, //NUM
    function(str) {
      return parseFloat(str)
    }, //STRING
    function(block) {
      return block.exec().getVal(types.NUM)
    }, //BLOCK
    function(func) {
      return func.exec().getVal(types.NUM)
    }, //FUNC
    function(bool) {
      return bool ? 1 : 0
    }, //BOOL
    function(array) {
      return array[0].getVal(types.NUM)
    } //ARRAY
  ],
  //2: to STRING
  [
    //from:
    function() {
      return ""
    }, //NULL
    function(num) {
      return num.toString()
    }, //NUM
    function(str) {
      return str
    }, //STRING
    function(block) {
      return block.fullCode
    }, //BLOCK
    function(func) {
      return func.fullCode
    }, //FUNC
    function(bool) {
      return bool ? "true" : "false"
    }, //BOOL
    function(array) {
      return "[" + join(Value.toStringArray(array), ",") + "]"
    } //ARRAY
  ],
  //3: to BLOCK
  [
    //from:
    function() {
      return new Element("(block)")
    }, //NULL
    function(num) {
      return new Element("(block)")
    }, //NUM
    function(str) {
      return new Element(str)
    }, //STRING
    function(block) {
      return block
    }, //BLOCK
    function(func) {
      return func.setFunctionName("block")
    }, //FUNC
    function(bool) {
      return new Element("(block)")
    }, //BOOL
    function(array) {
      return array[0].getVal(types.BLOCK)
    } //ARRAY
  ],
  //4: to FUNC
  [
    //from:
    function() {
      return new Element("(func)")
    }, //NULL
    function(num) {
      return new Element("(func)")
    }, //NUM
    function(str) {
      return new Element(str)
    }, //STRING
    function(block) {
      return block.setFunctionName("func")
    }, //BLOCK
    function(func) {
      return func
    }, //FUNC
    function(bool) {
      return new Element("(func)")
    }, //BOOL
    function(array) {
      return array[0].getVal(types.FUNC)
    } //ARRAY
  ],
  //5: to BOOL
  [
    //from:
    function() {
      return false
    }, //NULL
    function(num) {
      return num === 0 ? false : true
    }, //NUM
    function(str) {
      return str.length > 0
    }, //STRING
    function(block) {
      return block.exec().getVal(types.BOOL)
    }, //BLOCK
    function(func) {
      return func.exec().getVal(types.BOOL)
    }, //FUNC
    function(bool) {
      return bool
    }, //BOOL
    function(array) {
      return array[0].getVal(types.BOOL)
    } //ARRAY
  ],
  //6: to ARRAY
  [
    //from:
    function() {
      return []
    }, //NULL
    function(num) {
      return [num]
    }, //NUM
    function(str) {
      return [str]
    }, //STRING
    function(block) {
      return [block]
    }, //BLOCK
    function(func) {
      return [func]
    }, //FUNC
    function(bool) {
      return [bool]
    }, //BOOL
    function(array) {
      return array
    } //ARRAY
  ]
]
//returns the name of a given type id
Value.typeName = function(typeId) {
  //reverse lookup the name of the given typeId
  return Object.keys(types).find(function(key, i, obj) {
    return types[key] === typeId
  })
}
//converts a type name to a type id
Value.typeId = function(typeName) {
  //simple lookup in types
  return types[typeName]
}
//makes a new value with a given value and type
Value.createValue = function(value, useType) {
  //create new value
  let newValue = new Value()

  //give value
  newValue.setValue(value, useType)

  //return created value
  return newValue
}
//converts a value array into string converted values
Value.toStringArray = function(val) {
  return val.getVal(types.ARRAY).map(function(val) {
    return val.getVal(types.STRING)
  })
}
//non-static version of toStringArray
Value.prototype.toStringArray = function() {
  return Value.toStringArray(this)
}
//returns the type name of this value
Value.prototype.getTypeName = function() {
  //return name of own type
  return Value.typeName(this.type)
}
//converts a value using the type converters
Value.prototype.convert = function(value, fromType, toType) {
  //call type converter that converts value from given to desired type
  return Value.typeConverters[toType][fromType](value)
}
//returns the value of this element, cast into the given type if possible
Value.prototype.getVal = function(type) {
  //convert own value to desired type
  return this.convert(this.value, this.type, type)
}
//sets the from function
Value.prototype.setFromFunction = function(newFromFunction) {
  //set from function with new
  this.fromFunction = newFromFunction

  return this
}
//sets value to given value object (copies)
Value.prototype.setValueObject = function(newValueObj) {
  //set to new value and new type
  this.value = newValueObj.value
  this.type = newValueObj.type

  return this
}
//sets value using given type and optionally a type to be converted from
Value.prototype.setValue = function(newValue, newType, fromType) {
  //convert if from type given
  if (typeof fromType !== "undefined") {
    //convert to new type
    newValue = this.convert(newValue, fromType, newType)
  }

  //set new value and new type
  this.value = newValue
  this.type = newType

  return this
}
//sets value to null
Value.prototype.setNull = function() {
  this.setValue(null, types.NULL)

  return this
}
//sets value given as number
Value.prototype.setNum = function(num, fromType) {
  this.setValue(num, types.NUM, fromType)

  return this
}
//sets value given as string
Value.prototype.setString = function(str, fromType) {
  this.setValue(str, types.STRING, fromType)

  return this
}
//sets value given as block
Value.prototype.setBlock = function(block, fromType) {
  this.setValue(block, types.BLOCK, fromType)

  return this
}
//sets value given as func
Value.prototype.setFunc = function(func, fromType) {
  this.setValue(func, types.FUNC, fromType)

  return this
}
//sets value given as boolean
Value.prototype.setBool = function(bool, fromType) {
  this.setValue(bool, types.BOOL, fromType)

  return this
}
//sets value given as array
Value.prototype.setArray = function(array, fromType) {
  this.setValue(array, types.ARRAY, fromType)

  return this
}
//converts this value into the given type
Value.prototype.castInto = function(toType) {
  //get converted value
  this.value = this.getVal(toType)

  //change type
  this.type = toType
  return this
}
//checks (recursive) equality with another value, without type conversion
Value.prototype.strictEquals = function(other) {
  //if types match
  if (this.type === other.type) {
    //if array type
    if (this.type === types.ARRAY) {
      //length the same
      if (this.value.length === other.value.length) {
        //check equality on every element
        return other.every(function(otherElement, otherIndex) {
          //return if current element matches corresponding one in own array
          return otherElement.strictEquals(this.value[otherIndex])
        }, this)
      } else {
        //length mismatch
        return false
      }
    } else if (this.type === types.BLOCK || this.type === types.FUNC) {
      //executable
      //full code the same
      return this.value.fullCode === other.value.fullCode
    } else {
      //normal type
      //value the same
      return this.value === other.value
    }
  } else {
    //type mismatch
    return false
  }
}
//checks for equality that converts to own type first
Value.prototype.equals = function(other) {
  //match types
  let matchedOther = new Value().setValueObject(other).castInto(this.type)

  //if array type
  if (this.type === types.ARRAY) {
    //length the same
    if (this.value.length === other.value.length) {
      //check equality on every element
      return other.every(function(otherElement, otherIndex) {
        //return if current element matches corresponding one in own array
        return otherElement.equals(this.value[otherIndex])
      }, this)
    } else {
      //length mismatch
      return false
    }
  } else if (this.type === types.BLOCK || this.type === types.FUNC) {
    //executable
    //full code the same
    return this.value.fullCode === other.value.fullCode
  } else {
    //normal type
    //value the same
    return this.value === other.value
  }
}
//performs a value dump
Value.prototype.varDump = function() {
  //if array type
  if (this.type === types.ARRAY) {
    //call for all of array
    return (
      "{ARRAY}[" +
      this.value
        .map(function(el) {
          //get val dump of element
          return el.varDump()
        })
        .join(",") +
      "]"
    )
  } else {
    //other type
    return "{" + this.getTypeName() + "}" + this.getVal(types.STRING)
  }
}

//Element class, represents one functional function/element in the syntax tree
Element = function(input, depthAbove) {
  //arguments passed to this element as strings and parsed elements
  this.args = []
  this.argStrings = []

  //name of this element/function
  this.functionName = ""

  //increment depth of this element in the execution tree
  if (typeof depthAbove === "undefined") {
    depthAbove = 0
  }
  this.depth = depthAbove + 1

  //too low depth
  if (this.depth < 1) {
    msg(
      5,
      "Depth " +
        this.depth +
        " of created element for value too low, are all given / expected value relations correct?"
    )
  }

  //string of the code of this element (for further parsing)
  this.fullCode = input

  //parameters of this element if it's a function
  this.params = []

  //latest return value object of this element
  this.val = new Value()

  //execution function that is called to execute this element's functionality
  this.execFunction = null

  //parse given input string
  this.parse(input)
}
//gets the actual value from an argument
Element.prototype.argVal = function(index, type) {
  //get value object and then get actual value from that
  return this.argEval(index).getVal(type)
}
//gets the return value object of a given argument
Element.prototype.argEval = function(index) {
  //only return value if not stopped
  if (!stop) {
    //check if that arg exists
    if (index < this.args.length) {
      //execute it and return it's value with given type
      return this.args[index].exec(this.params).val
    } else {
      //error arg doesn't exist
      msg(
        5,
        "Not enough arguments provided for function: " + this.functionName + "!"
      )
    }
  }

  //return undefined(?) value, because it's stopped
  return new Value("STOPPED")
}
//determines and assigns an execution function from a given element name
Element.prototype.assignExecFunction = function(execFunctionName) {
  //println(this.args + " " + this.argStrings);
  //get from package manager
  this.execFunction = packages.getExecFunction(execFunctionName)

  //if doesn't exist
  if (!this.execFunction) {
    //print function doesn't exist error
    msg(5, "Function '" + execFunctionName + "' doesn't exist.")

    //set to empty to prevent js errors
    this.execFunction = function() {}
  }
}
//sets the function name and updates the exec function
Element.prototype.setFunctionName = function(name) {
  //set name string
  this.functionName = name

  //update exec function
  this.assignExecFunction(name)

  //return this for chaining
  return this
}
//parses the given input string
Element.prototype.parse = function(input) {
  this.fullCode = input

  //if literal string
  if (firstIsQuote(input)) {
    //remove quotes and add
    this.argStrings[0] = input.substring(1, input.length - 1)

    this.setFunctionName("stringLiteral")
  } else if (input[0] === "(") {
    //keeps track of paren depth to only make new arg when at top level
    let parenDepth = 0

    //true when in a string literal, all chars are added and not further processed then
    let inString = false

    //parse input into arg strings
    this.argStrings = input
      .substring(1, input.length - 1) //remove first and last paren chars
      .split("") //split into char array
      .reduce(
        function(args, char) {
          //reduce to string elements
          //check if entered string but outside before
          if (firstIsQuote(char) && !inString) {
            inString = true
          }

          //when in string
          if (inString) {
            //add chars to current arg while ignoring string contents
            addArgChar(args, char)

            //check if left string but inside before
            if (firstIsQuote(char)) {
              inString = false
            }
          } else if (char !== " ") {
            //if not whitespace, omit because not in string
            //if in top paren level and char is comma
            if (char === "," && parenDepth === 0) {
              //make new arg
              args.push("")
            } else {
              //simply add char
              //remove line breaks because not in string
              addArgChar(args, char.replace(/[\v\n\t\r\f]/, ""))
            }

            //if opening paren, increment level depth
            if (char === "(") {
              parenDepth++
            } else if (char === ")") {
              //decrement level with closing paren
              parenDepth--
            }
          }

          //return modified args
          return args
        },
        [""]
      )

    //check function identifier syntax
    if (this.argStrings[0][0].match("^[0-9]") === null) {
      //set function name as first element
      this.setFunctionName(this.argStrings[0])
    } else {
      msg(5, "Found number at start of function identifier.")
    }

    //parse inner
    this.argStrings.forEach(function(argString, index) {
      //not with function name
      if (index) {
        let firstChar = argString[0]
        //if a function call or a literal
        if (firstChar === "(" || firstIsQuote(firstChar)) {
          //syntax can't be messed up because of paren depth checking,
          //or it will be caught by the next recursion

          //parse deeper arguments
          this.args.push(new Element(argString, this.depth))
        }
      }
    }, this)
  } else if (this.depth > maxDepth) {
    msg(5, "Function passing depth is too great (above " + maxDepth + ").")
  } else {
    //parser error
    msg(5, 'Expected quote or ( but found "' + input[0] + '" instead.')
    this.functionName = "ERROR"
  }
  if (printParse) {
    msg(
      7,
      "Parse L" +
        this.depth +
        ": " +
        join(this.argStrings, "--").replace(" ", "")
    )
  }

  //set function name of value
  this.val.setFromFunction(this.functionName)

  //this.argLength = this.args.length;
}
//does a cosine factor modulation
Element.prototype.cosFactorMod = function(fac) {
  return (cos(fac * 180 + 180) + 1) * 0.5
}
//calculates a color gradient
Element.prototype.multiColorGradient = function(
  factor,
  colors,
  positions,
  useCosine
) {
  factor = constrain(factor, 0, 1)
  let colorIndex = colors.length - 2
  while (factor <= positions[colorIndex]) {
    colorIndex--
  }
  factor = norm(factor, positions[colorIndex], positions[colorIndex + 1])
  if (useCosine) {
    factor = this.cosFactorMod(factor)
  }
  return lerpColor(colors[colorIndex], colors[colorIndex + 1], factor)
}
//evaluates/executes this element
Element.prototype.exec = function(paramsTemp) {
  //copy params for argEval
  this.params = typeof paramsTemp === "undefined" ? [] : paramsTemp

  //value is set to calculated value from given function of this element
  this.execFunction.call(this)

  //doesn't return value, value of this element is gotten with argEval
  return this
}

//class representing all variables a a group with methods for using them
let Variables = function() {
  //object holding all variables
  this.vars = {}

  //amount of variables stored
  this.amount = 0
}
//sets a variable, value is a actual value not object
Variables.prototype.setVarVal = function(value, type, nameString) {
  if (!this.vars.hasOwnProperty(nameString)) {
    this.vars[nameString] = Value.createValue(value, type)
  } else {
    //set value
    this.vars[nameString].setValue(value, type)
  }
  return this.vars[nameString]
}
//sets a variable using name and value object
Variables.prototype.setVar = function(value, nameString) {
  if (!this.vars.hasOwnProperty(nameString)) {
    this.vars[nameString] = value
  } else {
    //set value
    this.vars[nameString] = value
  }
  this.amount++
  return this.vars[nameString]
}
//gets value from a variable
Variables.prototype.getVar = function(defaultValue, nameString) {
  //if exists
  if (this.vars.hasOwnProperty(nameString)) {
    //get with name string
    return this.vars[nameString]
  } else {
    //doesn't exist
    //return default empty value
    return defaultValue
  }
}
//method to get number vars (used in assignment operators of variables)
Variables.prototype.getNumVar = function(nameString) {
  return this.getVar(Value.createValue(0, types.NUM), nameString).getVal(
    types.NUM
  )
}
//sets number variables
Variables.prototype.setNumVar = function(num, nameString) {
  return this.setVarVal(num, types.NUM, nameString)
}
//removes a variable
Variables.prototype.deleteVar = function(name) {
  //delete it from variables
  delete this.vars[name]
  this.amount--
  //return name
  return name
}
//assign-operates (?) a number using a given name string and callback and second number
Variables.prototype.changeNumVar = function(name, callback, secondNum) {
  return this.setNumVar(callback(this.getNumVar(name), secondNum), name)
}

//--define packages--
//all packages go in this
//" OK" added to end of descriptive comment when tested as correctly functioning
let sul = {
  //essential included language components
  lang: {
    //misc OK
    misc: {
      //execute a string as a new element, essentially like do, just without params OK
      strExec: function() {
        //execute new element created from string
        this.val = this.argVal(0, types.BLOCK).exec(this.params).val
      },
      //creates a function type value from a string without executing it OK
      strFunc: function() {
        //create new element from string and use as first arg
        this.val.setFunc(this.argVal(0, types.FUNC))
      }
    },
    //constants, non mathematical OK
    const: {
      //returns true OK
      true: function() {
        this.val.setBool(true)
      },
      //returns false OK
      false: function() {
        this.val.setBool(false)
      }
    },
    //control flow
    control: {
      //loops OK
      loop: {
        //does something twice OK
        twice: function() {
          this.argEval(0)
          this.val = this.argEval(0)
        },
        //does something three times OK
        thrice: function() {
          this.argEval(0)
          this.argEval(0)
          this.val = this.argEval(0)
        },
        //loops the specified amount of times OK
        countedLoop: function() {
          //get loop counter
          let count = abs(this.argVal(0, types.NUM))

          //loop until 0
          while (count > 0) {
            //execute statement
            this.val = this.argEval(1)

            //decrement counter
            count--
          }
        },
        //do while loop (at least once) OK
        doWhile: function() {
          //do while first arg is true
          do {
            //exec the second one
            this.val = this.argEval(1)
          } while (this.argVal(0, types.BOOL))
        },
        //while loop OK
        while: function() {
          //while first arg is true
          while (this.argVal(0, types.BOOL)) {
            //exec the second one
            this.val = this.argEval(1)
          }
        },
        //do until loop (at least once) OK
        doUntil: function() {
          //while not first arg is true
          do {
            //exec the second one
            this.val = this.argEval(1)
          } while (!this.argVal(0, types.BOOL))
        },
        //until loop OK
        until: function() {
          //while not first arg is true
          while (!this.argVal(0, types.BOOL)) {
            //exec the second one
            this.val = this.argEval(1)
          }
        },
        //for as triple part OK
        for: function() {
          for (this.argEval(0); this.argVal(1, types.BOOL); this.argEval(2)) {
            this.val = this.argEval(3)
          }
        },
        //non ending loop OK
        forever: function() {
          while (true) {
            this.argEval(0)
          }
        }
      },
      //conditionals
      conditional: {
        //if OK
        if: function() {
          if (this.argVal(0, types.BOOL)) {
            this.val = this.argEval(1)
          }
        },
        //ifElse OK
        ifElse: function() {
          if (this.argVal(0, types.BOOL)) {
            this.val = this.argEval(1)
          } else {
            this.val = this.argEval(2)
          }
        },
        //ifElseIf OK
        ifElseIf: function() {
          if (this.argVal(0, types.BOOL)) {
            this.val = this.argEval(1)
          } else if (this.argVal(2, types.BOOL)) {
            this.val = this.argEval(3)
          }
        },
        //ifElseIfElse OK
        ifElseIfElse: function() {
          if (this.argVal(0, types.BOOL)) {
            this.val = this.argEval(1)
          } else if (this.argVal(2, types.BOOL)) {
            this.val = this.argEval(3)
          } else {
            this.val = this.argEval(4)
          }
        },
        //switchArray
        switchArray: function() {
          let value = this.argEval(0)
          let matchValues = this.argVal(1, types.ARRAY)

          //0 is value to check, 2 is execution statements
          let execs = this.argVal(2, types.ARRAY)

          //length match
          if (execs.length === matchValues.length) {
            //find match
            let exec = execs.find(function(func, index) {
              return matchValues[index].equals(value)
            })

            //if match found
            if (exec !== undefined) {
              //execute statement
              this.val = exec.getVal(types.FUNC).exec(this.params)
            } else if (this.args.length >= 4) {
              //default
              this.val = this.argEval(3)
            }
          }
        },
        //switch with arg list
        switchList: function() {
          let value = this.argEval(0)
          let index = 2
          let foundMatch = false

          //until matching value or end of array found
          while (index + 1 < this.args.length && !foundMatch) {
            //check match
            foundMatch = this.argEval(index).equals(value)

            //increment if found no match
            index += foundMatch ? 0 : 2
          }

          //match found
          if (foundMatch) {
            this.val = this.argEval(index + 1)
          } else {
            //do default
            this.val = this.argEval(1)
          }
        }
      }
    },
    //types OK, but partially strange
    types: {
      //null placeholder for unused args OK
      null: function() {
        //returns null
        this.val.setNull()
      },
      //string literal OK
      stringLiteral: function() {
        this.val.setString(this.argStrings[0])
      },
      //makes block from args and executes OK, but strange
      block: function() {
        //execute all
        for (let index in this.args) {
          this.val = this.argEval(index)
        }

        debug(this.val)
      },
      //func returns first arg as func value and doesn't execute OK, but strange
      func: function() {
        //does not execute when used in eval!
        //must be cast into block, which changes functionName to block which does execute in eval

        //return first arg as func value
        this.val.setFunc(this.args[0])
      },
      //parses any number to and int using a radix OK
      num: function() {
        this.val.setNum(
          parseInt(this.argVal(0, types.STRING), this.argVal(1, types.NUM))
        )
      },
      //int parses an int instead of a float OK
      int: function() {
        this.val.setNum(parseInt(this.argVal(0, types.STRING), 10))
      },
      //same as implicit casting OK
      float: function() {
        this.val.setNum(this.argVal(0, types.NUM))
      },
      //same as implicit casting OK
      string: function() {
        this.val.setString(this.argVal(0, types.STRING))
      },
      //puts all given args into an array OK
      array: function() {
        //map to eval each one
        this.val.setArray(
          this.args.map(function(arg, index) {
            return this.argEval(index)
          }, this)
        )
      },
      //same as implicit casting OK
      bool: function() {
        this.val.setBool(this.argVal(0, types.BOOL))
      },
      //type utilities OK
      util: {
        //returns the type of a value given OK
        typeof: function() {
          this.val.setString(this.argEval(0).getTypeName())
        },
        //casts into block OK
        blockCast: function() {
          this.val.setBlock(this.argVal(0, types.BLOCK))
        },
        //casts into func OK
        funcCast: function() {
          this.val.setFunc(this.argVal(0, types.FUNC))
        },
        //gets the type id OK
        typeId: function() {
          this.val.setNum(this.argEval(0).type)
        },
        //converts a type id to a type name OK
        toTypeName: function() {
          this.val.setString(Value.typeName(this.argVal(0, types.NUM)))
        },
        //check if a value is a given type OK
        checkType: {
          //checks if value is of type NULL OK
          isNull: function() {
            this.val.setBool(this.argEval(0).type === types.NULL)
          },
          //checks if value is of type NUM OK
          isNum: function() {
            this.val.setBool(this.argEval(0).type === types.NUM)
          },
          //checks if value is of type STRING OK
          isString: function() {
            this.val.setBool(this.argEval(0).type === types.STRING)
          },
          //checks if value is of type BLOCK OK
          isBlock: function() {
            this.val.setBool(this.argEval(0).type === types.BLOCK)
          },
          //checks if value is of type FUNC OK
          isFunc: function() {
            this.val.setBool(this.argEval(0).type === types.FUNC)
          },
          //checks if value is of type BOOL OK
          isBool: function() {
            this.val.setBool(this.argEval(0).type === types.BOOL)
          },
          //checks if value is of type ARRAY OK
          isArray: function() {
            this.val.setBool(this.argEval(0).type === types.ARRAY)
          }
        }
      }
    },
    //environment interaction
    env: {
      //printing things OK
      print: {
        //print with SUL_PRINT OK
        println: function() {
          msg(6, this.argVal(0, types.STRING))
        },
        //print a variable dump including type info OK
        varDump: function() {
          msg(6, this.argEval(0).varDump())
        }
      },
      //(user or external) input
      input: {
        //user input, hard to test
        user: {
          //mouse interaction
          mouse: {
            //current mouse x position OK
            mouseX: function() {
              this.val.setNum(mouseX)
            },
            //current mouse y position OK
            mouseY: function() {
              this.val.setNum(mouseY)
            },
            //current mouse position as array OK
            mousePos: function() {
              //set with created array of both coordinates
              this.val.setArray([
                Value.createValue(mouseX, types.NUM),
                Value.createValue(mouseY, types.NUM)
              ])
            },
            //last x mouse position OK
            lastMouseX: function() {
              this.val.setNum(pmouseX)
            },
            //last y mouse position OK
            lastMouseY: function() {
              this.val.setNum(pmouseY)
            },
            //last mouse position as array OK
            lastMousePos: function() {
              //set with created array of both coordinates
              this.val.setArray([
                Value.createValue(pmouseX, types.NUM),
                Value.createValue(pmouseY, types.NUM)
              ])
            },
            //delta mouse position
            deltaMousePos: function() {
              this.val.setArray([
                Value.createValue(mouseX - pmouseX, types.NUM),
                Value.createValue(mouseY - pmouseY, types.NUM)
              ])
            },
            //if mouse is pressed OK
            mousePressed: function() {
              this.val.setBool(mouseIsPressed)
            },
            //returns id with mouse button pressed
            mouseButton: function() {
              let buttonId = -1
              switch (mouseButton) {
                case LEFT:
                  buttonId = 0
                  break
                case CENTER:
                  buttonId = 1
                  break
                case RIGHT:
                  buttonId = 2
                  break
              }
              this.val.setNum(buttonId)
            },
            //true when left mouse button is pressed
            leftButtonPressed: function() {
              this.val.setBool(mouseIsPressed && mouseButton === LEFT)
            },
            //true when center mouse button is pressed
            centerButtonPressed: function() {
              this.val.setBool(mouseIsPressed && mouseButton === CENTER)
            },
            //true when right mouse button is pressed
            rightButtonPressed: function() {
              this.val.setBool(mouseIsPressed && mouseButton === RIGHT)
            }
          },
          //keyboard interaction
          keyboard: {
            //last pressed key
            lastKey: function() {
              this.val.setNum(key.code)
            },
            //last key as string
            lastKeyString: function() {
              this.val.setString(key.toString())
            },
            //last coded key
            lastCodedKey: function() {
              this.val.setNum(keyCode)
            },
            //if a key is being pressed
            keyPressed: function() {
              this.val.setBool(keyIsPressed)
            },
            //array with boolean for each key if pressed or not
            keyPressArray: function() {
              this.val.setArray(
                keys.map(function(el) {
                  //create bool values
                  return Value.createValue(el, types.BOOL)
                })
              )
            },
            //returns if the key with given id is pressed
            keyIdPressStatus: function() {
              this.val.setBool(keys[this.argVal(0, types.NUM)])
            },
            //amount of pressed keys
            keyPressedAmount: function() {
              //return value of env counter
              this.val.setNum(keyPressAmount)
            }
          }
        },
        //runArgs input OK
        runArgs: {
          //run-arguments given to program OK
          runArgs: function() {
            //return as array of strings
            this.val.setArray(
              runArgs.map(function(arg) {
                //make a new string value
                return Value.createValue(arg, types.STRING)
              })
            )
          },
          //if any run args were passed OK
          runArgsPresent: function() {
            this.val.setBool(runArgs.length > 0)
          },
          //amount of run args present OK
          runArgsAmount: function() {
            this.val.setNum(runArgs.length)
          },
          //returns the run args as a bool array OK
          runArgsBoolArray: function() {
            this.val.setArray(
              runArgs.map(function(arg) {
                //make a new bool value
                return Value.createValue(arg, types.STRING).castInto(types.BOOL)
              })
            )
          },
          //returns the run args as a number array OK
          runArgsNumArray: function() {
            this.val.setArray(
              runArgs.map(function(arg) {
                //make a new num value
                return Value.createValue(arg, types.STRING).castInto(types.NUM)
              })
            )
          }
        },
        //env data sources OK
        data: {
          //millis since start of environment OK
          millis: function() {
            this.val.setNum(millis())
          },
          //millis since start of this program OK
          programTime: function() {
            this.val.setNum(millis() - programTimer)
          }
          //further data sources here, if they can be acquired in some way (KA prohibits this mostly though)
        },
        //gets time data OK
        timeData: {
          //current second OK
          second: function() {
            this.val.setNum(second())
          },
          //current minute OK
          minute: function() {
            this.val.setNum(minute())
          },
          //current hour OK
          hour: function() {
            this.val.setNum(hour())
          }
        },
        //gets date data OK
        dateData: {
          //current day in month OK
          day: function() {
            this.val.setNum(day())
          },
          //current month in year OK
          month: function() {
            this.val.setNum(month())
          },
          //current year OK
          year: function() {
            this.val.setNum(year())
          },
          //unix time in millis OK
          unixTimeMillis: function() {
            this.val.setNum(Date.now())
          },
          //unix time in seconds OK
          unixTime: function() {
            this.val.setNum(Math.floor(Date.now() / 1000))
          }
        }
      }
    },
    //reflection enables element and packages level access OK
    reflect: {
      //can access packages OK
      packages: {
        //gets number of installed execs OK
        execAmount: function() {
          this.val.setNum(packages.amount)
        },
        //get list of all installed execs OK
        allExecs: function() {
          //get all keys of elementFunctions
          this.val.setArray(
            Object.keys(packages.elementFunctions).map(function(name) {
              //convert to string value
              return Value.createValue(name, types.STRING)
            })
          )
        },
        //checks if a particular exec function exists OK
        execExists: function() {
          //check if has property
          this.val.setBool(
            packages.elementFunctions.hasOwnProperty(
              this.argVal(0, types.STRING)
            )
          )
        }
      },
      //accesses element OK
      element: {
        //get number of arguments passed to this element, can't really think of a case where this could be useful OK
        argNum: function() {
          this.val.setNum(this.args.length)
        },
        //gets full code of itself OK
        fullCode: function() {
          this.val.setString(this.fullCode)
        },
        //returns a string array of the full code of all given arguments OK
        fullCodeArray: function() {
          this.val.setArray(
            this.args.map(function(arg) {
              //get full code and put in string value object
              return Value.createValue(arg.fullCode, types.STRING)
            })
          )
        },
        //returns the length of the full code of this element OK
        fullCodeLength: function() {
          this.val.setNum(this.fullCode.length)
        }
      }
    },
    //does all kinds of math (also other things concerning numbers)
    math: {
      //performs arithmetics
      arithmetic: {
        //sum of two numbers
        add: function() {
          this.val.setNum(this.argVal(0, types.NUM) + this.argVal(1, types.NUM))
        },
        //difference between two numbers
        sub: function() {
          this.val.setNum(this.argVal(0, types.NUM) - this.argVal(1, types.NUM))
        },
        //product of two numbers
        mult: function() {
          this.val.setNum(this.argVal(0, types.NUM) * this.argVal(1, types.NUM))
        },
        //quotient of two numbers
        div: function() {
          //to make sure last one isn't 0
          let d = this.argVal(1, types.NUM)
          this.val.setNum(d === 0 ? 0 : this.argVal(0, types.NUM) / d)
        },
        //modulus of two numbers
        mod: function() {
          //to make sure last one isn't 0
          let d = this.argVal(1, types.NUM)
          this.val.setNum(d === 0 ? 0 : this.argVal(0, types.NUM) % d)
        },
        //increments a number
        incr: function() {
          this.val.setNum(this.argVal(0, types.NUM) + 1)
        },
        //decrements a number
        decr: function() {
          this.val.setNum(this.argVal(0, types.NUM) - 1)
        },
        //unary negation
        negate: function() {
          this.val.setNum(-this.argVal(0, types.NUM))
        }
      },
      //bitwise operators
      bitwise: {
        //performs a left shift
        leftShift: function() {
          this.val.setNum(
            this.argVal(0, types.NUM) << floor(this.argVal(1, types.NUM))
          )
        },
        //performs a right shift
        rightShift: function() {
          this.val.setNum(
            this.argVal(0, types.NUM) >> floor(this.argVal(1, types.NUM))
          )
        },
        //performs an unsigned right shift (zerofill)
        unsigRightShift: function() {
          this.val.setNum(
            this.argVal(0, types.NUM) >>> floor(this.argVal(1, types.NUM))
          )
        },
        //converts into an unsigned 32bit into by doing a >>>0
        to32Int: function() {
          this.val.setNum(this.argVal(0, types.NUM) >>> 0)
        },
        //bitwise AND
        bitAnd: function() {
          this.val.setNum(this.argVal(0, types.NUM) & this.argVal(1, types.NUM))
        },
        //bitwise OR
        bitOr: function() {
          this.val.setNum(this.argVal(0, types.NUM) | this.argVal(1, types.NUM))
        },
        //bitwise XOR
        bitXor: function() {
          this.val.setNum(this.argVal(0, types.NUM) ^ this.argVal(1, types.NUM))
        },
        //bitwise NOT (inversion)
        bitNot: function() {
          this.val.setNum(~this.argVal(0, types.NUM))
        },
        //bitwise NOR
        bitNor: function() {
          this.val.setNum(
            ~(this.argVal(0, types.NUM) | this.argVal(1, types.NUM))
          )
        },
        //bitwise NAND
        bitNand: function() {
          this.val.setNum(
            ~(this.argVal(0, types.NUM) & this.argVal(1, types.NUM))
          )
        },
        //bitwise XNOR
        bitXnor: function() {
          this.val.setNum(
            ~(this.argVal(0, types.NUM) ^ this.argVal(1, types.NUM))
          )
        }
      },
      //more complicated math (great name, I know...)
      higher: {
        //exponentiation
        pow: function() {
          this.val.setNum(
            Math.pow(this.argVal(0, types.NUM), this.argVal(1, types.NUM))
          )
        },
        //base logarithm
        logBase: function() {
          this.val.setNum(
            Math.log(Math.abs(this.argVal(0, types.NUM))) /
              Math.log(Math.abs(this.argVal(1, types.NUM)))
          )
        },
        //natural base-e logarithm
        logNat: function() {
          this.val.setNum(Math.log(Math.abs(this.argVal(0, types.NUM))))
        },
        //base 10 logarithm
        log10: function() {
          this.val.setNum(Math.log10(Math.abs(this.argVal(0, types.NUM))))
        },
        //binary base 2 logarithm
        log2: function() {
          this.val.setNum(Math.log2(Math.abs(this.argVal(0, types.NUM))))
        },
        //raises e to the n
        exp: function() {
          this.val.setNum(Math.exp(this.argVal(0, types.NUM)))
        },
        //the square
        sq: function() {
          this.val.setNum(Math.sq(this.argVal(0, types.NUM)))
        },
        //the cube
        cubed: function() {
          this.val.setNum(Math.pow(this.argVal(0, types.NUM), 3))
        },
        //the square root
        sqrt: function() {
          this.val.setNum(Math.sqrt(this.argVal(0, types.NUM)))
        },
        //the cubic root
        cubeRoot: function() {
          this.val.setNum(Math.cbrt(this.argVal(0, types.NUM)))
        },
        //absolute value
        abs: function() {
          this.val.setNum(Math.abs(this.argVal(0, types.NUM)))
        },
        //does clz32
        clz32: function() {
          this.val.setNum(Math.clz32(this.argVal(0, types.NUM)))
        },
        //calculates the euclidean diagonal distance of a n-dimensional coordinate set
        hypot: function() {
          //apply-call with args mapped to numbers
          this.val.setNum(
            Math.hypot.apply(
              this,
              this.args.map(function(arg) {
                //make number
                return this.argVal(0, types.NUM)
              })
            )
          )
        },
        //C-like 32-bit multiplication
        imul: function() {
          this.val.setNum(
            Math.imul(this.argVal(0, types.NUM), this.argVal(1, types.NUM))
          )
        },
        //sign function
        signum: function() {
          this.val.setNum(Math.sign(this.argVal(0, types.NUM)))
        },
        //natural logarithm plus one
        log1p: function() {
          this.val.setNum(Math.log1p(this.argVal(0, types.NUM)))
        }
      },
      //does different form of bounding
      bound: {
        //floors a value in the direction of 0
        floor: function() {
          this.val.setNum(Math.floor(this.argVal(0, types.NUM)))
        },
        //floors a value away from 0
        ceil: function() {
          this.val.setNum(Math.ceil(this.argVal(0, types.NUM)))
        },
        //rounds a value
        round: function() {
          this.val.setNum(Math.round(this.argVal(0, types.NUM)))
        },
        //simply removes the decimal part
        truncate: function() {
          this.val.setNum(Math.trunc(this.argVal(0, types.NUM)))
        },
        //rounds a value to the nearest single-precision float value
        fround: function() {
          this.val.setNum(Math.fround(this.argVal(0, types.NUM)))
        },
        //gives the higher of two numbers
        max: function() {
          this.val.setNum(
            Math.max(this.argVal(0, types.NUM), this.argVal(1, types.NUM))
          )
        },
        //gives the lower of two numbers
        min: function() {
          this.val.setNum(
            Math.min(this.argVal(0, types.NUM), this.argVal(1, types.NUM))
          )
        },
        //constrains a value within two bounds
        constrain: function() {
          this.val.setNum(
            constrain(
              this.argVal(0, types.NUM),
              this.argVal(1, types.NUM),
              this.argVal(2, types.NUM)
            )
          )
        }
      },
      //several mathematical contants
      const: {
        //pi
        pi: function() {
          this.val.setNum(Math.PI)
        },
        //tau
        tau: function() {
          this.val.setNum(2 * Math.PI)
        },
        //two pi is the same as tau
        twoPi: function() {
          this.val.setNum(2 * Math.PI)
        },
        //e
        e: function() {
          this.val.setNum(Math.E)
        },
        //natural logarithm of 10
        ln10: function() {
          this.val.setNum(Math.LN10)
        },
        //natural logarithm of 2
        ln2: function() {
          this.val.setNum(Math.LN2)
        },
        //base-10 logarithm of e
        log10e: function() {
          this.val.setNum(Math.LOG10E)
        },
        //base-2 logarithm of e
        log2e: function() {
          this.val.setNum(Math.LOG2E)
        },
        //square root of a half
        sqrtHalf: function() {
          this.val.setNum(Math.SQRT1_2)
        },
        //square root of two
        sqrt2: function() {
          this.val.setNum(Math.SQRT2)
        }
      },
      //compares values
      compare: {
        //checks that all values are the same
        allEqual: function() {
          //get the first value
          let first = this.argEval(0)

          //for all other values
          this.val.setBool(
            this.args.every(function(arg, index) {
              //return is they are the same value
              return first.equals(this.argVal(index)) || !index
            })
          )
        },
        //converting equality (type insensitive)
        equal: function() {
          this.val.setBool(this.argEval(0).equals(this.argEval(1)))
        },
        //strict equality (type sensitive)
        strictEqual: function() {
          this.val.setBool(this.argEval(0).strcitEquals(this.argEval(1)))
        },
        //greater than
        greater: function() {
          this.val.setBool(
            this.argVal(0, types.NUM) > this.argVal(1, types.NUM)
          )
        },
        //less than
        less: function() {
          this.val.setBool(
            this.argVal(0, types.NUM) < this.argVal(1, types.NUM)
          )
        },
        //greater than or equal
        greaterEqual: function() {
          this.val.setBool(
            this.argVal(0, types.NUM) >= this.argVal(1, types.NUM)
          )
        },
        //less than or equal
        lessEqual: function() {
          this.val.setBool(
            this.argVal(0, types.NUM) <= this.argVal(1, types.NUM)
          )
        },
        //true if signs are equal
        signEqual: function() {
          this.val.setBool(
            Math.sign(this.argVal(0, types.NUM)) ===
              Math.sign(this.argVal(1, types.NUM))
          )
        }
      },
      //logic operators
      logic: {
        //and
        and: function() {
          this.val.setBool(
            this.argVal(0, types.BOOL) && this.argVal(1, types.BOOL)
          )
        },
        //or
        or: function() {
          this.val.setBool(
            this.argVal(0, types.BOOL) || this.argVal(1, types.BOOL)
          )
        },
        //xor
        xor: function() {
          this.val.setBool(
            this.argVal(0, types.BOOL) !== this.argVal(1, types.BOOL)
          )
        },
        //not
        not: function() {
          this.val.setBool(!this.argVal(0, types.BOOL))
        },
        //nand
        nand: function() {
          this.val.setBool(
            !(this.argVal(0, types.BOOL) && this.argVal(1, types.BOOL))
          )
        },
        //xnor
        xnor: function() {
          this.val.setBool(
            this.argVal(0, types.BOOL) === this.argVal(1, types.BOOL)
          )
        },
        //nor
        nor: function() {
          this.val.setBool(
            !(this.argVal(0, types.BOOL) || this.argVal(1, types.BOOL))
          )
        },
        //checks that all boolean values are true
        allTrue: function() {
          this.val.setBool(
            this.args.every(function(arg, index) {
              //return bool value
              return this.argVal(index, types.BOOL)
            })
          )
        },
        //checks that all boolean values are false
        allFalse: function() {
          this.val.setBool(
            this.args.every(function(arg, index) {
              //return bool value
              return !this.argVal(index, types.BOOL)
            })
          )
        },
        //checks that all boolean values are the same
        allBoolEqual: function() {
          //get the first value
          let first = this.argVal(0, types.BOOL)

          //for all other values
          this.val.setBool(
            this.args.every(function(arg, index) {
              //return bool value
              return this.argVal(index, types.BOOL) === first || !index
            })
          )
        }
      }
    },
    //variables OK
    var: {
      //assignment operators OK
      assign: {
        //increments OK
        incrVar: function() {
          this.val = variables.changeNumVar(
            this.argVal(0, types.STRING),
            function(a, b) {
              return a + b
            },
            1
          )
        },
        //decrements OK
        decrVar: function() {
          this.val = variables.changeNumVar(
            this.argVal(0, types.STRING),
            function(a, b) {
              return a - b
            },
            1
          )
        },
        //adds to variable OK
        addVar: function() {
          this.val = variables.changeNumVar(
            this.argVal(0, types.STRING),
            function(a, b) {
              return a + b
            },
            this.argVal(1, types.NUM)
          )
        },
        //subtracts from variable OK
        subVar: function() {
          this.val = variables.changeNumVar(
            this.argVal(0, types.STRING),
            function(a, b) {
              return a - b
            },
            this.argVal(1, types.NUM)
          )
        },
        //multiplies variable OK
        multVar: function() {
          this.val = variables.changeNumVar(
            this.argVal(0, types.STRING),
            function(a, b) {
              return a * b
            },
            this.argVal(1, types.NUM)
          )
        },
        //divides variable OK
        divVar: function() {
          this.val = variables.changeNumVar(
            this.argVal(0, types.STRING),
            function(a, b) {
              return a / b
            },
            this.argVal(1, types.NUM)
          )
        },
        //modulus/remainder assignment OK
        modVar: function() {
          this.val = variables.changeNumVar(
            this.argVal(0, types.STRING),
            function(a, b) {
              return a % b
            },
            this.argVal(1, types.NUM)
          )
        }
      },
      //sets a variable OK
      setVar: function() {
        //set with given key string
        this.val = variables.setVar(
          this.argEval(1),
          this.argVal(0, types.STRING)
        )
      },
      //gets a variable OK
      getVar: function() {
        //get var name string
        let varVal = variables.getVar(false, this.argVal(0, types.STRING))

        //if exists
        if (varVal) {
          //use gotten value
          this.val = varVal
        } else {
          //doesn't exist
          //return null
          this.val.setNull()
        }
      },
      //checks if a variable exists OK
      checkVar: function() {
        this.val.setBool(
          variables.vars.hasOwnProperty(this.argVal(0, types.STRING))
        )
      },
      //gets a list of all variable names OK
      varNameList: function() {
        this.val.setArray(
          Object.keys(variables.vars).map(function(name) {
            //return key value with name
            return Value.createValue(name, types.STRING)
          })
        )
      },
      //array of all variable values OK
      allVars: function() {
        //new array to put vars in
        let asArray = []

        //for all vars in variables.vars, this may also copy unwanted properties -> test
        for (let namedVar in variables.vars) {
          //add to array
          asArray.push(variables.vars[namedVar])
        }

        //use indexed array
        this.val.setArray(asArray)
      },
      //array of keys and values alternating OK
      allVarsNameVal: function() {
        //get keys
        let names = Object.keys(variables.vars)

        //interlace
        this.val.setArray(
          names.reduce(function(all, name) {
            //push name
            all.push(Value.createValue(name, types.STRING))

            //push value
            all.push(variables.vars[name])

            //return to continue with next pair
            return all
          }, [])
        )
      },
      //number of variables OK
      varAmount: function() {
        this.val.setNum(variables.amount)
      },
      //removes a variable OK
      deleteVar: function() {
        //delete and return name
        this.val.setString(variables.deleteVar(this.argVal(0, types.STRING)))
      }
    },
    //functions and params OK
    func: {
      //calls a function with parameters OK
      do: function() {
        //get other arg values, without first
        this.params = this.args.slice(1).map(function(arg, index) {
          return this.argEval(1 + index)
        }, this)
        //call with new params by casting to clock and executing then
        this.val = this.argVal(0, types.FUNC).exec(this.params).val
      },
      //use and manipulate parameters OK
      param: {
        //gets a parameter with a index OK
        getParam: function() {
          //get index
          let index = Math.floor(Math.abs(this.argVal(0, types.NUM)))

          //if exists
          if (this.params.length > index) {
            //return value at index
            this.val = this.params[index]
          }
        },
        //checks if a param exists OK
        checkParam: function() {
          this.val.setBool(
            this.params.length > Math.floor(Math.abs(this.argVal(0, types.NUM)))
          )
        },
        //sets a param if available OK
        setParam: function() {
          //get index
          let index = Math.floor(Math.abs(this.argVal(0, types.NUM)))

          //if exists
          if (this.params.length > index) {
            //set value
            this.params[index] = this.argEval(1)

            //true for success
            this.val.setBool(true)
          } else {
            //doesn't exist
            this.val.setBool(false)
          }
        },
        //gets all parameters as an array OK
        allParams: function() {
          this.val.setArray(this.params)
        },
        //amount of params available OK
        paramAmount: function() {
          this.val.setNum(this.params.length)
        }
      }
    },
    //string manipulation
    string: {
      //length of string
      strLength: function() {
        this.val.setNum(this.argVal(0, types.STRING).length)
      },
      //from char array
      fromCharArray: function() {
        this.val.setString(
          this.argEval(0)
            .toStringArray()
            .join("")
        )
      },
      //to char array
      toCharArray: function() {
        this.val.setArray(
          Value.createValue(
            this.argVal(0, types.STRING).split(),
            types.STRING
          ).toStringArray()
        )
      },
      //char to char code
      charCode: function() {
        this.val.setNum(this.argVal(0, types.STRING).charCodeAt(0))
      },
      //char code at in string
      charCodeAt: function() {
        this.val.setNum(
          this.argVal(0, types.STRING).charCodeAt(this.argVal(1, types.NUM))
        )
      },
      //charAt
      charAt: function() {
        this.val.setString(
          this.argVal(0, types.STRING).charAt(this.argVal(1, types.NUM))
        )
      },
      //first char
      firstChar: function() {
        this.val.setString(this.argVal(0, types.STRING).charAt(0))
      },
      //adds to strings together
      strConcat: function() {
        this.val.setString(
          this.argVal(0, types.STRING) + this.argVal(1, types.STRING)
        )
      },
      //adds all strings given together
      strConcatAll: function() {
        this.val.setString(
          this.args.reduce(function(added, current, index) {
            return added + this.argVal(index, types.STRING)
          })
        )
      },
      //searches a string
      strIncludes: function() {
        this.val.setString(
          this.argVal(0, types.STRING).includes(
            this.argVal(1, types.STRING),
            this.args.length >= 3 ? this.argVal(2, types.NUM) : 0
          )
        )
      },
      //searches at the end of a string
      endsWith: function() {
        let str = this.argVal(0, types.STRING)
        this.val.setString(
          str.endsWith(
            this.argVal(1, types.STRING),
            this.args.length >= 3 ? this.argVal(2, types.NUM) : str.length
          )
        )
      },
      //finds a string in another one
      strIndexOf: function() {
        this.val.setNum(
          this.argVal(0, types.STRING).indexOf(
            this.argVal(1, types.STRING),
            this.args.length >= 3 ? this.argVal(2, types.NUM) : 0
          )
        )
      },
      //finds a string in another one
      lastIndexOf: function() {
        this.val.setNum(
          this.argVal(0, types.STRING).lastIndexOf(
            this.argVal(1, types.STRING),
            this.args.length >= 3 ? this.argVal(2, types.NUM) : 0
          )
        )
      },
      //matches against a regexp
      match: function() {
        this.val.setArray(
          Value.createValue(
            this.argVal(0, types.STRING).match(this.argVal(1, types.STRING)),
            types.ARRAY
          ).toStringArray()
        )
      },
      //repeats a string a given number of times
      strRepeat: function() {
        this.val.setString(
          this.argVal(0, types.STRING).repeat(this.argVal(1, types.NUM))
        )
      },
      //replaces a substring with another one
      strReplace: function() {
        this.val.setString(
          this.argVal(0, types.STRING).replace(
            this.argVal(1, types.STRING),
            this.argVal(1, types.STRING)
          )
        )
      },
      //seraches for a regexp
      searchString: function() {
        this.val.setNum(
          this.argVal(0, types.STRING).search(this.argVal(1, types.STRING))
        )
      },
      //returns an extracted substring
      strSlice: function() {
        let str = this.argVal(0, types.STRING)
        this.val.setNum(
          str.splice(
            this.argVal(1, types.NUM),
            this.args.length >= 3 ? this.argVal(2, types.NUM) : str.length
          )
        )
      },
      //splits string on seperators, use toCharArray when not using a seperator
      split: function() {
        this.val.setArray(
          Value.createValue(
            this.argVal(0, types.STRING).split(
              this.argVal(1, types.STRING),
              this.args.length >= 3 ? this.argVal(2, types.NUM) : 0
            ),
            types.STRING
          ).toStringArray()
        )
      },
      //searches at the beginning of a string
      startsWith: function() {
        this.val.setString(
          this.argVal(0, types.STRING).startsWith(
            this.argVal(1, types.STRING),
            this.args.length >= 3 ? this.argVal(2, types.NUM) : 0
          )
        )
      },
      //returns a substring using a position and amount of chars to extract
      substrAmount: function() {
        let str = this.argVal(0, types.STRING)
        this.val.setString(
          str.substr(
            this.argVal(1, types.NUM),
            this.args.length >= 3 ? this.argVal(2, types.NUM) : str.length
          )
        )
      },
      //returns a substring using a position and second position
      substrEnd: function() {
        let str = this.argVal(0, types.STRING)
        this.val.setString(
          str.substring(
            this.argVal(1, types.NUM),
            this.args.length >= 3 ? this.argVal(2, types.NUM) : str.length
          )
        )
      },
      //converts a string to lower case
      toLowerCase: function() {
        this.val.setNum(this.argVal(0, types.STRING).toLowerCase())
      },
      //converts a string to upper case
      toUpperCase: function() {
        this.val.setNum(this.argVal(0, types.STRING).toUpperCase())
      },
      //removes whitespace from ends
      trim: function() {
        this.val.setNum(this.argVal(0, types.STRING).trim())
      }
    },
    //array manipulation and higher-order functions for use on them (WIP)
    array: {
      //length of array
      arrLength: function() {
        this.val.setNum(this.argVal(0, types.ARRAY).length)
      },
      //gets value at given index
      valAt: function() {
        let index = Math.floor(Math.abs(this.argVal(1, types.NUM)))
        let arr = this.argVal(0, types.ARRAY)
        if (arr.length > index) {
          this.val = arr[index]
        } //null by default
      },
      //gets the last value
      last: function() {
        let arr = this.argVal(0, types.ARRAY)
        if (arr.length) {
          this.val = arr[arr.length - 1]
        }
      },
      //gets the first value
      first: function() {
        let arr = this.argVal(0, types.ARRAY)
        if (arr.length) {
          this.val = arr[0]
        }
      },
      //concatenates two arrays
      concat: function() {
        this.setArray(
          this.argVal(0, types.ARRAY).concat(this.argVal(1, types.ARRAY))
        )
      }
    }
  },
  //extended math
  extMath: {
    //gives information on numbers
    numInfo: {
      //checks wether an number is even
      isEven: function() {
        this.val.setBool(
          Math.floor(Math.abs(this.argVal(0, types.NUM))) % 2 === 0
        )
      },
      //checks wether an number is odd
      isOdd: function() {
        this.val.setBool(
          Math.floor(Math.abs(this.argVal(0, types.NUM))) % 2 === 1
        )
      },
      //checks wether an number is a multiple of another
      isMultiple: function() {
        this.val.setBool(
          Math.abs(this.argVal(0, types.NUM)) %
            Math.abs(this.argVal(1, types.NUM)) ===
            0
        )
      }
    },
    //calculates the gcd of two numbers
    gcd: function() {
      this.val.setNum(
        gcd(
          Math.floor(this.argVal(0, types.NUM)),
          Math.floor(this.argVal(1, types.NUM))
        )
      )
    },
    //calculates the lcm of two numbers
    lcm: function() {
      this.val.setNum(
        lcm(
          Math.floor(this.argVal(0, types.NUM)),
          Math.floor(this.argVal(1, types.NUM))
        )
      )
    },
    //sum of all args
    sum: function() {
      //set to reduced sum
      this.val.setNum(
        this.args.reduce(function(sum, arg, index) {
          //add num value of this arg
          return this.argVal(index, types.NUM) + sum
        }, 0)
      )
    },
    //product of all args
    product: function() {
      //set to reduced product
      this.val.setNum(
        this.args.reduce(function(product, arg, index) {
          //multiply current arg num value to product
          return this.argVal(index, types.NUM) * product
        }, 0)
      )
    }
  }
}

//--run--
//init keys to false
keys = filledArray(false, 256)

//init packages manager
packages = new Packages()

//init variable manager
variables = new Variables()

//register packages
msg(7, "Registering element exec functions...")
packages.addPackage(sul)

//process raw code
msg(0, "Pre-processing code...")
programCode = processRaw(programCode)

//parse
msg(0, "Parsing program...")
let e = new Element(programCode)

//print runArgs if any given
if (runArgs.length > 0) {
  msg(0, "Using runArgs: " + runArgs)
}

//start program timer
programTimer = millis()

//evaluate/execute
msg(0, "Executing program...")
e.exec()

if (printOnCanvas) {
  var printFont = createFont("monaco")
}

//draw loop
let draw = function() {
  //if canvas log enabled
  if (printOnCanvas) {
    //setup style
    textFont(printFont, printSize)
    fill(255)
    noStroke()
    background(0)
    textMode(CORNERS)

    //draw log
    text(
      canvasLog,
      textOffset,
      textOffset,
      width - textOffset * 2,
      height - textOffset
    )
  }
}

//key callbacks
let keyPressed = function() {
  keys[key] = true
  keyPressAmount++
}
let keyReleased = function() {
  keys[key] = false
  keyPressAmount--
}
