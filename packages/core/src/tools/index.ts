export { readTool } from "./read";
export { writeTool } from "./write";
export { bashTool } from "./bash";
export { grepTool } from "./grep";

import { readTool } from "./read";
import { writeTool } from "./write";
import { bashTool } from "./bash";
import { grepTool } from "./grep";

export const tools = [readTool, writeTool, bashTool, grepTool];
