import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Story } from '../../types';
import StoryCard from './StoryCard';

interface Props {
  stories: Story[];
  onReorder: (stories: Story[]) => void;
  onEdit: (story: Story) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export default function PrdBoard({ stories, onReorder, onEdit, onDelete, disabled }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stories.findIndex((s) => s.id === active.id);
      const newIndex = stories.findIndex((s) => s.id === over.id);
      onReorder(arrayMove(stories, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onEdit={onEdit}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
