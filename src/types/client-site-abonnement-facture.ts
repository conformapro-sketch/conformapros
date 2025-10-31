import { Database } from "@/integrations/supabase/types";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

export interface ClientWithSites extends ClientRow {
  sites?: SiteRow[];
}

export interface SiteWithClient extends SiteRow {
  client?: ClientRow;
}

export interface SubscriptionWithClientSite extends SubscriptionRow {
  client?: ClientRow;
  site?: SiteRow;
}

export interface InvoiceWithRelations extends InvoiceRow {
  client?: ClientRow;
  site?: SiteRow;
  subscription?: SubscriptionRow;
}
