import type { BasicUser } from '../services/auth';
import ShoppingBoard from '../components/ShoppingBoard';

interface ShoppingPageProps {
  user: BasicUser | null;
}

const Shopping = ({ user: _user }: ShoppingPageProps) => {
  return (
    <div className="page shopping-page">
      <ShoppingBoard />
    </div>
  );
};

export default Shopping;
