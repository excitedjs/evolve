import React from "react";
import { Box, Text } from "ink";

export function Composer({
  input,
  isSubmitting,
}: {
  input: string;
  isSubmitting: boolean;
}) {
  return (
    <>
      <Box marginTop={1}>
        <Text color="magentaBright" bold>
          ❯
        </Text>
        <Text color="gray"> Composer </Text>
        <Text color="gray">
          {isSubmitting ? "生成中，暂不接收输入" : "Enter 发送 · Esc 清空 · Ctrl+C 退出"}
        </Text>
      </Box>
      <Box>
        <Text color="magentaBright">{"> "}</Text>
        <Text>{input}</Text>
        {!isSubmitting ? <Text color="magentaBright">█</Text> : null}
      </Box>
    </>
  );
}
