import { BaseRepository } from "../../../core/models/base.repository";
import EmailSmtp from "./email-smtp.model";

class EmailSmtpRepository extends BaseRepository<EmailSmtp> {
  constructor() {
    super(EmailSmtp);
  }

  async findAllOrdered() {
    return this.model.findAll({ order: [["created_at", "DESC"]] });
  }

  async findByType(type: string) {
    return this.model.findOne({ where: { type } });
  }
}

export default new EmailSmtpRepository();
