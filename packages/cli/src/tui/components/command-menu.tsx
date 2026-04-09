import React from "react";
import { Box, Text } from "ink";

export interface CommandMenuItem {
  id: string;
  label: string;
  description: string;
  active?: boolean;
}

export function CommandMenu({
  title,
  hint,
  items,
  selectedIndex,
}: {
  title: string;
  hint: string;
  items: CommandMenuItem[];
  selectedIndex: number;
}) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="cyanBright">
        {title}
        <Text color="gray"> · {hint}</Text>
      </Text>
      {items.map((item, index) => {
        const selected = index === selectedIndex;
        return (
          <Box key={item.id}>
            <Text color={selected ? "greenBright" : "gray"}>
              {selected ? "› " : "  "}
            </Text>
            <Text color={selected ? "white" : "gray"} bold={selected}>
              {item.label}
            </Text>
            {item.active ? <Text color="green"> 当前</Text> : null}
            <Text color="gray"> · {item.description}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
