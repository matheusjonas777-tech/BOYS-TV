export interface BackupLog {
  id: string;
  timestamp: string;
  message: string;
  status: 'success' | 'warning' | 'error';
}

export type UserRole = 'admin' | 'user' | 'superadmin';

export interface WatchHistoryItem {
  seriesId: number;
  episodeIndex: number;
  timestamp: number;
  progressSeconds?: number;
  durationSeconds?: number;
}

export type AppUser = {
  uid?: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  avatar: string;
  isBanned?: boolean;
  favorites?: number[]; // series IDs
  watchHistory?: WatchHistoryItem[];
  lastSeen?: number;
  joinedAt?: number;
  securityCode?: string;
  profileCover?: string;
};

export interface Episode {
  title: string;
  url: string;
  subtitles?: string;
  thumbnail?: string;
  avgRating?: number;
  ratingsCount?: number;
  season?: number;
}

export interface Series {
  id: number | string;
  title: string;
  cat: 'Destaque' | 'Série' | 'Filme';
  genres?: string[];
  year?: number;
  poster: string;
  banner: string;
  desc: string;
  episodes: Episode[];
  avgRating?: number;
  ratingsCount?: number;
  ageRating?: string;
  format?: string;
  isExclusive?: boolean;
  isPrivate?: boolean;
  visibleToPublic?: boolean;
  shareImageUrl?: string;
  hasNewEpisode?: boolean;
  novoEpisodio?: boolean;
}

export interface Rating {
  userId: string;
  itemId: string; // "series_{id}" or "episode_{seriesId}_{title}"
  value: number;
}

export interface SiteContent {
  brandColor: string;
  heroSlogan: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: number;
}

export interface DB {
  users: AppUser[];
  series: Series[];
  siteContent: SiteContent;
  ratings: Rating[];
  backupLogs?: BackupLog[];
}

export interface Ad {
  id: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  position: 'hero' | 'sidebar' | 'details' | 'player' | 'video_preroll';
  title?: string;
  description?: string;
  interactive?: boolean;
  interactiveType?: 'scratch' | 'wheel' | 'choices';
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

export interface MediaServer {
  id: string;
  name: string;
  url: string;
  authType?: 'none' | 'simple' | 'token';
  credentials?: string;
  group?: string; // e.g. "Família Giani"
  status?: 'online' | 'offline' | 'checking';
  latency?: number;
  lastCheck?: number;
}

export interface SiteSettings {
  themeColor: string;
  siteName: string;
  activeFeaturedSeriesId?: number | null;
  heroBanner?: string;
  heroLogo?: string;
  heroSlogan?: string;
  globalAccessCode?: string;
  isPrivate?: boolean;
  availableAvatars?: string[];
  ads?: Ad[];
  themeMode?: 'dark' | 'light' | 'amoled' | 'custom';
  bgColor?: string;
  textColor?: string;
  surfaceColor?: string;
  fontSans?: string;
  fontDisplay?: string;
  maintenanceMode?: boolean;
  maintenanceBypassCode?: string;
  serverRegion?: string;
  lastDeployment?: number;
  socialLinks?: SocialLinks;
  mediaServers?: MediaServer[];
  maxConcurrentUsers?: number;
  isQueueEnabled?: boolean;
  emergencyBypassKey?: string;
  currentSimulatedLoad?: number;
  backupWebhookUrl?: string;
  emailGreeting?: string;
  emailReleaseMsg?: string;
  emailClosing?: string;
  emailTitleTemplate?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpFromName?: string;
  smtpFromEmail?: string;
  databaseReplicas?: {
    id: string;
    provider: string; // e.g. 'google-cloud-firestore' | 'google-cloud-spanner' | 'google-cloud-sql'
    region: string; // e.g. 'us-east1'
    syncMode: 'realtime' | 'ondemand' | 'periodic';
    allocatedStorage: string; // e.g. '100 GB' or 'Unlimited'
    status: 'online' | 'offline' | 'syncing';
    latency: number;
    lastSyncedAt: number;
  }[];
  googleDriveFolderId?: string;
  googleDriveFolderName?: string;
  pixKey?: string;
  pixName?: string;
  showPixOnPlayer?: boolean;
  lockForGuests?: boolean;
  vipCoreActive?: boolean;
  popunderScript?: string;
  isPopunderActive?: boolean;
  adsenseCode?: string;
  isAdsenseActive?: boolean;
  customDomain?: string;
  domainVerified?: boolean;
  domainDnsTxt?: string;
  domainProvider?: string;
  domainSslStatus?: 'ativo' | 'gerando' | 'erro-dns' | 'pendente';
  driveSyncLastCheck?: number;
  driveSyncStatus?: 'online' | 'offline' | 'checking';
  driveSyncDetails?: string;
  domainPingStatus?: 'online' | 'pending' | 'checking';
  domainPingLastChecked?: number;
  domainPingLatency?: number;
  domainPingMessage?: string;
  domainDnsStatusA?: 'correto' | 'pendente' | 'erro';
  domainDnsStatusCname?: 'correto' | 'pendente' | 'erro';
  heroTitleSize?: 'default' | 'large' | 'giant';
  heroBannerOpacity?: number;
  stealthShieldActive?: boolean;
  adminPrivacyProxyActive?: boolean;
  intrusionAlertCount?: number;
  customPages?: { id: string; title: string; slug: string; content: string; active: boolean }[];
  customLinks?: { label: string; url: string; openInNewTab: boolean }[];
  customDnsPointers?: {
    id: string;
    domain: string;
    userEmail: string;
    cnameTarget: string;
    status: 'ativo' | 'pendente' | 'erro';
    sslStatus: 'ativo' | 'pendente' | 'erro';
    lastChecked: number;
  }[];
  whatsappCentralLink?: string;
  shareBaseUrl?: string;
  sharingMessageTemplate?: string;
  shareImageUrl?: string;
  privateVpnActive?: boolean;
  privateVpnServerIp?: string;
  privateVpnStatus?: 'connected' | 'disconnected' | 'connecting';
  privateStoragePath?: string;
  privateStorageActive?: boolean;
  privateStorageCapacity?: string;
  privateStorageAllocated?: string;
  secretAdminNote?: string;
  wordOverrides?: Record<string, string>;
  isGlobalTelemetryEnabled?: boolean;
  disabledSections?: string[];
}

export interface RecoveryRequest {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  resetCode?: string;
}

export interface ActiveSession {
  id?: string;
  visitorId: string;
  email: string;
  watchingTitle: string;
  deviceBrand: string;
  locale: string;
  sharedFrom?: string;
  lastActive: number;
}
