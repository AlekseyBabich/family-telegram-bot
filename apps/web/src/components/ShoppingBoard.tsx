import { useState } from 'react';
import ShoppingModal from './ShoppingModal';

interface ShoppingItem {
  id: string;
  title: string;
  done: boolean;
}

interface ShoppingColumn {
  id: string;
  title: string;
  items: ShoppingItem[];
}

interface ShoppingModalState {
  isOpen: boolean;
  listId: string;
  title: string;
}

const createInitialItems = (columnIndex: number): ShoppingItem[] =>
  Array.from({ length: 20 }, (_, index) => {
    const id = `list-${columnIndex + 1}-item-${index + 1}`;
    const title = `Продукт ${index + 1}`;
    const done = (index + columnIndex) % 3 === 0 || index % 5 === 0;

    return { id, title, done };
  });

const createInitialColumns = (): ShoppingColumn[] => [
  { id: 'list-1', title: 'Список 1', items: createInitialItems(0) },
  { id: 'list-2', title: 'Список 2', items: createInitialItems(1) },
  { id: 'list-3', title: 'Список 3', items: createInitialItems(2) },
];

const ShoppingBoard = () => {
  const [columns, setColumns] = useState<ShoppingColumn[]>(() => createInitialColumns());
  const [modalState, setModalState] = useState<ShoppingModalState>({
    isOpen: false,
    listId: 'list-1',
    title: '',
  });

  const openModal = () => {
    setModalState({
      isOpen: true,
      listId: columns[0]?.id ?? 'list-1',
      title: '',
    });
  };

  const closeModal = () => {
    setModalState((state) => ({ ...state, isOpen: false, title: '' }));
  };

  const handleAddItem = () => {
    const trimmedTitle = modalState.title.trim();
    if (!trimmedTitle) {
      return;
    }

    setColumns((prevColumns) =>
      prevColumns.map((column) => {
        if (column.id !== modalState.listId) {
          return column;
        }

        const newItem: ShoppingItem = {
          id: `${column.id}-item-${column.items.length + 1}-${Date.now()}`,
          title: trimmedTitle,
          done: false,
        };

        return {
          ...column,
          items: [...column.items, newItem],
        };
      })
    );

    setModalState((state) => ({ ...state, isOpen: false, title: '' }));
  };

  return (
    <div className="shopping-board">
      <div className="shopping-columns">
        {columns.map((column) => (
          <div key={column.id} className="shopping-column">
            <div className="shopping-column-title">{column.title}</div>
            <ul className="shopping-items">
              {column.items.map((item) => (
                <li key={item.id} className="shopping-item">
                  <span className={`shopping-item-icon ${item.done ? 'done' : 'pending'}`}>
                    {item.done ? '✔' : '−'}
                  </span>
                  <span className="shopping-item-title">{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button type="button" className="shopping-add-button" onClick={openModal}>
        Добавить
      </button>

      <ShoppingModal
        isOpen={modalState.isOpen}
        listId={modalState.listId}
        title={modalState.title}
        listOptions={columns.map((column) => ({ id: column.id, label: column.title }))}
        onListChange={(listId) => setModalState((state) => ({ ...state, listId }))}
        onTitleChange={(title) => setModalState((state) => ({ ...state, title }))}
        onClose={closeModal}
        onSubmit={handleAddItem}
      />
    </div>
  );
};

export default ShoppingBoard;
