import React, { Suspense } from "react";
import { ViewType } from "./src/types";
import Sidebar from "./src/layouts/Sidebar";
import Header from "./src/layouts/Header";
import GlobalSearch from "./src/layouts/GlobalSearch";
import BottomNavBar from "./src/layouts/BottomNavBar";
import ErrorBoundary from "./src/shared/ui/ErrorBoundary";
import Login from "./src/pages/auth/LoginPage";

import { useData } from "./src/contexts/DataContext";
import { useAuth } from "./src/hooks/useAuth";
import { useAuxiliaryData } from "./src/hooks/useAuxiliaryData";
import { useAppRouting } from "./src/hooks/useAppRouting";

import PublicRoutes, { isPublicRoutePath } from "./src/routes/PublicRoutes";
import AuthenticatedRoutes from "./src/routes/AuthenticatedRoutes";

function App() {
  // ─── Authentication & Session ───────────────────────────────────────────
  const auth = useAuth();

  // ─── Global Shared Data Context ─────────────────────────────────────────
  const data = useData();

  // ─── Auxiliary Application Data & Notifications ─────────────────────────
  const auxData = useAuxiliaryData({
    appDataClientFeedback: data.appData.clientFeedback,
    appDataLoadedClientFeedback: data.appData.loaded.clientFeedback,
    setClientFeedback: data.setClientFeedback,
  });

  // ─── Application Routing & Navigation ───────────────────────────────────
  const routing = useAppRouting({
    isAuthenticated: auth.isAuthenticated,
    profile: auxData.profile,
    teamPaymentsLoaded: auxData.teamPaymentsLoaded,
    setTeamProjectPayments: auxData.setTeamProjectPayments,
    setTeamPaymentsLoaded: auxData.setTeamPaymentsLoaded,
    onMarkNotificationRead: auxData.handleMarkAsRead,
    appDataLoader: data.appData,
  });

  // ─── Public & External Route Dispatcher ─────────────────────────────────
  if (isPublicRoutePath(routing.route)) {
    return (
      <PublicRoutes
        route={routing.route}
        isAuthenticated={auth.isAuthenticated}
        users={auth.users}
        handleLoginSuccess={auth.handleLoginSuccess}
        profile={auxData.profile}
        showNotification={auxData.showNotification}
        addNotification={auxData.addNotification}
        clients={data.clients}
        setClients={data.setClients}
        projects={data.projects}
        setProjects={data.setProjects}
        teamMembers={data.teamMembers}
        transactions={data.transactions}
        setTransactions={data.setTransactions}
        cards={data.cards}
        setCards={data.setCards}
        leads={data.leads}
        setLeads={data.setLeads}
        pockets={data.pockets}
        setPockets={data.setPockets}
        promoCodes={auxData.promoCodes}
        setPromoCodes={auxData.setPromoCodes}
        packages={data.packages}
        addOns={data.addOns}
        clientFeedback={data.clientFeedback}
        setClientFeedback={data.setClientFeedback}
        notifications={auxData.notifications}
        teamProjectPayments={auxData.teamProjectPayments}
        teamPaymentRecords={auxData.teamPaymentRecords}
      />
    );
  }

  // ─── Fallback Authentication Gate ───────────────────────────────────────
  if (!auth.isAuthenticated) {
    return <Login onLoginSuccess={auth.handleLoginSuccess} users={auth.users} />;
  }

  // ─── Authenticated Application Shell ────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-brand-bg text-brand-text-primary">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={routing.activeView}
        setActiveView={(view) => routing.handleNavigation(view)}
        isOpen={routing.isSidebarOpen}
        setIsOpen={routing.setIsSidebarOpen}
        currentUser={auth.currentUser}
        onLogout={auth.handleLogout}
        profile={auxData.profile}
      />

      <div className="flex-1 flex flex-col xl:pl-64 overflow-hidden">
        {/* Top Header */}
        <Header
          pageTitle={routing.activeView}
          toggleSidebar={() => routing.setIsSidebarOpen(!routing.isSidebarOpen)}
          setIsSearchOpen={routing.setIsSearchOpen}
          notifications={auxData.notifications}
          handleNavigation={routing.handleNavigation}
          handleMarkAllAsRead={auxData.handleMarkAllAsRead}
          currentUser={auth.currentUser}
          profile={auxData.profile}
          handleLogout={auth.handleLogout}
        />

        {/* Main Content Area */}
        <main
          className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-20 xl:pb-8 overflow-y-auto"
          style={{
            paddingBottom: "calc(5rem + var(--safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="animate-fade-in">
            <ErrorBoundary
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-red-500 text-4xl mb-2">⚠️</div>
                    <p className="text-brand-text-secondary">
                      Gagal memuat komponen. Silakan coba lagi.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 button-primary"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative flex justify-center items-center">
                      <div className="absolute border-4 border-brand-accent/20 rounded-full w-12 h-12"></div>
                      <div className="animate-spin border-4 border-transparent border-t-brand-accent rounded-full w-12 h-12"></div>
                    </div>
                  </div>
                }
              >
                <AuthenticatedRoutes
                  activeView={routing.activeView}
                  hasPermission={auth.hasPermission}
                  handleNavigation={routing.handleNavigation}
                  onBackToDashboard={() =>
                    React.startTransition(() => routing.setActiveView(ViewType.DASHBOARD))
                  }
                  currentUser={auth.currentUser}
                  users={auth.users}
                  setUsers={auth.setUsers}
                  clients={data.clients}
                  setClients={data.setClients}
                  projects={data.projects}
                  setProjects={data.setProjects}
                  teamMembers={data.teamMembers}
                  setTeamMembers={data.setTeamMembers}
                  transactions={data.transactions}
                  setTransactions={data.setTransactions}
                  leads={data.leads}
                  setLeads={data.setLeads}
                  cards={data.cards}
                  setCards={data.setCards}
                  pockets={data.pockets}
                  setPockets={data.setPockets}
                  packages={data.packages}
                  setPackages={data.setPackages}
                  addOns={data.addOns}
                  setAddOns={data.setAddOns}
                  clientFeedback={data.clientFeedback}
                  setClientFeedback={data.setClientFeedback}
                  totals={data.totals}
                  appData={data.appData}
                  profile={auxData.profile}
                  setProfile={auxData.setProfile}
                  handleSetProfile={auxData.handleSetProfile}
                  notifications={auxData.notifications}
                  promoCodes={auxData.promoCodes}
                  setPromoCodes={auxData.setPromoCodes}
                  contracts={auxData.contracts}
                  setContracts={auxData.setContracts}
                  teamProjectPayments={auxData.teamProjectPayments}
                  setTeamProjectPayments={auxData.setTeamProjectPayments}
                  teamPaymentRecords={auxData.teamPaymentRecords}
                  setTeamPaymentRecords={auxData.setTeamPaymentRecords}
                  initialAction={routing.initialAction}
                  setInitialAction={routing.setInitialAction}
                  showNotification={auxData.showNotification}
                  addNotification={auxData.addNotification}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global Notification Toast */}
      {auxData.notification && (
        <div
          className="
              fixed top-4 right-4 
              sm:top-6 sm:right-6
              bg-brand-accent 
              text-white 
              py-3 px-4 sm:py-4 sm:px-6
              rounded-xl 
              shadow-2xl 
              z-50 
              animate-fade-in-out
              backdrop-blur-sm
              border border-brand-accent-hover/20
              max-w-sm
              break-words
          "
          style={{
            top: "calc(1rem + var(--safe-area-inset-top, 0px))",
            right: "calc(1rem + var(--safe-area-inset-right, 0px))",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse-soft" />
            <span className="font-medium text-sm sm:text-base">
              {auxData.notification}
            </span>
          </div>
        </div>
      )}

      {/* Global Search Dialog */}
      <GlobalSearch
        isOpen={routing.isSearchOpen}
        onClose={() => routing.setIsSearchOpen(false)}
        clients={data.clients}
        projects={data.projects}
        teamMembers={data.teamMembers}
        handleNavigation={routing.handleNavigation}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNavBar
        activeView={routing.activeView}
        handleNavigation={routing.handleNavigation}
      />
    </div>
  );
}

export default App;
