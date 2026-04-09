import React from "react";
import { render } from "ink";
import { App } from "./app";

async function main() {
  const instance = render(React.createElement(App), {
    exitOnCtrlC: false,
  });

  await instance.waitUntilExit();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
