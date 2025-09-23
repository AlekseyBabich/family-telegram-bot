import ShoppingList from '../components/ShoppingList';
import type { BasicUser } from '../services/auth';

interface ShoppingPageProps {
  user: BasicUser | null;
}

const Shopping = ({ user }: ShoppingPageProps) => {
  return (
    <div className="page shopping-page">
      <ShoppingList category="food" user={user} />
      <ShoppingList category="household" user={user} />
      <ShoppingList category="clothes" user={user} />
    </div>
  );
};

export default Shopping;
