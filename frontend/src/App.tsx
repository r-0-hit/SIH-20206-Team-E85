import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { MapExplorerPage } from './pages/MapExplorerPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResultDetailPage } from './pages/ResultDetailPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PredictionPage } from './pages/PredictionPage';
import { authService } from './services/authService';
import { detectionService } from './services/detectionService';
import { AnalyticsSummary, Detection, Facility, User } from './types/index';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  const [detections, setDetections] = useState<Detection[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load current user and initial datasets
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Session user
      const user = authService.getStoredUser();
      if (user) {
        setCurrentUser(user);
      } else {
        // Automatically default to demo analyst so user has zero friction exploring
        const defaultAnalyst: User = {
          id: 'USR-ANALYST-001',
          username: 'analyst',
          email: 'analyst@pyroguard.ai',
          role: 'ANALYST',
          fullName: 'Alex Mercer (GIS Specialist)',
        };
        setCurrentUser(defaultAnalyst);
      }

      // 2. Fetch detections & facilities & analytics in parallel
      const [detectionsData, facilitiesData, analyticsData] = await Promise.all([
        detectionService.getDetections({ limit: 50 }).catch(() => ({ detections: [] })),
        detectionService.getFacilities().catch(() => []),
        detectionService.getAnalyticsSummary().catch(() => null),
      ]);

      setDetections(detectionsData.detections || []);
      setFacilities(facilitiesData || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load initial platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActivePage('landing');
  };

  const handleSelectDetection = (d: Detection) => {
    setSelectedDetection(d);
    setActivePage('result');
  };

  const handleNewAnalysis = (d: Detection) => {
    setDetections((prev) => [d, ...prev]);
    setSelectedDetection(d);
    setActivePage('result');
    detectionService.getAnalyticsSummary().then((a) => setAnalytics(a)).catch(() => {});
  };

  const activeCriticalCount = detections.filter(
    (d) => d.risk_score >= 80 && d.status === 'ACTIVE'
  ).length;

  // The public marketing site renders standalone, without the console chrome,
  // so its sticky header and smooth-scroll anchors work against the document.
  if (activePage === 'landing') {
    return <LandingPage onNavigate={(page) => setActivePage(page)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={(page) => setActivePage(page)}
        activePage={activePage}
        activeCriticalCount={activeCriticalCount}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Navigation */}
        {activePage !== 'login' && (
          <Sidebar
            activePage={activePage}
            onNavigate={(page) => setActivePage(page)}
            currentUser={currentUser}
          />
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              analytics={analytics}
              detections={detections}
              facilities={facilities}
              onNavigate={(page) => setActivePage(page)}
              onSelectDetection={handleSelectDetection}
              onRefresh={loadInitialData}
              loading={loading}
            />
          )}

          {activePage === 'map' && (
            <MapExplorerPage
              detections={detections}
              facilities={facilities}
              onInspectDetection={handleSelectDetection}
              onRefresh={loadInitialData}
            />
          )}

          {activePage === 'prediction' && (
            <PredictionPage />
          )}

          {activePage === 'analyze' && (
            <AnalysisPage
              onAnalysisComplete={handleNewAnalysis}
              onNavigate={(page) => setActivePage(page)}
            />
          )}

          {activePage === 'result' && selectedDetection && (
            <ResultDetailPage
              detection={selectedDetection}
              onBack={() => setActivePage('dashboard')}
              onStatusUpdated={(updated) => {
                setSelectedDetection(updated);
                setDetections((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
              }}
            />
          )}

          {activePage === 'history' && (
            <HistoryPage
              detections={detections}
              onSelectDetection={handleSelectDetection}
              onRefresh={loadInitialData}
            />
          )}

          {activePage === 'analytics' && (
            <AnalyticsPage analytics={analytics} />
          )}

          {activePage === 'admin' && (
            <AdminDashboardPage />
          )}

          {activePage === 'login' && (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigate={(page) => setActivePage(page)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

