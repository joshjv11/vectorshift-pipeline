export const DraggableNode = ({ type, label }) => {
  const onDragStart = (event, nodeType) => {
    const appData = { nodeType };
    event.currentTarget.style.cursor = 'grabbing';
    event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`${type} flex h-14 min-w-[88px] cursor-grab select-none flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200 active:cursor-grabbing`}
      onDragStart={(event) => onDragStart(event, type)}
      onDragEnd={(event) => {
        event.currentTarget.style.cursor = 'grab';
      }}
      draggable
      role="button"
      tabIndex={0}
      aria-label={`Drag to add ${label} node`}
    >
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </div>
  );
};
