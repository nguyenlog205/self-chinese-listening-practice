import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import Vocabulary from './components/Vocabulary';
import Listening from './components/Listening';
import Reading from './components/Reading';
import MockTest from './components/MockTest';
import './HSKPage.css';

const SECTIONS = [
  { key: 'vocabulary', icon: '词', component: Vocabulary },
  { key: 'listening', icon: '听', component: Listening },
  { key: 'reading', icon: '读', component: Reading },
  { key: 'mocktest', icon: '试', component: MockTest },
];

export default function HSKPage() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(null);

  const section = SECTIONS.find((s) => s.key === activeSection);

  if (!section) {
    return (
      <div className="hsk-page">
        <div className="hsk-page-header">
          <h1>{t('hsk.title')}</h1>
          <p>{t('hsk.description')}</p>
        </div>
        <div className="hsk-menu-grid">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className="hsk-menu-card"
              onClick={() => setActiveSection(s.key)}
            >
              <span className="hsk-menu-icon">{s.icon}</span>
              <span className="hsk-menu-title">{t(`hsk.tab.${s.key}`)}</span>
              <span className="hsk-menu-desc">{t(`hsk.menu.${s.key}`)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const SectionComponent = section.component;

  return (
    <div className="hsk-page">
      <button type="button" className="hsk-back-btn" onClick={() => setActiveSection(null)}>
        ← {t('hsk.common.back')}
      </button>
      <div className="hsk-page-header">
        <h1>{t(`hsk.tab.${section.key}`)}</h1>
        <p>{t(`hsk.menu.${section.key}`)}</p>
      </div>
      <div className="hsk-content">
        <SectionComponent />
      </div>
    </div>
  );
}