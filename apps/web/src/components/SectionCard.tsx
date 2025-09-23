import { PropsWithChildren } from 'react';

interface SectionCardProps {
  title: string;
  actions?: React.ReactNode;
}

const SectionCard = ({ title, actions, children }: PropsWithChildren<SectionCardProps>) => (
  <section className="section-card">
    <header className="section-card-header">
      <h2>{title}</h2>
      {actions && <div className="section-card-actions">{actions}</div>}
    </header>
    <div className="section-card-body">{children}</div>
  </section>
);

export default SectionCard;
