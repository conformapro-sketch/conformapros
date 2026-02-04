export interface AuditLog {
  id: string;
  action_type: string;
  target_user_id: string;
  performed_by: string;
  client_id: string | null;
  site_id: string | null;
  before_state: any;
  after_state: any;
  changes: any;
  created_at: string;
  performer_email?: string;
  target_email?: string;
  client_name?: string;
  site_name?: string;
}
