/**
 * Legacy social API - maintained for backward compatibility
 * New code should use @/api/services/socialService.js
 */
import * as socialService from "../api/services/socialService.js";

// Re-export all social service functions for backward compatibility
export const getSocialAccounts = socialService.getSocialAccounts;
export const getSocialAnalytics = socialService.getSocialAnalytics;
export const disconnectAccount = socialService.disconnectAccount;
export const getXAuthUrl = socialService.getXAuthUrl;
export const getYoutubeAuthUrl = socialService.getYoutubeAuthUrl;
export const getLinkedInAuthUrl = socialService.getLinkedInAuthUrl;
export const getPinterestAuthUrl = socialService.getPinterestAuthUrl;
export const getMetaAuthUrl = socialService.getMetaAuthUrl;
export const getInstagramAuthUrl = socialService.getInstagramAuthUrl;
export const syncSocialPlatform = socialService.syncSocialPlatform;
