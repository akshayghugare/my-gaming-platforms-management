import { Op, WhereOptions } from "sequelize";
import { BaseRepository } from "../../../core/models/base.repository";
import WidgetConfiguration, {
  WidgetConfigStatus,
} from "./widget-configuration.model";

class WidgetConfigurationRepository extends BaseRepository<WidgetConfiguration> {
  constructor() {
    super(WidgetConfiguration);
  }

  /** All widgets configured for a given client + widget type. */
  async findByClientAndType(client_id: string, type: string) {
    return this.findWhere(
      { client_id, type },
      { order: [["created_at", "DESC"]] }
    );
  }

  async paginateWidgets(params: {
    page: number;
    limit: number;
    search?: string;
    status?: WidgetConfigStatus;
    type?: string;
    client_id?: string;
  }) {
    const { page, limit, search, status, type, client_id } = params;

    const where: WhereOptions = {};
    if (status) (where as Record<string, unknown>).status = status;
    if (type) (where as Record<string, unknown>).type = type;
    if (client_id) (where as Record<string, unknown>).client_id = client_id;
    if (search && search.trim()) {
      (where as Record<string, unknown>).name = { [Op.iLike]: `%${search.trim()}%` };
    }

    return this.paginate(page, limit, where);
  }
}

export default new WidgetConfigurationRepository();
