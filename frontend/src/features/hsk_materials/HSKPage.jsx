import { lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import RouteLoading from '../../shell/RouteLoading';
import './HSKPage.css';

const Vocabulary = lazy(() => import('./components/Vocabulary'));
const Listening = lazy(() => import('./components/Listening'));
const Reading = lazy(() => import('./components/Reading'));
const Grammar = lazy(() => import('./components/Grammar'));
const MockTest = lazy(() => import('./components/MockTest'));

const SECTIONS = [
  { key: 'vocabulary', icon: '词', component: Vocabulary },
  { key: 'listening', icon: '听', component: Listening },
  { key: 'reading', icon: '读', component: Reading },
  { key: 'grammar', icon: '语', component: Grammar },
  { key: 'mocktest', icon: '试', component: MockTest },
];

export default function HSKPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { sectionKey } = useParams();

  const section = SECTIONS.find((s) => s.key === sectionKey);

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
              onClick={() => navigate(`/hsk/${s.key}`)}
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
      <button type="button" className="hsk-back-btn" onClick={() => navigate('/hsk')}>
        ← {t('hsk.common.back')}
      </button>
      <div className="hsk-page-header">
        <h1>{t(`hsk.tab.${section.key}`)}</h1>
        <p>{t(`hsk.menu.${section.key}`)}</p>
      </div>
      <div className="hsk-content">
        <Suspense fallback={<RouteLoading />}>
          <SectionComponent />
        </Suspense>
      </div>
    </div>
  );
}