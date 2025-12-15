import {
  Action,
  ActionPanel,
  List,
  Icon,
  Color,
  showToast,
  Toast,
  confirmAlert,
  Alert,
  open,
  showHUD,
} from "@raycast/api";
import { useState, useEffect } from "react";
import {
  getListeningItems,
  getCards,
  deleteListeningItem,
  deleteCard,
  formatDate,
  runGenerate,
} from "./utils/content";
import { TYPE_ICONS } from "./utils/constants";
import { ListeningItem, Card } from "./types";

type ContentCategory = "all" | "listening" | "projects" | "journal";

interface ListeningItemWithIndex extends ListeningItem {
  index: number;
}

export default function BrowseContent() {
  const [category, setCategory] = useState<ContentCategory>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [listeningItems, setListeningItems] = useState<
    ListeningItemWithIndex[]
  >([]);
  const [projectCards, setProjectCards] = useState<Card[]>([]);
  const [journalCards, setJournalCards] = useState<Card[]>([]);

  useEffect(() => {
    loadContent();
  }, []);

  function loadContent() {
    setIsLoading(true);
    try {
      const listening = getListeningItems().map((item, index) => ({
        ...item,
        index,
      }));
      const projects = getCards("projects");
      const journal = getCards("journal");

      setListeningItems(listening.reverse()); // Most recent first
      setProjectCards(projects);
      setJournalCards(journal);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load content",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteListening(item: ListeningItemWithIndex) {
    const confirmed = await confirmAlert({
      title: "Delete Listening Item",
      message: `Are you sure you want to delete "${item.title}"?`,
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      try {
        deleteListeningItem(item.index);
        await runGenerate();
        await showHUD(`Deleted: ${item.title}`);
        loadContent();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to delete",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  async function handleDeleteCard(card: Card) {
    const confirmed = await confirmAlert({
      title: "Delete Card",
      message: `Are you sure you want to delete "${card.frontmatter.title}"?`,
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      try {
        deleteCard(card.filePath);
        await runGenerate();
        await showHUD(`Deleted: ${card.frontmatter.title}`);
        loadContent();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to delete",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  async function handleOpenCard(card: Card) {
    await open(card.filePath, "Cursor");
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search content..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter by category"
          value={category}
          onChange={(v) => setCategory(v as ContentCategory)}
        >
          <List.Dropdown.Item title="All Content" value="all" />
          <List.Dropdown.Item title="🎧 Listening" value="listening" />
          <List.Dropdown.Item title="📁 Projects" value="projects" />
          <List.Dropdown.Item title="📓 Journal" value="journal" />
        </List.Dropdown>
      }
    >
      {(category === "all" || category === "listening") &&
        listeningItems.length > 0 && (
          <List.Section
            title="Listening"
            subtitle={`${listeningItems.length} items`}
          >
            {listeningItems.map((item, idx) => (
              <List.Item
                key={`listening-${idx}`}
                title={item.title}
                subtitle={item.creator}
                accessories={[
                  { text: TYPE_ICONS[item.type] || "📄" },
                  { text: formatDate(item.date), tooltip: item.date },
                ]}
                actions={
                  <ActionPanel>
                    {item.url && <Action.OpenInBrowser url={item.url} />}
                    <Action.CopyToClipboard
                      title="Copy Title"
                      content={item.title}
                    />
                    <Action
                      title="Delete"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                      onAction={() => handleDeleteListening(item)}
                    />
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      onAction={loadContent}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        )}

      {(category === "all" || category === "projects") &&
        projectCards.length > 0 && (
          <List.Section
            title="Projects"
            subtitle={`${projectCards.length} cards`}
          >
            {projectCards.map((card) => (
              <List.Item
                key={card.frontmatter.id}
                title={card.frontmatter.title}
                subtitle={card.frontmatter.subtitle}
                accessories={[
                  {
                    tag: {
                      value: card.frontmatter.tags[0] || "",
                      color: Color.Blue,
                    },
                  },
                  {
                    text: formatDate(card.frontmatter.date),
                    tooltip: card.frontmatter.date,
                  },
                ]}
                actions={
                  <ActionPanel>
                    <Action
                      title="Open in Cursor"
                      icon={Icon.Document}
                      onAction={() => handleOpenCard(card)}
                    />
                    <Action.CopyToClipboard
                      title="Copy Title"
                      content={card.frontmatter.title}
                    />
                    <Action
                      title="Delete"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                      onAction={() => handleDeleteCard(card)}
                    />
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      onAction={loadContent}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        )}

      {(category === "all" || category === "journal") &&
        journalCards.length > 0 && (
          <List.Section
            title="Journal"
            subtitle={`${journalCards.length} cards`}
          >
            {journalCards.map((card) => (
              <List.Item
                key={card.frontmatter.id}
                title={card.frontmatter.title}
                subtitle={card.frontmatter.subtitle}
                accessories={[
                  {
                    tag: {
                      value: card.frontmatter.tags[0] || "",
                      color: Color.Purple,
                    },
                  },
                  {
                    text: formatDate(card.frontmatter.date),
                    tooltip: card.frontmatter.date,
                  },
                ]}
                actions={
                  <ActionPanel>
                    <Action
                      title="Open in Cursor"
                      icon={Icon.Document}
                      onAction={() => handleOpenCard(card)}
                    />
                    <Action.CopyToClipboard
                      title="Copy Title"
                      content={card.frontmatter.title}
                    />
                    <Action
                      title="Delete"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                      onAction={() => handleDeleteCard(card)}
                    />
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      onAction={loadContent}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        )}

      {!isLoading &&
        listeningItems.length === 0 &&
        projectCards.length === 0 &&
        journalCards.length === 0 && (
          <List.EmptyView
            title="No content found"
            description="Add some content using the other commands"
            icon={Icon.Document}
          />
        )}
    </List>
  );
}

