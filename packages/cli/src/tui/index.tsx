import React, { startTransition, useDeferredValue, useRef, useState } from "react";
import { Box, Text, useApp, useInput, useWindowSize } from "ink";
import { ConversationSession } from "@evolve/core";
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

const CWD_LABEL = formatCurrentDirectory(process.cwd());

export function App() {
  const { exit } = useApp();
  const sessionRef = useRef(new ConversationSession());
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("就绪");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const spinnerFrame = useSpinner(isSubmitting);
  const { columns: terminalWidth, rows: terminalHeight } = useWindowSize();

  const deferredMessages = useDeferredValue(messages);
  const maxVisibleMessages = Math.max(4, terminalHeight - 10);
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

    if (key.return) {
      const nextInput = input.trim();
      if (!nextInput) {
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
        currentDirectory={CWD_LABEL}
        isSubmitting={isSubmitting}
        status={status}
        spinnerFrame={spinnerFrame}
      />
      <Text color="gray">{drawRule(terminalWidth)}</Text>

      <Box flexDirection="column" marginTop={1} minHeight={Math.max(8, terminalHeight - 7)}>
        {visibleMessages.length === 0 ? (
          <EmptyState />
        ) : (
          visibleMessages.map((message) => (
            <TranscriptEntry key={message.id} message={message} />
          ))
        )}
      </Box>

      <Text color="gray">{drawRule(terminalWidth)}</Text>
      <Composer input={input} isSubmitting={isSubmitting} />
    </Box>
  );
}
