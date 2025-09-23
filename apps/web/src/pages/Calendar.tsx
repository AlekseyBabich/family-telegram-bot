import CalendarList from '../components/CalendarList';
import type { BasicUser } from '../services/auth';

interface CalendarPageProps {
  user: BasicUser | null;
}

const Calendar = ({ user }: CalendarPageProps) => {
  return (
    <div className="page calendar-page">
      <CalendarList user={user} />
    </div>
  );
};

export default Calendar;
