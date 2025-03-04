import { UniqueIdentifier } from "@dnd-kit/core";

export default interface BoardProps {
  id: UniqueIdentifier;
  children: React.ReactNode;
  title?: string;
  description?: string;
  onAddItem?: () => void;
}
