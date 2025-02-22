"use client";
import {
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  DndContext,
  closestCorners,
  DragStartEvent,
  DragMoveEvent,
  DragOverlay,
  useSensors,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useCallback, useState } from "react";
import Board from "./components/Board";
import Items from "./components/Item";
import { Button } from "./components/Button";
import Modal from "./components/Modal";
import Input from "./components/Input";
import { v4 as uuidv4 } from "uuid";

interface DNDType {
  id: UniqueIdentifier;
  title: string;
  items: {
    id: UniqueIdentifier;
    title: string;
  }[];
}
export default function Home() {
  const [boards, setBoards] = useState<DNDType[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [currentBoardId, setCurrentBoardId] = useState<UniqueIdentifier>();

  const [boardName, setBoardName] = useState("");
  const [itemName, setItemName] = useState("");
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  const onAddBoard = useCallback(() => {
    if (!boardName) return;
    const id = `board-${uuidv4()}`;
    setBoards([
      ...boards,
      {
        id,
        title: boardName,
        items: [],
      },
    ]);
    setBoardName("");
    setShowAddBoardModal(false);
  }, [boardName, boards]);
  const onAddItem = useCallback(() => {
    if (!itemName) return;
    const id = `item-${uuidv4()}`;
    const board = boards.find((item) => item.id === currentBoardId);
    if (!board) return;
    board.items.push({
      id,
      title: itemName,
    });
    setBoards([...boards]);
    setItemName("");
    setShowAddItemModal(false);
  }, [itemName, boards, currentBoardId]);

  const findValueOfItems = useCallback(
    (id: UniqueIdentifier | undefined, type: string) => {
      if (type === "board") {
        return boards.find((item) => item.id === id);
      }
      if (type === "item") {
        return boards.find((board) =>
          board.items.find((item) => item.id === id)
        );
      }
    },
    [boards]
  );
  const findItemTitle = (id: UniqueIdentifier | undefined) => {
    const board = findValueOfItems(id, "item");
    if (!board) return "";
    const item = board.items.find((item) => item.id === id);
    if (!item) return "";
    return item.title;
  };

  const findBoardTitle = (id: UniqueIdentifier | undefined) => {
    const board = findValueOfItems(id, "board");
    if (!board) return "";
    return board.title;
  };

  const findBoardItems = (id: UniqueIdentifier | undefined) => {
    const board = findValueOfItems(id, "board");
    if (!board) return [];
    return board.items;
  };
  //Dnd Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    setActiveId(id);
  };
  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { active, over } = event;
      // Handling board Sorting
      if (
        active.id.toString().includes("board") &&
        over?.id.toString().includes("board") &&
        active &&
        over &&
        active.id !== over.id
      ) {
        // Find the index of the active and over board
        const activeBoardIndex = boards.findIndex(
          (board) => board.id === active.id
        );
        const overBoardIndex = boards.findIndex(
          (board) => board.id === over.id
        );
        // Swap the active and over board
        let newItems = [...boards];
        newItems = arrayMove(newItems, activeBoardIndex, overBoardIndex);
        setBoards(newItems);
      }
      // Handle Items Sorting
      if (
        active.id.toString().includes("item") &&
        over?.id.toString().includes("item") &&
        active &&
        over &&
        active.id !== over.id
      ) {
        // Find the active board and over board
        const activeBoard = findValueOfItems(active.id, "item");
        const overBoard = findValueOfItems(over.id, "item");

        // If the active or over board is not found, return
        if (!activeBoard || !overBoard) return;

        // Find the index of the active and over board
        const activeBoardIndex = boards.findIndex(
          (board) => board.id === activeBoard.id
        );
        const overBoardIndex = boards.findIndex(
          (board) => board.id === overBoard.id
        );

        // Find the index of the active and over item
        const activeitemIndex = activeBoard.items.findIndex(
          (item) => item.id === active.id
        );
        const overitemIndex = overBoard.items.findIndex(
          (item) => item.id === over.id
        );
        // In the same board
        if (activeBoardIndex === overBoardIndex) {
          const newItems = [...boards];
          newItems[activeBoardIndex].items = arrayMove(
            newItems[activeBoardIndex].items,
            activeitemIndex,
            overitemIndex
          );

          setBoards(newItems);
        } else {
          const newItems = [...boards];
          const [removeditem] = newItems[activeBoardIndex].items.splice(
            activeitemIndex,
            1
          );
          newItems[overBoardIndex].items.splice(overitemIndex, 0, removeditem);
          setBoards(newItems);
        }
      }

      // Handling Item Drop Into a board
      if (
        active.id.toString().includes("item") &&
        over?.id.toString().includes("board") &&
        active &&
        over &&
        active.id !== over.id
      ) {
        // Find the active and over board
        const activeBoard = findValueOfItems(active.id, "item");
        const overBoard = findValueOfItems(over.id, "board");

        // If the active or over board is not found, return
        if (!activeBoard || !overBoard) return;

        // Find the index of the active and over board
        const activeBoardIndex = boards.findIndex(
          (board) => board.id === activeBoard.id
        );
        const overBoardIndex = boards.findIndex(
          (board) => board.id === overBoard.id
        );

        // Find the index of the active and over item
        const activeitemIndex = activeBoard.items.findIndex(
          (item) => item.id === active.id
        );

        // Remove the active item from the active board and add it to the over board
        const newItems = [...boards];
        const [removeditem] = newItems[activeBoardIndex].items.splice(
          activeitemIndex,
          1
        );
        newItems[overBoardIndex].items.push(removeditem);
        setBoards(newItems);
      }
    },
    [boards, findValueOfItems]
  );

  const handleDragEnd = () => {
    setActiveId(null);
  };
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="mx-auto max-w-7xl py-10">
      <Modal showModal={showAddBoardModal} setShowModal={setShowAddBoardModal}>
        <div className="flex flex-col w-full items-start gap-y-4">
          <h1 className="text-gray-800 text-3xl font-bold">Add Board</h1>
          <Input
            type="text"
            placeholder="Board Title"
            name="boardName"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
          />
          <Button onClick={onAddBoard}>Add board</Button>
        </div>
      </Modal>
      {/* Add Item Modal */}
      <Modal showModal={showAddItemModal} setShowModal={setShowAddItemModal}>
        <div className="flex flex-col w-full items-start gap-y-4">
          <h1 className="text-gray-800 text-3xl font-bold">Add Item</h1>
          <Input
            type="text"
            placeholder="Item Title"
            name="itemname"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <Button onClick={onAddItem}>Add Item</Button>
        </div>
      </Modal>

      <div className="flex items-center justify-between gap-y-2">
        <h1 className="text-gray-800 text-3xl font-bold">Dnd-kit Guide</h1>
        <Button onClick={() => setShowAddBoardModal(true)}>Add Board</Button>
      </div>
      <div className="mt-10">
        <div className="grid grid-cols-3 gap-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={boards.map((board) => board.id)}>
              {boards.map((board) => (
                <Board
                  key={board.id}
                  title={board.title}
                  id={board.id}
                  onAddItem={() => {
                    setShowAddItemModal(true);
                    setCurrentBoardId(board.id);
                  }}
                >
                  <SortableContext items={board.items.map((item) => item.id)}>
                    <div className="flex flex-col items-start gap-y-4">
                      {board.items.map((item) => (
                        <Items key={item.id} id={item.id} title={item.title} />
                      ))}
                    </div>
                  </SortableContext>
                </Board>
              ))}
            </SortableContext>
            <DragOverlay adjustScale={false}>
              {/* Drag Overlay For item Item */}
              {activeId && activeId.toString().includes("item") && (
                <Items id={activeId} title={findItemTitle(activeId)} />
              )}
              {/* Drag Overlay For Board */}
              {activeId && activeId.toString().includes("board") && (
                <Board id={activeId} title={findBoardTitle(activeId)}>
                  {findBoardItems(activeId).map((i) => (
                    <Items key={i.id} title={i.title} id={i.id} />
                  ))}
                </Board>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
