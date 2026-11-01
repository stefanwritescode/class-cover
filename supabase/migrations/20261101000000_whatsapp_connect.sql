-- "Connect WhatsApp": a teacher sends a personal code to the studio's WhatsApp number, and ManyChat
-- tells the app who they are. Works for contacts that already exist in ManyChat, which the API can't
-- look up by WhatsApp number.
alter table profile_contacts
  add column whatsapp_link_code text unique default encode(extensions.gen_random_bytes(5), 'hex'),
  add column whatsapp_connected_at timestamptz;

update profile_contacts set whatsapp_connected_at = now() where manychat_subscriber_id is not null;
