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

// Grouped menu, same shape as listening/registry.js's GROUPS: a group
// (title + desc) containing several feature cards. To add a new HSK
// feature: create its component, add one entry to the relevant group's
// `sections`, then add `hsk.tab.<key>` / `hsk.menu.<key>` i18n keys. To add
// a whole new group, add an entry here plus `hsk.group.<key>.title` /
// `hsk.group.<key>.desc` translations.
const GROUPS = [
  {
    key: 'vocab',
    sections: [
      { key: 'vocabulary', icon: '词', component: Vocabulary },
      { key: 'listening', icon: '听', component: Listening },
      { key: 'mocktest', icon: '试', component: MockTest },
    ],
  },
  {
    key: 'grammar',
    sections: [{ key: 'grammar', icon: '语', component: Grammar }],
  },
  {
    key: 'reading',
    sections: [{ key: 'reading', icon: '读', component: Reading }],
  },
];

export default function HSKPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { sectionKey } = useParams();

  for (const g of GROUPS) {
    const section = g.sections.find((s) => s.key === sectionKey);
    if (section) {
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
  }

  return (
    <div className="hsk-page">
      <div className="hsk-page-header">
        <h1>{t('hsk.title')}</h1>
        <p>{t('hsk.description')}</p>
      </div>

      {GROUPS.map((g) => (
        <section key={g.key} className="hsk-group">
          <h2 className="hsk-group-title">{t(`hsk.group.${g.key}.title`)}</h2>
          <p className="hsk-group-desc">{t(`hsk.group.${g.key}.desc`)}</p>
          <div className="hsk-menu-grid">
            {g.sections.map((s) => (
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
        </section>
      ))}
    </div>
  );
}
