import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  showHUD,
  popToRoot,
  open,
  getPreferenceValues,
} from "@raycast/api";
import { useState } from "react";
import { createCard, getTodayDate, runGenerate, getAllTags, generateSlug, isIdUnique } from "./utils/content";
import { CardFrontmatter } from "./types";

interface Preferences {
  projectPath: string;
}

type SignalType = "projects" | "journal";

export default function AddCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [signalType, setSignalType] = useState<SignalType>("projects");
  const [titleError, setTitleError] = useState<string | undefined>();
  const [idError, setIdError] = useState<string | undefined>();

  const existingTags = getAllTags(signalType);

  async function handleSubmit(values: {
    signalType: string;
    id: string;
    title: string;
    subtitle: string;
    summary: string;
    tags: string;
    date: Date | null;
    content: string;
    openInEditor: boolean;
  }) {
    // Validation
    if (!values.title.trim()) {
      setTitleError("Title is required");
      return;
    }

    const id = values.id.trim() || generateSlug(values.title);
    if (!isIdUnique(id, values.signalType as SignalType)) {
      setIdError(`ID "${id}" already exists`);
      return;
    }

    setIsLoading(true);

    try {
      const frontmatter: CardFrontmatter = {
        id,
        title: values.title.trim(),
        subtitle: values.subtitle.trim() || values.title.trim(),
        date: values.date ? values.date.toISOString().split("T")[0] : getTodayDate(),
        summary: values.summary.trim() || "",
        tags: values.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      };

      const content = values.content.trim() || `# ${frontmatter.title}\n\nWrite your content here...`;

      const filePath = createCard(values.signalType as SignalType, frontmatter, content);

      await showToast({
        style: Toast.Style.Animated,
        title: "Running generate...",
      });

      await runGenerate();

      await showHUD(`Created: ${frontmatter.title}`);

      if (values.openInEditor) {
        // Open in Cursor
        await open(filePath, "Cursor");
      }

      popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create card",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Card" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="signalType"
        title="Signal Type"
        defaultValue="projects"
        onChange={(value) => setSignalType(value as SignalType)}
      >
        <Form.Dropdown.Item value="projects" title="📁 Projects" />
        <Form.Dropdown.Item value="journal" title="📓 Journal" />
      </Form.Dropdown>

      <Form.Separator />

      <Form.TextField
        id="title"
        title="Title"
        placeholder="Card title"
        error={titleError}
        onChange={() => setTitleError(undefined)}
        autoFocus
      />
      <Form.TextField
        id="id"
        title="ID (slug)"
        placeholder="auto-generated from title if empty"
        error={idError}
        onChange={() => setIdError(undefined)}
        info="Used for the filename and URL. Leave empty to auto-generate from title."
      />
      <Form.TextField id="subtitle" title="Subtitle" placeholder="Short subtitle (optional)" />
      <Form.TextArea id="summary" title="Summary" placeholder="Brief description for cards grid" />
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="tag1, tag2, tag3"
        info={existingTags.length > 0 ? `Existing tags: ${existingTags.slice(0, 10).join(", ")}` : undefined}
      />
      <Form.DatePicker id="date" title="Date" defaultValue={new Date()} type={Form.DatePicker.Type.Date} />

      <Form.Separator />

      <Form.TextArea id="content" title="Content" placeholder="Markdown content (optional, can edit later)" />
      <Form.Checkbox id="openInEditor" label="Open in Cursor after creating" defaultValue={true} />
    </Form>
  );
}

