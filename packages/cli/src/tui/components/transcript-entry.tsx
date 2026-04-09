import React from "react";
import { Box, Text } from "ink";
import type { TranscriptMessage } from "../types";

export function TranscriptEntry({ message }: { message: TranscriptMessage }) {
  const accentColor = message.role === "user" ? "cyan" : "green";
  const title = message.role === "user" ? "You" : "Evolve";
  const marker = message.role === "user" ? "›" : "●";
  const content =
    message.pending && !message.content ? "正在组织回答..." : message.content;

  return (
    <Box flexDirection="row" marginBottom={1}>
      <Box width={2}>
        <Text color={accentColor}>{marker}</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        <Text color={accentColor} bold>
          {title}
        </Text>
        {message.reasoning ? (
          <Box>
            <Text color="yellow">thinking </Text>
            <Text color="gray">{message.reasoning}</Text>
          </Box>
        ) : null}
        <Text>{content}</Text>
        {message.error ? (
          <Box>
            <Text color="red">error </Text>
            <Text color="redBright">{message.error}</Text>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
