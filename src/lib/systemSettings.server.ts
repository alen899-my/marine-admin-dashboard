import { dbConnect } from "@/lib/db";
import SystemSetting from "@/models/SystemSetting";
import { Settings } from "@/lib/payrollVerificationAccess";
import { getCompanyCurrencySettings } from "@/lib/services/companyService";
import mongoose from "mongoose";

const GLOBAL_SETTINGS_KEY = "global";

export interface GetSettingsParams {
  companyId?: string;
}

export async function getSettings(params?: GetSettingsParams): Promise<Settings> {
  await dbConnect();

  const query: Record<string, unknown> = { key: GLOBAL_SETTINGS_KEY };

  // If companyId is provided, look for company-specific settings
  if (params?.companyId) {
    query.companyId = new mongoose.Types.ObjectId(params.companyId);
  } else {
    // Default global settings (no companyId)
    query.companyId = null;
  }

  const settings = await SystemSetting.findOne(query)
    .select("payrollCaptainVerifyOnly showOnGlobalCareersPage publicCareersPageEnabled companyCareersPageEnabled currencyPosition currencyFormatType currencySpace")
    .lean();

  // Get currency info from company settings
  const companyCurrency = params?.companyId
    ? await getCompanyCurrencySettings(params.companyId)
    : { currencySymbol: "$", currencyCode: "USD" };

  return {
    captainOnlyVerification: Boolean(settings?.payrollCaptainVerifyOnly),
    showOnGlobalCareersPage: settings?.showOnGlobalCareersPage ?? true,
    publicCareersPageEnabled: settings?.publicCareersPageEnabled ?? true,
    companyCareersPageEnabled: settings?.companyCareersPageEnabled ?? true,
    currencySymbol: companyCurrency.currencySymbol,
    currencyCode: companyCurrency.currencyCode,
    currencyPosition: settings?.currencyPosition || "left",
    currencyFormatType: (settings?.currencyFormatType as "symbol" | "code") || "symbol",
    currencySpace: settings?.currencySpace ?? true,
  };
}

export interface UpdateSettingsParams {
  companyId?: string;
  captainOnlyVerification?: boolean;
  showOnGlobalCareersPage?: boolean;
  publicCareersPageEnabled?: boolean;
  companyCareersPageEnabled?: boolean;
  currencyPosition?: "left" | "right";
  currencyFormatType?: "symbol" | "code";
  currencySpace?: boolean;
}

export async function updateSettings(
  input: UpdateSettingsParams,
) {
  await dbConnect();

  const query: Record<string, unknown> = { key: GLOBAL_SETTINGS_KEY };

  // If companyId is provided, look for company-specific settings
  if (input.companyId) {
    query.companyId = new mongoose.Types.ObjectId(input.companyId);
  } else {
    // Default global settings (no companyId)
    query.companyId = null;
  }

  // Build update object - only include fields that are explicitly provided (not undefined)
  const updateData: Record<string, unknown> = {};

  // Only add to updateData if the value is explicitly provided (not undefined)
  if (input.captainOnlyVerification !== undefined) {
    updateData.payrollCaptainVerifyOnly = Boolean(input.captainOnlyVerification);
  }

  if (input.showOnGlobalCareersPage !== undefined) {
    updateData.showOnGlobalCareersPage = Boolean(input.showOnGlobalCareersPage);
  }

  if (input.publicCareersPageEnabled !== undefined) {
    updateData.publicCareersPageEnabled = Boolean(input.publicCareersPageEnabled);
  }

  if (input.companyCareersPageEnabled !== undefined) {
    updateData.companyCareersPageEnabled = Boolean(input.companyCareersPageEnabled);
  }

  if (input.currencyPosition !== undefined) {
    updateData.currencyPosition = input.currencyPosition;
  }

  if (input.currencyFormatType !== undefined) {
    updateData.currencyFormatType = input.currencyFormatType;
  }

  if (input.currencySpace !== undefined) {
    updateData.currencySpace = input.currencySpace;
  }

  // If no fields to update, just return current settings
  if (Object.keys(updateData).length === 0) {
    const existingSettings = await SystemSetting.findOne(query)
      .select("payrollCaptainVerifyOnly showOnGlobalCareersPage publicCareersPageEnabled companyCareersPageEnabled currencyPosition currencyFormatType currencySpace")
      .lean();

    // Get currency info from company settings
    const companyCurrency = input.companyId
      ? await getCompanyCurrencySettings(input.companyId)
      : { currencySymbol: "$", currencyCode: "USD" };

    return {
      captainOnlyVerification: Boolean(existingSettings?.payrollCaptainVerifyOnly),
      showOnGlobalCareersPage: existingSettings?.showOnGlobalCareersPage ?? true,
      publicCareersPageEnabled: existingSettings?.publicCareersPageEnabled ?? true,
      companyCareersPageEnabled: existingSettings?.companyCareersPageEnabled ?? true,
      currencySymbol: companyCurrency.currencySymbol,
      currencyCode: companyCurrency.currencyCode,
      currencyPosition: (existingSettings?.currencyPosition as "left" | "right") || "left",
      currencyFormatType: (existingSettings?.currencyFormatType as "symbol" | "code") || "symbol",
      currencySpace: existingSettings?.currencySpace ?? true,
    };
  }

  const settings = await SystemSetting.findOneAndUpdate(
    query,
    { $set: updateData },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  )
    .select("payrollCaptainVerifyOnly showOnGlobalCareersPage publicCareersPageEnabled companyCareersPageEnabled currencyPosition currencyFormatType currencySpace")
    .lean();

  // Get currency info from company settings
  const companyCurrency = input.companyId
    ? await getCompanyCurrencySettings(input.companyId)
    : { currencySymbol: "$", currencyCode: "USD" };

  return {
    captainOnlyVerification: Boolean(settings?.payrollCaptainVerifyOnly),
    showOnGlobalCareersPage: settings?.showOnGlobalCareersPage ?? true,
    publicCareersPageEnabled: settings?.publicCareersPageEnabled ?? true,
    companyCareersPageEnabled: settings?.companyCareersPageEnabled ?? true,
    currencySymbol: companyCurrency.currencySymbol,
    currencyCode: companyCurrency.currencyCode,
    currencyPosition: (settings?.currencyPosition as "left" | "right") || "left",
    currencyFormatType: (settings?.currencyFormatType as "symbol" | "code") || "symbol",
    currencySpace: settings?.currencySpace ?? true,
  };
}
