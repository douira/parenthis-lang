import { parse } from "./lib/parser"

//AST parsing examples
console.log(
  parse(`
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
)`)
)

console.log(parse(`(block)`))

console.log(parse(`"ffsfd'fdsfd'\\"fdsfds"`))

//parsing error example
console.log(
  parse(`
(block,
      (incrVar, 'x'),
      (println,
        (strConcat,
          'iteration Nr. ',
          (getVar, 'x')
        )
      )`)
)
