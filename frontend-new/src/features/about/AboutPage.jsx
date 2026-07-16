import { useLanguage } from '../../i18n/LanguageContext';
import { members } from './membersData';
import './AboutPage.css';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="about-page">
      <h1>{t('about.title')}</h1>
      <p className="about-intro">{t('about.description')}</p>

      <div className="members-grid">
        {members.map((member) => (
          <div key={member.id} className="member-card">
            <img src={member.avatar} alt={member.name} className="member-avatar" />
            <h3 className="member-name">{member.name}</h3>
            <p className="member-title">{member.title}</p>
            <p className="member-email">
              📧 <a href={`mailto:${member.email}`}>{member.email}</a>
            </p>
            <div className="member-social">
              {member.facebook && (
                <a href={member.facebook} target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              )}
              {member.instagram && (
                <a href={member.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}