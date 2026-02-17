import { ReactNode, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortableLayout = "vertical" | "horizontal" | "grid";

export interface SortableItemData {
  id: string;
}

interface SortableListProps<T extends SortableItemData> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode;
  layout?: SortableLayout;
  className?: string;
}

function getStrategy(layout: SortableLayout) {
  switch (layout) {
    case "horizontal": return horizontalListSortingStrategy;
    case "grid": return rectSortingStrategy;
    default: return verticalListSortingStrategy;
  }
}

function SortableItem<T extends SortableItemData>({
  item,
  renderItem,
}: {
  item: T;
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandle = (
    <button
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing touch-none p-1 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Sleep om te herschikken"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, dragHandle)}
    </div>
  );
}

export function SortableList<T extends SortableItemData>({
  items,
  onReorder,
  renderItem,
  layout = "vertical",
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      onReorder(arrayMove(items, oldIndex, newIndex));
    },
    [items, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={getStrategy(layout)}
      >
        <div className={className}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
