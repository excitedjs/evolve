export class StreamHandler {
  private assistantMessage = "";
  private reasoningSummary = "";
  private hasOutputReasoningHeader = false;
  private hasOutputSeparator = false;

  async process(readableStream: ReadableStream): Promise<string> {
    const reader = readableStream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value && Array.isArray(value) && value[0]) {
        const chunk = value[0] as any;

        this.handleReasoning(chunk);
        this.handleContent(chunk);
      }
    }

    return this.assistantMessage;
  }

  private handleReasoning(chunk: any): void {
    if (chunk.additional_kwargs?.reasoning?.summary) {
      if (!this.hasOutputReasoningHeader) {
        process.stdout.write("[思考过程] ");
        this.hasOutputReasoningHeader = true;
      }
      for (const item of chunk.additional_kwargs.reasoning.summary) {
        if (item.type === "summary_text" && item.text) {
          process.stdout.write(item.text);
          this.reasoningSummary += item.text;
        }
      }
    }
  }

  private handleContent(chunk: any): void {
    if (chunk.content) {
      if (this.reasoningSummary && !this.hasOutputSeparator) {
        process.stdout.write("\n\n");
        this.hasOutputSeparator = true;
      }
      if (typeof chunk.content === "string") {
        process.stdout.write(chunk.content);
        this.assistantMessage += chunk.content;
      } else if (Array.isArray(chunk.content)) {
        for (const item of chunk.content) {
          if (item.type === "text" && item.text) {
            process.stdout.write(item.text);
            this.assistantMessage += item.text;
          }
        }
      }
    }
  }
}
