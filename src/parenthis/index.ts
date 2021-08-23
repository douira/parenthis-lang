import { register } from "../lib/eval";
import typeRegistry from "./type"

//register all declared functions from this folder
register(typeRegistry)
