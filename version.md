# Version History

## 2.1.9
### Features
- **Advanced Dashboard System**: 
    - Implemented modular sections (4-9) for a comprehensive maritime admin overview.
    - Integrated permission-based widget visibility and control.
    - Added seamless grid layout with responsive widget packing.
    - Implemented server-side layout persistence (LocalStorage to Database).
- **Styling**: 
    - Standardized visual aesthetics, color palettes, and interactive hover states across all widgets.
    - Fixed chart type errors and legend styling in `PayrollStatusChart`.

## 2.1.8
### Features
- **Crew Architecture Migration**: 
    - Standardized crew statuses, currency handling, and modernized core UI.
    - Overhauled crew management tables with improved filtering and actions.
- **Sidebar & Notifications**: 
    - Integrated `SidebarItemBadge` for real-time notifications.
    - Enhanced sidebar navigation for better accessibility.
- **Career Portal**: 
    - Redesigned career page and job listing card aesthetics for better candidate engagement.

## 2.1.7
### Features
- **Payroll Management System**: 
    - Implemented Salary/Payroll modules with bulk inline editing capabilities.
    - Integrated server-side PDF payslip generation with professional ink seals.
    - Added support for percentage-based allowances and deductions.
    - Implemented batch verification and approval workflows.
- **Leave Management**: 
    - Added Leave Type management module and individual crew leave limit overrides.

## 2.1.6
### Features
- **Contracts & SEA Generation**: 
    - Full implementation of contract generation with dynamic wage allowances.
    - Added multi-company isolation (scoping) for salary heads.
    - Integrated smart table rendering for SEA (Seafarer Employment Agreement) generation.
- **Onboarding System**: 
    - Implemented candidate transition workflow from recruitment to active crew.
    - Standardized modal UIs for checklist management and onboard confirmation.



## 2.1.5
### Features
- **Database Backup Management**: 
    - Full support for `mongodump` and `mongorestore` operations.
    - Integrated `adm-zip` and `archiver` for secure backup compression.
    - Added `BackupCard` component to System Settings for easy management.
    - Increased Server Actions body size limit to 500MB to handle large database backups.

## 2.1.4
### Features
- **User Impersonation System**: 
    - Updated NextAuth configuration to support impersonation states in JWT and Session callbacks.
    - Extended NextAuth type definitions for impersonation metadata.
    - Added "Switch to User" action for Super Admins in the Users table.
    - Integrated `ImpersonationBanner` across AppHeader and PublicHeader.

## 2.1.3
### Fixes
- **IP Address Display**: Normalized IPv4-mapped IPv6 addresses by removing the `::ffff:` prefix for better readability in Active Sessions.

## 2.1.2
### Features
- **User Filtering**: Added role-based filtering to the `UserFilter` component.

## 2.1.1
### Features
- **Active Session Tracking & Management**: 
    - Integrated `UserSession` creation into the sign-in flow (captures IP and User-Agent).
    - Session validation against the database using bound session IDs in auth tokens.
    - Automatic `lastSeenAt` updates during user operations.
    - New `signout-cleanup` API to drop sessions on manual logout.
    - Added "Active Sessions" navigation to the AppSidebar.

## 2.1.0
### Features
- **User Guide**: Integrated a comprehensive User Guide page to assist administrators with platform navigation and system operations.

## 2.0.9
### Features
- **Authentication Security**: 
    - Implemented automatic session invalidation across all devices upon password change.
    - Added session token synchronization during password updates to maintain seamless access for the current session.

## 2.0.8
### Features
- **Job & Career Portal**: 
    - Launched the recruitment module with dynamic job postings and rich text application forms.
    - Implemented auto-filling application logic for returning candidates.
    - Integrated multi-company scoping for job listings.

## 2.0.0
### Features
- **System Core (Version 2)**: 
    - Standardized all reporting modules (Noon, Arrival, Departure) with IST timezone support.
    - Migrated to Node 20 and implemented secure file upload handling via `trustHost`.
    - Finalized core database schema and common API routes.

## 1.0.0
### Features
- **Design Completion**: 
    - Finalized the initial UI/UX design across all core administrative modules.
    - Launched Dashboard v1 with dynamic count displays for reports and documents.

## 0.5.0
### Features
- **Common Components**: 
    - Established the reusable UI architecture, including the Common Table and Filter components.
    - Implemented early report templates for Arrival and Daily Noon tracking.

## 0.1.0
### Features
- **Genesis**: 
    - Project initialization and base application structure.
    - Initial sidebar navigation and layout implementation.


