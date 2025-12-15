import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  showHUD,
  popToRoot,
} from "@raycast/api";
import { useState } from "react";
import { addListeningItem, getTodayDate, runGenerate } from "./utils/content";
import { CONTENT_TYPES, TYPE_ICONS } from "./utils/constants";
import { ContentType, ListeningItem } from "./types";

export default function AddListeningItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [creatorError, setCreatorError] = useState<string | undefined>();

  async function handleSubmit(values: {
    title: string;
    creator: string;
    type: string;
    url: string;
    date: string;
  }) {
    // Validation
    if (!values.title.trim()) {
      setTitleError("Title is required");
      return;
    }
    if (!values.creator.trim()) {
      setCreatorError("Creator is required");
      return;
    }

    setIsLoading(true);

    try {
      const item: ListeningItem = {
        title: values.title.trim(),
        creator: values.creator.trim(),
        type: values.type as ContentType,
        date: values.date || getTodayDate(),
      };

      if (values.url.trim()) {
        item.url = values.url.trim();
      }

      addListeningItem(item);

      await showToast({
        style: Toast.Style.Animated,
        title: "Running generate...",
      });

      await runGenerate();

      await showHUD(`Added: ${TYPE_ICONS[item.type]} ${item.title}`);
      popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to add item",
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
          <Action.SubmitForm
            title="Add Listening Item"
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="Album or content title"
        error={titleError}
        onChange={() => setTitleError(undefined)}
        autoFocus
      />
      <Form.TextField
        id="creator"
        title="Creator"
        placeholder="Artist, author, or creator"
        error={creatorError}
        onChange={() => setCreatorError(undefined)}
      />
      <Form.Dropdown id="type" title="Type" defaultValue="music">
        {CONTENT_TYPES.map((type) => (
          <Form.Dropdown.Item
            key={type}
            value={type}
            title={`${TYPE_ICONS[type]} ${type}`}
          />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="url"
        title="URL"
        placeholder="https://... (optional)"
      />
      <Form.DatePicker
        id="date"
        title="Date"
        defaultValue={new Date()}
        type={Form.DatePicker.Type.Date}
      />
    </Form>
  );
}

