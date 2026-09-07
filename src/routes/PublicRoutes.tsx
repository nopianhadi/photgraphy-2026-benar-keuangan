import React, { lazy, Suspense } from "react";
import {
  Client,
  Project,
  TeamMember,
  Transaction,
  Profile,
  Lead,
  Card,
  ClientFeedback,
  Notification,
  PromoCode,
  Package,
  AddOn,
  TeamProjectPayment,
  TeamPaymentRecord,
  User,
} from "../types";
import { markSubStatusConfirmed } from "../services/projectSubStatusConfirmations";
import { LAST_ROUTE_STORAGE_KEY } from "./routesConfig";

// Lightweight/core components
import Homepage from "../pages/home/Homepage";
import Login from "../pages/auth/LoginPage";

// Lazy-loaded public route components
const VendorPublicProfile = lazy(() => import("../pages/public/VendorPublicProfile"));
const PortfolioDetailPage = lazy(() => import("../pages/public/PortfolioDetailPage"));
const PublicPackages = lazy(() => import("../features/public/components/PublicPackages"));
const PublicBookingForm = lazy(() => import("../features/public/components/PublicBookingForm"));
const PublicLeadForm = lazy(() => import("../features/public/components/PublicLeadForm"));
const PublicFeedbackForm = lazy(() => import("../features/public/components/PublicFeedbackForm"));
const SuggestionForm = lazy(() => import("../features/public/components/SuggestionForm"));
const TestSignature = lazy(() => import("../features/test/TestSignature"));
const PublicGallery = lazy(() => import("../features/public/components/PublicGallery"));
const PublicRouter = lazy(() => import("../features/public/components/PublicRouter"));
const PublicContract = lazy(() => import("../features/public/components/PublicContract"));
const ChecklistPortal = lazy(() => import("../features/projects/components/ChecklistPortal"));
const PublicInvoice = lazy(() => import("../features/public/components/PublicInvoice"));
const PublicReceipt = lazy(() => import("../features/public/components/PublicReceipt"));
const ClientPortal = lazy(() => import("../features/clients/components/ClientPortal"));
const FreelancerPortal = lazy(() => import("../features/team/components/FreelancerPortal"));

export function isPublicRoutePath(route: string): boolean {
  return (
    route.startsWith("#/home") ||
    route === "#/" ||
    route === "#" ||
    route.startsWith("#/login") ||
    route.startsWith("#/profile") ||
    route.startsWith("#/portfolio/") ||
    route.startsWith("#/public-packages") ||
    route.startsWith("#/public-booking") ||
    route.startsWith("#/public-lead-form") ||
    route.startsWith("#/feedback") ||
    route.startsWith("#/suggestion-form") ||
    route.startsWith("#/test-signature") ||
    route.startsWith("#/gallery/") ||
    route.startsWith("#/public/") ||
    route.startsWith("#/portal/contract/") ||
    route.startsWith("#/contract/") ||
    route.startsWith("#/checklist-portal/") ||
    route.startsWith("#/project/") ||
    route.startsWith("#/portal/invoice/") ||
    route.startsWith("#/invoice/") ||
    route.startsWith("#/portal/receipt/") ||
    route.startsWith("#/receipt/") ||
    route.startsWith("#/portal/") ||
    route.startsWith("#/freelancer-portal/")
  );
}

export interface PublicRoutesProps {
  route: string;
  isAuthenticated: boolean;
  users: User[];
  handleLoginSuccess: (user: User) => void;
  profile: Profile;
  showNotification: (msg: string, duration?: number) => void;
  addNotification: (
    newNotificationData: Omit<Notification, "id" | "timestamp" | "isRead">,
  ) => Promise<void>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  teamMembers: TeamMember[];
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  pockets: any[];
  setPockets: React.Dispatch<React.SetStateAction<any[]>>;
  promoCodes: PromoCode[];
  setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
  packages: Package[];
  addOns: AddOn[];
  clientFeedback: ClientFeedback[];
  setClientFeedback: React.Dispatch<React.SetStateAction<ClientFeedback[]>>;
  notifications: Notification[];
  teamProjectPayments: TeamProjectPayment[];
  teamPaymentRecords: TeamPaymentRecord[];
}

export const PublicRoutes: React.FC<PublicRoutesProps> = ({
  route,
  isAuthenticated,
  users,
  handleLoginSuccess,
  profile,
  showNotification,
  addNotification,
  clients,
  setClients,
  projects,
  setProjects,
  teamMembers,
  transactions,
  setTransactions,
  cards,
  setCards,
  leads,
  setLeads,
  pockets,
  setPockets,
  promoCodes,
  setPromoCodes,
  packages,
  addOns,
  clientFeedback,
  setClientFeedback,
  notifications,
  teamProjectPayments,
  teamPaymentRecords,
}) => {
  if (route.startsWith("#/home") || route === "#/" || route === "#") {
    if (isAuthenticated) {
      try {
        const last = window.localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
        if (
          last &&
          typeof last === "string" &&
          last.startsWith("#/") &&
          !last.startsWith("#/home") &&
          last !== route
        ) {
          window.location.hash = last;
          return null;
        }
      } catch (e) {
        console.warn("[Routing] Failed to read last route from localStorage:", e);
      }

      window.location.hash = "#/dashboard";
      return null;
    }

    return <Homepage />;
  }

  if (route.startsWith("#/login")) {
    return <Login onLoginSuccess={handleLoginSuccess} users={users} />;
  }

  if (route.startsWith("#/profile")) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
          </div>
        }
      >
        <VendorPublicProfile />
      </Suspense>
    );
  }

  if (route.startsWith("#/portfolio/")) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
          </div>
        }
      >
        <PortfolioDetailPage />
      </Suspense>
    );
  }

  if (route.startsWith("#/public-packages")) {
    return (
      <PublicPackages
        userProfile={profile}
        showNotification={showNotification}
        setClients={setClients}
        setProjects={setProjects}
        setTransactions={setTransactions}
        setCards={setCards}
        setLeads={setLeads}
        addNotification={addNotification}
        cards={cards}
        projects={projects}
        promoCodes={promoCodes}
        setPromoCodes={setPromoCodes}
      />
    );
  }

  if (route.startsWith("#/public-booking")) {
    const allDataForForm = {
      clients,
      projects,
      teamMembers,
      transactions,
      teamProjectPayments,
      teamPaymentRecords,
      pockets,
      profile,
      leads,
      cards,
      clientFeedback,
      notifications,
      promoCodes,
      packages,
      addOns,
    };
    return (
      <PublicBookingForm
        {...allDataForForm}
        userProfile={profile}
        showNotification={showNotification}
        setClients={setClients}
        setProjects={setProjects}
        setTransactions={setTransactions}
        setCards={setCards}
        setPockets={setPockets}
        setPromoCodes={setPromoCodes}
        setLeads={setLeads}
        addNotification={addNotification}
      />
    );
  }

  if (route.startsWith("#/public-lead-form")) {
    return (
      <PublicLeadForm
        setLeads={setLeads}
        userProfile={profile}
        showNotification={showNotification}
        addNotification={addNotification}
      />
    );
  }

  if (route.startsWith("#/feedback")) {
    return <PublicFeedbackForm setClientFeedback={setClientFeedback} />;
  }

  if (route.startsWith("#/suggestion-form")) {
    return <SuggestionForm setLeads={setLeads} />;
  }

  if (route.startsWith("#/test-signature")) {
    return <TestSignature />;
  }

  if (route.startsWith("#/gallery/")) {
    const raw = route.split("/gallery/")[1] || "";
    const galleryId = decodeURIComponent((raw.split(/[?#]/)[0] || "").split("/")[0] || "").trim();
    return <PublicGallery galleryId={galleryId} />;
  }

  if (route.startsWith("#/public/")) {
    const raw = route.slice("#/public/".length);
    const slug = decodeURIComponent((raw.split(/[?#]/)[0] || "").split("/")[0] || "").trim();
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <div className="relative flex justify-center items-center mb-6">
              <div className="absolute border-4 border-indigo-200 rounded-full w-16 h-16"></div>
              <div className="animate-spin border-4 border-transparent border-t-indigo-600 rounded-full w-16 h-16"></div>
            </div>
            <p className="text-sm font-medium text-slate-600">Memuat halaman publik...</p>
          </div>
        }
      >
        <PublicRouter
          slug={slug}
          clients={clients}
          projects={projects}
          transactions={transactions}
          teamMembers={teamMembers}
          userProfile={profile}
          packages={packages}
          showNotification={showNotification}
          setClientFeedback={setClientFeedback}
        />
      </Suspense>
    );
  }

  if (route.startsWith("#/portal/contract/") || route.startsWith("#/contract/")) {
    const raw = route.startsWith("#/portal/contract/")
      ? route.split("/portal/contract/")[1] || ""
      : route.split("/contract/")[1] || "";
    const contractId = decodeURIComponent((raw.split(/[?#]/)[0] || "").split("/")[0] || "").trim();
    return (
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20 min-h-screen">
            <div className="relative flex justify-center items-center">
              <div className="absolute border-4 border-brand-accent/20 rounded-full w-12 h-12"></div>
              <div className="animate-spin border-4 border-transparent border-t-brand-accent rounded-full w-12 h-12"></div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">Memuat Kontrak...</p>
          </div>
        }
      >
        <PublicContract contractId={contractId} />
      </Suspense>
    );
  }

  if (route.startsWith("#/checklist-portal/") || route.startsWith("#/project/")) {
    const raw = route.startsWith("#/checklist-portal/")
      ? route.split("/checklist-portal/")[1] || ""
      : route.split("/project/")[1] || "";
    const projectId = decodeURIComponent((raw.split(/[?#]/)[0] || "").split("/")[0] || "").trim();
    return (
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20 min-h-screen">
            <div className="relative flex justify-center items-center">
              <div className="absolute border-4 border-brand-accent/20 rounded-full w-12 h-12"></div>
              <div className="animate-spin border-4 border-transparent border-t-brand-accent rounded-full w-12 h-12"></div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">Memuat Checklist...</p>
          </div>
        }
      >
        <ChecklistPortal projectId={projectId} />
      </Suspense>
    );
  }

  if (route.startsWith("#/portal/invoice/") || route.startsWith("#/invoice/")) {
    const raw = route.startsWith("#/portal/invoice/")
      ? route.split("/portal/invoice/")[1] || ""
      : route.split("/invoice/")[1] || "";
    const projectId = decodeURIComponent((raw.split(/[?#]/)[0] || "").split("/")[0] || "").trim();
    return (
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20 min-h-screen">
            <div className="relative flex justify-center items-center">
              <div className="absolute border-4 border-brand-accent/20 rounded-full w-12 h-12"></div>
              <div className="animate-spin border-4 border-transparent border-t-brand-accent rounded-full w-12 h-12"></div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">Memuat Invoice...</p>
          </div>
        }
      >
        <PublicInvoice projectId={projectId} />
      </Suspense>
    );
  }

  if (route.startsWith("#/portal/receipt/") || route.startsWith("#/receipt/")) {
    const raw = route.startsWith("#/portal/receipt/")
      ? route.split("/portal/receipt/")[1] || ""
      : route.split("/receipt/")[1] || "";
    const transactionId = decodeURIComponent((raw.split(/[?#]/)[0] || "").split("/")[0] || "").trim();
    return (
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20 min-h-screen">
            <div className="relative flex justify-center items-center">
              <div className="absolute border-4 border-brand-accent/20 rounded-full w-12 h-12"></div>
              <div className="animate-spin border-4 border-transparent border-t-brand-accent rounded-full w-12 h-12"></div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">Memuat Kuitansi...</p>
          </div>
        }
      >
        <PublicReceipt transactionId={transactionId} />
      </Suspense>
    );
  }

  if (route.startsWith("#/portal/")) {
    const raw = route.split("/portal/")[1] || "";
    const accessId = decodeURIComponent((raw.split(/[?#]/)[0] || "").split("/")[0] || "").trim();
    return (
      <ClientPortal
        accessId={accessId}
        clients={clients}
        projects={projects}
        setClientFeedback={setClientFeedback}
        showNotification={showNotification}
        transactions={transactions}
        userProfile={profile}
        packages={packages}
        teamMembers={teamMembers}
        onClientSubStatusConfirmation={async (pId, sub, note) => {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === pId
                ? {
                    ...p,
                    confirmedSubStatuses: [...(p.confirmedSubStatuses || []), sub],
                    clientSubStatusNotes: {
                      ...(p.clientSubStatusNotes || {}),
                      [sub]: note,
                    },
                  }
                : p,
            ),
          );
          try {
            await markSubStatusConfirmed(pId, sub, note);
          } catch (e) {
            console.warn("[Portal] Failed to persist sub-status confirmation:", e);
          }
        }}
      />
    );
  }

  if (route.startsWith("#/freelancer-portal/")) {
    const raw = route.split("/freelancer-portal/")[1] || "";
    const accessId = decodeURIComponent((raw.split(/[?#]/)[0] || "").split("/")[0] || "").trim();
    return (
      <FreelancerPortal
        accessId={accessId}
        teamMembers={teamMembers}
        projects={projects}
        teamProjectPayments={teamProjectPayments}
        teamPaymentRecords={teamPaymentRecords}
        showNotification={showNotification}
        userProfile={profile}
        addNotification={addNotification}
      />
    );
  }

  return null;
};

export default PublicRoutes;
