# KitchenEye Project Reorganization Guide

## Overview
The KitchenEye project has been reorganized into frontend and backend folders for better code organization.

## New Structure

```
/frontend/          - All React frontend code
  /App.tsx          - Main React application entry
  /components/      - React components
  /styles/          - Global CSS styles
  
/backend/           - Backend code (to be implemented)
  /README.md        - Backend documentation

/MIGRATION_GUIDE.md - This file
```

## Migration Status

### ✅ Completed
- Created `/frontend` and `/backend` directories
- Moved `App.tsx` to `/frontend/App.tsx`
- Moved `styles/globals.css` to `/frontend/styles/globals.css`
- Created backend README

### 🔄 In Progress
All component files need to be copied from `/components/` to `/frontend/components/`

The following files need to be migrated:
1. Components (main):
   - Analytics.tsx
   - Dashboard.tsx
   - DashboardLayout.tsx
   - LandingPage.tsx
   - LiveCameraFeed.tsx
   - LoginPage.tsx
   - NotificationSettings.tsx
   - Reports.tsx
   - SignupPage.tsx
   - Subscription.tsx
   - UserManagement.tsx
   - ViolationHistory.tsx

2. Components (figma):
   - figma/ImageWithFallback.tsx

3. Components (ui - all shadcn components):
   - All files in `/components/ui/`

## Next Steps

1. Copy all remaining component files to `/frontend/components/`
2. Update import paths in entrypoint configuration
3. Test the application to ensure all imports work correctly
4. Delete old files from root once migration is verified
5. Begin backend implementation

## Notes

- The entrypoint (`App.tsx`) has been moved to `/frontend/App.tsx`
- Update your build configuration to point to `/frontend/App.tsx` as the main entry
- All component imports are relative and should continue to work
- The protected file `/components/figma/ImageWithFallback.tsx` must be copied (not modified)
