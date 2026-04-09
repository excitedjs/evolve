import React from "react";
import { Box, Text } from "ink";

export function EmptyState() {
  return (
    <Box flexDirection="column">
      <Text color="blueBright" bold>
        连续对话已就绪
      </Text>
      <Text color="gray">像用终端日志一样看对话，回复会以流式增量写入。</Text>
      <Text color="gray">建议直接输入任务、代码问题或调试目标，不需要寒暄。</Text>
    </Box>
  );
}
