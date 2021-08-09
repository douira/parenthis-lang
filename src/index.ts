import { parse } from "./lib/parser"

const code = `
(block,
  (setVar, 'x', '0'),
  (countedLoop,
    '10',
    (block,
      (incrVar, 'x'),
      (println,
        (strConcat,###
          'iteration Nr. ',
          (getVar, 'x')
        )
      )
    )
  )
)`

console.log(parse(code))
