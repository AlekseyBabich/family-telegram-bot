import { useEffect } from 'react';
import SectionCard from '../components/SectionCard';
import type { BasicUser } from '../services/auth';
import { ensureBudgetPlaceholder } from '../services/db';
import { TEXT } from '../constants/ru';

interface BudgetPageProps {
  user: BasicUser | null;
}

const Budget = (_props: BudgetPageProps) => {
  useEffect(() => {
    ensureBudgetPlaceholder();
  }, []);

  return (
    <div className="page budget-page">
      <SectionCard title={TEXT.header.tabs.budget}>
        <p>{TEXT.budget.placeholder}</p>
      </SectionCard>
    </div>
  );
};

export default Budget;
