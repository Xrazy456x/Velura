import {
  Building2,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Droplets,
  Home as HomeIcon,
  LineChart,
  MailCheck,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";

export const site = {
  name: "Velura",
  tagline: "Luxury cleaning, gently delivered.",
  contactEmail: "bookings@veluraservices.com",
  logo: "/velura-logo.png",
  mark: "/velura-mark.png",
  heroImage:
    "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1800&q=85",
  stats: [
    { label: "Quality checks", value: "42" },
    { label: "Arrival window", value: "30m" },
    { label: "Repeat clients", value: "91%" }
  ],
  nav: [
    { label: "Home", href: "/portal" },
    { label: "About", href: "/portal/about" },
    { label: "Services", href: "/portal/services" },
    { label: "Quote", href: "/portal/quote" },
    { label: "Contact", href: "/portal/contact" }
  ],
  services: [
    {
      title: "Signature Home Cleaning",
      description: "Calm, detailed weekly or fortnightly cleans for homes that should feel beautifully reset.",
      icon: HomeIcon
    },
    {
      title: "Deep Refresh",
      description: "A careful top-to-bottom clean for kitchens, bathrooms, bedrooms, skirting, glass, and touchpoints.",
      icon: Sparkles
    },
    {
      title: "End of Tenancy",
      description: "Move-in and move-out cleaning with a checklist-led finish for landlords, tenants, and agents.",
      icon: ClipboardList
    },
    {
      title: "Office & Studio Care",
      description: "Discreet commercial cleaning for workspaces that need to look composed every morning.",
      icon: Building2
    },
    {
      title: "Commercial Premises Cleaning",
      description: "Reliable washroom, shared-area, touchpoint, internal glass, waste reset, and floor-care support for commercial spaces.",
      icon: BriefcaseBusiness
    }
  ],
  values: [
    {
      title: "Luxury without harshness",
      description: "Premium products, gentle handling, and thoughtful routines for delicate finishes.",
      icon: Droplets
    },
    {
      title: "Trusted, insured teams",
      description: "Reliable scheduling, respectful access handling, and consistent care from a small trusted team.",
      icon: ShieldCheck
    },
    {
      title: "Details checked twice",
      description: "Every inquiry, visit, message, and review has a clear place in the Velura dashboard.",
      icon: CheckCircle2
    }
  ],
  process: [
    { title: "Request", description: "Clients send an inquiry with property details and preferred service.", icon: MailCheck },
    { title: "Prepare", description: "Admins qualify the inquiry and confirm scope, access, and timing.", icon: Clock3 },
    { title: "Care", description: "The clean follows a repeatable checklist with room-by-room attention.", icon: Sparkles },
    { title: "Follow up", description: "Email replies, status updates, and Google reviews keep quality visible.", icon: LineChart }
  ],
  plans: [
    {
      title: "Essential Shine",
      price: "From £65",
      details: "A refined maintenance clean for apartments, townhouses, and busy households.",
      features: ["Kitchen and bathrooms", "Dusting and floors", "Fresh touchpoints"]
    },
    {
      title: "Signature Velura",
      price: "From £120",
      details: "A deeper luxury clean with extra time for details, glass, trims, and finishing touches.",
      features: ["Room-by-room checklist", "Inside key surfaces", "Quality review"]
    },
    {
      title: "Move-In / Move-Out",
      price: "Custom",
      details: "A thorough property reset for tenancies, listings, short stays, and handovers.",
      features: ["Appliance attention", "Deposit-friendly checklist", "Flexible scheduling"]
    }
  ],
  industries: [
    { name: "Private homes", icon: HomeIcon },
    { name: "Apartments", icon: Building2 },
    { name: "Offices", icon: BriefcaseBusiness },
    { name: "Short stays", icon: UsersRound }
  ]
};
