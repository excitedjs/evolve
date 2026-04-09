import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { Box, Text, useApp, useInput, useWindowSize } from "ink";
import {
  ConversationSession,
  createConversationRunner,
  getModelLabel,
  type ConversationRuntimeConfig,
  type ModelConfig,
  type ModelEffort,
} from "@evolve/core";
import { CommandMenu, type CommandMenuItem } from "./components/command-menu";
import { Composer } from "./components/composer";
import { EmptyState } from "./components/empty-state";
import { Header } from "./components/header";
import { TranscriptEntry } from "./components/transcript-entry";
import { EXIT_COMMANDS } from "./constants";
import { useSpinner } from "./hooks/use-spinner";
import {
  applyStreamEvent,
  createPendingAssistantMessage,
  createUserMessage,
  failAssistantMessage,
  finalizeAssistantMessage,
} from "./state";
import type { TranscriptMessage } from "./types";
import { drawRule, formatCurrentDirectory } from "./utils";

const COMMANDS = [
  {
    id: "/model",
    label: "/model",
    description: "切换到配置列表中的模型",
  },
  {
    id: "/effort",
    label: "/effort",
    description: "切换当前思考深度",
  },
] as const;

const EFFORT_ITEMS: Array<{
  id: ModelEffort;
  label: string;
  description: string;
}> = [
  { id: "low", label: "low", description: "更快，推理更浅" },
  { id: "medium", label: "medium", description: "平衡速度与质量" },
  { id: "high", label: "high", description: "更慢，但更充分" },
];

type MenuState =
  | {
      kind: "commands";
      title: string;
      hint: string;
      items: CommandMenuItem[];
    }
  | {
      kind: "model";
      title: string;
      hint: string;
      items: CommandMenuItem[];
    }
  | {
      kind: "effort";
      title: string;
      hint: string;
      items: CommandMenuItem[];
    };

export interface AppProps {
  models: ModelConfig[];
  selectedModelId: string;
  effort: ModelEffort;
}

function buildMenuState(
  input: string,
  models: ModelConfig[],
  selectedModelId: string,
  effort: ModelEffort,
): MenuState | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  if (trimmed === "/model") {
    return {
      kind: "model",
      title: "模型列表",
      hint: "Enter 切换当前模型",
      items: models.map((model) => ({
        id: model.id,
        label: getModelLabel(model),
        description: `${model.provider} · ${model.api} · ${model.model}`,
        active: model.id === selectedModelId,
      })),
    };
  }

  if (trimmed === "/effort") {
    return {
      kind: "effort",
      title: "思考深度",
      hint: "Enter 切换当前 effort",
      items: EFFORT_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        active: item.id === effort,
      })),
    };
  }

  const items = COMMANDS.filter((item) => item.id.startsWith(trimmed)).map(
    (item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
    }),
  );

  if (items.length === 0) {
    return null;
  }

  return {
    kind: "commands",
    title: "命令面板",
    hint: "Enter 选中命令",
    items,
  };
}

function clampIndex(nextIndex: number, itemCount: number): number {
  if (itemCount === 0) {
    return 0;
  }
  if (nextIndex < 0) {
    return itemCount - 1;
  }
  if (nextIndex >= itemCount) {
    return 0;
  }
  return nextIndex;
}

export function App({
  models,
  selectedModelId: initialModelId,
  effort: initialEffort,
}: AppProps) {
  const { exit } = useApp();
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);
  const [selectedEffort, setSelectedEffort] = useState(initialEffort);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("就绪");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const spinnerFrame = useSpinner(isSubmitting);
  const { columns: terminalWidth, rows: terminalHeight } = useWindowSize();
  const currentDirectoryLabel = formatCurrentDirectory(process.cwd());

  const currentModel =
    models.find((model) => model.id === selectedModelId) ?? models[0];

  const runtimeConfigRef = useRef<ConversationRuntimeConfig>({
    model: currentModel,
    effort: selectedEffort,
  });

  runtimeConfigRef.current = {
    model: currentModel,
    effort: selectedEffort,
  };

  const sessionRef = useRef(
    new ConversationSession({
      runner: createConversationRunner(() => runtimeConfigRef.current),
    }),
  );

  const deferredMessages = useDeferredValue(messages);
  const menu = buildMenuState(input, models, currentModel.id, selectedEffort);
  const menuSignature = menu
    ? `${menu.kind}:${menu.items.map((item) => item.id).join("|")}`
    : "closed";

  useEffect(() => {
    setMenuIndex(0);
  }, [menuSignature]);

  const maxVisibleMessages = Math.max(4, terminalHeight - (menu ? 14 : 10));
  const visibleMessages = deferredMessages.slice(-maxVisibleMessages);

  useInput((value, key) => {
    if (key.ctrl && value === "c") {
      exit();
      return;
    }

    if (key.escape) {
      setInput("");
      return;
    }

    if (isSubmitting) {
      return;
    }

    if (menu) {
      if (key.upArrow) {
        setMenuIndex((current) => clampIndex(current - 1, menu.items.length));
        return;
      }

      if (key.downArrow) {
        setMenuIndex((current) => clampIndex(current + 1, menu.items.length));
        return;
      }
    }

    if (key.return) {
      const nextInput = input.trim();
      if (!nextInput) {
        return;
      }

      if (menu) {
        applyMenuSelection(menu);
        return;
      }

      if (EXIT_COMMANDS.has(nextInput.toLowerCase())) {
        exit();
        return;
      }

      void submit(nextInput);
      return;
    }

    if (key.backspace || key.delete) {
      setInput((current) => current.slice(0, -1));
      return;
    }

    if (!key.ctrl && !key.meta && value) {
      setInput((current) => current + value);
    }
  });

  function applyMenuSelection(activeMenu: MenuState) {
    const selectedItem = activeMenu.items[menuIndex];
    if (!selectedItem) {
      return;
    }

    if (activeMenu.kind === "commands") {
      setInput(selectedItem.id);
      return;
    }

    if (activeMenu.kind === "model") {
      startTransition(() => {
        setSelectedModelId(selectedItem.id);
        setInput("");
        setStatus(`模型已切换为 ${selectedItem.label}`);
      });
      return;
    }

    startTransition(() => {
      setSelectedEffort(selectedItem.id as ModelEffort);
      setInput("");
      setStatus(`思考深度已切换为 ${selectedItem.label}`);
    });
  }

  async function submit(userInput: string): Promise<void> {
    const assistantMessage = createPendingAssistantMessage();

    startTransition(() => {
      setMessages((current) => [
        ...current,
        createUserMessage(userInput),
        assistantMessage,
      ]);
      setInput("");
      setStatus("生成中");
      setIsSubmitting(true);
    });

    try {
      for await (const event of sessionRef.current.submit(userInput)) {
        startTransition(() => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessage.id
                ? applyStreamEvent(message, event)
                : message,
            ),
          );
        });
      }

      startTransition(() => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? finalizeAssistantMessage(message)
              : message,
          ),
        );
        setStatus("就绪");
        setIsSubmitting(false);
      });
    } catch (error) {
      startTransition(() => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? failAssistantMessage(message, error)
              : message,
          ),
        );
        setStatus("出错了");
        setIsSubmitting(false);
      });
    }
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header
        currentDirectory={currentDirectoryLabel}
        currentEffort={selectedEffort}
        currentModelLabel={getModelLabel(currentModel)}
        isSubmitting={isSubmitting}
        status={status}
        spinnerFrame={spinnerFrame}
      />
      <Text color="gray">{drawRule(terminalWidth)}</Text>

      <Box
        flexDirection="column"
        marginTop={1}
        minHeight={Math.max(8, terminalHeight - 7)}
      >
        {visibleMessages.length === 0 ? (
          <EmptyState />
        ) : (
          visibleMessages.map((message) => (
            <TranscriptEntry key={message.id} message={message} />
          ))
        )}
      </Box>

      <Text color="gray">{drawRule(terminalWidth)}</Text>
      {menu ? (
        <CommandMenu
          title={menu.title}
          hint={menu.hint}
          items={menu.items}
          selectedIndex={menuIndex}
        />
      ) : null}
      <Composer
        input={input}
        isSubmitting={isSubmitting}
        isMenuOpen={Boolean(menu)}
      />
    </Box>
  );
}
