import CampaignRepository, {
  CampaignFilter,
} from "../model/campaign.repository";
import { Campaign, CampaignStatus } from "../model/campaign.model";
import { AppError } from "../../../utils/AppError";

export interface CampaignInput {
  name: string;
  type?: string;
  status?: CampaignStatus;
  description?: string | null;
  tags?: string[] | null;
  trigger?: string | null;
  trigger_config?: Record<string, unknown> | null;
  segment?: string | null;
  target_group?: Record<string, unknown> | null;
  start_date?: Date | string | null;
  end_date?: Date | string | null;
}

export const createCampaignService = async (
  input: CampaignInput,
  createdBy?: string
) => {
  const campaign = await CampaignRepository.create({
    ...input,
    created_by: createdBy ?? null,
  } as Partial<Campaign["_creationAttributes"]>);

  // Analytics are now produced by REAL deliveries when the campaign is sent
  // (see campaign-delivery.service `executeCampaignService`), so a freshly
  // created campaign starts with zero metrics — no fabricated events.
  return campaign;
};

export const paginateCampaignsService = async (
  page: number,
  limit: number,
  filter: CampaignFilter
) => {
  return CampaignRepository.paginateCampaigns(page, limit, filter);
};

export const getCampaignService = async (id: string) => {
  const campaign = await CampaignRepository.findByPk(id);
  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }
  return campaign;
};

export const updateCampaignService = async (
  id: string,
  data: Partial<CampaignInput>
) => {
  const updated = await CampaignRepository.updateByPk(
    id,
    data as Partial<Campaign["_creationAttributes"]>
  );
  if (!updated) {
    throw new AppError("Campaign not found", 404);
  }
  return updated;
};

export const archiveCampaignService = async (id: string) => {
  const updated = await CampaignRepository.updateByPk(id, {
    is_archived: true,
    status: "ARCHIVED",
  });
  if (!updated) {
    throw new AppError("Campaign not found", 404);
  }
  return updated;
};

export const restoreCampaignService = async (id: string) => {
  const updated = await CampaignRepository.updateByPk(id, {
    is_archived: false,
    status: "IN_DESIGN",
  });
  if (!updated) {
    throw new AppError("Campaign not found", 404);
  }
  return updated;
};

export const deleteCampaignService = async (id: string) => {
  const deleted = await CampaignRepository.deleteByPk(id);
  if (!deleted) {
    throw new AppError("Campaign not found", 404);
  }
  return null;
};
