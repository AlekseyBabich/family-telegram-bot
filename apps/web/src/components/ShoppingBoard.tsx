import { KeyboardEvent, useState } from 'react';
import ShoppingModal from './ShoppingModal';
import { sortItems } from '../utils/sort';

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

const createInitialColumns = (): ShoppingColumn[] => {
  const columnConfigs: Array<{ id: string; title: string; items: string[] }> = [
    {
      id: 'list-1',
      title: 'Еда',
      items: [
        'Хлеб',
        'Батон',
        'Молоко',
        'Масло',
        'Сметана',
        'Йогурт дет.',
        'Йогурт взр.',
        'Фрукты',
        'Колбаса вар.',
        'Колбаса коп.',
        'Сыр затирка',
        'Сыр вкусный',
        'Сыр плавленый',
        'Том. паста',
        'Аджика',
        'Майонез',
        'Кетчуп',
        'Печенье',
        'Пряники',
        'Конфеты',
      ],
    },
    {
      id: 'list-2',
      title: 'Бытовое',
      items: [
        'Бумага туалет.',
        'Освежитель воз.',
        'Бумаж. салф.',
        'Мыло для рук',
        'Мыло хоз.',
        'Доместос',
        'Чистка ванны',
        'Ср. для мытья посуды',
        'Губки',
      ],
    },
    {
      id: 'list-3',
      title: 'Вещи',
      items: ['Трусы', 'Носки', 'Куртка', 'Кроссовки'],
    },
  ];

  return columnConfigs.map(({ id, title, items }) => ({
    id,
    title,
    items: sortItems(
      items.map((itemTitle, index) => ({
        id: `${id}-item-${index + 1}`,
        title: itemTitle,
        done: false,
      }))
    ),
  }));
};

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

  const toggleItem = (columnId: string, itemId: string) => {
    setColumns((prevColumns) =>
      prevColumns.map((column) => {
        if (column.id !== columnId) {
          return column;
        }

        const updatedItems = column.items.map((item) =>
          item.id === itemId ? { ...item, done: !item.done } : item
        );

        return {
          ...column,
          items: sortItems(updatedItems),
        };
      })
    );
  };

  const handleItemKeyDown = (
    event: KeyboardEvent<HTMLLIElement>,
    columnId: string,
    itemId: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Space') {
      event.preventDefault();
      toggleItem(columnId, itemId);
    }
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
          items: sortItems([...column.items, newItem]),
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
                <li
                  key={item.id}
                  className="shopping-item"
                  tabIndex={0}
                  role="button"
                  aria-pressed={item.done}
                  onClick={() => toggleItem(column.id, item.id)}
                  onKeyDown={(event) =>
                    handleItemKeyDown(event, column.id, item.id)
                  }
                >
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
