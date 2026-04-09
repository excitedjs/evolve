import React from "react";
import { Box, Spacer, Text } from "ink";

export function Header({
  currentDirectory,
  isSubmitting,
  status,
  spinnerFrame,
}: {
  currentDirectory: string;
  isSubmitting: boolean;
  status: string;
  spinnerFrame: string;
}) {
  return (
    <>
      <Box>
        <Text color="cyanBright" bold>
          Evolve Code
        </Text>
        <Text color="gray"> TUI chat</Text>
        <Spacer />
        <Text color={isSubmitting ? "yellow" : "green"}>
          {isSubmitting ? spinnerFrame : "●"} {status}
        </Text>
      </Box>
      <Text color="gray">{currentDirectory}</Text>
    </>
  );
}
