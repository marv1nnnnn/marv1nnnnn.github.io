import { Action, ActionPanel, List, Icon, useNavigation } from "@raycast/api";
import AddListeningItem from "./add-listening";
import AddCard from "./add-card";

interface QuickAddOption {
  id: string;
  title: string;
  subtitle: string;
  icon: Icon;
  keywords: string[];
}

const quickAddOptions: QuickAddOption[] = [
  {
    id: "listening",
    title: "Add Listening Item",
    subtitle: "Add music, video, text, or game to your listening log",
    icon: Icon.Headphones,
    keywords: [
      "music",
      "video",
      "text",
      "game",
      "listen",
      "watch",
      "read",
      "play",
    ],
  },
  {
    id: "project",
    title: "Add Project Card",
    subtitle: "Create a new project card with markdown content",
    icon: Icon.Folder,
    keywords: ["project", "work", "portfolio", "card"],
  },
  {
    id: "journal",
    title: "Add Journal Entry",
    subtitle: "Create a new journal card for notes and thoughts",
    icon: Icon.Pencil,
    keywords: ["journal", "note", "thought", "blog", "entry"],
  },
];

export default function QuickAdd() {
  const { push } = useNavigation();

  function handleSelect(option: QuickAddOption) {
    switch (option.id) {
      case "listening":
        push(<AddListeningItem />);
        break;
      case "project":
      case "journal":
        push(<AddCard />);
        break;
    }
  }

  return (
    <List searchBarPlaceholder="What would you like to add?">
      {quickAddOptions.map((option) => (
        <List.Item
          key={option.id}
          title={option.title}
          subtitle={option.subtitle}
          icon={option.icon}
          keywords={option.keywords}
          actions={
            <ActionPanel>
              <Action title="Select" onAction={() => handleSelect(option)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

