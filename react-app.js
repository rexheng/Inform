import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const styles = {
  root: {
    '--clr-bg': '#F4F7F5',
    '--clr-surface': '#FFFFFF',
    '--clr-text-dark': '#0A3B2A',
    '--clr-text-muted': '#537566',
    '--clr-accent-lime': '#D9FA58',
    '--clr-accent-mint': '#A3E4D1',
    '--clr-accent-purple': '#D0A4FF',
  },
  body: {
    backgroundColor: '#F4F7F5',
    color: '#0A3B2A',
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    lineHeight: 1.4,
    WebkitFontSmoothing: 'antialiased',
    display: 'flex',
    justifyContent: 'center',
    backgroundImage: 'linear-gradient(to right, #e0e5e3, #F4F7F5, #e0e5e3)',
    minHeight: '100vh',
  },
  appContainer: {
    backgroundColor: '#F4F7F5',
    width: '100%',
    maxWidth: '414px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 0 20px rgba(0,0,0,0.05)',
  },
  topBar: {
    padding: '16px 16px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    backgroundColor: '#F4F7F5',
    zIndex: 10,
  },
  patientInfo: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: '#D9FA58',
    color: '#0A3B2A',
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pillLocation: {
    backgroundColor: 'transparent',
    border: '1.5px solid #0A3B2A',
    color: '#0A3B2A',
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  menuBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#0A3B2A',
    color: '#D9FA58',
    border: 'none',
    fontSize: '0.7rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  mainContent: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '60px',
  },
  heroSection: {
    padding: '8px 0',
  },
  patientGreeting: {
    fontSize: '1.75rem',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    lineHeight: 1.1,
    marginBottom: '16px',
    color: '#0A3B2A',
  },
  waitCard: {
    backgroundColor: '#0A3B2A',
    color: '#FFFFFF',
    borderRadius: '32px',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  waitCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  waitLabel: {
    fontSize: '0.875rem',
    color: '#A3E4D1',
    fontWeight: 500,
  },
  targetBadge: {
    backgroundColor: '#D0A4FF',
    color: '#0A3B2A',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '999px',
  },
  waitTimeValue: {
    fontSize: '3.5rem',
    fontWeight: 800,
    letterSpacing: '-0.05em',
    lineHeight: 1,
    marginBottom: '4px',
    color: '#D9FA58',
  },
  waitDetails: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.8)',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.15)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '16px',
    marginBottom: '8px',
    border: '1.5px solid transparent',
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  optionCardRecommended: {
    backgroundColor: '#D9FA58',
    borderColor: '#D9FA58',
    borderRadius: '20px',
    padding: '16px',
    marginBottom: '8px',
    border: '1.5px solid #D9FA58',
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  optionCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  hospitalName: {
    fontSize: '1.125rem',
    fontWeight: 700,
    lineHeight: 1.2,
    maxWidth: '80%',
  },
  optionMetrics: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
    opacity: 0.7,
  },
  metricVal: {
    fontSize: '1rem',
    fontWeight: 700,
  },
  saveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#0A3B2A',
    color: '#D9FA58',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  comparisonPanel: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    overflow: 'hidden',
  },
  compSide: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  compSideSwitch: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#A3E4D1',
  },
  compLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    marginBottom: '4px',
    opacity: 0.8,
  },
  compVal: {
    fontSize: '1.5rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  compDivider: {
    width: '2px',
    backgroundColor: '#F4F7F5',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compVs: {
    backgroundColor: '#0A3B2A',
    color: '#FFFFFF',
    fontSize: '0.6rem',
    fontWeight: 700,
    padding: '4px',
    borderRadius: '50%',
    position: 'absolute',
    zIndex: 2,
  },
  eduCard: {
    backgroundColor: '#D0A4FF',
    borderRadius: '32px',
    padding: '24px',
  },
  eduTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    marginBottom: '8px',
    lineHeight: 1.2,
  },
  eduBody: {
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '16px',
    opacity: 0.9,
  },
  btnPrimary: {
    backgroundColor: '#0A3B2A',
    color: '#FFFFFF',
    border: 'none',
    width: '100%',
    padding: '16px',
    borderRadius: '999px',
    fontSize: '0.9rem',
    fontWeight: 700,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
};

const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="10" r="3"></circle>
    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
  </svg>
);

const ArrowIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"></path>
  </svg>
);

const TopBar = ({ onMenuClick }) => (
  <header style={styles.topBar}>
    <div style={styles.patientInfo}>
      <div style={styles.pill}>NHS ClearPath</div>
      <div style={styles.pillLocation}>
        <LocationIcon />
        Lambeth
      </div>
    </div>
    <button style={styles.menuBtn} aria-label="Menu" onClick={onMenuClick}>Menu</button>
  </header>
);

const WaitCard = () => (
  <div style={styles.waitCard}>
    <div style={styles.waitCardHeader}>
      <span style={styles.waitLabel}>Current Estimated Wait</span>
      <span style={styles.targetBadge}>NHS Target: 2 Wks</span>
    </div>
    <div style={styles.waitTimeValue}>14 Weeks</div>
    <div style={styles.waitDetails}>
      <strong>Referral:</strong> Suspected Cancer (Breast)<br />
      <strong>Date:</strong> 12 Oct 2023 • King's College Hospital
    </div>
  </div>
);

const OptionCard = ({ recommended, hospitalName, waitTime, travel, savings, onPress }) => {
  const [pressed, setPressed] = useState(false);
  const cardStyle = {
    ...(recommended ? styles.optionCardRecommended : styles.optionCard),
    transform: pressed ? 'scale(0.98)' : 'scale(1)',
  };

  return (
    <div
      style={cardStyle}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={onPress}
    >
      <div style={styles.optionCardTop}>
        <h3 style={styles.hospitalName}>{hospitalName}</h3>
        <ArrowIcon size={20} />
      </div>
      <div style={styles.optionMetrics}>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Wait Time</span>
          <span style={styles.metricVal}>{waitTime}</span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Travel</span>
          <span style={styles.metricVal}>{travel}</span>
        </div>
      </div>
      {savings && (
        <div style={styles.saveBadge}>Saves you {savings}</div>
      )}
    </div>
  );
};

const ComparisonPanel = () => (
  <div style={styles.comparisonPanel}>
    <div style={styles.compSide}>
      <span style={styles.compLabel}>If you stay</span>
      <span style={styles.compVal}>14 Wks</span>
    </div>
    <div style={styles.compDivider}>
      <span style={styles.compVs}>VS</span>
    </div>
    <div style={styles.compSideSwitch}>
      <span style={styles.compLabel}>If you switch</span>
      <span style={styles.compVal}>3 Wks</span>
    </div>
  </div>
);

const EduCard = ({ onGenerate }) => (
  <div style={styles.eduCard}>
    <h2 style={styles.eduTitle}>Your NHS Right<br />to Choose</h2>
    <p style={styles.eduBody}>
      If you have been waiting over 2 weeks for a suspected cancer referral, you have a legal right to request a transfer to a hospital with a shorter list.
    </p>
    <button style={styles.btnPrimary} onClick={onGenerate}>
      Generate transfer request
      <ArrowIcon size={16} />
    </button>
  </div>
);

const Modal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '32px',
          padding: '32px 24px',
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0A3B2A', letterSpacing: '-0.02em' }}>{title}</h2>
        <p style={{ fontSize: '0.875rem', color: '#537566', marginBottom: '24px', lineHeight: 1.5 }}>{message}</p>
        <button
          style={{ ...styles.btnPrimary, justifyContent: 'center' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const openHospitalModal = (name, waitTime, travel) => {
    setModal({
      isOpen: true,
      title: name,
      message: `Wait time: ${waitTime} • Travel: ${travel}. You can request a transfer to this hospital through the NHS Choose & Book system or ask your GP to make the referral.`,
    });
  };

  const openTransferModal = () => {
    setModal({
      isOpen: true,
      title: 'Transfer Request',
      message: 'Your transfer request is being prepared. Your GP and the selected hospital will be notified. You should receive a confirmation within 2 working days.',
    });
  };

  const openMenuModal = () => {
    setModal({
      isOpen: true,
      title: 'NHS ClearPath Menu',
      message: 'Access your referral history, account settings, and support resources from this menu.',
    });
  };

  return (
    <div style={styles.body}>
      <div style={styles.appContainer}>
        <TopBar onMenuClick={openMenuModal} />
        <main style={styles.mainContent}>
          <section style={styles.heroSection}>
            <h1 style={styles.patientGreeting}>Hello Sarah,<br />Here is your referral status.</h1>
            <WaitCard />
          </section>

          <section>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Shorter Waits Near You</h2>
            </div>
            <OptionCard
              recommended
              hospitalName="Guy's Hospital"
              waitTime="3 Weeks"
              travel="25 mins"
              savings="11 weeks"
              onPress={() => openHospitalModal("Guy's Hospital", '3 Weeks', '25 mins')}
            />
            <OptionCard
              hospitalName="St Thomas' Hospital"
              waitTime="5 Weeks"
              travel="40 mins"
              onPress={() => openHospitalModal("St Thomas' Hospital", '5 Weeks', '40 mins')}
            />
          </section>

          <section>
            <h2 style={{ ...styles.sectionTitle, marginBottom: '12px', fontSize: '1rem' }}>Impact Summary</h2>
            <ComparisonPanel />
          </section>

          <section>
            <EduCard onGenerate={openTransferModal} />
          </section>
        </main>

        <Modal
          isOpen={modal.isOpen}
          onClose={() => setModal({ isOpen: false, title: '', message: '' })}
          title={modal.title}
          message={modal.message}
        />
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#F4F7F5';
  }, []);

  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;